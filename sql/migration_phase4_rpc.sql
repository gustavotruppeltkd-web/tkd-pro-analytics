-- RPC para o portal do atleta — retorna JSONB original (camelCase) das tabelas per-entity
-- Acessível via anon key com o coach_id do link de acesso do atleta

CREATE OR REPLACE FUNCTION get_athlete_portal_data(p_coach_id UUID, p_atleta_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
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
    'settings', (
      SELECT row_to_json(s)
      FROM (SELECT questionarios, treino_templates, periodizacao
            FROM coach_settings WHERE coach_id = p_coach_id) s
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_athlete_portal_data(UUID, BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION get_athlete_portal_data(UUID, BIGINT) TO authenticated;
