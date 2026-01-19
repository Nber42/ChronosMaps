/**
 * CHRONOS TOURS SYSTEM
 * Handles guided routes, polylines, and tour state.
 */

const TOURS_DATA = [
    {
        id: 'modernist',
        title: 'Ruta Modernista',
        desc: 'Descubre las joyas arquitectónicas de Gaudí y sus contemporáneos en el corazón de Barcelona.',
        difficulty: 'Fácil',
        duration: '2h',
        image: 'https://image.pollinations.ai/prompt/gaudi architecture barcelona sunny?nologo=true',
        waypoints: [
            { lat: 41.3916, lng: 2.1649, name: 'Casa Batlló' },
            { lat: 41.3953, lng: 2.1619, name: 'Casa Milà (La Pedrera)' },
            { lat: 41.4036, lng: 2.1744, name: 'Sagrada Família' }
        ],
        color: '#f59e0b'
    },
    {
        id: 'gothic',
        title: 'Mitos del Gótico',
        desc: 'Callejones oscuros, gárgolas antiguas y leyendas de la Barcelona medieval.',
        difficulty: 'Medio',
        duration: '1.5h',
        image: 'https://image.pollinations.ai/prompt/gothic quarter barcelona night scary?nologo=true',
        waypoints: [
            { lat: 41.3833, lng: 2.1766, name: 'Catedral de Barcelona' },
            { lat: 41.3828, lng: 2.1775, name: 'Plaça del Rei' },
            { lat: 41.3840, lng: 2.1819, name: 'Santa Maria del Mar' }
        ],
        color: '#8b5cf6'
    }
];

const TourSystem = {
    activeTour: null,
    polylines: [],
    markers: [],

    init() {
        // Event Listeners for Tour Buttons will be added in app.js or html
    },

    openModal() {
        this.renderList();
        document.getElementById('tours-modal').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('tours-modal').classList.add('hidden');
    },

    renderList() {
        const grid = document.getElementById('tours-grid');
        grid.innerHTML = '';

        TOURS_DATA.forEach(tour => {
            const card = document.createElement('div');
            card.className = 'tour-card';
            card.onclick = () => this.startTour(tour);

            card.innerHTML = `
                <div class="tour-img-container">
                    <img src="${tour.image}" class="tour-img" loading="lazy">
                    <div class="tour-badge">${tour.duration}</div>
                </div>
                <div class="tour-info">
                    <div class="tour-title">${tour.title}</div>
                    <div class="tour-desc">${tour.desc}</div>
                    <div class="tour-meta">
                        <span><i class="fa-solid fa-person-hiking"></i> ${tour.difficulty}</span>
                        <span style="color:${tour.color}"><i class="fa-solid fa-map-location-dot"></i> ${tour.waypoints.length} Paradas</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    startTour(tour) {
        this.closeModal();
        this.clearMap();
        this.activeTour = tour;

        // Draw Line
        const path = tour.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));

        const line = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: tour.color,
            strokeOpacity: 0.8,
            strokeWeight: 6
        });

        line.setMap(window.map); // Assuming 'map' is global from app.js
        this.polylines.push(line);

        // Draw Waypoints
        tour.waypoints.forEach((wp, index) => {
            const marker = new google.maps.Marker({
                position: wp,
                map: window.map,
                label: {
                    text: (index + 1).toString(),
                    color: "white",
                    fontWeight: "bold"
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 14,
                    fillColor: tour.color,
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                },
                title: wp.name
            });
            this.markers.push(marker);
        });

        // Zoom to start
        const bounds = new google.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        window.map.fitBounds(bounds);

        // Notify
        showToast(`Tour iniciado: ${tour.title}`, 'flag', tour.color);
    },

    clearMap() {
        this.polylines.forEach(l => l.setMap(null));
        this.markers.forEach(m => m.setMap(null));
        this.polylines = [];
        this.markers = [];
        this.activeTour = null;
    }
};

window.TourSystem = TourSystem;
