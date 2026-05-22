import express from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { createClassroom, getMyClassrooms, joinClassroom, deleteClassroom } from "../controllers/classroomController";
import { askClassroomHandler } from "../controllers/ragController";

const router = express.Router();

// Faculty only: create classroom
router.post("/", requireAuth, requireRole("faculty"), createClassroom);

// All authenticated: get their classrooms (role-aware inside controller)
router.get("/my", requireAuth, getMyClassrooms);

// Student only: join classroom via code
router.post("/join", requireAuth, requireRole("student"), joinClassroom);

// Faculty only: delete classroom
router.delete("/:id", requireAuth, requireRole("faculty"), deleteClassroom);

// All authenticated: ask semantic questions across all lectures in classroom
router.post("/:classroom_id/ask", requireAuth, askClassroomHandler);

export default router;

