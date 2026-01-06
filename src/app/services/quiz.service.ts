import { Injectable, signal, computed } from '@angular/core';
import { Question, QuizState } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private state = signal<QuizState>({
    theme: '',
    questions: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    isSubmitted: false
  });

  readonly quizState = this.state.asReadonly();

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

  readonly finalScore = computed(() => {
    const s = this.state();
    return {
      score: s.score,
      total: s.questions.length,
      percentage: s.questions.length > 0
        ? Math.round((s.score / s.questions.length) * 100)
        : 0
    };
  });

  startQuiz(theme: string, questions: Question[]): void {
    this.state.set({
      theme,
      questions,
      currentIndex: 0,
      score: 0,
      answers: new Array(questions.length).fill(null),
      isSubmitted: false
    });
  }

  selectAnswer(answerIndex: number): void {
    const s = this.state();
    const newAnswers = [...s.answers];
    newAnswers[s.currentIndex] = answerIndex;
    this.state.update(state => ({
      ...state,
      answers: newAnswers
    }));
  }

  submitAnswer(): boolean {
    const s = this.state();
    const currentAnswer = s.answers[s.currentIndex];
    const correctAnswer = s.questions[s.currentIndex]?.correctAnswer;
    const isCorrect = currentAnswer === correctAnswer;

    this.state.update(state => ({
      ...state,
      score: isCorrect ? state.score + 1 : state.score,
      isSubmitted: true
    }));

    return isCorrect;
  }

  nextQuestion(): void {
    this.state.update(state => ({
      ...state,
      currentIndex: state.currentIndex + 1,
      isSubmitted: false
    }));
  }

  getCurrentAnswer(): number | null {
    const s = this.state();
    return s.answers[s.currentIndex];
  }

  isAnswerSubmitted(): boolean {
    return this.state().isSubmitted;
  }

  getQuizResults(): { question: Question; userAnswer: number | null; isCorrect: boolean }[] {
    const s = this.state();
    return s.questions.map((question, index) => ({
      question,
      userAnswer: s.answers[index],
      isCorrect: s.answers[index] === question.correctAnswer
    }));
  }

  resetQuiz(): void {
    this.state.set({
      theme: '',
      questions: [],
      currentIndex: 0,
      score: 0,
      answers: [],
      isSubmitted: false
    });
  }
}
