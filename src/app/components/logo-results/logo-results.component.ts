import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoService } from '../../services/logo.service';
import { LogoResults } from '../../models/logo.model';

@Component({
  selector: 'app-logo-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-results.component.html',
  styleUrl: './logo-results.component.scss'
})
export class LogoResultsComponent implements OnInit {
  results!: LogoResults;

  constructor(
    public logoService: LogoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.results = this.logoService.getResults();
    
    if (this.results.totalCount === 0) {
      this.router.navigate(['/logo-game']);
    }
  }

  getPerformanceMessage(): string {
    const percentage = this.results.percentage;
    if (percentage === 100) return '🏆 Perfect Score! Logo Master!';
    if (percentage >= 80) return '⭐ Excellent! You know your brands!';
    if (percentage >= 60) return '👍 Good Job! Keep it up!';
    if (percentage >= 40) return '📚 Not bad! Room to improve!';
    return '💪 Keep practicing!';
  }

  getPerformanceClass(): string {
    const percentage = this.results.percentage;
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
  }

  playAgain(): void {
    this.logoService.resetGame();
    this.router.navigate(['/logo-game']);
  }

  goHome(): void {
    this.logoService.resetGame();
    this.router.navigate(['/']);
  }

  formatTime(seconds: number): string {
    return `${seconds.toFixed(1)}s`;
  }
}

