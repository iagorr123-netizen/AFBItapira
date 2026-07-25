// Funções utilitárias gerais

// Formatador de números
function formatarNumero(valor, casasDecimais = 2) {
    return parseFloat(valor).toFixed(casasDecimais);
}

// Formatador de moeda (Real)
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Formatador de data
function formatarData(data) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
}

// Função para exportar dados como CSV
function exportarCSV(dados, nomeArquivo = 'dados.csv') {
    if (!dados || dados.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }

    const headers = Object.keys(dados[0]);
    const csv = [
        headers.join(','),
        ...dados.map(row =>
            headers.map(header => {
                const valor = row[header];
                if (typeof valor === 'string' && valor.includes(',')) {
                    return `"${valor}"`;
                }
                return valor || '';
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();
}

// Função para gerar relatório em HTML
function gerarRelatorioHTML(titulo, dados, colunas) {
    let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${titulo}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 2rem; }
                h1 { color: #2c3e50; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th { background-color: #2c3e50; color: white; padding: 1rem; text-align: left; }
                td { padding: 0.75rem; border-bottom: 1px solid #ddd; }
                tr:hover { background-color: #f5f5f5; }
                .data { text-align: right; margin-top: 2rem; color: #666; }
            </style>
        </head>
        <body>
            <h1>${titulo}</h1>
            <table>
                <thead>
                    <tr>
                        ${colunas.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${dados.map(row => `
                        <tr>
                            ${Object.values(row).map(val => `<td>${val}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="data">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
        </body>
        </html>
    `;

    const novaAba = window.open();
    novaAba.document.write(html);
}

// Validador de formulário
function validarFormulario(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const inputs = form.querySelectorAll('[required]');
    let valido = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#e74c3c';
            valido = false;
        } else {
            input.style.borderColor = '';
        }
    });

    return valido;
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'success') {
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-error';
    const alerta = document.createElement('div');
    alerta.className = `alert ${alertClass}`;
    alerta.textContent = mensagem;
    alerta.style.position = 'fixed';
    alerta.style.top = '1rem';
    alerta.style.right = '1rem';
    alerta.style.zIndex = '9999';
    alerta.style.minWidth = '300px';

    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 3000);
}

// Função para calcular média
function calcularMedia(valores) {
    if (!valores || valores.length === 0) return 0;
    return valores.reduce((a, b) => a + b, 0) / valores.length;
}

// Função para calcular total
function calcularTotal(valores) {
    if (!valores || valores.length === 0) return 0;
    return valores.reduce((a, b) => a + b, 0);
}

// Função para agrupar dados
function agruparPor(dados, chave) {
    return dados.reduce((grupos, item) => {
        const valor = item[chave];
        if (!grupos[valor]) {
            grupos[valor] = [];
        }
        grupos[valor].push(item);
        return grupos;
    }, {});
}

// Função para ordenar dados
function ordenar(dados, chave, descending = true) {
    return [...dados].sort((a, b) => {
        const valA = a[chave];
        const valB = b[chave];

        if (typeof valA === 'string') {
            return descending ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }

        return descending ? valB - valA : valA - valB;
    });
}

// Função para filtrar dados
function filtrar(dados, criterios) {
    return dados.filter(item => {
        return Object.keys(criterios).every(chave => {
            const valor = criterios[chave];
            if (typeof valor === 'function') {
                return valor(item[chave]);
            }
            return item[chave] === valor;
        });
    });
}

// Função para converter para JSON
function exportarJSON(dados, nomeArquivo = 'dados.json') {
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();
}
