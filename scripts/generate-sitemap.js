#!/usr/bin/env node
/* Gera sitemap.xml a partir das páginas estáticas + posts/projetos publicados no Supabase.
 * Rodar antes de cada deploy: npm run sitemap:build
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE = 'https://www.axolutions.com.br';
const ROOT = path.join(__dirname, '..');
const SUPABASE_URL = 'https://ecgjhahdceocsikbhsot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2poYWhkY2VvY3Npa2Joc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjczNjEsImV4cCI6MjA5MDA0MzM2MX0.yGWwjOkR4Wy-BAfKMweM68sPIZBSiSoXiZSZup62x0s';

const STATIC_PAGES = [
    { file: 'index.html', loc: '/', changefreq: 'weekly', priority: '1.0' },
    { file: 'projetos.html', loc: '/projetos.html', changefreq: 'weekly', priority: '0.9' },
    { file: 'desenvolvimento-de-sites.html', loc: '/desenvolvimento-de-sites.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'sistemas-web.html', loc: '/sistemas-web.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'automacoes.html', loc: '/automacoes.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'sistemas-erp.html', loc: '/sistemas-erp.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'aplicativos-mobile.html', loc: '/aplicativos-mobile.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'e-commerce.html', loc: '/e-commerce.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'plataforma.html', loc: '/plataforma.html', changefreq: 'weekly', priority: '0.9' },
    { file: 'orbita.html', loc: '/orbita.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'cosmos.html', loc: '/cosmos.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'analytics.html', loc: '/analytics.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'link-na-bio.html', loc: '/link-na-bio.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'google-meu-negocio.html', loc: '/google-meu-negocio.html', changefreq: 'monthly', priority: '0.9' },
    { file: 'academy.html', loc: '/academy.html', changefreq: 'monthly', priority: '0.8' },
    { file: 'blog.html', loc: '/blog.html', changefreq: 'weekly', priority: '0.8' },
    { file: 'depoimentos.html', loc: '/depoimentos.html', changefreq: 'monthly', priority: '0.7' },
    { file: 'sobre.html', loc: '/sobre.html', changefreq: 'monthly', priority: '0.7' }
];

function slugify(str) {
    const noAccents = (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return noAccents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function gitLastMod(file) {
    try {
        const out = execSync('git log -1 --format=%cs -- ' + JSON.stringify(file), { cwd: ROOT }).toString().trim();
        if (out) return out;
    } catch (e) {}
    return new Date().toISOString().slice(0, 10);
}

async function fetchTable(table, select) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=' + select, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
    });
    if (!res.ok) throw new Error('Supabase fetch failed for ' + table + ': ' + res.status);
    return res.json();
}

function urlEntry(loc, lastmod, changefreq, priority) {
    return '  <url>\n' +
        '    <loc>' + SITE + loc + '</loc>\n' +
        '    <lastmod>' + lastmod + '</lastmod>\n' +
        '    <changefreq>' + changefreq + '</changefreq>\n' +
        '    <priority>' + priority + '</priority>\n' +
        '  </url>';
}

async function main() {
    const entries = [];

    STATIC_PAGES.forEach(function (p) {
        entries.push(urlEntry(p.loc, gitLastMod(p.file), p.changefreq, p.priority));
    });

    const posts = await fetchTable('posts', 'title,date,created_at').catch(function (e) {
        console.error('[sitemap] aviso: falha ao buscar posts —', e.message);
        return [];
    });
    posts
        .slice()
        .sort(function (a, b) { return (b.date || b.created_at) < (a.date || a.created_at) ? -1 : 1; })
        .forEach(function (post) {
            const lastmod = (post.date && post.date.length === 10) ? post.date : String(post.created_at).slice(0, 10);
            entries.push(urlEntry('/blog/' + slugify(post.title), lastmod, 'monthly', '0.6'));
        });

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n' +
        entries.join('\n\n') +
        '\n\n</urlset>\n';

    fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
    console.log('[sitemap] sitemap.xml gerado com ' + entries.length + ' URLs (' + posts.length + ' posts).');
}

main().catch(function (e) {
    console.error('[sitemap] erro fatal:', e);
    process.exit(1);
});
