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
        this.extVx = 0;
        this.extVy = 0;
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
        this.extVx = 0;
        this.extVy = 0;
        this.grounded = false;
        this.coyote = 0;
        this.alive = true;
        this.squash = 1;
        this.stretch = 1;
        // Gravity-Richtung aus Level (nur beim Reset, nicht mutated)
        this.gDir = (game.levelData && game.levelData.gravityDir) || 1;
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

        if (this.gDir === undefined) this.gDir = (game.levelData && game.levelData.gravityDir) || 1;
        const gDir = this.gDir;

        if (isJump() && !this.jumpPressed && this.coyote > 0) {
            if (game.levelData && game.levelData.jumpFlipsGravity) {
                // Jump flippt Gravity statt Sprung
                this.gDir *= -1;
                this.vy = 0;
            } else {
                // Normaler Sprung
                this.vy = CFG.jumpForce * gDir;
                this.squash = 0.6;
                this.stretch = 1.3;
            }
            this.coyote = 0;
            this.jumpPressed = true;
            SFX.jump();
        }
        if (!isJump()) this.jumpPressed = false;

        // Variable jump height (richtungsabhängig)
        if (this.vy * gDir < -2 && !isJump()) {
            this.vy *= 0.85;
        }

        // Gravity (richtungsabhängig)
        this.vy += CFG.gravity * gDir;
        // Fall-Speed-Cap nur in Gravitationsrichtung (nicht gegen Sprung!)
        if (this.vy * gDir > CFG.maxFallSpeed) {
            this.vy = CFG.maxFallSpeed * gDir;
        }

        // Move X & collide (inkl. externer Kraft wie Wind)
        this.x += this.vx + this.extVx;
        this.extVx *= 0.9;  // Decay
        if (Math.abs(this.extVx) < 0.02) this.extVx = 0;
        this.grounded = false;
        this.resolveCollisions(platforms, 'x');

        // Move Y & collide (inkl. vertikaler Wind)
        this.y += this.vy + this.extVy;
        this.extVy *= 0.9;
        if (Math.abs(this.extVy) < 0.02) this.extVy = 0;
        this.resolveCollisions(platforms, 'y');

        // Squash & stretch recovery
        this.squash = lerp(this.squash, 1, 0.15);
        this.stretch = lerp(this.stretch, 1, 0.15);

        // Out of bounds = death (auch nach oben bei reverse gravity)
        const levelW = (game.levelData && game.levelData.width) || W;
        const levelH = (game.levelData && game.levelData.height) || H;
        if (this.y > levelH + 50 || this.y < -50 || this.x < -50 || this.x > levelW + 50) {
            this.die();
        }
    }

    resolveCollisions(platforms, axis) {
        const gDir = this.gDir || 1;
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
                    // In Gravitationsrichtung = landen. Dagegen = Kopfstoß.
                    if (this.vy * gDir > 0) {
                        // Landung
                        if (gDir > 0) this.y = p.y - this.h;
                        else this.y = p.y + p.h;
                        this.vy = 0;
                        this.grounded = true;
                        if (this.stretch > 1.05) {
                            this.squash = 1.2;
                            this.stretch = 0.8;
                        }
                    } else if (this.vy * gDir < 0) {
                        // Kopfstoß
                        if (gDir > 0) this.y = p.y + p.h;
                        else this.y = p.y - this.h;
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
