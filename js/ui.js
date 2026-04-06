// ============================================================
//  UI — Menu, Level Select, HUD, Win Screen
// ============================================================

function drawMenu(frameCount, highestUnlocked) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OH COME ON!', W / 2, 120);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('...f*ck off.', W / 2, 155);

    ctx.fillStyle = '#666';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Nothing is what it seems...', W / 2, 180);

    // Speedrun-Status
    if (game.speedrunMode) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 18px "Courier New", monospace';
        const phases = getPhaseCount();
        let srLabel;
        if (game.speedrunOption <= phases) {
            srLabel = '\u2605 SPEEDRUN Phase ' + game.speedrunOption + ' \u2605';
        } else {
            srLabel = '\u2605 SPEEDRUN HARDCORE \u2605';
        }
        ctx.fillText(srLabel, W / 2, 225);
        // Best-Time für aktuelle Auswahl
        const previewPhase = game.speedrunOption <= phases ? (game.speedrunOption - 1) : -1;
        const previewKey = previewPhase === -1 ? 'hardcore' : 'phase_' + previewPhase;
        const best = game.speedrunBestTimes[previewKey];
        if (best && best < Infinity) {
            ctx.fillStyle = '#888';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillText('Best: ' + best.toFixed(2) + 's', W / 2, 245);
        }
    } else {
        ctx.fillStyle = '#444';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('Speedrun: OFF', W / 2, 225);
    }

    const blink = Math.sin(frameCount * 0.06) > 0;
    if (blink) {
        ctx.fillStyle = '#aaa';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText('Press SPACE to play', W / 2, 290);
    }

    // Kompakte Menü-Optionen als Zeilen
    const menuItems = [
        { key: 'S', label: 'Speedrun', active: game.speedrunMode },
        { key: 'L', label: 'Level Select' },
        { key: 'E', label: 'Level Editor' },
        { key: 'O', label: 'Options' },
        { key: 'M', label: 'Sound ' + (SFX.muted ? 'OFF' : 'ON') },
    ];

    const menuStartY = 340;
    const menuRowH = 30;
    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        const y = menuStartY + i * menuRowH;

        // Taste
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText('[' + item.key + ']', W / 2 - 80, y);

        // Label
        ctx.fillStyle = item.active ? '#f1c40f' : '#888';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, W / 2 - 40, y);
        ctx.textAlign = 'center';
    }

    ctx.font = '50px serif';
    ctx.fillText('>:)', W / 2, 488);
    ctx.textAlign = 'left';
}

function drawLevelSelect(selected, highestUnlocked, frameCount) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL SELECT', W / 2, 40);

    // Phase Tabs
    const phases = getPhaseCount();
    if (phases > 1) {
        const tabW = 120;
        const tabGap = 10;
        const totalTabW = phases * tabW + (phases - 1) * tabGap;
        const tabStartX = (W - totalTabW) / 2;
        for (let p = 0; p < phases; p++) {
            const tx = tabStartX + p * (tabW + tabGap);
            const ty = 55;
            const isCur = p === game.selectedPhase;
            ctx.fillStyle = isCur ? '#3a3a7a' : '#1a1a2e';
            ctx.fillRect(tx, ty, tabW, 28);
            ctx.strokeStyle = isCur ? '#2ecc71' : '#333';
            ctx.lineWidth = isCur ? 2 : 1;
            ctx.strokeRect(tx, ty, tabW, 28);
            ctx.fillStyle = isCur ? '#2ecc71' : '#666';
            ctx.font = 'bold 13px "Courier New", monospace';
            ctx.fillText('Phase ' + (p + 1), tx + tabW / 2, ty + 19);
        }
    }

    const cols = 5;
    const boxW = 110;
    const boxH = 75;
    const gap = 15;
    const totalW = cols * boxW + (cols - 1) * gap;
    const startX = (W - totalW) / 2;
    const startY = phases > 1 ? 100 : 90;

    const phaseOffset = game.selectedPhase * PHASE_SIZE;
    const phaseEnd = Math.min(phaseOffset + PHASE_SIZE, LEVELS.length);
    const phaseCount = phaseEnd - phaseOffset;

    for (let li = 0; li < phaseCount; li++) {
        const i = phaseOffset + li;
        const col = li % cols;
        const row = Math.floor(li / cols);
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
        if (unlocked && LEVELS[i]) {
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
    const phaseHint = phases > 1 ? '     Q/E — Phase' : '';
    ctx.fillText('Pfeiltasten — Navigieren     Space — Starten     ESC — Zurück' + phaseHint, W / 2, H - 25);
    ctx.textAlign = 'left';
}

function drawHUD(currentLevel, totalLevels, totalDeaths) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText(`Level ${currentLevel + 1} / ${totalLevels}`, 20, 25);

    ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
    ctx.fillText(`Deaths: ${totalDeaths}`, W - 130, 25);

    // Speedrun Timer (wenn aktiv)
    if (game.speedrunMode && game.speedrunStartTime) {
        ctx.fillStyle = 'rgba(241, 196, 15, 0.9)';
        ctx.font = 'bold 15px "Courier New", monospace';
        ctx.fillText(`⏱ ${game.getSpeedrunElapsed().toFixed(2)}s`, W / 2 - 45, 25);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('[L] Level Select', W / 2 - 45, 25);
    }
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

    // Speedrun Finale Zeit
    if (game.speedrunMode && game.speedrunFinalTime > 0) {
        const srLabel = game.speedrunPhase === -1 ? 'Hardcore' : 'Phase ' + (game.speedrunPhase + 1);
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillText('\u23F1 ' + srLabel + ': ' + game.speedrunFinalTime.toFixed(2) + 's', W / 2, 360);
        ctx.font = '14px "Courier New", monospace';
        const bestKey = game.getSpeedrunKey();
        const best = game.speedrunBestTimes[bestKey] || Infinity;
        if (best < Infinity && game.speedrunFinalTime <= best + 0.01) {
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('NEW BEST TIME!', W / 2, 385);
        } else if (best < Infinity) {
            ctx.fillStyle = '#888';
            ctx.fillText('Best: ' + best.toFixed(2) + 's', W / 2, 385);
        }
    }

    if (winTimer > 60) {
        const blink = Math.sin(frameCount * 0.06) > 0;
        if (blink) {
            ctx.fillStyle = '#555';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText('Press ENTER to play again', W / 2, 430);
        }
    }
    ctx.textAlign = 'left';
}

// ============================================================
//  SETTINGS — Options Menu
// ============================================================

let settingsIndex = 0;
let settingsListening = false;
let settingsListeningFor = null; // 'left'|'right'|'jump'
let settingsResetConfirm = false;
let settingsNavCooldown = 0;

// Zeigt einen lesbaren Key-Namen an
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
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SETTINGS', W / 2, 60);

    const items = [
        { label: 'Move Left', value: keyDisplayName(SETTINGS.keys.left), type: 'key' },
        { label: 'Move Right', value: keyDisplayName(SETTINGS.keys.right), type: 'key' },
        { label: 'Jump', value: keyDisplayName(SETTINGS.keys.jump), type: 'key' },
        { label: 'Music Volume', value: SETTINGS.musicVol + '%', type: 'slider' },
        { label: 'Effects Volume', value: SETTINGS.sfxVol + '%', type: 'slider' },
        { label: 'Reset All Data', value: '', type: 'action' },
    ];

    const startY = 110;
    const rowH = 52;

    for (let i = 0; i < items.length; i++) {
        const y = startY + i * rowH;
        const sel = i === settingsIndex;
        const item = items[i];

        // Hintergrund
        ctx.fillStyle = sel ? '#3a3a7a' : '#2a2a4a';
        ctx.fillRect(W / 2 - 280, y, 560, 40);

        // Rand
        if (sel) {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            ctx.strokeRect(W / 2 - 280, y, 560, 40);
        }

        // Label
        ctx.fillStyle = sel ? '#fff' : '#aaa';
        ctx.font = '16px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, W / 2 - 260, y + 26);

        // Value
        ctx.textAlign = 'right';
        if (item.type === 'key' && settingsListening && settingsListeningFor === ['left', 'right', 'jump'][i]) {
            const blink = Math.sin(frameCount * 0.1) > 0;
            ctx.fillStyle = blink ? '#f1c40f' : '#555';
            ctx.fillText('Press a key...', W / 2 + 260, y + 26);
        } else if (item.type === 'slider') {
            // Slider-Balken
            const barX = W / 2 + 50;
            const barW = 180;
            const barY = y + 14;
            const barH = 12;
            const vol = i === 3 ? SETTINGS.musicVol : SETTINGS.sfxVol;
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = sel ? '#2ecc71' : '#555';
            ctx.fillRect(barX, barY, barW * (vol / 100), barH);
            ctx.fillStyle = sel ? '#fff' : '#aaa';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText(vol + '%', barX - 10, y + 26);
        } else if (item.type === 'action' && settingsResetConfirm && sel) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.fillText('Are you sure? [ENTER]', W / 2 + 260, y + 26);
        } else {
            ctx.fillStyle = sel ? '#2ecc71' : '#888';
            ctx.font = '16px "Courier New", monospace';
            ctx.fillText(item.value, W / 2 + 260, y + 26);
        }
    }

    // Hinweise
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('\u2191\u2193 Navigate    ENTER Select    \u2190\u2192 Adjust Volume    ESC Back', W / 2, H - 25);
    ctx.fillText('DEL / BACKSPACE  —  Reset Key to Default', W / 2, H - 8);
    ctx.textAlign = 'left';
}

function updateSettings() {
    if (settingsNavCooldown > 0) settingsNavCooldown--;

    // Listening-Modus: Warte auf Tastendruck
    if (settingsListening) return;

    // ESC = zurück
    if (keys['Escape']) {
        keys['Escape'] = false;
        settingsResetConfirm = false;
        game.state = 'menu';
        return;
    }

    // Navigation
    if ((keys['ArrowUp'] || keys['KeyW']) && settingsNavCooldown <= 0) {
        keys['ArrowUp'] = false; keys['KeyW'] = false;
        settingsIndex = Math.max(0, settingsIndex - 1);
        settingsResetConfirm = false;
        settingsNavCooldown = 8;
    }
    if ((keys['ArrowDown'] || keys['KeyS']) && settingsNavCooldown <= 0) {
        keys['ArrowDown'] = false; keys['KeyS'] = false;
        settingsIndex = Math.min(5, settingsIndex + 1);
        settingsResetConfirm = false;
        settingsNavCooldown = 8;
    }

    // Keybinding (Index 0-2)
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

    // Volume Slider (Index 3 = Music, 4 = Effects)
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

    // Complete Reset (Index 5)
    if (settingsIndex === 5 && keys['Enter']) {
        keys['Enter'] = false;
        if (settingsResetConfirm) {
            localStorage.removeItem('ohcomeon_progress');
            localStorage.removeItem('ohcomeon_best');
            localStorage.removeItem('ohcomeon_bests');
            localStorage.removeItem('ohcomeon_settings');
            SETTINGS.keys = { left: null, right: null, jump: null };
            SETTINGS.musicVol = 100;
            SETTINGS.sfxVol = 100;
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
