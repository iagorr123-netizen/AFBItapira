@echo off
REM Script para iniciar servidor HTTP local
REM Permite que o navegador leia os arquivos corretamente

echo.
echo ========================================
echo AFB Itapira - Sistema de Consolidacao
echo ========================================
echo.
echo Iniciando servidor local...
echo.

REM Detectar se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Python nao encontrado!
    echo.
    echo Instale Python de: https://www.python.org/downloads/
    echo Marque a opcao "Add Python to PATH" durante instalacao
    pause
    exit /b 1
)

REM Iniciar servidor HTTP
echo.
echo ========================================
echo Servidor iniciado com sucesso!
echo ========================================
echo.
echo URL local: http://localhost:8000
echo.
echo Navegador abrira automaticamente...
echo.
echo Para parar: Pressione Ctrl+C
echo.

timeout /t 2 >nul

REM Abrir no navegador
start http://localhost:8000/index.html

REM Iniciar servidor
python -m http.server 8000
