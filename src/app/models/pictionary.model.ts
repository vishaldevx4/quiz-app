export interface Stroke {
  path: string;
  strokeWidth: number;
  color: string;
}

export interface Drawing {
  word: string;
  category: string;
  strokes: Stroke[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PictionaryState {
  category: string;
  drawing: Drawing | null;
  revealedStrokes: number;
  guesses: string[];
  isCorrect: boolean;
  score: number;
  gameComplete: boolean;
}

export const PICTIONARY_CATEGORIES = [
  'Animals',
  'Food',
  'Objects',
  'Vehicles',
  'Sports',
  'Nature'
];

export interface PictionaryResults {
  word: string;
  category: string;
  revealedStrokes: number;
  totalStrokes: number;
  guesses: string[];
  score: number;
  foundCorrectAnswer: boolean;
}

