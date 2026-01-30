import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UnscrambleService } from '../../services/unscramble.service';

@Component({
  selector: 'app-unscramble-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unscramble-game.component.html',
  styleUrl: './unscramble-game.component.scss'
})
export class UnscrambleGameComponent implements OnInit, OnDestroy {
  userInput = signal<string>('');
  showResult = signal<boolean>(false);
  isCorrect = signal<boolean>(false);
  pointsEarned = signal<number>(0);
  currentTime = signal<number>(60);

  private timerInterval: any;
  private wordStartTime: number = 0;

  constructor(
    public unscrambleService: UnscrambleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const state = this.unscrambleService.unscrambleState();
    if (!state.words.length) {
      this.router.navigate(['/unscramble']);
      return;
    }

    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.wordStartTime = Date.now();
    this.currentTime.set(60);

    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.wordStartTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      this.currentTime.set(remaining);

      if (remaining === 0) {
        this.handleTimeout();
      }
    }, 100);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeout(): void {
    if (this.showResult()) return;

    this.clearTimer();
    this.unscrambleService.selectAnswer('');
    const timeSpent = 60;
    const result = this.unscrambleService.submitAnswer(timeSpent);

    this.isCorrect.set(false);
    this.pointsEarned.set(0);
    this.showResult.set(true);

    // Auto-advance after 2 seconds
    setTimeout(() => {
      this.nextWord();
    }, 2000);
  }

  onInputChange(value: string): void {
    if (!this.showResult()) {
      this.userInput.set(value);
    }
  }

  submitAnswer(): void {
    const answer = this.userInput().trim();
    if (!answer || this.showResult()) return;

    this.clearTimer();
    const timeSpent = (Date.now() - this.wordStartTime) / 1000;

    this.unscrambleService.selectAnswer(answer);
    const result = this.unscrambleService.submitAnswer(timeSpent);

    this.isCorrect.set(result.isCorrect);
    this.pointsEarned.set(result.pointsEarned);
    this.showResult.set(true);

    // Auto-advance after 2 seconds
    setTimeout(() => {
      this.nextWord();
    }, 2000);
  }

  nextWord(): void {
    if (this.unscrambleService.isLastWord()) {
      this.router.navigate(['/unscramble/results']);
    } else {
      this.unscrambleService.nextWord();
      this.userInput.set('');
      this.showResult.set(false);
      this.isCorrect.set(false);
      this.pointsEarned.set(0);
      this.startTimer();
    }
  }

  canSubmit(): boolean {
    return this.userInput().trim().length > 0 && !this.showResult();
  }

  getButtonText(): string {
    return this.unscrambleService.isLastWord() ? 'See Results' : 'Next Word';
  }

  getTimerClass(): string {
    return this.currentTime() <= 10 ? 'warning' : '';
  }
}
