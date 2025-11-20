/**
 * =====================================================
 * 🎨 STUDIO LEXAIR - UI MODULE
 * Manejo de modales y elementos de interfaz
 * =====================================================
 */

const UI = {
    captchaValue: 0,

    /**
     * Mostrar un modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.classList.remove('hidden');
            
            // Generar captcha si es el modal de registro
            if (modalId === 'registerModal') {
                setTimeout(() => this.generateCaptcha(), 100);
            }
        }
    },

    /**
     * Cerrar un modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }
    },

    /**
     * Cerrar todos los modales
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        });
    },

    /**
     * Mostrar sección y ocultar otras
     */
    showSection(sectionId) {
        // Ocultar todas las secciones principales
        const sections = [
            'guestMessage',
            'storeSection',
            'librarySection',
            'dashboardSection',
            'profileSection',
            'tokensSection',
            'eventsSection'
        ];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // Tabs solo visibles en tienda / biblioteca
        const tabs = document.getElementById('tabsSection');
        if (tabs) {
            if (sectionId === 'storeSection' || sectionId === 'librarySection') {
                tabs.classList.remove('hidden');
            } else {
                tabs.classList.add('hidden');
            }
        }

        // Mostrar la sección solicitada
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
        }
    },

    /**
     * Cambiar entre tabs (Tienda/Biblioteca)
     */
    switchTab(tabName) {
        // Actualizar UI de tabs
        const tabStore = document.getElementById('tabStore');
        const tabLibrary = document.getElementById('tabLibrary');

        if (tabName === 'store') {
            tabStore.classList.add('border-purple-500', 'text-white');
            tabStore.classList.remove('border-transparent', 'text-gray-400');
            tabLibrary.classList.remove('border-purple-500', 'text-white');
            tabLibrary.classList.add('border-transparent', 'text-gray-400');

            this.showSection('storeSection');
        } else {
            tabLibrary.classList.add('border-purple-500', 'text-white');
            tabLibrary.classList.remove('border-transparent', 'text-gray-400');
            tabStore.classList.remove('border-purple-500', 'text-white');
            tabStore.classList.add('border-transparent', 'text-gray-400');

            this.showSection('librarySection');
        }
    },

    /**
     * Mostrar notificación toast
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `glass-effect rounded-xl p-4 border transform transition-all duration-300 slide-in-right ${
            type === 'success' ? 'border-green-500 bg-green-900 bg-opacity-30' :
            type === 'error' ? 'border-red-500 bg-red-900 bg-opacity-30' :
            type === 'warning' ? 'border-yellow-500 bg-yellow-900 bg-opacity-30' :
            'border-purple-500 bg-purple-900 bg-opacity-30'
        }`;

        const icons = {
            success: `<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            error: `<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            warning: `<svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>`,
            info: `<svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`
        };

        toast.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    ${icons[type] || icons.info}
                </div>
                <div class="flex-1">
                    <p class="text-white text-sm font-medium">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-gray-400 hover:text-white transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    /**
     * Mostrar mensaje de éxito
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    },

    /**
     * Mostrar mensaje de error
     */
    showError(message) {
        this.showToast(message, 'error');
    },

    /**
     * Mostrar mensaje de advertencia
     */
    showWarning(message) {
        this.showToast(message, 'warning');
    },

    /**
     * Mostrar mensaje informativo
     */
    showInfo(message) {
        this.showToast(message, 'info');
    },

    /**
     * Mostrar spinner de carga en un botón
     */
    showButtonLoading(buttonId, show = true) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (show) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    },

    /**
     * Actualizar UI después del login
     */
    updateUIForLoggedInUser(user, tokens) {
        // Ocultar botones de auth
        document.getElementById('authButtons')?.classList.add('hidden');

        // Mostrar sección de usuario en navbar
        const userSection = document.getElementById('userSection');
        if (userSection) {
            userSection.classList.remove('hidden');
            userSection.classList.add('flex');
        }

        // Actualizar email y tokens (navbar)
        const userEmail = document.getElementById('userEmail');
        const userTokens = document.getElementById('userTokens');
        const userInitial = document.getElementById('userInitial');

        if (userEmail) userEmail.textContent = user.email;
        if (userTokens) userTokens.textContent = tokens || 0;
        if (userInitial) userInitial.textContent = user.email.charAt(0).toUpperCase();

        // Ocultar hero de landing
        const heroSection = document.getElementById('heroSection');
        if (heroSection) {
            heroSection.classList.add('hidden');
        }

        // Mostrar panel principal como pantalla inicial del launcher
        this.showSection('dashboardSection');

        // Hacer scroll al inicio del main
        const main = document.querySelector('main');
        if (main) {
            main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Actualizar UI después del logout
     */
    updateUIForLoggedOutUser() {
        // Mostrar botones de auth
        document.getElementById('authButtons')?.classList.remove('hidden');

        // Ocultar sección de usuario
        const userSection = document.getElementById('userSection');
        if (userSection) {
            userSection.classList.add('hidden');
            userSection.classList.remove('flex');
        }

        // Volver a mostrar hero de landing
        const heroSection = document.getElementById('heroSection');
        if (heroSection) {
            heroSection.classList.remove('hidden');
        }

        // Mostrar mensaje de invitado
        this.showSection('guestMessage');
    },

    /**
     * Actualizar contador de tokens
     */
    updateTokensDisplay(tokens) {
        const userTokens = document.getElementById('userTokens');
        if (userTokens) {
            userTokens.textContent = tokens;
        }
    },

    /**
     * Crear modal de compra de tokens
     */
    createBuyTokensModal() {
        const modalHTML = `
            <div id="buyTokensModal" class="modal hidden">
                <div class="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-purple-500 border-opacity-30">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-white">💰 Comprar Tokens</h3>
                        <button onclick="UI.closeModal('buyTokensModal')" class="text-gray-400 hover:text-white">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition" onclick="Wallet.buyTokens(100, 1)">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-white font-bold text-xl">100 Tokens</p>
                                    <p class="text-gray-400 text-sm">Paquete Básico</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$1 USD</p>
                            </div>
                        </div>

                        <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition" onclick="Wallet.buyTokens(500, 5)">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-white font-bold text-xl">500 Tokens</p>
                                    <p class="text-gray-400 text-sm">Paquete Popular</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$5 USD</p>
                            </div>
                        </div>

                        <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition border-2 border-purple-500" onclick="Wallet.buyTokens(1000, 10)">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-white font-bold text-xl">1000 Tokens</p>
                                    <p class="text-purple-400 text-sm">⭐ Mejor Valor</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$10 USD</p>
                            </div>
                        </div>

                        <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition" onclick="Wallet.buyTokens(5000, 50)">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-white font-bold text-xl">5000 Tokens</p>
                                    <p class="text-gray-400 text-sm">Paquete Premium</p>
                                </div>
                                <p class="text-green-400 font-bold text-2xl">$50 USD</p>
                            </div>
                        </div>
                    </div>

                    <p class="text-gray-500 text-xs text-center mt-6">
                        💳 Los tokens se agregarán instantáneamente a tu cuenta
                    </p>
                </div>
            </div>
        `;

        const container = document.getElementById('modalsContainer');
        if (container && !document.getElementById('buyTokensModal')) {
            container.insertAdjacentHTML('beforeend', modalHTML);
        }
    },

    /**
     * Toggle password visibility
     */
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    },

    /**
     * Check password strength
     */
    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrengthBar');
        const strengthText = document.getElementById('passwordStrengthText');
        const strengthContainer = document.getElementById('passwordStrength');

        if (!strengthBar || !strengthText || !strengthContainer) return;

        if (password.length === 0) {
            strengthContainer.classList.add('hidden');
            return;
        }

        strengthContainer.classList.remove('hidden');

        let strength = 0;
        let feedback = '';

        // Criterios
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (hasLength) strength++;
        if (hasUpper) strength++;
        if (hasLower) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;

        // Actualizar barra
        const width = (strength / 5) * 100;
        strengthBar.style.width = width + '%';

        if (strength <= 2) {
            strengthBar.className = 'h-full transition-all bg-red-500';
            feedback = '❌ Débil - Agrega mayúsculas, números y símbolos';
        } else if (strength === 3) {
            strengthBar.className = 'h-full transition-all bg-yellow-500';
            feedback = '⚠️ Media - Casi bien';
        } else if (strength === 4) {
            strengthBar.className = 'h-full transition-all bg-blue-500';
            feedback = '✓ Buena - Muy segura';
        } else {
            strengthBar.className = 'h-full transition-all bg-green-500';
            feedback = '✅ Excelente - Muy segura!';
        }

        strengthText.textContent = feedback;
        strengthText.className = `text-xs mt-1 ${
            strength <= 2 ? 'text-red-400' :
            strength === 3 ? 'text-yellow-400' :
            strength === 4 ? 'text-blue-400' : 'text-green-400'
        }`;
    },

    /**
     * Generate CAPTCHA
     */
    generateCaptcha() {
        const operations = ['+', '-', '×'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let num1, num2, answer;
        
        if (operation === '+') {
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
            answer = num1 + num2;
        } else if (operation === '-') {
            num1 = Math.floor(Math.random() * 20) + 10;
            num2 = Math.floor(Math.random() * 10) + 1;
            answer = num1 - num2;
        } else {
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            answer = num1 * num2;
        }

        this.captchaValue = answer;

        const questionEl = document.getElementById('captchaQuestion');
        if (questionEl) {
            questionEl.textContent = `${num1} ${operation} ${num2}`;
        }

        // Limpiar respuesta
        const answerEl = document.getElementById('captchaAnswer');
        if (answerEl) {
            answerEl.value = '';
        }

        console.log('🔐 Captcha generado:', answer);
    },

    /**
     * Validate CAPTCHA
     */
    validateCaptcha() {
        const answerEl = document.getElementById('captchaAnswer');
        if (!answerEl) return false;

        const userAnswer = parseInt(answerEl.value);
        return userAnswer === this.captchaValue;
    },

    /**
     * Mostrar modal OTP para verificar código
     */
    showOTPModal(email) {
        // Crear modal si no existe
        if (!document.getElementById('otpModal')) {
            const modalHTML = `
                <div id="otpModal" class="modal active">
                    <div class="modal-backdrop" onclick="event.stopPropagation()"></div>
                    <div class="modal-content glass-effect animate-slide-up max-w-md">
                        <!-- Header -->
                        <div class="modal-header">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-bold text-white">Verifica tu Email</h3>
                                    <p class="text-gray-400 text-sm">Código de 6 dígitos</p>
                                </div>
                            </div>
                        </div>

                        <!-- Body -->
                        <div class="modal-body space-y-6">
                            <div class="text-center">
                                <p class="text-gray-300 mb-2">Hemos enviado un código de 6 dígitos a:</p>
                                <p class="text-purple-400 font-semibold text-lg" id="otpEmail">${email}</p>
                            </div>

                            <!-- Inputs de código -->
                            <div class="flex justify-center space-x-2" id="otpInputsContainer">
                                <input type="text" maxlength="1" class="otp-input w-12 h-14 text-center text-2xl font-bold bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-purple-500 transition" data-index="0">
                                <input type="text" maxlength="1" class="otp-input w-12 h-14 text-center text-2xl font-bold bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-purple-500 transition" data-index="1">
                                <input type="text" maxlength="1" class="otp-input w-12 h-14 text-center text-2xl font-bold bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-purple-500 transition" data-index="2">
                                <input type="text" maxlength="1" class="otp-input w-12 h-14 text-center text-2xl font-bold bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-purple-500 transition" data-index="3">
                                <input type="text" maxlength="1" class="otp-input w-12 h-14 text-center text-2xl font-bold bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-purple-500 transition" data-index="4">
                                <input type="text" maxlength="1" class="otp-input w-12 h-14 text-center text-2xl font-bold bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-purple-500 transition" data-index="5">
                            </div>

                            <!-- Temporizador -->
                            <div class="text-center">
                                <p class="text-gray-400 text-sm">
                                    ⏱️ Código expira en: <span class="text-purple-400 font-semibold" id="otpTimer">60:00</span>
                                </p>
                            </div>

                            <!-- Botones -->
                            <div class="space-y-3">
                                <button onclick="Auth.verifyOTPFromModal()" id="btnVerifyOTP" class="btn-primary w-full">
                                    <span class="btn-text">Verificar Código</span>
                                    <span class="btn-loading hidden">
                                        <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </span>
                                </button>
                                <button onclick="Auth.resendOTPFromModal()" class="btn-secondary w-full">
                                    Reenviar Código
                                </button>
                            </div>

                            <p class="text-gray-500 text-xs text-center">
                                Revisa tu bandeja de entrada y carpeta de spam
                            </p>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('modalsContainer').insertAdjacentHTML('beforeend', modalHTML);
        } else {
            // Si ya existe, solo mostrarlo
            const modal = document.getElementById('otpModal');
            modal.classList.add('active');
            modal.classList.remove('hidden');
            
            // Actualizar email
            document.getElementById('otpEmail').textContent = email;
            
            // Limpiar inputs
            document.querySelectorAll('.otp-input').forEach(input => {
                input.value = '';
            });
        }

        // Configurar eventos de inputs
        this.setupOTPInputs();
        
        // Iniciar temporizador
        this.startOTPTimer(3600); // 60 minutos

        // Focus en primer input
        setTimeout(() => {
            document.querySelector('.otp-input')?.focus();
        }, 100);
    },

    /**
     * Configurar inputs de OTP con auto-focus y paste
     */
    setupOTPInputs() {
        const inputs = document.querySelectorAll('.otp-input');
        
        inputs.forEach((input, index) => {
            // Solo números
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Solo permitir números
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Auto-focus al siguiente
                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Cambiar borde a morado cuando está lleno
                if (value) {
                    e.target.classList.remove('border-gray-600');
                    e.target.classList.add('border-purple-500');
                } else {
                    e.target.classList.remove('border-purple-500');
                    e.target.classList.add('border-gray-600');
                }
            });

            // Backspace para volver atrás
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                    inputs[index - 1].value = '';
                }

                // Enter para verificar
                if (e.key === 'Enter') {
                    Auth.verifyOTPFromModal();
                }
            });

            // Paste support (pegar código completo)
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').trim();
                
                // Si es un código de 6 dígitos
                if (/^\d{6}$/.test(pastedData)) {
                    inputs.forEach((inp, idx) => {
                        inp.value = pastedData[idx] || '';
                        if (pastedData[idx]) {
                            inp.classList.remove('border-gray-600');
                            inp.classList.add('border-purple-500');
                        }
                    });
                    // Focus en el último
                    inputs[inputs.length - 1].focus();
                }
            });
        });
    },

    /**
     * Obtener código OTP ingresado
     */
    getOTPCode() {
        const inputs = document.querySelectorAll('.otp-input');
        let code = '';
        inputs.forEach(input => {
            code += input.value;
        });
        return code;
    },

    /**
     * Iniciar temporizador de OTP
     */
    startOTPTimer(seconds) {
        const timerEl = document.getElementById('otpTimer');
        if (!timerEl) return;

        let remaining = seconds;

        // Limpiar temporizador anterior si existe
        if (this.otpTimerInterval) {
            clearInterval(this.otpTimerInterval);
        }

        const updateTimer = () => {
            const minutes = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

            if (remaining <= 0) {
                clearInterval(this.otpTimerInterval);
                timerEl.textContent = 'Expirado';
                timerEl.classList.add('text-red-400');
                this.showError('El código ha expirado. Solicita uno nuevo.');
            }

            remaining--;
        };

        updateTimer();
        this.otpTimerInterval = setInterval(updateTimer, 1000);
    },

    /**
     * Reiniciar temporizador de OTP
     */
    restartOTPTimer() {
        const timerEl = document.getElementById('otpTimer');
        if (timerEl) {
            timerEl.classList.remove('text-red-400');
        }
        this.startOTPTimer(3600);
    },

    /**
     * Cerrar modal OTP
     */
    closeOTPModal() {
        const modal = document.getElementById('otpModal');
        if (modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }

        // Limpiar temporizador
        if (this.otpTimerInterval) {
            clearInterval(this.otpTimerInterval);
        }
    }
};

// Hacer disponible globalmente
window.UI = UI;