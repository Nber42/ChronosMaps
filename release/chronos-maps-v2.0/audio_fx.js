/**
 * CHRONOS AUDIO ENGINE
 * Procedural Sound Generation using Web Audio API
 * No external assets required.
 */

const SoundFX = {
    ctx: null,
    enabled: true,
    volume: 0.3,

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    },

    // --- OSCILLATOR HELPERS ---

    playTone(freq, type, duration, startTime = 0, vol = 1) {
        if (!this.ctx || !this.enabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        // Envelope
        gain.gain.setValueAtTime(0, this.ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(this.volume * vol, this.ctx.currentTime + startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration); // Decay

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    },

    // --- FX PRESETS ---

    playClick() {
        this.playTone(800, 'sine', 0.1, 0, 0.2);
    },

    playDiscovery(rarity) {
        this.init(); // Ensure initialized
        if (!this.enabled) return;

        const r = rarity.class || 'common';

        if (r === 'legendary') {
            // Magical Arpeggio (C Major 7 + 9)
            // C4, E4, G4, B4, D5, G5
            const notes = [261.63, 329.63, 392.00, 493.88, 587.33, 783.99];
            notes.forEach((freq, i) => {
                this.playTone(freq, 'sine', 1.5, i * 0.1, 0.8); // Bell-like sine
                this.playTone(freq * 2, 'triangle', 1.5, i * 0.1, 0.2); // Sparkle overtone
            });
        } else if (r === 'rare') {
            // Major Triad (C-E-G)
            this.playTone(392.00, 'sine', 0.8, 0, 0.6); // G4
            this.playTone(523.25, 'sine', 0.8, 0.1, 0.6); // C5
            this.playTone(659.25, 'sine', 0.8, 0.2, 0.6); // E5
        } else {
            // Common: Simple happy ping
            this.playTone(440, 'sine', 0.3, 0, 0.4);
            this.playTone(554.37, 'sine', 0.3, 0.05, 0.4); // C#
        }
    },

    playLevelUp() {
        this.init();
        if (!this.enabled) return;

        // Fanfare
        const root = 523.25; // C5
        [0, 4, 7, 12].forEach((interval, i) => {
            // Simple frequency interval calc approximation for major scale
            // P1, M3, P5, P8 (Octave)
            // Just hardcoding some pleasant ratios
            let mult = 1;
            if (i == 1) mult = 1.25;
            if (i == 2) mult = 1.5;
            if (i == 3) mult = 2;

            this.playTone(root * mult, 'square', 0.6, i * 0.1, 0.3); // 8-bit style square
        });
    },

    playUnlock() {
        // Creating a "shiny" sound
        this.playTone(1200, 'sine', 0.5, 0, 0.2);
        this.playTone(1800, 'sine', 0.5, 0.1, 0.2);
    }
};
