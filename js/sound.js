// ============================================================
//  SOUND — Web Audio API Synthesizer (keine externen Dateien)
// ============================================================

const SFX = {
    ctx: null,
    muted: false,

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },

    play(fn) {
        if (this.muted || !this.ctx) return;
        try { fn(this.ctx); } catch (e) {}
    },

    // Kurzer Ton mit Frequenz-Sweep
    tone(freq, endFreq, duration, type, vol) {
        this.play(ctx => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
            gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        });
    },

    // === SOUND EFFEKTE ===

    jump() {
        this.tone(250, 500, 0.12, 'square', 0.1);
    },

    land() {
        this.tone(120, 60, 0.08, 'triangle', 0.08);
    },

    death() {
        this.tone(400, 80, 0.35, 'sawtooth', 0.12);
        setTimeout(() => this.tone(200, 40, 0.25, 'square', 0.08), 100);
    },

    levelComplete() {
        this.tone(400, 400, 0.1, 'square', 0.1);
        setTimeout(() => this.tone(500, 500, 0.1, 'square', 0.1), 100);
        setTimeout(() => this.tone(600, 600, 0.1, 'square', 0.1), 200);
        setTimeout(() => this.tone(800, 800, 0.2, 'square', 0.12), 300);
    },

    trapTrigger() {
        this.tone(300, 100, 0.15, 'sawtooth', 0.06);
    },

    spikeRise() {
        this.tone(100, 600, 0.2, 'sawtooth', 0.07);
    },

    exitMove() {
        this.tone(500, 200, 0.2, 'triangle', 0.08);
    },

    wallChase() {
        this.tone(80, 60, 0.15, 'sawtooth', 0.05);
    },

    menuSelect() {
        this.tone(440, 660, 0.08, 'square', 0.1);
    },

    invertFlip() {
        this.tone(800, 200, 0.15, 'square', 0.1);
        setTimeout(() => this.tone(200, 800, 0.15, 'square', 0.1), 100);
    },
};

// Audio Context starten bei erster User-Interaktion
window.addEventListener('keydown', function initAudio() {
    SFX.init();
    window.removeEventListener('keydown', initAudio);
}, { once: true });
