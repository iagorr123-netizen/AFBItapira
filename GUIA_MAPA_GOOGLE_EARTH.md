# 📍 Guia: Integrar Mapa do Google Earth Pro

## 🎯 Objetivo
Extrair os dados dos talhões do Google Earth Pro e visualizá-los no sistema de análise.

---

## 📥 Passo 1: Exportar Arquivo KML do Google Earth Pro

### **Método A: Exportar Pasta com Talhões (Recomendado)**

1. Abra **Google Earth Pro**
2. Localize a pasta ou arquivo que contém seus talhões
3. **Clique com botão direito** na pasta/arquivo
4. Selecione **"Salvar como"** ou **"Salvar local"**
5. Escolha formato: **KML (.kml)**
6. Salve com o nome: `mapa_talhoes.kml`
7. **Salve na pasta:** 
   ```
   C:\Users\Iago\Desktop\Projeto AFB Itapira - Automação de dados\
   ```

### **Método B: Exportar Visualização Inteira**

1. **Menu** → **Arquivo** → **Salvar como**
2. Escolha **"Arquivo KML (.kml)"**
3. Nome: `mapa_talhoes.kml`
4. Salve na pasta do projeto

---

## 📊 Passo 2: Verificar Conteúdo do KML

O arquivo KML deve conter informações dos talhões como:
- **Nome:** Talhão 1, Talhão 2, etc.
- **Coordenadas:** Latitude e longitude
- **Descrição:** Variedade, área, características

Você pode abrir o arquivo KML em editor de texto para verificar:
```xml
<Placemark>
  <name>Talhão 1</name>
  <description>Variedade: CTC 11, Área: 16.46 ha</description>
  <Polygon>
    <outerBoundary>...</outerBoundary>
  </Polygon>
</Placemark>
```

---

## 🗺️ Passo 3: Visualizar no Sistema

Depois que você colocar o arquivo `mapa_talhoes.kml` na pasta do projeto:

1. Abra **Análise Avançada** no sistema
2. Role para baixo até a seção **"Mapa da Fazenda"**
3. O mapa será carregado automaticamente
4. Você verá os talhões marcados no mapa

---

## 📋 Passo 4: Extrair Dados dos Talhões (Importante!)

Para máxima funcionalidade, você também pode exportar os dados dos talhões:

### **No Google Earth Pro:**

1. Abra o **Medidor de Distâncias** (Ferramentas → Medidor)
2. Selecione seus talhões e meça as áreas
3. **Menu** → **Ferramentas** → **Opções de Medição**
4. Exporte como **Planilha CSV**

### **Ou Manualmente:**

Crie um arquivo CSV chamado `talhoes_detalhes.csv`:
```csv
Talhão,Latitude,Longitude,Variedade,Área,Características
1,-22.5000,-46.3000,CTC 11,16.46,Solo fértil
2,-22.5010,-46.3010,CTC 11,21.96,Declive suave
3,-22.5020,-46.3020,CTC 4,20.67,Bem drenado
```

---

## 🖼️ Passo 5: Exportar Mapa como Imagem (Opcional)

Se quiser um screenshot do mapa:

1. **Menu** → **Arquivo** → **Salvar como imagem**
2. Escolha resolução: **Alta (1920x1080 ou superior)**
3. Formato: **PNG**
4. Salve como: `mapa_talhoes.png`

---

## ✅ Checklist de Integração

- [ ] Extraiu arquivo `mapa_talhoes.kml` do Google Earth Pro
- [ ] Salvou na pasta: `C:\Users\Iago\Desktop\Projeto AFB Itapira - Automação de dados\`
- [ ] Abriu o sistema e foi até **Análise Avançada**
- [ ] Vê o mapa carregando normalmente
- [ ] Os talhões aparecem corretamente no mapa

---

## 🐛 Troubleshooting

### "Mapa não aparece"
- Verifique se o arquivo `mapa_talhoes.kml` está na pasta correta
- Recarregue a página (Ctrl+F5)
- Verifique o console do navegador (F12 > Console) para erros

### "Talhões não aparecem no mapa"
- Certifique-se que o KML contém polígonos (Placemark com Polygon)
- Verifique as coordenadas (devem estar em graus: -22.5, -46.3)

### "Arquivo KML muito grande"
- Reduza o nível de zoom no Google Earth antes de exportar
- Ou exporte apenas a área de interesse

---

## 📚 Referências

- **Google Earth Pro Help:** https://support.google.com/earth/answer/176
- **KML Format Specification:** https://developers.google.com/kml/documentation
- **Leaflet (Biblioteca de Mapas):** https://leafletjs.com/

---

## 🎯 Próximas Melhorias

Com o mapa integrado, poderemos:
- ✅ Visualizar produtividade por cor de talhão
- ✅ Clicar no talhão para ver detalhes
- ✅ Mostrar alertas de baixa produtividade
- ✅ Comparar talhões lado a lado no mapa

---

**Quando tiver o arquivo KML pronto, avise-me! Vou ativar a visualização do mapa.** 🗺️
