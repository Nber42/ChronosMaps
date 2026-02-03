# 🚀 Guía de Despliegue - Chronos Maps

## Requisitos del Servidor

- **Python 3.7+** (para `server.py`)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **Puerto 8000** disponible (o configurar otro en `server.py`)

---

## 📦 Instalación

### Opción 1: Servidor Local (Desarrollo/Demo)

```bash
# 1. Descargar el proyecto
# Descomprime chronos-maps.zip en tu carpeta deseada

# 2. Navegar a la carpeta
cd chronos-maps

# 3. Iniciar el servidor
python server.py
# O en Windows:
start_app.bat

# 4. Abrir en navegador
http://localhost:8000
```

### Opción 2: Servidor Web (Producción)

#### Requisitos Adicionales
- Servidor con Python (VPS, Heroku, Railway, etc.)
- Dominio (opcional pero recomendado)
- Certificado SSL (Let's Encrypt gratuito)

#### Pasos

1. **Subir archivos al servidor**
   ```bash
   scp -r chronos-maps/ usuario@tuservidor.com:/var/www/chronos/
   ```

2. **Configurar servicio systemd** (Linux)
   ```ini
   # /etc/systemd/system/chronos.service
   [Unit]
   Description=Chronos Maps Server
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/chronos
   ExecStart=/usr/bin/python3 server.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Activar servicio**
   ```bash
   sudo systemctl enable chronos
   sudo systemctl start chronos
   ```

4. **Configurar Nginx como proxy reverso**
   ```nginx
   server {
       listen 80;
       server_name tudominio.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **Obtener SSL con Certbot**
   ```bash
   sudo certbot --nginx -d tudominio.com
   ```

---

## 🔐 Configuración de Seguridad

### API Key de OpenAI
1. Edita `API_OPENAI.txt` con tu clave
2. **IMPORTANTE:** Añade este archivo a `.gitignore` si usas Git
3. Configura permisos restrictivos:
   ```bash
   chmod 600 API_OPENAI.txt
   ```

### Google Maps API Key
1. Abre `index.html`
2. Busca la línea con `AIzaSyB...`
3. Reemplaza con tu propia clave
4. Restringe la clave en Google Cloud Console:
   - Por dominio (para web)
   - Por IP (para servidor)

---

## 📊 Mantenimiento

### Backup de Base de Datos
```bash
# Copia de seguridad diaria
cp chronos_data.db backups/chronos_$(date +%Y%m%d).db
```

### Logs
```bash
# Ver logs en tiempo real
journalctl -u chronos -f
```

### Actualización
```bash
# Detener servicio
sudo systemctl stop chronos

# Actualizar archivos
# (subir nuevos archivos)

# Reiniciar
sudo systemctl start chronos
```

---

## ⚠️ Solución de Problemas

### El servidor no inicia
- Verifica que el puerto 8000 esté libre: `lsof -i :8000`
- Revisa permisos de archivos: `ls -la`

### Error de API Key
- Confirma que `API_OPENAI.txt` existe y tiene contenido
- Verifica formato: debe empezar con `sk-`

### Base de datos corrupta
- Elimina `chronos_data.db` (perderás datos)
- El servidor creará una nueva al reiniciar

---

## 📈 Escalabilidad

Para más de 100 usuarios concurrentes, considera:
- Migrar a PostgreSQL
- Usar Redis para caché
- Implementar load balancer (Nginx)
- CDN para assets estáticos
