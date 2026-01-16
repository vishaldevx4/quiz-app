export interface Country {
  code: string;
  name: string;
  fullName: string;
  region: 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania';
  difficulty: 'easy' | 'medium' | 'high';
}

export type GameMode = 'classic' | 'timed' | 'regional';
export type GameDifficulty = 'easy' | 'medium' | 'high' | 'all';
export type Region = 'all' | 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania';

export interface MapGameConfig {
  mode: GameMode;
  difficulty: GameDifficulty;
  region: Region;
  questionCount: number;
}

export interface MapGameState {
  config: MapGameConfig;
  countries: Country[];
  currentIndex: number;
  score: number;
  answers: MapAnswer[];
  gameComplete: boolean;
  startTime: number;
}

export interface MapAnswer {
  country: Country;
  clickedCountryCode: string | null;
  isCorrect: boolean;
  timeSpent: number;
  pointsEarned: number;
}

export interface MapResults {
  totalScore: number;
  maxPossibleScore: number;
  correctCount: number;
  totalCount: number;
  percentage: number;
  answers: MapAnswer[];
  averageTime: number;
  config: MapGameConfig;
}

export const MAP_GAME_MODES = [
  { value: 'classic' as GameMode, label: 'Classic', description: 'Find countries at your own pace' },
  { value: 'timed' as GameMode, label: 'Time Trial', description: '30 seconds per country' },
  { value: 'regional' as GameMode, label: 'Regional Focus', description: 'Focus on one continent' }
];

export const MAP_DIFFICULTIES = [
  { value: 'easy' as GameDifficulty, label: 'Easy', description: 'Large, well-known countries (10 questions)', questionCount: 10 },
  { value: 'medium' as GameDifficulty, label: 'Medium', description: 'Mix of familiar and challenging (10 questions)', questionCount: 10 },
  { value: 'high' as GameDifficulty, label: 'High', description: 'Small & difficult countries (10 questions)', questionCount: 10 }
];

export const MAP_REGIONS = [
  { value: 'all' as Region, label: 'All Regions', description: 'Countries from all continents' },
  { value: 'Africa' as Region, label: 'Africa', description: 'African countries' },
  { value: 'Americas' as Region, label: 'Americas', description: 'North and South America' },
  { value: 'Asia' as Region, label: 'Asia', description: 'Asian countries' },
  { value: 'Europe' as Region, label: 'Europe', description: 'European countries' },
  { value: 'Oceania' as Region, label: 'Oceania', description: 'Pacific Islands and Australia' }
];

