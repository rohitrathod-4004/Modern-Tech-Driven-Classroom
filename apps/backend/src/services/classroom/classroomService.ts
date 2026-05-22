import { Classroom, IClassroom } from "../../models/Classroom";
import mongoose from "mongoose";
import crypto from "crypto";

const generateJoinCode = (): string => {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A1B2C3"
};

export const createClassroom = async (
  name: string,
  facultyId: string,
  organizationId?: string
): Promise<IClassroom> => {
  let code = generateJoinCode();

  // Ensure unique code
  let existing = await Classroom.findOne({ code });
  while (existing) {
    code = generateJoinCode();
    existing = await Classroom.findOne({ code });
  }

  const classroom = await Classroom.create({
    name,
    code,
    faculty_id: new mongoose.Types.ObjectId(facultyId),
    organization_id: organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined,
    students: [],
  });

  return classroom;
};

export const getClassroomsForFaculty = async (facultyId: string): Promise<IClassroom[]> => {
  return Classroom.find({ faculty_id: facultyId }).sort({ createdAt: -1 });
};

export const getClassroomsForStudent = async (studentId: string): Promise<IClassroom[]> => {
  return Classroom.find({ students: new mongoose.Types.ObjectId(studentId) })
    .populate("faculty_id", "name email")
    .sort({ createdAt: -1 });
};

export const joinClassroomByCode = async (
  code: string,
  studentId: string
): Promise<IClassroom> => {
  const classroom = await Classroom.findOne({ code: code.toUpperCase() });

  if (!classroom) {
    throw new Error("Classroom not found with that code");
  }

  const studentObjId = new mongoose.Types.ObjectId(studentId);
  const alreadyJoined = classroom.students.some((s) => s.equals(studentObjId));

  if (alreadyJoined) {
    throw new Error("You have already joined this classroom");
  }

  classroom.students.push(studentObjId);
  await classroom.save();

  return classroom;
};

export const deleteClassroomById = async (
  classroomId: string,
  facultyId: string
): Promise<void> => {
  const classroom = await Classroom.findOne({ _id: classroomId, faculty_id: facultyId });
  if (!classroom) {
    throw new Error("Classroom not found or access denied");
  }

  // Cascading deletion
  const LectureSession = mongoose.model("LectureSession");
  const SavedSummary = mongoose.model("SavedSummary");
  const TranscriptChunk = mongoose.model("TranscriptChunk");

  const lectures = await LectureSession.find({ classroom_id: classroomId });
  const sessionIds = lectures.map((l: any) => l.session_id);

  if (sessionIds.length > 0) {
    await SavedSummary.deleteMany({ session_id: { $in: sessionIds } });
    await TranscriptChunk.deleteMany({ session_id: { $in: sessionIds } });
  }

  await LectureSession.deleteMany({ classroom_id: classroomId });
  await Classroom.deleteOne({ _id: classroomId });
};

