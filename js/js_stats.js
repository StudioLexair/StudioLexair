/**
 * =====================================================
 * 📊 STUDIO LEXAIR - STATS MODULE
 * Sistema de estadísticas en tiempo real
 * =====================================================
 */

const Stats = {
    /**
     * Animar contador de número
     * Optimizado: parte del valor actual mostrado (si existe)
     * para evitar el "salto" desde 0 en cada actualización.
     */
    animateCounter(element, target, duration = 2000) {
        if (!element || target == null || isNaN(target)) return;

        // Obtener valor actual mostrado (si es numérico)
        let currentText = (element.textContent || '').toString().trim();

        // Si está en estado inicial '---', empezamos desde 0
        if (currentText === '' || currentText === '---') {
            currentText = '0';
        }

        // Quitar separadores de miles y caracteres no numéricos
        const numericText = currentText.replace(/[^0-9-]/g, '');
        let start = parseInt(numericText, 10);

        if (isNaN(start)) {
            start = 0;
        }

        // Si el valor no cambia, no animamos
        if (start === target) {
            element.textContent = this.formatNumber(target);
            return;
        }

        const diff = target - start;
        const steps = Math.max(Math.floor(duration / 16), 1);
        const increment = diff / steps;
        let current = start;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;

            if (step >= steps) {
                element.textContent = this.formatNumber(target);
                clearInterval(timer);
            } else {
                element.textContent = this.formatNumber(Math.round(current));
            }
        }, 16);
    },
    
    /**
     * Formatear números con separadores de miles
     */
    formatNumber(num) {
        return num.toLocaleString('es-ES');
    },
    
    /**
     * Cargar estadísticas de todos los proyectos
     */
    async loadAllStats() {
        try {
            console.log('📊 Cargando estadísticas globales...');
            
            // Obtener estadísticas de los 4 proyectos de usuarios
            const userStats = await this.getUserStats();
            
            // Obtener estadísticas de juegos
            const gameStats = await this.getGameStats();
            
            // Actualizar UI con animación
            this.updateStatsUI(userStats, gameStats);
            
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.showDefaultStats();
        }
    },
    
    /**
     * Obtener estadísticas de usuarios de los 4 proyectos
     * Usa la función SQL get_project_stats() para evitar problemas de RLS
     * y obtener siempre el total de usuarios y tokens, incluso sin sesión.
     */
    async getUserStats() {
        let totalUsers = 0;
        let totalTokens = 0;

        for (const project of AppConfig.userProjects) {
            try {
                console.log(`📊 Consultando get_project_stats() en ${project.name}...`);

                const { data, error } = await project.client.rpc('get_project_stats');

                if (error) {
                    console.warn(`⚠️ Error en get_project_stats() de ${project.name}:`, error);
                    continue;
                }

                if (data && data.length > 0) {
                    const stats = data[0];
                    const users = parseInt(stats.total_users) || 0;
                    const tokens = parseInt(stats.total_tokens_in_circulation) || 0;

                    totalUsers += users;
                    totalTokens += tokens;

                    console.log(`✅ ${project.name}: ${users} usuarios, ${tokens} tokens`);
                }
            } catch (error) {
                console.warn(`⚠️ Error en ${project.name}:`, error);
            }
        }

        return {
            totalUsers,
            totalTokens
        };
    },
    
    /**
     * Obtener estadísticas de juegos
     */
    async getGameStats() {
        try {
            const { count } = await AppConfig.clients.games
                .from('games')
                .select('*', { count: 'exact', head: true });
            
            return {
                totalGames: count || 0
            };
        } catch (error) {
            console.error('Error obteniendo juegos:', error);
            return {
                totalGames: 0
            };
        }
    },
    
    /**
     * Actualizar UI con las estadísticas
     */
    updateStatsUI(userStats, gameStats) {
        // Animar contador de usuarios
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) {
            this.animateCounter(totalUsersEl, userStats.totalUsers, 2000);
        }
        
        // Animar contador de juegos
        const totalGamesEl = document.getElementById('totalGames');
        if (totalGamesEl) {
            this.animateCounter(totalGamesEl, gameStats.totalGames, 1000);
        }
        
        // Animar contador de tokens
        const totalTokensEl = document.getElementById('totalTokens');
        if (totalTokensEl) {
            this.animateCounter(totalTokensEl, userStats.totalTokens, 2500);
        }
        
        console.log('✅ Estadísticas cargadas:', {
            usuarios: userStats.totalUsers,
            juegos: gameStats.totalGames,
            tokens: userStats.totalTokens
        });
    },
    
    /**
     * Mostrar estadísticas por defecto si hay error
     */
    showDefaultStats() {
        const totalUsersEl = document.getElementById('totalUsers');
        const totalGamesEl = document.getElementById('totalGames');
        const totalTokensEl = document.getElementById('totalTokens');
        
        if (totalUsersEl) totalUsersEl.textContent = '---';
        if (totalGamesEl) totalGamesEl.textContent = '---';
        if (totalTokensEl) totalTokensEl.textContent = '---';
    },
    
    /**
     * Actualizar estadísticas periódicamente
     */
    startAutoRefresh(intervalMinutes = 5) {
        // Actualizar cada X minutos
        setInterval(() => {
            this.loadAllStats();
        }, intervalMinutes * 60 * 1000);
    }
};

// Hacer disponible globalmente
window.Stats = Stats;