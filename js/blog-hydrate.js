/* blog-hydrate.js — hidrata blog.html (extraído do <script> inline).
 * O grid já vem preenchido pelo scripts/generate-blog.js na primeira pintura;
 * esse script mantém busca, ordenação e stale-while-revalidate funcionando
 * por cima, sem apagar o conteúdo pré-renderizado enquanto o fetch roda. */
(function () {
    // Scroll animations
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) { entry.target.classList.add('animate-in'); }
        });
    }, { threshold: 0.1 });

    // Render posts
    var grid = document.getElementById('posts-grid');
    var noResults = document.getElementById('no-results');
    var allPosts = [];

    function sortPosts(arr) {
        return arr.slice().sort(function (a, b) {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return new Date(b.date) - new Date(a.date);
        });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        var months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function renderPosts(list) {
        if (list.length === 0) {
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }
        noResults.classList.add('hidden');
        grid.innerHTML = list.map(function (p, i) {
            return renderPostCard(p, DataManager.slugify(p.title), formatDate(p.date), i);
        }).join('');

        document.querySelectorAll('.scroll-animate').forEach(function (el) { observer.observe(el); });
    }

    // Search
    var searchInput = document.getElementById('search-input');
    var debounceTimer;
    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            var q = searchInput.value.trim().toLowerCase();
            if (!q) { renderPosts(allPosts); return; }
            var filtered = allPosts.filter(function (p) {
                return p.title.toLowerCase().indexOf(q) > -1 || (p.category && p.category.toLowerCase().indexOf(q) > -1) || (p.excerpt && p.excerpt.toLowerCase().indexOf(q) > -1);
            });
            renderPosts(filtered);
        }, 250);
    });

    function applyPosts(posts) {
        allPosts = sortPosts(posts);
        renderPosts(allPosts);
    }

    // Show skeleton only if nothing is prerendered yet (SSG grid ships full of real cards)
    if (!grid.children.length) {
        grid.innerHTML = [0, 1, 2, 3, 4, 5].map(function () {
            return '<div class="animate-pulse">' +
                '<div class="h-52 bg-gray-200 rounded-2xl mb-4"></div>' +
                '<div class="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>' +
                '<div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>' +
                '<div class="h-4 bg-gray-200 rounded w-full mb-1"></div>' +
                '<div class="h-4 bg-gray-200 rounded w-5/6"></div>' +
                '</div>';
        }).join('');
    }

    // Stale-while-revalidate
    var stale = DataManager.getStale(DataManager.keys.POSTS);
    if (stale && stale.length) applyPosts(stale);

    var _postsPf = (typeof window.__axo_posts_pf !== 'undefined')
        ? window.__axo_posts_pf
        : DataManager.getData(DataManager.keys.POSTS);
    _postsPf.then(function (fresh) {
        if (fresh && fresh.length) applyPosts(fresh);
        else if (!stale || !stale.length) applyPosts([]);
    });
})();
