import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoService } from '../../services/logo.service';
import { LOGO_GAME_OPTIONS } from '../../models/logo.model';

@Component({
  selector: 'app-logo-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-menu.component.html',
  styleUrl: './logo-menu.component.scss'
})
export class LogoMenuComponent {
  gameOptions = LOGO_GAME_OPTIONS;

  constructor(
    private logoService: LogoService,
    private router: Router
  ) {}

  startGame(logoCount: number): void {
    this.logoService.startGame(logoCount);
    this.router.navigate(['/logo-game/play']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

