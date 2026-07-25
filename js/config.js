// Configurações globais
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
        ano: 'Ano Colheita ',
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

// Variáveis globais
let dadosColheita = [];
let dadosTalhao = [];
let dadosVariedade = [];
let dadosCorte = [];
let dadosATR = [];
let dadosPluviometrico = [];
