#!/usr/bin/env python3
"""Simple server that serves static files and handles saving tasks.json."""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
TASKS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tasks.json')


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                with open(TASKS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f'Serving on http://localhost:{PORT}')
    HTTPServer(('', PORT), Handler).serve_forever()
