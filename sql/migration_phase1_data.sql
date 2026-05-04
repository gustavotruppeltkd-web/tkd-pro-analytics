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
