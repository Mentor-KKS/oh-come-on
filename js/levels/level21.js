// Level 21 — "Trap Door"
// KONZEPT: Das Loch im Boden IST der echte Weg. 16 Level lang gelernt: Loch = Tod.
// TROLL: Oben ist ein FakeExit der dich killt. Der "Todespit" führt zum echten Exit.

LEVELS.push({
    name: 'Level_21',
    height: 700,
    width: 800,
    player: { x: 50, y: 200 },
    exit: { x: 370, y: 620, w: 30, h: 40 },
    platforms: [
        // === OBERE EBENE (sieht wie normales Level aus) ===
        // Boden mit verdächtigem Loch in der Mitte
        { x: 0, y: 280, w: 300, h: 20 },
        { x: 500, y: 280, w: 300, h: 20 },
        // Plattformen zum "Exit" oben rechts
        { x: 600, y: 200, w: 100, h: 20 },
        { x: 650, y: 130, w: 120, h: 20 },
        // Kleine Plattform über dem Loch (Versuchung)
        { x: 360, y: 220, w: 80, h: 20 },

        // === UNTERE EBENE (der echte Weg) ===
        // Wände des Schachts
        { x: 280, y: 300, w: 20, h: 200 },
        { x: 500, y: 300, w: 20, h: 200 },
        // Boden des Schachts
        { x: 280, y: 500, w: 240, h: 20 },
        // Plattformen zum echten Exit
        { x: 320, y: 570, w: 80, h: 20 },
        { x: 420, y: 620, w: 80, h: 20 },
        // Boden unten
        { x: 250, y: 660, w: 300, h: 40 },
    ],
    spikes: [
        // Spikes die das Loch "gefährlich" aussehen lassen (aber FakeSpikes!)
        // Echte Spikes am oberen Weg
        { x: 650, y: 110, w: 120, h: 15, dir: 'down' },
        // Spikes im Schacht (echte Gefahr)
        { x: 300, y: 485, w: 50, h: 15, dir: 'up' },
        { x: 450, y: 485, w: 50, h: 15, dir: 'up' },
    ],
    traps: [
        // FakeExit oben rechts — sieht echt aus, killt dich
        new FakeExit(730, 90),
        // FakeSpikes am Rand des Lochs — sehen tödlich aus, sind harmlos
        new FakeSpikes([
            { x: 310, y: 265, w: 40, h: 15, dir: 'up' },
            { x: 450, y: 265, w: 40, h: 15, dir: 'up' },
        ]),
        // FakeFloor über dem Loch — sieht wie Boden aus, man fällt durch
        new FakeFloor(300, 280, 200, 20),
        // FallingCeiling wenn man zum FakeExit klettert
        new FallingCeiling(660, 0, 100, 30, 640),
    ],
});
