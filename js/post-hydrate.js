/* post-hydrate.js — hidrata post.html (extraído do <script> inline).
 * Em páginas geradas por scripts/generate-blog.js, #post-page já vem visível
 * com título/conteúdo/JSON-LD corretos — pulamos o fetch inteiro nesse caso. */
(async function () {
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) { entry.target.classList.add('animate-in'); observer.unobserve(entry.target); }
        });
    }, { threshold: 0.1 });

    if (!document.getElementById('post-page').classList.contains('hidden')) {
        // Página pré-gerada: nada para buscar, só ligar as animações de scroll.
        document.querySelectorAll('#post-page .scroll-animate').forEach(function (el) { observer.observe(el); });
        return;
    }

    function showNotFound() {
        document.getElementById('page-skeleton').classList.add('hidden');
        document.getElementById('not-found').classList.remove('hidden');
    }

    function formatDatePtBR(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    // Short date for related posts
    function formatDateShort(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        var months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    // Resolve post by slug (clean URL) or, as a fallback, by legacy ?id=
    // Note: Vercel rewrites are invisible to the browser — /blog/slug never
    // shows up as a query string, so the slug has to be read from the path.
    var params = new URLSearchParams(window.location.search);
    var pathMatch = window.location.pathname.match(/^\/blog\/([a-z0-9-]+)\/?$/);
    var slug = (pathMatch && pathMatch[1]) || params.get('slug');
    var postId = params.get('id');
    if (!slug && !postId) { showNotFound(); return; }

    var post = null;
    if (slug) {
        var allPostsForSlug = await DataManager.getData(DataManager.keys.POSTS);
        var slimMatch = allPostsForSlug.find(function (p) { return DataManager.slugify(p.title) === slug; });
        post = slimMatch ? await DataManager.getItem(DataManager.keys.POSTS, slimMatch.id) : null;
    } else {
        post = await DataManager.getItem(DataManager.keys.POSTS, postId);
    }
    if (!post) { showNotFound(); return; }

    var postSlug = DataManager.slugify(post.title);
    var postUrl = 'https://axolutions.com.br/blog/' + postSlug;

    // Populate page
    document.title = post.title + ' - Blog Axolutions';
    document.querySelector('meta[name="description"]').setAttribute('content', post.excerpt || post.title);
    document.getElementById('post-canonical').setAttribute('href', postUrl);
    document.getElementById('post-og-title').setAttribute('content', post.title);
    document.getElementById('post-og-url').setAttribute('content', postUrl);
    if (post.image) {
        document.getElementById('post-og-image').setAttribute('content', post.image);
        document.getElementById('post-twitter-image').setAttribute('content', post.image);
    }

    document.getElementById('post-category').textContent = post.category || 'Geral';
    document.getElementById('post-date').innerHTML += formatDatePtBR(post.date);
    document.getElementById('post-title').textContent = post.title;

    // Featured image
    if (post.image) {
        var imageWrap = document.getElementById('post-image-wrap');
        var imageEl = document.getElementById('post-image');
        imageEl.src = post.image;
        imageEl.alt = post.title;
        imageWrap.classList.remove('hidden');
    }

    // Post content (rich HTML from Quill)
    document.getElementById('post-content').innerHTML = post.content || '<p>Conteudo nao disponivel.</p>';

    // JSON-LD structured data
    var jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || '',
        "datePublished": post.date || '',
        "dateModified": post.date || '',
        "author": { "@type": "Organization", "name": "Axolutions" },
        "publisher": { "@type": "Organization", "name": "Axolutions" },
        "mainEntityOfPage": { "@type": "WebPage", "@id": postUrl }
    };
    if (post.image) { jsonLd.image = post.image; }
    if (post.category) { jsonLd.articleSection = post.category; }
    document.getElementById('post-jsonld').textContent = JSON.stringify(jsonLd);

    // Show post page, hide skeleton
    document.getElementById('page-skeleton').classList.add('hidden');
    document.getElementById('post-page').classList.remove('hidden');
    document.querySelectorAll('#post-page .scroll-animate').forEach(function (el) { observer.observe(el); });

    // Related posts
    var allPosts = await DataManager.getData(DataManager.keys.POSTS);
    var related = allPosts.filter(function (p) {
        return p.id !== post.id && p.category === post.category;
    });
    if (related.length < 2) {
        var others = allPosts.filter(function (p) {
            return p.id !== post.id && related.indexOf(p) === -1;
        });
        related = related.concat(others);
    }
    related = related.slice(0, 3);

    var relatedContainer = document.getElementById('related-posts');
    if (related.length === 0) {
        relatedContainer.innerHTML = '<p class="text-sm text-gray-600">Nenhum artigo relacionado.</p>';
    } else {
        relatedContainer.innerHTML = related.map(function (r) {
            return renderRelatedCard(r, DataManager.slugify(r.title), formatDateShort(r.date));
        }).join('');
    }
})();
