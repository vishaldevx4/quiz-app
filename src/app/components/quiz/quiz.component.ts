import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuestionComponent } from '../question/question.component';
import { TimerComponent } from '../timer/timer.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, QuestionComponent, TimerComponent, ProgressBarComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent implements OnInit {
  @ViewChild(TimerComponent) timerComponent!: TimerComponent;

  constructor(
    public quizService: QuizService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.quizService.currentQuestion()) {
      this.router.navigate(['/']);
    }
  }

  onAnswerSelected(index: number): void {
    this.quizService.selectAnswer(index);
  }

  onSubmit(): void {
    if (this.quizService.getCurrentAnswer() === null) return;

    this.timerComponent?.pause();
    this.quizService.submitAnswer();
  }

  onTimeUp(): void {
    if (!this.quizService.isAnswerSubmitted()) {
      this.quizService.submitAnswer();
    }
  }

  onNext(): void {
    if (this.quizService.isLastQuestion()) {
      this.router.navigate(['/results']);
    } else {
      this.quizService.nextQuestion();
      this.timerComponent?.reset();
    }
  }

  canSubmit(): boolean {
    return this.quizService.getCurrentAnswer() !== null && !this.quizService.isAnswerSubmitted();
  }

  getButtonText(): string {
    if (this.quizService.isLastQuestion()) {
      return 'See Results';
    }
    return 'Next Question';
  }
}
