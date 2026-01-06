export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizState {
  theme: string;
  questions: Question[];
  currentIndex: number;
  score: number;
  answers: (number | null)[];
  isSubmitted: boolean;
}

export const PRESET_THEMES = [
  'Space',
  'History',
  'Science',
  'Geography',
  'Sports'
];
