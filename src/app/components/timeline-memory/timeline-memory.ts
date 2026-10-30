import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { MatIconModule } from '@angular/material/icon';

export interface MemoryItem {
  id: string;
  title: string;
  period: string;
  description: string;
  icon: string;
  badge: string;
  badgeColor: string;
  accentGradient: string;
  tags: string[];
  likes: number;
}

@Component({
  selector: 'app-timeline-memory',
  imports: [MatIconModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full flex flex-col gap-6">
      <!-- Section Title & Subheading -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-4" [style.borderColor]="themeService.currentTheme().cardBorder">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <mat-icon class="text-amber-400 !w-5 !h-5 !text-lg">auto_awesome</mat-icon>
            <span class="text-xs uppercase tracking-widest font-bold text-amber-300">
              Unforgettable Memories
            </span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hamari Dosti Ke Kuch Khas Pal ⏳
          </h3>
          <p class="text-sm text-slate-300 mt-1">
            Wo coaching ke din, gully cricket, aur thand ki raaton ka badminton!
          </p>
        </div>

        <button
          (click)="toggleAddMemory()"
          class="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-105"
          [style.background]="themeService.currentTheme().primary"
          [style.color]="'#090a1a'"
        >
          <mat-icon class="!w-4 !h-4 !text-base">add_circle</mat-icon>
          <span>{{ showAddForm() ? 'Close' : 'Ek Aur Yaad Jodo' }}</span>
        </button>
      </div>

      <!-- ADD MEMORY FORM -->
      @if (showAddForm()) {
        <div
          class="p-5 rounded-2xl border transition-all duration-300 backdrop-blur-xl animate-in fade-in zoom-in-95"
          [style.background]="themeService.currentTheme().cardBg"
          [style.borderColor]="themeService.currentTheme().cardBorder"
        >
          <div class="flex items-center gap-2 mb-3">
            <mat-icon class="text-amber-400 !w-4 !h-4 !text-base">edit_note</mat-icon>
            <h4 class="text-sm font-bold text-white uppercase tracking-wide">
              Firoz Aur Teri Ek Aur Khas Yaad
            </h4>
          </div>

          <form [formGroup]="memoryForm" (ngSubmit)="saveMemory()" class="flex flex-col gap-3">
            <div>
              <label for="memTitle" class="block text-xs font-semibold text-slate-300 mb-1">Yaad Ka Title</label>
              <input
                id="memTitle"
                type="text"
                formControlName="title"
                placeholder="e.g. Chai Ki Tapri Pe Raat 2 Baje..."
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label for="memDesc" class="block text-xs font-semibold text-slate-300 mb-1">Kissa / Kahani</label>
              <textarea
                id="memDesc"
                rows="3"
                formControlName="description"
                placeholder="Kya hua tha us din? Thodi aur bakchodi likho..."
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              ></textarea>
            </div>
            <div class="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                (click)="toggleAddMemory()"
                class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="memoryForm.invalid"
                class="px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md"
                [style.background]="themeService.currentTheme().primary"
                [style.color]="'#090a1a'"
              >
                Yaad Save Karo 📌
              </button>
            </div>
          </form>
        </div>
      }

      <!-- TIMELINE CARDS LIST -->
      <div class="relative pl-6 sm:pl-8 border-l-2 flex flex-col gap-8 my-2" [style.borderColor]="themeService.currentTheme().cardBorder">
        @for (item of memories(); track item.id; let idx = $index) {
          <div class="relative group">
            <!-- Timeline Node Indicator -->
            <div
              class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs shadow-lg transition-transform group-hover:scale-110"
              [style.background]="themeService.currentTheme().bgStart"
              [style.borderColor]="themeService.currentTheme().primary"
              [style.boxShadow]="'0 0 15px ' + themeService.currentTheme().primary + '60'"
            >
              <mat-icon class="!w-4 !h-4 !text-base" [style.color]="themeService.currentTheme().primary">
                {{ item.icon }}
              </mat-icon>
            </div>

            <!-- Card Shell -->
            <article
              class="p-5 sm:p-6 rounded-2xl border transition-all duration-300 backdrop-blur-xl hover:translate-y-[-2px] flex flex-col gap-3"
              [style.background]="themeService.currentTheme().cardBg"
              [style.borderColor]="themeService.currentTheme().cardBorder"
              [style.boxShadow]="'0 12px 30px -10px ' + themeService.currentTheme().primary + '20'"
            >
              <!-- Card Header -->
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                    [style.borderColor]="item.badgeColor"
                    [style.color]="item.badgeColor"
                    [style.background]="item.badgeColor + '15'"
                  >
                    {{ item.badge }}
                  </span>
                  <span class="text-xs text-slate-400 font-medium">·</span>
                  <span class="text-xs text-slate-400 font-mono">{{ item.period }}</span>
                </div>

                <!-- Like / Heart Button -->
                <button
                  (click)="likeMemory(item.id)"
                  class="px-3 py-1 rounded-full bg-white/5 hover:bg-rose-500/20 text-xs font-semibold text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-400/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  [attr.aria-label]="'React to ' + item.title"
                >
                  <mat-icon class="!w-3.5 !h-3.5 !text-sm text-rose-400">favorite</mat-icon>
                  <span class="tabular-nums font-bold">{{ item.likes }}</span>
                </button>
              </div>

              <!-- Memory Title -->
              <h4 class="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{{ item.title }}</span>
              </h4>

              <!-- Memory Body -->
              <p class="text-sm text-slate-300 leading-relaxed font-normal">
                {{ item.description }}
              </p>

              <!-- Tags / Nostalgia Badges -->
              <div class="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                @for (tag of item.tags; track tag) {
                  <span class="text-[11px] text-slate-400 font-medium hover:text-amber-300 transition-colors">
                    {{ tag }}
                  </span>
                }
              </div>
            </article>
          </div>
        }
      </div>
    </div>
  `
})
export class TimelineMemory {
  readonly themeService = inject(ThemeService);
  private readonly soundService = inject(SoundService);

  readonly showAddForm = signal<boolean>(false);

  readonly memoryForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  readonly memories = signal<MemoryItem[]>([
    {
      id: 'mem-1',
      title: 'Wasim Sir Ki Coaching Se Shuruat',
      period: 'Pehli Mulaqaat',
      description: 'Teri meri dosti tab shuru hui jab main Wasim Sir ki coaching mein tha. Fir jab main tere ghar ke paas shift hua, toh hamari dosti aur zyada gehri ho gayi. Coaching ke baad roz ghanto tak baatein aur ek dusre ke ghar aana-jaana!',
      icon: 'school',
      badge: 'Chapter 01 · Origins',
      badgeColor: '#FFB703',
      accentGradient: 'from-amber-500/20 to-orange-500/20',
      tags: ['#WasimSirCoaching', '#HomeNeighbors', '#WhereItBegan', '#BhaiBhai'],
      likes: 24
    },
    {
      id: 'mem-2',
      title: 'Cricket Aur Infinite Mazak',
      period: 'Evergreen Routine',
      description: 'Saath mein khub cricket khelna, batting kiske pehle aayegi us par ladna, aur ek dusre ka mazaak udaana (jo aaj bhi hum bina ruke karte hain!). Tere sath ki wo sabhi bakchodi aur hasi-mazaak sach mein duniya mein sabse best hai.',
      icon: 'sports_cricket',
      badge: 'Chapter 02 · Game On',
      badgeColor: '#00F5D4',
      accentGradient: 'from-emerald-500/20 to-teal-500/20',
      tags: ['#CricketLegends', '#InfiniteRoasting', '#BakchodiUnstoppable', '#NoFilterYaari'],
      likes: 42
    },
    {
      id: 'mem-3',
      title: 'Delhi Shift Aur Khalid Ke Sath Badminton',
      period: 'Winter Memories',
      description: 'Jab main Delhi shift hua, toh tune aur Khalid ne hi mujhe sabse pehle yaad kiya aur call kiya. Hum teeno milkar thand ke dino mein tere ghar ke samne wali road par raat ko badminton khelte the! Fog mein shuttle dhundna aur chilled hawa mein hasna!',
      icon: 'sports_tennis',
      badge: 'Chapter 03 · Cold Nights & Warm Hearts',
      badgeColor: '#FF006E',
      accentGradient: 'from-rose-500/20 to-purple-500/20',
      tags: ['#RoadPeBadminton', '#KhalidGang', '#DelhiDiaries', '#WinterChills'],
      likes: 38
    }
  ]);

  toggleAddMemory() {
    this.showAddForm.update(val => !val);
  }

  saveMemory() {
    if (this.memoryForm.invalid) return;
    const formVal = this.memoryForm.value;
    const newItem: MemoryItem = {
      id: 'mem-' + Date.now(),
      title: formVal.title || 'Khas Yaad',
      period: 'Ajeez Pal',
      description: formVal.description || '',
      icon: 'star',
      badge: 'New Memory · Bhai Moment',
      badgeColor: this.themeService.currentTheme().primary,
      accentGradient: 'from-amber-500/20 to-pink-500/20',
      tags: ['#DostiZindabad', '#YaarAnmulle', '#FirozBhai'],
      likes: 1
    };

    this.memories.update(items => [newItem, ...items]);
    this.memoryForm.reset();
    this.showAddForm.set(false);
    this.soundService.playChime();
  }

  likeMemory(id: string) {
    this.memories.update(items =>
      items.map(m => m.id === id ? { ...m, likes: m.likes + 1 } : m)
    );
    this.soundService.playPopSound();
  }
}
