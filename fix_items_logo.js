const fs = require('fs');
const path = require('path');

// Fix global align-items typo from previous scripts
function findFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('.git') && !fullPath.includes('node_modules') && !fullPath.includes('.gemini')) {
                findFiles(fullPath, filesList);
            }
        } else {
            if (fullPath.endsWith('.html') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
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

        content = content.replace(/align-items/g, 'align-items');
        content = content.replace(/Pro coach Analytics/g, 'Pro coach Analytics');
        content = content.replace(/Pro coach Analytics/g, 'Pro coach Analytics');
        content = content.replace(/ti ti-shield-up/g, 'ti ti-shield-up');

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log(`[FIXED] ${filepath.replace(__dirname, '')}`);
            totalModifications++;
        }
    } catch (e) {
        console.error(`[ERROR] processing ${filepath}:`, e);
    }
});

console.log(`Scan complete. Fixed itemês typos and injected logo text in ${totalModifications} files.`);
