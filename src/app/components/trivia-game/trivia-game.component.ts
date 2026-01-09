import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TriviaService } from '../../services/trivia.service';

@Component({
  selector: 'app-trivia-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trivia-game.component.html',
  styleUrl: './trivia-game.component.scss'
})
export class TriviaGameComponent implements OnInit {
  selectedAnswer = signal<string | null>(null);
  showResult = signal<boolean>(false);
  isCorrect = signal<boolean>(false);
  pointsEarned = signal<number>(0);

  constructor(
    public triviaService: TriviaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const state = this.triviaService.triviaState();
    if (!state.questions.length) {
      this.router.navigate(['/trivia']);
    }
  }

  selectAnswer(answer: string): void {
    if (this.showResult()) return;
    this.selectedAnswer.set(answer);
  }

  submitAnswer(): void {
    const answer = this.selectedAnswer();
    if (!answer || this.showResult()) return;

    this.triviaService.selectAnswer(answer);
    const result = this.triviaService.submitAnswer();
    
    this.isCorrect.set(result.isCorrect);
    this.pointsEarned.set(result.pointsEarned);
    this.showResult.set(true);
  }

  nextQuestion(): void {
    if (this.triviaService.isLastQuestion()) {
      this.router.navigate(['/trivia/results']);
    } else {
      this.triviaService.nextQuestion();
      this.selectedAnswer.set(null);
      this.showResult.set(false);
      this.isCorrect.set(false);
      this.pointsEarned.set(0);
    }
  }

  isAnswerCorrect(answer: string): boolean {
    if (!this.showResult()) return false;
    const question = this.triviaService.currentQuestion();
    return answer === question?.correctAnswer;
  }

  isAnswerWrong(answer: string): boolean {
    if (!this.showResult()) return false;
    return this.selectedAnswer() === answer && !this.isAnswerCorrect(answer);
  }

  canSubmit(): boolean {
    return !!this.selectedAnswer() && !this.showResult();
  }

  getButtonText(): string {
    return this.triviaService.isLastQuestion() ? 'See Results' : 'Next Question';
  }

  getDifficultyBadgeColor(): string {
    const difficulty = this.triviaService.triviaState().difficulty;
    const colors: { [key: string]: string } = {
      simple: '#4ade80',
      medium: '#fb923c',
      hard: '#ef4444'
    };
    return colors[difficulty] || '#666';
  }
}

