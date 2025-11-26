/**
 * =====================================================
 * 🎨 STUDIO LEXAIR - MODALS MODULE
 * Gestión de modales dinámicos
 * =====================================================
 */

const Modals = {
    /**
     * Crear todos los modales e inyectarlos en el DOM
     */
    init() {
        const container = document.getElementById('modalsContainer');
        if (!container) return;

        container.innerHTML = this.getLoginModal() + 
                             this.getRegisterModal() + 
                             this.getResetPasswordModal() +
                             this.getBuyTokensModal();
        
        console.log('✅ Modales cargados correctamente');
    },

    /**
     * Modal de Login
     */
    getLoginModal() {
        return `
            <div id="loginModal" class="modal hidden">
                <div class="modal-backdrop" onclick="UI.closeModal('loginModal')"></div>
                <div class="modal-content glass-effect animate-slide-up max-w-md">
                    <!-- Header -->
                    <div class="modal-header">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                            </div>
                            <h3 class="text-2xl font-bold text-white">Iniciar Sesión</h3>
                        </div>
                        <button onclick="UI.closeModal('loginModal')" class="close-button">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <form id="loginForm" class="modal-body space-y-5">
                        <div class="form-group">
                            <label class="form-label">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                                </svg>
                                Email
                            </label>
                            <input type="email" id="loginEmail" required
                                   placeholder="tucorreo@ejemplo.com"
                                   class="form-input">
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                Contraseña
                            </label>
                            <div class="relative">
                                <input type="password" id="loginPassword" required
                                       placeholder="••••••••"
                                       class="form-input pr-12">
                                <button type="button" onclick="UI.togglePassword('loginPassword')" 
                                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button type="submit" id="btnLogin" class="btn-primary w-full">
                            <span class="btn-text">Iniciar Sesión</span>
                            <span class="btn-loading hidden">
                                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                        </button>
                    </form>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <button onclick="UI.showModal('resetPasswordModal'); UI.closeModal('loginModal')" 
                                class="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                            ¿Olvidaste tu contraseña?
                        </button>
                        <div class="divider"></div>
                        <p class="text-gray-400 text-sm text-center">
                            ¿No tienes cuenta? 
                            <button onclick="UI.showModal('registerModal'); UI.closeModal('loginModal')" 
                                    class="text-purple-400 hover:text-purple-300 font-semibold ml-1">
                                Regístrate gratis
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Modal de Registro (Profesional y completo)
     */
    getRegisterModal() {
        return `
            <div id="registerModal" class="modal hidden">
                <div class="modal-backdrop" onclick="UI.closeModal('registerModal')"></div>
                <div class="modal-content glass-effect animate-slide-up max-w-3xl max-h-[90vh] overflow-y-auto">
                    <!-- Header -->
                    <div class="modal-header sticky top-0 bg-gray-900 z-10">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-white">Crear Cuenta</h3>
                                <p class="text-gray-400 text-sm">Únete a Studio Lexair</p>
                            </div>
                        </div>
                        <button onclick="UI.closeModal('registerModal')" class="close-button">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <form id="registerForm" class="modal-body space-y-6">
                        
                        <!-- Información Personal -->
                        <div class="section-divider">
                            <span>Información Personal</span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    Nombre Completo
                                    <span class="text-red-400">*</span>
                                </label>
                                <input type="text" id="regFullName" required
                                       placeholder="Juan Pérez"
                                       class="form-input">
                            </div>

                            <div class="form-group">
                                <label class="form-label">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    Nombre de Usuario
                                    <span class="text-red-400">*</span>
                                </label>
                                <input type="text" id="regUsername" required
                                       placeholder="juanperez123"
                                       pattern="[a-zA-Z0-9_]{4,30}"
                                       class="form-input">
                                <p class="text-xs text-gray-500 mt-1">Solo letras, números y guión bajo (4-30 caracteres)</p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                                </svg>
                                Email
                                <span class="text-red-400">*</span>
                            </label>
                            <input type="email" id="regEmail" required
                                   placeholder="tucorreo@ejemplo.com"
                                   class="form-input">
                        </div>

                        <!-- Seguridad -->
                        <div class="section-divider">
                            <span>Seguridad</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                Contraseña
                                <span class="text-red-400">*</span>
                            </label>
                            <div class="relative">
                                <input type="password" id="regPassword" required
                                       placeholder="Mínimo 8 caracteres"
                                       class="form-input pr-12"
                                       oninput="UI.checkPasswordStrength(this.value)">
                                <button type="button" onclick="UI.togglePassword('regPassword')" 
                                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                </button>
                            </div>
                            <div id="passwordStrength" class="mt-2 hidden">
                                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div id="passwordStrengthBar" class="h-full transition-all"></div>
                                </div>
                                <p id="passwordStrengthText" class="text-xs mt-1"></p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                Fecha de Nacimiento
                                <span class="text-red-400">*</span>
                            </label>
                            <input type="date" id="regBirthdate" required
                                   max="${new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}"
                                   class="form-input">
                            <p class="text-xs text-gray-500 mt-1">Debes tener al menos 13 años</p>
                        </div>

                        <!-- Honeypot anti-bot -->
                        <input type="text" id="regWebsite" class="hidden" tabindex="-1" autocomplete="off">

                        <!-- Verificación Anti-Bot -->
                        <div class="section-divider">
                            <span>Verificación de Seguridad</span>
                        </div>

                        <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-5 rounded-xl border border-purple-500/30">
                            <label class="form-label mb-3">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                                Resuelve esta operación
                                <span class="text-red-400">*</span>
                            </label>
                            <div class="flex items-center space-x-3">
                                <div class="flex-1 bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-600">
                                    <span id="captchaQuestion" class="text-white font-mono text-lg"></span>
                                </div>
                                <span class="text-white text-xl">=</span>
                                <input type="number" id="captchaAnswer" required
                                       placeholder="?"
                                       class="w-24 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-500 transition text-center text-lg font-bold">
                                <button type="button" onclick="UI.generateCaptcha()" 
                                        class="p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Términos y Condiciones -->
                        <div class="space-y-3">
                            <label class="flex items-start space-x-3 cursor-pointer group">
                                <input type="checkbox" id="regNewsletter" 
                                       class="mt-1 w-5 h-5 bg-gray-800 border-gray-600 rounded text-purple-500 focus:ring-purple-500">
                                <span class="text-gray-300 text-sm group-hover:text-white transition">
                                    Quiero recibir noticias, ofertas y novedades de Studio Lexair
                                </span>
                            </label>

                            <label class="flex items-start space-x-3 cursor-pointer group">
                                <input type="checkbox" id="regTerms" required
                                       class="mt-1 w-5 h-5 bg-gray-800 border-gray-600 rounded text-purple-500 focus:ring-purple-500">
                                <span class="text-gray-300 text-sm group-hover:text-white transition">
                                    Acepto los <a href="#" class="text-purple-400 hover:text-purple-300">términos y condiciones</a> y la <a href="#" class="text-purple-400 hover:text-purple-300">política de privacidad</a>
                                    <span class="text-red-400">*</span>
                                </span>
                            </label>
                        </div>

                        <button type="submit" id="btnRegister" class="btn-primary w-full text-lg py-4">
                            <span class="btn-text">🎮 Crear Cuenta Gratis</span>
                            <span class="btn-loading hidden">
                                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                        </button>
                    </form>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <p class="text-gray-400 text-sm text-center">
                            ¿Ya tienes cuenta? 
                            <button onclick="UI.showModal('loginModal'); UI.closeModal('registerModal')" 
                                    class="text-purple-400 hover:text-purple-300 font-semibold ml-1">
                                Inicia sesión aquí
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Modal de Reset Password
     */
    getResetPasswordModal() {
        return `
            <div id="resetPasswordModal" class="modal hidden">
                <div class="modal-backdrop" onclick="UI.closeModal('resetPasswordModal')"></div>
                <div class="modal-content glass-effect animate-slide-up max-w-md">
                    <!-- Header -->
                    <div class="modal-header">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-white">Recuperar Contraseña</h3>
                                <p class="text-gray-400 text-sm">Te enviaremos un enlace</p>
                            </div>
                        </div>
                        <button onclick="UI.closeModal('resetPasswordModal')" class="close-button">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <form id="resetPasswordForm" class="modal-body space-y-5">
                        <p class="text-gray-300 text-sm">
                            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                        </p>

                        <div class="form-group">
                            <label class="form-label">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                                </svg>
                                Email
                            </label>
                            <input type="email" id="resetEmail" required
                                   placeholder="tucorreo@ejemplo.com"
                                   class="form-input">
                        </div>

                        <button type="submit" id="btnResetPassword" class="btn-primary w-full">
                            <span class="btn-text">Enviar Enlace de Recuperación</span>
                            <span class="btn-loading hidden">
                                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                        </button>
                    </form>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <button onclick="UI.showModal('loginModal'); UI.closeModal('resetPasswordModal')" 
                                class="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                            ← Volver al login
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Modal de Comprar Tokens
     */
    getBuyTokensModal() {
        return `
            <div id="buyTokensModal" class="modal hidden">
                <div class="modal-backdrop" onclick="UI.closeModal('buyTokensModal')"></div>
                <div class="modal-content glass-effect animate-slide-up max-w-md">
                    <!-- Header -->
                    <div class="modal-header">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-white">Comprar Tokens</h3>
                                <p class="text-gray-400 text-sm">Elige tu paquete</p>
                            </div>
                        </div>
                        <button onclick="UI.closeModal('buyTokensModal')" class="close-button">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="modal-body space-y-3">
                        <div class="token-package" onclick="Wallet.buyTokens(100, 1)">
                            <div class="token-package-content">
                                <div>
                                    <p class="text-white font-bold text-xl">100 Tokens</p>
                                    <p class="text-gray-400 text-sm">Paquete Básico</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$1</p>
                            </div>
                        </div>

                        <div class="token-package" onclick="Wallet.buyTokens(500, 5)">
                            <div class="token-package-content">
                                <div>
                                    <p class="text-white font-bold text-xl">500 Tokens</p>
                                    <p class="text-gray-400 text-sm">Paquete Popular</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$5</p>
                            </div>
                        </div>

                        <div class="token-package token-package-featured" onclick="Wallet.buyTokens(1000, 10)">
                            <div class="featured-badge">⭐ Mejor Valor</div>
                            <div class="token-package-content">
                                <div>
                                    <p class="text-white font-bold text-xl">1,000 Tokens</p>
                                    <p class="text-purple-400 text-sm">Ahorra 20%</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$10</p>
                            </div>
                        </div>

                        <div class="token-package" onclick="Wallet.buyTokens(5000, 50)">
                            <div class="token-package-content">
                                <div>
                                    <p class="text-white font-bold text-xl">5,000 Tokens</p>
                                    <p class="text-gray-400 text-sm">Paquete Premium</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$50</p>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <p class="text-gray-500 text-xs text-center">
                            💳 Los tokens se agregarán instantáneamente a tu cuenta
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
};

// Inicializar modales cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Modals.init();
}); 