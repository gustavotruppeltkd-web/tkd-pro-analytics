$content = Get-Content -Path 'master_portal_v2.html' -Raw -Encoding utf8
$replacements = @{
    'þÒo' = 'ção'
    'þ§es' = 'ções'
    'þ' = 'ç'
    'Ò' = 'ã'
    'ß' = 'á'
    'Û' = 'ê'
    'Ú' = 'é'
    'Ý' = 'í'
    '¾' = 'o'
    'º' = 'u'
    'vocÛ' = 'você'
    'jß' = 'já'
    'AlimentaþÒo' = 'Alimentação'
    'mÚdia' = 'média'
    'Tßtica' = 'Tática'
    'PrecisÒo' = 'Precisão'
    'ObediÛncia' = 'Obediência'
    'DuraþÒo' = 'Duração'
    'ProteþÒo' = 'Proteção'
    'ReuniÒo' = 'Reunião'
    'RecuperaþÒo' = 'Recuperação'
    'PotÛncia' = 'Potência'
    'TransferÛncia' = 'Transferência'
    'ResistÛncia' = 'Resistência'
    'TÚcnico' = 'Técnico'
    'Simulat¾rio' = 'Simulatório'
    'FÝsico' = 'Físico'
    'Questionßrios' = 'Questionários'
    'AvaliaþÒo' = 'Avaliação'
    'marþo' = 'março'
    'graduaþÒo' = 'graduação'
    'MÚdio' = 'Médio'
    'NÒo' = 'Não'
    'vocÛ' = 'você'
    'mêsg' = 'msg'
    'Nãode' = 'Node'
    'childNãodes' = 'childNodes'
}

foreach ($key in $replacements.Keys) {
    $content = $content -replace [regex]::Escape($key), $replacements[$key]
}

Set-Content -Path 'master_portal_v2.html' -Value $content -Encoding utf8
