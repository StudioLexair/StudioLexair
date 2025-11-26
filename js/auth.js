/**
 * =====================================================
 * 🔐 STUDIO LEXAIR - AUTH MODULE
 * Sistema de autenticación con OTP (Email Code)
 * =====================================================
 */

const Auth = {
    currentUser: null,
    currentProject: null,
    pendingVerification: null, // Guarda info del registro pendiente

    /**
     * Inicializar autenticación
     */
    async init() {
        console.log('🔐 Inicializando autenticación...');
        await this.checkSession();
    },

    /**
     * Verificar sesión existente
     */
    async checkSession() {
        try {
            // Intentar obtener sesión de cada proyecto
            for (const project of AppConfig.userProjects) {
                const { data: { session }, error } = await project.client.auth.getSession();
                
                if (session && !error) {
                    console.log(`✅ Sesión encontrada en ${project.name}`);
                    this.currentUser = session.user;
                    this.currentProject = project;
                    
                    // Verificar que el perfil exista (email confirmado)
                    const { data: profile } = await project.client
                        .from('user_profiles')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single();
                    
                    if (!profile) {
                        console.warn('⚠️ Usuario autenticado pero sin perfil (email no confirmado)');
                        await this.logout();
                        UI.showError('Por favor confirma tu email antes de iniciar sesión');
                        return false;
                    }
                    
                    // Obtener tokens
                    const tokens = await Wallet.getTokens(session.user.id);
                    
                    // Actualizar UI
                    UI.updateUIForLoggedInUser(session.user, tokens);
                    
                    // Cargar juegos
                    await Store.loadGames();
                    await Store.loadLibrary();
                    
                    return true;
                }
            }
            
            // No hay sesión
            console.log('ℹ️ No hay sesión activa');
            UI.updateUIForLoggedOutUser();
            return false;
            
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            UI.updateUIForLoggedOutUser();
            return false;
        }
    },

    /**
     * Registrar nuevo usuario con OTP
     */
    async register(formData) {
        try {
            console.log('📝 Iniciando registro con OTP...');

            // 1. Verificar capacidad del sistema
            const capacity = await checkAllProjectsCapacity();
            if (capacity.status.level === 'full') {
                UI.showError('Registro cerrado temporalmente. Capacidad máxima alcanzada.');
                return false;
            }

            // 2. Obtener proyecto disponible (Round-Robin)
            const project = getNextAvailableProject();
            if (!project) {
                UI.showError('No hay proyectos disponibles en este momento.');
                return false;
            }

            console.log(`📍 Registrando en ${project.name}`);

            // 3. Registrar con OTP (sin redirect)
            const { data, error } = await project.client.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        full_name: formData.fullName,
                        birthdate: formData.birthdate,
                        newsletter: formData.newsletter,
                        project_id: project.id
                    }
                }
            });

            if (error) throw error;

            console.log('✅ Usuario registrado en auth.users');
            console.log('📧 Email con código OTP enviado a:', formData.email);

            // 4. Guardar info del registro pendiente
            this.pendingVerification = {
                email: formData.email,
                project: project,
                userData: data.user
            };

            // 5. Guardar mapeo usuario → proyecto
            localStorage.setItem(`user_project_${formData.email}`, project.id);

            // 6. Cerrar modal de registro
            UI.closeModal('registerModal');
            
            // 7. Mostrar modal OTP inmediatamente
            UI.showOTPModal(formData.email);

            UI.showSuccess('📧 Código enviado a ' + formData.email);

            return true;

        } catch (error) {
            console.error('❌ Error en registro:', error);
            
            if (error.message.includes('already registered') || error.message.includes('User already registered')) {
                UI.showError('Este email ya está registrado');
            } else if (error.message.includes('invalid email')) {
                UI.showError('Email inválido');
            } else {
                UI.showError('Error al registrar: ' + error.message);
            }
            
            return false;
        }
    },

    /**
     * Verificar código OTP
     * - Verifica el código con Supabase
     * - Crea perfil y wallet MANUALMENTE si no existen
     * - Inicia sesión automáticamente
     */
    async verifyOTP(email, token) {
        try {
            console.log('🔍 Verificando código OTP...');
            console.log('📧 Email:', email);
            console.log('🔢 Token ingresado:', token);

            if (!this.pendingVerification) {
                UI.showError('No hay registro pendiente de verificación');
                return false;
            }

            const project = this.pendingVerification.project;
            console.log(`📍 Proyecto de verificación: ${project.name}`);

            // 1. Verificar el código OTP en Supabase
            const { data, error } = await project.client.auth.verifyOtp({
                email: email,
                token: token,
                type: 'email'
            });

            if (error) {
                console.error('❌ Código incorrecto o expirado:', error);
                UI.showError('Código incorrecto o expirado. Por favor verifica e intenta de nuevo.');
                return false;
            }

            if (!data || !data.user) {
                console.error('❌ Supabase no devolvió usuario al verificar OTP:', data);
                UI.showError('Error al verificar el código. Intenta de nuevo.');
                return false;
            }

            const user = data.user;
            console.log('✅ Código OTP verificado. Usuario:', user.email, 'ID:', user.id);

            // 2. Intentar obtener perfil existente
            console.log('🔍 Buscando perfil en user_profiles...');
            const { data: existingProfile, error: profileError } = await project.client
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (profileError) {
                console.warn('⚠️ Error buscando perfil (puede ser normal si aún no existe):', profileError.message);
            }

            // 3. Crear perfil si no existe
            if (!existingProfile) {
                console.log('⚠️ Perfil NO existe. Creando perfil manualmente...');

                const meta = user.user_metadata || this.pendingVerification.userData?.user_metadata || {};
                console.log('📋 Metadata del usuario:', meta);

                if (!meta.username || !meta.full_name || !meta.birthdate) {
                    console.error('❌ Metadata incompleta para crear perfil:', meta);
                    UI.showError('Error interno: datos de usuario incompletos. Intenta registrarte de nuevo.');
                    return false;
                }

                const profilePayload = {
                    user_id: user.id,
                    username: meta.username,
                    full_name: meta.full_name,
                    birthdate: meta.birthdate,
                    newsletter: meta.newsletter || false,
                    project_id: meta.project_id || project.id
                };

                console.log('📝 Insertando perfil:', profilePayload);

                const { data: insertedProfile, error: insertProfileError } = await project.client
                    .from('user_profiles')
                    .insert(profilePayload)
                    .select()
                    .maybeSingle();

                if (insertProfileError) {
                    // Si es violación de unique, intentar leer de nuevo
                    if (insertProfileError.code === '23505') {
                        console.warn('⚠️ Perfil ya existía al intentar crearlo. Releyendo...');
                        const { data: rereadProfile } = await project.client
                            .from('user_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle();
                        if (!rereadProfile) {
                            UI.showError('Error al acceder al perfil de usuario. Intenta de nuevo.');
                            return false;
                        }
                    } else {
                        console.error('❌ Error creando perfil:', insertProfileError);
                        UI.showError('Error al crear tu perfil. Intenta de nuevo más tarde.');
                        return false;
                    }
                } else {
                    console.log('✅ Perfil creado exitosamente:', insertedProfile);
                }
            } else {
                console.log('✅ Perfil ya existe:', existingProfile);
            }

            // 4. Crear wallet si no existe
            console.log('🔍 Verificando wallet en wallets...');
            const { data: existingWallet, error: walletError } = await project.client
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (walletError) {
                console.warn('⚠️ Error buscando wallet (puede ser normal si aún no existe):', walletError.message);
            }

            if (!existingWallet) {
                console.log('⚠️ Wallet NO existe. Creando wallet con 0 tokens...');
                const { data: newWallet, error: insertWalletError } = await project.client
                    .from('wallets')
                    .insert({
                        user_id: user.id,
                        tokens: 0
                    })
                    .select()
                    .maybeSingle();

                if (insertWalletError && insertWalletError.code !== '23505') {
                    console.error('❌ Error creando wallet:', insertWalletError);
                    // No bloqueamos el login por error de wallet, solo avisamos en consola
                } else {
                    console.log('✅ Wallet creada o ya existente:', newWallet || existingWallet);
                }
            } else {
                console.log('✅ Wallet ya existe:', existingWallet);
            }

            // 5. Cerrar modal OTP
            UI.closeOTPModal();

            // 6. Mostrar éxito
            UI.showSuccess('✅ ¡Cuenta verificada exitosamente! Iniciando sesión...');

            // 7. Guardar usuario y proyecto actuales
            this.currentUser = user;
            this.currentProject = project;

            // 8. Obtener tokens actuales
            const tokens = await Wallet.getTokens(user.id);
            console.log('💰 Tokens actuales:', tokens);

            // 9. Actualizar UI
            UI.updateUIForLoggedInUser(user, tokens);

            // 10. Cargar juegos y biblioteca
            await Store.loadGames();
            await Store.loadLibrary();

            // 11. Limpiar registro pendiente
            this.pendingVerification = null;

            console.log('🎉 Verificación OTP y login completados correctamente.');
            return true;

        } catch (error) {
            console.error('❌ Error verificando OTP:', error);
            UI.showError('Error al verificar código: ' + (error.message || error));
            return false;
        }
    },

    /**
     * Reenviar código OTP
     */
    async resendOTP(email) {
        try {
            console.log('📧 Reenviando código OTP...');

            if (!this.pendingVerification) {
                UI.showError('No hay registro pendiente');
                return false;
            }

            const project = this.pendingVerification.project;

            // Reenviar OTP
            const { error } = await project.client.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) throw error;

            console.log('✅ Código reenviado');
            UI.showSuccess('📧 Nuevo código enviado a ' + email);

            // Reiniciar temporizador
            UI.restartOTPTimer();

            return true;

        } catch (error) {
            console.error('❌ Error reenviando código:', error);
            UI.showError('Error al reenviar código: ' + error.message);
            return false;
        }
    },

    /**
     * Iniciar sesión (busca en los 4 proyectos)
     */
    async login(email, password) {
        try {
            console.log('🔑 Intentando iniciar sesión...');

            // Optimización: Verificar si sabemos en qué proyecto está
            const savedProjectId = localStorage.getItem(`user_project_${email}`);
            
            if (savedProjectId) {
                const project = AppConfig.userProjects.find(p => p.id === parseInt(savedProjectId));
                if (project) {
                    console.log(`🎯 Probando primero en ${project.name} (guardado)...`);
                    
                    const result = await this.attemptLogin(project, email, password);
                    if (result) return true;
                }
            }

            // Buscar en todos los proyectos
            for (const project of AppConfig.userProjects) {
                // Saltar el que ya probamos
                if (savedProjectId && project.id === parseInt(savedProjectId)) continue;
                
                console.log(`🔍 Probando ${project.name}...`);
                
                const result = await this.attemptLogin(project, email, password);
                if (result) return true;
            }

            // No se encontró en ningún proyecto
            UI.showError('Email o contraseña incorrectos. Si acabas de registrarte, verifica que hayas confirmado tu email.');
            return false;

        } catch (error) {
            console.error('❌ Error en login:', error);
            UI.showError('Error al iniciar sesión: ' + error.message);
            return false;
        }
    },

    /**
     * Intentar login en un proyecto específico
     */
    async attemptLogin(project, email, password) {
        try {
            const { data, error } = await project.client.auth.signInWithPassword({
                email,
                password
            });

            if (data && !error && data.user) {
                // Verificar que el perfil exista (email confirmado)
                const { data: profile, error: profileError } = await project.client
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', data.user.id)
                    .single();

                if (profileError || !profile) {
                    console.warn('⚠️ Usuario existe pero no tiene perfil (email no confirmado)');
                    await project.client.auth.signOut();
                    UI.showError('Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
                    return false;
                }

                console.log(`✅ Login exitoso en ${project.name}`);
                
                this.currentUser = data.user;
                this.currentProject = project;

                // Guardar mapeo para futuros logins
                localStorage.setItem(`user_project_${email}`, project.id);

                // Obtener tokens
                const tokens = await Wallet.getTokens(data.user.id);

                // Actualizar UI
                UI.closeAllModals();
                UI.updateUIForLoggedInUser(data.user, tokens);

                // Cargar juegos
                await Store.loadGames();
                await Store.loadLibrary();

                UI.showSuccess('¡Bienvenido de nuevo, ' + (profile.username || data.user.email) + '!');
                return true;
            }

            return false;

        } catch (error) {
            // Error silencioso si no se encuentra en este proyecto
            return false;
        }
    },

    /**
     * Recuperar contraseña (busca en qué proyecto está el usuario)
     */
    async resetPassword(email) {
        try {
            console.log('🔑 Enviando email de recuperación...');

            // Buscar en qué proyecto está el usuario
            const savedProjectId = localStorage.getItem(`user_project_${email}`);
            let projectsToTry = AppConfig.userProjects;

            if (savedProjectId) {
                const savedProject = AppConfig.userProjects.find(p => p.id === parseInt(savedProjectId));
                if (savedProject) {
                    projectsToTry = [savedProject, ...AppConfig.userProjects.filter(p => p.id !== parseInt(savedProjectId))];
                }
            }

            // Intentar en cada proyecto
            for (const project of projectsToTry) {
                const { error } = await project.client.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`
                });

                if (!error) {
                    console.log(`✅ Email de recuperación enviado desde ${project.name}`);
                    UI.closeAllModals();
                    alert(
                        '📧 Email de recuperación enviado\n\n' +
                        'Revisa tu bandeja de entrada y haz click en el enlace para restablecer tu contraseña.\n\n' +
                        '⚠️ Revisa tu carpeta de spam si no lo encuentras.'
                    );
                    return true;
                }
            }

            // Si llegamos aquí, no se encontró el email
            UI.showError('No se encontró ninguna cuenta con ese email.');
            return false;

        } catch (error) {
            console.error('❌ Error al recuperar contraseña:', error);
            UI.showError('Error al enviar email de recuperación: ' + error.message);
            return false;
        }
    },

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            if (this.currentProject) {
                await this.currentProject.client.auth.signOut();
                console.log('✅ Sesión cerrada en', this.currentProject.name);
            }

            this.currentUser = null;
            this.currentProject = null;

            UI.updateUIForLoggedOutUser();
            UI.showSuccess('Sesión cerrada exitosamente');

        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            // Limpiar de todas formas
            this.currentUser = null;
            this.currentProject = null;
            UI.updateUIForLoggedOutUser();
        }
    },

    /**
     * Verificar OTP desde el modal (llamada desde UI)
     */
    async verifyOTPFromModal() {
        const code = UI.getOTPCode();
        const email = this.pendingVerification?.email;

        if (!email) {
            UI.showError('No hay verificación pendiente');
            return;
        }

        if (code.length !== 6) {
            UI.showError('Por favor ingresa el código completo de 6 dígitos');
            return;
        }

        UI.showButtonLoading('btnVerifyOTP', true);
        await this.verifyOTP(email, code);
        UI.showButtonLoading('btnVerifyOTP', false);
    },

    /**
     * Reenviar OTP desde el modal (llamada desde UI)
     */
    async resendOTPFromModal() {
        const email = this.pendingVerification?.email;

        if (!email) {
            UI.showError('No hay verificación pendiente');
            return;
        }

        await this.resendOTP(email);
    },

    /**
     * Validar formulario de registro
     */
    validateRegisterForm(formData) {
        console.log('🔍 Validando formulario...', {
            ...formData,
            password: '***',
            terms: formData.terms,
            termsType: typeof formData.terms
        });

        // Validar honeypot (anti-bot)
        if (formData.website) {
            console.warn('🤖 Bot detectado (honeypot)');
            UI.showError('Detección de bot activada');
            return false;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            UI.showError('Email inválido. Por favor verifica el formato.');
            return false;
        }

        // Validar emails temporales
        const tempEmailDomains = ['10minutemail', 'guerrillamail', 'tempmail', 'throwaway'];
        const emailDomain = formData.email.split('@')[1]?.toLowerCase();
        if (tempEmailDomains.some(temp => emailDomain?.includes(temp))) {
            UI.showError('No se permiten emails temporales. Por favor usa un email permanente.');
            return false;
        }

        // Validar contraseña
        if (formData.password.length < 8) {
            UI.showError('La contraseña debe tener al menos 8 caracteres');
            return false;
        }

        // Validar fortaleza de contraseña
        const hasUpper = /[A-Z]/.test(formData.password);
        const hasLower = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);

        if (!hasUpper || !hasLower || !hasNumber) {
            UI.showError('La contraseña debe contener mayúsculas, minúsculas y números');
            return false;
        }

        // Validar username
        if (formData.username.length < 4 || formData.username.length > 30) {
            UI.showError('El nombre de usuario debe tener entre 4 y 30 caracteres');
            return false;
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(formData.username)) {
            UI.showError('El nombre de usuario solo puede contener letras, números y guión bajo');
            return false;
        }

        // Validar nombre completo
        if (!formData.fullName || formData.fullName.length < 3 || formData.fullName.length > 100) {
            UI.showError('El nombre completo debe tener entre 3 y 100 caracteres');
            return false;
        }

        // Validar fecha de nacimiento
        if (!formData.birthdate) {
            UI.showError('La fecha de nacimiento es obligatoria');
            return false;
        }

        // Validar edad (13+)
        const birthDate = new Date(formData.birthdate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (age < 13 || (age === 13 && monthDiff < 0)) {
            UI.showError('Debes tener al menos 13 años para registrarte');
            return false;
        }

        if (age > 120) {
            UI.showError('Fecha de nacimiento inválida');
            return false;
        }

        // Validar términos - MEJORADO
        if (formData.terms !== true) {
            console.error('❌ Términos no aceptados:', formData.terms);
            UI.showError('Debes aceptar los términos y condiciones para continuar');
            return false;
        }

        // Validar captcha
        if (!UI.validateCaptcha()) {
            UI.showError('Respuesta incorrecta en la verificación anti-bot. Por favor intenta de nuevo.');
            UI.generateCaptcha(); // Generar nuevo captcha
            return false;
        }

        console.log('✅ Validación completada exitosamente');
        return true;
    }
};

// Hacer disponible globalmente
window.Auth = Auth;  