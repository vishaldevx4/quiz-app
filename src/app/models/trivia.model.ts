export type DifficultyLevel = 'simple' | 'medium' | 'hard';

export interface TriviaQuestion {
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  explanation?: string;
  points: number;
}

export interface TriviaState {
  category: string;
  difficulty: DifficultyLevel;
  questions: TriviaQuestion[];
  currentIndex: number;
  score: number;
  answers: (string | null)[];
  isSubmitted: boolean;
  timeSpent: number[];
}

export interface TriviaResults {
  category: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  maxScore: number;
  percentage: number;
  details: {
    question: TriviaQuestion;
    userAnswer: string | null;
    isCorrect: boolean;
    pointsEarned: number;
  }[];
}

export const TRIVIA_CATEGORIES = [
  'General Knowledge',
  'Science & Technology',
  'History & Geography',
  'Entertainment',
  'Sports & Games',
  'Arts & Literature'
];

export const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; points: number }[] = [
  { value: 'simple', label: 'Simple', points: 100 },
  { value: 'medium', label: 'Medium', points: 200 },
  { value: 'hard', label: 'Hard', points: 300 }
];

