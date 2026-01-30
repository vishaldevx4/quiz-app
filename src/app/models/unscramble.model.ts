export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface UnscrambleWord {
  originalWord: string;
  scrambledWord: string;
  category: string;
  difficulty: DifficultyLevel;
  basePoints: number;
}

export interface UnscrambleState {
  category: string;
  difficulty: DifficultyLevel;
  words: UnscrambleWord[];
  currentIndex: number;
  score: number;
  answers: (string | null)[];
  isSubmitted: boolean;
  timeSpent: number[];
  startTime: number;
}

export interface UnscrambleAnswer {
  word: UnscrambleWord;
  userAnswer: string | null;
  isCorrect: boolean;
  timeSpent: number;
  pointsEarned: number;
}

export interface UnscrambleResults {
  category: string;
  difficulty: DifficultyLevel;
  totalWords: number;
  correctAnswers: number;
  score: number;
  maxScore: number;
  percentage: number;
  details: UnscrambleAnswer[];
  averageTimePerWord: number;
}

export const UNSCRAMBLE_CATEGORIES = [
  'Pop Culture',
  'Music',
  'Movies',
  'Sports'
];

export const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; basePoints: number }[] = [
  { value: 'easy', label: 'Easy', basePoints: 50 },
  { value: 'medium', label: 'Medium', basePoints: 100 },
  { value: 'hard', label: 'Hard', basePoints: 150 }
];
