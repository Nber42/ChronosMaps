/**
 * GOOGLE PLACES & DIRECTIONS SERVICE
 * Integration for real photos and route planning
 */

let placesService;
let directionsService;
let directionsRenderer;

// Initialize services when map is ready
window.initGoogleServices = function () {
    if (!window.chronosMap) {
        console.warn('initGoogleServices: chronosMap not ready yet.');
        return;
    }

    try {
        // Places Service for photos and details
        if (!window.placesService) {
            window.placesService = new google.maps.places.PlacesService(window.chronosMap);
            console.log("placesService initialized.");
        }

        // Directions Service for routes
        if (!window.directionsService) {
            window.directionsService = new google.maps.DirectionsService();
            console.log("directionsService initialized.");
        }

        if (!window.directionsRenderer) {
            window.directionsRenderer = new google.maps.DirectionsRenderer({
                map: window.chronosMap,
                suppressMarkers: false,
                polylineOptions: {
                    strokeColor: '#4285F4',
                    strokeWeight: 6
                }
            });
            console.log("directionsRenderer initialized.");
        }

    } catch (err) {
        console.error("Error initializing Google Services:", err);
    }
};

/**
 * Get place details with real photos
 */
window.getPlaceDetails = function (placeId, callback) {
    if (!window.placesService) window.initGoogleServices();
    if (!window.placesService) {
        callback(null);
        return;
    }

    const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'opening_hours', 'formatted_phone_number', 'website', 'types']
    };

    try {
        window.placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                callback(place);
            } else {
                console.error('Places service failed:', status);
                callback(null);
            }
        });
    } catch (err) {
        console.error("Error calling getDetails:", err);
        callback(null);
    }
};

/**
 * Search for a place and get its details
 */
window.searchPlace = function (query, callback) {
    if (!window.placesService) window.initGoogleServices();
    if (!window.placesService) {
        callback(null);
        return;
    }

    const request = {
        query: query,
        fields: ['place_id', 'name', 'geometry', 'formatted_address']
    };

    window.placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            window.getPlaceDetails(results[0].place_id, callback);
        } else {
            callback(null);
        }
    });
};

/**
 * Calculate route from user location to destination
 */
window.calculateRoute = function (destination, travelMode = 'WALKING') {
    if (!window.directionsService || !window.directionsRenderer) window.initGoogleServices();
    if (!window.directionsService) return;

    if (window.showToast) window.showToast("📏 Calculando ruta...", "map", "#4285F4");

    if (!navigator.geolocation) {
        alert('La geolocalización no está disponible');
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const origin = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        const request = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode[travelMode],
            unitSystem: google.maps.UnitSystem.METRIC
        };

        window.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                if (window.showToast) window.showToast("✅ Ruta calculada", "check", "#34a853");
                window.directionsRenderer.setDirections(result);
                showDirectionsPanel(result);
            } else {
                alert('No se pudo calcular la ruta');
            }
        });
    }, (error) => {
        alert('No se pudo obtener tu ubicación');
    });
};

/**
 * Show directions in side panel
 */
function showDirectionsPanel(directionsResult) {
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    const panelContent = document.getElementById('panel-content');
    if (!panelContent) return;

    panelContent.innerHTML = window.safeHTML(`
        <div class="gmaps-directions-panel">
            <div class="gmaps-directions-header-container">
                <div class="gmaps-directions-top-bar">
                    <button class="gmaps-back-btn" onclick="closeSidePanel()">
                        <span class="material-icons">arrow_back</span>
                    </button>
                    <h2>Cómo llegar</h2>
                </div>
            </div>
            
            <div class="gmaps-directions-scroll-content">
                <div class="gmaps-route-summary-card">
                    <div class="summary-time">${leg.duration.text}</div>
                    <div class="summary-details">
                        <span>${leg.distance.text}</span> • <span class="summary-via">por ${route.summary}</span>
                    </div>
                </div>
                
                <div class="gmaps-transport-tabs">
                    <button class="gmaps-mode-tab ${leg.steps[0]?.travel_mode === 'WALKING' ? 'active' : ''}" onclick="window.calculateRoute(window.currentDestination, 'WALKING')">
                        <span class="material-icons">directions_walk</span>
                        <span class="mode-label">A pie</span>
                    </button>
                    <button class="gmaps-mode-tab ${leg.steps[0]?.travel_mode === 'DRIVING' ? 'active' : ''}" onclick="window.calculateRoute(window.currentDestination, 'DRIVING')">
                        <span class="material-icons">directions_car</span>
                        <span class="mode-label">Coche</span>
                    </button>
                </div>
                
                <div class="gmaps-steps-list">
                    <h3>Indicaciones paso a paso</h3>
                    ${leg.steps.map((step, index) => `
                        <div class="gmaps-step-item">
                            <div class="gmaps-step-icon">
                                <span class="material-icons">navigation</span>
                            </div>
                            <div class="gmaps-step-details">
                                <div class="gmaps-step-instruction">${step.instructions}</div>
                                <div class="gmaps-step-distance">${step.distance.text}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `);

    document.getElementById('side-panel').classList.add('open');
}

/**
 * Show place details in side panel
 */
window.showPlaceInPanel = function (place, chronosData) {
    try {
        const panelContent = document.getElementById('panel-content');
        if (!panelContent) return;

        const photoUrl = (place && place.photos && place.photos.length > 0) ? place.photos[0].getUrl({ maxWidth: 800 }) :
            (chronosData && chronosData.imagen_real) ? chronosData.imagen_real :
                `https://image.pollinations.ai/prompt/hyper-realistic 8k photography of ${encodeURIComponent(place ? place.name : (chronosData ? chronosData.nombre : 'Ubicación'))}?nologo=true`;

        let pastPhotoUrl = (chronosData && chronosData.pastImgUrl) ? chronosData.pastImgUrl : null;

        if (place && place.geometry && place.geometry.location) {
            window.currentDestination = place.geometry.location;
        } else if (chronosData) {
            window.currentDestination = { lat: chronosData.lat, lng: chronosData.lng };
        }

        const rarityClass = (chronosData && chronosData.rarity && chronosData.rarity.class) ? chronosData.rarity.class : 'common';
        const rarityLabel = (chronosData && chronosData.rarity && chronosData.rarity.label) ? chronosData.rarity.label : 'Explorado';
        const placeName = place ? (place.name || "Lugar") : (chronosData ? (chronosData.nombre || "Lugar") : "Lugar");
        const placeAddress = place ? (place.formatted_address || "Dirección no disponible") : (chronosData ? (chronosData.direccion || "Dirección no disponible") : "Dirección no disponible");

        panelContent.innerHTML = window.safeHTML(`
            <div class="gmaps-place-panel">
                <button class="gmaps-close-panel" onclick="closeSidePanel()">
                    <span class="material-icons">close</span>
                </button>
                
                <div class="gmaps-photo-gallery" id="panel-photo-gallery">
                    <img src="${photoUrl}" class="gmaps-place-photo" id="panel-img-present" alt="${placeName.replace(/"/g, '&quot;')}">
                    ${pastPhotoUrl ? `
                        <img src="${pastPhotoUrl}" class="gmaps-place-photo secondary" id="panel-img-past" alt="Pasado">
                        <div class="poi-time-toggle">
                            <button class="time-btn active" id="btn-present" onclick="window.togglePanelTime('present')">AHORA</button>
                            <button class="time-btn" id="btn-past" onclick="window.togglePanelTime('past')">ANTES</button>
                        </div>
                    ` : ''}
                </div>

                <div class="p-16-top">
                    ${window.ChronodexSystem ? window.ChronodexSystem.renderDiscoverButton(place, chronosData) : ''}
                </div>
                
                ${(chronosData && chronosData.aiCuriosity) ? `
                    <div class="chronos-ai-card-section">
                        <div class="ai-card-header">
                            <span class="material-icons">auto_awesome</span> Chronos AI Insight
                        </div>
                        <div class="ai-card-text">"${chronosData.aiCuriosity}"</div>
                    </div>
                ` : ''}
                
                <div class="gmaps-place-info">
                    <div class="gmaps-rarity-row">
                        <span class="rarity-badge ${rarityClass}">${rarityLabel}</span>
                        ${chronosData && chronosData.verified ? '<span class="verified-badge"><span class="material-icons">verified</span> Historia Verificada</span>' : ''}
                    </div>
                    <h2 class="gmaps-place-name">${placeName}</h2>
                    ${place && place.rating ? `
                        <div class="gmaps-place-rating">
                            <span class="material-icons">star</span>
                            <span>${place.rating}</span>
                            <span class="gmaps-place-type">${place.types ? formatType(place.types[0]) : ''}</span>
                        </div>
                    ` : ''}
                    <p class="gmaps-place-address"><span class="material-icons">place</span> ${placeAddress}</p>
                </div>
                
                <div class="gmaps-place-actions">
                    <button class="gmaps-action-btn primary" onclick="window.calculateRoute(window.currentDestination, 'WALKING')">
                        <span class="material-icons">directions</span>
                        <span>Cómo llegar</span>
                    </button>
                    <button class="gmaps-action-btn" onclick="if(window.openStreetView) window.openStreetView()">
                        <span class="material-icons">streetview</span>
                        <span>Street View</span>
                    </button>
                </div>

                <div id="chronos-history-container"></div>
            </div>
        `);

        // Helper for time toggle
        window.togglePanelTime = function (mode) {
            const btnPresent = document.getElementById('btn-present');
            const btnPast = document.getElementById('btn-past');
            const imgPast = document.getElementById('panel-img-past');
            if (mode === 'past') {
                if (btnPast) btnPast.classList.add('active');
                if (btnPresent) btnPresent.classList.remove('active');
                if (imgPast) imgPast.classList.add('opacity-1');
            } else {
                if (btnPresent) btnPresent.classList.add('active');
                if (btnPast) btnPast.classList.remove('active');
                if (imgPast) imgPast.classList.remove('opacity-1');
            }
        };

        // History injection
        const historyContainer = document.getElementById('chronos-history-container');
        const historyText = (chronosData && (chronosData.informacion_historica || chronosData.resumen || chronosData.informacion));
        if (historyContainer && historyText) {
            const cleanText = historyText.replace(/[`]/g, '').replace(/<\/?[^>]+(>|$)/g, "").replace(/"/g, '').replace(/'/g, '').trim();
            historyContainer.innerHTML = `
                <div class="gmaps-place-section chronos-history">
                    <h3><span class="material-icons">history_edu</span> Historia y Curiosidades</h3>
                    <div class="history-content">${historyText}</div>
                    <button class="gmaps-narrator-btn" onclick="if(window.toggleNarrator) window.toggleNarrator(\`${cleanText}\`)">
                        <span class="material-icons">volume_up</span> <span>Escuchar Historia</span>
                    </button>
                </div>
            `;
        }

        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) sidePanel.classList.add('open');
        if (window.chronosMap && window.currentDestination) window.chronosMap.panTo(window.currentDestination);

    } catch (err) {
        console.error("CRITICAL ERROR in showPlaceInPanel:", err);
    }
};

window.closeSidePanel = function () {
    const panel = document.getElementById('side-panel');
    if (panel) panel.classList.remove('open');
    if (window.directionsRenderer) window.directionsRenderer.setDirections({ routes: [] });
};

function formatType(t) {
    if (!t) return '';
    return t.replace(/_/g, ' ').charAt(0).toUpperCase() + t.replace(/_/g, ' ').slice(1);
}

window.openStreetView = function () {
    if (!window.currentDestination) return;
    const panorama = window.chronosMap.getStreetView();
    panorama.setPosition(window.currentDestination);
    panorama.setVisible(true);
};

window.addEventListener('load', () => {
    if (window.chronosMap) window.initGoogleServices();
});

async function getFullAddress(location) {
    if (!window.google || !window.google.maps) throw new Error("Google Maps not loaded");
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
        geocoder.geocode({ location: location }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const ac = results[0].address_components;
                const getC = (type) => ac.find(c => c.types.includes(type))?.long_name;
                const addr = {
                    fullAddress: results[0].formatted_address,
                    streetNumber: getC('street_number'),
                    streetName: getC('route'),
                    neighborhood: getC('neighborhood') || getC('sublocality'),
                    city: getC('locality'),
                };
                addr.displayAddress = `${addr.streetName || ''}${addr.streetNumber ? ', ' + addr.streetNumber : ''} ${addr.city ? ' - ' + addr.city : ''}`.trim() || addr.fullAddress;
                resolve(addr);
            } else reject(new Error(status));
        });
    });
}
window.getFullAddress = getFullAddress;
