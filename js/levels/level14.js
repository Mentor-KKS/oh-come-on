// ================================================================
// Level 14 — "Shadow"
// NEUE MECHANIK: Ein Schatten-Spieler spiegelt deine Position
//                horizontal um die Level-Mitte (x:400).
//                Läufst du nach rechts, läuft er nach links.
//                Wenn der Schatten in Spikes läuft → DU stirbst!
// TROLL: Das Level ist SYMMETRISCH aber mit UNTERSCHIEDLICHEN
//        Spike-Positionen auf beiden Seiten. Du musst Positionen
//        finden wo BEIDE Seiten sicher sind.
// ================================================================
LEVELS.push({
    name: "Shadow",
    player: { x: 50, y: 440 },
    exit: { x: 380, y: 260, w: 30, h: 40 },
    platforms: [
        // Durchgehender Boden — Spieler und Schatten brauchen ihn beide
        { x: 0, y: 470, w: 800, h: 30 },

        // Symmetrische Plattformen
        { x: 100, y: 395, w: 90, h: 20 },
        { x: 610, y: 395, w: 90, h: 20 },
        { x: 230, y: 330, w: 90, h: 20 },
        { x: 480, y: 330, w: 90, h: 20 },
        { x: 355, y: 280, w: 90, h: 20 },

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [
        // ASYMMETRISCH — manche nur links, manche nur rechts.
        // Der Schatten hat an x:(800-playerX) andere Spikes!

        // Linke Seite: Spikes bei x:160-200 (der Spieler muss drüber)
        { x: 160, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 180, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 200, y: 455, w: 16, h: 15, dir: 'up' },

        // Rechte Seite: Spikes bei x:550-590
        // Der Spieler ist dort bei Schatten=210 → SPIEL muss diese Zone meiden
        // Also: Spieler muss bei x:210-250 (Schatten 550-590) springen
        { x: 550, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 570, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 590, y: 455, w: 16, h: 15, dir: 'up' },

        // Linke Seite: Spikes bei x:340-380
        { x: 340, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 360, y: 455, w: 16, h: 15, dir: 'up' },

        // Rechte Seite: Spikes bei x:420-460
        { x: 420, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 440, y: 455, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // Schatten-Spieler spiegelt Position
        new ShadowPlayer(),
    ],
});
