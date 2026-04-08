const fs = require('fs');

try {
    let content = fs.readFileSync('dashboard-rendimento.html', 'utf-8');

    const fixes = [
        { p: /Antropom.{1,2}trica/g, r: "Antropométrica" },
        { p: /Avalia.{1,2}es/g, r: "Avaliações" },
        { p: /Lan.{1,2}amento/g, r: "Lançamento" },
        { p: /P.{1,2}ssimo/g, r: "Péssimo" },
        { p: /Cansa.{1,2}o/g, r: "Cansaço" },
        { p: /Percep.{1,2}o/g, r: "Percepção" },
        { p: /Esfor.{1,2}o/g, r: "Esforço" },
        { p: /M.{1,2}ltiplo/g, r: "Múltiplo" },
        { p: /M.{1,2}x /g, r: "Máx " },
        { p: /M.{1,2}x\)/g, r: "Máx)" },
        { p: /Refer.{1,2}ncia/g, r: "Referência" },
        { p: /Padr.{1,2}o/g, r: "Padrão" },
        { p: /Avan.{1,2}adas/g, r: "Avançadas" },
        { p: /Cr.{1,2}tico/g, r: "Crítico" },
        { p: /Preven.{1,2}o/g, r: "Prevenção" },
        { p: /padr.{1,2}o/g, r: "padrão" },
        { p: /N.{1,2}o Lan.{1,2}ado/g, r: "Não Lançado" },
        { p: /F.{1,2}rnula/g, r: "Fórmula" },
        { p: /gr.{1,2}fico/gi, r: "gráfico" },
        { p: /p.{1,2}gina/g, r: "página" },
        { p: /Ter.{1,2}a-feira/g, r: "Terça-feira" },
        { p: /t.{1,2}cnica/g, r: "técnica" },
        { p: /T.{1,2}tica/g, r: "Tática" },
        { p: /Varia.{1,2}o/g, r: "Variação" },
        { p: /Precis.{1,2}o/g, r: "Precisão" },
        { p: /Obedi.{1,2}ncia/g, r: "Obediência" },
        { p: /question.{1,2}rio/g, r: "questionário" },
        { p: /Exporta.{1,2}o/g, r: "Exportação" },
        { p: /indispon.{1,2}vel/g, r: "indisponível" },
        { p: /T.{1,2}tulo/g, r: "Título" },
        { p: /Hist.{1,2}rico/g, r: "Histórico" },
        { p: /f.{1,2}sico/g, r: "físico" },
        { p: /M.{1,2}DIA/g, r: "MÉDIA" },
        { p: /Pr.{1,2}prios/g, r: "Próprios" },
        { p: /A.{1,2}robia/g, r: "Aeróbia" },
        { p: /Est.{1,2}gio/g, r: "Estágio" },
        { p: /Composi.{1,2}es/g, r: "Composições" },
        { p: /les.{1,2}o/g, r: "lesão" },
        { p: /ap.{1,2}s/g, r: "após" },
        { p: /j.{1,2} /g, r: "já " },
        { p: /Alcan.{1,2}ada/g, r: "Alcançada" },
        { p: /M.{1,2}dico/g, r: "Médico" },
        { p: /ser.{1,2}nossa/g, r: "será nossa" },
        { p: /comp.{1,2}e/g, r: "compõe" },
        { p: /F.{1,2}SICOS/g, r: "FÍSICOS" },
        { p: /GR.{1,2}FICOS/g, r: "GRÁFICOS" }
    ];

    let original = content;
    fixes.forEach(({ p, r }) => {
        content = content.replace(p, r);
    });

    if (content !== original) {
        fs.writeFileSync('dashboard-rendimento.html', content, 'utf-8');
        console.log("Dashboard Rendimento fully sanitized (Round 5 - Regex).");
    } else {
        console.log("No changes made.");
    }
} catch (e) {
    console.error(e);
}
