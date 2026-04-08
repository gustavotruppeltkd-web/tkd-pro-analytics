const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/gusta/tkd app';

// Files to process
const files = [
    'dashboard-turma-dados.html',
    'treino-equipe.html',
    'financeiro.html',
    'turmas.html',
    'treinador-perfil.html',
    'atleta-portal.html',
    'dashboard-questionarios.html',
    'calendario.html',
    'evento-detalhes.html',
    'scout.html',
    'atleta-performance.html',
    'dashboard-rendimento.html',
    'scout-video.html',
];

// Rules: [pattern (regex string), replacement]
// These patterns target common inline-styled buttons and replace them with proper classes
const rules = [
    // "Voltar" buttons with inline styles
    [/<button([^>]*?)style="[^"]*"([^>]*?)onclick="window\.history\.back\(\)"([^>]*?)>([\s\S]*?)Voltar([\s\S]*?)<\/button>/g,
        '<button$1$2onclick="window.history.back()"$3 class="btn btn-outline"><i class="ti ti-arrow-left"></i> Voltar</button>'],

    // Buttons with trash icon → btn-icon danger
    [/<button([^>]*)class="btn btn-icon([^"]*)"([^>]*)>\s*<i class="ti ti-trash"><\/i>\s*<\/button>/g,
        '<button$1class="btn btn-icon danger"$3 title="Excluir"><i class="ti ti-trash"></i></button>'],

    // "Sair" buttons via logoutUser — already has btn btn-outline, just ensure no inline style override
    [/<button([^>]*?)style="[^"]*border-color: *var\(--red\)[^"]*"([^>]*?)onclick="[^"]*logoutUser[^"]*"([^>]*?)>([\s\S]*?)<\/button>/g,
        '<button$1$2onclick="window.logoutUser()" class="btn btn-outline" style="border-color:var(--red);color:var(--red);">$4</button>'],

    // "Editar" standalone buttons with inline style → btn-outline
    [/<button([^>]*?)style="[^"]*"([^>]*?)onclick="[^"]*[Ee]dit[^"]*"([^>]*?)class="btn btn-outline"([^>]*?)>/g,
        '<button$1$2onclick="$3" class="btn btn-outline"$4>'],

    // Download/Baixar buttons with extra inline styles → just btn-outline
    [/<button([^>]*)class="btn btn-outline"([^>]*)style="[^"]*margin[^"]*"([^>]*)>/g,
        '<button$1class="btn btn-outline"$2$3>'],
];

let totalChanges = 0;

files.forEach(filename => {
    const filepath = path.join(dir, filename);
    if (!fs.existsSync(filepath)) return;

    let content = fs.readFileSync(filepath, 'utf8');
    const original = content;
    let changes = 0;

    // Rule 1: Normalize trailing whitespace on btn-icon trash buttons
    content = content.replace(
        /(<button\s+class="btn-icon"[^>]*title="Excluir"[^>]*>)\s*(<i class="ti ti-trash"><\/i>)\s*<\/button>/g,
        '$1$2</button>'
    );

    // Rule 2: btn-icon for delete that has no danger class
    content = content.replace(
        /class="btn-icon"\s+title="Excluir"/g,
        'class="btn btn-icon danger" title="Excluir"'
    );

    // Rule 3: btn-icon with trash that has no title
    content = content.replace(
        /class="btn-icon"\s+onclick="(?:deletar|excluir|remover|delete|remove)[^"]*"/gi,
        (match) => match.replace('class="btn-icon"', 'class="btn btn-icon danger"')
    );

    // Rule 4: Remove superfluous inline margin styles from labeled buttons that have proper classes
    content = content.replace(
        /(<button\s+class="btn btn-(?:primary|outline|danger|ghost|secondary|success|warning)"[^>]*)\s+style="margin[^"]*"/g,
        '$1'
    );

    // Rule 5: Button with icon ti-plus and "Novo" / "Adicionar" text — should be btn-ghost if it has no class
    content = content.replace(
        /<button([^>]*?)style="[^"]*background[^"]*"([^>]*?)>([\s\S]*?)<i class="ti ti-plus"><\/i>([\s\S]*?)<\/button>/g,
        (match, p1, p2, p3, p4) => {
            if (match.includes('class="btn')) return match; // already classified
            const text = (p3 + p4).trim();
            // if it's a "Novo X" button, make it btn-ghost
            if (/[Nn]ov[ao]|[Aa]dicionar|[Aa]dd/i.test(text)) {
                return `<button${p1}${p2} class="btn btn-ghost"><i class="ti ti-plus"></i>${p4.trim()}</button>`;
            }
            return match;
        }
    );

    if (content !== original) {
        changes++;
        totalChanges++;
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✓ ${filename} — updated`);
    } else {
        console.log(`  ${filename} — no changes needed`);
    }
});

console.log(`\nTotal files modified: ${totalChanges}`);
