createDefinitionElement(item) {
    const definicaoPrincipal = item.definicao || '';
    const definicaoAdicional = item.definicaoAdicional || '';
    const referencias = item.referencias || [];

    const referencesHtml = referencias.map(ref => `
        <div class="referencia-item">
            <div class="referencia-texto">${ref}</div>
        </div>
    `).join('');

    // Adiciona uma classe e um data-atributo para JS controlar o expand/collapse
    return `
        <div class="definicao-item">
            <div class="definicao-header" data-expand>
                <div class="termo-titulo">${item.termo.toUpperCase()}</div>
                <span class="expand-indicator" style="cursor:pointer;">&#9660;</span>
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