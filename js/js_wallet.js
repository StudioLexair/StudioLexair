/**
 * =====================================================
 * 💰 STUDIO LEXAIR - WALLET MODULE
 * Manejo de tokens y transacciones
 * =====================================================
 */

const Wallet = {
    /**
     * Obtener balance de tokens
     */
    async getTokens(userId) {
        try {
            if (!Auth.currentProject) {
                console.error('No hay proyecto activo');
                return 0;
            }

            const { data, error } = await Auth.currentProject.client
                .from('wallets')
                .select('tokens')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            return data?.tokens || 0;

        } catch (error) {
            console.error('Error obteniendo tokens:', error);
            return 0;
        }
    },

    /**
     * Comprar tokens (simulado)
     */
    async buyTokens(amount, price) {
        try {
            if (!Auth.currentUser) {
                UI.showError('Debes iniciar sesión primero');
                return false;
            }

            // Simular compra
            const confirmed = confirm(
                `💰 Comprar ${amount} tokens por $${price} USD?\n\n` +
                `(Esto es una simulación, no se cobrará nada)`
            );

            if (!confirmed) return false;

            // Actualizar balance
            const { data, error } = await Auth.currentProject.client
                .from('wallets')
                .update({ tokens: await this.getTokens(Auth.currentUser.id) + amount })
                .eq('user_id', Auth.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            UI.closeModal('buyTokensModal');
            UI.updateTokensDisplay(data.tokens);
            UI.showSuccess(`¡${amount} tokens agregados exitosamente!`);

            return true;

        } catch (error) {
            console.error('Error comprando tokens:', error);
            UI.showError('Error al comprar tokens');
            return false;
        }
    },

    /**
     * Gastar tokens
     */
    async spendTokens(amount) {
        try {
            const currentTokens = await this.getTokens(Auth.currentUser.id);

            if (currentTokens < amount) {
                return false;
            }

            const { data, error } = await Auth.currentProject.client
                .from('wallets')
                .update({ tokens: currentTokens - amount })
                .eq('user_id', Auth.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            UI.updateTokensDisplay(data.tokens);
            return true;

        } catch (error) {
            console.error('Error gastando tokens:', error);
            return false;
        }
    }
};

// Hacer disponible globalmente
window.Wallet = Wallet;
