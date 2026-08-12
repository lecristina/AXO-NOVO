/* nav.js — COMPORTAMENTO do cabeçalho (menu mobile, efeito de scroll, cosmos).
 *
 * O MARKUP do cabeçalho é HTML estático, presente direto em cada página. Antes
 * ele era injetado aqui por JavaScript, e o resultado é que crawlers que não
 * executam JS (GPTBot, ClaudeBot, PerplexityBot) não enxergavam nenhum link do
 * menu principal — descobriam as páginas internas só pelo sitemap, sem texto
 * âncora nem hierarquia.
 *
 * Fonte de verdade do markup: scripts/build-nav.js  (npm run nav:build)
 * Não adicione markup de cabeçalho aqui — ele não apareceria em página nenhuma.
 *
 * As páginas continuam definindo window.AXO_CONFIG antes de carregar este
 * arquivo, porque navMode controla o comportamento de scroll:
 *   'transparent' → vira branco ao rolar
 *   'white'       → sempre branco, sem efeito
 *   'dark'        → escurece ao rolar
 *   'cosmos'      → escurece e liga o canvas de estrelas
 */
(function () {
    'use strict';

    var cfg = window.AXO_CONFIG || {};
    var navMode = cfg.navMode || 'transparent';

    var isWhite  = navMode === 'white';
    var isDark   = navMode === 'dark';
    var isCosmos = navMode === 'cosmos';

    /* ── Mobile menu ── */
    var menuBtn     = document.getElementById('menu-btn');
    var menuClose   = document.getElementById('menu-close');
    var menuOverlay = document.getElementById('menu-overlay');
    var mobilePanel = document.getElementById('mobile-panel');

    function openMenu() {
        if (!mobilePanel || !menuOverlay) return;
        mobilePanel.style.transform = 'translateX(0)';
        menuOverlay.style.opacity = '1';
        menuOverlay.style.pointerEvents = 'auto';
        document.body.style.overflow = 'hidden';
        var wb = document.getElementById('wa-float-btn');
        if (wb) { wb.style.transform = 'scale(0)'; wb.style.opacity = '0'; wb.style.pointerEvents = 'none'; }
    }
    function closeMenu() {
        if (!mobilePanel || !menuOverlay) return;
        mobilePanel.style.transform = 'translateX(100%)';
        menuOverlay.style.opacity = '0';
        menuOverlay.style.pointerEvents = 'none';
        document.body.style.overflow = '';
        var wb = document.getElementById('wa-float-btn');
        if (wb) { wb.style.transform = ''; wb.style.opacity = ''; wb.style.pointerEvents = ''; }
    }

    if (menuBtn)     menuBtn.addEventListener('click', openMenu);
    if (menuClose)   menuClose.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    if (mobilePanel) {
        mobilePanel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    }

    /* ── Scroll behaviour ── */
    var navbar   = document.getElementById('navbar');
    var navLinks = navbar ? navbar.querySelectorAll('.nav-link') : [];
    var brandEl  = document.getElementById('axo-brand');
    var btnEl    = document.getElementById('menu-btn');

    if (!navbar || isWhite) return; /* white: always styled, nothing to do */

    if (isCosmos) { initCosmosScroll(); return; }

    /* default transparent → white  OR  dark → deep-dark on scroll */
    function updateNav() {
        if (window.scrollY > 80) {
            if (isDark) {
                navbar.style.background      = 'rgba(5,0,15,0.96)';
                navbar.style.backdropFilter  = 'blur(24px)';
                navbar.style.borderBottom    = '1px solid rgba(255,255,255,0.06)';
                navbar.style.boxShadow       = '0 4px 30px rgba(0,0,0,0.5)';
            } else {
                navbar.style.background      = 'rgba(255,255,255,0.94)';
                navbar.style.backdropFilter  = 'blur(20px)';
                navbar.style.borderBottom    = '1px solid rgba(0,0,0,0.07)';
                navbar.style.boxShadow       = '0 4px 30px rgba(0,0,0,0.08)';
                navLinks.forEach(function (l) {
                    if (!l.classList.contains('text-primary')) l.style.color = 'rgba(0,0,0,0.7)';
                });
                if (brandEl) brandEl.style.color = '#111';
                if (btnEl)   btnEl.style.color   = '#374151';
            }
        } else {
            navbar.style.background     = 'transparent';
            navbar.style.backdropFilter = 'none';
            navbar.style.borderBottom   = 'none';
            navbar.style.boxShadow      = 'none';
            navLinks.forEach(function (l) { l.style.color = ''; });
            if (brandEl) brandEl.style.color = '';
            if (btnEl)   btnEl.style.color   = '';
        }
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    /* ── Cosmos starry navbar ── */
    function initCosmosScroll() {
        var canvas = document.getElementById('navbar-stars');
        var ctx    = canvas ? canvas.getContext('2d') : null;
        var stars  = [];
        var shoots = [];
        var active      = false;
        var raf         = null;
        var canvasReady = false;
        var resize, drawFrame;

        if (ctx) {
            resize = function() {
                canvas.width  = window.innerWidth;
                canvas.height = 80;
            };
            var _resizeTimer = null;
            window.addEventListener('resize', function() {
                clearTimeout(_resizeTimer);
                _resizeTimer = setTimeout(resize, 150);
            }, { passive: true });
            /* No eager resize() — canvas is sized just-in-time on first cosmos activation */

            for (var i = 0; i < 140; i++) {
                stars.push({
                    x: Math.random(), y: Math.random(),
                    r: Math.random() * 1.5 + 0.2,
                    tw: Math.random() * Math.PI * 2,
                    twS: Math.random() * 0.03 + 0.007
                });
            }

            drawFrame = function() {
                if (!active) return;
                var w = canvas.width, h = canvas.height;
                ctx.clearRect(0, 0, w, h);

                stars.forEach(function (s) {
                    s.tw += s.twS;
                    var op = 0.3 + Math.sin(s.tw) * 0.35;
                    ctx.beginPath();
                    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = Math.random() < 0.004
                        ? 'rgba(204,68,255,' + op + ')'
                        : 'rgba(255,255,255,' + op + ')';
                    ctx.fill();
                });

                if (Math.random() < 0.004 && shoots.length < 2) {
                    shoots.push({
                        x: Math.random() * w, y: 0,
                        len: Math.random() * 45 + 20,
                        spd: Math.random() * 3 + 2,
                        ang: Math.PI / 4 + Math.random() * 0.3,
                        op: 1
                    });
                }
                for (var si = shoots.length - 1; si >= 0; si--) {
                    var sh = shoots[si];
                    sh.x  += Math.cos(sh.ang) * sh.spd;
                    sh.y  += Math.sin(sh.ang) * sh.spd;
                    sh.op -= 0.022;
                    if (sh.op <= 0 || sh.x > w || sh.y > h) { shoots.splice(si, 1); continue; }
                    var g = ctx.createLinearGradient(sh.x, sh.y,
                        sh.x - Math.cos(sh.ang) * sh.len,
                        sh.y - Math.sin(sh.ang) * sh.len);
                    g.addColorStop(0, 'rgba(204,68,255,' + sh.op + ')');
                    g.addColorStop(1, 'rgba(204,68,255,0)');
                    ctx.beginPath();
                    ctx.moveTo(sh.x, sh.y);
                    ctx.lineTo(sh.x - Math.cos(sh.ang) * sh.len, sh.y - Math.sin(sh.ang) * sh.len);
                    ctx.strokeStyle = g;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                raf = requestAnimationFrame(drawFrame);
            }
        }

        function updateCosmos() {
            if (window.scrollY > 80) {
                if (!active) {
                    active = true;
                    if (ctx) {
                        if (!canvasReady) { canvasReady = true; resize(); }
                        drawFrame();
                    }
                }
                navbar.style.background     = 'rgba(5,2,18,0.95)';
                navbar.style.backdropFilter = 'blur(24px)';
                navbar.style.borderBottom   = '1px solid rgba(255,255,255,0.07)';
                navbar.style.boxShadow      = '0 4px 30px rgba(0,0,0,0.5)';
                if (canvas) canvas.style.opacity = '1';
                /* links stay white — no color override needed */
            } else {
                active = false;
                if (raf) { cancelAnimationFrame(raf); raf = null; }
                if (canvas) canvas.style.opacity = '0';
                navbar.style.background     = 'transparent';
                navbar.style.backdropFilter = 'none';
                navbar.style.borderBottom   = 'none';
                navbar.style.boxShadow      = 'none';
            }
        }
        window.addEventListener('scroll', updateCosmos, { passive: true });
        updateCosmos();
    }

}());
