// ================================================================
// Level 13 — "Wind"
// Drei Sektionen mit unterschiedlichen Wind-Mechaniken:
// 1. Start: Gegenwind macht Sprung unmöglich. Zwei UNSICHTBARE Plattformen
//    (erscheinen beim Hochspringen) als einziger Weg über Cluster 1.
// 2. Mitte: Rückenwind — beschleunigt, muss früher abspringen.
// 3. Ende: Diagonaler Wind → FallingFloor → zweiter Diagonal-Wind →
//    Moving Platform → Exit-Plattform oben-links.
// ================================================================
LEVELS.push({
    name: "Wind",
    player: { x: 50, y: 440 },
    exit: { x: 40, y: 180, w: 30, h: 40 },
    platforms: [
        // Boden
        { x: 0, y: 470, w: 800, h: 30 },

        // Exit-Plattform oben-links (Ziel der Moving Platform)
        { x: 10, y: 220, w: 120, h: 15 },

        // Wände + Decke
        { x: 0, y: 0, w: 10, h: 500 },
        { x: 790, y: 0, w: 10, h: 500 },
        { x: 0, y: 0, w: 800, h: 10 },
    ],
    spikes: [
        // Cluster 1 (links) — sieht überspringbar aus, ist es aber durch Gegenwind NICHT
        { x: 180, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 200, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 220, y: 455, w: 16, h: 15, dir: 'up' },

        // Cluster 2 (Mitte, Rückenwind — wie vorher)
        { x: 360, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 376, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 392, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 420, y: 455, w: 16, h: 15, dir: 'up' },

        // Cluster 3 (rechts) — zu breit zum Überspringen, muss Wind nutzen
        { x: 540, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 560, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 580, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 600, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 620, y: 455, w: 16, h: 15, dir: 'up' },
        { x: 640, y: 455, w: 16, h: 15, dir: 'up' },

        { x: 184, y: 228, w: 16, h: 15, dir: 'down' },
        { x: 200, y: 228, w: 16, h: 15, dir: 'down' },
        { x: 216, y: 228, w: 16, h: 15, dir: 'down' },
    ],
    traps: [
        // ===== SEKTION 1: Start mit unsichtbaren Plattformen =====
        // Starker Gegenwind — normaler Sprung reicht nicht über Cluster 1
        new WindZone(100, 380, 140, 90, -0.08, 0),

        // HiddenPlatform 1: links an der Wand (Spieler merkt nichts wenn er hochspringt)
        new HiddenPlatform(10, 390, 30, 15, { x: 10, y: 360, w: 120, h: 100 }),

        // HiddenPlatform 2: über Cluster 1, schmal
        new HiddenPlatform(100, 320, 90, 15, { x: 20, y: 360, w: 100, h: 50 }),

        // ===== SEKTION 2: Mitte (unverändert) =====
        new WindZone(260, 380, 180, 90, 0.08, 0),

        // ===== SEKTION 3: Ende — Kette aus Wind + Plattformen =====
        // Diagonal-Wind 1: boostet Spieler über Cluster 3 zur FallingFloor
        new WindZone(490, 290, 180, 180, 0.06, -0.22),

        // Platform A: FallingFloor — fällt wenn man draufsteht
        new FallingFloor(580, 320, 80, 15),

        // Diagonal-Wind 2: boostet Spieler noch weiter hoch zur Moving Platform
        new WindZone(660, 170, 130, 150, 0.05, -0.25),

        // Platform B: Moving — carriert Spieler nach links, verschwindet bei x:180
        new MovingPlatform(680, 220, 100, 15, 50, 220, 0.6, 180),

        // Großer Decken-Block — triggered wenn Moving Platform nah genug ist
        {
            x: 350, origY: 10, y: 10, w: 80, h: 25,
            triggered: false, vy: 0, solid: true,
            type: 'fallingCeiling',
            update(player) {
                if (!this.triggered) {
                    const plat = game.levelData.traps.find(t => t.type === 'movingPlatform');
                    if (plat && plat.triggered && plat.x < 400) {
                        this.triggered = true;
                    }
                }
                if (this.triggered) {
                    this.vy += 0.2;
                    this.y += this.vy;
                    if (player.alive && this.vy > 0 && aabb(player, this)) player.die();
                }
            },
            draw() {
                const lvlH = (game.levelData && game.levelData.height) || H;
                if (this.y > lvlH + 50) return;
                rect(this.x, this.y, this.w, this.h, '#b0b0b0');
                rect(this.x, this.y + this.h - 3, this.w, 3, '#999');
            },
            reset() { this.y = this.origY; this.triggered = false; this.vy = 0; }
        },
    ],
});
