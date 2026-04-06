// Level 19 — "Icy Tower"
// KONZEPT: Vertikales Level. Springe nach oben, Plattformen unter dir verschwinden
// (RisingDeath steigt von unten). Wie im Original: unten = Tod.
// TROLL: Plattformen werden kleiner und weiter auseinander.

LEVELS.push({
    name: 'Icy Tower',
    width: 800,
    height: 2200,
    verticalScroll: true,
    player: { x: 350, y: 2100 },
    exit: { x: 375, y: 70, w: 30, h: 40 },
    platforms: [
        // Startbereich (breit, sicher)
        { x: 200, y: 2150, w: 400, h: 30 },

        // Sektion 1: Einfache breite Plattformen
        { x: 100, y: 2050, w: 200, h: 20 },
        { x: 450, y: 1970, w: 200, h: 20 },
        { x: 200, y: 1890, w: 180, h: 20 },
        { x: 500, y: 1810, w: 180, h: 20 },
        { x: 100, y: 1730, w: 180, h: 20 },

        // Sektion 2: Mittlere Plattformen
        { x: 400, y: 1650, w: 150, h: 20 },
        { x: 150, y: 1570, w: 150, h: 20 },
        { x: 500, y: 1490, w: 140, h: 20 },
        { x: 250, y: 1410, w: 140, h: 20 },
        { x: 550, y: 1330, w: 130, h: 20 },
        { x: 100, y: 1250, w: 130, h: 20 },

        // Sektion 3: Kleine Plattformen (wird schwieriger)
        { x: 400, y: 1170, w: 110, h: 20 },
        { x: 200, y: 1090, w: 100, h: 20 },
        { x: 550, y: 1010, w: 100, h: 20 },
        { x: 300, y: 930, w: 90, h: 20 },
        { x: 100, y: 850, w: 90, h: 20 },
        { x: 500, y: 770, w: 90, h: 20 },

        // Sektion 4: Sehr kleine Plattformen
        { x: 250, y: 690, w: 80, h: 20 },
        { x: 550, y: 610, w: 70, h: 20 },
        { x: 150, y: 530, w: 70, h: 20 },
        { x: 450, y: 450, w: 70, h: 20 },
        { x: 200, y: 370, w: 70, h: 20 },
        { x: 500, y: 290, w: 80, h: 20 },

        // Finale: Plattform zum Exit
        { x: 300, y: 210, w: 100, h: 20 },
        { x: 330, y: 110, w: 150, h: 20 },
    ],
    spikes: [
        // Wand-Spikes an engen Stellen
        { x: 0, y: 1700, w: 15, h: 60, dir: 'right' },
        { x: 785, y: 1300, w: 15, h: 60, dir: 'left' },
        { x: 0, y: 900, w: 15, h: 60, dir: 'right' },
        { x: 785, y: 500, w: 15, h: 60, dir: 'left' },
        // Decken-Spikes kurz vor Exit
        { x: 350, y: 60, w: 100, h: 15, dir: 'down' },
    ],
    traps: [
        // RisingDeath: Rote Zone steigt von unten (startY = unter Level)
        new RisingDeath(0.5, 120, 2300),
        // Ein paar FallingFloors für extra Panik
        new FallingFloor(550, 1010, 100, 20),
        new FallingFloor(200, 690, 80, 20),
    ],
});
