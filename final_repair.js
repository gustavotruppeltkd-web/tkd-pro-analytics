const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'app.js');
let buffer = fs.readFileSync(filePath);

// Map of corrupted UTF-8 byte sequences (read as Latin-1/Binary) to their correct characters
// This fixes the common "interpreted as Latin-1 then saved as UTF-8" corruption
const patterns = [
    { old: /ÃÂ§/g, new: 'ç' },
    { old: /ÃÂ£/g, new: 'ã' },
    { old: /ÃÂ³/g, new: 'ó' },
    { old: /ÃÂ¡/g, new: 'á' },
    { old: /ÃÂ©/g, new: 'é' },
    { old: /ÃÂª/g, new: 'ê' },
    { old: /ÃÂ­/g, new: 'í' },
    { old: /ÃÂ´/g, new: 'ô' },
    { old: /ÃÂº/g, new: 'ú' },
    { old: /Ãâ¡/g, new: 'Ã' },
    { old: /ÃÆ/g, new: 'Ã' }, // This one is tricky
    { old: /Ã /g, new: 'Ã ' },
    { old: /Ãâ¢/g, new: 'Ã' },
    { old: /ÃÂµ/g, new: 'õ' },
    // Also fix the weird single-byte patterns I saw in view_file
    { old: /Adversário/g, new: 'Adversário' },
    { old: /Sumário/g, new: 'Sumário' },
    { old: /não encontrado/g, new: 'não encontrado' },
    { old: /Nenhuma ao registrada/g, new: 'Nenhuma ação registrada' },
    { old: /acao \|\| 'Ação'/g, new: "acao || 'Ação'" },
    { old: /Técnicas/g, new: 'Técnicas' },
    { old: /Tática/g, new: 'Tática' },
    { old: /Variação/g, new: 'Variação' },
    { old: /Precisão/g, new: 'Precisão' },
    { old: /Obediência/g, new: 'Obediência' },
    { old: /Função para Atualiza/g, new: 'Função para Atualiza' },
    { old: /excluído/g, new: 'excluído' },
    { old: /edição/g, new: 'edição' },
    { old: /analtica/g, new: 'analítica' },
    { old: /Técnica/g, new: 'Técnica' },
    { old: /nível/g, new: 'nível' },
    { old: /Eficiência/g, new: 'Eficiência' },
    { old: /Trás/g, new: 'Trás' },
    { old: /Localização/g, new: 'Localização' }
];

let content = buffer.toString('binary');
patterns.forEach(p => {
    content = content.replace(p.old, p.new);
});

fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
console.log('Final repair completed.');
