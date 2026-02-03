/**
 * OPENAI INTEGRATION SERVICE V2 (Robust & Corrected)
 * Generates historical curiosities for specific locations
 */

// Configuración de API Key de OpenAI
// SECURITY UPDATE: Key removed. Using Server-Side Proxy Injection.
const DEFAULT_API_KEY = '';
let OPENAI_API_KEY = '';

// Use local proxy to avoid CORS/Browser issues
const OPENAI_API_URL = '/api/openai-proxy';
// Extracted to secure config or handled via server
const GOOGLE_MAPS_API_KEY = '';

const OpenAIService = {

    // --- 1. CONFIGURATION & SETUP ---

    /**
     * Loads the API Key from localStorage
     */
    loadOpenAIKey: function () {
        // Try to get from storage
        let key = localStorage.getItem('openai_api_key');

        OPENAI_API_KEY = key || '';
        return key;
    },

    /**
     * Shows the generic modal with OpenAI setup
     */
    showOpenAISetup: function () {
        const currentKey = localStorage.getItem('openai_api_key') || '';

        const setupHTML = `
            <div class="api-setup-modal">
                <h3>🤖 Configuración de OpenAI</h3>
                <p><strong>Estado:</strong> ${currentKey ? '✅ Usando tu clave personal' : '🔷 Usando clave del sistema'}</p>
                
                <div class="api-setup-info-box">
                    <p class="u-margin-0">No necesitas una clave para usar la app, ya que usará la <strong>Licencia del Sistema</strong> por defecto.</p>
                </div>

                <label class="u-font-bold u-margin-top-10">Tu API Key (Opcional):</label>
                <input type="password" 
                       id="openai-key-input" 
                       placeholder="sk-proj-..." 
                       value="${currentKey}"
                       class="api-setup-input">
                
                <div class="api-setup-actions">
                    <button onclick="OpenAIService.saveAndTestOpenAIKey()" class="btn-primary btn-personal-save">
                      💾 Guardar Personal
                    </button>
                    <button onclick="OpenAIService.clearKey()" class="btn-personal-clear">
                      🗑️ Borrar
                    </button>
                </div>
                
                <div class="setup-instructions" class="setup-instructions-box">
                  <h4 class="u-margin-0">📝 Nota:</h4>
                  <p>Si usas tu propia clave, tendrás límites más altos y mayor velocidad. Si usas la del sistema, podrías experimentar esperas.</p>
                </div>
                
                <button onclick="document.getElementById('generic-modal').classList.add('hidden')" class="btn-modal-close-generic">
                  Cerrar
                </button>
            </div>
        `;

        // Reuse the generic modal logic from previous implementation
        let modal = document.getElementById('generic-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'generic-modal';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal-card modal-card-openai">
                     <button class="close-btn modal-close-x" onclick="document.getElementById('generic-modal').classList.add('hidden')">✕</button>
                    <div id="generic-modal-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('generic-modal-content').innerHTML = setupHTML;
        modal.classList.remove('hidden');
    },

    /**
     * Saves and tests the API Key
     */
    saveAndTestOpenAIKey: async function () {
        const input = document.getElementById('openai-key-input');
        const apiKey = input.value.trim();

        if (!apiKey) {
            alert('❌ Por favor, ingresa una API Key');
            return;
        }

        // Relaxed validation to allow sk-proj- and others
        if (!apiKey.startsWith('sk-')) {
            alert('❌ API Key inválida. Debe comenzar con "sk-"');
            return;
        }

        // UI Feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '⏳ Probando conexión...';
        button.disabled = true;

        // Test connection
        const isValid = await this.testOpenAIConnection(apiKey);

        if (isValid) {
            localStorage.setItem('openai_api_key', apiKey);
            OPENAI_API_KEY = apiKey;
            alert('✅ API Key guardada y verificada correctamente');
            document.getElementById('generic-modal').classList.add('hidden');
        } else {
            alert('❌ API Key inválida o sin créditos. Verifica tu cuenta en OpenAI.');
            button.textContent = originalText;
            button.disabled = false;
        }
    },

    clearKey: function () {
        localStorage.removeItem('openai_api_key');
        OPENAI_API_KEY = '';
        document.getElementById('openai-key-input').value = '';
        alert("🗑️ Clave eliminada. Se usará la del sistema.");
        this.showOpenAISetup(); // Re-render
    },

    /**
     * API Connection Test
     */
    testOpenAIConnection: async function (apiKey) {
        try {
            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // Cheap model for testing
                    messages: [
                        { role: 'user', content: 'Responde solo "OK" si me recibes.' }
                    ],
                    max_tokens: 5
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ OpenAI test exitoso:', data);
                return true;
            } else {
                const error = await response.json();
                console.error('❌ OpenAI test falló:', error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }
    },

    // --- 2. GENERATION LOGIC ---

    /**
     * Main function to generate curiosities
     */
    // --- 2. GENERATION LOGIC ---

    // --- ECHO-CACHE IMPLEMENTATION ---

    /**
     * Check remote cache (Server SQLite)
     */
    checkRemoteCache: async function (lat, lng) {
        try {
            const cacheKey = `curiosity:${lat.toFixed(4)},${lng.toFixed(4)}`;

            // For MVP, we load the full cache. In production, we'd request specific key.
            const response = await fetch(getApiBaseUrl() + '/api/cache/load');
            if (!response.ok) return null;

            const allCache = await response.json();
            const cachedItem = allCache[cacheKey];

            if (cachedItem) {
                // Parse it (server stores partial JSON strings sometimes or full objects, ensure consistency)
                const data = typeof cachedItem === 'string' ? JSON.parse(cachedItem) : cachedItem;

                // Add to local storage for faster next access
                localStorage.setItem(cacheKey, JSON.stringify(data));
                console.log('🌌 Echo-Cache: Dato recuperado de la base de conocimiento global.');
                return data;
            }
        } catch (e) {
            console.warn('⚠️ Error consultando Echo-Cache:', e);
        }
        return null;
    },

    /**
     * Save to remote cache
     */
    saveToRemoteCache: async function (lat, lng, data) {
        try {
            const cacheKey = `curiosity:${lat.toFixed(4)},${lng.toFixed(4)}`;
            const payload = {};
            payload[cacheKey] = data;

            await fetch(getApiBaseUrl() + '/api/cache/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('💾 Echo-Cache: Dato guardado en el servidor global.');
        } catch (e) {
            console.error('❌ Error guardando en Echo-Cache:', e);
        }
    },

    /**
     * Main function to generate curiosities
     */
    generateCuriositiesWithAI: async function (addressData) {
        console.log('🤖 Generando curiosidades para:', addressData.displayAddress);

        // 1. Verify API Key
        const currentKey = this.loadOpenAIKey();

        if (!currentKey) {
            console.log('ℹ️ Usando API Key del sistema...');
        }

        // 2. Check Cache
        // Using 4 decimal places for approx 11m precision
        const lat = typeof addressData.location.lat === 'function' ? addressData.location.lat() : addressData.location.lat;
        const lng = typeof addressData.location.lng === 'function' ? addressData.location.lng() : addressData.location.lng;

        const cacheKey = `curiosity:${lat.toFixed(4)},${lng.toFixed(4)}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            console.log('📦 Usando curiosidades en caché (Local)');
            try {
                const parsedCache = JSON.parse(cached);
                // Check expiration
                if (parsedCache.expires_at && Date.now() < parsedCache.expires_at) {
                    return parsedCache;
                } else {
                    console.log('🗑️ Caché expirado, regenerando...');
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error('Error parseando caché:', e);
                localStorage.removeItem(cacheKey);
            }
        }

        // 2.5 Check Remote Echo-Cache (NEW)
        console.log('📡 Consultando Echo-Cache Global...');
        const remoteData = await this.checkRemoteCache(lat, lng);
        if (remoteData) {
            return remoteData;
        }

        // 3. Check Quota
        if (!this.quotaControl.check()) {
            console.warn('⚠️ Límite diario alcanzado');
            return {
                curiosities: [
                    'Has alcanzado el límite de consultas diarias a OpenAI.',
                    'Las ubicaciones previamente consultadas seguirán disponibles en caché.',
                    'El contador se reinicia mañana.'
                ],
                source: 'quota-exceeded',
                location_name: addressData.displayAddress,
                main_highlight: '⏰ Límite diario alcanzado - Vuelve mañana'
            };
        }

        // 4. Build Prompt
        const prompt = this.buildCuriosityPromptOptimized(addressData);

        // 5. Call OpenAI
        try {
            console.log('🌐 Llamando a OpenAI API...');

            // Timeout race to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de conexión')), 10000)
            );

            const fetchPromise = fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `Eres un historiador experto. Genera 5 curiosidades históricas breves y fascinantes sobre ${addressData.displayAddress}. Responde en JSON.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 800
                })
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);

            // Detailed Error Handling
            if (!response.ok) {
                console.warn(`OpenAI Error ${response.status}: Falling back to offline mode.`);
                throw new Error(`API Error ${response.status}`);
            }

            // 6. Parse Response
            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Respuesta de OpenAI inválida');
            }

            const content = data.choices[0].message.content;
            let result;

            try {
                // Try extracting JSON from code blocks if present
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : content;
                result = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('Error parseando JSON de OpenAI:', parseError);
                // Fallback result from raw text
                result = {
                    location_name: addressData.displayAddress,
                    curiosities: [content.substring(0, 200) + "..."],
                    main_highlight: "Info Generada",
                    rarity: "common",
                    category: "history"
                };
            }

            // 7. Validate Structure
            if (!result.curiosities || !Array.isArray(result.curiosities)) {
                if (result.curiosity) {
                    result.curiosities = [result.curiosity];
                } else {
                    result.curiosities = ["Información obtenida pero con formato inusual."];
                }
            }

            // 8. Increment Quota
            this.quotaControl.increment();

            // 9. Cache Result
            const cacheData = {
                ...result,
                cached_at: Date.now(),
                expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000)
            };

            try {
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                // Sync to Remote
                this.saveToRemoteCache(lat, lng, cacheData);
            } catch (storageError) { }

            return result;

        } catch (error) {
            console.error('❌ Error conexión OpenAI:', error);
            console.log('🔄 Activando Modo Offline/Simulación...');

            // FALLBACK TO OFFLINE GENERATION
            // This ensures the user ALWAYS sees content, never an error
            return this.generateOfflineCuriosities(addressData);
        }
    },

    /**
     * Offline Curiosity Generator (Fallback)
     * Generates plausible content based on location templates
     */
    generateOfflineCuriosities: function (addressData) {
        const city = addressData.city || "esta ciudad";
        const neighborhood = addressData.neighborhood || "este barrio";
        const street = addressData.streetName || "esta zona";

        return {
            location_name: addressData.displayAddress,
            main_highlight: `Historia oculta de ${city}`,
            rarity: 'interesting',
            category: 'history',
            source: 'offline',
            related_figures: ['Habitantes locales', 'Arquitectos históricos'],
            curiosities: [
                `Esta ubicación en ${neighborhood} ha sido testigo de la evolución urbana de ${city} durante el último siglo.`,
                `La arquitectura de la zona refleja los estilos predominantes de su época de construcción, destacando detalles únicos en las fachadas.`,
                `Históricamente, ${street} fue una arteria importante para la vida comercial y social de los residentes locales.`,
                `Archivos municipales sugieren que en los terrenos de ${city} existieron asentamientos previos que influyeron en el trazado actual de las calles.`,
                `Los vecinos más antiguos de ${neighborhood} conservan leyendas orales sobre eventos curiosos ocurridos en estas mismas coordenadas.`
            ]
        };
    },

    /**
     * Optimized Prompt Builder
     */
    buildCuriosityPromptOptimized: function (addressData) {
        const location = addressData.displayAddress;

        // Handle optional fields gracefully
        const streetNumber = addressData.streetNumber || '';
        const city = addressData.city || '';
        const country = addressData.country || '';

        let coords = "";
        if (addressData.location) {
            const lat = typeof addressData.location.lat === 'function' ? addressData.location.lat() : addressData.location.lat;
            const lng = typeof addressData.location.lng === 'function' ? addressData.location.lng() : addressData.location.lng;
            coords = `${lat}, ${lng}`;
        }

        return `
        Genera curiosidades históricas sobre esta ubicación exacta:

        📍 UBICACIÓN: ${location}
        ${streetNumber ? `🏠 NÚMERO: ${streetNumber}` : ''}
        🏙️ CIUDAD: ${city}
        🌍 PAÍS: ${country}
        🗺️ COORDENADAS: ${coords}

        INSTRUCCIONES:
        1. Genera 5 curiosidades históricas fascinantes
        2. Sé ESPECÍFICO sobre esta ubicación (si conoces el edificio/calle exacta)
        3. Si no hay datos del número exacto, habla de la calle o zona
        4. Cada curiosidad: 2-3 frases máximo
        5. Incluye fechas cuando sea posible
        6. Datos sorprendentes y verificables
        7. En español

        CATEGORÍAS A CONSIDERAR:
        - Historia del edificio/calle específica
        - Eventos históricos que ocurrieron aquí
        - Personajes famosos que vivieron/visitaron
        - Cambios arquitectónicos o urbanos
        - Anécdotas o leyendas locales

        RESPONDE EN JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA:
        {
        "location_name": "Nombre específico del lugar",
        "curiosities": [
            "Curiosidad 1...",
            "Curiosidad 2...",
            "Curiosidad 3...",
            "Curiosidad 4...",
            "Curiosidad 5..."
        ],
        "main_highlight": "La curiosidad MÁS impactante en una frase",
        "rarity": "common|interesting|rare|legendary",
        "category": "monument|battle|mystery|culture|gastronomy|cinema|history",
        "time_period": "Época o siglo principal",
        "related_figures": ["Persona 1", "Persona 2"]
        }

        Si no tienes información histórica específica de esta dirección exacta,
        genera curiosidades del barrio o zona, pero sé honesto y indícalo.
        `.trim();
    },

    // --- 3. UI DISPLAY ---

    // Helper to store current state
    currentPlaceData: null,
    currentAiData: null,

    /**
     * Renders the place panel (Enhanced for POIs)
     */
    showPlacePanel: function (placeData, aiData) {
        // STORE STATE (Fix for broken buttons)
        this.currentPlaceData = placeData;
        this.currentAiData = aiData;

        const panel = document.getElementById('side-panel'); // Using existing ID
        const panelContent = document.getElementById('panel-content');
        if (!panelContent) return;

        if (panel) panel.classList.add('open');

        // Determinar si es un Lugar Específico o una Dirección Genérica
        const isSpecificPlace = placeData.type === 'place';

        // Determinar rareza
        const rarity = aiData.rarity || 'common';
        const rarityStars = this.getRarityStars(rarity);
        const rarityColor = this.getRarityColor(rarity);
        const xp = this.getXPForRarity(rarity);

        // Foto principal
        let mainPhoto = 'https://via.placeholder.com/800x400?text=' + encodeURIComponent(placeData.name || placeData.displayAddress);
        if (isSpecificPlace && placeData.photos && placeData.photos.length > 0) {
            mainPhoto = placeData.photos[0];
        }

        // Map lat/lng (Unified)
        const location = placeData.location;
        const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
        const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

        // Generar URL para imagen histórica (Simulación de Archivo)
        const seedRef = Math.floor(Math.random() * 100000);
        const historicalImg = `https://image.pollinations.ai/prompt/historical%20painting%20or%20old%20photo%20of%20${encodeURIComponent(placeData.name || placeData.displayAddress)}?nologo=true&seed=${seedRef}`;

        // Renderizado HTML Rich
        // Renderizado HTML con sanitización y clases CSS (Paso 5 + Mejora CSP)
        panelContent.innerHTML = window.safeHTML(`
            <div class="panel-inner-content">
                <!-- HEADER NAVIGATION -->
                <div class="panel-header-actions">
                    <button class="back-button" onclick="document.getElementById('side-panel').classList.remove('open')">← Cerrar</button>
                    <div class="rarity-badge ${rarity}">
                        ${rarityStars} ${rarity.toUpperCase()}
                    </div>
                </div>

                <!-- IMAGEN PRINCIPAL (Google Photos o Fallback) -->
                <div class="place-hero-image">
                    <img src="${mainPhoto}" alt="${placeData.name.replace(/"/g, '&quot;') || placeData.displayAddress.replace(/"/g, '&quot;')}">
                    ${(isSpecificPlace && placeData.photos && placeData.photos.length > 1) ? `
                        <div class="photo-count">
                            📷 ${placeData.photos.length} fotos
                        </div>
                    ` : ''}
                </div>

                <!-- TITLE & CATEGORY -->
                <div class="place-header">
                    <h1 class="place-name">${placeData.name || placeData.displayAddress}</h1>
                    ${isSpecificPlace ? `
                        <div class="place-category">
                            <span>${this.getCategoryIcon(placeData.category)}</span>
                            <span>${this.getCategoryName(placeData.category)}</span>
                            ${placeData.rating ? `
                                <span class="u-margin-left-10">⭐ ${placeData.rating} (${placeData.ratingsCount})</span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <!-- ADDRESS (Secondary) -->
                <div class="place-address">
                    <span class="icon">📍</span>
                    <span>${placeData.address || placeData.displayAddress}</span>
                </div>

                <!-- EDITORIAL SUMMARY (Google) -->
                ${placeData.editorialSummary ? `
                    <div class="editorial-summary">
                        <p>"${placeData.editorialSummary}"</p>
                        <small>Fuente: Google</small>
                    </div>
                ` : ''}

                <!-- MAIN HIGHLIGHT (AI) -->
                ${aiData.main_highlight ? `
                    <div class="main-highlight u-stars-gold">
                        <span class="highlight-icon">⭐</span>
                        <span class="u-text-gold">${aiData.main_highlight}</span>
                    </div>
                ` : ''}

                 <!-- IMÁGENES ANTES/AHORA (Archivo vs StreetView) -->
                 <div class="time-travel-visuals">
                    <h3>⏳ Viaje en el Tiempo</h3>
                    <div class="time-travel-grid">
                        <div class="pano-container">
                             <!-- OLD: <div id="pano-before" class="pano-before-effect pano-container-full"></div> -->
                             <img src="${historicalImg}" class="pano-container-full" style="object-fit: cover; filter: sepia(0.6) contrast(1.1);">
                            <span class="pano-before-label">ARCHIVO (ANTES)</span>
                        </div>
                        <div class="pano-container">
                            <div id="pano-now" class="pano-container-full"></div>
                            <span class="pano-now-label">AHORA (STREET VIEW)</span>
                        </div>
                    </div>
                </div>

                <!-- ADD TO CHRONODEX BUTTON -->
                 <div class="action-buttons-container">
                    <button class="btn-primary btn-discover-save" onclick="OpenAIService.handleDiscover()">
                        <span>🎯 Descubrir y Guardar</span>
                        <span class="xp-badge-inline">+${xp} XP</span>
                    </button>
                 </div>

                <!-- CURIOSITIES LIST -->
                <div class="ai-curiosities">
                    <h3>
                        <span class="icon u-margin-right-8">📚</span>
                        Historia y Curiosidades
                        <span class="ai-badge">IA</span>
                    </h3>
                    
                    <div class="curiosities-list">
                        ${aiData.curiosities.map((curiosity, index) => `
                            <div class="curiosity-item">
                                <div class="curiosity-number curiosity-number-dynamic" style="--rarity-color: ${rarityColor === '#7f8c8d' ? '#667eea' : rarityColor};">${index + 1}</div>
                                <div class="curiosity-text">
                                    <p>${curiosity}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- QUICK INFO (Specific) -->
                <div class="quick-info">
                     ${aiData.construction_year ? `
                      <div class="info-item">
                        <div><strong>📅 Construido</strong></div>
                        <div>${aiData.construction_year}</div>
                      </div>` : ''}
                     ${aiData.architect ? `
                      <div class="info-item">
                        <div><strong>👨‍🎨 Arquitecto</strong></div>
                        <div>${aiData.architect}</div>
                      </div>` : ''}
                      ${aiData.architectural_style ? `
                      <div class="info-item">
                        <div><strong>🏛️ Estilo</strong></div>
                        <div>${aiData.architectural_style}</div>
                      </div>` : ''}
                </div>
                
                <!-- FOOTER ACTIONS -->
                 <div class="action-buttons">
                    <button class="btn-nav-full" onclick="OpenAIService.handleStartNavigation()">
                        <span class="u-font-18">🚙</span> Cómo llegar
                    </button>
                    
                    <button class="btn-secondary" onclick="OpenAIService.handleShare()">
                        📤 Compartir
                    </button>
                    <button class="btn-secondary btn-poster" onclick="OpenAIService.handleGeneratePoster()">
                        🎨 Generar Poster Retro
                    </button>
                    <button id="voice-btn" class="btn-secondary btn-voice" onclick="OpenAIService.handleToggleVoice()">
                        🔊 Escuchar Historia
                    </button>
                    ${placeData.website ? `
                      <button class="btn-secondary" onclick="window.open('${placeData.website}', '_blank')">🌐 Web</button>
                    ` : ''}
                </div>
                
                <div class="ai-disclaimer">
                    <small>
                        ⚠️ Curiosidades generadas por IA. Fotos de Google.
                    </small>
                </div>
            </div>`);

        // Initialize StreetView if needed
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.maps) {
                const svOptions = {
                    position: { lat: parseFloat(lat), lng: parseFloat(lng) },
                    pov: { heading: 34, pitch: 10 },
                    zoom: 1, disableDefaultUI: false, showRoadLabels: false
                };
                // Only Initialize Pano Now
                new google.maps.StreetViewPanorama(document.getElementById("pano-now"), svOptions);
                // Removed pano-before initialization
            }
        }, 500);
    },

    // --- BUTTON HANDLERS (NO ARGUMENTS, USES STATE) ---

    handleDiscover: function () {
        if (!this.currentPlaceData || !this.currentAiData) return;

        console.log("🎯 Adding to Chronodex:", this.currentPlaceData.name);

        if (window.addToChronodex) {
            window.addToChronodex({
                name: this.currentPlaceData.name || this.currentPlaceData.displayAddress,
                vicinity: this.currentPlaceData.address || this.currentPlaceData.displayAddress,
                geometry: { location: this.currentPlaceData.location },
                rating: 5,
                types: ['historical_landmark', 'ai_discovery'],
                photos: [] // Placeholder
            });
            alert("✅ Guardado en Chronodex!");
        } else {
            alert("⚠️ El sistema Chronodex no está disponible.");
        }
    },

    handleShare: function () {
        if (!this.currentPlaceData) return;
        const name = this.currentPlaceData.name || this.currentPlaceData.displayAddress;

        if (navigator.share) {
            navigator.share({
                title: 'Descubrimiento en Chronos Maps',
                text: `He descubierto curiosidades sobre: ${name}`,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(`He descubierto: ${name} en Chronos Maps`);
            alert('📋 Nombre copiado al portapapeles');
        }
    },

    handleGeneratePoster: function () {
        if (!this.currentPlaceData) return;

        // Prepare data
        const data = {
            name: this.currentPlaceData.name || "Ubicación Desconocida",
            image: (this.currentPlaceData.photos && this.currentPlaceData.photos.length > 0) ?
                this.currentPlaceData.photos[0] : null,
            date: new Date()
        };

        if (window.PosterGenerator) {
            window.PosterGenerator.generate(data);
        } else {
            alert("El generador de posters no está cargado.");
        }
    },

    handleToggleVoice: function () {
        if (!this.currentAiData || !window.VoiceGuide) return;

        const intro = `Historia de ${this.currentPlaceData.name || 'este lugar'}.`;
        const highlight = this.currentAiData.main_highlight || '';
        const curiosities = (this.currentAiData.curiosities || []).join('. ');

        const fullText = `${intro} ${highlight}. Curiosidades: ${curiosities}`;

        window.VoiceGuide.toggle(fullText);
    },

    handleStartNavigation: function () {
        console.log("🚙 Navigating...");
        if (!this.currentPlaceData) return;

        const loc = this.currentPlaceData.location;
        const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
        const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

        this.startNavigation(lat, lng);
    },

    // --- 4. DATA FETCHING (Google Places) ---

    findImportantPlaceNearby: async function (location, mapInstance) {
        console.log("🔍 Buscando lugares importantes en:", location);

        // TIMEOUT SAFETY: Ensure we don't hang if API fails silently
        const timeoutPromise = new Promise(resolve =>
            setTimeout(() => {
                console.warn("⚠️ findImportantPlaceNearby timed out (3s)");
                resolve(null);
            }, 3000)
        );

        const searchPromise = new Promise((resolve, reject) => {
            if (!mapInstance) {
                console.error("No map instance provided to findImportantPlaceNearby");
                resolve(null);
                return;
            }

            try {
                const service = new google.maps.places.PlacesService(mapInstance);
                const request = {
                    location: location,
                    radius: 50,
                    rankBy: google.maps.places.RankBy.DISTANCE
                };

                service.nearbySearch(request, (results, status) => {
                    console.log("nearbySearch status:", status);

                    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                        const importantTypes = [
                            'tourist_attraction', 'museum', 'church', 'synagogue', 'mosque', 'monument', 'castle',
                            'art_gallery', 'city_hall', 'university', 'stadium', 'park', 'zoo', 'aquarium',
                            'amusement_park', 'library', 'embassy', 'landmark'
                        ];

                        const importantPlace = results.find(place =>
                            place.types.some(type => importantTypes.includes(type))
                        );

                        if (importantPlace) {
                            console.log("✨ Lugar candidato:", importantPlace.name);
                            this.getPlaceDetails(importantPlace.place_id, mapInstance)
                                .then(resolve)
                                .catch(err => {
                                    console.error("Error fetching details:", err);
                                    resolve(null); // Fallback on error
                                });
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            } catch (e) {
                console.error("Error initializing PlacesService:", e);
                resolve(null);
            }
        });

        return Promise.race([searchPromise, timeoutPromise]);
    },

    getPlaceDetails: async function (placeId, mapInstance) {
        return new Promise((resolve, reject) => {
            const service = new google.maps.places.PlacesService(mapInstance);
            const request = {
                placeId: placeId,
                fields: ['name', 'formatted_address', 'geometry', 'types', 'rating', 'user_ratings_total', 'photos', 'opening_hours', 'website', 'formatted_phone_number', 'reviews', 'editorial_summary']
            };

            service.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    const placeData = {
                        id: place.place_id,
                        name: place.name,
                        type: 'place',
                        address: place.formatted_address,
                        location: {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        },
                        types: place.types,
                        category: this.detectPlaceCategory(place.types),
                        rating: place.rating || null,
                        ratingsCount: place.user_ratings_total || 0,
                        photos: place.photos ? place.photos.slice(0, 5).map(photo => photo.getUrl({ maxWidth: 800 })) : [],
                        openingHours: place.opening_hours ? { isOpen: place.opening_hours.isOpen(), weekdayText: place.opening_hours.weekday_text } : null,
                        website: place.website || null,
                        phone: place.formatted_phone_number || null,
                        reviews: place.reviews ? place.reviews.slice(0, 3) : [],
                        editorialSummary: place.editorial_summary?.overview || null
                    };
                    resolve(placeData);
                } else {
                    reject(new Error(`Error obtaining details: ${status}`));
                }
            });
        });
    },

    detectPlaceCategory: function (types) {
        const categoryMap = {
            'tourist_attraction': 'monument', 'museum': 'culture', 'art_gallery': 'culture',
            'church': 'religion', 'synagogue': 'religion', 'mosque': 'religion',
            'castle': 'monument', 'monument': 'monument', 'city_hall': 'government',
            'university': 'education', 'library': 'education', 'stadium': 'sports',
            'park': 'nature', 'zoo': 'nature', 'aquarium': 'nature', 'amusement_park': 'entertainment',
            'shopping_mall': 'commerce', 'restaurant': 'gastronomy', 'embassy': 'government'
        };
        for (const type of types) {
            if (categoryMap[type]) return categoryMap[type];
        }
        return 'general';
    },

    // --- 5. AI GENERATION (Specific) ---

    generatePlaceCuriositiesWithAI: async function (placeData) {
        console.log('🤖 Generando curiosidades para POI:', placeData.name);

        const currentKey = this.loadOpenAIKey();
        if (!currentKey) return this.generateCuriositiesWithAI(placeData); // Fallback

        // Check Cache
        const cacheKey = `place_iso:${placeData.id}`; // iso = isolated/specific
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log('📦 Returning Cached POI Data');
            return JSON.parse(cached);
        }

        const prompt = this.buildPlacePrompt(placeData);

        try {
            // Reusing the robust fetch logic with timeout & proxy
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000));
            const fetchPromise = fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7, max_tokens: 1000
                })
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const content = data.choices[0].message.content;
            let result = JSON.parse(content.match(/\{[\s\S]*\}/)[0]);

            // Cache
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;

        } catch (e) {
            console.error("Error generating POI data", e);
            // Fallback to offline/generic
            return this.generateOfflineCuriosities(placeData);
        }
    },

    buildPlacePrompt: function (placeData) {
        return `
Genera 5 curiosidades históricas ESPECÍFICAS sobre este lugar importante:

🏛️ LUGAR: ${placeData.name}
📍 UBICACIÓN: ${placeData.address}
🏷️ TIPO: ${placeData.types.join(', ')}
📂 CATEGORÍA: ${placeData.category}
${placeData.editorialSummary ? `ℹ️ RESUMEN: ${placeData.editorialSummary}` : ''}

IMPORTANTE:
- Curiosidades SOLO sobre ESTE LUGAR específico
- NO sobre la calle o zona
- Historia, construcción, eventos, personajes
- Datos arquitectónicos únicos
- Anécdotas interesantes

RESPONDE EN JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA:
{
  "location_name": "${placeData.name}",
  "curiosities": [
    "Curiosidad 1 sobre construcción...",
    "Curiosidad 2 sobre evento histórico...",
    "Curiosidad 3 sobre personaje...",
    "Curiosidad 4 arquitectónica...",
    "Curiosidad 5 sobre uso/función..."
  ],
  "main_highlight": "El dato MÁS impactante del lugar en UNA frase",
  "construction_year": "Año de construcción/fundación (si aplica)",
  "architect": "Arquitecto o creador (si conocido)",
  "historical_importance": "Por qué es históricamente importante",
  "rarity": "interesting", 
  "category": "${placeData.category}",
  "related_figures": ["Figura 1", "Figura 2"],
  "architectural_style": "Estilo arquitectónico (si aplica)",
  "visitor_recommendation": "Breve recomendación para visitantes"
}
        `.trim();
    },

    // --- 6. HELPERS ---

    startNavigation: function (lat, lng) {
        console.log("🚙 Iniciando navegación a:", lat, lng);

        if (typeof window.calculateRoute !== 'function') {
            alert("El servicio de rutas no está disponible.");
            return;
        }

        // CRITICAL: Set global destination so mode buttons (Walk/Car) work
        window.currentDestination = { lat: parseFloat(lat), lng: parseFloat(lng) };

        // Start with Walking mode by default
        window.calculateRoute(window.currentDestination, 'WALKING');
    },

    getRarityColor: function (rarity) {
        switch (rarity) {
            case 'legendary': return '#f39c12';
            case 'rare': return '#9b59b6';
            case 'interesting': return '#3498db';
            default: return '#7f8c8d';
        }
    },
    getRarityStars: function (rarity) {
        switch (rarity) {
            case 'legendary': return '⭐⭐⭐';
            case 'rare': return '⭐⭐';
            case 'interesting': return '⭐';
            default: return '';
        }
    },
    getXPForRarity: function (rarity) {
        const xpMap = { common: 100, interesting: 250, rare: 500, legendary: 1000 };
        return xpMap[rarity] || 100;
    },
    getCategoryIcon: function (category) {
        const iconMap = { monument: '🏛️', culture: '🎨', religion: '⛪', government: '🏛️', education: '📚', sports: '⚽', nature: '🌳', entertainment: '🎢', commerce: '🏬', gastronomy: '🍽️', general: '📍' };
        return iconMap[category] || '📍';
    },
    getCategoryName: function (category) {
        const nameMap = { monument: 'Monumento Histórico', culture: 'Arte y Cultura', religion: 'Lugar Religioso', government: 'Edificio Gubernamental', education: 'Educación', sports: 'Deportes', nature: 'Naturaleza', entertainment: 'Entretenimiento', commerce: 'Comercio', gastronomy: 'Gastronomía', general: 'Punto de Interés' };
        return nameMap[category] || 'Lugar de Interés';
    },

    // --- 7. QUOTA CONTROL ---

    quotaControl: {
        limit: 100,
        storageKey: 'openai_daily_quota',

        check: function () {
            const today = new Date().toDateString();
            const quotaData = this.getData();

            if (quotaData.date !== today) return true;
            return quotaData.count < this.limit;
        },

        increment: function () {
            const today = new Date().toDateString();
            const quotaData = this.getData();

            if (quotaData.date !== today) {
                quotaData.date = today;
                quotaData.count = 0;
            }

            quotaData.count++;
            localStorage.setItem(this.storageKey, JSON.stringify(quotaData));
            return quotaData.count;
        },

        getRemaining: function () {
            const today = new Date().toDateString();
            const quotaData = this.getData();

            if (quotaData.date !== today) return this.limit;
            return Math.max(0, this.limit - quotaData.count);
        },

        getData: function () {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) return JSON.parse(stored);
            } catch (e) { }
            return { date: new Date().toDateString(), count: 0 };
        }
    }
};

// Expose globally
window.OpenAIService = OpenAIService;
