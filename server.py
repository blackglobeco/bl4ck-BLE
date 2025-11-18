#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 5000
Handler = http.server.SimpleHTTPRequestHandler

class MyHTTPRequestHandler(Handler):
    def end_headers(self):
        # Disable caching for development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Custom logging
        print(f"{self.address_string()} - {format % args}")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://0.0.0.0:{PORT}/")
    print("Serving BLE Scanner application...")
    httpd.serve_forever()
