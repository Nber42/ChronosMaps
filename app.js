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
const DEFAULT_LOCATION = { lat: 39.4699, lng: -0.3763 }; // Valencia, España
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Navigation Stack
let navigationStack = [];
let userMarker = null;
let userAccuracyCircle = null;

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
            map.panTo(pos);
            map.setZoom(16);
            updateUserMarker(pos, position.coords.accuracy);
        });
    }
};

function updateUserMarker(pos, accuracy) {
    if (userMarker) {
        userMarker.setPosition(pos);
    } else {
        userMarker = new google.maps.Marker({
            position: pos,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 3
            },
            zIndex: 999,
            animation: google.maps.Animation.DROP
        });
    }

    if (userAccuracyCircle) {
        userAccuracyCircle.setCenter(pos);
        userAccuracyCircle.setRadius(accuracy);
    } else {
        userAccuracyCircle = new google.maps.Circle({
            strokeColor: "#4285F4",
            strokeOpacity: 0.4,
            strokeWeight: 1,
            fillColor: "#4285F4",
            fillOpacity: 0.15,
            map: map,
            center: pos,
            radius: accuracy
        });
    }
}

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
            console.log('Avatar clicked!');
            if (typeof ProfileSystem !== 'undefined' && ProfileSystem.open) {
                console.log('Opening ProfileSystem...');
                ProfileSystem.open();
            } else {
                console.error('ProfileSystem not loaded or open function not available');
                // Fallback: show profile creation modal if first time
                const modal = document.getElementById('profile-creation-modal');
                if (modal && !window.playerState.username) {
                    modal.classList.remove('hidden');
                } else if (modal) {
                    // Show profile overlay directly
                    const overlay = document.getElementById('profile-overlay');
                    if (overlay) {
                        overlay.classList.remove('hidden');
                    }
                }
            }
        });
    } else {
        console.error('Avatar button not found');
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
window.initApp = async function () {
    // Show loading screen immediately
    const loadingScreen = document.getElementById('loading-screen');

    loadPlayerState();
    if (typeof ProfileSystem !== 'undefined') ProfileSystem.init();
    if (typeof TourSystem !== 'undefined') TourSystem.init();

    initMap();
    if (window.initGoogleServices) window.initGoogleServices();
    renderHUD();

    // Auto-Geolocation Sequence
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                setTimeout(() => {
                    if (loadingScreen) loadingScreen.classList.add('hidden');
                    map.panTo(userLocation);
                    map.setZoom(15);
                    updateUserMarker(userLocation, position.coords.accuracy);

                    // Search nearby
                    findNearbyHistoricalPlaces(userLocation);
                    showToast("📍 Ubicación detectada", "check", "#4285F4");
                }, 1500);
            },
            (error) => {
                console.log("Geolocation error:", error);
                setTimeout(() => {
                    if (loadingScreen) loadingScreen.classList.add('hidden');
                    map.setCenter(DEFAULT_LOCATION);
                    map.setZoom(13);
                    showToast("ℹ️ Ubicación no detectada. Usando Valencia.", "info", "#6b7280");
                }, 1500);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        setTimeout(() => {
            if (loadingScreen) loadingScreen.classList.add('hidden');
            map.setCenter(DEFAULT_LOCATION);
            map.setZoom(13);
        }, 1500);
    }
};

function findNearbyHistoricalPlaces(location) {
    if (typeof placesService === 'undefined' || !placesService) return;

    const request = {
        location: location,
        radius: 1000,
        type: ['tourist_attraction', 'museum', 'church', 'synagogue', 'mosque']
    };

    placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // results.forEach(place => addHistoricalMarker(place)); // Existing logic might handle this
            console.log(`Found ${results.length} historical places near user`);
        }
    });
}

function initMap() {
    infoDisplay = document.getElementById('info-display');
    initialState = document.getElementById('initial-state');
    const inputElement = document.getElementById('gmaps-search-input'); // Corrected ID from index.html
    const searchWrapper = document.querySelector('.gmaps-search-container'); // Updated wrapper selection
    const dropdown = document.createElement('div'); dropdown.className = 'search-dropdown'; dropdown.id = 'search-dropdown';
    if (searchWrapper) searchWrapper.appendChild(dropdown);

    // Google Maps Config via Global Namespace
    const mapOptions = {
        center: DEFAULT_LOCATION,
        zoom: 13,
        mapTypeId: 'roadmap', // Real map mode
        disableDefaultUI: true, // Clean look
        zoomControl: false,     // Custom controls later if needed, or rely on gestures
        tilt: 0                // 2D startup
    };

    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    window.map = map; // Expose for Tours

    // Click Listener
    map.addListener('click', (e) => {
        handleMapClick(e.latLng.lat(), e.latLng.lng());
        closeDropdown();
    });

    // Search Logic (Safely initialized)
    if (inputElement && window.google && window.google.maps && window.google.maps.places) {
        try {
            const autocomplete = new google.maps.places.Autocomplete(inputElement);
            autocomplete.bindTo('bounds', map);

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();

                if (!place.geometry || !place.geometry.location) {
                    window.alert("No se encontraron detalles para: " + place.name);
                    return;
                }

                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);
                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                }

                console.log("Search result found:", place.name);
                handleMapClick(place.geometry.location.lat(), place.geometry.location.lng());
            });
        } catch (e) {
            console.warn("Search autocomplete failed to init:", e);
        }
    }



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
                infowindow.setContent(`<div style="padding:10px; font-family:sans-serif;">
                    <b style="color:#f59e0b; font-size:12px;">LEGENDRARIO</b><br>
                    <div style="font-weight:700; font-size:15px; margin:5px 0;">${poi.title}</div>
                    <div style="color:#64748b; font-size:13px;">Haz clic para ver la historia completa</div>
                </div>`);
                infowindow.open(map, marker);
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
// We can re-add custom custom buttons if needed, but gestures work fine on mobile.

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
    const level = playerState.level || 1;

    // Update the modern avatar in the header
    const headerAvatarEmoji = document.getElementById('header-avatar-emoji');
    const headerLevelBadge = document.getElementById('header-level-badge');
    if (headerAvatarEmoji) headerAvatarEmoji.textContent = av;
    if (headerLevelBadge) headerLevelBadge.textContent = level;

    hud.innerHTML = `
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
    console.log("handleMapClick triggered for:", lat, lng);
    placeMarker(lat, lng);
    stopAudio();

    // 1. INSTANT INTERACTION: Show Quick Card immediately
    // DISABLED per user request: "remove full card, keep info"
    /*
    if (window.POIQuickCardInstance) {
        window.POIQuickCardInstance.show({
            lat: lat,
            lng: lng,
            name: "" // Loading skeleton
        });
    }
    */

    // Background Panel Loading (Hidden or secondary)
    const pc = document.getElementById('panel-content');
    if (pc) {
        pc.innerHTML = '<div id="chronos-loading-state" style="padding:40px;text-align:center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px; color:#666;">Buscando en la línea del tiempo...</p></div>';
    }

    const location = new google.maps.LatLng(lat, lng);
    const srv = window.placesService;

    if (srv) {
        const request = {
            location: location,
            radius: 50,
            type: ['point_of_interest', 'establishment', 'landmark']
        };

        let searchTimedOut = false;
        const searchTimeout = setTimeout(() => {
            searchTimedOut = true;
            console.warn("nearbySearch timed out, jumping to fallback.");
            handleMapClickFallback(lat, lng);
        }, 3000);

        try {
            srv.nearbySearch(request, (results, status) => {
                if (searchTimedOut) return;
                clearTimeout(searchTimeout);

                console.log("nearbySearch callback status:", status);
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    console.log("Found nearby places:", results.length);
                    window.getPlaceDetails(results[0].place_id, async (place) => {
                        console.log("getPlaceDetails callback for:", place ? place.name : "null");
                        try {
                            const curated = (typeof findCuratedStory !== 'undefined') ? findCuratedStory(lat, lng) : null;

                            const data = {
                                id: place ? place.place_id : null,
                                nombre: place ? (place.name || "Lugar") : "Lugar",
                                lat: lat,
                                lng: lng,
                                rarity: determineRarity(),
                                imagen_real: (place && place.photos && place.photos.length > 0) ? place.photos[0].getUrl({ maxWidth: 800 }) : null,
                                direccion: (place && place.formatted_address) ? place.formatted_address : "Dirección no disponible",
                                verified: !!curated
                            };

                            const aiCuriosity = generateAICuriosity({ ...data, types: (place ? (place.types || []) : []) });

                            // Add raw AI text to data for UI components
                            data.aiCuriosity = aiCuriosity;

                            if (curated) {
                                data.informacion_historica = curated.text;
                                data.rarity = RARITY.LEGENDARY;
                            } else {
                                let wikiText = await fetchWikipedia(data.nombre, lat, lng);
                                if (!wikiText && data.nombre) {
                                    const cleanName = data.nombre.split(',')[0].trim();
                                    if (cleanName !== data.nombre) wikiText = await fetchWikipedia(cleanName, lat, lng);
                                }

                                if (wikiText) {
                                    data.informacion_historica = `
                                    <div class="chronos-ai-insight">
                                        <div class="ai-label"><span class="material-icons">auto_awesome</span> Chronos AI Insight</div>
                                        <div class="ai-text">${aiCuriosity}</div>
                                    </div>
                                    <div class="historical-facts">
                                        <div class="facts-label"><span class="material-icons">history_edu</span> Hechos Históricos</div>
                                        <div class="facts-text">${wikiText}</div>
                                    </div>
                                `;
                                    data.verified = true;
                                } else {
                                    data.informacion_historica = `
                                    <div class="chronos-ai-insight solo">
                                        <div class="ai-label"><span class="material-icons">auto_awesome</span> Chronos AI Insight</div>
                                        <div class="ai-text">${aiCuriosity}</div>
                                    </div>
                                `;
                                    data.verified = false;
                                }
                            }

                            data.pastImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("hyper-realistic historical oil painting of " + data.nombre + " in ancient times, detailed architecture, atmospheric, 8k resolution, masterpiece")}?nologo=true`;
                            window.currentPlaceData = data;
                            try {
                                pushToStack('place-detail', { lat, lng, zoom: map.getZoom() });
                            } catch (e) { }

                            console.log("Calling showPlaceInPanel for:", data.nombre);

                            // UPDATE: Reverted to Side Panel as primary
                            window.currentPlaceData = data;
                            window.showPlaceInPanel(place, data);
                            document.getElementById('panel-back-nav').classList.remove('hidden');

                            /*
                            // UPDATE QUICK CARD instead of just opening panel
                            window.currentPlaceData = data;
                            if (window.POIQuickCardInstance) {
                                window.POIQuickCardInstance.updateContent(data);
                            } else {
                                // Fallback to old panel if QuickCard fails
                                window.showPlaceInPanel(place, data);
                                document.getElementById('panel-back-nav').classList.remove('hidden');
                            }
                            */

                            if (!hasDiscovered(lat, lng)) {
                                // handleNewDiscovery(data); // DISABLED: Manual discovery via button
                            }
                        } catch (err) {
                            console.error("Error in getPlaceDetails callback:", err);
                            handleMapClickFallback(lat, lng);
                        }
                    });
                } else {
                    console.warn("No nearby places found found or error status.");
                    handleMapClickFallback(lat, lng);
                }
            });
        } catch (e) {
            clearTimeout(searchTimeout);
            console.error("Critical error starting nearbySearch:", e);
            handleMapClickFallback(lat, lng);
        }
    } else {
        handleMapClickFallback(lat, lng);
    }
}

function handleNewDiscovery(data) {
    if (typeof SoundFX !== 'undefined') SoundFX.playDiscovery(data.rarity);
    awardXP(data.rarity);
    addToChronedex(data);
    triggerConfetti(data.rarity === RARITY.LEGENDARY);
    playerState.stats.discoveries++;
    if (data.rarity === RARITY.LEGENDARY) playerState.stats.legendaries++;
    checkAchievements();
    savePlayerState();
}

async function handleMapClickFallback(lat, lng) {
    console.log("Starting fallback for:", lat, lng);
    try {
        const curated = (typeof findCuratedStory !== 'undefined') ? findCuratedStory(lat, lng) : null;

        let data = {
            id: 'custom_' + lat.toFixed(5) + '_' + lng.toFixed(5),
            nombre: "Lugar Explorador",
            lat, lng,
            rarity: determineRarity()
        };

        if (curated) {
            data.nombre = curated.title;
            data.informacion_historica = curated.text;
            data.rarity = RARITY.LEGENDARY;
            data.verified = true;
        }

        try {
            const geoData = await reverseGeocode(lat, lng);
            if (geoData) {
                if (!curated) data.nombre = (typeof determineBestName !== 'undefined') ? determineBestName(geoData) : "Lugar Explorador";
                data.direccion = geoData.display_name || "Dirección no disponible";
            }
        } catch (e) { console.warn("Fallback geocode failed", e); }

        let wikiText = null;
        try {
            wikiText = await fetchWikipedia(data.nombre, lat, lng);
            if (!wikiText && data.nombre) {
                const cleanName = data.nombre.split(',')[0].trim();
                if (cleanName !== data.nombre) wikiText = await fetchWikipedia(cleanName, lat, lng);
            }
        } catch (e) { console.warn("Fallback wiki failed", e); }

        if (wikiText) {
            const aiCuriosity = generateAICuriosity(data);
            data.aiCuriosity = aiCuriosity; // Store for UI
            data.informacion_historica = `
                <div class="chronos-ai-insight">
                    <div class="ai-label"><span class="material-icons">auto_awesome</span> Chronos AI Insight</div>
                    <div class="ai-text">${aiCuriosity}</div>
                </div>
                <div class="historical-facts">
                    <div class="facts-label"><span class="material-icons">history_edu</span> Hechos Históricos</div>
                    <div class="facts-text">${wikiText}</div>
                </div>
            `;
            data.verified = true;
        } else if (curated) {
            data.informacion_historica = curated.text;
            data.aiCuriosity = curated.text; // Use curated text as AI insight
        } else {
            const aiCuriosity = generateAICuriosity(data);
            data.aiCuriosity = aiCuriosity; // Store for UI
            data.informacion_historica = `
                <div class="chronos-ai-insight solo">
                    <div class="ai-label"><span class="material-icons">auto_awesome</span> Chronos AI Insight</div>
                    <div class="ai-text">${aiCuriosity}</div>
                </div>
            `;
        }

        data.resumen = data.informacion_historica ? truncateText(data.informacion_historica, 180) : "";

        try {
            data.imagen_real = await fetchWikiImage(data.nombre);
        } catch (e) { }
        data.pastImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("historical painting of " + data.nombre + " ancient architecture")}?nologo=true`;

        if (!hasDiscovered(lat, lng)) {
            // handleNewDiscovery(data); // DISABLED: Manual discovery via button
        }

        console.log("Calling showPlaceInPanel (fallback) for:", data.nombre);
        window.currentPlaceData = data; // For sharing
        window.showPlaceInPanel(null, data);
    } catch (err) {
        console.error("CRITICAL FALLBACK ERROR:", err);
        const pc = document.getElementById('panel-content');
        if (pc) pc.innerHTML = '<div style="padding:20px; color:red;">Error al cargar información. Por favor, intenta de nuevo.</div>';
    }
}

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


// --- END OF UI HELPERS ---

// --- NAVIGATION SYSTEM ---
window.pushToStack = function (view, state) {
    navigationStack.push({
        view: view,
        center: map.getCenter(),
        zoom: map.getZoom(),
        state: state
    });
    console.log("Pushed to stack:", view, navigationStack.length);
};

window.goBack = function () {
    if (navigationStack.length === 0) {
        window.closeSidePanel();
        document.getElementById('panel-back-nav').classList.add('hidden');
        return;
    }

    const prevState = navigationStack.pop();
    console.log("Popping from stack:", prevState.view);

    if (prevState.view === 'place-detail' || prevState.view === 'map') {
        window.closeSidePanel();
    }

    map.panTo(prevState.center);
    map.setZoom(prevState.zoom);

    if (navigationStack.length === 0) {
        document.getElementById('panel-back-nav').classList.add('hidden');
    }
};

// Listen for ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (navigationStack.length > 0) {
            goBack();
        } else {
            window.closeSidePanel();
        }
    }
});

// Swipe to back logic
let touchStartX = 0;
const panel = document.getElementById('side-panel');
if (panel) {
    panel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    panel.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchEndX - touchStartX;

        if (swipeDistance > 100) { // Swipe right to go back
            goBack();
        }
    }, { passive: true });
}
// --- SOCIAL SHARING ---
let currentPlaceData = null; // Global reference for sharing

window.shareDiscovery = async function () {
    const btn = document.querySelector('.action-btn');
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

    try {
        const file = await generateSocialCard(window.currentPlaceData || currentPlaceData);

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Chronos Maps Discovery',
                text: `¡He descubierto ${(window.currentPlaceData || currentPlaceData).nombre} en Chronos Maps! 🌍✨ #ChronosMaps`,
                files: [file]
            });
        } else {
            // Fallback: Download the image
            const link = document.createElement('a');
            link.download = `chronos-${(window.currentPlaceData || currentPlaceData).nombre.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = URL.createObjectURL(file);
            link.click();
            alert("Imagen descargada. ¡Compártela manualmente!");
        }
    } catch (e) {
        console.error("Share error:", e);
        // Text fallback
        const data = window.currentPlaceData || currentPlaceData;
        navigator.share ? navigator.share({ title: 'Chronos', text: `Descubrí ${data.nombre} en Chronos!`, url: window.location.href }) : alert(`Descubrí ${data.nombre}`);
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
async function reverseGeocode(lat, lng) {
    console.log("reverseGeocode started...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    try {
        const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        console.log("Geocode success:", data ? data.display_name : "null");
        return data;
    } catch (e) {
        console.warn("Geocode error or timeout", e);
        return null;
    }
}

async function fetchWikipedia(title, lat, lng) {
    console.log("fetchWikipedia started for:", title);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    try {
        const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const data = await res.json();
        console.log("Wiki fetch success");
        return data.extract;
    } catch (e) {
        console.warn("Wiki error or timeout", e);
        return null;
    }
}
// placeMarker is defined above
function determineBestName(g) { const a = g.address; return a.amenity || a.building || a.tourism || a.historic || a.road || g.name || "Ubicación"; }
function formatType(t) { return t.replace(/_/g, ' '); }
function truncateText(t, l) { return t.length <= l ? t : t.substring(0, l) + '...'; }
function showLoading() { initialState.style.display = 'none'; infoDisplay.innerHTML = '<div style="padding:40px;text-align:center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>'; }
function displayError(m) { infoDisplay.innerHTML = `<div style="padding:20px;text-align:center;color:red;">${m}</div>`; }

/**
 * Chronos AI - Curiosity Generator
 * Generates interesting, themed facts based on place type.
 */
function generateAICuriosity(data) {
    const type = (data.types && data.types[0]) ? data.types[0] : 'place';
    const name = data.nombre || 'este lugar';

    const library = {
        'restaurant': [
            `Este establecimiento culinario guarda secretos de sabores que han evolucionado a través de los siglos. ¿Sabías que en este punto exacto se cocinaban platos tradicionales mucho antes de la era moderna?`,
            `La gastronomía aquí no es solo comida, es una cápsula del tiempo. Chronos detecta ecos de festines antiguos en los cimientos de ${name}.`,
            `En el pasado, los viajeros se detenían cerca de aquí para intercambiar especias exóticas. ${name} continúa esa tradición de encuentro social.`
        ],
        'park': [
            `Bajo estas raíces, Chronos detecta sedimentos de eras geológicas pasadas. Este parque fue una vez parte de un ecosistema salvaje que dominaba la región.`,
            `${name} es un portal a la naturaleza antigua. Cada árbol aquí es un testigo silencioso del crecimiento de la ciudad a su alrededor.`,
            `Hace décadas, este terreno era el límite de la civilización conocida. Hoy, es un refugio atemporal en el corazón urbano.`
        ],
        'church': [
            `La arquitectura espiritual de ${name} canaliza energías de siglos de devoción. Chronos indica que los planos originales se inspiraron en constelaciones antiguas.`,
            `Las piedras de este lugar han escuchado susurros de la historia que los libros han olvidado. Es un nodo de conexión con el pasado sagrado.`,
            `Cada vitral y columna de ${name} es un código visual que narra la evolución del pensamiento humano en esta región.`
        ],
        'museum': [
            `Chronos detecta una alta concentración de 'memoria residual' aquí. Este edificio no solo guarda objetos, sino fragmentos literales de tiempo congelado.`,
            `${name} es el ancla que impide que la historia se desvanezca. Los tesoros que alberga son llaves para entender el futuro.`,
            `Caminar por ${name} es técnicamente viajar en el tiempo. La IA sugiere prestar atención a las sombras; a veces cuentan más que las placas.`
        ],
        'default': [
            `Chronos AI detecta que este rincón de la ciudad fue un punto clave para eventos que cambiaron el curso del barrio.`,
            `Aunque parece un lugar cotidiano, ${name} se asienta sobre capas de historia invisibles para el ojo humano.`,
            `En la línea de tiempo alternativa, este lugar era el centro de un imperio. En nuestra realidad, es un fragmento esencial de la identidad local.`,
            `La IA de Chronos sugiere que ${name} tiene una 'firma temporal' única, indicando que eventos importantes ocurrirán aquí pronto... o ya ocurrieron.`
        ]
    };

    const category = library[type] ? type : 'default';
    const options = library[category];
    return options[Math.floor(Math.random() * options.length)];
}
