/* STATE MANAGEMENT GLOBALS (LocalStorage) */

// Avatar padrão — silhueta neutra, sem foto aleatória de terceiros
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='36' r='17' fill='%2364748b'/%3E%3Cellipse cx='50' cy='84' rx='28' ry='20' fill='%2364748b'/%3E%3C/svg%3E";

const MOCK_DATA = {
    turmas: [],
    alunos: [],
    planos: [],
    horarios: [],
    categoriasPeso: [
        // --- Cadete Masculino (12-14 anos) ---
        'Cad M -33kg', 'Cad M -37kg', 'Cad M -41kg', 'Cad M -45kg', 'Cad M -49kg',
        'Cad M -53kg', 'Cad M -57kg', 'Cad M -61kg', 'Cad M -65kg', 'Cad M +65kg',
        // --- Cadete Feminino (12-14 anos) ---
        'Cad F -29kg', 'Cad F -33kg', 'Cad F -37kg', 'Cad F -41kg', 'Cad F -44kg',
        'Cad F -47kg', 'Cad F -51kg', 'Cad F -55kg', 'Cad F -59kg', 'Cad F +59kg',
        // --- Juvenil Masculino (15-17 anos) ---
        'Juv M -45kg', 'Juv M -48kg', 'Juv M -51kg', 'Juv M -55kg', 'Juv M -59kg',
        'Juv M -63kg', 'Juv M -68kg', 'Juv M -73kg', 'Juv M -78kg', 'Juv M +78kg',
        // --- Juvenil Feminino (15-17 anos) ---
        'Juv F -42kg', 'Juv F -44kg', 'Juv F -46kg', 'Juv F -49kg', 'Juv F -52kg',
        'Juv F -55kg', 'Juv F -59kg', 'Juv F -63kg', 'Juv F -68kg', 'Juv F +68kg',
        // --- Sub-21 Masculino ---
        'S21 M -54kg', 'S21 M -58kg', 'S21 M -63kg', 'S21 M -68kg',
        'S21 M -74kg', 'S21 M -80kg', 'S21 M -87kg', 'S21 M +87kg',
        // --- Sub-21 Feminino ---
        'S21 F -46kg', 'S21 F -49kg', 'S21 F -53kg', 'S21 F -57kg',
        'S21 F -62kg', 'S21 F -67kg', 'S21 F -73kg', 'S21 F +73kg',
        // --- Adulto/Sênior Masculino ---
        'Sên M -54kg', 'Sên M -58kg', 'Sên M -63kg', 'Sên M -68kg',
        'Sên M -74kg', 'Sên M -80kg', 'Sên M -87kg', 'Sên M +87kg',
        // --- Adulto/Sênior Feminino ---
        'Sên F -46kg', 'Sên F -49kg', 'Sên F -53kg', 'Sên F -57kg',
        'Sên F -62kg', 'Sên F -67kg', 'Sên F -73kg', 'Sên F +73kg',
        // --- Master Masculino ---
        'Mst M -54kg', 'Mst M -58kg', 'Mst M -63kg', 'Mst M -68kg',
        'Mst M -74kg', 'Mst M -80kg', 'Mst M -87kg', 'Mst M +87kg',
        // --- Master Feminino ---
        'Mst F -46kg', 'Mst F -49kg', 'Mst F -53kg', 'Mst F -57kg',
        'Mst F -62kg', 'Mst F -67kg', 'Mst F -73kg', 'Mst F +73kg'
    ],
    faixas: [
        '10° GUB (Branca)',
        '9° GUB (Cinza)',
        '8° GUB (Amarela)',
        '7° GUB (Laranja)',
        '6° GUB (Verde claro)',
        '5° GUB (Verde escuro)',
        '4° GUB (Azul claro)',
        '3° GUB (Azul escuro)',
        '2° GUB (Vermelho claro)',
        '1° GUB (Vermelho escuro)',
        '1º DAN (Preta)',
        '2º DAN (Preta)',
        '3º DAN (Preta)',
        '4º DAN (Preta)',
        '5º DAN (Preta)',
        '6º DAN (Preta)',
        '7º DAN (Preta)',
        '8º DAN (Preta)',
        '9º DAN (Preta)'
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


// Data "hoje" no fuso de Brasília (UTC-3). Evita que às 21h+ apareça o dia seguinte.
function todayBR() {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function toDateStrBR(date) {
    const d = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Resolve device mode: telas pequenas sempre forçam o modo certo;
// preferência manual só vale em desktop (>1024px)
function resolveDeviceMode() {
    const w = window.innerWidth || document.documentElement.clientWidth;
    if (w <= 768)  return 'mobile';   // celular: sempre mobile
    if (w <= 1024) return 'tablet';   // tablet: sempre tablet
    return localStorage.getItem('tkd_device_mode') || 'desktop';
}

// XSS-safe HTML escaping — use on any user-supplied string inside innerHTML
// Remove acentos e caracteres especiais para uso em PDFs com fontes helvetica/courier
// (jsPDF built-in fonts só suportam ASCII; sem essa normalização surgem "?" e caixas)
function pdfStr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .normalize('NFD')                    // decompõe: "ã" → "a" + combining ~
        .replace(/[\u0300-\u036f]/g, '')     // remove diacríticos (acentos, til, cedilha-base)
        .replace(/ç/gi, 'c')                 // ç não é decomposto pelo NFD — tratar à mão
        .replace(/Ç/g, 'C')
        .replace(/[^\x00-\x7F]/g, '?');      // qualquer outro não-ASCII vira ?
}

// Aplica pdfStr em todos os doc.text() e splitTextToSize de um objeto jsPDF
// Chame logo após: const doc = new jsPDF(); patchDocText(doc);
function patchDocText(doc) {
    const origText = doc.text.bind(doc);
    const origSplit = doc.splitTextToSize.bind(doc);

    doc.text = function(text, x, y, options, transform) {
        if (Array.isArray(text)) {
            text = text.map(t => pdfStr(t));
        } else {
            text = pdfStr(text);
        }
        return origText(text, x, y, options, transform);
    };

    doc.splitTextToSize = function(text, maxWidth, options) {
        return origSplit(pdfStr(text), maxWidth, options);
    };

    return doc;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// coachId cacheado assim que o auth responde (evita async dentro do click)
window._cachedCoachId = db._owner_id || '';

// Copia texto para área de transferência com fallback para execCommand (síncrono)
function _execCommandCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
}

// Gera e copia o link de acesso do atleta — SÍNCRONO dentro do click
function copiarLinkAtleta(id) {
    const coachId = window._cachedCoachId || db._owner_id || '';
    const url = `${window.location.origin}/atleta-login.html?atleta=${encodeURIComponent(id)}&coach=${encodeURIComponent(coachId)}`;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link copiado! Envie ao atleta pelo WhatsApp ou e-mail.');
        }).catch(() => {
            _execCommandCopy(url);
            showToast('Link copiado! Envie ao atleta pelo WhatsApp ou e-mail.');
        });
    } else {
        _execCommandCopy(url);
        showToast('Link copiado! Envie ao atleta pelo WhatsApp ou e-mail.');
    }
}

// Load Database from LocalStorage or initialize with MOCK_DATA
function loadDB() {
    // -- Device mode ------------------------------------------
    const deviceMode = resolveDeviceMode();
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
                'display:flex', 'align-items:center', 'justify-content:center',
                'cursor:pointer', 'transition:var(--transition)'
            ].join(';');
            const toggleSidebar = (forceClose) => {
                if (forceClose) {
                    sidebar.classList.remove('open');
                } else {
                    sidebar.classList.toggle('open');
                }
                const isOpen = sidebar.classList.contains('open');
                document.body.classList.toggle('sidebar-open', isOpen);
                const bd = document.getElementById('__sidebarBackdrop');
                if (bd) bd.style.display = isOpen ? 'block' : 'none';
            };
            btn.onclick = () => toggleSidebar();
            document.body.appendChild(btn);

            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.id = '__sidebarBackdrop';
            backdrop.style.cssText = [
                'position:fixed', 'inset:0', 'z-index:849',
                'background:rgba(0,0,0,0.5)', 'display:none'
            ].join(';');
            backdrop.onclick = () => toggleSidebar(true);
            document.body.appendChild(backdrop);

            // Close sidebar and adjust hamburger on orientation change
            window.addEventListener('orientationchange', () => {
                toggleSidebar(true);
                // Adjust hamburger top position for landscape (smaller top bar)
                const isLandscape = window.screen.orientation
                    ? window.screen.orientation.type.startsWith('landscape')
                    : window.matchMedia('(orientation: landscape)').matches;
                btn.style.top = isLandscape ? '8px' : '16px';
            });
            window.addEventListener('resize', () => {
                const isLandscape = window.innerWidth > window.innerHeight;
                btn.style.top = isLandscape ? '8px' : '16px';
            });
        }
    }
    // ---------------------------------------------------------

    const stored = localStorage.getItem('tkd_scout_db');
    let modified = false;
    if (stored) {
        db = JSON.parse(stored);
        if (!db.categoriasPeso) { db.categoriasPeso = [...(MOCK_DATA.categoriasPeso || [])]; modified = true; }
        if (!db.faixas) { db.faixas = [...MOCK_DATA.faixas]; modified = true; }

        // Migração: faixas desatualizadas — detecta se a lista nova não está presente
        if (!db.faixas || !db.faixas.includes('9° GUB (Cinza)')) {
            db.faixas = [...MOCK_DATA.faixas];
            modified = true;
        }

        // Migração: categorias de peso antigas (sem prefixo de divisão como 'Cad M')
        if (!db.categoriasPeso || !db.categoriasPeso[0] || !db.categoriasPeso[0].match(/^(Cad|Juv|S21|Sên|Mst)/)) {
            db.categoriasPeso = [...MOCK_DATA.categoriasPeso];
            modified = true;
        }
        if (!db.treinadores) { db.treinadores = [...MOCK_DATA.treinadores]; modified = true; }
        if (!db.wellnessLogs) { db.wellnessLogs = [...MOCK_DATA.wellnessLogs]; modified = true; }
        if (!db.questionarios) { db.questionarios = [...MOCK_DATA.questionarios]; modified = true; }
        if (!db.respostas) { db.respostas = []; modified = true; }
        if (!db.cargaTreino) { db.cargaTreino = [...MOCK_DATA.cargaTreino]; modified = true; }
        if (!db.competicoes) { db.competicoes = [...MOCK_DATA.competicoes]; modified = true; }
        if (!db.scoutEstatisticas) { db.scoutEstatisticas = [...MOCK_DATA.scoutEstatisticas]; modified = true; }
        if (!db.antropometria) { db.antropometria = []; modified = true; }
        if (!db.treinos) { db.treinos = []; modified = true; }
        if (!db.eventos) { db.eventos = [...(MOCK_DATA.eventos || [])]; modified = true; }
        if (!db.lutasScout) { db.lutasScout = []; modified = true; }
        if (!db.chamadas) { db.chamadas = []; modified = true; }
        if (!db.lesoes) { db.lesoes = [...(MOCK_DATA.lesoes || [])]; modified = true; }
        if (!db.periodizacao) { db.periodizacao = structuredClone(MOCK_DATA.periodizacao); modified = true; }

        if (modified) {
            // Save local changes, but we will sync with Supabase in a moment anyway
            localStorage.setItem('tkd_scout_db', JSON.stringify(db));
        }
    } else {
        db = structuredClone(MOCK_DATA); // Deep copy
        // Do NOT call saveDB() here — that would push empty data to Supabase
        // and destroy any cloud data the user has. Just cache locally.
        localStorage.setItem('tkd_scout_db', JSON.stringify(db));
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

let isFetchingSupabase = false;

function showSyncSpinner(visible) {
    let el = document.getElementById('syncSpinner');
    if (!el) {
        el = document.createElement('div');
        el.id = 'syncSpinner';
        el.textContent = 'Sincronizando...';
        document.body.appendChild(el);
    }
    el.classList.toggle('visible', visible);
}

function fetchFromSupabase() {
    if (!window.supabaseClient) return;
    if (isFetchingSupabase) return;

    isFetchingSupabase = true;
    showSyncSpinner(true);

    window.supabaseClient.auth.getUser().then(({ data: authData }) => {
        if (!authData || !authData.user) {
            // Sem auth (portal do atleta ou sessão expirada)
            isFetchingSupabase = false;
            showSyncSpinner(false);
            setupRealtimeSubscription();
            checkTrainerOnboarding();
            return;
        }
        const userId = authData.user.id;
        window._cachedCoachId = userId;

        // SEGURANÇA: se o cache local pertence a outro usuário, descartá-lo imediatamente
        // antes de qualquer outra operação para evitar vazamento de dados entre contas.
        if (db._owner_id && db._owner_id !== userId) {
            console.warn("Cache local pertence a outro usuário. Descartando para proteger isolamento de dados.");
            localStorage.removeItem('tkd_scout_db');
            db = JSON.parse(JSON.stringify(MOCK_DATA));
            db._owner_id = userId;
            window.db = db;
            lastSyncTime = 0;
        }

        window.supabaseClient
            .from('app_state')
            .select('data')
            .eq('project_id', userId)
            .single()
            .then(({ data, error }) => {
                if (error && error.code !== 'PGRST116') {
                    // Permissão negada ou outro erro de Supabase — continua com dados locais
                    console.error("Erro ao buscar Supabase (continuando com dados locais):", error.code, error.message);
                } else if (data && data.data) {
                    const remoteDate = data.data._last_updated || 1;
                    const localDate = lastSyncTime || 0;

                    const remoteHasValidTrainer = data.data.treinadores && data.data.treinadores.length > 0;

                    if (remoteDate > localDate || (!localDate && remoteHasValidTrainer)) {
                        const remoteDB = data.data;

                        const localHasTrainer = db.treinadores &&
                            db.treinadores.length > 0 &&
                            db.treinadores[0].nome &&
                            db.treinadores[0].nome.trim() !== '';
                        const remoteHasTrainer = remoteDB.treinadores &&
                            remoteDB.treinadores.length > 0 &&
                            remoteDB.treinadores[0].nome &&
                            remoteDB.treinadores[0].nome.trim() !== '';

                        // Só sobe dados locais se o cache pertence a este mesmo usuário
                        if (localHasTrainer && !remoteHasTrainer && db._owner_id === userId) {
                            console.log("Local trainer not in Supabase yet. Pushing local data up.");
                            syncToSupabase();
                        } else {
                            console.log("Supabase has newer data. Updating in-memory and re-rendering...");
                            // Garante que todos os arrays existam (dados antigos podem ter null)
                            const arrayKeys = ['turmas','alunos','planos','horarios','wellnessLogs',
                                'questionarios','respostas','cargaTreino','competicoes','treinos',
                                'eventos','lutasScout','presencas','chamadas','lesoes','scoutEstatisticas'];
                            arrayKeys.forEach(k => { if (!remoteDB[k]) remoteDB[k] = []; });
                            if (!remoteDB.periodizacao) remoteDB.periodizacao = JSON.parse(JSON.stringify(MOCK_DATA.periodizacao));
                            remoteDB._owner_id = userId; // Marca o dono no dado remoto ao cachear

                            // Migração: faixas desatualizadas
                            if (!remoteDB.faixas || !remoteDB.faixas.includes('9° GUB (Cinza)')) {
                                remoteDB.faixas = [...MOCK_DATA.faixas];
                            }

                            // Migração: categorias de peso antigas (sem prefixo de divisão)
                            if (!remoteDB.categoriasPeso || !remoteDB.categoriasPeso[0] ||
                                !remoteDB.categoriasPeso[0].match(/^(Cad|Juv|S21|Sên|Mst)/)) {
                                remoteDB.categoriasPeso = [...MOCK_DATA.categoriasPeso];
                            }

                            db = remoteDB;
                            window.db = db;
                            localStorage.setItem('tkd_scout_db', JSON.stringify(remoteDB));
                            lastSyncTime = remoteDate;
                        }
                    } else if (remoteDate === 0 && localDate > 0 && db._owner_id === userId) {
                        syncToSupabase();
                    }
                } else {
                    // Supabase sem dados para este usuário ainda (novo cadastro)
                    // NUNCA subir dados do cache se ele não pertence a este usuário
                    if (lastSyncTime > 0 && db._owner_id === userId) {
                        syncToSupabase();
                    } else if (!db._owner_id || db._owner_id !== userId) {
                        // Novo usuário sem dados: inicializa vazio e marca o dono
                        console.log("Novo usuário sem dados. Inicializando conta vazia.");
                        db = JSON.parse(JSON.stringify(MOCK_DATA));
                        db._owner_id = userId;
                        db._last_updated = 0;
                        window.db = db;
                        lastSyncTime = 0;
                        localStorage.setItem('tkd_scout_db', JSON.stringify(db));
                    }
                }

                // Sempre executa após tentativa de sync — independente de erro
                setupRealtimeSubscription();
                renderUserProfile();
                checkTrainerOnboarding();
                if (typeof window.onDataLoaded === 'function') {
                    window.onDataLoaded();
                }
            }).finally(() => {
                isFetchingSupabase = false;
                showSyncSpinner(false);
            });
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
    const page = window.location.pathname.toLowerCase();
    const skipList = ['index.html', 'atleta-', 'selecionar-treinador', 'turmas'];
    if (page === '/' || skipList.some(s => page.includes(s))) return;

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
    overlay.className = 'ob-overlay';

    overlay.innerHTML = `
        <div class="ob-card">
            <div class="ob-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 class="ob-title">Bem-vindo ao Pro Coach!</h2>
            <p class="ob-desc">Antes de começar, configure seu perfil de treinador. Isso personaliza todos os seus relatórios e dashboards.</p>
            <div class="ob-field">
                <label>Seu Nome Completo *</label>
                <input id="__ob_name" type="text" placeholder="Ex: Mestre Carlos Silva" class="ob-input">
            </div>
            <div class="ob-field ob-field-last">
                <label>Cargo / Função *</label>
                <input id="__ob_role" type="text" placeholder="Ex: Treinador Principal, Head Coach" class="ob-input">
            </div>
            <button id="__ob_btn" class="ob-btn" onclick="window.__saveOnboarding()">
                Começar a Usar &rarr;
            </button>
            <p id="__ob_err" class="ob-error">Por favor, preencha todos os campos.</p>
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

        // Notify any page-level render hooks (e.g. treinador-perfil.html)
        if (typeof window.onDataLoaded === 'function') window.onDataLoaded();

        // Show toast
        if (typeof showToast === 'function') showToast('Perfil configurado com sucesso!', 'success');
    };
}

function setupRealtimeSubscription() {
    if (window._supabaseSubscribed) return;
    if (!window.supabaseClient) return;

    window.supabaseClient.auth.getUser().then(({ data: authData }) => {
        // Funciona com Supabase Auth OU com o fluxo de localStorage (tkd_coach_id)
        let userId = authData?.user?.id
            || localStorage.getItem('tkd_coach_id')
            || sessionStorage.getItem('tkd_coach_id');

        if (!userId) {
            console.warn('setupRealtimeSubscription: ID do treinador não encontrado, realtime desativado.');
            return;
        }

        window._supabaseSubscribed = true;
        console.log('Realtime subscription ativa para project_id:', userId);

        window.supabaseClient
            .channel('public:app_state:' + userId)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'project_id=eq.' + userId }, payload => {
                const remoteData = payload.new.data;
                if (!remoteData) return;

                console.log('Realtime: dados recebidos do atleta!');
                window.db = remoteData;
                db = remoteData;
                lastSyncTime = remoteData._last_updated || Date.now();
                localStorage.setItem('tkd_scout_db', JSON.stringify(remoteData));

                showToast('Atleta atualizou dados!', 'info');

                // Re-renderiza qualquer função disponível na página atual
                if (typeof renderSemaforo === 'function') renderSemaforo();
                if (typeof renderAlunosUI === 'function') renderAlunosUI();
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof renderWellnessPanel === 'function') renderWellnessPanel();
                if (typeof buildAlerts === 'function') buildAlerts();
                if (typeof buildCargaDiaria === 'function') buildCargaDiaria();
                if (typeof window.onDataLoaded === 'function') window.onDataLoaded();
            })
            .subscribe((status) => {
                console.log('Realtime status:', status);
            });
    });
}

// Helper para mesclar o estado local com o remoto (evita perda de dados de atletas)
function mergeAppState(local, remote) {
    if (!remote) return local;
    const merged = { ...remote, ...local }; // Local prevalece em chaves simples

    // Chaves que são arrays e precisam de merge inteligente por ID
    const arrayKeys = [
        'turmas', 'alunos', 'planos', 'horarios', 'wellnessLogs', 'questionarios',
        'respostas', 'cargaTreino', 'competicoes', 'scoutEstatisticas', 'treinos',
        'eventos', 'lutasScout', 'presencas', 'chamadas', 'lesoes', 'antropometria',
        'testesFisicos'
    ];

    arrayKeys.forEach(key => {
        const localArr = local[key] || [];
        const remoteArr = remote[key] || [];

        // Criar um mapa do remoto para facilitar busca
        const remoteMap = new Map(remoteArr.map(item => [item.id, item]));

        // Adicionar itens locais que não estão no remoto ou são mais recentes
        localArr.forEach(localItem => {
            const remoteItem = remoteMap.get(localItem.id);
            if (!remoteItem || (localItem._updatedAt && localItem._updatedAt > (remoteItem._updatedAt || 0))) {
                remoteMap.set(localItem.id, localItem);
            }
        });

        merged[key] = Array.from(remoteMap.values());
    });

    return merged;
}

// Salva estado do banco no Local Storage e Sincroniza de forma segura (Fetch -> Merge -> Upsert)
let _saveDBTimer = null;
let _saveDBResolvers = [];
async function saveDB() {
    db._last_updated = Date.now();
    lastSyncTime = db._last_updated;
    // Garante que o _owner_id esteja presente antes de salvar localmente
    if (!db._owner_id) {
        try {
            const { data: authData } = await window.supabaseClient.auth.getUser();
            if (authData && authData.user) db._owner_id = authData.user.id;
        } catch (_) {}
    }
    localStorage.setItem('tkd_scout_db', JSON.stringify(window.db || db));

    // Debounce: agrupa múltiplas chamadas em 500ms numa única sync ao Supabase
    return new Promise((resolve) => {
        _saveDBResolvers.push(resolve);
        clearTimeout(_saveDBTimer);
        _saveDBTimer = setTimeout(async () => {
            const resolvers = _saveDBResolvers.splice(0);
            const result = await syncToSupabase();
            resolvers.forEach(r => r(result));
        }, 500);
    });
}

// Faz o UPSERT direto do estado local atual — sem merge no save
// (merge só acontece no carregamento da página, não no save)
async function syncToSupabase() {
    if (!window.supabaseClient) return;

    try {
        let userId = null;
        const { data: authData } = await window.supabaseClient.auth.getUser();

        if (authData && authData.user) {
            userId = authData.user.id;
        } else {
            userId = localStorage.getItem('tkd_coach_id') || sessionStorage.getItem('tkd_coach_id');
        }

        if (!userId) {
            console.warn("Sincronização abortada: ID do treinador não encontrado.");
            return;
        }

        // Bloqueia se o cache local pertence a outro usuário
        if (db._owner_id && db._owner_id !== userId) {
            console.warn("syncToSupabase bloqueado: cache pertence a outro usuário.");
            return;
        }

        // Faz um deep copy para não mutar o objeto em memória
        const dataToSave = JSON.parse(JSON.stringify(window.db || db));

        // Busca o estado remoto atual antes de salvar para preservar respostas dos atletas.
        // Sem isso, dados enviados pelo atleta enquanto o treinador está com a aba aberta
        // seriam sobrescritos no próximo saveDB() do treinador.
        const { data: remoteResult } = await window.supabaseClient
            .from('app_state')
            .select('data')
            .eq('project_id', userId)
            .single();

        if (remoteResult && remoteResult.data) {
            // Para arrays de resposta do atleta: mantém todas as entradas do remoto que
            // ainda não existem no cache local (entradas novas enviadas pelo atleta).
            const athleteArrays = ['wellnessLogs', 'cargaTreino', 'respostas'];
            athleteArrays.forEach(key => {
                const localEntries = dataToSave[key] || [];
                const remoteEntries = remoteResult.data[key] || [];
                const localIds = new Set(localEntries.map(e => e.id));
                const newFromAthletes = remoteEntries.filter(e => !localIds.has(e.id));
                if (newFromAthletes.length > 0) {
                    dataToSave[key] = localEntries.concat(newFromAthletes);
                    // Atualiza o cache em memória para que a sessão atual veja os dados novos
                    if (!db[key]) db[key] = [];
                    newFromAthletes.forEach(e => {
                        if (!db[key].find(x => x.id === e.id)) db[key].push(e);
                    });
                    window.db = db;
                    localStorage.setItem('tkd_scout_db', JSON.stringify(db));
                }
            });
        }

        dataToSave._last_updated = Date.now();

        const { error: upsertError } = await window.supabaseClient
            .from('app_state')
            .upsert({
                project_id: userId,
                data: dataToSave
            });

        if (upsertError) {
            console.error("Erro no Upsert Supabase:", upsertError);
            if (upsertError.code === '42501') {
                console.warn("Permissão negada no Supabase. Verifique as políticas RLS da tabela app_state.");
                if (typeof showToast === 'function') showToast('Erro de permissão ao salvar na nuvem. Dados salvos apenas localmente.', 'error');
            }
        } else {
            console.log("Sincronização concluída.");
        }

        return dataToSave;
    } catch (err) {
        console.error("Erro crítico na sincronização:", err);
    }
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

    toast.innerHTML = `<i class="ti ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    // Animar a entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Removera após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400); // tempo da transição css
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
    // Simplificado para UI. Num app real, subtrai 1 se mês/dia ainda não passou
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

    // Suporte para IDs tradicionais ou arrays name (usados nos formul?rios din?micos de Qs)
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

// Converter ranges est?ticos em bot?es
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

        input.replaceWith(...wrapper.childNodes);
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
                    <input type="text" id="novaFaixaInput" class="form-control" placeholder="Nova cor...">
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
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-hover); border-radius: var(--radius-sm);">
            <span style="font-size: 14px; font-weight: 500;">${escapeHtml(f)}</span>
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
    if (confirm('Tem certeza que deseja remover esta faixa? Alunos ainda podem tê-la listada se já atribuída no passado.')) {
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
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-hover); border-radius: var(--radius-sm);">
            <span style="font-size: 14px; font-weight: 500;">${escapeHtml(p)}</span>
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
        // Redirection to profile page — "Meu Perfil" removed from sidebar, click chip instead
        profile.style.cursor = 'pointer';
        profile.title = 'Meu Perfil';
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
    const turma = db.turmas ? db.turmas.find(t => String(t.id) === String(db.activeTurmaId)) : null;
    const temTurma = !!(turma);
    const tipo = (turma && turma.tipo || '').toLowerCase();
    const isRendimento = tipo.includes('rendimento') || tipo.includes('competi\u00e7\u00e3o');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let menuItens = [];
    if (!temTurma) {
        // Sem turma selecionada: exibe apenas "Trocar de Turma"
        menuItens = [];
    } else if (isRendimento) {
        menuItens = [
            { href: 'dashboard-turma-dados.html', icon: 'ti-calendar-event', label: 'Vis\u00e3o da Equipe' },
            { href: 'dashboard-rendimento.html', icon: 'ti-activity', label: 'Monitoramento' },
            { href: 'dashboard-questionarios.html', icon: 'ti-clipboard-list', label: 'Question\u00e1rios' },
            { href: 'treino-equipe.html', icon: 'ti-barbell', label: 'Treinos' },
            { href: 'calendario.html', icon: 'ti-calendar', label: 'Calend\u00e1rio' },
            { href: 'scout-video.html', icon: 'ti-video', label: 'An\u00e1lise de Lutas' }
        ];
    } else {
        menuItens = [
            { href: 'dashboard-turma-dados.html', icon: 'ti-users', label: 'Dados da Turma' },
            { href: 'dashboard-aulas.html', icon: 'ti-checklist', label: 'Chamada Di\u00e1ria' },
            { href: 'financeiro.html', icon: 'ti-cash', label: 'Financeiro' }
        ];
    }
    // "Meu Perfil" moved to header profile chip — not in sidebar
    const html = menuItens.map(item => {
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

function setupOfflineBanner() {
    if (window._disableOfflineBanner) return;
    let banner = document.getElementById('offlineBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offlineBanner';
        banner.innerHTML = '<i class="ti ti-wifi-off"></i> Você está offline. Os dados serão sincronizados quando a conexão voltar.';
        document.body.appendChild(banner);
    }
    function showOffline() { banner.classList.add('visible'); }
    function hideOffline() {
        banner.classList.remove('visible');
        if (typeof syncToSupabase === 'function') syncToSupabase();
    }
    function checkReal() {
        fetch(window.location.origin + '/js/app.js', { method: 'HEAD', cache: 'no-store' })
            .then(function() { hideOffline(); })
            .catch(function() { showOffline(); });
    }
    window.addEventListener('offline', checkReal);
    window.addEventListener('online', hideOffline);
    if (!navigator.onLine) checkReal();
}

document.addEventListener('DOMContentLoaded', () => {
    // Carrega o Banco de Dados no carregamento da página
    loadDB();
    setupOfflineBanner();
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
                <div style="width: 100%; height: 300px; display: flex; justify-content: center; align-items: center; background: #000; overflow: hidden; margin-bottom: 16px;">
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

    // L?o arquivo como URL
    const reader = new FileReader();
    reader.onload = function (e) {
        imagePreview.src = e.target.result;

        modal.classList.add('active');

        // Destruir instância anterior se existir
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
        showToast("Scout não encontrado!", "error");
        return;
    }

    const atleta = scout.atletaId === 'adversario' ? { nome: 'Adversário', avatar: 'https://cdn-icons-png.flaticon.com/512/1177/1177568.png' } : db.alunos.find(a => String(a.id) === String(scout.atletaId));

    // Fallback para atleta n?o encontrado
    const nomeAtleta = atleta ? atleta.nome : "Atleta Removido";
    const avatarAtleta = atleta ? (atleta.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR;

    let modal = document.getElementById('modalScoutDetail');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modalScoutDetail';
        document.body.appendChild(modal);
    }

    const dataObj = new Date(scout.dataRegistro);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Sum?rio de Rounds
    // Calcula placar total e por round
    const acoesFiltradas0 = (scout.acoes || []).filter(a => !a.isDivider);
    let totalAtleta = 0, totalAdversario = 0;
    const roundScores = {};
    acoesFiltradas0.forEach(ev => {
        const r = ev.round || 1;
        if (!roundScores[r]) roundScores[r] = { a: 0, b: 0 };
        const pts = parseInt(ev.pontos) || 0;
        if (pts > 0) {
            if (ev.acao === 'Ataque Feito') { roundScores[r].a += pts; totalAtleta += pts; }
            else if (ev.acao === 'Ataque Sofrido') { roundScores[r].b += pts; totalAdversario += pts; }
        }
        if (ev.acao === 'Falta Feita') { roundScores[r].b += 1; totalAdversario += 1; }
        else if (ev.acao === 'Falta Sofrida') { roundScores[r].a += 1; totalAtleta += 1; }
    });

    // Vencedor de cada round (para placar de rounds)
    let roundsVencidos = 0, roundsPerdidos = 0;
    const roundKeys = Object.keys(roundScores).sort((a, b) => Number(a) - Number(b));
    roundKeys.forEach(r => {
        const sc = roundScores[r];
        if (sc.a > sc.b) roundsVencidos++;
        else if (sc.b > sc.a) roundsPerdidos++;
    });

    let roundsHtml = '';
    if (scout.rounds && scout.rounds.length > 0) {
        const roundResultSummary = scout.rounds.length >= 2
            ? `<div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 20px; text-align: center; flex-shrink: 0;">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Resultado por Rounds</div>
                <div style="font-size: 22px; font-weight: 800; color: ${roundsVencidos > roundsPerdidos ? 'var(--green)' : roundsVencidos < roundsPerdidos ? 'var(--red)' : 'var(--yellow)'};">${roundsVencidos} x ${roundsPerdidos}</div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Pontos totais: ${totalAtleta} x ${totalAdversario}</div>
               </div>`
            : '';

        roundsHtml = `
            <div style="display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; flex-wrap: wrap; align-items: flex-start;">
                ${scout.rounds.map(r => {
                    const sc = roundScores[r.round] || { a: 0, b: 0 };
                    const scoreStr = `${sc.a} x ${sc.b}`;
                    const col = r.result === 'vitoria' ? 'var(--green)' : r.result === 'derrota' ? 'var(--red)' : 'var(--yellow)';
                    return `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center; min-width: 100px;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Round ${r.round}</div>
                        <div style="font-size: 20px; font-weight: 800; color: ${col};">${scoreStr}</div>
                        <div style="font-size: 11px; color: ${col}; margin-top: 2px;">${r.result.toUpperCase()}</div>
                    </div>`;
                }).join('')}
                ${roundResultSummary}
            </div>
        `;
    }

    // Timeline das Ações
    let timelineHtml = '';
    const acoes = scout.acoes || [];
    if (acoes.length === 0) {
        timelineHtml = '<p style="color: var(--text-muted); text-align: center;">Nenhuma ação registrada nesta luta.</p>';
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
                <div style="display: flex; gap: 16px; margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; align-items: flex-start;">
                    <div style="background: var(--bg-hover); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; font-weight: 700;">${ev.formattedTime}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px;">${ev.acao || 'Ação'} ${resStr}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${detailsArr.join(' · ')}</div>
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
        return `<div style="font-size: 13px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t[0]}">?${t[0]}: ${pct}%</div>`;
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
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Top Técnicas</div>
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
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 16px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: var(--radius-lg);">
                    ${scout.atletaId === 'adversario' || (typeof scout.atletaId === 'string' && scout.atletaId.startsWith('Adversário')) ? '' : `<img src="${avatarAtleta}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">`}
                    <div>
                        <div style="font-size: 18px; font-weight: 700;">${escapeHtml(nomeAtleta)}</div>
                        <div style="color: var(--text-muted); font-size: 14px;">${escapeHtml(scout.evento || '')}</div>
                    </div>
                    <div style="margin-left: auto; text-align: right;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Resultado Final</div>
                        <div style="font-size: 22px; font-weight: 800; color: ${scout.resultadoLuta === 'vitoria' ? 'var(--green)' : scout.resultadoLuta === 'derrota' ? 'var(--red)' : 'var(--text-muted)'}">
                            ${totalAtleta} x ${totalAdversario}
                        </div>
                        <div style="font-size: 12px; color: ${scout.resultadoLuta === 'vitoria' ? 'var(--green)' : scout.resultadoLuta === 'derrota' ? 'var(--red)' : 'var(--text-muted)'}; font-weight: 600;">
                            ${(scout.resultadoLuta || '---').toUpperCase()}
                        </div>
                    </div>
                </div>

                ${roundsHtml}
                
                ${analyticsCardsHtml}

                <div style="display: grid; grid-template-columns: 1fr 300px; gap: 24px;">
                    <div>
                        <h3 style="font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            <i class="ti ti-history" style="color: var(--primary);"></i> Timeline de Eventos
                        </h3>
                        <div style="margin-bottom: 24px;">
                            ${timelineHtml}
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); height: fit-content;">
                        <h3 style="font-size: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; justify-content: center;">
                            <i class="ti ti-star" style="color: var(--yellow);"></i> Avaliação Técnica
                        </h3>
                        <div style="height: 250px; width: 100%; position: relative;">
                            <canvas id="scoutRadarChart"></canvas>
                        </div>
                        <div id="noAssessmentmsg" style="display: none; text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">
                            Nenhuma avaliação registrada para este scout.
                        </div>
                    </div>
                </div>

                ${scout.observacaoFinal ? `
                <div style="margin-top: 24px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
                    <h3 style="font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="ti ti-notes" style="color: var(--primary);"></i> Observações Finais
                    </h3>
                    <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6; white-space: pre-wrap;">${escapeHtml(scout.observacaoFinal)}</p>
                </div>` : ''}
            </div>

            <div style="padding: 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-shrink: 0; flex-wrap: wrap;">
                <button class="btn btn-outline" style="color: var(--yellow); border-color: rgba(234,179,8,0.4); background: rgba(234,179,8,0.08);" onclick="document.getElementById('modalScoutDetail').classList.remove('active'); editScout(${scout.id})">
                    <i class="ti ti-edit"></i> Editar Scout
                </button>
                <div style="display: flex; gap: 12px;">
                    <button class="btn" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-main);" onclick="downloadScoutPDF(${scout.id})">
                        <i class="ti ti-download"></i> Baixar PDF
                    </button>
                    <button class="btn btn-primary" onclick="document.getElementById('modalScoutDetail').classList.remove('active')">Fechar</button>
                </div>
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
                    labels: ['Velocidade', 'Força', 'Tática', 'Defesa', 'Variação', 'Precisão', 'Obediência'],
                    datasets: [{
                        label: 'Desempenho nesta Luta',
                        data: dataArr,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6',
                        pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6',
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
                            pointLabels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8', font: { size: 9 } }
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
            const _nassEl = document.getElementById('noAssessmentmsg'); if (_nassEl) _nassEl.style.display = 'block';
        }
    }
}

/**
 * Exclui um scout permanentemente.
 * @param {number} scoutId 
 * @param {function} callback - Função para atualizar a UI após exclusão
 */
function deleteScout(scoutId, callback) {
    if (!confirm("Tem certeza que deseja excluir esta anáálise de scout permanentemente?")) return;

    const index = db.lutasScout.findIndex(s => String(s.id) === String(scoutId));
    if (index !== -1) {
        db.lutasScout.splice(index, 1);
        saveDB();
        showToast("Scout excluído com sucesso!", "success");
        if (callback) callback();
    }
}

/**
 * Redireciona para a tela de scout carregando os dados para edição.
 * @param {number} scoutId 
 */
function editScout(scoutId) {
    // Redireciona para a página de scout com o ID na URL
    window.location.href = `scout-video.html?edit=${scoutId}`;
}

/**
 * Gera e baixa um PDF de alto nível com análise granular (Ofensiva vs Defensiva) e agrupamento por rounds.
 * @param {number} scoutId 
 */
/**
 * Gera e baixa um PDF de alto nível com análise granular e matriz analítica (Técnica + Perna + Base).
 * @param {number} scoutId 
 */
async function downloadScoutPDF(scoutId) {
    const scout = db.lutasScout.find(s => String(s.id) === String(scoutId));
    if (!scout) return;

    const atleta = scout.atletaId === 'adversario' ? { nome: 'Adversário' } : db.alunos.find(a => String(a.id) === String(scout.atletaId));
    const nomeAtleta = atleta ? atleta.nome : "Atleta Removido";
    const { jsPDF } = window.jspdf;
    const doc = patchDocText(new jsPDF());

    const dataObj = new Date(scout.dataRegistro);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // --- ESTRUTURA DE AGREGREGAÇÃO ---
    const factory = () => ({
        total: 0, pontos: 0,
        matriz: {},
        alvos: { 'Colete': 0, 'Capacete': 0 },
        subAlvos: {}, // { 'Colete': { 'Peito': 0... }, 'Capacete': { 'Face': 0... } }
        locais: { 'Meio': 0, 'No Canto': 0 },
        subLocais: { 'Pressionando': 0, 'Pressionado': 0 },
        pernas: { 'Direita': 0, 'Esquerda': 0 },
        subPernas: { 'Direita': { 'Frente': 0, 'Trás': 0 }, 'Esquerda': { 'Frente': 0, 'Trás': 0 } },
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
        if (ev.resultado === 'Com ponto') tgt.pontos += (parseInt(ev.pontos) || 1);

        if (ev.tecnica) {
            // Matriz analítica para ofensiva usa Perna e Base. Para defensiva, apenas técnica/resultado.
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
            if (ev.local === 'No Canto' && ev.subLocal) {
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

    // --- PDF Helper: Seção Título (Compacta) ---
    const drawSectionHeader = (title, y) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 6, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(title.toUpperCase(), 20, y + 4.5);
        return y + 10;
    };

    // Calcula placar por round para o PDF
    const pdfRoundScores = {};
    acoesFiltradas.forEach(ev => {
        const r = ev.round || 1;
        if (!pdfRoundScores[r]) pdfRoundScores[r] = { a: 0, b: 0 };
        const pts = parseInt(ev.pontos) || 0;
        if (pts > 0) {
            if (ev.acao === 'Ataque Feito') pdfRoundScores[r].a += pts;
            else if (ev.acao === 'Ataque Sofrido') pdfRoundScores[r].b += pts;
        }
        if (ev.acao === 'Falta Feita') pdfRoundScores[r].b += 1;
        else if (ev.acao === 'Falta Sofrida') pdfRoundScores[r].a += 1;
    });
    const pdfRoundKeys = Object.keys(pdfRoundScores).sort((a, b) => Number(a) - Number(b));
    let pdfRoundsV = 0, pdfRoundsP = 0;
    pdfRoundKeys.forEach(r => {
        const sc = pdfRoundScores[r];
        if (sc.a > sc.b) pdfRoundsV++;
        else if (sc.b > sc.a) pdfRoundsP++;
    });
    const pdfRoundSummary = pdfRoundKeys.map(r => {
        const sc = pdfRoundScores[r];
        return `R${r}: ${sc.a}x${sc.b}`;
    }).join('  |  ');

    // Calcula quantas linhas o header precisa
    const hasRoundScores = pdfRoundKeys.length > 0;
    const headerH = hasRoundScores ? 42 : 35;

    // --- Header ---
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text("ANALISE DE PERFORMANCE - SCOUT", 15, 13);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`ATLETA: ${pdfStr(nomeAtleta).toUpperCase()}`, 15, 23);
    doc.text(`EVENTO: ${pdfStr(scout.evento || 'N/A').toUpperCase()}`, 15, 28);
    doc.text(`DATA: ${dataFormatada}`, 145, 23);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(`SCORE: ${ofensiva.pontos} x ${defensiva.pontos}`, 145, 29);
    if (hasRoundScores) {
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 220, 255);
        doc.text(pdfStr(pdfRoundSummary), 15, 35);
        if (pdfRoundKeys.length >= 2) {
            doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 200);
            doc.text(`ROUNDS: ${pdfRoundsV} x ${pdfRoundsP}`, 145, 35);
        }
    }

    let yPos = headerH + 8;

    // --- OBSERVAÇÕES FINAIS (topo do PDF) ---
    if (scout.observacaoFinal && scout.observacaoFinal.trim()) {
        yPos = drawSectionHeader("Observações do Treinador", yPos);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
        const obsLines = doc.splitTextToSize(pdfStr(scout.observacaoFinal.trim()), 175);
        obsLines.forEach(line => {
            if (yPos > 280) { doc.addPage(); yPos = 20; }
            doc.text(line, 15, yPos);
            yPos += 4.5;
        });
        yPos += 6;
    }

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
    doc.text(`Eficiência: ${ofpEfic}%`, 15, yPos + 9);
    doc.text(`Faltas Cometidas: ${faltasFeitas}`, 15, yPos + 13.5);

    doc.text(`Ataques Recebidos: ${defensiva.total}`, 110, yPos);
    doc.text(`Pontos Sofridos: ${defensiva.pontos}`, 110, yPos + 4.5);
    doc.text(`Eficiência da Defesa: ${defEfic}%`, 110, yPos + 9);
    doc.text(`Faltas Sofridas: ${faltasSofridas}`, 110, yPos + 13.5);

    yPos += 20;

    // --- TÉCNICAS (Top 6) ---
    doc.setFillColor(239, 246, 255);
    doc.rect(15, yPos, 85, 5, 'F');
    doc.rect(110, yPos, 85, 5, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text("TOP TÉCNICAS APLICADAS", 20, yPos + 3.5);
    doc.text("TOP TÉCNICAS RECEBIDAS", 115, yPos + 3.5);
    yPos += 7;

    doc.setFontSize(7); doc.setTextColor(71, 85, 105);
    doc.text("TÉCNICA", 15, yPos); doc.text("USO", 75, yPos); doc.text("PT(%)", 90, yPos);
    doc.text("TÉCNICA", 110, yPos); doc.text("USO", 170, yPos); doc.text("PT(%)", 185, yPos);
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
                if (parts.length) subOfpStr = `\n    + ${parts.join(' | ')}`;
            }
            if (subKey && objDef[subKey] && objDef[subKey][k]) {
                const parts = Object.entries(objDef[subKey][k]).filter(([_, v]) => v > 0).map(([sk, sv]) => `${sk}: ${sv}${calcPct(sv, vDef)}`);
                if (parts.length) subDefStr = `\n    + ${parts.join(' | ')}`;
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
    printIndicatorGroup("Localização da Quadra (Tentativas)", 'locais', ofensiva, defensiva, 'subLocais');
    printIndicatorGroup("Uso de Pernas (Tentativas)", 'pernas', ofensiva, defensiva, 'subPernas');
    printIndicatorGroup("Posicionamento de Base (Tentativas)", 'bases', ofensiva, defensiva);


    // --- TIMELINE AGRUPADA POR ROUND ---
    if (yPos > 220) { doc.addPage(); yPos = 20; } else { yPos += 10; }
    yPos = drawSectionHeader("Timeline Detalhada por Round", yPos);

    const rounds = {};
    // Preserva a ordem original (mais antigo primeiro = ordem de registro)
    (scout.acoes || []).forEach(a => {
        const r = a.round || 1;
        if (!rounds[r]) rounds[r] = [];
        rounds[r].push(a);
    });

    Object.keys(rounds).sort((a, b) => Number(a) - Number(b)).forEach(rKey => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }

        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setFillColor(239, 246, 255); doc.rect(15, yPos, 180, 6, 'F');
        doc.setTextColor(59, 130, 246);
        doc.text('ROUND ' + rKey, 105, yPos + 4.5, { align: 'center' });
        yPos += 10;
        doc.setTextColor(30, 41, 59);

        // Mais antigo no topo: inverte se o primeiro item tiver tempo maior que o último
        const evList = rounds[rKey].filter(ev => !ev.isDivider);
        const parseTime = (t) => {
            if (!t) return 0;
            const s = String(t);
            if (s.includes(':')) { const [m, sc] = s.split(':'); return parseInt(m) * 60 + parseInt(sc); }
            return parseInt(s) || 0;
        };
        const ordered = evList.length > 1 && parseTime(evList[0].formattedTime) > parseTime(evList[evList.length - 1].formattedTime)
            ? [...evList].reverse()
            : evList;

        ordered.forEach(ev => {
            if (yPos > 275) { doc.addPage(); yPos = 20; }

            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
            doc.text(ev.formattedTime || '', 15, yPos);

            doc.setFontSize(8);
            const resBadge = ev.resultado === 'Com ponto' ? ' [PONTO]' : '';
            const acaoLabel = (ev.acao || '') + (ev.tipoAcao ? ' / ' + ev.tipoAcao : '') + ': ' + (ev.tecnica || '') + resBadge;
            doc.text(acaoLabel, 30, yPos);

            const sub = [];
            if (ev.descFalta) sub.push('Falta: ' + ev.descFalta);
            if (ev.alvo) sub.push(ev.alvo + (ev.subAlvo ? ' (' + ev.subAlvo + ')' : ''));
            if (ev.distancia) sub.push('Dist. ' + ev.distancia);
            if (ev.perna) sub.push(ev.perna + (ev.subPerna ? ' (' + ev.subPerna + ')' : ''));
            if (ev.base) sub.push('Base ' + ev.base);
            if (ev.local) sub.push(ev.local + (ev.subLocal ? ' (' + ev.subLocal + ')' : ''));
            if (ev.obsTecnica) sub.push(ev.obsTecnica);

            if (sub.length) {
                doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
                doc.text(sub.join(' | '), 30, yPos + 3.5);
                doc.setTextColor(30);
                yPos += 8;
            } else {
                yPos += 5;
            }
        });
        yPos += 4;
    });

    // --- RADAR TÁTICO (desenhado com primitivas jsPDF) ---
    if (scout.avaliacaoTreinador) {
        if (yPos > 170) { doc.addPage(); yPos = 20; } else { yPos += 10; }
        yPos = drawSectionHeader("Avaliacao Tatica - Radar de Desempenho", yPos);

        const av = scout.avaliacaoTreinador;
        const radarLabels = ['Velocidade', 'Forca', 'Tatica', 'Defesa', 'Variacao', 'Precisao', 'Obediencia'];
        const radarKeys  = ['velocidade', 'forca',  'tatica', 'defesa', 'variacao', 'precisao', 'obediencia'];
        const radarVals  = radarKeys.map(k => Math.min(10, Math.max(0, Number(av[k]) || 0)));
        const n = radarLabels.length;
        const cx = 105, cy = yPos + 58, R = 46;

        const radarPt = (val, idx, radius) => {
            const r = radius !== undefined ? radius : R * val / 10;
            const angle = (2 * Math.PI * idx / n) - Math.PI / 2;
            return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
        };

        // Fundo branco para o radar
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPos - 2, 170, 130, 'F');

        // Grade (5 níveis)
        for (let level = 1; level <= 5; level++) {
            const r = R * level / 5;
            const isMain = level === 5 || level === 3;
            doc.setDrawColor(isMain ? 180 : 210, isMain ? 180 : 210, isMain ? 180 : 210);
            doc.setLineWidth(isMain ? 0.4 : 0.2);
            for (let i = 0; i < n; i++) {
                const p1 = radarPt(0, i, r);
                const p2 = radarPt(0, (i + 1) % n, r);
                doc.line(p1.x, p1.y, p2.x, p2.y);
            }
            // Label de nível (2, 4, 6, 8, 10)
            doc.setFontSize(5); doc.setTextColor(160, 160, 160);
            const lp = radarPt(0, 0, r);
            doc.text(String(level * 2), lp.x + 1, lp.y - 0.5);
        }

        // Eixos
        doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.3);
        for (let i = 0; i < n; i++) {
            const p = radarPt(0, i, R);
            doc.line(cx, cy, p.x, p.y);
        }

        // Polígono de dados (linha azul)
        doc.setDrawColor(59, 130, 246); doc.setLineWidth(1.5);
        for (let i = 0; i < n; i++) {
            const p1 = radarPt(radarVals[i], i);
            const p2 = radarPt(radarVals[(i + 1) % n], (i + 1) % n);
            doc.line(p1.x, p1.y, p2.x, p2.y);
        }

        // Pontos de dados
        doc.setFillColor(59, 130, 246);
        for (let i = 0; i < n; i++) {
            const p = radarPt(radarVals[i], i);
            doc.circle(p.x, p.y, 1.3, 'F');
            // Valor dentro do ponto (branco)
            doc.setFontSize(4.5); doc.setTextColor(255, 255, 255);
            doc.text(String(radarVals[i]), p.x, p.y + 1.5, { align: 'center' });
        }

        // Labels dos eixos
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(30, 41, 59);
        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i / n) - Math.PI / 2;
            const labelR = R + 9;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            const cosA = Math.cos(angle);
            const align = cosA < -0.3 ? 'right' : cosA > 0.3 ? 'left' : 'center';
            doc.text(radarLabels[i], lx, ly + 2, { align });
        }

        // Tabela de legenda (abaixo do radar)
        const legY = cy + R + 18;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(30, 41, 59);
        doc.text('LEGENDA DE ATRIBUTOS', 105, legY, { align: 'center' });

        const barMaxW = 38;
        radarLabels.forEach((lbl, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const lx = col === 0 ? 25 : 115;
            const ly = legY + 6 + row * 9;
            const val = radarVals[i];
            const fillW = barMaxW * val / 10;
            const barColor = val >= 8 ? [34, 197, 94] : val >= 5 ? [59, 130, 246] : [239, 68, 68];

            doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(50, 50, 50);
            doc.text(lbl + ':', lx, ly);
            // Barra de fundo
            doc.setFillColor(220, 220, 220);
            doc.rect(lx + 24, ly - 4, barMaxW, 4.5, 'F');
            // Barra de valor
            doc.setFillColor(...barColor);
            if (fillW > 0) doc.rect(lx + 24, ly - 4, fillW, 4.5, 'F');
            // Valor
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...barColor);
            doc.text(val + '/10', lx + 24 + barMaxW + 2, ly);
        });

        // Linha restante se n for ímpar
        if (n % 2 === 1) {
            const lastRow = Math.floor((n - 1) / 2);
            const ly = legY + 6 + lastRow * 9;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(50, 50, 50);
            doc.text(radarLabels[n - 1] + ':', 25, ly);
            const val = radarVals[n - 1];
            const fillW = barMaxW * val / 10;
            const barColor = val >= 8 ? [34, 197, 94] : val >= 5 ? [59, 130, 246] : [239, 68, 68];
            doc.setFillColor(220, 220, 220); doc.rect(49, ly - 4, barMaxW, 4.5, 'F');
            doc.setFillColor(...barColor); if (fillW > 0) doc.rect(49, ly - 4, fillW, 4.5, 'F');
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...barColor);
            doc.text(val + '/10', 49 + barMaxW + 2, ly);
        }

        yPos = legY + 6 + Math.ceil(n / 2) * 9 + 8;
    }

    doc.save(`Analise_Scout_${nomeAtleta.replace(/\s+/g, '_')}_ID${scout.id}.pdf`);
}



