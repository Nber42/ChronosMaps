/**
 * CHRONOS DUELS SYSTEM
 * Reference: Executive Report Section 3.9 & 2.1
 * Logic: Simulated competitive quiz for MVP.
 */

const DuelSystem = {
    activeDuel: null,

    // Sample Question Database (Mock for MVP)
    // In full version, this comes from AI (Report 6.1)
    questionBank: [
        { q: "¿En qué año ocurrió este evento?", options: ["1492", "1812", "1945"], correct: 0 },
        { q: "¿Quién fue el personaje principal?", options: ["Napoleón", "Da Vinci", "César"], correct: 1 },
        { q: "¿Qué estilo arquitectónico es este?", options: ["Gótico", "Barroco", "Modernista"], correct: 2 }
    ],

    init() {
        console.log("DuelSystem Initialized");
        this.injectDuelUI();
    },

    injectDuelUI() {
        if (document.getElementById('duel-overlay')) return;
        const div = document.createElement('div');
        div.id = 'duel-overlay';
        div.className = 'duel-overlay hidden';
        div.innerHTML = `
            <div class="duel-card">
                <div class="duel-header">
                    <h3>⚔️ DUELO DE SABIDURÍA</h3>
                    <div class="duel-badass-text">Desafío por el título de Guardián</div>
                </div>
                <div class="duel-body" id="duel-content">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },

    startDuel(poiName) {
        this.activeDuel = {
            poi: poiName,
            score: 0,
            questionIndex: 0
        };

        const overlay = document.getElementById('duel-overlay');
        overlay.classList.remove('hidden');

        // Mock "Matchmaking" (Report 3.9: "Dos usuarios en el mismo POI")
        const content = document.getElementById('duel-content');
        content.innerHTML = `
            <div class="duel-searching">
                <div class="spinner"></div>
                <p>Buscando rival en ${poiName}...</p>
            </div>
        `;

        setTimeout(() => {
            this.showQuestion();
        }, 2000);
    },

    showQuestion() {
        if (this.activeDuel.questionIndex >= 3) {
            this.finishDuel();
            return;
        }

        const q = this.questionBank[Math.floor(Math.random() * this.questionBank.length)];
        // Ensure options are shuffled in a real app, strict mock here

        const content = document.getElementById('duel-content');
        content.innerHTML = `
            <div class="duel-question-box">
                <div class="duel-progress">Pregunta ${this.activeDuel.questionIndex + 1}/3</div>
                <h4 class="duel-q">${q.q}</h4>
                <div class="duel-options">
                    ${q.options.map((opt, i) => `
                        <button class="duel-opt-btn" onclick="DuelSystem.answer(${i}, ${q.correct})">${opt}</button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    answer(selected, correct) {
        if (selected === correct) this.activeDuel.score++;
        this.activeDuel.questionIndex++;
        this.showQuestion();
    },

    finishDuel() {
        const win = this.activeDuel.score >= 2;
        const xp = win ? 50 : 10; // 50 XP for win (Report 3.8)

        const content = document.getElementById('duel-content');
        content.innerHTML = `
            <div class="duel-result ${win ? 'win' : 'loss'}">
                <div class="duel-icon">${win ? '🏆' : '❌'}</div>
                <h2>${win ? '¡VICTORIA!' : 'DERROTA'}</h2>
                <p>${win ? 'Has defendido tu honor.' : 'Necesitas estudiar más.'}</p>
                <div class="duel-rewards">
                    <span>+${xp} XP</span>
                    ${win ? '<span class="guard-badge">Título: GUARDIÁN (7 días)</span>' : ''}
                </div>
                <button class="duel-close-btn" onclick="DuelSystem.close()">Cerrar</button>
            </div>
        `;

        // Award XP
        if (window.playerState) {
            window.playerState.xp += xp;
            window.updateProfileUI && window.updateProfileUI();
        }
    },

    close() {
        document.getElementById('duel-overlay').classList.add('hidden');
    }
};

window.DuelSystem = DuelSystem;
