/**
 * Gerenciador de dados otimizado para grandes volumes de concordância
 * Implementa carregamento sob demanda e cache inteligente
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.listaLetras = null;
        this.currentLetter = null;
        this.currentPage = 0;
        this.itemsPerPage = 50; // Carrega 50 itens por vez
        this.totalItems = 0;
        this.allData = [];
        this.filteredData = [];
    }

    /**
     * Carrega a lista de arquivos para uma letra específica
     */
    async loadLetterList() {
        if (this.listaLetras) return this.listaLetras;

        try {
            const response = await fetch('/concordancia/lista_letras.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.listaLetras = await response.json();
            return this.listaLetras;
        } catch (error) {
            console.error('Erro ao carregar lista de letras:', error);
            // Fallback com dados de exemplo
            this.listaLetras = {
                "a": ["a1", "a2", "a3", "a4"] // Exemplo baseado nos arquivos fornecidos
            };
            return this.listaLetras;
        }
    }

    /**
     * Carrega dados de uma letra específica com paginação
     */
    async loadLetterData(letter, page = 0, forceReload = false) {
        const letterLower = letter.toLowerCase();
        const cacheKey = `${letterLower}_${page}`;

        // Verifica se já está carregando
        if (this.loadingPromises.has(cacheKey)) {
            return await this.loadingPromises.get(cacheKey);
        }

        // Verifica cache
        if (!forceReload && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Cria promise de carregamento
        const loadingPromise = this._loadLetterDataInternal(letterLower, page);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const result = await loadingPromise;
            this.cache.set(cacheKey, result);
            return result;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    /**
     * Carregamento interno dos dados
     */
    async _loadLetterDataInternal(letter, page) {
        try {
            await this.loadLetterList();
            
            const letterFiles = this.listaLetras[letter] || [];
            if (letterFiles.length === 0) {
                return { data: [], hasMore: false, total: 0 };
            }

            // Se é uma nova letra, carrega todos os dados
            if (this.currentLetter !== letter) {
                this.currentLetter = letter;
                this.currentPage = 0;
                this.allData = [];
                await this._loadAllLetterData(letter, letterFiles);
            }

            // Aplica paginação
            const startIndex = page * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const pageData = this.allData.slice(startIndex, endIndex);
            const hasMore = endIndex < this.allData.length;

            return {
                data: pageData,
                hasMore: hasMore,
                total: this.allData.length,
                currentPage: page
            };

        } catch (error) {
            console.error(`Erro ao carregar dados da letra ${letter}:`, error);
            return this._getFallbackData(letter);
        }
    }

    /**
     * Carrega todos os arquivos de uma letra
     */
    async _loadAllLetterData(letter, letterFiles) {
        const batchSize = 5; // Carrega 5 arquivos por vez
        const allData = [];

        for (let i = 0; i < letterFiles.length; i += batchSize) {
            const batch = letterFiles.slice(i, i + batchSize);
            const batchPromises = batch.map(fileName => this._loadSingleFile(letter, fileName));
            
            try {
                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(result => {
                    if (result && result.data) {
                        allData.push(...result.data);
                    }
                });
            } catch (error) {
                console.warn(`Erro ao carregar lote de arquivos:`, error);
            }
        }

        this.allData = allData;
        this.totalItems = allData.length;
    }

    /**
     * Carrega um único arquivo JSON
     */
    async _loadSingleFile(letter, fileName) {
        try {
            const response = await fetch(`/concordancia/${letter}/${fileName}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return { data: data[letter] || [] };
        } catch (error) {
            console.warn(`Erro ao carregar arquivo ${fileName}.json:`, error);
            return { data: [] };
        }
    }

    /**
     * Busca global por palavra
     */
    async searchGlobal(searchTerm, filters = {}) {
        if (!searchTerm || searchTerm.length < 2) {
            return { data: [], total: 0 };
        }

        const searchLower = searchTerm.toLowerCase();
        const firstLetter = searchLower.charAt(0);

        try {
            // Carrega dados da primeira letra da palavra buscada
            await this.loadLetterData(firstLetter, 0, false);
            
            // Filtra resultados
            const filteredResults = this.allData.filter(item => {
                const matchesWord = item.palavra.toLowerCase().includes(searchLower);
                const matchesTestament = this._matchesTestamentFilter(item, filters.testamento);
                const matchesBook = this._matchesBookFilter(item, filters.livro);
                
                return matchesWord && matchesTestament && matchesBook;
            });

            return {
                data: filteredResults,
                total: filteredResults.length
            };

        } catch (error) {
            console.error('Erro na busca global:', error);
            return { data: [], total: 0 };
        }
    }

    /**
     * Aplica filtros de testamento
     */
    _matchesTestamentFilter(item, testamentFilter) {
        if (!testamentFilter || testamentFilter === 'todos') return true;
        
        // Implementar lógica de filtro por testamento baseada nas referências
        // Por enquanto, retorna true (implementar conforme necessário)
        return true;
    }

    /**
     * Aplica filtros de livro
     */
    _matchesBookFilter(item, bookFilter) {
        if (!bookFilter || bookFilter === 'todos') return true;
        
        // Verifica se alguma concordância contém o livro especificado
        return item.concordancias.some(concordancia => 
            concordancia.referencia.toLowerCase().includes(bookFilter.toLowerCase())
        );
    }

    /**
     * Dados de fallback em caso de erro
     */
    _getFallbackData(letter) {
        const fallbackData = {
            "a": [
                {
                    "palavra": "exemplo",
                    "veja tambem": [],
                    "ocorrencias": 1,
                    "fonte": "Dados de exemplo",
                    "concordancias": [
                        {
                            "referencia": "Exemplo 1:1",
                            "texto": "Este é um exemplo de dados de fallback."
                        }
                    ]
                }
            ]
        };

        return {
            data: fallbackData[letter.toLowerCase()] || [],
            hasMore: false,
            total: 1
        };
    }

    /**
     * Limpa cache para economizar memória
     */
    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
    }

    /**
     * Obtém estatísticas do cache
     */
    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            loadingPromises: this.loadingPromises.size,
            currentLetter: this.currentLetter,
            totalItems: this.totalItems
        };
    }
}

// Instância global do gerenciador de dados
window.dataManager = new DataManager();