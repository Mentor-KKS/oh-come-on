// ================================================================
// Level 3 — "Run."
// KONZEPT: Level sieht harmlos aus. Flacher Boden, Exit rechts.
// TROLL: Nach ~1 Sekunde fängt der Boden an zu wackeln und fällt.
//        Abschnitt für Abschnitt, Timer-basiert — stehen bleiben = Tod.
//        Man muss sofort losrennen.
//        TWIST: Der vorletzte Abschnitt (vor dem Exit) fällt FRÜHER
//        als die anderen — wie in Level 1 geht der Boden VOR dir kaputt.
//        Man muss drüberspringen.
// LEKTION: "Der Boden wartet nicht auf dich."
// ================================================================
LEVELS.push({
    name: "Run.",
    player: { x: 50, y: 430 },
    exit: { x: 720, y: 410, w: 30, h: 40 },
    platforms: [
        // Nur das letzte Stück ist fester Boden
        { x: 650, y: 460, w: 150, h: 40 },
        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [],
    traps: [
        //                                         delay  shake
        // Boden fällt auf Timer — egal was Spieler macht
        new TimedFloor(0,   460, 100, 40,           70,    50),  // fällt bei ~120
        new TimedFloor(100, 460, 110, 40,          150,    50),  // fällt bei ~200
        new TimedFloor(210, 460, 120, 40,          230,    50),  // fällt bei ~280
        new TimedFloor(330, 460, 120, 40,          310,    50),  // fällt bei ~360
        new TimedFloor(450, 460, 120, 40,          390,    50),  // fällt bei ~440

        // TWIST: Dieser Abschnitt bricht wenn du nah kommst!
        // Du bist im vollen Sprint, denkst du schaffst es — NOPE.
        new TriggerFloor(570, 460, 80, 40, 540),
    ],
});
