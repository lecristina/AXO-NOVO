#!/usr/bin/env node
/* Gera os cards de depoimentos como HTML ESTÁTICO:
 *   - carrossel da home  → #marquee-track   (index.html)
 *   - grade de avaliações → #all-testimonials (depoimentos.html)
 *
 * Por que estático: depoimento real é sinal forte de E-E-A-T. Renderizado só por
 * JavaScript, ele não existe para GPTBot/ClaudeBot/PerplexityBot — justamente
 * os mecanismos que precisam encontrar prova social sobre a empresa.
 *
 * O painel admin (DataManager) continua podendo sobrescrever: se houver
 * depoimentos cadastrados no banco, o JS troca o conteúdo. Sem nada no banco,
 * o HTML estático abaixo permanece.
 *
 * IMPORTANTE: os textos são avaliações REAIS do Google, reproduzidas na íntegra.
 * Não corrija a escrita dos avaliadores — é citação, não copy nossa.
 *
 * Rodar: npm run reviews:build
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* Avaliações reais do perfil da Axolutions no Google, transcritas literalmente.
   Ordenadas por riqueza de detalhe — as mais específicas convencem mais. */
const REVIEWS = [
    {
        name: 'Patrick William',
        meta: 'Local Guide · 23 avaliações · 24 fotos',
        date: 'um ano atrás',
        image: 'review-patrick',
        text: 'Trabalhar com a Axolutions foi uma experiência incrível! Desde o primeiro contato, percebi o quanto o time é comprometido com qualidade, agilidade e, principalmente, resultado. Transformaram minha ideia em uma solução digital moderna, funcional e com um design impecável. A comunicação foi clara o tempo todo, e o projeto foi entregue dentro do prazo. Recomendo de olhos fechados!'
    },
    {
        name: 'Alex Alves',
        meta: 'Local Guide · 40 avaliações',
        date: '2 anos atrás',
        image: 'review-alex',
        text: 'Contatei a empresa para um freelance simples, desde então toda a gestão da minha empresa é feita com sistemas deles!!! O antendimento é simplesmente impecável e sempre somos surpreendidos pela qualidade e velocidade da entrega'
    },
    {
        name: 'Milena Santoro',
        meta: '1 avaliação',
        date: '2 anos atrás',
        text: 'Contratei a Axolutions para uma página para minha confeitaria a 1 ano, desde então indico para todos que eu posso!!! Fizeram mágica com as minhas vendas'
    },
    {
        name: 'Leticia Cristina',
        meta: '6 avaliações · 3 fotos',
        date: '6 meses atrás',
        image: 'review-leticia',
        text: 'Amo trabalhar com eles, são super inteligentes e com ideias incríveis. Dão muito suporte e cada vez mais pensam em como ajudar o cliente, literalmente uma empresa colocando o cliente em primeiro lugar!'
    },
    {
        name: 'Fernanda Azevedo dos Santos',
        meta: '1 avaliação',
        date: 'um ano atrás',
        text: 'Atendimento rápido, profissional e com resultado de verdade! A Axolutions me ajudou a transformar uma ideia solta em um site que realmente converte. Recomendo a todos!!'
    },
    {
        name: 'Giovana Martins',
        meta: '3 avaliações',
        date: '6 meses atrás',
        text: 'Já fiz vários trabalhos com eles incluindo sites e plataformas, são super responsáveis atenciosos apresentam um trabalho muito bem feito'
    },
    {
        name: 'Jamilly',
        meta: '8 avaliações',
        date: '2 meses atrás',
        text: 'Desenvolveram nosso site, ficou como esperávamos, muita qualidade na entrega.'
    },
    {
        name: 'Joao Vilela',
        meta: '1 avaliação',
        date: '2 anos atrás',
        text: 'Íncrivel atendimento e serviço, contratarei mais vezes!!!'
    }
];

const AVATAR_COLORS = ['#ea4335', '#4285f4', '#34a853', '#fbbc04', '#ff6d00', '#8f00cc'];
const AVATAR_TEXT = ['#fff', '#fff', '#fff', '#111', '#fff', '#fff'];

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const GOOGLE_ICON = '<svg class="absolute top-5 right-5 w-5 h-5 opacity-50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';

const STAR = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';

function picture(base, alt, cls) {
    return '<picture><source srcset="/images/' + base + '.webp" type="image/webp">' +
        '<img src="/images/' + base + '.png" alt="' + esc(alt) + '" width="40" height="40" ' +
        'class="' + cls + '" loading="lazy" decoding="async"></picture>';
}

function initialAvatar(name, i, cls, style) {
    const c = i % AVATAR_COLORS.length;
    return '<div class="' + cls + '" style="' + style.replace('{bg}', AVATAR_COLORS[c]).replace('{fg}', AVATAR_TEXT[c]) + '">' +
        esc((name || 'A').charAt(0)) + '</div>';
}

/* Card claro, estilo Google — carrossel da home */
function marqueeCard(r, i) {
    const avatar = r.image
        ? picture(r.image, r.name, 'w-10 h-10 rounded-full object-cover shrink-0')
        : initialAvatar(r.name, i, 'w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0', 'background:{bg};color:{fg}');
    return '<div class="flex-shrink-0 w-[300px] md:w-[340px] p-7 rounded-3xl bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.11)] transition-shadow relative flex flex-col text-left">' +
        GOOGLE_ICON +
        '<div class="flex items-center gap-3 mb-3">' + avatar +
            '<div><div class="font-semibold text-sm text-gray-900">' + esc(r.name) + '</div>' +
            '<div class="text-xs text-gray-500">' + esc(r.meta) + '</div></div>' +
        '</div>' +
        '<div class="flex items-center gap-2 mb-3">' +
            '<div class="flex text-yellow-400 text-base">★★★★★</div>' +
            '<span class="text-xs text-gray-400">' + esc(r.date) + '</span>' +
        '</div>' +
        '<p class="text-gray-600 leading-relaxed text-sm">“' + esc(r.text) + '”</p>' +
        '</div>';
}

/* Card escuro — grade da página de depoimentos */
function gridCard(r, i) {
    const avatar = r.image
        ? picture(r.image, r.name, 'w-10 h-10 rounded-full object-cover')
        : initialAvatar(r.name, i, 'w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm', '');
    return '<div class="dep-card scroll-animate" style="transition-delay:' + ((i % 6) * 60) + 'ms">' +
        '<div class="flex items-center justify-between mb-4">' +
            '<div class="flex gap-1 star-fill">' + STAR.repeat(5) + '</div>' +
            '<span class="text-white/30 text-xs">' + esc(r.date) + '</span>' +
        '</div>' +
        '<p class="text-white/70 text-sm leading-relaxed mb-5">“' + esc(r.text) + '”</p>' +
        '<div class="flex items-center gap-3">' + avatar +
            '<div><p class="text-white font-semibold text-sm">' + esc(r.name) + '</p>' +
            '<p class="text-white/40 text-xs">' + esc(r.meta) + '</p></div>' +
        '</div></div>';
}

/* Substitui o conteúdo interno de uma <div id="..."> preservando a tag */
function fillContainer(html, id, inner) {
    const open = new RegExp('(<div[^>]*id="' + id + '"[^>]*>)');
    const m = html.match(open);
    if (!m) return { html, ok: false };
    const start = m.index + m[0].length;
    // encontra o </div> correspondente contando aninhamento
    let depth = 1, i = start;
    while (i < html.length && depth > 0) {
        const nextOpen = html.indexOf('<div', i);
        const nextClose = html.indexOf('</div>', i);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) { depth++; i = nextOpen + 4; }
        else { depth--; i = nextClose + 6; }
    }
    const end = i - 6;
    return { html: html.slice(0, start) + inner + html.slice(end), ok: true };
}

const marquee = REVIEWS.map(marqueeCard).join('');
const grid = REVIEWS.map(gridCard).join('');

let done = 0;
for (const [file, id, inner] of [
    ['index.html', 'marquee-track', marquee],
    ['depoimentos.html', 'all-testimonials', grid],
]) {
    const p = path.join(ROOT, file);
    const src = fs.readFileSync(p, 'utf8');
    const out = fillContainer(src, id, inner);
    if (!out.ok) { console.log('[reviews] AVISO: #' + id + ' não encontrado em ' + file); continue; }
    if (out.html !== src) { fs.writeFileSync(p, out.html, 'utf8'); done++; }
}

console.log('[reviews] ' + REVIEWS.length + ' avaliações reais · ' + done + ' arquivo(s) atualizado(s).');
