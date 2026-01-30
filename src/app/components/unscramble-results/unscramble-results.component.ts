import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnscrambleService } from '../../services/unscramble.service';
import { UnscrambleResults } from '../../models/unscramble.model';

@Component({
  selector: 'app-unscramble-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unscramble-results.component.html',
  styleUrl: './unscramble-results.component.scss'
})
export class UnscrambleResultsComponent implements OnInit {
  results!: UnscrambleResults;

  constructor(
    public unscrambleService: UnscrambleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.results = this.unscrambleService.getResults();

    if (!this.results.totalWords) {
      this.router.navigate(['/']);
    }
  }

  getPerformanceMessage(): string {
    const percentage = this.results.percentage;
    if (percentage === 100) return 'Perfect! You unscrambled every word!';
    if (percentage >= 80) return 'Excellent! Great word skills!';
    if (percentage >= 60) return 'Good job! Well done!';
    if (percentage >= 40) return 'Nice try! Keep practicing!';
    return 'Keep practicing!';
  }

  getPerformanceClass(): string {
    const percentage = this.results.percentage;
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
  }

  playAgain(): void {
    this.unscrambleService.resetGame();
    this.router.navigate(['/unscramble']);
  }

  goHome(): void {
    this.unscrambleService.resetGame();
    this.router.navigate(['/']);
  }
}
