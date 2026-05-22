import { LectureSession, ILectureSession } from "../../models/LectureSession";
import { TranscriptChunk } from "../../models/TranscriptChunk";
import { SavedSummary } from "../../models/SavedSummary";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const startLectureSession = async (
  classroomId: string,
  facultyId: string,
  title: string
): Promise<ILectureSession> => {
  // Mark any previously active sessions in this classroom as completed
  await LectureSession.updateMany(
    { classroom_id: classroomId, status: "active" },
    { $set: { status: "completed", endedAt: new Date() } }
  );

  const session = await LectureSession.create({
    classroom_id: new mongoose.Types.ObjectId(classroomId),
    faculty_id: new mongoose.Types.ObjectId(facultyId),
    title,
    session_id: uuidv4(),
    status: "active",
    processing_state: {
      transcription: "pending",
      summary: "pending",
      export: "pending",
    },
  });

  return session;
};

export const getLecturesByClassroom = async (
  classroomId: string
): Promise<ILectureSession[]> => {
  return LectureSession.find({ classroom_id: classroomId }).sort({ startedAt: -1 });
};

export const endLectureSession = async (sessionId: string): Promise<ILectureSession | null> => {
  return LectureSession.findOneAndUpdate(
    { session_id: sessionId },
    {
      $set: {
        status: "completed",
        endedAt: new Date(),
        "processing_state.transcription": "completed",
      },
    },
    { returnDocument: "after" }
  );
};

export const getLectureBySessionId = async (sessionId: string): Promise<ILectureSession | null> => {
  return LectureSession.findOne({ session_id: sessionId });
};

export const markSummaryComplete = async (sessionId: string): Promise<void> => {
  await LectureSession.findOneAndUpdate(
    { session_id: sessionId },
    { $set: { "processing_state.summary": "completed" } },
    { returnDocument: "after" }
  );
};

export const getLectureDetail = async (sessionId: string) => {
  const lecture = await LectureSession.findOne({ session_id: sessionId });

  if (!lecture) {
    return null;
  }

  const chunks = await TranscriptChunk.find({ session_id: sessionId })
    .sort({ chunk_index: 1 })
    .select("chunk_index text status start_time end_time -_id");

  const savedSummary = await SavedSummary.findOne({ session_id: sessionId });

  return {
    lecture,
    transcript: chunks,
    summary: savedSummary?.summaryData ?? null,
  };
};
