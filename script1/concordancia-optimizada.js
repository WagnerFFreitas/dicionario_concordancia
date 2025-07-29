/**
 * Sistema de concordância otimizado com carregamento sob demanda
 */
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
        // Nova propriedade: número total de resultados exibidos até agora
        this.visibleCount = 0;
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

        this.elements.buscaGlobal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performGlobalSearch();
            }
        });

        let debounceTimeout;
        this.elements.buscaGlobal.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                const searchTerm = e.target.value.trim();
                if (!searchTerm) {
                    this.searchTerm = '';
                    this.filters.testamento = 'todos';
                    this.filters.livro = 'todos';
                    if (this.elements.filtroPalavra) {
                        this.elements.filtroPalavra.value = '';
                        this.elements.filtroPalavra.disabled = false;
                    }
                    this.resetDropdowns();
                    this.selectLetter(this.currentLetter);
                } else {
                    this.elements.resultadosContainer.innerHTML = '';
                    this.elements.contadorResultados.style.display = 'none';
                    this.elements.carregarMais.style.display = 'none';
                    if (this.elements.filtroPalavra) {
                        this.elements.filtroPalavra.disabled = true;
                    }
                }
            }, 300);
        });

        this.elements.filtroPalavra.addEventListener('input', (e) => {
            if (!this.elements.filtroPalavra.disabled) {
                this.filterCurrentResults(e.target.value);
            }
        });

        this.setupCustomDropdownEvents();
    }

    setupCustomDropdownEvents() {
        this.setupTestamentoDropdown();
        this.setupLivroDropdown();
        this.setupDropdownToggleEvents();
    }

    setupTestamentoDropdown() {
        const testamentoSelect = document.getElementById('custom-testamento-select');
        if (!testamentoSelect) return;
        const selectedDisplay = testamentoSelect.querySelector('.select-selected');
        const itemsContainer = testamentoSelect.querySelector('.select-items');
        if (!selectedDisplay || !itemsContainer) return;

        selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllDropdowns();
            itemsContainer.classList.toggle('select-hide');
            selectedDisplay.classList.toggle('select-arrow-active');
        });

        itemsContainer.querySelectorAll('div').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const valor = item.getAttribute('data-value') || 'todos';
                const texto = item.textContent;
                selectedDisplay.textContent = texto;
                selectedDisplay.setAttribute('data-value', valor);
                itemsContainer.querySelectorAll('div').forEach(div => div.classList.remove('same-as-selected'));
                item.classList.add('same-as-selected');
                this.filters.testamento = valor;
                this.updateLivroDropdown(valor);
                this.renderFilteredResults();
                this.closeAllDropdowns();
                console.log(`[FILTRO] Testamento selecionado: ${valor}`);
            });
        });
    }

    setupLivroDropdown() {
        const livroSelect = document.getElementById('custom-livro-select');
        if (!livroSelect) return;
        const selectedDisplay = livroSelect.querySelector('.select-selected');
        const itemsContainer = livroSelect.querySelector('.select-items');
        if (!selectedDisplay || !itemsContainer) return;

        selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllDropdowns();
            itemsContainer.classList.toggle('select-hide');
            selectedDisplay.classList.toggle('select-arrow-active');
        });
    }

    setupDropdownToggleEvents() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                this.closeAllDropdowns();
            }
        });
    }

    closeAllDropdowns() {
        document.querySelectorAll('.custom-select .select-items').forEach(container => {
            container.classList.add('select-hide');
        });
        document.querySelectorAll('.custom-select .select-selected').forEach(display => {
            display.classList.remove('select-arrow-active');
        });
    }

    async loadInitialData() {
        await this.selectLetter('A');
    }

    async selectLetter(letra) {
        if (this.isLoading) return;
        this.updateActiveLetterButton(letra);
        this.currentLetter = letra;
        this.currentPage = 0;
        this.currentResults = [];
        this.visibleCount = 0; // Reset contador
        this.searchTerm = '';
        this.filters = { testamento: 'todos', livro: 'todos' };
        this.elements.buscaGlobal.value = '';
        this.elements.filtroPalavra.value = '';
        this.elements.filtroPalavra.disabled = false;
        this.resetDropdowns();

        await this.loadLetterData(letra, 0, true);
        this.updateLivroDropdown('todos');
    }

    resetDropdowns() {
        const testamentoSelect = document.getElementById('custom-testamento-select');
        if (testamentoSelect) {
            const selected = testamentoSelect.querySelector('.select-selected');
            if (selected) {
                selected.textContent = 'Todos';
                selected.dataset.value = 'todos';
            }
        }
        const livroSelect = document.getElementById('custom-livro-select');
        if (livroSelect) {
            const selected = livroSelect.querySelector('.select-selected');
            if (selected) {
                selected.textContent = 'Todos os livros';
                selected.dataset.value = 'todos';
            }
        }
    }

    async loadLetterData(letra, page = 0, clearResults = false) {
        if (this.isLoading) return;

        if (clearResults) {
            this.elements.resultadosContainer.innerHTML = '';
            this.elements.contadorResultados.style.display = 'none';
            this.elements.carregarMais.style.display = 'none';
        }

        this.showLoading(true);
        this.isLoading = true;

        try {
            const result = await window.dataManager.loadLetterData(letra, page);
            const pageSize = result.data.length;

            if (clearResults) {
                this.currentResults = [];
                this.visibleCount = 0; // Reset
            }

            // Atualiza contador: número total de resultados exibidos até agora
            this.visibleCount = (page + 1) * pageSize;

            this.currentResults = result.data; // Substitui, não acumula
            this.hasMore = result.hasMore;
            this.currentPage = page;

            this.renderResults(result.data, !clearResults);
            this.updateResultsCounter(this.visibleCount, result.total);
            this.updateLoadMoreButton();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados. Tente novamente.');
        } finally {
            this.showLoading(false);
            this.isLoading = false;
        }
    }

    async loadMoreResults() {
        if (!this.hasMore || this.isLoading) return;
        if (this.searchTerm) return;

        await this.loadLetterData(this.currentLetter, this.currentPage + 1, true);
    }

    async performGlobalSearch() {
        const searchTerm = this.elements.buscaGlobal.value.trim();
        if (!searchTerm) {
            this.searchTerm = '';
            this.filters.testamento = 'todos';
            this.filters.livro = 'todos';
            if (this.elements.filtroPalavra) {
                this.elements.filtroPalavra.value = '';
                this.elements.filtroPalavra.disabled = false;
            }
            this.resetDropdowns();
            this.selectLetter(this.currentLetter);
            return;
        }
        if (this.isLoading) return;

        this.elements.resultadosContainer.innerHTML = '';
        this.elements.contadorResultados.style.display = 'none';
        this.elements.carregarMais.style.display = 'none';
        this.showLoading(true);
        this.isLoading = true;
        this.searchTerm = searchTerm;
        this.filters = { testamento: 'todos', livro: 'todos' };
        if (this.elements.filtroPalavra) {
            this.elements.filtroPalavra.value = '';
            this.elements.filtroPalavra.disabled = true;
        }
        this.resetDropdowns();

        try {
            const result = await this.searchInAllFiles(searchTerm);
            this.currentResults = result.data;
            this.hasMore = false;
            this.visibleCount = result.data.length; // Na busca global, mostra tudo

            this.renderResults(result.data, false);
            this.updateResultsCounter(this.visibleCount, result.total);
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

    filterCurrentResults(filterTerm) {
        this.renderFilteredResults();
    }

    renderFilteredResults() {
        let filteredData = [...this.currentResults];
        const filterTerm = this.elements.filtroPalavra?.value?.trim() || '';
        if (filterTerm && !this.elements.filtroPalavra.disabled) {
            filteredData = filteredData.filter(item => 
                item.palavra.toLowerCase().includes(filterTerm.toLowerCase())
            );
        }
        if (this.filters.testamento !== 'todos') {
            filteredData = filteredData.map(item => {
                const filteredConcordancias = item.concordancias.filter(concordancia => {
                    const nomeLivro = this.extractBookName(concordancia.referencia);
                    const testamento = this.getBookTestament(nomeLivro);
                    return testamento === this.filters.testamento;
                });
                return filteredConcordancias.length > 0 ? { ...item, concordancias: filteredConcordancias, ocorrencias: filteredConcordancias.length } : null;
            }).filter(item => item !== null);
        }
        if (this.filters.livro !== 'todos') {
            filteredData = filteredData.map(item => {
                const filteredConcordancias = item.concordancias.filter(concordancia => {
                    const nomeLivro = this.extractBookName(concordancia.referencia);
                    const livroConfig = this.findBookById(this.filters.livro);
                    return livroConfig && nomeLivro.toLowerCase() === livroConfig.nome.toLowerCase();
                });
                return filteredConcordancias.length > 0 ? { ...item, concordancias: filteredConcordancias, ocorrencias: filteredConcordancias.length } : null;
            }).filter(item => item !== null);
        }

        this.elements.resultadosContainer.innerHTML = '';
        this.renderResults(filteredData, false);
        this.updateResultsCounter(filteredData.length, this.currentResults.length);
    }

    updateLivroDropdown(testamentoSelecionado) {
        const livroSelect = document.getElementById('custom-livro-select');
        if (!livroSelect) return;
        const itemsContainer = livroSelect.querySelector('.select-items');
        const selectedDisplay = livroSelect.querySelector('.select-selected');
        if (!itemsContainer || !selectedDisplay) return;

        itemsContainer.innerHTML = '';
        const todosOption = document.createElement('div');
        todosOption.textContent = 'Todos os livros';
        todosOption.setAttribute('data-value', 'todos');
        todosOption.classList.add('same-as-selected');
        itemsContainer.appendChild(todosOption);

        const livros = this.getLivrosPorTestamento(testamentoSelecionado);
        livros.forEach(livro => {
            const option = document.createElement('div');
            option.textContent = livro.nome;
            option.setAttribute('data-value', livro.id);
            itemsContainer.appendChild(option);
        });

        selectedDisplay.textContent = 'Todos os livros';
        selectedDisplay.setAttribute('data-value', 'todos');
        this.filters.livro = 'todos';

        itemsContainer.querySelectorAll('div').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const valor = item.getAttribute('data-value') || 'todos';
                const texto = item.textContent;
                selectedDisplay.textContent = texto;
                selectedDisplay.setAttribute('data-value', valor);
                itemsContainer.querySelectorAll('div').forEach(div => div.classList.remove('same-as-selected'));
                item.classList.add('same-as-selected');
                this.filters.livro = valor;
                this.renderFilteredResults();
                this.closeAllDropdowns();
                console.log(`[FILTRO] Livro selecionado: ${valor}`);
            });
        });
    }

    getLivrosPorTestamento(testamento) {
        const todosLivros = [
            { id: 'gn', nome: 'Gênesis', testamento: 'Antigo Testamento' },
            { id: 'ex', nome: 'Êxodo', testamento: 'Antigo Testamento' },
            { id: 'lv', nome: 'Levítico', testamento: 'Antigo Testamento' },
            { id: 'nm', nome: 'Números', testamento: 'Antigo Testamento' },
            { id: 'dt', nome: 'Deuteronômio', testamento: 'Antigo Testamento' },
            // ... (todos os livros)
            { id: 'ap', nome: 'Apocalipse', testamento: 'Novo Testamento' }
        ];
        if (testamento === 'todos') return todosLivros;
        return todosLivros.filter(livro => livro.testamento === testamento);
    }

    extractBookName(referencia) {
        if (!referencia) return '';
        const match = referencia.match(/^([A-Za-zÀ-ÿ\s0-9]+)(?=\s*\d)/);
        return match ? match[1].trim() : referencia.split(' ')[0].trim();
    }

    getBookTestament(nomeLivro) {
        const bibliaConfig = {
            'Antigo Testamento': ['Gênesis', 'Êxodo', /* ... */ 'Malaquias'],
            'Novo Testamento': ['Mateus', 'Marcos', /* ... */ 'Apocalipse']
        };
        for (const [testamento, livros] of Object.entries(bibliaConfig)) {
            if (livros.some(livro => livro.toLowerCase() === nomeLivro.toLowerCase())) {
                return testamento;
            }
        }
        return null;
    }

    findBookById(bookId) {
        const livros = [
            { id: 'gn', nome: 'Gênesis' }, { id: 'ex', nome: 'Êxodo' }, /* ... */ { id: 'ap', nome: 'Apocalipse' }
        ];
        return livros.find(l => l.id === bookId);
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
                            } else if (item.concordancias) {
                                const regex = new RegExp(`\\b${searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                                matchingConcordancias = item.concordancias.filter(concordancia => regex.test(concordancia.texto));
                            }
                            if (item.fonte && item.fonte.toLowerCase().includes(searchLower)) {
                                matchingConcordancias = item.concordancias || [];
                            }
                            if (item['veja tambem']) {
                                const hasVejaTambem = item['veja tambem'].some(vt => vt.toLowerCase().includes(searchLower));
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
                        console.warn(`Erro ao carregar ${fileName}.json:`, fileError);
                    }
                }
            } catch (letterError) {
                console.warn(`Erro na letra ${letter}:`, letterError);
            }
        }
        allResults.sort((a, b) => {
            const aExact = a.palavra.toLowerCase() === searchLower;
            const bExact = b.palavra.toLowerCase() === searchLower;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return b.ocorrencias - a.ocorrencias;
        });
        return { data: allResults, total: allResults.length };
    }

    renderResults(data, append = false) {
        if (!append) {
            this.elements.resultadosContainer.innerHTML = '';
        }
        if (data.length === 0 && !append) {
            this.showNoResults();
            return;
        }
        const fragment = document.createDocumentFragment();
        data.forEach(item => {
            const palavraElement = this.createPalavraElement(item);
            fragment.appendChild(palavraElement);
        });
        this.elements.resultadosContainer.appendChild(fragment);
        this.elements.resultadosContainer.style.display = 'none';
        this.elements.resultadosContainer.offsetHeight;
        this.elements.resultadosContainer.style.display = '';
    }

    createPalavraElement(item) {
        const palavraDiv = document.createElement('div');
        palavraDiv.className = 'palavra-item';
        const header = document.createElement('div');
        header.className = 'palavra-header';
        header.innerHTML = `
            <div class="palavra-titulo">${item.palavra.toUpperCase()}</div>
            <div class="palavra-info">
                <div class="palavra-detalhes">
                    ${item.fonte ? `<div class="fonte-info">Fonte: ${item.fonte}</div>` : ''}
                    ${item['veja tambem'] && item['veja tambem'].length > 0 ? 
                        `<div class="veja-tambem"><strong>Veja também:</strong> ${item['veja tambem'].join(', ')}</div>` : ''}
                </div>
                <div class="ocorrencias-count">${item.ocorrencias} ocorrência${item.ocorrencias !== 1 ? 's' : ''}</div>
            </div>
            <div class="expand-indicator">▼</div>
        `;
        const content = document.createElement('div');
        content.className = 'concordancias-content';
        if (item.concordancias && item.concordancias.length > 0) {
            content.innerHTML = item.concordancias.map(concordancia => `
                <div class="concordancia-item">
                    <div class="referencia">${concordancia.referencia}</div>
                    <div class="texto-versiculo">${this.highlightSearchTerm(concordancia.texto, this.searchTerm || item.palavra)}</div>
                </div>
            `).join('');
        }
        header.addEventListener('click', () => {
            const isExpanded = content.classList.contains('expanded');
            const indicator = header.querySelector('.expand-indicator');
            if (isExpanded) {
                content.classList.remove('expanded');
                indicator.classList.remove('expanded');
            } else {
                content.classList.add('expanded');
                indicator.classList.add('expanded');
            }
        });
        palavraDiv.appendChild(header);
        palavraDiv.appendChild(content);
        return palavraDiv;
    }

    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="palavra-destacada">$1</span>');
    }

    updateActiveLetterButton(letra) {
        this.elements.letrasBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.letra === letra) {
                btn.classList.add('active');
            }
        });
    }

    updateResultsCounter(visible, total) {
        this.elements.resultadosVisiveis.textContent = visible;
        this.elements.totalResultados.textContent = total;
        if (visible > 0) {
            this.elements.contadorResultados.style.display = 'block';
        } else {
            this.elements.contadorResultados.style.display = 'none';
        }
    }

    updateLoadMoreButton() {
        if (this.hasMore && !this.searchTerm) {
            this.elements.carregarMais.style.display = 'block';
        } else {
            this.elements.carregarMais.style.display = 'none';
        }
    }

    showLoading(show) {
        if (show) {
            this.elements.loadingIndicator.style.display = 'block';
            this.elements.resultadosContainer.style.visibility = 'hidden';
            this.elements.contadorResultados.style.display = 'none';
            this.elements.carregarMais.style.display = 'none';
        } else {
            this.elements.loadingIndicator.style.display = 'none';
            this.elements.resultadosContainer.style.visibility = 'visible';
        }
    }

    showError(message) {
        this.elements.resultadosContainer.innerHTML = `
            <div class="sem-resultados">
                <h3>Erro</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showNoResults(message = 'Nenhum resultado encontrado.') {
        this.elements.resultadosContainer.innerHTML = `
            <div class="sem-resultados">
                <h3>Sem resultados</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.concordanciaOptimized = new ConcordanciaOptimized();
});