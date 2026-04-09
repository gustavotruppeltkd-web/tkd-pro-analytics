const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'app.js');
let buffer = fs.readFileSync(filePath);

const replacements = [
    ['Adversário', 'Adversário'],
    ['Sumário', 'Sumário'],
    ['não encontrado', 'não encontrado'],
    ['Nenhuma ao registrada', 'Nenhuma ação registrada'],
    ["acao || 'Ação'", "acao || 'Ação'"],
    ['Top Técnicas', 'Top Técnicas'],
    ['Tática', 'Tática'],
    ['Variação', 'Variação'],
    ['Precisão', 'Precisão'],
    ['Obediência', 'Obediência'],
    ['Função para Atualiza', 'Função para Atualiza'],
    ['excluído', 'excluído'],
    ['edição', 'edição'],
    ['analtica', 'analítica'],
    ['Técnica', 'Técnica'],
    ['nível', 'nível'],
    ['Eficiência', 'Eficiência'],
    ['Trás', 'Trás'],
    ['Localização', 'Localização'],
    ['Não Canto', 'No Canto']
];

let content = buffer.toString('binary');

replacements.forEach(([oldStr, newStr]) => {
    // Note: This is an aggressive replacement in binary mode
    content = content.split(oldStr).join(newStr);
});

fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
console.log('Repair completed.');
