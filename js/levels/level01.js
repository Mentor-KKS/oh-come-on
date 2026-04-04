// ================================================================
// Level 1 — "Welcome"
// KONZEPT: Einfaches Intro. Spieler lernt Steuerung.
// TROLL: Boden direkt vor dem Exit bricht weg. Erste Überraschung.
// LEKTION: "Trau dem Boden nicht."
// ================================================================
LEVELS.push({
    name: "Welcome",
    player: { x: 50, y: 440 },
    exit: { x: 735, y: 420, w: 30, h: 40 },
    platforms: [
        { x: 0, y: 470, w: 350, h: 30 },
        { x: 430, y: 470, w: 190, h: 30 },
        { x: 720, y: 470, w: 80, h: 30 },
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [],
    traps: [
        new FallingFloor(620, 470, 100, 30),
    ],
});
