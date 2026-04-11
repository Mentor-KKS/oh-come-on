// ============================================================
//  TRAP TYPES
// ============================================================

function getTrapDrawPriority(trap) {
    if (!trap) return 0;
    return Number.isFinite(trap.drawPriority) ? trap.drawPriority : 0;
}

function getOrderedTrapDrawList(traps, renderAfterSpikes = false) {
    return (traps || [])
        .map((trap, index) => ({ trap, index }))
        .filter(entry =>
            entry.trap &&
            entry.trap.type !== 'darknessOverlay' &&
            !!entry.trap.renderAfterSpikes === !!renderAfterSpikes
        )
        .sort((a, b) => {
            const priorityDiff = getTrapDrawPriority(a.trap) - getTrapDrawPriority(b.trap);
            return priorityDiff || (a.index - b.index);
        })
        .map(entry => entry.trap);
}

function getElementCenterPoint(ref) {
    return {
        x: (ref?.x ?? 0) + ((ref?.w ?? 0) / 2),
        y: (ref?.y ?? 0) + ((ref?.h ?? 0) / 2),
    };
}

function findLevelElementByDevId(levelData, devId) {
    const wanted = String(devId || '').trim();
    if (!wanted || !levelData) return null;
    if (levelData.exit?.devId === wanted) return levelData.exit;
    const pools = [levelData.platforms || [], levelData.spikes || [], levelData.traps || []];
    for (const pool of pools) {
        const match = pool.find(item => item && item.devId === wanted);
        if (match) return match;
    }
    return null;
}

function getLinkedActionGroupMembers(levelData, target) {
    const group = String(target?.actionGroup || '').trim();
    if (!group || !levelData) return [];
    const members = [];
    const add = ref => {
        if (!ref || ref === target) return;
        if (String(ref.actionGroup || '').trim() !== group) return;
        members.push(ref);
    };
    add(levelData.exit);
    (levelData.platforms || []).forEach(add);
    (levelData.spikes || []).forEach(add);
    (levelData.traps || []).forEach(add);
    return members;
}

function captureElementRectState(ref) {
    return {
        x: Number.isFinite(ref?.x) ? ref.x : undefined,
        y: Number.isFinite(ref?.y) ? ref.y : undefined,
        w: Number.isFinite(ref?.w) ? ref.w : undefined,
        h: Number.isFinite(ref?.h) ? ref.h : undefined,
        actionHidden: ref?.actionHidden === undefined ? undefined : !!ref.actionHidden,
        actionDisabled: ref?.actionDisabled === undefined ? undefined : !!ref.actionDisabled,
        actionSolid: ref?.actionSolid === undefined ? undefined : !!ref.actionSolid,
    };
}

function applyActionTransformStep(target, step, progress, fromState) {
    if (!target || !fromState) return;
    const lerpValue = (fromValue, toValue) => fromValue + (toValue - fromValue) * progress;
    if (Number.isFinite(step.x) && Number.isFinite(fromState.x)) target.x = lerpValue(fromState.x, step.x);
    if (Number.isFinite(step.y) && Number.isFinite(fromState.y)) target.y = lerpValue(fromState.y, step.y);
    if (Number.isFinite(step.w) && Number.isFinite(fromState.w)) target.w = lerpValue(fromState.w, step.w);
    if (Number.isFinite(step.h) && Number.isFinite(fromState.h)) target.h = lerpValue(fromState.h, step.h);
}

function restoreActionTargetState(target, state) {
    if (!target || !state) return;
    if (Number.isFinite(state.x)) target.x = state.x;
    if (Number.isFinite(state.y)) target.y = state.y;
    if (Number.isFinite(state.w)) target.w = state.w;
    if (Number.isFinite(state.h)) target.h = state.h;
    if (state.actionHidden === undefined) delete target.actionHidden;
    else target.actionHidden = !!state.actionHidden;
    if (state.actionDisabled === undefined) delete target.actionDisabled;
    else target.actionDisabled = !!state.actionDisabled;
    if (state.actionSolid === undefined) delete target.actionSolid;
    else target.actionSolid = !!state.actionSolid;
}

function applyActionMovePlayerInteraction(player, target, dx, dy, linkedMembers, levelData) {
    if (!player || !player.alive || !target) return;
    if (dx === 0 && dy === 0) return;
    if (!isActionElementSolid(target)) return;
    const playerOverlap = aabb(player, target);
    const playerOnTop =
        player.x + player.w > target.x &&
        player.x < target.x + target.w &&
        Math.abs((player.y + player.h) - target.y) < 6;
    if (!playerOverlap && !playerOnTop) return;
    player.x += dx;
    player.y += dy;
    const linkedSet = new Set([target].concat(Array.isArray(linkedMembers) ? linkedMembers : []));
    let crushed = false;
    if (levelData) {
        const platforms = levelData.platforms || [];
        for (const p of platforms) {
            if (!p || linkedSet.has(p)) continue;
            if (isActionElementHidden(p) || !isActionElementSolid(p)) continue;
            if (aabb(player, p)) { crushed = true; break; }
        }
        if (!crushed && Number.isFinite(levelData.width) && Number.isFinite(levelData.height)) {
            if (player.x < 0 || player.x + player.w > levelData.width ||
                player.y < 0 || player.y + player.h > levelData.height) {
                crushed = true;
            }
        }
    }
    if (crushed && typeof player.die === 'function') player.die();
}

function isActionElementHidden(ref) {
    return !!ref?.actionHidden;
}

function isActionElementDisabled(ref) {
    return !!ref?.actionDisabled;
}

function isActionElementSolid(ref) {
    if (!ref || isActionElementHidden(ref) || isActionElementDisabled(ref)) return false;
    if (ref.actionSolid !== undefined) return !!ref.actionSolid;
    if (ref.solid !== undefined) return ref.solid !== false;
    return true;
}

class FallingFloor {
    constructor(x, y, w, h, triggerDelay = 75) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = true;
        this.origY = y;
        this.triggerDelay = Math.max(0, triggerDelay ?? 75);
        this.triggered = false;
        this.shakeTimer = 0;
        this.falling = false;
        this.vy = 0;
        this.type = 'fallingFloor';
    }
    update(player) {
        if (!this.triggered && this.solid) {
            if (player.alive && player.grounded &&
                player.x + player.w > this.x && player.x < this.x + this.w &&
                Math.abs((player.y + player.h) - this.y) < 3) {
                this.triggered = true;
                this.shakeTimer = this.triggerDelay;
                SFX.trapTrigger();
            }
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
    }
    draw() {
        if (this.y > H + 50) return;
        let dx = 0;
        if (this.triggered && !this.falling) dx = rand(-2, 2);
        drawPlatform({ x:this.x + dx, y:this.y, w:this.w, h:this.h, skin:this.skin || 'default' });
    }
    reset() {
        this.y = this.origY;
        this.solid = true;
        this.triggered = false;
        this.shakeTimer = 0;
        this.falling = false;
        this.vy = 0;
    }
}

class RisingSpikes {
    constructor(x, y, w, triggerX) {
        this.x = x; this.baseY = y; this.y = y; this.w = w; this.h = 0;
        this.maxH = 20;
        this.triggerX = triggerX;
        this.triggered = false;
        this.speed = 1.5;
        this.type = 'risingSpikes';
    }
    update(player) {
        if (!this.triggered && player.alive) {
            if (Math.abs(player.x - this.triggerX) < 60) this.triggered = true;
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
    }
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
    }
    reset() {
        this.triggered = false;
        this.h = 0;
        this.y = this.baseY;
    }
}

class FallingCeiling {
    constructor(x, y, w, h, triggerX, fake) {
        this.x = x; this.origY = y; this.y = y;
        this.w = w; this.h = h || 30;
        this.triggerX = triggerX;
        this.triggerMode = 'x';      // 'x' | 'y' | 'proximity' | 'area'
        this.triggerY = y;
        this.triggerDist = 60;
        this.triggerArea = null;
        this.triggered = false;
        this.vy = 0;
        this.stopY = null;
        this.solid = true;
        this.fake = fake || false;
        this.type = 'fallingCeiling';
    }
    checkTrigger(player) {
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const prevPx = (player.prevX ?? player.x) + player.w / 2;
        const prevPy = (player.prevY ?? player.y) + player.h / 2;
        switch (this.triggerMode) {
            case 'x':
                return (prevPx <= this.triggerX && px > this.triggerX) ||
                    (prevPx >= this.triggerX && px < this.triggerX);
            case 'y':
                return (prevPy <= this.triggerY && py > this.triggerY) ||
                    (prevPy >= this.triggerY && py < this.triggerY);
            case 'proximity': {
                const dx = px - (this.x + this.w/2);
                const dy = py - (this.y + this.h/2);
                return Math.sqrt(dx*dx + dy*dy) < this.triggerDist;
            }
            case 'area': {
                const a = this.triggerArea;
                return a && px >= a.x && px <= a.x+a.w && py >= a.y && py <= a.y+a.h;
            }
        }
        return false;
    }
    update(player) {
        if (this.fake) return;
        if (!this.triggered && player.alive) {
            if (this.checkTrigger(player)) this.triggered = true;
        }
        if (this.triggered) {
            this.vy += 0.2;
            this.y += this.vy;
            if (Number.isFinite(this.stopY) && this.y >= this.stopY) {
                this.y = this.stopY;
                this.vy = 0;
            }
        }
        if (this.triggered && player.alive && this.vy > 0) {
            if (aabb(player, this)) player.die();
            // Auch Shadow-Kollision prüfen (falls ShadowPlayer im Level ist)
            const shadow = game.levelData.traps.find(t => t.type === 'shadowPlayer');
            if (shadow && aabb(shadow, this)) player.die();
        }
    }
    draw() {
        const lvlH = (game.levelData && game.levelData.height) || H;
        if (this.y > lvlH + 50) return;
        rect(this.x, this.y, this.w, this.h, '#b0b0b0');
        rect(this.x, this.y + this.h - 3, this.w, 3, '#999');
    }
    reset() {
        this.y = this.origY;
        this.triggered = false;
        this.vy = 0;
    }
}

class MovingExit {
    constructor(positions) {
        this.positions = positions;
        this.index = 0;
        this.x = positions[0].x;
        this.y = positions[0].y;
        this.w = 30;
        this.h = 40;
        this.triggerDist = 55;
        this.moving = false;
        this.targetX = this.x;
        this.targetY = this.y;
        this.type = 'movingExit';
    }
    update(player) {
        if (player.alive && this.index < this.positions.length - 1 && !this.moving) {
            const dx = player.x + player.w / 2 - (this.x + this.w / 2);
            const dy = player.y + player.h / 2 - (this.y + this.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.triggerDist) {
                this.index++;
                this.targetX = this.positions[this.index].x;
                this.targetY = this.positions[this.index].y;
                this.moving = true;
                SFX.exitMove();
            }
        }
        if (this.moving) {
            // Konstante Geschwindigkeit statt lerp
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 7;
            if (dist < speed + 2) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.moving = false;
            } else {
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
            }
        }
    }
    draw() {
        drawExit(this);
    }
    getBounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
    reset() {
        this.index = 0;
        this.x = this.positions[0].x;
        this.y = this.positions[0].y;
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving = false;
    }
}

class FakeFloor {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = false;
        this.renderAfterSpikes = true;
        this.triggered = false;
        this.timer = 0;
        this.alpha = 1;
        this.type = 'fakeFloor';
    }
    update(player) {
        if (!this.triggered && player?.alive) {
            const gDir = player.gDir || 1;
            const prevTop = player.prevY ?? player.y;
            const prevBottom = (player.prevY ?? player.y) + player.h;
            const currTop = player.y;
            const currBottom = player.y + player.h;
            const overlapX = player.x + player.w > this.x && player.x < this.x + this.w;
            const enteredBody = player.y < this.y + this.h && currBottom > this.y;
            const movingIntoIt = gDir > 0 ? currBottom > prevBottom : currTop < prevTop;
            const crossedFakeFace = gDir > 0
                ? prevBottom <= this.y + 6 && currBottom >= this.y + 4
                : prevTop >= this.y + this.h - 6 && currTop <= this.y + this.h - 4;
            if (overlapX && movingIntoIt && (crossedFakeFace || enteredBody)) {
                this.triggered = true;
                this.timer = 0;
                SFX.trapTrigger();
                spawnParticles(this.x + this.w / 2, this.y + this.h / 2, Math.max(8, Math.floor(this.w / 10)), '#d0d0d0');
            }
        }
        if (this.triggered && this.alpha > 0) {
            this.timer++;
            if (this.timer > 2) this.alpha = Math.max(0, this.alpha - 0.16);
        }
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        const dx = this.triggered && this.timer <= 5 ? rand(-1.2, 1.2) : 0;
        const coverDepth = 6;
        rect(this.x + dx, this.y, this.w, this.h, '#d0d0d0');
        rect(this.x + dx, this.y + this.h - 1, this.w, coverDepth, '#d0d0d0');
        rect(this.x + dx, this.y, this.w, 3, '#e8e8e8');
        ctx.restore();
    }
    reset() {
        this.triggered = false;
        this.timer = 0;
        this.alpha = 1;
    }
}

class FakeWall {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w || 20; this.h = h || 140;
        this.solid = false;
        this.renderAfterSpikes = true;
        this.type = 'fakeWall';
    }
    update() {}
    draw() {
        rect(this.x, this.y, this.w, this.h, '#d0d0d0');
        rect(this.x, this.y, this.w, 3, '#e8e8e8');
    }
    reset() {}
}

class DisappearingPlatform {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = true;
        this.alpha = 1;
        this.triggered = false;
        this.timer = 0;
        this.fadeDelay = 30;
        this.type = 'disappearing';
    }
    update(player) {
        if (!this.triggered && this.solid && player.alive && player.grounded) {
            if (player.x + player.w > this.x && player.x < this.x + this.w &&
                Math.abs((player.y + player.h) - this.y) < 3) {
                this.triggered = true;
            }
        }
        if (this.triggered) {
            this.timer++;
            if (this.timer > this.fadeDelay) {
                this.alpha -= 0.05;
                if (this.alpha <= 0) {
                    this.alpha = 0;
                    this.solid = false;
                }
            }
        }
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        let dx = 0;
        if (this.triggered && this.timer < this.fadeDelay) dx = rand(-1.5, 1.5);
        rect(this.x + dx, this.y, this.w, this.h, '#d0d0d0');
        rect(this.x + dx, this.y, this.w, 3, '#e8e8e8');
        ctx.globalAlpha = 1;
    }
    reset() {
        this.solid = true;
        this.alpha = 1;
        this.triggered = false;
        this.timer = 0;
    }
}

class ShootingSpike {
    constructor(x, y, dir, triggerX, speed, a, b, disguised) {
        this.origX = x; this.origY = y;
        this.x = x; this.y = y;
        this.w = 20; this.h = 20;
        this.dir = dir;
        this.triggerX = triggerX;
        this.speed = speed || 6;
        this.triggerMode = 'x';      // 'x' | 'y' | 'proximity' | 'area'
        this.triggerY = y;            // für y-Modus
        this.triggerDist = 80;        // für proximity-Modus
        this.triggerArea = null;      // für area-Modus: {x,y,w,h}
        this.triggered = false;
        this.stopped = false;
        this.maxRange = null;
        this.disguised = disguised || false;
        this.type = 'shootingSpike';
    }
    checkTrigger(player) {
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const prevPx = (player.prevX ?? player.x) + player.w / 2;
        const prevPy = (player.prevY ?? player.y) + player.h / 2;
        switch (this.triggerMode) {
            case 'x':
                return (prevPx <= this.triggerX && px > this.triggerX) ||
                    (prevPx >= this.triggerX && px < this.triggerX);
            case 'y':
                return (prevPy <= this.triggerY && py > this.triggerY) ||
                    (prevPy >= this.triggerY && py < this.triggerY);
            case 'proximity': {
                const dx = px - (this.x + this.w/2);
                const dy = py - (this.y + this.h/2);
                return Math.sqrt(dx*dx + dy*dy) < this.triggerDist;
            }
            case 'area': {
                const a = this.triggerArea;
                return a && px >= a.x && px <= a.x+a.w && py >= a.y && py <= a.y+a.h;
            }
        }
        return false;
    }
    update(player) {
        if (!this.triggered && player.alive) {
            if (this.checkTrigger(player)) this.triggered = true;
        }
        if (this.triggered && !this.stopped) {
            const d = this.dir;
            if (d === 'right' || d === 1)  this.x += this.speed;
            else if (d === 'left' || d === -1) this.x -= this.speed;
            else if (d === 'up')    this.y -= this.speed;
            else if (d === 'down')  this.y += this.speed;
            if (Number.isFinite(this.maxRange) && this.maxRange > 0) {
                const limit = Math.max(0, this.maxRange);
                const sDir = (d === 'right' || d === 1) ? 'right' : (d === 'up') ? 'up' : (d === 'down') ? 'down' : 'left';
                if (sDir === 'right' && this.x >= this.origX + limit) { this.x = this.origX + limit; this.stopped = true; }
                else if (sDir === 'left' && this.x <= this.origX - limit) { this.x = this.origX - limit; this.stopped = true; }
                else if (sDir === 'up' && this.y <= this.origY - limit) { this.y = this.origY - limit; this.stopped = true; }
                else if (sDir === 'down' && this.y >= this.origY + limit) { this.y = this.origY + limit; this.stopped = true; }
            }
        }
        if (this.triggered && player.alive) {
            if (aabb(player, { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: this.h - 4 })) {
                player.die();
            }
        }
    }
    draw() {
        if (!this.disguised && !this.triggered) return;  // Versteckt: unsichtbar bis Trigger

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        const d = this.dir;
        const sDir = (d === 'right' || d === 1) ? 'right' : (d === 'up') ? 'up' : (d === 'down') ? 'down' : 'left';

        if (sDir === 'right') {
            ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.w, this.y + this.h/2); ctx.lineTo(this.x, this.y + this.h);
        } else if (sDir === 'left') {
            ctx.moveTo(this.x + this.w, this.y); ctx.lineTo(this.x, this.y + this.h/2); ctx.lineTo(this.x + this.w, this.y + this.h);
        } else if (sDir === 'up') {
            ctx.moveTo(this.x, this.y + this.h); ctx.lineTo(this.x + this.w/2, this.y); ctx.lineTo(this.x + this.w, this.y + this.h);
        } else {
            ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.w/2, this.y + this.h); ctx.lineTo(this.x + this.w, this.y);
        }
        ctx.closePath();
        ctx.fill();
    }
    reset() {
        this.x = this.origX;
        this.y = this.origY;
        this.triggered = false;
        this.stopped = false;
    }
}

class CrushingBlock {
    constructor(x, y, w, h, triggerX) {
        this.x = x; this.origY = y; this.y = y;
        this.w = w; this.h = h || 40;
        this.triggerX = triggerX;
        this.state = 'idle';
        this.vy = 0;
        this.groundY = 0;
        this.waitTimer = 0;
        this.type = 'crushingBlock';
        this.solid = true;
    }
    update(player) {
        if (this.state === 'idle' && player.alive) {
            if (Math.abs(player.x + player.w / 2 - this.triggerX) < 50) this.state = 'falling';
        }
        if (this.state === 'falling') {
            this.vy += 1.2;
            this.y += this.vy;
            if (this.y + this.h >= this.groundY) {
                this.y = this.groundY - this.h;
                this.vy = 0;
                this.state = 'waiting';
                this.waitTimer = 60;
                triggerShake(4);
            }
        }
        if (this.state === 'waiting') {
            this.waitTimer--;
            if (this.waitTimer <= 0) this.state = 'rising';
        }
        if (this.state === 'rising') {
            this.y -= 1;
            if (this.y <= this.origY) {
                this.y = this.origY;
                this.state = 'idle';
            }
        }
        if ((this.state === 'falling' || this.state === 'waiting') && player.alive) {
            if (aabb(player, this)) player.die();
        }
    }
    draw() {
        rect(this.x, this.y, this.w, this.h, '#888');
        rect(this.x, this.y + this.h - 4, this.w, 4, '#666');
        ctx.fillStyle = '#ff6b6b';
        for (let i = 0; i < this.w; i += 16) {
            ctx.fillRect(this.x + i, this.y + this.h - 4, 8, 4);
        }
    }
    reset() {
        this.y = this.origY;
        this.state = 'idle';
        this.vy = 0;
        this.waitTimer = 0;
    }
}

class MovingSpike {
    constructor(x, y, x2, y2, speed) {
        this.x1 = x; this.y1 = y;
        this.x2 = x2; this.y2 = y2;
        this.x = x; this.y = y;
        this.w = 16; this.h = 16;
        this.speed = speed || 0.01;
        this.t = 0;
        this.dir = 1;
        this.type = 'movingSpike';
    }
    update(player) {
        this.t += this.speed * this.dir;
        if (this.t >= 1) { this.t = 1; this.dir = -1; }
        if (this.t <= 0) { this.t = 0; this.dir = 1; }
        this.x = lerp(this.x1, this.x2, this.t);
        this.y = lerp(this.y1, this.y2, this.t);
        if (player.alive && aabb(player, { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: this.h - 4 })) {
            player.die();
        }
    }
    draw() {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.h);
        ctx.lineTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.closePath();
        ctx.fill();
    }
    reset() {
        this.t = 0;
        this.dir = 1;
        this.x = this.x1;
        this.y = this.y1;
    }
}

// ── NEW TRAPS ───────────────────────────────────────────────

// Unsichtbare Plattform — von Anfang an solid, aber nie sichtbar
class HiddenPlatform {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = true;
        this.type = 'hiddenPlatform';
    }
    update() {}
    draw() {}
    reset() {}
}

// Reveal Platform — erscheint erst, wenn der Spieler die Reveal-Area betritt
class RevealPlatform {
    constructor(x, y, w, h, triggerArea) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = false;
        this.visible = false;
        this.triggerArea = triggerArea; // {x, y, w, h}
        this.alpha = 0;
        this.type = 'revealPlatform';
    }
    update(player) {
        if (!this.visible && player.alive && this.triggerArea) {
            const px = player.x + player.w / 2;
            const py = player.y + player.h / 2;
            if (px > this.triggerArea.x && px < this.triggerArea.x + this.triggerArea.w &&
                py > this.triggerArea.y && py < this.triggerArea.y + this.triggerArea.h) {
                this.visible = true;
                this.solid = true;
            }
        }
        if (this.visible && this.alpha < 1) {
            this.alpha = Math.min(1, this.alpha + 0.08);
        }
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        drawPlatform({ x:this.x, y:this.y, w:this.w, h:this.h, skin:this.skin || 'ghost' });
        ctx.globalAlpha = 1;
    }
    reset() {
        this.visible = false;
        this.solid = false;
        this.alpha = 0;
    }
}

// Moving Platform — bewegt sich zum Zielpunkt sobald Spieler draufsteht
// Carriert den Spieler mit
class MovingPlatform {
    constructor(x, y, w, h, targetX, targetY, speed, disappearAt) {
        this.origX = x; this.x = x;
        this.origY = y; this.y = y;
        this.w = w; this.h = h || 15;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed || 0.8;
        this.disappearAt = disappearAt;  // x-Position wo die Platform verschwindet
        this.triggered = false;
        this.solid = true;
        this.type = 'movingPlatform';
    }
    update(player) {
        if (!this.triggered && player.alive && player.grounded &&
            player.x + player.w > this.x && player.x < this.x + this.w &&
            Math.abs((player.y + player.h) - this.y) < 3) {
            this.triggered = true;
        }
        if (this.triggered) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.speed) {
                const moveX = (dx / dist) * this.speed;
                const moveY = (dy / dist) * this.speed;
                this.x += moveX;
                this.y += moveY;
                // Spieler mittragen wenn er auf der Platform steht
                if (player.alive &&
                    player.x + player.w > this.x - 2 && player.x < this.x + this.w + 2 &&
                    Math.abs((player.y + player.h) - this.y) < 6) {
                    player.x += moveX;
                    player.y += moveY;
                }
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
            }
            // Platform verschwindet bei disappearAt (x-Position)
            if (this.disappearAt !== undefined && this.x <= this.disappearAt) {
                this.solid = false;
            }
        }
    }
    draw() {
        if (!this.solid) return;
        drawPlatform({ x:this.x, y:this.y, w:this.w, h:this.h, skin:this.skin || 'moving', material:this.material });
    }
    reset() {
        this.x = this.origX;
        this.y = this.origY;
        this.triggered = false;
        this.solid = true;
    }
}

// Fake Exit — sieht aus wie echte Tür, tötet bei Berührung
// Optional: showAboveY — erscheint erst wenn Spieler hoch genug ist
class FakeExit {
    constructor(x, y, showAboveY) {
        this.x = x; this.y = y;
        this.w = 30; this.h = 40;
        this.showAboveY = Number.isFinite(showAboveY) ? showAboveY : undefined;
        this.skin = 'exit';
        this.type = 'fakeExit';
        this.triggered = false;
        this.visible = false;
    }
    update(player) {
        this.visible = !Number.isFinite(this.showAboveY) || player.y < this.showAboveY;
        if (!this.triggered && this.visible && player.alive) {
            if (aabb(player, this)) {
                this.triggered = true;
                spawnParticles(this.x + this.w / 2, this.y + this.h / 2, 20, '#e74c3c');
                player.die();
            }
        }
    }
    draw() {
        if (this.triggered || !this.visible) return;
        drawExit(this);
    }
    reset() {
        this.triggered = false;
    }
}

// Troll-Shaker — wackelt wie FallingFloor, fällt aber NIE
// Konditioniert den Spieler: "Wackeln = harmlos"
class TrollShaker {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = true;
        this.shaking = false;
        this.shakeTimer = 0;
        this.type = 'trollShaker';
    }
    update(player) {
        if (player.alive && player.grounded &&
            player.x + player.w > this.x && player.x < this.x + this.w &&
            Math.abs((player.y + player.h) - this.y) < 3) {
            this.shaking = true;
            this.shakeTimer = 30;
        }
        if (this.shaking) {
            this.shakeTimer--;
            if (this.shakeTimer <= 0) this.shaking = false;
        }
    }
    draw() {
        let dx = 0;
        if (this.shaking) dx = rand(-2, 2);
        rect(this.x + dx, this.y, this.w, this.h, '#d0d0d0');
        rect(this.x + dx, this.y, this.w, 3, '#e8e8e8');
    }
    reset() {
        this.shaking = false;
        this.shakeTimer = 0;
    }
}

// Trigger-Floor — sieht aus wie Boden, bricht weg wenn Spieler X-Position passiert
// (nicht beim Draufstehen, sondern bei bestimmter Position im Level)
class TriggerFloor {
    constructor(x, y, w, h, triggerX) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.origY = y;
        this.solid = true;
        this.triggerX = triggerX;
        this.triggered = false;
        this.shakeTimer = 0;
        this.falling = false;
        this.vy = 0;
        this.type = 'triggerFloor';
    }
    update(player) {
        if (!this.triggered && this.solid && player.alive) {
            if (player.x + player.w / 2 > this.triggerX) {
                this.triggered = true;
                this.shakeTimer = 25;
            }
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
    }
    draw() {
        if (this.y > H + 50) return;
        let dx = 0;
        if (this.triggered && !this.falling) dx = rand(-2, 2);
        rect(this.x + dx, this.y, this.w, this.h, '#d0d0d0');
        rect(this.x + dx, this.y, this.w, 3, '#e8e8e8');
    }
    reset() {
        this.y = this.origY;
        this.solid = true;
        this.triggered = false;
        this.shakeTimer = 0;
        this.falling = false;
        this.vy = 0;
    }
}

// Rising Death — rote Todeszone steigt von unten hoch
class RisingDeath {
    constructor(speed, startDelay, startY) {
        this.startY = startY !== undefined ? startY : H + 20;
        this.y = this.startY;
        this.startDelay = startDelay || 120;  // ~2 Sekunden bevor es losgeht
        this.timer = 0;
        this.speed = speed || 0.3;
        this.type = 'risingDeath';
        this.drawPriority = 100;
    }
    update(player) {
        this.timer++;
        if (this.timer < this.startDelay) return;
        this.y -= this.speed;
        if (player.alive && player.y + player.h > this.y) {
            player.die();
        }
    }
    draw() {
        const lvlH = (game.levelData && game.levelData.height) || H;
        // Todes-Zone
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-500, this.y, 2000, lvlH + 200);
        // Glühende Oberkante
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-500, this.y - 2, 2000, 4);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(-500, this.y - 6, 2000, 6);
        ctx.globalAlpha = 1;
    }
    reset() {
        this.y = this.startY;
        this.timer = 0;
    }
}

// Chasing Wall — rote Todeswand jagt von links nach rechts
class ChasingWall {
    constructor(speed, startDelay) {
        this.x = -50;
        this.speed = speed || 0.7;
        this.startDelay = startDelay || 90;
        this.timer = 0;
        this.type = 'chasingWall';
        this.drawPriority = 100;
    }
    update(player) {
        this.timer++;
        if (this.timer < this.startDelay) return;
        this.x += this.speed;
        if (player.alive && player.x < this.x) {
            player.die();
        }
    }
    draw() {
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x - 1500, 0, 1500, H);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x - 2, 0, 4, H);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, 0, 8, H);
        ctx.globalAlpha = 1;
    }
    reset() {
        this.x = -50;
        this.timer = 0;
    }
}

// Invert Zone — unsichtbare Trigger-Zone die Steuerung umkehrt
// Flippt Controls wenn Spieler die X-Position passiert
class InvertTriggerLine {
    constructor(triggerX) {
        this.triggerX = triggerX;
        this.triggered = false;
        this.type = 'invertTriggerLine';
    }
    update(player) {
        if (!this.triggered && player.alive && player.x > this.triggerX) {
            this.triggered = true;
            game.levelData.invertControls = !game.levelData.invertControls;
            SFX.invertFlip();
        }
    }
    draw() {} // komplett unsichtbar!
    reset() {
        this.triggered = false;
        if (game.levelData) game.levelData.invertControls = false;
    }
}

class InvertZone {
    constructor(x, y, w, h) {
        // KompatibilitÃ¤t: alte Levels nutzen InvertZone(triggerX) als Linie.
        if (y === undefined && w === undefined && h === undefined) {
            this.triggerX = x;
            this.triggered = false;
            this.mode = 'line';
        } else {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.entryPadding = 24;
            this.mode = 'zone';
        }
        this.type = 'invertZone';
    }
    getActiveRect() {
        if (this.mode !== 'zone') return null;
        const pad = Math.max(0, Math.min(this.entryPadding || 0, Math.max(0, this.w / 2 - 5)));
        return {
            x: this.x + pad,
            y: this.y,
            w: Math.max(10, this.w - pad * 2),
            h: this.h,
        };
    }
    contains(player) {
        if (this.mode !== 'zone') return false;
        return aabb(player, this.getActiveRect());
    }
    update(player) {
        if (this.mode === 'line' && !this.triggered && player.alive && player.x > this.triggerX) {
            this.triggered = true;
            game.levelData.invertControls = !game.levelData.invertControls;
            SFX.invertFlip();
        }
    }
    draw() {}
    reset() {
        if (this.mode === 'line') {
            this.triggered = false;
            if (game.levelData) game.levelData.invertControls = false;
        }
    }
}

// Fake Spikes — sehen aus wie echte Spikes, töten aber NICHT
class FakeSpikes {
    constructor(spikeList) {
        this.spikes = spikeList; // [{x, y, w, h, dir}]
        this.type = 'fakeSpikes';
    }
    update() {}
    draw() {
        for (const s of this.spikes) {
            drawSpike({
                x: s.x,
                y: s.y,
                w: s.w || 20,
                h: s.h || 20,
                dir: s.dir || 'up',
            });
        }
    }
    reset() {}
}

// === NEUE TRAPS FÜR LEVEL 11-15 ===

// Darkness Overlay — Level ist dunkel, nur Umkreis um Spieler sichtbar
function drawDarknessAroundPlayer(player, radius) {
    if (!player) return;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, radius * 1.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(-2000, -500, 5000, 2500);
}

class DarknessOverlay {
    constructor(radius) {
        this.radius = radius || 95;
        this.type = 'darknessOverlay';
    }
    update() {}
    draw() {
        const player = game.player;
        const levelData = game?.levelData;
        if (!player) return;
        if (levelData && levelData.currentDarknessEnabled === false) return;
        const radius = Number.isFinite(levelData?.currentDarknessRadius) ? levelData.currentDarknessRadius : this.radius;
        drawDarknessAroundPlayer(player, radius);
    }
    reset() {}
}

// Wind Zone — schiebt den Spieler in eine Richtung (horizontal + vertikal)
class WindZone {
    constructor(x, y, w, h, force, forceY) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.force = force;         // + = rechts, - = links
        this.forceY = forceY || 0;  // + = unten, - = oben (Updraft)
        this.type = 'windZone';
    }
    update(player) {
        const fx = this.force ?? this.vx ?? 0;
        const fy = this.forceY ?? this.vy ?? 0;
        if (player.alive && aabb(player, this)) {
            player.extVx += fx;
            player.extVy += fy;
        }
    }
    draw() {
        const fx = this.force ?? this.vx ?? 0;
        const fy = this.forceY ?? this.vy ?? 0;
        ctx.globalAlpha = 0.1;
        // Grün für Updraft, Blau für horizontal, Orange für Downdraft
        ctx.fillStyle = fy < 0 ? '#a0f0a0' : (fy > 0 ? '#f0b080' : '#87ceeb');
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Richtungsvektor aus force/forceY berechnen
        const mag = Math.sqrt(fx * fx + fy * fy);
        if (mag === 0) { ctx.globalAlpha = 1; return; }
        const dx = fx / mag;
        const dy = fy / mag;

        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        const lineLen = 14;
        const grid = 26;
        const frame = typeof game.frameCount === 'number' ? game.frameCount : 0;
        const offset = (frame * 1.5) % grid;

        // Grid aus Linien die in Wind-Richtung zeigen
        for (let row = -1; row < Math.ceil(this.h / grid) + 1; row++) {
            for (let col = -1; col < Math.ceil(this.w / grid) + 1; col++) {
                const sx = this.x + col * grid + 8 + dx * offset;
                const sy = this.y + row * grid + 8 + dy * offset;
                const ex = sx + dx * lineLen;
                const ey = sy + dy * lineLen;
                if (sx >= this.x + 3 && ex <= this.x + this.w - 3 &&
                    sy >= this.y + 3 && ey <= this.y + this.h - 3) {
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
    }
    reset() {}
}

class DoubleJumpZone {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w || 140;
        this.h = h || 100;
        this.type = 'doubleJumpZone';
    }
    contains(player) {
        if (!player) return false;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
    }
    update() {}
    draw() {}
    reset() {}
}

// Camera Trigger - schaltet Kamera-Verhalten um, sobald der Spieler den Bereich betritt
function playerOverlapsRect(player, rect) {
    if (!player || !rect) return false;
    return player.x < rect.x + rect.w &&
        player.x + player.w > rect.x &&
        player.y < rect.y + rect.h &&
        player.y + player.h > rect.y;
}

function isSameCameraRoomState(a, b) {
    return !!a && !!b &&
        a.x === b.x &&
        a.y === b.y &&
        a.w === b.w &&
        a.h === b.h &&
        (a.fitMode || 'native') === (b.fitMode || 'native');
}

function applyCameraTriggerState(levelData, trigger, player) {
    if (!levelData || !trigger) return;
    trigger.triggered = true;
    levelData.currentCameraTrigger = trigger;
    levelData.currentCameraRoom = null;
    resetDynamicWorldState(levelData);
    if (player) player.gDir = levelData.currentGravityDir;
    levelData.currentVerticalScroll = !!trigger.verticalScroll;
    if (Number.isFinite(trigger.cameraAnchorX)) levelData.currentCameraAnchorX = Math.max(0, Math.min(1, trigger.cameraAnchorX));
    if (Number.isFinite(trigger.cameraAnchorY)) levelData.currentCameraAnchorY = Math.max(0, Math.min(1, trigger.cameraAnchorY));
    levelData.currentCameraMinX = Number.isFinite(trigger.cameraMinX) ? Math.max(0, trigger.cameraMinX) : 0;
    levelData.currentCameraLerp = Number.isFinite(trigger.cameraTransitionSpeed) ? Math.max(0.01, Math.min(1, trigger.cameraTransitionSpeed)) : 0.08;
}

function applyCameraRoomState(levelData, roomSource, player) {
    if (!levelData || !roomSource) return;
    levelData.currentCameraTrigger = null;
    levelData.currentCameraRoom = {
        x: roomSource.x,
        y: roomSource.y,
        w: roomSource.w,
        h: roomSource.h,
        fitMode: roomSource.fitMode || 'native',
    };
    levelData.currentVerticalScroll = false;
    applyDynamicWorldOverrides(levelData, roomSource);
    if (player) player.gDir = levelData.currentGravityDir;
}

function initializeCameraZonesForPlayer(levelData, player) {
    if (!levelData || !player || !Array.isArray(levelData.traps)) return;
    let activeTrigger = null;
    let activeRoom = null;
    for (const trap of levelData.traps) {
        if (trap?.type === 'cameraTrigger' && playerOverlapsRect(player, trap)) {
            activeTrigger = trap;
        } else if (trap?.type === 'cameraRoom' && playerOverlapsRect(player, trap)) {
            activeRoom = trap;
        }
    }
    if (activeTrigger) {
        applyCameraTriggerState(levelData, activeTrigger, player);
    } else if (activeRoom) {
        applyCameraRoomState(levelData, activeRoom, player);
    }
}

class CameraTrigger {
    constructor(x, y, w, h, verticalScroll, cameraAnchorX, cameraAnchorY) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.verticalScroll = verticalScroll !== undefined ? !!verticalScroll : true;
        this.cameraAnchorX = Number.isFinite(cameraAnchorX) ? Math.max(0, Math.min(1, cameraAnchorX)) : undefined;
        this.cameraAnchorY = Number.isFinite(cameraAnchorY) ? Math.max(0, Math.min(1, cameraAnchorY)) : undefined;
        this.cameraMinX = undefined;
        this.cameraTransitionSpeed = undefined;
        this.triggered = false;
        this.type = 'cameraTrigger';
    }
    update(player) {
        if (!player.alive || !game.levelData) return;
        const overlaps = playerOverlapsRect(player, this);
        if (!overlaps) {
            if (game.levelData.currentCameraTrigger === this) game.levelData.currentCameraTrigger = null;
            this.triggered = false;
            return;
        }
        applyCameraTriggerState(game.levelData, this, player);
    }
    draw() {}
    reset() {
        this.triggered = false;
    }
}

class ActionTrigger {
    constructor(x, y, w, h, actions) {
        this.x = x; this.y = y;
        this.w = Number.isFinite(w) ? w : 140;
        this.h = Number.isFinite(h) ? h : 100;
        this.actions = Array.isArray(actions) ? JSON.parse(JSON.stringify(actions)) : [];
        this.mode = 'once';
        this.triggered = false;
        this.completed = false;
        this.active = false;
        this.inside = false;
        this.runDirection = 'forward';
        this.currentActionIndex = 0;
        this.activeContexts = [];
        this.baselineMap = new Map();
        this.type = 'actionTrigger';
    }
    getActionTargetBaseline(target) {
        if (!target) return null;
        if (!this.baselineMap.has(target)) this.baselineMap.set(target, captureElementRectState(target));
        return this.baselineMap.get(target);
    }
    restoreBaselineTargets() {
        if (!(this.baselineMap instanceof Map) || this.baselineMap.size === 0) return;
        this.baselineMap.forEach((baseline, target) => {
            restoreActionTargetState(target, baseline);
        });
    }
    startRun(direction = 'forward') {
        this.triggered = true;
        this.runDirection = direction === 'reverse' ? 'reverse' : 'forward';
        this.currentActionIndex = 0;
        this.activeContexts = [];
        if (this.runDirection === 'forward') this.completed = false;
    }
    finishRun() {
        if (this.runDirection === 'forward') {
            this.active = true;
            if (this.mode === 'once') this.completed = true;
        } else {
            this.active = false;
        }
        this.triggered = false;
        this.activeContexts = [];
        this.currentActionIndex = 0;
        if (this.mode === 'repeat' && this.inside) {
            this.startRun(this.runDirection === 'forward' ? 'reverse' : 'forward');
        }
    }
    update(player) {
        if (!game?.levelData) return;
        const overlaps = !!(player?.alive && aabb(player, this));
        const entered = overlaps && !this.inside;
        const exited = !overlaps && this.inside;
        this.inside = overlaps;

        if (this.mode === 'once') {
            if (entered && !this.completed && !this.triggered) this.startRun('forward');
        } else if (this.mode === 'toggle') {
            if (entered && !this.triggered) this.startRun(this.active ? 'reverse' : 'forward');
        } else if (this.mode === 'enterLeave' || this.mode === 'whileInside') {
            if (entered) {
                if (this.triggered && this.runDirection === 'reverse') this.startRun('forward');
                else if (!this.triggered && !this.active) this.startRun('forward');
            }
            if (exited) {
                if (this.triggered && this.runDirection === 'forward') this.startRun('reverse');
                else if (!this.triggered && this.active) this.startRun('reverse');
            }
        } else if (this.mode === 'repeat') {
            if (entered && !this.triggered && !this.active) this.startRun('forward');
            if (exited && this.triggered && this.runDirection === 'forward') this.startRun('reverse');
            else if (exited && !this.triggered && this.active) this.startRun('reverse');
        }

        if (!this.triggered) return;

        // 1. Advance all currently running contexts (parallel or otherwise)
        if (!Array.isArray(this.activeContexts)) this.activeContexts = [];
        for (let i = this.activeContexts.length - 1; i >= 0; i--) {
            const done = this.updateActiveContext(this.activeContexts[i], player);
            if (done) this.activeContexts.splice(i, 1);
        }

        // 2. Start as many new steps as allowed (sequential waits for empty queue, parallel fires immediately)
        let safety = 256;
        while (this.currentActionIndex < this.actions.length && safety-- > 0) {
            const action = this.actions[this.currentActionIndex];
            const startMode = action?.startMode === 'parallel' ? 'parallel' : 'sequential';
            if (startMode !== 'parallel' && this.activeContexts.length > 0) break;
            const ctx = this.startActionStep(action, player);
            this.currentActionIndex++;
            if (ctx) this.activeContexts.push(ctx);
        }

        // 3. All done?
        if (this.activeContexts.length === 0 && this.currentActionIndex >= this.actions.length) {
            this.finishRun();
        }
    }
    startActionStep(action, player) {
        if (!action || !action.type || action.type === 'none') return null;

        if (action.type === 'wait') {
            return {
                kind: 'wait',
                duration: Math.max(1, Math.round(action.duration ?? 20)),
                frame: 0,
            };
        }

        if (action.type === 'transform') {
            const target = findLevelElementByDevId(game.levelData, action.targetId);
            if (!target) return null;
            const linkedMembers = getLinkedActionGroupMembers(game.levelData, target);
            const targetBaseline = this.getActionTargetBaseline(target);
            linkedMembers.forEach(member => this.getActionTargetBaseline(member));
            return {
                kind: 'transform',
                action,
                target,
                linkedMembers,
                duration: Math.max(1, Math.round(action.duration ?? 20)),
                frame: 0,
                from: captureElementRectState(target),
                baseline: targetBaseline,
                linkedFrom: linkedMembers.map(member => ({ ref: member, from: captureElementRectState(member) })),
            };
        }

        if (action.type === 'move') {
            const target = findLevelElementByDevId(game.levelData, action.targetId);
            if (!target) return null;
            const linkedMembers = getLinkedActionGroupMembers(game.levelData, target);
            const targetBaseline = this.getActionTargetBaseline(target);
            linkedMembers.forEach(member => this.getActionTargetBaseline(member));
            const from = captureElementRectState(target);
            const reverse = this.runDirection === 'reverse';
            const toX = reverse
                ? (Number.isFinite(action.x) ? targetBaseline?.x : from.x)
                : (Number.isFinite(action.x) ? action.x : from.x);
            const toY = reverse
                ? (Number.isFinite(action.y) ? targetBaseline?.y : from.y)
                : (Number.isFinite(action.y) ? action.y : from.y);
            const speed = Math.max(0.1, Number.isFinite(+action.speed) ? +action.speed : 4);
            const distance = Math.hypot((toX ?? from.x ?? 0) - (from.x ?? 0), (toY ?? from.y ?? 0) - (from.y ?? 0));
            const duration = Math.max(1, Math.round(distance / speed));
            return {
                kind: 'move',
                target,
                linkedMembers,
                duration,
                frame: 0,
                from,
                toX,
                toY,
                linkedFrom: linkedMembers.map(member => ({ ref: member, from: captureElementRectState(member) })),
            };
        }

        if (action.type === 'showHide' || action.type === 'enableDisable' || action.type === 'setSolid') {
            const target = findLevelElementByDevId(game.levelData, action.targetId);
            if (!target) return null;
            const linkedMembers = getLinkedActionGroupMembers(game.levelData, target);
            const allTargets = [target, ...linkedMembers];
            allTargets.forEach(t => this.getActionTargetBaseline(t));
            const reverse = this.runDirection === 'reverse';
            for (const t of allTargets) {
                const baseline = this.baselineMap.get(t);
                if (action.type === 'showHide') {
                    if (reverse) {
                        if (baseline?.actionHidden === undefined) delete t.actionHidden;
                        else t.actionHidden = !!baseline.actionHidden;
                    } else {
                        t.actionHidden = (action.visibility || 'show') === 'hide';
                    }
                } else if (action.type === 'enableDisable') {
                    if (reverse) {
                        if (baseline?.actionDisabled === undefined) delete t.actionDisabled;
                        else t.actionDisabled = !!baseline.actionDisabled;
                    } else {
                        t.actionDisabled = (action.enabledState || 'enable') === 'disable';
                    }
                } else {
                    if (reverse) {
                        if (baseline?.actionSolid === undefined) delete t.actionSolid;
                        else t.actionSolid = !!baseline.actionSolid;
                    } else {
                        t.actionSolid = (action.solidState || 'solid') === 'solid';
                    }
                }
            }
            return null; // instant
        }

        return null;
    }
    updateActiveContext(ctx, player) {
        if (!ctx) return true;

        if (ctx.kind === 'wait') {
            ctx.frame++;
            return ctx.frame >= ctx.duration;
        }

        if (ctx.kind === 'transform') {
            ctx.frame++;
            const progress = Math.min(1, ctx.frame / ctx.duration);
            const target = ctx.target;
            const action = ctx.action;
            const prevState = captureElementRectState(target);
            const reverse = this.runDirection === 'reverse';
            const toState = reverse
                ? {
                    x: Number.isFinite(action.x) ? ctx.baseline?.x : ctx.from.x,
                    y: Number.isFinite(action.y) ? ctx.baseline?.y : ctx.from.y,
                    w: Number.isFinite(action.w) ? ctx.baseline?.w : ctx.from.w,
                    h: Number.isFinite(action.h) ? ctx.baseline?.h : ctx.from.h,
                }
                : {
                    x: Number.isFinite(action.x) ? action.x : ctx.from.x,
                    y: Number.isFinite(action.y) ? action.y : ctx.from.y,
                    w: Number.isFinite(action.w) ? action.w : ctx.from.w,
                    h: Number.isFinite(action.h) ? action.h : ctx.from.h,
                };
            applyActionTransformStep(target, toState, progress, ctx.from);
            const dx = (target.x ?? prevState.x ?? 0) - (prevState.x ?? target.x ?? 0);
            const dy = (target.y ?? prevState.y ?? 0) - (prevState.y ?? target.y ?? 0);
            if ((dx !== 0 || dy !== 0) && Array.isArray(ctx.linkedFrom)) {
                ctx.linkedFrom.forEach(entry => {
                    if (!entry?.ref || entry.ref === target) return;
                    if (Number.isFinite(entry.from.x)) entry.ref.x = entry.from.x + ((target.x ?? 0) - (ctx.from.x ?? 0));
                    if (Number.isFinite(entry.from.y)) entry.ref.y = entry.from.y + ((target.y ?? 0) - (ctx.from.y ?? 0));
                });
            }
            return progress >= 1;
        }

        if (ctx.kind === 'move') {
            ctx.frame++;
            const progress = Math.min(1, ctx.frame / ctx.duration);
            const target = ctx.target;
            const prevState = captureElementRectState(target);
            applyActionTransformStep(target, { x: ctx.toX, y: ctx.toY }, progress, ctx.from);
            const dx = (target.x ?? prevState.x ?? 0) - (prevState.x ?? target.x ?? 0);
            const dy = (target.y ?? prevState.y ?? 0) - (prevState.y ?? target.y ?? 0);
            if ((dx !== 0 || dy !== 0) && Array.isArray(ctx.linkedFrom)) {
                ctx.linkedFrom.forEach(entry => {
                    if (!entry?.ref || entry.ref === target) return;
                    if (Number.isFinite(entry.from.x)) entry.ref.x = entry.from.x + ((target.x ?? 0) - (ctx.from.x ?? 0));
                    if (Number.isFinite(entry.from.y)) entry.ref.y = entry.from.y + ((target.y ?? 0) - (ctx.from.y ?? 0));
                });
            }
            applyActionMovePlayerInteraction(player, target, dx, dy, ctx.linkedMembers, game?.levelData);
            return progress >= 1;
        }

        return true;
    }
    draw() {}
    reset() {
        this.restoreBaselineTargets();
        this.mode = this.mode || 'once';
        this.triggered = false;
        this.completed = false;
        this.active = false;
        this.inside = false;
        this.runDirection = 'forward';
        this.currentActionIndex = 0;
        this.activeContexts = [];
        this.baselineMap = new Map();
    }
}

// Camera Room - fester sichtbarer Bildschirmbereich von 800x500
class CameraRoom {
    constructor(x, y, w, h, fitMode) {
        this.x = x;
        this.y = y;
        this.w = Number.isFinite(w) ? w : 800;
        this.h = Number.isFinite(h) ? h : 500;
        this.fitMode = fitMode || 'native';
        this.gravityDir = undefined;
        this.jumpFlipsGravity = undefined;
        this.doubleJumpMode = 'inherit';
        this.darknessMode = 'inherit';
        this.darknessRadius = undefined;
        this.type = 'cameraRoom';
    }
    update(player) {
        if (!player.alive || !game.levelData) return;
        if (game.levelData.currentCameraTrigger) return;
        const room = game.levelData.currentCameraRoom;
        const roomState = { x: this.x, y: this.y, w: this.w, h: this.h, fitMode: this.fitMode || 'native' };
        const overlaps = playerOverlapsRect(player, this);
        if (isSameCameraRoomState(room, roomState) && !overlaps) {
            game.levelData.currentCameraRoom = null;
            game.levelData.currentVerticalScroll = !!game.levelData.verticalScroll;
            game.levelData.currentCameraAnchorX = Number.isFinite(game.levelData.cameraAnchorX) ? Math.max(0, Math.min(1, game.levelData.cameraAnchorX)) : 0.5;
            game.levelData.currentCameraAnchorY = Number.isFinite(game.levelData.cameraAnchorY) ? Math.max(0, Math.min(1, game.levelData.cameraAnchorY)) : 0.5;
            game.levelData.currentCameraMinX = game.levelData.cameraMinX || 0;
            game.levelData.currentCameraLerp = 0.08;
            resetDynamicWorldState(game.levelData);
            if (player) player.gDir = game.levelData.currentGravityDir;
            return;
        }
        if (!overlaps) return;
        if (!isSameCameraRoomState(room, roomState)) {
            applyCameraRoomState(game.levelData, this, player);
        }
    }
    draw() {}
    reset() {}
}

function resetDynamicWorldState(levelData) {
    if (!levelData) return;
    levelData.currentGravityDir = Number.isFinite(levelData.gravityDir) ? (levelData.gravityDir >= 0 ? 1 : -1) : 1;
    levelData.currentJumpFlipsGravity = !!levelData.jumpFlipsGravity;
    levelData.currentDoubleJumpEnabled = !!levelData.doubleJump;
    levelData.currentDarknessEnabled = !!(levelData.traps && levelData.traps.some(t => t.type === 'darknessOverlay'));
    levelData.currentDarknessRadius = undefined;
}

function applyDynamicWorldOverrides(levelData, source) {
    if (!levelData) return;
    resetDynamicWorldState(levelData);
    if (!source) return;
    if (Number.isFinite(source.gravityDir)) levelData.currentGravityDir = source.gravityDir >= 0 ? 1 : -1;
    if (typeof source.jumpFlipsGravity === 'boolean') levelData.currentJumpFlipsGravity = !!source.jumpFlipsGravity;
    const djMode = source.doubleJumpMode || 'inherit';
    if (djMode === 'on') levelData.currentDoubleJumpEnabled = true;
    else if (djMode === 'off') levelData.currentDoubleJumpEnabled = false;
    const mode = source.darknessMode || 'inherit';
    if (mode === 'off') {
        levelData.currentDarknessEnabled = false;
        levelData.currentDarknessRadius = undefined;
    } else if (mode === 'on') {
        levelData.currentDarknessEnabled = true;
        if (Number.isFinite(source.darknessRadius) && source.darknessRadius > 0) {
            levelData.currentDarknessRadius = source.darknessRadius;
        }
    }
}

function getDefaultShadowWorlds(levelData) {
    const width = Math.max(1, levelData?.width || W);
    const height = Math.max(1, levelData?.height || H);
    const halfH = Math.round(height / 2);
    return {
        main: { x: 0, y: 0, w: width, h: halfH },
        shadow: { x: 0, y: halfH, w: width, h: height - halfH },
    };
}

function cloneWorldRect(rect, fallback) {
    const base = rect || fallback;
    return {
        x: Number.isFinite(base?.x) ? base.x : fallback.x,
        y: Number.isFinite(base?.y) ? base.y : fallback.y,
        w: Number.isFinite(base?.w) ? base.w : fallback.w,
        h: Number.isFinite(base?.h) ? base.h : fallback.h,
    };
}

function getLevelWorlds(levelData) {
    if (!levelData || levelData.levelType !== 'shadow') return null;
    const fallback = getDefaultShadowWorlds(levelData);
    const worlds = levelData.worlds || {};
    return {
        main: cloneWorldRect(worlds.main, fallback.main),
        shadow: cloneWorldRect(worlds.shadow, fallback.shadow),
    };
}

function getLevelWorldAtPoint(levelData, x, y) {
    const worlds = getLevelWorlds(levelData);
    if (!worlds) return null;
    const inside = rect => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    if (inside(worlds.main)) return 'main';
    if (inside(worlds.shadow)) return 'shadow';
    return null;
}

function getShadowControlWorld(levelData) {
    if (!levelData || levelData.levelType !== 'shadow') return 'main';
    return levelData.currentShadowControlWorld === 'shadow' ? 'shadow' : 'main';
}

function resetShadowWorldState(levelData) {
    if (!levelData) return;
    if (levelData.levelType === 'shadow') levelData.currentShadowControlWorld = 'main';
    else delete levelData.currentShadowControlWorld;
}

function getPlayableWorldMetrics(worldName, worlds, mode, actorW, actorH) {
    const world = worlds[worldName];
    let topPad = 10;
    let bottomPad = 10;
    if (mode === 'verticalFlip') {
        if (worldName === 'main') bottomPad = 30;
        else topPad = 30;
    }
    return {
        world,
        minX: world.x,
        maxX: world.x + world.w - actorW,
        minY: world.y + topPad,
        maxY: world.y + world.h - bottomPad - actorH,
        ceilingY: world.y + topPad,
        floorY: world.y + world.h - bottomPad,
    };
}

function mapShadowActorBetweenWorlds(actorRect, fromWorldName, toWorldName, levelData) {
    const worlds = getLevelWorlds(levelData);
    if (!worlds || !actorRect || !worlds[fromWorldName] || !worlds[toWorldName]) return null;
    const w = actorRect.w ?? 20;
    const h = actorRect.h ?? 20;
    const fromWorld = worlds[fromWorldName];
    const toWorld = worlds[toWorldName];
    const mode = levelData?.shadowMode || 'mirrorHorizontal';
    const localX = Math.max(0, Math.min(fromWorld.w - w, actorRect.x - fromWorld.x));
    const localY = Math.max(0, Math.min(fromWorld.h - h, actorRect.y - fromWorld.y));
    let nextX = toWorld.x + localX;
    let nextY = toWorld.y + localY;

    if (mode === 'mirrorHorizontal') {
        nextX = toWorld.x + Math.max(0, Math.min(toWorld.w - w, toWorld.w - localX - w));
    } else if (mode === 'verticalFlip') {
        const fromMetrics = getPlayableWorldMetrics(fromWorldName, worlds, mode, w, h);
        const toMetrics = getPlayableWorldMetrics(toWorldName, worlds, mode, w, h);
        nextX = toWorld.x + localX;
        if (fromWorldName === 'main' && toWorldName === 'shadow') {
            const actorBottom = Math.max(fromMetrics.minY + h, Math.min(fromMetrics.floorY, actorRect.y + h));
            const distToFloor = Math.max(0, fromMetrics.floorY - actorBottom);
            nextY = Math.max(toMetrics.minY, Math.min(toMetrics.maxY, toMetrics.ceilingY + distToFloor));
        } else if (fromWorldName === 'shadow' && toWorldName === 'main') {
            const actorTop = Math.max(fromMetrics.ceilingY, Math.min(fromMetrics.maxY, actorRect.y));
            const distToCeiling = Math.max(0, actorTop - fromMetrics.ceilingY);
            nextY = Math.max(toMetrics.minY, Math.min(toMetrics.maxY, toMetrics.floorY - distToCeiling - h));
        }
    }

    return { x: nextX, y: nextY, w, h };
}

function swapShadowWorldState(levelData, player) {
    if (!levelData || levelData.levelType !== 'shadow' || !player) return false;
    const fromWorld = getShadowControlWorld(levelData);
    const toWorld = fromWorld === 'shadow' ? 'main' : 'shadow';
    const mapped = mapShadowActorBetweenWorlds(player, fromWorld, toWorld, levelData);
    if (!mapped) return false;
    levelData.currentShadowControlWorld = toWorld;
    player.x = mapped.x;
    player.y = mapped.y;
    player.prevX = mapped.x;
    player.prevY = mapped.y;
    levelData.currentCameraRoom = null;
    levelData.currentVerticalScroll = !!levelData.verticalScroll;
    levelData.currentCameraAnchorX = Number.isFinite(levelData.cameraAnchorX) ? Math.max(0, Math.min(1, levelData.cameraAnchorX)) : 0.5;
    levelData.currentCameraAnchorY = Number.isFinite(levelData.cameraAnchorY) ? Math.max(0, Math.min(1, levelData.cameraAnchorY)) : 0.5;
    applyDynamicWorldOverrides(levelData, null);
    player.gDir = levelData.currentGravityDir;
    if (game) {
        game.pendingCameraSnap = true;
        if (typeof snapCameraToPlayerImmediate === 'function') {
            snapCameraToPlayerImmediate(game, levelData, player);
        }
    }
    return true;
}

function getActiveLevelExit(levelData) {
    if (!levelData) return null;
    if (levelData.levelType === 'shadow' && getShadowControlWorld(levelData) === 'shadow' && levelData.shadowExit) {
        return levelData.shadowExit;
    }
    return levelData.exit || null;
}

class WarpDoor {
    constructor(x, y, targetX, targetY, keepVelocity) {
        this.x = x; this.y = y;
        this.w = 30; this.h = 40;
        this.targetX = targetX;
        this.targetY = targetY;
        this.keepVelocity = !!keepVelocity;
        this.skin = 'warp';
        this.type = 'warpDoor';
    }
    update(player) {
        if (!player.alive || player.warpCooldown > 0) return;
        if (!aabb(player, this)) return;
        if (!Number.isFinite(this.targetX) || !Number.isFinite(this.targetY)) return;
        if (game?.levelData?.levelType === 'shadow') {
            const sourceWorld = getLevelWorldAtPoint(game.levelData, this.x + this.w / 2, this.y + this.h / 2);
            const targetWorld = getLevelWorldAtPoint(game.levelData, this.targetX + player.w / 2, this.targetY + player.h / 2);
            if (sourceWorld && targetWorld && sourceWorld !== targetWorld) return;
        }
        player.x = this.targetX;
        player.y = this.targetY;
        player.prevX = player.x;
        player.prevY = player.y;
        if (!this.keepVelocity) {
            player.vx = 0;
            player.vy = 0;
            player.extVx = 0;
            player.extVy = 0;
        }
        player.warpCooldown = 14;
        if (game) {
            game.pendingCameraSnap = true;
            if (typeof snapCameraToPlayerImmediate === 'function') {
                snapCameraToPlayerImmediate(game, game.levelData, player);
            }
        }
    }
    draw() {
        drawExit(this);
    }
    reset() {}
}

// Warp Zone - teleportiert den Spieler in einen anderen Bereich
class WarpZone {
    constructor(x, y, w, h, targetX, targetY, keepVelocity) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.targetX = targetX;
        this.targetY = targetY;
        this.keepVelocity = !!keepVelocity;
        this.type = 'warpZone';
    }
    update(player) {
        if (!player.alive || player.warpCooldown > 0) return;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        if (px < this.x || px > this.x + this.w || py < this.y || py > this.y + this.h) return;
        if (!Number.isFinite(this.targetX) || !Number.isFinite(this.targetY)) return;
        if (game?.levelData?.levelType === 'shadow') {
            const sourceWorld = getLevelWorldAtPoint(game.levelData, this.x + this.w / 2, this.y + this.h / 2);
            const targetWorld = getLevelWorldAtPoint(game.levelData, this.targetX + player.w / 2, this.targetY + player.h / 2);
            if (sourceWorld && targetWorld && sourceWorld !== targetWorld) return;
        }
        player.x = this.targetX;
        player.y = this.targetY;
        player.prevX = player.x;
        player.prevY = player.y;
        if (!this.keepVelocity) {
            player.vx = 0;
            player.vy = 0;
            player.extVx = 0;
            player.extVy = 0;
        }
        player.warpCooldown = 14;
        if (game) {
            game.pendingCameraSnap = true;
            if (typeof snapCameraToPlayerImmediate === 'function') {
                snapCameraToPlayerImmediate(game, game.levelData, player);
            }
        }
    }
    draw() {}
    reset() {}
}

// Switch — Schalter der Plattformen mit passender Gruppe togglet
class Switch {
    constructor(x, y, group, mount, triggeredBy, action) {
        this.x = x; this.y = y;
        this.mount = mount || 'floor';
        this.w = (this.mount === 'left' || this.mount === 'right') ? 10 : 36;
        this.h = (this.mount === 'left' || this.mount === 'right') ? 36 : 10;
        this.group = group;
        this.triggeredBy = triggeredBy || 'player';
        this.action = action || 'toggle';
        this.pressed = false;
        this.type = 'switch';
    }
    canBePressedBy(actor) {
        if (!actor) return false;
        if (actor.alive === false) return false;
        const overlapX = actor.x + actor.w > this.x && actor.x < this.x + this.w;
        const overlapY = actor.y + actor.h > this.y && actor.y < this.y + this.h;
        let activated = false;
        if (this.mount === 'floor') activated = overlapX && actor.y + actor.h > this.y && actor.y + actor.h < this.y + 14;
        else if (this.mount === 'ceiling') activated = overlapX && actor.y < this.y + this.h && actor.y > this.y - 14;
        else if (this.mount === 'left') activated = overlapY && actor.x + actor.w > this.x && actor.x + actor.w < this.x + 14;
        else if (this.mount === 'right') activated = overlapY && actor.x < this.x + this.w && actor.x > this.x - 14;
        return activated;
    }
    activate() {
        if (this.pressed) return;
        this.pressed = true;
        SFX.menuSelect();
        if (this.action === 'swapWorlds') {
            if (game?.levelData && game?.player) swapShadowWorldState(game.levelData, game.player);
        } else {
            game.levelData.traps.forEach(t => {
                if (t.type === 'togglePlatform' && t.group === this.group) {
                    t.active = !t.active;
                }
            });
            if (game.levelData && game.levelData.exit) {
                const exitObj = game.levelData.exit;
                if ((exitObj.revealMode || 'none') === 'switch' && String(exitObj.revealGroup ?? '') === String(this.group)) {
                    exitObj.revealed = !exitObj.revealed;
                }
            }
        }
    }
    update(player) {
        if (this.pressed) return;
        const shadow = game?.levelData?.traps?.find(t => t.type === 'shadowPlayer');
        let activated = false;
        if (this.triggeredBy === 'shadow') activated = this.canBePressedBy(shadow);
        else if (this.triggeredBy === 'both') activated = this.canBePressedBy(player) || this.canBePressedBy(shadow);
        else activated = this.canBePressedBy(player);
        if (activated) {
            this.activate();
        }
    }
    draw() {
        const pressedColor = this.pressed ? '#2ecc71' : '#e74c3c';
        if (this.mount === 'floor') {
            const offset = this.pressed ? 4 : 0;
            rect(this.x, this.y + 4, this.w, 6, '#333');
            rect(this.x + 2, this.y + offset, this.w - 4, 6 - offset, pressedColor);
        } else if (this.mount === 'ceiling') {
            const offset = this.pressed ? 4 : 0;
            rect(this.x, this.y, this.w, 6, '#333');
            rect(this.x + 2, this.y + 4, this.w - 4, Math.max(2, 6 - offset), pressedColor);
        } else if (this.mount === 'left') {
            const offset = this.pressed ? 4 : 0;
            rect(this.x + 4, this.y, 6, this.h, '#333');
            rect(this.x + offset, this.y + 2, 6 - offset, this.h - 4, pressedColor);
        } else {
            const offset = this.pressed ? 4 : 0;
            rect(this.x, this.y, 6, this.h, '#333');
            rect(this.x + 4, this.y + 2, Math.max(2, 6 - offset), this.h - 4, pressedColor);
        }
    }
    reset() { this.pressed = false; }
}

// Toggle Platform — wird durch Switches aktiviert/deaktiviert
class TogglePlatform {
    constructor(x, y, w, h, group, startActive) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.group = group;
        this.initialActive = !!startActive;
        this.active = this.initialActive;
        this.type = 'togglePlatform';
    }
    get solid() { return this.active; }
    update() {}
    draw() {
        if (!this.active) {
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(this.x, this.y, this.w, this.h);
            ctx.setLineDash([]);
            return;
        }
        drawPlatform({ x:this.x, y:this.y, w:this.w, h:this.h, skin:this.skin || 'toggle', material:this.material });
    }
    reset() { this.active = this.initialActive; }
}

// Shadow Player — spiegelt Spieler-Position horizontal, optional mit Y-Offset
class ShadowPlayer {
    constructor(configOrYOffset) {
        this.x = 0; this.y = 0;
        this.w = 20; this.h = 20;
        this.yOffset = 0;
        this.mode = 'mirrorHorizontal';
        this.mainWorld = null;
        this.shadowWorld = null;
        if (typeof configOrYOffset === 'object' && configOrYOffset) {
            this.mode = configOrYOffset.mode || 'mirrorHorizontal';
            this.mainWorld = configOrYOffset.mainWorld ? { ...configOrYOffset.mainWorld } : null;
            this.shadowWorld = configOrYOffset.shadowWorld ? { ...configOrYOffset.shadowWorld } : null;
            if (this.mainWorld && this.shadowWorld) this.yOffset = this.shadowWorld.y - this.mainWorld.y;
        } else {
            this.yOffset = configOrYOffset || 0;
        }
        this.type = 'shadowPlayer';
    }
    resolveWorlds(levelData) {
        if (this.mainWorld && this.shadowWorld) {
            return {
                main: { ...this.mainWorld },
                shadow: { ...this.shadowWorld },
            };
        }
        return getLevelWorlds(levelData);
    }
    syncFromPlayer(player, levelDataOverride) {
        const levelData = levelDataOverride || game?.levelData || (this.mainWorld && this.shadowWorld ? {
            levelType: 'shadow',
            shadowMode: this.mode || 'mirrorHorizontal',
            worlds: {
                main: { ...this.mainWorld },
                shadow: { ...this.shadowWorld },
            },
            currentShadowControlWorld: 'main',
        } : null);
        const worlds = this.resolveWorlds(levelData);
        if (!worlds) {
            const levelW = levelData?.width || W;
            this.x = levelW - player.x - this.w;
            this.y = player.y + this.yOffset;
            return;
        }

        const controlWorld = getShadowControlWorld(levelData);
        const passiveWorld = controlWorld === 'shadow' ? 'main' : 'shadow';
        const mapped = mapShadowActorBetweenWorlds({ x: player.x, y: player.y, w: this.w, h: this.h }, controlWorld, passiveWorld, levelData);
        if (mapped) {
            this.x = mapped.x;
            this.y = mapped.y;
        }
    }
    update(player) {
        if (!player.alive) return;
        this.syncFromPlayer(player);

        // Shadow tötet Spieler wenn er in Spikes läuft
        for (const s of game.levelData.spikes) {
            const sHit = { x: s.x + 3, y: s.y + 3, w: s.w - 6, h: s.h - 6 };
            if (aabb(this, sHit)) {
                player.die();
                return;
            }
        }
    }
    draw() {
        const mode = this.mode || game?.levelData?.shadowMode || 'mirrorHorizontal';
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = '#6c5ce7';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        if (mode === 'verticalFlip') {
            ctx.fillStyle = 'rgba(223,230,255,0.7)';
            ctx.fillRect(this.x + 3, this.y, this.w - 6, 3);
        }
        ctx.fillStyle = '#fff';
        const eyeY = mode === 'verticalFlip' ? this.y + this.h - 9 : this.y + 6;
        ctx.fillRect(this.x + 4, eyeY, 3, 3);
        ctx.fillRect(this.x + 13, eyeY, 3, 3);
        ctx.globalAlpha = 1;
    }
    reset() {
        if (game.levelData && game.player) this.syncFromPlayer(game.player);
    }
}

// Kill Zone — unsichtbarer Bereich der den Spieler bei Berührung tötet
class KillZone {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.type = 'killZone';
    }
    update(player) {
        if (player.alive && aabb(player, this)) {
            player.die();
        }
    }
    draw() {}  // unsichtbar
    reset() {}
}

// Room Cover — verdeckt einen Bereich mit Hintergrundfarbe
// Faded weg wenn Spieler reingeht → Raum wird sichtbar
class RoomCover {
    constructor(x, y, w, h, revealBelowX) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.revealBelowX = revealBelowX;
        this.revealed = false;
        this.alpha = 1;
        this.type = 'roomCover';
    }
    update(player) {
        if (player.alive && player.x < this.revealBelowX) this.revealed = true;
        if (this.revealed && this.alpha > 0) this.alpha = Math.max(0, this.alpha - 0.04);
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        rect(this.x, this.y, this.w, this.h, '#0a0a0f');
        ctx.globalAlpha = 1;
    }
    reset() {
        this.revealed = false;
        this.alpha = 1;
    }
}

// Timed Floor — fällt nach X Frames, EGAL was der Spieler macht
class TimedFloor {
    constructor(x, y, w, h, delay, shakeDuration) {
        this.x = x; this.y = y; this.w = w; this.h = h || 30;
        this.origY = y;
        this.solid = true;
        this.delay = delay;
        this.shakeDuration = shakeDuration || 45;
        this.timer = 0;
        this.shaking = false;
        this.shakeTimer = 0;
        this.falling = false;
        this.vy = 0;
        this.type = 'timedFloor';
    }
    update() {
        if (!this.shaking && !this.falling) {
            this.timer++;
            if (this.timer >= this.delay) {
                this.shaking = true;
                this.shakeTimer = this.shakeDuration;
            }
        }
        if (this.shaking) {
            this.shakeTimer--;
            if (this.shakeTimer <= 0) {
                this.shaking = false;
                this.falling = true;
            }
        }
        if (this.falling) {
            this.vy += 0.4;
            this.y += this.vy;
            if (this.y > H + 50) this.solid = false;
        }
    }
    draw() {
        if (this.y > H + 50) return;
        let dx = 0;
        if (this.shaking) dx = rand(-2, 2);
        rect(this.x + dx, this.y, this.w, this.h, '#d0d0d0');
        rect(this.x + dx, this.y, this.w, 3, '#e8e8e8');
    }
    reset() {
        this.y = this.origY;
        this.solid = true;
        this.timer = 0;
        this.shaking = false;
        this.shakeTimer = 0;
        this.falling = false;
        this.vy = 0;
    }
}

// Dodging Platform — zuckt weg wenn Spieler in der Luft nah kommt
// Kommt nach kurzer Zeit zurück. Dodgt nur EINMAL.
class DodgingPlatform {
    constructor(x, y, w, h, dodgeX, triggerRange, triggerOffsetY, triggerHeight, dodgeSpeed) {
        this.origX = x; this.x = x; this.y = y;
        this.w = w; this.h = h || 20;
        this.dodgeX = dodgeX;
        this.triggerRange = triggerRange || 80;
        this.triggerOffsetY = Math.max(0, triggerOffsetY ?? 80);
        this.triggerHeight = Math.max(10, triggerHeight ?? 80);
        this.dodgeSpeed = Math.max(0.1, dodgeSpeed ?? 5);
        this.solid = true;
        this.state = 'idle';
        this.dodged = false;
        this.targetX = x;
        this.waitTimer = 0;
        this.type = 'dodgingPlatform';
    }
    update(player) {
        if (this.state === 'idle' && !this.dodged && player.alive) {
            const cx = this.x + this.w / 2;
            const triggerTop = this.y - this.triggerOffsetY;
            const triggerRect = {
                x: cx - this.triggerRange,
                y: triggerTop,
                w: this.triggerRange * 2,
                h: this.triggerHeight,
            };
            if (aabb(player, triggerRect)) {
                this.state = 'dodging';
                this.targetX = this.dodgeX;
            }
        }
        if (this.state === 'dodging') {
            // Konstante Geschwindigkeit — smooth sichtbares Wegrutschen
            const dir = this.targetX > this.x ? 1 : -1;
            this.x += dir * this.dodgeSpeed;
            if ((dir > 0 && this.x >= this.targetX) || (dir < 0 && this.x <= this.targetX)) {
                this.x = this.targetX;
                this.state = 'waiting';
                this.waitTimer = 50;
            }
        }
        if (this.state === 'waiting') {
            this.waitTimer--;
            if (this.waitTimer <= 0) {
                this.state = 'returning';
                this.targetX = this.origX;
            }
        }
        if (this.state === 'returning') {
            // Langsam zurückkommen
            const dir = this.targetX > this.x ? 1 : -1;
            this.x += dir * Math.max(1, this.dodgeSpeed * 0.4);
            if ((dir > 0 && this.x >= this.targetX) || (dir < 0 && this.x <= this.targetX)) {
                this.x = this.targetX;
                this.state = 'idle';
                this.dodged = true;
            }
        }
    }
    draw() {
        rect(this.x, this.y, this.w, this.h, '#d0d0d0');
        rect(this.x, this.y, this.w, 3, '#e8e8e8');
    }
    reset() {
        this.x = this.origX;
        this.state = 'idle';
        this.dodged = false;
        this.targetX = this.origX;
        this.waitTimer = 0;
    }
}

// ── ICE ZONE ───────────────────────────────────────────────
// Unsichtbare Zone die den Spieler rutschen lässt (Friction = 0.98)
class IceZone {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = 'iceZone';
        this.shimmerT = 0;
    }
    update(player) {
        this.shimmerT += 0.02;
        if (player.alive && aabb(player, { x: this.x, y: this.y - 5, w: this.w, h: this.h + 10 })) {
            player.onIce = true;
        }
    }
    draw() {
        // Subtiler Eis-Shimmer
        ctx.globalAlpha = 0.06 + Math.sin(this.shimmerT) * 0.03;
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.globalAlpha = 1;
    }
    reset() {
        this.shimmerT = 0;
    }
}
