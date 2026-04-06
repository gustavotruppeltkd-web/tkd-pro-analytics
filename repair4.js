const fs = require('fs');
const path = require('path');

const exactMapping = {
    'COMPETIÇÃO': 'COMPETIÇÃO',
    'Relatórios': 'Relatórios',
    'Horários': 'Horários',
    'Chamada Diária': 'Chamada Diária',
    'Informações': 'Informações',
    'informações': 'informações',
    'Diária': 'Diária',
    'diária': 'diária',
    'Diário': 'Diário',
    'diário': 'diário',
    'Diárias': 'Diárias',
    'HISTÓRICO': 'HISTÓRICO',
    'SAÚDE': 'SAÚDE',
    'AULA/SESSÃO': 'AULA/SESSÃO'
};

const files = fs.readdirSync(process.cwd(), { recursive: true })
    .filter(f => {
        const str = f.toString().replace(/\\\\/g, '/');
        return !str.includes('node_modules') && !str.includes('.next') && !str.includes('.git') && !str.includes('.gemini');
    })
    .filter(f => f.toString().endsWith('.html') || f.toString().endsWith('.js'));

for (const file of files) {
    const fullPath = path.join(process.cwd(), file.toString());
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    
    for (const [bad, good] of Object.entries(exactMapping)) {
        content = content.replace(new RegExp(bad, 'g'), good);
    }
                     
    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed', file);
    }
}
