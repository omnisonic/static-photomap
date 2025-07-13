// Authentication management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Initialize Netlify Identity
        if (window.netlifyIdentity) {
            window.netlifyIdentity.on('init', user => {
                if (!user) {
                    this.showAuthUI();
                } else {
                    this.currentUser = user;
                    this.hideAuthUI();
                    this.showLogoutButton();
                }
            });

            window.netlifyIdentity.on('login', user => {
                this.currentUser = user;
                this.hideAuthUI();
                this.showLogoutButton();
                window.netlifyIdentity.close();
                // Reload the page to initialize the app with authentication
                window.location.reload();
            });

            window.netlifyIdentity.on('logout', () => {
                this.currentUser = null;
                this.showAuthUI();
                this.hideLogoutButton();
            });
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.netlifyIdentity.open();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.netlifyIdentity.logout();
            });
        }
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

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getAuthToken() {
        return this.currentUser ? this.currentUser.token.access_token : null;
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        return fetch(url, {
            ...options,
            headers
        });
    }
}

// Global auth manager instance
window.authManager = new AuthManager();
