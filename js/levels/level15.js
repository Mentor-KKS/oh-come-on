// ================================================================
// Level 15 — "Upside Down"
// KONZEPT: Jump flippt die Gravitation. Player startet an der Decke.
// Mid-Air-Plattformen, Gaps in Decke/Boden, fallende Blöcke.
// Fake-Spikes + unsichtbare Killzones + Fake-Exit am Ende.
// ================================================================
LEVELS.push({
    name: "Upside Down",
    gravityDir: -1,
    jumpFlipsGravity: true,
    player: { x: 50, y: 30 },
    exit: { x: 740, y: 430, w: 30, h: 40 },
    platforms: [
        // === DECKE (mit Gap bei x:420-480) ===
        { x: 0, y: 0, w: 420, h: 30 },
        { x: 480, y: 0, w: 320, h: 30 },

        // === BODEN (mit Gap bei x:600-660) ===
        { x: 0, y: 470, w: 600, h: 30 },
        { x: 660, y: 470, w: 140, h: 30 },

        // === Mid-Air Plattform 1 (walk top/bottom je nach gravity) ===
        { x: 280, y: 240, w: 80, h: 20 },

        // === Mid-Air Plattform 2 ===
        { x: 560, y: 240, w: 80, h: 20 },

        // Wände
        { x: 0, y: 30, w: 10, h: 440 },
        { x: 790, y: 30, w: 10, h: 440 },
    ],
    spikes: [
        // Decken-Spikes (Flip nach unten)
        { x: 200, y: 30, w: 16, h: 15, dir: 'down' },
        { x: 220, y: 30, w: 16, h: 15, dir: 'down' },
        { x: 240, y: 30, w: 16, h: 15, dir: 'down' },

        // Boden-Spikes (Flip nach oben)
        { x: 360, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 380, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 400, y: 455, w: 16, h: 15, dir: 'up' },

        // Decken-Spikes direkt NACH dem Gap (Flip-Stress)
        { x: 520, y: 30, w: 16, h: 15, dir: 'down' },
        { x: 540, y: 30, w: 16, h: 15, dir: 'down' },

        // Boden-Spikes direkt NACH dem Gap
        { x: 680, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 700, y: 455, w: 16, h: 15, dir: 'up' },

        // Spikes auf der OBERSEITE der Mid-Air Plattform 1 (gDir=1)
        { x: 292, y: 225, w: 16, h: 15, dir: 'up' },
        { x: 332, y: 225, w: 16, h: 15, dir: 'up' },

        // Spikes auf der UNTERSEITE der Mid-Air Plattform 2 (gDir=-1)
        { x: 580, y: 260, w: 16, h: 15, dir: 'down' },
        { x: 612, y: 260, w: 16, h: 15, dir: 'down' },
    ],
    traps: [
        // Fake Decken-Spikes (verleiten zu unnötigem Flip)
        new FakeSpikes([
            { x: 120, y: 30, w: 16, h: 15, dir: 'down' },
            { x: 136, y: 30, w: 16, h: 15, dir: 'down' },
        ]),

        // Fallender Decken-Block — triggert bei x:460 (über dem Gap)
        new FallingCeiling(440, 10, 50, 30, 460),

        // Unsichtbare KillZone mitten im Gap-Bereich (kurz drunter)
        new KillZone(420, 240, 60, 40),

        // Fake Exit an der Decke — Endgame-Troll
        new FakeExit(740, 30),
    ],
});
