/* nav.js — Shared navigation component for Axolutions
 * Pages set window.AXO_CONFIG before loading this file:
 *   window.AXO_CONFIG = { page: 'sobre', navMode: 'white' }
 *
 * navMode values:
 *   'transparent' (default) — transparent at top, white on scroll
 *   'cosmos'                — transparent at top, starry dark on scroll (index.html)
 *   'white'                 — always white/opaque (sobre, fundadores, post, projeto)
 *   'dark'                  — always dark/opaque (depoimentos)
 */
(function () {
    'use strict';

    var cfg = window.AXO_CONFIG || {};
    var currentPage = cfg.page || '';
    var navMode = cfg.navMode || 'transparent';
    var WA = 'https://wa.me/5511949360561';

    var isWhite  = navMode === 'white';
    var isDark   = navMode === 'dark';
    var isCosmos = navMode === 'cosmos';

    /* ── SVG icons ── */
    var SVG_WA_SM  = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    var SVG_WA_MD  = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    var SVG_BURGER = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
    var SVG_CLOSE  = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

    /* ── Nav links list ── */
    var LINKS = [
        { href: 'index.html#servicos', label: 'Serviços',    id: 'servicos' },
        { href: 'projetos.html',      label: 'Projetos',    id: 'projetos' },
        { href: 'blog.html',          label: 'Blog',         id: 'blog' },
        { href: 'sobre.html',         label: 'Sobre',        id: 'sobre' },
        { href: 'fundadores.html',    label: 'Fundadores',   id: 'fundadores' },
        { href: 'depoimentos.html',   label: 'Depoimentos',  id: 'depoimentos' }
    ];

    function deskClass(id) {
        if (id === currentPage)
            return 'nav-link text-sm font-semibold text-primary transition-colors';
        if (isWhite)
            return 'nav-link text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors';
        return 'nav-link text-sm font-medium text-white/80 hover:text-white transition-colors';
    }

    function mobClass(id) {
        if (id === currentPage)
            return 'flex items-center px-4 py-3 rounded-xl text-primary font-semibold';
        return 'flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium';
    }

    /* ── Build HTML ── */
    var navInitClass = 'fixed top-0 left-0 right-0 z-50 transition-all duration-500';
    if (isWhite) navInitClass += ' bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm';
    if (isDark)  navInitClass += ' bg-[rgba(17,17,24,0.92)] backdrop-blur-[20px] border-b border-white/[0.06]';

    var brandClass   = isWhite ? 'text-gray-900 group-hover:text-primary' : 'text-white group-hover:text-purple-300';
    var burgerClass  = isWhite ? 'text-gray-700' : 'text-white';

    /* cosmos mode: star canvas inside navbar */
    var cosmosCanvas = isCosmos
        ? '<canvas id="navbar-stars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0;transition:opacity 0.6s ease"></canvas>'
        : '';

    var deskLinks = LINKS.map(function (l) {
        return '<a href="' + l.href + '" class="' + deskClass(l.id) + '">' + l.label + '</a>';
    }).join('');

    var mobLinks = (function () {
        var homeClass = currentPage === ''
            ? 'flex items-center px-4 py-3 rounded-xl text-primary font-semibold'
            : 'flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium';
        var out = '<a href="index.html" class="' + homeClass + '">Home</a>';
        LINKS.forEach(function (l) {
            out += '<a href="' + l.href + '" class="' + mobClass(l.id) + '">' + l.label + '</a>';
        });
        return out;
    }());

    var navHTML =
        '<nav id="navbar" class="' + navInitClass + '">' +
        cosmosCanvas +
        '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="position:relative;z-index:1">' +
            '<div class="flex items-center justify-between h-20">' +
                '<a href="index.html" class="flex items-center gap-2.5 group">' +
                    '<img src="images/logo.png" alt="Axolutions" class="h-10 w-auto">' +
                    '<span id="axo-brand" class="text-xl font-display font-bold ' + brandClass + ' transition-colors">Ax<span class="text-primary">olutions</span></span>' +
                '</a>' +
                '<div class="hidden lg:flex items-center gap-8">' + deskLinks + '</div>' +
                '<div class="hidden lg:flex items-center gap-3">' +
                    '<a href="' + WA + '" target="_blank" rel="noopener noreferrer" class="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 inline-flex items-center gap-2">' +
                    SVG_WA_SM + 'solicitar prévia</a>' +
                '</div>' +
                '<button id="menu-btn" class="lg:hidden p-2 ' + burgerClass + '">' + SVG_BURGER + '</button>' +
            '</div>' +
        '</div>' +
        '</nav>';

    var overlayHTML =
        '<div id="menu-overlay" class="fixed inset-0 bg-black/60 z-[99] opacity-0 pointer-events-none transition-opacity duration-300"></div>';

    var panelHTML =
        '<div id="mobile-panel" style="transition:transform 0.35s cubic-bezier(0.16,1,0.3,1)" ' +
             'class="fixed top-0 right-0 h-full w-[300px] bg-white z-[100] transform translate-x-full flex flex-col shadow-2xl">' +
            '<div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">' +
                '<a href="index.html" class="flex items-center gap-2">' +
                    '<img src="images/logo.png" alt="Axolutions" class="h-8 w-auto">' +
                    '<span class="text-lg font-display font-bold text-gray-900">Ax<span class="text-primary">olutions</span></span>' +
                '</a>' +
                '<button id="menu-close" class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">' +
                SVG_CLOSE + '</button>' +
            '</div>' +
            '<nav class="flex-1 px-6 py-6 flex flex-col gap-1 overflow-y-auto">' + mobLinks + '</nav>' +
            '<div class="px-6 py-6 border-t border-gray-100">' +
                '<a href="' + WA + '" target="_blank" rel="noopener noreferrer" ' +
                   'class="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-full font-semibold transition-all duration-300 text-sm">' +
                SVG_WA_MD + 'solicitar prévia</a>' +
            '</div>' +
        '</div>';

    /* ── Inject ── */
    document.body.insertAdjacentHTML('afterbegin', panelHTML);
    document.body.insertAdjacentHTML('afterbegin', overlayHTML);
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    /* ── Floating WhatsApp button ── */
    var WA_SVG = '<svg style="width:28px;height:28px;fill:white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    var waFloatHTML = '<a id="wa-float-btn" href="' + WA + '" target="_blank" rel="noopener noreferrer" aria-label="Fale conosco pelo WhatsApp"' +
        ' style="position:fixed;bottom:24px;right:24px;z-index:50;background:#25D366;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.4);transition:transform 0.3s ease,opacity 0.3s ease,box-shadow 0.3s ease"' +
        ' onmouseover="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 28px rgba(37,211,102,0.5)\'"' +
        ' onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 4px 20px rgba(37,211,102,0.4)\'">' +
        WA_SVG + '</a>';
    document.body.insertAdjacentHTML('beforeend', waFloatHTML);

    /* ── Mobile menu ── */
    var menuBtn    = document.getElementById('menu-btn');
    var menuClose  = document.getElementById('menu-close');
    var menuOverlay = document.getElementById('menu-overlay');
    var mobilePanel = document.getElementById('mobile-panel');

    function openMenu() {
        mobilePanel.style.transform = 'translateX(0)';
        menuOverlay.style.opacity = '1';
        menuOverlay.style.pointerEvents = 'auto';
        document.body.style.overflow = 'hidden';
        var wb = document.getElementById('wa-float-btn');
        if (wb) { wb.style.transform = 'scale(0)'; wb.style.opacity = '0'; wb.style.pointerEvents = 'none'; }
    }
    function closeMenu() {
        mobilePanel.style.transform = 'translateX(100%)';
        menuOverlay.style.opacity = '0';
        menuOverlay.style.pointerEvents = 'none';
        document.body.style.overflow = '';
        var wb = document.getElementById('wa-float-btn');
        if (wb) { wb.style.transform = ''; wb.style.opacity = ''; wb.style.pointerEvents = ''; }
    }

    if (menuBtn)    menuBtn.addEventListener('click', openMenu);
    if (menuClose)  menuClose.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    mobilePanel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

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
        var active = false;
        var raf    = null;

        if (ctx) {
            function resize() {
                canvas.width  = navbar.offsetWidth  || window.innerWidth;
                canvas.height = navbar.offsetHeight || 80;
            }
            resize();
            window.addEventListener('resize', resize, { passive: true });

            for (var i = 0; i < 140; i++) {
                stars.push({
                    x: Math.random(), y: Math.random(),
                    r: Math.random() * 1.5 + 0.2,
                    tw: Math.random() * Math.PI * 2,
                    twS: Math.random() * 0.03 + 0.007
                });
            }

            function drawFrame() {
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
                    if (ctx) drawFrame();
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
