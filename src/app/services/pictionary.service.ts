import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Drawing, PictionaryState, PictionaryResults, Stroke } from '../models/pictionary.model';

@Injectable({
  providedIn: 'root'
})
export class PictionaryService {
  private apiUrl = '/api/generate-drawing';

  private state = signal<PictionaryState>({
    category: '',
    drawing: null,
    revealedStrokes: 0,
    guesses: [],
    isCorrect: false,
    score: 0,
    gameComplete: false
  });

  readonly pictionaryState = this.state.asReadonly();

  readonly visibleStrokes = computed(() => {
    const s = this.state();
    if (!s.drawing) return [];
    return s.drawing.strokes.slice(0, s.revealedStrokes);
  });

  readonly canRevealMore = computed(() => {
    const s = this.state();
    if (!s.drawing) return false;
    return s.revealedStrokes < s.drawing.strokes.length && !s.gameComplete;
  });

  readonly strokeProgress = computed(() => {
    const s = this.state();
    if (!s.drawing) return { current: 0, total: 0 };
    return {
      current: s.revealedStrokes,
      total: s.drawing.strokes.length
    };
  });

  constructor(private http: HttpClient) {}

  generateDrawing(category: string): Observable<Drawing> {
    return this.http.post<Drawing>(this.apiUrl, { category }).pipe(
      catchError(error => {
        console.error('Error generating drawing:', error);
        console.error('Using fallback drawing instead');
        return of(this.getRandomFallbackDrawing(category));
      })
    );
  }

  startGame(category: string, drawing: Drawing): void {
    this.state.set({
      category,
      drawing,
      revealedStrokes: 1, // Start with one stroke visible
      guesses: [],
      isCorrect: false,
      score: 0,
      gameComplete: false
    });
  }

  revealNextStroke(): void {
    const s = this.state();
    if (!s.drawing || s.revealedStrokes >= s.drawing.strokes.length) return;

    this.state.update(state => ({
      ...state,
      revealedStrokes: state.revealedStrokes + 1
    }));
  }

  submitGuess(guess: string): boolean {
    const s = this.state();
    if (!s.drawing || s.gameComplete) return false;

    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedWord = s.drawing.word.toLowerCase().trim();
    const isCorrect = normalizedGuess === normalizedWord;

    // Calculate score based on how many strokes were revealed
    // Fewer strokes = higher score
    const maxScore = 1000;
    const strokePenalty = Math.floor(maxScore / s.drawing.strokes.length);
    const calculatedScore = isCorrect 
      ? Math.max(100, maxScore - (s.revealedStrokes - 1) * strokePenalty)
      : 0;

    this.state.update(state => ({
      ...state,
      guesses: [...state.guesses, guess],
      isCorrect,
      score: calculatedScore,
      gameComplete: isCorrect || state.revealedStrokes === state.drawing!.strokes.length
    }));

    // If all strokes revealed, game is complete
    if (s.revealedStrokes === s.drawing.strokes.length && !isCorrect) {
      this.state.update(state => ({
        ...state,
        gameComplete: true
      }));
    }

    return isCorrect;
  }

  skipToResults(): void {
    this.state.update(state => ({
      ...state,
      gameComplete: true
    }));
  }

  getResults(): PictionaryResults {
    const s = this.state();
    return {
      word: s.drawing?.word || '',
      category: s.category,
      revealedStrokes: s.revealedStrokes,
      totalStrokes: s.drawing?.strokes.length || 0,
      guesses: s.guesses,
      score: s.score,
      foundCorrectAnswer: s.isCorrect
    };
  }

  resetGame(): void {
    this.state.set({
      category: '',
      drawing: null,
      revealedStrokes: 0,
      guesses: [],
      isCorrect: false,
      score: 0,
      gameComplete: false
    });
  }

  private getRandomFallbackDrawing(category: string): Drawing {
    const fallbackDrawings = this.getFallbackDrawings(category);
    const randomIndex = Math.floor(Math.random() * fallbackDrawings.length);
    return fallbackDrawings[randomIndex];
  }

  private getFallbackDrawings(category: string): Drawing[] {
    const categoryDrawings: { [key: string]: Drawing[] } = {
      'Animals': [
        {
          word: 'cat',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 200 200 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0', strokeWidth: 3, color: '#000000' }, // head
            { path: 'M 160 200 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0', strokeWidth: 3, color: '#000000' }, // left ear
            { path: 'M 240 200 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0', strokeWidth: 3, color: '#000000' }, // right ear
            { path: 'M 185 195 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0', strokeWidth: 2, color: '#000000' }, // left eye
            { path: 'M 215 195 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0', strokeWidth: 2, color: '#000000' }, // right eye
            { path: 'M 195 215 L 200 220 L 205 215', strokeWidth: 2, color: '#000000' }, // nose
            { path: 'M 200 220 L 200 230', strokeWidth: 2, color: '#000000' }, // mouth line
            { path: 'M 200 230 Q 190 235 180 230', strokeWidth: 2, color: '#000000' }, // left whiskers
            { path: 'M 200 230 Q 210 235 220 230', strokeWidth: 2, color: '#000000' } // right whiskers
          ]
        },
        {
          word: 'fish',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 250 200 Q 220 180 200 200 Q 220 220 250 200', strokeWidth: 3, color: '#000000' }, // body
            { path: 'M 250 200 L 280 180 L 280 220 Z', strokeWidth: 3, color: '#000000' }, // tail
            { path: 'M 210 195 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0', strokeWidth: 2, color: '#000000' }, // eye
            { path: 'M 220 190 L 230 180', strokeWidth: 2, color: '#000000' }, // top fin
            { path: 'M 220 210 L 230 220', strokeWidth: 2, color: '#000000' } // bottom fin
          ]
        }
      ],
      'Food': [
        {
          word: 'apple',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 200 180 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0', strokeWidth: 3, color: '#000000' }, // top part
            { path: 'M 160 180 Q 160 240 200 260 Q 240 240 240 180', strokeWidth: 3, color: '#000000' }, // bottom part
            { path: 'M 200 160 L 200 140', strokeWidth: 3, color: '#000000' }, // stem
            { path: 'M 200 150 Q 215 145 220 155', strokeWidth: 2, color: '#000000' } // leaf
          ]
        },
        {
          word: 'pizza',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 200 250 L 150 150 L 250 150 Z', strokeWidth: 3, color: '#000000' }, // triangle
            { path: 'M 175 175 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0', strokeWidth: 2, color: '#000000' }, // pepperoni 1
            { path: 'M 200 190 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0', strokeWidth: 2, color: '#000000' }, // pepperoni 2
            { path: 'M 225 175 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0', strokeWidth: 2, color: '#000000' } // pepperoni 3
          ]
        }
      ],
      'Objects': [
        {
          word: 'house',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 150 200 L 150 280 L 250 280 L 250 200', strokeWidth: 3, color: '#000000' }, // walls
            { path: 'M 140 200 L 200 140 L 260 200', strokeWidth: 3, color: '#000000' }, // roof
            { path: 'M 180 230 L 180 280', strokeWidth: 3, color: '#000000' }, // door left
            { path: 'M 220 230 L 220 280', strokeWidth: 3, color: '#000000' }, // door right
            { path: 'M 180 230 L 220 230', strokeWidth: 3, color: '#000000' }, // door top
            { path: 'M 160 220 L 175 220 L 175 235 L 160 235 Z', strokeWidth: 2, color: '#000000' } // window
          ]
        },
        {
          word: 'star',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 200 140 L 220 190 L 275 190 L 230 225 L 250 280 L 200 245 L 150 280 L 170 225 L 125 190 L 180 190 Z', strokeWidth: 3, color: '#000000' }
          ]
        }
      ],
      'Vehicles': [
        {
          word: 'car',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 120 220 L 150 220 L 150 200 L 180 200 L 200 180 L 240 180 L 250 200 L 280 200 L 280 220 L 310 220', strokeWidth: 3, color: '#000000' }, // body
            { path: 'M 120 220 L 120 240 L 310 240 L 310 220', strokeWidth: 3, color: '#000000' }, // bottom
            { path: 'M 155 240 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0', strokeWidth: 3, color: '#000000' }, // left wheel
            { path: 'M 275 240 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0', strokeWidth: 3, color: '#000000' }, // right wheel
            { path: 'M 190 200 L 190 185 L 220 185 L 230 200', strokeWidth: 2, color: '#000000' } // window
          ]
        }
      ],
      'Sports': [
        {
          word: 'ball',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 200 200 m -50 0 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0', strokeWidth: 3, color: '#000000' }, // circle
            { path: 'M 200 150 Q 180 200 200 250', strokeWidth: 2, color: '#000000' }, // line 1
            { path: 'M 200 150 Q 220 200 200 250', strokeWidth: 2, color: '#000000' } // line 2
          ]
        }
      ],
      'Nature': [
        {
          word: 'tree',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 190 240 L 190 180 L 210 180 L 210 240', strokeWidth: 3, color: '#000000' }, // trunk
            { path: 'M 200 180 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0', strokeWidth: 3, color: '#000000' }, // top foliage
            { path: 'M 180 160 m -30 0 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0', strokeWidth: 3, color: '#000000' }, // middle left
            { path: 'M 220 160 m -30 0 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0', strokeWidth: 3, color: '#000000' } // middle right
          ]
        },
        {
          word: 'flower',
          category,
          difficulty: 'easy',
          strokes: [
            { path: 'M 200 180 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0', strokeWidth: 2, color: '#000000' }, // center
            { path: 'M 200 165 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0', strokeWidth: 2, color: '#000000' }, // top petal
            { path: 'M 200 195 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0', strokeWidth: 2, color: '#000000' }, // bottom petal
            { path: 'M 185 180 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0', strokeWidth: 2, color: '#000000' }, // left petal
            { path: 'M 215 180 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0', strokeWidth: 2, color: '#000000' }, // right petal
            { path: 'M 200 195 L 200 260', strokeWidth: 3, color: '#000000' }, // stem
            { path: 'M 200 220 Q 180 215 175 225 L 175 230', strokeWidth: 2, color: '#000000' } // leaf
          ]
        }
      ]
    };

    // Return drawings for the specific category, or default to a mixed set
    return categoryDrawings[category] || [
      {
        word: 'sun',
        category,
        difficulty: 'easy',
        strokes: [
          { path: 'M 200 200 m -50 0 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0', strokeWidth: 3, color: '#000000' },
          { path: 'M 200 120 L 200 100', strokeWidth: 3, color: '#000000' },
          { path: 'M 200 300 L 200 280', strokeWidth: 3, color: '#000000' },
          { path: 'M 280 200 L 300 200', strokeWidth: 3, color: '#000000' },
          { path: 'M 120 200 L 100 200', strokeWidth: 3, color: '#000000' },
          { path: 'M 250 150 L 265 135', strokeWidth: 3, color: '#000000' },
          { path: 'M 150 250 L 135 265', strokeWidth: 3, color: '#000000' },
          { path: 'M 250 250 L 265 265', strokeWidth: 3, color: '#000000' },
          { path: 'M 150 150 L 135 135', strokeWidth: 3, color: '#000000' }
        ]
      }
    ];
  }
}

