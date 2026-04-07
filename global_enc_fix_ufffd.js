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

const ufffdReplacements = [
    { p: "Alcan\ufffdado", r: "Alcançado" },
    { p: "Distribui\ufffd\ufffdo", r: "Distribuição" },
    { p: "Distribui\ufffdo", r: "Distribuição" },
    { p: "Distribui\ufffdes", r: "Distribuições" },
    { p: "M\ufffddia", r: "Média" },
    { p: "m\ufffddia", r: "média" },
    { p: "Evolu\ufffd\ufffdo", r: "Evolução" },
    { p: "Evolu\ufffdo", r: "Evolução" },
    { p: "Val\ufffdncias", r: "Valências" },
    { p: "Val\ufffdncia", r: "Valência" },
    { p: "Pot\ufffdncia", r: "Potência" },
    { p: "Resist\ufffdncia", r: "Resistência" },
    { p: "Aer\ufffdbia", r: "Aeróbia" },
    { p: "For\ufffda", r: "Força" },
    { p: "Hist\ufffdrico", r: "Histórico" },
    { p: "Composi\ufffd\ufffdo", r: "Composição" },
    { p: "Composi\ufffdo", r: "Composição" },
    { p: "Circunfer\ufffdncias", r: "Circunferências" },
    { p: "Circunfer\ufffdncia", r: "Circunferência" },
    { p: "Tr\ufffdceps", r: "Tríceps" },
    { p: "Ocorr\ufffdncia", r: "Ocorrência" },
    { p: "Ocorr\ufffdncias", r: "Ocorrências" },
    { p: "Les\ufffdes", r: "Lesões" },
    { p: "Les\ufffdo", r: "Lesão" },
    { p: "Regi\ufffdes", r: "Regiões" },
    { p: "M\ufffddico", r: "Médico" },
    { p: "Transi\ufffd\ufffdo", r: "Transição" },
    { p: "Transi\ufffdo", r: "Transição" },
    { p: "Incid\ufffdncia", r: "Incidência" },
    { p: "Institui\ufffd\ufffdo", r: "Instituição" },
    { p: "Institui\ufffdo", r: "Instituição" },
    { p: "Avalia\ufffd\ufffdo", r: "Avaliação" },
    { p: "Avalia\ufffdo", r: "Avaliação" },
    { p: "avalia\ufffdo", r: "avaliação" },
    { p: "S\ufffdrie", r: "Série" },
    { p: "s\ufffdrie", r: "série" },
    { p: "Correla\ufffd\ufffdo", r: "Correlação" },
    { p: "Correla\ufffdo", r: "Correlação" },
    { p: "Classifica\ufffd\ufffdo", r: "Classificação" },
    { p: "Classifica\ufffdo", r: "Classificação" },
    { p: "Cut\ufffdneas", r: "Cutâneas" },
    { p: "Aten\ufffd\ufffdo", r: "Atenção" },
    { p: "Aten\ufffdo", r: "Atenção" },
    { p: "Pontua\ufffd\ufffdo", r: "Pontuação" },
    { p: "Pontua\ufffdo", r: "Pontuação" },
    { p: "Frequ\ufffdncia", r: "Frequência" },
    { p: "Card\ufffdaca", r: "Cardíaca" },
    { p: "M\ufffdxima", r: "Máxima" },
    { p: "M\ufffdximo", r: "Máximo" },
    { p: "m\ufffdximo", r: "máximo" },
    { p: "Descri\ufffd\ufffdo", r: "Descrição" },
    { p: "Descri\ufffdo", r: "Descrição" },
    { p: "descri\ufffd\ufffdo", r: "descrição" },
    { p: "descri\ufffdo", r: "descrição" },
    { p: "Informa\ufffd\ufffdes", r: "Informações" },
    { p: "Informa\ufffdes", r: "Informações" },
    { p: "informa\ufffd\ufffdes", r: "informações" },
    { p: "informa\ufffdes", r: "informações" },
    { p: "Se\ufffd\ufffdes", r: "Seções" },
    { p: "Se\ufffdes", r: "Seções" },
    { p: "SE\ufffd\ufff5ES", r: "SEÇÕES" },
    { p: "Curr\ufffdculo", r: "Currículo" },
    { p: "CURR\ufffdCULO", r: "CURRÍCULO" },
    { p: "Forma\ufffd\ufffdo", r: "Formação" },
    { p: "Forma\ufffdo", r: "Formação" },
    { p: "FORMA\ufffd\ufffdO", r: "FORMAÇÃO" },
    { p: "FORMA\ufffdO", r: "FORMAÇÃO" },
    { p: "CERTIFICA\ufffd\ufff5ES", r: "CERTIFICAÇÕES" },
    { p: "Certifica\ufffd\ufffdes", r: "Certificações" },
    { p: "Certifica\ufffdes", r: "Certificações" },
    { p: "Periodiza\ufffd\ufffdo", r: "Periodização" },
    { p: "Periodiza\ufffdo", r: "Periodização" },
    { p: "Competi\ufffd\ufffdo", r: "Competição" },
    { p: "Competi\ufffdo", r: "Competição" },
    { p: "Gest\ufffdo", r: "Gestão" },
    { p: "Sess\ufffd\ufffdo", r: "Sessão" },
    { p: "Sess\ufffdo", r: "Sessão" },
    { p: "Sess\ufffd\ufffdes", r: "Sessões" },
    { p: "Sess\ufffdes", r: "Sessões" },
    { p: "Dura\ufffd\ufffdo", r: "Duração" },
    { p: "Dura\ufffdo", r: "Duração" },
    { p: "Prote\ufffd\ufffdo", r: "Proteção" },
    { p: "Prote\ufffdo", r: "Proteção" },
    { p: "N\ufffdo", r: "Não" },
    { p: "F\ufffdsico", r: "Físico" },
    { p: "Reuni\ufffd\ufffdo", r: "Reunião" },
    { p: "Reuni\ufffdo", r: "Reunião" },
    { p: "Pr\ufffdprio", r: "Próprio" },
    { p: "T\ufffdtulo", r: "Título" },
    { p: "t\ufffdtulo", r: "título" },
    { p: "Remover\ufffda", r: "Removerá" },
    { p: "Remover\ufffd", r: "Removerá" },
    { p: "Hor\ufffdrio", r: "Horário" },
    { p: "HOR\ufffdRIO", r: "HORÁRIO" },
    { p: "orienta\ufffd\ufffdes", r: "orientações" },
    { p: "orienta\ufffdes", r: "orientações" },
    { p: "exerc\ufffdcio", r: "exercício" },
    { p: "Observa\ufffd\ufffdo", r: "Observação" },
    { p: "Observa\ufffdo", r: "Observação" },
    { p: "C\ufffdlculo", r: "Cálculo" },
    { p: "Fun\ufffd\ufffdes", r: "Funções" },
    { p: "Fun\ufffdes", r: "Funções" },
    { p: "Detec\ufffd\ufffdo", r: "Detecção" },
    { p: "Detec\ufffdo", r: "Detecção" },
    { p: "Intensifica\ufffd\ufffdo", r: "Intensificação" },
    { p: "Intensifica\ufffdo", r: "Intensificação" },
    { p: "Acumula\ufffd\ufffdo", r: "Acumulação" },
    { p: "Acumula\ufffdo", r: "Acumulação" },
    { p: "Manuten\ufffd\ufffdo", r: "Manutenção" },
    { p: "Manuten\ufffdo", r: "Manutenção" },
    { p: "Pain\ufffdeis", r: "Painéis" },
    { p: "di\ufffdrio", r: "diário" },
    { p: "Di\ufffdrio", r: "Diário" },
    { p: "est\ufffdmulo", r: "estímulo" },
    { p: "Padr\ufffdo", r: "Padrão" },
    { p: "Edi\ufffd\ufffdo", r: "Edição" },
    { p: "Edi\ufffdo", r: "Edição" },
    { p: "Transforma\ufffd\ufffdo", r: "Transformação" },
    { p: "Transforma\ufffdo", r: "Transformação" },
    { p: "transmuta\ufffd\ufffdo", r: "transmutação" },
    { p: "transmuta\ufffdo", r: "transmutação" },
    { p: "transmu\ufffdo", r: "transmutação" },
    { p: "Recupera\ufffd\ufffdo", r: "Recuperação" },
    { p: "Recupera\ufffdo", r: "Recuperação" },
    { p: "EXPERI\ufffdNCIA", r: "EXPERIÊNCIA" },
    { p: "EXPERI\ufffdSNCIA", r: "EXPERIÊNCIA" },
    { p: "P\ufffds-Teste", r: "Pós-Teste" },
    { p: "est\ufffdo", r: "estão" },
    { p: "M\ufffdn", r: "Mín" },
    { p: "T\ufffdcnico", r: "Técnico" },
    { p: "T\ufffdtico", r: "Tático" },
    { p: "S\ufffdbado", r: "Sábado" },
    { p: "Lan\ufffdar", r: "Lançar" },
    { p: "Cl\ufffdnico", r: "Clínico" },
    { p: "N\ufffdvel", r: "Nível" },
    { p: "P\ufffdblico", r: "Público" },
    { p: "Equil\ufffdbrio", r: "Equilíbrio" },
    { p: "M\ufffdnimo", r: "Mínimo" },
    { p: "m\ufffdnimo", r: "mínimo" },
    { p: "S\ufffdb", r: "Sáb" },
    { p: "Pr\ufffdximo", r: "Próximo" },
    { p: "Pr\ufffdxima", r: "Próxima" },
    { p: "Voc\ufffde", r: "Você" },
    { p: "Voc\ufffd", r: "Você" },
    { p: "Avan\ufffdar", r: "Avançar" },
    { p: "Come\ufffdar", r: "Começar" },
    { p: "A\ufffd\ufffdes", r: "Ações" },
    { p: "A\ufffdes", r: "Ações" },
    { p: "a\ufffd\ufffdes", r: "ações" },
    { p: "a\ufffdes", r: "ações" },
    { p: "M\ufffds", r: "Mês" },
    { p: "m\ufffds", r: "mês" },
    { p: "Gr\ufffdfico", r: "Gráfico" },
    { p: "Ades\ufffd\ufffdo", r: "Adesão" },
    { p: "Ades\ufffdo", r: "Adesão" },
    { p: "GRADUA\ufffd\ufffdO", r: "GRADUAÇÃO" },
    { p: "GRADUA\ufffd\u01dfO", r: "GRADUAÇÃO" },
    { p: "Vis\ufffdo", r: "Visão" },
    { p: "Alcan\ufffdada", r: "Alcançada" },
    { p: "s\ufffdries", r: "séries" },
    { p: "S\ufffdries", r: "Séries" },
    { p: "conclu\ufffd\ufffdo", r: "conclusão" },
    { p: "conclu\ufffdo", r: "conclusão" },
    { p: "inten\ufffd\ufffdo", r: "intenção" },
    { p: "inten\ufffdo", r: "intenção" },
    { p: "presen\ufffda", r: "presença" },
    { p: "presen\ufffdas", r: "presenças" },
    { p: "Frequ\ufffdncia", r: "Frequência" },
    { p: "frequ\ufffdncia", r: "frequência" }
];

targetFiles.forEach(filepath => {
    try {
        let content = fs.readFileSync(filepath, 'utf-8');
        let originalContent = content;

        ufffdReplacements.forEach(({ p, r }) => {
            if (content.includes(p)) {
                content = content.split(p).join(r);
            }
        });

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log(`[FIXED REPLACEMENT CHARACTERS] ${filepath.replace(__dirname, '')}`);
            totalModifications++;
        }
    } catch (e) {
        console.error(`[ERROR] processing ${filepath}:`, e);
    }
});

console.log(`Replacement scan complete. Fixed encoding in ${totalModifications} files.`);
