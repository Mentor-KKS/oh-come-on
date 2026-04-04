// ================================================================
// Level 10 — "Glitch"
// KONZEPT: 1200px Level. Controls flippen 4x ohne Warnung.
//          Jeder Flip NACH der Landung (nicht in der Luft).
//          PLUS: Fake-Spike-Puzzle — echte Spikes lehren "spring drüber",
//          dann kommen Fake-Spikes (harmlos!) + FakeFloor dahinter.
//          Man MUSS durch die Fake-Spikes LAUFEN und über den
//          FakeFloor SPRINGEN.
// LEKTION: "Dein größter Feind bist du selbst."
// ================================================================
LEVELS.push({
    name: "Glitch",
    width: 1200,
    invertControls: false,
    player: { x: 50, y: 440 },
    exit: { x: 1130, y: 420, w: 30, h: 40 },
    platforms: [
        // Sektion 1 — NORMAL (baut Vertrauen auf)
        { x: 0, y: 470, w: 250, h: 30 },
        // Lücke 250-320

        // Sektion 2 — nach Landung: FLIP 1 → invertiert
        { x: 320, y: 470, w: 230, h: 30 },
        // Lücke 550-620

        // Sektion 3 — nach Landung: FLIP 2 → normal
        { x: 620, y: 470, w: 230, h: 30 },
        // Spike-Puzzle hier! (echte → echte → FAKE + FakeFloor)
        // FakeFloor bei 830-890 (sieht aus wie Boden)
        { x: 890, y: 470, w: 60, h: 30 },
        // Lücke 950-1020

        // Sektion 4 — nach Landung: FLIP 3 → invertiert
        { x: 1020, y: 470, w: 180, h: 30 },

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 1190, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 1200, h: 10 },
    ],
    spikes: [
        // Lücke 1
        { x: 260, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 280, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 300, y: 468, w: 16, h: 15, dir: 'up' },
        // Lücke 2
        { x: 560, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 580, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 600, y: 468, w: 16, h: 15, dir: 'up' },
        // Echte Spikes in Sektion 3 (lehren: SPRING DRÜBER!)
        { x: 700, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 716, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 770, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 786, y: 455, w: 16, h: 15, dir: 'up' },
        // Lücke 3
        { x: 960, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 980, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 1000, y: 468, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // === CONTROL FLIPS — jeweils nach der Landung! ===
        new InvertZone(335),     // Flip 1: normal → invertiert (nach Lücke 1)
        new InvertZone(635),     // Flip 2: invertiert → normal (nach Lücke 2)
        new InvertZone(1035),    // Flip 3: normal → invertiert (nach Lücke 3)

        // === SEKTION 2: FallingFloor in invertierter Zone ===
        new FallingFloor(430, 470, 70, 30),

        // === SEKTION 3: SPIKE-PUZZLE ===
        // Echte Spikes bei x:700 und x:770 → Spieler lernt: drüberspringen!
        // FAKE Spikes bei x:830 → sehen identisch aus, töten NICHT!
        new FakeSpikes([
            { x: 830, y: 455, w: 16, h: 15, dir: 'up' },
            { x: 846, y: 455, w: 16, h: 15, dir: 'up' },
        ]),
        // FakeFloor HINTER den Fake-Spikes → sieht aus wie Boden, IST KEINER!
        // Spieler springt über Fake-Spikes (unnötig!) und landet auf FakeFloor → fällt!
        // Lösung: DURCH die Fake-Spikes laufen, ÜBER den FakeFloor springen
        new FakeFloor(830, 470, 60, 30),

        // === SEKTION 4: ShootingSpike + FallingCeiling ===
        new ShootingSpike(1190, 440, 'left', 1100, 3),
        new FallingCeiling(1080, 10, 60, 40, 1110),
    ],
});
