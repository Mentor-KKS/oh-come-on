// ============================================================
//  TRAP TYPES
// ============================================================

class FallingFloor {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = true;
        this.origY = y;
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
                this.shakeTimer = 75;
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
    constructor(x, y, w, h, triggerX) {
        this.x = x; this.origY = y; this.y = y;
        this.w = w; this.h = h || 30;
        this.triggerX = triggerX;
        this.triggered = false;
        this.vy = 0;
        this.solid = true;
        this.type = 'fallingCeiling';
    }
    update(player) {
        if (!this.triggered && player.alive) {
            if (Math.abs(player.x + player.w / 2 - this.triggerX) < 40) this.triggered = true;
        }
        if (this.triggered) {
            this.vy += 0.2;
            this.y += this.vy;
        }
        if (this.triggered && player.alive && this.vy > 0) {
            if (aabb(player, this)) player.die();
        }
    }
    draw() {
        if (this.y > H + 50) return;
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
        rect(this.x - 2, this.y - 2, this.w + 4, this.h + 4, '#2ecc71');
        rect(this.x, this.y, this.w, this.h, '#27ae60');
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x + this.w - 8, this.y + this.h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
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
        this.type = 'fakeFloor';
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
    constructor(x, y, dir, triggerX, speed) {
        this.origX = x; this.origY = y;
        this.x = x; this.y = y;
        this.w = 20; this.h = 14;
        this.dir = dir;
        this.triggerX = triggerX;
        this.speed = speed || 6;
        this.triggered = false;
        this.type = 'shootingSpike';
    }
    update(player) {
        if (!this.triggered && player.alive) {
            if (Math.abs(player.x - this.triggerX) < 50) this.triggered = true;
        }
        if (this.triggered) {
            this.x += this.dir === 'right' ? this.speed : -this.speed;
        }
        if (this.triggered && player.alive) {
            if (aabb(player, { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: this.h - 4 })) {
                player.die();
            }
        }
    }
    draw() {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        if (this.dir === 'right') {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h / 2);
            ctx.lineTo(this.x, this.y + this.h);
        } else {
            ctx.moveTo(this.x + this.w, this.y);
            ctx.lineTo(this.x, this.y + this.h / 2);
            ctx.lineTo(this.x + this.w, this.y + this.h);
        }
        ctx.closePath();
        ctx.fill();
    }
    reset() {
        this.x = this.origX;
        this.y = this.origY;
        this.triggered = false;
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

// Unsichtbare Plattform — erscheint wenn Spieler in Trigger-Zone springt
class HiddenPlatform {
    constructor(x, y, w, h, triggerArea) {
        this.x = x; this.y = y; this.w = w; this.h = h || 20;
        this.solid = false;
        this.visible = false;
        this.triggerArea = triggerArea; // {x, y, w, h}
        this.alpha = 0;
        this.type = 'hiddenPlatform';
    }
    update(player) {
        if (!this.visible && player.alive) {
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
        if (!this.visible) return;
        ctx.globalAlpha = this.alpha;
        rect(this.x, this.y, this.w, this.h, '#b0d0f0');
        rect(this.x, this.y, this.w, 3, '#d0e8ff');
        ctx.globalAlpha = 1;
    }
    reset() {
        this.visible = false;
        this.solid = false;
        this.alpha = 0;
    }
}

// Fake Exit — sieht aus wie echte Tür, tötet bei Berührung
// Optional: showAboveY — erscheint erst wenn Spieler hoch genug ist
class FakeExit {
    constructor(x, y, showAboveY) {
        this.x = x; this.y = y;
        this.w = 30; this.h = 40;
        this.showAboveY = showAboveY || H;
        this.type = 'fakeExit';
        this.triggered = false;
        this.visible = false;
    }
    update(player) {
        this.visible = player.y < this.showAboveY;
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
        ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
        ctx.fillRect(this.x - 6, this.y - 6, this.w + 12, this.h + 12);
        rect(this.x - 2, this.y - 2, this.w + 4, this.h + 4, '#2ecc71');
        rect(this.x, this.y, this.w, this.h, '#27ae60');
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x + this.w - 8, this.y + this.h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
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
    constructor(speed) {
        this.y = H + 20;
        this.startDelay = 120;  // ~2 Sekunden bevor es losgeht
        this.timer = 0;
        this.speed = speed || 0.3;
        this.type = 'risingDeath';
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
        // Todes-Zone
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-500, this.y, 2000, H + 100);
        // Glühende Oberkante
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-500, this.y - 2, 2000, 4);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(-500, this.y - 6, 2000, 6);
        ctx.globalAlpha = 1;
    }
    reset() {
        this.y = H + 20;
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
class InvertZone {
    constructor(triggerX) {
        this.triggerX = triggerX;
        this.triggered = false;
        this.type = 'invertZone';
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

// Fake Spikes — sehen aus wie echte Spikes, töten aber NICHT
class FakeSpikes {
    constructor(spikeList) {
        this.spikes = spikeList; // [{x, y, w, h, dir}]
        this.type = 'fakeSpikes';
    }
    update() {}
    draw() {
        ctx.fillStyle = '#e74c3c';
        for (const s of this.spikes) {
            ctx.beginPath();
            if (s.dir === 'up') {
                ctx.moveTo(s.x, s.y + (s.h || 15));
                ctx.lineTo(s.x + (s.w || 16) / 2, s.y);
                ctx.lineTo(s.x + (s.w || 16), s.y + (s.h || 15));
            }
            ctx.closePath();
            ctx.fill();
        }
    }
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
    constructor(x, y, w, h, dodgeX, triggerRange) {
        this.origX = x; this.x = x; this.y = y;
        this.w = w; this.h = h || 20;
        this.dodgeX = dodgeX;
        this.triggerRange = triggerRange || 80;
        this.solid = true;
        this.state = 'idle';
        this.dodged = false;
        this.targetX = x;
        this.waitTimer = 0;
        this.type = 'dodgingPlatform';
    }
    update(player) {
        if (this.state === 'idle' && !this.dodged && player.alive && !player.grounded) {
            const px = player.x + player.w / 2;
            const py = player.y + player.h;
            const cx = this.x + this.w / 2;
            if (Math.abs(px - cx) < this.triggerRange && py < this.y + 15) {
                this.state = 'dodging';
                this.targetX = this.dodgeX;
            }
        }
        if (this.state === 'dodging') {
            // Konstante Geschwindigkeit — smooth sichtbares Wegrutschen
            const dir = this.targetX > this.x ? 1 : -1;
            this.x += dir * 5;
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
            this.x += dir * 2;
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
