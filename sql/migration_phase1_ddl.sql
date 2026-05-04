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

-- Add new tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE
  coach_settings, turmas, alunos, treinos, eventos, planos, horarios,
  chamadas, presencas, lesoes, lutas_scout, competicoes, antropometria;

COMMIT;
