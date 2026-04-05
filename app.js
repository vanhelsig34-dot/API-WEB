/**
 * DracoTech Reparaciones - Interaction Logic
 */

const ui = {
    // Navigate simulation (Currently disabled)
    navigateTo: (page) => {
        // Functionality removed as requested
    },

    // Search simulation
    handleSearch: (query) => {
        if (!query) return;
        console.log(`Searching for: ${query}`);
        // In a real app, this would filter content or call an API
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-button');
    const menuToggle = document.getElementById('menu-toggle');
    const appContainer = document.getElementById('app');
    const loginScreen = document.getElementById('login-screen');

    // Session Check: Prevent relogin on refresh
    const savedUser = localStorage.getItem('techApiUser');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        updateProfileUI(userData);
    }

    function updateProfileUI(userData) {
        const profileTrigger = document.getElementById('profile-trigger');
        const menuAvatar = document.querySelector('.menu-avatar');
        const menuFullName = document.getElementById('menu-full-name');
        const menuRole = document.getElementById('menu-role');

        if (userData.fullName) {
            const initial = userData.fullName.charAt(0).toUpperCase();
            if (profileTrigger) profileTrigger.textContent = initial;
            if (menuAvatar) menuAvatar.textContent = initial;
            if (menuFullName) menuFullName.textContent = userData.fullName;
            if (menuRole) menuRole.textContent = userData.role || 'Usuario';
        }
    }

    // Protocol Check: Warn if opening directly as file
    if (window.location.protocol === 'file:') {
        alert('IMPORTANTE: Has abierto el archivo directamente. Para que el login funcione, debes acceder a través de: http://localhost:3000');
    }

    // Search interaction
    searchBtn.addEventListener('click', () => {
        ui.handleSearch(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            ui.handleSearch(searchInput.value);
        }
    });

    // Menu toggle (for mobile responsiveness)
    menuToggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            if (sidebar.style.display === 'flex') {
                sidebar.style.display = 'none';
            } else {
                sidebar.style.display = 'flex';
                sidebar.style.position = 'absolute';
                sidebar.style.top = '56px';
                sidebar.style.left = '0';
                sidebar.style.height = 'calc(100vh - 56px)';
                sidebar.style.zIndex = '1000';
                sidebar.style.width = '240px';
            }
        }
    });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const successMsg = document.getElementById('success-msg');

    const errorMsg = document.getElementById('error-msg');

    // Toggle Forms
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            errorMsg.classList.add('hidden');
            successMsg.classList.add('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            errorMsg.classList.add('hidden');
            successMsg.classList.add('hidden');
        });
    }

    if (loginForm) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.classList.add('hidden');
            
            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Hide login, show app
                    loginScreen.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                    
                    updateProfileUI({
                        fullName: data.fullName,
                        role: data.role
                    });

                    // Save to localStorage for persistence
                    localStorage.setItem('techApiUser', JSON.stringify({
                        username: data.user,
                        fullName: data.fullName,
                        role: data.role
                    }));
                    
                    console.log('Login successful:', data.fullName);
                } else {
                    errorMsg.textContent = data.message || 'Error de autenticación';
                    errorMsg.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Login request failed:', err);
                errorMsg.textContent = 'Error de conexión con el servidor';
                errorMsg.classList.remove('hidden');
            }
        });
    }

    // Register form handling
    if (registerForm) {
        const regFullName = document.getElementById('reg-fullname');
        const regUsername = document.getElementById('reg-username');
        const regPassword = document.getElementById('reg-password');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.classList.add('hidden');
            successMsg.classList.add('hidden');

            const fullName = regFullName.value;
            const username = regUsername.value;
            const password = regPassword.value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, username, password })
                });

                const data = await response.json();

                if (data.success) {
                    successMsg.classList.remove('hidden');
                    registerForm.reset();
                    // Auto-switch to login after 1.5s
                    setTimeout(() => {
                        showLogin.click();
                    }, 1500);
                } else {
                    errorMsg.textContent = data.message || 'Error al crear cuenta';
                    errorMsg.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Registration request failed:', err);
                errorMsg.textContent = 'Error de conexión con el servidor';
                errorMsg.classList.remove('hidden');
            }
        });
    }

    // Profile Menu Toggle
    const profileTrigger = document.getElementById('profile-trigger');
    const profileMenu = document.getElementById('profile-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const switchAccountBtn = document.getElementById('switch-account-btn');

    if (profileTrigger && profileMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target) && e.target !== profileTrigger) {
                profileMenu.classList.add('hidden');
            }
        });
    }

    // Logout Modal Logic
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');

    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.remove('hidden');
            profileMenu.classList.add('hidden'); // Close the menu too
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            localStorage.removeItem('techApiUser');
            window.location.reload();
        });
    }

    // Close modal on escape key or clicking outside
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !logoutModal.classList.contains('hidden')) {
            logoutModal.classList.add('hidden');
        }
    });

    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.add('hidden');
        }
    });

    if (switchAccountBtn) {
        switchAccountBtn.addEventListener('click', () => {
            localStorage.removeItem('techApiUser');
            window.location.reload();
        });
    }

    // Handle history item clicks
    const historyItems = document.querySelectorAll('#search-history .nav-item');
    historyItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const query = item.querySelector('span').textContent;
            searchInput.value = query;
            ui.handleSearch(query);
        });
    });
});
