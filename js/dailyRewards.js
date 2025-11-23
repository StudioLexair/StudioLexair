/**
 * =====================================================
 * 🎁 STUDIO LEXAIR - DAILY REWARDS MODULE
 * Recompensas diarias de inicio de sesión
 * - Usa tablas weekly_reward_configs y user_weekly_rewards
 * - Usa la wallet del proyecto actual para acreditar tokens
 * =====================================================
 */

const DailyRewards = {
    state: {
        loaded: false,
        config: [],
        userRow: null,
        todayWeekday: null,
        todayReward: 0,
        canClaimToday: false
    },

    /**
     * Llamado automáticamente cuando el usuario inicia sesión
     */
    async onUserLogin() {
        try {
            if (!window.Auth || !Auth.currentUser || !Auth.currentProject || !Auth.currentProject.client) {
                return;
            }

            await this.refreshData();
            this.updateGiftVisibility();

            // Si ya está abierta la sección de recompensas, refrescar
            const dailySection = document.getElementById('dailyRewardsSection');
            if (dailySection && !dailySection.classList.contains('hidden')) {
                this.renderPage();
            }
        } catch (error) {
            console.error('Error inicializando recompensas diarias:', error);
        }
    },

    /**
     * Cargar configuración y estado del usuario desde Supabase
     */
    async refreshData() {
        const client = Auth.currentProject.client;

        // Configuración de recompensas semanales (activa)
        let config = [];
        try {
            const { data, error } = await client
                .from('weekly_reward_configs')
                .select('*')
                .eq('is_active', true)
                .order('weekday', { ascending: true });

            if (error) throw error;
            config = data || [];
        } catch (error) {
            console.warn('No se pudo cargar weekly_reward_configs:', error.message || error);
        }

        // Estado del usuario
        let userRow = null;
        try {
            const { data, error } = await client
                .from('user_weekly_rewards')
                .select('*')
                .eq('user_id', Auth.currentUser.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            userRow = data || null;
        } catch (error) {
            console.warn('No se pudo cargar user_weekly_rewards:', error.message || error);
        }

        // Calcular día de hoy y recompensa
        const today = new Date();
        const weekday = today.getDay(); // 0 = domingo, 6 = sábado

        const todayConfig = config.find(c => c.weekday === weekday) || null;
        const todayReward = todayConfig
            ? (Number(todayConfig.tokens_base || 0) + Number(todayConfig.tokens_bonus || 0))
            : 0;

        let canClaimToday = false;
        if (todayReward > 0) {
            if (!userRow || !userRow.last_claimed_date) {
                canClaimToday = true;
            } else {
                const lastDateStr = (userRow.last_claimed_date || '').slice(0, 10);
                const todayStr = today.toISOString().slice(0, 10);
                if (lastDateStr !== todayStr) {
                    canClaimToday = true;
                }
            }
        }

        this.state = {
            loaded: true,
            config,
            userRow,
            todayWeekday: weekday,
            todayReward,
            canClaimToday
        };

        this.renderPage();
    },

    /**
     * Mostrar / ocultar el botón flotante y animación inicial
     */
    updateGiftVisibility() {
        const center = document.getElementById('dailyRewardCenter');
        const fab = document.getElementById('dailyRewardFab');

        if (!center || !fab) return;

        if (this.state.canClaimToday && this.state.todayReward > 0) {
            // Mostrar animación central corta y luego el botón flotante
            center.classList.remove('hidden');
            fab.classList.add('hidden');

            setTimeout(() => {
                center.classList.add('hidden');
                fab.classList.remove('hidden');
            }, 1600);
        } else {
            center.classList.add('hidden');
            fab.classList.add('hidden');
        }
    },

    /**
     * Abrir la sección de recompensas diarias
     */
    openPanel() {
        if (!window.UI) return;
        UI.showSection('dailyRewardsSection');
        this.renderPage();
    },

    /**
     * Renderizar la sección de recompensas diarias
     */
    renderPage() {
        const amountEl = document.getElementById('drTodayAmount');
        const labelEl = document.getElementById('drTodayLabel');
        const claimBtn = document.getElementById('drClaimBtn');
        const statusEl = document.getElementById('drClaimStatus');
        const streakCurrentEl = document.getElementById('drStreakCurrent');
        const streakBestEl = document.getElementById('drStreakBest');
        const totalEarnedEl = document.getElementById('drTotalEarned');
        const weekGrid = document.getElementById('drWeekGrid');

        if (!amountEl || !labelEl || !claimBtn || !statusEl || !streakCurrentEl || !streakBestEl || !totalEarnedEl || !weekGrid) {
            return;
        }

        if (!this.state.loaded) {
            amountEl.textContent = '--';
            labelEl.textContent = 'Cargando recompensas...';
            claimBtn.disabled = true;
            return;
        }

        // Recompensa de hoy
        if (this.state.todayReward > 0) {
            amountEl.textContent = this.state.todayReward;
            labelEl.textContent = 'Tokens disponibles hoy';
        } else {
            amountEl.textContent = '--';
            labelEl.textContent = 'Hoy no hay recompensa configurada';
        }

        // Botón de reclamar
        if (!window.Auth || !Auth.currentUser) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Inicia sesión para reclamar';
            statusEl.textContent = '';
        } else if (!this.state.canClaimToday || this.state.todayReward <= 0) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Ya reclamado hoy';
            statusEl.textContent = 'Vuelve mañana para una nueva recompensa.';
        } else {
            claimBtn.disabled = false;
            claimBtn.textContent = 'Reclamar ahora';
            statusEl.textContent = 'Haz clic para obtener tus tokens de hoy.';
        }

        // Progreso del jugador
        const streakCurrent = this.state.userRow?.streak_current || 0;
        const streakBest = this.state.userRow?.streak_best || 0;
        const totalEarned = this.state.userRow?.tokens_earned_total || 0;

        streakCurrentEl.textContent = `Racha actual: ${streakCurrent} día${streakCurrent === 1 ? '' : 's'}`;
        streakBestEl.textContent = `Mejor racha: ${streakBest} día${streakBest === 1 ? '' : 's'}`;
        totalEarnedEl.textContent = totalEarned;

        // Calendario semanal
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        weekGrid.innerHTML = '';

        for (let d = 0; d < 7; d++) {
            const cfg = this.state.config.find(c => c.weekday === d);
            const isToday = d === this.state.todayWeekday;

            const rewardAmount = cfg
                ? (Number(cfg.tokens_base || 0) + Number(cfg.tokens_bonus || 0))
                : 0;

            const cell = document.createElement('div');
            cell.className = `rounded-xl px-2 py-2 glass-effect flex flex-col items-center justify-center ${isToday ? 'border border-yellow-400' : ''}`;

            cell.innerHTML = `
                <p class="text-[10px] text-gray-400 mb-1">${dayNames[d]}</p>
                <p class="text-sm font-bold ${rewardAmount > 0 ? 'text-green-400' : 'text-gray-500'}">${rewardAmount > 0 ? rewardAmount : '--'}</p>
            `;

            weekGrid.appendChild(cell);
        }
    },

    /**
     * Reclamar recompensa de hoy
     */
    async claimToday() {
        try {
            if (!window.Auth || !Auth.currentUser || !Auth.currentProject || !Auth.currentProject.client) {
                UI?.showError?.('Debes iniciar sesión para reclamar recompensas');
                return;
            }

            if (!this.state.canClaimToday || this.state.todayReward <= 0) {
                UI?.showWarning?.('No hay recompensa disponible para reclamar hoy');
                return;
            }

            const client = Auth.currentProject.client;
            const today = new Date();
            const todayStr = today.toISOString().slice(0, 10);

            // Releer el estado actual del usuario para evitar doble reclamo
            let { data: currentRow, error: reloadError } = await client
                .from('user_weekly_rewards')
                .select('*')
                .eq('user_id', Auth.currentUser.id)
                .maybeSingle();

            if (reloadError && reloadError.code !== 'PGRST116') throw reloadError;

            if (currentRow && (currentRow.last_claimed_date || '').slice(0, 10) === todayStr) {
                this.state.userRow = currentRow;
                this.state.canClaimToday = false;
                this.updateGiftVisibility();
                this.renderPage();
                UI?.showWarning?.('Ya reclamaste la recompensa de hoy');
                return;
            }

            const reward = this.state.todayReward;

            // Calcular nueva racha
            let streakCurrent = 1;
            let streakBest = 1;
            let tokensEarnedTotal = reward;

            if (currentRow && currentRow.last_claimed_date) {
                const lastDate = new Date(currentRow.last_claimed_date);
                const diffMs = today.setHours(0,0,0,0) - lastDate.setHours(0,0,0,0);
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    streakCurrent = (currentRow.streak_current || 0) + 1;
                } else {
                    streakCurrent = 1;
                }

                streakBest = Math.max(currentRow.streak_best || 0, streakCurrent);
                tokensEarnedTotal = (currentRow.tokens_earned_total || 0) + reward;
            }

            const values = {
                user_id: Auth.currentUser.id,
                last_claimed_date: todayStr,
                last_claimed_weekday: this.state.todayWeekday,
                streak_current: streakCurrent,
                streak_best: streakBest,
                tokens_earned_total: tokensEarnedTotal,
                updated_at: new Date().toISOString()
            };

            let newRow = null;

            if (!currentRow) {
                const { data: inserted, error: insertError } = await client
                    .from('user_weekly_rewards')
                    .insert(values)
                    .select()
                    .maybeSingle();

                if (insertError) throw insertError;
                newRow = inserted;
            } else {
                const { data: updated, error: updateError } = await client
                    .from('user_weekly_rewards')
                    .update(values)
                    .eq('user_id', Auth.currentUser.id)
                    .select()
                    .maybeSingle();

                if (updateError) throw updateError;
                newRow = updated;
            }

            // Actualizar wallet del usuario
            const currentTokens = await Wallet.getTokens(Auth.currentUser.id);

            const { data: walletUpdated, error: walletError } = await client
                .from('wallets')
                .update({ tokens: currentTokens + reward })
                .eq('user_id', Auth.currentUser.id)
                .select('tokens')
                .maybeSingle();

            if (walletError) throw walletError;

            const newTokens = walletUpdated?.tokens ?? (currentTokens + reward);
            UI.updateTokensDisplay(newTokens);

            // Actualizar estado local
            this.state.userRow = newRow;
            this.state.canClaimToday = false;

            this.updateGiftVisibility();
            this.renderPage();

            UI?.showSuccess?.(`Has reclamado ${reward} tokens de recompensa diaria`);
        } catch (error) {
            console.error('Error reclamando recompensa diaria:', error);
            UI?.showError?.('No se pudo reclamar la recompensa diaria. Intenta de nuevo más tarde.');
        }
    }
};

// Exponer globalmente
window.DailyRewards = DailyRewards;