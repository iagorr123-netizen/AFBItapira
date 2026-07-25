// Setup global - Configurações
const CONFIG = {
    excelFile: 'Base Cana BI 2.xlsx',
    sheets: {
        main: 'Colheita Base',
        talhao: 'Talhao Dados',
        variedade: 'Variedade',
        corte: 'Corte Base',
        atr: 'ATR',
        pluviometrico: 'Índice Pluviométrico'
    },
    columns: {
        ano: 'Ano Colheita',
        talhao: 'Talhão',
        variedade: 'Variedade',
        areaPlantada: 'Area Plantada',
        areaColhida: 'Area Colhida',
        produtividade: 'Produtividade TCH',
        toneladaColhida: 'Tonelada Colhida',
        numCorte: 'Número do Corte',
        dataBase: 'Data Base'
    },
    colors: {
        primary: '#2ecc71',
        secondary: '#3498db',
        danger: '#e74c3c',
        warning: '#f39c12',
        dark: '#2c3e50',
        light: '#ecf0f1'
    }
};

// Funções consolidação (copiadas de dados.js)
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

    return Object.values(consolidacao).map(t => ({
        ...t,
        produtividadeMedia: (t.produtividadeMedia / t.registros).toFixed(2),
        variedades: Array.from(t.variedades),
        numCortes: Array.from(t.numCortes)
    })).sort((a, b) => b.totalTonelada - a.totalTonelada);
}

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

console.log('Setup carregado com CONFIG e funções consolidação');
