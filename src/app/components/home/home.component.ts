import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService } from '../../services/ai.service';
import { QuizService } from '../../services/quiz.service';
import { PRESET_THEMES } from '../../models/quiz.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  presetThemes = PRESET_THEMES;
  selectedGame = signal<string>('');
  selectedTheme = signal<string>('');
  customTheme = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  constructor(
    private aiService: AiService,
    private quizService: QuizService,
    private router: Router
  ) {}

  async selectGame(game: string): Promise<void> {
    if (game === 'pictionary') {
      this.router.navigate(['/pictionary']);
    } else if (game === 'trivia') {
      this.router.navigate(['/trivia']);
    } else if (game === 'logo') {
      this.router.navigate(['/logo-game']);
    } else if (game === 'map') {
      this.router.navigate(['/map-quest']);
    } else {
      this.selectedGame.set(game);
    }
  }

  selectTheme(theme: string): void {
    this.selectedTheme.set(theme);
    this.customTheme.set('');
  }

  onCustomThemeChange(value: string): void {
    this.customTheme.set(value);
    if (value) {
      this.selectedTheme.set('');
    }
  }

  getActiveTheme(): string {
    return this.customTheme() || this.selectedTheme();
  }

  canStartQuiz(): boolean {
    return !!this.getActiveTheme() && !this.isLoading();
  }

  startQuiz(): void {
    const theme = this.getActiveTheme();
    if (!theme) return;

    this.isLoading.set(true);
    this.error.set('');

    this.aiService.generateQuestions(theme).subscribe({
      next: (questions) => {
        this.quizService.startQuiz(theme, questions);
        this.isLoading.set(false);
        this.router.navigate(['/quiz']);
      },
      error: (err) => {
        this.error.set('Failed to generate questions. Please try again.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }
}
