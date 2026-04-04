// ================================================================
// Level 1 — "Welcome"
// KONZEPT: Einfaches Intro. Spieler lernt Steuerung.
// TROLL: Boden direkt vor dem Exit bricht weg. Erste Überraschung.
// LEKTION: "Trau dem Boden nicht."
// ================================================================
LEVELS.push({
    name: "Welcome",
    player: { x: 50, y: 440 },
    exit: { x: 735, y: 420, w: 30, h: 40 },
    platforms: [
        { x: 0, y: 470, w: 350, h: 30 },
        { x: 430, y: 470, w: 190, h: 30 },
        { x: 720, y: 470, w: 80, h: 30 },
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [],
    traps: [
        // Schneller FallingFloor — fällt nach 20 Frames statt 75
        {
            x: 620, y: 470, origY: 470, w: 100, h: 30,
            solid: true, triggered: false, shakeTimer: 0,
            falling: false, vy: 0, type: 'fallingFloor',
            update(player) {
                if (!this.triggered && this.solid && player.alive && player.grounded &&
                    player.x + player.w > this.x && player.x < this.x + this.w &&
                    Math.abs((player.y + player.h) - this.y) < 3) {
                    this.triggered = true;
                    this.shakeTimer = 20;
                    SFX.trapTrigger();
                }
                if (this.triggered && !this.falling) {
                    this.shakeTimer--;
                    if (this.shakeTimer <= 0) this.falling = true;
                }
                if (this.falling) {
                    this.vy += 0.4;
                    this.y += this.vy;
                    if (this.y > H + 50) this.solid = false;
                }
            },
            draw() {
                if (this.y > H + 50) return;
                let dx = 0;
                if (this.triggered && !this.falling) dx = rand(-2, 2);
                rect(this.x + dx, this.y, this.w, this.h, '#d0d0d0');
                rect(this.x + dx, this.y, this.w, 3, '#e8e8e8');
            },
            reset() {
                this.y = this.origY; this.solid = true; this.triggered = false;
                this.shakeTimer = 0; this.falling = false; this.vy = 0;
            }
        },
    ],
});
