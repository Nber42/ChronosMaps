/**
 * TEMPORAL RIFTS - SYSTEM V1
 * Mini-game mechanic for engagement
 */

const RiftSystem = {
    activeRifts: [],

    // Config
    SPAWN_CHANCE: 0.3, // 30% chance on significant movement
    RIFT_RADIUS: 100, // meters

    init: function () {
        console.log("🌀 Rift System Initialized");
        // Listen for map movement or location updates if possible
        // For MVP, we hook into the existing player movement or expose a check function
    },

    /**
     * Checks if a rift should spawn near the user
     */
    checkForSpawn: function (userLat, userLng) {
        if (Math.random() > this.SPAWN_CHANCE) return;

        // Don't spawn if one is already active nearby
        if (this.activeRifts.length > 0) return;

        console.log("⚡ SPAWNING TEMPORAL RIFT!");

        // Spawn randomly within 100m of user
        const offsetLat = (Math.random() - 0.5) * 0.002;
        const offsetLng = (Math.random() - 0.5) * 0.002;

        this.spawnRift({
            id: 'rift_' + Date.now(),
            lat: userLat + offsetLat,
            lng: userLng + offsetLng,
            era: this.getRandomEra()
        });
    },

    getRandomEra: function () {
        const eras = [
            { name: "Era Romana", color: "#e74c3c", icon: "🏛️" },
            { name: "Edad Media", color: "#8e44ad", icon: "🏰" },
            { name: "Revolución Industrial", color: "#d35400", icon: "⚙️" },
            { name: "Futuro Distópico", color: "#16a085", icon: "🚀" }
        ];
        return eras[Math.floor(Math.random() * eras.length)];
    },

    spawnRift: function (data) {
        this.activeRifts.push(data);

        // Create Marker on Google Maps
        if (window.map) {
            const marker = new google.maps.Marker({
                position: { lat: data.lat, lng: data.lng },
                map: window.map,
                title: "Falla Temporal",
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 15,
                    fillColor: data.era.color,
                    fillOpacity: 0.7,
                    strokeColor: "white",
                    strokeWeight: 2,
                },
                animation: google.maps.Animation.BOUNCE
            });

            // Add click listener
            marker.addListener("click", () => {
                this.openRiftChallenge(data);
            });

            data.marker = marker;

            // Audio cue
            if (window.SoundFX) window.SoundFX.play('rift_spawn');
            if (window.showToast) window.showToast(`⚠️ Falla Temporal detectada: ${data.era.name}`, 'warning', data.era.color);
        }
    },

    openRiftChallenge: function (rift) {
        const modal = document.createElement('div');
        modal.className = 'rift-modal-overlay';
        modal.innerHTML = `
            <div class="rift-modal-card">
                <div class="rift-header" style="background:${rift.era.color}">
                    <span class="rift-icon">${rift.era.icon}</span>
                    <h2>${rift.era.name}</h2>
                </div>
                <div class="rift-body">
                    <p>¡La línea temporal es inestable en esta zona!</p>
                    <p>Responde correctamente para cerrar la falla y ganar Chrono-Fragmentos.</p>
                    
                    <div class="rift-question">
                        <strong>Pregunta:</strong>
                        <p>${this.getQuestionForEra(rift.era.name)}</p>
                    </div>

                    <div class="rift-options">
                        <button onclick="RiftSystem.resolveRift(true, '${rift.id}')">Opción Correcta (Simulada)</button>
                        <button onclick="RiftSystem.resolveRift(false, '${rift.id}')">Opción Incorrecta</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    getQuestionForEra: function (eraName) {
        // Mock questions for MVP
        if (eraName.includes("Romana")) return "¿Qué material usaban principalmente los romanos para sus calzadas?";
        if (eraName.includes("Media")) return "¿Cuál era la función principal de un castillo?";
        return "¿En qué año ocurrió el evento clave de esta era?";
    },

    resolveRift: function (success, riftId) {
        // Remove modal
        document.querySelector('.rift-modal-overlay').remove();

        if (success) {
            alert("✅ ¡Falla estabilizada! +50 XP");
            // Remove rift from map
            const riftIndex = this.activeRifts.findIndex(r => r.id === riftId);
            if (riftIndex > -1) {
                this.activeRifts[riftIndex].marker.setMap(null);
                this.activeRifts.splice(riftIndex, 1);
            }
            // Add XP (assuming global playerState)
            if (window.playerState) {
                window.playerState.xp += 50;
                if (window.savePlayerState) window.savePlayerState();
            }
        } else {
            alert("❌ Fallaste. La falla se desvanece...");
            // Remove anyway
            const riftIndex = this.activeRifts.findIndex(r => r.id === riftId);
            if (riftIndex > -1) {
                this.activeRifts[riftIndex].marker.setMap(null);
                this.activeRifts.splice(riftIndex, 1);
            }
        }
    }
};

window.RiftSystem = RiftSystem;
