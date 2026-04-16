        // -- INIT --
        const params = new URLSearchParams(location.search);
        const atletaId = parseInt(
            params.get('atleta') ||
            sessionStorage.getItem('tkd_atleta_id') ||
            localStorage.getItem('tkd_atleta_id') ||
            '0'
        );
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
            renderTreinosHoje();

            portalLoaded = true;
        }

        window.onDataLoaded = () => {
            console.log("Data loaded hook triggered, re-rendering portal...");
            portalLoaded = false;
            loadPortal();
        };

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

        // â”€â”€ COMPETITIONS â”€â”€
        function renderCompetitions() {
            // Removido a pedido do usuário: O painel de competições foi removido do HTML.
        }

        // â”€â”€ MEDALS â”€â”€
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
            if (medalEl) {
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
            }

            const medalsEl = document.getElementById('medalsContent');
            if (!medalsEl) return;

            if (total === 0) {
                medalsEl.innerHTML =
                    `<div class="empty-state"><i class="ti ti-medal-off"></i>Nenhuma medalha registrada ainda. Continue treinando!</div>`;
                return;
            }

            const html = allMedals.map(c => {
                const cls = c.colocacao === 'Ouro' ? 'ouro' : c.colocacao === 'Prata' ? 'prata' : 'bronze';
                const icon = c.colocacao === 'Ouro' ? '🥇' : c.colocacao === 'Prata' ? '🥈' : '🥉';
                return `
      <div class="medal-chip ${cls}">
        <span class="icon">${icon}</span>
        <div class="info">
          <div class="event">${c.nomeEvento}</div>
          <div class="cat">${c.categoria ? c.categoria + ' · ' : ''}${c.data ? formatarDataBR(c.data) : ''}</div>
        </div>
      </div>`;
            }).join('');

            medalsEl.innerHTML = `<div class="medals-grid">${html}</div>`;
        }

        // â”€â”€ TREINO â”€â”€
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

            const treinosDoDia = rawTreinos.filter(t => {
                const dateMatch = String(t.data || '').trim().substring(0, 10) === todayStr;
                const turmaMatch = !t.turmaId ||
                    !atleta.turmaId ||
                    String(t.turmaId) === String(atleta.turmaId) ||
                    t.turmaId === 'todas';
                return dateMatch && turmaMatch;
            });
            const treinos = filtrarTreinosParaAtleta(treinosDoDia, atleta.id);

            if (treinos.length === 0) {
                el.innerHTML = `<div class="empty-state"><i class="ti ti-moon"></i>Sem treinos registrados para hoje.</div>`;
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
                        <div class="treino-tipo" style="font-size: 13px;">${escapeHtml(t.titulo || t.tipo || 'Treino')}</div>
                        <i class="ti ti-external-link" style="color: var(--text-muted); font-size: 14px;"></i>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                        <span class="view-tipo-badge ${badgeClass}" style="font-size: 10px; padding: 4px 10px; border:none;">${protecaoLabel}</span>
                        <div class="treino-meta" style="margin-top: 0; font-size: 12px;"><i class="ti ti-clock"></i> ${horario}</div>
                    </div>
                </div>`;
            }).join('');
        }

        // â”€â”€ SCHEDULE â”€â”€
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
                const icon = type.includes('comp') ? '<i class="ti ti-trophy"></i>' : type.includes('feria') || type.includes('recesso') ? '<i class="ti ti-beach"></i>' : type.includes('teste') ? '<i class="ti ti-chart-bar"></i>' : '<i class="ti ti-calendar-event"></i>';
                return `
      <div class="tl-item">
        <div class="tl-dot ${isNext ? 'next' : ''}">${icon}</div>
        <div class="tl-content">
          <div class="tl-title">${escapeHtml(e.titulo || e.nome || 'Evento')}</div>
          <div class="tl-date">${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}</div>
        </div>
      </div>`;
            }).join('');

            el.innerHTML = `<div class="timeline">${items}</div>`;
        }

        // â”€â”€ CALENDAR SUMMARY â”€â”€
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
            const treinosList = (window.db.treinos || []).filter(t => {
                const tData = String(t.data || '').trim().substring(0, 10);
                if (tData < startOfMonth || tData > endOfMonth) return false;
                if (!atleta.turmaId) return true; // no turma assigned: show all
                return String(t.turmaId) == String(atleta.turmaId) || t.turmaId === 'todas' || t.turmaId == null;
            });
            const treinoDays = new Set(treinosList.map(t => new Date(t.data + 'T12:00:00').getDate()));

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
                const hasTreino = treinoDays.has(i);
                let classes = 'cal-day';
                if (isToday) classes += ' today';
                if (hasTreino) classes += ' has-treino';

                html += `<div class="${classes}">${i}</div>`;
            }

            html += `</div>`;
            const calEl = document.getElementById('calendarContent');
            if (calEl) calEl.innerHTML = html;
        }

        // â”€â”€ QUESTIONNAIRES â”€â”€
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
                            <button class="btn-icon" style="color: var(--blue); background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); width: 30px; height: 30px; border-radius: 6px; font-size: 15px;" onclick="editQ(${resp.id})" title="Editar"><i class="ti ti-edit"></i></button>
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
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','Médio')">Médio</div>
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','Bom')">Bom</div>
            </div>`;
                        break;
                    case 'sim_nao':
                        inputHtml = `
            <div class="status-options">
              <input type="hidden" name="q_${p.id}" id="qi_${p.id}">
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','Não')">Não</div>
              <div class="status-btn" onclick="selStatusQ(this,'qi_${p.id}','Sim')">Sim</div>
            </div>`;
                        break;
                    default:
                        inputHtml = `<textarea name="q_${p.id}" class="form-control" rows="3" placeholder="Digite sua resposta..."></textarea>`;
                }
                html += `<div class="question-block">
        <div class="question-text">${i + 1}. ${escapeHtml(p.texto)}</div>
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
            savePortalDB();
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

        // â”€â”€ WELLNESS â”€â”€
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
                if (!inp || inp.value === '') return; // sem default — só seleciona se já tiver valor salvo
                const val = inp.value;
                const btn = document.querySelector(`#group-${key} .choice-btn[data-val="${val}"]`);
                if (btn) selWellness(btn, key, val);
            });
            const pseVal = document.getElementById('slPSE').value;
            if (pseVal !== '') {
                const pseBtn = document.querySelector(`#group-pse .choice-btn[data-val="${pseVal}"]`);
                if (pseBtn) selPSEBtn(pseBtn, pseVal);
            }
        }

        function checkWellnessDone() {
            let log = (window.db.wellnessLogs || []).find(w => String(w.atletaId) === String(atletaId) && w.data === today);
            // Fallback: backup dedicado no localStorage
            if (!log) {
                const backup = localStorage.getItem('tkd_wellness_' + atletaId + '_' + today);
                if (backup) {
                    try {
                        log = JSON.parse(backup);
                        // Reinsere no db para corrigir a inconsistência
                        if (!window.db.wellnessLogs) window.db.wellnessLogs = [];
                        window.db.wellnessLogs.push(log);
                    } catch(e) {}
                }
            }

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
                            <button class="btn-icon" style="color: var(--blue); background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); width: 30px; height: 30px; border-radius: 6px; font-size: 15px;" onclick="editWellness()" title="Editar"><i class="ti ti-edit"></i></button>
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
            window.db.wellnessLogs = (window.db.wellnessLogs || []).filter(w => !(String(w.atletaId) === String(atletaId) && w.data === today));

            // Limpa o backup do localStorage — sem isso, checkWellnessDone re-insere o dado antigo
            // e o formulário nunca aparece (bug do botão Editar não funcionar)
            localStorage.removeItem('tkd_wellness_' + atletaId + '_' + today);

            initWellnessButtons();
            checkWellnessDone();
            showToast("Modo de edição ativado.");
        }

        function deleteWellness() {
            if (confirm("Deseja realmente excluir seu registro de Bem-Estar de hoje? Você poderá preencher novamente.")) {
                window.db.wellnessLogs = (window.db.wellnessLogs || []).filter(w => !(String(w.atletaId) === String(atletaId) && w.data === today));
                savePortalDB();

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

        // â”€â”€ TREINO MODAL â”€â”€
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
                                <span class="view-ex-nome">${escapeHtml(exObj.nome)}</span>
                                ${exObj.valor ? `<span class="view-ex-val">${escapeHtml(exObj.valor)}</span>` : ''}
                                ${exObj.obs ? (isLink
                                ? `<a href="${exObj.obs}" target="_blank" rel="noopener" class="view-ex-link"><i class="ti ti-link" style="font-size:10px;"></i> Ver link</a>`
                                : `<span class="view-ex-obs">${escapeHtml(exObj.obs)}</span>`)
                                : ''}
                            </div>
                        </div>`;
                    });
                    blocosHtml += `<div class="view-bloco">
                        <div class="view-bloco-header">
                            <span class="view-bloco-nome">${escapeHtml(b.nome || 'Bloco sem nome')}</span>
                            ${durStr ? `<span class="view-bloco-dur">${durStr}</span>` : ''}
                        </div>
                        ${b.descricao ? `<div class="view-bloco-desc">${escapeHtml(b.descricao)}</div>` : ''}
                        ${exsHtml}
                    </div>`;
                });
            } else {
                // Fallback para treinos antigos salvos apenas com descrição textual
                if (t.descricao || t.obs) {
                    blocosHtml += `<div class="view-obs-text" style="white-space: pre-wrap;">${escapeHtml(t.descricao || t.obs)}</div>`;
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
                ${t.blocos && t.blocos.length > 0 ? `<div class="view-section-label">Conteédo da Sessão</div>${blocosHtml}` : blocosHtml}
                ${t.obs && t.blocos && t.blocos.length > 0 ? `<div class="view-section-label">Observações</div><div class="view-obs-text">${escapeHtml(t.obs)}</div>` : ''}
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
            let todayLogs = (window.db.cargaTreino || []).filter(c => String(c.atletaId) === String(atletaId) && c.data === today);
            // Fallback: backup dedicado no localStorage
            const backupRaw = localStorage.getItem('tkd_pse_' + atletaId + '_' + today);
            if (backupRaw) {
                try {
                    const backupLogs = JSON.parse(backupRaw);
                    backupLogs.forEach(bl => {
                        if (!todayLogs.find(l => l.id === bl.id)) {
                            if (!window.db.cargaTreino) window.db.cargaTreino = [];
                            window.db.cargaTreino.push(bl);
                            todayLogs.push(bl);
                        }
                    });
                } catch(e) {}
            }

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
                        <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 10px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                            <div style="font-size: 13px; font-weight: 600;">
                                <span style="color:var(--green);"><i class="ti ti-check"></i> ${c.tipoTreino}</span>
                                <span style="color: var(--text-muted); font-weight: 400;"> &bull; PSE </span>
                                <span style="color:${pseColor}; font-weight:700;">${c.pse}</span>
                                <span style="color: var(--text-muted); font-weight: 400;"> &bull; ${c.duracaoMins}min</span>
                            </div>
                            <div style="display: flex; gap: 6px; flex-shrink: 0;">
                                <button class="btn-icon" style="color: var(--blue); background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); width: 30px; height: 30px; border-radius: 6px; font-size: 15px;" onclick="editPSE(${c.id})" title="Editar"><i class="ti ti-edit"></i></button>
                                <button class="btn-icon" style="color: var(--red); background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); width: 30px; height: 30px; border-radius: 6px; font-size: 15px;" onclick="deletePSE(${c.id})" title="Excluir"><i class="ti ti-trash"></i></button>
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
            const vPseEl = document.getElementById('vPSE');
            if (vPseEl) vPseEl.innerText = c.pse;
            initWellnessButtons();
            updateCargaDisplay();

            // Remove from DB
            window.db.cargaTreino = (window.db.cargaTreino || []).filter(x => x.id !== id);

            // Limpa o backup do localStorage — sem isso, checkPseDone re-insere o dado antigo
            // e o formulário nunca exibe os campos de edição (bug do botão Editar não funcionar)
            localStorage.removeItem('tkd_pse_' + atletaId + '_' + today);

            checkPseDone();
            showToast("Editando registro de carga...");
        }

        // ── TREINOS DO DIA (vinculação ao PSE) ────────────────────
        const TIPOS_FISICO_IDS = ['forca','potencia','transferencia','hiit','cardio','glicolitico','regenerativo','mobilidade','flexibilidade','core'];

        function getFocoTreino(tipo) {
            return TIPOS_FISICO_IDS.includes(tipo) ? 'fisico' : 'tkd';
        }

        // Filtra lista de treinos para um atleta: exclui treino de equipe se o atleta
        // já tem treino individual do mesmo foco no mesmo conjunto de treinos.
        function filtrarTreinosParaAtleta(todosTreinos, aId) {
            const focosIndividuais = new Set();
            todosTreinos.forEach(t => {
                const dest = t.destinatario || 'equipe';
                if (dest === 'atleta' || dest === 'atletas') {
                    const ids = t.atletasIds || (t.atletaId ? [t.atletaId] : []);
                    if (ids.includes(aId)) focosIndividuais.add(getFocoTreino(t.tipo));
                }
            });
            return todosTreinos.filter(t => {
                const dest = t.destinatario || 'equipe';
                if (dest === 'atleta' || dest === 'atletas') {
                    const ids = t.atletasIds || (t.atletaId ? [t.atletaId] : []);
                    return ids.includes(aId);
                }
                return !focosIndividuais.has(getFocoTreino(t.tipo));
            });
        }

        function renderTreinosHoje() {
            const turmaId = db.alunos?.find(a => a.id === atletaId)?.turmaId;
            if (!turmaId) return;

            const treinosDoDia = (db.treinos || []).filter(t =>
                t.data === today && t.turmaId === turmaId
            );
            const treinos = filtrarTreinosParaAtleta(treinosDoDia, atletaId)
                .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

            const container = document.getElementById('treinosHojeContainer');
            const list = document.getElementById('treinosHojeList');

            if (treinos.length === 0) {
                container.style.display = 'none';
                return;
            }

            container.style.display = '';
            list.innerHTML = treinos.map(t => {
                const tipoLabel = TIPOS_FISICO_IDS.includes(t.tipo) ? 'Físico' : 'Taekwondo';
                const hora = t.horario ? `${t.horario} · ` : '';
                const dur = t.duracaoMins ? `${t.duracaoMins}min` : '';
                const jaSubmetido = (window.db.cargaTreino || []).some(c =>
                    String(c.atletaId) === String(atletaId) && c.data === today && c.treinoId === t.id
                );
                return `
                    <div onclick="selecionarTreino(${t.id}, '${tipoLabel}', ${t.duracaoMins || 90})"
                        style="padding:10px 12px; border-radius:var(--radius-sm); border:1px solid ${jaSubmetido ? 'var(--green)' : 'var(--border-color)'}; background:${jaSubmetido ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)'}; cursor:${jaSubmetido ? 'default' : 'pointer'}; display:flex; align-items:center; justify-content:space-between; gap:8px; transition:border-color 0.15s;" id="treino-card-${t.id}">
                        <div>
                            <div style="font-size:13px; font-weight:600; margin-bottom:2px;">${escapeHtml(t.titulo)}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${hora}${tipoLabel} · ${dur}</div>
                        </div>
                        ${jaSubmetido
                            ? '<i class="ti ti-check" style="color:var(--green); font-size:16px;"></i>'
                            : '<span style="font-size:11px; color:var(--primary); font-weight:600;">Selecionar</span>'}
                    </div>
                `;
            }).join('');
        }

        function selecionarTreino(treinoId, tipoLabel, duracaoMins) {
            const jaSubmetido = (window.db.cargaTreino || []).some(c =>
                String(c.atletaId) === String(atletaId) && c.data === today && c.treinoId === treinoId
            );
            if (jaSubmetido) return;

            // Vincula o treino selecionado
            document.getElementById('treinoVinculadoId').value = treinoId;

            // Pré-preenche tipo e duração
            const slTipo = document.getElementById('slTipoTreino');
            if (slTipo) slTipo.value = tipoLabel;
            const inpDur = document.getElementById('inpDuracao');
            if (inpDur) { inpDur.value = duracaoMins; updateCargaDisplay(); }

            // Destaca visualmente o card selecionado
            document.querySelectorAll('[id^="treino-card-"]').forEach(el => {
                el.style.borderColor = 'var(--border-color)';
                el.style.background = 'rgba(255,255,255,0.03)';
            });
            const sel = document.getElementById(`treino-card-${treinoId}`);
            if (sel) {
                sel.style.borderColor = 'var(--primary)';
                sel.style.background = 'rgba(59,130,246,0.08)';
            }
        }

        function deletePSE(id) {
            if (confirm("Deseja realmente excluir este registro de carga? Você poderá preencher novamente.")) {
                window.db.cargaTreino = (window.db.cargaTreino || []).filter(c => c.id !== id);
                savePortalDB();
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
            // Valida que todos os campos foram preenchidos (nenhum pode estar vazio)
            const camposWellness = ['slSono', 'slAlim', 'slHumor', 'slEstresse', 'slDor', 'slFadiga'];
            const nomesCampos = { slSono: 'Sono', slAlim: 'Alimentação', slHumor: 'Humor', slEstresse: 'Estresse', slDor: 'Dor', slFadiga: 'Fadiga' };
            for (const id of camposWellness) {
                if (!document.getElementById(id).value) {
                    return showToast(`Selecione um valor para ${nomesCampos[id]}`, 'error');
                }
            }

            let strPeso = document.getElementById('inpPeso').value || '';
            strPeso = strPeso.replace(',', '.');
            let pesoParsed = parseFloat(strPeso) || null;

            const log = {
                id: Date.now(), atletaId, data: today, _updatedAt: Date.now(),
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
            // Backup dedicado — garante persistência mesmo se o merge do Supabase falhar
            localStorage.setItem('tkd_wellness_' + atletaId + '_' + today, JSON.stringify(log));
            savePortalDB();
            showToast('Wellness salvo!');
            checkWellnessDone();
        }

        function savePSE() {
            const pse = parseInt(document.getElementById('slPSE').value);
            const dur = parseInt(document.getElementById('inpDuracao').value);
            const tipo = document.getElementById('slTipoTreino').value;
            const treinoVinculadoId = parseInt(document.getElementById('treinoVinculadoId').value) || null;

            if (!pse) return showToast('Selecione a intensidade (PSE)', 'error');
            if (!dur || dur < 1) return showToast('Informe a duração do treino', 'error');

            // Se vinculado a um treino específico, verifica duplicata por treinoId
            // Se não vinculado, verifica por tipo (comportamento original)
            const alreadySubmitted = (window.db.cargaTreino || []).some(c => {
                if (String(c.atletaId) !== String(atletaId) || c.data !== today) return false;
                if (treinoVinculadoId) return c.treinoId === treinoVinculadoId;
                return c.tipoTreino === tipo && !c.treinoId; // apenas entradas sem vínculo
            });
            if (alreadySubmitted) {
                const msg = treinoVinculadoId
                    ? 'PSE já registrado para este treino!'
                    : `Treino ${tipo} já registrado hoje! Se errou, exclua o antigo primeiro.`;
                return showToast(msg, 'error');
            }

            if (!window.db.cargaTreino) window.db.cargaTreino = [];
            const novaEntrada = {
                id: Date.now(), atletaId, data: today, _updatedAt: Date.now(),
                tipoTreino: tipo, pse, duracaoMins: dur, cargaCalculada: pse * dur,
                treinoId: treinoVinculadoId
            };
            window.db.cargaTreino.push(novaEntrada);
            // Backup dedicado no localStorage
            const pseBkpRaw = localStorage.getItem('tkd_pse_' + atletaId + '_' + today);
            const pseBkp = pseBkpRaw ? JSON.parse(pseBkpRaw) : [];
            pseBkp.push(novaEntrada);
            localStorage.setItem('tkd_pse_' + atletaId + '_' + today, JSON.stringify(pseBkp));
            savePortalDB();

            // Reset fields — sem pré-seleção
            document.getElementById('slPSE').value = '';
            const vPseReset = document.getElementById('vPSE');
            if (vPseReset) vPseReset.innerText = '';
            document.getElementById('inpDuracao').value = '';
            document.getElementById('cargaDisplay').innerHTML = '';
            // Limpa seleção visual dos botões PSE
            document.querySelectorAll('#group-pse .choice-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.background = '';
                b.style.borderColor = '';
                b.style.boxShadow = '';
            });

            showToast('Carga salva!');
            document.getElementById('treinoVinculadoId').value = '';
            checkPseDone();
            renderTreinosHoje();
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

        // ID do treinador cujos dados o portal está exibindo
        var portalCoachId = null;

        // Salva na linha do TREINADOR — merge cirúrgico: só toca arrays do atleta atual
        async function savePortalDB() {
            // Backup local sempre, independente do Supabase
            localStorage.setItem('tkd_scout_db', JSON.stringify(window.db));

            if (!window.supabaseClient || !portalCoachId) return;

            try {
                // 1. Busca os dados atuais do treinador para não sobrescrever outros atletas
                const { data: result, error: fetchErr } = await window.supabaseClient
                    .from('app_state')
                    .select('data')
                    .eq('project_id', portalCoachId)
                    .single();

                if (fetchErr || !result || !result.data) {
                    console.error('savePortalDB: não encontrou linha do treinador', fetchErr);
                    return;
                }

                const coachData = result.data;

                // 2. Merge cirúrgico — só substitui as entradas DESTE atleta nos arrays relevantes
                //    Entradas de outros atletas ficam intactas
                const atletaArrays = ['wellnessLogs', 'cargaTreino', 'respostas'];
                atletaArrays.forEach(function(key) {
                    const minhasEntradas = (window.db[key] || []).filter(function(e) {
                        return String(e.atletaId) === String(atletaId);
                    });
                    const entradaOutros = (coachData[key] || []).filter(function(e) {
                        return String(e.atletaId) !== String(atletaId);
                    });
                    coachData[key] = entradaOutros.concat(minhasEntradas);
                });

                coachData._last_updated = Date.now();

                // 3. Salva de volta na linha do treinador (blob merge)
                const { error: saveErr } = await window.supabaseClient
                    .from('app_state')
                    .upsert({ project_id: portalCoachId, data: coachData });

                if (saveErr) {
                    console.error('savePortalDB upsert erro:', saveErr);
                } else {
                    console.log('savePortalDB OK — atleta', atletaId, 'sincronizado com treinador', portalCoachId);
                    window.db = coachData;
                    localStorage.setItem('tkd_scout_db', JSON.stringify(coachData));
                }

                // 4. Dual-write: registros individuais em athlete_responses (para futuro RLS granular)
                const responseRows = [
                    ...((window.db.wellnessLogs || [])
                        .filter(e => String(e.atletaId) === String(atletaId))
                        .map(e => ({ coach_id: portalCoachId, athlete_id: atletaId, type: 'wellness', payload: e }))),
                    ...((window.db.cargaTreino || [])
                        .filter(e => String(e.atletaId) === String(atletaId))
                        .map(e => ({ coach_id: portalCoachId, athlete_id: atletaId, type: 'carga', payload: e }))),
                    ...((window.db.respostas || [])
                        .filter(e => String(e.atletaId) === String(atletaId))
                        .map(e => ({ coach_id: portalCoachId, athlete_id: atletaId, type: 'resposta', payload: e }))),
                ];
                if (responseRows.length > 0) {
                    // Ignora erros — tabela pode não existir ainda (antes da migration)
                    window.supabaseClient
                        .from('athlete_responses')
                        .upsert(responseRows, { ignoreDuplicates: true })
                        .then(({ error }) => {
                            if (error) console.warn('athlete_responses dual-write:', error.message);
                        });
                }
            } catch (e) {
                console.error('savePortalDB exception:', e);
            }
        }

        // START
        function iniciarPortal(coachId) {
            portalCoachId = coachId;
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

        // Safety net: if panels still empty after 4s, re-render with whatever data arrived
        setTimeout(function() {
            var el = document.getElementById('treinoContent');
            if (el && el.children.length === 0) {
                portalLoaded = false;
                loadPortal();
            }
        }, 4000);
