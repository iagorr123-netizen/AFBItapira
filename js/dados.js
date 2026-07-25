// Carregar dados do Excel
async function carregarDados() {
    try {
        console.log('Iniciando carregamento de dados...');
        console.log('Procurando arquivo:', CONFIG.excelFile);

        const response = await fetch(CONFIG.excelFile);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('Arquivo encontrado, processando...');
        const arrayBuffer = await response.arrayBuffer();

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error('Arquivo vazio ou inválido');
        }

        console.log(`Tamanho do arquivo: ${arrayBuffer.byteLength} bytes`);

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        console.log('Abas encontradas:', workbook.SheetNames);

        // Carregar abas principais
        console.log('Carregando aba:', CONFIG.sheets.main);
        dadosColheita = processarDados(workbook.Sheets[CONFIG.sheets.main]);

        console.log('Carregando aba:', CONFIG.sheets.talhao);
        dadosTalhao = processarDados(workbook.Sheets[CONFIG.sheets.talhao]);

        console.log('Carregando aba:', CONFIG.sheets.variedade);
        dadosVariedade = processarDados(workbook.Sheets[CONFIG.sheets.variedade]);

        console.log('Carregando aba:', CONFIG.sheets.corte);
        dadosCorte = processarDados(workbook.Sheets[CONFIG.sheets.corte]);

        // Tentar carregar abas opcionais
        if (workbook.Sheets[CONFIG.sheets.atr]) {
            dadosATR = processarDados(workbook.Sheets[CONFIG.sheets.atr]);
        }
        if (workbook.Sheets[CONFIG.sheets.pluviometrico]) {
            dadosPluviometrico = processarDados(workbook.Sheets[CONFIG.sheets.pluviometrico]);
        }

        console.log('✅ Dados carregados com sucesso:', {
            colheita: dadosColheita.length,
            talhao: dadosTalhao.length,
            variedade: dadosVariedade.length,
            corte: dadosCorte.length
        });

        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Processar dados de uma aba
function processarDados(sheet) {
    if (!sheet) return [];

    const rows = XLSX.utils.sheet_to_json(sheet);
    return rows.filter(row => {
        // Filtrar linhas vazias
        return Object.values(row).some(val => val !== null && val !== undefined && val !== '');
    });
}

// Consolidações gerais
function obterConsolidacaoGeral() {
    if (dadosColheita.length === 0) return null;

    const col = CONFIG.columns;
    let totalToneladaColhida = 0;
    let totalAreaColhida = 0;
    let produtividadeMedia = 0;
    let contTalhoes = new Set();

    dadosColheita.forEach(row => {
        const tonelada = parseFloat(row[col.toneladaColhida]) || 0;
        const area = parseFloat(row[col.areaColhida]) || 0;
        const produtiv = parseFloat(row[col.produtividade]) || 0;

        totalToneladaColhida += tonelada;
        totalAreaColhida += area;
        produtividadeMedia += produtiv;

        if (row[col.talhao]) {
            contTalhoes.add(row[col.talhao]);
        }
    });

    produtividadeMedia = produtividadeMedia / Math.max(dadosColheita.length, 1);

    return {
        totalToneladaColhida: totalToneladaColhida.toFixed(2),
        totalAreaColhida: totalAreaColhida.toFixed(2),
        produtividadeMedia: produtividadeMedia.toFixed(2),
        numTalhoes: contTalhoes.size,
        numRegistros: dadosColheita.length
    };
}

// Consolidação por talhão
function obterConsolidacaoPorTalhao() {
    const col = CONFIG.columns;
    const consolidacao = {};

    dadosColheita.forEach(row => {
        const talhao = row[col.talhao];
        if (!talhao) return;

        if (!consolidacao[talhao]) {
            consolidacao[talhao] = {
                talhao: talhao,
                totalTonelada: 0,
                totalArea: 0,
                produtividadeMedia: 0,
                variedades: new Set(),
                numCortes: new Set(),
                registros: 0
            };
        }

        consolidacao[talhao].totalTonelada += parseFloat(row[col.toneladaColhida]) || 0;
        consolidacao[talhao].totalArea += parseFloat(row[col.areaColhida]) || 0;
        consolidacao[talhao].produtividadeMedia += parseFloat(row[col.produtividade]) || 0;
        consolidacao[talhao].registros++;

        if (row[col.variedade]) {
            consolidacao[talhao].variedades.add(row[col.variedade]);
        }
        if (row[col.numCorte]) {
            consolidacao[talhao].numCortes.add(row[col.numCorte]);
        }
    });

    // Calcular média e converter sets para array
    return Object.values(consolidacao).map(t => ({
        ...t,
        produtividadeMedia: (t.produtividadeMedia / t.registros).toFixed(2),
        variedades: Array.from(t.variedades),
        numCortes: Array.from(t.numCortes)
    })).sort((a, b) => b.totalTonelada - a.totalTonelada);
}

// Consolidação por variedade
function obterConsolidacaoPorVariedade() {
    const col = CONFIG.columns;
    const consolidacao = {};

    dadosColheita.forEach(row => {
        const variedade = row[col.variedade];
        if (!variedade) return;

        if (!consolidacao[variedade]) {
            consolidacao[variedade] = {
                variedade: variedade,
                totalTonelada: 0,
                totalArea: 0,
                produtividadeMedia: 0,
                talhoes: new Set(),
                registros: 0
            };
        }

        consolidacao[variedade].totalTonelada += parseFloat(row[col.toneladaColhida]) || 0;
        consolidacao[variedade].totalArea += parseFloat(row[col.areaColhida]) || 0;
        consolidacao[variedade].produtividadeMedia += parseFloat(row[col.produtividade]) || 0;
        consolidacao[variedade].registros++;

        if (row[col.talhao]) {
            consolidacao[variedade].talhoes.add(row[col.talhao]);
        }
    });

    return Object.values(consolidacao).map(v => ({
        ...v,
        produtividadeMedia: (v.produtividadeMedia / v.registros).toFixed(2),
        talhoes: Array.from(v.talhoes)
    })).sort((a, b) => b.totalTonelada - a.totalTonelada);
}

// Consolidação por corte
function obterConsolidacaoPorCorte() {
    const col = CONFIG.columns;
    const consolidacao = {};

    dadosColheita.forEach(row => {
        const corte = row[col.numCorte];
        if (corte === null || corte === undefined || corte === '') return;

        const chave = `Corte ${corte}`;
        if (!consolidacao[chave]) {
            consolidacao[chave] = {
                corte: corte,
                totalTonelada: 0,
                totalArea: 0,
                produtividadeMedia: 0,
                talhoes: new Set(),
                registros: 0
            };
        }

        consolidacao[chave].totalTonelada += parseFloat(row[col.toneladaColhida]) || 0;
        consolidacao[chave].totalArea += parseFloat(row[col.areaColhida]) || 0;
        consolidacao[chave].produtividadeMedia += parseFloat(row[col.produtividade]) || 0;
        consolidacao[chave].registros++;

        if (row[col.talhao]) {
            consolidacao[chave].talhoes.add(row[col.talhao]);
        }
    });

    return Object.values(consolidacao).map(c => ({
        ...c,
        produtividadeMedia: (c.produtividadeMedia / c.registros).toFixed(2),
        talhoes: Array.from(c.talhoes)
    })).sort((a, b) => b.corte - a.corte);
}

// Consolidação por ano
function obterConsolidacaoPorAno() {
    const col = CONFIG.columns;
    const consolidacao = {};

    dadosColheita.forEach(row => {
        const ano = row[col.ano];
        if (!ano) return;

        if (!consolidacao[ano]) {
            consolidacao[ano] = {
                ano: ano,
                totalTonelada: 0,
                totalArea: 0,
                produtividadeMedia: 0,
                registros: 0
            };
        }

        consolidacao[ano].totalTonelada += parseFloat(row[col.toneladaColhida]) || 0;
        consolidacao[ano].totalArea += parseFloat(row[col.areaColhida]) || 0;
        consolidacao[ano].produtividadeMedia += parseFloat(row[col.produtividade]) || 0;
        consolidacao[ano].registros++;
    });

    return Object.values(consolidacao).map(a => ({
        ...a,
        produtividadeMedia: (a.produtividadeMedia / a.registros).toFixed(2)
    })).sort((a, b) => b.ano - a.ano);
}

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando carregamento de dados...');
    const sucesso = await carregarDados();
    if (!sucesso) {
        console.error('Falha ao carregar dados. Verifique se o arquivo Excel está na mesma pasta.');
    }
});
