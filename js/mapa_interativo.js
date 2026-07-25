// Mapa Interativo - usa dados consolidados dos talhões

let mapa = null;
let talhaoSelecionado = null;

function obterCorPorProdutividade(produtividade) {
    if (!produtividade) return '#CCCCCC';
    const prod = parseFloat(produtividade);

    if (prod < 60) return '#FF6B6B';
    if (prod < 80) return '#FFA500';
    if (prod < 100) return '#4ECDC4';
    return '#2ecc71';
}

function inicializarMapaInterativo() {
    console.log('Inicializando mapa interativo...');

    if (typeof L === 'undefined') {
        console.error('Leaflet não está carregado');
        return false;
    }

    const centro = [-22.4433, -46.8533];
    mapa = L.map('mapContainer').setView(centro, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 5
    }).addTo(mapa);

    carregarKMLInterativo();
    return true;
}

function carregarKMLInterativo() {
    fetch('mapa_talhoes.kml')
        .then(response => response.text())
        .then(kmlString => {
            parseKMLInterativo(kmlString);
        })
        .catch(error => {
            console.error('Erro ao carregar mapa:', error);
            document.getElementById('painelConteudo').innerHTML =
                `<div style="color: #c33; padding: 20px;">Erro: ${error.message}</div>`;
        });
}

function parseKMLInterativo(kmlString) {
    try {
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlString, 'text/xml');

        const placemarks = kmlDoc.getElementsByTagName('Placemark');
        console.log(`Encontrados ${placemarks.length} polígonos`);

        let totalProcessados = 0;
        const bounds = L.latLngBounds();

        for (let pm of placemarks) {
            const nome = pm.getElementsByTagName('name')[0]?.textContent || 'Sem nome';

            // Extrair número do talhão
            const numTalhao = extrairNumeroTalhao(nome);
            if (!numTalhao) continue;

            // Buscar dados consolidados
            const dadosTalhao = buscarDadosTalhao(numTalhao);
            if (!dadosTalhao || dadosTalhao.registros === 0) continue;

            const cor = obterCorPorProdutividade(dadosTalhao.produtividadeMedia);

            // Processar polígonos
            const polygons = pm.getElementsByTagName('Polygon');
            for (let poly of polygons) {
                const coords = extrairCoordenadas(poly);
                if (coords.length > 0) {
                    adicionarPoligonoInterativo(coords, numTalhao, cor, dadosTalhao);
                    bounds.extend(coords);
                    totalProcessados++;
                }
            }
        }

        if (bounds.isValid()) {
            mapa.fitBounds(bounds, { padding: [50, 50] });
        }

        console.log(`Mapa carregado com ${totalProcessados} talhões coloridos`);

    } catch (error) {
        console.error('Erro ao processar KML:', error);
    }
}

function extrairNumeroTalhao(nome) {
    const match = nome.match(/\d+/);
    return match ? parseInt(match[0]) : null;
}

function buscarDadosTalhao(numTalhao) {
    // Usar dados consolidados
    if (typeof dadosTalhoesMap !== 'undefined' && dadosTalhoesMap[numTalhao]) {
        const t = dadosTalhoesMap[numTalhao];
        return {
            talhao: t.numero,
            totalTonelada: t.total_tonelada,
            totalArea: t.area_colhida,
            areaNaoColhida: t.area_nao_colhida,
            areaPlantada: t.area_plantada,
            produtividadeMedia: t.produtividade_media,
            registros: t.registros,
            variedades: t.variedades,
            anos: t.anos,
            cortes: t.cortes
        };
    }

    return null;
}

function extrairCoordenadas(elemento) {
    const coordsTexto = elemento.getElementsByTagName('coordinates')[0]?.textContent || '';
    const coords = [];

    if (!coordsTexto.trim()) {
        return coords;
    }

    const pares = coordsTexto.trim().split(/[\s,]+/);
    for (let i = 0; i < pares.length - 1; i += 3) {
        const lon = parseFloat(pares[i]);
        const lat = parseFloat(pares[i + 1]);

        if (!isNaN(lat) && !isNaN(lon)) {
            coords.push([lat, lon]);
        }
    }

    return coords;
}

function adicionarPoligonoInterativo(coords, numTalhao, cor, dadosTalhao) {
    if (coords.length < 3) return;

    const poligono = L.polygon(coords, {
        color: cor,
        weight: 2,
        opacity: 0.9,
        fillColor: cor,
        fillOpacity: 0.6
    }).addTo(mapa);

    poligono.on('click', () => {
        talhaoSelecionado = numTalhao;
        mostrarDadosTalhao(dadosTalhao, cor);
        poligono.setStyle({ weight: 4, fillOpacity: 0.8 });
    });

    poligono.on('mouseover', () => {
        poligono.setStyle({ weight: 3 });
    });

    poligono.on('mouseout', () => {
        if (talhaoSelecionado !== numTalhao) {
            poligono.setStyle({ weight: 2 });
        }
    });

    poligono.bindTooltip(`Talhão ${numTalhao} - ${dadosTalhao.produtividadeMedia} TCH/ha`, {
        permanent: false,
        sticky: true
    });
}

function mostrarDadosTalhao(dados, cor) {
    const html = `
        <div class="info-talhao">
            <div class="info-label">Talhão</div>
            <div class="info-valor grande" style="color: ${cor};">#${dados.talhao}</div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Produtividade Média</div>
            <div class="info-valor">${dados.produtividadeMedia}<span class="info-unidade">TCH/ha</span></div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Total Colhido</div>
            <div class="info-valor">${Number(dados.totalTonelada).toLocaleString('pt-BR')}<span class="info-unidade">TCH</span></div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Área Plantada</div>
            <div class="info-valor">${dados.areaPlantada}<span class="info-unidade">ha</span></div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Área Colhida</div>
            <div class="info-valor">${dados.totalArea}<span class="info-unidade">ha</span></div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Área Não Colhida</div>
            <div class="info-valor">${dados.areaNaoColhida}<span class="info-unidade">ha</span></div>
        </div>

        ${dados.variedades.length > 0 ? `
            <div class="info-talhao">
                <div class="info-label">Variedades Plantadas</div>
                <div style="margin-top: 8px;">
                    ${dados.variedades.map(v => `<span style="display: inline-block; background: #e8f5e9; padding: 4px 8px; margin: 2px; border-radius: 4px; font-size: 0.85rem; color: #2e7d32;">${v}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${dados.anos.length > 0 ? `
            <div class="info-talhao">
                <div class="info-label">Anos de Colheita</div>
                <div class="info-valor">${dados.anos.join(', ')}</div>
            </div>
        ` : ''}

        ${dados.cortes.length > 0 ? `
            <div class="info-talhao">
                <div class="info-label">Cortes Realizados</div>
                <div class="info-valor">${dados.cortes.join(', ')}</div>
            </div>
        ` : ''}

        <div class="info-talhao" style="background: #f0f0f0; border-left-color: #999;">
            <div class="info-label">Registros de Colheita</div>
            <div class="info-valor">${dados.registros}</div>
        </div>
    `;

    document.getElementById('painelConteudo').innerHTML = html;
}

// Inicialização é feita pelo HTML após carregar dados dos talhões
