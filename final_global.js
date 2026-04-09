const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const extensions = ['.js', '.html', '.css', '.md'];

const patterns = [
    // Encoding artifacts (Double-encoded patterns)
    { old: /ç/g, new: 'ç' },
    { old: /ã/g, new: 'ã' },
    { old: /ó/g, new: 'ó' },
    { old: /á/g, new: 'á' },
    { old: /é/g, new: 'é' },
    { old: /ê/g, new: 'ê' },
    { old: /í/g, new: 'í' },
    { old: /ô/g, new: 'ô' },
    { old: /ú/g, new: 'ú' },
    { old: /Ç/g, new: 'Ç' },
    { old: /à/g, new: 'à' },
    { old: /Õ/g, new: 'Õ' },
    { old: /õ/g, new: 'õ' },
    { old: /Â/g, new: 'Â' },
    { old: /É/g, new: 'É' },
    { old: /Ú/g, new: 'Ú' },
    { old: /à/g, new: 'À' },
    { old: /à/g, new: 'Á' },
    { old: /→/g, new: '→' },
    { old: /──/g, new: '──' },

    // Literal corrupted patterns with \ufffd
    { old: /\ufffd/g, new: '' }, // Just remove stray ones
    { old: /não encontrado/g, new: 'não encontrado' },
    { old: /Adversário/g, new: 'Adversário' },
    { old: /Técnica/g, new: 'Técnica' },
    { old: /Tática/g, new: 'Tática' },
    { old: /Variação/g, new: 'Variação' },
    { old: /Precisão/g, new: 'Precisão' },
    { old: /Obediência/g, new: 'Obediência' },
    { old: /Função/g, new: 'Função' },
    { old: /excluído/g, new: 'excluído' },
    { old: /edição/g, new: 'edição' },
    { old: /nível/g, new: 'nível' },
    { old: /Eficiência/g, new: 'Eficiência' },
    { old: /Trás/g, new: 'Trás' },
    { old: /Localização/g, new: 'Localização' },
    { old: /Sumário/g, new: 'Sumário' },
    { old: /Ação/g, new: 'Ação' },

    // Variable corruption artifacts
    { old: /params/g, new: 'params' },
    { old: /urlParams/g, new: 'urlParams' },
    { old: /URLSearchParams/g, new: 'URLSearchParams' },
    { old: /items/g, new: 'items' },
    { old: /sums/g, new: 'sums' },
    { old: /msg/g, new: 'msg' },
    { old: /errorMsg/g, new: 'errorMsg' },
    { old: /Nãome/g, new: 'Nome' }
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
    let original = buffer.toString('utf8');
    let content = original;

    patterns.forEach(p => {
        content = content.replace(p.old, p.new);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Repaired: ${filePath}`);
    }
}

walk(rootDir);
console.log('Final global repair completed.');
