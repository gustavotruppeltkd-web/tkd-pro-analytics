        // -- INIT --
        const params = new URLSearchParams(location.search);
        const atletaId = parseInt(params.get('atleta') || localStorage.getItem('tkd_atleta_id') || '0');
        const nowLocal = new Date();
        const today = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;

        const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const FULL_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];



        function showToast(msg, type = 'ok') {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.className = type === 'error' ? 'error' : '';
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }

        function toggleAccordion(id) {
            document.getElementById(id).classList.toggle('open');
        }

        let atleta = null; // Defined globally to be accessed by all functions
        let radarChartObj = null;
        let activeQId = null;

        let portalLoaded = false;
        function loadPortal() {
            if (portalLoaded) return;
            // Wait for app.js to populate the global db
            if (!window.db || Object.keys(window.db).length === 0) {
                // If window.db is not set by app.js yet, try to load it from localStorage
                const stored = localStorage.getItem('tkd_scout_db');
                if (stored) {
                    window.db = JSON.parse(stored);
                } else {
                    console.log('Database not ready yet...');
                    return;
                }
            }

            // Use the global db
            atleta = (window.db.alunos || []).find(a => String(a.id) === String(atletaId));

            if (!atleta) {
                document.getElementById('heroName').textContent = 'Portal do Atleta';
                document.getElementById('heroFaixa').textContent = 'Selecione um atleta no login';
                document.getElementById('heroAvatar').src = DEFAULT_AVATAR;
                // Show placeholders for sections that require athlete data
                renderRadar();
                renderCompetitions();
                renderMedals();
                renderTreino();
                renderSchedule();
                renderQSelector();
                renderCalendarSummary();
                return;
            }

            // Update Hero
            document.getElementById('heroName').textContent = atleta.nome;
            document.getElementById('heroFaixa').textContent = atleta.faixa || 'Sem graduação';
            document.getElementById('heroAvatar').src = atleta.avatar || atleta.foto || DEFAULT_AVATAR;
            const now = new Date();
            document.getElementById('heroDate').innerHTML =
                `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}<br>
       <span style="color:var(--muted);font-size:11px;">${FULL_MESES[now.getMonth()]}</span>`;

            renderRadar();
            // renderCompetitions(); (removido)
            renderMedals();
            renderTreino();
            renderSchedule();
            renderQSelector();
            renderCalendarSummary(); // Added here

            initWellnessButtons();
            checkWellnessDone();
            checkPseDone();
            portalLoaded = true;
        }

        window.onDataLoaded = null; // disabled — portal manages its own fetch

        // -- RADAR --
        function renderRadar() {
            if (radarChartObj) { radarChartObj.destroy(); radarChartObj = null; }
            const scouts = (window.db.lutasScout || []).filter(s => s.atletaId === atletaId && s.avaliacaoTreinador);
            const ctx = document.getElementById('radarChart').getContext('2d');

            let dataArr;
            if (scouts.length > 0) {
                const keys = ['velocidade', 'forca', 'tatica', 'defesa', 'variacao', 'precisao', 'obediencia'];
                const sums = keys.reduce((acc, k) => ({ ...acc, [k]: 0 }), {});
                scouts.forEach(s => keys.forEach(k => sums[k] += (s.avaliacaoTreinador[k] || 0)));
                dataArr = keys.map(k => (sums[k] / scouts.length) * 10); // 0-10 -> 0-100
                document.getElementById('radarEmpty').style.display = 'none';
                document.getElementById('radarChart').style.display = '';
            } else {
                dataArr = [0, 0, 0, 0, 0, 0, 0];
                document.getElementById('radarEmpty').style.display = 'block';
                document.getElementById('radarChart').style.display = 'none';
                return;
            }

            Chart.defaults.color = '#64748b';
            Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';

            radarChartObj = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Velocidade', 'Força', 'Tática', 'Defesa', 'Variação', 'Precisão', 'Obediência'],
                    datasets: [{
                        label: 'Desempenho',
                        data: dataArr,
                        backgroundColor: 'rgba(65,105,225,0.2)',
                        borderColor: 'rgba(65,105,225,0.9)',
                        pointBackgroundColor: '#4169e1',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#4169e1',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false, stepSize: 25 },
                            grid: { color: 'rgba(255,255,255,0.07)' },
                            angleLines: { color: 'rgba(255,255,255,0.06)' },
                            pointLabels: { font: { size: 11, weight: '600' }, color: '#94a3b8' }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // ÔöÇÔöÇ COMPETITIONS ÔöÇÔöÇ
        function renderCompetitions() {
            // Removido a pedido do usuário: O painel de competições foi removido do HTML.
        }

        // ÔöÇÔöÇ MEDALS ÔöÇÔöÇ
        function renderMedals() {
            // Busca nas duas fontes: db.competicoes (legado) e db.eventos[].participantes (atual)
            const medalColocacoes = ['Ouro', 'Prata', 'Bronze'];
            const allMedals = [];

            // Fonte 1: db.competicoes (legado)
            (window.db.competicoes || []).forEach(c => {
                if (c.atletaId === atletaId && medalColocacoes.includes(c.colocacao)) {
                    allMedals.push({ colocacao: c.colocacao, nomeEvento: c.nomeEvento || 'Competição', data: c.data, categoria: c.categoria || '' });
                }
            });

            // Fonte 2: db.eventos[].participantes (onde o treinador registra os resultados)
            (window.db.eventos || []).forEach(ev => {
                const part = (ev.participantes || []).find(p => p.atletaId === atletaId);
                if (part && medalColocacoes.includes(part.colocacao)) {
                    allMedals.push({ colocacao: part.colocacao, nomeEvento: ev.titulo || ev.nome || 'Competição', data: ev.data || '', categoria: ev.categoria || '' });
                }
            });

            allMedals.sort((a, b) => b.data.localeCompare(a.data));

            const total = allMedals.length;
            const ouros = allMedals.filter(c => c.colocacao === 'Ouro').length;
            const pratas = allMedals.filter(c => c.colocacao === 'Prata').length;
            const bronzes = allMedals.filter(c => c.colocacao === 'Bronze').length;

            const medalEl = document.getElementById('medalSubtitle');
            if (total === 0) {
                medalEl.textContent = 'Nenhuma ainda';
            } else {
                medalEl.innerHTML = `
                    <span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;color:#FFD700;font-size:15px;font-weight:700;"><i class="ti ti-medal"></i>${ouros}</span>
                    <span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;color:#C0C0C0;font-size:15px;font-weight:700;"><i class="ti ti-medal"></i>${pratas}</span>
                    <span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;color:#CD7F32;font-size:15px;font-weight:700;"><i class="ti ti-medal"></i>${bronzes}</span>
                    <span style="font-size:11px;color:var(--text-muted);">Total: ${total}</span>
                `;
            }

            if (total === 0) {
                document.getElementById('medalsContent').innerHTML =
                    `<div class="empty-state"><i class="ti ti-medal-off"></i>Nenhuma medalha registrada ainda. Continue treinando!</div>`;
                return;
            }

            const html = allMedals.map(c => {
                const cls = c.colocacao === 'Ouro' ? 'ouro' : c.colocacao === 'Prata' ? 'prata' : 'bronze';
                const icon = c.colocacao === 'Ouro' ? '­ƒÑç' : c.colocacao === 'Prata' ? '­ƒÑê' : '­ƒÑë';
                return `
      <div class="medal-chip ${cls}">
        <span class="icon">${icon}</span>
        <div class="info">
          <div class="event">${c.nomeEvento}</div>
          <div class="cat">${c.categoria ? c.categoria + ' ┬À ' : ''}${c.data ? formatarDataBR(c.data) : ''}</div>
        </div>
      </div>`;
            }).join('');

            document.getElementById('medalsContent').innerHTML =
                `<div class="medals-grid">${html}</div>`;
        }

        // ÔöÇÔöÇ TREINO ÔöÇÔöÇ
        function renderTreino() {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            document.getElementById('treinoDateLabel').textContent =
                `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

            const el = document.getElementById('treinoContent');
            if (!atleta) {
                el.innerHTML = `<div class="empty-state"><i class="ti ti-user-exclamation"></i>Atleta não identificado.</div>`;
                return;
            }

            // Debug info (hidden or small)
            console.log("Rendering Treino for Today:", todayStr, "Athlete Turma:", atleta.turmaId);
            const rawTreinos = window.db.treinos || [];

            const treinos = rawTreinos.filter(t => {
                const dateMatch = String(t.data || '').trim().substring(0, 10) === todayStr;
                const turmaMatch = !t.turmaId ||
                    !atleta.turmaId ||
                    String(t.turmaId) === String(atleta.turmaId) ||
                    t.turmaId === 'todas';
                return dateMatch && turmaMatch;
            });

            if (treinos.length === 0) {
                // Se não houver treino, vamos tentar ver se existe algum treino geral ou erro de data
                const anyToday = rawTreinos.filter(t => t.data === todayStr);
                const debugSufix = anyToday.length > 0 ? `<br><small style="opacity:0.5; font-size:9px;">(Existem ${anyToday.length} treinos hoje, mas em outras turmas)</small>` : "";

                el.innerHTML = `<div class="empty-state">
                    <i class="ti ti-moon"></i>
                    Sem treinos registrados para hoje.
                    ${debugSufix}
                </div>`;
                return;
            }

            el.innerHTML = treinos.map(t => {
                const protecao = t.protecao || 'sim';
                const protecaoLabel = protecao === 'sim' ? 'Com Proteção' : 'Sem Proteção';
                const badgeClass = protecao === 'sim' ? 'prot-sim' : 'prot-nao';
                const horario = t.horario || '--:--';

                return `
                <div class="treino-block" style="cursor: pointer; transition: 0.2s;" onclick="openTreinoModal('${t.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                        <div class="treino-tipo" style="font-size: 13px;">${t.titulo || t.tipo || 'Treino'}</div>
                        <i class="ti ti-external-link" style="color: var(--text-muted); font-size: 14px;"></i>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                        <span class="view-tipo-badge ${badgeClass}" style="font-size: 10px; padding: 4px 10px; border:none;">${protecaoLabel}</span>
                        <div class="treino-meta" style="margin-top: 0; font-size: 12px;"><i class="ti ti-clock"></i> ${horario}</div>
                    </div>
                </div>`;
            }).join('');
        }

        // ÔöÇÔöÇ SCHEDULE ÔöÇÔöÇ
        function renderSchedule() {
            const eventos = (window.db.eventos || [])
                .filter(e => e.data >= today)
                .sort((a, b) => a.data.localeCompare(b.data))
                .slice(0, 8);

            const el = document.getElementById('scheduleContent');

            if (eventos.length === 0) {
                el.innerHTML = `<div class="empty-state"><i class="ti ti-calendar-off"></i>Nenhum evento programado.</div>`;
                return;
            }

            const items = eventos.map((e, i) => {
                const d = new Date(e.data + 'T12:00:00');
                const isNext = i === 0;
                const type = (e.tipo || '').toLowerCase();
                const icon = type.includes('comp') ? '­ƒÅå' : type.includes('feria') || type.includes('recesso') ? '­ƒî┤' : type.includes('teste') ? '­ƒôè' : '­ƒôà';
                return `
      <div class="tl-item">
        <div class="tl-dot ${isNext ? 'next' : ''}">${icon}</div>
        <div class="tl-content">
          <div class="tl-title">${e.titulo || e.nome || 'Evento'}</div>
          <div class="tl-date">${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}</div>
        </div>
      </div>`;
            }).join('');

            el.innerHTML = `<div class="timeline">${items}</div>`;
        }

        // ÔöÇÔöÇ CALENDAR SUMMARY ÔöÇÔöÇ
        function renderCalendarSummary() {
            if (!atleta) return;

            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();

            const firstDayIndex = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthName = MESES[month] || '';

            const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
            const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

            // Treinos for the month
            let treinoDays = new Set();
            if (atleta.turmaId) {
                const treinosList = (window.db.treinos || []).filter(t => {
                    const tData = String(t.data || '').trim().substring(0, 10);
                    return tData >= startOfMonth && tData <= endOfMonth &&
                        (!t.turmaId || String(t.turmaId) == String(atleta.turmaId) || t.turmaId === 'todas');
                });
                treinoDays = new Set(treinosList.map(t => new Date(t.data + 'T12:00:00').getDate()));
            }

            let html = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <span style="color: #fff; font-weight: 700; font-size: 14px; text-transform: capitalize;">${monthName} de ${year}</span>
                </div>
                <div class="cal-header-row">
                    <div class="cal-header-day">D</div>
                    <div class="cal-header-day">S</div>
                    <div class="cal-header-day">T</div>
                    <div class="cal-header-day">Q</div>
                    <div class="cal-header-day">Q</div>
                    <div class="cal-header-day">S</div>
                    <div class="cal-header-day">S</div>
                </div>
                <div class="cal-grid">
            `;

            // Blanks for first day
            for (let i = 0; i < firstDayIndex; i++) {
                html += `<div class="cal-day empty"></div>`;
            }

            // Days
            const todayDate = new Date().getDate();
            const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;

            for (let i = 1; i <= daysInMonth; i++) {
                const isToday = isCurrentMonth && i === todayDate;
                let classes = 'cal-day';
                if (isToday) classes += ' today';

                html += `<div class="${classes}">${i}</div>`;
            }

            html += `</div>`;
            document.getElementById('calendarContent').innerHTML = html;
        }

        // ÔöÇÔöÇ QUESTIONNAIRES ÔöÇÔöÇ
        function renderQSelector() {
            const ativos = (window.db.questionarios || []).filter(q => q.ativo !== false);
            const sel = document.getElementById('qSelector');

            // Limpa antes de repopular para evitar duplicatas
            sel.innerHTML = '';

            if (ativos.length === 0) {
                sel.style.display = 'none';
                document.getElementById('qFormContent').innerHTML =
                    `<div class="empty-state"><i class="ti ti-clipboard-off"></i>Nenhum questionário disponível.</div>`;
                return;
            }

            sel.style.display = '';
            ativos.forEach(q => {
                const opt = document.createElement('option');
                opt.value = q.id;
                opt.textContent = q.titulo;
                sel.appendChild(opt);
            });
        }

        function loadSelectedQ() {
            const qId = parseInt(document.getElementById('qSelector').value);
            if (!qId) { document.getElementById('qFormContent').innerHTML = ''; return; }
            activeQId = qId;
            const q = (window.db.questionarios || []).find(x => x.id === qId);
            const content = document.getElementById('qFormContent');

            const resp = (window.db.respostas || []).find(r =>
                r.questionarioId === qId && r.atletaId === atletaId && r.data === today);

            if (resp) {
                content.innerHTML = `
                    <div class="already-done" style="flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                            <span style="color: var(--green); font-weight: 700;"><i class="ti ti-circle-check"></i> Respondido hoje!</span>
                            <button class="btn-icon" style="color: var(--blue); border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 8px; border-radius: 6px;" onclick="editQ(${resp.id})"><i class="ti ti-edit"></i> Editar</button>
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
                            Seu treinador já recebeu suas respostas. Caso tenha enviado algo errado, você pode clicar em <b>Editar</b> para corrigir agora.
                        </div>
                    </div>
                `;
                return;
            }

            let html = '';
            q.perguntas.forEach((p, i) => {
                let inputHtml = '';
                switch (p.tipo) {
                    case 'escala_5':
                        inputHtml = `
            <div class="q-range-label"><span>1: Pior</span><span>5: Melhor</span></div>
            ${renderScaleButtons(1, 5, 3, `q_${p.id}`)}`;
                        break;
                    case 'escala_10':
                        inputHtml = `
            <div class="q-range-label"><span>1: Mínimo</span><span>10: Máximo</span></div>
            ${renderScaleButtons(1, 10, 5, `q_${p.id}`)}`;
                        break;
                    case 'status':
                        inputHtml = `
            <div class="status-options">
              <input type="hidden" name="q_${p.id}" id="qi_${p.id}">
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','Ruim')">Ruim</div>
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','MÚdio')">MÚdio</div>
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','Bom')">Bom</div>
            </div>`;
                        break;
                    case 'sim_nao':
                        inputHtml = `
            <div class="status-options">
              <input type="hidden" name="q_${p.id}" id="qi_${p.id}">
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','NÒo')">NÒo</div>
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','Sim')">Sim</div>
            </div>`;
                        break;
                    default:
                        inputHtml = `<textarea name="q_${p.id}" class="form-control" rows="3" placeholder="Digite sua resposta..."></textarea>`;
                }
                html += `<div class="question-block">
        <div class="question-text">${i + 1}. ${p.texto}</div>
        ${inputHtml}
      </div>`;
            });

            html += `<button class="btn-submit" onclick="saveQ()"><i class="ti ti-send"></i> Enviar Respostas</button>`;
            content.innerHTML = html;
        }

        function qRangeColor(val, max) {
            const pct = (parseInt(val) - 1) / (max - 1);
            if (pct <= 0.25) return 'var(--red)';
            if (pct <= 0.5) return '#f97316';
            if (pct <= 0.75) return 'var(--yellow)';
            return 'var(--green)';
        }

        function selStatusQ(el, inputId, val) {
            el.parentElement.querySelectorAll('.status-btn').forEach(b => b.classList.remove('selected'));
            el.classList.add('selected');
            document.getElementById(inputId).value = val;
        }

        function saveQ() {
            const q = (window.db.questionarios || []).find(x => x.id === activeQId);
            if (!q) return;
            const area = document.getElementById('qFormContent');
            const respostasVal = {};
            q.perguntas.forEach(p => {
                const range = area.querySelector(`input[name="q_${p.id}"][type="range"]`);
                const hidden = area.querySelector(`input[name="q_${p.id}"][type="hidden"]`);
                const ta = area.querySelector(`textarea[name="q_${p.id}"]`);
                if (range) respostasVal[p.id] = range.value;
                else if (hidden) respostasVal[p.id] = hidden.value;
                else if (ta) respostasVal[p.id] = ta.value;
            });
            if (!window.db.respostas) window.db.respostas = [];
            window.db.respostas.push({ id: Date.now(), atletaId, questionarioId: activeQId, data: today, respostas: respostasVal });
            saveDB();
            showToast('Respostas enviadas!');
            loadSelectedQ();
        }

        function editQ(respId) {
            const resp = (window.db.respostas || []).find(r => r.id === respId);
            if (!resp) return;

            window.db.respostas = (window.db.respostas || []).filter(r => r.id !== respId);
            loadSelectedQ();

            setTimeout(() => {
                const area = document.getElementById('qFormContent');
                for (const [pId, val] of Object.entries(resp.respostas)) {
                    // 1. Check scale buttons
                    const scaleBtn = area.querySelector(`.choice-btn[onclick*="q_${pId}'"][onclick*=", ${val})"]`);
                    if (scaleBtn) scaleBtn.click();

                    // 2. Check status buttons
                    const statusBtn = area.querySelector(`.status-btn[onclick*="'qi_${pId}'"][onclick*="'${val}'"]`);
                    if (statusBtn) statusBtn.click();

                    // 3. Check textareas
                    const ta = area.querySelector(`textarea[name="q_${pId}"]`);
                    if (ta) ta.value = val;
                }
            }, 50);

            showToast("Editando respostas...");
        }

        // ÔöÇÔöÇ WELLNESS ÔöÇÔöÇ
        function getWellnessColor(val, max) {
            const pct = (parseInt(val) - 1) / (max - 1 || 1);
            if (pct <= 0.25) return 'var(--red)';
            if (pct <= 0.5) return '#f97316';
            if (pct <= 0.75) return 'var(--yellow)';
            return 'var(--green)';
        }

        function selWellness(el, key, val) {
            const parent = el.parentElement;
            parent.querySelectorAll('.choice-btn').forEach(btn => {
                btn.classList.remove('selected');
                btn.style.background = '';
                btn.style.boxShadow = '';
                btn.style.borderColor = '';
            });
            el.classList.add('selected');
            const color = el.style.getPropertyValue('--c');
            el.style.background = color;
            el.style.borderColor = color;
            el.style.boxShadow = `0 4px 12px ${color}66`;

            const inputId = 'sl' + key.charAt(0).toUpperCase() + key.slice(1);
            const input = document.getElementById(inputId);
            if (input) input.value = val;
        }

        function selPSEBtn(el, val) {
            const parent = el.parentElement;
            parent.querySelectorAll('.choice-btn').forEach(btn => {
                btn.classList.remove('selected');
                btn.style.background = '';
                btn.style.boxShadow = '';
                btn.style.borderColor = '';
            });
            el.classList.add('selected');
            const color = el.style.getPropertyValue('--c');
            el.style.background = color;
            el.style.borderColor = color;
            el.style.boxShadow = `0 4px 12px ${color}66`;

            document.getElementById('slPSE').value = val;
            updateCargaDisplay();
        }

        function initWellnessButtons() {
            ['sono', 'alim', 'humor', 'estresse', 'dor', 'fadiga'].forEach(key => {
                const inp = document.getElementById('sl' + key.charAt(0).toUpperCase() + key.slice(1));
                if (!inp) return;
                const val = inp.value;
                const btn = document.querySelector(`#group-${key} .choice-btn[data-val="${val}"]`);
                if (btn) selWellness(btn, key, val);
            });
            const pseVal = document.getElementById('slPSE').value;
            const pseBtn = document.querySelector(`#group-pse .choice-btn[data-val="${pseVal}"]`);
            if (pseBtn) selPSEBtn(pseBtn, pseVal);
        }

        function checkWellnessDone() {
            const log = (window.db.wellnessLogs || []).find(w => String(w.atletaId) === String(atletaId) && w.data === today);

            const msgEl = document.getElementById('wellnessDoneMsg');
            const formEl = document.getElementById('wellnessForm');

            if (log) {
                msgEl.style.display = 'block';
                formEl.style.display = 'none';

                // Show summary of values
                msgEl.innerHTML = `
                    <div style="width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-weight: 700; color: var(--green);"><i class="ti ti-check"></i> Wellness registrado!</span>
                            <button class="btn-icon" style="color: var(--blue); border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 8px; border-radius: 6px;" onclick="editWellness()"><i class="ti ti-edit"></i> Editar</button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 11px; color: var(--text-muted); text-align: center;">
                            <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">Sono: <b style="color:#fff">${log.sono}</b></div>
                            <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">Estresse: <b style="color:#fff">${log.estresse}</b></div>
                            <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">Dor: <b style="color:#fff">${log.dor}</b></div>
                            <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">Humor: <b style="color:#fff">${log.humor}</b></div>
                            <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">Fadiga: <b style="color:#fff">${log.fadiga}</b></div>
                            <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">Alim.: <b style="color:#fff">${log.alimentacao || 3}</b></div>
                        </div>
                        ${log.pesoAtual ? `<div style="margin-top: 8px; font-size: 11px; text-align:right;">Peso: <b>${log.pesoAtual} kg</b></div>` : ''}
                    </div>
                `;
            } else {
                msgEl.style.display = 'none';
                formEl.style.display = 'block';
            }
        }

        function editWellness() {
            const log = (window.db.wellnessLogs || []).find(w => String(w.atletaId) === String(atletaId) && w.data === today);
            if (!log) return;

            // Populate form
            document.getElementById('slSono').value = log.sono;
            document.getElementById('slEstresse').value = log.estresse;
            document.getElementById('slDor').value = log.dor;
            document.getElementById('slHumor').value = log.humor;
            document.getElementById('slFadiga').value = log.fadiga;
            document.getElementById('slAlim').value = log.alimentacao || 3;
            document.getElementById('inpPeso').value = log.pesoAtual || '';

            // Remove from DB (will be re-pushed on save)
            window.db.wellnessLogs = (window.db.wellnessLogs || []).filter(w => !(w.atletaId === atletaId && w.data === today));

            initWellnessButtons();
            checkWellnessDone();
            showToast("Modo de edição ativado.");
        }

        function deleteWellness() {
            if (confirm("Deseja realmente excluir seu registro de Bem-Estar de hoje? Você poderá preencher novamente.")) {
                window.db.wellnessLogs = (window.db.wellnessLogs || []).filter(w => !(String(w.atletaId) === String(atletaId) && w.data === today));
                saveDB();

                ['slSono', 'slEstresse', 'slDor', 'slHumor', 'slFadiga', 'slAlim'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = 3;
                });
                document.getElementById('inpPeso').value = '';
                initWellnessButtons();

                checkWellnessDone();
                showToast("Registro excluído.");
            }
        }

        // ÔöÇÔöÇ TREINO MODAL ÔöÇÔöÇ
        function toggleTreinoModal() {
            const m = document.getElementById('treinoModal');
            if (m.classList.contains('show')) {
                m.classList.remove('show');
                setTimeout(() => m.style.display = 'none', 300);
            } else {
                m.style.display = 'flex';
                // Trigger reflow
                void m.offsetWidth;
                m.classList.add('show');
            }
        }

        function openTreinoModal(id) {
            const t = (window.db.treinos || []).find(tr => String(tr.id) === String(id));
            if (!t) return;

            document.getElementById('treinoModalTitle').innerText = t.titulo || t.tipo || 'Treino';

            // Constants from Coach Panel
            const TIPO_LABELS = {
                forca: 'Força', potencia: 'Potência', transferencia: 'Transferência', hiit: 'HIIT', cardio: 'Cardio',
                glicolitico: 'Resistência Glic.', regenerativo: 'Regenerativo', mobilidade: 'Mobilidade', flexibilidade: 'Flexibilidade', core: 'Core',
                tatico: 'Tático', tecnico: 'Técnico', tecnico_tatico: 'Técnico-Tático', simulatorio: 'Simulatório', sparring: 'Sparring',
                fisico: 'Físico Geral', recuperacao: 'Recuperação', competicao: 'Competição', reuniao: 'Reunião'
            };

            const [y, m, d] = (t.data || '').split('-');
            const dataFmt = t.data ? `${d}/${m}/${y}` : '';
            const protecao = t.protecao || 'sim';

            let blocosHtml = '';
            if (t.blocos && t.blocos.length > 0) {
                t.blocos.forEach(b => {
                    const durStr = b.duracaoMins ? `${b.duracaoMins} min` : '';
                    let exsHtml = '';
                    (b.exercicios || []).forEach(ex => {
                        const exObj = typeof ex === 'string' ? { nome: ex, tipo: 'texto', valor: '', obs: '' } : ex;
                        const isLink = exObj.obs && (exObj.obs.startsWith('http://') || exObj.obs.startsWith('https://'));
                        exsHtml += `<div class="view-ex-item">
                            <div class="view-ex-bullet"></div>
                            <div class="view-ex-content">
                                <span class="view-ex-nome">${exObj.nome}</span>
                                ${exObj.valor ? `<span class="view-ex-val">${exObj.valor}</span>` : ''}
                                ${exObj.obs ? (isLink
                                ? `<a href="${exObj.obs}" target="_blank" rel="noopener" class="view-ex-link"><i class="ti ti-link" style="font-size:10px;"></i> Ver link</a>`
                                : `<span class="view-ex-obs">${exObj.obs}</span>`)
                                : ''}
                            </div>
                        </div>`;
                    });
                    blocosHtml += `<div class="view-bloco">
                        <div class="view-bloco-header">
                            <span class="view-bloco-nome">${b.nome || 'Bloco sem nome'}</span>
                            ${durStr ? `<span class="view-bloco-dur">${durStr}</span>` : ''}
                        </div>
                        ${b.descricao ? `<div class="view-bloco-desc">${b.descricao}</div>` : ''}
                        ${exsHtml}
                    </div>`;
                });
            } else {
                // Fallback para treinos antigos salvos apenas com descrição textual
                if (t.descricao || t.obs) {
                    blocosHtml += `<div class="view-obs-text" style="white-space: pre-wrap;">${t.descricao || t.obs}</div>`;
                } else {
                    blocosHtml += `<div class="empty-state">Nenhum detalhe informado.</div>`;
                }
            }

            const modalContent = `
                <div class="view-meta-row">
                    ${dataFmt ? `<span class="view-meta-item"><i class="ti ti-calendar"></i> ${dataFmt}</span>` : ''}
                    ${t.horario ? `<span class="view-meta-item"><i class="ti ti-clock"></i> ${t.horario}</span>` : ''}
                    ${t.tipo ? `<span class="view-tipo-badge tipo-${t.tipo}">${TIPO_LABELS[t.tipo] || t.tipo}</span>` : ''}
                    <span class="prot-badge ${protecao === 'sim' ? 'prot-sim' : 'prot-nao'}">
                        ${protecao === 'sim' ? 'Com Proteção' : 'Sem Proteção'}
                    </span>
                </div>
                <div class="view-stats-row" style="background: rgba(0,0,0,0.15); padding: 8px 12px; margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border);">
                    ${t.duracaoMins || t.duracao ? `<div class="view-stat"><i class="ti ti-clock-hour-4"></i> ${t.duracaoMins || t.duracao} min<br><span style="font-size:11px;color:var(--text-muted);font-weight:400">Duração</span></div>` : ''}
                </div>
                ${t.blocos && t.blocos.length > 0 ? `<div class="view-section-label">Conte·do da SessÒo</div>${blocosHtml}` : blocosHtml}
                ${t.obs && t.blocos && t.blocos.length > 0 ? `<div class="view-section-label">Observações</div><div class="view-obs-text">${t.obs}</div>` : ''}
            `;

            document.getElementById('treinoModalMeta').innerHTML = '';
            document.getElementById('treinoModalDesc').innerHTML = modalContent;
            document.getElementById('treinoModalDesc').style.border = 'none';
            document.getElementById('treinoModalDesc').style.padding = '0';
            document.getElementById('treinoModalDesc').style.background = 'transparent';

            toggleTreinoModal();
        }

        function checkPseDone() {
            const list = document.getElementById('pseList');
            const form = document.getElementById('pseForm');
            const select = document.getElementById('slTipoTreino');
            const todayLogs = (window.db.cargaTreino || []).filter(c => String(c.atletaId) === String(atletaId) && c.data === today);

            list.innerHTML = '';
            const types = ['Taekwondo', 'Físico'];
            const respondedTypes = todayLogs.map(l => l.tipoTreino);
            const remainingTypes = types.filter(t => !respondedTypes.includes(t));

            if (todayLogs.length > 0) {
                let html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">';
                todayLogs.forEach(c => {
                    let pseColor = 'var(--green)';
                    if (c.pse >= 8) pseColor = 'var(--red)';
                    else if (c.pse >= 5) pseColor = 'var(--yellow)';

                    html += `
                        <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 12px;">
                                <span style="font-weight:700; color:var(--green);"><i class="ti ti-check"></i> ${c.tipoTreino}</span>: 
                                <span style="color:${pseColor}; font-weight:700;">${c.pse}</span> &#8226; ${c.duracaoMins}min
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button class="btn-icon" style="color: var(--blue); padding: 2px;" onclick="editPSE(${c.id})" title="Editar"><i class="ti ti-edit"></i></button>
                                <button class="btn-icon" style="color: var(--red); padding: 2px;" onclick="deletePSE(${c.id})" title="Excluir"><i class="ti ti-trash"></i></button>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                list.innerHTML = html;
            }

            // Atualiza select
            select.innerHTML = '';
            remainingTypes.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                select.appendChild(opt);
            });

            form.style.display = remainingTypes.length === 0 ? 'none' : 'block';
        }

        function showPseForm() {
            document.getElementById('pseForm').style.display = 'block';
        }

        function editPSE(id) {
            const c = (window.db.cargaTreino || []).find(x => x.id === id);
            if (!c) return;

            // Populate form
            document.getElementById('slTipoTreino').value = c.tipoTreino;
            document.getElementById('slPSE').value = c.pse;
            document.getElementById('inpDuracao').value = c.duracaoMins;
            document.getElementById('vPSE').innerText = c.pse; // Fallback for any label
            initWellnessButtons();
            updateCargaDisplay();

            // Remove from DB
            window.db.cargaTreino = (window.db.cargaTreino || []).filter(x => x.id !== id);

            checkPseDone();
            showToast("Editando registro de carga...");
        }

        function deletePSE(id) {
            if (confirm("Deseja realmente excluir este registro de carga? Você poderá preencher novamente.")) {
                window.db.cargaTreino = (window.db.cargaTreino || []).filter(c => c.id !== id);
                saveDB();
                checkPseDone();
                showToast("Registro excluído.");
            }
        }

        function updateCargaDisplay() {
            const pse = parseInt(document.getElementById('slPSE').value) || 0;
            const dur = parseInt(document.getElementById('inpDuracao').value) || 0;
            const el = document.getElementById('cargaDisplay');
            el.innerHTML = pse && dur
                ? `Carga calculada: <strong style="color:var(--purple)">${pse * dur} UA</strong>`
                : '';
        }

        function saveWellness() {
            let strPeso = document.getElementById('inpPeso').value || '';
            strPeso = strPeso.replace(',', '.');
            let pesoParsed = parseFloat(strPeso) || null;

            const log = {
                id: Date.now(), atletaId, data: today,
                _updatedAt: Date.now(),
                sono: parseInt(document.getElementById('slSono').value),
                estresse: parseInt(document.getElementById('slEstresse').value),
                dor: parseInt(document.getElementById('slDor').value),
                humor: parseInt(document.getElementById('slHumor').value),
                fadiga: parseInt(document.getElementById('slFadiga').value),
                alimentacao: parseInt(document.getElementById('slAlim').value),
                pesoAtual: pesoParsed
            };
            if (!window.db.wellnessLogs) window.db.wellnessLogs = [];
            window.db.wellnessLogs.push(log);
            saveDB();
            showToast('Wellness salvo!');
            checkWellnessDone();
        }

        function savePSE() {
            const pse = parseInt(document.getElementById('slPSE').value);
            const dur = parseInt(document.getElementById('inpDuracao').value);
            const tipo = document.getElementById('slTipoTreino').value;

            if (!dur || dur < 1) return showToast('Informe a duração do treino', 'error');

            // Check if this type was already submitted today
            const alreadySubmitted = (window.db.cargaTreino || []).some(c => String(c.atletaId) === String(atletaId) && c.data === today && c.tipoTreino === tipo);
            if (alreadySubmitted) {
                return showToast(`Treino ${tipo} já registrado hoje! Se errou, exclua o antigo primeiro.`, 'error');
            }

            if (!window.db.cargaTreino) window.db.cargaTreino = [];
            window.db.cargaTreino.push({ id: Date.now(), atletaId, data: today, _updatedAt: Date.now(), tipoTreino: tipo, pse, duracaoMins: dur, cargaCalculada: pse * dur });
            saveDB();

            // Reset fields
            document.getElementById('slPSE').value = 5;
            document.getElementById('vPSE').innerText = 5;
            document.getElementById('inpDuracao').value = '';
            document.getElementById('cargaDisplay').innerHTML = '';

            showToast('Carga salva!');
            checkPseDone();
        }

        function renderScaleButtons(min, max, current, name) {
            let html = `<div class="choice-group" style="grid-template-columns: repeat(${max > 5 ? 5 : max}, 1fr); margin-bottom: 12px;">`;
            for (let i = min; i <= max; i++) {
                const isSelected = i == current;
                html += `<div class="choice-btn ${isSelected ? 'selected' : ''}" data-val="${i}" onclick="selScaleQ(this, '${name}', ${i})">${i}</div>`;
            }
            html += `</div><input type="hidden" name="${name}" id="qi_${name}" value="${current}">`;
            return html;
        }

        function selScaleQ(el, name, val) {
            el.parentElement.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
            el.classList.add('selected');
            document.getElementById('qi_' + name).value = val;
        }

        // START
        function iniciarPortal(coachId) {
            window.supabaseClient
                .from('app_state')
                .select('data')
                .eq('project_id', coachId)
                .single()
                .then(function(result) {
                    if (!result.error && result.data && result.data.data) {
                        var remoto = result.data.data;
                        var localRaw = localStorage.getItem('tkd_scout_db');
                        var localData = localRaw ? JSON.parse(localRaw) : null;
                        window.db = (localData && typeof mergeAppState === 'function')
                            ? mergeAppState(localData, remoto)
                            : remoto;
                        db = window.db;
                    }
                    portalLoaded = false;
                    loadPortal();
                    if (typeof setupRealtimeSubscription === 'function') setupRealtimeSubscription();
                })
                .catch(function() { loadPortal(); });
        }

        document.addEventListener('DOMContentLoaded', function() {
            var coachId = sessionStorage.getItem('tkd_coach_id') || localStorage.getItem('tkd_coach_id');
            if (coachId && window.supabaseClient) {
                iniciarPortal(coachId);
            } else if (window.supabaseClient) {
                window.supabaseClient.auth.getUser().then(function(res) {
                    var uid = res.data && res.data.user && res.data.user.id;
                    if (uid) {
                        iniciarPortal(uid);
                    } else {
                        setTimeout(loadPortal, 300);
                    }
                }).catch(function() { setTimeout(loadPortal, 300); });
            } else {
                setTimeout(loadPortal, 300);
            }
        });

        // Safety net: if panels still empty after 4s, re-render
        setTimeout(function() {
            var el = document.getElementById('treinoContent');
            if (el && el.children.length === 0) {
                portalLoaded = false;
                loadPortal();
            }
        }, 4000);
