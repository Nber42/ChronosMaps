/**
 * TRAVEL POSTER GENERATOR
 * Generates retro-style shareable images
 */

const PosterGenerator = {

    /**
     * Generates a poster from place data
     * @param {Object} placeData - {name, image, date, city}
     */
    generate: async function (placeData, callback) {
        console.log("🎨 Generando poster para:", placeData.name);

        // 1. Create Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 1080;
        const height = 1920; // Story format
        canvas.width = width;
        canvas.height = height;

        // 2. Load Assets
        try {
            const bgImage = await this.loadImage(placeData.image || 'https://via.placeholder.com/1080x1920?text=No+Image');

            // 3. Draw Background
            ctx.drawImage(bgImage, 0, 0, width, height);

            // 4. Draw Overlay Gradient (Vintage Filter)
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
            gradient.addColorStop(0.5, 'rgba(255,240,220,0.2)'); // Sepia tint
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 5. Draw Frame/Border
            ctx.lineWidth = 40;
            ctx.strokeStyle = "#f59e0b"; // Gold
            ctx.strokeRect(50, 50, width - 100, height - 100);

            // 6. Draw Typography
            ctx.shadowColor = "black";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "white";
            ctx.textAlign = "center";

            // Title
            ctx.font = "bold 80px 'Times New Roman', serif";
            ctx.fillText(placeData.name.toUpperCase(), width / 2, height - 400);

            // Subtitle
            ctx.font = "italic 40px 'Arial', sans-serif";
            ctx.fillText(`DESCUBIERTO EN CHRONOS MAPS`, width / 2, height - 320);

            // Date
            const date = new Date().toLocaleDateString();
            ctx.font = "30px monospace";
            ctx.fillText(date, width / 2, height - 250);

            // User
            if (window.playerState && window.playerState.username) {
                ctx.fillText(`Explorador: @${window.playerState.username}`, width / 2, height - 200);
            }

            // 7. Export
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // 8. Download Triger
            this.downloadImage(dataUrl, `chronos_${placeData.name.replace(/\s/g, '_')}.jpg`);

            if (callback) callback(true);

        } catch (e) {
            console.error("Error generating poster:", e);
            alert("Error al generar el poster. Intenta de nuevo.");
            if (callback) callback(false);
        }
    },

    loadImage: function (src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Important for external images
            img.onload = () => resolve(img);
            img.onerror = () => {
                // Fallback if CORS fails
                console.warn("CORS blocked image, using fallback color");
                const fallback = document.createElement('canvas');
                fallback.width = 1080;
                fallback.height = 1920;
                resolve(fallback);
            };
            img.src = src;
        });
    },

    downloadImage: function (dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

window.PosterGenerator = PosterGenerator;
