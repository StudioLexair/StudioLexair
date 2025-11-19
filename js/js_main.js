/**
 * =====================================================
 * 🚀 STUDIO LEXAIR - MAIN MODULE
 * Inicialización y event handlers
 * =====================================================
 */

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Studio Lexair Launcher iniciando...');

    // Mostrar loading screen
    showLoadingScreen();

    try {
        // 1) Inicializar clientes de Supabase
        await simulateLoading(20, 'Conectando con servidores...');
        initializeSupabaseClients();

        // 2) Inicializar autenticación
        await simulateLoading(40, 'Verificando sesión...');
        await Auth.init();

        // 3) Crear modales dinámicos
        await simulateLoading(60, 'Preparando interfaz...');
        UI.createBuyTokensModal();

        // 4) Configurar event listeners de botones
        await simulateLoading(80, 'Configurando controles...');
        setupEventListeners();

        // 5) Verificar si viene de confirmación de email
        checkEmailConfirmation();

        // 6) Cargar estadísticas
        await simulateLoading(90, 'Cargando estadísticas...');
        await Stats.loadAllStats();
        
        // 7) Iniciar actualización automática cada 1 minuto
        // (Puedes aumentar este valor si quieres hacer menos peticiones)
        Stats.startAutoRefresh(1);
        
        // 8) Finalizar carga (lógica)
        await simulateLoading(100, '¡Listo!');
        console.log('✅ Launcher inicializado correctamente');
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        if (window.UI && typeof UI.showError === 'function') {
            UI.showError('Error al inicializar la aplicación. Revisa tu conexión o intenta recargar la página.');
        } else {
            alert('Error al inicializar la aplicación. Revisa la consola.');
        }
    } finally {
        // Ocultar loading screen SIEMPRE, aunque haya fallos
        setTimeout(() => {
            hideLoadingScreen();
            console.log('🟢 Pantalla de carga oculta');
        }, 500);
    }
});

/**
 * Mostrar loading screen
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

/**
 * Ocultar loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('opacity-0');
        loadingScreen.classList.add('transition-opacity');
        loadingScreen.classList.add('duration-500');
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
}

/**
 * Simular progreso de carga
 */
async function simulateLoading(percentage, message) {
    return new Promise(resolve => {
        const loadingBar = document.getElementById('loadingBar');
        if (loadingBar) {
            loadingBar.style.width = percentage + '%';
        }
        
        setTimeout(resolve, 300);
    });
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Botones de auth
    document.getElementById('btnShowLogin')?.addEventListener('click', () => {
        UI.showModal('loginModal');
    });

    document.getElementById('btnShowRegister')?.addEventListener('click', () => {
        UI.showModal('registerModal');
    });

    document.getElementById('btnGuestRegister')?.addEventListener('click', () => {
        UI.showModal('registerModal');
    });

    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        await Auth.logout();
    });

    // Botón de comprar tokens
    document.getElementById('btnBuyTokens')?.addEventListener('click', () => {
        UI.createBuyTokensModal();
        UI.showModal('buyTokensModal');
    });

    // CTA Buttons del Hero
    document.getElementById('ctaRegister')?.addEventListener('click', () => {
        UI.showModal('registerModal');
    });

    document.getElementById('ctaExplore')?.addEventListener('click', () => {
        // Abrir modal de inicio de sesión al explorar juegos desde la página inicial
        UI.showModal('loginModal');
    });

    // Tabs
    document.getElementById('tabStore')?.addEventListener('click', () => {
        UI.switchTab('store');
    });

    document.getElementById('tabLibrary')?.addEventListener('click', () => {
        UI.switchTab('library');
    });

    // Filtros de tienda
    const searchInput = document.getElementById('gameSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            Store.currentSearch = e.target.value || '';
            Store.applyFilters();
        });
    }

    const categorySelect = document.getElementById('gameCategoryFilter');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            Store.currentCategory = e.target.value || 'all';
            Store.applyFilters();
        });
    }

    const filterAll = document.getElementById('filterAll');
    const filterFree = document.getElementById('filterFree');
    const filterPaid = document.getElementById('filterPaid');

    const updateFilterPills = (activeId) => {
        [filterAll, filterFree, filterPaid].forEach(btn => {
            if (!btn) return;
            if (btn.id === activeId) {
                btn.classList.add('bg-purple-600', 'text-white');
                btn.classList.remove('bg-gray-800', 'text-gray-300');
            } else {
                btn.classList.remove('bg-purple-600', 'text-white');
                btn.classList.add('bg-gray-800', 'text-gray-300');
            }
        });
    };

    filterAll?.addEventListener('click', () => {
        Store.currentPriceFilter = 'all';
        updateFilterPills('filterAll');
        Store.applyFilters();
    });

    filterFree?.addEventListener('click', () => {
        Store.currentPriceFilter = 'free';
        updateFilterPills('filterFree');
        Store.applyFilters();
    });

    filterPaid?.addEventListener('click', () => {
        Store.currentPriceFilter = 'paid';
        updateFilterPills('filterPaid');
        Store.applyFilters();
    });

    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;

            if (!email || !password) {
                UI.showError('Por favor completa todos los campos');
                return;
            }

            UI.showButtonLoading('btnLogin', true);
            await Auth.login(email, password);
            UI.showButtonLoading('btnLogin', false);
        });
    }

    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                fullName: document.getElementById('regFullName')?.value?.trim(),
                username: document.getElementById('regUsername')?.value?.trim(),
                email: document.getElementById('regEmail')?.value?.trim(),
                password: document.getElementById('regPassword')?.value,
                birthdate: document.getElementById('regBirthdate')?.value,
                newsletter: document.getElementById('regNewsletter')?.checked || false,
                terms: document.getElementById('regTerms')?.checked || false,  // ✅ AGREGADO
                website: document.getElementById('regWebsite')?.value || ''     // ✅ Honeypot
            };

            console.log('📋 Datos del formulario:', {
                ...formData,
                password: '***'  // No mostrar contraseña en consola
            });

            // Validar formulario
            if (!Auth.validateRegisterForm(formData)) {
                return;
            }

            UI.showButtonLoading('btnRegister', true);
            const result = await Auth.register(formData);
            UI.showButtonLoading('btnRegister', false);
            
            // Si el registro fue exitoso, limpiar formulario
            if (result) {
                registerForm.reset();
                UI.generateCaptcha(); // Regenerar captcha
            }
        });
    }

    // Cerrar modales al hacer click fuera
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
            e.target.classList.add('hidden');
        }
    });

    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            UI.closeAllModals();
        }
    });
}

/**
 * Verificar confirmación de email
 */
function checkEmailConfirmation() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('confirmed') === 'true') {
        // Mostrar banner de confirmación
        const banner = document.getElementById('confirmedBanner');
        if (banner) {
            banner.classList.remove('hidden');
            
            // Ocultar después de 5 segundos
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 5000);
        }

        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Mostrar modal de login
        setTimeout(() => {
            UI.showModal('loginModal');
        }, 1000);
    }
}

// Exponer funciones globalmente para uso en onclick
window.showModal = (id) => UI.showModal(id);
window.closeModal = (id) => UI.closeModal(id);
window.switchTab = (tab) => UI.switchTab(tab);

console.log('📝 Event listeners configurados');
