(function () {
    // Mapeia campos camelCase do frontend → colunas snake_case extraídas (para queries).
    // O objeto inteiro continua em row.data (JSONB), preservando o schema original.
    const COLUMN_MAP = {
        turmas:        { nome: 'nome', foto: 'foto', tipo: 'tipo', contexto: 'contexto' },
        alunos:        { turmaId: 'turma_id', nome: 'nome', faixa: 'faixa',
                         pesoCategoria: 'peso_categoria', categoriaPeso: 'peso_categoria',
                         pesoAtual: 'peso_atual', dataNascimento: 'nascimento',
                         sexo: 'sexo', pin: 'pin', avatar: 'avatar', foto: 'foto',
                         gms: 'gms', kukkiwon: 'kukkiwon', cbtkd: 'cbtkd',
                         planoId: 'plano_id', statusFin: 'status_pagamento',
                         statusPagamento: 'status_pagamento' },
        treinos:       { turmaId: 'turma_id', data: 'data', tipo: 'tipo', titulo: 'titulo',
                         blocos: 'blocos', atletasIds: 'atletas_ids', obs: 'obs',
                         duracaoMins: 'duracao_mins', psePlanejada: 'pse_planejada' },
        eventos:       { titulo: 'titulo', data: 'data', hora: 'hora', local: 'local',
                         descricao: 'descricao', tipo: 'tipo' },
        planos:        { nome: 'nome', valor: 'valor', descricao: 'descricao' },
        horarios:      { turmaId: 'turma_id', diaSemana: 'dia_semana',
                         horaInicio: 'hora_inicio', horaFim: 'hora_fim' },
        chamadas:      { turmaId: 'turma_id', data: 'data',
                         atletasPresentes: 'atletas_presentes' },
        presencas:     { atletaId: 'atleta_id', data: 'data', presente: 'presente' },
        lesoes:        { atletaId: 'atleta_id', data: 'data',
                         descricao: 'descricao', status: 'status' },
        lutas_scout:   { atletaId: 'atleta_id', adversario: 'adversario',
                         data: 'data', competicao: 'competicao',
                         rounds: 'rounds', timeline: 'timeline',
                         estatisticas: 'estatisticas',
                         avaliacaoTreinador: 'avaliacao_treinador',
                         observacaoFinal: 'observacao_final' },
        competicoes:   { nome: 'nome', data: 'data', local: 'local' },
        antropometria: { atletaId: 'atleta_id', data: 'data',
                         peso: 'peso', altura: 'altura' }
    };

    function _payloadColumn(table) {
        // turmas/alunos usam 'data' como JSONB; treinos usa 'payload', etc.
        const PAYLOAD_BY_TABLE = {
            turmas: 'data', alunos: 'data',
            treinos: 'payload', eventos: 'payload', planos: 'payload',
            horarios: 'payload', chamadas: 'payload', presencas: 'payload',
            lesoes: 'payload', lutas_scout: 'payload',
            competicoes: 'payload', antropometria: 'payload'
        };
        return PAYLOAD_BY_TABLE[table] || 'data';
    }

    function _toRow(table, entity) {
        const map = COLUMN_MAP[table] || {};
        const row = {};
        // Extrai colunas conhecidas
        Object.keys(entity).forEach(k => {
            if (map[k] !== undefined && entity[k] !== undefined) {
                row[map[k]] = entity[k];
            }
        });
        // Salva o objeto inteiro no campo JSONB
        row[_payloadColumn(table)] = entity;
        return row;
    }

    function _fromRow(table, row) {
        // Retorna o JSONB original (preserva camelCase). Garante id.
        const payload = row[_payloadColumn(table)] || {};
        if (!payload.id && row.id !== undefined) payload.id = row.id;
        return payload;
    }

    async function _userId() {
        const { data } = await window.supabaseClient.auth.getUser();
        return data?.user?.id || null;
    }

    async function create(table, entity) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Não autenticado');
        const row = { coach_id, id: entity.id, ..._toRow(table, entity),
                      updated_at: new Date().toISOString() };
        const { data, error } = await window.supabaseClient
            .from(table).insert(row).select().single();
        if (error) throw error;
        return _fromRow(table, data);
    }

    async function update(table, id, patch) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Não autenticado');
        // Busca a row atual para mesclar o JSONB completo
        const { data: current, error: gErr } = await window.supabaseClient
            .from(table).select('*').eq('coach_id', coach_id).eq('id', id).single();
        if (gErr) throw gErr;
        const merged = { ..._fromRow(table, current), ...patch, id };
        const row = { ..._toRow(table, merged), updated_at: new Date().toISOString() };
        const { data, error } = await window.supabaseClient
            .from(table).update(row)
            .eq('coach_id', coach_id).eq('id', id)
            .select().single();
        if (error) throw error;
        return _fromRow(table, data);
    }

    async function softDelete(table, id) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Não autenticado');
        const { data, error } = await window.supabaseClient
            .from(table)
            .update({ deleted_at: new Date().toISOString(),
                      updated_at: new Date().toISOString() })
            .eq('coach_id', coach_id).eq('id', id)
            .select().single();
        if (error) throw error;
        return _fromRow(table, data);
    }

    async function list(table, filter = {}) {
        const coach_id = await _userId();
        if (!coach_id) return [];
        let q = window.supabaseClient.from(table).select('*')
            .eq('coach_id', coach_id).is('deleted_at', null);
        const map = COLUMN_MAP[table] || {};
        for (const [k, v] of Object.entries(filter)) {
            const col = map[k] || k;
            q = q.eq(col, v);
        }
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map(r => _fromRow(table, r));
    }

    async function subscribe(table, callback) {
        const coach_id = await _userId();
        if (!coach_id) return null;
        return window.supabaseClient
            .channel(`${table}:${coach_id}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table,
                filter: `coach_id=eq.${coach_id}`
            }, (payload) => {
                const newRow = payload.new ? _fromRow(table, payload.new) : null;
                const oldRow = payload.old ? _fromRow(table, payload.old) : null;
                callback({ eventType: payload.eventType, new: newRow, old: oldRow,
                           rawNew: payload.new, rawOld: payload.old });
            })
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

    // Debounced version: agrega múltiplos patches em uma única request por chave.
    // Útil para campos que mudam em rápida sucessão (mesociclos, notifications, etc).
    const _debouncePending = {};
    const _debounceTimers = {};
    function updateSettingsDebounced(patch, delayMs) {
        delayMs = delayMs || 800;
        Object.assign(_debouncePending, patch);
        const key = '__settings__';
        if (_debounceTimers[key]) clearTimeout(_debounceTimers[key]);
        _debounceTimers[key] = setTimeout(() => {
            const toSend = { ..._debouncePending };
            for (const k of Object.keys(_debouncePending)) delete _debouncePending[k];
            updateSettings(toSend).catch(e => console.warn('updateSettings debounced fail', e));
        }, delayMs);
    }

    function subscribeSettings(callback) {
        return _userId().then(coach_id => {
            if (!coach_id) return null;
            return window.supabaseClient
                .channel(`coach_settings:${coach_id}`)
                .on('postgres_changes', {
                    event: '*', schema: 'public', table: 'coach_settings',
                    filter: `coach_id=eq.${coach_id}`
                }, (payload) => callback(payload.new || null))
                .subscribe();
        });
    }

    window.Data = { create, update, softDelete, list, subscribe, getSettings, updateSettings,
                    updateSettingsDebounced, subscribeSettings,
                    _fromRow, _toRow, COLUMN_MAP };
})();
