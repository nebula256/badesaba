/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class YaldaAudioSystem {
  private ctx: AudioContext | null = null;
  private muted = false;
  private bgmInterval: number | null = null;
  private stepIndex = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined' || navigator.webdriver) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute) {
      this.stopMusic();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.12,
    delaySec = 0,
    freqEnd?: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + durationSec);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playJump(): void {
    const variance = 0.96 + Math.random() * 0.08;
    this.playTone(290 * variance, 0.14, 'sine', 0.12, 0, 520 * variance);
  }

  public playLand(): void {
    const variance = 0.95 + Math.random() * 0.1;
    this.playTone(145 * variance, 0.07, 'triangle', 0.08, 0, 95);
  }

  public playCollectPomegranate(): void {
    // Crisp festive santoor-like double pluck
    this.playTone(587.33, 0.11, 'triangle', 0.13, 0);
    this.playTone(880, 0.16, 'triangle', 0.14, 0.06);
  }

  public playCollectWatermelon(): void {
    // Rich three-note chord arpeggio
    this.playTone(523.25, 0.1, 'triangle', 0.12, 0);
    this.playTone(659.25, 0.11, 'triangle', 0.13, 0.05);
    this.playTone(1046.5, 0.18, 'sine', 0.14, 0.1);
  }

  public playLanternLight(): void {
    // Warm magical glow chime
    this.playTone(440, 0.18, 'sine', 0.12, 0);
    this.playTone(554.37, 0.2, 'sine', 0.12, 0.07);
    this.playTone(659.25, 0.24, 'triangle', 0.13, 0.14);
    this.playTone(880, 0.35, 'sine', 0.15, 0.21);
  }

  public playChallengeComplete(): void {
    this.playTone(493.88, 0.12, 'triangle', 0.13, 0);
    this.playTone(739.99, 0.16, 'triangle', 0.14, 0.08);
    this.playTone(987.77, 0.25, 'sine', 0.14, 0.16);
  }

  public playRewardUnlock(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.14, idx * 0.065);
    });
  }

  public playObstacleBump(): void {
    this.playTone(160, 0.12, 'sawtooth', 0.07, 0, 95);
  }

  public playGameFinish(): void {
    const melody = [523.25, 587.33, 659.25, 783.99, 1046.5];
    melody.forEach((n, idx) => {
      this.playTone(n, 0.26, 'triangle', 0.15, idx * 0.09);
    });
  }

  public startMusic(): void {
    if (this.muted || this.bgmInterval !== null || typeof window === 'undefined') return;
    // Gentle Persian Yalda rhythmic motif (Chaharmezrab-inspired warm pentatonic/harmonic loop)
    const scale = [293.66, 329.63, 349.23, 440.0, 493.88, 523.25, 440.0, 349.23];
    this.bgmInterval = window.setInterval(() => {
      if (this.muted) return;
      const freq = scale[this.stepIndex % scale.length];
      this.stepIndex++;
      this.playTone(freq, 0.22, 'sine', 0.035, 0);
    }, 340);
  }

  public stopMusic(): void {
    if (this.bgmInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const yaldaAudio = new YaldaAudioSystem();
