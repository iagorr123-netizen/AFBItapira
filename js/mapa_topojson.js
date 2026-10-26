// Parser TopoJSON para mapa interativo
// Usa a biblioteca topojson-client para descompactar o arquivo

let mapa = null;
let talhaoSelecionado = null;

function obterCorPorProdutividade(produtividade) {
    if (!produtividade) return '#CCCCCC';
    const prod = parseFloat(produtividade);

    if (prod < 75) return '#e74c3c';
    if (prod < 85) return '#f1c40f';
    return '#2ecc71';
}

function inicializarMapaInterativo() {
    console.log('Inicializando mapa TopoJSON...');

    if (typeof L === 'undefined') {
        console.error('Leaflet não está carregado');
        return false;
    }

    const centro = [-22.4433, -46.8533];
    mapa = L.map('mapContainer').setView(centro, 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 5
    }).addTo(mapa);

    const legendaEl = document.querySelector('.legenda');
    if (legendaEl) legendaOriginal = legendaEl.innerHTML;
    carregarTopoJSON();
    return true;
}

function carregarTopoJSON() {
    fetch('FKA.json')
        .then(response => response.json())
        .then(topoData => {
            parseTopoJSON(topoData);
        })
        .catch(error => {
            console.error('Erro ao carregar mapa:', error);
            mostrarAvisoLocal('Erro ao carregar o mapa: ' + error.message);
        });
}

// Converter TopoJSON para GeoJSON (descompactação)
function topoToGeo(topology) {
    const arcs = topology.arcs;
    const transform = topology.transform;
    const geometries = [];

    function arcToCoordinates(arcIndices) {
        let coordinates = [];
        let x = 0, y = 0;

        arcIndices.forEach(arcIndex => {
            const arcData = arcs[arcIndex < 0 ? ~arcIndex : arcIndex];
            const reversed = arcIndex < 0;

            let arcCoords = [];
            arcData.forEach(([dx, dy]) => {
                x += dx;
                y += dy;
                arcCoords.push([
                    x * transform.scale[0] + transform.translate[0],
                    y * transform.scale[1] + transform.translate[1]
                ]);
            });

            if (reversed) arcCoords.reverse();
            coordinates = coordinates.concat(arcCoords);
        });

        return coordinates;
    }

    return {
        type: 'FeatureCollection',
        features: topology.objects.FKA.geometries.map((geom, idx) => {
            let coordinates;
            if (geom.type === 'Polygon') {
                coordinates = geom.arcs.map(ring => arcToCoordinates(ring));
            } else if (geom.type === 'MultiPolygon') {
                coordinates = geom.arcs.map(polygon => polygon.map(ring => arcToCoordinates(ring)));
            }

            return {
                type: 'Feature',
                geometry: {
                    type: geom.type,
                    coordinates: coordinates
                },
                properties: geom.properties
            };
        })
    };
}

function parseTopoJSON(topoData) {
    try {
        console.log('Descompactando TopoJSON...');
        const geoData = topoToGeo(topoData);

        let totalProcessados = 0;
        const bounds = L.latLngBounds();

        geoData.features.forEach((feature, idx) => {
            const props = feature.properties;
            const numTalhao = props.quadra_int; // Usar quadra_int como número do talhão

            if (!numTalhao) {
                console.warn(`Feature ${idx} sem quadra_int`);
                return;
            }

            // Buscar dados consolidados
            const dadosTalhao = buscarDadosTalhao(numTalhao);
            if (!dadosTalhao || dadosTalhao.registros === 0) {
                console.warn(`Nenhum dado para talhão ${numTalhao}`);
                return;
            }

            const cor = obterCorPorProdutividade(dadosTalhao.tchHistorico);

            // Processar geometria
            if (feature.geometry.type === 'Polygon') {
                const coords = feature.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]);
                if (coords.length > 2) {
                    adicionarPoligonoInterativo(coords, numTalhao, cor, dadosTalhao);
                    bounds.extend(coords);
                    totalProcessados++;
                }
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    const coords = polygon[0].map(([lon, lat]) => [lat, lon]);
                    if (coords.length > 2) {
                        adicionarPoligonoInterativo(coords, numTalhao, cor, dadosTalhao);
                        bounds.extend(coords);
                        totalProcessados++;
                    }
                });
            }
        });

        if (bounds.isValid()) {
            mapa.setView(bounds.getCenter(), 17);
        }

        console.log(`✅ Mapa carregado com ${totalProcessados} talhões coloridos!`);

    } catch (error) {
        console.error('Erro ao processar TopoJSON:', error);
    }
}

function buscarDadosTalhao(numTalhao) {
    // Usar dados consolidados (já enriquecidos com numCorte)
    if (typeof dadosTalhoesMap !== 'undefined' && dadosTalhoesMap[numTalhao]) {
        const t = dadosTalhoesMap[numTalhao];

        return {
            talhao: t.numero,
            tamanhoTalhao: t.tamanho_talhao,
            variedadeAtual: t.variedade_atual,
            ultimoCorte: t.ultimo_corte,
            tch2025: t.tch_2025,
            tchUltimoAno: t.tch_ultimo_ano,
            ultimoAno: t.ultimo_ano,
            tchHistorico: t.tch_historico,
            variedadeUltima: t.variedade_ultima,
            qualidadeSolo: t.qualidade_solo,
            incorporadoAo: t.incorporado_ao,
            incorporadoEm: t.incorporado_em,
            historico_anos: t.historico_anos,
            registros: t.registros
        };
    }

    return null;
}

const CORES_VARIEDADE = {
    'CTC 9001': '#c0392b', 'CTC 11': '#2e8b57', 'CTC 4': '#f4d03f', 'CTC 9003': '#922b21',
    'RB 5952': '#1e5631', 'CTC 14': '#d4ac0d', 'SP 2847': '#e6a1a1', 'RB 5014': '#8fd19e',
    'RB 6928': '#fbe9a3', 'RB 7515': '#6b8e23', 'CV 7870': '#e74c3c', 'CTC 9006': '#b7950b'
};
let modoMapa = 'dados';
const poligonosMapa = [];

const LIMITE_VERDE_CORTE = { '2': 110, '3': 95, '4': 85, '5': 76, '6+': 70 };
const CORES_SEMAFORO = { verde: '#2ecc71', amarelo: '#f1c40f', vermelho: '#e74c3c' };
let mediasCorteMapa = null;
const ANO_ATUAL = Math.max(...dadosColheita.map(r => r['Ano Colheita']));

function grupoCorteMapa(n) { return n >= 6 ? '6+' : String(n); }

function mediasCortePeriodo() {
    const acc = {};
    dadosColheita.forEach(r => {
        const ano = r['Ano Colheita'];
        if (ano < 2017 || ano > 2025) return;
        const n = Number(String(r['Número do Corte']).replace(',', '.'));
        const a = parseFloat(r['Area Colhida']) || 0;
        if (!n || a <= 0) return;
        const g = grupoCorteMapa(n);
        if (!acc[g]) acc[g] = { t: 0, a: 0 };
        acc[g].t += (parseFloat(r['Produtividade TCH']) || 0) * a;
        acc[g].a += a;
    });
    const medias = {};
    Object.keys(acc).forEach(g => { medias[g] = acc[g].t / acc[g].a; });
    return medias;
}

function classificarAnoAtual(dados) {
    if (dados.ultimoAno !== ANO_ATUAL || !dados.ultimoCorte) return null;
    if (!mediasCorteMapa) mediasCorteMapa = mediasCortePeriodo();
    const n = Number(String(dados.ultimoCorte).replace(',', '.'));
    if (!n) return null;
    const g = grupoCorteMapa(n);
    const m = mediasCorteMapa[g];
    const p = parseFloat(dados.tchUltimoAno) || 0;
    if (m == null) return null;
    if (g === '1') {
        if (p < 80) return 'vermelho';
        return p > m ? 'verde' : 'amarelo';
    }
    if (p < m) return 'vermelho';
    return p >= LIMITE_VERDE_CORTE[g] ? 'verde' : 'amarelo';
}

const CORES_SOLO = { A: '#1e8449', B: '#58d68d', C: '#f5b041', D: '#c0392b' };
const NOMES_SOLO = { A: 'A (melhor)', B: 'B', C: 'C', D: 'D (pior)' };

function corDoModo(dados) {
    if (dados.incorporadoAo) return '#bdc3c7';
    if (modoMapa === 'solo') return CORES_SOLO[dados.qualidadeSolo] || '#CCCCCC';
    if (modoMapa === 'variedade') return CORES_VARIEDADE[dados.variedadeUltima] || '#CCCCCC';
    if (modoMapa === 'anoatual') {
        const k = classificarAnoAtual(dados);
        return k ? CORES_SEMAFORO[k] : '#CCCCCC';
    }
    return obterCorPorProdutividade(dados.tchHistorico);
}

let variedadeDestacada = null;

function estiloPadrao(poligono, dados) {
    const cor = corDoModo(dados);
    poligono.setStyle({ color: cor, fillColor: cor, weight: 0.5, fillOpacity: 0.6, opacity: 0.9 });
}

function destacarVariedade(v) {
    variedadeDestacada = variedadeDestacada === v ? null : v;
    poligonosMapa.forEach(({ poligono, dados }) => {
        if (!variedadeDestacada) return estiloPadrao(poligono, dados);
        if (dados.variedadeUltima === variedadeDestacada) {
            poligono.setStyle({ color: '#333', fillColor: corDoModo(dados), weight: 1, fillOpacity: 0.95, opacity: 1 });
        } else {
            poligono.setStyle({ color: '#bbb', fillColor: '#ddd', weight: 0.5, fillOpacity: 0.15, opacity: 0.4 });
        }
    });
    document.querySelectorAll('#legendaVariedades .legenda-item').forEach(el => {
        el.style.fontWeight = el.dataset.variedade === variedadeDestacada ? 'bold' : 'normal';
        el.style.background = el.dataset.variedade === variedadeDestacada ? '#eaf7ef' : 'transparent';
    });
}

function aplicarModoMapa(modo) {
    modoMapa = modo;
    variedadeDestacada = null;
    poligonosMapa.forEach(({ poligono, dados }) => estiloPadrao(poligono, dados));
    document.querySelectorAll('#menuMapa button').forEach(b => {
        b.style.background = b.dataset.modo === modo ? '#2ecc71' : 'white';
        b.style.color = b.dataset.modo === modo ? 'white' : '#2c3e50';
    });
    const legenda = document.querySelector('.legenda');
    if (modo === 'variedade') {
        const contagem = {};
        poligonosMapa.forEach(({ dados }) => { contagem[dados.variedadeUltima] = (contagem[dados.variedadeUltima] || 0) + 1; });
        legenda.innerHTML = '<div class="legenda-titulo" style="font-size: 16px;">Variedade</div><div id="legendaVariedades">' + Object.keys(CORES_VARIEDADE)
            .filter(v => contagem[v])
            .map(v => `<div class="legenda-item" data-variedade="${v}" onclick="destacarVariedade('${v}')" style="cursor: pointer; font-size: 14px; padding: 3px 6px; border-radius: 4px;"><div class="legenda-cor" style="background: ${CORES_VARIEDADE[v]}; width: 18px; height: 18px;"></div><span>${v} (${contagem[v]})</span></div>`).join('') + '</div>';
    } else if (modo === 'solo') {
        legenda.innerHTML = `<div class="legenda-titulo" style="font-size: 16px;">Qualidade do solo</div>` + Object.keys(CORES_SOLO).map(k => `<div class="legenda-item" style="font-size: 14px;"><div class="legenda-cor" style="background: ${CORES_SOLO[k]}; width: 18px; height: 18px;"></div><span>${NOMES_SOLO[k]}</span></div>`).join('') + `<div class="legenda-item" style="font-size: 14px;"><div class="legenda-cor" style="background: #CCCCCC; width: 18px; height: 18px;"></div><span>Sem informação</span></div>`;
    } else if (modo === 'anoatual') {
        legenda.innerHTML = `<div class="legenda-titulo" style="font-size: 16px;">Ano atual (${ANO_ATUAL})</div>
            <div class="legenda-item" style="font-size: 14px;"><div class="legenda-cor" style="background: #2ecc71; width: 18px; height: 18px;"></div><span>Ótimo</span></div>
            <div class="legenda-item" style="font-size: 14px;"><div class="legenda-cor" style="background: #f1c40f; width: 18px; height: 18px;"></div><span>Regular</span></div>
            <div class="legenda-item" style="font-size: 14px;"><div class="legenda-cor" style="background: #e74c3c; width: 18px; height: 18px;"></div><span>Ruim</span></div>
            <div class="legenda-item" style="font-size: 14px;"><div class="legenda-cor" style="background: #CCCCCC; width: 18px; height: 18px;"></div><span>Sem colheita no ano</span></div>`;
    } else {
        legenda.innerHTML = legendaOriginal;
    }
}

let legendaOriginal = '';

function adicionarPoligonoInterativo(coords, numTalhao, cor, dadosTalhao) {
    if (coords.length < 3) return;

    const poligono = L.polygon(coords, {
        color: cor,
        weight: 0.5,
        opacity: 0.9,
        fillColor: cor,
        fillOpacity: 0.6
    }).addTo(mapa);
    poligonosMapa.push({ poligono, dados: dadosTalhao });

    poligono.on('click', () => {
        talhaoSelecionado = numTalhao;
        mostrarDadosTalhao(dadosTalhao, cor);
        poligono.setStyle({ weight: 1, fillOpacity: 0.8 });
    });

    poligono.on('mouseover', () => {
        poligono.setStyle({ weight: 0.8 });
    });

    poligono.on('mouseout', () => {
        if (talhaoSelecionado !== numTalhao) {
            poligono.setStyle({ weight: 0.5 });
        }
    });

    const textoTooltip = dadosTalhao.incorporadoAo ? `Talhão ${numTalhao} - incorporado ao Talhão ${dadosTalhao.incorporadoAo} em ${dadosTalhao.incorporadoEm}` : `Talhão ${numTalhao} - ${dadosTalhao.tchHistorico} TCH/ha`;
    poligono.bindTooltip(textoTooltip, {
        permanent: false,
        sticky: true
    });
}

function mostrarDadosTalhao(dados, cor) {
    // Calcular variação entre 2025 e 2026
    let variacao = 0;
    let statusVariacao = 'ESTÁVEL';
    let corVariacao = '#95a5a6';

    if (dados.tch2025 > 0) {
        variacao = (((dados.tch2026 || dados.tchUltimoAno) - dados.tch2025) / dados.tch2025) * 100;
        corVariacao = variacao > 0.5 ? '#2ecc71' : variacao < -0.5 ? '#e74c3c' : '#95a5a6';
        statusVariacao = variacao > 0.5 ? 'MELHORA' : variacao < -0.5 ? 'PIORA' : 'ESTÁVEL';
    } else if (dados.tch2025 === 0 && (dados.tch2026 || dados.tchUltimoAno) > 0) {
        // Talhão que era reforma e voltou a produzir
        statusVariacao = 'RETORNO';
        corVariacao = '#3498db';
        variacao = 100; // Indefinido, mas marca como positivo
    }

    const html = `
        ${dados.incorporadoAo ? `<div class="info-talhao" style="background: #f4f6f7; border-left-color: #95a5a6;"><div class="info-label">Incorporado</div><div class="info-valor">Ao Talhão ${dados.incorporadoAo} em ${dados.incorporadoEm}</div></div>` : ''}
        <div class="info-talhao">
            <div class="info-label">Talhão</div>
            <div class="info-valor grande" style="color: ${cor};">#${dados.talhao}</div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Tamanho do Talhão</div>
            <div class="info-valor">${dados.tamanhoTalhao}<span class="info-unidade">ha</span></div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Variedade Atual</div>
            <div class="info-valor">${dados.variedadeAtual}</div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Qualidade do Solo</div>
            <div class="info-valor">${dados.qualidadeSolo ? dados.qualidadeSolo : 'Sem informação'}</div>
        </div>

        <div class="info-talhao">
            <div class="info-label">Último Corte (${dados.ultimoAno})</div>
            <div class="info-valor">${dados.ultimoCorte > 0 ? 'Corte ' + dados.ultimoCorte : 'N/A'}</div>
        </div>

        <!-- COMPARATIVO DESTACADO -->
        <div class="info-talhao" style="background: #f0f8ff; border-left: 4px solid #3498db; margin: 15px 0;">
            <div class="info-label" style="color: #3498db; font-weight: bold;">COMPARATIVO: 2026 × 2025 × HISTÓRICO</div>

            <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;">
                    <!-- 2026 -->
                    <div style="padding: 10px; background: #c8e6c9; border-radius: 4px;">
                        <div style="font-size: 0.75rem; color: #666; font-weight: bold;">2026</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">${dados.tch2026 || dados.tchUltimoAno || '-'}</div>
                        <div style="font-size: 0.75rem; color: #999;">TCH/ha</div>
                    </div>

                    <!-- 2025 -->
                    <div style="padding: 10px; background: #fff3cd; border-radius: 4px;">
                        <div style="font-size: 0.75rem; color: #666; font-weight: bold;">2025</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">${dados.tch2025}</div>
                        <div style="font-size: 0.75rem; color: #999;">TCH/ha</div>
                    </div>

                    <!-- Histórico -->
                    <div style="padding: 10px; background: #e1f5fe; border-radius: 4px;">
                        <div style="font-size: 0.75rem; color: #666; font-weight: bold;">Histórico</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">${dados.tchHistorico}</div>
                        <div style="font-size: 0.75rem; color: #999;">TCH/ha</div>
                    </div>
                </div>

                <!-- Variação 2025 vs 2026 -->
                <div style="margin-top: 12px; text-align: center; padding: 10px; background: ${corVariacao}; color: white; border-radius: 4px;">
                    <div style="font-weight: bold; font-size: 1.1rem;">
                        ${statusVariacao}${statusVariacao === 'RETORNO' ? '' : ': ' + (variacao > 0 ? '+' : '') + variacao.toFixed(1) + '%'}
                    </div>
                    <div style="font-size: 0.75rem; font-style: italic; margin-top: 4px; opacity: 0.9;">
                        ${statusVariacao === 'RETORNO' ? 'Voltou a produzir em 2026' : 'de 2025 para 2026'}
                    </div>
                </div>
            </div>
        </div>

        <!-- GRÁFICO DO HISTÓRICO -->
        <div class="info-talhao" style="margin-top: 20px; padding: 15px; border: none;">
            <div class="info-label" style="margin-bottom: 15px;">Histórico de Produtividade</div>
            <div style="position: relative; width: 100%; height: 300px;">
                <canvas id="graficoHistorico"></canvas>
            </div>
        </div>
    `;

    const modal = document.getElementById('modalTalhao');
    const conteudo = document.getElementById('modalTalhaoConteudo');
    if (modal && conteudo) {
        conteudo.innerHTML = `<div style="display: flex; justify-content: flex-end; margin-bottom: 8px;"><button onclick="fecharModalTalhao()" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 13px;">Fechar</button></div>` + html;
        conteudo.style.color = '#333';
        modal.style.display = 'flex';
    } else {
        console.error('❌ Elemento modalTalhao não encontrado!');
    }

    console.log('Dados do talhão:', dados);
    console.log('Histórico:', dados.historico_anos);

    // Desenhar gráfico após renderizar
    setTimeout(() => {
        if (dados.historico_anos && dados.historico_anos.length > 0) {
            const labels = dados.historico_anos.map(h => {
                if (h.reforma) {
                    const ehMuda = typeof dadosMudas !== 'undefined' && dadosMudas.some(m => m['Talhão'] === dados.talhao && m['Ano Colheita'] === h.ano);
                    return `${h.ano} - ${ehMuda ? 'Muda' : 'Reforma'}`;
                }
                const corteLabel = h.numCorte ? ` - Corte ${h.numCorte}` : '';
                return `${h.ano}${corteLabel}`;
            });
            const medias = dados.historico_anos.map(h => h.media);

            const ctx = document.getElementById('graficoHistorico');
            if (ctx && typeof Chart !== 'undefined') {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Produtividade (TCH/ha)',
                            data: medias,
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#2ecc71',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    color: '#666',
                                    font: { size: 11 }
                                },
                                grid: {
                                    color: 'rgba(0,0,0,0.05)'
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#666',
                                    font: { size: 11 }
                                },
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            }
        }
    }, 100);
}

function fecharModalTalhao() {
    const modal = document.getElementById('modalTalhao');
    if (modal) modal.style.display = 'none';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModalTalhao(); });

let marcadorLocal = null;
let circuloLocal = null;
let talhaoAtualLocal = null;

function anelDoPoligono(poligono) {
    let l = poligono.getLatLngs();
    while (Array.isArray(l) && Array.isArray(l[0])) l = l[0];
    return l;
}

function pontoDentroDoAnel(lat, lng, anel) {
    let dentro = false;
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const xi = anel[i].lng, yi = anel[i].lat, xj = anel[j].lng, yj = anel[j].lat;
        if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) dentro = !dentro;
    }
    return dentro;
}

function talhaoNoPonto(lat, lng) {
    const achado = poligonosMapa.find(({ poligono }) => pontoDentroDoAnel(lat, lng, anelDoPoligono(poligono)));
    return achado ? achado.dados : null;
}

function mostrarAvisoLocal(texto) {
    const aviso = document.getElementById('avisoLocal');
    aviso.innerHTML = texto;
    aviso.style.display = 'block';
}

function localizarUsuario() {
    if (!navigator.geolocation) {
        mostrarAvisoLocal('Seu aparelho não permite localização.');
        return;
    }
    mostrarAvisoLocal('Buscando sua posição...');
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude, precisao = Math.round(pos.coords.accuracy);
        if (marcadorLocal) mapa.removeLayer(marcadorLocal);
        if (circuloLocal) mapa.removeLayer(circuloLocal);
        circuloLocal = L.circle([lat, lng], { radius: pos.coords.accuracy, color: '#3498db', weight: 1, fillColor: '#3498db', fillOpacity: 0.12 }).addTo(mapa);
        marcadorLocal = L.circleMarker([lat, lng], { radius: 8, color: '#ffffff', weight: 2, fillColor: '#2980b9', fillOpacity: 1 }).addTo(mapa);
        mapa.setView([lat, lng], Math.max(mapa.getZoom(), 17));
        talhaoAtualLocal = talhaoNoPonto(lat, lng);
        const incerto = precisao > 15 ? ' (posição incerta, precisão de ' + precisao + ' m)' : '';
        if (talhaoAtualLocal) {
            mostrarAvisoLocal('Você está no Talhão ' + talhaoAtualLocal.talhao + '. Clique para ver os dados' + incerto);
        } else {
            talhaoAtualLocal = null;
            mostrarAvisoLocal('Você está fora dos talhões mapeados' + incerto);
        }
    }, erro => {
        const motivos = { 1: 'Permissão de localização negada.', 2: 'Posição indisponível no momento.', 3: 'Tempo esgotado ao buscar a posição.' };
        mostrarAvisoLocal(motivos[erro.code] || 'Não foi possível obter sua posição.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

function abrirTalhaoAtual() {
    if (talhaoAtualLocal) mostrarDadosTalhao(talhaoAtualLocal, corDoModo(talhaoAtualLocal));
}
