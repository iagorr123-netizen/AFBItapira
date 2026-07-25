# 🚀 Como Iniciar o Sistema AFB Itapira

## ⚠️ Importante
O navegador **não consegue ler arquivos Excel** quando você abre `file://` diretamente. Por isso, você precisa usar um **servidor HTTP local**.

---

## 🎯 Opção 1: Usar o Script (Mais Fácil)

### Windows (.BAT):
1. **Navegue até a pasta:** 
   ```
   C:\Users\Iago\Desktop\Projeto AFB Itapira - Automação de dados\
   ```

2. **Duplo-clique em:** `iniciar_servidor.bat`

3. **Espere aparecer:**
   ```
   ✅ Servidor iniciado!
   🌐 URL: http://localhost:8000
   ```

4. **O navegador abrirá automaticamente** com a página inicial

5. **Para parar:** Feche a janela do terminal ou pressione `Ctrl+C`

---

## 🎯 Opção 2: Usar Python (Se preferir)

### Pré-requisito: Python instalado
Verifique se tem Python:
```bash
python --version
```

Se não tiver, baixe em: https://www.python.org/downloads/

### Executar:

**Windows (PowerShell/CMD):**
```powershell
cd "C:\Users\Iago\Desktop\Projeto AFB Itapira - Automação de dados"
python iniciar_servidor.py
```

**Ou Mac/Linux:**
```bash
cd ~/Desktop/Projeto\ AFB\ Itapira\ -\ Automação\ de\ dados
python3 iniciar_servidor.py
```

---

## 🎯 Opção 3: Terminal (Sem script)

**Windows (PowerShell):**
```powershell
cd "C:\Users\Iago\Desktop\Projeto AFB Itapira - Automação de dados"
python -m http.server 8000
```

**Mac/Linux (Terminal):**
```bash
cd ~/Desktop/Projeto\ AFB\ Itapira\ -\ Automação\ de\ dados
python3 -m http.server 8000
```

Depois abra no navegador: **http://localhost:8000**

---

## ✅ Quando está Funcionando:

- [ ] Vê uma janela de terminal com "Servidor iniciado"
- [ ] Navegador abre automaticamente
- [ ] Vê a página inicial do AFB Itapira
- [ ] Consegue navegar pelos módulos
- [ ] Os dados carregam normalmente
- [ ] O mapa dos talhões aparece

---

## 🐛 Troubleshooting

### "Porta 8000 já está em uso"
A porta já tem outro servidor. Tente outra porta:
```bash
python -m http.server 8001
```
Depois acesse: `http://localhost:8001`

### "Python não encontrado"
Instale Python: https://www.python.org/downloads/

**IMPORTANTE:** Marque "Add Python to PATH" durante a instalação!

### "Ainda não carrega os dados"
1. Abra o navegador → F12 (Console)
2. Procure por erros vermelhos
3. Copie o erro e compartilhe comigo

### "Página em branco"
Espere 2-3 segundos para carregar
Pressione `Ctrl+F5` (recarregar forçadamente)

---

## 📖 URLs Disponíveis

Depois que o servidor iniciar, acesse:

| Página | URL |
|--------|-----|
| 🏠 Início | http://localhost:8000/ |
| 📊 Dashboard | http://localhost:8000/dashboard.html |
| 📈 Análise Avançada | http://localhost:8000/analise_avancada.html |
| 📋 Relatórios | http://localhost:8000/relatorios.html |
| ⚙️ Gerenciamento | http://localhost:8000/gerenciamento.html |

---

## ✨ Pronto!

Agora seu sistema está **100% funcional** com:
- ✅ Dados do Excel carregando
- ✅ Filtros dinâmicos funcionando
- ✅ Gráficos interativos
- ✅ Mapa da fazenda
- ✅ Relatórios exportáveis

---

**Qualquer dúvida, avise!** 🚀
