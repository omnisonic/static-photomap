// Simple password-based authentication
class SimpleAuth {
    constructor() {
        this.sessionToken = localStorage.getItem('photomap_session');
        this.init();
    }

    init() {
        // Check if already authenticated
        if (this.sessionToken) {
            this.hideAuthUI();
            this.showLogoutButton();
        } else {
            this.showAuthUI();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    async handleLogin() {
        const passwordInput = document.getElementById('passwordInput');
        const errorMsg = document.getElementById('errorMessage');
        const loginBtn = document.getElementById('loginSubmitBtn');
        
        const password = passwordInput.value;
        
        if (!password) {
            this.showError('Please enter a password');
            return;
        }

        // Show loading state
        loginBtn.textContent = 'Signing in...';
        loginBtn.disabled = true;
        this.hideError();

        try {
            const response = await fetch('/.netlify/functions/simple-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.sessionToken = data.token;
                localStorage.setItem('photomap_session', this.sessionToken);
                this.hideAuthUI();
                this.showLogoutButton();
                // Reload to initialize the app
                window.location.reload();
            } else {
                this.showError(data.error || 'Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Connection error. Please try again.');
        } finally {
            loginBtn.textContent = 'Sign In';
            loginBtn.disabled = false;
        }
    }

    logout() {
        this.sessionToken = null;
        localStorage.removeItem('photomap_session');
        this.showAuthUI();
        this.hideLogoutButton();
    }

    showAuthUI() {
        const authContainer = document.getElementById('authContainer');
        const mainContainer = document.querySelector('.container');
        
        if (authContainer) authContainer.style.display = 'flex';
        if (mainContainer) mainContainer.style.display = 'none';
    }

    hideAuthUI() {
        const authContainer = document.getElementById('authContainer');
        const mainContainer = document.querySelector('.container');
        
        if (authContainer) authContainer.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'flex';
    }

    showLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'block';
    }

    hideLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    showError(message) {
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        }
    }

    hideError() {
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
    }

    isAuthenticated() {
        return !!this.sessionToken;
    }

    getAuthToken() {
        return this.sessionToken;
    }

    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.sessionToken) {
            throw new Error('Not authenticated');
        }

        const headers = {
            'Authorization': `Bearer ${this.sessionToken}`,
            ...options.headers
        };

        return fetch(url, {
            ...options,
            headers
        });
    }
}

// Global auth manager instance
window.authManager = new SimpleAuth();
