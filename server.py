import http.server
import socketserver
import os
import json
import sqlite3
import urllib.request
import urllib.error
import hashlib
import uuid
from datetime import datetime

PORT = 8000
DIRECTORY = "."
DB_FILE = "chronos_data.db"
SERVER_API_KEY = None
MAPS_API_KEY = None

def load_maps_key():
    global MAPS_API_KEY
    try:
        if os.path.exists("API_GMAPS.txt"):
            with open("API_GMAPS.txt", "r") as f:
                MAPS_API_KEY = f.read().strip()
                print("✅ Maps API Key loaded successfully.")
        else:
            # Fallback for demo if file doesn't exist
            MAPS_API_KEY = "AIzaSyBt3-_T5sn-4xua9SdE7D7ENrXly3R4qAo" 
            print("⚠️ API_GMAPS.txt not found. Using embedded key.")
    except Exception as e:
        print(f"❌ Error loading Maps API Key: {e}")

def load_server_key():
    global SERVER_API_KEY
    try:
        if os.path.exists("API_OPENAI.txt"):
            with open("API_OPENAI.txt", "r") as f:
                key = f.read().strip()
                if key.startswith("sk-"):
                    SERVER_API_KEY = key
                    print("✅ Server API Key loaded successfully.")
                else:
                    print("⚠️ Invalid API Key format in API_OPENAI.txt")
        else:
            print("⚠️ API_OPENAI.txt not found.")
    except Exception as e:
        print(f"❌ Error loading API Key: {e}")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # User Accounts
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password_hash TEXT,
            created_at TEXT
        )
    ''')

    # Player Data (Linked to User ID)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    
    # Global Cache
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password, user_id):
    # Use user_id as salt to make each hash unique even with same password
    salt = user_id[:8] if user_id else "chronos_default_salt"
    return hashlib.sha256((password + salt).encode()).hexdigest()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == '/api/load':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            user_id = self.headers.get('X-User-ID')
            if not user_id or user_id == 'null':
                user_id = 'default'

            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT data FROM players WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                self.wfile.write(row[0].encode('utf-8'))
            else:
                self.wfile.write(json.dumps({}).encode())
            return

        if self.path == '/api/cache/load':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT key, data FROM cache")
            rows = cursor.fetchall()
            conn.close()
            
            cache = {row[0]: json.loads(row[1]) for row in rows}
            self.wfile.write(json.dumps(cache, ensure_ascii=False).encode('utf-8'))
            return
        
        if self.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            config = {
                "googleMapsKey": MAPS_API_KEY,
                "environment": "production"
            }
            self.wfile.write(json.dumps(config).encode('utf-8'))
            return
        
        return super().do_GET()

    def do_POST(self):
        # --- AUTH ENDPOINTS ---
        if self.path == '/api/auth/register':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                username = data.get('username')
                password = data.get('password')

                if not username or not password:
                    raise Exception("Missing username or password")

                user_id = str(uuid.uuid4())
                pwd_hash = hash_password(password, user_id)
                created_at = datetime.now().isoformat()

                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                try:
                    cursor.execute("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)", 
                                 (user_id, username, pwd_hash, created_at))
                    
                    # Initialize empty player data
                    initial_state = {
                        "username": username,
                        "avatar": "🤠",
                        "xp": 0,
                        "level": 1,
                        "chronedex": [],
                        "badges": [],
                        "stats": {"discoveries": 0, "storiesListening": 0, "legendaries": 0}
                    }
                    cursor.execute("INSERT INTO players (id, data) VALUES (?, ?)", (user_id, json.dumps(initial_state)))
                    
                    conn.commit()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success", "userId": user_id, "username": username}).encode())
                except sqlite3.IntegrityError:
                    self.send_response(409) # Conflict
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "El usuario ya existe"}).encode())
                finally:
                    conn.close()
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
            return

        if self.path == '/api/auth/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                username = data.get('username')
                password = data.get('password')

                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,))
                row = cursor.fetchone()
                conn.close()

                if row and row[1] == hash_password(password, row[0]):
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success", "userId": row[0], "username": username}).encode())
                else:
                    self.send_response(401)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Credenciales inválidas"}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
            return

        # --- DATA ENDPOINTS ---
        if self.path == '/api/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Security: Get User ID from Header
            user_id = self.headers.get('X-User-ID')
            if not user_id or user_id == 'null':
                user_id = 'default' # Fallback for legacy/unlogged

            try:
                # Validate JSON
                json.loads(post_data.decode('utf-8')) 
                
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("INSERT OR REPLACE INTO players (id, data) VALUES (?, ?)", 
                             (user_id, post_data.decode('utf-8')))
                conn.commit()
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return

        if self.path == '/api/cache/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                new_entries = json.loads(post_data.decode('utf-8'))
                
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("BEGIN TRANSACTION")
                for key, value in new_entries.items():
                    cursor.execute("INSERT OR REPLACE INTO cache (key, data) VALUES (?, ?)", 
                                 (key, json.dumps(value, ensure_ascii=False)))
                conn.commit()
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return
        
        if self.path == '/api/openai-proxy':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Forward to OpenAI
            try:
                # 1. Determine which Key to use
                client_auth = self.headers.get('Authorization')
                final_auth = client_auth
                
                # If client didn't send a key (or sent empty Bearer), use Server Key
                if not client_auth or len(client_auth) < 20 or "null" in client_auth:
                    if SERVER_API_KEY:
                        print(f"🔑 Using Server API Key for request from {self.client_address}")
                        final_auth = f"Bearer {SERVER_API_KEY}"
                    else:
                        print("⚠️ No Server API Key available!")
                
                req = urllib.request.Request(
                    'https://api.openai.com/v1/chat/completions',
                    data=post_data,
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': final_auth
                    },
                    method='POST'
                )
                
                with urllib.request.urlopen(req) as response:
                    response_data = response.read()
                    self.send_response(response.getcode())
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(response_data)
                    
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def start_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    init_db()
    load_server_key()
    load_maps_key()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Chronos Maps Server running at: http://localhost:{PORT}")
        print(f"🗃️ Database enabled: {DB_FILE}")
        print("Presiona Ctrl+C para detener el servidor.")
        httpd.serve_forever()

if __name__ == "__main__":
    start_server()
