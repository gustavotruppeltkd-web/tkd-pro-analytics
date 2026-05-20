CREATE OR REPLACE FUNCTION get_turma_public_info(p_coach_id UUID, p_turma_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_turma JSONB;
  v_nome_t TEXT;
  v_avatar TEXT;
BEGIN
  SELECT COALESCE(data, '{}'::jsonb) || jsonb_build_object('id', id, 'nome', nome, 'tipo', tipo)
    INTO v_turma
  FROM turmas
  WHERE coach_id = p_coach_id AND id = p_turma_id AND deleted_at IS NULL;
  IF v_turma IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE(treinador->>'nome',''), COALESCE(treinador->>'avatar','')
    INTO v_nome_t, v_avatar
  FROM coach_settings WHERE coach_id = p_coach_id;
  RETURN jsonb_build_object(
    'turma', v_turma,
    'treinador', jsonb_build_object('nome', COALESCE(v_nome_t,''), 'avatar', COALESCE(v_avatar,''))
  );
END;
$$;
GRANT EXECUTE ON FUNCTION get_turma_public_info(UUID, BIGINT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION register_aluno_self(p_coach_id UUID, p_turma_id BIGINT, p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
  v_turma RECORD;
  v_payload JSONB;
  v_attempts INT := 0;
BEGIN
  SELECT id, tipo INTO v_turma
  FROM turmas
  WHERE coach_id = p_coach_id AND id = p_turma_id AND deleted_at IS NULL;
  IF v_turma.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'turma_not_found');
  END IF;

  -- Retry para o caso raro de duas pessoas submeterem no mesmo milissegundo.
  LOOP
    v_attempts := v_attempts + 1;
    -- ID = timestamp ms + random 0..999 (microssegundos artificiais)
    v_id := (extract(epoch from clock_timestamp()) * 1000)::BIGINT * 1000
            + (floor(random() * 1000))::BIGINT;
    v_payload := COALESCE(p_payload, '{}'::jsonb)
      || jsonb_build_object(
        'id', v_id,
        'turmaId', p_turma_id,
        'ativo', true,
        'matricula', to_char(now(), 'YYYY-MM-DD'),
        'presencas', 0, 'faltas', 0
      );
    BEGIN
      INSERT INTO alunos (coach_id, id, turma_id, nome, faixa, sexo, nascimento, peso_categoria, pin, data, updated_at)
      VALUES (
        p_coach_id, v_id, p_turma_id,
        v_payload->>'nome',
        v_payload->>'faixa',
        NULLIF(v_payload->>'sexo', ''),
        NULLIF(v_payload->>'dataNascimento', '')::date,
        NULLIF(v_payload->>'categoriaPeso', ''),
        NULLIF(v_payload->>'pin', ''),
        v_payload,
        NOW()
      );
      RETURN jsonb_build_object('ok', true, 'id', v_id);
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts >= 5 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'id_collision_retry_exhausted');
      END IF;
      -- tenta de novo com novo id
    END;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION register_aluno_self(UUID, BIGINT, JSONB) TO anon, authenticated;
