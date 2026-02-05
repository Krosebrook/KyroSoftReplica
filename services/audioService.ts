/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientNode: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy init in init() to handle browser autoplay policies
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Master volume
    this.masterGain.connect(this.ctx.destination);

    this.startAmbient();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, vol: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playBuild() {
    if (!this.ctx) return;
    // High tech 'plop'
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(t + 0.2);
  }

  playDemolish() {
    this.playNoise(0.3, 0.4);
  }

  playError() {
    this.createOscillator('sawtooth', 150, 0.2, 0.3);
  }

  playSuccess() {
    if (!this.ctx) return;
    // Major triad arpeggio
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => { // C5, E5, G5
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.6);
    });
  }

  playNotification() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.createOscillator('sine', 880, 0.1, 0.2); // A5
    setTimeout(() => this.createOscillator('sine', 1760, 0.1, 0.2), 100); // A6
  }

  // Generate synthetic brown noise for city ambience
  private startAmbient() {
    if (!this.ctx || !this.masterGain) return;
    
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate for gain loss
    }

    this.ambientNode = this.ctx.createBufferSource();
    this.ambientNode.buffer = buffer;
    this.ambientNode.loop = true;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Low rumble

    const ambientGain = this.ctx.createGain();
    ambientGain.gain.value = 0.15;

    this.ambientNode.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(this.masterGain);
    
    this.ambientNode.start();
  }

  private playNoise(duration: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }
}

export const audioService = new AudioService();