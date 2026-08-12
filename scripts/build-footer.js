#!/usr/bin/env node
/* Injeta o rodapé como HTML ESTÁTICO em todas as páginas públicas.
 *
 * Por que estático: crawlers que não executam JavaScript (GPTBot, ClaudeBot,
 * PerplexityBot e parte do Bingbot) não enxergavam rodapé nenhum quando ele era
 * injetado por js/footer.js — logo, não liam razão social, CNPJ nem os links
 * internos. Este arquivo é a ÚNICA fonte de verdade do rodapé.
 *
 * Rodar depois de criar uma página nova: npm run footer:build
 * É idempotente: reescreve o rodapé de quem já tem, injeta em quem não tem.
 *
 * Atenção: telefone e localidade precisam bater exatamente com o cadastro do
 * Google Meu Negócio (consistência de NAP).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const YEAR = 2026; // rodapé é estático: atualizar na virada do ano

// ── Dados legais / NAP (fonte única) ──────────────────────────────────────
const RAZAO_SOCIAL = 'Axolutions Serviços de Tecnologia LTDA';
const CNPJ = '60.140.588/0001-00';
const CIDADE = 'São Paulo – SP, Brasil';
const TEL_DISPLAY = '(11) 94936-0561';
const TEL_HREF = '+5511949360561';
const EMAIL = 'contato@axolutions.com.br';
// ──────────────────────────────────────────────────────────────────────────

// páginas que não levam rodapé público
const EXCLUDE = new Set(['admin.html', 'google263b65a918ffcf19.html']);

const LINK = 'hover:text-primary transition-colors';
const ac = (id, page) => (id === page ? 'text-primary' : LINK);

function buildFooter(page) {
    return '' +
'<footer data-axo-footer class="bg-[#080810] text-gray-400 pt-20 pb-8 px-4">' +
'<div class="max-w-7xl mx-auto">' +
    '<div class="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">' +
        '<div>' +
            '<div class="flex items-center gap-2.5 mb-5">' +
                '<picture><source srcset="/images/logo.webp" type="image/webp"><img src="/images/logo.png" alt="Axolutions" width="36" height="36" class="h-9 w-auto"></picture>' +
                '<span class="text-xl font-display font-bold text-white">Axolutions</span>' +
            '</div>' +
            '<p class="text-sm leading-relaxed text-gray-500">Desenvolvimento de sites, aplicativos, sistemas web e automações. Você recebe uma prévia funcional do seu projeto no mesmo dia, sem custo.</p>' +
        '</div>' +
        '<div>' +
            '<h4 class="text-white font-display font-semibold mb-5">Páginas</h4>' +
            '<nav class="flex flex-col gap-3 text-sm">' +
                '<a href="/index.html" class="' + ac('', page) + '">Início</a>' +
                '<a href="/sobre.html" class="' + ac('sobre', page) + '">Sobre</a>' +
                '<a href="/blog.html" class="' + ac('blog', page) + '">Blog</a>' +
                '<a href="/projetos.html" class="' + ac('projetos', page) + '">Projetos</a>' +
                '<a href="/depoimentos.html" class="' + ac('depoimentos', page) + '">Depoimentos</a>' +
                /* Painel Admin NÃO entra aqui: linkar admin.html do rodapé público
                   o expõe a crawlers e polui o índice sem necessidade. */
            '</nav>' +
        '</div>' +
        '<div>' +
            '<h4 class="text-white font-display font-semibold mb-5">Serviços</h4>' +
            '<nav class="flex flex-col gap-3 text-sm">' +
                '<a href="/desenvolvimento-de-sites.html" class="' + LINK + '">Desenvolvimento de Sites</a>' +
                '<a href="/sistemas-web.html" class="' + LINK + '">Sistemas Web</a>' +
                '<a href="/automacoes.html" class="' + LINK + '">Automações</a>' +
                '<a href="/sistemas-erp.html" class="' + LINK + '">Sistemas ERP</a>' +
                '<a href="/aplicativos-mobile.html" class="' + LINK + '">Aplicativos Mobile</a>' +
                '<a href="/e-commerce.html" class="' + LINK + '">E-commerce</a>' +
            '</nav>' +
        '</div>' +
        '<div>' +
            '<h4 class="text-white font-display font-semibold mb-5">Axoplataforma</h4>' +
            '<nav class="flex flex-col gap-3 text-sm">' +
                '<a href="/plataforma.html" class="' + ac('produtos', page) + '">Plataforma</a>' +
                '<a href="/orbita.html" class="' + LINK + '">Órbita (WhatsApp IA)</a>' +
                '<a href="/cosmos.html" class="' + LINK + '">Cosmos (Site com IA)</a>' +
                '<a href="/analytics.html" class="' + LINK + '">Analytics</a>' +
                '<a href="/link-na-bio.html" class="' + LINK + '">Link na Bio</a>' +
                '<a href="/google-meu-negocio.html" class="' + LINK + '">Analisador Google (grátis)</a>' +
                '<a href="/academy.html" class="' + LINK + '">Academy</a>' +
            '</nav>' +
        '</div>' +
        '<div>' +
            '<h4 class="text-white font-display font-semibold mb-5">Seções</h4>' +
            '<nav class="flex flex-col gap-3 text-sm">' +
                '<a href="/index.html#servicos" class="' + LINK + '">Nossos Serviços</a>' +
                '<a href="/index.html#previa" class="' + LINK + '">Prévia Gratuita</a>' +
                '<a href="/index.html#depoimentos" class="' + LINK + '">Depoimentos</a>' +
                '<a href="/index.html#cosmos" class="' + LINK + '">Cosmos Digital</a>' +
                '<a href="/index.html#faq" class="' + LINK + '">FAQ</a>' +
                '<a href="/index.html#contato" class="' + LINK + '">Contato</a>' +
            '</nav>' +
        '</div>' +
    '</div>' +
    '<div class="border-t border-white/10 pt-8 mb-6">' +
        '<div class="flex flex-col sm:flex-row sm:flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500">' +
            '<span class="text-gray-400 font-medium">' + RAZAO_SOCIAL + '</span>' +
            '<span>CNPJ ' + CNPJ + '</span>' +
            '<span>' + CIDADE + '</span>' +
            '<a href="tel:' + TEL_HREF + '" class="' + LINK + '">' + TEL_DISPLAY + '</a>' +
            '<a href="mailto:' + EMAIL + '" class="' + LINK + '">' + EMAIL + '</a>' +
        '</div>' +
    '</div>' +
    '<div class="border-t border-white/10 pt-6">' +
        '<p class="text-sm text-gray-600">&copy; ' + YEAR + ' Axolutions. Todos os direitos reservados.</p>' +
    '</div>' +
'</div>' +
'</footer>';
}

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.name.endsWith('.html')) out.push(p);
    }
    return out;
}

const SCRIPT_TAG = /[ \t]*<script[^>]*src="[^"]*js\/footer\.js"[^>]*><\/script>\r?\n?/g;
const EXISTING = /[ \t]*<footer data-axo-footer[\s\S]*?<\/footer>\r?\n?/;

let written = 0, skipped = 0;

for (const file of walk(ROOT)) {
    if (EXCLUDE.has(path.basename(file))) { skipped++; continue; }

    let src = fs.readFileSync(file, 'utf8');
    if (!src.includes('</body>')) { skipped++; continue; }

    const m = src.match(/AXO_CONFIG\s*=\s*\{[^}]*page:\s*'([^']*)'/);
    const footer = buildFooter(m ? m[1] : '');

    const before = src;
    src = src.replace(SCRIPT_TAG, '');            // rodapé não vem mais de JS
    src = EXISTING.test(src)
        ? src.replace(EXISTING, '    ' + footer + '\n')
        : src.replace('</body>', '    ' + footer + '\n</body>');

    if (src !== before) { fs.writeFileSync(file, src, 'utf8'); written++; }
}

console.log('[footer] ' + written + ' página(s) atualizada(s), ' + skipped + ' ignorada(s).');
