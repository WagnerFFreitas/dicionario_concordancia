// concordancia-optimizada.js - Arquivo completo corrigido por Gabby

class ConcordanciaOptimized {
    constructor() {
        this.currentLetter = 'A';
        this.currentPage = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentResults = [];
        this.searchTerm = '';
        this.filters = {
            testamento: 'todos',
            livro: 'todos'
        };

        this.initializeElements();
        this.bindEvents();
        this.loadInitialData();
    }

    initializeElements() {
        this.elements = {
            resultadosContainer: document.getElementById('resultados-container'),
            loadingIndicator: document.getElementById('loading-indicator'),
            contadorResultados: document.getElementById('contador-resultados'),
            resultadosVisiveis: document.getElementById('resultados-visiveis'),
            totalResultados: document.getElementById('total-resultados'),
            carregarMais: document.getElementById('carregar-mais'),
            filtroPalavra: document.getElementById('filtro-palavra-input'),
            testamentoSelect: document.getElementById('testamento-select'),
            livroSelect: document.getElementById('livro-select'),
            buscaGlobal: document.getElementById('busca-global'),
            btnBuscar: document.getElementById('btn-buscar'),
            letrasBtns: document.querySelectorAll('.letra-btn')
        };
    }

    bindEvents() {
        this.elements.letrasBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const letra = e.target.dataset.letra;
                this.selectLetter(letra);
            });
        });

        this.elements.carregarMais.addEventListener('click', () => {
            this.loadMoreResults();
        });

        this.elements.btnBuscar.addEventListener('click', () => {
            this.performGlobalSearch();
        });

        this.elements.buscaGlobal.addEventListener('input', (e) => {
            if (e.target.value.trim().length === 0) {
                this.performGlobalSearch();
            }
        });

        this.elements.buscaGlobal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performGlobalSearch();
            }
        });

        this.elements.filtroPalavra.addEventListener('input', (e) => {
            this.filterCurrentResults(e.target.value);
        });

        this.setupCustomDropdownEvents();
    }

    async performGlobalSearch() {
        const searchTerm = this.elements.buscaGlobal.value.trim();

        if (!searchTerm || searchTerm.length === 0) {
            this.searchTerm = '';
            this.selectLetter(this.currentLetter);
            return;
        }

        if (this.isLoading) return;

        this.showLoading(true);
        this.isLoading = true;
        this.searchTerm = searchTerm;

        try {
            const result = await this.searchInAllFiles(searchTerm);

            this.currentResults = result.data;
            this.hasMore = false;

            this.elements.resultadosContainer.innerHTML = '';
            this.renderResults(result.data, false);
            this.updateResultsCounter(result.data.length, result.total);
            this.updateLoadMoreButton();

            if (result.data.length === 0) {
                this.showNoResults(`Nenhum resultado encontrado para "${searchTerm}".`);
            }

        } catch (error) {
            console.error('Erro na busca global:', error);
            this.showError('Erro ao realizar busca. Tente novamente.');
        } finally {
            this.showLoading(false);
            this.isLoading = false;
        }
    }

    async searchInAllFiles(searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const allResults = [];
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

        this.elements.loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Buscando "${searchTerm}" em todos os arquivos...</p>
        `;

        for (const letter of letters) {
            try {
                await window.dataManager.loadLetterList();
                const letterFiles = window.dataManager.listaLetras[letter] || [];

                for (const fileName of letterFiles) {
                    try {
                        const response = await fetch(`/concordancia/${letter}/${fileName}.json`);
                        if (!response.ok) continue;

                        const jsonData = await response.json();
                        const wordEntries = jsonData[letter] || [];

                        wordEntries.forEach(item => {
                            let matchingConcordancias = [];
                            let wordMatches = false;

                            if (item.palavra && item.palavra.toLowerCase().includes(searchLower)) {
                                wordMatches = true;
                                matchingConcordancias = item.concordancias || [];
                            }

                            if (!wordMatches && item.concordancias) {
                                const regex = new RegExp(`\b${searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\$&')}\b`, 'gi');
                                matchingConcordancias = item.concordancias.filter(concordancia =>
                                    regex.test(concordancia.texto)
                                );
                            }

                            if (!wordMatches && !matchingConcordancias.length && item.fonte) {
                                if (item.fonte.toLowerCase().includes(searchLower)) {
                                    matchingConcordancias = item.concordancias || [];
                                }
                            }

                            if (!wordMatches && !matchingConcordancias.length && item['veja tambem']) {
                                const hasVejaTambem = item['veja tambem'].some(vt =>
                                    vt.toLowerCase().includes(searchLower)
                                );
                                if (hasVejaTambem) {
                                    matchingConcordancias = item.concordancias || [];
                                }
                            }

                            if (matchingConcordancias.length > 0) {
                                allResults.push({
                                    ...item,
                                    concordancias: matchingConcordancias,
                                    ocorrencias: matchingConcordancias.length
                                });
                            }
                        });

                    } catch (fileError) {
                        console.warn(`Erro ao carregar arquivo ${fileName}.json:`, fileError);
                    }
                }

            } catch (letterError) {
                console.warn(`Erro ao processar letra ${letter}:`, letterError);
            }
        }

        allResults.sort((a, b) => {
            const aExact = a.palavra.toLowerCase() === searchLower;
            const bExact = b.palavra.toLowerCase() === searchLower;

            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            return b.ocorrencias - a.ocorrencias;
        });

        return {
            data: allResults,
            total: allResults.length
        };
    }

    // Outras funções como selectLetter(), renderResults() etc. devem estar no projeto original.
}

document.addEventListener('DOMContentLoaded', () => {
    window.concordanciaOptimized = new ConcordanciaOptimized();
});