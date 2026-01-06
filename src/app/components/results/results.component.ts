import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { Question } from '../../models/quiz.model';

interface QuizResult {
  question: Question;
  userAnswer: number | null;
  isCorrect: boolean;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent implements OnInit {
  results: QuizResult[] = [];

  constructor(
    public quizService: QuizService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.results = this.quizService.getQuizResults();
    if (this.results.length === 0) {
      this.router.navigate(['/']);
    }
  }

  getScoreMessage(): string {
    const percentage = this.quizService.finalScore().percentage;
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 70) return 'Great job!';
    if (percentage >= 50) return 'Good effort!';
    return 'Keep practicing!';
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  playAgain(): void {
    this.quizService.resetQuiz();
    this.router.navigate(['/']);
  }
}
