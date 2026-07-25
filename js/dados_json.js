// Carregador de dados do JSON (mais confiável que XLSX)

async function carregarDadosJSON() {
    try {
        console.log('📥 Carregando dados do JSON...');

        const response = await fetch('dados_colheita.json');
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const dadosRaw = await response.json();
        console.log(`✅ ${dadosRaw.length} registros carregados`);

        // Processar dados com headers corretos
        const headers = [
            'Ano Colheita ',
            'Data Base',
            'Talhão',
            'Variedade',
            'Area Plantada',
            'Número do Corte',
            'Data de Plantio',
            'Idade (meses)',
            'Idade (anos)',
            'Area Colhida',
            'Produtividade TCH',
            'Tonelada Colhida'
        ];

        dadosColheita = dadosRaw.map((row, idx) => {
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[`col_${i}`];
            });
            return obj;
        }).filter(row => row['Ano Colheita '] != null);

        console.log(`✅ Dados processados: ${dadosColheita.length} registros`);
        return true;

    } catch (error) {
        console.error('❌ Erro ao carregar JSON:', error);
        return false;
    }
}

// Sobrescrever função original
async function carregarDados() {
    return await carregarDadosJSON();
}
