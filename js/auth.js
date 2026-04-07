// auth.js
// Handles Supabase Session state and redirects

async function checkAuth(isLoginPage = false) {
    if (!window.supabaseClient) {
        console.warn("Supabase client not loaded yet");
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session && !isLoginPage) {
        // Not logged in, redirect to index (login)
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
        currentPath.includes('selecionar-treinador.html') ||
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
    } else if (event === 'SIGNED_IN') {
        const currentPath = window.location.pathname.toLowerCase();
        const isLoginPage = currentPath.includes('index.html') ||
            currentPath.includes('atleta-login.html') ||
            currentPath.endsWith('/');
        if (isLoginPage) {
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
