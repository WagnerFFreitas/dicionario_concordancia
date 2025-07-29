# Concordância e Dicionário Bíblico

Uma aplicação web completa para consulta de concordância bíblica e dicionário de termos bíblicos.

## 📁 Estrutura do Projeto

```
biblia/
├── baixar/                  # PDFs e recursos para download
├── concordancia/            # Dados de concordância bíblica
│   ├── a/                   # Arquivos da letra A
│   │   ├── a1.json
│   │   ├── a2.json
│   │   └── ...
│   ├── b/                   # Arquivos da letra B
│   ├── lista_letras.json    # Índice de arquivos por letra
│   └── ...
├── css/                     # Arquivos de estilo
│   ├── main.css
│   ├── concordancia.css
│   ├── dicionario.css
│   ├── dicionario_concordancia.css
│   └── ...
├── dicionario/              # Dados do dicionário bíblico
│   ├── a.json
│   ├── b.json
│   └── ...
├── html/                    # Páginas HTML
│   ├── concordancia.html
│   ├── dicionario.html
│   └── ...
├── img/                     # Imagens e ícones
├── script/                  # Scripts JavaScript
│   ├── main.js
│   ├── concordancia-optimized.js
│   ├── dicionario.js
│   ├── data-manager.js
│   └── ...
├── versao/                  # Dados das versões bíblicas
├── index.html               # Página inicial
├── style.css                # Estilo principal
└── script.js                # Script principal
```

## 🚀 Funcionalidades

### Concordância Bíblica
- Busca por letras do alfabeto
- Filtros por testamento (Antigo/Novo)
- Filtros por livros específicos
- Busca global em toda a Bíblia
- Carregamento otimizado com paginação

### Dicionário Bíblico
- Busca por termos bíblicos
- Definições detalhadas com etimologia
- Referências bíblicas relacionadas
- Sugestões automáticas
- Termos relacionados clicáveis

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com gradientes e animações
- **JavaScript ES6+**: Funcionalidades interativas
- **JSON**: Armazenamento de dados
- **Responsive Design**: Compatível com dispositivos móveis

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🎨 Design

- **Tema escuro** com acentos dourados
- **Animações suaves** e micro-interações
- **Interface intuitiva** e acessível
- **Tipografia legível** e hierarquia visual clara

## 🔧 Instalação e Uso

1. Clone ou baixe o projeto
2. Abra `index.html` em um navegador moderno
3. Navegue entre Concordância e Dicionário
4. Use os filtros e busca conforme necessário

## 📊 Performance

- **Carregamento sob demanda**: Dados carregados apenas quando necessário
- **Cache inteligente**: Evita recarregamentos desnecessários
- **Paginação**: Melhora performance com grandes volumes de dados
- **Otimização de busca**: Algoritmos eficientes para busca global

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas, entre em contato através dos canais oficiais.

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025