/* data.js - Data Manager with localStorage */
var DataManager = {
    keys: { POSTS: 'axo_posts', PROJECTS: 'axo_projects', TEAM: 'axo_team', TESTIMONIALS: 'axo_testimonials', INIT: 'axo_init', SETTINGS: 'axo_settings' },
    getData: function(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; } },
    setData: function(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
    addItem: function(key, item) { var data = this.getData(key); item.id = Date.now().toString(); data.push(item); this.setData(key, data); return item; },
    updateItem: function(key, id, updates) { var data = this.getData(key); var idx = data.findIndex(function(i) { return i.id === id; }); if (idx > -1) { Object.assign(data[idx], updates); this.setData(key, data); return true; } return false; },
    deleteItem: function(key, id) { var data = this.getData(key).filter(function(i) { return i.id !== id; }); this.setData(key, data); },
    getItem: function(key, id) { return this.getData(key).find(function(i) { return i.id === id; }) || null; },
    getSettings: function() { try { return JSON.parse(localStorage.getItem(this.keys.SETTINGS)) || {}; } catch(e) { return {}; } },
    saveSettings: function(data) { localStorage.setItem(this.keys.SETTINGS, JSON.stringify(data)); },
    init: function() {
        if (localStorage.getItem(this.keys.INIT)) return;

        this.setData(this.keys.POSTS, [
            { id: '1', title: 'Como criar um site que converte em 2025', excerpt: 'Descubra as melhores praticas para criar sites que realmente geram resultados para seu negocio.', content: '<p>Criar um site que converte visitantes em clientes requer uma combinacao de design intuitivo, conteudo relevante e otimizacao tecnica.</p><p>Neste artigo, exploramos as principais estrategias que utilizamos na Axolutions para garantir que cada projeto entregue resultados mensuraveis.</p><h2>1. Design Focado no Usuario</h2><p>O primeiro passo e entender quem e seu publico-alvo e o que ele busca.</p><h2>2. Velocidade de Carregamento</h2><p>Sites lentos perdem visitantes. Otimizamos cada detalhe para garantir carregamento em menos de 3 segundos.</p><h2>3. Call-to-Actions Estrategicos</h2><p>Botoes e formularios posicionados estrategicamente guiam o usuario para a conversao.</p>', category: 'Desenvolvimento', date: '2025-01-15', image: '' },
            { id: '2', title: 'A importancia de um app mobile para sua empresa', excerpt: 'Entenda por que ter um aplicativo mobile pode ser o diferencial competitivo que sua empresa precisa.', content: '<p>Com mais de 80% do trafego web vindo de dispositivos moveis, ter um aplicativo dedicado pode transformar seu negocio.</p><h2>Vantagens de um App</h2><p>Push notifications, acesso offline e integracao nativa com funcoes do dispositivo.</p>', category: 'Mobile', date: '2025-01-10', image: '' },
            { id: '3', title: 'SEO: O guia completo para rankear no Google', excerpt: 'Aprenda tecnicas avancadas de SEO para posicionar seu site nas primeiras paginas do Google.', content: '<p>SEO (Search Engine Optimization) e fundamental para qualquer estrategia digital.</p><h2>Palavras-chave</h2><p>A pesquisa de palavras-chave e o ponto de partida para qualquer estrategia de SEO.</p><h2>Conteudo de Qualidade</h2><p>O Google valoriza conteudo original, relevante e atualizado.</p>', category: 'SEO', date: '2025-01-05', image: '' }
        ]);

        this.setData(this.keys.PROJECTS, [
            { id: '1', title: 'E-commerce Premium', description: 'Loja virtual completa com sistema de pagamento integrado, painel administrativo e design responsivo.', category: 'E-commerce', techs: ['React', 'Node.js', 'MongoDB'], image: '', link: '', client: 'TechStart', date: '2025-01-20', status: 'published', content: '<h2>Sobre o Projeto</h2><p>Desenvolvemos uma plataforma de e-commerce completa e moderna, com foco em performance e experiencia do usuario.</p><h2>Funcionalidades</h2><ul><li>Catalogo de produtos com filtros avancados</li><li>Carrinho de compras inteligente</li><li>Checkout otimizado com multiplas formas de pagamento</li><li>Dashboard administrativo completo</li><li>Integracoes com correios e gateways de pagamento</li></ul><h2>Resultado</h2><p>A plataforma gerou um aumento de 200% nas vendas online do cliente nos primeiros 3 meses de operacao.</p>', gallery: [] },
            { id: '2', title: 'App de Delivery', description: 'Aplicativo mobile para delivery com rastreamento em tempo real e sistema de avaliacoes.', category: 'Mobile', techs: ['React Native', 'Firebase', 'Maps API'], image: '', link: '', client: 'FoodExpress', date: '2025-01-15', status: 'published', content: '<h2>O Desafio</h2><p>O cliente precisava de um aplicativo de delivery que oferecesse uma experiencia fluida tanto para consumidores quanto para entregadores.</p><h2>Solucao</h2><p>Criamos um app nativo com rastreamento GPS em tempo real, sistema de avaliacoes, notificacoes push e painel administrativo para gestao de pedidos.</p><h2>Tecnologias</h2><p>Utilizamos React Native para desenvolvimento cross-platform, Firebase para backend em tempo real e Google Maps API para rastreamento.</p>', gallery: [] },
            { id: '3', title: 'Sistema ERP Completo', description: 'Sistema de gestao empresarial com modulos de financeiro, estoque, RH e vendas.', category: 'Sistema', techs: ['Vue.js', 'Python', 'PostgreSQL'], image: '', link: '', client: 'DigiFlow', date: '2025-01-10', status: 'published', content: '<h2>Visao Geral</h2><p>Sistema ERP desenvolvido sob medida para otimizar todos os processos internos da empresa cliente.</p><h2>Modulos</h2><ul><li><strong>Financeiro:</strong> Contas a pagar/receber, fluxo de caixa, DRE</li><li><strong>Estoque:</strong> Controle de entrada/saida, inventario, alertas de reposicao</li><li><strong>RH:</strong> Folha de pagamento, controle de ponto, ferias</li><li><strong>Vendas:</strong> CRM integrado, funil de vendas, relatorios</li></ul><h2>Impacto</h2><p>Reducao de 60% no tempo de processos administrativos e aumento de 40% na produtividade geral.</p>', gallery: [] }
        ]);

        this.setData(this.keys.TEAM, [
            { id: '1', name: 'Cristian', role: 'CEO & Fundador', bio: 'Lider visionario com paixao por tecnologia e inovacao.', image: '', social: {} },
            { id: '2', name: 'Guilherme', role: 'CTO & Co-Fundador', bio: 'Especialista em arquitetura de software e novas tecnologias.', image: '', social: {} },
            { id: '3', name: 'Joao Gabriel', role: 'Design Lead', bio: 'Designer premiado focado em experiencias digitais impactantes.', image: '', social: {} },
            { id: '4', name: 'Henrique', role: 'Dev Full Stack', bio: 'Desenvolvedor versátil com dominio em front-end e back-end.', image: '', social: {} }
        ]);

        this.setData(this.keys.TESTIMONIALS, [
            { id: '1', name: 'Maria Silva', role: 'CEO - TechStart', text: 'A Axolutions superou todas as nossas expectativas. O site ficou incrivel e as conversoes aumentaram 150% no primeiro mes.', rating: 5, image: '' },
            { id: '2', name: 'Carlos Santos', role: 'Diretor - Inovativa', text: 'Profissionalismo e qualidade impecavel. O aplicativo que desenvolveram para nossa empresa ficou perfeito em todos os detalhes.', rating: 5, image: '' },
            { id: '3', name: 'Ana Oliveira', role: 'Marketing - GrowUp', text: 'Melhor equipe de desenvolvimento que ja trabalhamos. Entregaram tudo no prazo e com qualidade excepcional.', rating: 5, image: '' },
            { id: '4', name: 'Roberto Lima', role: 'Fundador - DigiFlow', text: 'O sistema ERP que a Axolutions desenvolveu transformou nossa operacao. Automatizamos processos e reduzimos custos significativamente.', rating: 5, image: '' },
            { id: '5', name: 'Fernanda Costa', role: 'COO - NextLevel', text: 'Desde o primeiro contato, a equipe foi extremamente profissional e atenciosa. O resultado final foi alem do esperado.', rating: 5, image: '' }
        ]);

        localStorage.setItem(this.keys.INIT, 'true');
    }
};
DataManager.init();
