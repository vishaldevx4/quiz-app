import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UnscrambleWord, UnscrambleState, UnscrambleResults, UnscrambleAnswer, DifficultyLevel, DIFFICULTY_LEVELS } from '../models/unscramble.model';

@Injectable({
  providedIn: 'root'
})
export class UnscrambleService {
  private apiUrl = '/api/generate-unscramble';

  private state = signal<UnscrambleState>({
    category: '',
    difficulty: 'easy',
    words: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    isSubmitted: false,
    timeSpent: [],
    startTime: 0
  });

  private usingFallback = signal<boolean>(false);

  readonly unscrambleState = this.state.asReadonly();
  readonly isUsingFallback = this.usingFallback.asReadonly();

  readonly currentWord = computed(() => {
    const s = this.state();
    return s.words[s.currentIndex] || null;
  });

  readonly progress = computed(() => {
    const s = this.state();
    return {
      current: s.currentIndex + 1,
      total: s.words.length
    };
  });

  readonly isLastWord = computed(() => {
    const s = this.state();
    return s.currentIndex === s.words.length - 1;
  });

  constructor(private http: HttpClient) {}

  generateWords(category: string, difficulty: DifficultyLevel): Observable<UnscrambleWord[]> {
    this.usingFallback.set(false);
    return this.http.post<UnscrambleWord[]>(this.apiUrl, { category, difficulty }).pipe(
      catchError(error => {
        console.error('Error generating words:', error);
        console.warn('API limit reached or connection failed. Using fallback words instead.');
        this.usingFallback.set(true);
        return of(this.getFallbackWords(category, difficulty));
      })
    );
  }

  startGame(category: string, difficulty: DifficultyLevel, words: UnscrambleWord[]): void {
    this.state.set({
      category,
      difficulty,
      words,
      currentIndex: 0,
      score: 0,
      answers: new Array(words.length).fill(null),
      isSubmitted: false,
      timeSpent: new Array(words.length).fill(0),
      startTime: Date.now()
    });
  }

  selectAnswer(answer: string): void {
    const s = this.state();
    const newAnswers = [...s.answers];
    newAnswers[s.currentIndex] = answer;
    this.state.update(state => ({
      ...state,
      answers: newAnswers
    }));
  }

  submitAnswer(timeSpent: number): { isCorrect: boolean; pointsEarned: number } {
    const s = this.state();
    const currentAnswer = s.answers[s.currentIndex];
    const currentWord = s.words[s.currentIndex];

    if (!currentWord || !currentAnswer) {
      return { isCorrect: false, pointsEarned: 0 };
    }

    // Flexible answer validation: case-insensitive, trim whitespace, remove punctuation
    const normalizedUserAnswer = this.normalizeAnswer(currentAnswer);
    const normalizedCorrectAnswer = this.normalizeAnswer(currentWord.originalWord);

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    // Time-based scoring: Full points if <= 20s, lose 10% per 10s after that, minimum 30%
    let pointsEarned = 0;
    if (isCorrect) {
      const basePoints = currentWord.basePoints;
      if (timeSpent <= 20) {
        pointsEarned = basePoints;
      } else {
        const extraTime = timeSpent - 20;
        const tenSecondIntervals = Math.floor(extraTime / 10);
        const penalty = tenSecondIntervals * 0.1;
        const multiplier = Math.max(0.3, 1 - penalty);
        pointsEarned = Math.round(basePoints * multiplier);
      }
    }

    // Update timeSpent array
    const newTimeSpent = [...s.timeSpent];
    newTimeSpent[s.currentIndex] = timeSpent;

    this.state.update(state => ({
      ...state,
      score: state.score + pointsEarned,
      isSubmitted: true,
      timeSpent: newTimeSpent
    }));

    return { isCorrect, pointsEarned };
  }

  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:'"()-]/g, '');
  }

  nextWord(): void {
    this.state.update(state => ({
      ...state,
      currentIndex: state.currentIndex + 1,
      isSubmitted: false
    }));
  }

  getCurrentAnswer(): string | null {
    const s = this.state();
    return s.answers[s.currentIndex];
  }

  isAnswerSubmitted(): boolean {
    return this.state().isSubmitted;
  }

  getResults(): UnscrambleResults {
    const s = this.state();
    const details: UnscrambleAnswer[] = s.words.map((word, index) => {
      const userAnswer = s.answers[index];
      const normalizedUserAnswer = userAnswer ? this.normalizeAnswer(userAnswer) : '';
      const normalizedCorrectAnswer = this.normalizeAnswer(word.originalWord);
      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      const timeSpent = s.timeSpent[index];

      let pointsEarned = 0;
      if (isCorrect) {
        const basePoints = word.basePoints;
        if (timeSpent <= 20) {
          pointsEarned = basePoints;
        } else {
          const extraTime = timeSpent - 20;
          const tenSecondIntervals = Math.floor(extraTime / 10);
          const penalty = tenSecondIntervals * 0.1;
          const multiplier = Math.max(0.3, 1 - penalty);
          pointsEarned = Math.round(basePoints * multiplier);
        }
      }

      return {
        word,
        userAnswer,
        isCorrect,
        timeSpent,
        pointsEarned
      };
    });

    const correctAnswers = details.filter(d => d.isCorrect).length;
    const maxScore = s.words.reduce((sum, w) => sum + w.basePoints, 0);
    const percentage = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
    const totalTime = s.timeSpent.reduce((sum, time) => sum + time, 0);
    const averageTimePerWord = s.words.length > 0 ? Math.round(totalTime / s.words.length) : 0;

    return {
      category: s.category,
      difficulty: s.difficulty,
      totalWords: s.words.length,
      correctAnswers,
      score: s.score,
      maxScore,
      percentage,
      details,
      averageTimePerWord
    };
  }

  resetGame(): void {
    this.state.set({
      category: '',
      difficulty: 'easy',
      words: [],
      currentIndex: 0,
      score: 0,
      answers: [],
      isSubmitted: false,
      timeSpent: [],
      startTime: 0
    });
    this.usingFallback.set(false);
  }

  private getFallbackWords(category: string, difficulty: DifficultyLevel): UnscrambleWord[] {
    const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.value === difficulty);
    const basePoints = difficultyConfig?.basePoints || 50;

    const scrambleWord = (word: string): string => {
      const chars = word.split('');
      for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      return chars.join('');
    };

    const createWords = (words: string[]): UnscrambleWord[] => {
      return words.map(word => ({
        originalWord: word,
        scrambledWord: scrambleWord(word),
        category,
        difficulty,
        basePoints
      }));
    };

    const fallbackWords: { [key: string]: { [key: string]: string[] } } = {
      'Pop Culture': {
        'easy': ['Beyonce', 'Netflix', 'Marvel', 'Disney', 'iPhone', 'Spotify', 'YouTube', 'Instagram', 'TikTok', 'Amazon'],
        'medium': ['Kardashian', 'Hollywood', 'Trending', 'Celebrity', 'Influencer', 'Blockbuster', 'Paparazzi', 'Superhero', 'Streaming', 'Premiere'],
        'hard': ['Cinematography', 'Entertainment', 'Sensationalism', 'Globalization', 'Merchandising', 'Controversial', 'Revolutionary', 'Unprecedented', 'Phenomenology', 'Sophisticated']
      },
      'Music': {
        'easy': ['Guitar', 'Piano', 'Violin', 'Drums', 'Singer', 'Melody', 'Concert', 'Album', 'Lyrics', 'Rhythm'],
        'medium': ['Symphony', 'Orchestra', 'Harmony', 'Acoustic', 'Classical', 'Composer', 'Recording', 'Billboard', 'Soundtrack', 'Performance'],
        'hard': ['Instrumental', 'Choreography', 'Synchronization', 'Improvisation', 'Collaboration', 'Transcription', 'Counterpoint', 'Polyphonic', 'Orchestration', 'Contemporary']
      },
      'Movies': {
        'easy': ['Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Romance', 'Actor', 'Director', 'Script', 'Camera'],
        'medium': ['Screenplay', 'Hollywood', 'Animation', 'Production', 'Blockbuster', 'Premiere', 'Audition', 'Franchise', 'Superhero', 'Documentary'],
        'hard': ['Cinematography', 'Protagonist', 'Antagonist', 'Cliffhanger', 'Masterpiece', 'Blockbuster', 'Extraordinary', 'Storytelling', 'Thunderstruck', 'Revolutionary']
      },
      'Sports': {
        'easy': ['Soccer', 'Tennis', 'Hockey', 'Boxing', 'Racing', 'Trophy', 'Medal', 'Coach', 'Athlete', 'League'],
        'medium': ['Basketball', 'Football', 'Baseball', 'Volleyball', 'Swimming', 'Marathon', 'Olympics', 'Championship', 'Tournament', 'Gymnastics'],
        'hard': ['Synchronized', 'Professional', 'Competition', 'Quarterback', 'Athleticism', 'Championship', 'Spectacular', 'Performance', 'Overwhelming', 'Extraordinary']
      }
    };

    const categoryWords = fallbackWords[category] || fallbackWords['Pop Culture'];
    const words = categoryWords[difficulty] || categoryWords['easy'];

    return createWords(words);
  }
}
