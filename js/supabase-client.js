const SUPABASE_URL = 'https://jruxbedvmlkjpfaigzqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fwEluSBv1aguLjX70C2P6Q_54n55z49';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = supabaseClient;
