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

    // Session Check: Expiration after 8 hours
    const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; 
    const savedUser = localStorage.getItem('techApiUser');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        const now = Date.now();
        
        // If session is still valid (less than 8 hours)
        if (userData.timestamp && (now - userData.timestamp < SESSION_TIMEOUT)) {
            loginScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            updateProfileUI(userData);
        } else {
            // Session expired or invalid
            localStorage.removeItem('techApiUser');
            console.log('Sesión expirada después de 8 horas.');
        }
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

        // Role-based Access Control for UI
        const navHerramientas = document.getElementById('nav-herramientas');
        if (navHerramientas) {
            if (userData.role === 'Administrador' || userData.role === 'Admin') {
                navHerramientas.classList.remove('hidden');
            } else {
                navHerramientas.classList.add('hidden');
            }
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

                    // Save to localStorage for persistence with timestamp
                    localStorage.setItem('techApiUser', JSON.stringify({
                        username: data.user,
                        fullName: data.fullName,
                        role: data.role,
                        token: data.token,
                        timestamp: Date.now()
                    }));
                    
                    console.log('Login successful:', data.fullName);
                } else {
                    errorMsg.textContent = data.message || 'Error de autenticación';
                    errorMsg.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Login request failed:', err);
                errorMsg.textContent = 'Error de conexión con el servidor (Ver consola)';
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
                errorMsg.textContent = 'Error de conexión con el servidor (Ver consola)';
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

    // Section transition logic
    const btnIrServicios = document.getElementById('btn-ir-servicios');
    const btnVolverServicios = document.getElementById('btn-volver-servicios');
    const dashboardGrid = document.querySelector('.dashboard-grid');
    const serviciosSection = document.getElementById('servicios-section');

    if (btnIrServicios && dashboardGrid && serviciosSection) {
        btnIrServicios.addEventListener('click', () => {
            dashboardGrid.classList.add('hidden');
            serviciosSection.classList.remove('hidden');
            // Scroll to top when changing section
            window.scrollTo(0, 0);
        });
    }

    if (btnVolverServicios && dashboardGrid && serviciosSection) {
        btnVolverServicios.addEventListener('click', () => {
            serviciosSection.classList.add('hidden');
            dashboardGrid.classList.remove('hidden');
        });
    }

    // Collapsible Categories Logic
    const setupCollapsible = (headerId, gridId, iconId) => {
        const header = document.getElementById(headerId);
        const grid = document.getElementById(gridId);
        const icon = document.getElementById(iconId);

        if (header && grid && icon) {
            header.addEventListener('click', () => {
                grid.classList.toggle('hidden-grid');
                icon.classList.toggle('collapsed-icon');
            });
        }
    };

    setupCollapsible('header-repuestos', 'grid-repuestos', 'icon-repuestos');
    setupCollapsible('header-servicios', 'grid-servicios', 'icon-servicios');

    // Sidebar Navigation Logic
    const navInicio = document.getElementById('nav-inicio');
    const navHerramientas = document.getElementById('nav-herramientas');
    const herramientasSection = document.getElementById('herramientas-section');

    const resetViews = () => {
        dashboardGrid.classList.add('hidden');
        serviciosSection.classList.add('hidden');
        herramientasSection.classList.add('hidden');
    };

    if (navInicio) {
        navInicio.addEventListener('click', (e) => {
            e.preventDefault();
            resetViews();
            dashboardGrid.classList.remove('hidden');
        });
    }

    if (navHerramientas) {
        navHerramientas.addEventListener('click', (e) => {
            e.preventDefault();
            resetViews();
            herramientasSection.classList.remove('hidden');
        });
    }

    // --- Tools Functionality ---

    // 1. Password Generator
    const btnGenPassword = document.getElementById('btn-gen-password');
    const genPasswordOutput = document.getElementById('gen-password-output');

    if (btnGenPassword && genPasswordOutput) {
        btnGenPassword.addEventListener('click', () => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
            let password = "";
            for (let i = 0; i < 16; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            genPasswordOutput.value = password;
        });
    }

    // 2. Storage Calculator
    const btnCalcStorage = document.getElementById('btn-calc-storage');
    const storageInput = document.getElementById('storage-input');
    const storageResult = document.getElementById('storage-result');

    if (btnCalcStorage && storageInput && storageResult) {
        btnCalcStorage.addEventListener('click', () => {
            const gigabytes = parseFloat(storageInput.value);
            if (!isNaN(gigabytes) && gigabytes > 0) {
                // Calculation: Manufacturers use 1000^3 bytes, Windows uses 1024^3 bytes
                // 1 GB advertised = 1,000,000,000 bytes
                // In Windows: 1,000,000,000 / (1024^3) = ~0.9313 GB
                const realGiB = gigabytes * Math.pow(1000, 3) / Math.pow(1024, 3);
                storageResult.textContent = `Capacidad Real (Windows): ${realGiB.toFixed(2)} GB`;
            } else {
                storageResult.textContent = 'Por favor, ingresa un número válido.';
            }
        });
    }
});
