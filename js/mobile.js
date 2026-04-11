// ================================================================
//  MOBILE SUPPORT — Detection, Touch Controls, Responsive Canvas
// ================================================================

const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || ('ontouchstart' in window && window.innerWidth < 1024);

(function initMobile() {
    if (!isMobile) return;

    const gameCanvas = document.getElementById('gameCanvas');
    const touchControls = document.getElementById('touchControls');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnJump = document.getElementById('btnJump');

    if (!touchControls || !btnLeft || !btnRight || !btnJump) return;

    // Mark body so the mobile CSS overrides kick in (canvas → full viewport)
    document.body.classList.add('is-mobile');

    // Prevent multi-touch pinch-zoom on the body
    document.addEventListener('touchmove', e => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // ── TOUCH BUTTON INPUT ────────────────────────────────
    // Simulate keyboard keys via the global `keys` object from engine.js
    function bindButton(btn, keyCode) {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyCode] = true;
            btn.classList.add('pressed');
        }, { passive: false });
        const release = (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyCode] = false;
            btn.classList.remove('pressed');
        };
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
    }

    bindButton(btnLeft, 'ArrowLeft');
    bindButton(btnRight, 'ArrowRight');
    bindButton(btnJump, 'ArrowUp');

    // ── TOUCH CONTROLS VISIBILITY ─────────────────────────
    // Only show the in-game buttons while actually playing.
    // In menu / browser / settings, the canvas receives taps directly.
    function updateTouchControlsVisibility() {
        if (typeof game === 'undefined' || !game) return;
        const s = game.state;
        const show = (s === 'playing' || s === 'dead' || s === 'paused');
        if (show) touchControls.classList.add('active');
        else touchControls.classList.remove('active');
    }
    setInterval(updateTouchControlsVisibility, 100);

    // ── MENU / BROWSER TAP HANDLING ───────────────────────
    // Maps a touch event to canvas-space (800x500) coordinates.
    function touchToCanvasPoint(touch) {
        const rect = gameCanvas.getBoundingClientRect();
        return {
            x: (touch.clientX - rect.left) / rect.width * 800,
            y: (touch.clientY - rect.top) / rect.height * 500,
        };
    }

    function pressEnter() {
        keys['Enter'] = true;
        setTimeout(() => { keys['Enter'] = false; }, 120);
    }

    function pressEscape() {
        keys['Escape'] = true;
        setTimeout(() => { keys['Escape'] = false; }, 120);
    }

    // Main Menu hit test — returns hit index or -1
    function hitTestMainMenu(y) {
        const srActive = (typeof game !== 'undefined') && game.speedrunMode;
        const startY = srActive ? 206 : 180;
        const rowH = 30;
        const count = (typeof MENU_ITEM_COUNT !== 'undefined') ? MENU_ITEM_COUNT : 8;
        for (let i = 0; i < count; i++) {
            const itemY = startY + i * rowH;
            if (y >= itemY - 8 && y <= itemY + 24) return i;
        }
        return -1;
    }

    // Community browser hit test
    function hitTestCommunity(y) {
        const listTop = 120;
        const rowH = 60;
        const maxVisible = 5;
        for (let i = 0; i < maxVisible; i++) {
            const itemY = listTop + i * rowH;
            if (y >= itemY && y <= itemY + (rowH - 8)) return i;
        }
        return -1;
    }

    // Pause menu hit test
    function hitTestPauseMenu(y) {
        const startY = 500 / 2 - 30;
        const rowH = 32;
        // Up to 4 items
        for (let i = 0; i < 4; i++) {
            const itemY = startY + i * rowH;
            if (y >= itemY - 6 && y <= itemY + 24) return i;
        }
        return -1;
    }

    gameCanvas.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;

        // Two-finger tap = ESC back
        if (e.touches.length >= 2) {
            pressEscape();
            return;
        }

        const state = (typeof game !== 'undefined') ? game.state : null;

        // During active gameplay, taps on the canvas background do nothing —
        // movement is handled by the three dedicated touch buttons.
        if (state === 'playing' || state === 'dead') return;

        const pt = touchToCanvasPoint(e.touches[0]);

        if (state === 'menu') {
            const hit = hitTestMainMenu(pt.y);
            if (hit >= 0) {
                if (typeof menuIndex !== 'undefined') menuIndex = hit;
                pressEnter();
            }
            return;
        }

        if (state === 'community') {
            const hit = hitTestCommunity(pt.y);
            if (hit >= 0 && typeof COMMUNITY_LEVELS !== 'undefined') {
                const count = COMMUNITY_LEVELS.length;
                if (count > 0) {
                    const sel = game.selectedCommunityLevel || 0;
                    const maxVisible = 5;
                    let scrollStart = Math.max(0, sel - Math.floor(maxVisible / 2));
                    scrollStart = Math.min(scrollStart, Math.max(0, count - maxVisible));
                    const targetIndex = scrollStart + hit;
                    if (targetIndex < count) {
                        game.selectedCommunityLevel = targetIndex;
                        pressEnter();
                    }
                }
            }
            return;
        }

        if (state === 'paused') {
            const hit = hitTestPauseMenu(pt.y);
            if (hit >= 0 && typeof pauseIndex !== 'undefined') {
                pauseIndex = hit;
                pressEnter();
            }
            return;
        }

        // Win screen / lobby / settings / levelSelect — fallback: tap = Enter
        if (state === 'win' || state === 'settings' || state === 'levelSelect' || state === 'lobby') {
            pressEnter();
            return;
        }
    }, { passive: true });

})();
