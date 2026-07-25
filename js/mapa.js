// Visualizador de Mapa KML - Leaflet

let mapa = null;
let camadaKML = null;

function inicializarMapa(elementId = 'mapContainer') {
    // Verificar se Leaflet está disponível
    if (typeof L === 'undefined') {
        console.error('Leaflet não está carregado. Adicione a biblioteca ao HTML.');
        return false;
    }

    // Criar mapa
    const container = document.getElementById(elementId);
    if (!container) {
        console.error(`Container "${elementId}" não encontrado.`);
        return false;
    }

    // Coordenadas aproximadas de Itapira, SP
    const centro = [-22.4433, -46.8533];

    mapa = L.map(elementId).setView(centro, 13);

    // Adicionar camada base do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 5
    }).addTo(mapa);

    // Carregar KML
    carregarKML();

    return true;
}

function carregarKML() {
    // Usar fetch para carregar o arquivo KML
    fetch('mapa_talhoes.kml')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar KML: ' + response.statusText);
            }
            return response.text();
        })
        .then(kmlString => {
            parseKML(kmlString);
        })
        .catch(error => {
            console.error('Erro ao carregar mapa:', error);
            exibirErroMapa(error.message);
        });
}

function parseKML(kmlString) {
    try {
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlString, 'text/xml');

        if (kmlDoc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('Erro ao parsear KML');
        }

        // Extrair Placemarks (polígonos dos talhões)
        const placemarks = kmlDoc.getElementsByTagName('Placemark');
        console.log(`Encontrados ${placemarks.length} talhões`);

        if (placemarks.length === 0) {
            throw new Error('Nenhum talhão encontrado no KML');
        }

        let totalTalhoes = 0;
        const bounds = L.latLngBounds();

        for (let pm of placemarks) {
            const nome = pm.getElementsByTagName('name')[0]?.textContent || 'Sem nome';
            const descricao = pm.getElementsByTagName('description')[0]?.textContent || '';

            // Processar Polígonos
            const polygons = pm.getElementsByTagName('Polygon');
            for (let poly of polygons) {
                const coords = extrairCoordenadas(poly);
                if (coords.length > 0) {
                    adicionarPoligonoMapa(coords, nome, descricao);
                    bounds.extend(coords);
                    totalTalhoes++;
                }
            }

            // Processar LineStrings (se houver)
            const linestrings = pm.getElementsByTagName('LineString');
            for (let line of linestrings) {
                const coords = extrairCoordenadas(line);
                if (coords.length > 0) {
                    adicionarLinhaaMapa(coords, nome, descricao);
                }
            }

            // Processar Points (se houver)
            const points = pm.getElementsByTagName('Point');
            for (let point of points) {
                const coords = extrairCoordenadas(point);
                if (coords.length > 0) {
                    adicionarMarcadorMapa(coords[0], nome, descricao);
                }
            }
        }

        // Ajustar zoom para mostrar todos os talhões
        if (bounds.isValid()) {
            mapa.fitBounds(bounds, { padding: [50, 50] });
        }

        console.log(`Mapa carregado com ${totalTalhoes} talhões`);
        exibirSucessoMapa(`Mapa carregado com ${totalTalhoes} talhões`);

    } catch (error) {
        console.error('Erro ao processar KML:', error);
        exibirErroMapa(error.message);
    }
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

function adicionarPoligonoMapa(coords, nome, descricao) {
    if (coords.length < 3) return;

    const cores = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B888', '#82E0AA'
    ];

    const cor = cores[Math.floor(Math.random() * cores.length)];

    const poliogno = L.polygon(coords, {
        color: cor,
        weight: 2,
        opacity: 0.8,
        fillColor: cor,
        fillOpacity: 0.5
    }).addTo(mapa);

    // Pop-up ao clicar
    let popupContent = `<strong>${nome}</strong>`;
    if (descricao) {
        popupContent += `<br/><small>${descricao}</small>`;
    }
    poliogno.bindPopup(popupContent);

    // Tooltip ao passar mouse
    poliogno.bindTooltip(nome, { permanent: false, sticky: true });
}

function adicionarLinhaaMapa(coords, nome, descricao) {
    if (coords.length < 2) return;

    const linha = L.polyline(coords, {
        color: '#3388FF',
        weight: 2,
        opacity: 0.7
    }).addTo(mapa);

    let popupContent = `<strong>${nome}</strong>`;
    if (descricao) {
        popupContent += `<br/><small>${descricao}</small>`;
    }
    linha.bindPopup(popupContent);
}

function adicionarMarcadorMapa(coord, nome, descricao) {
    const marcador = L.marker(coord).addTo(mapa);

    let popupContent = `<strong>${nome}</strong>`;
    if (descricao) {
        popupContent += `<br/><small>${descricao}</small>`;
    }
    marcador.bindPopup(popupContent);
}

function exibirErroMapa(mensagem) {
    const container = document.getElementById('mapContainer');
    if (container) {
        container.innerHTML = `<div style="padding: 20px; background: #fee; color: #c33; border-radius: 8px;">
            <strong>Erro ao carregar mapa:</strong><br/>
            ${mensagem}
        </div>`;
    }
}

function exibirSucessoMapa(mensagem) {
    const container = document.getElementById('mapStatus');
    if (container) {
        container.innerHTML = `<div style="padding: 10px; background: #efe; color: #3a3; border-radius: 8px;">
            ${mensagem}
        </div>`;
    }
}

// Exportar função para uso externo
window.inicializarMapaFazenda = inicializarMapa;
