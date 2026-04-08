// ============================================================
//  MULTIPLAYER — Ghost Racing Client
//  WebSocket connection, lobby UI, ghost rendering
// ============================================================

const MP = {
    // ── Connection ─────────────────────────────────────────
    ws: null,
    connected: false,
    playerId: null,
    SERVER_URL: (() => {
        const meta = document.querySelector('meta[name="mp-server"]');
        if (meta) return meta.content;
        const loc = window.location;
        // file:// or localhost → local server
        if (loc.protocol === 'file:' || loc.hostname === 'localhost' || loc.hostname === '127.0.0.1' || !loc.hostname) {
            return 'ws://localhost:3000';
        }
        return 'wss://oh-come-on-production.up.railway.app';
    })(),

    // ── State ──────────────────────────────────────────────
    state: 'menu',  // menu, connecting, inRoom, countdown, racing, results
    roomCode: null,
    isHost: false,
    players: [],     // [{id, name, color, ready, isHost}]
    countdownTick: 0,
    results: null,
    error: '',
    errorTimer: 0,
    finishDeadline: 0,  // timestamp when remaining players run out of time

    // ── Profile ────────────────────────────────────────────
    myName: 'Player',
    myColor: '#e74c3c',
    colorIndex: 0,
    COLORS: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ecf0f1'],
    COLOR_NAMES: ['Red', 'Blue', 'Green', 'Gold', 'Purple', 'Orange', 'Teal', 'White'],

    // ── Ghost Data ─────────────────────────────────────────
    ghosts: new Map(),  // id -> {x, y, prevX, prevY, facingRight, alive, currentLevel, name, color, lastUpdate}

    // ── Notifications ─────────────────────────────────────
    notifications: [],  // [{text, color, timer}]

    // ── Send Throttle ──────────────────────────────────────
    lastSendTime: 0,
    SEND_RATE: 50,

    // ── Race Timer ────────────────────────────────────────
    raceStartTime: 0,  // timestamp when race started
    myFinishTime: 0,   // own finish time in seconds

    // ── Race Config ────────────────────────────────────────
    raceMode: 'single',  // single, phase, all
    selectedLevel: 0,
    levelStart: 0,
    levelEnd: 0,
    sharedLevelCode: '',
    levelSource: 'campaign',

    // ── Lobby UI ───────────────────────────────────────────
    lobbyIndex: 0,
    lobbyNavCD: 0,
    inputMode: null,    // null | 'name' | 'code'
    inputBuffer: '',
    joinCode: '',

    // ── Init ───────────────────────────────────────────────
    loadProfile() {
        try {
            const d = JSON.parse(localStorage.getItem('ohcomeon_mp') || '{}');
            if (d.name) this.myName = d.name;
            if (d.color) {
                this.myColor = d.color;
                const ci = this.COLORS.indexOf(d.color);
                if (ci >= 0) this.colorIndex = ci;
            }
        } catch {}
    },

    saveProfile() {
        localStorage.setItem('ohcomeon_mp', JSON.stringify({ name: this.myName, color: this.myColor }));
    },

    // ── Connection ─────────────────────────────────────────
    connect(action, code) {
        if (this.ws) this.disconnect();
        this.state = 'connecting';
        this.error = '';
        try {
            this.ws = new WebSocket(this.SERVER_URL);
        } catch {
            this.error = 'Connection failed';
            this.errorTimer = 300;
            this.state = 'menu';
            return;
        }
        this.ws.onopen = () => {
            this.connected = true;
            if (action === 'create') {
                this.ws.send(JSON.stringify({ type: 'create', name: this.myName, color: this.myColor }));
            } else {
                this.ws.send(JSON.stringify({ type: 'join', code: code, name: this.myName, color: this.myColor }));
            }
        };
        this.ws.onmessage = (e) => this.onMessage(JSON.parse(e.data));
        this.ws.onclose = () => {
            this.connected = false;
            this.ws = null;
            if (this.state === 'racing') {
                this.state = 'menu';
                game.goToMenu();
            } else if (this.state !== 'menu') {
                this.error = 'Disconnected';
                this.errorTimer = 300;
                this.state = 'menu';
            }
        };
        this.ws.onerror = () => {};
    },

    disconnect() {
        if (this.ws) {
            try { this.ws.send(JSON.stringify({ type: 'leave' })); } catch {}
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.playerId = null;
        this.roomCode = null;
        this.isHost = false;
        this.players = [];
        this.ghosts.clear();
        this.state = 'menu';
        this.results = null;
    },

    send(msg) {
        if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg));
    },

    // ── Message Handler ────────────────────────────────────
    onMessage(msg) {
        switch (msg.type) {
            case 'roomCreated':
                this.playerId = msg.playerId;
                this.roomCode = msg.code;
                this.isHost = true;
                this.players = [{ id: msg.playerId, name: this.myName, color: this.myColor, ready: false, isHost: true }];
                this.state = 'inRoom';
                this.lobbyIndex = 0;
                break;

            case 'joined':
                this.playerId = msg.playerId;
                this.roomCode = msg.players[0] ? null : null; // find code from UI
                this.isHost = false;
                this.players = msg.players;
                this.raceMode = msg.raceMode || 'single';
                this.selectedLevel = msg.levelId || 0;
                this.levelStart = msg.levelStart || 0;
                this.levelEnd = msg.levelEnd || 0;
                this.levelSource = msg.levelSource || 'campaign';
                this.sharedLevelCode = msg.sharedLevelCode || '';
                this.state = 'inRoom';
                this.lobbyIndex = 0;
                // Find room code from join attempt
                this.roomCode = this.joinCode.toUpperCase();
                break;

            case 'playerJoined':
                this.players.push(msg.player);
                break;

            case 'playerLeft': {
                const left = this.players.find(p => p.id === msg.playerId);
                if (left) {
                    this.notifications.push({ text: left.name + ' left', color: left.color, timer: 180 });
                }
                this.players = this.players.filter(p => p.id !== msg.playerId);
                this.ghosts.delete(msg.playerId);
                break;
            }

            case 'hostChanged':
                this.isHost = msg.playerId === this.playerId;
                for (const p of this.players) p.isHost = p.id === msg.playerId;
                break;

            case 'readyUpdate':
                for (const p of this.players) { if (p.id === msg.playerId) p.ready = msg.ready; }
                break;

            case 'levelChanged':
                this.raceMode = msg.raceMode;
                this.levelSource = msg.levelSource;
                this.selectedLevel = msg.levelId;
                this.levelStart = msg.levelStart;
                this.levelEnd = msg.levelEnd;
                this.sharedLevelCode = msg.sharedLevelCode;
                break;

            case 'countdown':
                this.state = 'countdown';
                this.countdownTick = msg.tick;
                break;

            case 'start':
                this.state = 'racing';
                this.ghosts.clear();
                this.results = null;
                this.finishDeadline = 0;
                this.raceStartTime = Date.now();
                this.myFinishTime = 0;
                // Start the level in game
                if (this.raceMode === 'shared' && this.sharedLevelCode) {
                    try {
                        const levelData = deserializeCommunityLevelFromCode(this.sharedLevelCode.replace(/\s+/g, ''));
                        game.startSharedLevel(levelData, this.sharedLevelCode);
                    } catch {
                        this.error = 'Failed to load shared level';
                        this.errorTimer = 180;
                        this.state = 'inRoom';
                    }
                } else {
                    const startIdx = this.raceMode === 'single' ? this.selectedLevel : this.levelStart;
                    game.startLevel(startIdx);
                }
                break;

            case 'positions':
                for (const g of msg.ghosts) {
                    if (g.id === this.playerId) continue;
                    const existing = this.ghosts.get(g.id);
                    if (existing) {
                        existing.prevX = existing.x;
                        existing.prevY = existing.y;
                        existing.x = g.x;
                        existing.y = g.y;
                        existing.facingRight = g.facingRight;
                        existing.alive = g.alive;
                        existing.currentLevel = g.currentLevel;
                        existing.lastUpdate = Date.now();
                    } else {
                        const p = this.players.find(pl => pl.id === g.id);
                        this.ghosts.set(g.id, {
                            x: g.x, y: g.y, prevX: g.x, prevY: g.y,
                            facingRight: g.facingRight, alive: g.alive, currentLevel: g.currentLevel,
                            name: p ? p.name : '???', color: p ? p.color : '#888',
                            lastUpdate: Date.now(),
                        });
                    }
                }
                break;

            case 'playerFinished': {
                for (const p of this.players) {
                    if (p.id === msg.playerId) { p.finished = true; p.finishOrder = msg.order; p.finishTime = msg.time || 0; }
                }
                // Track own finish time
                if (msg.playerId === this.playerId) {
                    this.myFinishTime = msg.time || 0;
                }
                // Remove ghost so they disappear instead of freezing
                this.ghosts.delete(msg.playerId);
                // Start 60s countdown on first finish
                if (msg.order === 1) {
                    this.finishDeadline = Date.now() + 60000;
                }
                break;
            }

            case 'results':
                this.state = 'results';
                this.results = msg.rankings;
                break;

            case 'error':
                this.error = msg.message;
                this.errorTimer = 300;
                if (this.state === 'connecting') this.state = 'menu';
                break;
        }
    },

    // ── Getters ────────────────────────────────────────────
    getMyPlayer() {
        return this.players.find(p => p.id === this.playerId);
    },

    allReady() {
        return this.players.length >= 2 && this.players.every(p => p.ready);
    },

    // ── Position Sending ───────────────────────────────────
    sendPosition(player, currentLevel) {
        const now = Date.now();
        if (now - this.lastSendTime < this.SEND_RATE) return;
        this.lastSendTime = now;
        this.send({
            type: 'pos',
            x: Math.round(player.x), y: Math.round(player.y),
            facingRight: player.facingRight, alive: player.alive,
            currentLevel: currentLevel, deaths: game.totalDeaths,
        });
    },

    sendFinish() {
        this.send({ type: 'finish' });
    },

    // ── Enter Lobby ────────────────────────────────────────
    enterLobby() {
        this.loadProfile();
        this.state = 'menu';
        this.lobbyIndex = 0;
        this.inputMode = null;
        this.joinCode = '';
        this.error = '';
        this.results = null;
    },

    // ── Send Level Config (Host) ───────────────────────────
    sendLevelConfig() {
        let start = this.selectedLevel, end = this.selectedLevel;
        if (this.raceMode === 'phase' || this.raceMode === 'speedrun_phase') {
            const phase = Math.floor(this.selectedLevel / PHASE_SIZE);
            start = phase * PHASE_SIZE;
            end = Math.min(start + PHASE_SIZE, LEVELS.length) - 1;
        } else if (this.raceMode === 'all' || this.raceMode === 'speedrun_all') {
            start = 0;
            end = LEVELS.length - 1;
        }
        this.levelStart = start;
        this.levelEnd = end;
        this.send({
            type: 'setLevel', raceMode: this.raceMode,
            levelSource: this.levelSource, levelId: this.selectedLevel,
            levelStart: start, levelEnd: end, sharedLevelCode: this.sharedLevelCode,
        });
    },

    // ── Ghost Rendering ────────────────────────────────────
    drawGhosts(cameraX, cameraY) {
        const now = Date.now();
        const size = CFG.playerSize;

        for (const [, g] of this.ghosts) {
            if (!g.alive) continue;
            if (g.currentLevel !== game.currentLevel) continue;

            // Interpolate
            const t = Math.min(1, (now - g.lastUpdate) / this.SEND_RATE);
            const gx = lerp(g.prevX, g.x, t) - cameraX;
            const gy = lerp(g.prevY, g.y, t) - cameraY;

            // Body
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = g.color;
            ctx.fillRect(gx, gy, size, size);

            // Eyes
            const cx = gx + size / 2;
            const eyeY = gy + size * 0.35;
            const eo = size * 0.18;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - eo - 3, eyeY, 4, 4);
            ctx.fillRect(cx + eo - 1, eyeY, 4, 4);
            // Pupils
            const ps = g.facingRight ? 1.5 : -0.5;
            ctx.fillStyle = '#000';
            ctx.fillRect(cx - eo - 3 + ps + 0.5, eyeY + 1, 2, 2);
            ctx.fillRect(cx + eo - 1 + ps + 0.5, eyeY + 1, 2, 2);

            // Name
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = g.color;
            ctx.font = '9px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(g.name, gx + size / 2, gy - 4);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    },

    // ── Notifications ─────────────────────────────────────
    drawNotifications() {
        let y = 70;
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            n.timer--;
            if (n.timer <= 0) { this.notifications.splice(i, 1); continue; }
            const alpha = n.timer > 30 ? 0.9 : n.timer / 30 * 0.9;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.textAlign = 'center';
            ctx.font = '12px "Courier New", monospace';
            const tw = ctx.measureText(n.text).width;
            ctx.fillRect(W / 2 - tw / 2 - 10, y - 10, tw + 20, 20);
            ctx.fillStyle = n.color || '#fff';
            ctx.fillText(n.text, W / 2, y + 4);
            y += 24;
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    },

    // ── Race HUD (small status during play) ────────────────
    drawRaceHUD() {
        // Speedrun timer (top-left) — only in speedrun modes
        const isSpeedrun = this.raceMode === 'speedrun_phase' || this.raceMode === 'speedrun_all';
        if (isSpeedrun && this.raceStartTime > 0) {
            const elapsed = this.myFinishTime > 0 ? this.myFinishTime : (Date.now() - this.raceStartTime) / 1000;
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = this.myFinishTime > 0 ? '#2ecc71' : '#f1c40f';
            ctx.textAlign = 'left';
            ctx.fillText('\u2605 SPEEDRUN \u23F1 ' + elapsed.toFixed(2) + 's', 20, 30);
        }

        const x = W - 20;
        let y = 48;
        ctx.font = '9px "Courier New", monospace';
        for (const p of this.players) {
            if (p.id === this.playerId) continue;
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = p.color;
            ctx.fillRect(x - 8, y - 6, 8, 8);
            ctx.fillStyle = p.finished ? '#2ecc71' : '#fff';
            ctx.textAlign = 'right';
            const timeStr = isSpeedrun && p.finished && p.finishTime ? ' ' + p.finishTime.toFixed(2) + 's' : '';
            ctx.fillText(p.finished ? p.name + ' #' + p.finishOrder + timeStr : p.name, x - 14, y);
            y += 14;
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';

        // Show countdown timer when someone finished and we haven't yet
        const me = this.getMyPlayer();
        if (this.finishDeadline > 0 && me && !me.finished) {
            const remaining = Math.max(0, Math.ceil((this.finishDeadline - Date.now()) / 1000));
            const urgent = remaining <= 10;
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = urgent ? '#e74c3c' : '#f1c40f';
            ctx.textAlign = 'center';
            ctx.globalAlpha = urgent ? (Math.sin(Date.now() * 0.01) > 0 ? 1 : 0.4) : 0.9;
            ctx.fillText(remaining + 's', W / 2, 30);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        }
    },

    // ── Countdown Overlay ──────────────────────────────────
    drawCountdown(frameCount) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        const label = this.countdownTick > 0 ? '' + this.countdownTick : 'GO!';
        const color = this.countdownTick > 0 ? '#f1c40f' : '#2ecc71';
        const size = this.countdownTick > 0 ? 80 : 60;

        ctx.fillStyle = color;
        ctx.font = 'bold ' + size + 'px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, W / 2, H / 2 + size / 3);
        ctx.textAlign = 'left';
    },

    // ── Results Screen ─────────────────────────────────────
    drawResults(frameCount) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RESULTS', W / 2, 80);

        if (!this.results) return;

        const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}', ''];
        for (let i = 0; i < this.results.length; i++) {
            const r = this.results[i];
            const y = 130 + i * 50;

            // Place number
            ctx.fillStyle = r.order > 0 ? '#fff' : '#555';
            ctx.font = 'bold 22px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(r.order > 0 ? '#' + r.order : 'DNF', W / 2 - 120, y);

            // Color swatch
            ctx.fillStyle = r.color;
            ctx.fillRect(W / 2 - 80, y - 12, 14, 14);

            // Name
            ctx.fillStyle = r.order > 0 ? '#fff' : '#666';
            ctx.font = '16px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(r.name, W / 2 - 58, y);

            // Time (only in speedrun modes)
            const isSR = this.raceMode === 'speedrun_phase' || this.raceMode === 'speedrun_all';
            if (isSR && r.time > 0) {
                ctx.fillStyle = '#f1c40f';
                ctx.font = '13px "Courier New", monospace';
                ctx.textAlign = 'right';
                ctx.fillText('\u23F1 ' + r.time.toFixed(2) + 's', W / 2 + 90, y);
            }

            // Deaths
            ctx.fillStyle = '#888';
            ctx.font = '13px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('\u2620 ' + (r.deaths || 0), W / 2 + 150, y);
        }

        // Hint
        const blink = Math.sin(frameCount * 0.06) > 0;
        if (blink) {
            ctx.fillStyle = '#666';
            ctx.font = '12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ENTER - Back to Lobby     ESC - Leave', W / 2, H - 40);
        }
        ctx.textAlign = 'left';
    },

    // ── Lobby Drawing ──────────────────────────────────────
    drawLobby(frameCount) {
        initMenuParticles();
        updateMenuParticles();
        drawMenuBackground(frameCount);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MULTIPLAYER', W / 2, 45);

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(W / 2 - 120, 60); ctx.lineTo(W / 2 + 120, 60); ctx.stroke();

        // Error display
        if (this.errorTimer > 0) {
            this.errorTimer--;
            ctx.fillStyle = '#e74c3c';
            ctx.font = '12px "Courier New", monospace';
            ctx.fillText(this.error, W / 2, 78);
        }

        if (this.state === 'menu' || this.state === 'connecting') {
            this._drawLobbyMenu(frameCount);
        } else if (this.state === 'inRoom') {
            this._drawRoom(frameCount);
        } else if (this.state === 'countdown') {
            this._drawRoom(frameCount);
            this.drawCountdown(frameCount);
        } else if (this.state === 'results') {
            this.drawResults(frameCount);
        }
        ctx.textAlign = 'left';
    },

    _drawLobbyMenu(frameCount) {
        const items = ['NAME', 'COLOR', 'CREATE ROOM', 'JOIN ROOM', 'BACK'];
        const startY = 110;
        const rowH = 36;

        for (let i = 0; i < items.length; i++) {
            const y = startY + i * rowH;
            const sel = i === this.lobbyIndex;

            if (sel) {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.06)';
                ctx.fillRect(W / 2 - 160, y - 6, 320, 26);
                const bounce = Math.sin(frameCount * 0.12) * 2.5;
                ctx.fillStyle = '#2ecc71';
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'right';
                ctx.fillText('\u25B8', W / 2 - 140 + bounce, y + 12);
            }

            ctx.textAlign = 'left';
            ctx.font = sel ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
            ctx.fillStyle = sel ? '#fff' : '#888';
            ctx.fillText(items[i], W / 2 - 125, y + 12);

            // Values
            ctx.textAlign = 'right';
            ctx.font = '13px "Courier New", monospace';
            if (i === 0) { // Name
                if (this.inputMode === 'name') {
                    const blink = Math.sin(frameCount * 0.15) > 0;
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillText(this.inputBuffer + (blink ? '|' : ' '), W / 2 + 150, y + 12);
                } else {
                    ctx.fillStyle = sel ? '#2ecc71' : '#666';
                    ctx.fillText(this.myName, W / 2 + 150, y + 12);
                }
            } else if (i === 1) { // Color
                ctx.fillStyle = this.myColor;
                ctx.fillRect(W / 2 + 100, y, 14, 14);
                ctx.fillStyle = sel ? '#ccc' : '#666';
                ctx.fillText(this.COLOR_NAMES[this.colorIndex], W / 2 + 95, y + 12);
            } else if (i === 3) { // Join code
                if (this.inputMode === 'code') {
                    const blink = Math.sin(frameCount * 0.15) > 0;
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillText(this.inputBuffer + (blink ? '|' : ' '), W / 2 + 150, y + 12);
                } else if (this.joinCode) {
                    ctx.fillStyle = '#888';
                    ctx.fillText(this.joinCode, W / 2 + 150, y + 12);
                }
            }
        }

        // Connecting indicator
        if (this.state === 'connecting') {
            ctx.fillStyle = '#f1c40f';
            ctx.font = '13px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Connecting...', W / 2, startY + 5 * rowH + 20);
        }

        // Hints
        ctx.fillStyle = '#555';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('\u2191\u2193 Navigate    Enter Select    \u2190\u2192 Color    ESC Back', W / 2, H - 20);
    },

    _drawRoom(frameCount) {
        // Room code
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Room: ' + this.roomCode, W / 2, 100);
        ctx.fillStyle = '#555';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('Share this code with friends', W / 2, 118);

        // Players
        ctx.fillStyle = '#888';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('\u2500\u2500 Players \u2500\u2500', W / 2, 145);

        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            const y = 165 + i * 24;
            // Color swatch
            ctx.fillStyle = p.color;
            ctx.fillRect(W / 2 - 100, y - 8, 10, 10);
            // Name
            ctx.fillStyle = '#ccc';
            ctx.font = '13px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(p.name + (p.isHost ? ' (host)' : '') + (p.id === this.playerId ? ' (you)' : ''), W / 2 - 84, y);
            // Ready
            ctx.textAlign = 'right';
            ctx.fillStyle = p.ready ? '#2ecc71' : '#555';
            ctx.fillText(p.ready ? '\u2713 Ready' : '\u2717 Not Ready', W / 2 + 130, y);
        }

        // Room menu items
        const menuY = 165 + Math.max(this.players.length, 2) * 24 + 20;
        const items = this._getRoomItems();

        for (let i = 0; i < items.length; i++) {
            const y = menuY + i * 30;
            const sel = i === this.lobbyIndex;
            const item = items[i];

            if (sel) {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.06)';
                ctx.fillRect(W / 2 - 150, y - 4, 300, 22);
                const bounce = Math.sin(frameCount * 0.12) * 2.5;
                ctx.fillStyle = '#2ecc71';
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'right';
                ctx.fillText('\u25B8', W / 2 - 130 + bounce, y + 10);
            }

            ctx.textAlign = 'left';
            const dim = item.hostOnly && !this.isHost;
            ctx.font = sel && !dim ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
            ctx.fillStyle = dim ? '#444' : (sel ? '#fff' : '#888');
            ctx.fillText(item.label, W / 2 - 115, y + 10);

            if (item.value) {
                ctx.textAlign = 'right';
                ctx.fillStyle = dim ? '#333' : (sel ? item.valueColor || '#aaa' : '#555');
                ctx.fillText(item.value, W / 2 + 140, y + 10);
            }
        }

        // Hints
        ctx.fillStyle = '#555';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('\u2191\u2193 Navigate    Enter Select    \u2190\u2192 Change    ESC Leave', W / 2, H - 20);
    },

    _getRoomItems() {
        const modeLabels = { single: 'Single Level', phase: 'Phase', all: 'All Levels', speedrun_phase: 'Speedrun Phase', speedrun_all: 'Speedrun All', shared: 'Shared Level' };
        let levelLabel = '';
        if (this.raceMode === 'shared') {
            levelLabel = this.sharedLevelCode ? 'Code loaded' : 'No code';
        } else if ((this.raceMode === 'single' || this.raceMode === 'speedrun_phase') && typeof LEVELS !== 'undefined' && LEVELS[this.selectedLevel]) {
            if (this.raceMode === 'speedrun_phase') {
                levelLabel = 'Phase ' + (Math.floor(this.selectedLevel / PHASE_SIZE) + 1);
            } else {
                levelLabel = (this.selectedLevel + 1) + ' - ' + LEVELS[this.selectedLevel].name;
            }
        } else if (this.raceMode === 'phase') {
            levelLabel = 'Phase ' + (Math.floor(this.selectedLevel / PHASE_SIZE) + 1);
        } else if (this.raceMode === 'all' || this.raceMode === 'speedrun_all') {
            levelLabel = 'Level 1-' + LEVELS.length;
        }

        const me = this.getMyPlayer();
        const items = [
            { id: 'mode', label: 'MODE', value: modeLabels[this.raceMode] || 'Single', hostOnly: true },
        ];
        if (this.raceMode === 'shared') {
            items.push({ id: 'paste', label: 'PASTE LEVEL CODE', hostOnly: true, value: this.sharedLevelCode ? '\u2713' : '', valueColor: '#2ecc71' });
        } else {
            items.push({ id: 'level', label: 'LEVEL', value: levelLabel, hostOnly: true });
        }
        items.push({ id: 'ready', label: me?.ready ? 'UNREADY' : 'READY' });
        if (this.isHost) {
            items.push({
                id: 'start', label: 'START RACE',
                value: this.allReady() ? '' : 'waiting...',
                valueColor: this.allReady() ? '#2ecc71' : '#555',
            });
        }
        items.push({ id: 'leave', label: 'LEAVE' });
        return items;
    },

    // ── Lobby Input Handling ───────────────────────────────
    updateLobby() {
        if (this.lobbyNavCD > 0) this.lobbyNavCD--;

        // Text input mode
        if (this.inputMode) {
            this._handleTextInput();
            return;
        }

        // Results screen: Enter/ESC go back to room
        if (this.state === 'results') {
            if (keys['Enter'] || keys['Space'] || keys['Escape']) {
                keys['Enter'] = false; keys['Space'] = false; keys['Escape'] = false;
                SFX.menuSelect();
                this.state = 'inRoom';
                this.lobbyIndex = 0;
                this.finishDeadline = 0;
            }
            return;
        }

        // ESC
        if (keys['Escape']) {
            keys['Escape'] = false;
            if (this.state === 'inRoom') {
                this.disconnect();
            } else {
                game.state = 'menu';
            }
            return;
        }

        const maxIndex = this.state === 'inRoom' ? this._getRoomItems().length - 1 : 4;

        // Navigation
        if (keys['ArrowUp'] && this.lobbyNavCD <= 0) {
            keys['ArrowUp'] = false;
            this.lobbyIndex = Math.max(0, this.lobbyIndex - 1);
            this.lobbyNavCD = 8;
            SFX.menuTick();
        }
        if (keys['ArrowDown'] && this.lobbyNavCD <= 0) {
            keys['ArrowDown'] = false;
            this.lobbyIndex = Math.min(maxIndex, this.lobbyIndex + 1);
            this.lobbyNavCD = 8;
            SFX.menuTick();
        }

        // Left/Right for cycling values
        if (keys['ArrowLeft'] || keys['ArrowRight']) {
            const dir = keys['ArrowRight'] ? 1 : -1;
            keys['ArrowLeft'] = false; keys['ArrowRight'] = false;
            this._handleCycle(dir);
        }

        // Enter
        if (keys['Enter'] || keys['Space']) {
            keys['Enter'] = false; keys['Space'] = false;
            SFX.menuSelect();
            this._handleSelect();
        }
    },

    _handleTextInput() {
        // Capture typed characters
        for (const code in keys) {
            if (!keys[code]) continue;
            keys[code] = false;

            if (code === 'Escape') {
                this.inputMode = null;
                return;
            }
            if (code === 'Enter') {
                if (this.inputMode === 'name') {
                    this.myName = this.inputBuffer.slice(0, 16) || 'Player';
                    this.saveProfile();
                } else if (this.inputMode === 'code') {
                    this.joinCode = this.inputBuffer.toUpperCase();
                    if (this.joinCode.length === 5) {
                        this.connect('join', this.joinCode);
                    }
                }
                this.inputMode = null;
                return;
            }
            if (code === 'Backspace') {
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                return;
            }
            // Typed character
            let ch = '';
            if (code.startsWith('Key')) ch = code.slice(3);
            else if (code.startsWith('Digit')) ch = code.slice(5);
            else if (code === 'Space') ch = ' ';
            else if (code === 'Minus') ch = '-';
            else if (code === 'Period') ch = '.';

            if (ch) {
                const maxLen = this.inputMode === 'code' ? 5 : 16;
                if (this.inputBuffer.length < maxLen) {
                    this.inputBuffer += this.inputMode === 'code' ? ch.toUpperCase() : ch;
                }
            }
        }
    },

    _handleCycle(dir) {
        if (this.state === 'menu' || this.state === 'connecting') {
            if (this.lobbyIndex === 1) { // Color
                this.colorIndex = (this.colorIndex + dir + this.COLORS.length) % this.COLORS.length;
                this.myColor = this.COLORS[this.colorIndex];
                this.saveProfile();
            }
        } else if (this.state === 'inRoom' && this.isHost) {
            const items = this._getRoomItems();
            const item = items[this.lobbyIndex];
            if (!item) return;
            if (item.id === 'mode') {
                const modes = ['single', 'phase', 'all', 'speedrun_phase', 'speedrun_all', 'shared'];
                const ci = modes.indexOf(this.raceMode);
                this.raceMode = modes[(ci + dir + modes.length) % modes.length];
                this.sendLevelConfig();
            } else if (item.id === 'level') {
                if (this.raceMode === 'single') {
                    this.selectedLevel = Math.max(0, Math.min(LEVELS.length - 1, this.selectedLevel + dir));
                } else if (this.raceMode === 'phase' || this.raceMode === 'speedrun_phase') {
                    const maxPhase = Math.ceil(LEVELS.length / PHASE_SIZE) - 1;
                    const curPhase = Math.floor(this.selectedLevel / PHASE_SIZE);
                    const newPhase = Math.max(0, Math.min(maxPhase, curPhase + dir));
                    this.selectedLevel = newPhase * PHASE_SIZE;
                }
                this.sendLevelConfig();
            }
        }
    },

    _handleSelect() {
        if (this.state === 'menu') {
            switch (this.lobbyIndex) {
                case 0: // Name
                    this.inputMode = 'name';
                    this.inputBuffer = this.myName;
                    break;
                case 1: // Color (cycle handled by left/right)
                    break;
                case 2: // Create Room
                    this.connect('create');
                    break;
                case 3: // Join Room
                    this.inputMode = 'code';
                    this.inputBuffer = this.joinCode;
                    break;
                case 4: // Back
                    game.state = 'menu';
                    break;
            }
        } else if (this.state === 'inRoom') {
            const items = this._getRoomItems();
            const item = items[this.lobbyIndex];
            if (!item) return;
            switch (item.id) {
                case 'paste':
                    if (this.isHost) {
                        navigator.clipboard.readText().then(text => {
                            const raw = (text || '').trim().replace(/\s+/g, '');
                            if (!raw) {
                                this.error = 'Clipboard is empty';
                                this.errorTimer = 180;
                                return;
                            }
                            if (typeof deserializeCommunityLevelFromCode !== 'function') {
                                this.error = 'Level loader not available';
                                this.errorTimer = 180;
                                return;
                            }
                            try {
                                deserializeCommunityLevelFromCode(raw);
                                this.sharedLevelCode = raw;
                                this.levelSource = 'shared';
                                this.sendLevelConfig();
                                this.notifications.push({ text: 'Shared level loaded!', color: '#2ecc71', timer: 150 });
                            } catch {
                                this.error = 'Invalid level code';
                                this.errorTimer = 180;
                            }
                        }).catch(() => {
                            this.error = 'Clipboard access denied';
                            this.errorTimer = 180;
                        });
                    }
                    break;
                case 'ready': {
                    const me = this.getMyPlayer();
                    if (me) {
                        me.ready = !me.ready;
                        this.send({ type: 'ready', ready: me.ready });
                    }
                    break;
                }
                case 'start':
                    if (this.allReady()) {
                        this.send({ type: 'startRace' });
                    }
                    break;
                case 'leave':
                    this.disconnect();
                    break;
            }
        }
    },
};

// Auto-load profile on script load
MP.loadProfile();
