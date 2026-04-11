// ============================================================
//  SOUND — Web Audio API Synthesizer (keine externen Dateien)
// ============================================================

const SFX = {
    ctx: null,
    muted: true,
    musicVol: 100,
    sfxVol: 100,

    setMuted(m) {
        this.muted = m;
        this.applyVolumes();
    },

    applyVolumes() {
        if (this.bgGain) {
            this.bgGain.gain.value = this.muted ? 0 : 0.05 * (this.musicVol / 100);
        }
    },

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
            const scaledVol = (vol || 0.15) * (this.sfxVol / 100);
            gain.gain.setValueAtTime(scaledVol, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        });
    },

    // Noise burst (fuer impacts, landings)
    noise(duration, vol) {
        this.play(ctx => {
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            const gain = ctx.createGain();
            const scaledVol = (vol || 0.05) * (this.sfxVol / 100);
            gain.gain.setValueAtTime(scaledVol, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
            src.connect(gain);
            gain.connect(ctx.destination);
            src.start();
        });
    },

    // === SOUND EFFEKTE ===

    jump() {
        this.tone(220, 440, 0.1, 'square', 0.025);
        this.tone(330, 660, 0.08, 'sine', 0.015);
    },

    land() {
        this.noise(0.06, 0.03);
        this.tone(100, 50, 0.06, 'triangle', 0.02);
    },

    death() {
        this.tone(440, 80, 0.3, 'sawtooth', 0.05);
        setTimeout(() => this.tone(220, 40, 0.25, 'square', 0.04), 80);
        setTimeout(() => this.noise(0.15, 0.03), 150);
    },

    levelComplete() {
        // Aufsteigende Fanfare
        this.tone(523, 523, 0.1, 'square', 0.04);   // C5
        setTimeout(() => this.tone(659, 659, 0.1, 'square', 0.04), 100); // E5
        setTimeout(() => this.tone(784, 784, 0.1, 'square', 0.04), 200); // G5
        setTimeout(() => this.tone(1047, 1047, 0.25, 'square', 0.05), 300); // C6
        setTimeout(() => this.tone(784, 1047, 0.15, 'sine', 0.03), 300); // Shimmer
    },

    trapTrigger() {
        this.tone(350, 120, 0.12, 'sawtooth', 0.025);
        this.noise(0.05, 0.015);
    },

    spikeRise() {
        this.tone(100, 700, 0.18, 'sawtooth', 0.025);
    },

    exitMove() {
        this.tone(500, 250, 0.15, 'triangle', 0.025);
        setTimeout(() => this.tone(450, 200, 0.15, 'triangle', 0.02), 100);
    },

    wallChase() {
        this.tone(70, 50, 0.12, 'sawtooth', 0.025);
        this.noise(0.08, 0.015);
    },

    menuSelect() {
        this.tone(440, 880, 0.06, 'square', 0.03);
        setTimeout(() => this.tone(660, 880, 0.04, 'square', 0.02), 40);
    },

    menuTick() {
        this.tone(350, 400, 0.025, 'square', 0.012);
    },

    invertFlip() {
        this.tone(800, 200, 0.12, 'square', 0.03);
        setTimeout(() => this.tone(200, 800, 0.12, 'square', 0.03), 80);
    },

    // Neue Sounds
    bounce() {
        this.tone(200, 600, 0.15, 'sine', 0.03);
        this.tone(250, 700, 0.12, 'triangle', 0.02);
    },

    iceSlide() {
        this.tone(1200, 800, 0.08, 'sine', 0.01);
    },

    switchActivate() {
        this.tone(440, 440, 0.06, 'square', 0.025);
        setTimeout(() => this.tone(660, 660, 0.06, 'square', 0.025), 60);
        setTimeout(() => this.tone(880, 880, 0.1, 'square', 0.03), 120);
    },

    warp() {
        this.tone(200, 1200, 0.2, 'sine', 0.03);
        this.tone(300, 1400, 0.2, 'triangle', 0.015);
    },

    fakeOut() {
        // Troll sound — aufsteigende Erwartung dann crash
        this.tone(400, 800, 0.15, 'square', 0.03);
        setTimeout(() => this.tone(100, 50, 0.2, 'sawtooth', 0.04), 150);
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
        this.bgGain.gain.value = this.muted ? 0 : 0.05 * (this.musicVol / 100);
        this.bgGain.connect(ctx.destination);

        const bpm = 140;
        const beat = 60 / bpm;

        // Dark, energetische Troll-Melodie in Moll
        // E minor pentatonic vibe — frech und getrieben
        const melody = [
            // Phrase 1 — schnell und treibend
            [330, 0.5], [0, 0.5], [330, 0.5], [392, 0.5],
            [440, 1], [392, 0.5], [330, 0.5],
            [294, 1], [0, 0.5], [247, 0.5],
            [294, 0.5], [330, 0.5], [294, 1],
            // Phrase 2 — aufsteigend, spannend
            [330, 0.5], [0, 0.5], [392, 0.5], [440, 0.5],
            [494, 1], [440, 0.5], [392, 0.5],
            [330, 0.5], [294, 0.5], [330, 1],
            [0, 1], [247, 0.5], [294, 0.5],
            // Phrase 3 — dunkel, tiefer
            [220, 1], [247, 0.5], [262, 0.5],
            [294, 1], [262, 0.5], [247, 0.5],
            [220, 1], [0, 0.5], [196, 0.5],
            [220, 0.5], [247, 0.5], [220, 1],
            // Phrase 4 — Aufloesung, Wiederholung
            [330, 0.5], [392, 0.5], [440, 0.5], [392, 0.5],
            [330, 1], [294, 0.5], [247, 0.5],
            [220, 1.5], [0, 0.5],
            [330, 0.5], [0, 0.5], [0, 1],
        ];

        // Treibender Bass — pumping Moll
        const bass = [
            [82, 2], [82, 1], [0, 0.5], [82, 0.5],   // E2
            [98, 2], [98, 1], [0, 0.5], [98, 0.5],   // G2
            [73, 2], [73, 1], [0, 0.5], [73, 0.5],   // D2
            [82, 2], [110, 1], [82, 1],               // E2 A2 E2
            [82, 2], [82, 1], [0, 0.5], [82, 0.5],
            [98, 2], [98, 1], [0, 0.5], [98, 0.5],
            [73, 2], [73, 1], [0, 0.5], [73, 0.5],
            [82, 1], [73, 1], [65, 1], [82, 1],      // E2 D2 C2 E2
        ];

        // Rhythmische Hi-Hat Percussion via Noise
        const hihat = [
            1, 0, 1, 0, 1, 0, 1, 0,   // 8th notes, every other
            1, 0, 1, 0, 1, 1, 1, 0,   // syncopation
            1, 0, 1, 0, 1, 0, 1, 0,
            1, 0, 1, 1, 1, 0, 1, 0,
        ];

        const totalBeats = melody.reduce((sum, n) => sum + n[1], 0);
        const loopDuration = totalBeats * beat;

        const playLoop = () => {
            if (this.muted || !this.bgPlaying) {
                setTimeout(() => { if (this.bgPlaying) playLoop(); }, 500);
                return;
            }

            const now = ctx.currentTime + 0.05;

            // Melodie (square + leichtes detune fuer Retro-Sound)
            let t = 0;
            for (const [freq, dur] of melody) {
                if (freq > 0) {
                    const osc = ctx.createOscillator();
                    const osc2 = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'square';
                    osc2.type = 'square';
                    osc.frequency.value = freq;
                    osc2.frequency.value = freq * 1.005; // leichtes detune
                    g.gain.setValueAtTime(0.035, now + t * beat);
                    g.gain.setValueAtTime(0, now + (t + dur * 0.85) * beat);
                    osc.connect(g); osc2.connect(g);
                    g.connect(this.bgGain);
                    osc.start(now + t * beat); osc.stop(now + (t + dur) * beat);
                    osc2.start(now + t * beat); osc2.stop(now + (t + dur) * beat);
                }
                t += dur;
            }

            // Bass (triangle, tief und warm)
            let tb = 0;
            for (const [freq, dur] of bass) {
                if (freq > 0) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(0.045, now + tb * beat);
                    g.gain.linearRampToValueAtTime(0.01, now + (tb + dur * 0.8) * beat);
                    g.gain.setValueAtTime(0, now + (tb + dur * 0.9) * beat);
                    osc.connect(g); g.connect(this.bgGain);
                    osc.start(now + tb * beat); osc.stop(now + (tb + dur) * beat);
                }
                tb += dur;
            }

            // Hi-Hat Percussion (noise bursts)
            const hhBeat = beat * 0.5; // 8th notes
            for (let i = 0; i < hihat.length && i * hhBeat < loopDuration; i++) {
                if (!hihat[i]) continue;
                const bufLen = Math.floor(ctx.sampleRate * 0.03);
                const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let s = 0; s < bufLen; s++) d[s] = Math.random() * 2 - 1;
                const src = ctx.createBufferSource();
                src.buffer = buf;
                // Highpass filter for hi-hat sound
                const hp = ctx.createBiquadFilter();
                hp.type = 'highpass';
                hp.frequency.value = 8000;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.02, now + i * hhBeat);
                g.gain.linearRampToValueAtTime(0, now + i * hhBeat + 0.03);
                src.connect(hp); hp.connect(g); g.connect(this.bgGain);
                src.start(now + i * hhBeat);
            }

            setTimeout(() => { if (this.bgPlaying) playLoop(); }, loopDuration * 1000);
        };

        playLoop();
    },

    stopMusic() {
        this.bgPlaying = false;
    },
};

// Audio Context starten bei erster User-Interaktion (keyboard + touch)
function initAudioOnce() {
    SFX.init();
    window.removeEventListener('keydown', initAudioOnce);
    window.removeEventListener('touchstart', initAudioOnce);
}
window.addEventListener('keydown', initAudioOnce, { once: true });
window.addEventListener('touchstart', initAudioOnce, { once: true });
