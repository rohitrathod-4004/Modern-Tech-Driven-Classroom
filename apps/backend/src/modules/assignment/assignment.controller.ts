import { Request, Response } from 'express';
import { AssignmentService } from './assignment.service';

export class AssignmentController {
  static async create(req: Request, res: Response) {
    const { courseId } = req.params;
    const { title, description, dueDate, maxSizeMb } = req.body;
    const teacherId = req.user!.id;

    const assignment = await AssignmentService.createAssignment(
      courseId,
      teacherId,
      title,
      description,
      new Date(dueDate),
      maxSizeMb ? parseInt(maxSizeMb, 10) : 10
    );

    res.status(201).json({ data: assignment });
  }

  static async list(req: Request, res: Response) {
    const { courseId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const data = await AssignmentService.listAssignments(courseId, userId, role);

    res.status(200).json({ data });
  }

  static async delete(req: Request, res: Response) {
    const { assignmentId } = req.params;
    const teacherId = req.user!.id;

    await AssignmentService.deleteAssignment(assignmentId, teacherId);

    res.status(200).json({ message: 'Assignment successfully deleted' });
  }

  static async submit(req: Request, res: Response) {
    const { assignmentId } = req.params;
    const studentId = req.user!.id;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const submission = await AssignmentService.submitAssignment(assignmentId, studentId, req.file);

    res.status(201).json({ data: submission });
  }

  static async getSubmissions(req: Request, res: Response) {
    const { assignmentId } = req.params;
    const teacherId = req.user!.id;

    const data = await AssignmentService.getSubmissions(assignmentId, teacherId);

    res.status(200).json({ data });
  }

  static async getStudentSubmission(req: Request, res: Response) {
    const { assignmentId } = req.params;
    const studentId = req.user!.id;

    const data = await AssignmentService.getStudentSubmission(assignmentId, studentId);

    res.status(200).json({ data });
  }
}
