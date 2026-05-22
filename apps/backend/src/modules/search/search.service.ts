import { Course } from '../../models/Course';
import { Lecture } from '../../models/Lecture';
import { TranscriptChunk } from '../../models/TranscriptChunk';
import { SearchResultDto } from '@classroom/shared';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function generateHighlightedPreview(text: string, query: string, contextLength: number = 40): string {
  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  // Find first match index to slice context
  const match = regex.exec(text);
  if (!match) return text.substring(0, contextLength * 2) + '...';
  
  const matchStart = match.index;
  const matchEnd = match.index + match[0].length;
  
  const startIdx = Math.max(0, matchStart - contextLength);
  const endIdx = Math.min(text.length, matchEnd + contextLength);
  
  let snippet = text.substring(startIdx, endIdx);
  
  // Highlight the match inside the snippet
  snippet = snippet.replace(regex, '<mark className="bg-primary/20 text-primary rounded px-1 font-medium">$1</mark>');
  
  return (startIdx > 0 ? '...' : '') + snippet + (endIdx < text.length ? '...' : '');
}

export class SearchService {
  static async search(userId: string, role: string, query: string): Promise<SearchResultDto[]> {
    if (!query || query.length < 2) return [];

    // 1. Determine allowed course IDs
    let courseIds: any[] = [];
    if (role === 'teacher') {
      const courses = await Course.find({ teacherId: userId, deletedAt: null }).lean();
      courseIds = courses.map(c => c._id);
    } else {
      const courses = await Course.find({ students: userId, deletedAt: null }).lean();
      courseIds = courses.map(c => c._id);
    }

    if (courseIds.length === 0) return [];

    const results: SearchResultDto[] = [];

    // 2. Search Lectures (Titles and Topics)
    const lectureMatches = await Lecture.find(
      { 
        courseId: { $in: courseIds }, 
        deletedAt: null,
        $text: { $search: query }
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .lean();

    // Map lecture matches into 'lecture' or 'topic' results
    // If the query matches a topic title, we should create a 'topic' result
    // Otherwise, 'lecture' result. We can use basic regex to see if it hit a topic
    const escapedQuery = escapeRegExp(query);
    const queryRegex = new RegExp(escapedQuery, 'i');

    for (const lec of lectureMatches) {
      if (queryRegex.test(lec.title) || (lec.summary?.short && queryRegex.test(lec.summary.short))) {
        results.push({
          id: `lec_${lec._id}`,
          type: 'lecture',
          title: lec.title,
          courseId: lec.courseId.toString(),
          lectureId: lec._id.toString(),
          preview: lec.summary?.short,
          score: (lec as any).score
        });
      }
      
      // Check topics
      if (lec.topics && lec.topics.length > 0) {
        for (const topic of lec.topics) {
          if (queryRegex.test(topic.title)) {
            results.push({
              id: `topic_${topic.id}`,
              type: 'topic',
              title: topic.title,
              courseId: lec.courseId.toString(),
              lectureId: lec._id.toString(),
              timestamp: topic.startTime,
              score: (lec as any).score // give same score as lecture text search
            });
          }
        }
      }
    }

    // 3. Search Transcripts
    const transcriptMatches = await TranscriptChunk.find(
      {
        courseId: { $in: courseIds },
        $text: { $search: query }
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(20) // Strict cap
    .lean();

    for (const chunk of transcriptMatches) {
      // Find the lecture to get the title
      const lec = await Lecture.findById(chunk.lectureId).select('title').lean();
      if (!lec) continue;

      results.push({
        id: `chunk_${chunk._id}`,
        type: 'transcript',
        title: lec.title, // contextually, what lecture this is from
        courseId: chunk.courseId?.toString(),
        lectureId: chunk.lectureId!.toString(),
        timestamp: chunk.start_time,
        preview: generateHighlightedPreview(chunk.text, query),
        score: (chunk as any).score
      });
    }

    // Sort combined results by score
    results.sort((a, b) => ((b.score || 0) - (a.score || 0)));

    return results;
  }
}
