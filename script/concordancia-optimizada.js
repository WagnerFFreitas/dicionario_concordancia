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
        // Eventos dos botões de letras
        this.elements.letrasBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const letra = e.target.dataset.letra;
                this.selectLetter(letra);
            });
        });

        // Evento do botão carregar mais
        this.elements.carregarMais.addEventListener('click', () => {
            this.loadMoreResults();
        });

        // Eventos de busca
        this.elements.btnBuscar.addEventListener('click', () => {
            this.performGlobalSearch();
        });

        this.elements.buscaGlobal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performGlobalSearch();
            }
        });

        // Evento input para busca global com debounce
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
                        this.elements.filtroPalavra.disabled = false; // Reabilita o filtro de palavra
                    }
                    this.resetDropdowns();
                    this.selectLetter(this.currentLetter); // Recarrega a lista da letra atual
                } else {
                    // Limpa imediatamente a área de resultados quando começar a digitar
                    this.elements.resultadosContainer.innerHTML = '';
                    this.elements.contadorResultados.style.display = 'none';
                    this.elements.carregarMais.style.display = 'none';
                    
                    if (this.elements.filtroPalavra) {
                        this.elements.filtroPalavra.disabled = true; // Desabilita o filtro de palavra
                    }
                }
            }, 300); // Aguarda 300ms após a última digitação
        });

        // Filtro de palavra em tempo real (só será acionado se o campo não estiver desabilitado)
        this.elements.filtroPalavra.addEventListener('input', (e) => {
            if (!this.elements.filtroPalavra.disabled) {
                this.filterCurrentResults(e.target.value);
            }
        });

        // Eventos para dropdowns customizados
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

        // Evento para abrir/fechar dropdown
        selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllDropdowns();
            itemsContainer.classList.toggle('select-hide');
            selectedDisplay.classList.toggle('select-arrow-active');
        });

        // Eventos para os itens do dropdown
        itemsContainer.querySelectorAll('div').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const valor = item.getAttribute('data-value') || 'todos';
                const texto = item.textContent;
                
                // Atualiza display
                selectedDisplay.textContent = texto;
                selectedDisplay.setAttribute('data-value', valor);
                
                // Remove seleção anterior e marca nova
                itemsContainer.querySelectorAll('div').forEach(div => div.classList.remove('same-as-selected'));
                item.classList.add('same-as-selected');
                
                // Atualiza filtro
                this.filters.testamento = valor;
                
                // Atualiza dropdown de livros
                this.updateLivroDropdown(valor);
                
                // Aplica filtros
                this.renderFilteredResults();
                
                // Fecha dropdown
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

        // Evento para abrir/fechar dropdown
        selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllDropdowns();
            itemsContainer.classList.toggle('select-hide');
            selectedDisplay.classList.toggle('select-arrow-active');
        });

        // Eventos para os itens serão configurados dinamicamente em updateLivroDropdown
    }

    setupDropdownToggleEvents() {
        // Fecha dropdowns ao clicar fora
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

        // Atualiza UI
        this.updateActiveLetterButton(letra);
        this.currentLetter = letra;
        this.currentPage = 0;
        this.currentResults = [];
        this.searchTerm = '';
        
        // Reset filtros
        this.filters = {
            testamento: 'todos',
            livro: 'todos'
        };
        
        this.elements.buscaGlobal.value = '';
        this.elements.filtroPalavra.value = '';
        this.elements.filtroPalavra.disabled = false; // Garante que o filtro de palavra esteja habilitado
        
        // Reset dropdowns visuais
        this.resetDropdowns();

        // Carrega dados
        await this.loadLetterData(letra, 0, true);
        
        // Atualiza dropdown de livros baseado no testamento padrão
        this.updateLivroDropdown('todos');
    }
    
    resetDropdowns() {
        // Reset dropdown de testamento
        const testamentoSelect = document.getElementById('custom-testamento-select');
        if (testamentoSelect) {
            const selected = testamentoSelect.querySelector('.select-selected');
            if (selected) {
                selected.textContent = 'Todos';
                selected.dataset.value = 'todos';
            }
        }
        
        // Reset dropdown de livro
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

        // IMEDIATAMENTE limpa a área de resultados antes de iniciar o carregamento
        if (clearResults) {
            this.elements.resultadosContainer.innerHTML = '';
            this.elements.contadorResultados.style.display = 'none';
            this.elements.carregarMais.style.display = 'none';
        }

        this.showLoading(true);
        this.isLoading = true;

        try {
            const result = await window.dataManager.loadLetterData(letra, page);
            
            if (clearResults) {
                this.currentResults = [];
            }

            this.currentResults.push(...result.data);
            this.hasMore = result.hasMore;
            this.currentPage = page;

            // Só renderiza os resultados APÓS o carregamento estar completo
            this.renderResults(result.data, !clearResults);
            this.updateResultsCounter(this.currentResults.length, result.total);
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

        if (this.searchTerm) {
            // Se há busca ativa, não carrega mais (busca já retorna todos os resultados)
            return;
        }

        await this.loadLetterData(this.currentLetter, this.currentPage + 1, false);
    }

    async performGlobalSearch() {
        const searchTerm = this.elements.buscaGlobal.value.trim();

        if (!searchTerm || searchTerm.length === 0) {
            this.searchTerm = '';
            this.filters.testamento = 'todos';
            this.filters.livro = 'todos';
            if (this.elements.filtroPalavra) {
                this.elements.filtroPalavra.value = '';
                this.elements.filtroPalavra.disabled = false; // Reabilita o filtro de palavra
            }
            this.resetDropdowns();
            this.selectLetter(this.currentLetter); // Recarrega a letra atual
            return;
        }

        if (this.isLoading) return;

        // IMEDIATAMENTE limpa a área de resultados antes de iniciar a busca
        this.elements.resultadosContainer.innerHTML = '';
        this.elements.contadorResultados.style.display = 'none';
        this.elements.carregarMais.style.display = 'none';
        
        this.showLoading(true);
        this.isLoading = true;
        this.searchTerm = searchTerm;

        // Reset filtros para garantir que a busca global não seja afetada
        this.filters.testamento = 'todos';
        this.filters.livro = 'todos';
        if (this.elements.filtroPalavra) {
            this.elements.filtroPalavra.value = '';
            this.elements.filtroPalavra.disabled = true; // Desabilita o filtro de palavra
        }
        this.resetDropdowns();

        try {
            const result = await this.searchInAllFiles(searchTerm);

            this.currentResults = result.data;
            this.hasMore = false; // Busca global retorna tudo

            // Só renderiza os resultados APÓS a busca estar completa
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

    filterCurrentResults(filterTerm) {
        // Atualiza o filtro de palavra e reaplica todos os filtros
        this.renderFilteredResults();
    }

    applyFilters() {
        // Aplica todos os filtros de forma integrada
        this.renderFilteredResults();
    }

    renderFilteredResults() {
        let filteredData = [...this.currentResults];
        
        // 1. Filtro por palavra (aplicado primeiro, se não desabilitado)
        const filterTerm = this.elements.filtroPalavra?.value?.trim() || '';
        if (filterTerm && !this.elements.filtroPalavra.disabled) {
            filteredData = filteredData.filter(item => 
                item.palavra.toLowerCase().includes(filterTerm.toLowerCase())
            );
        }

        // 2. Filtro por testamento (aplicado aos resultados filtrados por palavra)
        if (this.filters.testamento !== 'todos') {
            filteredData = filteredData.map(item => {
                const filteredConcordancias = item.concordancias.filter(concordancia => {
                    const nomeLivro = this.extractBookName(concordancia.referencia);
                    const testamento = this.getBookTestament(nomeLivro);
                    return testamento === this.filters.testamento;
                });
                
                if (filteredConcordancias.length > 0) {
                    return {
                        ...item,
                        concordancias: filteredConcordancias,
                        ocorrencias: filteredConcordancias.length
                    };
                }
                return null;
            }).filter(item => item !== null);
        }

        // 3. Filtro por livro (aplicado por último)
        if (this.filters.livro !== 'todos') {
            filteredData = filteredData.map(item => {
                const filteredConcordancias = item.concordancias.filter(concordancia => {
                    const nomeLivro = this.extractBookName(concordancia.referencia);
                    const livroConfig = this.findBookById(this.filters.livro);
                    return livroConfig && nomeLivro.toLowerCase() === livroConfig.nome.toLowerCase();
                });
                
                if (filteredConcordancias.length > 0) {
                    return {
                        ...item,
                        concordancias: filteredConcordancias,
                        ocorrencias: filteredConcordancias.length
                    };
                }
                return null;
            }).filter(item => item !== null);
        }

        // Limpa a área antes de renderizar os resultados filtrados
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
        
        // Limpa opções atuais
        itemsContainer.innerHTML = '';
        
        // Adiciona opção "Todos os livros"
        const todosOption = document.createElement('div');
        todosOption.textContent = 'Todos os livros';
        todosOption.setAttribute('data-value', 'todos');
        todosOption.classList.add('same-as-selected'); // Marca como selecionado por padrão
        itemsContainer.appendChild(todosOption);
        
        // Adiciona livros baseados no testamento
        const livros = this.getLivrosPorTestamento(testamentoSelecionado);
        livros.forEach(livro => {
            const option = document.createElement('div');
            option.textContent = livro.nome;
            option.setAttribute('data-value', livro.id);
            itemsContainer.appendChild(option);
        });
        
        // Reset seleção para "Todos os livros"
        selectedDisplay.textContent = 'Todos os livros';
        selectedDisplay.setAttribute('data-value', 'todos');
        this.filters.livro = 'todos';
        
        // Configura eventos para os novos itens
        itemsContainer.querySelectorAll('div').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const valor = item.getAttribute('data-value') || 'todos';
                const texto = item.textContent;
                
                // Atualiza display
                selectedDisplay.textContent = texto;
                selectedDisplay.setAttribute('data-value', valor);
                
                // Remove seleção anterior e marca nova
                itemsContainer.querySelectorAll('div').forEach(div => div.classList.remove('same-as-selected'));
                item.classList.add('same-as-selected');
                
                // Atualiza filtro
                this.filters.livro = valor;
                
                // Aplica filtros
                this.renderFilteredResults();
                
                // Fecha dropdown
                this.closeAllDropdowns();
                
                console.log(`[FILTRO] Livro selecionado: ${valor}`);
            });
        });
    }
    
    getLivrosPorTestamento(testamento) {
        const todosLivros = [
            // Antigo Testamento
            { id: 'gn', nome: 'Gênesis', testamento: 'Antigo Testamento' },
            { id: 'ex', nome: 'Êxodo', testamento: 'Antigo Testamento' },
            { id: 'lv', nome: 'Levítico', testamento: 'Antigo Testamento' },
            { id: 'nm', nome: 'Números', testamento: 'Antigo Testamento' },
            { id: 'dt', nome: 'Deuteronômio', testamento: 'Antigo Testamento' },
            { id: 'js', nome: 'Josué', testamento: 'Antigo Testamento' },
            { id: 'jz', nome: 'Juízes', testamento: 'Antigo Testamento' },
            { id: 'rt', nome: 'Rute', testamento: 'Antigo Testamento' },
            { id: '1sm', nome: '1 Samuel', testamento: 'Antigo Testamento' },
            { id: '2sm', nome: '2 Samuel', testamento: 'Antigo Testamento' },
            { id: '1rs', nome: '1 Reis', testamento: 'Antigo Testamento' },
            { id: '2rs', nome: '2 Reis', testamento: 'Antigo Testamento' },
            { id: '1cr', nome: '1 Crônicas', testamento: 'Antigo Testamento' },
            { id: '2cr', nome: '2 Crônicas', testamento: 'Antigo Testamento' },
            { id: 'ed', nome: 'Esdras', testamento: 'Antigo Testamento' },
            { id: 'ne', nome: 'Neemias', testamento: 'Antigo Testamento' },
            { id: 'et', nome: 'Ester', testamento: 'Antigo Testamento' },
            { id: 'jo', nome: 'Jó', testamento: 'Antigo Testamento' },
            { id: 'sl', nome: 'Salmos', testamento: 'Antigo Testamento' },
            { id: 'pv', nome: 'Provérbios', testamento: 'Antigo Testamento' },
            { id: 'ec', nome: 'Eclesiastes', testamento: 'Antigo Testamento' },
            { id: 'ct', nome: 'Cantares', testamento: 'Antigo Testamento' },
            { id: 'is', nome: 'Isaías', testamento: 'Antigo Testamento' },
            { id: 'jr', nome: 'Jeremias', testamento: 'Antigo Testamento' },
            { id: 'lm', nome: 'Lamentações', testamento: 'Antigo Testamento' },
            { id: 'ez', nome: 'Ezequiel', testamento: 'Antigo Testamento' },
            { id: 'dn', nome: 'Daniel', testamento: 'Antigo Testamento' },
            { id: 'os', nome: 'Oséias', testamento: 'Antigo Testamento' },
            { id: 'jl', nome: 'Joel', testamento: 'Antigo Testamento' },
            { id: 'am', nome: 'Amós', testamento: 'Antigo Testamento' },
            { id: 'ob', nome: 'Obadias', testamento: 'Antigo Testamento' },
            { id: 'jn', nome: 'Jonas', testamento: 'Antigo Testamento' },
            { id: 'mq', nome: 'Miquéias', testamento: 'Antigo Testamento' },
            { id: 'na', nome: 'Naum', testamento: 'Antigo Testamento' },
            { id: 'hc', nome: 'Habacuque', testamento: 'Antigo Testamento' },
            { id: 'sf', nome: 'Sofonias', testamento: 'Antigo Testamento' },
            { id: 'ag', nome: 'Ageu', testamento: 'Antigo Testamento' },
            { id: 'zc', nome: 'Zacarias', testamento: 'Antigo Testamento' },
            { id: 'ml', nome: 'Malaquias', testamento: 'Antigo Testamento' },
            // Novo Testamento
            { id: 'mt', nome: 'Mateus', testamento: 'Novo Testamento' },
            { id: 'mc', nome: 'Marcos', testamento: 'Novo Testamento' },
            { id: 'lc', nome: 'Lucas', testamento: 'Novo Testamento' },
            { id: 'joa', nome: 'João', testamento: 'Novo Testamento' },
            { id: 'at', nome: 'Atos', testamento: 'Novo Testamento' },
            { id: 'rm', nome: 'Romanos', testamento: 'Novo Testamento' },
            { id: '1co', nome: '1 Coríntios', testamento: 'Novo Testamento' },
            { id: '2co', nome: '2 Coríntios', testamento: 'Novo Testamento' },
            { id: 'gl', nome: 'Gálatas', testamento: 'Novo Testamento' },
            { id: 'ef', nome: 'Efésios', testamento: 'Novo Testamento' },
            { id: 'fp', nome: 'Filipenses', testamento: 'Novo Testamento' },
            { id: 'cl', nome: 'Colossenses', testamento: 'Novo Testamento' },
            { id: '1ts', nome: '1 Tessalonicenses', testamento: 'Novo Testamento' },
            { id: '2ts', nome: '2 Tessalonicenses', testamento: 'Novo Testamento' },
            { id: '1tm', nome: '1 Timóteo', testamento: 'Novo Testamento' },
            { id: '2tm', nome: '2 Timóteo', testamento: 'Novo Testamento' },
            { id: 'tt', nome: 'Tito', testamento: 'Novo Testamento' },
            { id: 'fm', nome: 'Filemom', testamento: 'Novo Testamento' },
            { id: 'hb', nome: 'Hebreus', testamento: 'Novo Testamento' },
            { id: 'tg', nome: 'Tiago', testamento: 'Novo Testamento' },
            { id: '1pe', nome: '1 Pedro', testamento: 'Novo Testamento' },
            { id: '2pe', nome: '2 Pedro', testamento: 'Novo Testamento' },
            { id: '1jo', nome: '1 João', testamento: 'Novo Testamento' },
            { id: '2jo', nome: '2 João', testamento: 'Novo Testamento' },
            { id: '3jo', nome: '3 João', testamento: 'Novo Testamento' },
            { id: 'jd', nome: 'Judas', testamento: 'Novo Testamento' },
            { id: 'ap', nome: 'Apocalipse', testamento: 'Novo Testamento' }
        ];
        
        if (testamento === 'todos') {
            return todosLivros;
        }
        
        return todosLivros.filter(livro => livro.testamento === testamento);
    }

    // Funções auxiliares para filtros
    extractBookName(referencia) {
        if (!referencia) return '';
        const match = referencia.match(/^([A-Za-zÀ-ÿ\s0-9]+)(?=\s*\d)/);
        return match ? match[1].trim() : referencia.split(' ')[0].trim();
    }

    getBookTestament(nomeLivro) {
        const bibliaConfig = {
            'Antigo Testamento': [
                'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué', 'Juízes', 'Rute',
                '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias',
                'Ester', 'Jó', 'Salmos', 'Provérbios', 'Eclesiastes', 'Cantares', 'Isaías', 'Jeremias',
                'Lamentações', 'Ezequiel', 'Daniel', 'Oséias', 'Joel', 'Amós', 'Obadias', 'Jonas',
                'Miquéias', 'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias'
            ],
            'Novo Testamento': [
                'Mateus', 'Marcos', 'Lucas', 'João', 'Atos', 'Romanos', '1 Coríntios', '2 Coríntios',
                'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses',
                '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom', 'Hebreus', 'Tiago', '1 Pedro', '2 Pedro',
                '1 João', '2 João', '3 João', 'Judas', 'Apocalipse'
            ]
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
            { id: 'gn', nome: 'Gênesis' }, { id: 'ex', nome: 'Êxodo' }, { id: 'lv', nome: 'Levítico' },
            { id: 'nm', nome: 'Números' }, { id: 'dt', nome: 'Deuteronômio' }, { id: 'js', nome: 'Josué' },
            { id: 'jz', nome: 'Juízes' }, { id: 'rt', nome: 'Rute' }, { id: '1sm', nome: '1 Samuel' },
            { id: '2sm', nome: '2 Samuel' }, { id: '1rs', nome: '1 Reis' }, { id: '2rs', nome: '2 Reis' },
            { id: '1cr', nome: '1 Crônicas' }, { id: '2cr', nome: '2 Crônicas' }, { id: 'ed', nome: 'Esdras' },
            { id: 'ne', nome: 'Neemias' }, { id: 'et', nome: 'Ester' }, { id: 'jo', nome: 'Jó' },
            { id: 'sl', nome: 'Salmos' }, { id: 'pv', nome: 'Provérbios' }, { id: 'ec', nome: 'Eclesiastes' },
            { id: 'ct', nome: 'Cantares' }, { id: 'is', nome: 'Isaías' }, { id: 'jr', nome: 'Jeremias' },
            { id: 'lm', nome: 'Lamentações' }, { id: 'ez', nome: 'Ezequiel' }, { id: 'dn', nome: 'Daniel' },
            { id: 'os', nome: 'Oséias' }, { id: 'jl', nome: 'Joel' }, { id: 'am', nome: 'Amós' },
            { id: 'ob', nome: 'Obadias' }, { id: 'jn', nome: 'Jonas' }, { id: 'mq', nome: 'Miquéias' },
            { id: 'na', nome: 'Naum' }, { id: 'hc', nome: 'Habacuque' }, { id: 'sf', nome: 'Sofonias' },
            { id: 'ag', nome: 'Ageu' }, { id: 'zc', nome: 'Zacarias' }, { id: 'ml', nome: 'Malaquias' },
            { id: 'mt', nome: 'Mateus' }, { id: 'mc', nome: 'Marcos' }, { id: 'lc', nome: 'Lucas' },
            { id: 'joa', nome: 'João' }, { id: 'at', nome: 'Atos' }, { id: 'rm', nome: 'Romanos' },
            { id: '1co', nome: '1 Coríntios' }, { id: '2co', nome: '2 Coríntios' }, { id: 'gl', nome: 'Gálatas' },
            { id: 'ef', nome: 'Efésios' }, { id: 'fp', nome: 'Filipenses' }, { id: 'cl', nome: 'Colossenses' },
            { id: '1ts', nome: '1 Tessalonicenses' }, { id: '2ts', nome: '2 Tessalonicenses' },
            { id: '1tm', nome: '1 Timóteo' }, { id: '2tm', nome: '2 Timóteo' }, { id: 'tt', nome: 'Tito' },
            { id: 'fm', nome: 'Filemom' }, { id: 'hb', nome: 'Hebreus' }, { id: 'tg', nome: 'Tiago' },
            { id: '1pe', nome: '1 Pedro' }, { id: '2pe', nome: '2 Pedro' }, { id: '1jo', nome: '1 João' },
            { id: '2jo', nome: '2 João' }, { id: '3jo', nome: '3 João' }, { id: 'jd', nome: 'Judas' },
            { id: 'ap', nome: 'Apocalipse' }
        ];
        
        return livros.find(l => l.id === bookId);
    }

    async searchInAllFiles(searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const allResults = [];
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        
        // Atualiza indicador de progresso
        this.elements.loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Buscando "${searchTerm}" em todos os arquivos...</p>
        `;
        
        for (const letter of letters) {
            try {
                // Carrega lista de arquivos para a letra
                await window.dataManager.loadLetterList();
                const letterFiles = window.dataManager.listaLetras[letter] || [];
                
                // Busca em cada arquivo da letra
                for (const fileName of letterFiles) {
                    try {
                        const response = await fetch(`/concordancia/${letter}/${fileName}.json`);
                        if (!response.ok) continue;
                        
                        const jsonData = await response.json();
                        const wordEntries = jsonData[letter] || [];
                        
                        // Busca em cada palavra
                        wordEntries.forEach(item => {
                            let matchingConcordancias = [];
                            let wordMatches = false;
                            
                            // 1. Verifica se a palavra contém o termo buscado
                            if (item.palavra && item.palavra.toLowerCase().includes(searchLower)) {
                                wordMatches = true;
                                matchingConcordancias = item.concordancias || [];
                            }
                            
                            // 2. Busca no texto das concordâncias
                            if (!wordMatches && item.concordancias) {
                                const regex = new RegExp(`\\b${searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                                matchingConcordancias = item.concordancias.filter(concordancia => 
                                    regex.test(concordancia.texto)
                                );
                            }
                            
                            // 3. Busca na fonte
                            if (!wordMatches && !matchingConcordancias.length && item.fonte) {
                                if (item.fonte.toLowerCase().includes(searchLower)) {
                                    matchingConcordancias = item.concordancias || [];
                                }
                            }
                            
                            // 4. Busca em "veja também"
                            if (!wordMatches && !matchingConcordancias.length && item['veja tambem']) {
                                const hasVejaTambem = item['veja tambem'].some(vt => 
                                    vt.toLowerCase().includes(searchLower)
                                );
                                if (hasVejaTambem) {
                                    matchingConcordancias = item.concordancias || [];
                                }
                            }
                            
                            // Se encontrou resultados, adiciona à lista
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
        
        // Ordena resultados por relevância (palavra exata primeiro, depois por número de ocorrências)
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

        // Força uma atualização do layout para garantir que os elementos sejam exibidos corretamente
        this.elements.resultadosContainer.style.display = 'none';
        this.elements.resultadosContainer.offsetHeight; // Força reflow
        this.elements.resultadosContainer.style.display = '';
    }

    createPalavraElement(item) {
        const palavraDiv = document.createElement('div');
        palavraDiv.className = 'palavra-item';

        // Cabeçalho da palavra
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

        // Conteúdo das concordâncias
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

        // Evento de clique para expandir/recolher
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
            // Garante que a área de resultados não seja visível durante o carregamento
            this.elements.resultadosContainer.style.visibility = 'hidden';
            this.elements.contadorResultados.style.display = 'none';
            this.elements.carregarMais.style.display = 'none';
        } else {
            this.elements.loadingIndicator.style.display = 'none';
            // Restaura a visibilidade da área de resultados após o carregamento
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

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.concordanciaOptimized = new ConcordanciaOptimized();
});