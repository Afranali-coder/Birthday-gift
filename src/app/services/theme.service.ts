import { Injectable, signal, computed } from '@angular/core';

export interface ColorTheme {
  id: string;
  name: string;
  tagline: string;
  // Primary brand colors
  primary: string; // e.g. #FFB703
  secondary: string; // e.g. #FF006E
  accent: string; // e.g. #00F5D4
  highlight: string; // e.g. #8338EC
  gold: string; // e.g. #FFD166
  
  // Hex numbers for Three.js
  hexPrimary: number;
  hexSecondary: number;
  hexAccent: number;
  hexHighlight: number;
  hexGold: number;
  
  // Background gradient stops
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  
  // Card styles
  cardBg: string;
  cardBorder: string;
  
  // Confetti palette
  confettiColors: string[];
}

export const THEMES: ColorTheme[] = [
  {
    id: 'carnival-fiesta',
    name: 'Carnival Fiesta',
    tagline: 'Vibrant Saffron, Ruby Pink & Electric Mint',
    primary: '#FFB703',
    secondary: '#FF006E',
    accent: '#00F5D4',
    highlight: '#8338EC',
    gold: '#FFD166',
    hexPrimary: 0xFFB703,
    hexSecondary: 0xFF006E,
    hexAccent: 0x00F5D4,
    hexHighlight: 0x8338EC,
    hexGold: 0xFFD166,
    bgStart: '#130e26',
    bgMid: '#240b36',
    bgEnd: '#090a1a',
    cardBg: 'rgba(32, 17, 58, 0.75)',
    cardBorder: 'rgba(255, 183, 3, 0.35)',
    confettiColors: ['#FFB703', '#FF006E', '#00F5D4', '#8338EC', '#FFD166', '#FB5607']
  },
  {
    id: 'royal-ruby-gold',
    name: 'Royal Ruby & Gold',
    tagline: 'Regal Velvet, Champagne Gold & Imperial Ruby',
    primary: '#FFD700',
    secondary: '#E63946',
    accent: '#2A9D8F',
    highlight: '#F4A261',
    gold: '#FFE600',
    hexPrimary: 0xFFD700,
    hexSecondary: 0xE63946,
    hexAccent: 0x2A9D8F,
    hexHighlight: 0xF4A261,
    hexGold: 0xFFE600,
    bgStart: '#1e050c',
    bgMid: '#2b0916',
    bgEnd: '#0b0409',
    cardBg: 'rgba(46, 12, 25, 0.75)',
    cardBorder: 'rgba(255, 215, 0, 0.4)',
    confettiColors: ['#FFD700', '#E63946', '#2A9D8F', '#F4A261', '#FFF176', '#E76F51']
  },
  {
    id: 'sunset-aurora',
    name: 'Sunset Aurora',
    tagline: 'Warm Tangerine, Hot Fuchsia & Neon Turquoise',
    primary: '#FF6B35',
    secondary: '#F72585',
    accent: '#4CC9F0',
    highlight: '#7209B7',
    gold: '#FFAA00',
    hexPrimary: 0xFF6B35,
    hexSecondary: 0xF72585,
    hexAccent: 0x4CC9F0,
    hexHighlight: 0x7209B7,
    hexGold: 0xFFAA00,
    bgStart: '#1b092b',
    bgMid: '#38093e',
    bgEnd: '#0a0a1f',
    cardBg: 'rgba(40, 12, 54, 0.75)',
    cardBorder: 'rgba(255, 107, 53, 0.4)',
    confettiColors: ['#FF6B35', '#F72585', '#4CC9F0', '#7209B7', '#FFAA00', '#B5179E']
  },
  {
    id: 'cyber-party-neon',
    name: 'Cyber Party Neon',
    tagline: 'Electric Cyan, Toxic Lime & Violet Spark',
    primary: '#00F0FF',
    secondary: '#FF007F',
    accent: '#39FF14',
    highlight: '#9D00FF',
    gold: '#FFE600',
    hexPrimary: 0x00F0FF,
    hexSecondary: 0xFF007F,
    hexAccent: 0x39FF14,
    hexHighlight: 0x9D00FF,
    hexGold: 0xFFE600,
    bgStart: '#060d21',
    bgMid: '#12072e',
    bgEnd: '#03050d',
    cardBg: 'rgba(11, 19, 48, 0.75)',
    cardBorder: 'rgba(0, 240, 255, 0.4)',
    confettiColors: ['#00F0FF', '#FF007F', '#39FF14', '#9D00FF', '#FFE600', '#00FFA3']
  },
  {
    id: 'emerald-paradise',
    name: 'Emerald & Gold',
    tagline: 'Lush Emerald Jade, Radiant Mint & Pure Gold',
    primary: '#10B981',
    secondary: '#F59E0B',
    accent: '#06B6D4',
    highlight: '#8B5CF6',
    gold: '#FBBF24',
    hexPrimary: 0x10B981,
    hexSecondary: 0xF59E0B,
    hexAccent: 0x06B6D4,
    hexHighlight: 0x8B5CF6,
    hexGold: 0xFBBF24,
    bgStart: '#041d18',
    bgMid: '#072e27',
    bgEnd: '#020d0b',
    cardBg: 'rgba(6, 38, 32, 0.75)',
    cardBorder: 'rgba(16, 185, 129, 0.4)',
    confettiColors: ['#10B981', '#F59E0B', '#06B6D4', '#34D399', '#FBBF24', '#6EE7B7']
  }
];

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly themes = THEMES;
  readonly activeThemeIndex = signal<number>(0);
  
  readonly currentTheme = computed(() => this.themes[this.activeThemeIndex()]);

  setTheme(index: number) {
    if (index >= 0 && index < this.themes.length) {
      this.activeThemeIndex.set(index);
    }
  }

  nextTheme() {
    this.activeThemeIndex.update(current => (current + 1) % this.themes.length);
  }
}
