/* footer.js — Shared footer component for Axolutions
 * Reads window.AXO_CONFIG.page to highlight the active page link.
 */
(function () {
    'use strict';

    var page = (window.AXO_CONFIG || {}).page || '';
    var year = new Date().getFullYear();

    function ac(id) { /* active class */
        return id === page ? 'text-primary' : 'hover:text-primary transition-colors';
    }

    var html =
        '<footer class="bg-[#080810] text-gray-400 pt-20 pb-8 px-4">' +
        '<div class="max-w-7xl mx-auto">' +
            '<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">' +
                /* col 1 – brand */
                '<div>' +
                    '<div class="flex items-center gap-2.5 mb-5">' +
                        '<img src="images/logo.png" alt="Axolutions" class="h-9 w-auto">' +
                        '<span class="text-xl font-display font-bold text-white">Axolutions</span>' +
                    '</div>' +
                    '<p class="text-sm leading-relaxed text-gray-500">Startup líder em desenvolvimento de softwares inovadores. Transformamos ideias em soluções digitais de alto impacto.</p>' +
                '</div>' +
                /* col 2 – páginas */
                '<div>' +
                    '<h4 class="text-white font-display font-semibold mb-5">Páginas</h4>' +
                    '<nav class="flex flex-col gap-3 text-sm">' +
                        '<a href="index.html"       class="' + ac('') + '">Início</a>' +
                        '<a href="sobre.html"       class="' + ac('sobre') + '">Sobre</a>' +
                        '<a href="blog.html"        class="' + ac('blog') + '">Blog</a>' +
                        '<a href="projetos.html"    class="' + ac('projetos') + '">Projetos</a>' +
                        '<a href="depoimentos.html" class="' + ac('depoimentos') + '">Depoimentos</a>' +
                        '<a href="criadores.html"   class="' + ac('criadores') + '">Equipe</a>' +
                        '<a href="admin.html"       class="hover:text-primary transition-colors">Painel Admin</a>' +
                    '</nav>' +
                '</div>' +
                /* col 3 – serviços */
                '<div>' +
                    '<h4 class="text-white font-display font-semibold mb-5">Serviços</h4>' +
                    '<nav class="flex flex-col gap-3 text-sm">' +
                        '<a href="index.html#servicos" class="hover:text-primary transition-colors">Desenvolvimento de Sites</a>' +
                        '<a href="index.html#servicos" class="hover:text-primary transition-colors">Sistemas Web</a>' +
                        '<a href="index.html#servicos" class="hover:text-primary transition-colors">Automações</a>' +
                        '<a href="index.html#servicos" class="hover:text-primary transition-colors">Sistemas ERP</a>' +
                        '<a href="index.html#servicos" class="hover:text-primary transition-colors">Aplicativos Mobile</a>' +
                        '<a href="index.html#servicos" class="hover:text-primary transition-colors">E-commerce</a>' +
                    '</nav>' +
                '</div>' +
                /* col 4 – seções */
                '<div>' +
                    '<h4 class="text-white font-display font-semibold mb-5">Seções</h4>' +
                    '<nav class="flex flex-col gap-3 text-sm">' +
                        '<a href="index.html#servicos"    class="hover:text-primary transition-colors">Nossos Serviços</a>' +
                        '<a href="index.html#previa"      class="hover:text-primary transition-colors">Prévia Gratuita</a>' +
                        '<a href="index.html#depoimentos" class="hover:text-primary transition-colors">Depoimentos</a>' +
                        '<a href="index.html#cosmos"      class="hover:text-primary transition-colors">Cosmos Digital</a>' +
                        '<a href="index.html#faq"         class="hover:text-primary transition-colors">FAQ</a>' +
                        '<a href="index.html#contato"     class="hover:text-primary transition-colors">Contato</a>' +
                    '</nav>' +
                '</div>' +
            '</div>' +
            '<div class="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">' +
                '<p class="text-sm text-gray-600">&copy; ' + year + ' Axolutions. Todos os direitos reservados.</p>' +
                '<div class="flex gap-6 text-sm">' +
                    '<a href="https://geremeusite.com.br" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors">GereMeuSite</a>' +
                    '<a href="blog.html"       class="hover:text-primary transition-colors">Blog</a>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '</footer>';

    document.body.insertAdjacentHTML('beforeend', html);

}());
