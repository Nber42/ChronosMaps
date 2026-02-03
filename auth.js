/**
 * Authentication Module for Chronos Maps
 * Handles user registration, login, and session management
 */

const AuthSystem = {
    currentUser: null,

    init: function () {
        // Check for existing session
        const savedUser = localStorage.getItem('chronos_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('✅ Session restored:', this.currentUser.username);
            } catch (e) {
                console.error('Failed to restore session:', e);
                localStorage.removeItem('chronos_user');
            }
        }
    },

    isLoggedIn: function () {
        return this.currentUser !== null;
    },

    getUserId: function () {
        return this.currentUser ? this.currentUser.userId : null;
    },

    showAuthModal: function () {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.switchAuthMode('login');
        }
    },

    hideAuthModal: function () {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
    },

    switchAuthMode: function (mode) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');

        if (mode === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
        } else {
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
        }
    },

    register: async function () {
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        if (!username || !password) {
            alert('❌ Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            alert('❌ Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            alert('❌ La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = { userId: data.userId, username: data.username };
                localStorage.setItem('chronos_user', JSON.stringify(this.currentUser));

                showToast(`✅ ¡Bienvenido, ${username}!`, 'check', '#10b981');
                this.hideAuthModal();

                // Reload page to initialize map properly
                setTimeout(() => window.location.reload(), 500);
            } else {
                alert(`❌ ${data.error || 'Error al registrar'}`);
            }
        } catch (error) {
            console.error('Register error:', error);
            alert('❌ Error de conexión. Verifica que el servidor esté activo.');
        }
    },

    login: async function () {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert('❌ Por favor completa todos los campos');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = { userId: data.userId, username: data.username };
                localStorage.setItem('chronos_user', JSON.stringify(this.currentUser));

                showToast(`✅ ¡Bienvenido de nuevo, ${username}!`, 'check', '#10b981');
                this.hideAuthModal();

                // Reload page to initialize map properly
                setTimeout(() => window.location.reload(), 500);
            } else {
                alert(`❌ ${data.error || 'Credenciales inválidas'}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('❌ Error de conexión. Verifica que el servidor esté activo.');
        }
    },

    logout: function () {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            this.currentUser = null;
            localStorage.removeItem('chronos_user');
            localStorage.removeItem('chronos_player_v3');

            showToast('👋 Sesión cerrada', 'info', '#6b7280');

            // Reload page to reset state
            setTimeout(() => location.reload(), 1000);
        }
    }
};

// Initialize on load
window.AuthSystem = AuthSystem;

// Configurar URL base de la API dinámicamente
// Si estamos en localhost pero NO en el puerto 8000, asumimos que el backend está en el 8000
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;

    // Handle file protocol or empty hostname (often implies local file)
    if (protocol === 'file:' || !hostname) {
        console.warn('⚠️ Running via file:// protocol. Forcing API to http://localhost:8000');
        return 'http://localhost:8000';
    }

    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '8000') {
        return 'http://localhost:8000';
    }
    return ''; // URL relativa para producción o si ya estamos en el 8000
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔗 API Base URL:', API_BASE_URL || 'Relative (Same Origin)');

// Monkey-patch fetch para usar siempre la base URL correcta en rutas de API
const originalFetch = window.fetch;
window.fetch = function (url, options) {
    if (typeof url === 'string' && url.startsWith('/api')) {
        url = API_BASE_URL + url;
    }
    return originalFetch(url, options);
};
