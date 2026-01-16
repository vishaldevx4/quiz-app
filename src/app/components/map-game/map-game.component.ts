import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MapService } from '../../services/map.service';
import { MAP_DIFFICULTIES, GameDifficulty } from '../../models/map.model';

@Component({
  selector: 'app-map-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-game.component.html',
  styleUrl: './map-game.component.scss'
})
export class MapGameComponent implements OnInit, OnDestroy {
  mapSvg = signal<SafeHtml>('');
  timeRemaining = signal<number>(30);
  showFeedback = signal<boolean>(false);
  isCorrect = signal<boolean>(false);
  clickedCountryName = signal<string>('');
  pointsEarned = signal<number>(0);
  difficulties = MAP_DIFFICULTIES;

  private timerInterval: any;
  private questionStartTime: number = 0;

  constructor(
    public mapService: MapService,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit(): Promise<void> {
    const state = this.mapService.mapState();
    if (!state.countries.length) {
      this.router.navigate(['/map-quest']);
      return;
    }

    await this.loadMap();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private async loadMap(): Promise<void> {
    try {
      const svgText = await firstValueFrom(
        this.http.get('assets/map-game/world-map.svg', { responseType: 'text' })
      );

      this.mapSvg.set(this.sanitizer.bypassSecurityTrustHtml(svgText));
      console.log('Map SVG loaded, attaching click listeners...');
      
      // Add click listeners after DOM is updated with longer delay
      setTimeout(() => {
        this.attachClickListeners();
        console.log('Click listeners attached');
      }, 200);
    } catch (error) {
      console.error('Failed to load map:', error);
    }
  }

  private attachClickListeners(): void {
    const paths = document.querySelectorAll('.fullscreen-map svg path');
    console.log('Attaching click listeners to', paths.length, 'country paths');
    
    // Log first few paths for debugging
    if (paths.length > 0) {
      const samplePath = paths[0];
      console.log('Sample path attributes:', {
        id: samplePath.getAttribute('id'),
        name: samplePath.getAttribute('name'),
        class: samplePath.getAttribute('class')
      });
    }
    
    paths.forEach(path => {
      path.addEventListener('click', (event) => {
        const id = path.getAttribute('id');
        const name = path.getAttribute('name');
        const cls = path.getAttribute('class');
        console.log('Country clicked - ID:', id, 'Name:', name, 'Class:', cls);
        this.onCountryClick(event as MouseEvent);
      });
    });
  }

  private startTimer(): void {
    this.clearTimer();
    this.questionStartTime = Date.now();
    const config = this.mapService.mapState().config;

    if (config.mode === 'timed') {
      this.timeRemaining.set(30);

      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        this.timeRemaining.set(remaining);

        if (remaining === 0) {
          this.handleTimeout();
        }
      }, 100);
    } else {
      this.timeRemaining.set(0);
    }
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeout(): void {
    this.clearTimer();
    const timeElapsed = 30;
    const currentCountry = this.mapService.currentCountry();

    if (currentCountry) {
      const result = this.mapService.checkAnswer('', timeElapsed);
      this.isCorrect.set(false);
      this.clickedCountryName.set('Time\'s up!');
      this.pointsEarned.set(0);
      this.showFeedback.set(true);

      // Highlight correct country
      this.highlightCountry(currentCountry.code, 'correct');
    }
  }

  onCountryClick(event: MouseEvent): void {
    if (this.showFeedback()) return;

    const target = event.target as SVGElement;
    
    // Try multiple ways to identify the clicked country
    let clickedCode = target.getAttribute('id');
    
    // If no ID, try to find by name attribute
    if (!clickedCode) {
      const nameAttr = target.getAttribute('name');
      if (nameAttr) {
        // Try to find a matching country by name
        const allCountries = Object.values(this.mapService['allCountries']());
        const matchedCountry = allCountries.find(c => 
          this.normalizeText(c.name) === this.normalizeText(nameAttr) ||
          this.normalizeText(c.fullName) === this.normalizeText(nameAttr)
        );
        if (matchedCountry) {
          clickedCode = matchedCountry.code;
        }
      }
    }
    
    // If still no code, try class attribute
    if (!clickedCode) {
      const classAttr = target.getAttribute('class');
      if (classAttr) {
        const classes = classAttr.split(/\s+/);
        const allCountries = Object.values(this.mapService['allCountries']());
        const matchedCountry = allCountries.find(c => 
          classes.some(cls => 
            this.normalizeText(cls) === this.normalizeText(c.name) ||
            this.normalizeText(cls) === this.normalizeText(c.code)
          )
        );
        if (matchedCountry) {
          clickedCode = matchedCountry.code;
        }
      }
    }

    console.log('Identified country code:', clickedCode);
    
    if (!clickedCode) {
      console.warn('Could not identify clicked country', {
        id: target.getAttribute('id'),
        name: target.getAttribute('name'),
        class: target.getAttribute('class')
      });
      return;
    }

    this.clearTimer();
    const timeElapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
    const result = this.mapService.checkAnswer(clickedCode, timeElapsed);

    const clickedCountry = this.mapService.getCountryByCode(clickedCode);
    this.isCorrect.set(result.isCorrect);
    this.clickedCountryName.set(clickedCountry?.name || clickedCode);
    this.pointsEarned.set(result.pointsEarned);
    this.showFeedback.set(true);

    // Highlight countries immediately
    if (result.isCorrect) {
      this.highlightCountry(clickedCode, 'correct');
    } else {
      // For wrong answers, always highlight the correct country in green
      this.highlightCountry(result.correctCountry.code, 'correct');
    }
  }

  private highlightCountry(code: string, className: 'correct' | 'wrong'): void {
    console.log(`Attempting to highlight country: ${code} with class: ${className}`);
    
    // Clear any existing highlights first
    this.clearHighlights();
    
    setTimeout(() => {
      const matchedPaths: Element[] = [];
      const escapedCode = this.escapeSelector(code);

      // Try 1: Find by ID
      if (escapedCode) {
        const byId = document.querySelector(`.fullscreen-map svg #${escapedCode}`);
        if (byId) {
          console.log(`Found country by ID: ${code}`);
          matchedPaths.push(byId);
        }
      }

      // Try 2: Find by name or class attribute
      if (matchedPaths.length === 0) {
        const country = this.mapService.getCountryByCode(code);
        console.log(`Looking for country: ${country?.name} (${country?.fullName})`);
        
        const targetNames = [
          this.normalizeText(country?.name || ''),
          this.normalizeText(country?.fullName || '')
        ].filter(Boolean);

        const allPaths = document.querySelectorAll('.fullscreen-map svg path');
        console.log(`Searching through ${allPaths.length} paths`);
        
        allPaths.forEach((path) => {
          const nameAttr = this.normalizeText(path.getAttribute('name') || '');
          const idAttr = path.getAttribute('id') || '';
          
          if (nameAttr && targetNames.includes(nameAttr)) {
            console.log(`Found by name attribute: ${nameAttr}`);
            matchedPaths.push(path);
            return;
          }

          if (idAttr === code) {
            console.log(`Found by direct ID match: ${code}`);
            matchedPaths.push(path);
            return;
          }

          const classAttr = path.getAttribute('class') || '';
          if (classAttr) {
            const classMatches = classAttr
              .split(/\s+/)
              .map(c => this.normalizeText(c))
              .some(c => targetNames.includes(c));
            if (classMatches) {
              console.log(`Found by class attribute: ${classAttr}`);
              matchedPaths.push(path);
            }
          }
        });
      }

      if (matchedPaths.length > 0) {
        console.log(`Highlighting ${matchedPaths.length} paths with ${className}`);
        matchedPaths.forEach((path) => {
          path.classList.remove('correct', 'wrong'); // Remove any existing classes
          path.classList.add(className);
        });
      } else {
        console.error(`Could not find country with code: ${code}`);
      }
    }, 100);
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private escapeSelector(value: string): string | null {
    try {
      return CSS.escape(value);
    } catch {
      return null;
    }
  }

  private clearHighlights(): void {
    const paths = document.querySelectorAll('.fullscreen-map svg path');
    let cleared = 0;
    paths.forEach(path => {
      if (path.classList.contains('correct') || path.classList.contains('wrong')) {
        path.classList.remove('correct', 'wrong');
        cleared++;
      }
    });
    if (cleared > 0) {
      console.log(`Cleared highlights from ${cleared} paths`);
    }
  }

  nextCountry(): void {
    this.clearHighlights();

    if (this.mapService.isLastCountry()) {
      this.router.navigate(['/map-quest/results']);
    } else {
      this.mapService.nextCountry();
      // Reset state for next question
      this.showFeedback.set(false);
      this.isCorrect.set(false);
      this.clickedCountryName.set('');
      this.pointsEarned.set(0);
      this.startTimer();
    }
  }

  getButtonText(): string {
    return this.mapService.isLastCountry() ? 'See Results' : 'Next Country';
  }

  getTimerPercentage(): number {
    return (this.timeRemaining() / 30) * 100;
  }

  isTimedMode(): boolean {
    return this.mapService.mapState().config.mode === 'timed';
  }

  async selectDifficulty(difficulty: GameDifficulty): Promise<void> {
    const current = this.mapService.mapState().config;
    if (current.difficulty === difficulty) return;

    this.clearHighlights();
    await this.mapService.startGame({
      ...current,
      difficulty
    });

    this.showFeedback.set(false);
    this.isCorrect.set(false);
    this.clickedCountryName.set('');
    this.pointsEarned.set(0);
    this.startTimer();
  }
}

