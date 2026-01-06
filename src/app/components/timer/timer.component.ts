import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss'
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() duration = 30;
  @Input() isActive = true;
  @Output() timeUp = new EventEmitter<void>();

  timeLeft = signal<number>(30);
  private intervalId: any;

  ngOnInit(): void {
    this.reset();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  reset(): void {
    this.clearTimer();
    this.timeLeft.set(this.duration);
    if (this.isActive) {
      this.startTimer();
    }
  }

  private startTimer(): void {
    this.intervalId = setInterval(() => {
      const current = this.timeLeft();
      if (current <= 1) {
        this.timeLeft.set(0);
        this.clearTimer();
        this.timeUp.emit();
      } else {
        this.timeLeft.update(t => t - 1);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    this.clearTimer();
  }

  resume(): void {
    if (!this.intervalId && this.timeLeft() > 0) {
      this.startTimer();
    }
  }

  getProgressPercent(): number {
    return (this.timeLeft() / this.duration) * 100;
  }

  isLowTime(): boolean {
    return this.timeLeft() <= 10;
  }
}
