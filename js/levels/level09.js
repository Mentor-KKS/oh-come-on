// ================================================================
// Level 9 — "No Going Back"
// KONZEPT: Du kannst NUR nach rechts. Links drücken = SOFORT Tod.
//          Rote Todeswand jagt von links. Shooting Spikes von rechts.
//          Kein Korrigieren, kein Umdrehen, nur vorwärts.
// TROLL 1: Links drücken = Tod (Instinkt bei Gefahr: zurückweichen!)
// TROLL 2: Shooting Spikes fliegen entgegen → springen OHNE links
// TROLL 3: FallingFloors brechen weg mitten im Sprint
// TROLL 4: FakeExit auf halber Strecke lockt zum Bremsen
// LEKTION: "Rückwärts gibt es nicht. Vorwärts oder Tod."
// ================================================================
LEVELS.push({
    name: "No Going Back",
    width: 1600,
    noLeft: true,
    player: { x: 60, y: 440 },
    exit: { x: 1520, y: 420, w: 30, h: 40 },
    platforms: [
        // Gauntlet — 6 Bodensegmente mit Lücken
        { x: 0, y: 470, w: 200, h: 30 },
        // Lücke 200-270
        { x: 270, y: 470, w: 180, h: 30 },
        // Lücke 450-520
        { x: 520, y: 470, w: 200, h: 30 },
        // Lücke 720-790
        { x: 790, y: 470, w: 200, h: 30 },
        // Lücke 990-1060
        { x: 1060, y: 470, w: 200, h: 30 },
        // Lücke 1260-1330
        { x: 1330, y: 470, w: 270, h: 30 },

        // Erhöhte Platform für FakeExit
        { x: 620, y: 395, w: 80, h: 20 },

        // Wände + Decke
        { x: 1590, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 1600, h: 10 },
    ],
    spikes: [
        // Lücke 1
        { x: 210, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 230, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 250, y: 468, w: 16, h: 15, dir: 'up' },
        // Lücke 2
        { x: 460, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 480, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 500, y: 468, w: 16, h: 15, dir: 'up' },
        // Lücke 3
        { x: 730, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 750, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 770, y: 468, w: 16, h: 15, dir: 'up' },
        // Lücke 4
        { x: 1000, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 1020, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 1040, y: 468, w: 16, h: 15, dir: 'up' },
        // Lücke 5
        { x: 1270, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 1290, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 1310, y: 468, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // TODESWAND jagt von links
        new ChasingWall(0.6, 90),

        // SHOOTING SPIKES — fliegen dir entgegen auf versch. Höhen!
        new ShootingSpike(1590, 445, 'left', 250, 3),
        new ShootingSpike(1590, 420, 'left', 500, 4),
        new ShootingSpike(1590, 445, 'left', 750, 3),
        new ShootingSpike(1590, 410, 'left', 1000, 4),
        new ShootingSpike(1590, 445, 'left', 1300, 5),

        // Fallende Decken
        new FallingCeiling(260, 10, 60, 40, 290),
        new FallingCeiling(780, 10, 60, 40, 810),
        new FallingCeiling(1320, 10, 60, 40, 1350),

        // Böden brechen weg mitten im Sprint!
        new FallingFloor(350, 470, 80, 30),
        new FallingFloor(880, 470, 80, 30),
        new FallingFloor(1150, 470, 70, 30),

        // FakeExit auf erhöhter Platform — lockt zum Bremsen
        new FakeExit(640, 345),
    ],
});
