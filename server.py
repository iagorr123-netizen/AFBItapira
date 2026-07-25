#!/usr/bin/env python3
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/dashboard.html'
        return SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    server_address = ('', port)
    httpd = HTTPServer(server_address, MyHTTPRequestHandler)
    print(f'Servidor rodando em http://localhost:{port}')
    httpd.serve_forever()
