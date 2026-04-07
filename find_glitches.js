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
let found = false;

targetFiles.forEach(filepath => {
    try {
        let content = fs.readFileSync(filepath, 'utf-8');
        if (content.includes('\ufffd') || content.includes('ï¿½')) {
            found = true;
            console.log(`[FOUND in ${path.basename(filepath)}]`);
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (line.includes('\ufffd') || line.includes('ï¿½')) {
                    console.log(`Line ${i + 1}: ${line.trim()}`);
                }
            });
        }
    } catch (e) { }
});

if (!found) console.log("Não glitches found.");
