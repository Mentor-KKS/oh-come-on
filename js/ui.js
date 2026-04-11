// ============================================================
//  UI — Menu, Level Select, HUD, Win Screen
// ============================================================

// ── MENU STATE ─────────────────────────────────────────────
let menuIndex = 0;
const MENU_ITEM_COUNT = 8;
let menuNavCooldown = 0;
let menuTaglineIndex = 0;
let menuTaglineTimer = 0;

const MENU_TAGLINES = [
    'That spike was always there.',
    'You pressed jump. I saw you.',
    'Your controller isn\'t broken. You are.',
    'I can do this all day. Can you?',
    'The respawn button misses you.',
    'Try again. Or don\'t. I don\'t care.',
    'Your death counter says otherwise.',
    'Skill issue. Obviously.',
    'We warned you. Kind of.',
    'You look like a rage quitter.',
    'This game respects your time. LOL.',
];

// ── MENU CHARACTER (walks at tagline level, drags text) ────
const menuChar = {
    x: -20, bobPhase: 0, taglineY: 120,

    reset() { this.x = -30; },

    update() {
        this.x += 1.8;
        this.bobPhase += 0.1;
        if (this.x > W + 40) this.x = W + 40;
    },

    draw() {
        const s = 16;
        const bob = Math.sin(this.bobPhase) * 1.5;
        const px = Math.round(this.x);
        const py = Math.round(this.taglineY - s / 2 + bob);

        // body
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#fff';
        ctx.fillRect(px, py, s, s);

        // eyes — bright white like in-game
        ctx.globalAlpha = 0.7;
        const eyeY = py + 4;
        const ex = px + 3;
        ctx.fillStyle = '#fff';
        ctx.fillRect(ex, eyeY, 3, 4);
        ctx.fillRect(ex + 6, eyeY, 3, 4);
        ctx.fillStyle = '#111';
        ctx.fillRect(ex + 1, eyeY + 1, 2, 2);
        ctx.fillRect(ex + 7, eyeY + 1, 2, 2);
        ctx.globalAlpha = 1;
    },
};

// ── AMBIENT PARTICLES (Menu/UI Background) ─────────────────
const menuBgParticles = [];

function initMenuParticles() {
    if (menuBgParticles.length > 0) return;
    for (let i = 0; i < 35; i++) {
        menuBgParticles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vy: -(0.1 + Math.random() * 0.35),
            vx: (Math.random() - 0.5) * 0.15,
            size: 1 + Math.random() * 1.5,
            alpha: 0.04 + Math.random() * 0.1,
        });
    }
}

function updateMenuParticles() {
    for (const p of menuBgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
            p.y = H + 10;
            p.x = Math.random() * W;
        }
    }
}

function drawMenuBackground(frameCount) {
    rect(0, 0, W, H, '#0d0d1a');

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H * 0.38, 80, W / 2, H * 0.38, 500);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Particles
    for (const p of menuBgParticles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
    }
}

// ── GLITCH TITLE ───────────────────────────────────────────
function drawGlitchTitle(text, x, y, fontSize, frameCount) {
    ctx.font = 'bold ' + fontSize + 'px "Courier New", monospace';
    ctx.textAlign = 'center';

    const cycle = frameCount % 180;
    const glitch = cycle < 6;

    if (glitch) {
        const off = 2 + Math.random() * 3;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ff0040';
        ctx.fillText(text, x - off, y);
        ctx.fillStyle = '#00ffc8';
        ctx.fillText(text, x + off, y);
        ctx.globalAlpha = 1;

        if (cycle < 3) {
            const sliceY = y - fontSize + Math.random() * fontSize * 1.2;
            const sliceH = 2 + Math.random() * 5;
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, sliceY, W, sliceH);
            ctx.clip();
            ctx.fillStyle = '#fff';
            ctx.fillText(text, x + (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8), y);
            ctx.restore();
        }
    }

    const wobble = Math.sin(frameCount * 0.015) * 0.8;
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y + wobble);
}

// ── MENU LABELS HELPER ─────────────────────────────────────
function getMenuLabels() {
    const phases = getPhaseCount();
    let srValue, srColor;
    if (!game.speedrunMode) {
        srValue = 'OFF';
        srColor = '#777';
    } else if (game.speedrunOption <= phases) {
        srValue = 'Phase ' + game.speedrunOption;
        srColor = '#f1c40f';
    } else {
        srValue = 'HARDCORE';
        srColor = '#e74c3c';
    }

    return [
        { label: game.speedrunMode ? 'START RUN' : 'PLAY' },
        { label: 'LEVEL SELECT' },
        { label: 'SPEEDRUN', value: srValue, valueColor: srColor },
        { label: 'MULTIPLAYER', valueColor: '#3498db' },
        { label: 'SHARED LEVEL' },
        { label: 'COMMUNITY', value: (typeof COMMUNITY_LEVELS !== 'undefined' ? COMMUNITY_LEVELS.length : 0) + '', valueColor: '#f39c12' },
        { label: 'EDITOR' },
        { label: 'OPTIONS' },
    ];
}

// ============================================================
//  MAIN MENU
// ============================================================
function drawMenu(frameCount, highestUnlocked) {
    initMenuParticles();
    updateMenuParticles();
    menuChar.update();

    drawMenuBackground(frameCount);

    // ── Title ──────────────────────────────────────────
    drawGlitchTitle('OH COME ON!', W / 2, 68, 44, frameCount);

    // ── Permanent subtitle (tight below title) ────────
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('...f*ck off.', W / 2, 90);

    // ── Character + tagline reveal ─────────────────────
    menuTaglineTimer++;
    if (menuTaglineTimer > 600) {
        menuTaglineTimer = 0;
        menuTaglineIndex = (menuTaglineIndex + 1) % MENU_TAGLINES.length;
        menuChar.reset();
    }

    // Draw character at tagline level
    menuChar.draw();

    // Tagline revealed behind the character (clip to left of char X)
    const tagText = MENU_TAGLINES[menuTaglineIndex];
    ctx.font = '12px "Courier New", monospace';
    const revealX = menuChar.x - 8;

    if (revealX > 0) {
        let tagAlpha = 0.85;
        if (menuTaglineTimer > 560) tagAlpha = 0.85 * (600 - menuTaglineTimer) / 40;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, menuChar.taglineY - 15, revealX, 30);
        ctx.clip();
        ctx.globalAlpha = tagAlpha;
        ctx.fillStyle = '#bbb';
        ctx.textAlign = 'center';
        ctx.fillText(tagText, W / 2, menuChar.taglineY + 4);
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // ── Separator ──────────────────────────────────────
    const srActive = game.speedrunMode;
    ctx.strokeStyle = srActive ? 'rgba(241, 196, 15, 0.15)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 142);
    ctx.lineTo(W / 2 + 120, 142);
    ctx.stroke();

    // ── Speedrun Banner ────────────────────────────────
    if (srActive) {
        const phases = getPhaseCount();
        const isHC = game.speedrunOption > phases;
        const bannerColor = isHC ? '#e74c3c' : '#f1c40f';

        // Tinted background glow
        ctx.fillStyle = isHC ? 'rgba(231, 76, 60, 0.04)' : 'rgba(241, 196, 15, 0.03)';
        ctx.fillRect(0, 0, W, H);

        // Banner bar
        ctx.fillStyle = isHC ? 'rgba(231, 76, 60, 0.08)' : 'rgba(241, 196, 15, 0.06)';
        ctx.fillRect(W / 2 - 175, 150, 350, 26);
        ctx.strokeStyle = isHC ? 'rgba(231, 76, 60, 0.25)' : 'rgba(241, 196, 15, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(W / 2 - 175, 150, 350, 26);

        // Banner label
        const srLabel = isHC
            ? '\u2605 SPEEDRUN HARDCORE \u2605'
            : '\u2605 SPEEDRUN Phase ' + game.speedrunOption + ' \u2605';
        ctx.fillStyle = bannerColor;
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(srLabel, W / 2, 168);

        // Best time
        const pPhase = isHC ? -1 : (game.speedrunOption - 1);
        const pKey = pPhase === -1 ? 'hardcore' : 'phase_' + pPhase;
        const best = game.speedrunBestTimes[pKey];
        if (best && best < Infinity) {
            ctx.fillStyle = '#999';
            ctx.font = '12px "Courier New", monospace';
            ctx.fillText('Best: ' + best.toFixed(2) + 's', W / 2, 192);
        }
    }

    // ── Menu Items ─────────────────────────────────────
    const items = getMenuLabels();
    const startY = srActive ? 206 : 180;
    const rowH = 30;

    for (let i = 0; i < items.length; i++) {
        const y = startY + i * rowH;
        const sel = i === menuIndex;
        const item = items[i];

        if (sel) {
            // Highlight bar
            ctx.fillStyle = 'rgba(46, 204, 113, 0.06)';
            ctx.fillRect(W / 2 - 150, y - 4, 300, 24);

            // Bouncing arrow
            const bounce = Math.sin(frameCount * 0.12) * 2.5;
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('\u25B8', W / 2 - 112 + bounce, y + 12);
        }

        // Label
        ctx.textAlign = 'left';
        ctx.font = sel ? 'bold 15px "Courier New", monospace' : '14px "Courier New", monospace';
        ctx.fillStyle = sel ? '#fff' : '#888';
        ctx.fillText(item.label, W / 2 - 100, y + 12);

        // Value (right-aligned)
        if (item.value !== undefined) {
            ctx.textAlign = 'right';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillStyle = sel ? (item.valueColor || '#aaa') : '#555';
            ctx.fillText(item.value, W / 2 + 145, y + 12);
        }
    }

    // ── Bottom ─────────────────────────────────────────
    ctx.textAlign = 'center';

    // Contextual blink for PLAY
    if (menuIndex === 0) {
        const blink = Math.sin(frameCount * 0.06) > 0;
        if (blink) {
            ctx.fillStyle = '#999';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillText('Press ENTER / SPACE to play', W / 2, H - 55);
        }
    }

    ctx.fillStyle = '#666';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('\u2191\u2193 Navigate    Enter/Space Select', W / 2, H - 30);
    ctx.fillStyle = '#444';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('S Speed   G Multi   L Levels   P Shared   E Editor   O Options', W / 2, H - 14);

    // Death counter badge
    if (game.totalDeaths > 0) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('\u2620 ' + game.totalDeaths, W - 20, H - 10);
    }

    ctx.textAlign = 'left';
}

// ============================================================
//  LEVEL SELECT
// ============================================================
function drawLevelSelect(selected, highestUnlocked, frameCount) {
    initMenuParticles();
    updateMenuParticles();
    drawMenuBackground(frameCount);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL SELECT', W / 2, 38);

    // Phase Tabs
    const phases = getPhaseCount();
    if (phases > 1) {
        const tabW = 110;
        const tabGap = 8;
        const totalTabW = phases * tabW + (phases - 1) * tabGap;
        const tabStartX = (W - totalTabW) / 2;
        for (let p = 0; p < phases; p++) {
            const tx = tabStartX + p * (tabW + tabGap);
            const ty = 52;
            const isCur = p === game.selectedPhase;

            ctx.fillStyle = isCur ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255,255,255,0.03)';
            ctx.fillRect(tx, ty, tabW, 26);
            ctx.strokeStyle = isCur ? '#2ecc71' : 'rgba(255,255,255,0.08)';
            ctx.lineWidth = isCur ? 2 : 1;
            ctx.strokeRect(tx, ty, tabW, 26);
            ctx.fillStyle = isCur ? '#2ecc71' : '#999';
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.fillText('Phase ' + (p + 1), tx + tabW / 2, ty + 17);
        }
    }

    // Level Grid
    const cols = 5;
    const boxW = 110;
    const boxH = 70;
    const gap = 14;
    const totalW = cols * boxW + (cols - 1) * gap;
    const startX = (W - totalW) / 2;
    const startY = phases > 1 ? 95 : 85;

    const phaseOffset = game.selectedPhase * PHASE_SIZE;
    const phaseEnd = Math.min(phaseOffset + PHASE_SIZE, LEVELS.length);
    const phaseCount = phaseEnd - phaseOffset;

    for (let li = 0; li < phaseCount; li++) {
        const i = phaseOffset + li;
        const col = li % cols;
        const row = Math.floor(li / cols);
        const x = startX + col * (boxW + gap);
        const y = startY + row * (boxH + gap + 8);
        const unlocked = i <= highestUnlocked;
        const isSel = i === selected;

        // Box
        ctx.fillStyle = unlocked
            ? (isSel ? 'rgba(46, 204, 113, 0.08)' : 'rgba(255,255,255,0.03)')
            : 'rgba(255,255,255,0.01)';
        ctx.fillRect(x, y, boxW, boxH);

        // Border + glow
        if (isSel && unlocked) {
            ctx.save();
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, boxW, boxH);
            ctx.restore();
        } else {
            ctx.strokeStyle = unlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, boxW, boxH);
        }

        // Number
        ctx.fillStyle = unlocked ? (isSel ? '#fff' : '#bbb') : '#333';
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, x + boxW / 2, y + 30);

        // Name or lock
        ctx.font = '10px "Courier New", monospace';
        if (unlocked && LEVELS[i]) {
            ctx.fillStyle = isSel ? '#ccc' : '#888';
            ctx.fillText(LEVELS[i].name, x + boxW / 2, y + 48);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillText('\u2022 \u2022 \u2022', x + boxW / 2, y + 48);
        }

        // Completed check
        if (i < highestUnlocked) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '12px "Courier New", monospace';
            ctx.fillText('\u2713', x + boxW - 12, y + 14);
        }
    }

    // Bottom hints
    ctx.textAlign = 'center';
    ctx.fillStyle = '#777';
    ctx.font = '12px "Courier New", monospace';
    const phaseHint = phases > 1 ? '     Q/E Phase' : '';
    ctx.fillText('\u2190\u2191\u2192\u2193 Navigate     Space Start     ESC Back' + phaseHint, W / 2, H - 20);
    ctx.textAlign = 'left';
}

// ============================================================
//  COMMUNITY BROWSER
// ============================================================
function drawCommunity(selected, frameCount) {
    initMenuParticles();
    updateMenuParticles();
    drawMenuBackground(frameCount);

    const levels = (typeof COMMUNITY_LEVELS !== 'undefined') ? COMMUNITY_LEVELS : [];

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('COMMUNITY', W / 2, 60);

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#f39c12';
    ctx.fillText(levels.length + ' level' + (levels.length === 1 ? '' : 's') + ' available', W / 2, 82);

    if (levels.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '13px "Courier New", monospace';
        ctx.fillText('No community levels yet.', W / 2, H / 2);
        ctx.fillStyle = '#555';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('ESC Back', W / 2, H - 20);
        ctx.textAlign = 'left';
        return;
    }

    // List area
    const listTop = 120;
    const rowH = 60;
    const listW = 560;
    const listX = (W - listW) / 2;

    const maxVisible = 5;
    const clampedSel = Math.max(0, Math.min(levels.length - 1, selected));
    let scrollStart = Math.max(0, clampedSel - Math.floor(maxVisible / 2));
    scrollStart = Math.min(scrollStart, Math.max(0, levels.length - maxVisible));

    const visibleCount = Math.min(maxVisible, levels.length - scrollStart);

    for (let i = 0; i < visibleCount; i++) {
        const idx = scrollStart + i;
        const lvl = levels[idx];
        const y = listTop + i * rowH;
        const isSel = idx === clampedSel;

        // Card background
        ctx.fillStyle = isSel ? 'rgba(243, 156, 18, 0.14)' : 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(listX, y, listW, rowH - 8);

        // Border
        ctx.strokeStyle = isSel ? '#f39c12' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(listX, y, listW, rowH - 8);

        // Selector arrow
        if (isSel) {
            const bounce = Math.sin(frameCount * 0.12) * 2.5;
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('\u25B8', listX - 6 + bounce, y + 32);
        }

        // Name
        ctx.textAlign = 'left';
        ctx.fillStyle = isSel ? '#fff' : '#bbb';
        ctx.font = (isSel ? 'bold ' : '') + '16px "Courier New", monospace';
        ctx.fillText(lvl.name || 'Untitled', listX + 14, y + 26);

        // Author + difficulty
        ctx.fillStyle = '#f39c12';
        ctx.font = '11px "Courier New", monospace';
        const author = lvl.author ? 'by ' + lvl.author : '';
        const diff = lvl.difficulty ? ('   [' + lvl.difficulty + ']') : '';
        ctx.fillText(author + diff, listX + 14, y + 44);

        // Play hint (right side when selected)
        if (isSel) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.fillText('\u25B6 PLAY', listX + listW - 14, y + 26);
        }
    }

    // Scroll indicator
    if (levels.length > maxVisible) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#555';
        ctx.font = '10px "Courier New", monospace';
        ctx.fillText((clampedSel + 1) + ' / ' + levels.length, W / 2, listTop + maxVisible * rowH + 6);
    }

    // Bottom hints
    ctx.textAlign = 'center';
    ctx.fillStyle = '#777';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('\u2191\u2193 Navigate     Enter/Space Play     ESC Back', W / 2, H - 20);
    ctx.textAlign = 'left';
}

// ============================================================
//  HUD (in-game overlay)
// ============================================================

// ── TROLL DEATH MESSAGES ───────────────────────────────────
let hudTrollText = '';
let hudTrollTimer = 0;

const TROLL_MILESTONE_MSGS = {
    1:   ['And so it begins.', 'There it is.', 'Oh no. Anyway.', '...did you just walk into that?'],
    3:   ['Three already? You call that trying?', 'A hat trick! ...of failure.', 'Third time\'s the charm. Or not.'],
    5:   ['Five deaths? That\'s almost a warm-up.', 'You\'re a natural.', 'Five. I\'m not mad. Just disappointed.'],
    10:  ['Double digits already?', '10 deaths. I expected more honestly.', 'Welcome to double digits. It only gets worse.'],
    15:  ['15. Your keyboard is begging you to stop.', '15. And you looked so confident at the start.', '15 and counting. Emphasis on counting.'],
    20:  ['20 deaths and counting. I believe in you.', 'You\'re really getting the hang of this.', '20. Most people would\'ve quit by now. Just saying.'],
    25:  ['25. A quarter hundred. Let that sink in.', 'Silver jubilee of deaths. Congratulations.', '25. That\'s a whole speedrun for some people.'],
    30:  ['30 deaths. That\'s commitment. Wrong kind, but still.', '30. At least you\'re consistent.', '30. I\'d be worried but this is too funny.'],
    40:  ['40. Are you doing this on purpose?', '40 deaths. You\'re not getting better, you know.', '40. I\'m running out of sympathy. I never had much.'],
    50:  ['50 deaths. I\'d clap but I don\'t have hands.', 'Halfway to a hundred. Dream big.', '50. A round number for a round of applause. Almost.'],
    60:  ['60. This is your life now.', '60. I\'m starting to feel responsible. Almost.', '60 deaths. Some people finish the game in less.'],
    75:  ['75. You\'re an inspiration. To future warning labels.', '75. Three quarters of a hundred. Of deaths. Just deaths.'],
    85:  ['85. Almost a hundred. Almost.', '85. So close to triple digits. I\'m excited for you.'],
    100: ['100 deaths. Should I throw you a party?', 'Triple digits! Achievement unlocked.', '100. I honestly didn\'t think you\'d commit this hard.'],
    125: ['125. I stopped counting. Just kidding, I didn\'t.', '125. Every one of those was educational, I\'m sure.'],
    150: ['150. I\'m just rooting for you at this point. Silently.', '150. Your persistence is... something.'],
    175: ['175. I\'d say it gets easier but... yeah.', '175. You and this game clearly have unresolved issues.'],
    200: ['200 deaths. This is genuinely impressive. In the worst way.', '200. That\'s a whole career in dying.'],
    250: ['250. You\'re making history. Beautiful, tragic history.', '250. At this point the spikes know you by name.'],
    300: ['300. At this point I respect the dedication.', '300. This isn\'t a game anymore. This is a relationship.'],
    400: ['400. Are you speedrunning deaths?', '400. I think the game owes you an apology. It won\'t give one.'],
    500: ['500. I\'m genuinely impressed. And a little concerned.', '500. This is commitment on a level I can\'t comprehend.'],
    750: ['750. I don\'t even have a joke for this.', '750. You broke me. Congratulations.'],
    1000: ['1000. You win. Not the game, but... something.', '1000. I have nothing left to say. You outlasted me.'],
};

function getTrollDeathMessage(totalDeaths, quickStreak) {
    // Special: "Deaths, not levels" only if level < 10
    if (totalDeaths === 10 && typeof game !== 'undefined' && game.currentLevel < 9) {
        if (Math.random() < 0.5) return 'You hit 10. Deaths, not levels.';
    }
    if (TROLL_MILESTONE_MSGS[totalDeaths]) {
        const arr = TROLL_MILESTONE_MSGS[totalDeaths];
        return arr[Math.floor(Math.random() * arr.length)];
    }
    // Random chance between milestones (every ~15 deaths after 30)
    if (totalDeaths > 30 && totalDeaths % 15 === 0) {
        return TROLL_RANDOM_MSGS[Math.floor(Math.random() * TROLL_RANDOM_MSGS.length)];
    }
    if (quickStreak >= 4) {
        return TROLL_QUICK_MSGS[Math.floor(Math.random() * TROLL_QUICK_MSGS.length)];
    }
    return null;
}

const TROLL_RANDOM_MSGS = [
    'Still here? Respect.',
    'You know there\'s a jump button, right?',
    'I\'ve seen worse. Actually no, I haven\'t.',
    'That was almost good. Almost.',
    'Progress! ...wait, no.',
    'Your death counter called. It\'s tired.',
    'Fun fact: the exit is the green thing.',
    'Somewhere, a spike is laughing at you.',
    'You\'re really testing my patience here.',
    'I timed that. You don\'t want to know.',
    'Impressive. Not in the way you\'d hope.',
    'Keep going. I need the entertainment.',
    'I\'d offer a hint but watching this is funnier.',
    'Don\'t worry, nobody\'s watching. Except me.',
    'Gravity works. Clearly you\'ve noticed.',
    'That looked intentional. Was it intentional?',
    'Every death teaches you something. You\'ve learned a lot.',
    'Interesting strategy. Is it working?',
];

const TROLL_QUICK_MSGS = [
    'Wow, that was fast. Even for you.',
    'Speed dying: new personal best?',
    'You died faster than I could mock you.',
    'Maybe try a different approach? Just a thought.',
    'Again? Bold strategy.',
    'At this rate I can\'t keep up with the roasting.',
    'I admire the consistency, truly.',
    'Have you considered... not that?',
    'Same thing, different death. Classic you.',
    'Your respawn button needs a break.',
    'Three in a row. Going for four?',
    'You do know you can move, right?',
];

function _removedDuplicate() { return null;
}

function showHudTroll(msg) {
    hudTrollText = msg;
    hudTrollTimer = 500; // ~3.5s at 144Hz
}

function drawHUD(currentLevel, totalLevels, totalDeaths) {
    // Top gradient bar
    const grad = ctx.createLinearGradient(0, 0, 0, 44);
    grad.addColorStop(0, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 44);

    const hudY = 32;

    // Level info (center)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    if (game.sharedLevelMode) {
        ctx.fillText('Shared Level', W / 2, hudY);
    } else {
        ctx.fillText('Level ' + (currentLevel + 1) + ' / ' + totalLevels, W / 2, hudY);
    }

    // Speedrun timer (left)
    ctx.textAlign = 'left';
    if (game.speedrunMode && game.speedrunStartTime) {
        ctx.fillStyle = 'rgba(241, 196, 15, 0.9)';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText('\u23F1 ' + game.getSpeedrunElapsed().toFixed(2) + 's', 20, hudY);
    }

    // Deaths (right, bigger)
    ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('\u2620 ' + totalDeaths, W - 20, hudY);
    ctx.textAlign = 'left';

    // Troll message (center screen, prominent)
    if (hudTrollTimer > 0) {
        hudTrollTimer--;
        let alpha = 1;
        if (hudTrollTimer > 450) alpha = (500 - hudTrollTimer) / 50;
        else if (hudTrollTimer < 60) alpha = hudTrollTimer / 60;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hudTrollText, W / 2, H / 2 + 35);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }
}

// ============================================================
//  PAUSE MENU
// ============================================================
let pauseIndex = 0;
let pauseNavCooldown = 0;
function getPauseItems() {
    const inMP = typeof MP !== 'undefined' && MP.state === 'racing';
    if (inMP) return ['RESUME', 'RESTART LEVEL', 'LEAVE RACE'];
    if (typeof game !== 'undefined' && game.sharedLevelMode) {
        return ['RESUME', 'RESTART LEVEL', 'MAIN MENU'];
    }
    return ['RESUME', 'RESTART LEVEL', 'LEVEL SELECT', 'MAIN MENU'];
}

function drawPauseMenu(frameCount) {
    const items = getPauseItems();

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 80);

    // Menu items
    const startY = H / 2 - 30;
    const rowH = 32;

    for (let i = 0; i < items.length; i++) {
        const y = startY + i * rowH;
        const sel = i === pauseIndex;

        if (sel) {
            ctx.fillStyle = 'rgba(46, 204, 113, 0.08)';
            ctx.fillRect(W / 2 - 130, y - 6, 260, 24);
            const bounce = Math.sin(frameCount * 0.12) * 2.5;
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('\u25B8', W / 2 - 95 + bounce, y + 10);
        }

        ctx.textAlign = 'left';
        ctx.font = sel ? 'bold 15px "Courier New", monospace' : '14px "Courier New", monospace';
        ctx.fillStyle = sel ? '#fff' : '#888';
        ctx.fillText(items[i], W / 2 - 80, y + 10);
    }

    // Hints
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('\u2191\u2193 Navigate    Enter Select    ESC Resume', W / 2, H / 2 + 110);
    ctx.textAlign = 'left';
}

function updatePauseMenu(gameRef) {
    const items = getPauseItems();
    if (pauseNavCooldown > 0) pauseNavCooldown--;

    if (keys['ArrowUp'] && pauseNavCooldown <= 0) {
        keys['ArrowUp'] = false;
        pauseIndex = (pauseIndex - 1 + items.length) % items.length;
        pauseNavCooldown = 8;
        SFX.menuTick();
    }
    if (keys['ArrowDown'] && pauseNavCooldown <= 0) {
        keys['ArrowDown'] = false;
        pauseIndex = (pauseIndex + 1) % items.length;
        pauseNavCooldown = 8;
        SFX.menuTick();
    }
    if (keys['Enter'] || keys['Space']) {
        keys['Enter'] = false; keys['Space'] = false;
        SFX.menuSelect();
        gameRef.executePauseItem(pauseIndex);
    }
}

// ============================================================
//  LEVEL TITLE (fade-in overlay at level start)
// ============================================================
function drawLevelTitle(currentLevel, name, titleTimer) {
    const alpha = titleTimer > 30 ? 1 : titleTimer / 30;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(game.sharedLevelMode ? 'Shared Level' : 'Level ' + (currentLevel + 1), W / 2, H / 2 - 15);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#999';
    ctx.fillText(name, W / 2, H / 2 + 15);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

// ============================================================
//  LEVEL COMPLETE (brief overlay)
// ============================================================
function drawLevelComplete() {
    ctx.fillStyle = 'rgba(46, 204, 113, 0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', W / 2, H / 2);
    ctx.textAlign = 'left';
}

// ============================================================
//  WIN SCREEN
// ============================================================
function drawWinScreen(totalDeaths, winTimer, frameCount) {
    initMenuParticles();
    updateMenuParticles();
    drawMenuBackground(frameCount);

    // Celebration particles
    if (winTimer % 4 === 0) {
        spawnParticles(rand(100, 700), rand(80, 400), 2, '#f1c40f');
        spawnParticles(rand(100, 700), rand(80, 400), 1, '#2ecc71');
    }
    updateParticles();

    ctx.textAlign = 'center';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.fillText('YOU WIN!', W / 2, 140);

    ctx.fillStyle = '#2ecc71';
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText('Congratulations!', W / 2, 180);

    // Deaths
    ctx.fillStyle = '#888';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('Total Deaths: ' + totalDeaths, W / 2, 240);

    // Rating
    let rating;
    if (totalDeaths === 0) rating = 'IMPOSSIBLE... Are you cheating?';
    else if (totalDeaths < 10) rating = 'Incredible!';
    else if (totalDeaths < 25) rating = 'Very impressive!';
    else if (totalDeaths < 50) rating = 'Not bad at all!';
    else if (totalDeaths < 100) rating = 'Good effort!';
    else rating = 'The devil is pleased >:)';

    ctx.fillStyle = '#f1c40f';
    ctx.font = '15px "Courier New", monospace';
    ctx.fillText(rating, W / 2, 280);

    // Speedrun time
    if (game.speedrunMode && game.speedrunFinalTime > 0) {
        const srLabel = game.speedrunPhase === -1 ? 'Hardcore' : 'Phase ' + (game.speedrunPhase + 1);
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText('\u23F1 ' + srLabel + ': ' + game.speedrunFinalTime.toFixed(2) + 's', W / 2, 330);
        ctx.font = '13px "Courier New", monospace';
        const bestKey = game.getSpeedrunKey();
        const best = game.speedrunBestTimes[bestKey] || Infinity;
        if (best < Infinity && game.speedrunFinalTime <= best + 0.01) {
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('NEW BEST TIME!', W / 2, 355);
        } else if (best < Infinity) {
            ctx.fillStyle = '#666';
            ctx.fillText('Best: ' + best.toFixed(2) + 's', W / 2, 355);
        }
    }

    if (winTimer > 60) {
        const blink = Math.sin(frameCount * 0.06) > 0;
        if (blink) {
            ctx.fillStyle = '#888';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillText(game.sharedLevelMode ? 'Press ENTER to return to menu' : 'Press ENTER to play again', W / 2, 430);
        }
    }
    ctx.textAlign = 'left';
}

// ============================================================
//  SETTINGS — Options Menu
// ============================================================

let settingsIndex = 0;
let settingsListening = false;
let settingsListeningFor = null;
let settingsResetConfirm = false;
let settingsNavCooldown = 0;

function keyDisplayName(code) {
    if (!code) return 'DEFAULT';
    const map = {
        'ArrowLeft': '\u2190', 'ArrowRight': '\u2192', 'ArrowUp': '\u2191', 'ArrowDown': '\u2193',
        'Space': 'SPACE', 'Enter': 'ENTER', 'ShiftLeft': 'L-SHIFT', 'ShiftRight': 'R-SHIFT',
        'ControlLeft': 'L-CTRL', 'ControlRight': 'R-CTRL',
    };
    if (map[code]) return map[code];
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    return code;
}

function drawSettings(frameCount) {
    initMenuParticles();
    updateMenuParticles();
    drawMenuBackground(frameCount);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OPTIONS', W / 2, 55);

    // Separator
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 72);
    ctx.lineTo(W / 2 + 120, 72);
    ctx.stroke();

    const items = [
        { label: 'Move Left', value: keyDisplayName(SETTINGS.keys.left), type: 'key' },
        { label: 'Move Right', value: keyDisplayName(SETTINGS.keys.right), type: 'key' },
        { label: 'Jump', value: keyDisplayName(SETTINGS.keys.jump), type: 'key' },
        { label: 'Music Volume', value: SETTINGS.musicVol + '%', type: 'slider' },
        { label: 'Effects Volume', value: SETTINGS.sfxVol + '%', type: 'slider' },
        { label: 'Troll Messages', value: SETTINGS.trollMessages ? 'ON' : 'OFF', type: 'toggle' },
        { label: 'Sound', value: SFX.muted ? 'OFF' : 'ON', type: 'toggleSound' },
        { label: 'Reset All Data', value: '', type: 'action' },
    ];

    const startY = 95;
    const rowH = 46;

    for (let i = 0; i < items.length; i++) {
        const y = startY + i * rowH;
        const sel = i === settingsIndex;
        const item = items[i];

        // Row background
        ctx.fillStyle = sel ? 'rgba(46, 204, 113, 0.06)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(W / 2 - 280, y, 560, 38);
        if (sel) {
            ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(W / 2 - 280, y, 560, 38);
        }

        // Label
        ctx.fillStyle = sel ? '#fff' : '#aaa';
        ctx.font = '15px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, W / 2 - 260, y + 24);

        // Value
        ctx.textAlign = 'right';
        if (item.type === 'key' && settingsListening && settingsListeningFor === ['left', 'right', 'jump'][i]) {
            const blink = Math.sin(frameCount * 0.1) > 0;
            ctx.fillStyle = blink ? '#f1c40f' : '#444';
            ctx.fillText('Press a key...', W / 2 + 260, y + 24);
        } else if (item.type === 'slider') {
            const barX = W / 2 + 50;
            const barW = 180;
            const barY = y + 12;
            const barH = 10;
            const vol = i === 3 ? SETTINGS.musicVol : SETTINGS.sfxVol;

            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = sel ? '#2ecc71' : '#444';
            ctx.fillRect(barX, barY, barW * (vol / 100), barH);
            ctx.fillStyle = sel ? '#fff' : '#aaa';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillText(vol + '%', barX - 10, y + 24);
        } else if (item.type === 'toggle') {
            ctx.fillStyle = sel ? (SETTINGS.trollMessages ? '#2ecc71' : '#e74c3c') : '#888';
            ctx.font = '15px "Courier New", monospace';
            ctx.fillText(item.value, W / 2 + 260, y + 24);
        } else if (item.type === 'toggleSound') {
            ctx.fillStyle = sel ? (SFX.muted ? '#e74c3c' : '#2ecc71') : '#888';
            ctx.font = '15px "Courier New", monospace';
            ctx.fillText(item.value, W / 2 + 260, y + 24);
        } else if (item.type === 'action' && settingsResetConfirm && sel) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 13px "Courier New", monospace';
            ctx.fillText('Are you sure? [ENTER]', W / 2 + 260, y + 24);
        } else {
            ctx.fillStyle = sel ? '#2ecc71' : '#888';
            ctx.font = '15px "Courier New", monospace';
            ctx.fillText(item.value, W / 2 + 260, y + 24);
        }
    }

    // Bottom hints
    ctx.textAlign = 'center';
    ctx.fillStyle = '#777';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('\u2191\u2193 Navigate    ENTER Select    \u2190\u2192 Volume    ESC Back', W / 2, H - 25);
    ctx.fillStyle = '#555';
    ctx.fillText('DEL / BACKSPACE  \u2014  Reset Key to Default', W / 2, H - 8);
    ctx.textAlign = 'left';
}

function updateSettings() {
    if (settingsNavCooldown > 0) settingsNavCooldown--;

    if (settingsListening) return;

    if (keys['Escape']) {
        keys['Escape'] = false;
        settingsResetConfirm = false;
        game.state = 'menu';
        return;
    }

    if ((keys['ArrowUp'] || keys['KeyW']) && settingsNavCooldown <= 0) {
        keys['ArrowUp'] = false; keys['KeyW'] = false;
        settingsIndex = Math.max(0, settingsIndex - 1);
        settingsResetConfirm = false;
        settingsNavCooldown = 8;
    }
    if ((keys['ArrowDown'] || keys['KeyS']) && settingsNavCooldown <= 0) {
        keys['ArrowDown'] = false; keys['KeyS'] = false;
        settingsIndex = Math.min(7, settingsIndex + 1);
        settingsResetConfirm = false;
        settingsNavCooldown = 8;
    }

    if (settingsIndex <= 2 && keys['Enter']) {
        keys['Enter'] = false;
        const bindFor = ['left', 'right', 'jump'][settingsIndex];
        settingsListening = true;
        settingsListeningFor = bindFor;

        const captureKey = (e) => {
            e.preventDefault();
            if (e.code === 'Escape') {
                settingsListening = false;
                settingsListeningFor = null;
                window.removeEventListener('keydown', captureKey, true);
                return;
            }
            if (e.code === 'Delete' || e.code === 'Backspace') {
                SETTINGS.keys[bindFor] = null;
            } else {
                SETTINGS.keys[bindFor] = e.code;
            }
            SETTINGS.save();
            settingsListening = false;
            settingsListeningFor = null;
            window.removeEventListener('keydown', captureKey, true);
        };
        window.addEventListener('keydown', captureKey, true);
    }

    if (settingsIndex === 3 || settingsIndex === 4) {
        const prop = settingsIndex === 3 ? 'musicVol' : 'sfxVol';
        if (keys['ArrowLeft'] || keys['KeyA']) {
            keys['ArrowLeft'] = false; keys['KeyA'] = false;
            SETTINGS[prop] = Math.max(0, SETTINGS[prop] - 5);
            SFX[prop] = SETTINGS[prop];
            SFX.applyVolumes();
            SETTINGS.save();
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            keys['ArrowRight'] = false; keys['KeyD'] = false;
            SETTINGS[prop] = Math.min(100, SETTINGS[prop] + 5);
            SFX[prop] = SETTINGS[prop];
            SFX.applyVolumes();
            SETTINGS.save();
        }
    }

    // Troll Messages Toggle (Index 5)
    if (settingsIndex === 5 && keys['Enter']) {
        keys['Enter'] = false;
        SETTINGS.trollMessages = !SETTINGS.trollMessages;
        SETTINGS.save();
    }

    // Sound Toggle (Index 6)
    if (settingsIndex === 6 && keys['Enter']) {
        keys['Enter'] = false;
        SFX.setMuted(!SFX.muted);
    }

    // Reset All Data (Index 7)
    if (settingsIndex === 7 && keys['Enter']) {
        keys['Enter'] = false;
        if (settingsResetConfirm) {
            localStorage.removeItem('ohcomeon_progress');
            localStorage.removeItem('ohcomeon_best');
            localStorage.removeItem('ohcomeon_bests');
            localStorage.removeItem('ohcomeon_settings');
            SETTINGS.keys = { left: null, right: null, jump: null };
            SETTINGS.musicVol = 100;
            SETTINGS.sfxVol = 100;
            SETTINGS.trollMessages = true;
            SFX.musicVol = 100;
            SFX.sfxVol = 100;
            SFX.applyVolumes();
            settingsResetConfirm = false;
            game.init();
            game.state = 'menu';
        } else {
            settingsResetConfirm = true;
        }
    }
}
