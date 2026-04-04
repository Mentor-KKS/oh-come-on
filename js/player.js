// ============================================================
//  PLAYER
// ============================================================

class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.w = CFG.playerSize;
        this.h = CFG.playerSize;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.coyote = 0;
        this.jumpPressed = false;
        this.alive = true;
        this.squash = 1;
        this.stretch = 1;
        this.facingRight = true;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.coyote = 0;
        this.alive = true;
        this.squash = 1;
        this.stretch = 1;
    }

    die() {
        if (!this.alive) return;
        this.alive = false;
        SFX.death();
        spawnParticles(this.x + this.w / 2, this.y + this.h / 2, 25, '#222');
        spawnParticles(this.x + this.w / 2, this.y + this.h / 2, 10, '#e74c3c');
        triggerShake(8);
        game.onPlayerDeath();
    }

    update(platforms) {
        if (!this.alive) return;

        // noLeft: Links drücken = sofortiger Tod
        if (game.levelData && game.levelData.noLeft && isLeft()) {
            this.die();
            return;
        }

        // Horizontal movement — mit Beschleunigung für flüssiges Gefühl
        const inv = game.levelData && game.levelData.invertControls;
        const goLeft = inv ? isRight() : isLeft();
        const goRight = inv ? isLeft() : isRight();
        if (goLeft) {
            this.vx -= CFG.accel;
            if (this.vx < -CFG.moveSpeed) this.vx = -CFG.moveSpeed;
            this.facingRight = false;
        } else if (goRight) {
            this.vx += CFG.accel;
            if (this.vx > CFG.moveSpeed) this.vx = CFG.moveSpeed;
            this.facingRight = true;
        } else {
            this.vx *= CFG.friction;
            if (Math.abs(this.vx) < 0.05) this.vx = 0;
        }

        // Jumping
        if (this.grounded) this.coyote = CFG.coyoteTime;
        else this.coyote--;

        if (isJump() && !this.jumpPressed && this.coyote > 0) {
            this.vy = CFG.jumpForce;
            this.coyote = 0;
            this.jumpPressed = true;
            this.squash = 0.6;
            this.stretch = 1.3;
            SFX.jump();
        }
        if (!isJump()) this.jumpPressed = false;

        // Variable jump height
        if (this.vy < -2 && !isJump()) {
            this.vy *= 0.85;
        }

        // Gravity
        this.vy += CFG.gravity;
        if (this.vy > CFG.maxFallSpeed) this.vy = CFG.maxFallSpeed;

        // Move X & collide
        this.x += this.vx;
        this.grounded = false;
        this.resolveCollisions(platforms, 'x');

        // Move Y & collide
        this.y += this.vy;
        this.resolveCollisions(platforms, 'y');

        // Squash & stretch recovery
        this.squash = lerp(this.squash, 1, 0.15);
        this.stretch = lerp(this.stretch, 1, 0.15);

        // Out of bounds = death
        const levelW = (game.levelData && game.levelData.width) || W;
        if (this.y > H + 50 || this.x < -50 || this.x > levelW + 50) {
            this.die();
        }
    }

    resolveCollisions(platforms, axis) {
        for (const p of platforms) {
            if (p.solid === false) continue;
            if (aabb(this, p)) {
                if (axis === 'x') {
                    if (this.vx > 0) {
                        this.x = p.x - this.w;
                    } else if (this.vx < 0) {
                        this.x = p.x + p.w;
                    }
                    this.vx = 0;
                } else {
                    if (this.vy > 0) {
                        this.y = p.y - this.h;
                        this.vy = 0;
                        this.grounded = true;
                        if (this.stretch > 1.05) {
                            this.squash = 1.2;
                            this.stretch = 0.8;
                        }
                    } else if (this.vy < 0) {
                        this.y = p.y + p.h;
                        this.vy = 0;
                    }
                }
            }
        }
    }

    draw() {
        if (!this.alive) return;
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;
        const sw = this.w * this.squash;
        const sh = this.h * this.stretch;
        // Body
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - sw / 2, cy - sh / 2 + (this.h - sh), sw, sh);
        // Eyes
        const eyeY = cy - sh / 2 + (this.h - sh) + sh * 0.35;
        const eyeOffset = sw * 0.18;
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - eyeOffset - 3, eyeY, 4, 4);
        ctx.fillRect(cx + eyeOffset - 1, eyeY, 4, 4);
        // Pupils
        const pupilShift = this.facingRight ? 1.5 : -0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - eyeOffset - 3 + pupilShift + 0.5, eyeY + 1, 2, 2);
        ctx.fillRect(cx + eyeOffset - 1 + pupilShift + 0.5, eyeY + 1, 2, 2);
    }
}
