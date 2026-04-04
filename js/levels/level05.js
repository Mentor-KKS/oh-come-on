// ================================================================
// Level 5 — "Almost There"
// KONZEPT: Tür ist rechts am Boden, offensichtlich erreichbar.
//          Spieler geht direkt hin → FAKE EXIT, tot.
//          Jetzt weiß man: diese Tür ist Fake. Wo ist die echte?
//          Nach oben klettern! Aber Deckenblöcke fallen beim Klettern.
// TROLL 1: Die offensichtliche Tür am Boden ist Fake → Tod
// TROLL 2: Beim Hochklettern fallen Deckenblöcke (Panik)
// LEKTION: "Die einfachste Lösung ist oft eine Lüge."
// ================================================================
LEVELS.push({
    name: "Almost There",
    player: { x: 50, y: 440 },
    exit: { x: 600, y: 120, w: 30, h: 40, showAboveY: 175 },
    platforms: [
        // Boden
        { x: 0, y: 470, w: 800, h: 30 },
        // Kletterroute (links, weniger auffällig als die Tür rechts)
        { x: 50, y: 395, w: 100, h: 20 },
        { x: 210, y: 320, w: 100, h: 20 },
        { x: 370, y: 245, w: 100, h: 20 },
        { x: 530, y: 170, w: 140, h: 20 },
        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [],
    traps: [
        // FAKE EXIT am Boden — das Erste was man sieht, geht direkt hin
        new FakeExit(730, 420),

        // Deckenblöcke beim Hochklettern (langsamer, aber gefährlich)
        new FallingCeiling(200, 10, 50, 35, 240),
        new FallingCeiling(360, 10, 50, 35, 400),
        new FallingCeiling(520, 10, 50, 35, 560),
    ],
});
