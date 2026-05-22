import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth";
import { Classroom } from "../models/Classroom";
import { LectureSession } from "../models/LectureSession";
import { SavedSummary } from "../models/SavedSummary";
import { TranscriptChunk } from "../models/TranscriptChunk";

const router = express.Router();

router.get("/api/search", requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "Search query 'q' is required" });
      return;
    }

    const { userId, role } = req.user!;

    // 1. Get user's classrooms
    let classrooms;
    if (role === "faculty") {
      classrooms = await Classroom.find({ faculty_id: new mongoose.Types.ObjectId(userId) });
    } else {
      classrooms = await Classroom.find({ students: new mongoose.Types.ObjectId(userId) });
    }

    const classroomIds = classrooms.map(c => c._id);
    if (classroomIds.length === 0) {
       res.json({ lectures: [], summaries: [], transcripts: [] });
       return;
    }

    // 2. Find all lectures in these classrooms
    const lecturesList = await LectureSession.find({ classroom_id: { $in: classroomIds } });
    const sessionIds = lecturesList.map(l => l.session_id);
    const lectureMap = new Map(lecturesList.map(l => [l.session_id, l]));

    // 3. Search Lectures (by Title)
    const matchedLectures = await LectureSession.find({
      classroom_id: { $in: classroomIds },
      $or: [
        { $text: { $search: q } },
        { title: { $regex: q, $options: "i" } }
      ]
    }).limit(20);

    // 4. Search Summaries (by summary, topics, study_notes)
    const matchedSummaries = await SavedSummary.find({
      session_id: { $in: sessionIds },
      $or: [
        { $text: { $search: q } },
        { "summaryData.summary": { $regex: q, $options: "i" } },
        { "summaryData.topics": { $regex: q, $options: "i" } },
        { "summaryData.study_notes": { $regex: q, $options: "i" } }
      ]
    }).limit(20);

    // 5. Search Transcript Chunks (by text)
    const matchedTranscripts = await TranscriptChunk.find({
      session_id: { $in: sessionIds },
      $or: [
        { $text: { $search: q } },
        { text: { $regex: q, $options: "i" } }
      ]
    }).limit(40);

    // Format the response, attaching classroom and lecture details
    const classroomMap = new Map(classrooms.map(c => [c._id.toString(), c]));

    const formattedLectures = matchedLectures.map(l => {
      const cls = classroomMap.get(l.classroom_id.toString());
      return {
        session_id: l.session_id,
        title: l.title,
        classroom_name: cls ? cls.name : "Unknown Class",
        classroom_id: l.classroom_id,
        startedAt: l.startedAt,
        status: l.status,
      };
    });

    const formattedSummaries = matchedSummaries.map(s => {
      const lec = lectureMap.get(s.session_id);
      const cls = lec ? classroomMap.get(lec.classroom_id.toString()) : null;
      return {
        session_id: s.session_id,
        lecture_title: lec ? lec.title : "Unknown Lecture",
        classroom_name: cls ? cls.name : "Unknown Class",
        summary: s.summaryData.summary,
        topics: s.summaryData.topics || [],
        study_notes: s.summaryData.study_notes || [],
        generatedAt: s.generatedAt,
      };
    });

    const formattedTranscripts = matchedTranscripts.map(t => {
      const lec = lectureMap.get(t.session_id);
      const cls = lec ? classroomMap.get(lec.classroom_id.toString()) : null;
      return {
        session_id: t.session_id,
        lecture_title: lec ? lec.title : "Unknown Lecture",
        classroom_name: cls ? cls.name : "Unknown Class",
        text: t.text,
        start_time: t.start_time,
        end_time: t.end_time,
        chunk_index: t.chunk_index,
      };
    });

    res.json({
      lectures: formattedLectures,
      summaries: formattedSummaries,
      transcripts: formattedTranscripts
    });
  } catch (error) {
    console.error("[Search] GET /api/search error:", error);
    res.status(500).json({ error: "Internal server error during search" });
  }
});

export default router;
