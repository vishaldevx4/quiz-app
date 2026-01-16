import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapService } from '../../services/map.service';
import {
  MAP_GAME_MODES,
  MAP_DIFFICULTIES,
  MAP_REGIONS,
  GameMode,
  GameDifficulty,
  Region
} from '../../models/map.model';

@Component({
  selector: 'app-map-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-menu.component.html',
  styleUrl: './map-menu.component.scss'
})
export class MapMenuComponent {
  gameModes = MAP_GAME_MODES;
  difficulties = MAP_DIFFICULTIES;
  regions = MAP_REGIONS;

  selectedMode = signal<GameMode>('classic');
  selectedDifficulty = signal<GameDifficulty>('easy');
  selectedRegion = signal<Region>('all');

  constructor(
    private mapService: MapService,
    private router: Router
  ) {}

  selectMode(mode: GameMode): void {
    this.selectedMode.set(mode);
  }

  selectDifficulty(difficulty: GameDifficulty): void {
    this.selectedDifficulty.set(difficulty);
  }

  selectRegion(region: Region): void {
    this.selectedRegion.set(region);
  }

  getQuestionCount(): number {
    return 10;
  }

  async startGame(): Promise<void> {
    const config = {
      mode: this.selectedMode(),
      difficulty: this.selectedDifficulty(),
      region: this.selectedRegion(),
      questionCount: this.getQuestionCount()
    };

    await this.mapService.startGame(config);
    this.router.navigate(['/map-quest/play']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

