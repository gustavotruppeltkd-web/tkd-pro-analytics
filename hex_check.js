const fs = require('fs');
const filepath = require('path').join(__dirname, 'dashboard-turma-dados.html');
const content = fs.readFileSync(filepath, 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Distribui')) {
        console.log("Found line:", lines[i].trim());
        const str = lines[i].trim();
        for (let j = 0; j < str.length; j++) {
            console.log(str[j], str.charCodeAt(j).toString(16));
        }
        break;
    }
}
