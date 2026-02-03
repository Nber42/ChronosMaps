/**
 * VOICE GUIDE SYSTEM
 * Text-to-Speech engine for audio tours
 */

const VoiceGuide = {
    isSpeaking: false,
    utterance: null,

    init: function () {
        if ('speechSynthesis' in window) {
            console.log("🔊 Voice Guide Ready");
        } else {
            console.warn("❌ Web Speech API not supported");
        }
    },

    readText: function (text) {
        if (!text) return;

        // Stop current if any
        this.stop();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES'; // Force Spanish
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to select a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google')) || voices.find(v => v.lang.includes('es'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Events
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateUI(true);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateUI(false);
        };

        utterance.onerror = (e) => {
            console.error("Speech Error:", e);
            this.isSpeaking = false;
            this.updateUI(false);
        };

        this.utterance = utterance;
        window.speechSynthesis.speak(utterance);
    },

    stop: function () {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.updateUI(false);
    },

    toggle: function (text) {
        if (this.isSpeaking) {
            this.stop();
        } else {
            this.readText(text);
        }
    },

    updateUI: function (active) {
        const btn = document.getElementById('voice-btn');
        if (btn) {
            if (active) {
                btn.innerHTML = '🔇 Detener Audio';
                btn.classList.add('speaking');
                btn.style.background = '#ef4444';
            } else {
                btn.innerHTML = '🔊 Escuchar Historia';
                btn.classList.remove('speaking');
                btn.style.background = '#10b981'; // Green
            }
        }
    }
};

// Initialize voices (needs to load async in Chrome)
window.speechSynthesis.onvoiceschanged = () => {
    // Warm up voices
    window.speechSynthesis.getVoices();
};

window.VoiceGuide = VoiceGuide;
