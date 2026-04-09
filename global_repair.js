const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const extensions = ['.js', '.html', '.css'];

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
    { old: /ÃÆ/g, new: 'Ã' },
    { old: /Ã /g, new: 'Ã ' },
    { old: /Ãâ¢/g, new: 'Ã' },
    { old: /ÃÂµ/g, new: 'õ' },
    { old: /Ãâ/g, new: 'Ã' },
    { old: /Ãâ°/g, new: 'Ã' },
    { old: /ÃÅ¡/g, new: 'Ã' },
    { old: /Ã /g, new: 'Ã' },
    { old: /Ã /g, new: 'Ã' },
    // Fix common corrupted variable/string fragments
    { old: /params/g, new: 'params' },
    { old: /items/g, new: 'items' },
    { old: /sums/g, new: 'sums' },
    { old: /msg/g, new: 'msg' },
    { old: /nÃ¯Â¿Â½o/g, new: 'não' },
    { old: /AdversÃ¯Â¿Â½rio/g, new: 'Adversário' },
    { old: /TÃ¯Â¿Â½cnica/g, new: 'Técnica' },
    { old: /TÃ¯Â¿Â½tica/g, new: 'Tática' },
    { old: /VariaÃ¯Â¿Â½Ã¯Â¿Â½o/g, new: 'Variação' },
    { old: /PrecisÃ¯Â¿Â½o/g, new: 'Precisão' },
    { old: /ObediÃ¯Â¿Â½ncia/g, new: 'Obediência' },
    { old: /informaÃ¯Â¿Â½Ã¯Â¿Â½es/g, new: 'informações' },
    { old: /AvaliaÃ¯Â¿Â½Ã¯Â¿Â½o/g, new: 'Avaliação' },
    { old: /SeÃ¯Â¿Â½Ã¯Â¿Â½o/g, new: 'Seção' },
    { old: /TÃÂ­tulo/g, new: 'Título' },
    { old: /ANÃ LISE/g, new: 'ANÃLISE' },
    { old: /AÃâ¡Ãâ¢ES/g, new: 'AÃÃES' },
    { old: /Alvos AlcanÃÂ§ados/g, new: 'Alvos Alcançados' }
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walk(filePath);
            }
        } else if (extensions.includes(path.extname(file))) {
            repairFile(filePath);
        }
    });
}

function repairFile(filePath) {
    let buffer = fs.readFileSync(filePath);
    let content = buffer.toString('binary');
    let original = content;

    patterns.forEach(p => {
        content = content.replace(p.old, p.new);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
        console.log(`Repaired: ${filePath}`);
    }
}

walk(rootDir);
console.log('Global repair completed.');
