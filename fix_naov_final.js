const fs = require('fs');
const path = require('path');

function findFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('.git') && !fullPath.includes('node_modules') && !fullPath.includes('.gemini')) {
                findFiles(fullPath, filesList);
            }
        } else {
            if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
                filesList.push(fullPath);
            }
        }
    }
    return filesList;
}

const targetFiles = findFiles(__dirname);
let totalModifications = 0;

const fixes = [
    { p: "Nov", r: "Nov" },
    { p: "nov", r: "nov" }
];

targetFiles.forEach(filepath => {
    try {
        let content = fs.readFileSync(filepath, 'utf-8');
        let originalContent = content;

        fixes.forEach(({ p, r }) => {
            // Because Novo was already fixed, "Nov" will only match things like "Nov" in the months array, or "Novas" if we missed it.
            // Wait, if there's "Novas", it becomes "Novas". So this works universally.
            if (content.includes(p)) {
                content = content.split(p).join(r);
            }
        });

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log(`[FIXED] ${filepath.replace(__dirname, '')}`);
            totalModifications++;
        }
    } catch (e) {
        console.error(`[ERROR] processing ${filepath}:`, e);
    }
});

console.log(`Scan complete. Reverted typos in ${totalModifications} files.`);
