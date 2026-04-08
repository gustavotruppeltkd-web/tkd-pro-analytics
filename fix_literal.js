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
    { p: "Antropométrica", r: "Antropométrica" },
    { p: "Antropométrico", r: "Antropométrico" },
    { p: "Lançamento", r: "Lançamento" },
    { p: "Lançamentos", r: "Lançamentos" },
    { p: "Lançar", r: "Lançar" },
    { p: "Péssimo", r: "Péssimo" },
    { p: "Cansaço", r: "Cansaço" },
    { p: "Percepção", r: "Percepção" },
    { p: "Esforço", r: "Esforço" },
    { p: "Múltiplo", r: "Múltiplo" },
    { p: "Máx", r: "Máx" },
    { p: "Referência", r: "Referência" },
    { p: "Padrão", r: "Padrão" },
    { p: "Avançadas", r: "Avançadas" },
    { p: "Crítico", r: "Crítico" },
    { p: "Prevenção", r: "Prevenção" },
    { p: "padrão", r: "padrão" },
    { p: "Não Lançado", r: "Não Lançado" },
    { p: "Não", r: "Não" }, // Be very careful here! Não can match "Não", but if we replace Novo back to Novo later it's fine.
    { p: "Fórmula", r: "Fórmula" },
    { p: "gráfico", r: "gráfico" },
    { p: "página", r: "página" },
    { p: "Terça-feira", r: "Terça-feira" },
    { p: "técnica", r: "técnica" },
    { p: "Técnica", r: "Técnica" },
    { p: "Tática", r: "Tática" },
    { p: "Variação", r: "Variação" },
    { p: "Precisão", r: "Precisão" },
    { p: "Obediência", r: "Obediência" },
    { p: "questionário", r: "questionário" },
    { p: "Exportação", r: "Exportação" },
    { p: "indisponível", r: "indisponível" },
    { p: "Título", r: "Título" },
    { p: "título", r: "título" },
    { p: "Histórico", r: "Histórico" },
    { p: "Histórica", r: "Histórica" },
    { p: "físico", r: "físico" },
    { p: "MÉDIA", r: "MÉDIA" },
    { p: "Média", r: "Média" },
    { p: "média", r: "média" },
    { p: "Próprios", r: "Próprios" },
    { p: "Próprias", r: "Próprias" },
    { p: "Aeróbia", r: "Aeróbia" },
    { p: "Estágio", r: "Estágio" },
    { p: "Composições", r: "Composições" },
    { p: "lesão", r: "lesão" },
    { p: "Lesão", r: "Lesão" },
    { p: "após", r: "após" },
    { p: "já", r: "já" }, // Can be risky. But it's surrounded in Portuguese context normally? Wait, "já" alone...
    { p: "Alcançada", r: "Alcançada" },
    { p: "Médico", r: "Médico" },
    { p: "será nossa", r: "será nossa" },
    { p: "compõe", r: "compõe" },
    { p: "FÍSICOS", r: "FÍSICOS" },
    { p: "GRÁFICOS", r: "GRÁFICOS" },
    { p: "Semáforo", r: "Semáforo" },
    { p: "necessário", r: "necessário" },
    { p: "Tendência", r: "Tendência" },
    { p: "período", r: "período" },
    { p: "somatório", r: "somatório" },
    { p: "também", r: "também" },
    { p: "referência", r: "referência" },
    { p: "Progressão", r: "Progressão" },
    { p: "Numérica", r: "Numérica" },
    { p: "Médio", r: "Médio" },
    { p: "Físicas", r: "Físicas" },
    { p: "Pós-Teste", r: "Pós-Teste" },
    { p: "Através", r: "Através" },
    { p: "Visão", r: "Visão" },
    { p: "visão", r: "visão" },
    { p: "Diária", r: "Diária" },
    { p: "Diário", r: "Diário" },
    { p: "diária", r: "diária" },
    { p: "diário", r: "diário" },
    { p: "RECUPERAÇÃO", r: "RECUPERAÇÃO" }
];

targetFiles.forEach(filepath => {
    try {
        let content = fs.readFileSync(filepath, 'utf-8');
        let originalContent = content;

        fixes.forEach(({ p, r }) => {
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

console.log(`Scan complete. Fixed edge cases in ${totalModifications} files.`);
