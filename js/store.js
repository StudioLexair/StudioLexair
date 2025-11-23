/**
 * =====================================================
 * 🎮 STUDIO LEXAIR - STORE MODULE
 * Manejo de tienda y biblioteca de juegos
 * =====================================================
 */

const Store = {
    allGames: [],
    filteredGames: [],
    userGames: [],
    currentSearch: '',
    currentCategory: 'all',
    currentPriceFilter: 'all', // all | free | paid

    /**
     * Obtener el cliente Supabase a usar para juegos/compras
     * - Si el usuario está logueado: usa Auth.currentProject.client
     * - Si no: intenta usar el primer proyecto definido (para futuro modo público)
     */
    getClient() {
        if (Auth && Auth.currentProject && Auth.currentProject.client) {
            return Auth.currentProject.client;
        }

        if (AppConfig.userProjects.length > 0 && AppConfig.userProjects[0].client) {
            console.warn('⚠️ Usando cliente del primer proyecto para la tienda (usuario no logueado)');
            return AppConfig.userProjects[0].client;
        }

        console.error('❌ No hay cliente de Supabase disponible para la tienda');
        return null;
    },

    /**
     * Cargar todos los juegos
     * Ahora se leen desde la tabla games del proyecto actual del usuario
     * (o del primer proyecto configurado si se habilita modo público).
     */
    async loadGames() {
        try {
            const client = this.getClient();
            if (!client) {
                this.allGames = [];
                this.filteredGames = [];
                this.renderGames();
                return;
            }

            const { data, error } = await client
                .from('games')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.allGames = data || [];
            this.applyFilters();
            this.populateCategoryFilter();

        } catch (error) {
            console.error('Error cargando juegos:', error);
            this.allGames = [];
            this.filteredGames = [];
            this.renderGames();
        }
    },

    /**
     * Aplicar filtros de búsqueda, categoría y precio
     */
    applyFilters() {
        let games = [...this.allGames];

        // Filtro por búsqueda en título
        if (this.currentSearch.trim() !== '') {
            const term = this.currentSearch.toLowerCase();
            games = games.filter(g => (g.title || '').toLowerCase().includes(term));
        }

        // Filtro por categoría
        if (this.currentCategory !== 'all') {
            games = games.filter(g => (g.category || '').toLowerCase() === this.currentCategory.toLowerCase());
        }

        // Filtro por tipo de precio
        if (this.currentPriceFilter === 'free') {
            games = games.filter(g => g.is_free === true || (g.price_tokens === 0 && Number(g.price_money || 0) === 0));
        } else if (this.currentPriceFilter === 'paid') {
            games = games.filter(g => g.is_free === false && (g.price_tokens > 0 || Number(g.price_money || 0) > 0));
        }

        this.filteredGames = games;
        this.renderGames();
    },

    /**
     * Rellenar select de categorías dinámicamente
     */
    populateCategoryFilter() {
        const select = document.getElementById('gameCategoryFilter');
        if (!select) return;

        // Limpiar, mantener opción "all"
        select.innerHTML = '<option value="all">Todas las categorías</option>';

        const categories = Array.from(
            new Set(this.allGames
                .map(g => g.category)
                .filter(c => c && c.trim().length > 0))
        );

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    },

    /**
     * Renderizar juegos en la tienda
     */
    renderGames() {
        const grid = document.getElementById('gamesGrid');
        if (!grid) return;

        if (!this.filteredGames || this.filteredGames.length === 0) {
            grid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-10">No hay juegos que coincidan con tu búsqueda o filtros</p>';
            return;
        }

        grid.innerHTML = this.filteredGames.map(game => `
            <div class="game-card bg-gray-800 rounded-xl overflow-hidden flex flex-col">
                <img src="${game.image_url || 'https://via.placeholder.com/400x200?text=Game'}" 
                     alt="${game.title}" 
                     class="w-full h-44 object-cover">
                <div class="p-5 flex flex-col flex-1">
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="text-lg font-bold text-white mr-2 line-clamp-1">${game.title}</h3>
                        ${game.category ? `<span class="text-xs px-2 py-1 rounded-full bg-purple-600 bg-opacity-40 text-purple-200 border border-purple-500">${game.category}</span>` : ''}
                    </div>
                    <p class="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">${game.description || 'Sin descripción'}</p>
                    
                    <div class="flex items-center justify-between mt-2">
                        <div class="text-sm">
                            ${game.is_free || (game.price_tokens === 0 && Number(game.price_money || 0) === 0) ? 
                                '<span class="text-green-400 font-bold">GRATIS</span>' :
                                `<div class="text-purple-400 font-bold">${game.price_tokens} Tokens</div>
                                 <div class="text-gray-500 text-xs">o ${game.price_money}</div>`
                            }
                        </div>
                        <button onclick="Store.purchaseGame(${game.id}, ${game.price_tokens}, '${game.title.replace(/'/g, "\\'")}')" 
                                class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition">
                            ${game.is_free || (game.price_tokens === 0 && Number(game.price_money || 0) === 0) ? 'Obtener' : 'Comprar'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Comprar un juego
     */
    async purchaseGame(gameId, priceTokens, gameTitle) {
        try {
            if (!Auth.currentUser) {
                UI.showError('Debes iniciar sesión primero');
                return;
            }

            const client = this.getClient();
            if (!client) {
                UI.showError('No se pudo acceder al proyecto actual para comprar el juego');
                return;
            }

            // Verificar si ya lo tiene
            const hasGame = this.userGames.some(g => g.game_id === gameId);
            if (hasGame) {
                UI.showError('Ya tienes este juego');
                return;
            }

            // Si es gratis, agregar directamente
            if (priceTokens === 0) {
                await this.addGameToLibrary(client, gameId, 'free');
                UI.showSuccess(`¡${gameTitle} agregado a tu biblioteca!`);
                await this.loadLibrary();
                return;
            }

            // Verificar tokens
            const currentTokens = await Wallet.getTokens(Auth.currentUser.id);
            if (currentTokens < priceTokens) {
                const buyMore = confirm(
                    `No tienes suficientes tokens.\n\n` +
                    `Necesitas: ${priceTokens} tokens\n` +
                    `Tienes: ${currentTokens} tokens\n\n` +
                    `¿Deseas comprar más tokens?`
                );
                if (buyMore) {
                    UI.createBuyTokensModal();
                    UI.showModal('buyTokensModal');
                }
                return;
            }

            // Confirmar compra
            const confirmed = confirm(
                `¿Comprar ${gameTitle} por ${priceTokens} tokens?`
            );

            if (!confirmed) return;

            // Gastar tokens
            const spent = await Wallet.spendTokens(priceTokens);
            if (!spent) {
                UI.showError('Error al procesar el pago');
                return;
            }

            // Agregar juego
            await this.addGameToLibrary(client, gameId, 'tokens');
            UI.showSuccess(`¡${gameTitle} comprado exitosamente!`);
            await this.loadLibrary();

        } catch (error) {
            console.error('Error comprando juego:', error);
            UI.showError('Error al comprar el juego');
        }
    },

    /**
     * Agregar juego a biblioteca (en el proyecto actual)
     */
    async addGameToLibrary(client, gameId, method) {
        const { error } = await client
            .from('user_games')
            .insert({
                user_id: Auth.currentUser.id,
                game_id: gameId,
                purchase_method: method
            });

        if (error) throw error;
    },

    /**
     * Cargar biblioteca del usuario (desde user_games y games del proyecto actual)
     */
    async loadLibrary() {
        try {
            if (!Auth.currentUser) return;

            const client = this.getClient();
            if (!client) return;

            // Obtener IDs de juegos comprados
            const { data: purchases, error } = await client
                .from('user_games')
                .select('game_id')
                .eq('user_id', Auth.currentUser.id);

            if (error) throw error;

            const gameIds = purchases.map(p => p.game_id);

            if (gameIds.length === 0) {
                this.userGames = [];
                this.renderLibrary();
                return;
            }

            // Obtener detalles de los juegos del mismo proyecto
            const { data: games, error: gamesError } = await client
                .from('games')
                .select('*')
                .in('id', gameIds);

            if (gamesError) throw gamesError;

            this.userGames = purchases.map(p => ({
                ...games.find(g => g.id === p.game_id),
                game_id: p.game_id
            }));

            this.renderLibrary();

        } catch (error) {
            console.error('Error cargando biblioteca:', error);
            this.userGames = [];
            this.renderLibrary();
        }
    },

    /**
     * Renderizar biblioteca
     */
    renderLibrary() {
        const grid = document.getElementById('libraryGrid');
        if (!grid) return;

        if (this.userGames.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414A1 1 0 0114.586 16h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                    <h3 class="text-xl font-bold text-white mb-2">Tu biblioteca está vacía</h3>
                    <p class="text-gray-400 mb-6">Compra juegos en la tienda para comenzar</p>
                    <button onclick="UI.switchTab('store')" class="btn-primary text-white px-6 py-3 rounded-lg font-semibold">
                        Ir a la Tienda
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.userGames.map(game => `
            <div class="game-card bg-gray-800 rounded-xl overflow-hidden">
                <img src="${game.image_url || 'https://via.placeholder.com/400x200?text=Game'}" 
                     alt="${game.title}" 
                     class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="text-xl font-bold text-white mb-2">${game.title}</h3>
                    <p class="text-gray-400 text-sm mb-4 line-clamp-2">${game.description || 'Sin descripción'}</p>
                    
                    <button onclick="Store.launchGame(${game.id}, '${game.title.replace(/'/g, "\\'")}', '${game.game_url}')" 
                            class="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center space-x-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5v3h4l-5 5v-3H5z" />
                        </svg>
                        <span>Jugar Ahora</span>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Lanzar un juego/aplicación usando el motor central LauncherEngine
     */
    launchGame(gameId, gameTitle, gameUrl) {
        if (!window.LauncherEngine) {
            console.warn('⚠️ LauncherEngine no está disponible, usando launcher web por defecto');
            if (!Auth.currentUser) {
                UI.showError('Debes iniciar sesión para jugar');
                return;
            }
            // Fallback básico: abrir en iframe con parámetros
            const uid = encodeURIComponent(Auth.currentUser.id);
            const email = encodeURIComponent(Auth.currentUser.email || '');
            const separator = gameUrl.includes('?') ? '&' : '?';
            const finalUrl = `${gameUrl}${separator}uid=${uid}&email=${email}`;
            LauncherEngine?.launchWebGame?.(gameTitle, finalUrl);
            return;
        }

        const item = {
            id: gameId,
            title: gameTitle,
            game_url: gameUrl
        };

        LauncherEngine.launch(item);
    }
};

// Hacer disponible globalmente
window.Store = Store;