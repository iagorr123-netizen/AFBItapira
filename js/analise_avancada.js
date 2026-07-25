// Análise Avançada - Filtros e Gráficos Dinâmicos
console.log('📊 analise_avancada.js CARREGADO');

let chartTCHCorte, chartProdAnual;
let dadosFiltrados = [];

function inicializarAnaliseAvancada() {
    console.log('=== INICIALIZANDO ANÁLISE AVANÇADA ===');

    let tentativas = 0;
    const intervalo = setInterval(() => {
        tentativas++;
        console.log(`Tentativa ${tentativas}: dadosColheita disponível?`, typeof dadosColheita, dadosColheita?.length || 0);

        if (typeof dadosColheita !== 'undefined' && dadosColheita.length > 0) {
            clearInterval(intervalo);
            console.log('✅ Dados carregados! Iniciando preenchimento de filtros...');

            preencherFiltros();
            aplicarFiltros();

            document.getElementById('carregando').style.display = 'none';
            document.getElementById('conteudo').style.display = 'block';
        } else if (tentativas >= 50) {
            clearInterval(intervalo);
            console.error('❌ Erro ao carregar dados após 50 tentativas.');
            if (document.getElementById('carregando')) {
                document.getElementById('carregando').innerHTML = '<div class="alert alert-error">Erro ao carregar dados.</div>';
            }
        }
    }, 100);
}

function preencherFiltros() {
    console.log('>>> INICIANDO PREENCHIMENTO DE FILTROS <<<');
    console.log('dadosColheita disponível?', typeof dadosColheita, 'Tamanho:', dadosColheita?.length || 0);

    const col = CONFIG.columns;
    console.log('CONFIG.columns:', col);

    const anos = new Set();
    const cortes = new Set();
    const variedades = new Set();
    const talhoes = new Set();

    console.log('Preenchendo filtros com CONFIG.columns:', col);
    console.log('Primeiros 3 registros de dadosColheita:');
    dadosColheita.slice(0, 3).forEach((row, idx) => {
        console.log(`  Registro ${idx}:`, {
            ano: row[col.ano],
            corte: row[col.numCorte],
            variedade: row[col.variedade],
            talhao: row[col.talhao]
        });
    });

    dadosColheita.forEach(row => {
        if (row[col.ano]) anos.add(row[col.ano]);
        if (row[col.numCorte]) cortes.add(row[col.numCorte]);
        if (row[col.variedade]) variedades.add(row[col.variedade]);
        if (row[col.talhao]) talhoes.add(row[col.talhao]);
    });

    console.log('Dados encontrados:', { anos: Array.from(anos).length, cortes: Array.from(cortes).length, talhoes: Array.from(talhoes).length });

    // Preencher Ano
    const selectAno = document.getElementById('filtroAno');
    Array.from(anos).sort((a, b) => b - a).forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        selectAno.appendChild(option);
    });

    // Preencher Corte (normalizar 1,5 e 1.5 como iguais)
    const selectCorte = document.getElementById('filtroCorte');
    const cortesNormalizados = new Set();
    cortes.forEach(c => {
        const num = parseFloat(String(c).replace(',', '.'));
        if (!isNaN(num)) cortesNormalizados.add(num);
    });
    const cortesArray = Array.from(cortesNormalizados).sort((a, b) => a - b);
    console.log(`Cortes encontrados (${cortesArray.length}):`, cortesArray);
    cortesArray.forEach(corte => {
        const option = document.createElement('option');
        option.value = corte;
        option.textContent = `Corte ${corte}`;
        selectCorte.appendChild(option);
    });

    // Preencher Variedade
    const selectVariedade = document.getElementById('filtroVariedade');
    const variedadesArray = Array.from(variedades).sort();
    console.log(`Variedades encontradas (${variedadesArray.length}):`, variedadesArray);
    variedadesArray.forEach(variedade => {
        const option = document.createElement('option');
        option.value = variedade;
        option.textContent = variedade;
        selectVariedade.appendChild(option);
    });

    // Preencher Talhão
    const selectTalhao = document.getElementById('filtroTalhao');
    const talhoesArray = Array.from(talhoes).sort((a, b) => a - b);
    console.log(`Talhões encontrados (${talhoesArray.length}):`, talhoesArray.slice(0, 10));
    talhoesArray.forEach(talhao => {
        const option = document.createElement('option');
        option.value = talhao;
        option.textContent = `Talhão ${talhao}`;
        selectTalhao.appendChild(option);
    });
}

function aplicarFiltros() {
    const col = CONFIG.columns;
    const ano = document.getElementById('filtroAno').value;
    const corte = document.getElementById('filtroCorte').value;
    const variedade = document.getElementById('filtroVariedade').value;
    const talhao = document.getElementById('filtroTalhao').value;

    // Filtrar dados
    dadosFiltrados = dadosColheita.filter(row => {
        const matchAno = !ano || row[col.ano] == ano;

        // Normalizar corte para comparação (1,5 = 1.5)
        let matchCorte = true;
        if (corte) {
            const corteRow = parseFloat(String(row[col.numCorte]).replace(',', '.'));
            const corteFilter = parseFloat(corte);
            matchCorte = corteRow === corteFilter;
        }

        const matchVariedade = !variedade || row[col.variedade] === variedade;
        const matchTalhao = !talhao || row[col.talhao] == talhao;

        return matchAno && matchCorte && matchVariedade && matchTalhao;
    });

    // Atualizar métricas
    atualizarMetricas();

    // Atualizar gráficos
    atualizarGraficoTCHCorte();
    atualizarGraficoProdAnual();

    // Atualizar tabela
    preencherTabelaDetalhada();
}

function atualizarMetricas() {
    const col = CONFIG.columns;

    let totalProdutividade = 0;
    let totalColhido = 0;
    let totalAreaColhida = 0;
    let totalAreaPlantada = 0;
    let contRegistros = 0;
    let sumPonderado = 0;

    dadosFiltrados.forEach(row => {
        const prod = parseFloat(row[col.produtividade]) || 0;
        const tonelada = parseFloat(row[col.toneladaColhida]) || 0;
        const areaColhida = parseFloat(row[col.areaColhida]) || 0;
        const areaPlantada = parseFloat(row[col.areaPlantada]) || 0;

        totalProdutividade += prod;
        totalColhido += tonelada;
        totalAreaColhida += areaColhida;
        totalAreaPlantada += areaPlantada;
        sumPonderado += prod * areaColhida;
        contRegistros++;
    });

    const produtividadeMedia = totalAreaColhida > 0 ? (sumPonderado / totalAreaColhida).toFixed(2) : 0;
    const areaNaoColhida = Math.max(0, (totalAreaPlantada - totalAreaColhida).toFixed(2));

    document.getElementById('metricaProdutividade').textContent = produtividadeMedia;
    document.getElementById('metricaTotalColhido').textContent = parseInt(totalColhido).toLocaleString('pt-BR');
    document.getElementById('metricaAreaNaoColhida').textContent = parseInt(areaNaoColhida).toLocaleString('pt-BR');
    document.getElementById('metricaAreaColhida').textContent = totalAreaColhida.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function atualizarGraficoTCHCorte() {
    const col = CONFIG.columns;
    const consolidacao = {};

    dadosFiltrados.forEach(row => {
        let corte = row[col.numCorte];
        if (!corte) return;

        // Normalizar corte para número para agrupar 1.5 e 1,5 como o mesmo
        const corteNum = parseFloat(String(corte).replace(',', '.'));
        if (isNaN(corteNum)) return;

        if (!consolidacao[corteNum]) {
            consolidacao[corteNum] = {
                totalProd: 0,
                totalArea: 0,
                count: 0
            };
        }

        const areaColhida = parseFloat(row[col.areaColhida]) || 0;
        const prod = parseFloat(row[col.produtividade]) || 0;
        consolidacao[corteNum].totalProd += prod * areaColhida;
        consolidacao[corteNum].totalArea += areaColhida;
        consolidacao[corteNum].count++;
    });

    const labels = Object.keys(consolidacao)
        .map(Number)
        .sort((a, b) => a - b)
        .map(c => `Corte ${c}`);
    const dados = Object.keys(consolidacao)
        .map(Number)
        .sort((a, b) => a - b)
        .map(c => (consolidacao[c].totalArea > 0 ? (consolidacao[c].totalProd / consolidacao[c].totalArea).toFixed(2) : 0));

    if (chartTCHCorte) {
        chartTCHCorte.data.labels = labels;
        chartTCHCorte.data.datasets[0].data = dados;
        chartTCHCorte.update();
    } else {
        const ctx = document.getElementById('chartTCHCorte').getContext('2d');
        chartTCHCorte = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'TCH Médio',
                    data: dados,
                    backgroundColor: CONFIG.colors.primary,
                    borderColor: CONFIG.colors.primary,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

function atualizarGraficoProdAnual() {
    const col = CONFIG.columns;
    const consolidacao = {};

    dadosFiltrados.forEach(row => {
        const ano = row[col.ano];
        if (!ano) return;

        if (!consolidacao[ano]) {
            consolidacao[ano] = {
                totalProd: 0,
                totalArea: 0,
                count: 0
            };
        }

        const areaColhida = parseFloat(row[col.areaColhida]) || 0;
        const prod = parseFloat(row[col.produtividade]) || 0;
        consolidacao[ano].totalProd += prod * areaColhida;
        consolidacao[ano].totalArea += areaColhida;
        consolidacao[ano].count++;
    });

    const labels = Object.keys(consolidacao).sort((a, b) => a - b).map(a => a.toString());
    const dados = Object.keys(consolidacao).sort((a, b) => a - b).map(a =>
        (consolidacao[a].totalArea > 0 ? (consolidacao[a].totalProd / consolidacao[a].totalArea).toFixed(2) : 0)
    );

    if (chartProdAnual) {
        chartProdAnual.data.labels = labels;
        chartProdAnual.data.datasets[0].data = dados;
        chartProdAnual.update();
    } else {
        const ctx = document.getElementById('chartProdAnual').getContext('2d');
        chartProdAnual = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Produtividade Média',
                    data: dados,
                    borderColor: CONFIG.colors.secondary,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: CONFIG.colors.secondary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

function preencherTabelaDetalhada() {
    const col = CONFIG.columns;
    const tbody = document.getElementById('tabelaDetalhada');
    tbody.innerHTML = '';

    dadosFiltrados.forEach(row => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${row[col.ano]}</td>
            <td><strong>${row[col.talhao]}</strong></td>
            <td>${row[col.variedade]}</td>
            <td>${row[col.numCorte]}</td>
            <td>${parseFloat(row[col.areaColhida]).toFixed(2)}</td>
            <td>${parseFloat(row[col.produtividade]).toFixed(2)}</td>
            <td>${parseFloat(row[col.toneladaColhida]).toFixed(2)}</td>
        `;
        tbody.appendChild(linha);
    });

    // Se nenhum dado, mostrar mensagem
    if (dadosFiltrados.length === 0) {
        const linha = document.createElement('tr');
        linha.innerHTML = `<td colspan="7" style="text-align: center; color: #999;">Nenhum dado encontrado com os filtros selecionados</td>`;
        tbody.appendChild(linha);
    }
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', inicializarAnaliseAvancada);
