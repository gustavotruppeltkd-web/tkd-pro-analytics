const SUPABASE_URL = 'https://jruxbedvmlkjpfaigzqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fwEluSBv1aguLjX70C2P6Q_54n55z49';

// Safari (modo privado) bloqueia localStorage — usa memória como fallback
function _safeStorage() {
    try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        return localStorage;
    } catch (_) {
        const mem = {};
        return {
            getItem: k => mem[k] ?? null,
            setItem: (k, v) => { mem[k] = v; },
            removeItem: k => { delete mem[k]; },
        };
    }
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { storage: _safeStorage(), persistSession: true, autoRefreshToken: true }
});

window.supabaseClient = supabaseClient;
