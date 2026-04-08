// ============================================================
//  GAME — Main game loop & level management
//  Alle anderen Module müssen vorher geladen sein!
// ============================================================

const LEVELS = [];
const PHASE_SIZE = 15;

function getPhaseCount() { return Math.ceil(LEVELS.length / PHASE_SIZE); }
function getPhaseStart(phase) { return phase * PHASE_SIZE; }
function getPhaseEnd(phase) { return Math.min((phase + 1) * PHASE_SIZE, LEVELS.length); }

function clonePlain(value) {
    return JSON.parse(JSON.stringify(value));
}

function deserializeCommunityTrap(td) {
    const t = td.type === 'invertZone' && td.triggerX !== undefined
        ? { ...td, type: 'invertTriggerLine' }
        : td.type === 'hiddenPlatform' && td.triggerArea
            ? { ...td, type: 'revealPlatform' }
            : td;
    switch (t.type) {
        case 'fallingFloor': return new FallingFloor(t.x, t.y, t.w, t.h);
        case 'fakeFloor': return new FakeFloor(t.x, t.y, t.w, t.h);
        case 'dodgingPlatform': return new DodgingPlatform(t.x, t.y, t.w, t.h, t.dodgeX ?? (t.x + 100), t.triggerRange ?? 80);
        case 'trollShaker': return new TrollShaker(t.x, t.y, t.w, t.h);
        case 'timedFloor': return new TimedFloor(t.x, t.y, t.w, t.h, t.delay ?? 120);
        case 'togglePlatform': {
            const trap = new TogglePlatform(t.x, t.y, t.w, t.h, t.group ?? 'A', t.initialActive ?? t.active ?? false);
            if (t.skin) trap.skin = t.skin;
            if (t.material) trap.material = t.material;
            return trap;
        }
        case 'movingPlatform': {
            const trap = new MovingPlatform(t.x, t.y, t.w, t.h, t.targetX ?? (t.x + 100), t.targetY ?? t.y, t.speed ?? 0.5, t.disappearAt);
            if (t.skin) trap.skin = t.skin;
            if (t.material) trap.material = t.material;
            if (t.moveTargetWithPlatform !== undefined) trap.moveTargetWithPlatform = !!t.moveTargetWithPlatform;
            return trap;
        }
        case 'hiddenPlatform': {
            const trap = new HiddenPlatform(t.x, t.y, t.w, t.h);
            if (t.material) trap.material = t.material;
            return trap;
        }
        case 'revealPlatform': {
            const trap = new RevealPlatform(t.x, t.y, t.w, t.h, clonePlain(t.triggerArea ?? { x:t.x - 50, y:t.y - 80, w:200, h:100 }));
            if (t.skin) trap.skin = t.skin;
            if (t.material) trap.material = t.material;
            return trap;
        }
        case 'triggerFloor': return new TriggerFloor(t.x, t.y, t.w, t.h, t.triggerX ?? t.x);
        case 'fallingCeiling': {
            const trap = new FallingCeiling(t.x, t.y, t.w, t.h, t.triggerX ?? t.x, t.fake ?? false);
            if (t.triggerMode) trap.triggerMode = t.triggerMode;
            if (t.triggerY !== undefined) trap.triggerY = t.triggerY;
            if (t.triggerDist !== undefined) trap.triggerDist = t.triggerDist;
            if (t.triggerArea) trap.triggerArea = clonePlain(t.triggerArea);
            if (t.stopY !== undefined) trap.stopY = t.stopY;
            return trap;
        }
        case 'shootingSpike':
        case 'shootingSpikeDisguised': {
            const trap = new ShootingSpike(t.x, t.y, t.dir ?? 'left', t.triggerX ?? t.x, t.speed ?? 4, null, null, t.disguised ?? false);
            if (t.triggerMode) trap.triggerMode = t.triggerMode;
            if (t.triggerY !== undefined) trap.triggerY = t.triggerY;
            if (t.triggerDist !== undefined) trap.triggerDist = t.triggerDist;
            if (t.triggerArea) trap.triggerArea = clonePlain(t.triggerArea);
            if (t.maxRange !== undefined) trap.maxRange = t.maxRange;
            return trap;
        }
        case 'movingSpike': {
            const trap = new MovingSpike(t.x1 ?? t.x, t.y1 ?? t.y, t.x2 ?? (t.x + 100), t.y2 ?? t.y, t.speed ?? 0.01);
            if (t.moveEndWithSpike !== undefined) trap.moveEndWithSpike = !!t.moveEndWithSpike;
            return trap;
        }
        case 'risingDeath': {
            const trap = new RisingDeath(t.speed ?? 0.3, t.startDelay ?? 120, t.startY ?? (t.y + 12));
            if (t.x !== undefined) trap.x = t.x;
            if (t.y !== undefined) trap.y = t.y;
            if (t.w !== undefined) trap.w = t.w;
            if (t.h !== undefined) trap.h = t.h;
            return trap;
        }
        case 'chasingWall': {
            const trap = new ChasingWall(t.speed ?? 0.5, t.startDelay ?? 90);
            if (t.x !== undefined) trap.x = t.x;
            if (t.y !== undefined) trap.y = t.y;
            if (t.w !== undefined) trap.w = t.w;
            if (t.h !== undefined) trap.h = t.h;
            return trap;
        }
        case 'fakeExit': {
            const trap = new FakeExit(t.x, t.y, t.showAboveY);
            if (t.skin) trap.skin = t.skin;
            return trap;
        }
        case 'fakeSpikes': return new FakeSpikes(clonePlain(t.spikes ?? []));
        case 'killZone': return new KillZone(t.x, t.y, t.w ?? 50, t.h ?? 50);
        case 'iceZone': return new IceZone(t.x, t.y, t.w ?? 150, t.h ?? 50);
        case 'windZone': return new WindZone(t.x, t.y, t.w ?? 100, t.h ?? 100, t.force ?? t.vx ?? 0, t.forceY ?? t.vy ?? 0);
        case 'doubleJumpZone': return new DoubleJumpZone(t.x, t.y, t.w ?? 140, t.h ?? 100);
        case 'cameraTrigger': return new CameraTrigger(t.x, t.y, t.w ?? 140, t.h ?? 120, t.verticalScroll ?? true, t.cameraAnchorX, t.cameraAnchorY);
        case 'cameraRoom': {
            const trap = new CameraRoom(t.x, t.y, t.w, t.h, t.fitMode || 'native');
            if (t.gravityDir !== undefined) trap.gravityDir = t.gravityDir;
            if (typeof t.jumpFlipsGravity === 'boolean') trap.jumpFlipsGravity = t.jumpFlipsGravity;
            if (t.doubleJumpMode) trap.doubleJumpMode = t.doubleJumpMode;
            if (t.darknessMode) trap.darknessMode = t.darknessMode;
            if (t.darknessRadius !== undefined) trap.darknessRadius = t.darknessRadius;
            return trap;
        }
        case 'warpZone': return new WarpZone(t.x, t.y, t.w ?? 80, t.h ?? 80, t.targetX ?? t.x, t.targetY ?? t.y, t.keepVelocity ?? false);
        case 'warpDoor': {
            const trap = new WarpDoor(t.x, t.y, t.targetX ?? t.x, t.targetY ?? t.y, t.keepVelocity ?? false);
            if (t.skin) trap.skin = t.skin;
            return trap;
        }
        case 'shadowPlayer': return new ShadowPlayer({
            mode: t.mode || 'mirrorHorizontal',
            mainWorld: t.mainWorld ? clonePlain(t.mainWorld) : null,
            shadowWorld: t.shadowWorld ? clonePlain(t.shadowWorld) : null,
        });
        case 'invertTriggerLine': return new InvertTriggerLine(t.triggerX ?? (t.x + (t.w ?? 50) / 2));
        case 'invertZone': {
            const trap = new InvertZone(t.x, t.y, t.w ?? 140, t.h ?? 90);
            if (t.entryPadding !== undefined) trap.entryPadding = t.entryPadding;
            return trap;
        }
        case 'darknessOverlay': return new DarknessOverlay(t.radius ?? 95);
        case 'switch': return new Switch(t.x, t.y, t.group ?? 'A', t.mount ?? 'floor', t.triggeredBy ?? 'player', t.action ?? 'toggle');
        case 'movingExit': {
            const trap = new MovingExit(clonePlain(t.positions ?? [{ x:t.x ?? 0, y:t.y ?? 0 }]));
            if (t.triggerDist !== undefined) trap.triggerDist = t.triggerDist;
            if (t.skin) trap.skin = t.skin;
            if (t.movePathWithExit !== undefined) trap.movePathWithExit = !!t.movePathWithExit;
            return trap;
        }
        default: return { ...clonePlain(t), update(){}, draw(){}, reset(){} };
    }
}

function deserializeCommunityLevelFromCode(code) {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const data = JSON.parse(json);
    return {
        name: data.name || 'Shared Level',
        levelType: data.levelType || 'normal',
        shadowMode: data.shadowMode || 'mirrorHorizontal',
        backgroundTheme: data.backgroundTheme || 'plainSlate',
        worlds: data.worlds ? clonePlain(data.worlds) : null,
        width: data.width,
        height: data.height,
        verticalScroll: !!data.verticalScroll,
        doubleJump: !!data.doubleJump,
        cameraMinX: data.cameraMinX,
        cameraAnchorX: data.cameraAnchorX,
        cameraAnchorY: data.cameraAnchorY,
        player: clonePlain(data.player),
        exit: data.exit ? clonePlain(data.exit) : null,
        shadowExit: data.shadowExit ? clonePlain(data.shadowExit) : null,
        platforms: clonePlain(data.platforms || []),
        spikes: clonePlain(data.spikes || []),
        traps: (data.traps || []).map(deserializeCommunityTrap),
    };
}

function getExitRevealMode(exitObj) {
    if (!exitObj) return 'none';
    return exitObj.revealMode || (exitObj.revealArea ? 'area' : 'none');
}

function resetExitRevealState(levelData) {
    if (levelData && levelData.exit) levelData.exit.revealed = false;
}

function resetCameraState(levelData) {
    if (!levelData) return;
    levelData.currentVerticalScroll = !!levelData.verticalScroll;
    levelData.currentCameraAnchorX = Number.isFinite(levelData.cameraAnchorX) ? Math.max(0, Math.min(1, levelData.cameraAnchorX)) : 0.5;
    levelData.currentCameraAnchorY = Number.isFinite(levelData.cameraAnchorY) ? Math.max(0, Math.min(1, levelData.cameraAnchorY)) : 0.5;
    levelData.currentCameraRoom = null;
    if (typeof resetShadowWorldState === 'function') resetShadowWorldState(levelData);
    if (typeof resetDynamicWorldState === 'function') resetDynamicWorldState(levelData);
}

function getCameraVerticalScroll(levelData) {
    if (!levelData) return false;
    if (levelData.currentCameraRoom) return false;
    if (levelData.currentVerticalScroll !== undefined) return !!levelData.currentVerticalScroll;
    return !!levelData.verticalScroll;
}

function getCurrentCameraRoom(levelData) {
    return levelData?.currentCameraRoom || null;
}

function getCameraRoomZoom(levelData) {
    const room = getCurrentCameraRoom(levelData);
    if (!room) return null;
    if ((room.fitMode || 'native') === 'contain') return Math.min(W / room.w, H / room.h);
    return 1;
}

function getZoomFrameSize(levelData) {
    const room = getCurrentCameraRoom(levelData);
    if (room && (room.fitMode || 'native') === 'contain') {
        return { w: room.w, h: room.h };
    }
    return { w: levelData?.width || W, h: levelData?.height || H };
}

function getLevelZoom(levelData) {
    const roomZoom = getCameraRoomZoom(levelData);
    if (roomZoom !== null) return roomZoom;
    if (!levelData || !levelData.width || !levelData.height || getCameraVerticalScroll(levelData) || levelData.autoScroll) return 1;
    if (levelData.levelType === 'shadow') return Math.min(W / levelData.width, H / levelData.height);
    return Math.max(1, Math.min(W / levelData.width, H / levelData.height));
}

function getCameraAnchor(levelData, axis) {
    const key = axis === 'y' ? 'cameraAnchorY' : 'cameraAnchorX';
    const currentKey = axis === 'y' ? 'currentCameraAnchorY' : 'currentCameraAnchorX';
    const fallback = 0.5;
    const raw = Number.isFinite(levelData?.[currentKey]) ? levelData[currentKey] : levelData?.[key];
    return Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : fallback;
}

function snapCameraToPlayerImmediate(gameObj, levelData, player) {
    if (!gameObj || !levelData || !player) return;
    const room = getCurrentCameraRoom(levelData);
    if (room) {
        gameObj.cameraX = room.x;
        gameObj.cameraY = room.y;
        return;
    }
    const lvlW = levelData.width || W;
    const zoom = getLevelZoom(levelData);
    const visibleW = W / zoom;
    const visibleH = H / zoom;
    const camMin = levelData.cameraMinX || 0;
    if (levelData.autoScroll) {
        gameObj.cameraX = Math.max(camMin, Math.min(player.x - visibleW * getCameraAnchor(levelData, 'x'), lvlW - visibleW));
    } else if (lvlW > visibleW) {
        gameObj.cameraX = Math.max(camMin, Math.min(player.x - visibleW * getCameraAnchor(levelData, 'x'), lvlW - visibleW));
    } else {
        gameObj.cameraX = 0;
    }

    if (getCameraVerticalScroll(levelData)) {
        const lvlH = levelData.height || H;
        gameObj.cameraY = Math.max(0, Math.min(player.y - visibleH * getCameraAnchor(levelData, 'y'), lvlH - visibleH));
    } else {
        gameObj.cameraY = 0;
    }
}

// ── GAME OBJECT ────────────────────��────────────────────���───
function getSharedLevelOverlayElements() {
    return {
        overlay: document.getElementById('sharedLevelOverlay'),
        input: document.getElementById('sharedLevelCodeInput'),
        error: document.getElementById('sharedLevelOverlayError'),
    };
}

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
    sharedLevelMode: false,
    sharedLevelCode: '',
    sharedLevelOverlayOpen: false,
    pendingCameraSnap: false,

    init() {
        this.state = 'menu';
        this.deaths = 0;
        this.totalDeaths = 0;
        this.currentLevel = 0;
        this.sharedLevelMode = false;
        this.sharedLevelCode = '';
        this.sharedLevelOverlayOpen = false;
        this.pendingCameraSnap = false;
        this.closeSharedLevelOverlay(false);
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
        if (this.sharedLevelMode) return;
        if (this.currentLevel >= this.highestUnlocked) {
            this.highestUnlocked = this.currentLevel + 1;
            localStorage.setItem('ohcomeon_progress', this.highestUnlocked);
        }
    },

    setSharedLevelOverlayOpen(open) {
        const { overlay, input, error } = getSharedLevelOverlayElements();
        this.sharedLevelOverlayOpen = open;
        if (!overlay || !input || !error) return;

        overlay.classList.toggle('open', open);
        error.textContent = '';

        if (open) {
            Object.keys(keys).forEach(k => { keys[k] = false; });
            setTimeout(() => {
                input.focus();
                if (input.value.trim()) input.select();
            }, 0);
        } else {
            input.blur();
        }
    },

    closeSharedLevelOverlay(clearInput = false) {
        const { input, error } = getSharedLevelOverlayElements();
        this.setSharedLevelOverlayOpen(false);
        if (clearInput && input) input.value = '';
        if (error) error.textContent = '';
    },

    async pasteSharedLevelCode() {
        const { input, error } = getSharedLevelOverlayElements();
        if (!input) return;

        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                throw new Error('Clipboard API unavailable');
            }
            const text = await navigator.clipboard.readText();
            if (!text.trim()) throw new Error('Clipboard empty');
            input.value = text.trim();
            if (error) error.textContent = '';
            input.focus();
        } catch (err) {
            if (error) error.textContent = 'Clipboard paste is not available here. Please paste manually.';
        }
    },

    loadSharedLevelFromOverlay() {
        const { input, error } = getSharedLevelOverlayElements();
        if (!input) return;

        const code = input.value.trim();
        if (!code) {
            if (error) error.textContent = 'Please paste a shared level code first.';
            input.focus();
            return;
        }

        try {
            const levelData = deserializeCommunityLevelFromCode(code.replace(/\s+/g, ''));
            this.closeSharedLevelOverlay(false);
            this.startSharedLevel(levelData, code);
            SFX.menuSelect();
        } catch (err) {
            console.error('Invalid shared level code:', err);
            if (error) error.textContent = 'This shared level code is invalid or incomplete.';
            input.focus();
            input.select();
        }
    },

    startSharedLevel(levelData, sourceCode = '') {
        const lvl = {
            name: levelData.name || 'Shared Level',
            levelType: levelData.levelType || 'normal',
            shadowMode: levelData.shadowMode || 'mirrorHorizontal',
            backgroundTheme: levelData.backgroundTheme || 'plainSlate',
            worlds: levelData.worlds ? clonePlain(levelData.worlds) : null,
            player: clonePlain(levelData.player || { x: 60, y: 360 }),
            exit: levelData.exit ? clonePlain(levelData.exit) : null,
            platforms: clonePlain(levelData.platforms || []),
            spikes: clonePlain(levelData.spikes || []),
            traps: levelData.traps || [],
            width: levelData.width,
            height: levelData.height,
            cameraMinX: levelData.cameraMinX,
            cameraAnchorX: levelData.cameraAnchorX,
            cameraAnchorY: levelData.cameraAnchorY,
            verticalScroll: !!levelData.verticalScroll,
            doubleJump: !!levelData.doubleJump,
            autoScroll: levelData.autoScroll ? clonePlain(levelData.autoScroll) : null,
            shadowExit: levelData.shadowExit ? clonePlain(levelData.shadowExit) : null,
        };

        this.currentLevel = -1;
        this.levelData = lvl;
        this.player = new Player(lvl.player.x, lvl.player.y);
        this.deaths = 0;
        this.titleTimer = CFG.levelTitleTime;
        this.state = 'playing';
        this.sharedLevelMode = true;
        this.sharedLevelCode = sourceCode;
        this.speedrunMode = false;
        this.speedrunStartTime = 0;
        this.speedrunPending = false;
        this.speedrunPenalty = 0;
        this.speedrunFinalTime = 0;
        this.closeSharedLevelOverlay(false);
        resetExitRevealState(lvl);
        resetCameraState(lvl);
        this.pendingCameraSnap = false;
        if (!SFX.bgPlaying) SFX.startMusic();

        const lvlW = lvl.width || W;
        const zoom = getLevelZoom(lvl);
        const visibleW = W / zoom;
        const visibleH = H / zoom;
        const camMin = lvl.cameraMinX || 0;
        this.cameraX = Math.max(camMin, Math.min(this.player.x - visibleW * getCameraAnchor(lvl, 'x'), lvlW - visibleW));

        if (getCameraVerticalScroll(lvl)) {
            const lvlH = lvl.height || H;
            this.cameraY = Math.max(0, Math.min(this.player.y - visibleH * getCameraAnchor(lvl, 'y'), lvlH - visibleH));
        } else {
            this.cameraY = 0;
        }

        lvl.traps.forEach(t => t.reset());
    },

    executeMenuItem(index) {
        switch (index) {
            case 0: // PLAY
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
                break;
            case 1: // LEVEL SELECT
                this.state = 'levelSelect';
                this.selectedLevel = this.currentLevel || 0;
                this.selectedPhase = Math.floor(this.selectedLevel / PHASE_SIZE);
                break;
            case 2: { // SPEEDRUN
                const phases = getPhaseCount();
                this.speedrunOption = (this.speedrunOption + 1) % (phases + 2);
                this.speedrunMode = this.speedrunOption > 0;
                break;
            }
            case 3: // MULTIPLAYER
                this.state = 'lobby';
                if (typeof MP !== 'undefined') MP.enterLobby();
                break;
            case 4: // SHARED LEVEL
                this.promptAndStartSharedLevel();
                break;
            case 5: // EDITOR
                window.open('community-editor.html', '_blank');
                break;
            case 6: // OPTIONS
                this.state = 'settings';
                break;
            case 7: // SOUND
                SFX.setMuted(!SFX.muted);
                break;
        }
    },

    promptAndStartSharedLevel() {
        this.setSharedLevelOverlayOpen(true);
    },

    startLevel(idx) {
        this.currentLevel = idx;
        const lvl = LEVELS[idx];
        this.levelData = lvl;
        this.player = new Player(lvl.player.x, lvl.player.y);
        this.deaths = 0;
        this.titleTimer = CFG.levelTitleTime;
        this.state = 'playing';
        this.sharedLevelMode = false;
        this.sharedLevelCode = '';
        this.closeSharedLevelOverlay(false);
        resetCameraState(lvl);
        this.pendingCameraSnap = false;
        if (!SFX.bgPlaying) SFX.startMusic();
        // Camera direkt auf Spieler setzen (cameraMinX = versteckt Bereich links)
        const lvlW = lvl.width || W;
        const zoom = getLevelZoom(lvl);
        const visibleW = W / zoom;
        const visibleH = H / zoom;
        const camMin = lvl.cameraMinX || 0;
        this.cameraX = Math.max(camMin, Math.min(this.player.x - visibleW * getCameraAnchor(lvl, 'x'), lvlW - visibleW));
        // Vertikale Kamera
        if (getCameraVerticalScroll(lvl)) {
            const lvlH = lvl.height || H;
            this.cameraY = Math.max(0, Math.min(this.player.y - visibleH * getCameraAnchor(lvl, 'y'), lvlH - visibleH));
        } else {
            this.cameraY = 0;
        }
        resetExitRevealState(lvl);
        lvl.traps.forEach(t => t.reset());
    },

    resetLevel() {
        this.player.reset();
        this.levelData.traps.forEach(t => t.reset());
        this.state = 'playing';
        resetCameraState(this.levelData);
        this.pendingCameraSnap = false;
        // Kamera zurücksetzen bei Vertical Scroll / AutoScroll
        const lvl = this.levelData;
        if (getCameraVerticalScroll(lvl)) {
            const lvlH = lvl.height || H;
            const visibleH = H / getLevelZoom(lvl);
            this.cameraY = Math.max(0, Math.min(this.player.startY - visibleH * getCameraAnchor(lvl, 'y'), lvlH - visibleH));
        } else {
            this.cameraY = 0;
        }
        if (lvl.autoScroll) {
            const lvlW = lvl.width || W;
            const zoom = getLevelZoom(lvl);
            const visibleW = W / zoom;
            const camMin = lvl.cameraMinX || 0;
            this.cameraX = Math.max(camMin, Math.min(this.player.startX - visibleW * getCameraAnchor(lvl, 'x'), lvlW - visibleW));
        }
        resetExitRevealState(lvl);
    },

    lastDeathFrame: 0,
    quickDeathStreak: 0,

    onPlayerDeath() {
        this.deaths++;
        this.totalDeaths++;
        this.state = 'dead';
        this.respawnTimer = CFG.respawnDelay;
        // Speedrun: +3s Strafe pro Tod
        if (this.speedrunMode && this.speedrunStartTime) {
            this.speedrunPenalty += 3000;
        }
        // Troll message triggers
        if (SETTINGS.trollMessages) {
            const gap = this.frameCount - this.lastDeathFrame;
            if (gap < 180) { this.quickDeathStreak++; } else { this.quickDeathStreak = 1; }
            this.lastDeathFrame = this.frameCount;
            const msg = getTrollDeathMessage(this.totalDeaths, this.quickDeathStreak);
            if (msg) showHudTroll(msg);
        }
    },

    goToMenu() {
        this.state = 'menu';
        this.speedrunStartTime = 0;
        this.speedrunPenalty = 0;
        this.totalDeaths = 0;
        this.deaths = 0;
        this.sharedLevelMode = false;
        this.sharedLevelCode = '';
        this.closeSharedLevelOverlay(false);
    },

    executePauseItem(index) {
        const inMP = typeof MP !== 'undefined' && MP.state === 'racing';
        if (inMP) {
            switch (index) {
                case 0: // RESUME
                    this.state = 'playing';
                    break;
                case 1: // RESTART LEVEL
                    this.resetLevel();
                    this.state = 'playing';
                    break;
                case 2: // LEAVE RACE
                    MP.disconnect();
                    this.goToMenu();
                    break;
            }
        } else {
            switch (index) {
                case 0: // RESUME
                    this.state = 'playing';
                    break;
                case 1: // RESTART LEVEL
                    this.resetLevel();
                    this.state = 'playing';
                    break;
                case 2: // LEVEL SELECT
                    this.state = 'levelSelect';
                    this.selectedLevel = this.currentLevel || 0;
                    this.selectedPhase = Math.floor(this.selectedLevel / PHASE_SIZE);
                    break;
                case 3: // MAIN MENU
                    this.goToMenu();
                    break;
            }
        }
    },

    getExitBounds() {
        const lvl = this.levelData;
        const movingExit = lvl.traps.find(t => t.type === 'movingExit');
        if (movingExit) return movingExit.getBounds();
        if (typeof getActiveLevelExit === 'function') return getActiveLevelExit(lvl);
        if (lvl.exit) return lvl.exit;
        return null;
    },

    isExitVisible(exitObj) {
        if (!exitObj || !this.player) return false;
        const mode = getExitRevealMode(exitObj);
        if (exitObj.showAboveY && this.player.y >= exitObj.showAboveY) return false;
        if (exitObj.showBelowX && this.player.x >= exitObj.showBelowX) return false;
        if (mode === 'area' && exitObj.revealArea) {
            const px = this.player.x + this.player.w / 2;
            const py = this.player.y + this.player.h / 2;
            const a = exitObj.revealArea;
            return px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h;
        }
        if (mode === 'areaOnce' && exitObj.revealArea) {
            const px = this.player.x + this.player.w / 2;
            const py = this.player.y + this.player.h / 2;
            const a = exitObj.revealArea;
            if (!exitObj.revealed && px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h) {
                exitObj.revealed = true;
            }
            return !!exitObj.revealed;
        }
        if (mode === 'switch') return !!exitObj.revealed;
        return true;
    },

    getAllPlatforms() {
        const lvl = this.levelData;
        const plats = [...lvl.platforms];
        const platformTypes = ['fallingFloor', 'disappearing', 'hiddenPlatform', 'revealPlatform', 'trollShaker', 'triggerFloor', 'dodgingPlatform', 'timedFloor', 'togglePlatform', 'movingPlatform'];
        lvl.traps.forEach(t => {
            if (t.solid && platformTypes.includes(t.type)) plats.push(t);
        });
        return plats;
    },

    update() {
        this.frameCount++;
        if (this.navCooldown > 0) this.navCooldown--;

        // Skip ALL global shortcuts when in lobby (MP handles its own input)
        const inLobby = this.state === 'lobby';

        // M = Mute Toggle
        if (keys['KeyM'] && !inLobby) {
            keys['KeyM'] = false;
            SFX.setMuted(!SFX.muted);
        }

        if (this.sharedLevelOverlayOpen) {
            if (keys['Escape']) {
                keys['Escape'] = false;
                this.closeSharedLevelOverlay(false);
            }
            return;
        }

        // L = Level Select (nur im normalen Modus, nicht im Speedrun!)
        if (keys['KeyL'] && this.state !== 'levelSelect' && !this.speedrunMode && !inLobby) {
            keys['KeyL'] = false;
            this.state = 'levelSelect';
            this.selectedLevel = this.currentLevel || 0;
            this.selectedPhase = Math.floor(this.selectedLevel / PHASE_SIZE);
            return;
        }

        // ESC — Settings + Lobby handle ESC themselves, skip here
        if (keys['Escape'] && this.state !== 'settings' && !inLobby) {
            keys['Escape'] = false;
            if (this.state === 'playing' || this.state === 'dead') {
                this.state = 'paused';
                pauseIndex = 0;
            } else if (this.state === 'paused') {
                this.state = 'playing';
            } else if (this.state === 'win') {
                this.goToMenu();
            } else if (this.state === 'levelSelect') {
                this.state = 'menu';
                this.sharedLevelMode = false;
                this.sharedLevelCode = '';
                this.closeSharedLevelOverlay(false);
            }
        }

        // N = Neuer Speedrun (direkt, ohne zurück ins Menü)
        if (keys['KeyN'] && this.speedrunMode && this.state !== 'menu' && !inLobby) {
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

        // ── LOBBY (Multiplayer) ──────────────────────────────
        if (this.state === 'lobby') {
            if (typeof MP !== 'undefined') MP.updateLobby();
            return;
        }

        // ── MENU ────────────────────────────────────────────
        if (this.state === 'menu') {
            if (menuNavCooldown > 0) menuNavCooldown--;

            // Arrow navigation
            if (keys['ArrowUp'] && menuNavCooldown <= 0) {
                keys['ArrowUp'] = false;
                menuIndex = (menuIndex - 1 + MENU_ITEM_COUNT) % MENU_ITEM_COUNT;
                menuNavCooldown = 8;
                SFX.menuTick();
            }
            if (keys['ArrowDown'] && menuNavCooldown <= 0) {
                keys['ArrowDown'] = false;
                menuIndex = (menuIndex + 1) % MENU_ITEM_COUNT;
                menuNavCooldown = 8;
                SFX.menuTick();
            }

            // Activate selected item
            if (keys['Enter'] || keys['Space']) {
                keys['Enter'] = false; keys['Space'] = false;
                SFX.menuSelect();
                this.executeMenuItem(menuIndex);
                return;
            }

            // Letter shortcuts
            if (keys['KeyO']) { keys['KeyO'] = false; SFX.menuSelect(); this.state = 'settings'; return; }
            if (keys['KeyE']) { keys['KeyE'] = false; window.open('community-editor.html', '_blank'); return; }
            if (keys['KeyP']) { keys['KeyP'] = false; this.promptAndStartSharedLevel(); return; }
            if (keys['KeyG']) { keys['KeyG'] = false; this.state = 'lobby'; if (typeof MP !== 'undefined') MP.enterLobby(); return; }
            if (keys['KeyS']) {
                keys['KeyS'] = false;
                const phases = getPhaseCount();
                this.speedrunOption = (this.speedrunOption + 1) % (phases + 2);
                this.speedrunMode = this.speedrunOption > 0;
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
                this.sharedLevelMode = false;
                this.sharedLevelCode = '';
                this.closeSharedLevelOverlay(false);
            }
            return;
        }

        // ── PAUSED ──────────────────────────────────────────
        if (this.state === 'paused') {
            updatePauseMenu(this);
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
                // Multiplayer: finish or advance
                if (typeof MP !== 'undefined' && MP.state === 'racing') {
                    if (this.sharedLevelMode || this.currentLevel >= MP.levelEnd) {
                        MP.sendFinish();
                        // Wait for server results (MP.onMessage handles state change)
                    } else {
                        this.startLevel(this.currentLevel + 1);
                    }
                    return;
                }
                if (!this.sharedLevelMode) this.saveProgress();
                const isLastLevel = this.sharedLevelMode || this.currentLevel + 1 >= LEVELS.length;
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

        // Multiplayer: send position
        if (typeof MP !== 'undefined' && MP.state === 'racing') {
            MP.sendPosition(this.player, this.currentLevel);
        }

        // Camera folgt Spieler (smooth, mit cameraMinX + zoom Support)
        const lvlW = this.levelData.width || W;
        const zoom = getLevelZoom(this.levelData);
        const visibleW = W / zoom;
        const visibleH = H / zoom;

        // AutoScroll: Kamera bewegt sich automatisch
        const cameraRoom = getCurrentCameraRoom(this.levelData);
        if (cameraRoom) {
            this.cameraX = cameraRoom.x;
            this.cameraY = cameraRoom.y;
        } else if (this.levelData.autoScroll) {
            if (this.pendingCameraSnap) {
                const camMin = this.levelData.cameraMinX || 0;
                this.cameraX = Math.max(camMin, Math.min(this.player.x - visibleW * getCameraAnchor(this.levelData, 'x'), lvlW - visibleW));
            } else {
                this.cameraX += this.levelData.autoScroll.speed;
                if (this.cameraX > lvlW - visibleW) this.cameraX = lvlW - visibleW;
            }
        } else if (lvlW > visibleW) {
            const camMin = this.levelData.cameraMinX || 0;
            const effectiveMin = Math.min(camMin, this.player.x - 20);
            const target = Math.max(effectiveMin, Math.min(this.player.x - visibleW * getCameraAnchor(this.levelData, 'x'), lvlW - visibleW));
            this.cameraX = this.pendingCameraSnap ? target : lerp(this.cameraX, target, 0.08);
        } else {
            this.cameraX = 0;
        }

        // Vertikale Kamera
        if (!cameraRoom && getCameraVerticalScroll(this.levelData)) {
            const lvlH = this.levelData.height || H;
            const targetY = Math.max(0, Math.min(this.player.y - visibleH * getCameraAnchor(this.levelData, 'y'), lvlH - visibleH));
            this.cameraY = this.pendingCameraSnap ? targetY : lerp(this.cameraY, targetY, 0.08);
        }
        if (this.pendingCameraSnap) {
            if (!getCameraVerticalScroll(this.levelData)) this.cameraY = 0;
            this.pendingCameraSnap = false;
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
            const ex = typeof getActiveLevelExit === 'function' ? getActiveLevelExit(this.levelData) : this.levelData.exit;
            if (ex && this.isExitVisible(ex)) exits.push(ex);
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

        if (this.state === 'lobby') {
            if (typeof MP !== 'undefined') MP.drawLobby(this.frameCount);
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
        if (typeof drawLevelBackdrop === 'function') drawLevelBackdrop(ctx, W, H, lvl.backgroundTheme || 'plainSlate');

        // === WORLD SPACE (mit Camera + Zoom) ===
        ctx.save();
        const zoom = getLevelZoom(lvl);
        if (zoom !== 1) {
            const zoomFrame = getZoomFrameSize(lvl);
            const offsetX = (W - zoomFrame.w * zoom) / 2;
            const offsetY = (H - zoomFrame.h * zoom) / 2;
            ctx.translate(offsetX, offsetY);
            ctx.scale(zoom, zoom);
        }
        ctx.translate(-this.cameraX, -this.cameraY);

        lvl.platforms.forEach(p => drawPlatform(p));
        // Alle Traps AUSSER Darkness (wird zuletzt gezeichnet)
        lvl.traps.forEach(t => { if (t.type !== 'darknessOverlay') t.draw(); });
        lvl.spikes.forEach(s => drawSpike(s));
        const activeExit = typeof getActiveLevelExit === 'function' ? getActiveLevelExit(lvl) : lvl.exit;
        if (activeExit && this.isExitVisible(activeExit)) drawExit(activeExit);
        const passiveExit = activeExit === lvl.exit ? lvl.shadowExit : lvl.exit;
        if (passiveExit && passiveExit !== activeExit && this.isExitVisible(passiveExit)) drawExit(passiveExit);
        // Multiplayer ghosts (behind local player)
        if (typeof MP !== 'undefined' && MP.state === 'racing') {
            MP.drawGhosts(this.cameraX, this.cameraY);
        }
        this.player.draw();
        updateParticles();
        // Darkness Overlay ZULETZT (überdeckt alles im World Space)
        lvl.traps.forEach(t => { if (t.type === 'darknessOverlay') t.draw(); });
        if (lvl.currentDarknessEnabled && !lvl.traps.some(t => t.type === 'darknessOverlay') && typeof drawDarknessAroundPlayer === 'function') {
            drawDarknessAroundPlayer(this.player, lvl.currentDarknessRadius || 95);
        }

        ctx.restore();
        // === SCREEN SPACE (HUD, fixiert) ===
        drawHUD(this.currentLevel, LEVELS.length, this.totalDeaths);

        // Multiplayer race HUD + countdown
        if (typeof MP !== 'undefined' && MP.state === 'racing') { MP.drawRaceHUD(); MP.drawNotifications(); }
        if (typeof MP !== 'undefined' && MP.state === 'countdown') MP.drawCountdown(this.frameCount);
        if (typeof MP !== 'undefined' && MP.state === 'results') MP.drawResults(this.frameCount);

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

        // Pause overlay (drawn over everything)
        if (this.state === 'paused') drawPauseMenu(this.frameCount);

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
window.loadSharedLevelFromOverlay = () => {
    if (typeof MP !== 'undefined' && MP._mpSharedOverlayActive) {
        MP._loadSharedLevelFromOverlay();
    } else {
        game.loadSharedLevelFromOverlay();
    }
};
window.closeSharedLevelOverlay = () => {
    if (typeof MP !== 'undefined' && MP._mpSharedOverlayActive) {
        MP._closeSharedLevelOverlay();
    } else {
        game.closeSharedLevelOverlay(false);
    }
};
window.pasteSharedLevelCode = () => {
    if (typeof MP !== 'undefined' && MP._mpSharedOverlayActive) {
        MP._pasteSharedLevelCode();
    } else {
        game.pasteSharedLevelCode();
    }
};
window.handleSharedLevelOverlayKeydown = (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        if (typeof MP !== 'undefined' && MP._mpSharedOverlayActive) {
            MP._closeSharedLevelOverlay();
        } else {
            game.closeSharedLevelOverlay(false);
        }
        return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (typeof MP !== 'undefined' && MP._mpSharedOverlayActive) {
            MP._loadSharedLevelFromOverlay();
        } else {
            game.loadSharedLevelFromOverlay();
        }
    }
};

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
                        lvl.exit.showAboveY = data.exit.showAboveY;
                        lvl.exit.showBelowX = data.exit.showBelowX;
                        lvl.exit.revealArea = data.exit.revealArea ? { ...data.exit.revealArea } : undefined;
                        lvl.exit.revealMode = data.exit.revealMode;
                        lvl.exit.revealGroup = data.exit.revealGroup;
                        lvl.exit.revealed = false;
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
