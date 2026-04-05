// ============================================================
//  GAME — Main game loop & level management
//  Alle anderen Module müssen vorher geladen sein!
// ============================================================

const LEVELS = [];

// ── GAME OBJECT ─────────────────────────────────────────────
const game = {
    state: 'menu',
    currentLevel: 0,
    cameraX: 0,
    deaths: 0,
    totalDeaths: 0,
    player: null,
    levelData: null,
    respawnTimer: 0,
    titleTimer: 0,
    levelCompleteTimer: 0,
    winTimer: 0,
    frameCount: 0,
    // Level Select
    highestUnlocked: 0,
    selectedLevel: 0,
    navCooldown: 0,

    init() {
        this.state = 'menu';
        this.deaths = 0;
        this.totalDeaths = 0;
        this.currentLevel = 0;
        // Fortschritt laden
        this.highestUnlocked = parseInt(localStorage.getItem('ohcomeon_progress') || '0');
    },

    saveProgress() {
        if (this.currentLevel >= this.highestUnlocked) {
            this.highestUnlocked = this.currentLevel + 1;
            localStorage.setItem('ohcomeon_progress', this.highestUnlocked);
        }
    },

    startLevel(idx) {
        this.currentLevel = idx;
        const lvl = LEVELS[idx];
        this.levelData = lvl;
        this.player = new Player(lvl.player.x, lvl.player.y);
        this.deaths = 0;
        this.titleTimer = CFG.levelTitleTime;
        this.state = 'playing';
        if (!SFX.bgPlaying) SFX.startMusic();
        // Camera direkt auf Spieler setzen (cameraMinX = versteckt Bereich links)
        const lvlW = lvl.width || W;
        const camMin = lvl.cameraMinX || 0;
        this.cameraX = Math.max(camMin, Math.min(this.player.x - W / 2, lvlW - W));
        lvl.traps.forEach(t => t.reset());
    },

    resetLevel() {
        this.player.reset();
        this.levelData.traps.forEach(t => t.reset());
        this.state = 'playing';
    },

    onPlayerDeath() {
        this.deaths++;
        this.totalDeaths++;
        this.state = 'dead';
        this.respawnTimer = CFG.respawnDelay;
    },

    getExitBounds() {
        const lvl = this.levelData;
        const movingExit = lvl.traps.find(t => t.type === 'movingExit');
        if (movingExit) return movingExit.getBounds();
        if (lvl.exit) return lvl.exit;
        return null;
    },

    getAllPlatforms() {
        const lvl = this.levelData;
        const plats = [...lvl.platforms];
        const platformTypes = ['fallingFloor', 'disappearing', 'hiddenPlatform', 'trollShaker', 'triggerFloor', 'dodgingPlatform', 'timedFloor', 'togglePlatform'];
        lvl.traps.forEach(t => {
            if (t.solid && platformTypes.includes(t.type)) plats.push(t);
        });
        return plats;
    },

    update() {
        this.frameCount++;
        if (this.navCooldown > 0) this.navCooldown--;

        // M = Mute Toggle
        if (keys['KeyM']) {
            keys['KeyM'] = false;
            SFX.setMuted(!SFX.muted);
        }

        // L = Level Select (jederzeit)
        if (keys['KeyL'] && this.state !== 'levelSelect') {
            keys['KeyL'] = false;
            this.state = 'levelSelect';
            this.selectedLevel = this.currentLevel || 0;
            return;
        }

        // ── MENU ────────────────────────────────────────────
        if (this.state === 'menu') {
            if (isJump() || keys['Enter']) {
                SFX.menuSelect();
                this.startLevel(0);
            }
            return;
        }

        // ── LEVEL SELECT (single-press Navigation) ─────────
        if (this.state === 'levelSelect') {
            const cols = 5;
            const maxSel = Math.min(this.highestUnlocked, LEVELS.length - 1);
            if (keys['ArrowRight'] || keys['KeyD']) {
                keys['ArrowRight'] = false; keys['KeyD'] = false;
                this.selectedLevel = Math.min(maxSel, this.selectedLevel + 1);
            }
            if (keys['ArrowLeft'] || keys['KeyA']) {
                keys['ArrowLeft'] = false; keys['KeyA'] = false;
                this.selectedLevel = Math.max(0, this.selectedLevel - 1);
            }
            if (keys['ArrowDown'] || keys['KeyS']) {
                keys['ArrowDown'] = false; keys['KeyS'] = false;
                this.selectedLevel = Math.min(maxSel, this.selectedLevel + cols);
            }
            if (keys['ArrowUp'] || keys['KeyW']) {
                keys['ArrowUp'] = false; keys['KeyW'] = false;
                this.selectedLevel = Math.max(0, this.selectedLevel - cols);
            }
            if ((keys['Enter'] || keys['Space']) && this.selectedLevel <= this.highestUnlocked) {
                keys['Enter'] = false;
                keys['Space'] = false;
                this.startLevel(this.selectedLevel);
            }
            if (keys['Escape']) {
                keys['Escape'] = false;
                this.state = 'menu';
            }
            return;
        }

        // ── DEAD ────────────────────────────────────────────
        if (this.state === 'dead') {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) this.resetLevel();
            return;
        }

        // ── LEVEL COMPLETE ──────────────────────────────────
        if (this.state === 'levelComplete') {
            this.levelCompleteTimer--;
            if (this.levelCompleteTimer <= 0) {
                this.saveProgress();
                if (this.currentLevel + 1 < LEVELS.length) {
                    this.startLevel(this.currentLevel + 1);
                } else {
                    this.state = 'win';
                    this.winTimer = 0;
                }
            }
            return;
        }

        // ── WIN ─────────────────────────────────────────────
        if (this.state === 'win') {
            this.winTimer++;
            if (keys['Enter'] && this.winTimer > 60) this.init();
            return;
        }

        // ── PLAYING ─────────────────────────────────────────
        if (this.titleTimer > 0) this.titleTimer--;
        if (keys['KeyR']) { this.player.die(); return; }

        const platforms = this.getAllPlatforms();
        this.player.update(platforms);
        this.levelData.traps.forEach(t => t.update(this.player));

        // Camera folgt Spieler (smooth, mit cameraMinX Support)
        const lvlW = this.levelData.width || W;
        if (lvlW > W) {
            const camMin = this.levelData.cameraMinX || 0;
            // Wenn Spieler links vom Minimum ist, Camera folgt trotzdem
            const effectiveMin = Math.min(camMin, this.player.x - 20);
            const target = Math.max(effectiveMin, Math.min(this.player.x - W / 2, lvlW - W));
            this.cameraX = lerp(this.cameraX, target, 0.08);
        } else {
            this.cameraX = 0;
        }

        // Spike collision
        for (const s of this.levelData.spikes) {
            if (this.player.alive) {
                const sHit = { x: s.x + 3, y: s.y + 3, w: s.w - 6, h: s.h - 6 };
                if (aabb(this.player, sHit)) this.player.die();
            }
        }

        // Exit check
        if (this.player.alive) {
            const exits = [];
            const ex = this.levelData.exit;
            if (ex) {
                let show = true;
                if (ex.showAboveY && this.player.y >= ex.showAboveY) show = false;
                if (ex.showBelowX && this.player.x >= ex.showBelowX) show = false;
                if (show) exits.push(ex);
            }
            const movExit = this.levelData.traps.find(t => t.type === 'movingExit');
            // MovingExit nur erreichbar wenn er STEHT (nicht während Flucht)
            if (movExit && !movExit.moving) exits.push(movExit.getBounds());
            for (const eb of exits) {
                if (aabb(this.player, eb)) {
                    this.state = 'levelComplete';
                    this.levelCompleteTimer = 90;
                    SFX.levelComplete();
                    const cx = this.player.x + this.player.w / 2;
                    const cy = this.player.y + this.player.h / 2;
                    spawnParticles(cx, cy, 30, '#2ecc71');
                    spawnParticles(cx, cy, 15, '#f1c40f');
                    break;
                }
            }
        }
    },

    draw() {
        ctx.save();
        applyShake();
        rect(0, 0, W, H, '#2a2a4a');

        if (this.state === 'menu') {
            drawMenu(this.frameCount, this.highestUnlocked);
            ctx.restore();
            return;
        }

        if (this.state === 'levelSelect') {
            drawLevelSelect(this.selectedLevel, this.highestUnlocked, this.frameCount);
            ctx.restore();
            return;
        }

        if (this.state === 'win') {
            drawWinScreen(this.totalDeaths, this.winTimer, this.frameCount);
            ctx.restore();
            return;
        }

        const lvl = this.levelData;

        // === WORLD SPACE (mit Camera) ===
        ctx.save();
        ctx.translate(-this.cameraX, 0);

        lvl.platforms.forEach(p => drawPlatform(p));
        // Alle Traps AUSSER Darkness (wird zuletzt gezeichnet)
        lvl.traps.forEach(t => { if (t.type !== 'darknessOverlay') t.draw(); });
        lvl.spikes.forEach(s => drawSpike(s));
        if (lvl.exit) {
            let show = true;
            if (lvl.exit.showAboveY && this.player.y >= lvl.exit.showAboveY) show = false;
            if (lvl.exit.showBelowX && this.player.x >= lvl.exit.showBelowX) show = false;
            if (show) drawExit(lvl.exit);
        }
        this.player.draw();
        updateParticles();
        // Darkness Overlay ZULETZT (überdeckt alles im World Space)
        lvl.traps.forEach(t => { if (t.type === 'darknessOverlay') t.draw(); });

        ctx.restore();
        // === SCREEN SPACE (HUD, fixiert) ===
        drawHUD(this.currentLevel, LEVELS.length, this.totalDeaths);

        if (this.titleTimer > 0) {
            drawLevelTitle(this.currentLevel, lvl.name, this.titleTimer);
        }

        if (this.state === 'levelComplete') drawLevelComplete();
        if (this.state === 'dead') updateParticles();

        // RoomCover ÜBER dem HUD zeichnen (verdeckt auch UI-Elemente)
        lvl.traps.forEach(t => {
            if (t.type === 'roomCover' && t.alpha > 0) {
                ctx.globalAlpha = t.alpha;
                rect(t.x - this.cameraX, t.y, t.w, t.h, '#0a0a0f');
                ctx.globalAlpha = 1;
            }
        });

        ctx.restore();
    },
};

// ── GAME LOOP ───────────────────────────────────────────────
function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

// ── RESPONSIVE CANVAS ───────────────────────────────────────
function resizeCanvas() {
    const maxW = window.innerWidth * 0.95;
    const maxH = window.innerHeight * 0.95;
    const ratio = W / H;
    let w, h;
    if (maxW / maxH > ratio) {
        h = maxH;
        w = h * ratio;
    } else {
        w = maxW;
        h = w / ratio;
    }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── START ───────────────────────────────────────────────────
game.init();
gameLoop();
