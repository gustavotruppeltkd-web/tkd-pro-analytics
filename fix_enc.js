const fs = require('fs');

const files = [
    "dashboard-rendimento.html",
    "selecionar-treinador.html",
    "turmas.html"
];

const replacements = [
    { p: "Gr?fico", r: "Gráfico" },
    { p: "M?dia", r: "Média" },
    { p: "Evolu??o", r: "Evolução" },
    { p: "Avalia??o", r: "Avaliação" },
    { p: "Di?rio", r: "Diário" },
    { p: "di?rio", r: "diário" },
    { p: "F?sico", r: "Físico" },
    { p: "T?cnico", r: "Técnico" },
    { p: "T?tico", r: "Tático" },
    { p: "S?rie", r: "Série" },
    { p: "s?rie", r: "série" },
    { p: "Frequ?ncia", r: "Frequência" },
    { p: "Card?aca", r: "Cardíaca" },
    { p: "M?xima", r: "Máxima" },
    { p: "Correla??o", r: "Correlação" },
    { p: "Les?o", r: "Lesão" },
    { p: "Les?es", r: "Lesões" },
    { p: "S?bado", r: "Sábado" },
    { p: "Lan?ar", r: "Lançar" },
    { p: "Competi??o", r: "Competição" },
    { p: "Aten??o", r: "Atenção" },
    { p: "Cl?nico", r: "Clínico" },
    { p: "S?b", r: "Sáb" },
    { p: "Vis??o", r: "Visão" },
    { p: "N?vel", r: "Nível" },
    { p: "Voc?", r: "Você" },
    { p: "?ltima", r: "Última" },
    { p: "?ltimo", r: "Último" },
    { p: "P?blico", r: "Público" },
    { p: "A?es", r: "Ações" },
    { p: "m?dia", r: "média" },
    { p: "Alcan?ado", r: "Alcançado" },
    { p: "Composi??o", r: "Composição" },
    { p: "Circunfer?ncia", r: "Circunferência" },
    { p: "Abd?men", r: "Abdômen" },
    { p: "Bra?o", r: "Braço" },
    { p: "Cut?nea", r: "Cutânea" },
    { p: "Tr?ceps", r: "Tríceps" },
    { p: "Regi?es", r: "Regiões" },
    { p: "Ocorr?ncia", r: "Ocorrência" },
    { p: "Incid?ncia", r: "Incidência" },
    { p: "M?s", r: "Mês" },
    { p: "Vit?ria", r: "Vitória" },
    { p: "Per?odo", r: "Período" },
    { p: "In?cio", r: "Início" },
    { p: "Pr?xima", r: "Próxima" },
    { p: "Transi??o", r: "Transição" },
    { p: "Equil?brio", r: "Equilíbrio" },
    { p: "Pontua??o", r: "Pontuação" },
    { p: "Val?ncia", r: "Valência" },
    { p: "Pot?ncia", r: "Potência" },
    { p: "Resist?ncia", r: "Resistência" },
    { p: "Aer?bia", r: "Aeróbia" },
    { p: "For?a", r: "Força" },
    { p: "Ac?mulo", r: "Acúmulo" },
    { p: "Sess?es", r: "Sessões" },
    { p: "Dura??o", r: "Duração" },
    { p: "Prontid?o", r: "Prontidão" },
    { p: "Distribui??o", r: "Distribuição" },
    { p: "Psicol?gico", r: "Psicológico" },
    { p: "Visualiza??o", r: "Visualização" },
    { p: "Relat?rio", r: "Relatório" },
    { p: "Ades?o", r: "Adesão" },
    { p: "Avan?ar", r: "Avançar" },
    { p: "Come?ar", r: "Começar" }
];

files.forEach(filepath => {
    if (fs.existsSync(filepath)) {
        try {
            let content = fs.readFileSync(filepath, 'utf-8');
            // string.replaceAll escapes literals safely natively
            replacements.forEach(({ p, r }) => {
                content = content.replaceAll(p, r);
            });
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log(`Fixed ${filepath}`);
        } catch (e) {
            console.error(`Error on ${filepath}:`, e);
        }
    }
});
