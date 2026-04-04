// ============================================================
//  ENGINE — Config, Input, Utilities, Particles, Screen Shake
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;   // 800
const H = canvas.height;  // 500

// ── CONFIG ──────────────────────────────────────────────────
const CFG = {
    gravity: 0.22,
    jumpForce: -6.5,
    moveSpeed: 1.4,
    accel: 0.15,
    maxFallSpeed: 5,
    playerSize: 20,
    friction: 0.88,
    coyoteTime: 8,
    respawnDelay: 40,
    levelTitleTime: 120,
};

// ── INPUT ───────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function isLeft()  { return keys['ArrowLeft']  || keys['KeyA']; }
function isRight() { return keys['ArrowRight'] || keys['KeyD']; }
function isJump()  { return keys['ArrowUp']    || keys['KeyW'] || keys['Space']; }

// ── UTILITY ─────────────────────────────────────────────────
function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function rand(min, max) { return Math.random() * (max - min) + min; }

// ── PARTICLE SYSTEM ─────────────────────────────────────────
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = rand(-4, 4);
        this.vy = rand(-6, 1);
        this.size = rand(2, 6);
        this.life = 1;
        this.decay = rand(0.015, 0.04);
        this.color = color || '#fff';
        this.gravity = 0.15;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        rect(this.x, this.y, this.size, this.size, this.color);
        ctx.globalAlpha = 1;
    }
}

const particles = [];

function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

// ── SCREEN SHAKE ────────────────────────────────────────────
let shakeAmount = 0;
let shakeDecay = 0.9;

function triggerShake(amount) { shakeAmount = amount; }

function applyShake() {
    if (shakeAmount > 0.5) {
        const sx = rand(-shakeAmount, shakeAmount);
        const sy = rand(-shakeAmount, shakeAmount);
        ctx.translate(sx, sy);
        shakeAmount *= shakeDecay;
    } else {
        shakeAmount = 0;
    }
}
