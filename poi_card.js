/**
 * POI Quick Card Component (Vanilla JS) - Updated for Before/After & AI
 */
class POIQuickCard {
    constructor() {
        this.card = null;
        this.currentPlaceId = null;
        this._init();
    }

    _init() {
        if (document.getElementById('poi-quick-card')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'poi-quick-card';
        wrapper.className = 'poi-quick-card';

        wrapper.innerHTML = `
            <div class="poi-card-content">
                <button class="poi-close-btn" onclick="POIQuickCardInstance.hide()">
                    <i class="material-icons">close</i>
                </button>
                
                <div class="poi-card-inner">
                    <!-- Image Wrapper with Compare Toggle -->
                    <div class="poi-img-wrapper" id="poi-img-wrapper">
                        <!-- Images injected here -->
                        <div class="skeleton skeleton-img u-h-full"></div>
                    </div>

                    <!-- Body -->
                    <div class="poi-info-body">
                        <div class="poi-tags" id="poi-tags">
                            <div class="skeleton skeleton-text u-w-50"></div>
                        </div>

                        <h2 class="poi-title" id="poi-title">
                            <div class="skeleton skeleton-title"></div>
                        </h2>
                        
                        <!-- AI Insight Section -->
                        <div id="poi-ai-content" class="u-hidden"></div>
                        
                        <div class="poi-subtitle" id="poi-subtitle">
                            <div class="skeleton skeleton-text"></div>
                        </div>

                        <div class="poi-actions" id="poi-actions">
                            <div class="skeleton skeleton-btn"></div>
                            <div class="skeleton skeleton-btn"></div>
                            <div class="skeleton skeleton-btn"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);
        this.card = wrapper;
    }

    show(basicData) {
        this.currentPlaceId = basicData.id || `temp_${Date.now()}`;
        this.card.classList.add('active');
        this.renderSkeleton();

        // Optimistic UI: If name exists, show it, otherwise keep skeleton
        if (basicData.name) {
            this.updateBasicInfo(basicData);
        }

        if (window.chronosMap) {
            const offsetLat = basicData.lat - 0.002;
            window.chronosMap.panTo({ lat: offsetLat, lng: basicData.lng });
            if (window.chronosMap.getZoom() < 16) window.chronosMap.setZoom(16);
        }
    }

    renderSkeleton() {
        document.getElementById('poi-img-wrapper').innerHTML = '<div class="skeleton skeleton-img u-h-full"></div>';
        // Reset text to empty so skeleton is visible if no data
        document.getElementById('poi-title').innerHTML = '<div class="skeleton skeleton-title"></div>';
        document.getElementById('poi-subtitle').innerHTML = '<div class="skeleton skeleton-text"></div>';
        document.getElementById('poi-tags').innerHTML = '<div class="skeleton skeleton-text u-w-50"></div>';
        document.getElementById('poi-ai-content').classList.add('u-hidden');
        document.getElementById('poi-actions').innerHTML = `
            <div class="skeleton skeleton-btn"></div>
            <div class="skeleton skeleton-btn"></div>
            <div class="skeleton skeleton-btn"></div>
        `;
    }

    // Called for intermediate updates (e.g. from nearbySearch before details)
    updateBasicInfo(data) {
        if (data.name) {
            document.getElementById('poi-title').textContent = data.name;
        }
        if (data.vicinity) {
            document.getElementById('poi-subtitle').textContent = data.vicinity;
        }
    }

    updateContent(fullData) {
        // 1. Dual Images (Before / After)
        const imgPast = fullData.pastImgUrl || fullData.imagen_real;
        const imgPresent = fullData.imagen_real || 'https://via.placeholder.com/400x200?text=No+Present+Image';

        const wrapper = document.getElementById('poi-img-wrapper');
        wrapper.innerHTML = `
            <img src="${imgPast}" class="poi-header-image img-past" alt="Pasado">
            <img src="${imgPresent}" class="poi-header-image img-present" id="img-present-layer" alt="Presente">
            
            <div class="poi-time-toggle">
                <button class="time-btn active" onclick="POIQuickCardInstance.toggleTime('past', this)">ANTES</button>
                <button class="time-btn" onclick="POIQuickCardInstance.toggleTime('present', this)">AHORA</button>
            </div>
        `;

        // 2. Text Info
        document.getElementById('poi-title').textContent = fullData.nombre;

        // 3. AI Insight
        const aiBox = document.getElementById('poi-ai-content');
        if (fullData.aiCuriosity) {
            aiBox.innerHTML = window.safeHTML(`
                <div class="poi-ai-box">
                    <div class="poi-ai-header"><i class="material-icons">auto_awesome</i> Chronos AI</div>
                    <div class="poi-ai-text">"${fullData.aiCuriosity}"</div>
                </div>
            `);
            aiBox.classList.remove('u-hidden');
        } else {
            aiBox.classList.add('u-hidden');
        }

        document.getElementById('poi-subtitle').textContent = fullData.direccion || "";

        // 4. Tags
        const tagsContainer = document.getElementById('poi-tags');
        const rObj = fullData.rarity || {};
        const rId = rObj.id || rObj.class || 'common';
        const rLabel = rObj.label || 'Común';

        tagsContainer.innerHTML = `
            <span class="poi-badge rarity-${rId}">${rLabel}</span>
            <span class="poi-category">
                <i class="material-icons u-font-14">place</i> 
                ${fullData.types ? (fullData.types[0] || 'Lugar').replace('_', ' ') : 'Lugar'}
            </span>
        `;

        // 5. Actions
        this.renderActions(fullData);
    }

    toggleTime(mode, btn) {
        const parent = btn.parentElement;
        parent.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const presentLayer = document.getElementById('img-present-layer');
        if (mode === 'present') {
            presentLayer.classList.add('active');
        } else {
            presentLayer.classList.remove('active');
        }
    }

    renderActions(data) {
        const actionsContainer = document.getElementById('poi-actions');
        let isDiscovered = false;
        if (window.ChronodexSystem) {
            const status = window.ChronodexSystem.getDiscoveryStatus(data.id);
            isDiscovered = status.discovered;
        }

        const xp = (data.rarity && data.rarity.xp) ? data.rarity.xp : 10;

        const discoverBtn = isDiscovered
            ? `<button class="poi-btn poi-btn-primary discovered">
                 <span class="material-icons poi-btn-icon">check_circle</span>
                 <span>Descubierto</span>
               </button>`
            : `<button class="poi-btn poi-btn-primary" onclick="POIQuickCardInstance.handleDiscover('${encodeURIComponent(JSON.stringify(data))}')">
                 <span class="material-icons poi-btn-icon">bookmark_add</span>
                 <span>Descubrir (+${xp}XP)</span>
               </button>`;

        actionsContainer.innerHTML = `
            ${discoverBtn}
            <button class="poi-btn poi-btn-secondary poi-card-actions-special" onclick="POIQuickCardInstance.handleViewMore()">
                <span class="material-icons poi-btn-icon">menu_book</span>
                <span>Saber Más</span>
            </button>
        `;
    }

    handleDiscover(dataString) {
        const data = JSON.parse(decodeURIComponent(dataString));
        if (window.ChronodexSystem) {
            window.ChronodexSystem.discoverPlace(data);
            setTimeout(() => this.renderActions(data), 500);
        }
    }

    handleViewMore() {
        const data = window.currentPlaceData;
        if (data) {
            window.showPlaceInPanel(null, data);
            this.hide();
        }
    }

    handleDirections(lat, lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }

    hide() {
        this.card.classList.remove('active');
    }
}

window.POIQuickCardInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    window.POIQuickCardInstance = new POIQuickCard();
});
