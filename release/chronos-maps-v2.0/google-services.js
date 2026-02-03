/**
 * GOOGLE PLACES & DIRECTIONS SERVICE
 * Integration for real photos and route planning
 */

let placesService;
let directionsService;
let directionsRenderer;

// Initialize services when map is ready
window.initGoogleServices = function () {
    console.log("initGoogleServices started. map ready?", !!window.chronosMap);
    if (!window.chronosMap) {
        console.warn('initGoogleServices: chronosMap not ready yet.');
        return;
    }

    if (window.placesService) return; // Already initialized

    try {
        // Places Service for photos and details
        window.placesService = new google.maps.places.PlacesService(window.chronosMap);
        console.log("placesService initialized on window.");

        // Directions Service for routes
        window.directionsService = new google.maps.DirectionsService();
        window.directionsRenderer = new google.maps.DirectionsRenderer({
            map: window.chronosMap,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 6
            }
        });

        console.log('Google Services initialized successfully.');
    } catch (err) {
        console.error("Error initializing Google Services:", err);
    }
};

/**
 * Get place details with real photos
 * @param {string} placeId - Google Place ID
 * @param {function} callback - Callback with place details
 */
window.getPlaceDetails = function (placeId, callback) {
    console.log("getPlaceDetails called for:", placeId);
    if (!window.placesService) {
        console.warn("placesService missing, re-initializing...");
        window.initGoogleServices();
    }

    if (!window.placesService) {
        console.error("Critical: placesService could not be initialized.");
        callback(null);
        return;
    }

    const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'opening_hours', 'formatted_phone_number', 'website', 'types']
    };

    try {
        window.placesService.getDetails(request, (place, status) => {
            console.log("getDetails status:", status);
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
 * @param {string} query - Search query
 * @param {function} callback - Callback with place details
 */
window.searchPlace = function (query, callback) {
    if (!placesService) window.initGoogleServices();
    if (!placesService) {
        callback(null);
        return;
    }

    const request = {
        query: query,
        fields: ['place_id', 'name', 'geometry', 'formatted_address']
    };

    placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            // Get full details including photos
            window.getPlaceDetails(results[0].place_id, callback);
        } else {
            callback(null);
        }
    });
};

/**
 * Calculate route from user location to destination
 * @param {object} destination - {lat, lng} or address string
 * @param {string} travelMode - DRIVING, WALKING, BICYCLING, TRANSIT
 */
window.calculateRoute = function (destination, travelMode = 'WALKING') {
    if (!directionsService) window.initGoogleServices();
    if (!directionsService) return;

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

        directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);
                showDirectionsPanel(result);
            } else {
                console.error('Directions request failed:', status);
                alert('No se pudo calcular la ruta');
            }
        });
    }, (error) => {
        alert('No se pudo obtener tu ubicación');
        console.error(error);
    });
};

/**
 * Show directions in side panel
 */
function showDirectionsPanel(directionsResult) {
    const route = directionsResult.routes[0];
    const leg = route.legs[0];

    const panelContent = document.getElementById('panel-content');
    panelContent.innerHTML = `
        <div class="gmaps-directions-panel">
            <div class="gmaps-directions-header">
                <button class="gmaps-back-btn" onclick="closeSidePanel()">
                    <span class="material-icons">arrow_back</span>
                </button>
                <h2>Cómo llegar</h2>
            </div>
            
            <div class="gmaps-route-summary">
                <div class="gmaps-route-time">${leg.duration.text}</div>
                <div class="gmaps-route-distance">${leg.distance.text}</div>
                <div class="gmaps-route-mode">
                    <span class="material-icons">directions_walk</span>
                    ${leg.start_address}
                </div>
            </div>
            
            <div class="gmaps-transport-modes">
                <button class="gmaps-mode-btn ${leg.steps[0]?.travel_mode === 'WALKING' ? 'active' : ''}" onclick="window.calculateRoute(window.currentDestination, 'WALKING')">
                    <span class="material-icons">directions_walk</span>
                    <span>A pie</span>
                </button>
                <button class="gmaps-mode-btn ${leg.steps[0]?.travel_mode === 'DRIVING' ? 'active' : ''}" onclick="window.calculateRoute(window.currentDestination, 'DRIVING')">
                    <span class="material-icons">directions_car</span>
                    <span>Coche</span>
                </button>
                <button class="gmaps-mode-btn" onclick="window.calculateRoute(window.currentDestination, 'TRANSIT')">
                    <span class="material-icons">directions_transit</span>
                    <span>Transporte</span>
                </button>
                <button class="gmaps-mode-btn" onclick="window.calculateRoute(window.currentDestination, 'BICYCLING')">
                    <span class="material-icons">directions_bike</span>
                    <span>Bici</span>
                </button>
            </div>
            
            <div class="gmaps-steps-list">
                <h3>Indicaciones paso a paso</h3>
                ${leg.steps.map((step, index) => `
                    <div class="gmaps-step-item">
                        <div class="gmaps-step-number">${index + 1}</div>
                        <div class="gmaps-step-details">
                            <div class="gmaps-step-instruction">${step.instructions}</div>
                            <div class="gmaps-step-distance">${step.distance.text}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Open side panel
    document.getElementById('side-panel').classList.add('open');
}

/**
 * Show place details in side panel with real photos
 */
window.showPlaceInPanel = function (place, chronosData) {
    console.log("showPlaceInPanel called with:", place ? place.name : "null place", chronosData ? chronosData.nombre : "null data");

    try {
        const panelContent = document.getElementById('panel-content');
        if (!panelContent) {
            console.error("panel-content not found!");
            return;
        }

        const photoUrl = (place && place.photos && place.photos.length > 0) ? place.photos[0].getUrl({ maxWidth: 800 }) :
            (chronosData && chronosData.imagen_real) ? chronosData.imagen_real :
                `https://image.pollinations.ai/prompt/hyper-realistic 8k photography of ${encodeURIComponent(place ? place.name : (chronosData ? chronosData.nombre : 'Ubicación'))}, modern day, cinematic lighting, high resolution?nologo=true`;

        // Secondary photo (e.g. historical)
        let pastPhotoUrl = null;
        if (chronosData && chronosData.pastImgUrl) {
            pastPhotoUrl = chronosData.pastImgUrl;
        }

        // Store destination for directions
        if (place && place.geometry && place.geometry.location) {
            window.currentDestination = place.geometry.location;
        } else if (chronosData) {
            window.currentDestination = { lat: chronosData.lat, lng: chronosData.lng };
        }

        const rarityClass = (chronosData && chronosData.rarity && chronosData.rarity.class) ? chronosData.rarity.class : 'common';
        const rarityLabel = (chronosData && chronosData.rarity && chronosData.rarity.label) ? chronosData.rarity.label : 'Explorado';

        const placeName = place ? (place.name || "Lugar") : (chronosData ? (chronosData.nombre || "Lugar") : "Lugar");
        const placeAddress = place ? (place.formatted_address || "Dirección no disponible") : (chronosData ? (chronosData.direccion || "Dirección no disponible") : "Dirección no disponible");

        panelContent.innerHTML = `
            <div class="gmaps-place-panel">
                <button class="gmaps-close-panel" onclick="closeSidePanel()">
                    <span class="material-icons">close</span>
                </button>
                
                <div class="gmaps-photo-gallery" id="panel-photo-gallery" style="position:relative; height:200px; overflow:hidden;">
                    <img src="${photoUrl}" class="gmaps-place-photo" id="panel-img-present" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; transition:opacity 0.5s; opacity:1;" alt="${placeName.replace(/"/g, '&quot;')}">
                    ${pastPhotoUrl ? `
                        <img src="${pastPhotoUrl}" class="gmaps-place-photo secondary" id="panel-img-past" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; transition:opacity 0.5s; opacity:0; z-index:2;" alt="Pasado">
                        
                        <div class="poi-time-toggle" style="position:absolute; bottom:12px; right:12px; z-index:10; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); border-radius:20px; padding:4px; display:flex; border:1px solid rgba(255,255,255,0.2);">
                            <button class="time-btn" onclick="togglePanelTime('present', this)" style="background:white; color:black; border:none; padding:6px 12px; border-radius:16px; font-weight:600; font-size:11px; cursor:pointer;">AHORA</button>
                            <button class="time-btn" onclick="togglePanelTime('past', this)" style="background:transparent; color:rgba(255,255,255,0.7); border:none; padding:6px 12px; border-radius:16px; font-weight:600; font-size:11px; cursor:pointer;">ANTES</button>
                        </div>
                        
                        <script>
                            window.togglePanelTime = function(mode, btn) {
                                const parent = btn.parentElement;
                                Array.from(parent.children).forEach(b => {
                                    b.style.background = 'transparent';
                                    b.style.color = 'rgba(255,255,255,0.7)';
                                });
                                btn.style.background = 'white';
                                btn.style.color = 'black';
                                
                                const past = document.getElementById('panel-img-past');
                                if(mode === 'past') {
                                    past.style.opacity = '1';
                                } else {
                                    past.style.opacity = '0';
                                }
                            }
                        </script>
                    ` : ''}
                </div>

                <!-- CHRONODEX DISCOVER BUTTON -->
                <div style="padding: 16px 16px 0 16px;">
                    ${window.ChronodexSystem ? window.ChronodexSystem.renderDiscoverButton(place, chronosData) : ''}
                </div>
                
                <!-- AI INSIGHT BOX (Enhanced) -->
                ${(chronosData && chronosData.aiCuriosity) ? `
                    <div style="margin: 16px 16px 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px; font-size:11px; font-weight:700; color:#15803d; text-transform:uppercase;">
                            <span class="material-icons" style="font-size:14px">auto_awesome</span> Chronos AI Insight
                        </div>
                        <div style="font-size:13px; line-height:1.5; color:#166534; font-style:italic;">
                            "${chronosData.aiCuriosity}"
                        </div>
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
                            ${place.user_ratings_total ? `<span class="gmaps-rating-count">(${place.user_ratings_total})</span>` : ''}
                            <span class="gmaps-place-type">${place.types ? formatType(place.types[0]) : ''}</span>
                        </div>
                    ` : ''}
                    
                    <p class="gmaps-place-address">
                        <span class="material-icons">place</span>
                        ${placeAddress}
                    </p>
                </div>
                
                <div class="gmaps-place-actions">
                    <button class="gmaps-action-btn primary" onclick="if(window.openStreetView) window.openStreetView()">
                        <span class="material-icons">streetview</span>
                        <span>Street View</span>
                    </button>
                    <button class="gmaps-action-btn">
                        <span class="material-icons">bookmark_border</span>
                        <span>Guardar</span>
                    </button>
                    <button class="gmaps-action-btn" onclick="if(window.shareDiscovery) window.shareDiscovery()">
                        <span class="material-icons">share</span>
                        <span>Compartir</span>
                    </button>
                </div>

                <!-- History Section Container -->
                <div id="chronos-history-container"></div>
                
                ${place && place.opening_hours ? `
                    <div class="gmaps-place-section">
                        <h3><span class="material-icons">schedule</span> Horario</h3>
                        <p>${(typeof place.opening_hours.isOpen === 'function' && place.opening_hours.isOpen()) ? '<span class="status-open">Abierto ahora</span>' : '<span class="status-closed">Cerrado</span>'}</p>
                    </div>
                ` : ''}
                
                ${place && place.formatted_phone_number ? `
                    <div class="gmaps-place-section">
                        <h3><span class="material-icons">phone</span> Teléfono</h3>
                        <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a>
                    </div>
                ` : ''}
                
                ${place && place.website ? `
                    <div class="gmaps-place-section">
                        <h3><span class="material-icons">public</span> Sitio web</h3>
                        <a href="${place.website}" target="_blank">${place.website}</a>
                    </div>
                ` : ''}
            </div>
        `;

        // Inject history content if available
        const historyContainer = document.getElementById('chronos-history-container');
        if (historyContainer) {
            const historyText = (chronosData && chronosData.informacion_historica) ? chronosData.informacion_historica :
                (chronosData && (chronosData.resumen || chronosData.informacion)) ? (chronosData.resumen || chronosData.informacion) : null;

            if (historyText && historyText.trim().length > 0) {
                // Sanitize for the narrator button (remove HTML and special chars that break onclick)
                const cleanText = historyText.replace(/[`]/g, '').replace(/<\/?[^>]+(>|$)/g, "").replace(/"/g, '').replace(/'/g, '').trim();
                historyContainer.innerHTML = `
                    <div class="gmaps-place-section chronos-history">
                        <h3><span class="material-icons">history_edu</span> Historia y Curiosidades</h3>
                        <div class="history-content">
                            ${historyText}
                        </div>
                        <button class="gmaps-narrator-btn" onclick="if(window.toggleNarrator) window.toggleNarrator(\`${cleanText}\`)">
                            <span class="material-icons">volume_up</span>
                            <span>Escuchar Historia</span>
                        </button>
                    </div>
                `;
            }
        }

        // Open side panel
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) {
            sidePanel.classList.add('open');
            console.log("Side panel classList:", sidePanel.className);
        } else {
            console.error("side-panel not found!");
        }

        // Center map on place
        if (window.chronosMap) {
            if (place && place.geometry && place.geometry.location) {
                window.chronosMap.panTo(place.geometry.location);
            } else if (chronosData && chronosData.lat) {
                window.chronosMap.panTo({ lat: chronosData.lat, lng: chronosData.lng });
            }
        }
    } catch (err) {
        console.error("CRITICAL ERROR in showPlaceInPanel:", err);
        const pc = document.getElementById('panel-content');
        if (pc) pc.innerHTML = `<div style="padding:20px; color:red;">Error de renderizado: ${err.message}</div>`;
    }
};

window.closeSidePanel = function () {
    const panel = document.getElementById('side-panel');
    if (panel) panel.classList.remove('open');

    // Hide back navigation when panel closes
    const backNav = document.getElementById('panel-back-nav');
    if (backNav) backNav.classList.add('hidden');

    // Clear directions
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
};

// Helper for type formatting (moved from app.js or duplicated for safety)
function formatType(t) {
    if (!t) return '';
    return t.replace(/_/g, ' ').charAt(0).toUpperCase() + t.replace(/_/g, ' ').slice(1);
}

/**
 * Open Street View for the current destination
 */
window.openStreetView = function () {
    if (!window.currentDestination) {
        alert("Ubicación no disponible para Street View");
        return;
    }

    // Use the map's default StreetView panorama instead of creating a new one over the div
    const panorama = window.chronosMap.getStreetView();
    panorama.setPosition(window.currentDestination);

    // Set POV to look at the point (approximate)
    panorama.setPov({
        heading: 34,
        pitch: 10
    });

    panorama.setVisible(true);
};

// Global initialization
window.addEventListener('load', () => {
    // If initApp already ran and map is there
    if (window.chronosMap) {
        window.initGoogleServices();
    }
});

// ============================================
// GEOCODING HELPERS
// ============================================

/**
 * Gets full address details from a LatLng location
 * @param {object} location - {lat, lng}
 * @returns {Promise<object>} - Detailed address object
 */
async function getFullAddress(location) {
    if (!window.google || !window.google.maps) {
        throw new Error("Google Maps not loaded");
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
        geocoder.geocode({ location: location }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const addressComponents = results[0].address_components;

                // Extraer componentes específicos
                const address = {
                    fullAddress: results[0].formatted_address,
                    streetNumber: extractComponent(addressComponents, 'street_number'),
                    streetName: extractComponent(addressComponents, 'route'),
                    neighborhood: extractComponent(addressComponents, 'neighborhood') ||
                        extractComponent(addressComponents, 'sublocality'),
                    city: extractComponent(addressComponents, 'locality'),
                    state: extractComponent(addressComponents, 'administrative_area_level_1'),
                    country: extractComponent(addressComponents, 'country'),
                    postalCode: extractComponent(addressComponents, 'postal_code'),
                    location: {
                        lat: location.lat,
                        lng: location.lng
                    }
                };

                // Construir dirección completa con número
                address.displayAddress = buildDisplayAddress(address);

                resolve(address);
            } else {
                console.warn('Geocoding failed:', status);
                reject(new Error('No se pudo obtener la dirección: ' + status));
            }
        });
    });
}

// Extraer componente específico
function extractComponent(components, type) {
    const component = components.find(c => c.types.includes(type));
    return component ? component.long_name : null;
}

// Construir dirección para mostrar
function buildDisplayAddress(address) {
    let display = '';

    // Calle con número (PRIORITARIO)
    if (address.streetName) {
        display = address.streetName;
        if (address.streetNumber) {
            display += `, ${address.streetNumber}`;
        }
    }

    // Añadir barrio si existe
    if (address.neighborhood) {
        display += display ? ` - ${address.neighborhood}` : address.neighborhood;
    }

    // Añadir ciudad si no es parte de la calle (simplicación)
    if (address.city) {
        display += display ? `, ${address.city}` : address.city;
    }

    return display || address.fullAddress;
}

// Expose globally
window.getFullAddress = getFullAddress;
