import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TriviaService } from '../../services/trivia.service';
import { TriviaResults } from '../../models/trivia.model';

@Component({
  selector: 'app-trivia-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trivia-results.component.html',
  styleUrl: './trivia-results.component.scss'
})
export class TriviaResultsComponent implements OnInit {
  results!: TriviaResults;

  constructor(
    public triviaService: TriviaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.results = this.triviaService.getResults();
    
    if (!this.results.totalQuestions) {
      this.router.navigate(['/trivia']);
    }
  }

  getPerformanceMessage(): string {
    const percentage = this.results.percentage;
    if (percentage === 100) return '🏆 Perfect Score! Outstanding!';
    if (percentage >= 80) return '🌟 Excellent! Great work!';
    if (percentage >= 60) return '👍 Good job! Well done!';
    if (percentage >= 40) return '📚 Nice try! Keep learning!';
    return '💪 Keep practicing!';
  }

  getPerformanceClass(): string {
    const percentage = this.results.percentage;
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
  }

  getDifficultyBadgeColor(): string {
    const colors: { [key: string]: string } = {
      simple: '#4ade80',
      medium: '#fb923c',
      hard: '#ef4444'
    };
    return colors[this.results.difficulty] || '#666';
  }

  playAgain(): void {
    this.triviaService.resetTrivia();
    this.router.navigate(['/trivia']);
  }

  goHome(): void {
    this.triviaService.resetTrivia();
    this.router.navigate(['/']);
  }
}

