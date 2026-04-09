# -*- coding: utf-8 -*-
import os

path = r'c:\Users\gusta\tkd app\js\app.js'

with open(path, 'rb') as f:
    content = f.read()

# Map of corrupted byte sequences (or substrings) to UTF-8
replacements = [
    (b'Adversrio', 'Adversário'.encode('utf-8')),
    (b'Sumrio', 'Sumário'.encode('utf-8')),
    (b'no encontrado', 'não encontrado'.encode('utf-8')),
    (b'Nenhuma ao registrada', 'Nenhuma ação registrada'.encode('utf-8')),
    (b"acao || 'Ao'", "acao || 'Ação'".encode('utf-8')),
    (b'Top Tcnicas', 'Top Técnicas'.encode('utf-8')),
    (b'Avalia\xc3\xa7\xc3\xa3o Tcnica', 'Avaliação Técnica'.encode('utf-8')),
    (b'Ttica', 'Tática'.encode('utf-8')),
    (b'Variao', 'Variação'.encode('utf-8')),
    (b'Preciso', 'Precisão'.encode('utf-8')),
    (b'Obedincia', 'Obediência'.encode('utf-8')),
    (b'Funo para Atualiza', 'Função para Atualiza'.encode('utf-8')),
    (b'excludo', 'excluído'.encode('utf-8')),
    (b'edio', 'edição'.encode('utf-8')),
    (b'analtica', 'analítica'.encode('utf-8')),
    (b'Tcnica', 'Técnica'.encode('utf-8')),
    (b'nvel', 'nível'.encode('utf-8')),
    (b'Eficincia', 'Eficiência'.encode('utf-8')),
    (b'Trs', 'Trás'.encode('utf-8')),
    (b'Localizao', 'Localização'.encode('utf-8')),
    (b'Não Canto', 'No Canto'.encode('utf-8')),
    (b'COMPUTA\xc3\x87\xc3\xadO', 'COMPUTAÇÃO'.encode('utf-8')),
    (b'AGREGREGA\xc3\x87\xc3\xadO', 'AGREGAÇÃO'.encode('utf-8')),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(path, 'wb') as f:
    f.write(content)

print("Repair completed.")
