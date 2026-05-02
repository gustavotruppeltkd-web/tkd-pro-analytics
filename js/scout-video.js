// Video Scout Script
document.addEventListener('DOMContentLoaded', () => {

    // ==== DEFAULT TECHNIQUES ====
    const DEFAULT_TECHNIQUES = ["Bandal", "Neryo", "Ap Tcha", "Tuit", "Soco"];
    let customTechniques = JSON.parse(localStorage.getItem('scout_techniques')) || DEFAULT_TECHNIQUES;

    // ==== SCOUT STATE ====
    let currentScoutState = {
        acao: null,
        tipoAcao: null,
        descFalta: "",
        resultado: null,
        pontos: null,
        alvo: null,
        subAlvo: null,
        distancia: null,
        perna: null,
        subPerna: null,
        base: null,
        local: null,
        subLocal: null,
        tecnica: null,
        obsTecnica: ""
    };

    let timelineEvents = [];
    let currentRound = 1;
    let roundsData = []; // Store results of each round { round: 1, result: 'vitoria' }

    // ==== PLAYER STATE ====
    let currentVideoType = 'local'; // or 'youtube'
    let ytPlayer = null;
    let localPlayer = document.getElementById('localPlayer');
    window.YT_Ready = false;

    // We store the exact current time periodically to update the UI
    let lastKnownTime = 0;
    let timeInterval = null;

    let editModeScoutId = null;

    // Initialize
    initUI();
    window.renderHistoryList = renderHistoryList;
    initPlayerListeners();
    checkEditMode();
    initKeyboardShortcuts();

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', e => {
            // Skip when typing in an input/textarea
            if (e.target.matches('input, textarea, select')) return;

            // Helper: click a scout-opt-btn by data-group + data-val
            function clickOpt(group, val) {
                const btn = document.querySelector(`[data-group="${group}"][data-val="${val}"]`);
                if (btn && !btn.disabled) btn.click();
            }

            switch (e.key) {
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    if (currentVideoType === 'local' && localPlayer) {
                        if (localPlayer.paused) localPlayer.play().catch(() => {});
                        else localPlayer.pause();
                    } else if (currentVideoType === 'youtube' && ytPlayer) {
                        const state = ytPlayer.getPlayerState?.();
                        if (state === 1) ytPlayer.pauseVideo?.();
                        else ytPlayer.playVideo?.();
                    }
                    break;
                case 'a': case 'A':
                    e.preventDefault();
                    clickOpt('acao', 'Ataque Feito');
                    break;
                case 's': case 'S':
                    e.preventDefault();
                    clickOpt('acao', 'Ataque Sofrido');
                    break;
                case 'f': case 'F':
                    e.preventDefault();
                    clickOpt('acao', 'Falta Feita');
                    break;
                case 'd': case 'D':
                    e.preventDefault();
                    clickOpt('acao', 'Falta Sofrida');
                    break;
                case 'e': case 'E':
                    e.preventDefault();
                    clickOpt('perna', 'Esquerda');
                    break;
                case 'r': case 'R':
                    if (e.ctrlKey || e.metaKey) {
                        // Ctrl+R → end round
                        e.preventDefault();
                        const btnEnd = document.getElementById('btnEndRound');
                        if (btnEnd && !btnEnd.disabled) btnEnd.click();
                    } else {
                        e.preventDefault();
                        clickOpt('perna', 'Direita');
                    }
                    break;
                case '1':
                    e.preventDefault();
                    clickOpt('pontos', '1');
                    break;
                case '2':
                    e.preventDefault();
                    clickOpt('pontos', '2');
                    break;
                case '3':
                    e.preventDefault();
                    clickOpt('pontos', '3');
                    break;
                case '4':
                    e.preventDefault();
                    clickOpt('pontos', '4');
                    break;
                case '6':
                    e.preventDefault();
                    clickOpt('pontos', '6');
                    break;
                case 'Enter':
                    e.preventDefault();
                    const btnReg = document.getElementById('btnRegisterEvent');
                    if (btnReg && !btnReg.disabled) btnReg.click();
                    break;
            }
        });
    }

    function checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            const scout = db.lutasScout.find(s => s.id === parseInt(editId));
            if (scout) {
                editModeScoutId = scout.id;

                // Load data into state
                timelineEvents = JSON.parse(JSON.stringify(scout.acoes || []));
                currentRound = scout.currentRound || 1;
                roundsData = JSON.parse(JSON.stringify(scout.rounds || []));

                // Populate Form
                const _sAtleta = document.getElementById('scoutAtleta'); if (_sAtleta) _sAtleta.value = scout.atletaId;
                const _sEvento = document.getElementById('scoutEvento'); if (_sEvento) _sEvento.value = scout.evento;
                const _sResult = document.getElementById('scoutLutaResult'); if (_sResult) _sResult.value = scout.resultadoLuta || "";
                const _sRound = document.getElementById('currentRoundDisplay'); if (_sRound) _sRound.innerText = currentRound;

                renderTimeline();
                showToast("Editando Scout: " + scout.evento, "info");

                // Update save button text
                const btnSave = document.getElementById('btnSaveScoutSession');
                const btnCancel = document.getElementById('btnCancelEdit');

                if (btnSave) {
                    btnSave.innerHTML = '<i class="ti ti-device-floppy"></i> Atualizar Escalao (Salvar Alterações)';
                    btnSave.style.background = 'var(--primary)';
                    btnSave.style.borderColor = 'var(--primary)';
                }

                if (btnCancel) {
                    btnCancel.style.display = 'flex';
                    btnCancel.addEventListener('click', () => {
                        if (confirm("Deseja cancelar a edição? Todas as alterações no salvas serão perdidas.")) {
                            window.location.href = 'scout-video.html';
                        }
                    });
                }
            }
        }
    }

    function populateAtletasSelect() {
        const select = document.getElementById('scoutAtleta');
        if (!select) return;

        // Limpa e recria caso exista para evitar duplicados
        select.innerHTML = `
            <option value="">Selecione o atleta da equipe...</option>
            <option value="adversario">--- Possível Adversário ---</option>
        `;

        // Filtra os atletas da turma atual
        const turmaAtletas = (db.alunos || []).filter(a => a.turmaId === db.activeTurmaId);

        turmaAtletas.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.text = a.nome;
            select.appendChild(opt);
        });
    }

    function initUI() {
        populateAtletasSelect();

        window.toggleOpponentNameInput = function () {
            const select = document.getElementById('scoutAtleta');
            const group = document.getElementById('opponentNameGroup');
            if (select && group) {
                if (select.value === 'adversario') {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            }
        };

        // Config Toggle Logic
        const toggleBtn = document.getElementById('toggleConfigBtn');
        const configContent = document.getElementById('configLutaContent');
        if (toggleBtn && configContent) {
            toggleBtn.addEventListener('click', () => {
                if (configContent.style.display === 'none') {
                    configContent.style.display = 'grid';
                    toggleBtn.innerHTML = '<i class="ti ti-chevron-up"></i>';
                } else {
                    configContent.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="ti ti-chevron-down"></i>';
                }
            });
        }

        // Add listener for save settings button
        const btnSaveConfig = document.getElementById('btnSaveConfigLuta');
        if (btnSaveConfig && configContent && toggleBtn) {
            btnSaveConfig.addEventListener('click', () => {
                const atleta = document.getElementById('scoutAtleta').value;
                const evento = document.getElementById('scoutEvento').value.trim();

                if (!atleta || !evento) {
                    if (typeof showToast === 'function') {
                        showToast("Preencha Atleta e Nome do Evento antes de salvar", "warning");
                    } else {
                        alert("Preencha Atleta e Nome do Evento antes de salvar");
                    }
                    return;
                }

                // Hide container
                configContent.style.display = 'none';
                toggleBtn.innerHTML = '<i class="ti ti-chevron-down"></i>';
                // Hide step guide once fight is configured
                const guide = document.getElementById('scoutStepGuide');
                if (guide) guide.style.display = 'none';
                if (typeof showToast === 'function') {
                    showToast("Configurações da luta salvas!", "success");
                }
            });
        }

        renderTechniquesGrid();

        // Source Toggle
        document.getElementById('btnYoutubeSource').addEventListener('click', (e) => setVideoSource('youtube', e.target));
        document.getElementById('btnLocalSource').addEventListener('click', (e) => setVideoSource('local', e.target));

        // Scout panel click listeners (Delegated)
        document.querySelector('.scout-middle-col').addEventListener('click', (e) => {
            const btn = e.target.closest('.scout-opt-btn');
            if (!btn) return;

            const group = btn.dataset.group;
            const value = btn.dataset.val;

            // Handle toggle off
            if (currentScoutState[group] === value) {
                currentScoutState[group] = null;
                btn.classList.remove('active');

                if (group === 'alvo') {
                    currentScoutState.subAlvo = null;
                    renderSubAlvos(null);
                }
                if (group === 'local') {
                    currentScoutState.subLocal = null;
                    renderSubLocais(null);
                }
                if (group === 'perna') {
                    currentScoutState.subPerna = null;
                    renderSubPernas(null);
                }
            } else {
                currentScoutState[group] = value;
                // Remove active from peers in same group
                const peers = document.querySelectorAll(`[data-group="${group}"]`);
                peers.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');

                if (group === 'alvo') {
                    currentScoutState.subAlvo = null;
                    renderSubAlvos(value);
                }
                if (group === 'local') {
                    currentScoutState.subLocal = null;
                    renderSubLocais(value);
                }
                if (group === 'perna') {
                    currentScoutState.subPerna = null;
                    renderSubPernas(value);
                }
            }

            // Mostra/esconde caixinha de descrição de falta
            const isFalta = currentScoutState.acao === 'Falta Feita' || currentScoutState.acao === 'Falta Sofrida';
            document.getElementById('faltaDescContainer').style.display = isFalta ? 'block' : 'none';
            if (!isFalta) {
                currentScoutState.descFalta = '';
                document.getElementById('faltaDescInput').value = '';
            }

            // Mostra/esconde seletor de pontos
            const comPonto = currentScoutState.resultado === 'Com ponto';
            document.getElementById('pontosContainer').style.display = comPonto ? 'block' : 'none';
            if (!comPonto) {
                currentScoutState.pontos = null;
                document.querySelectorAll('[data-group="pontos"]').forEach(b => b.classList.remove('active'));
            }

            updateSummaryPreview();
        });

        // Input observation listener
        document.getElementById('obsTecnica').addEventListener('input', (e) => {
            currentScoutState.obsTecnica = e.target.value;
            updateSummaryPreview();
        });

        // Descrição da falta
        document.getElementById('faltaDescInput').addEventListener('input', (e) => {
            currentScoutState.descFalta = e.target.value;
            updateSummaryPreview();
        });

        // Register Event
        document.getElementById('btnRegisterEvent').addEventListener('click', () => {
            registerTimelineEvent();
        });

        // Start time updater
        timeInterval = setInterval(updateTimeDisplay, 500);

        // Save Scout Session
        const btnSave = document.getElementById('btnSaveScoutSession');
        if (btnSave) {
            btnSave.addEventListener('click', saveScoutSession);
        }

        // End Round Logic
        const btnEndRound = document.getElementById('btnEndRound');
        if (btnEndRound) {
            btnEndRound.addEventListener('click', () => {
                // Calcula placar do round a partir dos eventos
                const roundEvents = timelineEvents.filter(e => !e.isDivider && e.round === currentRound);
                let scoreAtleta = 0, scoreAdversario = 0;
                roundEvents.forEach(ev => {
                    const pts = parseInt(ev.pontos) || 0;
                    if (pts > 0) {
                        if (ev.acao === 'Ataque Feito') scoreAtleta += pts;
                        else if (ev.acao === 'Ataque Sofrido') scoreAdversario += pts;
                    }
                    // Falta feita = ponto para adversário; falta sofrida = ponto para atleta
                    if (ev.acao === 'Falta Feita') scoreAdversario += 1;
                    else if (ev.acao === 'Falta Sofrida') scoreAtleta += 1;
                });

                const cleanResult = scoreAtleta > scoreAdversario ? 'vitoria' : scoreAtleta < scoreAdversario ? 'derrota' : 'ponto_ouro';

                roundsData.push({
                    round: currentRound,
                    result: cleanResult,
                    scoreAtleta,
                    scoreAdversario
                });

                // Add a divider event to the timeline
                const divider = {
                    id: Date.now(),
                    isDivider: true,
                    round: currentRound,
                    result: cleanResult,
                    scoreAtleta,
                    scoreAdversario,
                    time: lastKnownTime,
                    formattedTime: formatTime(lastKnownTime)
                };
                timelineEvents.push(divider);
                timelineEvents.sort((a, b) => a.time - b.time);

                currentRound++;
                const roundDisp = document.getElementById('currentRoundDisplay');
                if (roundDisp) roundDisp.innerText = currentRound;

                const endBtnText = document.getElementById('btnEndRound');
                if (endBtnText) endBtnText.innerHTML = `<i class="ti ti-flag-3"></i> <span class="btn-label">Concluir R${currentRound}</span>`;

                renderTimeline();
                showToast(`Round ${currentRound - 1}: ${scoreAtleta} x ${scoreAdversario} (${cleanResult})`, "info");
            });
        }

        // History Toggle
        const btnHistory = document.getElementById('btnToggleHistory');
        const historyView = document.getElementById('historyView');
        if (btnHistory && historyView) {
            btnHistory.addEventListener('click', () => {
                if (historyView.style.display === 'none') {
                    renderHistoryList();
                    historyView.style.display = 'block';
                    historyView.scrollIntoView({ behavior: 'smooth' });
                } else {
                    historyView.style.display = 'none';
                }
            });
        }
    }

    function renderHistoryList() {
        const teamSelect = document.getElementById('selectTeamScouts');
        const opponentSelect = document.getElementById('selectOpponentScouts');
        if (!teamSelect || !opponentSelect) return;

        const scouts = [...(db.lutasScout || [])].sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro));

        const teamScouts = scouts.filter(s => typeof s.atletaId === 'number' || s.atletaId === undefined);
        const opponentScouts = scouts.filter(s => typeof s.atletaId === 'string' && (s.atletaId === 'adversario' || s.atletaId.startsWith('Adversário')));

        function buildOptions(list, defaultText) {
            if (list.length === 0) return `<option value="">${defaultText}</option>`;

            let html = `<option value="">Selecione um scout para visualizar...</option>`;
            list.forEach(s => {
                const dataObj = new Date(s.dataRegistro);
                const dataF = dataObj.toLocaleDateString('pt-BR');

                let nomeAtleta = "Atleta Removido";
                if (typeof s.atletaId === 'string') {
                    nomeAtleta = s.atletaId === 'adversario' ? 'Adversário Registrado' : s.atletaId;
                } else if (typeof s.atletaId === 'number') {
                    const at = db.alunos.find(a => String(a.id) === String(s.atletaId));
                    if (at) nomeAtleta = at.nome;
                }

                const res = s.resultadoLuta ? `[${s.resultadoLuta.toUpperCase()}]` : '';
                const acoesCount = (s.acoes || []).filter(a => !a.isDivider).length;

                html += `<option value="${s.id}">${dataF} | ${nomeAtleta} | ${s.evento} ${res} (${acoesCount} ações)</option>`;
            });
            return html;
        }

        teamSelect.innerHTML = buildOptions(teamScouts, "Nenhum scout de equipe salvo.");
        opponentSelect.innerHTML = buildOptions(opponentScouts, "Nenhum scout de adversário salvo.");
    }

    window.actionSelectedScout = function (type, action) {
        const selectId = type === 'team' ? 'selectTeamScouts' : 'selectOpponentScouts';
        const selectEl = document.getElementById(selectId);
        const scoutId = parseInt(selectEl.value);

        if (!scoutId) {
            alert("Por favor, selecione um scout na lista antes de executar uma ao.");
            return;
        }

        if (action === 'open') {
            openScoutDetail(scoutId);
        } else if (action === 'edit') {
            document.getElementById('historyView').style.display = 'none';
            editScout(scoutId);
        } else if (action === 'delete') {
            deleteScout(scoutId, () => renderHistoryList());
        }
    };

    // ==== SCOUT SESSION SAVE ====
    function saveScoutSession() {
        const atleta = document.getElementById('scoutAtleta').value;
        const evento = document.getElementById('scoutEvento').value.trim();
        const resultadoLuta = document.getElementById('scoutLutaResult').value;

        if (!atleta) {
            alert("Por favor, selecione para qual atleta (ou adversário) você está fazendo este scout.");
            return;
        }

        if (!evento) {
            alert("Por favor, informe o nome do evento/competição.");
            return;
        }

        if (timelineEvents.length === 0) {
            alert("Não nenhuma ação na timeline. Cadastre movimentos antes de salvar o scout.");
            return;
        }

        if (editModeScoutId) {
            // Se estiver editando, podemos carregar os valores atuais se existirem
            const scout = db.lutasScout.find(s => String(s.id) === String(editModeScoutId));
            if (scout && scout.avaliacaoTreinador) {
                const form = document.getElementById('formAvaliacaoTreinador');
                for (let key in scout.avaliacaoTreinador) {
                    if (form[key]) form[key].value = scout.avaliacaoTreinador[key];
                }
            }
        } else {
            document.getElementById('formAvaliacaoTreinador').reset();
        }

        document.getElementById('modalAvaliacaoTreinador').classList.add('active');
    }

    window.closeModalAvaliacao = function () {
        document.getElementById('modalAvaliacaoTreinador').classList.remove('active');
    }

    // Armazena dados pendentes entre o modal de avaliação e o de observação
    let _pendingScoutData = null;

    window.confirmSaveWithAssessment = function (event) {
        if (event) event.preventDefault();

        const atleta = document.getElementById('scoutAtleta').value;
        const evento = document.getElementById('scoutEvento').value.trim();
        const resultadoLuta = document.getElementById('scoutLutaResult').value;
        const opponentName = document.getElementById('opponentNameInput') ? document.getElementById('opponentNameInput').value.trim() : '';

        const atletaFinal = atleta === 'adversario' ? (opponentName ? `Adversário (${opponentName})` : 'adversario') : parseInt(atleta);

        const form = document.getElementById('formAvaliacaoTreinador');
        const avaliacao = {
            velocidade: parseFloat(form.velocidade.value) || 0,
            forca: parseFloat(form.forca.value) || 0,
            tatica: parseFloat(form.tatica.value) || 0,
            defesa: parseFloat(form.defesa.value) || 0,
            variacao: parseFloat(form.variacao.value) || 0,
            precisao: parseFloat(form.precisao.value) || 0,
            obediencia: parseFloat(form.obediencia.value) || 0
        };

        _pendingScoutData = { atletaFinal, evento, resultadoLuta, avaliacao };

        closeModalAvaliacao();

        // Pré-preencher observação se estiver editando
        const obsEl = document.getElementById('inputObservacaoFinal');
        if (obsEl) {
            if (editModeScoutId) {
                const existing = db.lutasScout.find(s => String(s.id) === String(editModeScoutId));
                obsEl.value = (existing && existing.observacaoFinal) ? existing.observacaoFinal : '';
            } else {
                obsEl.value = '';
            }
        }

        document.getElementById('modalObservacaoFinal').classList.add('active');
    }

    window.closeModalObservacao = function () {
        document.getElementById('modalObservacaoFinal').classList.remove('active');
        if (_pendingScoutData) {
            // Pular observação — salva sem ela
            _doSaveScout('');
        }
    }

    window.confirmSaveWithObservacao = function () {
        const obs = (document.getElementById('inputObservacaoFinal').value || '').trim();
        document.getElementById('modalObservacaoFinal').classList.remove('active');
        _doSaveScout(obs);
    }

    function _doSaveScout(observacaoFinal) {
        if (!_pendingScoutData) return;
        const { atletaFinal, evento, resultadoLuta, avaliacao } = _pendingScoutData;
        _pendingScoutData = null;

        if (editModeScoutId) {
            const index = db.lutasScout.findIndex(s => String(s.id) === String(editModeScoutId));
            if (index !== -1) {
                db.lutasScout[index].atletaId = atletaFinal;
                db.lutasScout[index].evento = evento;
                db.lutasScout[index].resultadoLuta = resultadoLuta;
                db.lutasScout[index].rounds = [...roundsData];
                db.lutasScout[index].acoes = [...timelineEvents];
                db.lutasScout[index].avaliacaoTreinador = avaliacao;
                db.lutasScout[index].observacaoFinal = observacaoFinal;
                db.lutasScout[index].ultimaEdicao = new Date().toISOString();

                saveDB();
                showToast("Scout atualizado com sucesso!", "success");

                if (confirm("Deseja voltar para a visão geral ou continuar editando?")) {
                    window.location.href = 'scout-video.html';
                }
                return;
            }
        }

        const scoutObj = {
            id: Date.now(),
            dataRegistro: new Date().toISOString(),
            atletaId: atletaFinal,
            evento: evento,
            resultadoLuta: resultadoLuta,
            rounds: [...roundsData],
            acoes: [...timelineEvents],
            avaliacaoTreinador: avaliacao,
            observacaoFinal: observacaoFinal
        };

        db.lutasScout.push(scoutObj);
        saveDB();

        showToast("Scout salvo com sucesso!", "success");

        if (confirm("Deseja limpar o painel para iniciar um novo scout?")) {
            timelineEvents = [];
            roundsData = [];
            currentRound = 1;
            const roundDisp = document.getElementById('currentRoundDisplay');
            if (roundDisp) roundDisp.innerText = currentRound;

            const endBtnText = document.getElementById('btnEndRound');
            if (endBtnText) endBtnText.innerHTML = `<i class="ti ti-flag-3"></i> <span class="btn-label">Concluir R${currentRound}</span>`;

            renderTimeline();
            const _evEl = document.getElementById('scoutEvento'); if (_evEl) _evEl.value = '';
            const _rlEl = document.getElementById('scoutLutaResult'); if (_rlEl) _rlEl.value = '';
            const _formAv = document.getElementById('formAvaliacaoTreinador'); if (_formAv) _formAv.reset();
        }
    }

    // ==== TECHNIQUES MANAGEMENT ====
    window.removeTechnique = function (name) {
        customTechniques = customTechniques.filter(t => t !== name);
        localStorage.setItem('scout_techniques', JSON.stringify(customTechniques));
        renderTechniquesGrid();
        if (currentScoutState.tecnica === name) {
            currentScoutState.tecnica = null;
            updateSummaryPreview();
        }
    };

    function renderTechniquesGrid() {
        const container = document.getElementById('techniquesGrid');
        container.innerHTML = '';

        customTechniques.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'scout-opt-btn act-tecnica';
            btn.dataset.val = t;
            btn.dataset.group = 'tecnica';
            btn.style.cssText = 'flex: 1 1 calc(33.333% - 8px); position: relative; padding-right: 20px;';
            if (currentScoutState.tecnica === t) btn.classList.add('active');

            const label = document.createElement('span');
            label.textContent = t;
            btn.appendChild(label);

            const del = document.createElement('span');
            del.textContent = '×';
            del.title = 'Excluir';
            del.style.cssText = 'position:absolute;top:3px;right:5px;font-size:12px;opacity:0.45;line-height:1;cursor:pointer;';
            del.addEventListener('click', e => { e.stopPropagation(); window.removeTechnique(t); });
            btn.appendChild(del);

            container.appendChild(btn);
        });

        // Botão "+" para adicionar nova técnica inline
        const addBtn = document.createElement('button');
        addBtn.className = 'scout-opt-btn';
        addBtn.id = 'btnAddTechInGrid';
        addBtn.title = 'Adicionar técnica';
        addBtn.innerHTML = '<i class="ti ti-plus"></i>';
        addBtn.style.cssText = 'flex: 0 0 36px; width: 36px; padding: 0;';
        addBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (document.getElementById('inlineTechInput')) {
                document.getElementById('inlineTechInput').focus();
                return;
            }
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex;gap:4px;flex:1 1 140px;';

            const inp = document.createElement('input');
            inp.id = 'inlineTechInput';
            inp.type = 'text';
            inp.className = 'form-control';
            inp.placeholder = 'Nome da técnica';
            inp.style.cssText = 'font-size:12px;padding:4px 8px;flex:1;min-width:0;';

            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn btn-primary';
            saveBtn.style.cssText = 'padding:0 10px;';
            saveBtn.innerHTML = '<i class="ti ti-check"></i>';

            const doSave = () => {
                const val = inp.value.trim();
                if (val && !customTechniques.includes(val)) {
                    customTechniques.push(val);
                    localStorage.setItem('scout_techniques', JSON.stringify(customTechniques));
                }
                renderTechniquesGrid();
            };

            saveBtn.addEventListener('click', e2 => { e2.stopPropagation(); doSave(); });
            inp.addEventListener('keypress', e2 => { if (e2.key === 'Enter') doSave(); });
            inp.addEventListener('keydown', e2 => { if (e2.key === 'Escape') renderTechniquesGrid(); });

            wrapper.appendChild(inp);
            wrapper.appendChild(saveBtn);
            container.insertBefore(wrapper, addBtn);
            inp.focus();
        });

        container.appendChild(addBtn);
    }

    function renderSubAlvos(alvoSelecionado) {
        const container = document.getElementById('subAlvoContainer');
        const optionsDiv = document.getElementById('subAlvoOptions');

        optionsDiv.innerHTML = '';

        if (!alvoSelecionado) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        let subOptions = [];
        if (alvoSelecionado === 'Colete') {
            subOptions = ['Costas', 'Peito', 'Lateral Frontal', 'Lateral Traseira'];
        } else if (alvoSelecionado === 'Capacete') {
            subOptions = ['Nuca', 'Face', 'Laterais'];
        }

        subOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'scout-opt-btn act-subalvo';
            btn.dataset.val = opt;
            btn.dataset.group = 'subAlvo';
            btn.innerText = opt;
            btn.style.flex = "1 1 auto";
            btn.style.fontSize = "11px";
            btn.style.padding = "6px 8px";

            if (currentScoutState.subAlvo === opt) btn.classList.add('active');

            optionsDiv.appendChild(btn);
        });
    }

    function renderSubLocais(localSelecionado) {
        const container = document.getElementById('subLocalContainer');
        const optionsDiv = document.getElementById('subLocalOptions');

        optionsDiv.innerHTML = '';

        if (localSelecionado !== 'No Canto') {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        let subOptions = ['Pressionando', 'Pressionado'];

        subOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'scout-opt-btn act-sublocal';
            btn.dataset.val = opt;
            btn.dataset.group = 'subLocal';
            btn.innerText = opt;
            btn.style.flex = "1 1 auto";
            btn.style.fontSize = "11px";
            btn.style.padding = "6px 8px";

            if (currentScoutState.subLocal === opt) btn.classList.add('active');

            optionsDiv.appendChild(btn);
        });
    }

    function renderSubPernas(pernaSelecionada) {
        const container = document.getElementById('subPernaContainer');
        const optionsDiv = document.getElementById('subPernaOptions');

        optionsDiv.innerHTML = '';

        if (!pernaSelecionada) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        let subOptions = ['Frente', 'Trás'];

        subOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'scout-opt-btn act-subperna';
            btn.dataset.val = opt;
            btn.dataset.group = 'subPerna';
            btn.innerText = opt;
            btn.style.flex = "1 1 auto";
            btn.style.fontSize = "11px";
            btn.style.padding = "6px 8px";

            if (currentScoutState.subPerna === opt) btn.classList.add('active');

            optionsDiv.appendChild(btn);
        });
    }

    // ==== VIDEO PLAYER MANAGEMENT ====
    function setVideoSource(type, btnTarget) {
        currentVideoType = type;

        // Update tabs
        document.querySelectorAll('.source-toggle .btn').forEach(b => b.classList.remove('active'));
        btnTarget.classList.add('active');

        // Update UI
        if (type === 'youtube') {
            document.getElementById('youtubeLoader').style.display = 'flex';
            document.getElementById('youtubePlayer').style.display = 'block';
            document.getElementById('localLoader').style.display = 'none';
            document.getElementById('localPlayer').style.display = 'none';
            if (localPlayer) localPlayer.pause();
        } else {
            document.getElementById('youtubeLoader').style.display = 'none';
            document.getElementById('youtubePlayer').style.display = 'none';
            document.getElementById('localLoader').style.display = 'flex';
            document.getElementById('localPlayer').style.display = 'block';
            if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
        }
    }

    // YouTube API Callback (Global)
    window.onYouTubeIframeAPIReady = function () {
        window.YT_Ready = true;
    };

    function initPlayerListeners() {
        // Load YouTube Note: Uses iframe API
        document.getElementById('btnLoadYoutube').addEventListener('click', () => {
            if (!window.YT_Ready) {
                // If the script loaded but the ready event didn't fire, try to force it if YT object exists
                if (window.YT && window.YT.Player) {
                    window.YT_Ready = true;
                } else {
                    alert("Aguarde a API do YouTube carregar.");
                    return;
                }
            }

            let url = document.getElementById('youtubeLink').value.trim();
            let videoId = extractYouTubeId(url);
            if (!videoId) {
                alert("URL do YouTube inválida.");
                return;
            }

            // Ocultar overlay se estivesse visvel
            document.getElementById('youtubeErrorOverlay').style.display = 'none';

            if (ytPlayer) {
                // If it already exists, destroy to ensure a clean slate, avoiding state bugs on new loads
                ytPlayer.destroy();
                ytPlayer = null;
            }

            // O YouTube IFrame API falha no file:// origin. Vamos forar o origin e o widget_referrer
            // para o host atual ou um genrico
            let originUrl = 'http://localhost';
            if (window.location.protocol.startsWith('http')) {
                originUrl = window.location.origin;
            }

            // A documentao do YouTube recomenda instanciar o player e deixar a API criar o iframe
            ytPlayer = new YT.Player('youtubePlayer', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                host: 'https://www.youtube-nocookie.com',
                playerVars: {
                    'playsinline': 1,
                    'origin': originUrl,
                    'widget_referrer': originUrl,
                    'enablejsapi': 1,
                    'rel': 0
                },
                events: {
                    'onError': function (event) {
                        if (event.data === 150 || event.data === 101) {
                            document.getElementById('youtubeErrorOverlay').style.display = 'flex';
                        } else if (event.data === 153) {
                            // FALLBACK PUSH: Erro 153 (Browser bloqueando referrer da API).
                            // Removemos a API controlada e criamos um iframe burro (embed puro).
                            // Perdemos o auto-timestamp (terque digitar manual no futuro se quiser), mas o vdeo toca.
                            if (ytPlayer) {
                                ytPlayer.destroy();
                                ytPlayer = null;
                            }
                            const wrapper = document.querySelector('.player-wrapper');
                            // Limpa qualquer overlay ou iframe sobrando
                            const oldIframe = document.getElementById('youtubePlayer');
                            if (oldIframe) oldIframe.remove();

                            const fallbackIframe = document.createElement('iframe');
                            fallbackIframe.id = 'youtubePlayer';
                            fallbackIframe.style.width = '100%';
                            fallbackIframe.style.height = '100%';
                            fallbackIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
                            fallbackIframe.setAttribute('frameborder', '0');
                            fallbackIframe.setAttribute('allowfullscreen', 'true');
                            fallbackIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
                            // Inserir de volta
                            const localPlayerNode = document.getElementById('localPlayer');
                            if (wrapper && localPlayerNode) {
                                wrapper.insertBefore(fallbackIframe, localPlayerNode);
                            }

                            // Avisamos o usurio que estamos no fallback
                            console.warn("YouTube API bloqueada (Erro 153). Aplicando Fallback Embed.");

                        } else if (event.data === 2) {
                            alert("Erro 2 (YouTube): O ID do vdeo invlido.");
                        } else if (event.data === 5) {
                            alert("Erro 5 (YouTube): Houve um erro no player.");
                        } else {
                            alert("Erro desconhecido do YouTube: " + event.data);
                        }
                    }
                }
            });
        });

        // Load Local Video
        document.getElementById('localVideoFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const fileURL = URL.createObjectURL(file);
            localPlayer.src = fileURL;
            localPlayer.load();
        });
    }

    function extractYouTubeId(url) {
        let match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|shorts\/)([^"&?\/\s]{11})/i);
        return match ? match[1] : null;
    }

    function getCurrentVideoTime() {
        if (currentVideoType === 'youtube' && ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
            return ytPlayer.getCurrentTime();
        } else if (currentVideoType === 'local' && localPlayer) {
            return localPlayer.currentTime;
        }
        return 0;
    }

    function seekToTime(time) {
        if (currentVideoType === 'youtube' && ytPlayer && typeof ytPlayer.seekTo === 'function') {
            ytPlayer.seekTo(time, true);
        } else if (currentVideoType === 'local' && localPlayer) {
            localPlayer.currentTime = time;
            localPlayer.play().catch(e => console.log(e));
        }
    }

    function formatTime(seconds) {
        let min = Math.floor(seconds / 60);
        let sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    function updateTimeDisplay() {
        lastKnownTime = getCurrentVideoTime();
        const fTime = formatTime(lastKnownTime);
        const curDisp = document.getElementById('currentTimeDisplay');
        if (curDisp) curDisp.innerText = fTime;
    }

    // ==== SCOUTING & TIMELINE ====
    function updateSummaryPreview() {
        const btnReg = document.getElementById('btnRegisterEvent');

        let parts = [];
        if (currentScoutState.acao) parts.push(currentScoutState.acao);
        if (currentScoutState.tecnica) parts.push(currentScoutState.tecnica);

        let alvoLabel = currentScoutState.alvo || "";
        if (alvoLabel && currentScoutState.subAlvo) {
            alvoLabel += ` (${currentScoutState.subAlvo})`;
        }
        if (alvoLabel) parts.push(`[${alvoLabel}]`);

        let localLabel = currentScoutState.local || "";
        if (localLabel === 'No Canto' && currentScoutState.subLocal) {
            localLabel += ` - ${currentScoutState.subLocal}`;
        }
        if (localLabel) parts.push(`@ ${localLabel}`);

        // Check if there is enough to be valid (at least Ação is required)
        if (currentScoutState.acao) {
            btnReg.disabled = false;
        } else {
            btnReg.disabled = true;
        }

        let fullStr = Object.values(currentScoutState).filter(x => x).join(' - ');
        if (!fullStr) fullStr = "Nenhuma ao selecionada...";

        document.getElementById('currentSummary').innerText = fullStr;
    }

    function registerTimelineEvent() {
        if (!currentScoutState.acao) return;

        let finalTime = lastKnownTime;
        const manualTimeStr = document.getElementById('manualTimeInput').value.trim();

        if (manualTimeStr) {
            // Parse MM:SS or SS
            let parts = manualTimeStr.split(':');
            if (parts.length === 2) {
                let m = parseInt(parts[0]) || 0;
                let s = parseInt(parts[1]) || 0;
                finalTime = (m * 60) + s;
            } else if (parts.length === 1) {
                finalTime = parseInt(parts[0]) || 0;
            }
        }

        // Build obj
        const ev = {
            id: Date.now(),
            time: finalTime,
            formattedTime: formatTime(finalTime),
            round: currentRound,
            ...currentScoutState
        };

        timelineEvents.push(ev);

        // Sort events chronologically
        timelineEvents.sort((a, b) => a.time - b.time);

        // Clear State
        currentScoutState = {
            acao: null, tipoAcao: null, descFalta: "", resultado: null, pontos: null, alvo: null, subAlvo: null, distancia: null, perna: null, subPerna: null, base: null, local: null, subLocal: null, tecnica: null, obsTecnica: ""
        };
        // Reset UI Buttons & Inputs
        document.querySelectorAll('.scout-opt-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('obsTecnica').value = '';
        document.getElementById('manualTimeInput').value = '';
        document.getElementById('faltaDescInput').value = '';
        document.getElementById('faltaDescContainer').style.display = 'none';
        document.getElementById('pontosContainer').style.display = 'none';
        renderSubAlvos(null);
        renderSubLocais(null);
        renderSubPernas(null);
        updateSummaryPreview();

        // Re-render
        renderTimeline();
    }

    window.jumpToEvent = function (timeSecs) {
        seekToTime(timeSecs - 2 > 0 ? timeSecs - 2 : 0); // Jump 2 secs before action
    }

    function renderTimeline() {
        const list = document.getElementById('timelineList');
        const countBadge = document.getElementById('eventCount');

        if (timelineEvents.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="ti ti-timeline"></i>
                    <p>Nenhum evento registrado ainda.</p>
                    <p style="font-size: 11px;">Comece a adicionar ações no painel central.</p>
                </div>`;
            countBadge.innerText = "0";
            return;
        }

        list.innerHTML = '';
        countBadge.innerText = timelineEvents.length.toString();

        // Group by round
        const rounds = {};
        timelineEvents.forEach(ev => {
            const r = ev.round || 1;
            if (!rounds[r]) rounds[r] = [];
            rounds[r].push(ev);
        });

        Object.keys(rounds).sort((a, b) => a - b).forEach(rKey => {
            const rEvents = rounds[rKey];

            // Round Header — compact vertical separator for horizontal layout
            const header = document.createElement('div');
            header.className = 'round-header-timeline';
            const rResult = roundsData.find(rd => rd.round === parseInt(rKey))?.result || 'em andamento';
            header.innerHTML = `
                <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">R${rKey}</span>
                <span style="font-size: 9px; opacity: 0.6; text-transform: uppercase;">${rResult}</span>
            `;
            list.appendChild(header);

            rEvents.forEach(ev => {
                if (ev.isDivider) return;

                const el = document.createElement('div');
                el.className = 'timeline-item';

                // Color and Label based on act
                const isOffensive = ev.acao === 'Ataque Feito';
                const isFalta = ev.acao?.includes('Falta');
                const badgeColor = isOffensive ? 'var(--green)' : isFalta ? 'var(--yellow)' : 'var(--red)';
                const badgeLabel = isOffensive ? 'ATQ' : isFalta ? 'FLT' : 'DEF';

                // Construct details string
                let detailsArr = [];
                if (ev.tecnica) {
                    let tecStr = ev.tecnica;
                    if (ev.obsTecnica) tecStr += ` (${ev.obsTecnica})`;
                    detailsArr.push(tecStr);
                }
                if (ev.alvo) {
                    let alvoStr = ev.alvo;
                    if (ev.subAlvo) alvoStr += ` (${ev.subAlvo})`;
                    detailsArr.push(alvoStr);
                }
                if (ev.perna) {
                    let pernaStr = ev.perna;
                    if (ev.subPerna) pernaStr += ` (${ev.subPerna})`;
                    detailsArr.push(pernaStr);
                }
                if (ev.base) detailsArr.push(`Base ${ev.base}`);
                if (ev.local) {
                    let locStr = ev.local;
                    if (ev.subLocal) locStr += ` (${ev.subLocal})`;
                    detailsArr.push(locStr);
                }

                const resIcon = ev.resultado === 'Com ponto' ? '✓' : ev.resultado === 'Sem ponto' ? '✗' : '';
                const resColor = ev.resultado === 'Com ponto' ? 'var(--green)' : 'var(--text-muted)';

                el.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                        <div class="timeline-time" onclick="jumpToEvent(${ev.time})" style="cursor: pointer;">${ev.formattedTime}</div>
                        <span style="font-size: 9px; font-weight: 800; padding: 2px 4px; border-radius: 3px; background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44;">${badgeLabel}</span>
                        ${resIcon ? `<span style="color: ${resColor}; font-weight: 700; font-size: 13px;">${resIcon}</span>` : ''}
                    </div>
                    <div class="timeline-content" onclick="jumpToEvent(${ev.time})" style="cursor: pointer;">
                        <div class="timeline-primary-action">${ev.acao || 'Ação'}</div>
                        <div class="timeline-details">${detailsArr.join(' · ')}</div>
                    </div>
                    <div class="timeline-actions">
                        <button class="btn-action btn-edit" title="Editar" onclick="editEvent(${ev.id})"><i class="ti ti-edit"></i></button>
                        <button class="btn-action btn-delete" title="Excluir" onclick="deleteEvent(${ev.id})"><i class="ti ti-trash"></i></button>
                    </div>
                `;
                list.appendChild(el);
            });
        });

        // Scroll list to the right (newest events)
        list.scrollLeft = list.scrollWidth;
    }


    window.deleteEvent = function (id) {
        if (!confirm('Deseja realmente excluir esta ação?')) return;
        timelineEvents = timelineEvents.filter(e => e.id !== id);
        renderTimeline();
    }

    window.editEvent = function (id) {
        const evIndex = timelineEvents.findIndex(e => e.id === id);
        if (evIndex === -1) return;

        const ev = timelineEvents[evIndex];

        // Remove from timeline to "load" into panel
        timelineEvents.splice(evIndex, 1);
        renderTimeline();

        currentScoutState = { ...ev };
        delete currentScoutState.id;
        delete currentScoutState.time;
        delete currentScoutState.formattedTime;

        // Populate inputs
        document.getElementById('obsTecnica').value = currentScoutState.obsTecnica || '';

        // Format time to MM:SS or S for manual input box
        const m = Math.floor(ev.time / 60);
        const s = Math.floor(ev.time % 60).toString().padStart(2, '0');
        document.getElementById('manualTimeInput').value = m > 0 ? `${m}:${s}` : s;

        // Reset all buttons then activate the matching ones
        document.querySelectorAll('.scout-opt-btn').forEach(btn => {
            btn.classList.remove('active');
            const group = btn.dataset.group;
            const val = btn.dataset.val;
            if (group && currentScoutState[group] === val) {
                btn.classList.add('active');
            }
        });

        // Re-render sub options
        renderSubAlvos(currentScoutState.alvo);
        renderSubLocais(currentScoutState.local);

        updateSummaryPreview();
    }
});

