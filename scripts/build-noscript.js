#!/usr/bin/env node
/* Adiciona um fallback <noscript> que torna visível o conteúdo animado.
 *
 * O problema: as classes .scroll-animate* têm `opacity: 0` no CSS e só ficam
 * visíveis quando o JavaScript adiciona a classe `animate-in` via
 * IntersectionObserver. Sem JavaScript, esse conteúdo é renderizado mas fica
 * INVISÍVEL — são ~737 elementos no site, incluindo depoimentos, FAQ, cards de
 * serviço e a maior parte do texto do blog.
 *
 * Isso afeta quem não executa JS (GPTBot, ClaudeBot, PerplexityBot) e conteúdo
 * visualmente oculto tende a ser desvalorizado pelos buscadores.
 *
 * A correção não muda NADA para quem tem JavaScript: o bloco só é aplicado pelo
 * navegador quando o JS está desativado.
 *
 * Rodar: npm run noscript:build   (idempotente)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXCLUDE = new Set(['admin.html', 'google263b65a918ffcf19.html']);

const MARKER = 'data-axo-noscript-fallback';
const BLOCK = '<noscript><style ' + MARKER + '>' +
    '.scroll-animate,.scroll-animate-left,.scroll-animate-right,.scroll-animate-scale' +
    '{opacity:1!important;transform:none!important}' +
    '</style></noscript>';

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        const p = path.join(dir, e.name);
        e.isDirectory() ? walk(p, out) : e.name.endsWith('.html') && out.push(p);
    }
    return out;
}

const EXISTING = new RegExp('[ \\t]*<noscript><style ' + MARKER + '>[\\s\\S]*?</noscript>\\r?\\n?');

let written = 0, skipped = 0;

for (const file of walk(ROOT)) {
    if (EXCLUDE.has(path.basename(file))) { skipped++; continue; }
    let src = fs.readFileSync(file, 'utf8');

    // só faz sentido em páginas que realmente usam as classes animadas
    if (!/class="[^"]*scroll-animate/.test(src) || !src.includes('</head>')) { skipped++; continue; }

    const before = src;
    src = src.replace(EXISTING, '');
    src = src.replace('</head>', '    ' + BLOCK + '\n</head>');

    if (src !== before) { fs.writeFileSync(file, src, 'utf8'); written++; }
}

console.log('[noscript] ' + written + ' página(s) atualizada(s), ' + skipped + ' ignorada(s).');
