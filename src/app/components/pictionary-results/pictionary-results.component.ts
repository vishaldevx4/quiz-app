import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PictionaryService } from '../../services/pictionary.service';
import { PictionaryResults } from '../../models/pictionary.model';

@Component({
  selector: 'app-pictionary-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pictionary-results.component.html',
  styleUrl: './pictionary-results.component.scss'
})
export class PictionaryResultsComponent implements OnInit {
  results!: PictionaryResults;

  constructor(
    public pictionaryService: PictionaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.results = this.pictionaryService.getResults();
    const state = this.pictionaryService.pictionaryState();
    
    if (!state.drawing) {
      this.router.navigate(['/pictionary']);
    }
  }

  getResultMessage(): string {
    if (this.results.foundCorrectAnswer) {
      if (this.results.revealedStrokes <= 3) return '🌟 Amazing! You guessed with very few clues!';
      if (this.results.revealedStrokes <= 6) return '🎉 Great job! You guessed it quickly!';
      return '✅ Well done! You got it!';
    }
    return '😔 Better luck next time!';
  }

  getScoreColor(): string {
    if (this.results.score >= 800) return 'gold';
    if (this.results.score >= 500) return 'silver';
    if (this.results.score >= 200) return 'bronze';
    return 'default';
  }

  playAgain(): void {
    this.pictionaryService.resetGame();
    this.router.navigate(['/pictionary']);
  }

  goHome(): void {
    this.pictionaryService.resetGame();
    this.router.navigate(['/']);
  }

  getAllStrokes() {
    return this.pictionaryService.pictionaryState().drawing?.strokes || [];
  }
}

