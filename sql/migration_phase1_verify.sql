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
