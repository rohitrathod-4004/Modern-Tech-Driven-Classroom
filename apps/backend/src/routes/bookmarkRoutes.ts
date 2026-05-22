import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth";
import { Bookmark } from "../models/Bookmark";
import { LectureSession } from "../models/LectureSession";
import { Classroom } from "../models/Classroom";

const router = express.Router();

// Create a bookmark
router.post("/api/bookmarks", requireAuth, async (req, res) => {
  try {
    const { session_id, chunk_index, text, start_time, note } = req.body;
    const { userId } = req.user!;

    if (!session_id || chunk_index === undefined || !text || start_time === undefined) {
      res.status(400).json({ error: "Missing required bookmark fields" });
      return;
    }

    // Check if bookmark already exists for this user-session-chunk combination
    const existing = await Bookmark.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      session_id,
      chunk_index
    });

    if (existing) {
      res.status(400).json({ error: "Moment is already bookmarked" });
      return;
    }

    const bookmark = await Bookmark.create({
      user_id: new mongoose.Types.ObjectId(userId),
      session_id,
      chunk_index,
      text,
      start_time,
      note
    });

    res.status(201).json(bookmark);
  } catch (error) {
    console.error("[Bookmarks] POST error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's bookmarks
router.get("/api/bookmarks", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user!;

    const bookmarks = await Bookmark.find({
      user_id: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 });

    if (bookmarks.length === 0) {
      res.json([]);
      return;
    }

    // Enrich bookmarks with lecture and classroom details
    const sessionIds = bookmarks.map(b => b.session_id);
    const lectures = await LectureSession.find({ session_id: { $in: sessionIds } });
    const lectureMap = new Map(lectures.map(l => [l.session_id, l]));

    const classroomIds = lectures.map(l => l.classroom_id);
    const classrooms = await Classroom.find({ _id: { $in: classroomIds } });
    const classroomMap = new Map(classrooms.map(c => [c._id.toString(), c]));

    const enriched = bookmarks.map(b => {
      const lec = lectureMap.get(b.session_id);
      const cls = lec ? classroomMap.get(lec.classroom_id.toString()) : null;
      return {
        _id: b._id,
        session_id: b.session_id,
        chunk_index: b.chunk_index,
        text: b.text,
        start_time: b.start_time,
        note: b.note,
        createdAt: b.createdAt,
        lecture_title: lec ? lec.title : "Unknown Lecture",
        classroom_name: cls ? cls.name : "Unknown Classroom",
        classroom_id: lec ? lec.classroom_id : null
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("[Bookmarks] GET error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a bookmark
router.delete("/api/bookmarks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user!;

    const bookmark = await Bookmark.findOne({
      _id: id,
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!bookmark) {
      res.status(404).json({ error: "Bookmark not found or access denied" });
      return;
    }

    await Bookmark.deleteOne({ _id: id });
    res.json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    console.error("[Bookmarks] DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
