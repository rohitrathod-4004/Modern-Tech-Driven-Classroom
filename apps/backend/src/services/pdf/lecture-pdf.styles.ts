export const pdfStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');

  :root {
    --bg: #ffffff;
    --text-primary: #09090b; /* Zinc 950 */
    --text-secondary: #52525b; /* Zinc 600 */
    --text-tertiary: #a1a1aa; /* Zinc 400 */
    --border: #e4e4e7; /* Zinc 200 */
    --border-light: #f4f4f5; /* Zinc 100 */
    --accent: #27272a; /* Zinc 800 */
    
    /* Cinematic Brand Colors */
    --cine-dark: #0f172a; /* Slate 900 */
    --cine-navy: #1e293b; /* Slate 800 */
    --cine-glow: rgba(99, 102, 241, 0.15); /* Indigo glow */
    --cine-accent: #818cf8; /* Indigo 400 */
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--text-primary);
    background: var(--bg);
    line-height: 1.65;
    margin: 0;
    padding: 0;
    font-size: 10.5pt;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    page-break-after: always;
  }

  /* --- Cover Page --- */
  .cover-page {
    height: calc(100vh - 40mm);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem 4rem;
    box-sizing: border-box;
    position: relative;
    background-color: var(--cine-dark);
    background-image: 
      radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%);
    border-radius: 16px;
    overflow: hidden;
    color: #f8fafc;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .cover-header {
    margin-top: 15vh;
    position: relative;
    z-index: 2;
  }

  .badge {
    display: inline-block;
    color: var(--cine-accent);
    background: rgba(99, 102, 241, 0.1);
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 2.5rem;
    padding: 0.5rem 1rem;
    border-radius: 99px;
    border: 1px solid rgba(129, 140, 248, 0.3);
  }

  h1 {
    font-family: 'Playfair Display', serif;
    font-size: 4.25rem;
    font-weight: 600;
    line-height: 1.1;
    margin: 0 0 1.5rem 0;
    color: #ffffff;
    letter-spacing: -0.02em;
    max-width: 90%;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }

  .subtitle {
    font-size: 1.25rem;
    color: #cbd5e1; /* Slate 300 */
    font-weight: 400;
    max-width: 70%;
    line-height: 1.6;
  }

  .cover-footer {
    display: flex;
    gap: 5rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 2.5rem;
    margin-bottom: 4vh;
    position: relative;
    z-index: 2;
  }

  .meta-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .meta-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8; /* Slate 400 */
    font-weight: 600;
  }

  .meta-value {
    font-size: 1.05rem;
    color: #f8fafc; /* Slate 50 */
    font-weight: 500;
  }

  /* --- Content Pages --- */
  .content-page {
    padding: 1rem 4rem 3rem 4rem;
  }

  h2 {
    font-family: 'Inter', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 2.5rem 0;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    background: linear-gradient(90deg, rgba(248, 250, 252, 1) 0%, rgba(238, 242, 255, 0.5) 100%);
    border-left: 3px solid var(--cine-accent);
    color: var(--cine-dark);
    letter-spacing: -0.01em;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 2.5rem 0 1rem 0;
    color: var(--text-primary);
  }

  /* --- Stats (Editorial Style) --- */
  .stats-row {
    display: flex;
    gap: 3rem;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border-light);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  /* --- Summary Abstract --- */
  .abstract {
    font-size: 1.125rem;
    line-height: 1.8;
    color: var(--text-secondary);
    max-width: 75ch;
    margin-bottom: 3rem;
  }

  /* --- Topics Timeline (Chapters) --- */
  .chapter-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .chapter-item {
    display: flex;
    gap: 2rem;
    page-break-inside: avoid;
  }

  .chapter-time {
    font-family: 'Inter', monospace;
    font-size: 0.85rem;
    color: var(--text-tertiary);
    flex-shrink: 0;
    width: 3rem;
    padding-top: 0.25rem;
  }

  .chapter-content {
    flex-grow: 1;
    max-width: 65ch;
  }

  .chapter-title {
    font-weight: 600;
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .chapter-desc {
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* --- Flashcards (Glossary Dictionary Style) --- */
  .glossary {
    display: flex;
    flex-direction: column;
  }

  .glossary-item {
    display: flex;
    gap: 2rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--border-light);
    page-break-inside: avoid;
  }

  .glossary-term {
    flex-shrink: 0;
    width: 30%;
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--text-primary);
  }

  .glossary-def {
    flex-grow: 1;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* --- Quiz (Text-based MCQ) --- */
  .quiz-item {
    margin-bottom: 3rem;
    page-break-inside: avoid;
    max-width: 70ch;
  }

  .quiz-question {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 1.25rem;
    line-height: 1.5;
  }

  .quiz-options {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
  }

  .quiz-option {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 0;
    color: var(--text-secondary);
  }

  .quiz-option.correct {
    color: var(--text-primary);
    font-weight: 500;
  }

  .quiz-marker {
    font-family: monospace;
    color: var(--text-tertiary);
  }

  .quiz-option.correct .quiz-marker {
    color: var(--text-primary);
    font-weight: 700;
  }

  .quiz-explanation {
    padding-left: 1.5rem;
    border-left: 2px solid var(--border);
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  /* --- Transcript Rail --- */
  .transcript-container {
    margin-top: 2rem;
  }

  .transcript-chunk {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;
    page-break-inside: avoid;
  }

  .t-time {
    flex-shrink: 0;
    width: 3rem;
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    text-align: right;
    padding-top: 0.35rem;
  }

  .t-text {
    flex-grow: 1;
    color: var(--text-primary);
    line-height: 1.7;
    max-width: 65ch;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;
