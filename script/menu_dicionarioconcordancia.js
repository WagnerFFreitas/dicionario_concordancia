/**
 * Script principal - gerencia navegação e inicialização (VERSÃO CORRIGIDA)
 */

class MainApp {
    constructor() {
        // Inicializa os componentes principais da aplicação
        // Isso centraliza o controle e evita problemas de ordem de carregamento
        window.dataManager = new DataManager();
        window.concordanciaOptimized = new ConcordanciaOptimized();
        window.dicionario = new Dicionario();

        this.currentSection = 'concordancia';
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
    }

    initializeElements() {
        this.elements = {
            menuPrincipal: document.getElementById('menu-principal'),
            concordanciaBtn: document.getElementById('concordancia'),
            dicionarioBtn: document.getElementById('dicionario'),
            sobreBtn: document.getElementById('sobre'),
            mensagemInicial: document.getElementById('mensagem-inicial'),
            secaoConcordancia: document.getElementById('secao-concordancia'),
            secaoDicionario: document.getElementById('secao-dicionario'),
            secaoSobre: document.getElementById('secao-sobre'),
            menuAlfabetico: document.querySelector('.menu-alfabetico')
        };
    }

    bindEvents() {
        /* Navegação do menu
        this.elements.menuPrincipal.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('inicial');
        });*/

        this.elements.concordanciaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('concordancia');
        });

        this.elements.dicionarioBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('dicionario');
        });

        this.elements.sobreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('sobre');
        });

        // Eventos de teclado para navegação rápida
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.showSection('concordancia');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showSection('dicionario');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showSection('sobre');
                        break;
                }
            }
        });
    }

    initializeApp() {
        // Inicia na seção de concordância
        this.showSection('concordancia');
        
        console.log('📖 Concordância e Dicionário Bíblico inicializado');
        console.log('⌨️  Atalhos: Ctrl+1 (Concordância), Ctrl+2 (Dicionário), Ctrl+3 (Sobre)');
        
        this.monitorPerformance();
    }

    showSection(sectionName) {
        document.querySelectorAll('.menu-opcoes a').forEach(btn => {
            btn.classList.remove('active');
        });

        this.elements.mensagemInicial.style.display = 'none';
        this.elements.secaoConcordancia.classList.remove('secao-ativa');
        this.elements.secaoConcordancia.classList.add('secao-inativa');
        this.elements.secaoDicionario.classList.remove('secao-ativa');
        this.elements.secaoDicionario.classList.add('secao-inativa');
        this.elements.secaoSobre.classList.remove('secao-ativa');
        this.elements.secaoSobre.classList.add('secao-inativa');

        switch (sectionName) {
            /*case 'inicial':
                this.elements.mensagemInicial.style.display = 'block';
                this.elements.menuAlfabetico.style.display = 'none';
                this.currentSection = 'inicial';
                break;*/

            case 'concordancia':
                this.elements.secaoConcordancia.classList.remove('secao-inativa');
                this.elements.secaoConcordancia.classList.add('secao-ativa');
                this.elements.concordanciaBtn.classList.add('active');
                this.elements.menuAlfabetico.style.display = 'block';
                this.currentSection = 'concordancia';
                break;

            case 'dicionario':
                this.elements.secaoDicionario.classList.remove('secao-inativa');
                this.elements.secaoDicionario.classList.add('secao-ativa');
                this.elements.dicionarioBtn.classList.add('active');
                this.elements.menuAlfabetico.style.display = 'block';
                this.currentSection = 'dicionario';
                // A chamada agora funcionará porque window.dicionario foi criado no construtor
                if (window.dicionario && typeof window.dicionario.init === 'function') {
                    window.dicionario.init();
                }
                break;

            case 'sobre':
                this.elements.secaoSobre.classList.remove('secao-inativa');
                this.elements.secaoSobre.classList.add('secao-ativa');
                this.elements.sobreBtn.classList.add('active');
                this.elements.menuAlfabetico.style.display = 'none';
                this.currentSection = 'sobre';
                break;
        }
        this.updatePageTitle(sectionName);
    }

    updatePageTitle(sectionName) {
        const titles = {
            'inicial': 'Concordância e Dicionário Bíblico',
            'concordancia': 'Concordância Bíblica',
            'dicionario': 'Dicionário Bíblico',
            'sobre': 'Sobre - Concordância e Dicionário Bíblico'
        };
        document.title = titles[sectionName] || 'Concordância e Dicionário Bíblico';
    }

    monitorPerformance() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryInfo = {
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
                };
                if (memoryInfo.used > 100) {
                    console.warn('⚠️ Alto uso de memória:', memoryInfo);
                    if (window.dataManager && memoryInfo.used > 200) {
                        window.dataManager.clearCache();
                        console.log('🧹 Cache limpo para economizar memória');
                    }
                }
            }, 30000);
        }

        window.addEventListener('load', () => {
            if (performance.timing.loadEventEnd > 0) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`);
            }
        });
    }

    getStats() {
        const stats = {
            currentSection: this.currentSection,
            timestamp: new Date().toISOString()
        };
        if (window.dataManager) {
            stats.dataManager = window.dataManager.getCacheStats();
        }
        return stats;
    }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
});

window.debugApp = {
    getStats: () => window.mainApp?.getStats(),
    clearCache: () => window.dataManager?.clearCache(),
    showSection: (section) => window.mainApp?.showSection(section)
};