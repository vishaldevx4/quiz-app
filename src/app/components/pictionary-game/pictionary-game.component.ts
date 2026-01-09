import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PictionaryService } from '../../services/pictionary.service';

@Component({
  selector: 'app-pictionary-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pictionary-game.component.html',
  styleUrl: './pictionary-game.component.scss'
})
export class PictionaryGameComponent implements OnInit {
  currentGuess = signal<string>('');
  showFeedback = signal<boolean>(false);
  feedbackMessage = signal<string>('');
  feedbackType = signal<'correct' | 'incorrect'>('incorrect');

  constructor(
    public pictionaryService: PictionaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const state = this.pictionaryService.pictionaryState();
    if (!state.drawing) {
      this.router.navigate(['/pictionary']);
    }

    // Check if game is already complete
    if (state.gameComplete) {
      this.router.navigate(['/pictionary/results']);
    }
  }

  revealNextStroke(): void {
    this.pictionaryService.revealNextStroke();
    this.showFeedback.set(false);

    // Check if all strokes are revealed
    const state = this.pictionaryService.pictionaryState();
    if (state.drawing && state.revealedStrokes === state.drawing.strokes.length) {
      // Game over, show the word
      setTimeout(() => {
        this.router.navigate(['/pictionary/results']);
      }, 1500);
    }
  }

  submitGuess(): void {
    const guess = this.currentGuess().trim();
    if (!guess) return;

    const isCorrect = this.pictionaryService.submitGuess(guess);
    
    this.showFeedback.set(true);
    this.feedbackType.set(isCorrect ? 'correct' : 'incorrect');
    this.feedbackMessage.set(
      isCorrect 
        ? '🎉 Correct! Well done!' 
        : '❌ Not quite. Try again!'
    );

    if (isCorrect) {
      // Navigate to results after a short delay
      setTimeout(() => {
        this.router.navigate(['/pictionary/results']);
      }, 2000);
    } else {
      // Clear the input for next guess
      this.currentGuess.set('');
      
      // Hide feedback after 2 seconds
      setTimeout(() => {
        this.showFeedback.set(false);
      }, 2000);
    }
  }

  skipToResults(): void {
    this.pictionaryService.skipToResults();
    this.router.navigate(['/pictionary/results']);
  }

  canSubmitGuess(): boolean {
    const state = this.pictionaryService.pictionaryState();
    return this.currentGuess().trim().length > 0 && !state.gameComplete;
  }

  onGuessInput(value: string): void {
    this.currentGuess.set(value);
  }

  getStrokeButtonText(): string {
    const progress = this.pictionaryService.strokeProgress();
    return `Reveal Stroke (${progress.current}/${progress.total})`;
  }
}

