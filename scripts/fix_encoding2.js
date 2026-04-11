const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const replacements = [
    // Multi-byte sequences (â=U+00E2, €=U+20AC, 3rd char from Win-1252 mapping)
    ['\u00e2\u20ac\u00a2', '\u2022'],  // â€¢ → • (bullet,  0xA2=¢)
    ['\u00e2\u20ac\u201d', '\u2014'],  // â€" → — (em dash, 0x94=U+201D)
    ['\u00e2\u20ac\u2122', '\u2019'],  // â€™ → ' (right single quote, 0x99=™)

    // Ãƒ = U+00C3 + U+0192 (ƒ = Win-1252 0x83). Must come BEFORE Ã£ etc.
    ['\u00c3\u0192', '\u00c3'],  // Ãƒ → Ã  (fixes NÃO, GESTÃO, VISÃO, etc.)

    // Ã‡ = U+00C3 + U+2021 (‡ = Win-1252 0x87)
    ['\u00c3\u2021', '\u00c7'],  // Ã‡ → Ç

    // Standard Ã + latin-1 second byte patterns
    ['\u00c3\u00a3', '\u00e3'],  // Ã£ → ã
    ['\u00c3\u00a7', '\u00e7'],  // Ã§ → ç
    ['\u00c3\u00a1', '\u00e1'],  // Ã¡ → á
    ['\u00c3\u00a9', '\u00e9'],  // Ã© → é
    ['\u00c3\u00ad', '\u00ed'],  // Ã­ → í
    ['\u00c3\u00b3', '\u00f3'],  // Ã³ → ó
    ['\u00c3\u00b4', '\u00f4'],  // Ã´ → ô
    ['\u00c3\u00b5', '\u00f5'],  // Ãµ → õ
    ['\u00c3\u00a0', '\u00e0'],  // Ã  → à
    ['\u00c3\u00ba', '\u00fa'],  // Ãº → ú
    ['\u00c3\u00a2', '\u00e2'],  // Ã¢ → â

    // Word-level re-fixes after char fixes above
    ['N\u00e3ome', 'Nome'],       // Nãome → Nome
    ['N\u00c3\u00a3ode', 'Node'], // NÃ£ode → Node (scout-video.js variable)
];

const targetFiles = [];
fs.readdirSync(rootDir).forEach(f => {
    if (f.endsWith('.html')) targetFiles.push(path.join(rootDir, f));
});
['master_app.js', 'js/app.js', 'js/scout-video.js', 'js/auth.js', 'js/scout.js'].forEach(f => {
    targetFiles.push(path.join(rootDir, f));
});

let fixedFiles = [];
for (const filepath of targetFiles) {
    if (!fs.existsSync(filepath)) continue;
    let content = fs.readFileSync(filepath, 'utf8');
    const original = content;
    for (const [bad, good] of replacements) {
        content = content.split(bad).join(good);
    }
    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        fixedFiles.push(path.basename(filepath));
        console.log('FIXED: ' + path.basename(filepath));
    }
}
console.log('\nTotal: ' + fixedFiles.length + ' arquivos corrigidos');
