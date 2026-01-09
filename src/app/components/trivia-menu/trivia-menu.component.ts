import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TriviaService } from '../../services/trivia.service';
import { TRIVIA_CATEGORIES, DIFFICULTY_LEVELS, DifficultyLevel } from '../../models/trivia.model';

@Component({
  selector: 'app-trivia-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trivia-menu.component.html',
  styleUrl: './trivia-menu.component.scss'
})
export class TriviaMenuComponent {
  categories = TRIVIA_CATEGORIES;
  difficulties = DIFFICULTY_LEVELS;
  
  selectedCategory = signal<string>('');
  selectedDifficulty = signal<DifficultyLevel>('medium');
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  constructor(
    private triviaService: TriviaService,
    private router: Router
  ) {}

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  selectDifficulty(difficulty: DifficultyLevel): void {
    this.selectedDifficulty.set(difficulty);
  }

  getDifficultyColor(difficulty: DifficultyLevel): string {
    const colors: { [key: string]: string } = {
      simple: '#4ade80',
      medium: '#fb923c',
      hard: '#ef4444'
    };
    return colors[difficulty] || '#666';
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

    this.triviaService.generateTrivia(category, difficulty).subscribe({
      next: (questions) => {
        this.triviaService.startTrivia(category, difficulty, questions);
        this.isLoading.set(false);
        this.router.navigate(['/trivia/game']);
      },
      error: (err) => {
        this.error.set('Failed to generate riddles. Please try again.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

