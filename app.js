let map;
let marker;
let infoDisplay;
let initialState;
let searchTimeout;
let speechSynth = window.speechSynthesis;
let currentUtterance = null;
let userPosition = null;

// Google Maps UI State
let is3DView = false;
let trafficLayer, transitLayer, bicyclingLayer;

// Configuration
const DEFAULT_LOCATION = [41.406144, 2.162536];
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// ============================================
// GOOGLE MAPS UI CONTROLS
// ============================================

// Hamburger Menu Toggle
window.toggleDrawer = function () {
    const drawer = document.getElementById('drawer');
    drawer.classList.toggle('open');
};

window.closeDrawer = function () {
    const drawer = document.getElementById('drawer');
    drawer.classList.remove('open');
};

// Setup hamburger button
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => toggleDrawer());
    }

    const closeDrawerBtn = document.getElementById('close-drawer');
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => closeDrawer());
    }
});

// Zoom Controls
window.zoomIn = function () {
    if (map) {
        map.setZoom(map.getZoom() + 1);
    }
};

window.zoomOut = function () {
    if (map) {
        map.setZoom(map.getZoom() - 1);
    }
};

// My Location
window.goToMyLocation = function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            map.setZoom(16);
        });
    }
};

// 3D View Toggle
window.toggle3DView = function () {
    is3DView = !is3DView;
    const toggleBtn = document.getElementById('view-toggle');
    const label = toggleBtn.querySelector('.gmaps-3d-label');

    if (is3DView) {
        map.setTilt(45);
        label.textContent = '3D';
    } else {
        map.setTilt(0);
        label.textContent = '2D';
    }
};

// Layers Menu Toggle
window.toggleLayersMenu = function () {
    const menu = document.getElementById('layers-menu');
    menu.classList.toggle('hidden');
};

// Layer Toggles
window.toggleTrafficLayer = function (enabled) {
    if (!trafficLayer) {
        trafficLayer = new google.maps.TrafficLayer();
    }
    trafficLayer.setMap(enabled ? map : null);
};

window.toggleTransitLayer = function (enabled) {
    if (!transitLayer) {
        transitLayer = new google.maps.TransitLayer();
    }
    transitLayer.setMap(enabled ? map : null);
};

window.toggleBicyclingLayer = function (enabled) {
    if (!bicyclingLayer) {
        bicyclingLayer = new google.maps.BicyclingLayer();
    }
    bicyclingLayer.setMap(enabled ? map : null);
};

window.toggleChronosMarkers = function (enabled) {
    // TODO: Show/hide historical markers
    console.log('Chronos markers:', enabled);
};

window.toggleRareOnly = function (enabled) {
    // TODO: Filter to show only rare/legendary markers
    console.log('Rare only:', enabled);
};

// Close layers menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('layers-menu');
    const btn = document.getElementById('layers-btn');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// Map Type Toggle (Map/Satellite)
window.setMapType = function (type) {
    if (map) {
        map.setMapTypeId(type);

        // Update button states
        const mapBtn = document.getElementById('view-map-btn');
        const satBtn = document.getElementById('view-sat-btn');

        if (type === 'roadmap') {
            mapBtn.classList.add('active');
            satBtn.classList.remove('active');
        } else {
            satBtn.classList.add('active');
            mapBtn.classList.remove('active');
        }
    }
};

// Profile Avatar Click
document.addEventListener('DOMContentLoaded', () => {
    const avatarBtn = document.getElementById('avatar-btn');
    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => {
            if (typeof ProfileSystem !== 'undefined') {
                ProfileSystem.open();
            }
        });
    }
});



// --- PLAYER STATE ---
// --- PLAYER STATE ---
window.playerState = {
    username: null,
    avatar: '🤠',
    xp: 0,
    level: 1,
    chronedex: [],
    badges: [], // Array of badge IDs
    stats: {
        discoveries: 0,
        storiesListening: 0,
        legendaries: 0
    }
};
// Alias for local access if needed, or just replace usages. 
// For now, we will just use window.playerState or rely on the fact that top-level vars in app.js are NOT automatically window props in modules, but this is likely a standard script.
// To be safe, let's keep a local reference if existing code uses 'playerState' without 'window.'
let playerState = window.playerState;

// Rarity Definitions
const RARITY = {
    COMMON: { rate: 0.6, xp: 10, class: 'common', label: 'Lugar Común' },
    RARE: { rate: 0.3, xp: 50, class: 'rare', label: 'Lugar Interesante' },
    LEGENDARY: { rate: 0.1, xp: 200, class: 'legendary', label: 'LEGENDARIO' }
};

// Badges Configuration
const BADGES = {
    'first_step': { id: 'first_step', icon: 'fa-shoe-prints', name: 'Primer Paso', desc: 'Descubre tu primer lugar.', color: '#10b981' }, // Green
    'explorer': { id: 'explorer', icon: 'fa-compass', name: 'Explorador', desc: 'Descubre 5 lugares.', color: '#3b82f6' }, // Blue
    'historian': { id: 'historian', icon: 'fa-scroll', name: 'Historiador', desc: 'Escucha 3 historias completas.', color: '#8b5cf6' }, // Purple
    'treasure_hunter': { id: 'treasure_hunter', icon: 'fa-gem', name: 'Cazatesoros', desc: 'Encuentra 1 lugar Legendario.', color: '#f59e0b' }, // Gold
    'globetrotter': { id: 'globetrotter', icon: 'fa-earth-americas', name: 'Trotamundos', desc: 'Alcanza el nivel 5.', color: '#ec4899' } // Pink
};
window.BADGES = BADGES;

/**
 * Initialization
 */
// --- APP ENTRY POINT ---
window.initApp = function () {
    loadPlayerState();
    if (typeof ProfileSystem !== 'undefined') ProfileSystem.init();
    if (typeof TourSystem !== 'undefined') TourSystem.init();
    initMap();
    renderHUD();
};

function initMap() {
    infoDisplay = document.getElementById('info-display');
    initialState = document.getElementById('initial-state');
    const inputElement = document.getElementById('search-input');
    const searchWrapper = document.querySelector('.search-wrapper');
    const dropdown = document.createElement('div'); dropdown.className = 'search-dropdown'; dropdown.id = 'search-dropdown';
    if (searchWrapper) searchWrapper.appendChild(dropdown);

    // Google Maps Config via Global Namespace
    const mapOptions = {
        center: { lat: DEFAULT_LOCATION[0], lng: DEFAULT_LOCATION[1] },
        zoom: 18,
        mapTypeId: 'satellite', // Requested "Real Mode"
        disableDefaultUI: true, // Clean look
        zoomControl: false,     // Custom controls later if needed, or rely on gestures
        tilt: 45                // 3D effect
    };

    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    window.map = map; // Expose for Tours

    // Click Listener
    map.addListener('click', (e) => {
        handleMapClick(e.latLng.lat(), e.latLng.lng());
        closeDropdown();
    });

    // Search Logic (unchanged DOM logic, updated Search Call)
    if (inputElement) {
        inputElement.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query.length < 3) { closeDropdown(); return; }
            searchTimeout = setTimeout(() => fetchSuggestions(query), 300);
        });
        inputElement.addEventListener('keypress', (e) => { if (e.key === 'Enter') { closeDropdown(); performSearch(inputElement.value); } });
    }
    document.addEventListener('click', (e) => { if (searchWrapper && !searchWrapper.contains(e.target)) closeDropdown(); });

    // --- SEED CURATED CONTENT ---
    if (typeof CURATED_POIS !== 'undefined') {
        // Custom Gold Icon for Google Maps
        // Simple SVG path or URL
        const goldIcon = {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: "#f59e0b",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 2,
            anchor: new google.maps.Point(12, 24)
        };

        const infowindow = new google.maps.InfoWindow();

        CURATED_POIS.forEach(poi => {
            const marker = new google.maps.Marker({
                position: { lat: poi.coords[0], lng: poi.coords[1] },
                map: map,
                icon: goldIcon,
                title: poi.title,
                animation: google.maps.Animation.DROP
            });

            marker.addListener("click", () => {
                // Determine if we show popup or just open the story directly?
                // Per UX, opening story directly is smoother
                // infowindow.setContent(`<b style="color:#f59e0b">Legendary</b><br>${poi.title}`);
                // infowindow.open(map, marker);
                handleMapClick(poi.coords[0], poi.coords[1]);
            });
        });
    }
}

window.activateRadar = function () {
    const btn = document.getElementById('radar-btn');
    if (!navigator.geolocation) { alert("GPS requerido."); return; }
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };

            // Fly To
            map.panTo(userPosition);
            map.setZoom(18);

            // User Marker
            new google.maps.Marker({
                position: userPosition,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#2563eb",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2
                },
                title: "Tú"
            });

            setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-location-arrow"></i>'; handleMapClick(userPosition.lat, userPosition.lng); }, 1000);
        },
        () => { btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>'; alert("Error de GPS."); }
    );
};

// ... In initMap, remove L.control.zoom if we disabled default UI. 
// We can re-add custom zoom buttons if needed, but gestures work fine on mobile.

function placeMarker(lat, lng) {
    if (marker) marker.setMap(null); // Remove previous
    marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        animation: google.maps.Animation.DROP
    });
    // Ensure map sees it, but don't force center if user just clicked
    // map.panTo({lat, lng}); 
}

// Update other map-dependent functions
// search-result-item onclick
// performSearch
// addToChronedex (re-center logic)

// We need to update renderDropdown / performSearch to use Google object for setView/panTo
// Since `map` is global, we just need to ensure we use .panTo not .setView

// REPLACING HELPERS THAT USED LEAFLET METHODS:

// Update search logic to use map.panTo
// (Will fix in next block or just assume map global is updated)

function loadPlayerState() {
    const saved = localStorage.getItem('chronos_player_v3'); // New key for v3
    if (saved) {
        playerState = JSON.parse(saved);
        // Migrations
        if (!playerState.badges) playerState.badges = [];
        if (!playerState.stats) playerState.stats = { discoveries: 0, storiesListening: 0, legendaries: 0 };
    }
}

function savePlayerState() {
    localStorage.setItem('chronos_player_v3', JSON.stringify(playerState));
    renderHUD();
}

/**
 * Profile & UI Logic
 */
window.handleProfileClick = function () {
    if (!playerState.username) {
        // Show Creation Modal
        document.getElementById('profile-creation-modal').classList.remove('hidden');
    } else {
        // Show AAA Profile
        if (typeof ProfileSystem !== 'undefined') ProfileSystem.open();
    }
};

window.saveProfile = function () {
    const input = document.getElementById('username-input');
    const name = input.value.trim();
    if (!name) return alert("¡Necesitas un nombre para la bitácora!");

    playerState.username = name;
    // Avatar is set via selectAvatar
    savePlayerState();
    document.getElementById('profile-creation-modal').classList.add('hidden');

    // Auto-open card to show result
    setTimeout(() => handleProfileClick(), 300);
};

window.selectAvatar = function (av) {
    playerState.avatar = av;
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
};

// Trainer Card Function Removed

function checkAchievements() {
    const s = playerState.stats;
    const b = playerState.badges;

    const unlock = (id) => {
        if (!b.includes(id)) {
            b.push(id);
            showToast(`¡Insignia Desbloqueada: ${BADGES[id].name}!`, BADGES[id].icon.replace('fa-', ''), BADGES[id].color);
        }
    };

    if (s.discoveries >= 1) unlock('first_step');
    if (s.discoveries >= 5) unlock('explorer');
    if (s.storiesListening >= 3) unlock('historian');
    if (s.legendaries >= 1) unlock('treasure_hunter');
    if (playerState.level >= 5) unlock('globetrotter');

    savePlayerState();
}

/**
 * HUD & Navigation
 */
// ... (Similar to old HUD, simplified calls)
window.openChronedex = function () {
    const grid = document.getElementById('chronedex-grid');
    grid.innerHTML = '';
    if (playerState.chronedex.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#6b7280;">Aún no hay descubrimientos.</div>';
    } else {
        [...playerState.chronedex].reverse().forEach(item => {
            const el = document.createElement('div');
            el.className = 'dex-item';
            const imgUrl = item.image || `https://image.pollinations.ai/prompt/map location ${item.name}?nologo=true`;
            el.innerHTML = `<img src="${imgUrl}" class="dex-img" loading="lazy"><div class="dex-info"><div class="dex-name">${item.name}</div></div>`;
            el.onclick = () => {
                closeChronedex();
                map.panTo({ lat: item.lat, lng: item.lng });
                map.setZoom(16);
                handleMapClick(item.lat, item.lng);
            };
            grid.appendChild(el);
        });
    }
    document.getElementById('chronedex-modal').classList.remove('hidden');
};
window.closeChronedex = () => document.getElementById('chronedex-modal').classList.add('hidden');
// window.closeTrainerCard REMOVED

function renderHUD() {
    let hud = document.getElementById('game-hud');
    if (!hud) {
        hud = document.createElement('div'); hud.id = 'game-hud'; hud.className = 'game-hud';
        document.body.appendChild(hud);
    }
    const av = playerState.avatar || '🤠';

    // NOTE: Onclick now calls handleProfileClick
    hud.innerHTML = `
        <div class="profile-btn" onclick="handleProfileClick()" title="Perfil">
            ${av}
        </div>
        <div style="width:1px; height:20px; background:#e5e7eb;"></div>
        <div class="hud-item">
            <i class="fa-solid fa-trophy hud-icon" style="color:#f59e0b;"></i>
            <span class="hud-val">${playerState.level}</span>
        </div>
        <div class="hud-item" onclick="TourSystem.openModal()" style="cursor:pointer" title="Rutas">
             <div class="chronedex-btn" style="background:#8b5cf6"><i class="fa-solid fa-route"></i></div>
        </div>
        <div class="hud-item" onclick="openChronedex()" style="cursor:pointer" title="Chronedex">
            <div class="chronedex-btn"><i class="fa-solid fa-book-journal-whills"></i></div>
        </div>
        <div class="hud-item" onclick="toggleSound(this)" style="cursor:pointer" title="Sonido">
            <i class="fa-solid fa-volume-high" id="sound-icon" style="color:#10b981;"></i>
        </div>
    `;


    renderRadarBtn();
}
window.toggleSound = function (el) {
    if (typeof SoundFX !== 'undefined') {
        const enabled = SoundFX.toggle();
        const icon = el.querySelector('i');
        if (enabled) {
            icon.className = 'fa-solid fa-volume-high';
            icon.style.color = '#10b981';
        } else {
            icon.className = 'fa-solid fa-volume-xmark';
            icon.style.color = '#6b7280';
        }
    }
};
function renderRadarBtn() {
    if (document.getElementById('radar-btn')) return;
    const radar = document.createElement('div'); radar.id = 'radar-btn'; radar.className = 'radar-fab'; radar.onclick = activateRadar;
    radar.innerHTML = '<i class="fa-solid fa-crosshairs"></i>'; document.body.appendChild(radar);
}

/**
 * Core Logic (Map, Audio, etc)
 */


async function handleMapClick(lat, lng) {
    placeMarker(lat, lng);
    showLoading();
    stopAudio();

    // 1. CHECK CURATED CONTENT FIRST
    const curated = (typeof findCuratedStory !== 'undefined') ? findCuratedStory(lat, lng) : null;

    let data = {
        nombre: "Ubicación Desconocida",
        tipo: "Coordenada",
        lat, lng,
        rarity: determineRarity()
    };

    if (curated) {
        // use curated data
        data.nombre = curated.title;
        data.informacion_historica = curated.text; // Rich HTML text
        data.rarity = RARITY.LEGENDARY; // Curated is always Legendary
        data.verified = true; // Flag for UI

        // Still fetch image/address if needed
        const geoData = await reverseGeocode(lat, lng);
        if (geoData) data.direccion = geoData.display_name;
        data.imagen_real = await fetchWikiImage(curated.title.split(':')[0]); // Fuzzy search title

    } else {
        // Standard Fetch Logic
        try {
            const geoData = await reverseGeocode(lat, lng);
            if (geoData) {
                data.nombre = determineBestName(geoData);
                data.direccion = geoData.display_name;
            }

            let wikiText = await fetchWikipedia(data.nombre, lat, lng);
            if (!wikiText && geoData?.address) {
                const fallback = geoData.address.city || geoData.address.town;
                if (fallback) wikiText = await fetchWikipedia(fallback, lat, lng);
            }
            data.informacion_historica = wikiText;
            data.resumen = wikiText ? truncateText(wikiText, 180) : "Información no disponible.";
            data.imagen_real = await fetchWikiImage(data.nombre);
        } catch (error) { console.error(error); displayError("No info."); }
    }

    // SAVE & ACHIEVEMENTS
    if (!hasDiscovered(lat, lng)) {
        // AUDIO TRIGGER
        if (typeof SoundFX !== 'undefined') SoundFX.playDiscovery(data.rarity);

        awardXP(data.rarity);
        addToChronedex(data);
        triggerConfetti(data.rarity === RARITY.LEGENDARY);

        // Check stats
        playerState.stats.discoveries++;
        if (data.rarity === RARITY.LEGENDARY) playerState.stats.legendaries++;
        checkAchievements();
        savePlayerState();
    }

    renderUI(data);
}

// ... (Other helpers same as before)
function addToChronedex(data) {
    playerState.chronedex.push({ id: Date.now(), date: Date.now(), name: data.nombre, lat: data.lat, lng: data.lng, rarity: data.rarity, image: data.imagen_real });
    savePlayerState();
}
function determineRarity() {
    const rand = Math.random();
    if (rand < RARITY.LEGENDARY.rate) return RARITY.LEGENDARY;
    if (rand < RARITY.LEGENDARY.rate + RARITY.RARE.rate) return RARITY.RARE;
    return RARITY.COMMON;
}
function awardXP(rarity) {
    playerState.xp += rarity.xp;
    if (playerState.xp >= playerState.level * 100) {
        playerState.level++;
        playerState.xp = 0;
        showToast(`¡Nivel ${playerState.level}!`, 'crown', '#f59e0b');
        if (typeof SoundFX !== 'undefined') SoundFX.playLevelUp();
    }
}
function hasDiscovered(lat, lng) { return playerState.chronedex.some(h => Math.sqrt(Math.pow(h.lat - lat, 2) + Math.pow(h.lng - lng, 2)) < 0.005); }

// UI/Audio
window.toggleNarrator = function (text) {
    if (speechSynth.speaking) { stopAudio(); } else {
        if (!text) return;
        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.lang = 'es-ES';
        speechSynth.speak(currentUtterance);
        const btn = document.getElementById('narrator-btn');
        if (document.getElementById('narrator-status')) document.getElementById('narrator-status').innerText = "Reproduciendo...";
        if (btn) btn.style.borderColor = "#2563eb";
        currentUtterance.onend = () => {
            stopAudio();
            // Achievement
            playerState.stats.storiesListening++;
            checkAchievements();
        };
    }
};

window.toggleHistory = function (btn) {
    const container = btn.parentElement;
    const full = container.querySelector('.history-full');
    const teaser = container.querySelector('.history-teaser');

    if (full.classList.contains('hidden')) {
        full.classList.remove('hidden');
        teaser.classList.add('hidden');
        btn.innerHTML = 'Leer menos <i class="fa-solid fa-chevron-up"></i>';
    } else {
        full.classList.add('hidden');
        teaser.classList.remove('hidden');
        btn.innerHTML = 'Saber más <i class="fa-solid fa-chevron-down"></i>';
    }
};

function stopAudio() { if (speechSynth.speaking) speechSynth.cancel(); const btn = document.getElementById('narrator-btn'); if (btn) btn.style.borderColor = ""; if (document.getElementById('narrator-status')) document.getElementById('narrator-status').innerText = "Escuchar"; }

function renderUI(data) {
    initialState.style.display = 'none';
    currentPlaceData = data; // Set global for sharing

    const seed = Math.floor(Math.random() * 100000);
    const aiCurrentUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("photorealistic 8k image of " + data.nombre)}?nologo=true&seed=${seed}`;
    const displayCurrentUrl = data.imagen_real ? data.imagen_real : aiCurrentUrl;
    // Update data with the URL we actually used (for the card)
    currentPlaceData.imagen_real = displayCurrentUrl;

    const pastImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("historical painting of " + data.nombre + " ancient")}?nologo=true&seed=${seed + 1}`;

    const verifiedBadge = data.verified ? `<div class="verified-badge"><i class="fa-solid fa-certificate"></i> Historia Verificada</div>` : '';

    const historySection = data.informacion_historica ?
        `<div class="feature-card">
            <h3><i class="fa-solid fa-book-open"></i> Historia</h3>
            
            <div class="history-content-wrapper">
                <div class="history-teaser">
                    <p>${data.resumen}</p>
                </div>
                <div class="history-full hidden">
                    <div class="historical-text">${data.informacion_historica}</div>
                </div>
            </div>
            
            <button class="read-more-btn" onclick="toggleHistory(this)">
                Saber más <i class="fa-solid fa-chevron-down"></i>
            </button>

            <div class="audio-player" id="narrator-btn" onclick="toggleNarrator('${data.informacion_historica.replace(/'/g, "\\'").replace(/<\/?[^>]+(>|$)/g, "")}')">
                <div class="audio-label"><i class="fa-solid fa-headphones"></i> Escuchar</div>
                <div class="audio-status" id="narrator-status">Escuchar</div>
            </div>
        </div>`
        : `<div class="feature-card" style="color:#6b7280; text-align:center;">Sin datos históricos.</div>`;

    infoDisplay.innerHTML = `
        <div class="image-comparison-container">
            <div class="image-card"><img src="${displayCurrentUrl}" onerror="this.src='${aiCurrentUrl}'"><div class="image-label">Hoy</div></div>
            <div class="image-card"><img src="${pastImgUrl}"><div class="image-label">Ayer</div></div>
        </div>
        <div class="content-padding">
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                ${verifiedBadge}
                <div class="rarity-badge ${data.rarity.class}"><i class="fa-solid fa-star"></i> ${data.rarity.label}</div>
            </div>
            <h1 class="place-title">${data.nombre}</h1>
            <div class="place-location"><i class="fa-solid fa-location-dot"></i> <span>${data.direccion || "?"}</span></div>
            ${historySection}
            <div style="margin-top:24px;"><button class="action-btn" onclick="shareDiscovery()"><i class="fa-solid fa-share-nodes"></i> Compartir</button></div>
        </div>`;
}

// --- SOCIAL SHARING ---
let currentPlaceData = null; // Global reference for sharing

window.shareDiscovery = async function () {
    const btn = document.querySelector('.action-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

    try {
        const file = await generateSocialCard(currentPlaceData);

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Chronos Maps Discovery',
                text: `¡He descubierto ${currentPlaceData.nombre} en Chronos Maps! 🌍✨ #ChronosMaps`,
                files: [file]
            });
        } else {
            // Fallback: Download the image
            const link = document.createElement('a');
            link.download = `chronos-${currentPlaceData.nombre.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = URL.createObjectURL(file);
            link.click();
            alert("Imagen descargada. ¡Compártela manualmente!");
        }
    } catch (e) {
        console.error("Share error:", e);
        // Text fallback
        navigator.share ? navigator.share({ title: 'Chronos', text: `Descubrí ${currentPlaceData.nombre} en Chronos!`, url: window.location.href }) : alert(`Descubrí ${currentPlaceData.nombre}`);
    } finally {
        btn.innerHTML = originalText;
    }
};

async function generateSocialCard(data) {
    // 1. Create Template (if not exists)
    let card = document.getElementById('social-card-template');
    if (!card) {
        card = document.createElement('div');
        card.id = 'social-card-template';
        document.body.appendChild(card);
    }

    const imgUrl = data.imagen_real || `https://image.pollinations.ai/prompt/photorealistic 8k image of ${data.nombre}?nologo=true`;
    // Use Proxy for CORS if needed, but Pollinations/Wiki usually fine with crossOrigin="anonymous"

    const rarityColor = data.rarity.class === 'legendary' ? '#f59e0b' : (data.rarity.class === 'rare' ? '#3b82f6' : '#9ca3af');

    card.innerHTML = `
        <div class="sc-image-container">
            <img src="${imgUrl}" crossorigin="anonymous" class="sc-image">
            <div class="sc-overlay"></div>
        </div>
        <div class="sc-content">
            <div class="sc-branding">CHRONOS MAPS</div>
            <div class="sc-title">${data.nombre}</div>
            <div class="sc-rarity" style="color:${rarityColor}; border-color:${rarityColor}">
                ${data.rarity.label.toUpperCase()}
            </div>
            <div class="sc-user">
                <span class="sc-avatar">${playerState.avatar}</span>
                <span>Descubierto por <b>${playerState.username || 'Explorador'}</b></span>
            </div>
            <div class="sc-footer">historia.cultura.mundo</div>
        </div>
    `;

    // 2. Wait for image to load
    const img = card.querySelector('img');
    await new Promise((resolve) => {
        if (img.complete) resolve();
        else { img.onload = resolve; img.onerror = resolve; }
    });

    // 3. Render Canvas
    const canvas = await html2canvas(card, {
        useCORS: true,
        scale: 1, // Full resolution
        backgroundColor: '#0f172a'
    });

    // 4. Convert to Blob
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

// Confetti & Toast
function triggerConfetti(isLegendary) {
    const colors = isLegendary ? ['#fcd34d', '#f59e0b', '#fffbeb'] : ['#60a5fa', '#3b82f6', '#eff6ff'];
    const count = isLegendary ? 50 : 20;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]; p.style.left = '50%'; p.style.top = '50%';
        const angle = Math.random() * Math.PI * 2; const v = 5 + Math.random() * 10;
        p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * v * 20}px,${Math.sin(angle) * v * 20}px) scale(0)`, opacity: 0 }], { duration: 800 + Math.random() * 400 }).onfinish = () => p.remove();
        document.body.appendChild(p);
    }
}
function showToast(msg, icon, color) {
    const t = document.createElement('div');
    t.style = "position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#111827; color:white; padding:12px 24px; border-radius:30px; font-weight:600; box-shadow:0 10px 25px rgba(0,0,0,0.2); z-index:2000; display:flex; gap:8px; align-items:center; animation: slideUp 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);";
    t.innerHTML = `<i class="fa-solid fa-${icon}" style="color:${color}"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

// Fetchers (Minimized)
async function fetchWikiImage(q) { if (!q) return null; try { const s = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`).then(r => r.json()); if (s.query.search[0]) { const t = s.query.search[0].title; const i = await fetch(`https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&format=json&pithumbsize=1000&origin=*`).then(r => r.json()); const p = Object.values(i.query.pages)[0]; return p.thumbnail ? p.thumbnail.source : null; } } catch (e) { } return null; }
async function fetchSuggestions(q) { try { renderDropdown(await fetch(`${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=5`).then(r => r.json())); } catch { } }
function renderDropdown(r) {
    const d = document.getElementById('search-dropdown');
    d.innerHTML = '';
    if (r.length > 0) {
        r.forEach(p => {
            const el = document.createElement('div');
            el.className = 'search-result-item';
            el.innerHTML = `<div class="search-result-text"><b>${p.display_name.split(',')[0]}</b><small>${truncateText(p.display_name, 30)}</small></div>`;
            el.onclick = () => {
                const latL = parseFloat(p.lat);
                const lngL = parseFloat(p.lon);
                map.panTo({ lat: latL, lng: lngL });
                map.setZoom(18);
                handleMapClick(latL, lngL);
                closeDropdown();
            };
            d.appendChild(el);
        });
        d.classList.add('active');
    } else d.classList.remove('active');
}
function closeDropdown() { document.getElementById('search-dropdown').classList.remove('active'); }
async function performSearch(q) {
    if (!q) return;
    const r = await fetch(`${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=1`).then(j => j.json());
    if (r[0]) {
        const lat = parseFloat(r[0].lat);
        const lng = parseFloat(r[0].lon);
        map.panTo({ lat, lng });
        map.setZoom(18);
        handleMapClick(lat, lng);
    }
}
async function reverseGeocode(lat, lng) { try { return await fetch(`${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`).then(r => r.json()); } catch { return null; } }
async function fetchWikipedia(q, lat, lng) { if (!q || q.includes("Ubicación")) return null; try { const s = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`).then(r => r.json()); if (s.query.search[0]) { const p = await fetch(`https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(s.query.search[0].title)}&format=json&origin=*`).then(r => r.json()); return Object.values(p.query.pages)[0].extract; } } catch { } return null; }
// placeMarker is defined above
function determineBestName(g) { const a = g.address; return a.amenity || a.building || a.tourism || a.historic || a.road || g.name || "Ubicación"; }
function formatType(t) { return t.replace(/_/g, ' '); }
function truncateText(t, l) { return t.length <= l ? t : t.substring(0, l) + '...'; }
function showLoading() { initialState.style.display = 'none'; infoDisplay.innerHTML = '<div style="padding:40px;text-align:center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>'; }
function displayError(m) { infoDisplay.innerHTML = `<div style="padding:20px;text-align:center;color:red;">${m}</div>`; }
