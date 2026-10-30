import {
  Component,
  signal,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import confetti from 'canvas-confetti';
import { ThemeService, THEMES } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-theme-switcher',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-3xl flex flex-col items-center transition-transform duration-300 pointer-events-auto"
      [class.translate-y-[calc(100%-2.2rem)]]="isCollapsed()"
    >
      <!-- Collapsible Tab Handle -->
      <button
        (click)="toggleCollapse()"
        class="mb-1 px-4 py-1 rounded-t-xl bg-slate-900/90 backdrop-blur-md border border-b-0 border-white/15 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
        [attr.aria-expanded]="!isCollapsed()"
        aria-label="Toggle Celebration Controls"
      >
        <mat-icon class="!w-3.5 !h-3.5 !text-sm text-amber-400">
          {{ isCollapsed() ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
        </mat-icon>
        <span>{{ isCollapsed() ? 'Show Party Controls & Colors' : 'Hide Controls' }}</span>
      </button>

      <!-- Main Glass Dock -->
      <div
        class="w-full rounded-2xl p-2.5 sm:p-3 bg-slate-900/90 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white"
        [style.borderColor]="themeService.currentTheme().cardBorder"
      >
        <!-- COLOR THEMES SELECTOR -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <span class="text-[11px] uppercase font-bold text-slate-400 hidden md:inline ml-1">Colors:</span>
          @for (th of themes; track th.id; let i = $index) {
            <button
              (click)="selectTheme(i)"
              [class.ring-2]="themeService.activeThemeIndex() === i"
              [class.ring-offset-2]="themeService.activeThemeIndex() === i"
              [class.ring-offset-slate-950]="themeService.activeThemeIndex() === i"
              [style.ringColor]="th.primary"
              class="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center p-0.5 transition-transform hover:scale-110 cursor-pointer overflow-hidden shadow"
              [title]="th.name + ' - ' + th.tagline"
              [attr.aria-label]="'Switch to theme: ' + th.name"
            >
              <div
                class="w-full h-full rounded-full flex items-center justify-center"
                [style.background]="'linear-gradient(135deg, ' + th.primary + ' 0%, ' + th.secondary + ' 50%, ' + th.accent + ' 100%)'"
              >
                @if (themeService.activeThemeIndex() === i) {
                  <mat-icon class="!w-3.5 !h-3.5 !text-sm text-slate-950 font-black">check</mat-icon>
                }
              </div>
            </button>
          }
        </div>

        <!-- PARTY CONFETTI ACTIONS -->
        <div class="flex items-center gap-1.5">
          <button
            (click)="triggerConfetti('rainbow')"
            class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer"
            title="Pop Rainbow Confetti"
          >
            <span class="text-sm">🎉</span>
            <span class="hidden sm:inline">Popper</span>
          </button>

          <button
            (click)="triggerConfetti('stars')"
            class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer"
            title="Golden Star Shower"
          >
            <span class="text-sm">✨</span>
            <span class="hidden sm:inline">Stars</span>
          </button>

          <button
            (click)="triggerConfetti('hearts')"
            class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer"
            title="Dosti Heart Shower"
          >
            <span class="text-sm">💖</span>
            <span class="hidden sm:inline">Hearts</span>
          </button>
        </div>

        <!-- SOUND & MUSIC TOGGLES -->
        <div class="flex items-center gap-1.5">
          <button
            (click)="soundService.playBirthdayFanfare()"
            class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105"
            [style.background]="themeService.currentTheme().primary"
            [style.color]="'#090a1a'"
            title="Play Birthday Melody"
          >
            <mat-icon class="!w-4 !h-4 !text-base" [class.animate-bounce]="soundService.isPlayingMusic()">music_note</mat-icon>
            <span class="hidden sm:inline">Music</span>
          </button>

          <button
            (click)="soundService.toggleMute()"
            class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            [title]="soundService.isMuted() ? 'Unmute Sound' : 'Mute Sound'"
            [attr.aria-label]="soundService.isMuted() ? 'Unmute' : 'Mute'"
          >
            <mat-icon class="!w-4 !h-4 !text-base">
              {{ soundService.isMuted() ? 'volume_off' : 'volume_up' }}
            </mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ThemeSwitcher {
  readonly themeService = inject(ThemeService);
  readonly soundService = inject(SoundService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly themes = THEMES;
  readonly isCollapsed = signal<boolean>(false);

  toggleCollapse() {
    this.isCollapsed.update(val => !val);
  }

  selectTheme(idx: number) {
    this.themeService.setTheme(idx);
    this.soundService.playPopSound();
  }

  triggerConfetti(type: 'rainbow' | 'stars' | 'hearts') {
    if (!isPlatformBrowser(this.platformId)) return;
    this.soundService.playPopSound();
    const colors = this.themeService.currentTheme().confettiColors;

    if (type === 'rainbow') {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.7 },
        colors
      });
    } else if (type === 'stars') {
      confetti({
        particleCount: 70,
        spread: 100,
        origin: { y: 0.65 },
        shapes: ['star'],
        colors: [this.themeService.currentTheme().primary, this.themeService.currentTheme().gold, '#ffffff']
      });
    } else if (type === 'hearts') {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.65 },
        shapes: ['circle'],
        colors: [this.themeService.currentTheme().secondary, '#ff006e', '#ff758f', '#ffffff']
      });
    }
  }
}
