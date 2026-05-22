import { Request, Response, RequestHandler } from "express";
import * as classroomService from "../services/classroom/classroomService";

export const createClassroom: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { name, organization_id } = req.body;
    if (!name) {
      res.status(400).json({ error: "Classroom name is required" });
      return;
    }

    const classroom = await classroomService.createClassroom(
      name,
      req.user!.userId,
      organization_id
    );
    res.status(201).json(classroom);
  } catch (error) {
    console.error("[ClassroomController] createClassroom:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyClassrooms: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user!;
    let classrooms;

    if (role === "faculty") {
      classrooms = await classroomService.getClassroomsForFaculty(userId);
    } else {
      classrooms = await classroomService.getClassroomsForStudent(userId);
    }

    res.json(classrooms);
  } catch (error) {
    console.error("[ClassroomController] getMyClassrooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const joinClassroom: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "Join code is required" });
      return;
    }

    const classroom = await classroomService.joinClassroomByCode(code, req.user!.userId);
    res.json({ message: "Joined classroom successfully", classroom });
  } catch (error: any) {
    console.error("[ClassroomController] joinClassroom:", error);
    if (error.message === "Classroom not found with that code" || error.message === "You have already joined this classroom") {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteClassroom: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await classroomService.deleteClassroomById(id, req.user!.userId);
    res.json({ message: "Classroom deleted successfully" });
  } catch (error: any) {
    console.error("[ClassroomController] deleteClassroom:", error);
    if (error.message === "Classroom not found or access denied") {
      res.status(403).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

