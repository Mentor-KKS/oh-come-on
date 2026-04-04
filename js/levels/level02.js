// ================================================================
// Level 2 — "Nope!"
// KONZEPT: Spieler will auf die erste Platform springen.
// TROLL: Platform zuckt weg sobald man in der Luft ist!
//        Man landet in Spikes. Muss in der Luft umkehren,
//        zurück auf Start landen, warten bis Platform zurückkommt,
//        DANN draufspringen.
// LEKTION: "Selbst der Boden will nicht dass du gewinnst."
// ================================================================
LEVELS.push({
    name: "Nope!",
    player: { x: 50, y: 440 },
    exit: { x: 720, y: 420, w: 30, h: 40 },
    platforms: [
        { x: 0, y: 470, w: 200, h: 30 },
        { x: 420, y: 400, w: 100, h: 20 },
        { x: 600, y: 470, w: 200, h: 30 },
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [
        { x: 215, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 235, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 255, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 275, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 295, y: 468, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // Platform zuckt nach rechts weg, kommt nach ~1.3s zurück
        new DodgingPlatform(250, 400, 100, 20, 500, 80),
    ],
});
