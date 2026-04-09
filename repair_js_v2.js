const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'app.js');
let content = fs.readFileSync(filePath, 'latin1'); // Read as latin1 to preserve bytes

const mappings = [
    [/Advers.rio/g, 'Adversário'],
    [/Sum.rio/g, 'Sumário'],
    [/n.o encontrado/g, 'não encontrado'],
    [/Nenhuma a..o registrada/g, 'Nenhuma ação registrada'],
    [/acao \|\| .A.o./g, "acao || 'Ação'"],
    [/Top T.cnicas/g, 'Top Técnicas'],
    [/Avalia..o T.cnica/g, 'Avaliação Técnica'],
    [/T.tica/g, 'Tática'],
    [/Varia..o/g, 'Variação'],
    [/Precisão/g, 'Precisão'],
    [/Obediência/g, 'Obediência'],
    [/Fun.o para Atualiza/g, 'Função para Atualiza'],
    [/exclu.do/g, 'excluído'],
    [/edi..o/g, 'edição'],
    [/anal.tica/g, 'analítica'],
    [/T.cnica/g, 'Técnica'],
    [/n.vel/g, 'nível'],
    [/Efici.ncia/g, 'Eficiência'],
    [/Tr.s/g, 'Trás'],
    [/Localiza..o/g, 'Localização'],
    [/N.o Canto/g, 'No Canto']
];

mappings.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Regex repair completed.');
