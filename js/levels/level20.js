// Level 20 — "Flappy"
// KONZEPT: Flappy Bird Modus. Starke Gravity, kleiner Jump-Impuls,
// Auto-Run + Auto-Scroll. Navigiere durch Spike-Lücken wie Pipes.
// TROLL: Gewohnte Steuerung funktioniert nicht. Timing ist brutal.

LEVELS.push({
    name: 'Flappy',
    width: 3000,
    flappyMode: true,
    autoRun: 2.5,
    autoScroll: { speed: 2.5 },
    player: { x: 100, y: 230 },
    exit: { x: 2920, y: 220, w: 30, h: 40 },
    platforms: [
        // Decke und Boden (durchgehend)
        { x: 0, y: 0, w: 3000, h: 20 },
        { x: 0, y: 480, w: 3000, h: 20 },
    ],
    spikes: [
        // === PIPE-Paare: Spikes oben + unten mit Lücke ===

        // Pipe 1 (x: 400) — Lücke: 180-300
        { x: 400, y: 20, w: 30, h: 160, dir: 'down' },
        { x: 400, y: 300, w: 30, h: 180, dir: 'up' },

        // Pipe 2 (x: 650) — Lücke: 220-340
        { x: 650, y: 20, w: 30, h: 200, dir: 'down' },
        { x: 650, y: 340, w: 30, h: 140, dir: 'up' },

        // Pipe 3 (x: 900) — Lücke: 140-270
        { x: 900, y: 20, w: 30, h: 120, dir: 'down' },
        { x: 900, y: 270, w: 30, h: 210, dir: 'up' },

        // Pipe 4 (x: 1150) — Lücke: 250-380
        { x: 1150, y: 20, w: 30, h: 230, dir: 'down' },
        { x: 1150, y: 380, w: 30, h: 100, dir: 'up' },

        // Pipe 5 (x: 1400) — Lücke: 160-290 (enger!)
        { x: 1400, y: 20, w: 30, h: 140, dir: 'down' },
        { x: 1400, y: 290, w: 30, h: 190, dir: 'up' },

        // Pipe 6 (x: 1650) — Lücke: 200-320
        { x: 1650, y: 20, w: 30, h: 180, dir: 'down' },
        { x: 1650, y: 320, w: 30, h: 160, dir: 'up' },

        // Pipe 7 (x: 1900) — Lücke: 120-260 (eng + tief)
        { x: 1900, y: 20, w: 30, h: 100, dir: 'down' },
        { x: 1900, y: 260, w: 30, h: 220, dir: 'up' },

        // Pipe 8 (x: 2100) — Lücke: 280-400 (hoch)
        { x: 2100, y: 20, w: 30, h: 260, dir: 'down' },
        { x: 2100, y: 400, w: 30, h: 80, dir: 'up' },

        // Pipe 9 (x: 2350) — Lücke: 190-310
        { x: 2350, y: 20, w: 30, h: 170, dir: 'down' },
        { x: 2350, y: 310, w: 30, h: 170, dir: 'up' },

        // Pipe 10 (x: 2600) — Lücke: 230-350
        { x: 2600, y: 20, w: 30, h: 210, dir: 'down' },
        { x: 2600, y: 350, w: 30, h: 130, dir: 'up' },
    ],
    traps: [
        // FakeExit als Troll bei Pipe 6
        new FakeExit(1660, 200),
    ],
});
