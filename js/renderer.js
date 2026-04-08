// ============================================================
//  RENDERER — Draw functions for static elements
// ============================================================

function getConveyorChevronOffset(dir, spacing = 18) {
    const tick = (typeof game !== 'undefined' && Number.isFinite(game?.frameCount)) ? game.frameCount : Math.floor(Date.now() / 16);
    const travel = (tick * 0.9) % spacing;
    return dir > 0 ? travel : -travel;
}

const LEVEL_BACKGROUND_PRESETS = {
    plainClassic: { flat:true, fill:'#2a2a4a' },
    plainSlate: { flat:true, fill:'#3f4657' },
    plainSand: { flat:true, fill:'#8a6c57' },
    plainSky: { flat:true, fill:'#8eb7cf' },
    plainAsh: { flat:true, fill:'#6e747d' },
    dungeon: { top:'#5e637b', bottom:'#2b2f43', far:'#3a3f56', mid:'#262a3d', floor:'#1a1d2a', trim:'#8086a0' },
    furnace: { top:'#a16c52', bottom:'#4b2d27', far:'#744437', mid:'#563028', floor:'#341e19', trim:'#d5a17c' },
    cloudy: { top:'#a8cadb', bottom:'#dde6eb', far:'#c4d1d9', mid:'#b1bec8', floor:'#9ca8b2', trim:'#edf3f6' },
    sunset: { top:'#d6ab8f', bottom:'#73506e', far:'#9f766d', mid:'#7b5a62', floor:'#4e3844', trim:'#efcab0' },
};

function drawLevelBackdrop(targetCtx, width, height, theme = 'plainSlate') {
    const style = LEVEL_BACKGROUND_PRESETS[theme] || LEVEL_BACKGROUND_PRESETS.plainSlate;
    if (style.flat) {
        targetCtx.fillStyle = style.fill;
        targetCtx.fillRect(0, 0, width, height);
        return;
    }
    const grad = targetCtx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, style.top);
    grad.addColorStop(1, style.bottom);
    targetCtx.fillStyle = grad;
    targetCtx.fillRect(0, 0, width, height);

    const horizonY = Math.round(height * 0.74);
    targetCtx.fillStyle = style.far;
    const farBlocks = [
        [0.00, 0.18], [0.12, 0.09], [0.24, 0.15], [0.40, 0.11],
        [0.55, 0.17], [0.70, 0.12], [0.86, 0.20]
    ];
    farBlocks.forEach(([start, h]) => {
        targetCtx.fillRect(Math.round(width * start), Math.round(horizonY - height * h), Math.round(width * 0.08), Math.round(height * h));
    });

    targetCtx.fillStyle = style.mid;
    const midY = Math.round(height * 0.86);
    for (let x = 0; x < width; x += 96) {
        const barW = 54 + ((x / 96) % 3) * 14;
        const barH = 12 + ((x / 96) % 4) * 8;
        targetCtx.fillRect(x, midY - barH, Math.min(barW, width - x), barH);
    }

    targetCtx.fillStyle = style.floor;
    targetCtx.fillRect(0, height - 26, width, 26);
    targetCtx.fillStyle = style.trim;
    targetCtx.fillRect(0, height - 26, width, 2);
}

function drawPlatform(p) {
    const style = getPlatformStyle(p);
    if (style.glow) {
        ctx.fillStyle = style.glow;
        ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
    }
    rect(p.x, p.y, p.w, p.h, style.body);
    if (style.top) rect(p.x, p.y, p.w, Math.min(3, p.h), style.top);
    if (style.bottom) rect(p.x, p.y + Math.max(0, p.h - 3), p.w, Math.min(3, p.h), style.bottom);
    if (style.detail === 'dashes') {
        ctx.strokeStyle = style.detailColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 5]);
        ctx.strokeRect(p.x + 2, p.y + 5, Math.max(0, p.w - 4), Math.max(0, p.h - 10));
        ctx.setLineDash([]);
    } else if (style.detail === 'bolts') {
        ctx.fillStyle = style.detailColor;
        [p.x + 10, p.x + p.w - 10].forEach(bx => {
            ctx.beginPath();
            ctx.arc(bx, p.y + p.h / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (style.detail === 'ripples') {
        ctx.strokeStyle = style.detailColor;
        ctx.lineWidth = 1;
        for (let x = p.x + 8; x < p.x + p.w - 8; x += 18) {
            ctx.beginPath();
            ctx.moveTo(x, p.y + p.h - 5);
            ctx.quadraticCurveTo(x + 4, p.y + p.h - 8, x + 8, p.y + p.h - 5);
            ctx.stroke();
        }
    } else if (style.detail === 'bubbles') {
        ctx.fillStyle = style.detailColor;
        for (let x = p.x + 10; x < p.x + p.w - 4; x += 20) {
            ctx.beginPath();
            ctx.arc(x, p.y + p.h - 6, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (style.detail === 'waves') {
        ctx.strokeStyle = style.detailColor;
        ctx.lineWidth = 1.2;
        for (let x = p.x + 6; x < p.x + p.w - 6; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, p.y + 8);
            ctx.quadraticCurveTo(x + 4, p.y + 4, x + 8, p.y + 8);
            ctx.stroke();
        }
    } else if (style.detail === 'cracks') {
        ctx.strokeStyle = style.detailColor;
        ctx.lineWidth = 1;
        const midY = p.y + p.h / 2;
        for (let x = p.x + 12; x < p.x + p.w - 10; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, p.y + 5);
            ctx.lineTo(x - 3, midY - 1);
            ctx.lineTo(x + 2, p.y + p.h - 5);
            ctx.stroke();
        }
    } else if (style.detail === 'chevrons') {
        ctx.strokeStyle = style.detailColor;
        ctx.lineWidth = 1.4;
        const dir = (p?.conveyorDir || 'right') === 'left' ? -1 : 1;
        const spacing = 18;
        const offset = getConveyorChevronOffset(dir, spacing);
        for (let x = p.x + 10 - spacing + offset; x < p.x + p.w; x += spacing) {
            if (x < p.x + 6 || x > p.x + p.w - 6) continue;
            const midY = p.y + p.h / 2;
            ctx.beginPath();
            if (dir > 0) {
                ctx.moveTo(x - 4, midY - 4);
                ctx.lineTo(x + 2, midY);
                ctx.lineTo(x - 4, midY + 4);
            } else {
                ctx.moveTo(x + 4, midY - 4);
                ctx.lineTo(x - 2, midY);
                ctx.lineTo(x + 4, midY + 4);
            }
            ctx.stroke();
        }
    }
    if (style.border) {
        ctx.strokeStyle = style.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
}

const PLATFORM_SKIN_PRESETS = {
    default: { body:'#d0d0d0', top:'#e8e8e8' },
    oneWay: { body:'rgba(205, 220, 255, 0.22)', top:'#dff1ff', border:'rgba(223,241,255,0.65)', detail:'dashes', detailColor:'rgba(223,241,255,0.55)' },
    moving: { body:'#b0d0f0', top:'#d0e8ff', detail:'dashes', detailColor:'rgba(255,255,255,0.5)' },
    toggle: { body:'#7f8c8d', top:'#bdc3c7', detail:'bolts', detailColor:'#dfe6e9' },
    stone: { body:'#8f9188', top:'#bbbdb3', border:'#6f7269', detail:'cracks', detailColor:'#66695f' },
    metal: { body:'#7d8fa1', top:'#b9cad8', border:'#60717f', detail:'dashes', detailColor:'rgba(235,245,255,0.55)' },
    ghost: { body:'rgba(220,220,240,0.38)', top:'rgba(255,255,255,0.68)', border:'rgba(230,230,255,0.65)' },
    bounce: { body:'#f28a2e', top:'#ffd36f', border:'#c96816', detail:'dashes', detailColor:'rgba(255,244,190,0.65)' },
    conveyor: { body:'#6e8aa2', top:'#c1d5e6', detail:'chevrons', detailColor:'rgba(243,248,255,0.72)' },
    ice: { body:'#8fd6f7', top:'#dff7ff', detail:'waves', detailColor:'rgba(255,255,255,0.65)' },
    mud: { body:'#7a5233', top:'#9c724b', detail:'ripples', detailColor:'rgba(50,30,15,0.45)' },
    lava: { body:'#cf3b19', top:'#ffae42', detail:'bubbles', detailColor:'rgba(255,220,120,0.75)' },
};

function getPlatformStyle(p) {
    if (p?.oneWay) return PLATFORM_SKIN_PRESETS[p?.skin] || PLATFORM_SKIN_PRESETS.oneWay;
    if (p?.material === 'bounce') return PLATFORM_SKIN_PRESETS.bounce;
    if (p?.material === 'conveyor') return PLATFORM_SKIN_PRESETS.conveyor;
    if (p?.material === 'ice') return PLATFORM_SKIN_PRESETS.ice;
    if (p?.material === 'mud') return PLATFORM_SKIN_PRESETS.mud;
    if (p?.material === 'lava') return PLATFORM_SKIN_PRESETS.lava;
    return PLATFORM_SKIN_PRESETS[p?.skin] || PLATFORM_SKIN_PRESETS.default;
}

function drawSpike(s) {
    const spikeColor = '#dc4b3f';
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
    ctx.fillStyle = spikeColor;
    ctx.fill();
    ctx.strokeStyle = spikeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
}

const DOOR_SKIN_PRESETS = {
    exit: {
        frameColor: '#2ecc71',
        bodyColor: '#27ae60',
        knobColor: '#f1c40f',
    },
    warp: {
        frameColor: '#9b59b6',
        bodyColor: '#7d3c98',
        knobColor: '#ecf0f1',
    },
    shadow: {
        frameColor: '#6c5ce7',
        bodyColor: '#4b3cb8',
        knobColor: '#dfe6ff',
    },
    gold: {
        frameColor: '#f1c40f',
        bodyColor: '#c59d0b',
        knobColor: '#fff3b0',
    },
};

function getDoorSkinStyle(skin) {
    return DOOR_SKIN_PRESETS[skin] || DOOR_SKIN_PRESETS.exit;
}

function drawExit(e) {
    const skin = getDoorSkinStyle(e.skin);
    const frame  = e.frameColor  || skin.frameColor;
    const body   = e.bodyColor   || skin.bodyColor;
    const knob   = e.knobColor   || skin.knobColor;
    // Door frame
    rect(e.x - 2, e.y - 2, e.w + 4, e.h + 4, frame);
    rect(e.x, e.y, e.w, e.h, body);
    // Knob
    ctx.fillStyle = knob;
    ctx.beginPath();
    ctx.arc(e.x + e.w - 8, e.y + e.h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
}
