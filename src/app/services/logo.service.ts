import { Injectable, signal, computed } from '@angular/core';
import { Logo, LogoState, LogoAnswer, LogoResults } from '../models/logo.model';

@Injectable({
  providedIn: 'root'
})
export class LogoService {
  private readonly ALL_LOGOS: Logo[] = [
    {
      id: 'american-airlines',
      imagePath: 'assets/american%20airline.webp',
      correctName: 'American Airlines',
      acceptableVariations: ['american airlines', 'americanairlines', 'american air', 'aa']
    },
    {
      id: 'american-express',
      imagePath: 'assets/american%20express.webp',
      correctName: 'American Express',
      acceptableVariations: ['american express', 'americanexpress', 'amex', 'american ex']
    },
    {
      id: 'atari',
      imagePath: 'assets/Atari.webp',
      correctName: 'Atari',
      acceptableVariations: ['atari']
    },
    {
      id: 'chick-fil-a',
      imagePath: 'assets/chickfla.webp',
      correctName: 'Chick-fil-A',
      acceptableVariations: ['chick fil a', 'chickfila', 'chick-fil-a', 'chic fil a', 'chikfila']
    },
    {
      id: 'doritos',
      imagePath: 'assets/Doritos.webp',
      correctName: 'Doritos',
      acceptableVariations: ['doritos', 'dorito']
    },
    {
      id: 'firestone',
      imagePath: 'assets/firestone.webp',
      correctName: 'Firestone',
      acceptableVariations: ['firestone', 'fire stone']
    },
    {
      id: 'gerber',
      imagePath: 'assets/gerber.webp',
      correctName: 'Gerber',
      acceptableVariations: ['gerber']
    },
    {
      id: 'lipton',
      imagePath: 'assets/lipton.webp',
      correctName: 'Lipton',
      acceptableVariations: ['lipton']
    },
    {
      id: 'louis-vuitton',
      imagePath: 'assets/Loius%20vitton.webp',
      correctName: 'Louis Vuitton',
      acceptableVariations: ['louis vuitton', 'louisvuitton', 'loius vitton', 'lv', 'louis vitton']
    },
    {
      id: 'nintendo',
      imagePath: 'assets/nitendo.webp',
      correctName: 'Nintendo',
      acceptableVariations: ['nintendo', 'nitendo', 'nintento']
    },
    {
      id: 'north-face',
      imagePath: 'assets/Northface.webp',
      correctName: 'The North Face',
      acceptableVariations: ['north face', 'northface', 'the north face', 'tnf']
    },
    {
      id: 'shell',
      imagePath: 'assets/shell.webp',
      correctName: 'Shell',
      acceptableVariations: ['shell']
    },
    {
      id: 'tiffany',
      imagePath: 'assets/tiffany%20and%20co.webp',
      correctName: 'Tiffany & Co',
      acceptableVariations: ['tiffany', 'tiffany and co', 'tiffany & co', 'tiffanyandco', 'tiffany co']
    },
    {
      id: 'versace',
      imagePath: 'assets/versace.webp',
      correctName: 'Versace',
      acceptableVariations: ['versace', 'versache']
    },
    {
      id: 'yamaha',
      imagePath: 'assets/Yamaha.webp',
      correctName: 'Yamaha',
      acceptableVariations: ['yamaha']
    },
    // Sample images - using generic brand names
    {
      id: 'sample1',
      imagePath: 'assets/sample1.webp',
      correctName: 'Sample Brand 1',
      acceptableVariations: ['sample brand 1', 'sample1', 'brand1']
    },
    {
      id: 'sample3',
      imagePath: 'assets/sample3.webp',
      correctName: 'Sample Brand 3',
      acceptableVariations: ['sample brand 3', 'sample3', 'brand3']
    },
    {
      id: 'sample4',
      imagePath: 'assets/sample4.webp',
      correctName: 'Sample Brand 4',
      acceptableVariations: ['sample brand 4', 'sample4', 'brand4']
    },
    {
      id: 'sample5',
      imagePath: 'assets/sample5.webp',
      correctName: 'Sample Brand 5',
      acceptableVariations: ['sample brand 5', 'sample5', 'brand5']
    },
    {
      id: 'sample7',
      imagePath: 'assets/sample7.webp',
      correctName: 'Sample Brand 7',
      acceptableVariations: ['sample brand 7', 'sample7', 'brand7']
    },
    {
      id: 'sample8',
      imagePath: 'assets/sample8.webp',
      correctName: 'Sample Brand 8',
      acceptableVariations: ['sample brand 8', 'sample8', 'brand8']
    },
    {
      id: 'unknown',
      imagePath: 'assets/unknown.webp',
      correctName: 'Unknown Brand',
      acceptableVariations: ['unknown brand', 'unknown', 'brand']
    }
  ];

  private state = signal<LogoState>({
    logos: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    gameComplete: false,
    totalLogos: 0
  });

  readonly logoState = this.state.asReadonly();

  readonly currentLogo = computed(() => {
    const s = this.state();
    return s.logos[s.currentIndex] || null;
  });

  readonly progress = computed(() => {
    const s = this.state();
    return {
      current: s.currentIndex + 1,
      total: s.totalLogos
    };
  });

  readonly isLastLogo = computed(() => {
    const s = this.state();
    return s.currentIndex === s.logos.length - 1;
  });

  startGame(logoCount: number): void {
    const selectedLogos = this.getRandomLogos(logoCount);
    this.state.set({
      logos: selectedLogos,
      currentIndex: 0,
      score: 0,
      answers: [],
      gameComplete: false,
      totalLogos: logoCount
    });
  }

  private getRandomLogos(count: number): Logo[] {
    const shuffled = [...this.ALL_LOGOS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, this.ALL_LOGOS.length));
  }

  checkAnswer(userAnswer: string, timeElapsed: number): { isCorrect: boolean; pointsEarned: number } {
    const currentLogo = this.currentLogo();
    if (!currentLogo) {
      return { isCorrect: false, pointsEarned: 0 };
    }

    const isCorrect = this.isAnswerCorrect(userAnswer, currentLogo);
    const pointsEarned = isCorrect ? this.calculateScore(timeElapsed) : 0;

    const answer: LogoAnswer = {
      logo: currentLogo,
      userAnswer: userAnswer.trim(),
      isCorrect,
      timeSpent: timeElapsed,
      pointsEarned
    };

    this.state.update(state => ({
      ...state,
      score: state.score + pointsEarned,
      answers: [...state.answers, answer]
    }));

    return { isCorrect, pointsEarned };
  }

  private isAnswerCorrect(userAnswer: string, logo: Logo): boolean {
    const normalized = userAnswer.toLowerCase().trim();
    
    if (!normalized) return false;

    // Check exact match
    if (normalized === logo.correctName.toLowerCase()) {
      return true;
    }

    // Check acceptable variations
    if (logo.acceptableVariations.some(v => v === normalized)) {
      return true;
    }

    // Remove common words and punctuation
    const cleaned = normalized.replace(/[^a-z0-9]/g, '');
    const cleanedCorrect = logo.correctName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleaned === cleanedCorrect) {
      return true;
    }

    // Partial match for compound names (must be at least 4 characters)
    if (cleaned.length >= 4 && cleanedCorrect.includes(cleaned)) {
      return true;
    }

    return false;
  }

  private calculateScore(timeElapsed: number): number {
    const maxPoints = 100;
    const timeSlots = Math.floor(timeElapsed / 5); // Every 5 seconds
    const deduction = timeSlots * 10;
    return Math.max(0, maxPoints - deduction);
  }

  nextLogo(): void {
    const s = this.state();
    if (s.currentIndex < s.logos.length - 1) {
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

  getResults(): LogoResults {
    const s = this.state();
    const correctCount = s.answers.filter(a => a.isCorrect).length;
    const maxPossibleScore = s.totalLogos * 100;
    const percentage = maxPossibleScore > 0 ? Math.round((s.score / maxPossibleScore) * 100) : 0;
    const averageTime = s.answers.length > 0 
      ? s.answers.reduce((sum, a) => sum + a.timeSpent, 0) / s.answers.length 
      : 0;

    return {
      totalScore: s.score,
      maxPossibleScore,
      correctCount,
      totalCount: s.totalLogos,
      percentage,
      answers: s.answers,
      averageTime: Math.round(averageTime * 10) / 10
    };
  }

  resetGame(): void {
    this.state.set({
      logos: [],
      currentIndex: 0,
      score: 0,
      answers: [],
      gameComplete: false,
      totalLogos: 0
    });
  }
}

