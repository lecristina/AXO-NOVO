/* app.js - Main application logic */
(function() {
    'use strict';

    /* Mobile menu + navbar scroll are handled by js/nav.js */

    // ==========================================
    // Smooth scroll for anchor links
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ==========================================
    // Scroll animations (IntersectionObserver)
    // ==========================================
    var animClasses = ['.scroll-animate', '.scroll-animate-left', '.scroll-animate-right', '.scroll-animate-scale'];
    var _scrollObs = null;
    if ('IntersectionObserver' in window) {
        _scrollObs = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var delay = entry.target.style.transitionDelay || '0ms';
                    setTimeout(function() { entry.target.classList.add('animate-in'); }, parseInt(delay));
                    _scrollObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll(animClasses.join(',')).forEach(function(el) { _scrollObs.observe(el); });
    }

    // ==========================================
    // Typing effect
    // ==========================================
    var typingEl = document.getElementById('typing-text');
    if (typingEl) {
        var words = ['sua automação', 'seu site', 'seu app', 'sua landing page', 'seu e-commerce', 'sua automação'];
        var wordIndex = 0;
        var charIndex = 0;
        var isDeleting = false;
        var typeSpeed = 80;

        function typeEffect() {
            var current = words[wordIndex];
            if (isDeleting) {
                typingEl.textContent = current.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 35;
            } else {
                typingEl.textContent = current.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 90;
            }

            if (!isDeleting && charIndex === current.length) {
                typeSpeed = 2800;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 400;
            }
            setTimeout(typeEffect, typeSpeed);
        }
        setTimeout(typeEffect, 1200);
    }

    // ==========================================
    // Counter animation
    // ==========================================
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length > 0) {
        var counterObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var target = parseInt(entry.target.getAttribute('data-count'));
                    var duration = 2000;
                    var start = 0;
                    var startTime = null;
                    function animateCount(ts) {
                        if (!startTime) startTime = ts;
                        var progress = Math.min((ts - startTime) / duration, 1);
                        var ease = 1 - Math.pow(1 - progress, 3);
                        entry.target.textContent = Math.floor(ease * target);
                        if (progress < 1) requestAnimationFrame(animateCount);
                        else entry.target.textContent = target;
                    }
                    requestAnimationFrame(animateCount);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(function(c) { counterObserver.observe(c); });
    }

    // ==========================================
    // Companies Carousel (infinite auto-scroll)
    // ==========================================
    async function initCompaniesCarousel() {
        var track = document.getElementById('companies-track');
        if (!track) return;

        var DEFAULT_ICON = '<svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';

        function _escHtml(s) {
            return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        function buildCompanyCard(c) {
            var safeName = _escHtml(c.name);
            if (c.image) {
                return '<div class="flex flex-col items-center justify-center gap-2 px-8 py-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex-shrink-0 min-w-[140px]">'
                    + '<img src="' + _escHtml(c.image) + '" alt="' + safeName + '" class="h-14 w-auto max-w-[120px] object-contain" loading="lazy" decoding="async">'
                    + '<span class="text-xs font-semibold text-gray-400 whitespace-nowrap">' + safeName + '</span>'
                    + '</div>';
            }
            return '<div class="flex items-center gap-3 px-7 py-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex-shrink-0">'
                + '<div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">' + DEFAULT_ICON + '</div>'
                + '<span class="text-sm font-semibold text-gray-600 whitespace-nowrap">' + safeName + '</span>'
                + '</div>';
        }

        function renderTrack(list) {
            if (!list || !list.length) return;
            // Sort by position ascending (matches admin dashboard order)
            var sorted = list.slice().sort(function(a, b) { return (a.position || 0) - (b.position || 0); });
            var cardsHTML = sorted.map(buildCompanyCard).join('');
            track.innerHTML = cardsHTML + cardsHTML; // duplicate for seamless loop
            var duration = Math.max(sorted.length * 4.5, 20);
            track.style.animation = 'trust-scroll ' + duration + 's linear infinite';
        }

        // 1. Render stale data immediately (zero-latency on repeat visits)
        var stale = null;
        try {
            var _raw = localStorage.getItem('axo_companies');
            if (_raw) stale = JSON.parse(_raw).data;
        } catch(e) {}
        if (stale && stale.length) renderTrack(stale);

        // 2. Resolve the head prefetch (started before SDK loaded)
        var fresh = null;
        try {
            if (window.__axo_comp_pf) {
                fresh = await window.__axo_comp_pf;
            } else if (typeof DataManager !== 'undefined') {
                fresh = await DataManager.getData(DataManager.keys.COMPANIES);
            }
        } catch(e) {}

        if (fresh && fresh.length) {
            renderTrack(fresh);
            // Persist to localStorage so next visit renders instantly
            try {
                var payload = JSON.stringify({ data: fresh, ts: Date.now() });
                if (payload.length < 1048576) localStorage.setItem('axo_companies', payload);
            } catch(e) {}
        } else if (!stale || !stale.length) {
            // Fallback placeholders if DB has no companies yet
            renderTrack([
                { name: 'Empresa A' }, { name: 'Empresa B' }, { name: 'Empresa C' },
                { name: 'Empresa D' }, { name: 'Empresa E' }, { name: 'Empresa F' }
            ]);
        }
    }

    // ==========================================
    // Testimonials Marquee
    // ==========================================
    async function initMarquee() {
        var track = document.getElementById('marquee-track');
        if (!track) return;

        var testimonials = (typeof DataManager !== 'undefined') ? await DataManager.getData(DataManager.keys.TESTIMONIALS) : null;

        // Fallback sample testimonials if none exist in storage
        if (!testimonials || testimonials.length === 0) {
            testimonials = [
                { name: 'Ana Carolina', role: 'CEO, StartupBR', rating: 5, text: 'A Axolutions entregou nosso site em tempo recorde. A qualidade é impressionante e o suporte é incrível.' },
                { name: 'Ricardo Mendes', role: 'Diretor, TechCorp', rating: 5, text: 'O sistema ERP que desenvolveram transformou completamente nossa operação. Recomendo a todos.' },
                { name: 'Juliana Silva', role: 'Empreendedora', rating: 5, text: 'Recebi a prévia do meu site no mesmo dia que entrei em contato. Superou todas as expectativas!' },
                { name: 'Carlos Eduardo', role: 'Fundador, InovaBiz', rating: 5, text: 'Profissionalismo, qualidade e entrega rápida. A Axolutions é referência no mercado.' },
                { name: 'Fernanda Costa', role: 'Marketing Manager', rating: 5, text: 'Nossa landing page aumentou a conversão em 3x depois que a Axolutions redesenhou tudo.' },
                { name: 'Thiago Alves', role: 'E-commerce Owner', rating: 5, text: 'A loja online ficou perfeita. Vendas aumentaram desde o primeiro mês. Equipe top!' }
            ];
        }

        /* Google-reviews style card */
        var AVATAR_COLORS = ['#ea4335','#4285f4','#34a853','#fbbc04','#ff6d00','#8f00cc'];
        var AVATAR_TEXT   = ['#fff','#fff','#fff','#111','#fff','#fff'];
        var _cardIdx = 0;

        function buildCard(t) {
            var ci    = _cardIdx % AVATAR_COLORS.length;
            _cardIdx++;
            var bg    = AVATAR_COLORS[ci];
            var fg    = AVATAR_TEXT[ci];
            var avatarHTML = t.image
                ? '<img src="' + t.image + '" alt="' + (t.name || '') + '" class="w-10 h-10 rounded-full object-cover shrink-0">'
                : '<div class="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0" style="background:' + bg + ';color:' + fg + '">' + (t.name || 'A').charAt(0) + '</div>';
            var googleIcon = '<svg class="absolute top-5 right-5 w-5 h-5 opacity-50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
            return '<div class="flex-shrink-0 w-[300px] md:w-[340px] p-7 rounded-3xl bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.11)] transition-shadow relative flex flex-col text-left">'
                + googleIcon
                + '<div class="flex items-center gap-3 mb-3">'
                + avatarHTML
                + '<div>'
                + '<div class="font-semibold text-sm text-gray-900">' + (t.name || '') + '</div>'
                + '<div class="text-xs text-gray-400">' + (t.role || '') + '</div>'
                + '</div>'
                + '</div>'
                + '<div class="flex text-yellow-400 text-base mb-3">★★★★★</div>'
                + '<p class="text-gray-600 leading-relaxed text-sm">\u201c' + (t.text || '') + '\u201d</p>'
                + '</div>';
        }

        var allCards = testimonials.map(buildCard).join('');
        track.innerHTML = allCards;

        // Arrow navigation
        var prevBtn = document.getElementById('dep-prev');
        var nextBtn = document.getElementById('dep-next');
        if (prevBtn && nextBtn) {
            var scrollAmount = 364; // card width + gap
            prevBtn.addEventListener('click', function() {
                track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            nextBtn.addEventListener('click', function() {
                track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    }

    // ==========================================
    // FAQ Accordion
    // ==========================================
    function initFAQ() {
        document.querySelectorAll('.faq-question').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var answer = this.nextElementSibling;
                var icon = this.querySelector('.faq-icon');
                var isOpen = answer.classList.contains('open');

                // Close all
                document.querySelectorAll('.faq-answer').forEach(function(a) { a.classList.remove('open'); });
                document.querySelectorAll('.faq-icon').forEach(function(ic) { ic.style.transform = 'rotate(0deg)'; });

                if (!isOpen) {
                    answer.classList.add('open');
                    if (icon) icon.style.transform = 'rotate(45deg)';
                }
            });
        });
    }

    // ==========================================
    // Cosmos canvas - star field
    // ==========================================
    function initCosmos() {
        var canvas = document.getElementById('cosmos-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var stars = [];
        var shootingStars = [];

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Create stars
        for (var i = 0; i < 300; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.3,
                speed: Math.random() * 0.3 + 0.05,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.02 + 0.005
            });
        }

        function addShootingStar() {
            if (shootingStars.length < 2 && Math.random() < 0.005) {
                shootingStars.push({
                    x: Math.random() * canvas.width,
                    y: 0,
                    len: Math.random() * 80 + 40,
                    speed: Math.random() * 6 + 4,
                    angle: Math.PI / 4 + Math.random() * 0.3,
                    opacity: 1
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw stars
            stars.forEach(function(s) {
                s.twinkle += s.twinkleSpeed;
                var opacity = 0.4 + Math.sin(s.twinkle) * 0.35;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                var isPurple = Math.random() < 0.01;
                ctx.fillStyle = isPurple ? 'rgba(143,0,204,' + opacity + ')' : 'rgba(255,255,255,' + opacity + ')';
                ctx.fill();
            });

            // Shooting stars
            addShootingStar();
            for (var ss = shootingStars.length - 1; ss >= 0; ss--) {
                var sh = shootingStars[ss];
                sh.x += Math.cos(sh.angle) * sh.speed;
                sh.y += Math.sin(sh.angle) * sh.speed;
                sh.opacity -= 0.008;

                var grad = ctx.createLinearGradient(
                    sh.x, sh.y,
                    sh.x - Math.cos(sh.angle) * sh.len,
                    sh.y - Math.sin(sh.angle) * sh.len
                );
                grad.addColorStop(0, 'rgba(204,68,255,' + sh.opacity + ')');
                grad.addColorStop(1, 'rgba(204,68,255,0)');
                ctx.beginPath();
                ctx.moveTo(sh.x, sh.y);
                ctx.lineTo(sh.x - Math.cos(sh.angle) * sh.len, sh.y - Math.sin(sh.angle) * sh.len);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                if (sh.opacity <= 0 || sh.x > canvas.width || sh.y > canvas.height) {
                    shootingStars.splice(ss, 1);
                }
            }

            requestAnimationFrame(draw);
        }
        draw();
    }

    // ==========================================
    // Load blog preview
    // ==========================================
    async function loadBlogPreview() {
        var container = document.getElementById('blog-preview');
        if (!container) return;
        // Show skeleton while loading
        container.innerHTML = [0,1,2].map(function() {
            return '<div class="animate-pulse">'  +
                '<div class="h-48 bg-gray-200 rounded-xl mb-5"></div>' +
                '<div class="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>' +
                '<div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>' +
                '<div class="h-4 bg-gray-200 rounded w-full mb-1"></div>' +
                '<div class="h-4 bg-gray-200 rounded w-5/6"></div>' +
                '</div>';
        }).join('');
        var posts = await DataManager.getData(DataManager.keys.POSTS);
        if (!posts) { container.innerHTML = ''; return; }

        var recent = posts.sort(function(a, b) {
            // Featured posts first, then by date
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return new Date(b.date) - new Date(a.date);
        }).slice(0, 3);
        if (!recent.length) { container.innerHTML = ''; return; }
        container.innerHTML = recent.map(function(post, index) {
            var imgHTML = post.image
                ? '<div class="overflow-hidden rounded-xl mb-5"><img src="' + post.image + '" alt="' + (post.title || '') + '" class="blog-image w-full h-48 object-cover"></div>'
                : '<div class="h-48 bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-xl mb-5 flex items-center justify-center"><svg class="w-12 h-12 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg></div>';
            return '<article class="blog-card scroll-animate" style="transition-delay:' + (index * 100) + 'ms">'
                + imgHTML
                + '<div class="flex items-center gap-3 mb-3"><span class="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">' + (post.category || 'Geral') + '</span><span class="text-xs text-gray-400">' + (post.date ? new Date(post.date).toLocaleDateString('pt-BR') : '') + '</span></div>'
                + '<h3 class="font-display font-bold text-lg mb-2 hover:text-primary transition-colors"><a href="post.html?id=' + post.id + '">' + (post.title || '') + '</a></h3>'
                + '<p class="text-gray-500 text-sm leading-relaxed line-clamp-2">' + (post.excerpt || '') + '</p>'
                + '</article>';
        }).join('');
        // Observe dynamically injected articles (static observer misses async-added elements)
        if (_scrollObs) {
            container.querySelectorAll('.scroll-animate').forEach(function(el) { _scrollObs.observe(el); });
        }
    }

    // ==========================================
    // Diagonal projects showcase
    // ==========================================
    async function initDiagonalProjects() {
        var wrap = document.getElementById('diag-projects-wrap');
        if (!wrap) return;

        var GRADIENTS = [
            ['#6a00b8', '#9b00e0'], ['#006630', '#00aa55'], ['#00369e', '#0060e0'],
            ['#aa001a', '#e0003a'], ['#003388', '#0055cc'], ['#004d25', '#008844'],
            ['#7a0040', '#c40066'], ['#440099', '#7700dd'], ['#003366', '#005599'],
            ['#552200', '#993300'], ['#006633', '#25D366'], ['#1a3a6b', '#2a5ca8']
        ];

        var ICONS = [
            'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
            'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
            'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            'M13 10V3L4 14h7v7l9-11h-7z',
            'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
            'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
            'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
            'M9 5l7 7-7 7',
            'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
        ];

        /* Hardcoded fallback — shown when admin has fewer than 4 projects */
        var HARDCODED = [
            { title: 'E-commerce Premium',    cat: 'E-commerce', techs: 'React · Node.js · MongoDB',        c1: '#6a00b8', c2: '#9b00e0', image: '' },
            { title: 'App de Delivery',        cat: 'Mobile',     techs: 'React Native · Firebase',          c1: '#006630', c2: '#00aa55', image: '' },
            { title: 'Sistema ERP Completo',   cat: 'Sistema',    techs: 'Vue.js · Python · PostgreSQL',     c1: '#00369e', c2: '#0060e0', image: '' },
            { title: 'Landing Page',           cat: 'Marketing',  techs: 'HTML · CSS · JavaScript',          c1: '#aa001a', c2: '#e0003a', image: '' },
            { title: 'Dashboard Analítico',    cat: 'Sistema',    techs: 'React · Chart.js · Node.js',       c1: '#003388', c2: '#0055cc', image: '' },
            { title: 'App Financeiro',         cat: 'Mobile',     techs: 'Flutter · Firebase · Stripe',      c1: '#004d25', c2: '#008844', image: '' },
            { title: 'Site Institucional',     cat: 'Website',    techs: 'Next.js · Tailwind · Vercel',      c1: '#7a0040', c2: '#c40066', image: '' },
            { title: 'Plataforma SaaS',        cat: 'SaaS',       techs: 'React · TypeScript · AWS',         c1: '#440099', c2: '#7700dd', image: '' },
            { title: 'App Mobile',             cat: 'Mobile',     techs: 'React Native · Expo · Redux',      c1: '#003366', c2: '#005599', image: '' },
            { title: 'Portal B2B',             cat: 'Website',    techs: 'Angular · Java · MySQL',           c1: '#552200', c2: '#993300', image: '' },
            { title: 'Automacao WhatsApp',     cat: 'Automacao',  techs: 'Node.js · Baileys · MongoDB',      c1: '#006633', c2: '#25D366', image: '' },
            { title: 'Sistema de Agendamento', cat: 'Sistema',    techs: 'React · Node.js · SQL',            c1: '#1a3a6b', c2: '#2a5ca8', image: '' }
        ];

        function buildDiagCard(c, i) {
            var top;
            if (c.image) {
                top = '<div style="height:110px;overflow:hidden;background:#e5e7eb"><img src="' + c.image + '" alt="" style="width:100%;height:100%;object-fit:cover" decoding="async"></div>';
            } else {
                var iconPath = ICONS[i % ICONS.length];
                top = '<div style="height:110px;background:linear-gradient(135deg,' + c.c1 + ',' + c.c2 + ');display:flex;align-items:center;justify-content:center">'
                    + '<svg style="width:40px;height:40px;fill:none;stroke:rgba(255,255,255,0.45);stroke-width:1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
                    + '</div>';
            }
            return '<div style="width:220px;flex-shrink:0;background:#ffffff;border:1px solid rgba(0,0,0,0.07);border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,0.07)">'
                + top
                + '<div style="padding:14px 14px 16px">'
                + '<span style="font-size:10px;background:rgba(143,0,204,0.08);color:#8f00cc;padding:3px 10px;border-radius:999px;font-weight:600">' + c.cat + '</span>'
                + '<p style="color:#111827;font-weight:600;font-size:13px;margin:8px 0 4px;line-height:1.3">' + c.title + '</p>'
                + '<p style="color:#9ca3af;font-size:11px">' + c.techs + '</p>'
                + '</div></div>';
        }

        function buildRows(cards) {
            wrap.innerHTML = '';
            /* Ensure enough cards for a visually-full carousel row */
            var expanded = cards.slice();
            while (expanded.length < 10) expanded = expanded.concat(cards);
            var delays = ['0s', '-22s', '-11s'];
            var revs   = [false, true, false];
            for (var ri = 0; ri < 3; ri++) {
                var rowHTML = expanded.map(function(c, i) { return buildDiagCard(c, i); }).join('');
                var row = document.createElement('div');
                row.className = 'diag-row ' + (revs[ri] ? 'rev' : 'fwd');
                row.style.animationDelay = delays[ri];
                row.innerHTML = rowHTML + rowHTML + rowHTML;
                wrap.appendChild(row);
            }
        }

        function showWhenImagesReady() {
            var imgs = Array.prototype.slice.call(wrap.querySelectorAll('img'));
            /* If there are no images (all gradient fallbacks), show immediately */
            if (!imgs.length) {
                wrap.style.opacity = '0.4';
                return;
            }
            var loaded = 0;
            function onLoad() {
                loaded++;
                if (loaded >= imgs.length) {
                    wrap.style.opacity = '0.4';
                }
            }
            imgs.forEach(function(img) {
                if (img.complete && img.naturalWidth > 0) {
                    onLoad();
                } else {
                    img.addEventListener('load', onLoad, { once: true });
                    img.addEventListener('error', onLoad, { once: true });
                }
            });
        }

        /* Keep wrap invisible until DB data + images are ready */
        wrap.style.opacity = '0';
        wrap.style.transition = 'opacity 0.8s ease';

        /* Use head-prefetched promise if available (starts at HTML parse time), else DataManager */
        var _dataPromise = (typeof window.__axo_projects_pf !== 'undefined')
            ? window.__axo_projects_pf
            : DataManager.getDataSelect(DataManager.keys.PROJECTS, 'id,title,description,category,techs,image,status,created_at,position');

        if (typeof DataManager !== 'undefined') {
            _dataPromise.then(function(allProjects) {
                var dbProjects = (allProjects || []).filter(function(p) { return p.status !== 'draft'; })
                    .sort(function(a, b) { return (a.position || 0) - (b.position || 0); });
                if (dbProjects.length >= 1) {
                    buildRows(dbProjects.map(function(p, i) {
                        var g = GRADIENTS[i % GRADIENTS.length];
                        return {
                            title: p.title || 'Projeto',
                            cat:   p.category || 'Projeto',
                            techs: Array.isArray(p.techs) ? p.techs.join(' · ') : (p.techs || ''),
                            c1:    g[0],
                            c2:    g[1],
                            image: p.image || ''
                        };
                    }));
                    showWhenImagesReady();
                }
            });
        }
    }

    // ==========================================
    // Load projects preview
    // ==========================================
    async function loadProjectsPreview() {
        var container = document.getElementById('projects-preview');
        if (!container) return;
        var projects = (await DataManager.getDataSelect(DataManager.keys.PROJECTS, 'id,title,description,category,techs,image,status,created_at,position')).filter(function(p) { return p.status !== 'draft'; });
        if (!projects.length) return;

        var recent = projects.slice(0, 3);
        container.classList.remove('hidden');
        container.removeAttribute('aria-hidden');
        container.className = 'w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 text-left';
        container.innerHTML = recent.map(function(project) {
            var imgHTML = project.image
                ? '<img src="' + project.image + '" alt="" class="w-full h-36 object-cover">'  
                : '<div class="w-full h-36 bg-gradient-to-br from-primary/20 to-purple-500/10 flex items-center justify-center"><svg class="w-10 h-10 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>';
            var tags = (project.techs || []).slice(0, 2).map(function(t) {
                return '<span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">' + t + '</span>';
            }).join('');
            return '<a href="projeto.html?id=' + project.id + '" class="block bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all">' +
                imgHTML +
                '<div class="p-3">' +
                '<p class="font-semibold text-gray-900 text-sm truncate mb-1">' + (project.title || '') + '</p>' +
                '<div class="flex flex-wrap gap-1">' + tags + '</div>' +
                '</div>' +
                '</a>';
        }).join('');
    }

    // ==========================================
    // Initialize everything
    // ==========================================
    document.addEventListener('DOMContentLoaded', function() {
        initCompaniesCarousel();
        initMarquee();
        initFAQ();
        initCosmos();
        initDiagonalProjects();
        loadBlogPreview();
    });

})();
