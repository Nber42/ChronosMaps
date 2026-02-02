/**
 * CHRONODEX SYSTEM
 * "Gotta catch 'em all" for History
 */

window.ChronodexSystem = {
    // Configuration
    RARITY_CONFIG: {
        COMMON: { id: 'common', label: 'Común', xp: 100, color: '#9ca3af', stars: '⭐⭐' },
        RARE: { id: 'rare', label: 'Raro', xp: 500, color: '#9333ea', stars: '⭐⭐⭐' },
        LEGENDARY: { id: 'legendary', label: 'LEGENDARIO', xp: 1000, color: '#f59e0b', stars: '⭐⭐⭐⭐⭐' }
    },

    COLLECTIONS: [
        {
            id: 'wonders_ancient',
            name: 'Maravillas del Mundo Antiguo',
            items: ['Pirámides de Giza', 'Coliseo Romano', 'Taj Mahal', 'Muralla China', 'Machu Picchu'] // Simplified for prototype
        },
        {
            id: 'europe_icons',
            name: 'Iconos de Europa',
            items: ['Torre Eiffel', 'Big Ben', 'Coliseo', 'Acrópolis', 'Sagrada Familia']
        }
    ],

    init() {
        console.log("Chronodex System Initialized");
        // Ensure style is loaded if not already
        if (!document.getElementById('chronodex-style')) {
            const link = document.createElement('link');
            link.id = 'chronodex-style';
            link.rel = 'stylesheet';
            link.href = 'chronodex.css';
            document.head.appendChild(link);
        }
    },

    /**
     * Determine rarity based on place data (rating, user_ratings_total, types)
     */
    calculateRarity(place) {
        if (!place) return this.RARITY_CONFIG.COMMON;

        // Logic: High rating + high reviews = Legendary/Rare
        const rating = place.rating || 0;
        const reviews = place.user_ratings_total || 0;
        const types = place.types || [];

        if (reviews > 10000 && rating >= 4.5) return this.RARITY_CONFIG.LEGENDARY;
        if (reviews > 1000 && rating >= 4.0) return this.RARITY_CONFIG.RARE;
        if (types.includes('museum') || types.includes('tourist_attraction')) return this.RARITY_CONFIG.RARE;

        return this.RARITY_CONFIG.COMMON;
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

        // 1. Show Animation
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
        const modal = document.getElementById('chronodex-modal');
        if (!modal) return;

        // Custom render for the modal content
        // We will replace the inner HTML of the modal-card if needed, or just the grid
        const grid = document.getElementById('chronodex-grid');

        // Inject Header if not present (hacky adaption to existing modal)
        const card = modal.querySelector('.modal-card');
        // We want a full screen or large view. Let's maximize it.
        card.style.maxWidth = '900px';
        card.style.maxHeight = '90vh';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';

        this.renderChronodexGrid();

        // Show modal
        modal.classList.remove('hidden');
    },

    renderChronodexGrid(filter = 'all') {
        const grid = document.getElementById('chronodex-grid');
        grid.innerHTML = '';
        grid.className = 'chronodex-grid-area'; // Use new class

        const items = window.playerState.chronedex;

        // Add Progress Header
        const total = 150; // Mock total
        const current = items.length;
        const pct = Math.floor((current / total) * 100);

        const headerHTML = `
            <div class="chronodex-progress-section">
                <div style="display:flex; justify-content:space-between; color:white; font-size:14px; font-weight:bold;">
                    <span>PROGRESO GLOBAL</span>
                    <span>${current} / ${total}</span>
                </div>
                <div class="chronodex-progress-bar-bg">
                    <div class="chronodex-progress-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div style="text-align:right; font-size:12px; color:#aaa;">${pct}% completado</div>
            </div>
            
            <div class="chronodex-filters">
                 <button class="filter-btn active">Todos</button>
                 <button class="filter-btn">Legendarios</button>
                 <button class="filter-btn">Europa</button>
            </div>
        `;

        // We need to inject this header before grid, but grid is the container. 
        // Ideally we structure the modal better. For now, we prepend.
        // Actually, let's put this in the parent of grid if possible, or just first element.
        // Simplified: Just render cards for now.

        // Sort by date desc
        const sorted = [...items].reverse();

        sorted.forEach(item => {
            const card = document.createElement('div');
            card.className = `chronodex-card ${item.rarity.id || 'common'}`;
            card.onclick = () => this.openCardDetail(item);

            card.innerHTML = `
                <div class="card-number">#${item.id.substring(0, 4)}</div>
                <div class="card-image-container">
                    <img src="${item.image}" class="card-image" loading="lazy">
                    ${item.visited && item.visited.physically ? '<div class="card-badge-visited">✓ Visitado</div>' : ''}
                </div>
                <div class="card-info">
                    <h3 class="card-title">${item.name}</h3>
                    <div class="card-rarity-tag">${item.rarity.label}</div>
                    <div class="card-location">📍 ${item.address ? item.address.split(',')[0] : 'Desconocido'}</div>
                </div>
                <div class="card-shine"></div>
            `;
            grid.appendChild(card);
        });

        // Add some "Locked" placeholders
        for (let i = 0; i < 3; i++) {
            const locked = document.createElement('div');
            locked.className = 'chronodex-card locked';
            locked.innerHTML = `
                <div class="locked-content">
                    <span class="material-icons locked-icon">lock</span>
                    <span style="font-weight:bold;">???</span>
                    <span style="font-size:10px;">Por descubrir</span>
                </div>
            `;
            grid.appendChild(locked);
        }
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
            <div style="padding: 20px; overflow-y:auto; flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h1 style="margin:0; font-size:24px;">${item.name}</h1>
                    <span style="font-size:20px;">${item.rarity.stars}</span>
                </div>
                <p style="color:#666; margin-top:5px;">📍 ${item.address}</p>
                
                <div style="margin-top:20px; padding:15px; background:#f9fafb; border-radius:12px;">
                    <h3 style="margin-top:0; font-size:14px; text-transform:uppercase; color:#888;">Datos de Explorador</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                        <div>
                            <div style="font-size:11px; color:#888;">DESCUBIERTO</div>
                            <div style="font-weight:bold;">${new Date(item.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; color:#888;">XP GANADO</div>
                            <div style="font-weight:bold; color:#10b981;">+${item.rarity.xp}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top:20px;">
                   <h3 style="font-size:16px;">Colecciones</h3>
                   <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
                        <span style="padding:5px 10px; background:#eee; border-radius:15px; font-size:12px;">🌍 Iconos del Mundo</span>
                        <span style="padding:5px 10px; background:#eee; border-radius:15px; font-size:12px;">🏛️ Historia Viva</span>
                   </div>
                </div>
            </div>
        `;
        document.body.appendChild(detail);
    }
};

window.openChronodex = function () {
    window.ChronodexSystem.openChronodex();
}

// Auto-initialize
window.ChronodexSystem.init();
