import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Question } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = '/api/generate-questions';

  constructor(private http: HttpClient) {}

  generateQuestions(theme: string): Observable<Question[]> {
    return this.http.post<Question[]>(this.apiUrl, { theme }).pipe(
      catchError(error => {
        console.error('Error generating questions:', error);
        return of(this.getFallbackQuestions(theme));
      })
    );
  }

  private getFallbackQuestions(theme: string): Question[] {
    return [
      {
        question: `What is a common topic related to ${theme}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0
      },
      {
        question: `Which of these is associated with ${theme}?`,
        options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
        correctAnswer: 1
      },
      {
        question: `What fact about ${theme} is true?`,
        options: ['Fact A', 'Fact B', 'Fact C', 'Fact D'],
        correctAnswer: 2
      },
      {
        question: `In ${theme}, what is important?`,
        options: ['Thing 1', 'Thing 2', 'Thing 3', 'Thing 4'],
        correctAnswer: 0
      },
      {
        question: `What relates to ${theme}?`,
        options: ['Item A', 'Item B', 'Item C', 'Item D'],
        correctAnswer: 3
      },
      {
        question: `Which is a ${theme} concept?`,
        options: ['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4'],
        correctAnswer: 1
      },
      {
        question: `What ${theme} fact do you know?`,
        options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
        correctAnswer: 0
      },
      {
        question: `In the field of ${theme}, what matters?`,
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 2
      },
      {
        question: `What is ${theme} known for?`,
        options: ['Feature A', 'Feature B', 'Feature C', 'Feature D'],
        correctAnswer: 1
      },
      {
        question: `Which ${theme} element is key?`,
        options: ['Element 1', 'Element 2', 'Element 3', 'Element 4'],
        correctAnswer: 3
      }
    ];
  }
}
