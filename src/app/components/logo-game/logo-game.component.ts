import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LogoService } from '../../services/logo.service';

@Component({
  selector: 'app-logo-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logo-game.component.html',
  styleUrl: './logo-game.component.scss'
})
export class LogoGameComponent implements OnInit, OnDestroy {
  userAnswer = signal<string>('');
  timeRemaining = signal<number>(30);
  currentPoints = signal<number>(100);
  showFeedback = signal<boolean>(false);
  isCorrect = signal<boolean>(false);
  pointsEarned = signal<number>(0);
  
  private timerInterval: any;
  private startTime: number = 0;

  constructor(
    public logoService: LogoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const state = this.logoService.logoState();
    if (!state.logos.length) {
      this.router.navigate(['/logo-game']);
      return;
    }
    
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.startTime = Date.now();
    this.timeRemaining.set(30);
    this.currentPoints.set(100);
    
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      this.timeRemaining.set(remaining);
      
      // Calculate current points (every 5 seconds = -10 points)
      const timeSlots = Math.floor(elapsed / 5);
      const points = Math.max(0, 100 - (timeSlots * 10));
      this.currentPoints.set(points);
      
      if (remaining === 0) {
        this.handleTimeout();
      }
    }, 100); // Update more frequently for smooth countdown
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeout(): void {
    this.clearTimer();
    const timeElapsed = 30;
    const result = this.logoService.checkAnswer('', timeElapsed);
    
    this.isCorrect.set(false);
    this.pointsEarned.set(0);
    this.showFeedback.set(true);
  }

  submitAnswer(): void {
    const answer = this.userAnswer().trim();
    if (!answer || this.showFeedback()) return;
    
    this.clearTimer();
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const result = this.logoService.checkAnswer(answer, timeElapsed);
    
    this.isCorrect.set(result.isCorrect);
    this.pointsEarned.set(result.pointsEarned);
    this.showFeedback.set(true);
  }

  nextLogo(): void {
    if (this.logoService.isLastLogo()) {
      this.router.navigate(['/logo-game/results']);
    } else {
      this.logoService.nextLogo();
      this.userAnswer.set('');
      this.showFeedback.set(false);
      this.isCorrect.set(false);
      this.pointsEarned.set(0);
      this.startTimer();
    }
  }

  onAnswerInput(value: string): void {
    if (!this.showFeedback()) {
      this.userAnswer.set(value);
    }
  }

  canSubmit(): boolean {
    return this.userAnswer().trim().length > 0 && !this.showFeedback();
  }

  getButtonText(): string {
    return this.logoService.isLastLogo() ? 'See Results' : 'Next Logo';
  }

  getProgressPercentage(): number {
    return (this.timeRemaining() / 30) * 100;
  }
}

