# Migration Plan — App State Blob → Per-Entity Tables

## Context (read first)

This app is currently storing each coach's entire database as a single JSONB blob in `app_state.data`. This causes a class of bugs we've been chasing:

- Drag/create then refresh fast → change is lost
- Turmas deleted reappear when logging in elsewhere
- Last-write-wins overwrites silently when two browsers are open
- saveDB has a 500ms debounce and any await inside risks data loss on quick navigation

The fix is structural: split the blob into per-entity tables, enforce RLS at the row level, write per operation (no debounced batch), and use Supabase realtime per table.

This plan executes in 4 phases. **Each phase ends with verification before moving to the next.** Rollback is preserved by leaving `app_state` in place until phase 4.

---

## Architecture target

### Tables (all keyed by `(coach_id, id)`)

Single-row settings:
- `coach_settings` — treinador profile, periodizacao, notifications, treino_templates, questionarios, onboarding_done, active_turma_id

Per-entity:
- `turmas`, `alunos`, `treinos`, `eventos`, `planos`, `horarios`
- `chamadas`, `presencas`, `lesoes`
- `lutas_scout`, `competicoes`, `antropometria`

Already exists, leave alone:
- `app_state` — kept as fallback during migration; eventually deprecated
- `athlete_responses` — already proper append-only event table; keep as-is
- `authorized_emails` — keep as-is

### Common columns on entity tables

| Column | Type | Purpose |
|---|---|---|
| `id` | BIGINT | Existing numeric id (preserved from blob) |
| `coach_id` | UUID NOT NULL | Owner; references auth.users |
| `created_at` | TIMESTAMPTZ DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ DEFAULT NOW() | Set by app on every UPDATE |
| `deleted_at` | TIMESTAMPTZ NULL | Soft delete marker |
| `data` | JSONB DEFAULT `'{}'` | Catch-all for fields we don't extract; preserves any key we missed |

Plus entity-specific extracted columns (see DDL below).

PRIMARY KEY is `(coach_id, id)` — keeps existing numeric IDs unique per coach without UUID rewrite.

### RLS rule

Every entity table:

```sql
CREATE POLICY "<table>_coach_owns" ON <table>
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
```

This makes coach data isolation a database guarantee, not an app guarantee.

Athlete portal: **out of scope for phases 1-3**. Athletes continue reading from `app_state`, which we keep in sync via best-effort dual-write during phase 2-3. Phase 4 (later) migrates athlete portal to an RPC.

---

## Phase 1 — DDL + RLS + One-time Migration

**Goal:** New tables exist, populated from existing `app_state`. Frontend untouched. App still works on the old path.

### Step 1.1 — Run DDL (Supabase Management API)

```bash
# PAT lives in memory/project_supabase.md — do NOT inline it in repo files.
# Pattern (load PAT into env var locally before running):
curl -X POST 'https://api.supabase.com/v1/projects/jruxbedvmlkjpfaigzqs/database/query' \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H 'Content-Type: application/json' \
  -d '{"query": "<paste DDL below>"}'
```

DDL to run (single transaction):

```sql
BEGIN;

-- Singleton settings per coach
CREATE TABLE IF NOT EXISTS coach_settings (
  coach_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  treinador JSONB DEFAULT '{}'::jsonb,
  periodizacao JSONB DEFAULT '{}'::jsonb,
  onboarding_done BOOLEAN DEFAULT FALSE,
  active_turma_id BIGINT,
  notifications JSONB DEFAULT '[]'::jsonb,
  treino_templates JSONB DEFAULT '[]'::jsonb,
  questionarios JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turmas (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  foto TEXT,
  tipo TEXT,
  contexto TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS alunos (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turma_id BIGINT,
  nome TEXT NOT NULL,
  faixa TEXT,
  peso_categoria TEXT,
  peso_atual NUMERIC,
  nascimento DATE,
  sexo TEXT,
  pin TEXT,
  avatar TEXT,
  foto TEXT,
  gms TEXT,
  kukkiwon TEXT,
  cbtkd TEXT,
  plano_id BIGINT,
  status_pagamento TEXT,
  contato JSONB DEFAULT '{}'::jsonb,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS treinos (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turma_id BIGINT,
  data DATE NOT NULL,
  tipo TEXT,
  titulo TEXT,
  blocos JSONB DEFAULT '[]'::jsonb,
  atletas_ids JSONB,
  obs TEXT,
  duracao_mins INTEGER,
  pse_planejada NUMERIC,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS eventos (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME,
  local TEXT,
  descricao TEXT,
  tipo TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS planos (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC,
  descricao TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS horarios (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turma_id BIGINT,
  dia_semana INTEGER,
  hora_inicio TIME,
  hora_fim TIME,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS chamadas (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turma_id BIGINT,
  data DATE NOT NULL,
  atletas_presentes JSONB DEFAULT '[]'::jsonb,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS presencas (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atleta_id BIGINT,
  data DATE NOT NULL,
  presente BOOLEAN,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS lesoes (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atleta_id BIGINT,
  data DATE,
  descricao TEXT,
  status TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS lutas_scout (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atleta_id BIGINT,
  adversario TEXT,
  data DATE,
  competicao TEXT,
  rounds JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  estatisticas JSONB DEFAULT '{}'::jsonb,
  avaliacao_treinador TEXT,
  observacao_final TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS competicoes (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  data DATE,
  local TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

CREATE TABLE IF NOT EXISTS antropometria (
  id BIGINT NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atleta_id BIGINT,
  data DATE,
  peso NUMERIC,
  altura NUMERIC,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (coach_id, id)
);

-- Enable RLS on every new table
ALTER TABLE coach_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lutas_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE competicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE antropometria ENABLE ROW LEVEL SECURITY;

-- Policies: each coach can only see/touch their own rows
CREATE POLICY coach_settings_owner ON coach_settings FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY turmas_owner ON turmas FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY alunos_owner ON alunos FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY treinos_owner ON treinos FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY eventos_owner ON eventos FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY planos_owner ON planos FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY horarios_owner ON horarios FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY chamadas_owner ON chamadas FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY presencas_owner ON presencas FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY lesoes_owner ON lesoes FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY lutas_scout_owner ON lutas_scout FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY competicoes_owner ON competicoes FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY antropometria_owner ON antropometria FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- Add new tables to realtime publication (so subscriptions work)
ALTER PUBLICATION supabase_realtime ADD TABLE
  coach_settings, turmas, alunos, treinos, eventos, planos, horarios,
  chamadas, presencas, lesoes, lutas_scout, competicoes, antropometria;

COMMIT;
```

Save the SQL above to `sql/migration_phase1_ddl.sql` for version control.

### Step 1.2 — Migration script (populate from app_state)

Run as a single SQL statement via the Management API. This is idempotent (`ON CONFLICT DO NOTHING`), so safe to re-run.

Save to `sql/migration_phase1_data.sql`:

```sql
DO $$
DECLARE
  rec RECORD;
  v_coach_id UUID;
  v_data JSONB;
  v_item JSONB;
BEGIN
  FOR rec IN SELECT project_id, data FROM app_state WHERE data IS NOT NULL LOOP
    v_coach_id := rec.project_id;
    v_data := rec.data;

    -- coach_settings (singleton)
    INSERT INTO coach_settings
      (coach_id, treinador, periodizacao, onboarding_done, active_turma_id,
       notifications, treino_templates, questionarios)
    VALUES (
      v_coach_id,
      COALESCE(v_data->'treinadores'->0, '{}'::jsonb),
      COALESCE(v_data->'periodizacao', '{}'::jsonb),
      COALESCE((v_data->>'onboardingDone')::boolean, false),
      NULLIF(v_data->>'activeTurmaId', '')::bigint,
      COALESCE(v_data->'notifications', '[]'::jsonb),
      COALESCE(v_data->'treinoTemplates', '[]'::jsonb),
      COALESCE(v_data->'questionarios', '[]'::jsonb)
    )
    ON CONFLICT (coach_id) DO NOTHING;

    -- turmas
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'turmas', '[]'::jsonb)) LOOP
      INSERT INTO turmas (id, coach_id, nome, foto, tipo, contexto, data)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        COALESCE(v_item->>'nome', '(sem nome)'),
        v_item->>'foto', v_item->>'tipo', v_item->>'contexto', v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- alunos
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'alunos', '[]'::jsonb)) LOOP
      INSERT INTO alunos
        (id, coach_id, turma_id, nome, faixa, peso_categoria, peso_atual,
         nascimento, sexo, pin, avatar, foto, gms, kukkiwon, cbtkd,
         plano_id, status_pagamento, contato, data)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'turmaId', '')::bigint,
        COALESCE(v_item->>'nome', '(sem nome)'),
        v_item->>'faixa',
        COALESCE(v_item->>'pesoCategoria', v_item->>'peso'),
        NULLIF(v_item->>'pesoAtual', '')::numeric,
        NULLIF(v_item->>'nascimento', '')::date,
        v_item->>'sexo',
        v_item->>'pin',
        v_item->>'avatar',
        v_item->>'foto',
        v_item->>'gms', v_item->>'kukkiwon', v_item->>'cbtkd',
        NULLIF(v_item->>'planoId', '')::bigint,
        v_item->>'statusPagamento',
        COALESCE(v_item->'contato', '{}'::jsonb),
        v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- treinos
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'treinos', '[]'::jsonb)) LOOP
      INSERT INTO treinos
        (id, coach_id, turma_id, data, tipo, titulo, blocos, atletas_ids,
         obs, duracao_mins, pse_planejada, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'turmaId', '')::bigint,
        NULLIF(v_item->>'data', '')::date,
        v_item->>'tipo', v_item->>'titulo',
        COALESCE(v_item->'blocos', '[]'::jsonb),
        v_item->'atletasIds',
        v_item->>'obs',
        NULLIF(v_item->>'duracaoMins', '')::integer,
        NULLIF(v_item->>'psePlanejada', '')::numeric,
        v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- eventos
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'eventos', '[]'::jsonb)) LOOP
      INSERT INTO eventos (id, coach_id, titulo, data, hora, local, descricao, tipo, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        COALESCE(v_item->>'titulo', '(sem título)'),
        NULLIF(v_item->>'data', '')::date,
        NULLIF(v_item->>'hora', '')::time,
        v_item->>'local', v_item->>'descricao', v_item->>'tipo', v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- planos
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'planos', '[]'::jsonb)) LOOP
      INSERT INTO planos (id, coach_id, nome, valor, descricao, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        COALESCE(v_item->>'nome', '(sem nome)'),
        NULLIF(v_item->>'valor', '')::numeric,
        v_item->>'descricao', v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- horarios
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'horarios', '[]'::jsonb)) LOOP
      INSERT INTO horarios (id, coach_id, turma_id, dia_semana, hora_inicio, hora_fim, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'turmaId', '')::bigint,
        NULLIF(v_item->>'diaSemana', '')::integer,
        NULLIF(v_item->>'horaInicio', '')::time,
        NULLIF(v_item->>'horaFim', '')::time,
        v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- chamadas
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'chamadas', '[]'::jsonb)) LOOP
      INSERT INTO chamadas (id, coach_id, turma_id, data, atletas_presentes, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'turmaId', '')::bigint,
        NULLIF(v_item->>'data', '')::date,
        COALESCE(v_item->'atletasPresentes', '[]'::jsonb),
        v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- presencas
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'presencas', '[]'::jsonb)) LOOP
      INSERT INTO presencas (id, coach_id, atleta_id, data, presente, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'atletaId', '')::bigint,
        NULLIF(v_item->>'data', '')::date,
        (v_item->>'presente')::boolean,
        v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- lesoes
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'lesoes', '[]'::jsonb)) LOOP
      INSERT INTO lesoes (id, coach_id, atleta_id, data, descricao, status, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'atletaId', '')::bigint,
        NULLIF(v_item->>'data', '')::date,
        v_item->>'descricao', v_item->>'status', v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- lutas_scout
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'lutasScout', '[]'::jsonb)) LOOP
      INSERT INTO lutas_scout
        (id, coach_id, atleta_id, adversario, data, competicao,
         rounds, timeline, estatisticas, avaliacao_treinador, observacao_final, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'atletaId', '')::bigint,
        v_item->>'adversario',
        NULLIF(v_item->>'data', '')::date,
        v_item->>'competicao',
        COALESCE(v_item->'rounds', '[]'::jsonb),
        COALESCE(v_item->'timeline', '[]'::jsonb),
        COALESCE(v_item->'estatisticas', '{}'::jsonb),
        v_item->>'avaliacaoTreinador',
        v_item->>'observacaoFinal',
        v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- competicoes
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'competicoes', '[]'::jsonb)) LOOP
      INSERT INTO competicoes (id, coach_id, nome, data, local, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        v_item->>'nome',
        NULLIF(v_item->>'data', '')::date,
        v_item->>'local', v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

    -- antropometria
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'antropometria', '[]'::jsonb)) LOOP
      INSERT INTO antropometria (id, coach_id, atleta_id, data, peso, altura, payload)
      VALUES (
        (v_item->>'id')::bigint, v_coach_id,
        NULLIF(v_item->>'atletaId', '')::bigint,
        NULLIF(v_item->>'data', '')::date,
        NULLIF(v_item->>'peso', '')::numeric,
        NULLIF(v_item->>'altura', '')::numeric,
        v_item
      ) ON CONFLICT (coach_id, id) DO NOTHING;
    END LOOP;

  END LOOP;
END $$;
```

### Step 1.3 — Verification

Save to `sql/migration_phase1_verify.sql` and run after data migration:

```sql
-- For each coach, compare counts blob vs new tables.
-- Output: coach_id, entity, blob_count, new_count, diff
SELECT
  rec.coach_id,
  entity,
  blob_count,
  new_count,
  blob_count - new_count AS diff
FROM (
  SELECT
    project_id AS coach_id,
    jsonb_array_length(COALESCE(data->'turmas', '[]'::jsonb)) AS turmas_n,
    jsonb_array_length(COALESCE(data->'alunos', '[]'::jsonb)) AS alunos_n,
    jsonb_array_length(COALESCE(data->'treinos', '[]'::jsonb)) AS treinos_n,
    jsonb_array_length(COALESCE(data->'eventos', '[]'::jsonb)) AS eventos_n,
    jsonb_array_length(COALESCE(data->'planos', '[]'::jsonb)) AS planos_n,
    jsonb_array_length(COALESCE(data->'horarios', '[]'::jsonb)) AS horarios_n,
    jsonb_array_length(COALESCE(data->'chamadas', '[]'::jsonb)) AS chamadas_n,
    jsonb_array_length(COALESCE(data->'presencas', '[]'::jsonb)) AS presencas_n,
    jsonb_array_length(COALESCE(data->'lesoes', '[]'::jsonb)) AS lesoes_n,
    jsonb_array_length(COALESCE(data->'lutasScout', '[]'::jsonb)) AS lutas_n,
    jsonb_array_length(COALESCE(data->'competicoes', '[]'::jsonb)) AS comp_n,
    jsonb_array_length(COALESCE(data->'antropometria', '[]'::jsonb)) AS antro_n
  FROM app_state
) rec
CROSS JOIN LATERAL (VALUES
  ('turmas', rec.turmas_n, (SELECT COUNT(*) FROM turmas WHERE coach_id = rec.coach_id)),
  ('alunos', rec.alunos_n, (SELECT COUNT(*) FROM alunos WHERE coach_id = rec.coach_id)),
  ('treinos', rec.treinos_n, (SELECT COUNT(*) FROM treinos WHERE coach_id = rec.coach_id)),
  ('eventos', rec.eventos_n, (SELECT COUNT(*) FROM eventos WHERE coach_id = rec.coach_id)),
  ('planos', rec.planos_n, (SELECT COUNT(*) FROM planos WHERE coach_id = rec.coach_id)),
  ('horarios', rec.horarios_n, (SELECT COUNT(*) FROM horarios WHERE coach_id = rec.coach_id)),
  ('chamadas', rec.chamadas_n, (SELECT COUNT(*) FROM chamadas WHERE coach_id = rec.coach_id)),
  ('presencas', rec.presencas_n, (SELECT COUNT(*) FROM presencas WHERE coach_id = rec.coach_id)),
  ('lesoes', rec.lesoes_n, (SELECT COUNT(*) FROM lesoes WHERE coach_id = rec.coach_id)),
  ('lutas_scout', rec.lutas_n, (SELECT COUNT(*) FROM lutas_scout WHERE coach_id = rec.coach_id)),
  ('competicoes', rec.comp_n, (SELECT COUNT(*) FROM competicoes WHERE coach_id = rec.coach_id)),
  ('antropometria', rec.antro_n, (SELECT COUNT(*) FROM antropometria WHERE coach_id = rec.coach_id))
) AS t(entity, blob_count, new_count)
WHERE blob_count <> new_count;
```

If this returns no rows, counts match for every coach. If anything is off, investigate before proceeding.

### Phase 1 acceptance criteria

- [ ] DDL ran without error
- [ ] Data migration ran without error
- [ ] Verification query returns 0 rows (counts match)
- [ ] Spot check: pick one coach manually, compare 3 random turmas, 3 random alunos, 3 random treinos
- [ ] Frontend untouched, app still works on the old path

**Commit message:** `feat(db): phase 1 — create per-entity tables and migrate from app_state blob`

---

## Phase 2 — Frontend writes go to new tables

**Goal:** Every create/update/delete in the coach UI hits the new tables. `app_state` keeps being updated by the legacy code path as a fallback (so athlete portal continues to work). Reads still use the in-memory `db` populated from `app_state`.

### Step 2.1 — Create the data SDK

Create `js/data-layer.js`:

```js
// Per-entity data access layer. Replaces direct mutation of db arrays + saveDB().
// Each call is one Supabase API request — no debounce, no batching, no race.

(function () {
    async function _userId() {
        const { data } = await window.supabaseClient.auth.getUser();
        return data?.user?.id || null;
    }

    async function create(table, entity) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Not authenticated');
        const row = { coach_id, ...entity, updated_at: new Date().toISOString() };
        const { data, error } = await window.supabaseClient
            .from(table).insert(row).select().single();
        if (error) throw error;
        return data;
    }

    async function update(table, id, patch) {
        const coach_id = await _userId();
        if (!coach_id) throw new Error('Not authenticated');
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

    // Settings (singleton per coach)
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
        if (!coach_id) throw new Error('Not authenticated');
        const { data, error } = await window.supabaseClient
            .from('coach_settings')
            .upsert({ coach_id, ...patch, updated_at: new Date().toISOString() })
            .select().single();
        if (error) throw error;
        return data;
    }

    window.Data = { create, update, softDelete, list, subscribe, getSettings, updateSettings };
})();
```

Add `<script src="js/data-layer.js"></script>` after `js/supabase-client.js` in every HTML file. Pattern: `<script src="js/supabase-client.js"></script>` followed by `<script src="js/data-layer.js"></script>`.

### Step 2.2 — Migrate write sites, one entity at a time

For each entity, find every place that mutates `db.<entity>` and replace with `Data.<op>` calls. Keep `saveDB()` for now so `app_state` still tracks (legacy fallback).

**Pattern for a CREATE:**

```js
// Before
const novaTurma = { id: Date.now(), nome, foto, tipo };
db.turmas.push(novaTurma);
saveDB();

// After
const novaTurma = { id: Date.now(), nome, foto, tipo };
try {
    await Data.create('turmas', novaTurma);
    db.turmas.push(novaTurma); // keep cache consistent
    saveDB(); // legacy app_state mirror — best effort
} catch (e) {
    showToast('Erro ao criar turma: ' + e.message, 'error');
    return;
}
```

**Pattern for an UPDATE:**

```js
// Before
turma.nome = novoNome;
saveDB();

// After
try {
    await Data.update('turmas', turma.id, { nome: novoNome });
    turma.nome = novoNome;
    saveDB();
} catch (e) {
    showToast('Erro ao salvar: ' + e.message, 'error');
    return;
}
```

**Pattern for a DELETE:**

```js
// Before
db.turmas = db.turmas.filter(t => t.id !== id);
saveDB();

// After
try {
    await Data.softDelete('turmas', id);
    db.turmas = db.turmas.filter(t => t.id !== id);
    saveDB();
} catch (e) {
    showToast('Erro ao excluir: ' + e.message, 'error');
    return;
}
```

**Sites to modify (search by file):**

| Entity | Files / functions to update |
|---|---|
| turmas | `turmas.html` — `saveTurma`, `saveEditTurma`, `deleteTurma` |
| alunos | `dashboard-turma-dados.html` — `saveAluno`, `editAluno`, `deleteAluno`; `perfil-aluno.html` — edits |
| treinos | `js/treino-equipe.js` — `saveTreino`, `deleteTreinoAtual`, `duplicateTreinoAtual`, `onDayDrop`, `copyPreviousWeek`, template ops |
| eventos | `calendario.html` — `saveEvent`, `deleteEvent` |
| planos | `dashboard-turma-dados.html` / `financeiro.html` — plan management |
| horarios | `dashboard-turma-dados.html` — schedule management |
| chamadas | `dashboard-aulas.html` — `salvarChamada` |
| presencas | wherever attendance is recorded |
| lesoes | `perfil-aluno.html` — injury tracking |
| lutas_scout | `js/scout-video.js` — `saveScout`, scout edits/deletes |
| competicoes | competition tracking pages |
| antropometria | `perfil-aluno.html` — measurements |

Run a grep to find every site:
```bash
grep -rn "db\.\(turmas\|alunos\|treinos\|eventos\|planos\|horarios\|chamadas\|presencas\|lesoes\|lutasScout\|competicoes\|antropometria\)\s*[\.\=]" *.html js/
```

For settings (singleton per coach):
- `treinador-perfil.html` profile save → `Data.updateSettings({ treinador: {...} })`
- onboarding done flag → `Data.updateSettings({ onboarding_done: true })`
- treino_templates create/delete → `Data.updateSettings({ treino_templates: [...] })`
- notifications → `Data.updateSettings({ notifications: [...] })`
- periodizacao → `Data.updateSettings({ periodizacao: {...} })`

### Step 2.3 — Per-entity migration order (suggested)

Migrate the highest-pain entities first, ship & verify, then continue:

1. **turmas** (the user's #1 pain)
2. **treinos** (drag/drop, the original "vanishing" bug)
3. **alunos**
4. **eventos**
5. **chamadas + presencas**
6. **planos + horarios**
7. **lutas_scout + competicoes**
8. **lesoes + antropometria**
9. **coach_settings** (treinador, periodizacao, notifications, treino_templates)

After each batch, deploy and have the user test that specific feature. Catch regressions before stacking up.

### Phase 2 acceptance criteria

- [ ] Every create/update/delete on coach side hits `Data.*` first
- [ ] Errors from Supabase show as toasts, no silent failures
- [ ] After dragging a treino and refreshing immediately, change persists (the original bug)
- [ ] Two browsers can edit different turmas simultaneously without overwriting each other
- [ ] Deleted turmas stay deleted across logins (test on a clean browser)
- [ ] Athlete portal still works (because `saveDB()` legacy path still mirrors to `app_state`)

**Commit message per entity:** `feat(data): phase 2 — migrate <entity> writes to per-entity table`

---

## Phase 3 — Frontend reads from new tables, with realtime

**Goal:** Drop dependence on `app_state` for reads. Coach pages load data via `Data.list()` per entity. Realtime subscriptions per table replace the 15s polling.

### Step 3.1 — Replace initial load

In `js/app.js`, replace the bulk of `loadDB()` + `fetchFromSupabase()`. The new pattern:

```js
async function loadDB() {
    // Coach pages only — athlete portal keeps using app_state until phase 4
    if (window.location.pathname.toLowerCase().includes('atleta-')) {
        return loadDBLegacy(); // original code, unchanged
    }

    // Initialize db from cache for instant render
    const stored = localStorage.getItem('tkd_scout_db');
    db = stored ? JSON.parse(stored) : structuredClone(MOCK_DATA);
    window.db = db;

    // Background load all entities in parallel
    try {
        const [settings, turmas, alunos, treinos, eventos, planos, horarios,
               chamadas, presencas, lesoes, lutasScout, competicoes, antropometria] =
            await Promise.all([
                Data.getSettings(),
                Data.list('turmas'),
                Data.list('alunos'),
                Data.list('treinos'),
                Data.list('eventos'),
                Data.list('planos'),
                Data.list('horarios'),
                Data.list('chamadas'),
                Data.list('presencas'),
                Data.list('lesoes'),
                Data.list('lutas_scout'),
                Data.list('competicoes'),
                Data.list('antropometria')
            ]);

        db.turmas = turmas;
        db.alunos = alunos;
        db.treinos = treinos;
        db.eventos = eventos;
        db.planos = planos;
        db.horarios = horarios;
        db.chamadas = chamadas;
        db.presencas = presencas;
        db.lesoes = lesoes;
        db.lutasScout = lutasScout;
        db.competicoes = competicoes;
        db.antropometria = antropometria;
        if (settings) {
            db.treinadores = settings.treinador ? [settings.treinador] : [];
            db.periodizacao = settings.periodizacao || {};
            db.notifications = settings.notifications || [];
            db.treinoTemplates = settings.treino_templates || [];
            db.questionarios = settings.questionarios || [];
            db.onboardingDone = settings.onboarding_done;
            db.activeTurmaId = settings.active_turma_id;
        }
        window.db = db;
        localStorage.setItem('tkd_scout_db', JSON.stringify(db));

        if (typeof window.onDataLoaded === 'function') window.onDataLoaded();

        setupEntitySubscriptions();
    } catch (e) {
        console.error('Erro carregando dados:', e);
        showToast('Erro ao carregar dados: ' + e.message, 'error');
    }
}
```

### Step 3.2 — Realtime subscriptions per table

```js
function setupEntitySubscriptions() {
    const tables = ['turmas', 'alunos', 'treinos', 'eventos', 'planos', 'horarios',
                    'chamadas', 'presencas', 'lesoes', 'lutas_scout', 'competicoes',
                    'antropometria', 'coach_settings'];
    const tableToDbKey = {
        turmas: 'turmas', alunos: 'alunos', treinos: 'treinos', eventos: 'eventos',
        planos: 'planos', horarios: 'horarios', chamadas: 'chamadas',
        presencas: 'presencas', lesoes: 'lesoes', lutas_scout: 'lutasScout',
        competicoes: 'competicoes', antropometria: 'antropometria'
    };
    tables.forEach(table => {
        Data.subscribe(table, payload => {
            const key = tableToDbKey[table];
            if (!key) return; // settings handled separately
            if (!db[key]) db[key] = [];
            const row = payload.new || payload.old;
            if (!row) return;
            const idx = db[key].findIndex(x => String(x.id) === String(row.id));
            if (payload.eventType === 'DELETE' || (payload.new && payload.new.deleted_at)) {
                if (idx >= 0) db[key].splice(idx, 1);
            } else {
                if (idx >= 0) db[key][idx] = payload.new;
                else db[key].push(payload.new);
            }
            window.db = db;
            localStorage.setItem('tkd_scout_db', JSON.stringify(db));
            if (typeof window.onDataLoaded === 'function') window.onDataLoaded();
        });
    });
}
```

### Step 3.3 — Remove now-dead code

- Remove the 15-second polling loop in `setupRealtimeSubscription` (unused)
- Remove the `applyRealtimeUpdate` blob handler
- Remove `syncToSupabase` (no more blob upserts) — but keep the legacy mirror call for now if athlete portal still depends on it
- Remove `beforeunload` sync handler
- Remove `localDate > remoteDate → syncToSupabase` branch
- Remove `mergeAppState` (unused already)

### Phase 3 acceptance criteria

- [ ] Coach pages load all data via `Data.list`, not from `app_state`
- [ ] Realtime updates propagate within 1-2s without polling
- [ ] All bug scenarios from phase 2 still pass
- [ ] Athlete portal still works (still reading from `app_state`)
- [ ] No `syncToSupabase` calls fire from coach pages
- [ ] localStorage cache is still maintained for instant render but no longer source of truth

**Commit message:** `feat(data): phase 3 — coach pages read from per-entity tables with realtime`

---

## Phase 4 — Migrate athlete portal (later, optional)

**Goal:** Stop relying on `app_state` for athlete portal. Drop `app_state` writes entirely.

Approach: create an RPC function that returns the athlete's data + their coach's relevant context, callable via anon key with a verified PIN.

Defer this until phases 1-3 are stable in production for at least a week. Lower priority because the athlete portal already works fine with the current `app_state` mirror.

When ready:

```sql
CREATE OR REPLACE FUNCTION get_athlete_login_data(p_coach_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'alunos', COALESCE(jsonb_agg(row_to_json(a)) FILTER (WHERE a.id IS NOT NULL), '[]'::jsonb)
  )
  FROM (SELECT id, nome, faixa, avatar, foto FROM alunos
        WHERE coach_id = p_coach_id AND deleted_at IS NULL) a
$$;

GRANT EXECUTE ON FUNCTION get_athlete_login_data TO anon;
```

And another for full athlete data after PIN verification.

---

## Rollback plan

At any point in phases 1-3, the system can be rolled back to the blob model:

- Phase 1: drop the new tables. `app_state` is untouched.
- Phase 2: revert frontend commits. Writes go back to `app_state` only. New tables become stale but harmless (we read from `app_state`).
- Phase 3: revert the `loadDB` change. Reads go back to `app_state`.

Keep `app_state` populated and maintained for at least 30 days after phase 3 completes successfully.

---

## Notes for the executing agent

- **Do NOT** drop `app_state` until phase 4 acceptance.
- **Do NOT** remove `athlete_responses` — that table is correct and stays.
- **Always** test on the user's existing data — no clean-slate testing.
- **Always** commit after each phase step. Push so Vercel deploys.
- **Verify** each acceptance criterion before moving on. Ask the user to validate UI before continuing.
- The user's Supabase project ID is `jruxbedvmlkjpfaigzqs`. The PAT for Management API is in `memory/project_supabase.md`.
- For DDL execution, use the Management API `POST /v1/projects/{id}/database/query` endpoint with the PAT. Never expose the PAT in code.
- Static lists (`categoriasPeso`, `faixas`) are NOT migrated — they live as constants in JS already and don't need a table.
