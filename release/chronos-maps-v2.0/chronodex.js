const CHRONODEX_CONFIG = {
    rarity: {
        COMMON: { chance: 0.80, xp: 25, label: "Común", color: "#9ca3af", stars: '⭐⭐' },      // 80%
        RARE: { chance: 0.15, xp: 75, label: "Raro", color: "#3b82f6", stars: '⭐⭐⭐' },         // 15%
        LEGENDARY: { chance: 0.05, xp: 200, label: "Ultra-Raro", color: "#eab308", stars: '⭐⭐⭐⭐⭐' } // 5%
    },
    levels: {
        NOVICE: { threshold: 0, title: "Novicio" },
        APPRENTICE: { threshold: 1000, title: "Aprendiz" }, // 1000 XP = 1 Nivel (Report 3.8)
        GUARDIAN: { threshold: 5000, title: "Guardián" },
        CHRONICLER: { threshold: 15000, title: "Cronista" },
        ELITE: { threshold: 50000, title: "Cronista Élite" }
    }
};

const Chronodex = {
    entries: [],

    init() {
        console.log("🟢 Chronodex System Initialized");
    },

    /**
     * Determine rarity based on place data (rating, user_ratings_total, types) or ID fallback
     */
    calculateRarity(placeOrId) {
        // 1. If it's a Place object with rating/reviews (Real Google Data)
        if (typeof placeOrId === 'object' && placeOrId !== null) {
            const p = placeOrId;
            const rating = p.rating || 0;
            const reviews = p.user_ratings_total || 0;
            const types = p.types || [];

            if (reviews > 5000 && rating >= 4.5) return CHRONODEX_CONFIG.rarity.LEGENDARY;
            if (reviews > 500 && rating >= 4.0) return CHRONODEX_CONFIG.rarity.RARE;
            if (types.includes('museum') || types.includes('tourist_attraction')) return CHRONODEX_CONFIG.rarity.RARE;
            return CHRONODEX_CONFIG.rarity.COMMON;
        }

        // 2. If it's a String ID (Manual/Generated fallback)
        if (typeof placeOrId === 'string') {
            let hash = 0;
            for (let i = 0; i < placeOrId.length; i++) hash = placeOrId.charCodeAt(i) + ((hash << 5) - hash);
            const rand = Math.abs(hash % 100) / 100;

            if (rand < 0.05) return CHRONODEX_CONFIG.rarity.LEGENDARY;
            if (rand < 0.20) return CHRONODEX_CONFIG.rarity.RARE;
            return CHRONODEX_CONFIG.rarity.COMMON;
        }

        return CHRONODEX_CONFIG.rarity.COMMON;
    },

    /**
     * Get discovery status for a place
     */
    getDiscoveryStatus(placeId) {
        const p = window.playerState;
        if (!p || !p.chronedex) return { discovered: false, visited: false };

        const entry = p.chronedex.find(item => item.id === placeId);
        if (!entry) return { discovered: false, visited: false };

        return {
            discovered: true,
            visited: entry.visited && entry.visited.physically,
            entry: entry
        };
    },

    /**
     * Render the "Discover" button for the side panel
     * Called by google-services.js
     */
    renderDiscoverButton(place, chronosData) {
        const placeId = place ? place.place_id : (chronosData ? chronosData.id : null);
        if (!placeId) return '';

        const rarity = this.calculateRarity(place);
        const status = this.getDiscoveryStatus(placeId);

        // Escape data for function call
        const placeDataSafe = encodeURIComponent(JSON.stringify({
            id: placeId,
            name: place ? place.name : chronosData.nombre,
            image: place && place.photos && place.photos.length > 0 ? place.photos[0].getUrl({ maxWidth: 500 }) : (chronosData.imagen_real || ''),
            location: place ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } : { lat: chronosData.lat, lng: chronosData.lng },
            address: place ? place.formatted_address : chronosData.direccion,
            rarity: rarity
        }));

        if (status.discovered) {
            return `
                <button class="discover-button discovered" disabled>
                    <div class="button-icon">
                        <span class="material-icons">check_circle</span>
                    </div>
                    <div class="button-content">
                        <span class="button-main-text">Descubierto</span>
                        <span class="button-sub-text">Guardado en Chronodex</span>
                    </div>
                </button>
            `;
        }

        return `
            <button class="discover-button" onclick="ChronodexSystem.discoverPlace(decodeURIComponent('${placeDataSafe}'))">
                <div class="button-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                    </svg>
                </div>
                <div class="button-content">
                    <span class="button-main-text">Descubrir y Guardar</span>
                    <span class="button-sub-text">+${rarity.xp} XP</span>
                </div>
                <div class="rarity-indicator ${rarity.id}"></div>
            </button>
        `;
    },

    /**
     * Main action when user clicks Discover
     */
    async discoverPlace(placeDataJson) {
        if (typeof placeDataJson === 'string') {
            placeDataJson = JSON.parse(placeDataJson);
        }

        console.log("Discovering:", placeDataJson);
        const place = placeDataJson;

        // 1. Play Sound & Show Animation
        if (window.SoundFX) window.SoundFX.playDiscovery(place.rarity);
        this.showDiscoveryAnimation(place);

        // 2. Save to State
        this.saveToChronodex(place);

        // 3. Update UI (re-render panel button if possible, or just reload panel)
        // We defer this slightly to let animation play
        setTimeout(() => {
            // Find the button and update it visually without full re-render if possible
            // But simpler to just let user enjoy the animation
        }, 1000);

        // 4. Update Profile Stats
        window.playerState.xp += place.rarity.xp;
        window.playerState.stats.discoveries++;

        // Save
        if (window.savePlayerState) window.savePlayerState();
    },

    saveToChronodex(place) {
        const entry = {
            id: place.id,
            name: place.name,
            image: place.image,
            date: new Date().toISOString(),
            rarity: place.rarity,
            location: place.location,
            address: place.address,
            visited: { physically: false } // Default
        };

        window.playerState.chronedex.push(entry);
    },

    showDiscoveryAnimation(place) {
        const overlay = document.createElement('div');
        overlay.className = 'discovery-overlay';

        overlay.innerHTML = `
            <div class="discovery-animation">
                <div class="light-burst"></div>
                
                <div class="place-card-reveal">
                    <div class="card-front">
                        <img src="${place.image}" alt="${place.name}">
                        <div class="card-reveal-rarity ${place.rarity.id}">
                            ${place.rarity.stars}
                        </div>
                    </div>
                    <div class="card-reveal-name">${place.name}</div>
                </div>
                
                <div class="discovery-text">
                    <h2>¡NUEVO DESCUBRIMIENTO!</h2>
                    <p class="place-name-large">${place.name}</p>
                    <p class="rarity-text-large" style="color:${place.rarity.color}">${place.rarity.label}</p>
                    <p class="xp-gained">+${place.rarity.xp} XP</p>
                </div>
                
                <div class="particles"></div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Generate particles
        const particlesContainer = overlay.querySelector('.particles');
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 2 + 's';
            particlesContainer.appendChild(p);
        }

        // Animation sequence
        setTimeout(() => overlay.classList.add('active'), 50);

        // Auto close and clean up
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                // Refresh panel to show "Discovered" state
                if (window.placesService && place.id) {
                    // If we have a way to refresh only the button, great. 
                    // Otherwise, we might just leave it until user re-opens or we force a re-render
                    // We can try to re-call showPlaceInPanel if we have the data, but we might lack the full 'place' object from Google
                    // A simple toast is nice too.
                    if (window.showToast) window.showToast('¡Guardado en Chronodex!', 'collections_bookmark', '#10b981');
                }
            }, 500);
        }, 3500);
    },

    /**
     * Opens the Main Chronodex Interface
     */
    openChronodex() {
        const modal = document.getElementById('chronodex-modal-v2');
        if (!modal) return;

        // Failsafe inline styles to override any white theme
        modal.style.background = 'rgba(0,0,0,0.85)';
        modal.style.backdropFilter = 'blur(12px)';

        const card = modal.querySelector('.chronodex-modal-card');
        if (card) {
            card.style.background = '#0f172a';
            card.style.color = 'white';
            card.style.border = '1px solid rgba(255,255,255,0.1)';
        }

        this.renderChronodexGrid();

        // Show modal
        modal.classList.remove('hidden');
    },

    renderChronodexGrid(filter = 'all', sortBy = 'recent') {
        const grid = document.getElementById('chronodex-grid');
        grid.innerHTML = '';

        const items = window.playerState.chronedex;

        // Calculate stats
        const total = 150; // Mock total
        const current = items.length;
        const pct = Math.floor((current / total) * 100);
        const rareCounts = {
            common: items.filter(i => i.rarity.id === 'common').length,
            rare: items.filter(i => i.rarity.id === 'rare').length,
            legendary: items.filter(i => i.rarity.id === 'legendary').length
        };

        // Add Progress Header
        const headerHTML = `
            <div class="chronodex-progress-section">
                <div style="display:flex; justify-content:space-between; color:white; font-size:14px; font-weight:bold; margin-bottom:8px;">
                    <span>PROGRESO GLOBAL</span>
                    <span>${current} / ${total}</span>
                </div>
                <div class="chronodex-progress-bar-bg">
                    <div class="chronodex-progress-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:12px;">
                    <span style="color:#aaa;">${pct}% completado</span>
                    <div style="display:flex; gap:12px; color:#aaa;">
                        <span>⭐⭐ ${rareCounts.common}</span>
                        <span>⭐⭐⭐ ${rareCounts.rare}</span>
                        <span>⭐⭐⭐⭐⭐ ${rareCounts.legendary}</span>
                    </div>
                </div>
            </div>
            
            <div class="chronodex-controls">
                <div class="chronodex-filters">
                    <button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="window.ChronodexSystem.renderChronodexGrid('all', '${sortBy}')">Todos</button>
                    <button class="filter-btn ${filter === 'legendary' ? 'active' : ''}" onclick="window.ChronodexSystem.renderChronodexGrid('legendary', '${sortBy}')">Legendarios</button>
                    <button class="filter-btn ${filter === 'rare' ? 'active' : ''}" onclick="window.ChronodexSystem.renderChronodexGrid('rare', '${sortBy}')">Raros</button>
                    <button class="filter-btn ${filter === 'visited' ? 'active' : ''}" onclick="window.ChronodexSystem.renderChronodexGrid('visited', '${sortBy}')">Visitados</button>
                </div>
                <select class="chronodex-sort-select" onchange="window.ChronodexSystem.renderChronodexGrid('${filter}', this.value)">
                    <option value="recent" ${sortBy === 'recent' ? 'selected' : ''}>Más recientes</option>
                    <option value="oldest" ${sortBy === 'oldest' ? 'selected' : ''}>Más antiguos</option>
                    <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Por nombre</option>
                    <option value="rarity" ${sortBy === 'rarity' ? 'selected' : ''}>Por rareza</option>
                </select>
            </div>
        `;

        // Create header container
        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = headerHTML;
        grid.appendChild(headerDiv);

        // Filter items
        let filteredItems = [...items];
        if (filter === 'legendary') filteredItems = items.filter(i => i.rarity.id === 'legendary');
        if (filter === 'rare') filteredItems = items.filter(i => i.rarity.id === 'rare');
        if (filter === 'visited') filteredItems = items.filter(i => i.visited && i.visited.physically);

        //  Sort items
        if (sortBy === 'recent') filteredItems.reverse();
        if (sortBy === 'oldest') filteredItems = filteredItems; // Already oldest first
        if (sortBy === 'name') filteredItems.sort((a, b) => a.name.localeCompare(b.name));
        if (sortBy === 'rarity') {
            const rarityOrder = { legendary: 3, rare: 2, common: 1 };
            filteredItems.sort((a, b) => (rarityOrder[b.rarity.id] || 0) - (rarityOrder[a.rarity.id] || 0));
        }

        // Create cards grid container
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'chronodex-grid-area';

        filteredItems.forEach(item => {
            const card = document.createElement('div');
            card.className = `chronodex-card ${item.rarity.id || 'common'}`;
            card.onclick = () => this.openCardDetail(item);

            card.innerHTML = `
                <div class="card-number">#${item.id.substring(0, 4)}</div>
                <div class="card-image-container">
                    <img src="${item.image}" class="card-image" loading="lazy" alt="${item.name}">
                    ${item.visited && item.visited.physically ? '<div class="card-badge-visited">✓ Visitado</div>' : ''}
                </div>
                <div class="card-info">
                    <h3 class="card-title">${item.name}</h3>
                    <div class="card-rarity-tag">${item.rarity.label}</div>
                    <div class="card-location">📍 ${item.address ? item.address.split(',')[0] : 'Desconocido'}</div>
                </div>
                <div class="card-shine"></div>
            `;
            cardsGrid.appendChild(card);
        });

        // Add some "Locked" placeholders
        for (let i = 0; i < Math.min(6, total - current); i++) {
            const locked = document.createElement('div');
            locked.className = 'chronodex-card locked';
            locked.innerHTML = `
                <div class="locked-content">
                    <span class="material-icons locked-icon">lock</span>
                    <span style="font-weight:bold;">???</span>
                    <span style="font-size:10px;">Por descubrir</span>
                </div>
            `;
            cardsGrid.appendChild(locked);
        }

        grid.appendChild(cardsGrid);
    },

    openCardDetail(item) {
        // Create full screen details
        const detail = document.createElement('div');
        detail.className = 'chronodex-detail-modal';
        detail.innerHTML = `
            <div class="detail-hero">
                <img src="${item.image}">
                <button class="detail-back-btn" onclick="this.closest('.chronodex-detail-modal').remove()">
                    <span class="material-icons">arrow_back</span>
                </button>
            </div>
            <div class="detail-content-area">
                <div class="detail-header-row">
                    <h1 class="detail-title">${item.name}</h1>
                    <span class="detail-stars">${item.rarity.stars}</span>
                </div>
                <p class="detail-location">📍 ${item.address}</p>
                
                <div class="detail-stats-card">
                    <h3 class="detail-section-label">Datos de Explorador</h3>
                    <div class="detail-stats-grid">
                        <div class="detail-stat-item">
                            <div class="stat-label">DESCUBIERTO</div>
                            <div class="stat-value">${new Date(item.date).toLocaleDateString()}</div>
                        </div>
                        <div class="detail-stat-item">
                            <div class="stat-label">XP GANADO</div>
                            <div class="stat-value xp">+${item.rarity.xp}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-collections-section">
                   <h3 class="detail-section-label">Colecciones</h3>
                   <div class="detail-tags-list">
                        <span class="category-tag">🌍 Iconos del Mundo</span>
                        <span class="category-tag">🏛️ Historia Viva</span>
                   </div>
                </div>
            </div>
        `;
        document.body.appendChild(detail);
    }
};

// Global Exposure
window.ChronodexSystem = Chronodex;

window.openChronodex = function () {
    if (window.ChronodexSystem) window.ChronodexSystem.openChronodex();
}

window.addToChronodex = function (place) {
    if (window.ChronodexSystem) window.ChronodexSystem.discoverPlace(place);
}

// Auto-initialize
window.ChronodexSystem.init();
