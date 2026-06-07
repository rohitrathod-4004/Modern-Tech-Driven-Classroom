import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '@classroom/shared';

/**
 * Ensures the authenticated user belongs to the target organization.
 * Expects the organization ID to be in req.params.organizationId
 */
export const requireOrganizationMember = (req: Request, res: Response, next: NextFunction) => {
  const targetOrgId = req.params.organizationId || req.params.id;

  if (!req.user || !req.user.organizationId) {
    return next(new AppError('Organization membership required', 403, ErrorCodes.FORBIDDEN));
  }

  if (targetOrgId && req.user.organizationId !== targetOrgId) {
    return next(new AppError('You do not have access to this organization', 403, ErrorCodes.FORBIDDEN));
  }

  next();
};

/**
 * Ensures the authenticated user is an org_admin for the target organization.
 */
export const requireOrganizationAdmin = (req: Request, res: Response, next: NextFunction) => {
  const targetOrgId = req.params.organizationId || req.params.id;

  if (!req.user || req.user.role !== 'org_admin' || !req.user.organizationId) {
    return next(new AppError('Organization admin privileges required', 403, ErrorCodes.FORBIDDEN));
  }

  if (targetOrgId && req.user.organizationId !== targetOrgId) {
    return next(new AppError('You are not an admin of this organization', 403, ErrorCodes.FORBIDDEN));
  }

  next();
};
