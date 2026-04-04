// ================================================================
// Level 8 — "Rising"
// KONZEPT: Rote Todeszone steigt von unten hoch. Spieler muss
//          Plattform für Plattform nach oben klettern.
//          Stehen bleiben = Tod. Komplett neue Mechanik.
// TROLL 1: Eine Plattform zuckt weg (DodgingPlatform) während die
//          Todeszone steigt → maximaler Stress beim Warten.
// TROLL 2: Eine Plattform oben bricht weg (FallingFloor) → schnell!
// TROLL 3: Exit-Plattform wackelt (TrollShaker) → Paranoia nach L4.
//          Ist aber safe. Wer zögert wird von der Todeszone geholt.
// LEKTION: "Bleib nie stehen."
// ================================================================
LEVELS.push({
    name: "Rising",
    player: { x: 100, y: 440 },
    exit: null,
    platforms: [
        // Boden (wird bald überflutet!)
        { x: 0, y: 470, w: 800, h: 30 },
        // Kletterroute (Zickzack, enge Abstände)
        { x: 200, y: 420, w: 110, h: 20 },       // P1
        { x: 370, y: 370, w: 110, h: 20 },       // P2
        // P3 = DodgingPlatform (Trap)
        { x: 370, y: 270, w: 110, h: 20 },       // P4
        // P5 = FallingFloor (Trap)
        { x: 370, y: 170, w: 110, h: 20 },       // P6
        // P7 = TrollShaker (Trap) — Exit-Plattform

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [],
    traps: [
        // ROTE TODESZONE — steigt langsam hoch
        new RisingDeath(0.18),

        // P3: Platform zuckt weg! Warten während Tod steigt.
        new DodgingPlatform(540, 320, 110, 20, 250, 70),

        // P5: Bricht weg wenn man draufsteht → schnell weiter!
        new FallingFloor(200, 220, 110, 20),

        // P7 links: TrollShaker (wackelt, bleibt stehen)
        new TrollShaker(540, 120, 70, 20),

        // P7 rechts: Folgt der MovingExit Position (perfekter Sync)
        {
            x: 610, origX: 610, y: 120, w: 70, h: 20,
            solid: true, type: 'dodgingPlatform',
            update() {
                const exit = game.levelData.traps.find(t => t.type === 'movingExit');
                if (exit) this.x = exit.x - 20;
            },
            draw() {
                rect(this.x, this.y, this.w, this.h, '#d0d0d0');
                rect(this.x, this.y, this.w, 3, '#e8e8e8');
            },
            reset() { this.x = this.origX; }
        },

        // MovingExit — wie Level 7, unberührbar während Flucht
        new MovingExit([
            { x: 630, y: 68 },
            { x: 720, y: 68 },
        ]),
    ],
});
