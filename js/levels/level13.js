// ================================================================
// Level 13 — "Wind"
// KONZEPT: Durchgehender Boden mit Spike-Hindernissen zum Überspringen.
//          Wind-Zonen die Sprünge unberechenbar machen.
// NEUE MECHANIK: Wind nutzt extVx (externe Kraft) — wirkt TATSÄCHLICH,
//                überlebt das moveSpeed-Cap.
// TROLL: Du schätzt deinen Sprung. Der Wind ändert alles.
//        Zone 1: Leichter Gegenwind → Sprünge kommen kürzer
//        Zone 2: Rückenwind → du überfliegst und landest in Spikes
//        Zone 3: Starker Gegenwind kurz vor dem Exit → du kämpfst dich durch
// ================================================================
LEVELS.push({
    name: "Wind",
    player: { x: 50, y: 440 },
    exit: { x: 740, y: 420, w: 30, h: 40 },
    platforms: [
        // Durchgehender Boden — Hindernisse sind die Spikes OBEN drauf
        { x: 0, y: 470, w: 800, h: 30 },

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [
        // Hindernis 1 — im Gegenwind (Zone 1)
        { x: 200, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 216, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 232, y: 455, w: 16, h: 15, dir: 'up' },
        // Hindernis 2 — im Rückenwind (Zone 2, überfliegen droht!)
        { x: 420, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 436, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 452, y: 455, w: 16, h: 15, dir: 'up' },
        // Landezone 2 wird knapp durch Wind → mehr Spikes als "Puffer"
        { x: 480, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 496, y: 455, w: 16, h: 15, dir: 'up' },
        // Hindernis 3 — im starken Gegenwind (Zone 3)
        { x: 640, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 656, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 672, y: 455, w: 16, h: 15, dir: 'up' },
    ],
    traps: [
        // Zone 1: leichter Gegenwind — Sprünge fallen kürzer aus
        new WindZone(120, 380, 180, 90, -0.08),

        // Zone 2: Rückenwind — Überschwinger! Landet in den Extra-Spikes
        new WindZone(320, 380, 180, 90, 0.1),

        // Zone 3: starker Gegenwind vor dem Exit
        new WindZone(560, 380, 180, 90, -0.12),
    ],
});
