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
        this.prevX = x;
        this.prevY = y;
        this.warpCooldown = 0;
        this.grounded = false;
        this.surfaceMaterial = null;
        this.onIce = false;
        this.onMud = false;
        this.coyote = 0;
        this.airJumpsUsed = 0;
        this.surfaceConveyorSpeed = 0;
        this.bounceLockFrames = 0;
        this.fallTravel = 0;
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
        this.prevX = this.x;
        this.prevY = this.y;
        this.warpCooldown = 0;
        this.grounded = false;
        this.surfaceMaterial = null;
        this.onIce = false;
        this.onMud = false;
        this.coyote = 0;
        this.airJumpsUsed = 0;
        this.surfaceConveyorSpeed = 0;
        this.bounceLockFrames = 0;
        this.fallTravel = 0;
        this.alive = true;
        this.squash = 1;
        this.stretch = 1;
        // Gravity-Richtung aus Level (nur beim Reset, nicht mutated)
        this.gDir = (game.levelData && (game.levelData.currentGravityDir ?? game.levelData.gravityDir)) || 1;
    }

    canUseDoubleJump() {
        const levelData = game?.levelData;
        const roomEnabled = !!(levelData && levelData.currentDoubleJumpEnabled);
        const zoneEnabled = !!(levelData?.traps && levelData.traps.some(t => t.type === 'doubleJumpZone' && t.contains && t.contains(this)));
        return roomEnabled || zoneEnabled;
    }

    getSupportPlatform(platforms) {
        if (!this.grounded) return null;
        const gDir = this.gDir || 1;
        const playerStartX = this.x;
        const playerEndX = this.x + this.w;
        const minOverlap = Math.max(3, this.w * 0.18);
        let best = null;
        let bestOverlap = -1;
        for (const p of platforms) {
            if (p.solid === false) continue;
            const overlapX = Math.min(playerEndX, p.x + p.w) - Math.max(playerStartX, p.x);
            if (overlapX < minOverlap) continue;
            if (gDir > 0) {
                const onTop = Math.abs((this.y + this.h) - p.y) <= 3;
                if (!onTop) continue;
            } else {
                const onBottom = Math.abs(this.y - (p.y + p.h)) <= 3;
                if (!onBottom) continue;
            }
            if (p.material === 'conveyor') return p;
            if (overlapX > bestOverlap) {
                best = p;
                bestOverlap = overlapX;
            }
        }
        return best;
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
        this.prevX = this.x;
        this.prevY = this.y;
        if (this.warpCooldown > 0) this.warpCooldown--;
        if (this.bounceLockFrames > 0) this.bounceLockFrames--;

        // noLeft: Links drücken = sofortiger Tod
        if (game.levelData && game.levelData.noLeft && isLeft()) {
            this.die();
            return;
        }

        // === FLAPPY MODE: komplett andere Physik ===
        if (game.levelData && game.levelData.flappyMode) {
            // AutoRun: automatische Bewegung nach rechts
            if (game.levelData.autoRun) {
                this.vx = game.levelData.autoRun;
                this.facingRight = true;
            }
            // Flappy Jump: kleiner Impuls, kein Grounded-Check
            if (isJump() && !this.jumpPressed) {
                this.vy = -3.5;
                this.jumpPressed = true;
                this.squash = 0.7;
                this.stretch = 1.2;
                SFX.jump();
            }
            if (!isJump()) this.jumpPressed = false;
            // Stärkere Gravity
            this.vy += CFG.gravity * 2.5;
            if (this.vy > CFG.maxFallSpeed * 1.5) this.vy = CFG.maxFallSpeed * 1.5;
        } else {
            // === NORMALE PHYSIK ===

            // Horizontal movement
            if (game.levelData && game.levelData.autoRun) {
                // AutoRun: automatische Geschwindigkeit
                this.vx = game.levelData.autoRun;
                this.facingRight = true;
            } else {
                const zoneInvert = game.levelData && game.levelData.traps &&
                    game.levelData.traps.some(t => t.type === 'invertZone' && t.mode !== 'line' && t.contains && t.contains(this));
                const inv = game.levelData && (game.levelData.invertControls || zoneInvert);
                const goLeft = inv ? isRight() : isLeft();
                const goRight = inv ? isLeft() : isRight();
                const onIceSurface = this.onIce || this.surfaceMaterial === 'ice';
                const onMudSurface = this.onMud || this.surfaceMaterial === 'mud';
                const maxSpd = onIceSurface ? CFG.moveSpeed * 2.5 : onMudSurface ? CFG.moveSpeed * 0.45 : CFG.moveSpeed;
                const accel = onIceSurface ? CFG.accel * 0.15 : onMudSurface ? CFG.accel * 0.4 : CFG.accel;
                if (goLeft) {
                    this.vx -= accel;
                    if (this.vx < -maxSpd) this.vx = -maxSpd;
                    this.facingRight = false;
                } else if (goRight) {
                    this.vx += accel;
                    if (this.vx > maxSpd) this.vx = maxSpd;
                    this.facingRight = true;
                } else {
                    const friction = onIceSurface ? 0.99 : onMudSurface ? 0.65 : CFG.friction;
                    this.vx *= friction;
                    if (Math.abs(this.vx) < 0.05) this.vx = 0;
                }
            }

            // Jumping
            if (this.grounded) this.coyote = CFG.coyoteTime;
            else this.coyote--;

            if (this.gDir === undefined) this.gDir = (game.levelData && (game.levelData.currentGravityDir ?? game.levelData.gravityDir)) || 1;
            const gDir = this.gDir;
            const canGroundJump = this.coyote > 0;
            const canAirJump = !canGroundJump && !this.grounded && this.canUseDoubleJump() && this.airJumpsUsed < 1;

            if (isJump() && !this.jumpPressed && (canGroundJump || canAirJump)) {
                if (game.levelData && (game.levelData.currentJumpFlipsGravity ?? game.levelData.jumpFlipsGravity)) {
                    this.gDir *= -1;
                    this.vy = 0;
                    if (canAirJump) this.airJumpsUsed++;
                    this.squash = 0.6;
                    this.stretch = 1.3;
                } else {
                    this.vy = CFG.jumpForce * gDir;
                    if (canAirJump) {
                        this.vy *= 0.94;
                        this.airJumpsUsed++;
                    }
                    this.squash = 0.6;
                    this.stretch = 1.3;
                }
                this.fallTravel = 0;
                this.coyote = 0;
                this.jumpPressed = true;
                SFX.jump();
            }
            if (!isJump()) this.jumpPressed = false;

            // Variable jump height (richtungsabhängig)
            const gDir2 = this.gDir || 1;
            if (this.vy * gDir2 < -2 && !isJump() && this.bounceLockFrames <= 0) {
                this.vy *= 0.85;
            }

            // Gravity (richtungsabhängig)
            this.vy += CFG.gravity * gDir2;
            if (this.vy * gDir2 > CFG.maxFallSpeed) {
                this.vy = CFG.maxFallSpeed * gDir2;
            }
        }

        // Move X & collide (inkl. externer Kraft wie Wind)
        this.x += this.vx + this.extVx;
        this.extVx *= 0.9;  // Decay
        if (Math.abs(this.extVx) < 0.02) this.extVx = 0;
        this.grounded = false;
        this.resolveCollisions(platforms, 'x');

        // Move Y & collide (inkl. vertikaler Wind)
        const gDirBeforeY = this.gDir || 1;
        const fallStep = (this.vy + this.extVy) * gDirBeforeY;
        if (!this.grounded && fallStep > 0) this.fallTravel += fallStep;
        this.y += this.vy + this.extVy;
        this.extVy *= 0.9;
        if (Math.abs(this.extVy) < 0.02) this.extVy = 0;
        this.resolveCollisions(platforms, 'y');

        const supportPlatform = this.getSupportPlatform(platforms);
        if (supportPlatform?.material === 'conveyor') {
            const mag = Math.max(0, Math.min(3, Math.abs(Number.isFinite(supportPlatform.conveyorSpeed) ? supportPlatform.conveyorSpeed : 0.65)));
            this.surfaceConveyorSpeed = (supportPlatform.conveyorDir || 'right') === 'left' ? -mag : mag;
            this.surfaceMaterial = 'conveyor';
        } else if (this.grounded) {
            this.surfaceConveyorSpeed = 0;
        }

        if (this.grounded && Math.abs(this.surfaceConveyorSpeed) > 0.001) {
            this.x += this.surfaceConveyorSpeed;
            this.resolveCollisions(platforms, 'x');
        }

        if (this.grounded) this.airJumpsUsed = 0;

        // Squash & stretch recovery
        this.squash = lerp(this.squash, 1, 0.15);
        this.stretch = lerp(this.stretch, 1, 0.15);

        // Out of bounds = death (auch nach oben bei reverse gravity)
        const levelW = (game.levelData && game.levelData.width) || W;
        const levelH = (game.levelData && game.levelData.height) || H;
        if (this.y > levelH + 50 || this.y < -50 || this.x < -50 || this.x > levelW + 50) {
            this.die();
        }
        // Vertical Scroll: Tod wenn unter sichtbarem Bereich
        const currentVerticalScroll = game.levelData && (game.levelData.currentVerticalScroll !== undefined
            ? game.levelData.currentVerticalScroll
            : game.levelData.verticalScroll);
        if (currentVerticalScroll) {
            if (this.y > game.cameraY + H + 30) this.die();
        }
        // AutoScroll: Tod wenn hinter Kamera
        if (game.levelData && game.levelData.autoScroll) {
            if (this.x + this.w < game.cameraX) this.die();
        }
        // Zone-Effekte werden nach dem Player-Update neu gesetzt.
        this.onIce = false;
        this.onMud = false;
        if (!this.grounded) {
            if (Math.abs(this.surfaceConveyorSpeed) > 0.001) this.extVx += this.surfaceConveyorSpeed * 0.85;
            this.surfaceMaterial = null;
            this.surfaceConveyorSpeed = 0;
        }
    }

    resolveCollisions(platforms, axis) {
        const gDir = this.gDir || 1;
        for (const p of platforms) {
            if (p.solid === false) continue;
            if (aabb(this, p)) {
                if (p.material === 'lava') {
                    this.die();
                    return;
                }
                if (p.oneWay) {
                    const dir = p.oneWayDir || 'up';
                    if (axis === 'x') {
                        if (dir === 'up' || dir === 'down') continue;
                        const prevRight = this.prevX + this.w;
                        const prevLeft = this.prevX;
                        if (dir === 'left') {
                            if (!(this.vx > 0 && prevRight <= p.x + 6)) continue;
                        } else if (dir === 'right') {
                            if (!(this.vx < 0 && prevLeft >= p.x + p.w - 6)) continue;
                        } else {
                            continue;
                        }
                    } else {
                        if (dir === 'left' || dir === 'right') continue;
                        const prevBottom = this.prevY + this.h;
                        const prevTop = this.prevY;
                        if (dir === 'up') {
                            if (!(this.vy > 0 && prevBottom <= p.y + 6)) continue;
                        } else if (dir === 'down') {
                            if (!(this.vy < 0 && prevTop >= p.y + p.h - 6)) continue;
                        } else {
                            continue;
                        }
                    }
                }
                if (axis === 'x') {
                    // Wenn der Spieler im vorherigen Frame klar ueber oder unter der Plattform war,
                    // behandeln wir den Kontakt nicht als Seitenkollision. Das verhindert,
                    // dass lange Bodenflaechen den Spieler seitlich zum linken/rechten Rand "teleportieren".
                    const prevBottom = this.prevY + this.h;
                    const prevTop = this.prevY;
                    if (prevBottom <= p.y + 2 || prevTop >= p.y + p.h - 2) {
                        continue;
                    }
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
                        const landingVy = this.vy;
                        this.vy = 0;
                        this.grounded = true;
                        this.surfaceMaterial = p.material || null;
                        if (p.material === 'conveyor') {
                            const mag = Math.max(0, Math.min(3, Math.abs(Number.isFinite(p.conveyorSpeed) ? p.conveyorSpeed : 0.65)));
                            this.surfaceConveyorSpeed = (p.conveyorDir || 'right') === 'left' ? -mag : mag;
                        } else {
                            this.surfaceConveyorSpeed = 0;
                        }
                        if (p.material === 'bounce') {
                            const baseStrength = Number.isFinite(p.bounceStrength) ? p.bounceStrength : 1.18;
                            const clampedStrength = Math.max(0.55, Math.min(2.2, baseStrength));
                            const travelInfluence = Math.min(8, this.fallTravel * 0.055);
                            const incomingEnergy = Math.abs(landingVy) + travelInfluence;
                            const restitution = Math.max(0.45, Math.min(0.92, 0.68 + (clampedStrength - 1) * 0.18));
                            const launchBias = Math.max(0, clampedStrength - 1) * 1.15;
                            const bounceMag = Math.max(2.8, incomingEnergy * restitution + launchBias);
                            this.vy = -gDir * bounceMag;
                            this.grounded = false;
                            this.coyote = 0;
                            this.airJumpsUsed = 0;
                            this.bounceLockFrames = 8;
                            this.fallTravel = 0;
                            this.squash = 0.72;
                            this.stretch = 1.28;
                            SFX.jump();
                        } else if (this.stretch > 1.05) {
                            this.squash = 1.2;
                            this.stretch = 0.8;
                            this.fallTravel = 0;
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
        const bodyX = cx - sw / 2;
        const bodyY = cy - sh / 2 + (this.h - sh);
        // Body
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(bodyX, bodyY, sw, sh);
        // Eyes
        const eyeY = bodyY + sh * 0.35;
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
