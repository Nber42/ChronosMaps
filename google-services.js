/**
 * GOOGLE PLACES & DIRECTIONS SERVICE
 * Integration for real photos and route planning
 */

let placesService;
let directionsService;
let directionsRenderer;

// Initialize services when map is ready
function initGoogleServices() {
    if (!map) return;

    // Places Service for photos and details
    placesService = new google.maps.places.PlacesService(map);

    // Directions Service for routes
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 6
        }
    });
}

/**
 * Get place details with real photos
 * @param {string} placeId - Google Place ID
 * @param {function} callback - Callback with place details
 */
window.getPlaceDetails = function (placeId, callback) {
    const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'opening_hours', 'formatted_phone_number', 'website']
    };

    placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            callback(place);
        } else {
            console.error('Places service failed:', status);
            callback(null);
        }
    });
};

/**
 * Search for a place and get its details
 * @param {string} query - Search query
 * @param {function} callback - Callback with place details
 */
window.searchPlace = function (query, callback) {
    const request = {
        query: query,
        fields: ['place_id', 'name', 'geometry', 'formatted_address']
    };

    placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            // Get full details including photos
            getPlaceDetails(results[0].place_id, callback);
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
                <button class="gmaps-mode-btn active" onclick="calculateRoute(currentDestination, 'WALKING')">
                    <span class="material-icons">directions_walk</span>
                    <span>A pie</span>
                </button>
                <button class="gmaps-mode-btn" onclick="calculateRoute(currentDestination, 'DRIVING')">
                    <span class="material-icons">directions_car</span>
                    <span>Coche</span>
                </button>
                <button class="gmaps-mode-btn" onclick="calculateRoute(currentDestination, 'TRANSIT')">
                    <span class="material-icons">directions_transit</span>
                    <span>Transporte</span>
                </button>
                <button class="gmaps-mode-btn" onclick="calculateRoute(currentDestination, 'BICYCLING')">
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
window.showPlaceInPanel = function (place) {
    const panelContent = document.getElementById('panel-content');

    // Get photo URL if available
    let photoUrl = 'https://via.placeholder.com/400x200?text=No+Image';
    if (place.photos && place.photos.length > 0) {
        photoUrl = place.photos[0].getUrl({ maxWidth: 400 });
    }

    // Store destination for directions
    window.currentDestination = place.geometry.location;

    panelContent.innerHTML = `
        <div class="gmaps-place-panel">
            <button class="gmaps-close-panel" onclick="closeSidePanel()">
                <span class="material-icons">close</span>
            </button>
            
            <img src="${photoUrl}" class="gmaps-place-photo" alt="${place.name}">
            
            <div class="gmaps-place-info">
                <h2 class="gmaps-place-name">${place.name}</h2>
                ${place.rating ? `
                    <div class="gmaps-place-rating">
                        <span class="material-icons">star</span>
                        <span>${place.rating}</span>
                        ${place.user_ratings_total ? `<span class="gmaps-rating-count">(${place.user_ratings_total})</span>` : ''}
                    </div>
                ` : ''}
                <p class="gmaps-place-address">${place.formatted_address}</p>
            </div>
            
            <div class="gmaps-place-actions">
                <button class="gmaps-action-btn primary" onclick="calculateRoute(currentDestination, 'WALKING')">
                    <span class="material-icons">directions</span>
                    <span>Cómo llegar</span>
                </button>
                <button class="gmaps-action-btn">
                    <span class="material-icons">bookmark_border</span>
                    <span>Guardar</span>
                </button>
                <button class="gmaps-action-btn">
                    <span class="material-icons">share</span>
                    <span>Compartir</span>
                </button>
            </div>
            
            ${place.opening_hours ? `
                <div class="gmaps-place-section">
                    <h3>Horario</h3>
                    <p>${place.opening_hours.isOpen() ? '✅ Abierto ahora' : '❌ Cerrado'}</p>
                </div>
            ` : ''}
            
            ${place.formatted_phone_number ? `
                <div class="gmaps-place-section">
                    <h3>Teléfono</h3>
                    <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a>
                </div>
            ` : ''}
            
            ${place.website ? `
                <div class="gmaps-place-section">
                    <h3>Sitio web</h3>
                    <a href="${place.website}" target="_blank">${place.website}</a>
                </div>
            ` : ''}
        </div>
    `;

    // Open side panel
    document.getElementById('side-panel').classList.add('open');

    // Center map on place
    map.setCenter(place.geometry.location);
    map.setZoom(16);
};

window.closeSidePanel = function () {
    document.getElementById('side-panel').classList.remove('open');
    // Clear directions
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
};

// Initialize services when map loads
window.addEventListener('load', () => {
    if (window.map) {
        initGoogleServices();
    }
});
