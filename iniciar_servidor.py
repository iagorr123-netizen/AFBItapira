#!/usr/bin/env python3
"""
Servidor HTTP Local para AFB Itapira - Sistema de Consolidação de Dados
Permite carregar o Excel e visualizar a aplicação no navegador
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Prevenir cache para desenvolvimento
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    print("\n" + "="*50)
    print("AFB Itapira - Sistema de Consolidação")
    print("="*50 + "\n")

    print(f"📁 Pasta: {DIRECTORY}")
    print(f"🌐 URL:   http://localhost:{PORT}")
    print(f"🏠 Página: http://localhost:{PORT}/index.html\n")

    # Tentar abrir no navegador
    try:
        print("🚀 Abrindo navegador...")
        webbrowser.open(f'http://localhost:{PORT}/index.html')
    except Exception as e:
        print(f"⚠️  Não consegui abrir o navegador: {e}")
        print(f"   Abra manualmente: http://localhost:{PORT}/index.html\n")

    # Iniciar servidor
    print("\n" + "="*50)
    print("✅ Servidor iniciado!")
    print("="*50)
    print("\n📌 Para parar: Pressione Ctrl+C\n")

    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"⏳ Aguardando requisições na porta {PORT}...")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✋ Servidor parado pelo usuário")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
