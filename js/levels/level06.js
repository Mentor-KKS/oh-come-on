// ================================================================
// Level 6 — "Wrong Way"
// KONZEPT: Level ist 900px breit. Camera startet bei x:100.
//          Der geheime Raum (x:0-100) ist komplett OFF-SCREEN.
//          Rechts: echtes, schwieriges Level → Fake Exit → Tod.
//          Spieler entdeckt durch Exploration: die linke "Wand"
//          (die es in jedem Level gibt) ist FAKE — man kann durch.
//          Camera scrollt smooth in den geheimen Raum mit Exit.
//
// TROLL: Die Wand die in JEDEM Level da war ist FAKE.
// LEKTION: "Hinterfrage ALLES. Auch die Wände."
// ================================================================
LEVELS.push({
    name: "Wrong Way",
    width: 900,
    cameraMinX: 100,
    player: { x: 200, y: 440 },
    exit: { x: 40, y: 420, w: 30, h: 40, showBelowX: 105 },
    platforms: [
        // === GEHEIMER RAUM (off-screen, links von cameraMinX) ===
        { x: 0, y: 0, w: 10, h: 500 },          // echte linke Wand
        { x: 10, y: 470, w: 90, h: 30 },         // Boden

        // === HAUPTLEVEL (x:112+) ===
        // Start-Boden
        { x: 112, y: 470, w: 175, h: 30 },
        // Lücke 287-365 → Spikes
        // Boden 2: FallingFloor 365-445, dann fester Boden
        { x: 445, y: 470, w: 90, h: 30 },
        // Lücke 535-610 → Spikes
        // Boden 3
        { x: 610, y: 470, w: 130, h: 30 },
        // Platform beim Fake Exit (erhöht!)
        { x: 790, y: 395, w: 100, h: 20 },

        // Wände + Decke
        { x: 890, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 900, h: 10 },
    ],
    spikes: [
        // Lücke 1 (3 Spikes, gleich wie Lücke 2)
        { x: 300, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 320, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 340, y: 468, w: 16, h: 15, dir: 'up' },
        // Lücke 2
        { x: 545, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 565, y: 468, w: 16, h: 15, dir: 'up' },
        { x: 585, y: 468, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // FAKE WAND — sieht aus wie die linke Wand, ist durchlässig!
        new FakeFloor(98, 0, 14, 500),

        // === RECHTE SEITE: Echtes, schwieriges Level ===

        // Boden 2: DIREKT am Anfang bricht weg nach dem Sprung!
        // Man landet, Boden bricht sofort → muss weiter springen
        new FallingFloor(365, 470, 80, 30),

        // Fallende Decke über Boden 3 (Stress!)
        new FallingCeiling(560, 10, 70, 45, 600),

        // Fallende Decke auf dem Weg zur Fake-Exit-Platform
        new FallingCeiling(700, 10, 60, 45, 740),

        // FAKE EXIT — auf erhöhter Platform, man MUSS hoch
        new FakeExit(810, 345),
    ],
});
