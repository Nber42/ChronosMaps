/**
 * CHRONOS TOURS SYSTEM
 * Interactive Storytelling Engine & Dynamic Global Generator
 */

const TOURS_DATA = [
    {
        id: 'vikings',
        title: 'La Ruta de los Vikingos',
        desc: 'Navega a través de la historia y descubre los secretos de los exploradores nórdicos.',
        difficulty: 'Media',
        duration: '45 min',
        color: '#f97316',
        image: 'https://image.pollinations.ai/prompt/vikings longship storm cinematic?nologo=true',
        chapters: [
            { id: 'c1', title: 'El Desembarco', lat: 41.3833, lng: 2.1766, text: 'Las velas cuadradas aparecieron en el horizonte al amanecer. No eran comerciantes. El sonido de los cuernos de guerra heló la sangre de los habitantes de la costa...', aiPrompt: 'viking raid coastal village cinematic atmospheric' },
            { id: 'c2', title: 'El Asedio', lat: 41.3828, lng: 2.1775, text: 'Las murallas resistieron el primer embate, pero el hambre comenzaba a hacer mella. Fue entonces cuando el jarl Ragnar tomó una decisión que cambiaría el curso de la batalla...', aiPrompt: 'medieval siege battle walls smoke' },
            { id: 'c3', title: 'El Pacto', lat: 41.3840, lng: 2.1819, text: 'Entre las ruinas humeantes, dos líderes se encontraron. No con espadas, sino con palabras. Un pacto de sangre que uniría dos pueblos para siempre.', aiPrompt: 'two medieval leaders shaking hands ruins' }
        ]
    },
    {
        id: 'modernist',
        title: 'Secretos de Gaudí',
        desc: 'Más allá de la arquitectura: misticismo, naturaleza y logias secretas en la obra del maestro.',
        difficulty: 'Fácil',
        duration: '1h 30m',
        color: '#2563eb',
        image: 'https://image.pollinations.ai/prompt/gaudi architecture surreal dreamlike?nologo=true',
        chapters: [
            { id: 'm1', title: 'El Dragón Dormido', lat: 41.3916, lng: 2.1649, text: 'Observa el tejado. No son tejas, son las escamas de una bestia legendaria que descansa sobre el Paseo de Gracia...', aiPrompt: 'casa batllo roof dragon scales detail' },
            { id: 'm2', title: 'La Cantera Viva', lat: 41.3953, lng: 2.1619, text: 'Piedra que parece respirar. Gaudí no diseñó un edificio, esculpió una montaña en medio de la ciudad.', aiPrompt: 'la pedrera stone waves organic' },
            { id: 'm3', title: 'El Bosque de Piedra', lat: 41.4036, lng: 2.1744, text: 'Entra y mira hacia arriba. No es una iglesia, es un bosque sagrado donde la luz juega entre las ramas de columnas infinitas.', aiPrompt: 'sagrada familia interior light forest columns' }
        ]
    }
];

const TourSystem = {
    activeTour: null,
    currentChapterIndex: -1,
    polylines: [],
    markers: [],

    // State
    isPlayerOpen: false,
    isPlayingAudio: false,

    init() {
        console.log("TourSystem Initialized");
        this.injectPlayerHTML();
    },

    injectPlayerHTML() {
        if (document.getElementById('tour-player')) return;
        const div = document.createElement('div');
        div.id = 'tour-player';
        div.className = 'tour-player-overlay';
        div.innerHTML = `
            <div class="tp-header">
                <div class="tp-series-title" id="tp-series">NOMBRE SERIE</div>
                <button class="tp-close-btn" onclick="TourSystem.minizePlayer()">
                    <span class="material-icons">expand_more</span>
                </button>
            </div>
            <div class="tp-content">
                <span class="tp-chapter-indicator" id="tp-chapter-num">CAPÍTULO 1</span>
                <h2 class="tp-title" id="tp-title">Título del Capítulo</h2>
                <div class="tp-body" id="tp-text">Texto de la historia...</div>
                
                <div class="tp-controls">
                    <button class="tp-btn tp-btn-secondary" id="tp-audio-btn" onclick="TourSystem.toggleAudio()">
                        <span class="material-icons">volume_up</span>
                        <span id="tp-audio-label">Escuchar</span>
                    </button>
                    <button class="tp-btn tp-btn-primary" id="tp-next-btn" onclick="TourSystem.nextChapter()">
                        <span>Siguiente</span>
                        <span class="material-icons">arrow_forward</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },

    openModal() {
        // Create modal structure if not exists
        let tm = document.getElementById('tours-modal');
        if (!tm) {
            tm = document.createElement('div');
            tm.id = 'tours-modal';
            tm.className = 'modal-overlay';
            tm.innerHTML = `
                <div class="modal-card wide">
                    <div class="modal-header">
                        <h2 class="modal-title"><i class="fa-solid fa-route" style="color:#f59e0b;"></i> Rutas Guiadas</h2>
                        <button class="close-btn" onclick="TourSystem.closeModal()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <!-- Search/Create Bar -->
                    <div style="margin-bottom:16px; display:flex; gap:8px;">
                        <input type="text" id="tour-topic-input" class="gmaps-search-input" style="flex:1;" placeholder="Ej. 'Segunda Guerra Mundial', 'Templarios en París'...">
                        <button class="gmaps-action-btn primary" onclick="TourSystem.handleCreateClick()">
                            <span class="material-icons">auto_awesome</span> Crear Aventura
                        </button>
                    </div>

                    <div id="tours-grid" class="tour-grid"></div>

                    <!-- Generator Overlay -->
                    <div id="tour-generator" class="generator-overlay generator-hidden">
                        <div class="gen-spinner"></div>
                        <div class="gen-status" id="gen-status-text">Consultando archivos históricos...</div>
                        <div class="gen-sub">Chronos AI está analizando millones de registros</div>
                    </div>
                </div>
            `;
            document.body.appendChild(tm);

            // Focus Handling
            const input = document.getElementById('tour-topic-input');
            if (input) input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') TourSystem.handleCreateClick();
            });
        }

        this.renderList();
        tm.classList.remove('hidden');
    },

    closeModal() {
        if (document.getElementById('tours-modal')) document.getElementById('tours-modal').classList.add('hidden');
    },

    renderList() {
        const grid = document.getElementById('tours-grid');
        grid.innerHTML = '';

        // 1. Create New Card (Visual shortcut)
        const createCard = document.createElement('div');
        createCard.className = 'tour-card create-new';
        createCard.onclick = () => document.getElementById('tour-topic-input').focus();
        createCard.innerHTML = `
            <div class="create-icon"><span class="material-icons">add_location_alt</span></div>
            <div class="tour-title">Nueva Aventura</div>
            <div class="tour-desc">Escribe cualquier tema o lugar histórico y la IA generará una ruta única para ti.</div>
        `;
        grid.appendChild(createCard);

        // 2. Existing Tours
        TOURS_DATA.forEach(tour => {
            const el = document.createElement('div');
            el.className = 'tour-card';
            el.onclick = () => this.startTour(tour);
            el.innerHTML = `
                <div class="tour-img-container">
                    <img src="${tour.image}" class="tour-img">
                    <div class="tour-badge">${tour.duration}</div>
                </div>
                <div class="tour-info">
                    <div class="tour-title">${tour.title}</div>
                    <div class="tour-desc">${tour.desc}</div>
                    <div class="tour-meta">
                        <span>${tour.difficulty}</span>
                        <span>${tour.chapters.length} Capítulos</span>
                    </div>
                </div>
            `;
            grid.appendChild(el);
        });
    },

    async handleCreateClick() {
        const input = document.getElementById('tour-topic-input');
        const topic = input.value.trim();
        if (!topic) return alert("Por favor, escribe un tema histórico.");

        this.generateRoute(topic);
    },

    async generateRoute(topic) {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            return alert("El servicio de Google Maps no está disponible en este momento.");
        }

        // Show Loading
        const overlay = document.getElementById('tour-generator');
        const status = document.getElementById('gen-status-text');
        overlay.classList.remove('generator-hidden');

        try {
            status.innerText = `Investigando sobre "${topic}"...`;

            // 1. Search Google Places
            const service = new google.maps.places.PlacesService(window.map || document.createElement('div'));

            const results = await new Promise((resolve, reject) => {
                const request = {
                    query: `Historical sites related to ${topic}`,
                    fields: ['name', 'geometry', 'photos', 'formatted_address', 'place_id']
                };
                service.textSearch(request, (res, stat) => {
                    if (stat === google.maps.places.PlacesServiceStatus.OK) resolve(res);
                    else resolve([]); // Graceful fail
                });
            });

            if (!results || results.length === 0) throw new Error("No se encontraron lugares.");

            status.innerText = "Diseñando ruta narrativa...";
            await new Promise(r => setTimeout(r, 1500)); // Fake delay for UX feeling

            // 2. Process Results (Take top 4-5)
            const topPlaces = results.slice(0, 5);

            // 3. Construct Tour Object
            const generatedTour = {
                id: 'gen_' + Date.now(),
                title: `Ruta: ${topic}`,
                desc: `Una aventura única generada por Chronos AI sobre ${topic}.`,
                difficulty: 'Variable',
                duration: `${topPlaces.length * 20} min`,
                color: '#ec4899', // Pink for AI
                image: topPlaces[0].photos ? topPlaces[0].photos[0].getUrl({ maxWidth: 400 }) : `https://image.pollinations.ai/prompt/${encodeURIComponent(topic + " history")}?nologo=true`,
                chapters: topPlaces.map((p, i) => ({
                    id: `g_${i}`,
                    title: p.name,
                    lat: p.geometry.location.lat(),
                    lng: p.geometry.location.lng(),
                    text: `Descubre la maravillosa historia de ${p.name}. Este lugar ha sido seleccionado por la IA como un punto clave para entender ${topic}.`, // Placeholder
                    aiPrompt: `${topic} ${p.name} vintage historical`
                }))
            };

            status.innerText = "¡Ruta lista!";
            await new Promise(r => setTimeout(r, 500));

            overlay.classList.add('generator-hidden');
            this.startTour(generatedTour);

        } catch (e) {
            console.error(e);
            overlay.classList.add('generator-hidden');
            alert(`No pude generar una ruta para "${topic}". Intenta ser más específico (ej. "Roma Antigua", "Paris Medieval").`);
        }
    },

    startTour(tour) {
        this.closeModal();
        this.activeTour = tour;
        this.currentChapterIndex = 0;
        this.clearMap();
        this.drawRoute();

        // Start Chapter 1
        this.playChapter(0);

        showToast(`Iniciando: ${tour.title}`, 'auto_awesome', tour.color);
    },

    drawRoute() {
        if (!window.chronosMap) return;

        const path = this.activeTour.chapters.map(c => ({ lat: c.lat, lng: c.lng }));

        const polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: this.activeTour.color,
            strokeOpacity: 0.8,
            strokeWeight: 5
        });
        polyline.setMap(window.chronosMap);
        this.polylines.push(polyline);

        this.activeTour.chapters.forEach((chap, i) => {
            const marker = new google.maps.Marker({
                position: { lat: chap.lat, lng: chap.lng },
                map: window.chronosMap,
                label: { text: (i + 1) + "", color: "white" },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: i === 0 ? "#10b981" : this.activeTour.color, // Green for start
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2
                },
                title: chap.title
            });
            marker.addListener('click', () => {
                this.currentChapterIndex = i;
                this.playChapter(i);
            });
            this.markers.push(marker);
        });

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        window.chronosMap.fitBounds(bounds);
    },

    playChapter(index) {
        if (!this.activeTour) return;
        const chap = this.activeTour.chapters[index];

        // Pan Map
        window.chronosMap.panTo({ lat: chap.lat, lng: chap.lng });
        window.chronosMap.setZoom(18);

        // Update UI
        document.getElementById('tp-series').innerText = this.activeTour.title;
        document.getElementById('tp-chapter-num').innerText = `CAPÍTULO ${index + 1}/${this.activeTour.chapters.length}`;
        document.getElementById('tp-title').innerText = chap.title;
        document.getElementById('tp-text').innerText = chap.text;

        const nextBtn = document.getElementById('tp-next-btn');
        if (index >= this.activeTour.chapters.length - 1) {
            nextBtn.innerHTML = '<span>Completar Ruta</span> <span class="material-icons">flag</span>';
            nextBtn.onclick = () => this.finishTour();
        } else {
            nextBtn.innerHTML = '<span>Siguiente</span> <span class="material-icons">arrow_forward</span>';
            nextBtn.onclick = () => this.nextChapter();
        }

        // Show Player
        document.getElementById('tour-player').classList.add('active');

        // Auto-Play Audio (optional, user requested "Auto opcional"). Let's start silent.
        this.stopAudio();
    },

    toggleAudio() {
        if (this.isPlayingAudio) {
            this.stopAudio();
        } else {
            const text = this.activeTour.chapters[this.currentChapterIndex].text;
            this.speak(text);
        }
    },

    speak(text) {
        if (window.toggleNarrator) {
            // Use existing robust narrator from app.js
            window.toggleNarrator(text);
            this.isPlayingAudio = true;
            this.updateAudioUI(true);

            // Hook into the onend of app.js narrator if possible, or poll state
            // For now, simpler UI toggle
        }
    },

    stopAudio() {
        if (window.stopAudio) window.stopAudio();
        this.isPlayingAudio = false;
        this.updateAudioUI(false);
    },

    updateAudioUI(playing) {
        const btn = document.getElementById('tp-audio-btn');
        const label = document.getElementById('tp-audio-label');
        if (playing) {
            btn.classList.add('playing');
            btn.innerHTML = `
                <div class="audio-wave">
                    <div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div>
                </div>
                <span>Narrando...</span>
            `;
        } else {
            btn.classList.remove('playing');
            btn.innerHTML = `<span class="material-icons">volume_up</span><span>Escuchar</span>`;
        }
    },

    nextChapter() {
        this.stopAudio();
        this.currentChapterIndex++;
        if (this.currentChapterIndex < this.activeTour.chapters.length) {
            this.playChapter(this.currentChapterIndex);
        }
    },

    finishTour() {
        this.stopAudio();
        this.minizePlayer();
        showToast(`¡Ruta Completada! +500 XP`, 'emoji_events', '#f59e0b');
        // Award XP
        if (window.playerState) {
            window.playerState.xp += 500;
            window.checkAchievements && window.checkAchievements();
            window.savePlayerState && window.savePlayerState();
        }
        this.clearMap();
    },

    minizePlayer() {
        document.getElementById('tour-player').classList.remove('active');
    },

    clearMap() {
        this.polylines.forEach(p => p.setMap(null));
        this.markers.forEach(m => m.setMap(null));
        this.polylines = [];
        this.markers = [];
    }
};

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TourSystem.init());
} else {
    TourSystem.init();
}

window.TourSystem = TourSystem;
