/* STATE MANAGEMENT GLOBALS (LocalStorage) */

const MOCK_DATA = {
    turmas: [],
    alunos: [],
    planos: [],
    horarios: [],
    categoriasPeso: [
        '-54kg', '-58kg', '-63kg', '-68kg', '-74kg', '-80kg', '-87kg', '+87kg'
    ],
    faixas: [
        '10º GUB (Branca)',
        '9º GUB (Ponta Amarela)',
        '8º GUB (Amarela)',
        '7º GUB (Ponta Verde)',
        '6º GUB (Verde)',
        '5º GUB (Ponta Azul)',
        '4º GUB (Azul)',
        '3º GUB (Ponta Vermelha)',
        '2º GUB (Vermelha)',
        '1º GUB (Ponta Preta)',
        '1º DAN (Preta)'
    ],
    treinadores: [],
    wellnessLogs: [],
    questionarios: [],
    respostas: [],
    cargaTreino: [],
    competicoes: [],
    scoutEstatisticas: [],
    treinos: [],
    eventos: [],
    lutasScout: [],
    presencas: [],
    chamadas: [],
    lesoes: [],
    periodizacao: {
        macroId: null,
        faseAtual: '',
        microciclos: [],
        mesociclos: []
    },
    activeTurmaId: null
};

var db = {};
var lastSyncTime = 0;


// Load Database from LocalStorage or initialize with MOCK_DATA
function loadDB() {
    // ── Device mode ──────────────────────────────────────────
    const deviceMode = localStorage.getItem('tkd_device_mode') || 'desktop';
    document.body.classList.remove('mode-tablet', 'mode-mobile');
    if (deviceMode === 'tablet') document.body.classList.add('mode-tablet');
    if (deviceMode === 'mobile') document.body.classList.add('mode-mobile');

    // Inject hamburger button for mobile mode on pages that have a sidebar
    if (deviceMode === 'mobile' && !document.getElementById('__mobileMenuBtn')) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const btn = document.createElement('button');
            btn.id = '__mobileMenuBtn';
            btn.innerHTML = '<i class="ti ti-menu-2"></i>';
            btn.title = 'Menu';
            btn.style.cssText = [
                'position:fixed', 'top:16px', 'left:16px', 'z-index:950',
                'width:44px', 'height:44px', 'border-radius:10px',
                'background:var(--bg-card)', 'border:1px solid var(--border-color)',
                'color:var(--text-main)', 'font-size:22px',
                'display:flex', 'align-itemês:center', 'justify-content:center',
                'cursor:pointer', 'transition:var(--transition)'
            ].join(';');
            btn.onclick = () => {
                sidebar.classList.toggle('open');
                // Tap backdrop to close
                const bd = document.getElementById('__sidebarBackdrop');
                if (bd) bd.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
            };
            document.body.appendChild(btn);

            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.id = '__sidebarBackdrop';
            backdrop.style.cssText = [
                'position:fixed', 'inset:0', 'z-index:849',
                'background:rgba(0,0,0,0.5)', 'display:none'
            ].join(';');
            backdrop.onclick = () => {
                sidebar.classList.remove('open');
                backdrop.style.display = 'none';
            };
            document.body.appendChild(backdrop);
        }
    }
    // ─────────────────────────────────────────────────────────

    const stored = localStorage.getItem('tkd_scout_db');
    if (stored) {
        db = JSON.parse(stored);
        if (!db.categoriasPeso) { db.categoriasPeso = [...(MOCK_DATA.categoriasPeso || [])]; saveDB(); }
        if (!db.faixas) { db.faixas = [...MOCK_DATA.faixas]; saveDB(); }
        if (!db.treinadores) { db.treinadores = [...MOCK_DATA.treinadores]; saveDB(); }
        if (!db.wellnessLogs) { db.wellnessLogs = [...MOCK_DATA.wellnessLogs]; saveDB(); }
        if (!db.questionarios) { db.questionarios = [...MOCK_DATA.questionarios]; saveDB(); }
        if (!db.respostas) { db.respostas = []; saveDB(); }
        if (!db.cargaTreino) { db.cargaTreino = [...MOCK_DATA.cargaTreino]; saveDB(); }
        if (!db.competicoes) { db.competicoes = [...MOCK_DATA.competicoes]; saveDB(); }
        if (!db.scoutEstatisticas) { db.scoutEstatisticas = [...MOCK_DATA.scoutEstatisticas]; saveDB(); }
        if (!db.antropometria) { db.antropometria = []; saveDB(); }
        if (!db.treinos) { db.treinos = []; saveDB(); }
        if (!db.eventos) { db.eventos = [...(MOCK_DATA.eventos || [])]; saveDB(); }
        if (!db.lutasScout) { db.lutasScout = []; saveDB(); }
        if (!db.chamadas) { db.chamadas = []; saveDB(); }
        if (!db.lesoes) { db.lesoes = [...(MOCK_DATA.lesoes || [])]; saveDB(); }
        if (!db.periodizacao) { db.periodizacao = JSON.parse(JSON.stringify(MOCK_DATA.periodizacao)); saveDB(); }
    } else {
        db = JSON.parse(JSON.stringify(MOCK_DATA)); // Deep copy
        saveDB();
    }
    window.db = db;
    lastSyncTime = db._last_updated || 0;

    // Trigger background fetch from Supabase
    fetchFromSupabase();

    // Render profile header if elements exist
    renderUserProfile();

    // Check if trainer profile needs to be set up
    checkTrainerOnboarding();
}

// Fetch latest state from Supabase
function fetchFromSupabase() {
    if (!window.supabaseClient) return;

    window.supabaseClient
        .from('app_state')
        .select('data')
        .eq('project_id', '00000000-0000-0000-0000-000000000001')
        .single()
        .then(({ data, error }) => {
            if (error && error.code !== 'PGRST116') {
                console.error("Erro ao buscar Supabase:", error);
                return;
            }
            if (data && data.data) {
                const remoteDate = data.data._last_updated || 1;
                const localDate = lastSyncTime || 0;

                const remoteHasValidTrainer = data.data.treinadores && data.data.treinadores.length > 0;

                if (remoteDate > localDate || (!localDate && remoteHasValidTrainer)) {
                    const remoteDB = data.data;

                    // MERGE GUARD: never overwrite a locally saved trainer
                    // with stale remote data that doesn't have one yet.
                    const localHasTrainer = db.treinadores &&
                        db.treinadores.length > 0 &&
                        db.treinadores[0].nome &&
                        db.treinadores[0].nome.trim() !== '';
                    const remoteHasTrainer = remoteDB.treinadores &&
                        remoteDB.treinadores.length > 0 &&
                        remoteDB.treinadores[0].nome &&
                        remoteDB.treinadores[0].nome.trim() !== '';

                    if (localHasTrainer && !remoteHasTrainer) {
                        // Trainer was just saved locally but hasn't synced to Supabase yet.
                        // Push it up — do NOT reload.
                        console.log("Local trainer not in Supabase yet. Pushing local data up.");
                        syncToSupabase();
                    } else {
                        // Remote data is genuinely newer — safe to accept it.
                        console.log("Supabase has newer data. Updating local...");
                        localStorage.setItem('tkd_scout_db', JSON.stringify(remoteDB));
                        lastSyncTime = remoteDate;

                        if (document.visibilityState === 'visible') {
                            showToast("Atualiza\u00e7\u00e3oção remota recebida! Recarregando os dados...", "info");
                            setTimeout(() => location.reload(), 2000);
                        } else {
                            location.reload();
                        }
                    }
                } else if (remoteDate === 0 && localDate > 0) {
                    // Supabase is empty but we have local data — force a push
                    syncToSupabase();
                }
            } else {
                // Supabase doesn't have the row at all, do initial push
                syncToSupabase();
            }

            // Subscribe to remote changes
            setupRealtimeSubscription();

            // Call a potential global hook if implemented
            if (typeof window.onDataLoaded === 'function') {
                window.onDataLoaded();
            }

            // Re-check onboarding after remote data loads (trainer might have been set remotely)
            checkTrainerOnboarding();
        });
}

function renderUserProfile() {
    const nameEls = document.querySelectorAll('.user-name');
    const roleEls = document.querySelectorAll('.user-role');
    const avatarEls = document.querySelectorAll('.user-profile img.avatar, .topbar img.avatar');
    const userProfiles = document.querySelectorAll('.user-profile');

    const trainer = (db.treinadores && db.treinadores.length > 0) ? db.treinadores[0] : null;

    if (trainer) {
        nameEls.forEach(el => el.textContent = trainer.nome);
        roleEls.forEach(el => el.textContent = trainer.papel || trainer.role);
        if (trainer.avatar) {
            avatarEls.forEach(el => el.src = trainer.avatar);
        }
    }

    userProfiles.forEach(profile => {
        profile.style.cursor = 'pointer';
        profile.onclick = () => {
            window.location.href = 'treinador-perfil.html';
        };
    });
}

// ========================
// GLOBAL ONBOARDING GATE
// ========================
function checkTrainerOnboarding() {
    // Skip on login page, atleta pages, and trainer selection page
    const page = window.location.pathname;
    if (page.includes('index.html') || page === '/' || page.includes('atleta-') || page.includes('selecionar-treinador')) return;

    const hasTrainer = db.treinadores && db.treinadores.length > 0 &&
        db.treinadores[0].nome && db.treinadores[0].nome.trim() !== '';
    if (hasTrainer) {
        // If modal was shown, remove it
        const existing = document.getElementById('__onboardingGate');
        if (existing) existing.remove();
        return;
    }

    // Avoid injecting twice
    if (document.getElementById('__onboardingGate')) return;

    const overlay = document.createElement('div');
    overlay.id = '__onboardingGate';
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999',
        'background:rgba(10,14,26,0.97)',
        'display:flex', 'align-itemês:center', 'justify-content:center',
        'font-family:Inter,system-ui,sans-serif'
    ].join(';');

    overlay.innerHTML = `
        <div style="background:#111827;border:1px solid #1e40af;border-radius:20px;padding:48px 40px;max-width:480px;width:90%;box-shadow:0 0 60px rgba(59,130,246,0.2);text-align:center;">
            <div style="width:72px;height:72px;background:rgba(59,130,246,0.12);border-radius:50%;display:flex;align-itemês:center;justify-content:center;margin:0 auto 24px;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;">Bem-vindo ao Pro Coach!</h2>
            <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 32px;">Antes de começar, configure seu perfil de treinador. Isso personaliza todos os seus relatórios e dashboards.</p>
            <div style="text-align:left;margin-bottom:20px;">
                <label style="display:block;color:#d1d5db;font-size:13px;font-weight:500;margin-bottom:6px;">Seu Nãome Completo *</label>
                <input id="__ob_name" type="text" placeholder="Ex: Mestre Carlos Silva"
                    style="width:100%;box-sizing:border-box;background:#1f2937;border:1px solid #374151;border-radius:10px;padding:12px 16px;color:#fff;font-size:14px;outline:none;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#374151'">
            </div>
            <div style="text-align:left;margin-bottom:32px;">
                <label style="display:block;color:#d1d5db;font-size:13px;font-weight:500;margin-bottom:6px;">Cargo / Função *</label>
                <input id="__ob_role" type="text" placeholder="Ex: Treinador Principal, Head Coach"
                    style="width:100%;box-sizing:border-box;background:#1f2937;border:1px solid #374151;border-radius:10px;padding:12px 16px;color:#fff;font-size:14px;outline:none;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#374151'">
            </div>
            <button id="__ob_btn" onclick="window.__saveOnboarding()"
                style="width:100%;background:#2563eb;color:#fff;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:600;cursor:pointer;display:flex;align-itemês:center;justify-content:center;gap:8px;transition:background 0.2s;"
                onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
                Começar a Usar &rarr;
            </button>
            <p id="__ob_err" style="color:#f87171;font-size:12px;margin-top:12px;display:none;">Por favor, preencha todos os campos.</p>
        </div>
    `;

    // Block clicks on the page beneath
    overlay.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(overlay);

    // Bind Enter key
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') window.__saveOnboarding();
    });

    window.__saveOnboarding = function () {
        const nome = document.getElementById('__ob_name').value.trim();
        const papel = document.getElementById('__ob_role').value.trim();
        const errEl = document.getElementById('__ob_err');

        if (!nome || !papel) {
            errEl.style.display = 'block';
            return;
        }
        errEl.style.display = 'none';

        db.treinadores = [{
            id: 1,
            nome: nome,
            papel: papel,
            role: papel,
            avatar: 'https://cdn-icons-png.flaticon.com/512/10337/10337579.png',
            experiencia: '',
            graduacao: '',
            localizacao: '',
            bio: '',
            conquistas: [],
            formacao: []
        }];

        saveDB();
        renderUserProfile();

        const gate = document.getElementById('__onboardingGate');
        if (gate) {
            gate.style.opacity = '0';
            gate.style.transition = 'opacity 0.3s';
            setTimeout(() => gate.remove(), 300);
        }

        // Set active coach id
        localStorage.setItem('tkd_active_coach_id', '1');

        // Show toast
        if (typeof showToast === 'function') showToast('Perfil configurado com sucesso!', 'success');
    };
}

function setupRealtimeSubscription() {
    if (window._supabaseSubscribed) return;
    window._supabaseSubscribed = true;

    window.supabaseClient
        .channel('public:app_state')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_state' }, payload => {
            const remoteData = payload.new.data;
            if (remoteData && remoteData._last_updated > lastSyncTime) {
                console.log("Realtime: New data received!");
                localStorage.setItem('tkd_scout_db', JSON.stringify(remoteData));
                showToast("Dados Atualiza\u00e7\u00e3odos remotamente!", "info");
                setTimeout(() => location.reload(), 1500);
            }
        })
        .subscribe();
}

// Salva estado do banco no Local Storage e Sincroniza
function saveDB() {
    db._last_updated = Date.now();
    lastSyncTime = db._last_updated;
    localStorage.setItem('tkd_scout_db', JSON.stringify(window.db || db));

    // Background push
    syncToSupabase();
}

// Helper para fazer o UPSERT silencioso
function syncToSupabase() {
    if (!window.supabaseClient) return;
    const currentData = window.db || db;

    window.supabaseClient
        .from('app_state')
        .upsert({
            project_id: '00000000-0000-0000-0000-000000000001',
            data: currentData
        })
        .then(({ error }) => {
            if (error) console.error("Erro no Upsert Supabase:", error);
        });
}

// --- GLOBAL TOAST SYSTEM ---
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = type === 'success' ? 'ti-check' : 'ti-info-circle';
    if (type === 'error') icon = 'ti-alert-triangle';

    toast.innerHTML = `<i class="ti ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    // Animar a entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Removeráá ap�s 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400); // tempo da transi��o css
    }, 3000);
}

// Reset Database (useful for testing)
function resetDB() {
    localStorage.removeItem('tkd_scout_db');
    loadDB();
    if (window.location.href.includes('index.html')) location.reload();
}

// --- UTILS ---

// Calcula idade baseada na data de nascimento (ex: '2008-04-12')
function calcularIdade(dataNasc) {
    if (!dataNasc) return '?';
    const ns = dataNasc.split('-');
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    let idade = anoAtual - parseInt(ns[0]);
    // Simplificado para UI. Nnum app real, subtrai 1 se mês/dia ainda n�o passou
    return idade;
}

// Formata data YYYY-MM-DD para DD/MM/AAAA
function formatarDataBR(dataSql) {
    if (!dataSql) return '';
    const ns = dataSql.split('-');
    return `${ns[2]}/${ns[1]}/${ns[0]}`;
}

// Formatar mês ex: Ago
function formatarMesCurto(dataSql) {
    if (!dataSql) return '';
    const date = new Date(dataSql + "T00:00:00");
    return date.toLocaleString('pt-BR', { month: 'short' });
}

// --- SCALE BUTTONS UTILS ---
function renderScaleButtons(min, max, val, hiddenId, isReverseColors = false) {
    let html = '';
    for (let i = min; i <= max; i++) {
        let pct = (i - min) / (max - min); // 0.0 to 1.0
        let colorClass = 'c-green';

        if (isReverseColors) {
            if (pct >= 0.75) colorClass = 'c-red';
            else if (pct >= 0.55) colorClass = 'c-orange';
            else if (pct >= 0.35) colorClass = 'c-yellow';
            else if (pct >= 0.15) colorClass = 'c-lime';
        } else {
            if (pct <= 0.25) colorClass = 'c-red';
            else if (pct <= 0.45) colorClass = 'c-orange';
            else if (pct <= 0.65) colorClass = 'c-yellow';
            else if (pct <= 0.85) colorClass = 'c-lime';
        }

        let isActive = (i == parseInt(val)) ? 'active' : '';
        html += `<div class="btn-scale ${colorClass} ${isActive}" onclick="selScale(this, '${hiddenId}', ${i})">${i}</div>`;
    }
    return `<div class="btn-scale-group" id="group_${hiddenId}">${html}</div>
            <input type="hidden" id="${hiddenId}" name="${hiddenId}" value="${val}">`;
}

function selScale(el, hiddenId, val) {
    const parent = el.parentElement;
    parent.querySelectorAll('.btn-scale').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');

    // Suporte para IDs tradicionais ou arrays name (usados nos formul�rios din�micos de Qs)
    let hiddenInput = document.getElementById(hiddenId);
    if (!hiddenInput) {
        hiddenInput = document.querySelector(`input[name="${hiddenId}"]`);
    }

    if (hiddenInput) {
        hiddenInput.value = val;
        // Dispara eventos para Atualiza\u00e7\u00e3or outros componentes que dependam do input
        hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// Converter ranges est�ticos em bot�es
function replaceRangesWithButtons(container = document) {
    container.querySelectorAll('input[type="range"]:not(.no-btn-convert)').forEach(input => {
        const min = parseInt(input.min || '0');
        const max = parseInt(input.max || '10');
        const val = parseInt(input.value || min);
        const id = input.id || input.name;
        if (!id) return;

        // Determina se a escala de cores deve ser invertida baseado no ID/Name
        const isReverse = id.toLowerCase().includes('pse');

        const btnHtml = renderScaleButtons(min, max, val, id, isReverse);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = btnHtml;

        // Remove text displays since buttons cover it
        if (input.parentElement) {
            const display = input.parentElement.querySelector('.q-range-val');
            if (display) display.style.display = 'none';
        }

        input.replaceWith(...wrapper.childNãodes);
    });
}

function populateFaixaSelects() {
    const selects = document.querySelectorAll('select[name="faixaAluno"]');
    if (selects.length === 0) return;

    const optionsHTML = '<option value="">Selecione...</option>' +
        (db.faixas || []).map(f => `<option value="${f}">${f}</option>`).join('');

    selects.forEach(select => {
        const val = select.value;
        select.innerHTML = optionsHTML;
        if (val && db.faixas.includes(val)) select.value = val;
    });
}

function populatePesoSelects() {
    const selects = document.querySelectorAll('select[name="pesoAtleta"], select[name="pesoAluno"]');
    if (selects.length === 0) return;

    const optionsHTML = '<option value="">Sem Categoria</option>' +
        (db.categoriasPeso || []).map(p => `<option value="${p}">${p}</option>`).join('');

    selects.forEach(select => {
        const val = select.getAttribute('data-value') || select.value;
        select.innerHTML = optionsHTML;
        if (val && db.categoriasPeso.includes(val)) select.value = val;
    });
}

// --- FAIXA CONFIG MODAL ---
function openConfigFaixas(e) {
    if (e) e.preventDefault();
    let modal = document.getElementById('modalConfigFaixas');

    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modalConfigFaixas';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; z-index: 1001;">
                <div class="modal-header">
                    <h2 class="modal-title">Gerenciar Faixas</h2>
                    <button class="btn-close" type="button" onclick="closeConfigFaixas()"><i class="ti ti-x"></i></button>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 24px;">
                    <input type="text" id="novaFaixaInput" class="form-control" placeholder="Nãova cor...">
                    <button type="button" class="btn btn-primary" onclick="addFaixa()"><i class="ti ti-plus"></i></button>
                </div>
                <div id="listaFaixas" style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto;">
                    <!-- Rendered by JS -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    renderListaFaixas();
    modal.classList.add('active');
}

function closeConfigFaixas() {
    const modal = document.getElementById('modalConfigFaixas');
    if (modal) modal.classList.remove('active');
}

function renderListaFaixas() {
    const list = document.getElementById('listaFaixas');
    if (!list) return;
    list.innerHTML = db.faixas.map((f, i) => `
        <div style="display: flex; justify-content: space-between; align-itemês: center; padding: 12px; background: var(--bg-hover); border-radius: var(--radius-sm);">
            <span style="font-size: 14px; font-weight: 500;">${f}</span>
            <button type="button" class="btn-icon" style="color: var(--red); border: none; width: 32px; height: 32px;" onclick="removeFaixa(${i})"><i class="ti ti-trash"></i></button>
        </div>
    `).join('');
}

function addFaixa() {
    const input = document.getElementById('novaFaixaInput');
    const val = input.value.trim();
    if (val && !db.faixas.includes(val)) {
        db.faixas.push(val);
        saveDB();
        renderListaFaixas();
        populateFaixaSelects();
        input.value = '';
    }
}

function removeFaixa(index) {
    if (confirm('Tem certeza que deseja remover esta faixa? Alunos ainda podem t�-la listada se j�atribu�da no passado.')) {
        db.faixas.splice(index, 1);
        saveDB();
        renderListaFaixas();
        populateFaixaSelects();
    }
}

// --- PESOS CONFIG MODAL ---
function openConfigPesos(e) {
    if (e) e.preventDefault();
    let modal = document.getElementById('modalConfigPesos');

    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modalConfigPesos';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; z-index: 1001;">
                <div class="modal-header">
                    <h2 class="modal-title">Gerenciar Categorias de Peso</h2>
                    <button class="btn-close" type="button" onclick="closeConfigPesos()"><i class="ti ti-x"></i></button>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 24px;">
                    <input type="text" id="novoPesoInput" class="form-control" placeholder="Ex: -68kg">
                    <button type="button" class="btn btn-primary" onclick="addPeso()"><i class="ti ti-plus"></i></button>
                </div>
                <div id="listaPesos" style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto;">
                    <!-- Rendered by JS -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    renderListaPesos();
    modal.classList.add('active');
}

function closeConfigPesos() {
    const modal = document.getElementById('modalConfigPesos');
    if (modal) modal.classList.remove('active');
}

function renderListaPesos() {
    const list = document.getElementById('listaPesos');
    if (!list) return;
    list.innerHTML = (db.categoriasPeso || []).map((p, i) => `
        <div style="display: flex; justify-content: space-between; align-itemês: center; padding: 12px; background: var(--bg-hover); border-radius: var(--radius-sm);">
            <span style="font-size: 14px; font-weight: 500;">${p}</span>
            <button type="button" class="btn-icon" style="color: var(--red); border: none; width: 32px; height: 32px;" onclick="removePeso(${i})"><i class="ti ti-trash"></i></button>
        </div>
    `).join('');
}

function addPeso() {
    const input = document.getElementById('novoPesoInput');
    const val = input.value.trim();
    if (val && !db.categoriasPeso.includes(val)) {
        db.categoriasPeso.push(val);
        saveDB();
        renderListaPesos();
        populatePesoSelects();
        input.value = '';
    }
}

function removePeso(index) {
    if (confirm('Tem certeza que deseja remover esta categoria de peso?')) {
        db.categoriasPeso.splice(index, 1);
        saveDB();
        renderListaPesos();
        populatePesoSelects();
    }
}


// UI Helpers (Animations & Nav)

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('tkd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('tkd_theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    if (currentTheme === 'light') {
        themeToggleBtn.innerHTML = '<i class="ti ti-moon"></i>';
    } else {
        themeToggleBtn.innerHTML = '<i class="ti ti-sun"></i>';
    }
}

initTheme();

// Rendereiza o Coach Logado no Topo da Pagina
function renderActiveCoach() {
    const coachId = localStorage.getItem('tkd_active_coach_id');
    if (!coachId || !db.treinadores) return;

    const coach = db.treinadores.find(t => t.id === parseInt(coachId));
    if (!coach) return;

    // Turmas greeting (Home)
    const greeting = document.querySelector('.splash-subtitle');
    if (greeting && greeting.innerText.includes('Bem-vindo')) {
        greeting.innerText = `Bem-vindo, ${coach.nome}. Qual equipe deseja gerenciar agora?`;
    }

    // Header in Dashboards
    const userProfiles = document.querySelectorAll('.user-profile');

    userProfiles.forEach(profile => {
        // Redirection
        profile.style.cursor = 'pointer';
        profile.addEventListener('click', () => {
            window.location.href = 'treinador-perfil.html';
        });

        const avatarEl = profile.querySelector('img.avatar, img.user-avatar');
        if (avatarEl) avatarEl.src = coach.avatar;

        const nameEl = profile.querySelector('.user-name');
        if (nameEl) nameEl.innerText = coach.nome;

        const roleEl = profile.querySelector('.user-role');
        if (roleEl) roleEl.innerText = coach.role || coach.papel;
    });
}

// --- SIDEBAR STANDARDIZATION ---
function renderSidebar() {
    const nav = document.getElementById('navMenuContainer');
    if (!nav) return;
    const turma = db.turmas ? db.turmas.find(t => t.id === db.activeTurmaId) : null;
    const tipo = (turma && turma.tipo || '').toLowerCase();
    const isRendimento = tipo.includes('rendimento') || tipo.includes('competi\u00e7\u00e3o');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let menuItemês = [];
    if (isRendimento) {
        menuItemês = [
            { href: 'dashboard-turma-dados.html', icon: 'ti-calendar-event', label: 'Vis\u00e3o da Equipe' },
            { href: 'dashboard-rendimento.html', icon: 'ti-activity', label: 'Monitoramento' },
            { href: 'dashboard-questionarios.html', icon: 'ti-clipboard-list', label: 'Question\u00e1rios' },
            { href: 'treino-equipe.html', icon: 'ti-barbell', label: 'Treinos' },
            { href: 'calendario.html', icon: 'ti-calendar', label: 'Calend\u00e1rio' },
            { href: 'scout-video.html', icon: 'ti-video', label: 'An\u00e1lise de Lutas' }
        ];
    } else {
        menuItemês = [
            { href: 'dashboard-turma-dados.html', icon: 'ti-users', label: 'Dados da Turma' },
            { href: 'dashboard-aulas.html', icon: 'ti-checklist', label: 'Chamada Di\u00e1ria' },
            { href: 'financeiro.html', icon: 'ti-cash', label: 'Financeiro' }
        ];
    }
    menuItemês.push({ href: 'perfil.html', icon: 'ti-user-circle', label: 'Meu Perfil' });
    const html = menuItemês.map(item => {
        const isActive = currentPage === item.href;
        const isPerformanceActive = currentPage === 'atleta-performance.html' && item.href === 'dashboard-turma-dados.html' && isRendimento;
        return `
            <a href="${item.href}" class="nav-item ${isActive || isPerformanceActive ? 'active' : ''}">
                <i class="ti ${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `;
    }).join('') + `
        <a href="turmas.html" class="nav-item" style="margin-top: 24px; color: var(--text-muted);">
            <i class="ti ti-arrow-left"></i>
            <span>Trocar de Turma</span>
        </a>
    `;
    nav.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    // Carrega o Banco de Dados no carregamento da p�gina
    loadDB();
    populateFaixaSelects();
    populatePesoSelects();
    renderActiveCoach();
    renderSidebar();

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
        updateThemeIcon();
    }

    // Initialize progress bars with a small delay for animation
    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach(fill => {
        const targetWidth = fill.style.width;
        fill.style.width = '0'; // start at 0

        setTimeout(() => {
            fill.style.width = targetWidth; // animate to target
        }, 300);
    });
});

/* GLOBAL IMAGE CROPPER LOGIC */
let globalCropperInstance = null;
let globalCropperCallback = null;

function renderGlobalCropperModal() {
    if (document.getElementById('modalGlobalCropper')) return;

    const modalHTML = `
        <div class="modal-overlay" id="modalGlobalCropper" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="modal-title">Ajustar Foto</h2>
                    <button class="btn-close" onclick="closeGlobalCropper()"><i class="ti ti-x"></i></button>
                </div>
                <div style="width: 100%; height: 300px; display: flex; justify-content: center; align-itemês: center; background: #000; overflow: hidden; margin-bottom: 16px;">
                    <img id="imageToCrop" src="" style="max-width: 100%; max-height: 100%; display: block;">
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);" onclick="closeGlobalCropper()">Cancelar</button>
                    <button class="btn btn-primary" onclick="confirmGlobalCrop()">Cortar e Salvar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openGlobalCropper(file, callback) {
    if (!file) return;

    // Certifique-se de que a UI existe no DOM
    renderGlobalCropperModal();

    globalCropperCallback = callback;
    const modal = document.getElementById('modalGlobalCropper');
    const imagePreview = document.getElementById('imageToCrop');

    // L�o arquivo como URL
    const reader = new FileReader();
    reader.onload = function (e) {
        imagePreview.src = e.target.result;

        modal.classList.add('active');

        // Destruir inst�ncia anterior se existir
        if (globalCropperInstance) {
            globalCropperInstance.destroy();
        }

        // Timeout para garantir que a imagem renderizou no modal antes do Cropper agir
        setTimeout(() => {
            globalCropperInstance = new Cropper(imagePreview, {
                aspectRatio: 1 / 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.8,
                restãore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        }, 100);
    };
    reader.readAsDataURL(file);
}

function closeGlobalCropper() {
    const modal = document.getElementById('modalGlobalCropper');
    if (modal) {
        modal.classList.remove('active');
    }
    if (globalCropperInstance) {
        globalCropperInstance.destroy();
        globalCropperInstance = null;
    }
    const imagePreview = document.getElementById('imageToCrop');
    if (imagePreview) {
        imagePreview.src = '';
    }
}

function confirmGlobalCrop() {
    if (!globalCropperInstance) return;

    const canvas = globalCropperInstance.getCroppedCanvas({
        width: 300,
        height: 300,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);

    if (globalCropperCallback) {
        globalCropperCallback(croppedBase64);
    }

    closeGlobalCropper();
}

/**
 * Abre um modal detalhado com as informações de um scout salvo.
 * @param {number} scoutId - ID do scout no db.lutasScout
 */
function openScoutDetail(scoutId) {
    const scout = db.lutasScout.find(s => s.id === parseInt(scoutId));
    if (!scout) {
        showToast("Scout n�o encontrado!", "error");
        return;
    }

    const atleta = scout.atletaId === 'adversario' ? { nome: 'Advers�rio', avatar: 'https://cdn-icons-png.flaticon.com/512/1177/1177568.png' } : db.alunos.find(a => a.id === scout.atletaId);

    // Fallback para atleta n�o encontrado
    const nomeAtleta = atleta ? atleta.nome : "Atleta Removido";
    const avatarAtleta = atleta ? (atleta.avatar || 'https://i.pravatar.cc/150') : 'https://i.pravatar.cc/150';

    let modal = document.getElementById('modalScoutDetail');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modalScoutDetail';
        document.body.appendChild(modal);
    }

    const dataObj = new Date(scout.dataRegistro);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Sum�rio de Rounds
    let roundsHtml = '';
    if (scout.rounds && scout.rounds.length > 0) {
        roundsHtml = `
            <div style="display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
                ${scout.rounds.map(r => `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center; min-width: 100px;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Round ${r.round}</div>
                        <div style="font-weight: 700; color: ${r.result === 'vitoria' ? 'var(--green)' : r.result === 'derrota' ? 'var(--red)' : 'var(--yellow)'}">${r.result.toUpperCase()}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Timeline das Ações
    let timelineHtml = '';
    const acoes = scout.acoes || [];
    if (acoes.length === 0) {
        timelineHtml = '<p style="color: var(--text-muted); text-align: center;">Nenhuma a��o registrada nesta luta.</p>';
    } else {
        timelineHtml = acoes.map(ev => {
            if (ev.isDivider) {
                return `
                    <div style="margin: 20px 0; padding: 8px; background: rgba(59, 130, 246, 0.1); border: 1px dashed rgba(59, 130, 246, 0.3); border-radius: 6px; text-align: center; color: var(--primary); font-size: 12px; font-weight: 600;">
                        Fim do Round ${ev.round} - ${ev.result.toUpperCase()}
                    </div>
                `;
            }

            let detailsArr = [];
            if (ev.tecnica) detailsArr.push(ev.tecnica + (ev.obsTecnica ? ` (${ev.obsTecnica})` : ''));
            if (ev.alvo) detailsArr.push(ev.alvo + (ev.subAlvo ? ` (${ev.subAlvo})` : ''));
            if (ev.perna) detailsArr.push(ev.perna);
            if (ev.base) detailsArr.push(`Base ${ev.base}`);
            if (ev.local) detailsArr.push(ev.local + (ev.subLocal ? ` (${ev.subLocal})` : ''));

            const resStr = ev.resultado ? ` - <span style="color: ${ev.resultado === 'Com ponto' ? 'var(--green)' : 'var(--text-muted)'}; font-weight: 600;">${ev.resultado}</span>` : '';

            return `
                <div style="display: flex; gap: 16px; margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; align-itemês: flex-start;">
                    <div style="background: var(--bg-hover); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; font-weight: 700;">${ev.formattedTime}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px;">${ev.acao || 'A��o'} ${resStr}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${detailsArr.join(' �')}</div>
                    </div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">R${ev.round}</div>
                </div>
            `;
        }).join('');
    }

    // --- COMPUTAÇÃO DAS ESTATÍSTICAS ---
    const acoesFiltradas = acoes.filter(a => !a.isDivider);

    let pernaCount = { 'Direita': 0, 'Esquerda': 0 };
    let baseCount = { 'Aberta': 0, 'Fechada': 0 };
    let tecnicaCount = {};
    let faltasCount = {};
    let faltasFeitasTotal = 0;

    acoesFiltradas.forEach(ev => {
        if (ev.acao === 'Ataque Feito') {
            if (ev.perna) pernaCount[ev.perna] = (pernaCount[ev.perna] || 0) + 1;
            if (ev.base) baseCount[ev.base] = (baseCount[ev.base] || 0) + 1;
            if (ev.tecnica) tecnicaCount[ev.tecnica] = (tecnicaCount[ev.tecnica] || 0) + 1;
        }
        if (ev.acao === 'Falta Feita') {
            faltasFeitasTotal++;
            const descFalta = ev.obsTecnica ? ev.obsTecnica.trim() : 'Falta (sem desc.)';
            faltasCount[descFalta] = (faltasCount[descFalta] || 0) + 1;
        }
    });

    const totalPernas = pernaCount['Direita'] + pernaCount['Esquerda'];
    const pDireita = totalPernas > 0 ? Math.round((pernaCount['Direita'] / totalPernas) * 100) : 0;
    const pEsquerda = totalPernas > 0 ? Math.round((pernaCount['Esquerda'] / totalPernas) * 100) : 0;
    const pernaPredominanteHtml = totalPernas === 0 ? 'N/A' : (pDireita >= pEsquerda ? `Direita (${pDireita}%)` : `Esquerda (${pEsquerda}%)`);

    const totalBases = baseCount['Aberta'] + baseCount['Fechada'];
    const pAberta = totalBases > 0 ? Math.round((baseCount['Aberta'] / totalBases) * 100) : 0;
    const pFechada = totalBases > 0 ? Math.round((baseCount['Fechada'] / totalBases) * 100) : 0;
    const basePredominanteHtml = totalBases === 0 ? 'N/A' : (pAberta >= pFechada ? `Aberta (${pAberta}%)` : `Fechada (${pFechada}%)`);

    const topTecnicas = Object.entries(tecnicaCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const totalAtaques = Object.values(tecnicaCount).reduce((a, b) => a + b, 0);
    let tecnicasHtml = topTecnicas.length > 0 ? topTecnicas.map(t => {
        const pct = Math.round((t[1] / totalAtaques) * 100);
        return `<div style="font-size: 13px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t[0]}">�${t[0]}: ${pct}%</div>`;
    }).join('') : '<div style="font-size: 13px; color: var(--text-muted);">Nenhuma</div>';

    let topFaltaHtml = '<div style="font-size: 13px; color: var(--text-muted);">Nenhuma</div>';
    if (faltasFeitasTotal > 0) {
        const topFalta = Object.entries(faltasCount).sort((a, b) => b[1] - a[1])[0];
        const pFalta = Math.round((topFalta[1] / faltasFeitasTotal) * 100);
        topFaltaHtml = `<div style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${topFalta[0]}">${topFalta[0]}: ${pFalta}%</div>`;
    }

    const analyticsCardsHtml = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 24px;">
            <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Perna Predom.</div>
                <div style="font-weight: 700; font-size: 14px;">${pernaPredominanteHtml}</div>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Base Predom.</div>
                <div style="font-weight: 700; font-size: 14px;">${basePredominanteHtml}</div>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Top T�cnicas</div>
                <div>${tecnicasHtml}</div>
            </div>
            <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Top Falta Com.</div>
                <div style="font-weight: 700;">${topFaltaHtml}</div>
            </div>
        </div>
    `;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; width: 90%; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0;">
                <div>
                    <h2 class="modal-title">Detalhes do Scout</h2>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 0;">${dataFormatada}</p>
                </div>
                <button class="btn-close" onclick="document.getElementById('modalScoutDetail').classList.remove('active')"><i class="ti ti-x"></i></button>
            </div>
            
            <div style="overflow-y: auto; padding: 24px; flex: 1;">
                <!-- Header Atleta/Evento -->
                <div style="display: flex; align-itemês: center; gap: 16px; margin-bottom: 24px; padding: 16px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: var(--radius-lg);">
                    ${scout.atletaId === 'adversario' || (typeof scout.atletaId === 'string' && scout.atletaId.startsWith('Advers�rio')) ? '' : `<img src="${avatarAtleta}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">`}
                    <div>
                        <div style="font-size: 18px; font-weight: 700;">${nomeAtleta}</div>
                        <div style="color: var(--text-muted); font-size: 14px;">${scout.evento}</div>
                    </div>
                    <div style="margin-left: auto; text-align: right;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Resultado Final</div>
                        <div style="font-size: 20px; font-weight: 800; color: ${scout.resultadoLuta === 'vitoria' ? 'var(--green)' : scout.resultadoLuta === 'derrota' ? 'var(--red)' : 'var(--text-muted)'}">
                            ${(scout.resultadoLuta || '---').toUpperCase()}
                        </div>
                    </div>
                </div>

                ${roundsHtml}
                
                ${analyticsCardsHtml}

                <div style="display: grid; grid-template-columns: 1fr 300px; gap: 24px;">
                    <div>
                        <h3 style="font-size: 16px; margin-bottom: 16px; display: flex; align-itemês: center; gap: 8px;">
                            <i class="ti ti-history" style="color: var(--primary);"></i> Timeline de Eventos
                        </h3>
                        <div style="margin-bottom: 24px;">
                            ${timelineHtml}
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); height: fit-content;">
                        <h3 style="font-size: 14px; margin-bottom: 16px; display: flex; align-itemês: center; gap: 8px; justify-content: center;">
                            <i class="ti ti-star" style="color: var(--yellow);"></i> Avaliação T�cnica
                        </h3>
                        <div style="height: 250px; width: 100%; position: relative;">
                            <canvas id="scoutRadarChart"></canvas>
                        </div>
                        <div id="noAssessmentMêsg" style="display: none; text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">
                            Nenhuma avalia��o registrada para este scout.
                        </div>
                    </div>
                </div>
            </div>

            <div style="padding: 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0;">
                <button class="btn" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-main);" onclick="downloadScoutPDF(${scout.id})">
                    <i class="ti ti-download"></i> Baixar PDF
                </button>
                <button class="btn btn-primary" onclick="document.getElementById('modalScoutDetail').classList.remove('active')">Fechar Detalhes</button>
            </div>
        </div>
    `;


    modal.classList.add('active');

    // Inicializar Radar Chart do Scout
    const radarCtx = document.getElementById('scoutRadarChart');
    if (radarCtx && typeof Chart !== 'undefined') {
        const ctx = radarCtx.getContext('2d');
        if (scout.avaliacaoTreinador) {
            const av = scout.avaliacaoTreinador;
            const dataArr = [
                (av.velocidade || 0) * 10,
                (av.forca || 0) * 10,
                (av.tatica || 0) * 10,
                (av.defesa || 0) * 10,
                (av.variacao || 0) * 10,
                (av.precisao || 0) * 10,
                (av.obediencia || 0) * 10
            ];

            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Velocidade', 'Força', 'T�tica', 'Defesa', 'Varia��o', 'Precis�o', 'Obedi�ncia'],
                    datasets: [{
                        label: 'Desempenho nesta Luta',
                        data: dataArr,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false, stepSize: 20 },
                            angleLines: { color: 'rgba(255,255,255,0.05)' },
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            pointLabels: { color: '#94a3b8', font: { size: 9 } }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.label + ': ' + (context.raw / 10).toFixed(1);
                                }
                            }
                        }
                    }
                }
            });
        } else {
            radarCtx.style.display = 'none';
            document.getElementById('noAssessmentMêsg').style.display = 'block';
        }
    }
}

/**
 * Exclui um scout permanentemente.
 * @param {number} scoutId 
 * @param {function} callback - Fun��o para Atualiza\u00e7\u00e3or a UI ap�s exclus�o
 */
function deleteScout(scoutId, callback) {
    if (!confirm("Tem certeza que deseja excluir esta an�lise de scout permanentemente?")) return;

    const index = db.lutasScout.findIndex(s => s.id === scoutId);
    if (index !== -1) {
        db.lutasScout.splice(index, 1);
        saveDB();
        showToast("Scout exclu�do com sucesso!", "success");
        if (callback) callback();
    }
}

/**
 * Redireciona para a tela de scout carregando os dados para edi��o.
 * @param {number} scoutId 
 */
function editScout(scoutId) {
    // Redireciona para a p�gina de scout com o ID na URL
    window.location.href = `scout-video.html?edit=${scoutId}`;
}

/**
 * Gera e baixa um PDF de alto n�vel com an�lise granular (Ofensiva vs Defensiva) e agrupamento por rounds.
 * @param {number} scoutId 
 */
/**
 * Gera e baixa um PDF de alto n�vel com an�lise granular e matriz anal�tica (T�cnica + Perna + Base).
 * @param {number} scoutId 
 */
async function downloadScoutPDF(scoutId) {
    const scout = db.lutasScout.find(s => s.id === scoutId);
    if (!scout) return;

    const atleta = scout.atletaId === 'adversario' ? { nome: 'Advers�rio' } : db.alunos.find(a => a.id === scout.atletaId);
    const nomeAtleta = atleta ? atleta.nome : "Atleta Removido";
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const dataObj = new Date(scout.dataRegistro);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // --- ESTRUTURA DE AGREGREGAÇÃO ---
    const factory = () => ({
        total: 0, pontos: 0,
        matriz: {},
        alvos: { 'Colete': 0, 'Capacete': 0 },
        subAlvos: {}, // { 'Colete': { 'Peito': 0... }, 'Capacete': { 'Face': 0... } }
        locais: { 'Meio': 0, 'Não Canto': 0 },
        subLocais: { 'Pressionando': 0, 'Pressionado': 0 },
        pernas: { 'Direita': 0, 'Esquerda': 0 },
        subPernas: { 'Direita': { 'Frente': 0, 'Tr�s': 0 }, 'Esquerda': { 'Frente': 0, 'Tr�s': 0 } },
        bases: { 'Aberta': 0, 'Fechada': 0 }
    });

    const ofensiva = factory();
    const defensiva = factory();
    let faltasFeitas = 0, faltasSofridas = 0;

    const acoesTotal = (scout.acoes || []);
    const acoesFiltradas = acoesTotal.filter(a => !a.isDivider);

    acoesFiltradas.forEach(ev => {
        const isOfp = ev.acao === 'Ataque Feito';
        const isDef = ev.acao === 'Ataque Sofrido';
        const tgt = isOfp ? ofensiva : (isDef ? defensiva : null);

        if (!tgt) {
            if (ev.acao === 'Falta Feita') faltasFeitas++;
            if (ev.acao === 'Falta Sofrida') faltasSofridas++;
            return;
        }

        tgt.total++;
        if (ev.resultado === 'Com ponto') tgt.pontos++;

        if (ev.tecnica) {
            // Matriz anal�tica para ofensiva usa Perna e Base. Para defensiva, apenas t�cnica/resultado.
            const key = isOfp
                ? `${ev.tecnica} | ${ev.perna || '?'} | ${ev.base || '?'}`
                : ev.tecnica;

            if (!tgt.matriz[key]) tgt.matriz[key] = { uso: 0, acerto: 0 };
            tgt.matriz[key].uso++;
            if (ev.resultado === 'Com ponto') tgt.matriz[key].acerto++;
        }

        if (ev.alvo && ev.resultado === 'Com ponto') {
            tgt.alvos[ev.alvo]++;
            if (ev.subAlvo) {
                if (!tgt.subAlvos[ev.alvo]) tgt.subAlvos[ev.alvo] = {};
                tgt.subAlvos[ev.alvo][ev.subAlvo] = (tgt.subAlvos[ev.alvo][ev.subAlvo] || 0) + 1;
            }
        }
        if (ev.local) {
            tgt.locais[ev.local]++;
            if (ev.local === 'Não Canto' && ev.subLocal) {
                tgt.subLocais[ev.subLocal]++;
            }
        }
        if (ev.perna) {
            tgt.pernas[ev.perna]++;
            if (ev.subPerna) {
                tgt.subPernas[ev.perna][ev.subPerna]++;
            }
        }
        if (ev.base) tgt.bases[ev.base]++;
    });

    // --- PDF Helper: Se��o Título (Compacta) ---
    const drawSectionHeader = (title, y) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 6, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(title.toUpperCase(), 20, y + 4.5);
        return y + 10;
    };

    // --- Header (Compacto: 35mm) ---
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text("ANÁLISE DE PERFORMANCE - SCOUT", 15, 15);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`ATLETA: ${nomeAtleta.toUpperCase()}`, 15, 25);
    doc.text(`EVENTO: ${(scout.evento || 'N/A').toUpperCase()}`, 15, 30);
    doc.text(`DATA: ${dataFormatada}`, 145, 25);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(`SCORE: ${ofensiva.pontos} x ${defensiva.pontos}`, 145, 31);

    let yPos = 45;

    const calcPct = (val, total) => total > 0 ? ` (${Math.round((val / total) * 100)}%)` : ' (0%)';

    // --- RESUMO GERAL (2 Colunas) ---
    doc.setFillColor(241, 245, 249);
    doc.rect(15, yPos, 85, 6, 'F');
    doc.rect(110, yPos, 85, 6, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text("AÇÕES OFENSIVAS (FEITAS)", 20, yPos + 4.5);
    doc.text("AÇÕES DEFENSIVAS (SOFRIDAS)", 115, yPos + 4.5);
    yPos += 10;

    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const ofpEfic = ofensiva.total > 0 ? ((ofensiva.pontos / ofensiva.total) * 100).toFixed(1) : 0;
    const defEfic = defensiva.total > 0 ? ((defensiva.pontos / defensiva.total) * 100).toFixed(1) : 0;

    doc.text(`Ataques Efetuados: ${ofensiva.total}`, 15, yPos);
    doc.text(`Pontos Marcados: ${ofensiva.pontos}`, 15, yPos + 4.5);
    doc.text(`Efici�ncia: ${ofpEfic}%`, 15, yPos + 9);
    doc.text(`Faltas Cometidas: ${faltasFeitas}`, 15, yPos + 13.5);

    doc.text(`Ataques Recebidos: ${defensiva.total}`, 110, yPos);
    doc.text(`Pontos Sofridos: ${defensiva.pontos}`, 110, yPos + 4.5);
    doc.text(`Efici�ncia da Defesa: ${defEfic}%`, 110, yPos + 9);
    doc.text(`Faltas Sofridas: ${faltasSofridas}`, 110, yPos + 13.5);

    yPos += 20;

    // --- T�CNICAS (Top 6) ---
    doc.setFillColor(239, 246, 255);
    doc.rect(15, yPos, 85, 5, 'F');
    doc.rect(110, yPos, 85, 5, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text("TOP T�CNICAS APLICADAS", 20, yPos + 3.5);
    doc.text("TOP T�CNICAS RECEBIDAS", 115, yPos + 3.5);
    yPos += 7;

    doc.setFontSize(7); doc.setTextColor(71, 85, 105);
    doc.text("T�CNICA", 15, yPos); doc.text("USO", 75, yPos); doc.text("PT(%)", 90, yPos);
    doc.text("T�CNICA", 110, yPos); doc.text("USO", 170, yPos); doc.text("PT(%)", 185, yPos);
    yPos += 4;

    doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'normal');

    const agruparTecnicas = (matriz) => {
        const agrp = {};
        Object.entries(matriz).forEach(([k, v]) => {
            const nomeStr = k.split(' | ')[0]; // Limpar detalhe de perna/base
            const nome = nomeStr ? nomeStr.trim() : 'N/A';
            if (!agrp[nome]) agrp[nome] = { uso: 0, acerto: 0 };
            agrp[nome].uso += v.uso;
            agrp[nome].acerto += v.acerto;
        });
        return Object.entries(agrp).sort((a, b) => b[1].uso - a[1].uso).slice(0, 6);
    };

    const topOfp = agruparTecnicas(ofensiva.matriz);
    const topDef = agruparTecnicas(defensiva.matriz);

    for (let i = 0; i < Math.max(topOfp.length, topDef.length); i++) {
        const ofp = topOfp[i];
        const def = topDef[i];

        if (ofp) {
            doc.text(ofp[0], 15, yPos);
            doc.text(`${ofp[1].uso}${calcPct(ofp[1].uso, ofensiva.total)}`, 75, yPos);
            doc.text(`${ofp[1].acerto}${calcPct(ofp[1].acerto, ofp[1].uso)}`, 90, yPos);
        }
        if (def) {
            doc.text(def[0], 110, yPos);
            doc.text(`${def[1].uso}${calcPct(def[1].uso, defensiva.total)}`, 170, yPos);
            doc.text(`${def[1].acerto}${calcPct(def[1].acerto, def[1].uso)}`, 185, yPos);
        }
        yPos += 4.5;
    }
    if (topOfp.length === 0 && topDef.length === 0) {
        doc.text("Sem registros.", 15, yPos);
        doc.text("Sem registros.", 110, yPos);
        yPos += 4.5;
    }
    yPos += 6;

    // --- INDICADORES (Alvos, Pernas, Base, Local) ---
    const printIndicatorGroup = (title, key, objOfp, objDef, subKey = null) => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }

        doc.setFillColor(241, 245, 249);
        doc.rect(15, yPos, 180, 5, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
        doc.text(title.toUpperCase(), 20, yPos + 3.5);
        yPos += 7;

        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');

        const totalOfp = Object.values(objOfp[key]).reduce((a, b) => a + b, 0);
        const totalDef = Object.values(objDef[key]).reduce((a, b) => a + b, 0);

        Object.keys(objOfp[key]).forEach((k) => {
            if (yPos > 275) { doc.addPage(); yPos = 20; }

            const vOfp = objOfp[key][k] || 0;
            const vDef = objDef[key][k] || 0;

            let subOfpStr = '', subDefStr = '';
            if (subKey && objOfp[subKey] && objOfp[subKey][k]) {
                const parts = Object.entries(objOfp[subKey][k]).filter(([_, v]) => v > 0).map(([sk, sv]) => `${sk}: ${sv}${calcPct(sv, vOfp)}`);
                if (parts.length) subOfpStr = `\n    └ ${parts.join(' | ')}`;
            }
            if (subKey && objDef[subKey] && objDef[subKey][k]) {
                const parts = Object.entries(objDef[subKey][k]).filter(([_, v]) => v > 0).map(([sk, sv]) => `${sk}: ${sv}${calcPct(sv, vDef)}`);
                if (parts.length) subDefStr = `\n    └ ${parts.join(' | ')}`;
            }

            const splitOfp = doc.splitTextToSize(`${k}: ${vOfp}${calcPct(vOfp, totalOfp)}${subOfpStr}`, 85);
            const splitDef = doc.splitTextToSize(`${k}: ${vDef}${calcPct(vDef, totalDef)}${subDefStr}`, 85);

            doc.text(splitOfp, 15, yPos);
            doc.text(splitDef, 110, yPos);

            yPos += Math.max(splitOfp.length, splitDef.length) * 4 + 1;
        });
        yPos += 3;
    };

    printIndicatorGroup("Alvos Alcançados / Sofridos (Apenas Ações c/ Ponto)", 'alvos', ofensiva, defensiva, 'subAlvos');
    printIndicatorGroup("Localiza��o da Quadra (Tentativas)", 'locais', ofensiva, defensiva, 'subLocais');
    printIndicatorGroup("Uso de Pernas (Tentativas)", 'pernas', ofensiva, defensiva, 'subPernas');
    printIndicatorGroup("Posicionamento de Base (Tentativas)", 'bases', ofensiva, defensiva);


    // --- TIMELINE AGRUPADA POR ROUND ---
    if (yPos > 220) { doc.addPage(); yPos = 20; } else { yPos += 10; }
    yPos = drawSectionHeader("Timeline Detalhada por Round", yPos);

    const rounds = {};
    (scout.acoes || []).forEach(a => {
        const r = a.round || 1;
        if (!rounds[r]) rounds[r] = [];
        rounds[r].push(a);
    });

    Object.keys(rounds).sort((a, b) => a - b).forEach(rKey => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }

        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setFillColor(239, 246, 255); doc.rect(15, yPos, 180, 6, 'F');
        doc.setTextColor(59, 130, 246);
        doc.text(`ROUND ${rKey}`, 105, yPos + 4.5, { align: 'center' });
        yPos += 10;
        doc.setTextColor(30, 41, 59);

        rounds[rKey].forEach(ev => {
            if (ev.isDivider) return;
            if (yPos > 275) { doc.addPage(); yPos = 20; }

            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
            doc.text(ev.formattedTime, 15, yPos);

            doc.setFontSize(8);
            const resBadge = ev.resultado === 'Com ponto' ? ' [PONTO]' : '';
            doc.text(`${ev.acao}: ${ev.tecnica || ''}${resBadge}`, 30, yPos);

            let sub = [];
            if (ev.alvo) sub.push(ev.alvo + (ev.subAlvo ? ` (${ev.subAlvo})` : ''));
            if (ev.perna) sub.push(ev.perna + (ev.subPerna ? ` (${ev.subPerna})` : ''));
            if (ev.base) sub.push(`Base ${ev.base}`);
            if (ev.local) sub.push(ev.local + (ev.subLocal ? ` (${ev.subLocal})` : ''));

            doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
            doc.text(sub.join(' �'), 30, yPos + 3.5);

            yPos += 8;
            doc.setTextColor(30);
        });
        yPos += 4;
    });

    // --- RADAR Chart (Agora ap�s a Timeline) ---
    if (scout.avaliacaoTreinador) {
        if (yPos > 200) { doc.addPage(); yPos = 20; } else { yPos += 10; }
        yPos = drawSectionHeader("Avaliação T�cnica (Radar)", yPos);
        const canvas = document.getElementById('scoutRadarChart');
        if (canvas) {
            const chartImg = canvas.toDataURL('image/png');
            // Tamanho reduzido para caber melhor: 80x80
            doc.addImage(chartImg, 'PNG', 65, yPos, 80, 80);
            yPos += 85;
        }
    }

    doc.save(`Analise_Scout_${nomeAtleta.replace(/\s+/g, '_')}_ID${scout.id}.pdf`);
}


