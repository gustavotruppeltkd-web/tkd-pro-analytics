const fs = require('fs');

try {
    let content = fs.readFileSync('dashboard-rendimento.html', 'utf-8');

    const fixes = [
        { p: "Abd\ufffdmen", r: "Abdômen" },
        { p: "FISIOL\ufffdGICO", r: "FISIOLÓGICO" },
        { p: "Cr\ufffdnica", r: "Crônica" },
        { p: "Duração \ufffd PSE", r: "Duração × PSE" },
        { p: "\ufffdltimas Semanas", r: "Últimas Semanas" },
        { p: "com \ufffdrea", r: "com Área" },
        { p: "F\ufffdSICOS", r: "FÍSICOS" },
        { p: "GR\ufffdFICOS", r: "GRÁFICOS" },
        { p: "\ufffdltimos 7 dias", r: "Últimos 7 dias" },
        { p: "\ufffdltimas Intera??es", r: "Últimas Interações" },
        { p: "Flutua??o da Carga", r: "Flutuação da Carga" }
    ];

    fixes.forEach(({ p, r }) => {
        if (content.includes(p)) {
            content = content.split(p).join(r);
        }
    });

    fs.writeFileSync('dashboard-rendimento.html', content, 'utf-8');
    console.log("Dashboard Rendimento fully sanitized.");
} catch (e) {
    console.error(e);
}
