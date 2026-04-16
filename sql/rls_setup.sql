-- ============================================================
-- A1 — RLS Policies para app_state e authorized_emails
-- Execute no Supabase SQL Editor (Dashboard > SQL > New query)
-- ============================================================

-- ── 1. Tabela app_state ─────────────────────────────────────

-- Habilita RLS na tabela (idempotente)
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas para evitar conflito
DROP POLICY IF EXISTS "Coaches can read own state"  ON public.app_state;
DROP POLICY IF EXISTS "Coaches can upsert own state" ON public.app_state;
DROP POLICY IF EXISTS "Coaches can delete own state" ON public.app_state;

-- SELECT: cada coach vê apenas sua própria linha (autenticado)
CREATE POLICY "Coaches can read own state"
    ON public.app_state
    FOR SELECT
    USING (project_id = auth.uid());

-- SELECT: atletas (anon) podem ler qualquer linha — o filtro .eq('project_id', coachId)
-- na query já restringe ao coach correto; o UUID é suficientemente imprevisível
DROP POLICY IF EXISTS "Anon can read coach state by project_id" ON public.app_state;
CREATE POLICY "Anon can read coach state by project_id"
    ON public.app_state
    FOR SELECT
    TO anon
    USING (true);

-- INSERT + UPDATE (UPSERT): só pode gravar na própria linha
CREATE POLICY "Coaches can upsert own state"
    ON public.app_state
    FOR ALL
    USING  (project_id = auth.uid())
    WITH CHECK (project_id = auth.uid());


-- ── 2. Tabela authorized_emails (lista branca de coaches) ───
-- Cria a tabela se ainda não existir

CREATE TABLE IF NOT EXISTS public.authorized_emails (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas
DROP POLICY IF EXISTS "Admins can manage authorized_emails" ON public.authorized_emails;
DROP POLICY IF EXISTS "Auth users can check own email"       ON public.authorized_emails;

-- Leitura: usuário autenticado pode verificar se o SEU email está autorizado
CREATE POLICY "Auth users can check own email"
    ON public.authorized_emails
    FOR SELECT
    USING (email = auth.email());

-- Escrita: somente via service_role (migrations / admin) — nenhum usuário normal pode inserir
-- (não criar policy de INSERT/UPDATE/DELETE para roles normais)


-- ── 3. Função helper: verifica se email do caller está autorizado ──
-- Usada em Edge Functions ou como check adicional em RLS

CREATE OR REPLACE FUNCTION public.is_authorized_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.authorized_emails
        WHERE email = auth.email()
    );
$$;

-- ── 4. IMPORTANTE: app_state também precisa permitir escrita do portal do atleta ──
-- Atletas NÃO fazem login no Supabase, então usam a anon key.
-- A policy acima (auth.uid()) bloqueia a escrita deles — o portal do atleta usa
-- savePortalDB() que escreve na linha do COACH.
-- Opção A (atual, menos seguro): manter app_state sem RLS no INSERT para anon.
-- Opção B (recomendado): usar a tabela athlete_responses abaixo e nunca deixar
-- anon escrever em app_state. Quando athlete_responses estiver em produção,
-- habilite o RLS acima.

-- ============================================================
-- A2 — Tabela athlete_responses (respostas individuais de atletas)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.athlete_responses (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id    UUID        NOT NULL,   -- auth.uid() do treinador
    athlete_id  INTEGER     NOT NULL,   -- db.alunos[].id
    type        TEXT        NOT NULL,   -- 'wellness' | 'carga' | 'resposta'
    payload     JSONB       NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para leitura eficiente pelo coach
CREATE INDEX IF NOT EXISTS athlete_responses_coach_id_idx     ON public.athlete_responses (coach_id);
CREATE INDEX IF NOT EXISTS athlete_responses_athlete_date_idx ON public.athlete_responses (athlete_id, submitted_at DESC);

-- Habilita RLS
ALTER TABLE public.athlete_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can insert athlete responses"  ON public.athlete_responses;
DROP POLICY IF EXISTS "Coaches can read own athlete data"  ON public.athlete_responses;

-- Atletas (anon) podem inserir qualquer linha — coach_id vem da URL do portal
CREATE POLICY "Anon can insert athlete responses"
    ON public.athlete_responses
    FOR INSERT
    WITH CHECK (true);

-- Apenas o coach cujo uid() = coach_id pode ler
CREATE POLICY "Coaches can read own athlete data"
    ON public.athlete_responses
    FOR SELECT
    USING (coach_id = auth.uid());

-- ── 5. A3 — Seed inicial: garante que o admin sempre esteja autorizado ──
-- Execute ANTES de remover o bypass hardcoded do index.html
INSERT INTO public.authorized_emails (email)
VALUES ('gustavotruppeltkd@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Opcional: restringe app_state apenas a emails autorizados
-- Descomente se quiser que somente coaches pré-aprovados acessem:
-- DROP POLICY IF EXISTS "Coaches can upsert own state" ON public.app_state;
-- CREATE POLICY "Coaches can upsert own state"
--     ON public.app_state
--     FOR ALL
--     USING  (project_id = auth.uid() AND public.is_authorized_email())
--     WITH CHECK (project_id = auth.uid() AND public.is_authorized_email());
