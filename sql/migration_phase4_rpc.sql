-- RPC para o portal do atleta — lê das tabelas per-entity (sem app_state)
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
    'alunos',      (SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb)
                   FROM (SELECT * FROM alunos
                         WHERE coach_id = p_coach_id AND deleted_at IS NULL) a),
    'treinos',     (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
                   FROM (SELECT * FROM treinos
                         WHERE coach_id = p_coach_id AND deleted_at IS NULL) t),
    'eventos',     (SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb)
                   FROM (SELECT * FROM eventos
                         WHERE coach_id = p_coach_id AND deleted_at IS NULL) e),
    'competicoes', (SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
                   FROM (SELECT * FROM competicoes
                         WHERE coach_id = p_coach_id AND deleted_at IS NULL) c),
    'lutasScout',  (SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb)
                   FROM (SELECT * FROM lutas_scout
                         WHERE coach_id = p_coach_id
                           AND atleta_id = p_atleta_id
                           AND deleted_at IS NULL) l),
    'settings',    (SELECT row_to_json(s)
                   FROM (SELECT questionarios, treino_templates, periodizacao
                         FROM coach_settings WHERE coach_id = p_coach_id) s)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_athlete_portal_data(UUID, BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION get_athlete_portal_data(UUID, BIGINT) TO authenticated;
