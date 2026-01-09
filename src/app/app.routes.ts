import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'quiz',
    loadComponent: () => import('./components/quiz/quiz.component').then(m => m.QuizComponent)
  },
  {
    path: 'results',
    loadComponent: () => import('./components/results/results.component').then(m => m.ResultsComponent)
  },
  {
    path: 'pictionary',
    loadComponent: () => import('./components/pictionary-menu/pictionary-menu.component').then(m => m.PictionaryMenuComponent)
  },
  {
    path: 'pictionary/game',
    loadComponent: () => import('./components/pictionary-game/pictionary-game.component').then(m => m.PictionaryGameComponent)
  },
  {
    path: 'pictionary/results',
    loadComponent: () => import('./components/pictionary-results/pictionary-results.component').then(m => m.PictionaryResultsComponent)
  },
  {
    path: 'trivia',
    loadComponent: () => import('./components/trivia-menu/trivia-menu.component').then(m => m.TriviaMenuComponent)
  },
  {
    path: 'trivia/game',
    loadComponent: () => import('./components/trivia-game/trivia-game.component').then(m => m.TriviaGameComponent)
  },
  {
    path: 'trivia/results',
    loadComponent: () => import('./components/trivia-results/trivia-results.component').then(m => m.TriviaResultsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
