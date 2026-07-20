/* crie.js — Gerador de site com I.A. (crie.html) */
(function () {
    'use strict';

    var API_BASE  = 'https://api.axolutions.com.br';
    var OUR_WA    = '5511949360561';
    var POLL_MS   = 3000;
    var MAX_POLLS = 40; // ~2 minutos

    var NICHE_KEYWORDS = [
        { value: 'clinics', words: ['clinic', 'saude', 'saúde', 'dentist', 'odont', 'estetic', 'estétic', 'medic', 'hospital', 'fisioterap', 'psicolog', 'nutri', 'consultorio', 'consultório'] },
        { value: 'restaurants', words: ['restaurante', 'comida', 'alimenta', 'lanchonete', 'padaria', 'pizzaria', 'hamburgu', 'cafeteria', 'confeitaria', 'bar', 'churrascaria', 'sorveteria'] },
        { value: 'personal-trainer', words: ['personal', 'fitness', 'academia', 'treino', 'crossfit', 'pilates', 'muscula'] },
        { value: 'ecommerce', words: ['ecommerce', 'e-commerce', 'loja', 'venda online', 'moda', 'roupa', 'calcado', 'calçado', 'joia', 'joalheria'] },
        { value: 'natural-products', words: ['natural', 'organic', 'orgânic', 'suplemento', 'cosmetic', 'cosmétic', 'ervas', 'fitoterap', 'vegano'] },
        { value: 'tech-repair', words: ['assistencia tecnica', 'assistência técnica', 'conserto', 'reparo', 'celular', 'eletronico', 'eletrônico', 'manutencao', 'manutenção', 'informatica', 'informática'] },
        { value: 'saas', words: ['saas', 'software', 'sistema', 'aplicativo', 'plataforma de', 'startup de tecnologia'] },
        { value: 'corporate', words: ['consultoria', 'advocacia', 'contabil', 'contábil', 'escritorio', 'escritório', 'juridic', 'imobiliaria', 'imobiliária', 'corporativ'] }
    ];

    var PALETTES = [
        { label: 'Roxo',      css: 'linear-gradient(135deg,#8f00cc,#cc44ff)', style: 'paleta roxa e violeta' },
        { label: 'Azul',      css: 'linear-gradient(135deg,#0057d9,#26c6da)', style: 'paleta azul e ciano' },
        { label: 'Verde',     css: 'linear-gradient(135deg,#00854d,#34d399)', style: 'paleta verde e esmeralda' },
        { label: 'Preto',     css: 'linear-gradient(135deg,#111,#4b5563)',    style: 'paleta preta e branca, minimalista' },
        { label: 'Dourado',   css: 'linear-gradient(135deg,#b8860b,#f5d576)', style: 'paleta dourada e bege, sofisticada' },
        { label: 'Vermelho',  css: 'linear-gradient(135deg,#c0392b,#f97316)', style: 'paleta vermelha e laranja, vibrante' },
        { label: 'Rosa',      css: 'linear-gradient(135deg,#db2777,#f9a8d4)', style: 'paleta rosa e pink, moderna' },
        { label: 'Turquesa',  css: 'linear-gradient(135deg,#0d9488,#5eead4)', style: 'paleta turquesa e verde-água' },
        { label: 'Grafite',   css: 'linear-gradient(135deg,#1f2937,#64748b)', style: 'paleta grafite e cinza, corporativa' },
        { label: 'Lima',      css: 'linear-gradient(135deg,#4d7c0f,#a3e635)', style: 'paleta verde-limão, vibrante' },
        { label: 'Marrom',    css: 'linear-gradient(135deg,#78350f,#d97706)', style: 'paleta marrom e âmbar, acolhedora' },
        { label: 'Índigo',    css: 'linear-gradient(135deg,#3730a3,#818cf8)', style: 'paleta índigo, tecnológica' }
    ];

    var state = { selectedPalette: null, payload: null, executionId: null, pollCount: 0, pollTimer: null, finalUrl: null };

    function $(id) { return document.getElementById(id); }

    function buildSwatches() {
        var wrap = $('color-swatches');
        wrap.innerHTML = PALETTES.map(function (p, i) {
            return '<div class="color-swatch" data-palette="' + i + '" style="background:' + p.css + '" title="' + p.label + '"></div>';
        }).join('');
        wrap.querySelectorAll('[data-palette]').forEach(function (el) {
            el.addEventListener('click', function () {
                wrap.querySelectorAll('.color-swatch').forEach(function (s) { s.classList.remove('selected'); });
                var i = parseInt(el.getAttribute('data-palette'), 10);
                if (state.selectedPalette === i) { state.selectedPalette = null; return; }
                state.selectedPalette = i;
                el.classList.add('selected');
            });
        });
    }

    function niceToNiche(text) {
        var t = (text || '').toLowerCase();
        for (var i = 0; i < NICHE_KEYWORDS.length; i++) {
            var group = NICHE_KEYWORDS[i];
            for (var j = 0; j < group.words.length; j++) {
                if (t.indexOf(group.words[j]) !== -1) return group.value;
            }
        }
        return 'corporate';
    }

    function normalizePhone(raw) {
        var digits = (raw || '').replace(/\D/g, '');
        if (!digits) return '';
        if (digits.length <= 11) digits = '55' + digits; // adiciona DDI se só veio DDD+numero
        return digits;
    }

    function buildStyleString() {
        return state.selectedPalette !== null ? 'moderno, premium, ' + PALETTES[state.selectedPalette].style : 'moderno, premium';
    }

    function waLink(number, text) {
        return 'https://wa.me/' + number + (text ? '?text=' + encodeURIComponent(text) : '');
    }

    function show(id) {
        ['crie-form', 'step-loading', 'step-ready', 'step-error'].forEach(function (s) {
            $(s).classList.toggle('hidden', s !== id);
        });
    }

    var AxoCrie = {
        submit: function (e) {
            e.preventDefault();
            var name = $('f-name').value.trim();
            var niche = $('f-niche').value.trim();
            var description = $('f-description').value.trim();
            var phone = normalizePhone($('f-phone').value.trim());
            var err = $('form-err');

            if (!name || !niche) {
                err.textContent = 'Preenche o nome da empresa e a área de atuação.';
                err.classList.remove('hidden');
                return;
            }
            if (!description || description.length < 10) {
                err.textContent = 'Conta um pouco mais sobre a empresa (mínimo 10 caracteres).';
                err.classList.remove('hidden');
                return;
            }
            if (!phone || phone.length < 12) {
                err.textContent = 'Informa um WhatsApp válido com DDD.';
                err.classList.remove('hidden');
                return;
            }
            err.classList.add('hidden');

            state.payload = {
                businessName: name,
                niche: niceToNiche(niche),
                description: description,
                phone: phone,
                city: $('f-city').value.trim() || 'Brasil',
                style: buildStyleString(),
                skipRefine: true
            };

            AxoCrie._submit();
        },

        _submit: function () {
            show('step-loading');
            $('gen-steps').innerHTML = '<div class="gen-step active text-sm text-white/70">Enviando dados para a I.A...</div>';

            fetch(API_BASE + '/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.payload)
            })
                .then(function (r) {
                    if (!r.ok) throw new Error('http_' + r.status);
                    return r.json();
                })
                .then(function (data) {
                    if (!data.executionId) throw new Error('sem_execution_id');
                    state.executionId = data.executionId;
                    state.pollCount = 0;
                    AxoCrie._poll();
                })
                .catch(function (e) {
                    console.error('[crie] generate failed:', e);
                    AxoCrie._showError();
                });
        },

        _poll: function () {
            if (state.pollCount >= MAX_POLLS) { AxoCrie._showError(); return; }
            state.pollCount++;

            fetch(API_BASE + '/api/status/' + state.executionId)
                .then(function (r) {
                    if (!r.ok) throw new Error('http_' + r.status);
                    return r.json();
                })
                .then(function (data) {
                    AxoCrie._renderSteps(data.steps || []);

                    if (data.status === 'finished') {
                        // publishedUrl is the real, permanent <slug>.axolutions.com.br
                        // site; previewUrl is a temporary render kept only for the
                        // rare case a slug couldn't be derived and nothing was published.
                        state.finalUrl = data.publishedUrl || data.previewUrl || data.url || null;
                        if (!state.finalUrl) throw new Error('sem_url_final');
                        AxoCrie._redirect();
                    } else if (data.status === 'error') {
                        AxoCrie._showError();
                    } else {
                        state.pollTimer = setTimeout(AxoCrie._poll, POLL_MS);
                    }
                })
                .catch(function (e) {
                    console.error('[crie] poll failed:', e);
                    AxoCrie._showError();
                });
        },

        _renderSteps: function (steps) {
            if (!steps.length) return;
            var wrap = $('gen-steps');
            wrap.innerHTML = steps.map(function (s) {
                var icon = s.status === 'success'
                    ? '<svg class="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>'
                    : s.status === 'error'
                        ? '<svg class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>'
                        : '<span class="w-4 h-4 shrink-0 rounded-full border-2 border-white/20 border-t-purple-400 spin inline-block"></span>';
                var cls = s.status === 'success' ? 'gen-step done' : (s.status === 'running' ? 'gen-step active' : 'gen-step');
                return '<div class="' + cls + ' flex items-center gap-2.5 text-sm text-white/75">' + icon + '<span>' + (s.name || s.id) + '</span></div>';
            }).join('');
        },

        _redirect: function () {
            clearTimeout(state.pollTimer);
            $('ready-link').href = state.finalUrl;
            show('step-ready');
            setTimeout(function () { window.location.href = state.finalUrl; }, 1200);
        },

        _showError: function () {
            clearTimeout(state.pollTimer);
            var bn = (state.payload && state.payload.businessName) || '';
            var msg = bn
                ? 'Olá! Tentei gerar uma prévia automática do site da ' + bn + ' mas não deu certo. Podem me ajudar a criar o site?'
                : 'Olá! Tentei gerar uma prévia automática do meu site mas não deu certo. Podem me ajudar?';
            $('error-wa-link').href = waLink(OUR_WA, msg);
            show('step-error');
        },

        retry: function () {
            if (state.payload) {
                state.pollCount = 0;
                AxoCrie._submit();
            } else {
                show('crie-form');
            }
        }
    };

    window.AxoCrie = AxoCrie;

    document.addEventListener('DOMContentLoaded', function () {
        buildSwatches();
        $('crie-form').addEventListener('submit', AxoCrie.submit);
    });
})();
