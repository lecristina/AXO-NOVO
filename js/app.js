/* app.js - Main application logic */
(function() {
    'use strict';

    // ==========================================
    // Mobile Menu
    // ==========================================
    var menuBtn = document.getElementById('menu-btn');
    var mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            var isHidden = mobileMenu.classList.contains('hidden');
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('flex');
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
            }
        });
        mobileMenu.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
            });
        });
    }

    // ==========================================
    // Navbar scroll effect
    // ==========================================
    var navbar = document.getElementById('navbar');
    var navLinks = navbar ? navbar.querySelectorAll('.nav-link') : [];
    function updateNavbar() {
        if (!navbar) return;
        if (window.scrollY > 80) {
            navbar.style.background = 'rgba(255,255,255,0.9)';
            navbar.style.backdropFilter = 'blur(20px)';
            navbar.style.borderBottom = '1px solid rgba(0,0,0,0.06)';
            navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.1)';
            navLinks.forEach(function(l) {
                l.style.color = 'rgba(0,0,0,0.7)';
            });
            var brandText = navbar.querySelector('.font-display');
            if (brandText) brandText.style.color = '#111';
        } else {
            navbar.style.background = 'transparent';
            navbar.style.backdropFilter = 'none';
            navbar.style.borderBottom = 'none';
            navbar.style.boxShadow = 'none';
            navLinks.forEach(function(l) { l.style.color = ''; });
            var brandText2 = navbar.querySelector('.font-display');
            if (brandText2) brandText2.style.color = '';
        }
    }
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();

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
    var animElements = document.querySelectorAll(animClasses.join(','));
    if (animElements.length > 0 && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var delay = entry.target.style.transitionDelay || '0ms';
                    setTimeout(function() { entry.target.classList.add('animate-in'); }, parseInt(delay));
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        animElements.forEach(function(el) { observer.observe(el); });
    }

    // ==========================================
    // Typing effect
    // ==========================================
    var typingEl = document.getElementById('typing-text');
    if (typingEl) {
        var words = ['Sites', 'Aplicativos', 'Sistemas', 'Landing Pages', 'E-commerce', 'Automacoes'];
        var wordIndex = 0;
        var charIndex = 0;
        var isDeleting = false;
        var typeSpeed = 80;

        function typeEffect() {
            var current = words[wordIndex];
            if (isDeleting) {
                typingEl.textContent = current.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 40;
            } else {
                typingEl.textContent = current.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === current.length) {
                typeSpeed = 2500;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 300;
            }
            setTimeout(typeEffect, typeSpeed);
        }
        setTimeout(typeEffect, 1500);
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
    // Testimonials Carousel - Auto-switching
    // ==========================================
    function initCarousel() {
        var track = document.getElementById('carousel-track');
        var dotsContainer = document.getElementById('carousel-dots');
        var prevBtn = document.getElementById('carousel-prev');
        var nextBtn = document.getElementById('carousel-next');
        if (!track) return;

        var testimonials = DataManager.getData(DataManager.keys.TESTIMONIALS);
        if (!testimonials || testimonials.length === 0) return;

        // Build cards
        track.innerHTML = testimonials.map(function(t) {
            var stars = '';
            for (var s = 0; s < 5; s++) {
                stars += s < (t.rating || 5)
                    ? '<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>'
                    : '<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            }
            var avatar = t.image || '';
            var avatarHTML = avatar
                ? '<img src="' + avatar + '" alt="' + (t.name || '') + '" class="w-12 h-12 rounded-full object-cover">'
                : '<div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg">' + (t.name || 'A').charAt(0) + '</div>';
            return '<div class="carousel-slide flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-3">'
                + '<div class="testimonial-card-inner bg-white rounded-2xl p-8 border border-gray-100 h-full">'
                + '<div class="flex gap-1 mb-4">' + stars + '</div>'
                + '<p class="text-gray-600 leading-relaxed mb-6">"' + (t.text || '') + '"</p>'
                + '<div class="flex items-center gap-3 mt-auto">'
                + avatarHTML
                + '<div><p class="font-display font-semibold text-sm">' + (t.name || '') + '</p><p class="text-xs text-gray-500">' + (t.role || '') + '</p></div>'
                + '</div></div></div>';
        }).join('');

        var slides = track.querySelectorAll('.carousel-slide');
        var currentIndex = 0;
        var slidesPerView = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
        var maxIndex = Math.max(0, slides.length - slidesPerView);

        // Build dots
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            for (var d = 0; d <= maxIndex; d++) {
                var dot = document.createElement('button');
                dot.className = 'w-2 h-2 rounded-full transition-all duration-300 ' + (d === 0 ? 'bg-primary w-6' : 'bg-gray-300');
                dot.setAttribute('data-index', d);
                dot.addEventListener('click', function() { goToSlide(parseInt(this.getAttribute('data-index'))); });
                dotsContainer.appendChild(dot);
            }
        }

        function goToSlide(index) {
            currentIndex = Math.max(0, Math.min(index, maxIndex));
            var slideWidth = 100 / slidesPerView;
            track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + '%)';
            updateDots();
        }

        function updateDots() {
            if (!dotsContainer) return;
            dotsContainer.querySelectorAll('button').forEach(function(dot, i) {
                if (i === currentIndex) {
                    dot.className = 'w-6 h-2 rounded-full bg-primary transition-all duration-300';
                } else {
                    dot.className = 'w-2 h-2 rounded-full bg-gray-300 transition-all duration-300';
                }
            });
        }

        if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide(currentIndex - 1); resetAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide(currentIndex + 1); resetAutoplay(); });

        // Auto-switch every 4 seconds
        var autoplayInterval;
        function startAutoplay() {
            autoplayInterval = setInterval(function() {
                if (currentIndex >= maxIndex) {
                    goToSlide(0);
                } else {
                    goToSlide(currentIndex + 1);
                }
            }, 4000);
        }
        function resetAutoplay() {
            clearInterval(autoplayInterval);
            startAutoplay();
        }
        startAutoplay();

        // Touch swipe
        var touchStartX = 0;
        track.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', function(e) {
            var diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) goToSlide(currentIndex + 1);
                else goToSlide(currentIndex - 1);
                resetAutoplay();
            }
        }, { passive: true });

        // Recalculate on resize
        window.addEventListener('resize', function() {
            slidesPerView = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
            maxIndex = Math.max(0, slides.length - slidesPerView);
            goToSlide(Math.min(currentIndex, maxIndex));
            // Rebuild dots
            if (dotsContainer) {
                dotsContainer.innerHTML = '';
                for (var dd = 0; dd <= maxIndex; dd++) {
                    var dt = document.createElement('button');
                    dt.className = 'w-2 h-2 rounded-full transition-all duration-300 bg-gray-300';
                    dt.setAttribute('data-index', dd);
                    dt.addEventListener('click', function() { goToSlide(parseInt(this.getAttribute('data-index'))); resetAutoplay(); });
                    dotsContainer.appendChild(dt);
                }
                updateDots();
            }
        });
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
    function loadBlogPreview() {
        var container = document.getElementById('blog-preview');
        if (!container) return;
        var posts = DataManager.getData(DataManager.keys.POSTS);
        if (!posts) return;

        var recent = posts.sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 3);
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
    }

    // ==========================================
    // Load projects preview
    // ==========================================
    function loadProjectsPreview() {
        var container = document.getElementById('projects-preview');
        if (!container) return;
        var projects = DataManager.getData(DataManager.keys.PROJECTS).filter(function(p) { return p.status !== 'draft'; });
        if (!projects.length) return;

        var recent = projects.slice(0, 3);
        container.innerHTML = recent.map(function(project, index) {
            var imgHTML = project.image
                ? '<div class="overflow-hidden rounded-xl mb-5"><img src="' + project.image + '" alt="' + (project.title || '') + '" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"></div>'
                : '<div class="h-48 bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-xl mb-5 flex items-center justify-center"><svg class="w-12 h-12 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>';
            var tags = (project.techs || []).slice(0, 3).map(function(t) {
                return '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">' + t + '</span>';
            }).join('');
            return '<div class="scroll-animate" style="transition-delay:' + (index * 100) + 'ms">'
                + imgHTML
                + '<span class="text-xs font-semibold text-primary">' + (project.category || '') + '</span>'
                + '<h3 class="font-display font-bold text-lg mt-1 mb-2"><a href="projeto.html?id=' + project.id + '" class="hover:text-primary transition-colors">' + (project.title || '') + '</a></h3>'
                + '<p class="text-gray-500 text-sm mb-3 line-clamp-2">' + (project.description || '') + '</p>'
                + '<div class="flex flex-wrap gap-1.5">' + tags + '</div>'
                + '</div>';
        }).join('');
    }

    // ==========================================
    // Initialize everything
    // ==========================================
    document.addEventListener('DOMContentLoaded', function() {
        initCarousel();
        initFAQ();
        initCosmos();
        loadBlogPreview();
        loadProjectsPreview();
    });

})();
