const fs = require('fs');
const path = require('path');

const repairs = [
    { from: /Competio/g, to: 'Competição' },
    { from: /Viso/g, to: 'Visão' },
    { from: /Ateno/g, to: 'Atenção' },
    { from: /Avaliao/g, to: 'Avaliação' },
    { from: /Recuperao/g, to: 'Recuperação' },
    { from: /Grfico/g, to: 'Gráfico' },
    { from: /Relatrios/g, to: 'Relatórios' },
    { from: /Configurao/g, to: 'Configuração' },
    { from: /Indisponvel/g, to: 'Indisponível' },
    { from: /Dira/g, to: 'Diária' },
    { from: /Md/g, to: 'Média' },
    { from: /competio/g, to: 'competição' },
    { from: /atleta-row/g, to: 'athlete-row' }, // Fix my own typo if any
    // Fix the specific bullets in turmas.html
    { from: /Atletas [^\w] Foco/g, to: 'Atletas • Foco' },
    { from: /Alunos [^\w] Foco/g, to: 'Alunos • Foco' }
];

const files = [
    'c:/Users/gusta/tkd app/turmas.html',
    'c:/Users/gusta/tkd app/dashboard-rendimento.html',
    'c:/Users/gusta/tkd app/js/app.js',
    'c:/Users/gusta/tkd app/selecionar-treinador.html'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    repairs.forEach(rep => {
        content = content.replace(rep.from, rep.to);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Repaired: ${path.basename(file)}`);
    } else {
        console.log(`No changes needed: ${path.basename(file)}`);
    }
});
