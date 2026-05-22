import { Request, Response } from 'express';
import { LectureQuiz } from '../../models/LectureQuiz';
import { LectureFlashcard } from '../../models/LectureFlashcard';

export const getLectureQuiz = async (req: Request, res: Response) => {
  try {
    const { lectureId } = req.params;
    const quiz = await LectureQuiz.findOne({ lectureId });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Failed to fetch quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quiz' });
  }
};

export const getLectureFlashcards = async (req: Request, res: Response) => {
  try {
    const { lectureId } = req.params;
    const flashcards = await LectureFlashcard.findOne({ lectureId });
    if (!flashcards) {
      return res.status(404).json({ success: false, error: 'Flashcards not found' });
    }
    res.json({ success: true, data: flashcards });
  } catch (error) {
    console.error('Failed to fetch flashcards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch flashcards' });
  }
};
