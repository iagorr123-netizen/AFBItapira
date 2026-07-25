# AFB Itapira - Sistema de Consolidação de Dados de Colheita

Sistema automático para consolidação e análise de dados de colheita de cana de açúcar da Fazenda AFB Itapira, localizada em São Paulo.

## 📋 Funcionalidades

### 🏠 Página Inicial
- Menu de navegação
- Acesso rápido aos principais módulos
- Status dos dados carregados

### 📊 Dashboard
- **Métricas principais** em tempo real
  - Total de toneladas colhidas
  - Área total colhida
  - Produtividade média
  - Total de talhões
- **Gráficos interativos**
  - Produtividade por talhão (Top 10)
  - Distribuição de toneladas por variedade
  - Evolução por corte
- **Tabela de talhões** com maior produção

### 📋 Relatórios
- **Relatório Geral** - Consolidação completa
- **Relatório por Talhão** - Dados específicos de cada talhão
- **Relatório por Variedade** - Performance de cada variedade
- **Relatório por Corte** - Análise por número de corte
- **Relatório por Ano** - Comparação anual
- **Exportação** em Excel e impressão

### 📈 Análise
- **Estatísticas descritivas**
  - Média, mediana, mínimo, máximo
  - Desvio padrão
- **Análise de variância** entre talhões
- **Comparação** entre variedades
- **Performance** por corte
- **Top 5 e Bottom 5** performers
- **Insights automáticos** e recomendações

### ⚙️ Gerenciamento
- **Adicionar novo registro** de colheita
- **Editar registros** existentes
- **Importar dados** do Excel
- **Exportar dados** atualizados
- Resumo de dados e última atualização

## 🚀 Como Usar

### 1. Requisitos
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Arquivo Excel: `Base Cana BI 2.xlsx` na mesma pasta

### 2. Iniciar o Sistema
1. Abra o arquivo `index.html` no navegador
2. Os dados serão carregados automaticamente do arquivo Excel
3. Navegue pelos módulos usando o menu superior

### 3. Navegação

#### Dashboard
- Visualize as principais métricas e gráficos
- Identifique tendências rapidamente
- Acompanhe performance por talhão

#### Relatórios
- Selecione o tipo de relatório desejado
- Clique em "Gerar Relatório"
- Exporte em Excel ou imprima (Ctrl+P)

#### Análise
- Veja estatísticas detalhadas
- Leia insights automáticos gerados pelo sistema
- Consulte recomendações de melhoria

#### Gerenciamento
- **Novo Registro**: Preencha o formulário e adicione dados
- **Editar**: Selecione talhão e modifique registros
- **Importar**: Carregue novo arquivo Excel com dados adicionais
- **Exportar**: Baixe os dados atualizados

## 📁 Estrutura de Arquivos

```
Projeto AFB Itapira - Automação de dados/
├── index.html              # Página inicial
├── dashboard.html          # Dashboard com métricas
├── relatorios.html         # Gerador de relatórios
├── analise.html            # Análise estatística
├── gerenciamento.html      # Gerenciamento de dados
├── css/
│   └── style.css           # Estilos do sistema
├── js/
│   ├── config.js           # Configurações globais
│   ├── dados.js            # Leitura e processamento de dados
│   └── utils.js            # Funções auxiliares
├── Base Cana BI 2.xlsx     # Arquivo de dados (Excel)
└── README.md               # Este arquivo
```

## 📊 Dados Suportados

O arquivo Excel deve conter as seguintes abas e colunas:

### Aba: Colheita Base
- **Ano Colheita** - Ano da colheita
- **Talhão** - Número do talhão
- **Variedade** - Tipo de cana (ex: CTC 11, RB 5952)
- **Número do Corte** - Qual corte (1º, 2º, 3º...)
- **Area Plantada** - Área em hectares
- **Area Colhida** - Área colhida em hectares
- **Produtividade TCH** - Toneladas de cana por hectare
- **Tonelada Colhida** - Total em toneladas

### Abas Adicionais (Opcionais)
- Talhao Dados
- Variedade
- Corte Base
- ATR
- Índice Pluviométrico

## 🔧 Configurações

Arquivo: `js/config.js`

Você pode personalizar:
- Nomes das abas do Excel
- Nomes das colunas
- Cores dos gráficos
- Caminho do arquivo Excel

## 💾 Backup de Dados

Para manter um backup seguro:
1. Acesse o módulo **Gerenciamento**
2. Clique em **"Exportar Dados Atualizados"**
3. Salve o arquivo Excel gerado

## 🐛 Troubleshooting

### "Erro ao carregar dados"
- Verifique se `Base Cana BI 2.xlsx` está na mesma pasta que `index.html`
- Certifique-se que a aba "Colheita Base" existe no Excel

### "Gráficos não aparecem"
- Atualize a página (Ctrl+F5)
- Verifique se o navegador não bloqueou scripts

### "Dados não atualizam"
- Recarregue a página após adicionar novos registros
- Importe dados novamente se fizer mudanças no Excel

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. As configurações em `js/config.js`
2. A estrutura do arquivo Excel
3. O console do navegador (F12 > Console) para erros

## 📝 Notas Importantes

- Os dados são carregados da memória - não são persistidos automaticamente
- Para manter dados novos, exporte regularmente
- O sistema não modifica o arquivo Excel original
- Compatível com navegadores modernos (não suporta IE)

## 🎯 Próximas Melhorias

- [ ] Autenticação de usuários
- [ ] Armazenamento em banco de dados
- [ ] Sincronização com Power BI
- [ ] API REST para integração
- [ ] Envio automático de relatórios
- [ ] Alertas de produtividade baixa
- [ ] Gráficos 3D avançados

---

**Desenvolvido com ❤️ para AFB Holding - Itapira, SP**
