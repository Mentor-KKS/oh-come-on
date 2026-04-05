// ================================================================
// Level 14 — "Shadow"
// Split-Screen: Player oben (y:0-375), Shadow unten (y:375-750).
// Shadow.x = 1200 - player.x - 20, Shadow.y = player.y + 375.
// Beide synchron, Hindernisse unterschiedlich.
// 6 Sprung-Zonen, Phantom- und Direct-Spikes alternieren,
// plus FallingCeilings in beiden Welten.
// ================================================================
LEVELS.push({
    name: "Shadow",
    width: 1200,
    height: 750,
    player: { x: 80, y: 315 },
    exit: { x: 1120, y: 295, w: 30, h: 40 },
    // Shadow-Exit (nur visuell) — lila Farbe, passend zum Shadow
    shadowExit: {
        x: 60, y: 670, w: 30, h: 40,
        glowColor: 'rgba(108, 92, 231, 0.2)',
        frameColor: '#8e7cfb',
        bodyColor: '#6c5ce7',
        knobColor: '#f1c40f',
    },
    platforms: [
        // ========== TOP WORLD (y:0-375) ==========
        { x: 0, y: 0, w: 1200, h: 10 },           // top ceiling
        // Top floor: nahtlos! Fake-Stück überlappt beide Seiten → keine Kante sichtbar
        { x: 0, y: 345, w: 990, h: 30 },
        { x: 985, y: 345, w: 60, h: 30, solid: false },   // FAKE — überlappt ±5px
        { x: 1040, y: 345, w: 160, h: 30 },
        { x: 0, y: 10, w: 10, h: 335 },           // top left wall
        { x: 1190, y: 10, w: 10, h: 335 },        // top right wall

        // ========== BOTTOM WORLD (y:375-750) ==========
        { x: 0, y: 375, w: 1200, h: 10 },         // bottom ceiling (divider)
        { x: 0, y: 720, w: 1200, h: 30 },         // bottom floor
        { x: 0, y: 385, w: 10, h: 335 },          // bottom left wall
        { x: 1190, y: 385, w: 10, h: 335 },       // bottom right wall
    ],
    spikes: [
        // === SHADOW-WELT: Phantom-Zone 1 bei x:900-920 → Player forbidden 247-297
        { x: 900, y: 705, w: 16, h: 15, dir: 'up' },
        { x: 920, y: 705, w: 16, h: 15, dir: 'up' },

        // === TOP-WELT: Direct Cluster 1 bei x:360-380 → Player forbidden 343-393
        { x: 360, y: 330, w: 16, h: 15, dir: 'up' },
        { x: 380, y: 330, w: 16, h: 15, dir: 'up' },

        // === SHADOW-WELT: Phantom-Zone 2 bei x:700-720 → Player forbidden 447-497
        { x: 700, y: 705, w: 16, h: 15, dir: 'up' },
        { x: 720, y: 705, w: 16, h: 15, dir: 'up' },

        // === TOP-WELT: Direct Cluster 2 bei x:560-580 → Player forbidden 543-593
        { x: 560, y: 330, w: 16, h: 15, dir: 'up' },
        { x: 580, y: 330, w: 16, h: 15, dir: 'up' },

        // === SHADOW-WELT: Phantom-Zone 3 bei x:500-520 → Player forbidden 647-697
        { x: 500, y: 705, w: 16, h: 15, dir: 'up' },
        { x: 520, y: 705, w: 16, h: 15, dir: 'up' },

        // === TOP-WELT: Direct Cluster 3 bei x:860-880 → Player forbidden 843-893
        //     (kombiniert mit Shadow bei x:300-320 → forbidden 847-897)
        { x: 860, y: 330, w: 16, h: 15, dir: 'up' },
        { x: 880, y: 330, w: 16, h: 15, dir: 'up' },
        { x: 300, y: 705, w: 16, h: 15, dir: 'up' },
        { x: 320, y: 705, w: 16, h: 15, dir: 'up' },

    ],
    traps: [
        // Shadow mit Y-Offset 375 (Bottom-Welt)
        new ShadowPlayer(375),

        // FallingCeiling TOP-WELT — fällt auf Player (bleibt wie war)
        new FallingCeiling(450, 10, 60, 40, 480),

        // Shadow-Welt FallingCeiling — triggert NACH Zone 6 (letzte Spikes)
        // TriggerX 980 → Player hat Zone 6 schon gemeistert
        new FallingCeiling(150, 385, 60, 40, 980),

        // === DECOY-BLÖCKE kurz vor der Tür (FAKE — hängen nur, fallen nie!) ===
        new FallingCeiling(940, 10, 60, 40, 900, true),
        new FallingCeiling(1050, 10, 60, 40, 990, true),

        // === Unsichtbare KillZone unter dem Fake-Boden ===
        // Player fällt durch → stirbt sofort (keine sichtbaren Spikes)
        // Y muss unter dem normalen Feet-Level (345) beginnen, aber oberhalb
        // vom Bottom-Ceiling (375), damit es sofort greift
        new KillZone(990, 350, 60, 30),

        // === FINAL TROLL: ShootingSpike aus der rechten Wand ===
        // Triggert erst kurz vor der Tür — Last-Second-Überraschung
        new ShootingSpike(1180, 333, 'left', 1150, 5),

    ],
});
