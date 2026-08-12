#!/usr/bin/env node
/* Injeta o cabeçalho (navbar + overlay + painel mobile + botão flutuante do
 * WhatsApp) como HTML ESTÁTICO em todas as páginas públicas.
 *
 * Por que estático: crawlers que não executam JavaScript (GPTBot, ClaudeBot,
 * PerplexityBot) não enxergavam NENHUM link do menu principal — descobriam as
 * páginas internas só pelo sitemap, sem texto âncora nem hierarquia. O Googlebot
 * via, mas pagando custo de renderização.
 *
 * O js/nav.js continua responsável por TODO o comportamento (abrir/fechar menu,
 * efeito de scroll, canvas do cosmos). Só a geração de markup saiu de lá.
 *
 * Rodar depois de criar uma página nova: npm run nav:build
 * Idempotente: reescreve o cabeçalho de quem já tem, injeta em quem não tem.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WA = 'https://wa.me/5511949360561';
const EXCLUDE = new Set(['admin.html', 'google263b65a918ffcf19.html']);

const SVG_WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

const SVG_WA_SM = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="' + SVG_WA_PATH + '"/></svg>';
const SVG_WA_MD = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="' + SVG_WA_PATH + '"/></svg>';
const WA_SVG = '<svg style="width:28px;height:28px;fill:white" viewBox="0 0 24 24"><path d="' + SVG_WA_PATH + '"/></svg>';
const SVG_BURGER = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
const SVG_CLOSE = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

const LINKS = [
    { href: '/index.html#servicos', label: 'Serviços', id: 'servicos' },
    { href: '/plataforma.html', label: 'Axoplataforma', id: 'produtos' },
    { href: '/projetos.html', label: 'Projetos', id: 'projetos' },
    { href: '/blog.html', label: 'Blog', id: 'blog' },
    { href: '/sobre.html', label: 'Sobre', id: 'sobre' },
    { href: '/depoimentos.html', label: 'Depoimentos', id: 'depoimentos' }
];

/* Gera exatamente o mesmo markup que js/nav.js produzia. */
function buildNav(currentPage, navMode) {
    const isWhite = navMode === 'white';
    const isDark = navMode === 'dark';
    const isCosmos = navMode === 'cosmos';

    function deskClass(id) {
        if (id === currentPage) return 'nav-link text-sm font-semibold text-primary transition-colors';
        if (isWhite) return 'nav-link text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors';
        return 'nav-link text-sm font-medium text-white/80 hover:text-white transition-colors';
    }
    function mobClass(id) {
        if (id === currentPage) return 'flex items-center px-4 py-3 rounded-xl text-primary font-semibold';
        return 'flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium';
    }

    let navInitClass = 'fixed top-0 left-0 right-0 z-50 transition-all duration-500';
    if (isWhite) navInitClass += ' bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm';
    if (isDark) navInitClass += ' bg-[rgba(17,17,24,0.92)] backdrop-blur-[20px] border-b border-white/[0.06]';

    const brandClass = isWhite ? 'text-gray-900 group-hover:text-primary' : 'text-white group-hover:text-purple-300';
    const burgerClass = isWhite ? 'text-gray-700' : 'text-white';

    const cosmosCanvas = isCosmos
        ? '<canvas id="navbar-stars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0;transition:opacity 0.6s ease"></canvas>'
        : '';

    const deskLinks = LINKS.map(l => '<a href="' + l.href + '" class="' + deskClass(l.id) + '">' + l.label + '</a>').join('');

    const homeClass = currentPage === ''
        ? 'flex items-center px-4 py-3 rounded-xl text-primary font-semibold'
        : 'flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium';
    let mobLinks = '<a href="/index.html" class="' + homeClass + '">Home</a>';
    LINKS.forEach(l => { mobLinks += '<a href="' + l.href + '" class="' + mobClass(l.id) + '">' + l.label + '</a>'; });

    const navHTML =
        '<nav id="navbar" class="' + navInitClass + '">' +
        cosmosCanvas +
        '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="position:relative;z-index:1">' +
            '<div class="flex items-center justify-between h-20">' +
                '<a href="/index.html" class="flex items-center gap-2.5 group">' +
                    '<picture><source srcset="/images/logo.webp" type="image/webp"><img src="/images/logo.png" alt="Axolutions" width="40" height="40" class="h-10 w-auto"></picture>' +
                    '<span id="axo-brand" class="text-xl font-display font-bold ' + brandClass + ' transition-colors">Axolutions</span>' +
                '</a>' +
                '<div class="hidden lg:flex items-center gap-8">' + deskLinks + '</div>' +
                '<div class="hidden lg:flex items-center gap-3">' +
                    '<a href="' + WA + '" target="_blank" rel="noopener noreferrer" class="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 inline-flex items-center gap-2">' +
                    SVG_WA_SM + 'Solicitar prévia</a>' +
                '</div>' +
                '<button id="menu-btn" aria-label="Abrir menu" class="lg:hidden p-2 ' + burgerClass + '">' + SVG_BURGER + '</button>' +
            '</div>' +
        '</div>' +
        '</nav>';

    const overlayHTML =
        '<div id="menu-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99;opacity:0;pointer-events:none;transition:opacity 0.3s ease"></div>';

    const panelHTML =
        '<div id="mobile-panel" style="position:fixed;top:0;right:0;height:100%;width:300px;background:#fff;z-index:100;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;box-shadow:0 25px 50px rgba(0,0,0,0.25);will-change:transform">' +
            '<div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">' +
                '<a href="/index.html" class="flex items-center gap-2">' +
                    '<picture><source srcset="/images/logo.webp" type="image/webp"><img src="/images/logo.png" alt="Axolutions" width="32" height="32" class="h-8 w-auto"></picture>' +
                    '<span class="text-lg font-display font-bold text-gray-900">Axolutions</span>' +
                '</a>' +
                '<button id="menu-close" aria-label="Fechar menu" class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">' +
                SVG_CLOSE + '</button>' +
            '</div>' +
            '<nav class="flex-1 px-6 py-6 flex flex-col gap-1 overflow-y-auto">' + mobLinks + '</nav>' +
            '<div class="px-6 py-6 border-t border-gray-100">' +
                '<a href="' + WA + '" target="_blank" rel="noopener noreferrer" ' +
                   'class="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-full font-semibold transition-all duration-300 text-sm">' +
                SVG_WA_MD + 'solicitar prévia</a>' +
            '</div>' +
        '</div>';

    const waFloatHTML = '<a id="wa-float-btn" href="' + WA + '" target="_blank" rel="noopener noreferrer" aria-label="Fale conosco pelo WhatsApp"' +
        ' style="position:fixed;bottom:24px;right:24px;z-index:50;background:#25D366;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.4);transition:transform 0.3s ease,opacity 0.3s ease"' +
        ' onmouseover="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 28px rgba(37,211,102,0.5)\'"' +
        ' onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 4px 20px rgba(37,211,102,0.4)\'">' +
        WA_SVG + '</a>';

    // ordem no DOM idêntica à que o JS produzia: nav, overlay, painel ... wa-float
    return { head: navHTML + overlayHTML + panelHTML, waFloat: waFloatHTML };
}

module.exports = { buildNav };

if (require.main === module) {
    const walk = (dir, out = []) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (e.name === 'node_modules' || e.name === '.git') continue;
            const p = path.join(dir, e.name);
            e.isDirectory() ? walk(p, out) : e.name.endsWith('.html') && out.push(p);
        }
        return out;
    };

    const SCRIPT_TAG = /[ \t]*<script[^>]*src="[^"]*js\/nav\.js"[^>]*><\/script>\r?\n?/;
    const EXISTING_HEAD = /[ \t]*<nav id="navbar"[\s\S]*?<div id="mobile-panel"[\s\S]*?<\/div><\/div>\r?\n?/;
    const EXISTING_WA = /[ \t]*<a id="wa-float-btn"[\s\S]*?<\/a>\r?\n?/;

    let written = 0, skipped = 0;

    for (const file of walk(ROOT)) {
        if (EXCLUDE.has(path.basename(file))) { skipped++; continue; }
        let src = fs.readFileSync(file, 'utf8');
        if (!src.includes('</body>') || !SCRIPT_TAG.test(src) && !src.includes('id="navbar"')) { skipped++; continue; }

        const m = src.match(/AXO_CONFIG\s*=\s*\{[^}]*page:\s*'([^']*)'[^}]*navMode:\s*'([^']*)'/);
        const { head, waFloat } = buildNav(m ? m[1] : '', m ? m[2] : 'transparent');

        const before = src;

        // remove versões anteriores para poder reescrever
        src = src.replace(EXISTING_HEAD, '').replace(EXISTING_WA, '');

        // nav/overlay/painel logo após <body ...>
        src = src.replace(/(<body[^>]*>)/, '$1\n    ' + head);
        // botão flutuante imediatamente antes do rodapé (ou de </body>)
        src = src.includes('<footer data-axo-footer')
            ? src.replace('<footer data-axo-footer', waFloat + '\n    <footer data-axo-footer')
            : src.replace('</body>', '    ' + waFloat + '\n</body>');

        if (src !== before) { fs.writeFileSync(file, src, 'utf8'); written++; }
    }

    console.log('[nav] ' + written + ' página(s) atualizada(s), ' + skipped + ' ignorada(s).');
}
