// ================================================================
// Level 15 — "Upside Down"
// NEUE MECHANIK: gravityDir: -1 — die gesamte Schwerkraft ist
//                umgedreht. Du "läufst" an der Decke.
//                Springen stößt dich NACH UNTEN (von der Decke weg).
//                Was aussieht wie "oben" ist jetzt "unten".
// KONZEPT: Finale mit komplett umgedrehtem Level-Design.
//          Der Boden ist jetzt bei y:30 (die "Decke" ist dein Boden).
//          Spikes ragen NACH UNTEN von deinem Boden.
//          Fallende Böden, Exit oben usw. alles gespiegelt.
// TROLL: Dein Gehirn streikt. "Oben" und "unten" sind vertauscht.
//        Plus: ein Fake-Exit GANZ unten (wo normalerweise das Ziel ist).
// ================================================================
LEVELS.push({
    name: "Upside Down",
    gravityDir: -1,
    player: { x: 50, y: 40 },
    exit: { x: 720, y: 40, w: 30, h: 40 },
    platforms: [
        // "Boden" ist jetzt OBEN (die Decke)
        { x: 0, y: 0, w: 350, h: 30 },
        { x: 430, y: 0, w: 190, h: 30 },
        { x: 700, y: 0, w: 100, h: 30 },

        // "Höhere" Plattformen sind jetzt WEITER UNTEN
        { x: 180, y: 120, w: 100, h: 20 },
        { x: 380, y: 180, w: 100, h: 20 },
        { x: 560, y: 130, w: 100, h: 20 },

        // Wände
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        // "Decke" ist jetzt der normale Boden (unten)
        { x: 0, y: 490, w: 800, h: 10 },
    ],
    spikes: [
        // Spikes zeigen jetzt NACH UNTEN (von dem "Boden" oben weg)
        // In der Lücke zwischen den oberen Böden
        { x: 355, y: 30, w: 16, h: 15, dir: 'down' },
        { x: 375, y: 30, w: 16, h: 15, dir: 'down' },
        { x: 395, y: 30, w: 16, h: 15, dir: 'down' },
        { x: 415, y: 30, w: 16, h: 15, dir: 'down' },
    ],
    traps: [
        // FakeExit ganz unten — wo normalerweise der Exit wäre
        new FakeExit(730, 420),
    ],
});
