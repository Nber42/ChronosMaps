/**
 * CHRONOS PROFILE SYSTEM (AAA)
 * Handles the full-screen player hub, stats, and avatar customization.
 */

const PROFILE_CONFIG = {
    AVATARS: ['🧑‍🎓', '🧭', '👑', '🗺️', '🏛️', '👻', '📚', '⚔️', '🌍', '🔍', '🤠', '👩‍🚀', '🧙‍♂️', '🧛‍♀️', '🧟‍♂️'],
    TITLES: [
        { name: "Explorador Novato", req: 0 },
        { name: "Historiador Aprendiz", req: 5 },
        { name: "Cazador de Curiosidades", req: 10 },
        { name: "Maestro Viajero", req: 25 },
        { name: "Leyenda Viviente", req: 50 },
        { name: "Guardián de la Historia", req: 100 }
    ],
    XP_TABLE: [
        1000, 2000, 3000, 4000, 5000, // 1-5
        7000, 9000, 11000, 13000, 15000 // 6-10 ... simplified for prototype
    ]
};

const ProfileSystem = {
    isOpen: false,

    init() {
        // Event Listeners for Tab Switching
        document.querySelectorAll('.profile-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    },

    open() {
        this.isOpen = true;
        this.render();
        document.getElementById('profile-overlay').classList.remove('hidden');
        document.getElementById('ui-layer').style.opacity = '0'; // Hide HUD
    },

    close() {
        this.isOpen = false;
        document.getElementById('profile-overlay').classList.add('hidden');
        document.getElementById('ui-layer').style.opacity = '1';
    },

    switchTab(tabId) {
        // Update Buttons
        document.querySelectorAll('.profile-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.profile-tab-btn[data-tab="${tabId}"]`).classList.add('active');

        // Update Content
        document.querySelectorAll('.profile-tab-content').forEach(content => content.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    },

    render() {
        this.renderHeader();
        this.renderStats();
        this.renderDiscoveries();
        this.renderBadges();
    },

    getBorderClass(level) {
        if (level > 50) return 'border-diamond';
        if (level > 25) return 'border-gold';
        if (level > 10) return 'border-silver';
        return 'border-bronze';
    },

    requiredXP(level) {
        return level * 1000; // Simplified logic, can use table later
    },

    renderHeader() {
        const p = window.playerState;
        const nextLevelXP = this.requiredXP(p.level);
        const progress = Math.min((p.xp / nextLevelXP) * 100, 100);

        // Update DOM elements
        document.getElementById('p-avatar').innerText = p.avatar || '🤠';
        document.getElementById('p-avatar-container').className = `p-avatar-wrapper ${this.getBorderClass(p.level)}`;
        document.getElementById('p-username').innerText = `@${p.username || 'Explorador'}`;

        // Title logic
        const currentTitle = PROFILE_CONFIG.TITLES.slice().reverse().find(t => p.level >= t.req) || PROFILE_CONFIG.TITLES[0];
        document.getElementById('p-title').innerText = currentTitle.name;

        document.getElementById('p-bio').innerText = p.bio || "Explorando el mundo un lugar a la vez 🌍";
        document.getElementById('p-joined').innerText = `📅 Miembro desde: ${new Date(p.joinedDate || Date.now()).toLocaleDateString()}`;

        // Level & Bar
        document.getElementById('p-level-display').innerText = `NIVEL ${p.level}`;
        document.getElementById('p-xp-bar').style.width = `${progress}%`;
        document.getElementById('p-xp-text').innerText = `${p.xp} / ${nextLevelXP} XP`;
    },

    renderStats() {
        const p = window.playerState;
        document.getElementById('stat-count-places').innerText = p.stats.discoveries;
        document.getElementById('stat-count-checkins').innerText = p.stats.checkins || 0;
        document.getElementById('stat-count-streak').innerText = `${p.stats.streak || 1}d`;
    },

    renderDiscoveries() {
        const container = document.getElementById('tab-discoveries');
        const p = window.playerState;

        if (!p.chronedex || p.chronedex.length === 0) {
            container.innerHTML = '<div class="empty-msg">Aún no has descubierto nada. ¡Ve al mapa!</div>';
            return;
        }

        let html = '<div class="discovery-list">';
        [...p.chronedex].reverse().forEach((item, index) => {
            html += `
                <div class="discovery-item-card" onclick="ProfileSystem.viewDiscovery(${p.chronedex.length - 1 - index})">
                    <img src="${item.image}" class="dsc-thumb" loading="lazy">
                    <div class="dsc-info">
                        <div class="dsc-top">
                            <span class="dsc-name">${item.name}</span>
                            <span class="dsc-rarity ${item.rarity.class}">${item.rarity.label || 'Común'}</span>
                        </div>
                        <div class="dsc-meta">
                            <span><i class="fa-solid fa-calendar"></i> ${new Date(item.date).toLocaleDateString()}</span>
                            <span style="color:#f59e0b">+${item.rarity.xp || 10} XP</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    viewDiscovery(index) {
        const item = window.playerState.chronedex[index];
        if (!item) return;

        // Close profile
        this.close();

        // Pan to location
        if (window.map) {
            window.map.panTo({ lat: item.lat, lng: item.lng });
            window.map.setZoom(17);
        }

        // Show in side panel. 
        // We don't have a placeId here, so we pass full data as chronosData.
        // The side panel will show the item.image (which is the real Google photo or fallback)
        window.showPlaceInPanel(null, {
            nombre: item.name,
            direccion: item.direccion || "Coleccionado en Chronedex",
            informacion_historica: item.informacion_historica || "",
            imagen_real: item.image,
            rarity: item.rarity,
            verified: item.verified,
            lat: item.lat,
            lng: item.lng
        });
    },

    renderBadges() {
        const container = document.getElementById('tab-badges');
        // Re-use logic from app.js but improved
        let html = '<div class="badges-grid-large">';

        Object.values(window.BADGES).forEach(badge => {
            const unlocked = window.playerState.badges.includes(badge.id);
            html += `
                <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="badge-icon-large" style="background:${unlocked ? badge.color : '#374151'}">
                        <i class="fa-solid ${badge.icon}" style="color:${unlocked ? 'white' : '#6b7280'}"></i>
                    </div>
                    <div class="badge-text">
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-desc">${badge.desc}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }
};

// Global Exposure
window.ProfileSystem = ProfileSystem;
