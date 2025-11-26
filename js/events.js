/**
 * =====================================================
 * 📅 STUDIO LEXAIR - EVENTS MODULE
 * Listado de eventos activos del proyecto actual
 * =====================================================
 */

const Events = {
    /**
     * Obtener cliente del proyecto actual
     */
    getClient() {
        if (window.Auth && Auth.currentProject && Auth.currentProject.client) {
            return Auth.currentProject.client;
        }
        return null;
    },

    /**
     * Cargar y renderizar eventos
     */
    async renderPage() {
        try {
            const client = this.getClient();
            const container = document.getElementById('eventsList');
            if (!container) return;

            container.innerHTML = '<p class="col-span-full text-gray-400 text-center py-8">Cargando eventos...</p>';

            if (!client || !window.Auth || !Auth.currentUser) {
                container.innerHTML = '<p class="col-span-full text-gray-400 text-center py-8">Inicia sesión para ver los eventos activos.</p>';
                return;
            }

            const now = new Date().toISOString();

            const { data, error } = await client
                .from('events')
                .select('*')
                .eq('is_active', true)
                .order('starts_at', { ascending: true });

            if (error) throw error;

            const events = (data || []).filter(ev => {
                // Filtrar por ventana de tiempo si hay fechas definidas
                const startsOk = !ev.starts_at || ev.starts_at <= now;
                const endsOk = !ev.ends_at || ev.ends_at >= now;
                return startsOk && endsOk;
            });

            if (events.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full glass-effect rounded-2xl p-6 text-center">
                        <svg class="w-12 h-12 text-purple-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <h4 class="text-xl font-bold text-white mb-2">Sin eventos activos</h4>
                        <p class="text-gray-400 text-sm max-w-xl mx-auto">
                            Actualmente no hay eventos activos en este proyecto. Vuelve más tarde para descubrir nuevos desafíos y recompensas.
                        </p>
                    </div>
                `;
                return;
            }

            container.innerHTML = events.map(ev => {
                const startDate = ev.starts_at ? new Date(ev.starts_at).toLocaleString() : 'Sin fecha de inicio';
                const endDate = ev.ends_at ? new Date(ev.ends_at).toLocaleString() : 'Sin fecha de fin';

                return `
                    <div class="glass-effect rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                            <p class="text-xs uppercase tracking-wide text-purple-300 mb-1">${ev.code || 'EVENTO'}</p>
                            <h4 class="text-lg font-bold text-white mb-1">${ev.name || 'Evento sin nombre'}</h4>
                            <p class="text-gray-400 text-sm mb-3">${ev.description || 'Sin descripción'}</p>
                            <p class="text-xs text-gray-500">Inicio: <span class="text-gray-300">${startDate}</span></p>
                            <p class="text-xs text-gray-500">Fin: <span class="text-gray-300">${endDate}</span></p>
                        </div>
                        <div class="mt-4 flex justify-between items-center">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Activo
                            </span>
                            <button class="text-xs px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-default">
                                Próximamente más detalles
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando eventos:', error);
            const container = document.getElementById('eventsList');
            if (container) {
                container.innerHTML = '<p class="col-span-full text-red-400 text-center py-8">Error al cargar los eventos. Intenta más tarde.</p>';
            }
        }
    }
};

window.Events = Events; 