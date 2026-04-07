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

// Conversions for double-encoded UTF8 (Latin-1 misinterpretation)
const doubleEncoded = [
    { p: "çõ", r: "çõ" },
    { p: "çã", r: "çã" },
    { p: "ç", r: "ç" },
    { p: "ã", r: "ã" },
    { p: "õ", r: "õ" },
    { p: "á", r: "á" },
    { p: "é", r: "é" },
    { p: "í", r: "í" },
    { p: "ó", r: "ó" },
    { p: "ú", r: "ú" },
    { p: "â", r: "â" },
    { p: "ê", r: "ê" },
    { p: "ô", r: "ô" },
    { p: "Ã\x81", r: "Á" },
    { p: "Ã\x89", r: "É" },
    { p: "Ã\x8d", r: "Í" },
    { p: "Ã\x93", r: "Ó" },
    { p: "Ã\x9a", r: "Ú" },
    { p: "Ã\x87", r: "Ç" },
    { p: "Ã\x95", r: "Õ" },
    { p: "Ã\x83", r: "Ã" },
    { p: "Ã\x82", r: "Â" },
    { p: "Ã\x8a", r: "Ê" },
    { p: "Ã\x94", r: "Ô" },
    { p: "Ã\x9c", r: "Ü" },
    { p: "Ã\x9f", r: "ß" },
    { p: "Ú", r: "Ú" }
];

const questionGlitches = [
    { p: "Gráfico", r: "Gráfico" },
    { p: "Média", r: "Média" },
    { p: "Evolução", r: "Evolução" },
    { p: "Avaliação", r: "Avaliação" },
    { p: "Diário", r: "Diário" },
    { p: "diário", r: "diário" },
    { p: "Físico", r: "Físico" },
    { p: "Técnico", r: "Técnico" },
    { p: "Tático", r: "Tático" },
    { p: "Série", r: "Série" },
    { p: "série", r: "série" },
    { p: "Frequência", r: "Frequência" },
    { p: "Cardíaca", r: "Cardíaca" },
    { p: "Máxima", r: "Máxima" },
    { p: "Correlação", r: "Correlação" },
    { p: "Lesão", r: "Lesão" },
    { p: "Lesões", r: "Lesões" },
    { p: "Sábado", r: "Sábado" },
    { p: "Lançar", r: "Lançar" },
    { p: "Competição", r: "Competição" },
    { p: "Atenção", r: "Atenção" },
    { p: "Clínico", r: "Clínico" },
    { p: "Sáb", r: "Sáb" },
    { p: "Visão", r: "Visão" },
    { p: "Nível", r: "Nível" },
    { p: "Vocêê", r: "Vocêê" },
    { p: "Última", r: "Última" },
    { p: "Último", r: "Último" },
    { p: "Público", r: "Público" },
    { p: "Ações", r: "Ações" },
    { p: "média", r: "média" },
    { p: "Alcançado", r: "Alcançado" },
    { p: "Composição", r: "Composição" },
    { p: "Circunferência", r: "Circunferência" },
    { p: "Abdômen", r: "Abdômen" },
    { p: "Braço", r: "Braço" },
    { p: "Cutânea", r: "Cutânea" },
    { p: "Tríceps", r: "Tríceps" },
    { p: "Regiões", r: "Regiões" },
    { p: "Ocorrência", r: "Ocorrência" },
    { p: "Incidência", r: "Incidência" },
    { p: "Mês", r: "Mês" },
    { p: "Vitória", r: "Vitória" },
    { p: "Período", r: "Período" },
    { p: "Início", r: "Início" },
    { p: "Próxima", r: "Próxima" },
    { p: "Transição", r: "Transição" },
    { p: "Equilíbrio", r: "Equilíbrio" },
    { p: "Pontuação", r: "Pontuação" },
    { p: "Valência", r: "Valência" },
    { p: "Potência", r: "Potência" },
    { p: "Resistência", r: "Resistência" },
    { p: "Aeróbia", r: "Aeróbia" },
    { p: "Força", r: "Força" },
    { p: "Acúmulo", r: "Acúmulo" },
    { p: "Sessões", r: "Sessões" },
    { p: "Duração", r: "Duração" },
    { p: "Prontidão", r: "Prontidão" },
    { p: "Distribuição", r: "Distribuição" },
    { p: "Psicológico", r: "Psicológico" },
    { p: "Visualização", r: "Visualização" },
    { p: "Relatório", r: "Relatório" },
    { p: "Adesão", r: "Adesão" },
    { p: "Avançar", r: "Avançar" },
    { p: "Começar", r: "Começar" },
    { p: "necessária", r: "necessária" },
    { p: "Necessária", r: "Necessária" },
    { p: "Ações", r: "Ações" },
    { p: "mínimo", r: "mínimo" },
    { p: "Mínimo", r: "Mínimo" },
    { p: "Máximo", r: "Máximo" },
    { p: "Saúde", r: "Saúde" },
    { p: "saúde", r: "saúde" },
    { p: "Dinâmicos", r: "Dinâmicos" },
    { p: "Questionários", r: "Questionários" },
    { p: "Análise", r: "Análise" },
    { p: "Início", r: "Início" },
    { p: "Sábado", r: "Sábado" },
    { p: "Horários", r: "Horários" },

    // REPLACEMENT CHARACTER UFFFD glitches seen in grep //
    { p: "Alcançado", r: "Alcançado" },
    { p: "Distribuição", r: "Distribuição" },
    { p: "Distribuição", r: "Distribuição" },
    { p: "Média", r: "Média" },
    { p: "Média", r: "Média" },
    { p: "média", r: "média" },
    { p: "Evolução", r: "Evolução" },
    { p: "Valências", r: "Valências" },
    { p: "Valência", r: "Valência" },
    { p: "Potência", r: "Potência" },
    { p: "Resistência", r: "Resistência" },
    { p: "Aeróbia", r: "Aeróbia" },
    { p: "Força", r: "Força" },
    { p: "Histórico", r: "Histórico" },
    { p: "Composição", r: "Composição" },
    { p: "Circunferências", r: "Circunferências" },
    { p: "Tríceps", r: "Tríceps" },
    { p: "Ocorrência", r: "Ocorrência" },
    { p: "Lesões", r: "Lesões" },
    { p: "Lesão", r: "Lesão" },
    { p: "Regiões", r: "Regiões" },
    { p: "Médico", r: "Médico" },
    { p: "Transição", r: "Transição" },
    { p: "Incidência", r: "Incidência" },
    { p: "Instituição", r: "Instituição" },
    { p: "Avaliação", r: "Avaliação" },
    { p: "avaliação", r: "avaliação" },
    { p: "Série", r: "Série" },
    { p: "Correlação", r: "Correlação" },
    { p: "Classificação", r: "Classificação" },
    { p: "Cutâneas", r: "Cutâneas" },
    { p: "Ocorrências", r: "Ocorrências" },
    { p: "Atenção", r: "Atenção" },
    { p: "Pontuação", r: "Pontuação" },
    { p: "Frequência", r: "Frequência" },
    { p: "Cardíaca", r: "Cardíaca" },
    { p: "Máxima", r: "Máxima" },
    { p: "Máximo", r: "Máximo" },
    { p: "máximo", r: "máximo" },
    { p: "Descrição", r: "Descrição" },
    { p: "descrição", r: "descrição" },
    { p: "Informações", r: "Informações" },
    { p: "informações", r: "informações" },
    { p: "Seções", r: "Seções" },
    { p: "SEÇÕES", r: "SEÇÕES" },
    { p: "Currículo", r: "Currículo" },
    { p: "CURRÍCULO", r: "CURRÍCULO" },
    { p: "Formação", r: "Formação" },
    { p: "FORMAÇÃO", r: "FORMAÇÃO" },
    { p: "CERTIFICAÇÕES", r: "CERTIFICAÇÕES" },
    { p: "Certificações", r: "Certificações" },
    { p: "Periodização", r: "Periodização" },
    { p: "Competição", r: "Competição" },
    { p: "Gestão", r: "Gestão" },
    { p: "Sessão", r: "Sessão" },
    { p: "Sessões", r: "Sessões" },
    { p: "Duração", r: "Duração" },
    { p: "Proteção", r: "Proteção" },
    { p: "Não", r: "Não" },
    { p: "Físico", r: "Físico" },
    { p: "Reunião", r: "Reunião" },
    { p: "Próprio", r: "Próprio" },
    { p: "Título", r: "Título" },
    { p: "título", r: "título" },
    { p: "Removeráá", r: "Removerááá" },
    { p: "Removeráá", r: "Removerááá" },
    { p: "Horário", r: "Horário" },
    { p: "HORÁRIO", r: "HORÁRIO" },
    { p: "orientações", r: "orientações" },
    { p: "exercício", r: "exercício" },
    { p: "Observação", r: "Observação" },
    { p: "Cálculo", r: "Cálculo" },
    { p: "Funções", r: "Funções" },
    { p: "Detecção", r: "Detecção" },
    { p: "Intensificação", r: "Intensificação" },
    { p: "Acumulação", r: "Acumulação" },
    { p: "Manutenção", r: "Manutenção" },
    { p: "Painéis", r: "Painéis" },
    { p: "diário", r: "diário" },
    { p: "Diário", r: "Diário" },
    { p: "estímulo", r: "estímulo" },
    { p: "Padrão", r: "Padrão" },
    { p: "Edição", r: "Edição" },
    { p: "Transformação", r: "Transformação" },
    { p: "transmutação", r: "transmutação" },
    { p: "Recuperação", r: "Recuperação" },
    { p: "EXPERIÊNCIA", r: "EXPERIÊNCIA" },
    { p: "Pós-Teste", r: "Pós-Teste" },
    { p: "Aeróbia", r: "Aeróbia" },
    { p: "estão", r: "estão" },
    { p: "Mín", r: "Mín" }, // "flMín"
    { p: "Técnico", r: "Técnico" },
    { p: "Tático", r: "Tático" },
    { p: "Sábado", r: "Sábado" },
    { p: "Lançar", r: "Lançar" },
    { p: "Clínico", r: "Clínico" },
    { p: "Nível", r: "Nível" },
    { p: "Público", r: "Público" },
    { p: "Equilíbrio", r: "Equilíbrio" },
    { p: "Mínimo", r: "Mínimo" },
    { p: "mínimo", r: "mínimo" },
    { p: "Sáb", r: "Sáb" },
    { p: "Próximo", r: "Próximo" },
    { p: "Próxima", r: "Próxima" },
    { p: "Você", r: "Vocêê" },
    { p: "Avançar", r: "Avançar" },
    { p: "Começar", r: "Começar" },
    { p: "Ações", r: "Ações" },
    { p: "Ações", r: "Ações" },
    { p: "Mês", r: "Mês" },
    { p: "mês", r: "mês" },
    { p: "Gráfico", r: "Gráfico" },
    { p: "Adesão", r: "Adesão" },
    { p: "GRADUAÇÃO", r: "GRADUAÇÃO" }
];

targetFiles.forEach(filepath => {
    try {
        let content = fs.readFileSync(filepath, 'utf-8');
        let originalContent = content;

        doubleEncoded.forEach(({ p, r }) => {
            if (content.includes(p)) content = content.split(p).join(r);
        });

        questionGlitches.forEach(({ p, r }) => {
            if (content.includes(p)) content = content.split(p).join(r);
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

console.log(`Scan complete. Fixed encoding in ${totalModifications} files.`);
