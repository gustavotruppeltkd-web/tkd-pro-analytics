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

targetFiles.forEach(filepath => {
    try {
        let content = fs.readFileSync(filepath, 'utf-8');
        let originalContent = content;

        // Custom list based on user image reports. Using regex to handle `?`, `\ufffd`, or other garbled chars.
        content = content.replace(/Nota/g, "Nota");
        content = content.replace(/nota/g, "nota");

        // Diária / Diário
        content = content.replace(/Di[\?\ufffd]ria/g, "Diária");
        content = content.replace(/Di[\?\ufffd]rio/g, "Diário");
        content = content.replace(/di[\?\ufffd]ria/g, "diária");
        content = content.replace(/di[\?\ufffd]rio/g, "diário");

        // Visão
        content = content.replace(/Vis[\?\ufffd]o/g, "Visão");
        content = content.replace(/vis[\?\ufffd]o/g, "visão");

        // RECUPERAÇÃO
        content = content.replace(/RECUPERA[\?\ufffd]+O/g, "RECUPERAÇÃO");
        content = content.replace(/Recupera[\?\ufffd]+o/gi, "Recuperação");

        // Avaliação F?sico etc
        content = content.replace(/Avalia[\?\ufffd]+o/g, "Avaliação");
        content = content.replace(/avalia[\?\ufffd]+o/g, "avaliação");

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log(`[FIXED] ${filepath.replace(__dirname, '')}`);
            totalModifications++;
        }
    } catch (e) {
        console.error(`[ERROR] processing ${filepath}:`, e);
    }
});

console.log(`Scan complete. Fixed edge cases in ${totalModifications} files.`);
