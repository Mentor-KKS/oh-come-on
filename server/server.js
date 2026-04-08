// ============================================================
//  OH COME ON! — Multiplayer Relay Server
//  Pure relay, zero game logic. Rooms + position broadcast.
// ============================================================

const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_PLAYERS = 4;
const FINISH_TIMEOUT = 60000; // 60s after first finish

const rooms = new Map();
let nextId = 1;

// ── Room Code ──────────────────────────────────────────────
function generateCode() {
    let code;
    do {
        code = '';
        for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    } while (rooms.has(code));
    return code;
}

// ── Broadcast ──────────────────────────────────────────────
function broadcast(room, msg, excludeId) {
    const data = JSON.stringify(msg);
    for (const [ws, p] of room.players) {
        if ((!excludeId || p.id !== excludeId) && ws.readyState === 1) ws.send(data);
    }
}

function send(ws, msg) {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

// ── Results ────────────────────────────────────────────────
function sendResults(room) {
    if (room.resultsSent) return;
    room.resultsSent = true;
    if (room.finishTimeout) { clearTimeout(room.finishTimeout); room.finishTimeout = null; }
    const rankings = [];
    for (const [, p] of room.players) {
        rankings.push({ id: p.id, name: p.name, color: p.color, order: p.finishOrder, deaths: p.deaths, time: p.finishTime || 0 });
    }
    rankings.sort((a, b) => {
        if (a.order === 0 && b.order === 0) return 0;
        if (a.order === 0) return 1;
        if (b.order === 0) return -1;
        return a.order - b.order;
    });
    broadcast(room, { type: 'results', rankings });
    // Reset room to lobby
    room.state = 'lobby';
    room.finishCount = 0;
    room.resultsSent = false;
    for (const [, p] of room.players) {
        p.ready = false; p.finished = false; p.finishOrder = 0; p.deaths = 0; p.finishTime = 0; p.lastPos = null;
    }
}

// ── Remove Player ──────────────────────────────────────────
function removePlayer(ws) {
    for (const [code, room] of rooms) {
        if (!room.players.has(ws)) continue;
        const player = room.players.get(ws);
        room.players.delete(ws);
        broadcast(room, { type: 'playerLeft', playerId: player.id });

        if (room.players.size === 0) {
            if (room.finishTimeout) clearTimeout(room.finishTimeout);
            rooms.delete(code);
        } else if (player.isHost) {
            const [, newHost] = room.players.entries().next().value;
            newHost.isHost = true;
            broadcast(room, { type: 'hostChanged', playerId: newHost.id });
        }
        break;
    }
}

// ── WebSocket Server ───────────────────────────────────────
const wss = new WebSocketServer({ port: PORT });
console.log('OH COME ON! Multiplayer server on port ' + PORT);

wss.on('connection', (ws) => {
    let myRoom = null;

    ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }

        switch (msg.type) {

            case 'create': {
                if (myRoom) break;
                const code = generateCode();
                const id = 'P' + (nextId++);
                const room = {
                    code, state: 'lobby', finishCount: 0, resultsSent: false, finishTimeout: null,
                    players: new Map(),
                    levelSource: 'campaign', levelId: 0, sharedLevelCode: '',
                    raceMode: 'single', levelStart: 0, levelEnd: 0,
                };
                const player = {
                    id, name: (msg.name || 'Player').slice(0, 16), color: msg.color || '#e74c3c',
                    ready: false, finished: false, finishOrder: 0, isHost: true, deaths: 0, lastPos: null,
                };
                room.players.set(ws, player);
                rooms.set(code, room);
                myRoom = room;
                send(ws, { type: 'roomCreated', code, playerId: id });
                break;
            }

            case 'join': {
                if (myRoom) break;
                const room = rooms.get((msg.code || '').toUpperCase());
                if (!room) { send(ws, { type: 'error', message: 'Room not found' }); break; }
                if (room.players.size >= MAX_PLAYERS) { send(ws, { type: 'error', message: 'Room is full (max 4)' }); break; }
                if (room.state !== 'lobby') { send(ws, { type: 'error', message: 'Race already in progress' }); break; }

                const id = 'P' + (nextId++);
                const player = {
                    id, name: (msg.name || 'Player').slice(0, 16), color: msg.color || '#3498db',
                    ready: false, finished: false, finishOrder: 0, isHost: false, deaths: 0, lastPos: null,
                };
                room.players.set(ws, player);
                myRoom = room;

                const roster = [];
                for (const [, p] of room.players) {
                    roster.push({ id: p.id, name: p.name, color: p.color, ready: p.ready, isHost: p.isHost });
                }
                send(ws, {
                    type: 'joined', playerId: id, players: roster,
                    levelSource: room.levelSource, levelId: room.levelId, raceMode: room.raceMode,
                    levelStart: room.levelStart, levelEnd: room.levelEnd,
                    sharedLevelCode: room.sharedLevelCode,
                });
                broadcast(room, {
                    type: 'playerJoined',
                    player: { id, name: player.name, color: player.color, ready: false, isHost: false },
                }, id);
                break;
            }

            case 'ready': {
                if (!myRoom) break;
                const p = myRoom.players.get(ws);
                if (!p) break;
                p.ready = !!msg.ready;
                broadcast(myRoom, { type: 'readyUpdate', playerId: p.id, ready: p.ready });
                break;
            }

            case 'setLevel': {
                if (!myRoom) break;
                const p = myRoom.players.get(ws);
                if (!p?.isHost || myRoom.state !== 'lobby') break;
                myRoom.raceMode = msg.raceMode || 'single';
                myRoom.levelSource = msg.levelSource || 'campaign';
                myRoom.levelId = msg.levelId ?? 0;
                myRoom.levelStart = msg.levelStart ?? 0;
                myRoom.levelEnd = msg.levelEnd ?? 0;
                myRoom.sharedLevelCode = msg.sharedLevelCode || '';
                broadcast(myRoom, {
                    type: 'levelChanged', raceMode: myRoom.raceMode,
                    levelSource: myRoom.levelSource, levelId: myRoom.levelId,
                    levelStart: myRoom.levelStart, levelEnd: myRoom.levelEnd,
                    sharedLevelCode: myRoom.sharedLevelCode,
                });
                break;
            }

            case 'startRace': {
                if (!myRoom) break;
                const p = myRoom.players.get(ws);
                if (!p?.isHost || myRoom.state !== 'lobby') break;
                if (myRoom.players.size < 2) break;
                let allReady = true;
                for (const [, pl] of myRoom.players) { if (!pl.ready) { allReady = false; break; } }
                if (!allReady) break;

                myRoom.state = 'countdown';
                myRoom.finishCount = 0;
                myRoom.resultsSent = false;
                for (const [, pl] of myRoom.players) {
                    pl.finished = false; pl.finishOrder = 0; pl.deaths = 0; pl.finishTime = 0; pl.lastPos = null;
                }

                let tick = 3;
                const iv = setInterval(() => {
                    if (!rooms.has(myRoom.code)) { clearInterval(iv); return; }
                    broadcast(myRoom, { type: 'countdown', tick });
                    tick--;
                    if (tick < 0) {
                        clearInterval(iv);
                        myRoom.state = 'playing';
                        myRoom.raceStartTime = Date.now();
                        broadcast(myRoom, { type: 'start', raceStartTime: myRoom.raceStartTime });
                    }
                }, 1000);
                break;
            }

            case 'pos': {
                if (!myRoom || myRoom.state !== 'playing') break;
                const p = myRoom.players.get(ws);
                if (!p) break;
                p.lastPos = {
                    id: p.id, x: msg.x, y: msg.y,
                    facingRight: msg.facingRight, alive: msg.alive,
                    currentLevel: msg.currentLevel,
                };
                if (msg.deaths !== undefined) p.deaths = msg.deaths;
                break;
            }

            case 'finish': {
                if (!myRoom || myRoom.state !== 'playing') break;
                const p = myRoom.players.get(ws);
                if (!p || p.finished) break;
                myRoom.finishCount++;
                p.finished = true;
                p.finishOrder = myRoom.finishCount;
                p.finishTime = myRoom.raceStartTime ? (Date.now() - myRoom.raceStartTime) / 1000 : 0;
                broadcast(myRoom, { type: 'playerFinished', playerId: p.id, order: myRoom.finishCount, time: p.finishTime });

                // Start timeout on first finish
                if (myRoom.finishCount === 1) {
                    myRoom.finishTimeout = setTimeout(() => sendResults(myRoom), FINISH_TIMEOUT);
                }
                // All finished → immediate results
                let allDone = true;
                for (const [, pl] of myRoom.players) { if (!pl.finished) { allDone = false; break; } }
                if (allDone) sendResults(myRoom);
                break;
            }

            case 'leave': {
                removePlayer(ws);
                myRoom = null;
                break;
            }
        }
    });

    ws.on('close', () => removePlayer(ws));
    ws.on('error', () => removePlayer(ws));
});

// ── Position Broadcast (20Hz) ──────────────────────────────
setInterval(() => {
    for (const [, room] of rooms) {
        if (room.state !== 'playing') continue;
        const ghosts = [];
        for (const [, p] of room.players) {
            if (p.lastPos) ghosts.push(p.lastPos);
        }
        if (ghosts.length > 0) broadcast(room, { type: 'positions', ghosts });
    }
}, 50);

// ── Cleanup stale rooms ────────────────────────────────────
setInterval(() => {
    for (const [code, room] of rooms) {
        if (room.players.size === 0) {
            if (room.finishTimeout) clearTimeout(room.finishTimeout);
            rooms.delete(code);
        }
    }
}, 30000);
