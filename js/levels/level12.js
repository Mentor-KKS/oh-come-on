// ================================================================
// Level 12 — "Switch"
// KONZEPT: Zwei fallende Felsen am Start zwingen dich nach LINKS.
//          Dort entdeckst du die Kletterroute zu Switch B.
//          Switch B aktiviert die Brücke über den Spike-Pit.
// TROLL 1: Fallende Felsen — einer direkt am Start, einer wenn
//          du dich nach rechts bewegst → musst warten oder zurück.
// TROLL 2: Switch A auf einer verführerischen kleinen Plattform
//          sieht aus als wäre er die Lösung → deaktiviert aber den
//          Exit-Boden! Wer ihn drückt fällt später in die Spikes.
// LEKTION: "Die kleine Plattform ist eine Falle."
// ================================================================
LEVELS.push({
    name: "Switch",
    player: { x: 40, y: 440 },
    exit: { x: 730, y: 420, w: 30, h: 40 },
    platforms: [
        // Start-Boden
        { x: 0, y: 470, w: 280, h: 30 },

        // Kletterroute links (erreichbare Abstände!)
        { x: 10, y: 410, w: 60, h: 15 },   // P1 — 60px vom Boden
        { x: 10, y: 345, w: 60, h: 15 },   // P2 — 65px
        { x: 10, y: 280, w: 60, h: 15 },   // P3 — 65px
        { x: 10, y: 215, w: 60, h: 15 },   // P4 — 65px (Switch B hier)

        // Verführerische Trap-Platform (Switch A drauf)
        { x: 170, y: 405, w: 55, h: 12 },

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [
        // Spike-Pit unten
        { x: 295, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 315, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 335, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 355, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 375, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 395, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 415, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 435, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 455, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 475, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 495, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 515, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 535, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 555, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 575, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 595, y: 468, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // Zwei fallende Felsen am Start — dicht beieinander, nur links ist Platz
        new FallingCeiling(40, 10, 50, 40, 60),
        new FallingCeiling(100, 10, 50, 40, 60),

        // Exit-Boden als TogglePlatform (startet AKTIV, kann durch Switch A deaktiviert werden)
        new TogglePlatform(620, 470, 180, 30, 'exit_floor', true),

        // Brücke über den Pit (Gruppe 'bridge', startet INAKTIV)
        new TogglePlatform(285, 420, 75, 20, 'bridge', false),
        new TogglePlatform(370, 420, 75, 20, 'bridge', false),
        new TogglePlatform(455, 420, 75, 20, 'bridge', false),
        new TogglePlatform(540, 420, 75, 20, 'bridge', false),

        // Switch A — auf verführerischer Trap-Platform (TRAP!)
        new Switch(180, 395, 'exit_floor'),

        // Switch B — oben auf P4 (LÖSUNG)
        new Switch(20, 205, 'bridge'),
    ],
});
