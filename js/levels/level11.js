// ================================================================
// Level 11 — "In The Dark"
// NEUE MECHANIK: Dunkelheit — nur kleiner Sichtkreis um den Spieler
// TROLL: Hindernisse im Dunkeln. Man merkt sie erst wenn man
//        schon drauf ist. Jeder Tod lehrt ein Stück Level.
// ================================================================
LEVELS.push({
    name: "In The Dark",
    player: { x: 50, y: 440 },
    exit: { x: 730, y: 420, w: 30, h: 40 },
    platforms: [
        // Boden mit Lücken
        { x: 0, y: 470, w: 180, h: 30 },
        { x: 260, y: 470, w: 180, h: 30 },
        { x: 520, y: 470, w: 280, h: 30 },

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [
        // Lücke 1 (unsichtbar im Dunkeln!)
        { x: 190, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 210, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 230, y: 468, w: 16, h: 15, dir: 'up' },
        // Lücke 2
        { x: 450, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 470, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 490, y: 468, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // Fallen im Dunkeln — man sieht sie erst im letzten Moment
        new FallingFloor(340, 470, 80, 30),
        new FallingCeiling(330, 10, 70, 45, 370),
        new FallingCeiling(580, 10, 70, 45, 620),
        new FallingFloor(640, 470, 70, 30),

        // DUNKELHEIT
        new DarknessOverlay(95),
    ],
});
