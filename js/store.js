/**
 * =====================================================
 * 🎮 STUDIO LEXAIR - STORE MODULE
 * Manejo de tienda, biblioteca y UX de juegos
 * =====================================================
 */

const Store = {
    allGames: [],
    filteredGames: [],
    userGames: [],
    currentSearch: '',
    currentCategory: 'all',
    currentPriceFilter: 'all', // all | free | paid
    currentFavoritesOnly: false,
    recentGames: [], // últimos juegos jugados
    favoritesSet: new Set(),

    // Paginación
    pageSize: 12,
    currentPage: 1,

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
     * Cargar todos los juegos desde Supabase
     * - Usa caché en memoria (allGames) para evitar peticiones repetidas
     * - Muestra skeleton loaders mientras se cargan
     */
    async loadGames(forceRefresh = false) {
        try {
            // Si ya tenemos juegos cargados y no se fuerza recarga, reutilizar caché
            if (!forceRefresh && Array.isArray(this.allGames) && this.allGames.length > 0) {
                this.applyFilters();
                this.populateCategoryFilter();
                // Prefetch de imágenes de los primeros juegos filtrados
                this.prefetchGameImages(this.filteredGames.slice(0, 12));
                return;
            }

            this.showGamesSkeleton();

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

            // Prefetch de imágenes de los primeros juegos filtrados
            this.prefetchGameImages(this.filteredGames.slice(0, 12));
        } catch (error) {
            console.error('Error cargando juegos:', error);
            this.allGames = [];
            this.filteredGames = [];
            this.renderGames();
        }
    },

    /**
     * Mostrar skeleton loaders mientras se cargan los juegos de la tienda
     */
    showGamesSkeleton() {
        const grid = document.getElementById('gamesGrid');
        if (!grid) return;

        const skeletonCard = () => `
            <div class="game-card bg-gray-800 rounded-xl overflow-hidden flex flex-col">
                <div class="w-full h-44 bg-gray-700 animate-pulse"></div>
                <div class="p-5 space-y-3">
                    <div class="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div class="h-3 bg-gray-700 rounded w-full animate-pulse"></div>
                    <div class="h-3 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                    <div class="flex items-center justify-between mt-4">
                        <div class="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                        <div class="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                </div>
            </div>
        `;

        const count = 6;
        grid.innerHTML = Array.from({ length: count }).map(() => skeletonCard()).join('');

        // Ocultar botón de "Cargar más" mientras cargamos
        const wrapper = document.getElementById('storeLoadMoreWrapper');
        if (wrapper) wrapper.classList.add('hidden');
    },

    /**
     * Mostrar skeleton loaders mientras se carga la biblioteca del usuario
     */
    showLibrarySkeleton() {
        const grid = document.getElementById('libraryGrid');
        if (!grid) return;

        const skeletonCard = () => `
            <div class="game-card bg-gray-800 rounded-xl overflow-hidden flex flex-col">
                <div class="w-full h-48 bg-gray-700 animate-pulse"></div>
                <div class="p-6 space-y-3">
                    <div class="h-4 bg-gray-700 rounded w-2/3 animate-pulse"></div>
                    <div class="h-3 bg-gray-700 rounded w-full animate-pulse"></div>
                    <div class="h-3 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                    <div class="h-9 bg-gray-700 rounded w-full animate-pulse mt-4"></div>
                </div>
            </div>
        `;

        const count = 3;
        grid.innerHTML = Array.from({ length: count }).map(() => skeletonCard()).join('');
    },

    /**
     * Cargar preferencias del usuario (favoritos y recientes) desde localStorage
     */
    loadUserPreferences() {
        if (!Auth || !Auth.currentUser) return;
        const userId = Auth.currentUser.id;

        // Favoritos
        try {
            const rawFav = localStorage.getItem(`sl_favorites_${userId}`);
            const arr = rawFav ? JSON.parse(rawFav) : [];
            this.favoritesSet = new Set(
                Array.isArray(arr) ? arr.map(Number).filter(id => !Number.isNaN(id)) : []
            );
        } catch (e) {
            console.warn('No se pudieron cargar favoritos:', e);
            this.favoritesSet = new Set();
        }

        // Recientes
        try {
            const rawRec = localStorage.getItem(`sl_recent_${userId}`);
            const arr = rawRec ? JSON.parse(rawRec) : [];
            this.recentGames = Array.isArray(arr) ? arr : [];
        } catch (e) {
            console.warn('No se pudieron cargar recientes:', e);
            this.recentGames = [];
        }

        this.renderRecentSection();
    },

    saveFavorites() {
        if (!Auth || !Auth.currentUser) return;
        const userId = Auth.currentUser.id;
        const arr = Array.from(this.favoritesSet);
        localStorage.setItem(`sl_favorites_${userId}`, JSON.stringify(arr));
    },

    /**
     * Aplicar filtros de búsqueda, categoría, precio y favoritos
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

        // Filtro solo favoritos
        if (this.currentFavoritesOnly) {
            games = games.filter(g => this.favoritesSet.has(g.id));
        }

        this.filteredGames = games;

        // Resetear paginación al aplicar nuevos filtros
        this.currentPage = 1;

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
     * Resaltar texto buscado
     */
    highlightText(text, term) {
        if (!text) return '';
        if (!term) return text;
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\    highlightText(text, term) {
        if (!text) return '';
        if (!term) return text;
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'ig');
        return text.replace(regex, '<span class="bg-yellow-500/40">$1</span>');
    },

    /**
     * Generar badges HTML según flags del juego
     */
    getBadgesHtml(game) {
');
        const regex = new RegExp(`(${escaped})`, 'ig');
        return text.replace(regex, '<span class="bg-yellow-500/40">$1</span>');
    },

    /**
     * Prefetch de imágenes de juegos (mejora de rendimiento percibido)
     */
    prefetchGameImages(games) {
        try {
            if (!Array.isArray(games)) return;
            games.forEach(game => {
                const url = game?.image_url;
                if (!url) return;
                const img = new Image();
                img.src = url;
            });
        } catch (e) {
            console.warn('No se pudo hacer prefetch de imágenes:', e);
        }
    },

    /**
     * Generar badges HTML según flags del juego
     */
    getBadgesHtml(game) {
        const badges = [];

        if (game.is_new) {
            badges.push('<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/60">Nuevo</span>');
        }
        if (game.is_popular) {
            badges.push('<span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/60">Popular</span>');
        }
        if (game.is_recommended) {
            badges.push('<span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/60">Recomendado</span>');
        }

        // Campo tag o tags opcional
        if (!badges.length && game.tag) {
            badges.push(`<span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/60">${game.tag}</span>`);
        }

        return badges.join('');
    },

    /**
     * Actualizar visibilidad del botón "Cargar más"
     */
    updateLoadMoreButton() {
        const wrapper = document.getElementById('storeLoadMoreWrapper');
        if (!wrapper) return;

        if (!this.filteredGames || this.filteredGames.length === 0) {
            wrapper.classList.add('hidden');
            return;
        }

        const total = this.filteredGames.length;
        const visible = this.currentPage * this.pageSize;

        if (total > visible) {
            wrapper.classList.remove('hidden');
        } else {
            wrapper.classList.add('hidden');
        }
    },

    /**
     * Cargar más juegos (paginación)
     */
    loadMoreGames() {
        if (!this.filteredGames || this.filteredGames.length === 0) return;

        const maxPage = Math.ceil(this.filteredGames.length / this.pageSize) || 1;
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.renderGames();
        }
    },

    /**
     * Renderizar juegos en la tienda
     */
    renderGames() {
        const grid = document.getElementById('gamesGrid');
        if (!grid) return;

        const term = this.currentSearch.trim();

        if (!this.filteredGames || this.filteredGames.length === 0) {
            const extra = term ? ` para "${term}"` : '';
            grid.innerHTML = `<p class="text-gray-400 col-span-full text-center py-10">No hay juegos que coincidan con tu búsqueda${extra}.</p>`;
            this.updateLoadMoreButton();
            return;
        }

        const end = this.currentPage * this.pageSize;
        const gamesToRender = this.filteredGames.slice(0, end);

        grid.innerHTML = gamesToRender.map(game => {
            const isFav = this.favoritesSet.has(game.id);
            const titleHtml = term ? this.highlightText(game.title || 'Juego', term) : (game.title || 'Juego');
            const descHtml = term ? this.highlightText(game.description || 'Sin descripción', term) : (game.description || 'Sin descripción');
            const badgesHtml = this.getBadgesHtml(game);

            return `
            <div class="game-card bg-gray-800 rounded-xl overflow-hidden flex flex-col cursor-pointer" onclick="Store.openGameDetails(${game.id})">
                <img src="${game.image_url || 'https://via.placeholder.com/400x200?text=Game'}" 
                     alt="${game.title || 'Juego'}" 
                     loading="lazy"
                     class="w-full h-44 object-cover">
                <div class="p-5 flex flex-col flex-1">
                    <div class="flex items-start justify-between mb-3">
                        <div class="mr-2 flex-1">
                            <h3 class="text-lg font-bold text-white mr-2 line-clamp-1">${titleHtml}</h3>
                            ${badgesHtml ? `<div class="mt-1 flex flex-wrap gap-1">${badgesHtml}</div>` : ''}
                        </div>
                        <div class="flex items-center space-x-2 flex-shrink-0">
                            ${game.category ? `<span class="text-xs px-2 py-1 rounded-full bg-purple-600 bg-opacity-40 text-purple-200 border border-purple-500">${game.category}</span>` : ''}
                            <button class="text-yellow-400 hover:text-yellow-300 text-lg leading-none"
                                    title="${isFav ? 'Quitar de favoritos' : 'Marcar como favorito'}"
                                    onclick="Store.handleFavoriteClick(event, ${game.id})">
                                ${isFav ? '★' : '☆'}
                            </button>
                        </div>
                    </div>
                    <p class="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">${descHtml}</p>
                    
                    <div class="flex items-center justify-between mt-2">
                        <div class="text-sm">
                            ${game.is_free || (game.price_tokens === 0 && Number(game.price_money || 0) === 0) ? 
                                '<span class="text-green-400 font-bold">GRATIS</span>' :
                                `<div class="text-purple-400 font-bold">${game.price_tokens} Tokens</div>
                                 <div class="text-gray-500 text-xs">o ${game.price_money}</div>`
                            }
                        </div>
                        <button onclick="Store.handlePurchaseClick(event, ${game.id}, ${game.price_tokens}, '${(game.title || '').replace(/'/g, "\\'")}')" 
                                class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition">
                            ${game.is_free || (game.price_tokens === 0 && Number(game.price_money || 0) === 0) ? 'Obtener' : 'Comprar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        this.updateLoadMoreButton();
    },

    /**
     * Comprar un juego (wrapper con stopPropagation en botón)
     */
    handlePurchaseClick(event, gameId, priceTokens, gameTitle) {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
        this.purchaseGame(gameId, priceTokens, gameTitle);
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
            const hasGame = this.userOwnsGame(gameId);
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
     * Comprobar si el usuario ya posee un juego
     */
    userOwnsGame(gameId) {
        return this.userGames.some(g => g.game_id === gameId || g.id === gameId);
    },

    /**
     * Cargar biblioteca del usuario (desde user_games y games del proyecto actual)
     */
    async loadLibrary() {
        try {
            if (!Auth.currentUser) return;

            const client = this.getClient();
            if (!client) return;

            // Mostrar skeletons mientras se carga la biblioteca
            this.showLibrarySkeleton();

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

            // Prefetch de imágenes de la biblioteca
            this.prefetchGameImages(this.userGames);

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
                     loading="lazy"
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
     * Gestionar clic en estrella de favoritos
     */
    handleFavoriteClick(event, gameId) {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
        this.toggleFavorite(gameId);
    },

    toggleFavorite(gameId) {
        if (this.favoritesSet.has(gameId)) {
            this.favoritesSet.delete(gameId);
        } else {
            this.favoritesSet.add(gameId);
        }
        this.saveFavorites();
        this.applyFilters();
    },

    /**
     * Añadir juego a la lista de recientes
     */
    addRecentGame(game) {
        if (!Auth || !Auth.currentUser || !game) return;

        // Eliminar si ya existe
        this.recentGames = this.recentGames.filter(g => g.id !== game.id);

        this.recentGames.unshift({
            id: game.id,
            title: game.title || 'Juego',
            description: game.description || '',
            image_url: game.image_url || '',
            game_url: game.game_url || ''
        });

        // Limitar a 6
        if (this.recentGames.length > 6) {
            this.recentGames = this.recentGames.slice(0, 6);
        }

        localStorage.setItem(`sl_recent_${Auth.currentUser.id}`, JSON.stringify(this.recentGames));
        this.renderRecentSection();
    },

    /**
     * Renderizar sección de "Jugados recientemente" en el dashboard
     */
    renderRecentSection() {
        const section = document.getElementById('recentSection');
        const grid = document.getElementById('recentGrid');
        if (!section || !grid) return;

        if (!Auth || !Auth.currentUser || !this.recentGames || this.recentGames.length === 0) {
            section.classList.add('hidden');
            grid.innerHTML = '';
            return;
        }

        section.classList.remove('hidden');
        grid.innerHTML = this.recentGames.map(game => `
            <div class="game-card rounded-xl overflow-hidden flex items-center space-x-4 p-4">
                <img src="${game.image_url || 'https://via.placeholder.com/120x80?text=Game'}"
                     alt="${game.title}"
                     loading="lazy"
                     class="w-20 h-16 object-cover rounded-lg flex-shrink-0">
                <div class="flex-1">
                    <p class="text-sm font-semibold text-white line-clamp-1">${game.title}</p>
                    <p class="text-xs text-gray-400 line-clamp-2">${game.description || ''}</p>
                    <button class="mt-2 inline-flex items-center px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold"
                            onclick="Store.launchGame(${game.id}, '${(game.title || '').replace(/'/g, "\\'")}', '${game.game_url}')">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l5-5v3h4l-5 5v-3H5z" />
                        </svg>
                        Jugar
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Abrir modal de detalles de juego
     */
    openGameDetails(gameId) {
        const game = this.allGames.find(g => g.id === gameId) || this.userGames.find(g => g.id === gameId || g.game_id === gameId);
        if (!game) {
            console.warn('Juego no encontrado para detalles:', gameId);
            return;
        }

        const modal = document.getElementById('gameDetailsModal');
        if (!modal) {
            console.warn('Modal de detalles de juego no encontrado');
            return;
        }

        const titleEl = document.getElementById('gdTitle');
        const imgEl = document.getElementById('gdImage');
        const catEl = document.getElementById('gdCategory');
        const descEl = document.getElementById('gdDescription');
        const badgesEl = document.getElementById('gdBadges');
        const priceLabelEl = document.getElementById('gdPriceLabel');
        const priceTokensEl = document.getElementById('gdPriceTokens');
        const ownershipEl = document.getElementById('gdOwnership');
        const playBtn = document.getElementById('gdPlayButton');

        if (titleEl) titleEl.textContent = game.title || 'Juego';
        if (imgEl) {
            imgEl.src = game.image_url || 'https://via.placeholder.com/800x400?text=Game';
            imgEl.alt = game.title || 'Juego';
        }
        if (catEl) catEl.textContent = game.category ? `Categoría: ${game.category}` : '';

        const longDesc = game.long_description || game.description || 'Sin descripción';
        if (descEl) descEl.textContent = longDesc;

        if (badgesEl) badgesEl.innerHTML = this.getBadgesHtml(game) || '';

        const isFree = game.is_free || (game.price_tokens === 0 && Number(game.price_money || 0) === 0);
        const owns = this.userOwnsGame(game.id);

        if (priceLabelEl) {
            if (isFree) {
                priceLabelEl.textContent = 'GRATIS';
                priceLabelEl.className = 'text-green-400 font-semibold';
            } else {
                priceLabelEl.textContent = `${game.price_tokens} Tokens`;
                priceLabelEl.className = 'text-purple-300 font-semibold';
            }
        }
        if (priceTokensEl) priceTokensEl.textContent = String(game.price_tokens || 0);
        if (ownershipEl) ownershipEl.textContent = owns ? 'En tu biblioteca' : 'No adquirido';

        if (playBtn) {
            if (owns) {
                playBtn.textContent = 'Jugar ahora';
                playBtn.onclick = () => {
                    this.launchGame(game.id, game.title || 'Juego', game.game_url);
                    UI.closeModal('gameDetailsModal');
                };
            } else if (isFree) {
                playBtn.textContent = 'Obtener gratis';
                playBtn.onclick = () => {
                    this.purchaseGame(game.id, 0, game.title || 'Juego');
                    UI.closeModal('gameDetailsModal');
                };
            } else {
                playBtn.textContent = `Comprar por ${game.price_tokens} tokens`;
                playBtn.onclick = () => {
                    this.purchaseGame(game.id, game.price_tokens || 0, game.title || 'Juego');
                };
            }
        }

        UI.showModal('gameDetailsModal');
    },

    /**
     * Lanzar un juego/aplicación usando el motor central LauncherEngine
     */
    launchGame(gameId, gameTitle, gameUrl) {
        // Registrar en recientes
        let fullGame = this.userGames.find(g => g.id === gameId || g.game_id === gameId)
                     || this.allGames.find(g => g.id === gameId);

        if (!fullGame) {
            fullGame = {
                id: gameId,
                title: gameTitle,
                game_url: gameUrl,
                description: '',
                image_url: ''
            };
        }
        this.addRecentGame(fullGame);

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