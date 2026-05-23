import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Organization } from '../../models/Organization';
import { OrganizationInvite } from '../../models/OrganizationInvite';
import { User } from '../../models/User';
import { WalletService } from '../wallet/wallet.service';
import { CreditWallet } from '../../models/CreditWallet';
import { CreditUsage } from '../../models/CreditUsage';
import { AppError } from '../../utils/AppError';
import { ErrorCodes, UserRole } from '@classroom/shared';
import { withTransactionFallback } from '../../utils/transaction';

// Utility to create a URL-safe slug
const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export const createOrganization = async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = req.user?.id;

  if (!name) throw new AppError('Organization name is required', 400);

  const slug = generateSlug(name);
  const existingOrg = await Organization.findOne({ slug }).lean();
  if (existingOrg) throw new AppError('Organization name is already taken. Please choose another.', 409);

  let newOrg;
  
  await withTransactionFallback(async (session) => {
    // 1. Create a placeholder org id
    const orgId = new mongoose.Types.ObjectId();

    // 2. Create the Organization Wallet via WalletService (100 demo credits)
    const wallet = await WalletService.createWallet('organization', orgId.toString(), 100);

    // 3. Create the Organization
    newOrg = new Organization({
      _id: orgId,
      name,
      slug,
      walletId: wallet._id,
      createdBy: userId,
      admins: [userId],
      teachers: []
    });
    await newOrg.save({ session });

    // 4. Update the user to become an org_admin
    await User.findByIdAndUpdate(userId, {
      role: 'org_admin',
      accountType: 'organization_member',
      organizationId: newOrg._id
    }, { session });
  });

  res.status(201).json({ success: true, data: newOrg });
};

export const getOrganizationDashboard = async (req: Request, res: Response) => {
  const orgId = req.params.organizationId || req.user?.organizationId;

  const org = await Organization.findById(orgId)
    .populate('admins', 'name email')
    .populate('teachers', 'name email')
    .lean();

  if (!org) throw new AppError('Organization not found', 404);

  const wallet = await CreditWallet.findById(org.walletId).lean();
  
  // Aggregate recent usage
  const recentUsage = await CreditUsage.find({ organizationId: orgId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('teacherId', 'name email')
    .lean();

  res.json({
    success: true,
    data: {
      organization: org,
      wallet: wallet,
      recentUsage
    }
  });
};

export const createInvite = async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const orgId = req.params.organizationId || req.user?.organizationId;
  const invitedBy = req.user?.id;

  if (!email || !role) throw new AppError('Email and role are required', 400);

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const invite = new OrganizationInvite({
    email,
    role,
    token,
    expiresAt,
    organizationId: orgId,
    invitedBy
  });

  await invite.save();

  // In a real application, send an email here.
  // We'll return the token for testing.
  res.status(201).json({ success: true, data: { token, email, expiresAt } });
};

export const acceptInvite = async (req: Request, res: Response) => {
  const { token } = req.body;
  const userId = req.user?.id;

  if (!token) throw new AppError('Invitation token is required', 400);

  await withTransactionFallback(async (session) => {
    const invite = await OrganizationInvite.findOne({ token }).session(session || null);
    
    if (!invite) throw new AppError('Invalid or expired invitation', 400);
    if (invite.acceptedAt) throw new AppError('Invitation already accepted', 400);
    if (new Date() > invite.expiresAt) throw new AppError('Invitation has expired', 400);

    const user = await User.findById(userId).session(session || null);
    if (!user) throw new AppError('User not found', 404);

    if (user.email !== invite.email) {
      throw new AppError('Please login with the email address that was invited', 403);
    }

    // Mark invite accepted
    invite.acceptedAt = new Date();
    await invite.save({ session });

    // Add user to organization
    const updateField = invite.role === 'org_admin' ? 'admins' : 'teachers';
    await Organization.findByIdAndUpdate(invite.organizationId, {
      $addToSet: { [updateField]: user._id }
    }, { session });

    // Update user account type and role
    user.organizationId = invite.organizationId as mongoose.Types.ObjectId;
    user.accountType = 'organization_member';
    if (invite.role === 'org_admin') {
      user.role = 'org_admin';
    } else if (user.role === 'student') {
      user.role = 'teacher';
    }
    await user.save({ session });
  });

  res.json({ success: true, message: 'Successfully joined organization' });
};

export const allocateCredits = async (req: Request, res: Response) => {
  const { teacherId, amount } = req.body;
  const orgId = req.params.organizationId || req.user?.organizationId;
  const adminId = req.user?.id;

  if (!teacherId || !amount || amount <= 0) {
    throw new AppError('Valid teacherId and positive amount are required', 400);
  }

  const org = await Organization.findById(orgId).select('walletId teachers').lean();
  if (!org) throw new AppError('Organization not found', 404);

  // Verify teacher belongs to this org
  if (!org.teachers.map(id => id.toString()).includes(teacherId.toString())) {
    throw new AppError('Teacher does not belong to this organization', 403);
  }

  const teacher = await User.findById(teacherId).select('walletId').lean();
  if (!teacher || !teacher.walletId) throw new AppError('Teacher wallet not found', 404);

  // Execute the transactional transfer
  await WalletService.allocateCredits(
    org.walletId.toString(),
    teacher.walletId.toString(),
    amount,
    adminId as string
  );

  res.json({ success: true, message: 'Credits allocated successfully' });
};
