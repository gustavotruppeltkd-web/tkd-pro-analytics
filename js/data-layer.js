(function () {
    async function _userId() {
        const { data } = await window.supabaseClient.auth.getUser();
        return data?.user?.id || null;
    }

    async function create(table, entity) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Não autenticado');
        const row = { coach_id, ...entity, updated_at: new Date().toISOString() };
        const { data, error } = await window.supabaseClient
            .from(table).insert(row).select().single();
        if (error) throw error;
        return data;
    }

    async function update(table, id, patch) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Não autenticado');
        const { data, error } = await window.supabaseClient
            .from(table)
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq('coach_id', coach_id)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function softDelete(table, id) {
        return update(table, id, { deleted_at: new Date().toISOString() });
    }

    async function list(table, filter = {}) {
        const coach_id = await _userId();
        if (!coach_id) return [];
        let q = window.supabaseClient.from(table).select('*')
            .eq('coach_id', coach_id).is('deleted_at', null);
        for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
    }

    async function subscribe(table, callback) {
        const coach_id = await _userId();
        if (!coach_id) return null;
        return window.supabaseClient
            .channel(`${table}:${coach_id}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table,
                filter: `coach_id=eq.${coach_id}`
            }, callback)
            .subscribe();
    }

    async function getSettings() {
        const coach_id = await _userId();
        if (!coach_id) return null;
        const { data, error } = await window.supabaseClient
            .from('coach_settings').select('*').eq('coach_id', coach_id).maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async function updateSettings(patch) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Não autenticado');
        const { data, error } = await window.supabaseClient
            .from('coach_settings')
            .upsert({ coach_id, ...patch, updated_at: new Date().toISOString() })
            .select().single();
        if (error) throw error;
        return data;
    }

    window.Data = { create, update, softDelete, list, subscribe, getSettings, updateSettings };
})();
