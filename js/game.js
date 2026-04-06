// ============================================================
//  GAME — Main game loop & level management
//  Alle anderen Module müssen vorher geladen sein!
// ============================================================

const LEVELS = [];
const PHASE_SIZE = 15;

function getPhaseCount() { return Math.ceil(LEVELS.length / PHASE_SIZE); }
function getPhaseStart(phase) { return phase * PHASE_SIZE; }
function getPhaseEnd(phase) { return Math.min((phase + 1) * PHASE_SIZE, LEVELS.length); }

// ── GAME OBJECT ────────────────────��────────────────────���───
const game = {
    state: 'menu',
    currentLevel: 0,
    cameraX: 0,
    cameraY: 0,
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
    selectedPhase: 0,
    navCooldown: 0,
    // Speedrun
    speedrunMode: false,
    speedrunOption: 0,   // 0=OFF, 1=Phase1, 2=Phase2, ..., last=Hardcore
    speedrunPhase: -1,   // -1=Hardcore, 0+=Phase-Index
    speedrunStartTime: 0,
    speedrunPenalty: 0,
    speedrunFinalTime: 0,
    speedrunBestTimes: {},

    init() {
        this.state = 'menu';
        this.deaths = 0;
        this.totalDeaths = 0;
        this.currentLevel = 0;
        // Fortschritt laden
        this.highestUnlocked = parseInt(localStorage.getItem('ohcomeon_progress') || '0');
        // Speedrun-Bestzeiten laden (neues Format)
        try {
            const raw = localStorage.getItem('ohcomeon_bests');
            if (raw) {
                this.speedrunBestTimes = JSON.parse(raw);
            }
        } catch (e) {}
        // Migration: altes Format → neues
        const oldBest = parseFloat(localStorage.getItem('ohcomeon_best') || 'NaN');
        if (!isNaN(oldBest) && (!this.speedrunBestTimes.hardcore || oldBest < this.speedrunBestTimes.hardcore)) {
            this.speedrunBestTimes.hardcore = oldBest;
            localStorage.setItem('ohcomeon_bests', JSON.stringify(this.speedrunBestTimes));
            localStorage.removeItem('ohcomeon_best');
        }
    },

    getSpeedrunKey() {
        return this.speedrunPhase === -1 ? 'hardcore' : 'phase_' + this.speedrunPhase;
    },

    getSpeedrunBest() {
        return this.speedrunBestTimes[this.getSpeedrunKey()] || Infinity;
    },

    startSpeedrun(phase) {
        this.speedrunMode = true;
        this.speedrunPhase = phase;
        this.speedrunStartTime = 0;
        this.speedrunPending = true;
        this.speedrunPenalty = 0;
        this.speedrunFinalTime = 0;
        this.totalDeaths = 0;
        this.deaths = 0;
    },

    getSpeedrunElapsed() {
        if (!this.speedrunStartTime) return 0;
        return (Date.now() - this.speedrunStartTime + this.speedrunPenalty) / 1000;
    },

    // Bestimmt das letzte Level für den aktuellen Speedrun
    getSpeedrunEndLevel() {
        if (this.speedrunPhase === -1) return LEVELS.length - 1;
        return getPhaseEnd(this.speedrunPhase) - 1;
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
        let zoom = 1;
        if (lvl.width && lvl.height && !lvl.verticalScroll && !lvl.autoScroll) {
            zoom = Math.min(W / lvl.width, H / lvl.height);
        }
        const visibleW = W / zoom;
        const camMin = lvl.cameraMinX || 0;
        this.cameraX = Math.max(camMin, Math.min(this.player.x - visibleW / 2, lvlW - visibleW));
        // Vertikale Kamera
        if (lvl.verticalScroll) {
            const lvlH = lvl.height || H;
            this.cameraY = Math.max(0, Math.min(this.player.y - H / 2, lvlH - H));
        } else {
            this.cameraY = 0;
        }
        lvl.traps.forEach(t => t.reset());
    },

    resetLevel() {
        this.player.reset();
        this.levelData.traps.forEach(t => t.reset());
        this.state = 'playing';
        // Kamera zurücksetzen bei Vertical Scroll / AutoScroll
        const lvl = this.levelData;
        if (lvl.verticalScroll) {
            const lvlH = lvl.height || H;
            this.cameraY = Math.max(0, Math.min(this.player.startY - H / 2, lvlH - H));
        }
        if (lvl.autoScroll) {
            const lvlW = lvl.width || W;
            let zoom = 1;
            if (lvl.width && lvl.height) zoom = Math.min(W / lvl.width, H / lvl.height);
            const visibleW = W / zoom;
            const camMin = lvl.cameraMinX || 0;
            this.cameraX = Math.max(camMin, Math.min(this.player.startX - visibleW / 2, lvlW - visibleW));
        }
    },

    onPlayerDeath() {
        this.deaths++;
        this.totalDeaths++;
        this.state = 'dead';
        this.respawnTimer = CFG.respawnDelay;
        // Speedrun: +3s Strafe pro Tod
        if (this.speedrunMode && this.speedrunStartTime) {
            this.speedrunPenalty += 3000;
        }
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
        const platformTypes = ['fallingFloor', 'disappearing', 'hiddenPlatform', 'trollShaker', 'triggerFloor', 'dodgingPlatform', 'timedFloor', 'togglePlatform', 'movingPlatform'];
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

        // L = Level Select (nur im normalen Modus, nicht im Speedrun!)
        if (keys['KeyL'] && this.state !== 'levelSelect' && !this.speedrunMode) {
            keys['KeyL'] = false;
            this.state = 'levelSelect';
            this.selectedLevel = this.currentLevel || 0;
            this.selectedPhase = Math.floor(this.selectedLevel / PHASE_SIZE);
            return;
        }

        // ESC = zurück zum Menü (ausser im Menü, LevelSelect, Settings)
        if (keys['Escape'] && this.state !== 'menu' && this.state !== 'levelSelect' && this.state !== 'settings') {
            keys['Escape'] = false;
            this.state = 'menu';
            // Speedrun-Zustand zurücksetzen (neuer Run beginnt frisch)
            this.speedrunStartTime = 0;
            this.speedrunPenalty = 0;
            this.totalDeaths = 0;
            this.deaths = 0;
            return;
        }

        // N = Neuer Speedrun (direkt, ohne zurück ins Menü)
        if (keys['KeyN'] && this.speedrunMode && this.state !== 'menu') {
            keys['KeyN'] = false;
            const startLvl = this.speedrunPhase >= 0 ? getPhaseStart(this.speedrunPhase) : 0;
            this.startSpeedrun(this.speedrunPhase);
            this.startLevel(startLvl);
            return;
        }

        // ── SETTINGS ─────────────────────────────────────────
        if (this.state === 'settings') {
            updateSettings();
            return;
        }

        // ── MENU ────────────────────────────────────────────
        if (this.state === 'menu') {
            // O = Options / Settings
            if (keys['KeyO']) {
                keys['KeyO'] = false;
                this.state = 'settings';
                SFX.menuSelect();
                return;
            }
            // E = Level Editor
            if (keys['KeyE']) {
                keys['KeyE'] = false;
                window.open('community-editor.html', '_blank');
                return;
            }
            // S = Speedrun Cycle: OFF → Phase 1 → Phase 2 → ... → Hardcore → OFF
            if (keys['KeyS']) {
                keys['KeyS'] = false;
                const phases = getPhaseCount();
                this.speedrunOption = (this.speedrunOption + 1) % (phases + 2);
                this.speedrunMode = this.speedrunOption > 0;
            }
            if (isJump() || keys['Enter'] || keys['Space']) {
                keys['Enter'] = false; keys['Space'] = false;
                SFX.menuSelect();
                if (this.speedrunMode) {
                    const phases = getPhaseCount();
                    if (this.speedrunOption <= phases) {
                        this.startSpeedrun(this.speedrunOption - 1);
                        this.startLevel(getPhaseStart(this.speedrunOption - 1));
                    } else {
                        this.startSpeedrun(-1);
                        this.startLevel(0);
                    }
                } else {
                    this.startLevel(0);
                }
            }
            return;
        }

        // ── LEVEL SELECT (single-press Navigation) ─────────
        if (this.state === 'levelSelect') {
            const cols = 5;
            const phaseOffset = this.selectedPhase * PHASE_SIZE;
            const phaseEnd = Math.min(phaseOffset + PHASE_SIZE, LEVELS.length);
            const maxSel = Math.min(this.highestUnlocked, phaseEnd - 1);
            const minSel = phaseOffset;

            // Phase-Tabs: Q/E
            if (keys['KeyQ']) {
                keys['KeyQ'] = false;
                if (this.selectedPhase > 0) {
                    this.selectedPhase--;
                    const newOffset = this.selectedPhase * PHASE_SIZE;
                    this.selectedLevel = Math.min(this.highestUnlocked, Math.min(newOffset + PHASE_SIZE, LEVELS.length) - 1);
                    this.selectedLevel = Math.max(newOffset, this.selectedLevel);
                }
            }
            if (keys['KeyE']) {
                keys['KeyE'] = false;
                if (this.selectedPhase < getPhaseCount() - 1) {
                    this.selectedPhase++;
                    const newOffset = this.selectedPhase * PHASE_SIZE;
                    this.selectedLevel = Math.min(this.highestUnlocked, Math.min(newOffset + PHASE_SIZE, LEVELS.length) - 1);
                    this.selectedLevel = Math.max(newOffset, this.selectedLevel);
                }
            }

            if (keys['ArrowRight'] || keys['KeyD']) {
                keys['ArrowRight'] = false; keys['KeyD'] = false;
                this.selectedLevel = Math.min(maxSel, this.selectedLevel + 1);
            }
            if (keys['ArrowLeft'] || keys['KeyA']) {
                keys['ArrowLeft'] = false; keys['KeyA'] = false;
                this.selectedLevel = Math.max(minSel, this.selectedLevel - 1);
            }
            if (keys['ArrowDown'] || keys['KeyS']) {
                keys['ArrowDown'] = false; keys['KeyS'] = false;
                this.selectedLevel = Math.min(maxSel, this.selectedLevel + cols);
            }
            if (keys['ArrowUp'] || keys['KeyW']) {
                keys['ArrowUp'] = false; keys['KeyW'] = false;
                this.selectedLevel = Math.max(minSel, this.selectedLevel - cols);
            }
            if ((keys['Enter'] || keys['Space']) && this.selectedLevel <= this.highestUnlocked && this.selectedLevel < LEVELS.length) {
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
                const isLastLevel = this.currentLevel + 1 >= LEVELS.length;
                const isSpeedrunEnd = this.speedrunMode && this.currentLevel >= this.getSpeedrunEndLevel();
                if (isLastLevel || isSpeedrunEnd) {
                    this.state = 'win';
                    this.winTimer = 0;
                    // Speedrun: Finale Zeit berechnen + Best-Time speichern
                    if (this.speedrunMode && this.speedrunStartTime) {
                        this.speedrunFinalTime = this.getSpeedrunElapsed();
                        const key = this.getSpeedrunKey();
                        const prevBest = this.speedrunBestTimes[key] || Infinity;
                        if (this.speedrunFinalTime < prevBest) {
                            this.speedrunBestTimes[key] = this.speedrunFinalTime;
                            localStorage.setItem('ohcomeon_bests', JSON.stringify(this.speedrunBestTimes));
                        }
                    }
                } else {
                    this.startLevel(this.currentLevel + 1);
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

        // Speedrun-Timer startet bei erster Steuerungs-Taste
        if (this.speedrunMode && this.speedrunPending &&
            (isLeft() || isRight() || isJump() || keys['ArrowDown'] || keys['KeyS'])) {
            this.speedrunStartTime = Date.now();
            this.speedrunPending = false;
        }

        const platforms = this.getAllPlatforms();
        this.player.update(platforms);
        this.levelData.traps.forEach(t => t.update(this.player));

        // Camera folgt Spieler (smooth, mit cameraMinX + zoom Support)
        const lvlW = this.levelData.width || W;
        let zoom = 1;
        if (this.levelData.width && this.levelData.height && !this.levelData.verticalScroll && !this.levelData.autoScroll) {
            zoom = Math.min(W / this.levelData.width, H / this.levelData.height);
        }
        const visibleW = W / zoom;

        // AutoScroll: Kamera bewegt sich automatisch
        if (this.levelData.autoScroll) {
            this.cameraX += this.levelData.autoScroll.speed;
            if (this.cameraX > lvlW - visibleW) this.cameraX = lvlW - visibleW;
        } else if (lvlW > visibleW) {
            const camMin = this.levelData.cameraMinX || 0;
            const effectiveMin = Math.min(camMin, this.player.x - 20);
            const target = Math.max(effectiveMin, Math.min(this.player.x - visibleW / 2, lvlW - visibleW));
            this.cameraX = lerp(this.cameraX, target, 0.08);
        } else {
            this.cameraX = 0;
        }

        // Vertikale Kamera
        if (this.levelData.verticalScroll) {
            const lvlH = this.levelData.height || H;
            const targetY = Math.max(0, Math.min(this.player.y - H / 2, lvlH - H));
            this.cameraY = lerp(this.cameraY, targetY, 0.08);
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

        if (this.state === 'settings') {
            drawSettings(this.frameCount);
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

        // === WORLD SPACE (mit Camera + Zoom) ===
        ctx.save();
        // Auto-Zoom: nur wenn BEIDE Dimensionen gesetzt UND kein Scroll-Level
        let zoom = 1;
        if (lvl.width && lvl.height && !lvl.verticalScroll && !lvl.autoScroll) {
            zoom = Math.min(W / lvl.width, H / lvl.height);
        }
        if (zoom !== 1) {
            const offsetX = (W - lvl.width * zoom) / 2;
            const offsetY = (H - lvl.height * zoom) / 2;
            ctx.translate(offsetX, offsetY);
            ctx.scale(zoom, zoom);
        }
        ctx.translate(-this.cameraX, -this.cameraY);

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
        // Shadow-Exit (nur visuell, kein Level-Complete-Check)
        if (lvl.shadowExit) drawExit(lvl.shadowExit);
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

// ── GAME LOOP (Fixed Timestep @ 144Hz) ─────────────────────
// Physik läuft IMMER mit 144 Steps/Sekunde, egal welche Monitor-Hz.
// 60Hz  → ~2.4 Updates pro Frame (holt auf)
// 144Hz → ~1 Update pro Frame (wie bisher)
// 240Hz → ~0.6 Updates pro Frame (manche Frames ohne Update)
const TARGET_FPS = 144;
const FIXED_DT = 1000 / TARGET_FPS;  // ~6.944ms
let lastTime = 0;
let accumulator = 0;

function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const elapsed = Math.min(currentTime - lastTime, 100); // Cap: verhindert Spiral bei Tab-Wechsel
    lastTime = currentTime;
    accumulator += elapsed;

    while (accumulator >= FIXED_DT) {
        game.update();
        accumulator -= FIXED_DT;
    }

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

// Editor Test-Modus: ?level=16 in URL → direkt zu Level 16 springen
const urlParams = new URLSearchParams(window.location.search);
const testLevel = urlParams.get('level');
if (testLevel !== null) {
    const idx = parseInt(testLevel) - 1;
    if (idx >= 0 && idx < LEVELS.length) {
        // Editor-Daten laden (Positionen aus dem Editor übernehmen)
        try {
            const raw = localStorage.getItem('editor_test_level');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.index === idx) {
                    const lvl = LEVELS[idx];
                    // Player & Exit
                    lvl.player.x = data.player.x;
                    lvl.player.y = data.player.y;
                    if (data.exit && lvl.exit) {
                        lvl.exit.x = data.exit.x; lvl.exit.y = data.exit.y;
                        lvl.exit.w = data.exit.w; lvl.exit.h = data.exit.h;
                    }
                    // Platforms
                    data.platforms.forEach((p, i) => {
                        if (lvl.platforms[i]) {
                            lvl.platforms[i].x = p.x; lvl.platforms[i].y = p.y;
                            lvl.platforms[i].w = p.w; lvl.platforms[i].h = p.h;
                        }
                    });
                    // Neue Platforms die im Editor hinzugefügt wurden
                    for (let i = lvl.platforms.length; i < data.platforms.length; i++) {
                        lvl.platforms.push(data.platforms[i]);
                    }
                    // Überschüssige entfernen
                    while (lvl.platforms.length > data.platforms.length) lvl.platforms.pop();
                    // Spikes
                    data.spikes.forEach((s, i) => {
                        if (lvl.spikes[i]) {
                            lvl.spikes[i].x = s.x; lvl.spikes[i].y = s.y;
                            lvl.spikes[i].w = s.w; lvl.spikes[i].h = s.h;
                            lvl.spikes[i].dir = s.dir;
                        }
                    });
                    for (let i = lvl.spikes.length; i < data.spikes.length; i++) {
                        lvl.spikes.push(data.spikes[i]);
                    }
                    while (lvl.spikes.length > data.spikes.length) lvl.spikes.pop();
                    // Trap-Positionen überschreiben
                    data.trapPositions.forEach((tp, i) => {
                        if (lvl.traps[i] && tp.x !== undefined) {
                            lvl.traps[i].x = tp.x; lvl.traps[i].y = tp.y;
                            if (tp.w) lvl.traps[i].w = tp.w;
                            if (tp.h) lvl.traps[i].h = tp.h;
                            if (lvl.traps[i].origX !== undefined) lvl.traps[i].origX = tp.x;
                            if (lvl.traps[i].origY !== undefined) lvl.traps[i].origY = tp.y;
                            if (lvl.traps[i].startY !== undefined) lvl.traps[i].startY = tp.y;
                        }
                    });
                }
                // Test-Daten löschen (einmalig)
                localStorage.removeItem('editor_test_level');
            }
        } catch(e) {}

        game.highestUnlocked = LEVELS.length;
        game.startLevel(idx);
    }
}

requestAnimationFrame(gameLoop);
