import {
  Component,
  signal,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import confetti from 'canvas-confetti';
import { ThemeService } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-cake-candles',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all duration-500 backdrop-blur-xl text-center"
      [style.background]="themeService.currentTheme().cardBg"
      [style.borderColor]="themeService.currentTheme().cardBorder"
      [style.boxShadow]="'0 20px 50px -10px ' + themeService.currentTheme().primary + '25'"
    >
      <!-- Background Ambient Glow -->
      <div
        class="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700"
        [style.background]="themeService.currentTheme().primary"
      ></div>

      <div class="relative z-10 flex flex-col items-center">
        <!-- Section Header -->
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-amber-400/30 text-amber-300 bg-amber-400/10">
            Firoz Special
          </span>
          <span class="text-xs text-slate-400">·</span>
          <span class="text-xs text-slate-300 font-medium">Bhai Ka Birthday Cake</span>
        </div>

        <h3 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
          Make A Wish & Blow The Candle! 🎂
        </h3>
        <p class="text-sm text-slate-300 max-w-md mb-6">
          Dil mein ek dua maango aur candle pe click karke fook maro!
        </p>

        <!-- CAKE VISUAL ILLUSTRATION -->
        <div
          class="relative w-56 sm:w-64 h-48 flex flex-col items-center justify-end cursor-pointer group my-2"
          (click)="handleCandleAction()"
          role="button"
          tabindex="0"
          (keydown.enter)="handleCandleAction()"
          (keydown.space)="handleCandleAction()"
          [attr.aria-label]="isBlown() ? 'Candle bujh chuki hai. Dubara jalane ke liye click karo' : 'Candle jal rahi hai. Fook marne ke liye click karo'"
        >
          <!-- CANDLES ROW -->
          <div class="flex items-end justify-center gap-4 mb-1 z-20">
            @for (candle of [1, 2, 3]; track candle) {
              <div class="flex flex-col items-center">
                <!-- FLAME -->
                <div class="relative h-9 flex items-end justify-center">
                  @if (!isBlown()) {
                    <div
                      class="w-4 h-7 rounded-full bg-gradient-to-t from-orange-500 via-amber-300 to-yellow-100 shadow-[0_0_18px_#f59e0b] animate-bounce"
                      style="animation-duration: 0.8s; border-radius: 50% 50% 35% 35%;"
                    >
                      <div class="w-1.5 h-3 mx-auto mt-2 rounded-full bg-blue-300/80"></div>
                    </div>
                  } @else {
                    <!-- SMOKE PUFF -->
                    <div class="flex flex-col items-center animate-fade-out">
                      <span class="w-2 h-2 rounded-full bg-slate-400/60 blur-[1px] animate-ping"></span>
                      <span class="text-xs text-slate-400 italic">💨</span>
                    </div>
                  }
                </div>

                <!-- CANDLE WICK -->
                <div class="w-0.5 h-2 bg-slate-700"></div>

                <!-- CANDLE BODY -->
                <div
                  class="w-3.5 h-12 rounded-t-sm shadow-md"
                  [style.background]="candle === 2
                    ? 'repeating-linear-gradient(45deg, ' + themeService.currentTheme().primary + ', ' + themeService.currentTheme().primary + ' 5px, #ffffff 5px, #ffffff 10px)'
                    : 'repeating-linear-gradient(45deg, ' + themeService.currentTheme().secondary + ', ' + themeService.currentTheme().secondary + ' 5px, #ffffff 5px, #ffffff 10px)'"
                ></div>
              </div>
            }
          </div>

          <!-- CAKE TOP TIER (Cream & Strawberries) -->
          <div
            class="relative w-40 h-14 rounded-t-xl z-10 flex items-center justify-around px-2 shadow-lg border-t-2 border-white/30"
            [style.background]="'linear-gradient(180deg, #fff1f2 0%, #fecdd3 100%)'"
          >
            <!-- Frosting drips -->
            <div class="absolute -bottom-2 left-0 right-0 flex justify-between px-2 overflow-hidden pointer-events-none">
              @for (drip of [1, 2, 3, 4, 5, 6, 7]; track drip) {
                <span class="w-4 h-3 rounded-b-full bg-[#fecdd3]"></span>
              }
            </div>

            <!-- Berries on cake -->
            <span class="text-base select-none">🍓</span>
            <span class="text-xs font-bold text-pink-700 tracking-wider">FIROZ</span>
            <span class="text-base select-none">🍓</span>
          </div>

          <!-- CAKE BOTTOM TIER (Rich Chocolate / Velvety Base) -->
          <div
            class="relative w-52 sm:w-60 h-20 rounded-t-2xl shadow-2xl flex flex-col items-center justify-center border-t-2 border-white/20"
            [style.background]="'linear-gradient(180deg, #451a03 0%, #1c0a00 100%)'"
          >
            <!-- Ribbon band around cake -->
            <div
              class="w-full h-3 shadow-inner flex items-center justify-around"
              [style.background]="themeService.currentTheme().primary"
            >
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <span class="w-1.5 h-1.5 rounded-full bg-white/80"></span>
              }
            </div>
            <p class="text-amber-200 text-xs font-bold tracking-widest mt-2 uppercase">
              Happy Birthday Bhai!
            </p>
          </div>

          <!-- CAKE STAND / PLATTER -->
          <div class="w-60 sm:w-68 h-4 bg-gradient-to-r from-slate-300 via-white to-slate-300 rounded-full shadow-xl"></div>
        </div>

        <!-- ACTION BUTTON & STATUS -->
        <div class="mt-4 flex flex-col items-center gap-3">
          @if (!isBlown()) {
            <button
              (click)="blowCandles()"
              class="px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              [style.background]="themeService.currentTheme().primary"
              [style.color]="'#090a1a'"
              [style.boxShadow]="'0 8px 25px -4px ' + themeService.currentTheme().primary + '80'"
            >
              <mat-icon class="!w-5 !h-5 !text-lg">air</mat-icon>
              <span>Fook Maro (Blow Candles)</span>
            </button>
          } @else {
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <div class="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-bold flex items-center gap-2">
                <mat-icon class="!w-5 !h-5 !text-lg text-emerald-400">celebration</mat-icon>
                <span>Dua Kabool! Wish Granted, Firoz! 🌟</span>
              </div>
              <button
                (click)="relightCandles()"
                class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              >
                <mat-icon class="!w-4 !h-4 !text-base">local_fire_department</mat-icon>
                <span>Light Again</span>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class CakeCandles {
  readonly themeService = inject(ThemeService);
  private readonly soundService = inject(SoundService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBlown = signal<boolean>(false);

  handleCandleAction() {
    if (this.isBlown()) {
      this.relightCandles();
    } else {
      this.blowCandles();
    }
  }

  blowCandles() {
    this.isBlown.set(true);
    this.soundService.playBlowCandle();

    if (isPlatformBrowser(this.platformId)) {
      const colors = this.themeService.currentTheme().confettiColors;
      // Fire confetti bursts
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors
      });

      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });
      }, 250);
    }
  }

  relightCandles() {
    this.isBlown.set(false);
    this.soundService.playPopSound();
  }
}
