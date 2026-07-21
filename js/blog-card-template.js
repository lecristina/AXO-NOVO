/* blog-card-template.js — templates de card compartilhados entre blog.html,
 * post.html (artigos relacionados) e scripts/generate-blog.js (Node).
 * Sem dependências de DOM/DataManager — slug e data já vêm formatados. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        var api = factory();
        root.renderPostCard = api.renderPostCard;
        root.renderRelatedCard = api.renderRelatedCard;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function renderPostCard(post, slug, formattedDate, index) {
        var isFeatured = !!post.featured;
        var featuredBadge = isFeatured
            ? '<div class="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs px-3 py-1.5 rounded-full font-bold shadow-lg shadow-amber-400/40">' +
              '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
              'Destaque</div>'
            : '';
        var cardStyle = isFeatured ? ' style="outline:2px solid rgba(251,191,36,0.55);outline-offset:2px;"' : '';
        return '<article class="blog-card scroll-animate group" style="transition-delay:' + (index * 80) + 'ms">' +
            '<a href="/blog/' + slug + '" class="block bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col"' + cardStyle + '>' +
                '<div class="h-52 relative overflow-hidden bg-gray-100">' +
                    (post.image
                        ? '<img src="' + post.image + '" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover scale-110 blur-lg opacity-60 pointer-events-none select-none">' +
                          '<img src="' + post.image + '" alt="' + post.title + '" class="blog-image relative w-full h-full object-contain z-10">'
                        : '<div class="blog-image w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center"><svg class="w-16 h-16 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg></div>') +
                    '<div class="absolute top-3 left-3 z-20"><span class="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm">' + (post.category || 'Geral') + '</span></div>' +
                    featuredBadge +
                '</div>' +
                '<div class="p-6 flex flex-col flex-1">' +
                    '<div class="flex items-center gap-2 text-xs text-gray-500 mb-3">' +
                        '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
                        '<span>' + formattedDate + '</span>' +
                    '</div>' +
                    '<h2 class="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-3">' + post.title + '</h2>' +
                    '<p class="text-sm text-gray-500 line-clamp-3 flex-1">' + (post.excerpt || '') + '</p>' +
                    '<div class="mt-5 flex items-center text-primary text-sm font-semibold">' +
                        '<span>Ler artigo</span>' +
                        '<svg class="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>' +
                    '</div>' +
                '</div>' +
            '</a>' +
        '</article>';
    }

    function renderRelatedCard(post, slug, shortDate) {
        return '<a href="/blog/' + slug + '" class="blog-card group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">' +
            '<div class="h-32 relative overflow-hidden">' +
                (post.image
                    ? '<img src="' + post.image + '" alt="' + post.title + '" class="blog-image w-full h-full object-cover">'
                    : '<div class="blog-image w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center"><svg class="w-10 h-10 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg></div>') +
            '</div>' +
            '<div class="p-4">' +
                '<span class="text-xs text-gray-500">' + shortDate + '</span>' +
                '<h4 class="text-sm font-bold text-gray-900 mt-1 line-clamp-2 group-hover:text-primary transition-colors">' + post.title + '</h4>' +
            '</div>' +
        '</a>';
    }

    return { renderPostCard: renderPostCard, renderRelatedCard: renderRelatedCard };
});
