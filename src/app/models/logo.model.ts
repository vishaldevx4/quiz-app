export interface Logo {
  id: string;
  imagePath: string;
  correctName: string;
  acceptableVariations: string[];
  category?: string;
}

export interface LogoState {
  logos: Logo[];
  currentIndex: number;
  score: number;
  answers: LogoAnswer[];
  gameComplete: boolean;
  totalLogos: number;
}

export interface LogoAnswer {
  logo: Logo;
  userAnswer: string | null;
  isCorrect: boolean;
  timeSpent: number;
  pointsEarned: number;
}

export interface LogoResults {
  totalScore: number;
  maxPossibleScore: number;
  correctCount: number;
  totalCount: number;
  percentage: number;
  answers: LogoAnswer[];
  averageTime: number;
}

export const LOGO_GAME_OPTIONS = [
  { value: 6, label: '6 Logos', description: 'Quick Game' },
  { value: 10, label: '10 Logos', description: 'Standard Game' },
  { value: 22, label: 'All 22', description: 'Full Challenge' }
];

