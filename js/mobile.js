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

    // Show touch controls
    touchControls.classList.add('active');

    // Prevent default touch behaviors (scrolling, zoom)
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    // ── RESPONSIVE CANVAS ─────────────────────────────────
    function resizeCanvas() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const ratio = 800 / 500;
        const controlsHeight = 140;
        const availH = vh - controlsHeight;

        let w, h;
        if (vw / availH > ratio) {
            h = availH;
            w = h * ratio;
        } else {
            w = vw;
            h = w / ratio;
        }

        gameCanvas.style.width = w + 'px';
        gameCanvas.style.height = h + 'px';
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

    // ── TOUCH INPUT ───────────────────────────────────────
    // Simulate keyboard keys via the global `keys` object from engine.js

    function touchStart(keyCode, btn) {
        return function(e) {
            e.preventDefault();
            keys[keyCode] = true;
            btn.classList.add('pressed');
        };
    }

    function touchEnd(keyCode, btn) {
        return function(e) {
            e.preventDefault();
            keys[keyCode] = false;
            btn.classList.remove('pressed');
        };
    }

    // Left button
    btnLeft.addEventListener('touchstart', touchStart('ArrowLeft', btnLeft), { passive: false });
    btnLeft.addEventListener('touchend', touchEnd('ArrowLeft', btnLeft), { passive: false });
    btnLeft.addEventListener('touchcancel', touchEnd('ArrowLeft', btnLeft), { passive: false });

    // Right button
    btnRight.addEventListener('touchstart', touchStart('ArrowRight', btnRight), { passive: false });
    btnRight.addEventListener('touchend', touchEnd('ArrowRight', btnRight), { passive: false });
    btnRight.addEventListener('touchcancel', touchEnd('ArrowRight', btnRight), { passive: false });

    // Jump button
    btnJump.addEventListener('touchstart', touchStart('ArrowUp', btnJump), { passive: false });
    btnJump.addEventListener('touchend', touchEnd('ArrowUp', btnJump), { passive: false });
    btnJump.addEventListener('touchcancel', touchEnd('ArrowUp', btnJump), { passive: false });

    // ── MENU TOUCH SUPPORT ────────────────────────────────
    // Canvas tap = Enter/Space for menu navigation
    gameCanvas.addEventListener('touchstart', (e) => {
        // Only simulate Enter when NOT playing (menu, win screen, etc.)
        if (typeof gameState !== 'undefined' && gameState !== 'playing') {
            keys['Enter'] = true;
            setTimeout(() => { keys['Enter'] = false; }, 100);
        }
    }, { passive: true });

})();
