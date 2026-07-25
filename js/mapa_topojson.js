// Parser TopoJSON para mapa interativo
// Usa a biblioteca topojson-client para descompactar o arquivo

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
            document.getElementById('painelConteudo').innerHTML =
                `<div style="color: #c33; padding: 20px;">Erro: ${error.message}</div>`;
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
            mapa.fitBounds(bounds, { padding: [50, 50] });
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
            historico_anos: t.historico_anos,
            registros: t.registros
        };
    }

    return null;
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

    poligono.bindTooltip(`Talhão ${numTalhao} - ${dadosTalhao.tchHistorico} TCH/ha`, {
        permanent: false,
        sticky: true
    });
}

function mostrarDadosTalhao(dados, cor) {
    // Calcular variação entre 2025 e último ano
    let variacao = 0;
    if (dados.tchUltimoAno > 0) {
        variacao = ((dados.tch2025 - dados.tchUltimoAno) / dados.tchUltimoAno) * 100;
    }

    const corVariacao = variacao > 0.5 ? '#2ecc71' : variacao < -0.5 ? '#e74c3c' : '#95a5a6';
    const statusVariacao = variacao > 0.5 ? 'MELHORA' : variacao < -0.5 ? 'PIORA' : 'ESTÁVEL';

    const html = `
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
            <div class="info-label">Último Corte (2025)</div>
            <div class="info-valor">${dados.ultimoCorte > 0 ? 'Corte ' + dados.ultimoCorte : 'N/A'}</div>
        </div>

        <!-- COMPARATIVO DESTACADO -->
        <div class="info-talhao" style="background: #f0f8ff; border-left: 4px solid #3498db; margin: 15px 0;">
            <div class="info-label" style="color: #3498db; font-weight: bold;">COMPARATIVO: 2025 × ${dados.ultimoAno} × HISTÓRICO</div>

            <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;">
                    <!-- 2025 -->
                    <div style="padding: 10px; background: #fff3cd; border-radius: 4px;">
                        <div style="font-size: 0.75rem; color: #666; font-weight: bold;">2025</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">${dados.tch2025}</div>
                        <div style="font-size: 0.75rem; color: #999;">TCH/ha</div>
                    </div>

                    <!-- Último Ano -->
                    <div style="padding: 10px; background: #e8f5e9; border-radius: 4px;">
                        <div style="font-size: 0.75rem; color: #666; font-weight: bold;">${dados.ultimoAno}</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">${dados.tchUltimoAno}</div>
                        <div style="font-size: 0.75rem; color: #999;">TCH/ha</div>
                    </div>

                    <!-- Histórico -->
                    <div style="padding: 10px; background: #e1f5fe; border-radius: 4px;">
                        <div style="font-size: 0.75rem; color: #666; font-weight: bold;">Histórico</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">${dados.tchHistorico}</div>
                        <div style="font-size: 0.75rem; color: #999;">TCH/ha</div>
                    </div>
                </div>

                <!-- Variação 2025 vs Último Ano -->
                <div style="margin-top: 12px; text-align: center; padding: 10px; background: ${corVariacao}; color: white; border-radius: 4px;">
                    <div style="font-weight: bold; font-size: 1.1rem;">
                        ${statusVariacao}: ${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}%
                    </div>
                    <div style="font-size: 0.75rem; font-style: italic; margin-top: 4px; opacity: 0.9;">
                        de ${dados.ultimoAno} para 2025
                    </div>
                </div>
            </div>
        </div>

        <div class="info-talhao" style="background: #f0f0f0; border-left-color: #999;">
            <div class="info-label">Registros de Colheita</div>
            <div class="info-valor">${dados.registros}</div>
        </div>

        <!-- GRÁFICO DO HISTÓRICO -->
        <div class="info-talhao" style="margin-top: 20px; padding: 15px; border: none;">
            <div class="info-label" style="margin-bottom: 15px;">Histórico de Produtividade</div>
            <div style="position: relative; width: 100%; height: 300px;">
                <canvas id="graficoHistorico"></canvas>
            </div>
        </div>
    `;

    const painel = document.getElementById('painelConteudo');
    if (painel) {
        painel.innerHTML = html;
        painel.style.display = 'block';
        painel.style.color = '#333';
        console.log('✅ Painel renderizado com sucesso');
    } else {
        console.error('❌ Elemento painelConteudo não encontrado!');
    }

    console.log('Dados do talhão:', dados);
    console.log('Histórico:', dados.historico_anos);

    // Desenhar gráfico após renderizar
    setTimeout(() => {
        if (dados.historico_anos && dados.historico_anos.length > 0) {
            const labels = dados.historico_anos.map(h => {
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
