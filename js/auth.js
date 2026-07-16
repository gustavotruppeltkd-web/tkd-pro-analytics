// auth.js
// Handles Supabase Session state and redirects

async function checkAuth(isLoginPage = false) {
    if (!window.supabaseClient) {
        console.warn("Supabase client not loaded yet");
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    // Allow athlete portal access if the athlete logged in via PIN (shared link)
    const athleteSession = sessionStorage.getItem('tkd_atleta_id');
    const currentPath = window.location.pathname.toLowerCase();
    if (athleteSession && currentPath.includes('atleta-portal')) {
        return; // Athlete has a valid PIN session — no trainer auth required
    }

    if (!session && !isLoginPage) {
        // Not logged in, redirect to index (login)
        window.location.href = 'index.html';
        return;
    } else if (session && isLoginPage) {
        // Logged in but on login page, redirect to trainer selection
        window.location.href = 'selecionar-treinador.html';
        return;
    }

    // Revalida a autorização do treinador logado em TODA página protegida.
    // Se o e-mail foi removido da lista OU bloqueado pelo admin, desloga e volta
    // ao login. (Erro de rede NÃO derruba — fail-open p/ não travar por engano.)
    if (session && !isLoginPage) {
        try {
            const email = (session.user.email || '').toLowerCase();
            // Via RPC: valida o próprio e-mail sem o cliente poder ler a lista
            const { data: authInfo, error } = await window.supabaseClient
                .rpc('is_email_authorized', { p_email: email });
            if (!error && authInfo && (!authInfo.found || authInfo.blocked)) {
                sessionStorage.setItem('tkd_access_revoked', authInfo.blocked ? 'blocked' : 'removed');
                await window.supabaseClient.auth.signOut();
                localStorage.removeItem('tkd_scout_db');
                window.location.href = 'index.html';
            }
        } catch (e) {
            console.warn('Falha ao revalidar autorização (mantendo acesso):', e);
        }
    }
}

// Automatically check auth on load
document.addEventListener('DOMContentLoaded', () => {
    // Avoid redirect loop if we are already on index.html, atleta-login.html or atleta-portal.html (PIN-gated)
    const currentPath = window.location.pathname.toLowerCase();
    const isLoginPage = currentPath.includes('index.html') ||
        currentPath.includes('atleta-login.html') ||
        currentPath.includes('atleta-portal.html') ||
        currentPath.endsWith('/');

    checkAuth(isLoginPage);
});

// Listener for active auth changes (e.g. logging out from another tab)
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        const currentPath = window.location.pathname.toLowerCase();
        const isLoginPage = currentPath.includes('index.html') || currentPath.includes('atleta-login.html') || currentPath.endsWith('/');
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
    } else if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        if (window.location.hash && window.location.hash.includes('type=recovery')) {
            window.location.href = 'redefinir-senha.html' + window.location.hash;
            return;
        }

        // Smart cache management: only wipe if a DIFFERENT user is logging in
        if (session && session.user) {
            const newUserId = session.user.id;
            const lastUserId = localStorage.getItem('tkd_last_user_id');

            if (lastUserId && lastUserId !== newUserId) {
                // Different user — purge old data so it doesn't bleed into the new account
                localStorage.removeItem('tkd_scout_db');
                localStorage.removeItem('tkd_active_coach_id');
            }

            // Always update the stored user id
            localStorage.setItem('tkd_last_user_id', newUserId);
        }

        const currentPath = window.location.pathname.toLowerCase();
        const isLoginPage = currentPath.includes('index.html') ||
            currentPath.includes('atleta-login.html') ||
            currentPath.endsWith('/');
        if (isLoginPage && !currentPath.includes('selecionar-treinador.html')) {
            window.location.href = 'selecionar-treinador.html';
        }
    }
});

// Global logout function available to all pages
window.logoutUser = async function () {
    await window.supabaseClient.auth.signOut();
    // Limpar todo o cache local para que o próximo login não herde dados desta sessão
    localStorage.removeItem('tkd_scout_db');
    localStorage.removeItem('tkd_coach_id');
    localStorage.removeItem('tkd_active_coach_id');
    sessionStorage.removeItem('tkd_coach_id');
    window.location.href = 'index.html';
};
