/**
 * =====================================================
 * 🚀 STUDIO LEXAIR - LAUNCHER ENGINE
 * Motor central del launcher para ejecutar juegos y apps
 * Soporta:
 *   - Juegos web (HTML/JS) embebidos en iframe
 *   - Archivos descargables (.exe, .apk, .zip, .py, .js, .cpp, .css, etc.)
 *   - Detección básica de plataforma (Android, Windows, etc.)
 * =====================================================
 */

const LauncherEngine = {
    /**
     * Detectar plataforma actual (muy básico, solo orientativo)
     * Posibles valores: 'android', 'ios', 'windows', 'mac', 'linux', 'web'
     */
    detectPlatform() {
        const ua = navigator.userAgent || navigator.vendor || window.opera || '';

        if (/android/i.test(ua)) return 'android';
        if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
        if (/Windows NT/i.test(ua)) return 'windows';
        if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
        if (/Linux/i.test(ua)) return 'linux';
        return 'web';
    },

    /**
     * Obtener extensión de un archivo/URL
     */
    getExtension(url) {
        if (!url) return '';
        try {
            const clean = url.split('#')[0].split('?')[0];
            const parts = clean.split('.');
            if (parts.length <= 1) return '';
            return parts.pop().toLowerCase();
        } catch (e) {
            return '';
        }
    },

    /**
     * Punto de entrada principal del motor
     * @param {Object} item - Objeto juego/app con al menos { title, game_url }
     */
    launch(item) {
        if (!item) {
            UI?.showError?.('No se pudo lanzar el contenido. Datos incompletos.');
            return;
        }

        if (!window.Auth || !Auth.currentUser) {
            UI?.showError?.('Debes iniciar sesión para usar el launcher');
            return;
        }

        const title = item.title || 'Aplicación';
        const rawUrl = item.game_url || item.url;

        if (!rawUrl) {
            UI?.showError?.('Este elemento no tiene una URL configurada');
            return;
        }

        const ext = (item.file_type || this.getExtension(rawUrl) || 'html').toLowerCase();
        const platform = this.detectPlatform();

        console.log('🎯 LauncherEngine.launch()', { title, rawUrl, ext, platform, item });

        // Normalizar tipo
        const webExts = ['html', 'htm'];
        const downloadExts = ['exe', 'msi', 'apk', 'dmg', 'appimage', 'deb', 'rpm', 'zip', 'rar', '7z', 'py', 'js', 'cpp', 'c', 'cs', 'jar', 'war', 'css'];

        if (webExts.includes(ext)) {
            this.launchWebGame(title, rawUrl);
            return;
        }

        if (downloadExts.includes(ext)) {
            this.launchDownload(title, rawUrl, ext, platform, item);
            return;
        }

        // Fallback: tratar como web si no conocemos la extensión
        this.launchWebGame(title, rawUrl);
    },

    /**
     * Lanzar juego/aplicación web en iframe (modo launcher)
     */
    launchWebGame(title, gameUrl) {
        console.log(`🚀 Lanzando contenido web: ${title}`);

        const uid = encodeURIComponent(Auth.currentUser.id);
        const email = encodeURIComponent(Auth.currentUser.email || '');
        const separator = gameUrl.includes('?') ? '&' : '?';
        const finalUrl = `${gameUrl}${separator}uid=${uid}&email=${email}`;

        // Eliminar launcher anterior si existe
        const existing = document.getElementById('gameLauncherModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'gameLauncherModal';
        modal.className = 'fixed inset-0 z-50 flex flex-col bg-black bg-opacity-95';
        modal.innerHTML = `
            <div class="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase tracking-wide">Launcher</p>
                        <h3 class="text-sm md:text-base font-semibold text-white line-clamp-1">${title}</h3>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <p class="hidden md:block text-xs text-gray-500">
                        Presiona <span class="border border-gray-600 rounded px-1">ESC</span> para salir
                    </p>
                    <button id="closeGameLauncherBtn" class="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <span>Cerrar</span>
                    </button>
                </div>
            </div>
            <div class="flex-1 relative bg-black">
                <div class="absolute inset-0 flex items-center justify-center z-0" id="gameLoader">
                    <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <iframe
                    src="${finalUrl}"
                    class="relative z-10 w-full h-full border-none"
                    allowfullscreen="true"
                    allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write"
                    onload="document.getElementById('gameLoader')?.remove()"
                ></iframe>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => {
            const m = document.getElementById('gameLauncherModal');
            if (m) m.remove();
            document.removeEventListener('keydown', escHandler);
        };

        const escHandler = (e) => {
            if (e.key === 'Escape') close();
        };

        document.getElementById('closeGameLauncherBtn')?.addEventListener('click', close);
        document.addEventListener('keydown', escHandler);
    },

    /**
     * Manejar archivos descargables (.exe, .apk, .py, .js, .cpp, .css, etc.)
     * En el contexto web NO se pueden ejecutar directamente, solo descargar/abrir.
     */
    launchDownload(title, url, ext, platform, item) {
        console.log('📦 Lanzando como descarga:', { title, url, ext, platform });

        let platformHint = '';
        if (item && item.platforms_hint) {
            platformHint = `\n\nPlataformas recomendadas: ${item.platforms_hint}`;
        } else {
            if (ext === 'exe' || ext === 'msi') platformHint = '\n\nEste archivo está pensado para Windows.';
            if (ext === 'apk') platformHint = '\n\nEste archivo está pensado para Android.';
        }

        const confirmed = confirm(
            `Este contenido no puede ejecutarse directamente dentro del navegador.\n\n` +
            `Se descargará el archivo:\n- ${title} (${ext.toUpperCase()})${platformHint}\n\n` +
            `¿Deseas continuar con la descarga?`
        );

        if (!confirmed) return;

        try {
            // Abrir en nueva pestaña / iniciar descarga
            window.open(url, '_blank', 'noopener');
        } catch (error) {
            console.error('❌ Error lanzando descarga:', error);
            UI?.showError?.('No se pudo iniciar la descarga');
        }
    }
};

// Exponer globalmente
window.LauncherEngine = LauncherEngine; 