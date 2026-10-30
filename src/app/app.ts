import {
  Component,
  signal,
  inject,
  PLATFORM_ID,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import confetti from 'canvas-confetti';
import { ThemeService } from './services/theme.service';
import { SoundService } from './services/sound.service';
import { GiftCanvas } from './components/gift-canvas/gift-canvas';
import { CakeCandles } from './components/cake-candles/cake-candles';
import { TimelineMemory } from './components/timeline-memory/timeline-memory';
import { ThemeSwitcher } from './components/theme-switcher/theme-switcher';
import { MatIconModule } from '@angular/material/icon';

export interface ShayariWish {
  quote: string;
  authorNote: string;
  emoji: string;
}

@Component({
  selector: 'app-root',
  imports: [
    GiftCanvas,
    CakeCandles,
    TimelineMemory,
    ThemeSwitcher,
    MatIconModule
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly themeService = inject(ThemeService);
  readonly soundService = inject(SoundService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly giftCanvasComp = viewChild<GiftCanvas>('giftCanvasComp');

  // Application state
  readonly isVaultVisible = signal<boolean>(false);
  readonly activeShayariIndex = signal<number>(0);

  readonly shayaris: ShayariWish[] = [
    {
      quote: "Khuda kare ke naya saal tum ko raas aaye,\nJo chahte ho wo sab tumhare paas aaye.",
      authorNote: "Dil se dua tere aane wale har din ke liye!",
      emoji: "🤲"
    },
    {
      quote: "Dosti ki misaal ho tum, yaari ka guroor ho,\nKhushiyan tumhare kadam choome, chahe jitne bhi door ho!",
      authorNote: "Delhi ho ya kahi bhi, dosti hamesha no. 1!",
      emoji: "💫"
    },
    {
      quote: "Teri muskurahat se har mehfil roshan ho,\nZindagi ka har pal tere liye jashn ho!",
      authorNote: "Bhai ki hasi hamesha aisi hi loud rahe!",
      emoji: "🌟"
    },
    {
      quote: "Wasim sir ki coaching se shuru hua jo silsila,\nRab kare dosti ka ye phool hamesha rahe khila!",
      authorNote: "Purani yaadein, nayi kamyabi!",
      emoji: "🏆"
    },
    {
      quote: "Cricket ki pitch ho ya zindagi ka maidan,\nHar match mein Firoz bhai hi bane man of the match aur shaan!",
      authorNote: "Boundary pe boundary marte raho!",
      emoji: "🏏"
    }
  ];

  onGiftOpened() {
    this.isVaultVisible.set(true);

    if (isPlatformBrowser(this.platformId)) {
      // Launch mega celebratory confetti blast
      const colors = this.themeService.currentTheme().confettiColors;
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.5 },
        colors
      });

      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { x: 0.1, y: 0.4 },
          colors
        });
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { x: 0.9, y: 0.4 },
          colors
        });
      }, 350);

      // Smooth scroll to vault view
      setTimeout(() => {
        const vault = document.getElementById('vault-section');
        vault?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }

  openGiftFromButton() {
    this.giftCanvasComp()?.triggerOpen();
  }

  repackGift() {
    this.isVaultVisible.set(false);
    this.giftCanvasComp()?.resetGift();
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextShayari() {
    this.activeShayariIndex.update(idx => (idx + 1) % this.shayaris.length);
    this.soundService.playChime();
  }

  onDocumentClick(event: MouseEvent) {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = event.target as HTMLElement;
    // Don't burst on input or button clicks
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('canvas')) {
      return;
    }

    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    const colors = this.themeService.currentTheme().confettiColors;

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { x, y },
      colors
    });
  }
}
