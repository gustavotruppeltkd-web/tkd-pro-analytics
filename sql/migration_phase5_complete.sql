-- ===================================================================
-- Phase 5 — Completar a migração: dados que ficaram só no localStorage
-- ===================================================================
-- Adiciona colunas em coach_settings para os campos que NÃO ficaram em
-- tabelas per-entity (singletons/listas globais do treinador).
-- Estende a RPC do portal do atleta para retornar respostas + questionarios
-- (com feedback do treinador), permitindo o ciclo completo questionário→atleta→feedback.
-- ===================================================================

BEGIN;

-- Novas colunas em coach_settings
ALTER TABLE coach_settings ADD COLUMN IF NOT EXISTS exercicios   JSONB DEFAULT '[]'::jsonb;
ALTER TABLE coach_settings ADD COLUMN IF NOT EXISTS mesociclos   JSONB DEFAULT '[]'::jsonb;
ALTER TABLE coach_settings ADD COLUMN IF NOT EXISTS respostas    JSONB DEFAULT '[]'::jsonb;

-- coach_settings precisa estar no Realtime para sync entre dispositivos
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE coach_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================================================================
-- RPC estendida: agora retorna também respostas, questionarios, templates,
-- exercicios, mesociclos e notifications. Essencial para o atleta receber
-- questionários novos e feedback do treinador.
-- ===================================================================

CREATE OR REPLACE FUNCTION get_athlete_portal_data(p_coach_id UUID, p_atleta_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_settings RECORD;
BEGIN
  SELECT questionarios, treino_templates, periodizacao, exercicios, mesociclos,
         notifications, respostas, treinador
  INTO v_settings
  FROM coach_settings WHERE coach_id = p_coach_id;

  SELECT jsonb_build_object(
    'alunos', (
      SELECT COALESCE(jsonb_agg(
        COALESCE(data, '{}'::jsonb) || jsonb_build_object('id', id)
      ), '[]'::jsonb)
      FROM alunos WHERE coach_id = p_coach_id AND deleted_at IS NULL
    ),
    'treinos', (
      SELECT COALESCE(jsonb_agg(
        COALESCE(payload, '{}'::jsonb) || jsonb_build_object('id', id)
      ), '[]'::jsonb)
      FROM treinos WHERE coach_id = p_coach_id AND deleted_at IS NULL
    ),
    'eventos', (
      SELECT COALESCE(jsonb_agg(
        COALESCE(payload, '{}'::jsonb) || jsonb_build_object('id', id)
      ), '[]'::jsonb)
      FROM eventos WHERE coach_id = p_coach_id AND deleted_at IS NULL
    ),
    'competicoes', (
      SELECT COALESCE(jsonb_agg(
        COALESCE(payload, '{}'::jsonb) || jsonb_build_object('id', id)
      ), '[]'::jsonb)
      FROM competicoes WHERE coach_id = p_coach_id AND deleted_at IS NULL
    ),
    'lutasScout', (
      SELECT COALESCE(jsonb_agg(
        COALESCE(payload, '{}'::jsonb) || jsonb_build_object('id', id)
      ), '[]'::jsonb)
      FROM lutas_scout
      WHERE coach_id = p_coach_id
        AND (atleta_id = p_atleta_id OR p_atleta_id = 0)
        AND deleted_at IS NULL
    ),
    'horarios', (
      SELECT COALESCE(jsonb_agg(
        COALESCE(payload, '{}'::jsonb) || jsonb_build_object('id', id)
      ), '[]'::jsonb)
      FROM horarios WHERE coach_id = p_coach_id AND deleted_at IS NULL
    ),
    'turmas', (
      SELECT COALESCE(jsonb_agg(
        COALESCE(data, '{}'::jsonb) || jsonb_build_object('id', id)
      ), '[]'::jsonb)
      FROM turmas WHERE coach_id = p_coach_id AND deleted_at IS NULL
    ),
    'settings', jsonb_build_object(
      'questionarios',    COALESCE(v_settings.questionarios,    '[]'::jsonb),
      'treino_templates', COALESCE(v_settings.treino_templates, '[]'::jsonb),
      'periodizacao',     COALESCE(v_settings.periodizacao,     '{}'::jsonb),
      'exercicios',       COALESCE(v_settings.exercicios,       '[]'::jsonb),
      'mesociclos',       COALESCE(v_settings.mesociclos,       '[]'::jsonb),
      'notifications',    COALESCE(v_settings.notifications,    '[]'::jsonb),
      'treinador',        COALESCE(v_settings.treinador,        '{}'::jsonb)
    ),
    'respostas', (
      -- Respostas do atleta + feedbacks do treinador (filtrado por atleta)
      SELECT COALESCE(jsonb_agg(r.value), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(v_settings.respostas, '[]'::jsonb)) AS r(value)
      WHERE p_atleta_id = 0 OR (r.value->>'atletaId')::BIGINT = p_atleta_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_athlete_portal_data(UUID, BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION get_athlete_portal_data(UUID, BIGINT) TO authenticated;

-- ===================================================================
-- RPC para o atleta INSERIR uma resposta de questionário em coach_settings.respostas
-- (coach_settings.respostas é JSONB; precisamos de uma RPC para append seguro com anon)
-- ===================================================================

CREATE OR REPLACE FUNCTION append_athlete_resposta(p_coach_id UUID, p_resposta JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Garante que existe a row de coach_settings
  INSERT INTO coach_settings (coach_id, respostas)
  VALUES (p_coach_id, jsonb_build_array(p_resposta))
  ON CONFLICT (coach_id) DO UPDATE
    SET respostas = COALESCE(coach_settings.respostas, '[]'::jsonb) || p_resposta,
        updated_at = NOW();
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION append_athlete_resposta(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION append_athlete_resposta(UUID, JSONB) TO authenticated;

-- ===================================================================
-- RPC para o atleta inserir respostas (wellness, carga, resposta) em athlete_responses.
-- IMPORTANTE: necessário porque INSERT direto na tabela falha quando o
-- supabase-js v2 envia Prefer: return=representation (anon não pode SELECT
-- de volta). Esta RPC SECURITY DEFINER bypassa RLS de forma segura.
-- ===================================================================

CREATE OR REPLACE FUNCTION submit_athlete_response(
  p_coach_id UUID, p_athlete_id BIGINT, p_type TEXT, p_payload JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO athlete_responses (coach_id, athlete_id, type, payload, submitted_at)
  VALUES (p_coach_id, p_athlete_id, p_type, p_payload, NOW());
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_athlete_response(UUID, BIGINT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION submit_athlete_response(UUID, BIGINT, TEXT, JSONB) TO authenticated;

-- ===================================================================
-- RPC para o treinador atualizar o feedback de uma resposta específica
-- sem corrida com novas inserções de atletas.
-- ===================================================================

CREATE OR REPLACE FUNCTION update_resposta_feedback(p_resposta_id BIGINT, p_feedback TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach UUID := auth.uid();
  v_now BIGINT := (extract(epoch from now()) * 1000)::BIGINT;
  v_arr JSONB;
BEGIN
  IF v_coach IS NULL THEN RETURN FALSE; END IF;
  SELECT respostas INTO v_arr FROM coach_settings WHERE coach_id = v_coach;
  IF v_arr IS NULL THEN RETURN FALSE; END IF;
  v_arr := (
    SELECT jsonb_agg(
      CASE WHEN (r->>'id')::BIGINT = p_resposta_id
        THEN r || jsonb_build_object('coachFeedback', p_feedback, 'coachFeedbackAt', v_now)
        ELSE r END
    )
    FROM jsonb_array_elements(v_arr) r
  );
  UPDATE coach_settings SET respostas = v_arr, updated_at = NOW() WHERE coach_id = v_coach;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION update_resposta_feedback(BIGINT, TEXT) TO authenticated;

COMMIT;
