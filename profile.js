/**
 * CHRONOS PROFILE SYSTEM (AAA)
 * Handles the minimalist player hub, stats, and settings.
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
    ]
};

const ProfileSystem = {
    isOpen: false,

    init() {
        // Initialization if needed
    },

    open() {
        this.isOpen = true;
        this.render();
        document.getElementById('profile-overlay').classList.remove('hidden');
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.classList.add('u-hidden');
    },

    close() {
        this.isOpen = false;
        document.getElementById('profile-overlay').classList.add('hidden');
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.classList.remove('u-hidden');
    },

    render() {
        const p = window.playerState;
        if (!p) return;

        // Render Header
        document.getElementById('p-avatar').innerText = p.avatar || '🤠';
        document.getElementById('p-username').innerText = `@${p.username || 'Explorador'}`;
        const currentTitle = PROFILE_CONFIG.TITLES.slice().reverse().find(t => p.level >= t.req) || PROFILE_CONFIG.TITLES[0];
        document.getElementById('p-title').innerText = currentTitle.name;

        // Render Stats
        document.getElementById('stat-count-places').innerText = p.stats.discoveries || 0;
        document.getElementById('stat-count-badges').innerText = p.badges ? p.badges.length : 0;
        document.getElementById('stat-count-streak').innerText = `${p.stats.streak || 1}d`;
        document.getElementById('stat-count-xp-total').innerText = p.totalXp || p.xp || 0;

        // Render Level Progress
        const nextLevelXP = p.level * 1000;
        const progress = Math.min((p.xp / nextLevelXP) * 100, 100);
        document.getElementById('p-level-display').innerText = `NIVEL ${p.level}`;
        document.getElementById('p-xp-text').innerText = `${p.xp} / ${nextLevelXP} XP`;
        document.getElementById('p-xp-bar').style.setProperty('--progress-pct', `${progress}%`);

        // Render Achievements Scroll
        this.renderBadgesScroll();

        // Render Settings Data
        document.getElementById('p-email-display').innerText = p.email || 'anonimo@chronos.app';
        document.getElementById('p-joined-display').innerText = new Date(p.joinedDate || Date.now()).toLocaleDateString();
        document.getElementById('p-bio-display').innerText = p.bio || "Explorando el mundo un lugar a la vez 🌍";
    },

    renderBadgesScroll() {
        const container = document.getElementById('badges-scroll-container');
        if (!container) return;

        let html = '';
        Object.values(window.BADGES || {}).forEach(badge => {
            const unlocked = window.playerState.badges.includes(badge.id);
            html += `
                <div class="badge-m ${unlocked ? '' : 'locked'}" title="${badge.desc}">
                    <div class="badge-icon-m">
                        <i class="fa-solid ${badge.icon}"></i>
                    </div>
                    <span class="badge-name-m">${badge.name}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    toggleAccordion(btn) {
        const group = btn.parentElement;
        const isActive = group.classList.contains('active');

        // Close all
        document.querySelectorAll('.setting-group-m').forEach(g => {
            g.classList.remove('active');
            const icon = g.querySelector('.material-icons');
            if (icon) icon.innerText = 'expand_more';
        });

        // Toggle current
        if (!isActive) {
            group.classList.add('active');
            btn.querySelector('.material-icons').innerText = 'expand_less';
        }
    },

    toggleEditMode() {
        const newName = prompt("Introduce tu nuevo nombre de usuario:", window.playerState.username);
        if (newName && newName.trim() !== "") {
            window.playerState.username = newName.trim();
            this.render();
            if (window.showToast) window.showToast("Perfil actualizado", "check");
            if (window.savePlayerState) window.savePlayerState();
        }
    },

    openSettings() {
        const settingsSection = document.querySelector('.settings-minimal');
        if (settingsSection) {
            settingsSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    toggleDarkMode(enabled) {
        document.body.classList.toggle('dark-mode', enabled);
        if (window.showToast) window.showToast(enabled ? "Modo oscuro activado" : "Modo claro activado", "visibility");
    },

    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.playerState));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "chronos_profile_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        if (window.showToast) window.showToast("Datos exportados", "download");
    }
};

window.ProfileSystem = ProfileSystem;
