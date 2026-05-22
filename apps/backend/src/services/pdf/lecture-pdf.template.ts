import { ILectureDocument } from '../../models/Lecture';
import { ITranscriptChunk } from '../../models/TranscriptChunk';
import { pdfStyles } from './lecture-pdf.styles';

export interface PdfTemplateData {
  lecture: ILectureDocument;
  courseTitle: string;
  teacherName: string;
  chunks: ITranscriptChunk[];
  quiz?: any;
  flashcards?: any;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const generateLecturePdfHtml = (data: PdfTemplateData): string => {
  const { lecture, courseTitle, teacherName, chunks, quiz, flashcards } = data;
  
  const dateStr = lecture.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const durationStr = lecture.durationSeconds ? formatTime(lecture.durationSeconds) : 'Unknown';

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${lecture.title} - Study Handbook</title>
      <style>${pdfStyles}</style>
    </head>
    <body>
  `;

  // --- Cover Page ---
  html += `
    <div class="page cover-page">
      <div class="cover-header">
        <div class="badge">AI Study Handbook</div>
        <h1>${lecture.title}</h1>
        <div class="subtitle">An intelligent synthesis of the lecture from ${courseTitle}</div>
      </div>
      
      <div class="cover-footer">
        <div class="meta-group">
          <div class="meta-label">Instructor</div>
          <div class="meta-value">${teacherName}</div>
        </div>
        <div class="meta-group">
          <div class="meta-label">Date Recorded</div>
          <div class="meta-value">${dateStr}</div>
        </div>
      </div>
    </div>
  `;

  // --- Overview & Summary ---
  html += `<div class="page content-page">`;
  html += `<h2>Executive Overview</h2>`;
  
  html += `
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-value">${durationStr}</div>
        <div class="stat-label">Duration</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${lecture.topics?.length || 0}</div>
        <div class="stat-label">Key Topics</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${quiz?.questions?.length || 0}</div>
        <div class="stat-label">Knowledge Checks</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${flashcards?.cards?.length || 0}</div>
        <div class="stat-label">Terminology</div>
      </div>
    </div>
  `;

  const summaryContent = lecture.summary?.detailed || lecture.summary?.short;
  if (summaryContent) {
    html += `<div class="abstract">${summaryContent}</div>`;
  }

  // --- Topics Timeline (Chapters) ---
  if (lecture.topics && lecture.topics.length > 0) {
    html += `<h3>Chapter Outline</h3>`;
    html += `<div class="chapter-list">`;
    
    lecture.topics.forEach(topic => {
      html += `
        <div class="chapter-item">
          <div class="chapter-time">${formatTime(topic.startTime)}</div>
          <div class="chapter-content">
            <div class="chapter-title">${topic.title}</div>
            ${topic.summary ? `<div class="chapter-desc">${topic.summary}</div>` : ''}
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  html += `</div>`; // End Overview Page

  // --- Flashcards (Glossary) ---
  if (flashcards?.cards && flashcards.cards.length > 0) {
    html += `<div class="page content-page">`;
    html += `<h2>Terminology & Concepts</h2>`;
    html += `<div class="glossary">`;
    
    flashcards.cards.forEach((card: any) => {
      html += `
        <div class="glossary-item">
          <div class="glossary-term">${card.front}</div>
          <div class="glossary-def">${card.back}</div>
        </div>
      `;
    });
    
    html += `</div></div>`;
  }

  // --- Quiz (Knowledge Check) ---
  if (quiz?.questions && quiz.questions.length > 0) {
    html += `<div class="page content-page">`;
    html += `<h2>Knowledge Check</h2>`;
    
    quiz.questions.forEach((q: any, index: number) => {
      html += `
        <div class="quiz-item">
          <div class="quiz-question">${index + 1}. ${q.question}</div>
          <ul class="quiz-options">
      `;
      
      const letters = ['A', 'B', 'C', 'D', 'E'];
      q.options.forEach((opt: string, optIdx: number) => {
        const isCorrect = opt === q.correctAnswer;
        html += `
          <li class="quiz-option ${isCorrect ? 'correct' : ''}">
            <div class="quiz-marker">${letters[optIdx]}.</div>
            <div>${opt}</div>
          </li>
        `;
      });
      
      html += `</ul>`;
      if (q.explanation) {
        html += `<div class="quiz-explanation">${q.explanation}</div>`;
      }
      html += `</div>`;
    });
    
    html += `</div>`;
  }

  // --- Full Transcript ---
  if (chunks && chunks.length > 0) {
    html += `<div class="content-page">`; // Starts directly after quiz or on new page if forced
    html += `<h2>Lecture Transcript</h2>`;
    html += `<div class="transcript-container">`;
    
    chunks.forEach(chunk => {
      html += `
        <div class="transcript-chunk">
          <div class="t-time">${formatTime(chunk.start_time)}</div>
          <div class="t-text">${chunk.text}</div>
        </div>
      `;
    });
    
    html += `</div></div>`;
  }

  html += `
    </body>
    </html>
  `;

  return html;
};
