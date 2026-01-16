import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Country,
  MapGameState,
  MapGameConfig,
  MapAnswer,
  MapResults,
  GameDifficulty,
  Region
} from '../models/map.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private allCountries = signal<Record<string, Country>>({});
  private state = signal<MapGameState>({
    config: {
      mode: 'classic',
      difficulty: 'easy',
      region: 'all',
      questionCount: 15
    },
    countries: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    gameComplete: false,
    startTime: 0
  });

  readonly mapState = this.state.asReadonly();

  readonly currentCountry = computed(() => {
    const s = this.state();
    return s.countries[s.currentIndex] || null;
  });

  readonly progress = computed(() => {
    const s = this.state();
    return {
      current: s.currentIndex + 1,
      total: s.countries.length
    };
  });

  readonly isLastCountry = computed(() => {
    const s = this.state();
    return s.currentIndex === s.countries.length - 1;
  });

  constructor(private http: HttpClient) {
    this.loadCountries();
  }

  private async loadCountries(): Promise<void> {
    try {
      const countries = await firstValueFrom(
        this.http.get<Record<string, Country>>('assets/map-game/countries.json')
      );
      const mapList = await firstValueFrom(
        this.http.get<[string, string, string, string, string][]>('assets/map-game/mapList.json')
      );
      const difficultyOverrides = new Map<string, GameDifficulty>();
      mapList.forEach(([code, name, fullName, _svg, difficulty]) => {
        const normalized = difficulty === 'high' ? 'high' : difficulty === 'medium' ? 'medium' : 'easy';
        difficultyOverrides.set(code, normalized as GameDifficulty);
      });

      const merged: Record<string, Country> = {};
      Object.entries(countries).forEach(([code, country]) => {
        merged[code] = {
          ...country,
          difficulty: (difficultyOverrides.get(code) || country.difficulty) as Country['difficulty']
        };
      });

      this.allCountries.set(merged);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  }

  async startGame(config: MapGameConfig): Promise<void> {
    // Ensure countries are loaded
    if (Object.keys(this.allCountries()).length === 0) {
      await this.loadCountries();
    }

    const selectedCountries = this.selectCountries(config);

    this.state.set({
      config,
      countries: selectedCountries,
      currentIndex: 0,
      score: 0,
      answers: [],
      gameComplete: false,
      startTime: Date.now()
    });
  }

  private selectCountries(config: MapGameConfig): Country[] {
    const countries = Object.values(this.allCountries());

    // Filter by region
    let filtered = config.region === 'all'
      ? countries
      : countries.filter(c => c.region === config.region);

    // Filter by difficulty
    if (config.difficulty !== 'all') {
      filtered = filtered.filter(c => c.difficulty === config.difficulty);
    }

    // Shuffle and select
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
  }

  checkAnswer(clickedCountryCode: string, timeSpent: number): {
    isCorrect: boolean;
    pointsEarned: number;
    correctCountry: Country;
  } {
    const currentCountry = this.currentCountry();
    if (!currentCountry) {
      return {
        isCorrect: false,
        pointsEarned: 0,
        correctCountry: currentCountry!
      };
    }

    const isCorrect = clickedCountryCode === currentCountry.code;
    const pointsEarned = isCorrect ? this.calculatePoints(timeSpent) : 0;

    const answer: MapAnswer = {
      country: currentCountry,
      clickedCountryCode,
      isCorrect,
      timeSpent,
      pointsEarned
    };

    this.state.update(state => ({
      ...state,
      score: state.score + pointsEarned,
      answers: [...state.answers, answer]
    }));

    return {
      isCorrect,
      pointsEarned,
      correctCountry: currentCountry
    };
  }

  private calculatePoints(timeSpent: number): number {
    const config = this.state().config;
    const basePoints = 100;

    if (config.mode === 'timed') {
      // Time bonus: Faster answers get more points
      const timeRemaining = Math.max(0, 30 - timeSpent);
      const timeBonus = Math.floor(timeRemaining / 3) * 10;
      return basePoints + timeBonus;
    }

    // Classic mode: No time penalty, flat points
    return basePoints;
  }

  nextCountry(): void {
    const s = this.state();
    if (s.currentIndex < s.countries.length - 1) {
      this.state.update(state => ({
        ...state,
        currentIndex: state.currentIndex + 1
      }));
    } else {
      this.state.update(state => ({
        ...state,
        gameComplete: true
      }));
    }
  }

  getResults(): MapResults {
    const s = this.state();
    const correctCount = s.answers.filter(a => a.isCorrect).length;
    const maxPossibleScore = s.countries.length * 100;
    const percentage = maxPossibleScore > 0
      ? Math.round((s.score / maxPossibleScore) * 100)
      : 0;
    const averageTime = s.answers.length > 0
      ? s.answers.reduce((sum, a) => sum + a.timeSpent, 0) / s.answers.length
      : 0;

    return {
      totalScore: s.score,
      maxPossibleScore,
      correctCount,
      totalCount: s.countries.length,
      percentage,
      answers: s.answers,
      averageTime: Math.round(averageTime * 10) / 10,
      config: s.config
    };
  }

  getCountryByCode(code: string): Country | undefined {
    return this.allCountries()[code];
  }

  resetGame(): void {
    this.state.update(state => ({
      ...state,
      countries: [],
      currentIndex: 0,
      score: 0,
      answers: [],
      gameComplete: false,
      startTime: 0
    }));
  }
}

