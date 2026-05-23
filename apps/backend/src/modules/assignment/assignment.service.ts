import { Assignment } from '../../models/Assignment';
import { Submission } from '../../models/Submission';
import { Course } from '../../models/Course';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '@classroom/shared';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

export class AssignmentService {
  static async createAssignment(
    courseId: string,
    teacherId: string,
    title: string,
    description: string,
    dueDate: Date,
    maxSizeMb: number = 10
  ) {
    // Validate course owned by teacher
    const course = await Course.findOne({ _id: courseId, teacherId, deletedAt: null }).lean();
    if (!course) {
      throw new AppError('Course not found or unauthorized', 404, ErrorCodes.NOT_FOUND);
    }

    const assignment = await Assignment.create({
      courseId: new mongoose.Types.ObjectId(courseId),
      teacherId: new mongoose.Types.ObjectId(teacherId),
      title,
      description,
      dueDate,
      maxSizeMb
    });

    return assignment;
  }

  static async listAssignments(courseId: string, userId: string, role: string) {
    // Validate access to course
    const course = await Course.findOne({ _id: courseId, deletedAt: null }).lean();
    if (!course) {
      throw new AppError('Course not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (role === 'teacher') {
      if (course.teacherId.toString() !== userId) {
        throw new AppError('Unauthorized access to course', 403, ErrorCodes.FORBIDDEN);
      }
    } else {
      const isEnrolled = course.students.some(id => id.toString() === userId);
      if (!isEnrolled) {
        throw new AppError('Unauthorized access to course', 403, ErrorCodes.FORBIDDEN);
      }
    }

    const assignments = await Assignment.find({ courseId, deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();

    return assignments;
  }

  static async deleteAssignment(assignmentId: string, teacherId: string) {
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId, deletedAt: null });
    if (!assignment) {
      throw new AppError('Assignment not found or unauthorized', 404, ErrorCodes.NOT_FOUND);
    }

    assignment.deletedAt = new Date();
    await assignment.save();

    return assignment;
  }

  static async submitAssignment(
    assignmentId: string,
    studentId: string,
    file: Express.Multer.File
  ) {
    const assignment = await Assignment.findOne({ _id: assignmentId, deletedAt: null });
    if (!assignment) {
      throw new AppError('Assignment not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Check course enrollment
    const course = await Course.findOne({ _id: assignment.courseId, students: studentId, deletedAt: null }).lean();
    if (!course) {
      throw new AppError('Unauthorized: You are not enrolled in this course', 403, ErrorCodes.FORBIDDEN);
    }

    // Validate size limit dynamically
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > assignment.maxSizeMb) {
      // Delete uploaded file to be clean
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {}
      throw new AppError(`File exceeds maximum size limit of ${assignment.maxSizeMb}MB.`, 400, 'FILE_TOO_LARGE');
    }

    // Move file to a more structured directory
    const assignmentsDir = path.join(__dirname, '../../../uploads/assignments');
    if (!fs.existsSync(assignmentsDir)) {
      fs.mkdirSync(assignmentsDir, { recursive: true });
    }

    const fileExt = path.extname(file.originalname);
    const newFileName = `submission-${assignmentId}-${studentId}-${Date.now()}${fileExt}`;
    const newFilePath = path.join(assignmentsDir, newFileName);

    fs.renameSync(file.path, newFilePath);
    const relativePath = `/uploads/assignments/${newFileName}`;

    // Upsert submission
    const submission = await Submission.findOneAndUpdate(
      { assignmentId: new mongoose.Types.ObjectId(assignmentId), studentId: new mongoose.Types.ObjectId(studentId) },
      {
        assignmentId: new mongoose.Types.ObjectId(assignmentId),
        studentId: new mongoose.Types.ObjectId(studentId),
        filePath: relativePath,
        fileName: file.originalname,
        fileSize: file.size,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return submission;
  }

  static async getSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId, deletedAt: null }).lean();
    if (!assignment) {
      throw new AppError('Assignment not found or unauthorized', 404, ErrorCodes.NOT_FOUND);
    }

    const submissions = await Submission.find({ assignmentId })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    return submissions;
  }

  static async getStudentSubmission(assignmentId: string, studentId: string) {
    const submission = await Submission.findOne({ assignmentId, studentId }).lean();
    return submission || null;
  }
}
