import { Request, Response } from 'express';
import { Lecture } from '../../models/Lecture';
import { TranscriptChunk } from '../../models/TranscriptChunk';
import { LectureNote } from '../../models/LectureNote';
import { LectureBookmark } from '../../models/LectureBookmark';

export const exportLectureData = async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const userId = req.user?.id;
  const format = req.query.format as string || 'markdown'; // default markdown

  try {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, error: 'Lecture not found' });
    }

    const chunks = await TranscriptChunk.find({ lectureId }).sort({ chunk_index: 1 });
    const notes = await LectureNote.find({ lectureId, userId }).sort({ timestamp: 1 });
    const bookmarks = await LectureBookmark.find({ lectureId, userId }).sort({ timestamp: 1 });

    if (format === 'json') {
      return res.json({
        success: true,
        data: { lecture, chunks, notes, bookmarks }
      });
    }

    // Default: generate markdown string
    let md = `# Lecture: ${lecture.title}\n\n`;
    md += `* **Date**: ${new Date(lecture.createdAt).toLocaleDateString()}\n`;
    if (lecture.summary?.detailed) {
      md += `\n## AI Summary\n\n${lecture.summary.detailed}\n\n`;
    }

    md += `## Personal Notes & Bookmarks\n\n`;
    if (notes.length === 0 && bookmarks.length === 0) {
      md += `*No personal notes or bookmarks for this lecture.*\n\n`;
    } else {
      const allItems = [
        ...notes.map(n => ({ type: 'note', time: n.timestamp, content: n.content })),
        ...bookmarks.map(b => ({ type: 'bookmark', time: b.timestamp, content: b.title || 'Bookmark' }))
      ].sort((a, b) => a.time - b.time);

      allItems.forEach(item => {
        const timeStr = `${Math.floor(item.time / 60)}:${(item.time % 60).toString().padStart(2, '0')}`;
        md += `- **[${timeStr}]** [${item.type.toUpperCase()}] ${item.content}\n`;
      });
      md += '\n';
    }

    md += `## Full Transcript\n\n`;
    chunks.forEach(chunk => {
      const timeStr = `${Math.floor(chunk.start_time / 60)}:${(chunk.start_time % 60).toString().padStart(2, '0')}`;
      md += `**[${timeStr}]** ${chunk.text}\n\n`;
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${lecture.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.md"`);
    res.send(md);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export lecture' });
  }
};
