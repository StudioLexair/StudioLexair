/**
 * =====================================================
 * 🎯 STUDIO LEXAIR - MISSIONS MODULE
 * Listado de misiones del proyecto actual + progreso del usuario
 * =====================================================
 */

const Missions = {
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
     * Cargar y renderizar misiones
     */
    async renderPage() {
        try {
            const client = this.getClient();
            const container = document.getElementById('missionsList');
            if (!container) return;

            container.innerHTML = '<p class="col-span-full text-gray-400 text-center py-8">Cargando misiones...</p>';

            if (!client || !window.Auth || !Auth.currentUser) {
                container.innerHTML = '<p class="col-span-full text-gray-400 text-center py-8">Inicia sesión para ver tus misiones disponibles.</p>';
                return;
            }

            // Cargar misiones activas
            const { data: missions, error: missionsError } = await client
                .from('missions')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (missionsError) throw missionsError;

            if (!missions || missions.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full glass-effect rounded-2xl p-6 text-center">
                        <svg class="w-12 h-12 text-purple-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <h4 class="text-xl font-bold text-white mb-2">Sin misiones disponibles</h4>
                        <p class="text-gray-400 text-sm max-w-xl mx-auto">
                            En este momento no hay misiones activas en este proyecto. Vuelve más tarde para descubrir nuevos retos.
                        </p>
                    </div>
                `;
                return;
            }

            // Cargar progreso de misiones del usuario
            const { data: userMissions, error: userMissionsError } = await client
                .from('user_missions')
                .select('*')
                .eq('user_id', Auth.currentUser.id);

            if (userMissionsError) {
                console.warn('Error cargando user_missions (puede ser normal si aún no hay progreso):', userMissionsError);
            }

            const progressByMission = {};
            (userMissions || []).forEach(um => {
                progressByMission[um.mission_id] = um;
            });

            const now = new Date().toISOString();

            container.innerHTML = missions.map(m => {
                // Filtrar por ventana de tiempo si hay fechas definidas
                const startsOk = !m.starts_at || m.starts_at <= now;
                const endsOk = !m.ends_at || m.ends_at >= now;
                if (!startsOk || !endsOk) return '';

                const um = progressByMission[m.id] || null;
                const currentValue = um ? um.current_value : 0;
                const targetValue = m.target_value || 1;
                const completed = um ? um.completed : false;
                const percent = Math.min(100, Math.floor((currentValue / targetValue) * 100));

                return `
                    <div class="glass-effect rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                            <p class="text-xs uppercase tracking-wide text-purple-300 mb-1">${m.code || 'MISION'}</p>
                            <h4 class="text-lg font-bold text-white mb-1">${m.name || 'Misión sin nombre'}</h4>
                            <p class="text-gray-400 text-sm mb-3">${m.description || 'Sin descripción'}</p>
                            <p class="text-xs text-gray-500 mb-1">Objetivo: <span class="text-gray-300">${targetValue} ${m.metric_key || ''}</span></p>
                            <p class="text-xs text-gray-500 mb-2">Recompensa: <span class="text-green-400 font-semibold">${m.reward_tokens || 0} tokens</span></p>
                            <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden mb-1">
                                <div class="h-2 bg-gradient-to-r from-purple-500 to-pink-500" style="width: ${percent}%;"></div>
                            </div>
                            <p class="text-xs text-gray-400">
                                Progreso: <span class="text-gray-200">${currentValue}</span> / <span class="text-gray-200">${targetValue}</span>
                                ${completed ? '<span class="ml-2 text-emerald-400 font-semibold">(Completada)</span>' : ''}
                            </p>
                        </div>
                        <div class="mt-4 flex justify-between items-center">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${completed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'}">
                                ${completed ? 'Completada' : 'En progreso'}
                            </span>
                            <button class="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-300 border border-gray-600 cursor-default">
                                Detalles próximamente
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando misiones:', error);
            const container = document.getElementById('missionsList');
            if (container) {
                container.innerHTML = '<p class="col-span-full text-red-400 text-center py-8">Error al cargar las misiones. Intenta más tarde.</p>';
            }
        }
    }
};

window.Missions = Missions;