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
        this.tone(250, 500, 0.12, 'square', 0.03);
    },

    land() {
        this.tone(120, 60, 0.08, 'triangle', 0.02);
    },

    death() {
        this.tone(400, 80, 0.35, 'sawtooth', 0.04);
        setTimeout(() => this.tone(200, 40, 0.25, 'square', 0.03), 100);
    },

    levelComplete() {
        this.tone(400, 400, 0.1, 'square', 0.04);
        setTimeout(() => this.tone(500, 500, 0.1, 'square', 0.04), 100);
        setTimeout(() => this.tone(600, 600, 0.1, 'square', 0.04), 200);
        setTimeout(() => this.tone(800, 800, 0.2, 'square', 0.05), 300);
    },

    trapTrigger() {
        this.tone(300, 100, 0.15, 'sawtooth', 0.02);
    },

    spikeRise() {
        this.tone(100, 600, 0.2, 'sawtooth', 0.02);
    },

    exitMove() {
        this.tone(500, 200, 0.2, 'triangle', 0.03);
    },

    wallChase() {
        this.tone(80, 60, 0.15, 'sawtooth', 0.02);
    },

    menuSelect() {
        this.tone(440, 660, 0.08, 'square', 0.03);
    },

    invertFlip() {
        this.tone(800, 200, 0.15, 'square', 0.03);
        setTimeout(() => this.tone(200, 800, 0.15, 'square', 0.03), 100);
    },

    // === HINTERGRUND-MUSIK ===
    bgMusic: null,
    bgPlaying: false,
    bgGain: null,

    startMusic() {
        if (this.bgPlaying || !this.ctx) return;
        this.bgPlaying = true;

        const ctx = this.ctx;
        this.bgGain = ctx.createGain();
        this.bgGain.gain.value = 0.04; // sehr leise
        this.bgGain.connect(ctx.destination);

        // Einfache Chiptune-Melodie die loopt
        const bpm = 110;
        const beat = 60 / bpm;

        // Noten: [frequenz, dauer in beats]
        const melody = [
            [330, 1], [294, 1], [262, 1], [294, 1],
            [330, 1], [330, 1], [330, 2],
            [294, 1], [294, 1], [294, 2],
            [330, 1], [392, 1], [392, 2],
            [330, 1], [294, 1], [262, 1], [294, 1],
            [330, 1], [330, 1], [330, 1], [330, 1],
            [294, 1], [294, 1], [330, 1], [294, 1],
            [262, 2], [0, 2],
        ];

        // Bass-Linie
        const bass = [
            [131, 4], [147, 4],
            [165, 4], [196, 4],
            [131, 4], [147, 4],
            [165, 2], [196, 2], [131, 4],
        ];

        const totalBeats = melody.reduce((sum, n) => sum + n[1], 0);
        const loopDuration = totalBeats * beat;

        const playLoop = () => {
            if (this.muted || !this.bgPlaying) {
                // Retry nach kurzer Pause wenn gemutet
                setTimeout(() => { if (this.bgPlaying) playLoop(); }, 500);
                return;
            }

            const now = ctx.currentTime + 0.05;

            // Melodie
            let t = 0;
            for (const [freq, dur] of melody) {
                if (freq > 0) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(0.04, now + t * beat);
                    g.gain.setValueAtTime(0, now + (t + dur * 0.9) * beat);
                    osc.connect(g);
                    g.connect(this.bgGain);
                    osc.start(now + t * beat);
                    osc.stop(now + (t + dur) * beat);
                }
                t += dur;
            }

            // Bass
            let tb = 0;
            for (const [freq, dur] of bass) {
                if (freq > 0) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(0.03, now + tb * beat);
                    g.gain.setValueAtTime(0, now + (tb + dur * 0.85) * beat);
                    osc.connect(g);
                    g.connect(this.bgGain);
                    osc.start(now + tb * beat);
                    osc.stop(now + (tb + dur) * beat);
                }
                tb += dur;
            }

            // Nächsten Loop planen
            setTimeout(() => { if (this.bgPlaying) playLoop(); }, loopDuration * 1000);
        };

        playLoop();
    },

    stopMusic() {
        this.bgPlaying = false;
    },
};

// Audio Context starten bei erster User-Interaktion
window.addEventListener('keydown', function initAudio() {
    SFX.init();
    window.removeEventListener('keydown', initAudio);
}, { once: true });
