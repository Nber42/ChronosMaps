// Fix para Chronodex Modal ID
// Este script corrige el problema del modal ID sin modificar app.js

(function () {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFix);
    } else {
        applyFix();
    }

    function applyFix() {
        // Sobrescribir las funciones de Chronodex con las versiones corregidas
        window.openChronedex = function () {
            const grid = document.getElementById('chronodex-grid');
            grid.innerHTML = '';
            if (playerState.chronedex.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#6b7280;">Aún no hay descubrimientos.</div>';
            } else {
                [...playerState.chronedex].reverse().forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'dex-item';
                    const imgUrl = item.image || `https://image.pollinations.ai/prompt/map location ${item.name}?nologo=true`;
                    el.innerHTML = `<img src="${imgUrl}" class="dex-img" loading="lazy"><div class="dex-info"><div class="dex-name">${item.name}</div></div>`;
                    el.onclick = () => {
                        closeChronedex();
                        map.panTo({ lat: item.lat, lng: item.lng });
                        map.setZoom(16);
                        handleMapClick(item.lat, item.lng);
                    };
                    grid.appendChild(el);
                });
            }
            // FIX: Usar chronodex-modal-v2
            document.getElementById('chronodex-modal-v2').classList.remove('hidden');
        };

        // FIX: Usar chronodex-modal-v2
        window.closeChronedex = () => document.getElementById('chronodex-modal-v2').classList.add('hidden');

        console.log('✅ Chronodex fix aplicado correctamente');
    }
})();
