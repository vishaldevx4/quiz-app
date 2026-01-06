import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../models/quiz.model';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss'
})
export class QuestionComponent {
  @Input() question!: Question;
  @Input() selectedAnswer: number | null = null;
  @Input() isSubmitted = false;
  @Output() answerSelected = new EventEmitter<number>();

  selectOption(index: number): void {
    if (!this.isSubmitted) {
      this.answerSelected.emit(index);
    }
  }

  getOptionClass(index: number): string {
    if (!this.isSubmitted) {
      return this.selectedAnswer === index ? 'selected' : '';
    }

    if (index === this.question.correctAnswer) {
      return 'correct';
    }

    if (this.selectedAnswer === index && index !== this.question.correctAnswer) {
      return 'incorrect';
    }

    return 'disabled';
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
