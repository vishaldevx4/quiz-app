import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PictionaryService } from '../../services/pictionary.service';
import { PICTIONARY_CATEGORIES } from '../../models/pictionary.model';

@Component({
  selector: 'app-pictionary-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pictionary-menu.component.html',
  styleUrl: './pictionary-menu.component.scss'
})
export class PictionaryMenuComponent {
  categories = PICTIONARY_CATEGORIES;
  selectedCategory = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  constructor(
    private pictionaryService: PictionaryService,
    private router: Router
  ) {}

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  canStartGame(): boolean {
    return !!this.selectedCategory() && !this.isLoading();
  }

  startGame(): void {
    const category = this.selectedCategory();
    if (!category) return;

    this.isLoading.set(true);
    this.error.set('');

    this.pictionaryService.generateDrawing(category).subscribe({
      next: (drawing) => {
        this.pictionaryService.startGame(category, drawing);
        this.isLoading.set(false);
        this.router.navigate(['/pictionary/game']);
      },
      error: (err) => {
        this.error.set('Failed to generate drawing. Please try again.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

