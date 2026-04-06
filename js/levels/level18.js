// Level 18 — "Geometry Dash"
// KONZEPT: Auto-Runner. Spieler bewegt sich automatisch nach rechts.
// Nur Springen ist steuerbar. Timing ist alles.
// TROLL: Tempo ist konstant, eine falsche Entscheidung = Tod.

LEVELS.push({
    name: 'Geometry Dash',
    width: 2400,
    autoRun: 3,
    player: { x: 50, y: 430 },
    exit: { x: 2340, y: 420, w: 30, h: 40 },
    platforms: [
        // Durchgehender Boden mit Lücken
        { x: 0, y: 460, w: 250, h: 40 },
        // Lücke 250-320 (Jump 1)
        { x: 320, y: 460, w: 200, h: 40 },
        // Lücke 520-580 (Jump 2)
        { x: 580, y: 460, w: 150, h: 40 },
        // Erhöhte Plattform
        { x: 730, y: 400, w: 100, h: 20 },
        { x: 850, y: 400, w: 80, h: 20 },
        // Zurück auf Boden
        { x: 950, y: 460, w: 200, h: 40 },
        // Lücke 1150-1220
        { x: 1220, y: 460, w: 100, h: 40 },
        // Doppelsprung-Sektion: Plattformen oben
        { x: 1340, y: 380, w: 80, h: 20 },
        { x: 1450, y: 350, w: 80, h: 20 },
        { x: 1560, y: 380, w: 80, h: 20 },
        // Boden wieder
        { x: 1660, y: 460, w: 300, h: 40 },
        // Finale Sektion
        { x: 2000, y: 460, w: 120, h: 40 },
        // Lücke
        { x: 2160, y: 460, w: 100, h: 40 },
        // Exit-Plattform
        { x: 2300, y: 460, w: 100, h: 40 },
    ],
    spikes: [
        // Spike-Wände zum Drüberspringen
        { x: 200, y: 440, w: 20, h: 20, dir: 'up' },
        { x: 470, y: 440, w: 20, h: 20, dir: 'up' },
        { x: 650, y: 440, w: 20, h: 20, dir: 'up' },
        // Spikes auf erhöhten Plattformen
        { x: 800, y: 385, w: 30, h: 15, dir: 'up' },
        // Boden-Spikes
        { x: 1000, y: 440, w: 30, h: 20, dir: 'up' },
        { x: 1080, y: 440, w: 30, h: 20, dir: 'up' },
        // Decken-Spikes (Timing!)
        { x: 1350, y: 340, w: 60, h: 15, dir: 'down' },
        { x: 1460, y: 310, w: 60, h: 15, dir: 'down' },
        // Finale Spikes
        { x: 1750, y: 440, w: 30, h: 20, dir: 'up' },
        { x: 1850, y: 440, w: 30, h: 20, dir: 'up' },
        { x: 2060, y: 440, w: 30, h: 20, dir: 'up' },
        // Tod-Boden in Lücken
        { x: 250, y: 490, w: 70, h: 15, dir: 'up' },
        { x: 520, y: 490, w: 60, h: 15, dir: 'up' },
        { x: 1150, y: 490, w: 70, h: 15, dir: 'up' },
    ],
    traps: [
        // ShootingSpikes für Überraschung
        new ShootingSpike(900, 400, -1, 800, 4),
        new ShootingSpike(1700, 460, -1, 1650, 5),
        // FallingFloor kurz vor dem Exit (klassischer Troll)
        new FallingFloor(2160, 460, 100, 40),
    ],
});
