import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapService } from '../../services/map.service';
import { MapResults } from '../../models/map.model';

@Component({
  selector: 'app-map-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-results.component.html',
  styleUrl: './map-results.component.scss'
})
export class MapResultsComponent implements OnInit {
  results!: MapResults;

  constructor(
    public mapService: MapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.results = this.mapService.getResults();

    if (this.results.totalCount === 0) {
      this.router.navigate(['/map-quest']);
    }
  }

  getPerformanceMessage(): string {
    const percentage = this.results.percentage;
    if (percentage === 100) return '🌍 Geography Master! Perfect Score!';
    if (percentage >= 80) return '⭐ Excellent! You know your world!';
    if (percentage >= 60) return '👍 Good Job! Keep exploring!';
    if (percentage >= 40) return '📚 Not bad! Study more maps!';
    return '💪 Keep learning! Geography is fun!';
  }

  getPerformanceClass(): string {
    const percentage = this.results.percentage;
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
  }

  playAgain(): void {
    this.mapService.resetGame();
    this.router.navigate(['/map-quest']);
  }

  goHome(): void {
    this.mapService.resetGame();
    this.router.navigate(['/']);
  }

  formatTime(seconds: number): string {
    return `${seconds.toFixed(1)}s`;
  }

  getModeLabel(): string {
    const mode = this.results.config.mode;
    if (mode === 'classic') return 'Classic';
    if (mode === 'timed') return 'Time Trial';
    if (mode === 'regional') return 'Regional Focus';
    return mode;
  }

  getDifficultyLabel(): string {
    const diff = this.results.config.difficulty;
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  }

}

