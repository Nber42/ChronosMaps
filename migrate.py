import json
import sqlite3
import os

PLAYER_DATA_FILE = "player_data.json"
CACHE_DATA_FILE = "cache_data.json"
DB_FILE = "chronos_data.db"

def migrate():
    print("⏳ Iniciando migración a SQLite...")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    conn.commit()

    # Migrate Player Data
    if os.path.exists(PLAYER_DATA_FILE):
        print(f"📄 Migrando {PLAYER_DATA_FILE}...")
        with open(PLAYER_DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # We assume a single "default" user for now as per current app logic
            cursor.execute("INSERT OR REPLACE INTO players (id, data) VALUES (?, ?)", 
                         ("default", json.dumps(data, ensure_ascii=False)))
    
    # Migrate Cache Data
    if os.path.exists(CACHE_DATA_FILE):
        print(f"📄 Migrando {CACHE_DATA_FILE}...")
        with open(CACHE_DATA_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)
            for key, value in cache.items():
                cursor.execute("INSERT OR REPLACE INTO cache (key, data) VALUES (?, ?)", 
                             (key, json.dumps(value, ensure_ascii=False)))
    
    conn.commit()
    conn.close()
    print("✅ Migración completada exitosamente.")
    print(f"🗃️ Base de datos creada: {DB_FILE}")

if __name__ == "__main__":
    migrate()
