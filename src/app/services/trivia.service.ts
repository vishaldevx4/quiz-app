import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TriviaQuestion, TriviaState, TriviaResults, DifficultyLevel, DIFFICULTY_LEVELS } from '../models/trivia.model';

@Injectable({
  providedIn: 'root'
})
export class TriviaService {
  private apiUrl = '/api/generate-trivia';

  private state = signal<TriviaState>({
    category: '',
    difficulty: 'simple',
    questions: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    isSubmitted: false,
    timeSpent: []
  });

  private usingFallback = signal<boolean>(false);

  readonly triviaState = this.state.asReadonly();
  readonly isUsingFallback = this.usingFallback.asReadonly();

  readonly currentQuestion = computed(() => {
    const s = this.state();
    return s.questions[s.currentIndex] || null;
  });

  readonly progress = computed(() => {
    const s = this.state();
    return {
      current: s.currentIndex + 1,
      total: s.questions.length
    };
  });

  readonly isLastQuestion = computed(() => {
    const s = this.state();
    return s.currentIndex === s.questions.length - 1;
  });

  readonly currentQuestionAnswers = computed(() => {
    const question = this.currentQuestion();
    if (!question) return [];
    
    // Shuffle answers
    const allAnswers = [question.correctAnswer, ...question.incorrectAnswers];
    return this.shuffleArray(allAnswers);
  });

  constructor(private http: HttpClient) {}

  generateTrivia(category: string, difficulty: DifficultyLevel): Observable<TriviaQuestion[]> {
    this.usingFallback.set(false); // Reset flag
    return this.http.post<TriviaQuestion[]>(this.apiUrl, { category, difficulty }).pipe(
      catchError(error => {
        console.error('Error generating riddles:', error);
        console.warn('API limit reached or connection failed. Using fallback riddles instead.');
        this.usingFallback.set(true); // Set flag when using fallback
        return of(this.getFallbackTrivia(category, difficulty));
      })
    );
  }

  startTrivia(category: string, difficulty: DifficultyLevel, questions: TriviaQuestion[]): void {
    this.state.set({
      category,
      difficulty,
      questions,
      currentIndex: 0,
      score: 0,
      answers: new Array(questions.length).fill(null),
      isSubmitted: false,
      timeSpent: new Array(questions.length).fill(0)
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

  submitAnswer(): { isCorrect: boolean; pointsEarned: number } {
    const s = this.state();
    const currentAnswer = s.answers[s.currentIndex];
    const currentQuestion = s.questions[s.currentIndex];
    
    if (!currentQuestion || !currentAnswer) {
      return { isCorrect: false, pointsEarned: 0 };
    }

    const isCorrect = currentAnswer === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect ? currentQuestion.points : 0;

    this.state.update(state => ({
      ...state,
      score: state.score + pointsEarned,
      isSubmitted: true
    }));

    return { isCorrect, pointsEarned };
  }

  nextQuestion(): void {
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

  getResults(): TriviaResults {
    const s = this.state();
    const details = s.questions.map((question, index) => {
      const userAnswer = s.answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      return {
        question,
        userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0
      };
    });

    const correctAnswers = details.filter(d => d.isCorrect).length;
    const maxScore = s.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;

    return {
      category: s.category,
      difficulty: s.difficulty,
      totalQuestions: s.questions.length,
      correctAnswers,
      score: s.score,
      maxScore,
      percentage,
      details
    };
  }

  resetTrivia(): void {
    this.state.set({
      category: '',
      difficulty: 'simple',
      questions: [],
      currentIndex: 0,
      score: 0,
      answers: [],
      isSubmitted: false,
      timeSpent: []
    });
    this.usingFallback.set(false);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getFallbackTrivia(category: string, difficulty: DifficultyLevel): TriviaQuestion[] {
    const points = DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.points || 100;
    
    const fallbackQuestions: { [key: string]: TriviaQuestion[] } = {
      'General Knowledge': [
        {
          question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
          correctAnswer: 'An Echo',
          incorrectAnswers: ['A Ghost', 'The Wind', 'A Radio'],
          explanation: 'An echo is a sound that reflects off surfaces and repeats back to you without having a physical form.',
          points
        },
        {
          question: 'The more you take, the more you leave behind. What am I?',
          correctAnswer: 'Footsteps',
          incorrectAnswers: ['Time', 'Memories', 'Photographs'],
          explanation: 'Every step you take leaves behind a footprint, so the more steps you take, the more footprints you leave.',
          points
        },
        {
          question: 'What has keys but no locks, space but no room, and you can enter but not go inside?',
          correctAnswer: 'A Keyboard',
          incorrectAnswers: ['A Piano', 'A Map', 'A Book'],
          explanation: 'A keyboard has keys to press, a space bar, and an enter key, but none of these are physical spaces or locks.',
          points
        },
        {
          question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
          correctAnswer: 'A Map',
          incorrectAnswers: ['A Globe', 'A Painting', 'A Dream'],
          explanation: 'A map shows cities, mountains, and water bodies but doesn\'t contain the actual physical things.',
          points
        },
        {
          question: 'What can travel around the world while staying in a corner?',
          correctAnswer: 'A Stamp',
          incorrectAnswers: ['A Spider', 'Wind', 'A Shadow'],
          explanation: 'A postage stamp stays in the corner of an envelope but travels around the world with mail.',
          points
        },
        {
          question: 'What has a head and a tail but no body?',
          correctAnswer: 'A Coin',
          incorrectAnswers: ['A Snake', 'A Comet', 'A Pin'],
          explanation: 'A coin has a heads side and a tails side but no body in between.',
          points
        }
      ],
      'Science & Technology': [
        {
          question: 'What is the chemical symbol for water?',
          correctAnswer: 'H2O',
          incorrectAnswers: ['CO2', 'O2', 'H2SO4'],
          explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.',
          points
        },
        {
          question: 'What is the speed of light?',
          correctAnswer: '299,792 km/s',
          incorrectAnswers: ['150,000 km/s', '400,000 km/s', '200,000 km/s'],
          explanation: 'Light travels at approximately 299,792 kilometers per second in a vacuum.',
          points
        },
        {
          question: 'Who invented the telephone?',
          correctAnswer: 'Alexander Graham Bell',
          incorrectAnswers: ['Thomas Edison', 'Nikola Tesla', 'Benjamin Franklin'],
          explanation: 'Alexander Graham Bell patented the telephone in 1876.',
          points
        },
        {
          question: 'What is the largest organ in the human body?',
          correctAnswer: 'Skin',
          incorrectAnswers: ['Liver', 'Heart', 'Brain'],
          explanation: 'The skin is the largest organ, covering about 2 square meters.',
          points
        },
        {
          question: 'What does DNA stand for?',
          correctAnswer: 'Deoxyribonucleic Acid',
          incorrectAnswers: ['Dinitrogen Acid', 'Double Nucleic Acid', 'Dynamic Nuclear Acid'],
          explanation: 'DNA carries genetic instructions for all living organisms.',
          points
        },
        {
          question: 'At what temperature does water boil at sea level?',
          correctAnswer: '100°C',
          incorrectAnswers: ['90°C', '110°C', '120°C'],
          explanation: 'Water boils at 100°C (212°F) at standard atmospheric pressure.',
          points
        }
      ],
      'History & Geography': [
        {
          question: 'In what year did World War II end?',
          correctAnswer: '1945',
          incorrectAnswers: ['1944', '1946', '1943'],
          explanation: 'World War II ended in 1945 with the surrender of Japan.',
          points
        },
        {
          question: 'What is the longest river in the world?',
          correctAnswer: 'Nile River',
          incorrectAnswers: ['Amazon River', 'Yangtze River', 'Mississippi River'],
          explanation: 'The Nile River is approximately 6,650 kilometers long.',
          points
        },
        {
          question: 'Who was the first President of the United States?',
          correctAnswer: 'George Washington',
          incorrectAnswers: ['Thomas Jefferson', 'John Adams', 'Benjamin Franklin'],
          explanation: 'George Washington served as president from 1789 to 1797.',
          points
        },
        {
          question: 'What is the highest mountain in the world?',
          correctAnswer: 'Mount Everest',
          incorrectAnswers: ['K2', 'Kilimanjaro', 'Denali'],
          explanation: 'Mount Everest stands at 8,849 meters above sea level.',
          points
        },
        {
          question: 'Which ancient wonder is still standing today?',
          correctAnswer: 'Great Pyramid of Giza',
          incorrectAnswers: ['Hanging Gardens', 'Colossus of Rhodes', 'Lighthouse of Alexandria'],
          explanation: 'The Great Pyramid is the oldest and only surviving ancient wonder.',
          points
        },
        {
          question: 'What year did the Berlin Wall fall?',
          correctAnswer: '1989',
          incorrectAnswers: ['1987', '1991', '1985'],
          explanation: 'The Berlin Wall fell on November 9, 1989.',
          points
        }
      ],
      'Entertainment': [
        {
          question: 'Who painted the Mona Lisa?',
          correctAnswer: 'Leonardo da Vinci',
          incorrectAnswers: ['Michelangelo', 'Raphael', 'Donatello'],
          explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 1500s.',
          points
        },
        {
          question: 'How many strings does a standard guitar have?',
          correctAnswer: '6',
          incorrectAnswers: ['5', '7', '8'],
          explanation: 'A standard guitar has six strings tuned to E, A, D, G, B, E.',
          points
        },
        {
          question: 'What is the highest-grossing film of all time?',
          correctAnswer: 'Avatar',
          incorrectAnswers: ['Avengers: Endgame', 'Titanic', 'Star Wars'],
          explanation: 'Avatar has grossed over $2.9 billion worldwide.',
          points
        },
        {
          question: 'Who wrote "Romeo and Juliet"?',
          correctAnswer: 'William Shakespeare',
          incorrectAnswers: ['Charles Dickens', 'Jane Austen', 'Mark Twain'],
          explanation: 'Shakespeare wrote this tragedy in the 1590s.',
          points
        },
        {
          question: 'How many keys does a standard piano have?',
          correctAnswer: '88',
          incorrectAnswers: ['76', '100', '61'],
          explanation: 'A standard piano has 88 keys (52 white and 36 black).',
          points
        },
        {
          question: 'What is the longest-running TV show?',
          correctAnswer: 'The Simpsons',
          incorrectAnswers: ['Friends', 'Seinfeld', 'The Office'],
          explanation: 'The Simpsons has been on air since 1989.',
          points
        }
      ],
      'Sports & Games': [
        {
          question: 'How many players are on a soccer team?',
          correctAnswer: '11',
          incorrectAnswers: ['10', '12', '9'],
          explanation: 'Each soccer team has 11 players on the field at a time.',
          points
        },
        {
          question: 'What sport is played at Wimbledon?',
          correctAnswer: 'Tennis',
          incorrectAnswers: ['Cricket', 'Golf', 'Badminton'],
          explanation: 'Wimbledon is the oldest tennis tournament in the world.',
          points
        },
        {
          question: 'How many points is a touchdown worth in American football?',
          correctAnswer: '6',
          incorrectAnswers: ['7', '5', '8'],
          explanation: 'A touchdown is worth 6 points, with an extra point conversion available.',
          points
        },
        {
          question: 'In which sport would you perform a slam dunk?',
          correctAnswer: 'Basketball',
          incorrectAnswers: ['Volleyball', 'Tennis', 'Handball'],
          explanation: 'A slam dunk is when a player jumps and scores by forcing the ball through the hoop.',
          points
        },
        {
          question: 'How many pieces does each player start with in chess?',
          correctAnswer: '16',
          incorrectAnswers: ['12', '18', '14'],
          explanation: 'Each player starts with 16 pieces: 8 pawns, 2 rooks, 2 knights, 2 bishops, 1 queen, and 1 king.',
          points
        },
        {
          question: 'What color is the center of an archery target?',
          correctAnswer: 'Gold/Yellow',
          incorrectAnswers: ['Red', 'Blue', 'Black'],
          explanation: 'The bullseye of an archery target is gold or yellow.',
          points
        }
      ],
      'Arts & Literature': [
        {
          question: 'Who wrote "Harry Potter"?',
          correctAnswer: 'J.K. Rowling',
          incorrectAnswers: ['J.R.R. Tolkien', 'C.S. Lewis', 'Roald Dahl'],
          explanation: 'J.K. Rowling wrote the Harry Potter series starting in 1997.',
          points
        },
        {
          question: 'What is the primary colors in painting?',
          correctAnswer: 'Red, Yellow, Blue',
          incorrectAnswers: ['Red, Green, Blue', 'Orange, Purple, Green', 'Black, White, Gray'],
          explanation: 'Primary colors cannot be created by mixing other colors.',
          points
        },
        {
          question: 'Who sculpted the statue of David?',
          correctAnswer: 'Michelangelo',
          incorrectAnswers: ['Leonardo da Vinci', 'Donatello', 'Raphael'],
          explanation: 'Michelangelo created this masterpiece between 1501 and 1504.',
          points
        },
        {
          question: 'What is a haiku?',
          correctAnswer: 'A Japanese poem with 5-7-5 syllables',
          incorrectAnswers: ['A Chinese painting style', 'A type of dance', 'A musical instrument'],
          explanation: 'Haiku is a traditional Japanese poem with three lines.',
          points
        },
        {
          question: 'Who painted "Starry Night"?',
          correctAnswer: 'Vincent van Gogh',
          incorrectAnswers: ['Pablo Picasso', 'Claude Monet', 'Salvador Dali'],
          explanation: 'Van Gogh painted this masterpiece in 1889.',
          points
        },
        {
          question: 'How many symphonies did Beethoven compose?',
          correctAnswer: '9',
          incorrectAnswers: ['7', '11', '5'],
          explanation: 'Beethoven completed nine symphonies during his lifetime.',
          points
        }
      ]
    };

    return fallbackQuestions[category] || fallbackQuestions['General Knowledge'];
  }
}

