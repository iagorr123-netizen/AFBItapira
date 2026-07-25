import json
import re

# Ler dados brutos
with open('js/dados_embedded.js', 'r', encoding='utf-8') as f:
    content = f.read()
    # Extrair apenas o primeiro JSON array
    match = re.search(r'\[.*?\](?=;)', content, re.DOTALL)
    if match:
        dados_brutos = json.loads(match.group())
    else:
        raise ValueError("Não conseguiu extrair dados_brutos")

# Ler dados consolidados
with open('js/talhoes_embedded.js', 'r', encoding='utf-8') as f:
    content = f.read()
    match = re.search(r'\[.*?\](?=;)', content, re.DOTALL)
    if match:
        talhoes_consolidados = json.loads(match.group())
    else:
        raise ValueError("Não conseguiu extrair talhoes_consolidados")

# Enriquecer com números de corte
for talhao in talhoes_consolidados:
    num_talhao = talhao['numero']

    # Para cada ano no histórico, encontrar o corte
    for hist in talhao['historico_anos']:
        ano = hist['ano']

        # Procurar nos dados brutos o corte deste talhão neste ano
        cortes_ano = [row['Número do Corte'] for row in dados_brutos
                      if row['Talhão'] == num_talhao and row['Ano Colheita'] == ano]

        if cortes_ano:
            hist['numCorte'] = max(cortes_ano)  # Pegar o maior corte do ano
        else:
            hist['numCorte'] = None

# Salvar
output = 'let dadosTalhoes = ' + json.dumps(talhoes_consolidados, ensure_ascii=False, indent=2) + ';\n'
output += '\nlet dadosTalhoesMap = {};\n'
output += 'dadosTalhoes.forEach(t => { dadosTalhoesMap[t.numero] = t; });\n'

with open('js/talhoes_embedded.js', 'w', encoding='utf-8') as f:
    f.write(output)

print(f'OK - Reprocessado! {len(talhoes_consolidados)} talhoes com cortes enriquecidos')
amostra = [h for h in talhoes_consolidados[29]["historico_anos"]]  # Talhão 30
print(f'Amostra talhao 30: {str(amostra)[:200]}')
