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

const latin1ToUtf8Replacements = [
    { p: "Alcan\xe7ado", r: "Alcançado" },
    { p: "Distribui\xe7\xe3o", r: "Distribuição" },
    { p: "Distribui\xe7\xf5es", r: "Distribuições" },
    { p: "M\xe9dia", r: "Média" },
    { p: "m\xe9dia", r: "média" },
    { p: "Evolu\xe7\xe3o", r: "Evolução" },
    { p: "Val\xeancias", r: "Valências" },
    { p: "Val\xeancia", r: "Valência" },
    { p: "Pot\xeancia", r: "Potência" },
    { p: "Resist\xeancia", r: "Resistência" },
    { p: "Aer\xf3bia", r: "Aeróbia" },
    { p: "For\xe7a", r: "Força" },
    { p: "Hist\xf3rico", r: "Histórico" },
    { p: "Composi\xe7\xe3o", r: "Composição" },
    { p: "Circunfer\xeancias", r: "Circunferências" },
    { p: "Tr\xedceps", r: "Tríceps" },
    { p: "Ocorr\xeancia", r: "Ocorrência" },
    { p: "Les\xf5es", r: "Lesões" },
    { p: "Les\xe3o", r: "Lesão" },
    { p: "Regi\xf5es", r: "Regiões" },
    { p: "M\xe9dico", r: "Médico" },
    { p: "Transi\xe7\xe3o", r: "Transição" },
    { p: "Incid\xeancia", r: "Incidência" },
    { p: "Institui\xe7\xe3o", r: "Instituição" },
    { p: "Avalia\xe7\xe3o", r: "Avaliação" },
    { p: "avalia\xe7\xe3o", r: "avaliação" },
    { p: "S\xe9rie", r: "Série" },
    { p: "s\xe9rie", r: "série" },
    { p: "Correla\xe7\xe3o", r: "Correlação" },
    { p: "Classifica\xe7\xe3o", r: "Classificação" },
    { p: "Cut\xe2neas", r: "Cutâneas" },
    { p: "Ocorr\xeancias", r: "Ocorrências" },
    { p: "Aten\xe7\xe3o", r: "Atenção" },
    { p: "Pontua\xe7\xe3o", r: "Pontuação" },
    { p: "Frequ\xeancia", r: "Frequência" },
    { p: "Card\xedaca", r: "Cardíaca" },
    { p: "M\xe1xima", r: "Máxima" },
    { p: "M\xe1ximo", r: "Máximo" },
    { p: "m\xe1ximo", r: "máximo" },
    { p: "Descri\xe7\xe3o", r: "Descrição" },
    { p: "descri\xe7\xe3o", r: "descrição" },
    { p: "Informa\xe7\xf5es", r: "Informações" },
    { p: "informa\xe7\xf5es", r: "informações" },
    { p: "Se\xe7\xf5es", r: "Seções" },
    { p: "SE\xc7\xd5ES", r: "SEÇÕES" },
    { p: "Curr\xedculo", r: "Currículo" },
    { p: "CURR\xcdCULO", r: "CURRÍCULO" },
    { p: "Forma\xe7\xe3o", r: "Formação" },
    { p: "FORMA\xc7\xc3O", r: "FORMAÇÃO" },
    { p: "CERTIFICA\xc7\xd5ES", r: "CERTIFICAÇÕES" },
    { p: "Certifica\xe7\xf5es", r: "Certificações" },
    { p: "Periodiza\xe7\xe3o", r: "Periodização" },
    { p: "Competi\xe7\xe3o", r: "Competição" },
    { p: "Gest\xe3o", r: "Gestão" },
    { p: "Sess\xe3o", r: "Sessão" },
    { p: "Sess\xf5es", r: "Sessões" },
    { p: "Dura\xe7\xe3o", r: "Duração" },
    { p: "Prote\xe7\xe3o", r: "Proteção" },
    { p: "N\xe3o", r: "Não" },
    { p: "F\xedsico", r: "Físico" },
    { p: "Reuni\xe3o", r: "Reunião" },
    { p: "Pr\xf3prio", r: "Próprio" },
    { p: "T\xedtulo", r: "Título" },
    { p: "t\xedtulo", r: "título" },
    { p: "Remover\xe1", r: "Removerá" },
    { p: "Hor\xe1rio", r: "Horário" },
    { p: "HOR\xc1RIO", r: "HORÁRIO" },
    { p: "orienta\xe7\xf5es", r: "orientações" },
    { p: "exerc\xedcio", r: "exercício" },
    { p: "Observa\xe7\xe3o", r: "Observação" },
    { p: "C\xe1lculo", r: "Cálculo" },
    { p: "Fun\xe7\xf5es", r: "Funções" },
    { p: "Detec\xe7\xe3o", r: "Detecção" },
    { p: "Intensifica\xe7\xe3o", r: "Intensificação" },
    { p: "Acumula\xe7\xe3o", r: "Acumulação" },
    { p: "Manuten\xe7\xe3o", r: "Manutenção" },
    { p: "Pain\xe9is", r: "Painéis" },
    { p: "di\xe1rio", r: "diário" },
    { p: "Di\xe1rio", r: "Diário" },
    { p: "est\xedmulo", r: "estímulo" },
    { p: "Padr\xe3o", r: "Padrão" },
    { p: "Edi\xe7\xe3o", r: "Edição" },
    { p: "Transforma\xe7\xe3o", r: "Transformação" },
    { p: "transmuta\xe7\xe3o", r: "transmutação" },
    { p: "Recupera\xe7\xe3o", r: "Recuperação" },
    { p: "EXPERI\xcaNCIA", r: "EXPERIÊNCIA" },
    { p: "P\xf3s-Teste", r: "Pós-Teste" },
    { p: "est\xe3o", r: "estão" },
    { p: "M\xedn", r: "Mín" },
    { p: "T\xe9cnico", r: "Técnico" },
    { p: "T\xe1tico", r: "Tático" },
    { p: "S\xe1bado", r: "Sábado" },
    { p: "Lan\xe7ar", r: "Lançar" },
    { p: "Cl\xednico", r: "Clínico" },
    { p: "N\xedvel", r: "Nível" },
    { p: "P\xfablico", r: "Público" },
    { p: "Equil\xedbrio", r: "Equilíbrio" },
    { p: "M\xednimo", r: "Mínimo" },
    { p: "m\xednimo", r: "mínimo" },
    { p: "S\xe1b", r: "Sáb" },
    { p: "Pr\xf3ximo", r: "Próximo" },
    { p: "Pr\xf3xima", r: "Próxima" },
    { p: "Voc\xea", r: "Você" },
    { p: "Avan\xe7ar", r: "Avançar" },
    { p: "Come\xe7ar", r: "Começar" },
    { p: "A\xe7\xf5es", r: "Ações" },
    { p: "a\xe7\xf5es", r: "ações" },
    { p: "M\xeas", r: "Mês" },
    { p: "m\xeas", r: "mês" },
    { p: "Gr\xe1fico", r: "Gráfico" },
    { p: "Ades\xe3o", r: "Adesão" },
    { p: "GRADUA\xc7\xc3O", r: "GRADUAÇÃO" }
];

targetFiles.forEach(filepath => {
    try {
        // Read as latin1 so bytes are preserved 1:1. 
        // e.g. valid utf8 will be seen like "DistribuiÃ§Ã£o"
        // invalid utf8 (true latin1) will be seen like "Distribui\xe7\xe3o"
        let content = fs.readFileSync(filepath, 'latin1');
        let originalContent = content;

        latin1ToUtf8Replacements.forEach(({ p, r }) => {
            // we must convert 'r' (which is written as literal JS utf-8 string) 
            // to what it looks like encoded as UTF-8 but read back as latin1!
            // which is basically: Buffer.from(r, 'utf8').toString('latin1')
            const utf8EquivalentInLatin1 = Buffer.from(r, 'utf8').toString('latin1');

            if (content.includes(p)) {
                content = content.split(p).join(utf8EquivalentInLatin1);
            }
        });

        if (content !== originalContent) {
            // Write it back as latin1 to preserve the bytes we just constructed.
            // The constructed utf8EquivalentInLatin1 writes valid UTF-8 bytes to disk!
            fs.writeFileSync(filepath, content, 'latin1');
            console.log(`[FIXED BINARY] ${filepath.replace(__dirname, '')}`);
            totalModifications++;
        }
    } catch (e) {
        console.error(`[ERROR] processing ${filepath}:`, e);
    }
});

console.log(`Binary scan complete. Fixed raw encoding in ${totalModifications} files.`);
