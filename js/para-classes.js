// para-classes.js — Classes esportivas do Para-Taekwondo (World Taekwondo).
// Compartilhado por todos os formulários de cadastro/edição de atleta.
// Kyorugi (luta) = K41–K44 (deficiência físico-motora de membros superiores).
// Poomsae (formas) = classes P por tipo de deficiência.
(function () {
    window.PARA_CLASSES = [
        {
            grupo: 'Kyorugi (Luta)', classes: [
                { value: 'K44', label: 'K44 — Unilateral abaixo do cotovelo' },
                { value: 'K43', label: 'K43 — Bilateral abaixo do cotovelo' },
                { value: 'K42', label: 'K42 — Unilateral acima do cotovelo' },
                { value: 'K41', label: 'K41 — Bilateral acima do cotovelo' }
            ]
        },
        {
            grupo: 'Poomsae — Visual', classes: [
                { value: 'P10', label: 'P10 — Deficiência visual' },
                { value: 'P11', label: 'P11 — Visual (acuidade pior que LogMAR 2.6)' },
                { value: 'P12', label: 'P12 — Visual (LogMAR 1.5–2.6 / campo < 10°)' }
            ]
        },
        {
            grupo: 'Poomsae — Intelectual', classes: [
                { value: 'P20', label: 'P20 — Deficiência intelectual' },
                { value: 'P21', label: 'P21 — Intelectual' },
                { value: 'P22', label: 'P22 — Intelectual' },
                { value: 'P23', label: 'P23 — Intelectual' }
            ]
        },
        {
            grupo: 'Poomsae — Neurológica', classes: [
                { value: 'P30', label: 'P30 — Neurológica (hipertonia/atetose/ataxia)' },
                { value: 'P31', label: 'P31 — Neurológica' },
                { value: 'P32', label: 'P32 — Neurológica' },
                { value: 'P33', label: 'P33 — Neurológica' },
                { value: 'P34', label: 'P34 — Neurológica' },
                { value: 'P35', label: 'P35 — Neurológica' }
            ]
        },
        {
            grupo: 'Poomsae — Física', classes: [
                { value: 'P40', label: 'P40 — Deficiência física' },
                { value: 'P41', label: 'P41 — Física' },
                { value: 'P42', label: 'P42 — Física' },
                { value: 'P43', label: 'P43 — Física' },
                { value: 'P44', label: 'P44 — Física' },
                { value: 'P45', label: 'P45 — Física' }
            ]
        },
        {
            grupo: 'Poomsae — Tecnologia assistiva', classes: [
                { value: 'P50', label: 'P50 — Tecnologia assistiva' },
                { value: 'P51', label: 'P51 — Tecnologia assistiva' },
                { value: 'P52', label: 'P52 — Tecnologia assistiva' },
                { value: 'P53', label: 'P53 — Tecnologia assistiva' }
            ]
        },
        {
            grupo: 'Poomsae — Auditiva', classes: [
                { value: 'P60', label: 'P60 — Deficiência auditiva' },
                { value: 'P61', label: 'P61 — Auditiva' }
            ]
        },
        {
            grupo: 'Poomsae — Baixa estatura', classes: [
                { value: 'P70', label: 'P70 — Baixa estatura' },
                { value: 'P72', label: 'P72 — Baixa estatura' }
            ]
        }
    ];

    // Preenche um <select> com optgroups das classes Para. Mantém o valor atual se houver.
    window.fillParaClasseSelect = function (sel, current) {
        if (!sel) return;
        const cur = current != null ? current : sel.value;
        sel.innerHTML = '<option value="">— Selecione a classe —</option>' +
            window.PARA_CLASSES.map(g =>
                '<optgroup label="' + g.grupo + '">' +
                g.classes.map(c => '<option value="' + c.value + '">' + c.label + '</option>').join('') +
                '</optgroup>'
            ).join('');
        if (cur) sel.value = cur;
    };

    // Label legível de uma classe pelo value (ex: 'K44' -> 'K44 — Unilateral...').
    window.paraClasseLabel = function (value) {
        if (!value) return '';
        for (const g of window.PARA_CLASSES) {
            const c = g.classes.find(x => x.value === value);
            if (c) return c.label;
        }
        return value;
    };
})();
