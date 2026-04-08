const fs = require('fs');

try {
    let content = fs.readFileSync('dashboard-rendimento.html', 'utf-8');

    const fixes = [
        { p: "Antropométrica", r: "Antropométrica" },
        { p: "Lançamento", r: "Lançamento" },
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
        { p: "Fórmula", r: "Fórmula" },
        { p: "gráfico", r: "gráfico" },
        { p: "página", r: "página" },
        { p: "Terça-feira", r: "Terça-feira" },
        { p: "técnica", r: "técnica" },
        { p: "Tática", r: "Tática" },
        { p: "Variação", r: "Variação" },
        { p: "Precisão", r: "Precisão" },
        { p: "Obediência", r: "Obediência" },
        { p: "questionário", r: "questionário" },
        { p: "Exportação", r: "Exportação" },
        { p: "indisponível", r: "indisponível" },
        { p: "Título", r: "Título" },
        { p: "Histórico", r: "Histórico" },
        { p: "físico", r: "físico" },
        { p: "MÉDIA", r: "MÉDIA" },
        { p: "Próprios", r: "Próprios" },
        { p: "Aeróbia", r: "Aeróbia" },
        { p: "Estágio", r: "Estágio" },
        { p: "Composições", r: "Composições" },
        { p: "lesão", r: "lesão" },
        { p: "após", r: "após" },
        { p: "já", r: "já" },
        { p: "? ", r: "é " }, // e.g. "técnica ? " -> "técnica é "
        { p: "A?es", r: "Ações" }
    ];

    let original = content;
    fixes.forEach(({ p, r }) => {
        if (content.includes(p)) {
            content = content.split(p).join(r);
        }
    });

    if (content !== original) {
        fs.writeFileSync('dashboard-rendimento.html', content, 'utf-8');
        console.log("Dashboard Rendimento fully sanitized (Round 3).");
    } else {
        console.log("No changes made.");
    }
} catch (e) {
    console.error(e);
}
