// ============================================================
//  UI — Menu, Level Select, HUD, Win Screen
// ============================================================

function drawMenu(frameCount, highestUnlocked) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OH COME ON!', W / 2, 150);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('...f*ck off.', W / 2, 185);

    ctx.fillStyle = '#666';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Nothing is what it seems...', W / 2, 210);

    const blink = Math.sin(frameCount * 0.06) > 0;
    if (blink) {
        ctx.fillStyle = '#aaa';
        ctx.font = '20px "Courier New", monospace';
        if (highestUnlocked > 0) {
            ctx.fillText('Press SPACE for Level Select', W / 2, 300);
        } else {
            ctx.fillText('Press SPACE to play', W / 2, 300);
        }
    }

    ctx.fillStyle = '#555';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Arrow Keys / WASD  —  Move & Jump', W / 2, 365);
    ctx.fillText('R  —  Restart Level', W / 2, 386);
    ctx.fillText('L  —  Level Select', W / 2, 407);
    ctx.fillText('M  —  Sound ' + (SFX.muted ? 'OFF' : 'ON'), W / 2, 428);

    ctx.font = '60px serif';
    ctx.fillText('>:)', W / 2, 470);
    ctx.textAlign = 'left';
}

function drawLevelSelect(selected, highestUnlocked, frameCount) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL SELECT', W / 2, 55);

    const cols = 5;
    const boxW = 110;
    const boxH = 75;
    const gap = 15;
    const totalW = cols * boxW + (cols - 1) * gap;
    const startX = (W - totalW) / 2;
    const startY = 90;

    for (let i = 0; i < LEVELS.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxW + gap);
        const y = startY + row * (boxH + gap + 10);
        const unlocked = i <= highestUnlocked;
        const isSel = i === selected;

        // Box
        ctx.fillStyle = unlocked
            ? (isSel ? '#3a3a7a' : '#2a2a4a')
            : '#151520';
        ctx.fillRect(x, y, boxW, boxH);

        // Rand
        if (isSel && unlocked) {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = unlocked ? '#555' : '#252530';
            ctx.lineWidth = 1;
        }
        ctx.strokeRect(x, y, boxW, boxH);

        // Nummer
        ctx.fillStyle = unlocked ? '#fff' : '#333';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, x + boxW / 2, y + 32);

        // Name oder Lock
        ctx.font = '11px "Courier New", monospace';
        if (unlocked) {
            ctx.fillStyle = '#999';
            ctx.fillText(LEVELS[i].name, x + boxW / 2, y + 52);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillText('- - -', x + boxW / 2, y + 52);
        }

        // Completed check
        if (i < highestUnlocked) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText('\u2713', x + boxW - 15, y + 15);
        }
    }

    // Hinweis unten
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('Pfeiltasten — Navigieren     Space — Starten     ESC — Zurück', W / 2, H - 25);
    ctx.textAlign = 'left';
}

function drawHUD(currentLevel, totalLevels, totalDeaths) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText(`Level ${currentLevel + 1} / ${totalLevels}`, 20, 25);

    ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
    ctx.fillText(`Deaths: ${totalDeaths}`, W - 130, 25);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('[L] Level Select', W / 2 - 45, 25);
}

function drawLevelTitle(currentLevel, name, titleTimer) {
    const alpha = titleTimer > 30 ? 1 : titleTimer / 30;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${currentLevel + 1}`, W / 2, H / 2 - 20);
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(name, W / 2, H / 2 + 15);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

function drawLevelComplete() {
    rect(0, 0, W, H, 'rgba(46, 204, 113, 0.1)');
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', W / 2, H / 2);
    ctx.textAlign = 'left';
}

function drawWinScreen(totalDeaths, winTimer, frameCount) {
    if (winTimer % 5 === 0) {
        spawnParticles(rand(100, 700), rand(100, 400), 3, '#f1c40f');
    }
    updateParticles();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', W / 2, 160);

    ctx.fillStyle = '#2ecc71';
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText('Congratulations!', W / 2, 210);

    ctx.fillStyle = '#aaa';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText(`Total Deaths: ${totalDeaths}`, W / 2, 280);

    let rating;
    if (totalDeaths === 0) rating = 'IMPOSSIBLE... Are you cheating?';
    else if (totalDeaths < 10) rating = 'Incredible!';
    else if (totalDeaths < 25) rating = 'Very impressive!';
    else if (totalDeaths < 50) rating = 'Not bad at all!';
    else if (totalDeaths < 100) rating = 'Good effort!';
    else rating = 'The devil is pleased >:)';

    ctx.fillStyle = '#f1c40f';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText(rating, W / 2, 320);

    if (winTimer > 60) {
        const blink = Math.sin(frameCount * 0.06) > 0;
        if (blink) {
            ctx.fillStyle = '#555';
            ctx.font = '16px "Courier New", monospace';
            ctx.fillText('Press ENTER to play again', W / 2, 400);
        }
    }
    ctx.textAlign = 'left';
}
