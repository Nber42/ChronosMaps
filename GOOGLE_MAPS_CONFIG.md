# 🔧 Guía Rápida: Configurar Google Maps API

## Paso 1: Acceder a Google Cloud Console
Abre este enlace: https://console.cloud.google.com/apis/credentials

## Paso 2: Localizar tu API Key
Busca en la lista la clave que empieza con: `AIzaSyBt3-_T5sn-4xua9SdE7D7ENrXly3R4qAo`

## Paso 3: Editar Restricciones
1. Haz clic en el nombre de la API Key
2. En la sección **"Restricciones de aplicación"**:
   - Selecciona: **"Referentes HTTP (sitios web)"**
   - Haz clic en **"AGREGAR UN ELEMENTO"**
   - Añade estas 3 líneas (una por una):
     ```
     http://localhost:8000/*
     http://localhost/*
     http://127.0.0.1:8000/*
     ```

3. En la sección **"Restricciones de API"**:
   - Selecciona: **"Restringir clave"**
   - Marca estas APIs:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
     - ✅ Places API
     - ✅ Directions API

4. Haz clic en **"GUARDAR"** (botón azul abajo)

## Paso 4: Esperar y Probar
1. Espera **2-3 minutos** (los cambios tardan en propagarse)
2. Recarga la página en tu navegador (F5)
3. Haz clic en el mapa
4. ✅ Debería funcionar sin errores

---

## ⚠️ Notas Importantes

- Si no ves la API Key, verifica que estés en el proyecto correcto
- Si las APIs no están en la lista, debes habilitarlas primero en "Biblioteca de APIs"
- Los cambios pueden tardar hasta 5 minutos en algunos casos

---

## 🆘 Solución de Problemas

**Si sigue sin funcionar:**
1. Verifica que las 4 APIs estén habilitadas
2. Asegúrate de haber guardado los cambios
3. Prueba en modo incógnito del navegador
4. Espera 5 minutos más y vuelve a intentar
