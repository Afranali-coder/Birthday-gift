import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private readonly platformId = inject(PLATFORM_ID);
  private audioCtx: AudioContext | null = null;
  
  readonly isMuted = signal<boolean>(false);
  readonly isPlayingMusic = signal<boolean>(false);
  private musicTimeout: ReturnType<typeof setTimeout> | null = null;

  private getAudioContext(): AudioContext | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute() {
    this.isMuted.update(val => !val);
    if (this.isMuted() && this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.isPlayingMusic.set(false);
    }
  }

  playPopSound() {
    if (this.isMuted()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playChime() {
    if (this.isMuted()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  playBlowCandle() {
    if (this.isMuted()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Soft puff / wind noise simulation using buffer
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();

    // followed by cheer chime
    setTimeout(() => {
      this.playBirthdayFanfare();
    }, 280);
  }

  playBirthdayFanfare() {
    if (this.isMuted()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isPlayingMusic.set(true);

    // "Happy Birthday to you" opening bars
    // G4, G4, A4, G4, C5, B4 | G4, G4, A4, G4, D5, C5
    const melody: [number, number][] = [
      [392.00, 0.22], // G4
      [392.00, 0.22], // G4
      [440.00, 0.45], // A4
      [392.00, 0.45], // G4
      [523.25, 0.45], // C5
      [493.88, 0.90], // B4
      
      [392.00, 0.22], // G4
      [392.00, 0.22], // G4
      [440.00, 0.45], // A4
      [392.00, 0.45], // G4
      [587.33, 0.45], // D5
      [523.25, 0.95], // C5
    ];

    let currentDelay = 0;
    melody.forEach(([freq, duration]) => {
      const scheduledTime = ctx.currentTime + currentDelay;
      currentDelay += duration + 0.05;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, scheduledTime);

      gain.gain.setValueAtTime(0.24, scheduledTime);
      gain.gain.exponentialRampToValueAtTime(0.001, scheduledTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(scheduledTime);
      osc.stop(scheduledTime + duration + 0.05);
    });

    if (this.musicTimeout) clearTimeout(this.musicTimeout);
    this.musicTimeout = setTimeout(() => {
      this.isPlayingMusic.set(false);
    }, currentDelay * 1000);
  }
}
