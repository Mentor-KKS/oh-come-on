// ============================================================
//  RENDERER — Draw functions for static elements
// ============================================================

function drawPlatform(p) {
    rect(p.x, p.y, p.w, p.h, '#d0d0d0');
    rect(p.x, p.y, p.w, 3, '#e8e8e8');
}

function drawSpike(s) {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    if (s.dir === 'up') {
        ctx.moveTo(s.x, s.y + s.h);
        ctx.lineTo(s.x + s.w / 2, s.y);
        ctx.lineTo(s.x + s.w, s.y + s.h);
    } else if (s.dir === 'down') {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.w / 2, s.y + s.h);
        ctx.lineTo(s.x + s.w, s.y);
    } else if (s.dir === 'left') {
        ctx.moveTo(s.x + s.w, s.y);
        ctx.lineTo(s.x, s.y + s.h / 2);
        ctx.lineTo(s.x + s.w, s.y + s.h);
    } else if (s.dir === 'right') {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.w, s.y + s.h / 2);
        ctx.lineTo(s.x, s.y + s.h);
    }
    ctx.closePath();
    ctx.fill();
}

function drawExit(e) {
    // Glow
    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
    // Door frame
    rect(e.x - 2, e.y - 2, e.w + 4, e.h + 4, '#2ecc71');
    rect(e.x, e.y, e.w, e.h, '#27ae60');
    // Knob
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(e.x + e.w - 8, e.y + e.h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
}
