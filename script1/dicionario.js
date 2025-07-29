/* ========================================== */
/* === ARQUIVO: dicionario.js (COMPLETO) === */
/* ========================================== */

/**
 * Sistema de Dicionário Bíblico (Versão Completa e Refinada)
 * Define a classe Dicionario, que gerencia toda a interatividade da seção de dicionário.
 * Esta classe deve ser instanciada por um script principal.
 */
class Dicionario {
    /**
     * Construtor da classe Dicionario.
     * Inicializa propriedades e chama os métodos para configurar elementos e eventos.
     */
    constructor() {
        // --- Estado Interno da Classe ---
        this.currentLetter = null; // Letra atualmente selecionada (ex: 'A')
        this.currentPage = 0; // Controla a página atual para o "carregar mais"
        this.itemsPerPage = 50; // Quantidade de itens a serem mostrados por página
        this.allTermos = []; // Array com todos os termos da letra carregada
        this.listaLetras = null; // Cache para o arquivo de mapeamento (lista_letras.json)

        // --- Inicialização ---
        this.initializeElements();
        this.bindEvents();
    }

    /**
     * Mapeia os elementos do DOM para a propriedade 'elements' para fácil acesso.
     */
    initializeElements() {
        this.elements = {
            dicionarioInput: document.querySelector('#secao-dicionario .dicionario-busca input'),
            dicionarioResultados: document.getElementById('dicionario-resultados'),
            secaoDicionario: document.getElementById('secao-dicionario'),
        };
    }

    /**
     * Vincula todos os eventos necessários para a interatividade do dicionário.
     */
    bindEvents() {
        // Validação para garantir que os elementos essenciais existem
        if (!this.elements.dicionarioInput || !this.elements.secaoDicionario) {
            console.error("Elementos essenciais do dicionário não foram encontrados no DOM.");
            return;
        }

        // Adiciona evento de clique para CADA botão de letra no menu alfabético
        document.querySelectorAll('.letra-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // A ação só é executada se a seção do dicionário estiver ativa
                if (this.elements.secaoDicionario.classList.contains('secao-ativa')) {
                    const letra = btn.dataset.letra;
                    this.loadAndDisplayLetter(letra);
                }
            });
        });

        // Adiciona evento de digitação no campo de busca para filtrar resultados
        this.elements.dicionarioInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    /**
     * Método de inicialização chamado quando a aba "Dicionário" é ativada.
     * Reseta a visualização para o estado inicial.
     */
    init() {
        if (this.elements.dicionarioResultados) {
            this.elements.dicionarioResultados.innerHTML = `<p class="mensagem-inicial">Escolha uma letra para exibir os termos do dicionário.</p>`;
        }
        this.clearPagination(); // Remove qualquer controle de paginação existente
        // Remove a classe 'active' de qualquer botão de letra
        document.querySelectorAll('.letra-btn.active').forEach(btn => btn.classList.remove('active'));
    }

    /**
     * Carrega e exibe os termos do dicionário para uma letra específica.
     * @param {string} letra - A letra a ser carregada (ex: 'A').
     */
    async loadAndDisplayLetter(letra) {
        if (!letra) return;
        this.currentLetter = letra.toUpperCase();
        this.updateActiveLetterButton(this.currentLetter);

        // Limpa a interface antes de carregar novos dados
        if (this.elements.dicionarioInput) this.elements.dicionarioInput.value = '';
        this.elements.dicionarioResultados.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Carregando dados...</p></div>';
        this.clearPagination();

        // Carrega o mapa de arquivos (lista_letras.json) se ainda não estiver em cache
        if (!this.listaLetras) {
            try {
                const response = await fetch('../dicionario/lista_letras.json');
                if (!response.ok) throw new Error('Falha ao carregar o índice de arquivos (lista_letras.json).');
                this.listaLetras = await response.json();
            } catch (error) {
                this.elements.dicionarioResultados.innerHTML = `<p class="erro-mensagem">${error.message}</p>`;
                return;
            }
        }

        const arquivos = this.listaLetras[letra.toLowerCase()];
        if (!arquivos || arquivos.length === 0) {
            this.elements.dicionarioResultados.innerHTML = `<p class="mensagem-inicial">Nenhum termo encontrado para a letra "${letra}".</p>`;
            return;
        }

        // Carrega os dados dos arquivos JSON correspondentes à letra
        try {
            const allTermos = [];
            await Promise.all(arquivos.map(async (nomeArquivo) => {
                const response = await fetch(`../dicionario/${letra.toLowerCase()}/${nomeArquivo}.json`);
                if (response.ok) {
                    const jsonData = await response.json();
                    const termos = jsonData[letra.toUpperCase()] || [];
                    allTermos.push(...termos);
                }
            }));

            this.allTermos = allTermos;
            this.currentPage = 0; // Reseta a paginação para a primeira página
            this.renderDictionaryResults(this.getCurrentPageTerms());
            this.renderPagination(); // Cria a paginação na barra superior
        } catch (error) {
            this.elements.dicionarioResultados.innerHTML = `<p class="erro-mensagem">Erro ao carregar dados: ${error.message}</p>`;
        }
    }

    /**
     * Renderiza os resultados do dicionário no DOM.
     * @param {Array} results - Um array de objetos de termos a serem exibidos.
     */
    renderDictionaryResults(results) {
        if (!results || results.length === 0) {
            this.elements.dicionarioResultados.innerHTML = `<div class="sem-resultados"><h3>Nenhum termo encontrado</h3></div>`;
            return;
        }

        const resultsHtml = results.map(item => this.createDefinitionElement(item)).join('');
        this.elements.dicionarioResultados.innerHTML = resultsHtml;

        // Adiciona eventos para expandir/recolher as definições
        this.elements.dicionarioResultados.querySelectorAll('.palavra-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const indicator = header.querySelector('.expand-indicator');
                const isExpanded = content.style.display === 'block';
                
                content.style.display = isExpanded ? 'none' : 'block';
                indicator.classList.toggle('expanded', !isExpanded);
            });
        });
    }

    /**
     * Cria o HTML para um único item de definição.
     * @param {object} item - O objeto do termo contendo definição, referências, etc.
     * @returns {string} O HTML do elemento de definição.
     */
    createDefinitionElement(item) {
        const definicaoPrincipal = item.definicao || 'Definição não disponível.';
        const definicaoAdicional = item.definicaoAdicional || '';
        const referencias = item.referencias || [];

        const referencesHtml = referencias.map(ref => `<div class="referencia-item">${ref}</div>`).join('');

        return `
            <div class="definicao-item">
                <div class="palavra-header">
                    <span class="palavra-titulo">${item.termo.toUpperCase()}</span>
                    <span class="expand-indicator">&#9660;</span>
                </div>
                <div class="definicao-content" style="display:none;">
                    <div class="definicao-texto">${definicaoPrincipal}</div>
                    ${definicaoAdicional ? `<div class="definicao-adicional">${definicaoAdicional}</div>` : ''}
                    ${referencesHtml ? `
                        <div class="referencias-section">
                            <div class="referencias-titulo">Referências</div>
                            ${referencesHtml}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza os controles de paginação e os insere na barra de busca.
     */
    renderPagination() {
        const linhaBusca = document.querySelector('#secao-dicionario .dicionario-linha');
        if (!linhaBusca) return;

        this.clearPagination(); // Garante que não haja duplicatas

        const total = this.allTermos.length;
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, total);
        // Calcula o número total de itens exibidos até a página atual
        const showingTotal = Math.min((this.currentPage + 1) * this.itemsPerPage, total);

        if (total === 0) return; // Não mostra paginação se não houver resultados

        const paginacaoGrupo = document.createElement("div");
        paginacaoGrupo.className = "dicionario-paginacao-grupo";

        const html = `
            <button id="btn-anterior-dicionario" class="btn-paginacao" ${this.currentPage === 0 ? "disabled" : ""}>ANTERIOR</button>
            <span class="contador-dicionario">Mostrando ${showingTotal} de ${total} resultados</span>
            <button id="btn-proximo-dicionario" class="btn-paginacao" ${endIndex >= total ? "disabled" : ""}>PRÓXIMO</button>
        `;

        paginacaoGrupo.innerHTML = html;
        linhaBusca.appendChild(paginacaoGrupo); // Adiciona o grupo à barra superior

        const btnAnterior = document.getElementById("btn-anterior-dicionario");
        const btnProximo = document.getElementById("btn-proximo-dicionario");

        if (btnAnterior) {
            btnAnterior.onclick = () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.renderDictionaryResults(this.getCurrentPageTerms());
                    this.renderPagination();
                }
            };
        }

        if (btnProximo) {
            btnProximo.onclick = () => {
                if (endIndex < total) {
                    this.currentPage++;
                    this.renderDictionaryResults(this.getCurrentPageTerms());
                    this.renderPagination();
                }
            };
        }
    }
    
    /**
     * Remove o grupo de paginação da tela.
     */
    clearPagination() {
        const oldPag = document.querySelector('#secao-dicionario .dicionario-paginacao-grupo');
        if (oldPag) oldPag.remove();
    }

    /**
     * Retorna a fatia de termos correspondente à página atual.
     */
    getCurrentPageTerms() {
        const start = this.currentPage * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.allTermos.slice(start, end);
    }

    /**
     * Filtra os resultados com base no termo de busca.
     */
    handleSearch(searchTerm) {
        const term = searchTerm.trim().toLowerCase();

        if (term.length === 0) {
            // Se a busca for limpa, volta a exibir os resultados da letra selecionada
            if (this.currentLetter) {
                this.renderDictionaryResults(this.getCurrentPageTerms());
                this.renderPagination();
            } else {
                this.init(); // Se nenhuma letra foi selecionada, reseta a view
            }
            return;
        }

        // Filtra os resultados de `allTermos` (da letra atual)
        const filteredResults = this.allTermos.filter(item =>
            item.termo.toLowerCase().includes(term)
        );
        
        this.clearPagination(); // Remove a paginação durante a busca
        this.renderDictionaryResults(filteredResults);
    }

    /**
     * Atualiza a classe 'active' no botão da letra correspondente no menu lateral.
     */
    updateActiveLetterButton(letra) {
        document.querySelectorAll('.letra-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.letra.toUpperCase() === letra.toUpperCase());
        });
    }
}