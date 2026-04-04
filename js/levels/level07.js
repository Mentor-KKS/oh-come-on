// ================================================================
// Level 7 — "Come Back Here!"
// KONZEPT: Exit flüchtet durch das ganze Level. Man jagt ihn.
// TROLL 1: Exit haut ab, immer wenn man nah dran ist.
// TROLL 2: Während der Jagd bricht der Boden weg (FallingFloor).
// TROLL 3: Deckenblöcke fallen wenn man den höheren Plattformen
//          nah kommt — man wird unter Druck gesetzt.
// TROLL 4: Der Exit flieht zuletzt auf eine Plattform wo der
//          Boden vorher weggebrochen ist → man muss drumherum.
// LEKTION: "Selbst das Ziel verarscht dich."
// ================================================================
LEVELS.push({
    name: "Come Back Here!",
    player: { x: 50, y: 440 },
    exit: null,
    platforms: [
        // Boden (mit Lücke für FallingFloor in der Mitte)
        { x: 0, y: 470, w: 300, h: 30 },
        { x: 400, y: 470, w: 400, h: 30 },

        // Plattformen zum Hochklettern (erreichbare Abstände!)
        { x: 100, y: 395, w: 110, h: 20 },      // A (links, niedrig)
        { x: 280, y: 330, w: 110, h: 20 },       // B (mitte, mittel)
        { x: 470, y: 395, w: 110, h: 20 },       // C (rechts, niedrig)
        { x: 630, y: 330, w: 110, h: 20 },       // D (rechts, mittel)
        { x: 300, y: 260, w: 110, h: 20 },       // E (mitte, hoch)

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [],
    traps: [
        // EXIT FLÜCHTET durch 4 Positionen:
        // 1. Boden rechts (einfach) → 2. Plattform C → 3. Plattform E (hoch!)
        // 4. Zurück zum Boden LINKS — aber der ist weggebrochen!
        new MovingExit([
            { x: 720, y: 430 },          // 1: Boden rechts, easy
            { x: 490, y: 345 },          // 2: Auf Plattform C
            { x: 320, y: 210 },          // 3: Auf Plattform E (hoch!)
            { x: 50, y: 430 },           // 4: Zurück zum Boden links...
        ]),

        // Boden bricht weg beim Herumlaufen (Mitte)
        new FallingFloor(300, 470, 100, 30),

        // Deckenblöcke fallen bei den oberen Plattformen
        new FallingCeiling(280, 10, 60, 40, 310),
        new FallingCeiling(620, 10, 60, 40, 660),

        // PLOTTWIST: Spikes am letzten Exit-Punkt — custom Logik
        {
            x: 120, baseY: 470, y: 470, w: 80, h: 0, maxH: 20,
            triggered: false, speed: 1.5, type: 'finalSpikes',
            update(player) {
                // Nur auslösen wenn Exit am letzten Punkt UND Spieler nah
                const exit = game.levelData.traps.find(t => t.type === 'movingExit');
                const exitAtEnd = exit && exit.index >= exit.positions.length - 1 && !exit.moving;
                if (!this.triggered && exitAtEnd && player.alive) {
                    if (Math.abs(player.x - 170) < 60) this.triggered = true;
                }
                if (this.triggered && this.h < this.maxH) {
                    this.h += this.speed;
                    this.y = this.baseY - this.h;
                }
                if (this.h > 5 && player.alive) {
                    if (aabb(player, { x: this.x + 3, y: this.y, w: this.w - 6, h: this.h })) {
                        player.die();
                    }
                }
            },
            draw() {
                if (this.h <= 0) return;
                const spikeW = 12;
                const count = Math.floor(this.w / spikeW);
                ctx.fillStyle = '#e74c3c';
                for (let i = 0; i < count; i++) {
                    const sx = this.x + i * spikeW;
                    ctx.beginPath();
                    ctx.moveTo(sx, this.baseY);
                    ctx.lineTo(sx + spikeW / 2, this.y);
                    ctx.lineTo(sx + spikeW, this.baseY);
                    ctx.closePath();
                    ctx.fill();
                }
            },
            reset() { this.triggered = false; this.h = 0; this.y = this.baseY; }
        },
    ],
});
