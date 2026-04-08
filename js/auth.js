// auth.js
// Handles Supabase Session state and redirects

async function checkAuth(isLoginPage = false) {
    if (!window.supabaseClient) {
        console.warn("Supabase client not loaded yet");
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session && !isLoginPage) {
        // Nãot logged in, redirect to index (login)
        window.location.href = 'index.html';
    } else if (session && isLoginPage) {
        // Logged in but on login page, redirect to trainer selection
        window.location.href = 'selecionar-treinador.html';
    }
}

// Automatically check auth on load
document.addEventListener('DOMContentLoaded', () => {
    // Avoid redirect loop if we are already on index.html or atleta-login.html
    const currentPath = window.location.pathname.toLowerCase();
    const isLoginPage = currentPath.includes('index.html') ||
        currentPath.includes('atleta-login.html') ||
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
    localStorage.removeItem('tkd_scout_db'); // Clear cached state for security
    window.location.href = 'index.html';
};
