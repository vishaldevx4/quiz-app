import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnscrambleService } from '../../services/unscramble.service';
import { UNSCRAMBLE_CATEGORIES, DIFFICULTY_LEVELS, DifficultyLevel } from '../../models/unscramble.model';

@Component({
  selector: 'app-unscramble-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unscramble-menu.component.html',
  styleUrl: './unscramble-menu.component.scss'
})
export class UnscrambleMenuComponent {
  categories = UNSCRAMBLE_CATEGORIES;
  difficultyLevels = DIFFICULTY_LEVELS;

  selectedCategory = signal<string>('');
  selectedDifficulty = signal<DifficultyLevel | ''>('');
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  constructor(
    private unscrambleService: UnscrambleService,
    private router: Router
  ) {}

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  selectDifficulty(difficulty: DifficultyLevel): void {
    this.selectedDifficulty.set(difficulty);
  }

  canStartGame(): boolean {
    return !!this.selectedCategory() && !!this.selectedDifficulty() && !this.isLoading();
  }

  startGame(): void {
    const category = this.selectedCategory();
    const difficulty = this.selectedDifficulty();

    if (!category || !difficulty) return;

    this.isLoading.set(true);
    this.error.set('');

    this.unscrambleService.generateWords(category, difficulty as DifficultyLevel).subscribe({
      next: (words) => {
        this.unscrambleService.startGame(category, difficulty as DifficultyLevel, words);
        this.isLoading.set(false);
        this.router.navigate(['/unscramble/game']);
      },
      error: (err) => {
        this.error.set('Failed to generate words. Please try again.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
