#!/usr/bin/env node
/* Gera HTML estático real para cada post do blog (blog/<slug>/index.html) e
 * atualiza o grid de blog.html, lendo os dois arquivos como templates.
 * Rodar antes de cada deploy que mexe em post: npm run blog:build
 * (ou npm run content:build, que roda isso + o sitemap junto). */
'use strict';

const fs = require('fs');
const path = require('path');
const { renderPostCard, renderRelatedCard } = require('../js/blog-card-template.js');

const SITE = 'https://axolutions.com.br';
const ROOT = path.join(__dirname, '..');
const SUPABASE_URL = 'https://ecgjhahdceocsikbhsot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2poYWhkY2VvY3Npa2Joc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjczNjEsImV4cCI6MjA5MDA0MzM2MX0.yGWwjOkR4Wy-BAfKMweM68sPIZBSiSoXiZSZup62x0s';

/* ── helpers ──────────────────────────────────────────────────────────── */

function slugify(str) {
    const noAccents = (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return noAccents.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function resolveDate(post) {
    return (post.date && post.date.length === 10) ? post.date : String(post.created_at).slice(0, 10);
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDatePtBR(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// Mesma formatação/ordenação usada por js/blog-hydrate.js no client, para o
// grid de blog.html não "pular" quando o JS re-renderizar por cima.
function formatDateGrid(dateStr) {
    return formatDateShort(dateStr);
}

function sortPostsForGrid(arr) {
    return arr.slice().sort(function (a, b) {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.date) - new Date(a.date);
    });
}

async function fetchTable(table, select) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=' + select, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
    });
    if (!res.ok) throw new Error('Supabase fetch failed for ' + table + ': ' + res.status);
    return res.json();
}

function dedupeBySlug(posts) {
    const bySlug = {};
    posts.forEach(function (p) {
        const slug = slugify(p.title);
        (bySlug[slug] = bySlug[slug] || []).push(p);
    });
    const result = [];
    Object.keys(bySlug).forEach(function (slug) {
        const group = bySlug[slug];
        if (group.length > 1) {
            group.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
            console.warn(
                '[blog] aviso: colisão de slug "' + slug + '" entre ' + group.length + ' posts (' +
                group.map(function (p) { return '"' + p.title + '" [' + p.id + ']'; }).join(', ') +
                ') — mantendo só o mais recente.'
            );
        }
        result.push(group[0]);
    });
    return result;
}

function relatedFor(post, all) {
    let related = all.filter(function (p) { return p.id !== post.id && p.category === post.category; });
    if (related.length < 2) {
        const others = all.filter(function (p) { return p.id !== post.id && related.indexOf(p) === -1; });
        related = related.concat(others);
    }
    return related.slice(0, 3);
}

function jsonLdFor(post, postUrl, date) {
    const ld = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || '',
        datePublished: date || '',
        dateModified: date || '',
        author: { '@type': 'Organization', name: 'Axolutions' },
        publisher: { '@type': 'Organization', name: 'Axolutions' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl }
    };
    if (post.image) ld.image = post.image;
    if (post.category) ld.articleSection = post.category;
    return ld;
}

/* ── manipulação de HTML por id (sem dependências / sem parser de DOM) ──── */

function getTag(html, id) {
    const idIdx = html.indexOf('id="' + id + '"');
    if (idIdx === -1) throw new Error('id não encontrado no template: ' + id);
    const tagStart = html.lastIndexOf('<', idIdx);
    const tagEnd = html.indexOf('>', idIdx);
    return { tagStart: tagStart, tagEnd: tagEnd, tag: html.slice(tagStart, tagEnd + 1) };
}

function setAttrById(html, id, attr, value) {
    const t = getTag(html, id);
    const re = new RegExp('(\\s' + attr + '=")[^"]*(")');
    const newTag = re.test(t.tag)
        ? t.tag.replace(re, '$1' + escapeAttr(value) + '$2')
        : t.tag.replace(/>$/, ' ' + attr + '="' + escapeAttr(value) + '">');
    return html.slice(0, t.tagStart) + newTag + html.slice(t.tagEnd + 1);
}

function toggleClassById(html, id, cls, add) {
    const t = getTag(html, id);
    const classRe = /class="([^"]*)"/;
    const m = classRe.exec(t.tag);
    let classes = m ? m[1].split(/\s+/).filter(Boolean) : [];
    if (add && classes.indexOf(cls) === -1) classes.unshift(cls);
    if (!add) classes = classes.filter(function (c) { return c !== cls; });
    const newTag = m ? t.tag.replace(classRe, 'class="' + classes.join(' ') + '"') : t.tag.replace(/>$/, ' class="' + cls + '">');
    return html.slice(0, t.tagStart) + newTag + html.slice(t.tagEnd + 1);
}

// Substitui TODO o conteúdo do elemento (só seguro em elementos que começam vazios).
function setTextById(html, id, content) {
    const t = getTag(html, id);
    const tagName = /^<([a-zA-Z0-9]+)/.exec(t.tag)[1];
    const openTagEnd = t.tagEnd + 1;
    const closeTag = '</' + tagName + '>';
    const closeIdx = html.indexOf(closeTag, openTagEnd);
    if (closeIdx === -1) throw new Error('tag de fechamento não encontrada para ' + id);
    return html.slice(0, openTagEnd) + content + html.slice(closeIdx);
}

// Acrescenta texto logo antes do fechamento (preserva conteúdo já existente, ex: ícone svg).
function appendTextById(html, id, content) {
    const t = getTag(html, id);
    const tagName = /^<([a-zA-Z0-9]+)/.exec(t.tag)[1];
    const closeTag = '</' + tagName + '>';
    const closeIdx = html.indexOf(closeTag, t.tagEnd + 1);
    if (closeIdx === -1) throw new Error('tag de fechamento não encontrada para ' + id);
    return html.slice(0, closeIdx) + content + html.slice(closeIdx);
}

/* ── geração ──────────────────────────────────────────────────────────── */

function buildPostHtml(template, post, all) {
    const slug = slugify(post.title);
    const date = resolveDate(post);
    const postUrl = SITE + '/blog/' + slug;
    let html = template;

    html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(post.title) + ' - Blog Axolutions</title>');
    html = setAttrById(html, 'post-meta-description', 'content', post.excerpt || post.title);
    html = setAttrById(html, 'post-canonical', 'href', postUrl);
    html = setAttrById(html, 'post-og-title', 'content', post.title);
    html = setAttrById(html, 'post-og-url', 'content', postUrl);
    if (post.image) {
        html = setAttrById(html, 'post-og-image', 'content', post.image);
        html = setAttrById(html, 'post-twitter-image', 'content', post.image);
    }
    html = setTextById(html, 'post-jsonld', JSON.stringify(jsonLdFor(post, postUrl, date)));

    html = toggleClassById(html, 'page-skeleton', 'hidden', true);
    html = toggleClassById(html, 'post-page', 'hidden', false);

    html = setTextById(html, 'post-category', escapeHtml(post.category || 'Geral'));
    html = appendTextById(html, 'post-date', formatDatePtBR(date));
    html = setTextById(html, 'post-title', escapeHtml(post.title));

    if (post.image) {
        html = toggleClassById(html, 'post-image-wrap', 'hidden', false);
        html = setAttrById(html, 'post-image', 'src', post.image);
        html = setAttrById(html, 'post-image', 'alt', post.title);
    }

    html = setTextById(html, 'post-content', post.content || '<p>Conteudo nao disponivel.</p>');

    const related = relatedFor(post, all);
    const relatedHtml = related.length
        ? related.map(function (r) { return renderRelatedCard(r, slugify(r.title), formatDateShort(resolveDate(r))); }).join('')
        : '<p class="text-sm text-gray-600">Nenhum artigo relacionado.</p>';
    html = setTextById(html, 'related-posts', relatedHtml);

    return html;
}

function buildBlogHtml(template, posts) {
    const sorted = sortPostsForGrid(posts);
    const cardsHtml = sorted.map(function (p, i) {
        return renderPostCard(p, slugify(p.title), formatDateGrid(p.date), i);
    }).join('');
    return template.replace(/<!--SSG:START-->[\s\S]*<!--SSG:END-->/, '<!--SSG:START-->' + cardsHtml + '<!--SSG:END-->');
}

async function main() {
    const rawPosts = await fetchTable('posts', '*');
    const posts = dedupeBySlug(rawPosts);
    const currentSlugs = new Set(posts.map(function (p) { return slugify(p.title); }));

    const blogDir = path.join(ROOT, 'blog');
    fs.mkdirSync(blogDir, { recursive: true });

    const existingDirs = fs.readdirSync(blogDir).filter(function (name) {
        return fs.statSync(path.join(blogDir, name)).isDirectory();
    });

    const postTemplate = fs.readFileSync(path.join(ROOT, 'post.html'), 'utf8');
    posts.forEach(function (post) {
        const slug = slugify(post.title);
        const html = buildPostHtml(postTemplate, post, posts);
        const dir = path.join(blogDir, slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
    });

    let removed = 0;
    existingDirs.forEach(function (dirName) {
        if (!currentSlugs.has(dirName)) {
            fs.rmSync(path.join(blogDir, dirName), { recursive: true, force: true });
            console.log('[blog] removida pasta órfã:', dirName);
            removed++;
        }
    });

    const blogTemplate = fs.readFileSync(path.join(ROOT, 'blog.html'), 'utf8');
    fs.writeFileSync(path.join(ROOT, 'blog.html'), buildBlogHtml(blogTemplate, posts));

    console.log('[blog] ' + posts.length + ' posts gerados em blog/<slug>/index.html, ' + removed + ' pasta(s) órfã(s) removida(s), blog.html atualizado.');
}

main().catch(function (e) {
    console.error('[blog] erro fatal:', e);
    process.exit(1);
});
