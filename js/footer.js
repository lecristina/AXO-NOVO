/* footer.js — OBSOLETO, mantido apenas como rede de segurança.
 *
 * O rodapé agora é HTML ESTÁTICO, presente direto em cada página. O motivo:
 * quando ele era injetado por JavaScript, crawlers que não executam JS
 * (GPTBot, ClaudeBot, PerplexityBot e parte do Bingbot) não liam razão social,
 * CNPJ, contato nem os links internos do rodapé — nada disso existia no HTML
 * que eles recebiam.
 *
 * A fonte de verdade do rodapé é: scripts/build-footer.js  (npm run footer:build)
 * Não edite o rodapé aqui — a alteração não apareceria em página nenhuma.
 *
 * Nenhuma página referencia mais este arquivo. Se alguma voltar a referenciar,
 * a guarda abaixo evita rodapé duplicado e avisa no console.
 */
(function () {
    'use strict';

    if (document.querySelector('footer[data-axo-footer]')) return;

    if (window.console && console.warn) {
        console.warn(
            '[axolutions] Esta página não tem rodapé estático. ' +
            'Rode "npm run footer:build" para injetá-lo no HTML.'
        );
    }
}());
