// ================================================================
// Level 4 — "Trust Fall"
// KONZEPT: Sieht aus wie ein normales Platform-Level.
//          Alle Plattformen wackeln wenn man draufsteht.
// TROLL: Eine davon IST ein FallingFloor — sieht identisch aus.
//        Spieler steht drauf, wartet entspannt... fällt in den Tod.
// LEKTION: "Wackeln heißt nicht immer sicher."
// ================================================================
LEVELS.push({
    name: "Trust Fall",
    player: { x: 50, y: 440 },
    exit: { x: 730, y: 420, w: 30, h: 40 },
    platforms: [
        { x: 0, y: 470, w: 100, h: 30 },
        { x: 660, y: 470, w: 140, h: 30 },
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [],
    traps: [
        new TrollShaker(150, 420, 100, 20),
        new TrollShaker(300, 386, 100, 20),
        new FallingFloor(460, 386, 100, 20),   // WACKELT UND FÄLLT!
        new TrollShaker(590, 420, 80, 20),
    ],
});
