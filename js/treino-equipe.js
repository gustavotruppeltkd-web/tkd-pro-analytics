        // ============================================================
        //  STATE
        // ============================================================
        let currentView = 'week';
        let currentDate = new Date();
        let blocoCounter = 0;
        let selectedTipo = 'tecnico';

        const TIPOS_TAEKWONDO = [
            { id: 'tatico', label: 'Tático', icon: 'ti-chess' },
            { id: 'tecnico', label: 'Técnico', icon: 'ti-focus' },
            { id: 'tecnico_tatico', label: 'Técnico/Tático', icon: 'ti-arrows-cross' },
            { id: 'simulatorio', label: 'Simulatório', icon: 'ti-swords' },
            { id: 'sparring', label: 'Sparring', icon: 'ti-boxing-glove' }
        ];

        const TIPOS_FISICO = [
            { id: 'forca', label: 'Força', icon: 'ti-barbell' },
            { id: 'potencia', label: 'Potência', icon: 'ti-bolt' },
            { id: 'transferencia', label: 'Transferência', icon: 'ti-exchange' },
            { id: 'hiit', label: 'HIIT', icon: 'ti-flame' },
            { id: 'cardio', label: 'Cardio', icon: 'ti-heart-rate-monitor' },
            { id: 'glicolitico', label: 'Glicolítico', icon: 'ti-activity' },
            { id: 'regenerativo', label: 'Regenerativo', icon: 'ti-battery-charging' },
            { id: 'mobilidade', label: 'Mobilidade', icon: 'ti-stretching' },
            { id: 'flexibilidade', label: 'Flexibilidade', icon: 'ti-yoga' },
            { id: 'core', label: 'Core', icon: 'ti-torso' }
        ];

        const TIPO_LABELS = {
            forca: 'Força', potencia: 'Potência', transferencia: 'Transferência', hiit: 'HIIT', cardio: 'Cardio',
            glicolitico: 'Glicolítico', regenerativo: 'Regenerativo', mobilidade: 'Mobilidade', flexibilidade: 'Flexibilidade', core: 'Core',
            tatico: 'Tático', tecnico: 'Técnico', tecnico_tatico: 'Técnico/Tático', simulatorio: 'Simulatório', sparring: 'Sparring',
            fisico: 'Físico', recuperacao: 'Recuperação', competicao: 'Competição', reuniao: 'Reunião'
        };

        function updateTipoOpcoes() {
            const macro = document.querySelector('input[name="treinoMacro"]:checked').value;
            const container = document.getElementById('tipoSelectorContainer');
            const tipos = macro === 'taekwondo' ? TIPOS_TAEKWONDO : TIPOS_FISICO;

            container.innerHTML = tipos.map(t => `
                <button type="button" class="tipo-btn tipo-${t.id}" onclick="selectTipo('${t.id}', this)">
                    <i class="ti ${t.icon}"></i> ${t.label}
                </button>
            `).join('');

            const currentTipo = document.getElementById('treinoTipo').value;
            const isValid = tipos.some(t => t.id === currentTipo);
            if (!isValid && tipos.length > 0) {
                setTimeout(() => {
                    const activeBtn = container.querySelector(`.tipo-${tipos[0].id}`);
                    if (activeBtn) selectTipo(tipos[0].id, activeBtn);
                }, 10);
            } else if (isValid) {
                setTimeout(() => {
                    const activeBtn = container.querySelector(`.tipo-${currentTipo}`);
                    if (activeBtn) selectTipo(currentTipo, activeBtn);
                }, 10);
            }
        }

        const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        // ============================================================
        //  INIT
        // ============================================================
        document.addEventListener('DOMContentLoaded', () => {
            if (!db.exercicios) { db.exercicios = []; }
            const turma = db.turmas.find(t => t.id === db.activeTurmaId);
            if (turma) document.getElementById('turmaName').innerText = turma.nome;
            const user = db.usuarios?.[0];
            if (user) document.getElementById('userName').innerText = user.nome;
            renderCalendar();

            // Auto-open training if navigated from dashboard widget
            const openId = sessionStorage.getItem('tkd_open_treino_id');
            if (openId) {
                sessionStorage.removeItem('tkd_open_treino_id');
                const t = db.treinos.find(t => t.id === parseInt(openId));
                if (t) {
                    currentDate = new Date(t.data + 'T12:00:00');
                    renderCalendar();
                    setTimeout(() => editTreino(t.id), 80);
                }
            }
        });

        // ============================================================
        //  NAV + VIEW
        // ============================================================
        function setView(v) {
            currentView = v;
            document.getElementById('btnWeek').classList.toggle('active', v === 'week');
            document.getElementById('btnMonth').classList.toggle('active', v === 'month');
            document.getElementById('btnMeso').classList.toggle('active', v === 'meso');

            // Toggle cal-nav visibility (não faz sentido em Mesociclo)
            const calNav = document.querySelector('.cal-nav');
            if (calNav) calNav.style.display = v === 'meso' ? 'none' : '';

            if (v === 'meso') {
                document.getElementById('viewWeek').style.display = 'none';
                document.getElementById('viewMonth').style.display = 'none';
                document.getElementById('viewMeso').style.display = '';
                document.getElementById('painelPeriodizacao').style.display = 'none';
                renderMesoView();
            } else {
                document.getElementById('viewMeso').style.display = 'none';
                renderCalendar();
            }
        }

        function navCalendar(dir) {
            if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() + dir * 7);
            } else {
                currentDate.setMonth(currentDate.getMonth() + dir);
            }
            renderCalendar();
        }

        function goToToday() {
            currentDate = new Date();
            renderCalendar();
        }

        function renderCalendar() {
            const copyBtn = document.getElementById('btnCopyPrevWeek');
            if (copyBtn) copyBtn.style.display = currentView === 'week' ? '' : 'none';
            if (currentView === 'week') {
                document.getElementById('viewWeek').style.display = '';
                document.getElementById('viewMonth').style.display = 'none';
                renderWeek();
            } else {
                document.getElementById('viewWeek').style.display = 'none';
                document.getElementById('viewMonth').style.display = '';
                renderMonth();
            }
            // Atualizar painel de periodização
            renderPainelCarga();
        }

        // ============================================================
        //  WEEK VIEW
        // ============================================================
        function getWeekStart(d) {
            const day = d.getDay();
            const start = new Date(d);
            const diff = (day === 0) ? -6 : 1 - day;
            start.setDate(d.getDate() + diff);
            start.setHours(0, 0, 0, 0);
            return start;
        }

        function renderWeek() {
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const s = weekStart, e = weekEnd;
            const sStr = `${s.getDate()} ${s.getMonth() !== e.getMonth() ? MESES[s.getMonth()].slice(0, 3) + ' ' : ''}`;
            const eStr = `${e.getDate()} ${MESES[e.getMonth()]}`;
            document.getElementById('calTitle').innerText = `${sStr}– ${eStr}, ${e.getFullYear()}`;

            // Botão copiar semana anterior
            const copyBtn = document.getElementById('btnCopyPrevWeek');
            if (copyBtn) copyBtn.style.display = currentView === 'week' ? '' : 'none';

            const today = toDateStr(new Date());
            const container = document.getElementById('viewWeek');
            let html = '<div class="week-grid">';

            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const dateStr = toDateStr(day);
                const isToday = dateStr === today;
                const treinos = getTreinosDia(dateStr);

                html += `<div class="week-day-col">
                    <div class="week-day-header">
                        <div class="week-day-name">${DIAS_SEMANA[day.getDay()]}</div>
                        <div class="week-day-num${isToday ? ' today' : ''}">${day.getDate()}</div>
                    </div>
                    <div class="week-day-body"
                        data-date="${dateStr}"
                        ondragover="onDayDragOver(event)"
                        ondragleave="onDayDragLeave(event)"
                        ondrop="onDayDrop(event)">`;

                treinos.forEach(t => { html += buildChip(t); });

                html += `<button class="btn-add-row add-treino-btn" onclick="openModalTreino('${dateStr}')">
                            <i class="ti ti-plus"></i> Treino
                        </button>
                    </div>
                </div>`;
            }

            html += '</div>';
            container.innerHTML = html;
        }

        // ============================================================
        //  MONTH VIEW
        // ============================================================
        function renderMonth() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            document.getElementById('calTitle').innerText = `${MESES[month]} ${year}`;

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const today = toDateStr(new Date());
            const startOffset = (firstDay.getDay() + 6) % 7;

            let html = '<div class="month-grid">';
            ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].forEach(d => {
                html += `<div class="month-header-cell">${d}</div>`;
            });

            for (let i = 0; i < startOffset; i++) {
                const prevDate = new Date(year, month, -startOffset + i + 1);
                html += buildMonthCell(prevDate, true, today);
            }
            for (let d = 1; d <= lastDay.getDate(); d++) {
                html += buildMonthCell(new Date(year, month, d), false, today);
            }
            const totalCells = startOffset + lastDay.getDate();
            const remainder = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
            for (let i = 1; i <= remainder; i++) {
                html += buildMonthCell(new Date(year, month + 1, i), true, today);
            }

            html += '</div>';
            document.getElementById('viewMonth').innerHTML = html;
        }

        function buildMonthCell(day, otherMonth, today) {
            const dateStr = toDateStr(day);
            const isToday = dateStr === today;
            const treinos = getTreinosDia(dateStr);

            let html = `<div class="month-day-cell${otherMonth ? ' other-month' : ''}" 
                onclick="openModalTreino('${dateStr}')"
                data-date="${dateStr}"
                ondragover="onDayDragOver(event)"
                ondragleave="onDayDragLeave(event)"
                ondrop="onDayDrop(event)">
                <div class="month-day-num${isToday ? ' today' : ''}">${day.getDate()}</div>`;

            treinos.slice(0, 3).forEach(t => {
                const protecao = t.protecao || 'sim';
                const protIcon = protecao === 'sim' ? '<i class="ti ti-shield-check" style="color:#fca5a5;"></i>' : '';
                html += `<div class="month-chip tipo-${t.tipo}" 
                    draggable="true"
                    ondragstart="onChipDragStart(event, ${t.id})"
                    ondragend="onChipDragEnd(event)"
                    onclick="event.stopPropagation(); editTreino(${t.id})" 
                    style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.horario || ''} ${escapeHtml(t.titulo)}</span>
                    ${protIcon}
                </div>`;
            });
            if (treinos.length > 3) {
                html += `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">+${treinos.length - 3} mais</div>`;
            }
            html += '</div>';
            return html;
        }

        // ============================================================
        //  CHIPS
        // ============================================================
        function buildChip(t) {
            const hora = t.horario || '';
            const protecao = t.protecao || 'sim';
            const protText = protecao === 'sim' ? 'Com Prot.' : 'Sem Prot.';
            const tipoText = TIPO_LABELS[t.tipo] || t.tipo;

            // Carga Foster: PSE × Duração
            let cargaHtml = '';
            if (t.cargaTreino) {
                const c = t.cargaTreino;
                const cColor = c >= 1000 ? 'var(--red)' : c >= 500 ? 'var(--yellow)' : 'var(--green)';
                const cBg = c >= 1000 ? 'rgba(239,68,68,0.15)' : c >= 500 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)';
                cargaHtml = `<span style="font-size:10px; background:${cBg}; color:${cColor}; padding:1px 5px; border-radius:4px; font-weight:700;" title="Carga Foster: PSE × Duração">${c} CARGA</span>`;
            }

            // Badge(s) de atleta(s) específico(s)
            let atletaBadge = '';
            const atletasIds = t.atletasIds || (t.atletaId ? [t.atletaId] : []);
            if ((t.destinatario === 'atletas' || t.destinatario === 'atleta') && atletasIds.length > 0) {
                atletaBadge = atletasIds.map(aid => {
                    const aluno = (db.alunos || []).find(a => a.id === aid);
                    if (!aluno) return '';
                    const initials = aluno.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                    return `<span class="chip-atleta-badge" title="${escapeHtml(aluno.nome)}"><i class="ti ti-user" style="font-size:9px;"></i> ${initials}</span>`;
                }).join('');
            }

            return `<div class="treino-chip tipo-${t.tipo}"
                draggable="true"
                data-id="${t.id}"
                ondragstart="onChipDragStart(event, ${t.id})"
                ondragend="onChipDragEnd(event)"
                onclick="editTreino(${t.id})">
                <div class="chip-title" style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">${t.titulo} ${atletaBadge}</div>
                <div class="chip-meta" style="flex-wrap: wrap; gap: 4px;">
                    ${hora ? `<span><i class="ti ti-clock" style="font-size:10px;"></i> ${hora}</span>` : ''}
                    <span>${tipoText}</span>
                    ${cargaHtml}
                    <span class="prot-badge ${protecao === 'sim' ? 'prot-sim' : 'prot-nao'}" style="margin-left:auto;">${protText}</span>
                </div>
            </div>`;
        }

        // ============================================================
        //  DRAG AND DROP
        // ============================================================
        let _dragTreinoId = null;

        function onChipDragStart(event, treinoId) {
            _dragTreinoId = treinoId;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(treinoId));
            // Adiciona classe de arrastar com pequeno delay (funciona melhor)
            setTimeout(() => {
                const el = document.querySelector(`.treino-chip[data-id="${treinoId}"]`);
                if (el) el.classList.add('dragging');
            }, 0);
        }

        function onChipDragEnd(event) {
            _dragTreinoId = null;
            document.querySelectorAll('.treino-chip.dragging').forEach(el => el.classList.remove('dragging'));
            document.querySelectorAll('.week-day-body.drag-over').forEach(el => el.classList.remove('drag-over'));
        }

        function onDayDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            event.currentTarget.classList.add('drag-over');
        }

        function onDayDragLeave(event) {
            // Só remove se sair do próprio body (não de filho para filho)
            if (!event.currentTarget.contains(event.relatedTarget)) {
                event.currentTarget.classList.remove('drag-over');
            }
        }

        function onDayDrop(event) {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');

            const treinoId = parseInt(event.dataTransfer.getData('text/plain') || _dragTreinoId);
            const novaData = event.currentTarget.getAttribute('data-date');

            if (!treinoId || !novaData) return;

            const treino = (db.treinos || []).find(t => t.id === treinoId);
            if (!treino) return;
            if (treino.data === novaData) return; // Mesmo dia, nada a fazer

            treino.data = novaData;
            treino._updatedAt = Date.now();
            saveDB();
            renderCalendar();
            showToast(`Treino movido para ${novaData.split('-').reverse().join('/')}`);
        }

        // ============================================================
        //  MODAL - TITLE SELECTOR (CUSTOM DROPDOWN)
        // ============================================================
        function toggleTitleDropdown() {
            const menu = document.getElementById('dropdownMenu');
            menu.classList.toggle('active');

            // Close when clicking outside
            if (menu.classList.contains('active')) {
                setTimeout(() => {
                    const closeMenu = (e) => {
                        if (!e.target.closest('#treinoTituloDropdown')) {
                            menu.classList.remove('active');
                            document.removeEventListener('click', closeMenu);
                        }
                    };
                    document.addEventListener('click', closeMenu);
                }, 10);
            }
        }

        function populateTitleSelect(currentTitle) {
            const menu = document.getElementById('dropdownMenu');
            const triggerText = document.getElementById('dropdownSelectedTitle');
            const hiddenValue = document.getElementById('treinoTituloValue');

            const turmaId = db.activeTurmaId;
            const seen = new Set();
            const uniqueTitles = (db.treinos || [])
                .filter(t => t.turmaId === turmaId)
                .slice().reverse()
                .map(t => (t.titulo || '').replace(/\s*\(Cópia\)\s*$/i, '').trim())
                .filter(t => t && !seen.has(t) && seen.add(t));

            let html = '';

            if (uniqueTitles.length === 0) {
                html = `
                    <div class="dropdown-item new-title" onclick="selectTitleOption('__novo__')">
                        <i class="ti ti-plus" style="margin-right:8px;"></i> Novo título...
                    </div>
                `;
            } else {
                uniqueTitles.forEach(t => {
                    html += `
                        <div class="dropdown-item" onclick="selectTitleOption('${t.replace(/'/g, "\\'")}')">
                            <span class="item-text">${t}</span>
                            <button type="button" class="btn-delete-title" onclick="event.stopPropagation(); deleteSavedTitle('${t.replace(/'/g, "\\'")}')" title="Excluir título">
                                <i class="ti ti-trash"></i>
                            </button>
                        </div>
                    `;
                });
                html += `
                    <div class="dropdown-item new-title" onclick="selectTitleOption('__novo__')">
                        <i class="ti ti-plus" style="margin-right:8px;"></i> Novo título...
                    </div>
                `;
            }

            menu.innerHTML = html;

            if (currentTitle) {
                triggerText.innerText = currentTitle;
                hiddenValue.value = currentTitle;
                // Quando editando um treino existente, só preenche o título sem auto-fill de blocos
                const isEditing = !!document.getElementById('treinoEditId').value;
                if (!isEditing) onTitleSelectChange(currentTitle);
            } else {
                triggerText.innerText = '— Selecione ou crie um treino...';
                hiddenValue.value = '';
                onTitleSelectChange('');
            }
        }

        function selectTitleOption(val) {
            const triggerText = document.getElementById('dropdownSelectedTitle');
            const hiddenValue = document.getElementById('treinoTituloValue');
            const menu = document.getElementById('dropdownMenu');

            if (val === '__novo__') {
                triggerText.innerHTML = '<i class="ti ti-plus" style="margin-right:8px;"></i> Novo título...';
            } else {
                triggerText.innerText = val || '— Selecione ou crie um treino...';
            }

            hiddenValue.value = val;
            menu.classList.remove('active');
            onTitleSelectChange(val);
        }

        function onTitleSelectChange(val, keepTitle) {
            const novoRow = document.getElementById('novoTituloRow');
            const novoInput = document.getElementById('treinoTituloNovo');

            if (val === '__novo__') {
                novoRow.style.display = 'block';
                novoInput.value = keepTitle || '';
                // Add one empty block if container is empty
                if (!document.getElementById('blocosContainer')?.children.length) addBloco();
                setTimeout(() => novoInput.focus(), 50);
                return;
            }
            novoRow.style.display = 'none';
            if (!val || val === '') return;

            // Auto-fill from most recent training with this title
            const template = (db.treinos || [])
                .filter(t => t.titulo === val && t.turmaId === db.activeTurmaId)
                .sort((a, b) => b.data.localeCompare(a.data))[0];

            if (template) {
                const tipoBtn = document.querySelector(`.tipo-btn.tipo-${template.tipo}`);
                selectTipo(template.tipo, tipoBtn);
                document.getElementById('treinoDuracao').value = template.duracaoMins;
                document.getElementById('treinoPse').value = template.psePlanejada;
                document.getElementById('pseVal').innerText = template.psePlanejada;
                document.getElementById('blocosContainer').innerHTML = '';
                blocoCounter = 0;
                (template.blocos || []).forEach(b => addBloco(b));
                if ((template.blocos || []).length === 0) addBloco();
            }
        }

        function getTituloFinal() {
            const val = document.getElementById('treinoTituloValue').value;
            if (val === '__novo__' || val === '') {
                return document.getElementById('treinoTituloNovo').value.trim();
            }
            return val;
        }

        function deleteSavedTitle(title) {
            if (!title) return;

            showConfirmModal(
                `Excluir sugestão "${title}"?`,
                'Isso removerá o nome desta sessão de todos os treinos desta equipe que a utilizam.',
                () => { _doDeleteSavedTitle(title); }
            );
            return;
        }
        function _doDeleteSavedTitle(title) {
            if (!title) return;

            const turmaId = db.activeTurmaId;
            let count = 0;

            db.treinos.forEach(t => {
                if (t.turmaId === turmaId && t.titulo === title) {
                    t.titulo = ""; // Remove o título para que não seja mais lincado
                    count++;
                }
            });

            saveDB();

            // Se o título deletado era o que estava selecionado, limpa
            const currentSelected = document.getElementById('treinoTituloValue').value;
            populateTitleSelect(currentSelected === title ? null : currentSelected);

            showToast(`Título removido. ${count} treino(s) atualizado(s).`);
        }

        // ============================================================
        //  MODAL - OPEN / EDIT / CLOSE
        // ============================================================
        // ── DESTINATÁRIO ──────────────────────────────────────────
        function setDestinatario(val) {
            document.getElementById('treinoDestinatario').value = val;
            document.getElementById('destEquipe').classList.toggle('active', val === 'equipe');
            document.getElementById('destAtleta').classList.toggle('active', val === 'atletas');
            document.getElementById('atletaDestinatarioRow').style.display = val === 'atletas' ? '' : 'none';
        }

        function populateAtletasDestinatarioChips(selectedIds) {
            selectedIds = selectedIds || [];
            const container = document.getElementById('atletasChipsContainer');
            const emptyMsg = document.getElementById('atletasChipsEmpty');
            const alunosTurma = (db.alunos || []).filter(a => a.turmaId === db.activeTurmaId);
            if (alunosTurma.length === 0) {
                container.innerHTML = '';
                emptyMsg.style.display = '';
                return;
            }
            emptyMsg.style.display = 'none';
            container.innerHTML = alunosTurma.map(a => {
                const sel = selectedIds.includes(a.id);
                return `<label class="atleta-chip ${sel ? 'selected' : ''}" data-id="${a.id}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;cursor:pointer;user-select:none;border:2px solid ${sel ? 'var(--primary)' : 'var(--border)'};background:${sel ? 'rgba(99,102,241,0.12)' : 'transparent'};color:${sel ? 'var(--primary)' : 'var(--text-muted)'};font-size:13px;font-weight:500;transition:all .15s;" onclick="toggleAtletaChip(this, ${a.id})">
                    <i class="ti ti-user" style="font-size:12px;"></i> ${escapeHtml(a.nome)}
                </label>`;
            }).join('');
        }

        function toggleAtletaChip(el, id) {
            const sel = el.classList.toggle('selected');
            el.style.border = `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`;
            el.style.background = sel ? 'rgba(99,102,241,0.12)' : 'transparent';
            el.style.color = sel ? 'var(--primary)' : 'var(--text-muted)';
        }

        function getSelectedAtletasIds() {
            return Array.from(document.querySelectorAll('#atletasChipsContainer .atleta-chip.selected'))
                .map(el => parseInt(el.dataset.id));
        }

        function openModalTreino(dateStr) {
            document.getElementById('treinoEditId').value = '';
            document.getElementById('modalTreinoTitle').innerText = 'Nova Sessão de Treino';
            document.getElementById('btnDeleteTreino').style.display = 'none';
            document.getElementById('treinoData').value = dateStr;
            document.getElementById('treinoHorario').value = '17:00';
            document.getElementById('treinoDuracao').value = 90;
            document.getElementById('treinoPse').value = 6;
            document.getElementById('pseVal').innerText = '6';
            document.getElementById('treinoObs').value = '';
            document.querySelectorAll('input[name="treinoProtecao"]').forEach(r => {
                if (r.value === 'sim') r.checked = true;
            });
            document.getElementById('blocosContainer').innerHTML = '';
            blocoCounter = 0;

            populateTitleSelect(null);
            document.querySelector('input[name="treinoMacro"][value="taekwondo"]').checked = true;
            updateTipoOpcoes();

            // Reset destinatário
            setDestinatario('equipe');
            populateAtletasDestinatarioChips([]);

            renderTemplateSelector();
            document.getElementById('treinoViewPanel').style.display = 'none';
            document.getElementById('treinoEditPanel').style.display = '';
            document.getElementById('modalTreino').classList.add('active');
        }

        function closeModalTreino() {
            document.getElementById('modalTreino').classList.remove('active');
        }

        function editTreino(id) {
            const t = db.treinos.find(t => t.id === id);
            if (!t) return;
            // Open in VIEW mode
            document.getElementById('treinoEditId').value = id;
            document.getElementById('modalTreinoTitle').innerText = t.titulo;
            renderViewPanel(t);
            switchToViewMode();

            const btnDownload = document.getElementById('btnDownloadPDF');
            if (btnDownload) {
                btnDownload.style.display = 'block';
                btnDownload.onclick = () => downloadTreinoPDF(t.id);
            }

            document.getElementById('modalTreino').classList.add('active');
        }

        function renderViewPanel(t) {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const [y, m, d] = (t.data || '').split('-');
            const dataFmt = t.data ? `${d}/${m}/${y}` : '';
            const protecao = t.protecao || 'sim';

            let blocosHtml = '';
            (t.blocos || []).forEach(b => {
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

            document.getElementById('treinoViewPanel').innerHTML = `
                <div class="view-meta-row">
                    ${dataFmt ? `<span class="view-meta-item"><i class="ti ti-calendar"></i> ${dataFmt}</span>` : ''}
                    ${t.horario ? `<span class="view-meta-item"><i class="ti ti-clock"></i> ${t.horario}</span>` : ''}
                    <span class="view-tipo-badge tipo-${t.tipo}">${TIPO_LABELS[t.tipo] || t.tipo}</span>
                    <span class="prot-badge ${protecao === 'sim' ? 'prot-sim' : 'prot-nao'}">
                        ${protecao === 'sim' ? 'Com Proteção' : 'Sem Proteção'}
                    </span>
                </div>
                <div class="view-stats-row">
                    ${t.duracaoMins ? `<div class="view-stat"><i class="ti ti-clock-hour-4"></i> ${t.duracaoMins} min</div>` : ''}
                    ${t.psePlanejada ? `<div class="view-stat"><i class="ti ti-gauge"></i> PSE ${t.psePlanejada}/10</div>` : ''}
                    ${t.cargaTreino ? (() => {
                    const c = t.cargaTreino;
                    const cColor = c >= 1000 ? 'var(--red)' : c >= 500 ? 'var(--yellow)' : 'var(--green)';
                    return `<div class="view-stat" title="Carga Foster = PSE × Duração (Unidades Arbitrárias)" style="color:${cColor};font-weight:700;">
                            <i class="ti ti-bolt" style="color:${cColor};"></i> ${c} CARGA
                        </div>`;
                })() : ''}
                </div>
                ${(() => {
                    const aids = t.atletasIds || (t.atletaId ? [t.atletaId] : []);
                    if ((t.destinatario === 'atletas' || t.destinatario === 'atleta') && aids.length > 0) {
                        const names = aids.map(id => {
                            const a = (db.alunos || []).find(a => a.id === id);
                            return a ? escapeHtml(a.nome) : `#${id}`;
                        }).join(', ');
                        return `<div class="view-section-label"><i class="ti ti-users" style="font-size:12px;"></i> Destinatário(s)</div><div class="view-obs-text" style="font-size:13px;">${names}</div>`;
                    }
                    return '';
                })()}
                ${blocosHtml ? `<div class="view-section-label">Blocos de Trabalho</div>${blocosHtml}` : ''}
                ${t.obs ? `<div class="view-section-label">Observações</div><div class="view-obs-text">${t.obs}</div>` : ''}
                <div class="view-actions">
                    <button class="btn" onclick="deleteTreinoAtual()" style="color:var(--red);background:rgba(239,68,68,0.1);">
                        <i class="ti ti-trash"></i> Excluir
                    </button>
                    <div style="display:flex;gap:10px;">
                        <button class="btn" onclick="saveAsTemplate()" style="background:rgba(245,158,11,0.1);color:var(--yellow);" title="Salvar estrutura deste treino como template reutilizável">
                            <i class="ti ti-bookmark-plus"></i> Salvar como Template
                        </button>
                        <button class="btn" onclick="duplicateTreinoAtual()" style="background:rgba(59,130,246,0.1);color:var(--primary);">
                            <i class="ti ti-copy"></i> Duplicar
                        </button>
                        <button class="btn" onclick="closeModalTreino()">Fechar</button>
                        <button class="btn btn-primary" onclick="switchToEditMode()">
                            <i class="ti ti-edit"></i> Editar
                        </button>
                    </div>
                </div>`;
        }

        function switchToViewMode() {
            document.getElementById('treinoViewPanel').style.display = '';
            document.getElementById('treinoEditPanel').style.display = 'none';
        }

        async function downloadTreinoPDF(id) {
            const t = db.treinos.find(treino => treino.id === id);
            if (!t) return;

            const { jsPDF } = window.jspdf;
            const doc = patchDocText(new jsPDF());

            const [y, m, d] = (t.data || '').split('-');
            const dataFmt = t.data ? `${d}/${m}/${y}` : '';
            const protecao = (t.protecao || 'sim') === 'sim' ? 'SIM' : 'NÃO';

            // Header
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(t.titulo.toUpperCase(), 15, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`DATA: ${dataFmt}  |  HORÁRIO: ${t.horario || '--:--'}  |  TIPO: ${(t.tipo || '').toUpperCase()}  |  PROTEÇÃO: ${protecao}`, 15, 30);

            // Stats
            let yPos = 55;
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`DURAÇÃO: ${t.duracaoMins || 0} min`, 15, yPos);
            doc.text(`PSE PLANEJADA: ${t.psePlanejada || 0}/10`, 80, yPos);
            yPos += 15;

            // Blocos
            (t.blocos || []).forEach((b, idx) => {
                if (yPos > 260) { doc.addPage(); yPos = 20; }

                doc.setFillColor(241, 245, 249);
                doc.rect(15, yPos - 5, 180, 8, 'F');
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`${idx + 1}. ${b.nome || 'Bloco'} (${b.duracaoMins} min)`, 18, yPos + 1);
                yPos += 8;

                if (b.descricao) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'italic');
                    const descLines = doc.splitTextToSize(b.descricao, 170);
                    doc.text(descLines, 18, yPos);
                    yPos += (descLines.length * 5) + 2;
                }

                (b.exercicios || []).forEach(ex => {
                    const exObj = typeof ex === 'string' ? { nome: ex, valor: '', obs: '' } : ex;
                    if (yPos > 275) { doc.addPage(); yPos = 20; }

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.circle(20, yPos - 1, 0.5, 'F');
                    doc.text(`${exObj.nome} ${exObj.valor ? ' - ' + exObj.valor : ''}`, 24, yPos);
                    yPos += 5;

                    if (exObj.obs) {
                        doc.setFontSize(9);
                        doc.setTextColor(100, 100, 100);
                        const obsLines = doc.splitTextToSize(`Obs: ${exObj.obs}`, 160);
                        doc.text(obsLines, 24, yPos);
                        yPos += (obsLines.length * 4) + 2;
                        doc.setTextColor(30, 41, 59);
                    }
                });
                yPos += 5;
            });

            if (t.obs) {
                if (yPos > 260) { doc.addPage(); yPos = 20; }
                doc.setFont('helvetica', 'bold');
                doc.text('OBSERVAÇÕES GERAIS:', 15, yPos);
                yPos += 6;
                doc.setFont('helvetica', 'normal');
                const finalObs = doc.splitTextToSize(t.obs, 180);
                doc.text(finalObs, 15, yPos);
            }

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Gerado por TKD Scout - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            }

            doc.save(`treino_${t.titulo.replace(/\s+/g, '_')}_${dataFmt.replace(/\//g, '-')}.pdf`);
            showToast("PDF gerado com sucesso!");
        }

        function switchToEditMode() {
            const id = parseInt(document.getElementById('treinoEditId').value);
            const t = db.treinos.find(t => t.id === id);
            if (!t) return;
            // Populate edit form
            document.getElementById('btnDeleteTreino').style.display = '';
            // document.getElementById('btnDeleteSavedTitle').style.display = 'none'; // Removido (agora no dropdown)
            document.getElementById('treinoData').value = t.data;
            document.getElementById('treinoHorario').value = t.horario || '17:00';
            document.getElementById('treinoDuracao').value = t.duracaoMins;
            document.getElementById('treinoPse').value = t.psePlanejada;
            document.getElementById('pseVal').innerText = t.psePlanejada;
            document.getElementById('treinoObs').value = t.obs || '';

            const protecao = t.protecao || 'sim';
            document.querySelectorAll('input[name="treinoProtecao"]').forEach(r => {
                if (r.value === protecao) r.checked = true;
            });

            document.getElementById('blocosContainer').innerHTML = '';
            blocoCounter = 0;
            populateTitleSelect(t.titulo);

            const isFisico = TIPOS_FISICO.some(tipo => tipo.id === t.tipo) || t.tipo === 'fisico';
            document.querySelector(`input[name="treinoMacro"][value="${isFisico ? 'fisico' : 'taekwondo'}"]`).checked = true;
            updateTipoOpcoes();

            setTimeout(() => {
                const tipoBtn = document.querySelector(`.tipo-btn.tipo-${t.tipo}`);
                selectTipo(t.tipo, tipoBtn);
            }, 20);
            (t.blocos || []).forEach(b => addBloco(b));

            // Carregar destinatário
            const dest = t.destinatario === 'atleta' ? 'atletas' : (t.destinatario || 'equipe');
            const preSelectedIds = t.atletasIds || (t.atletaId ? [t.atletaId] : []);
            populateAtletasDestinatarioChips(preSelectedIds);
            setDestinatario(dest);

            document.getElementById('treinoViewPanel').style.display = 'none';
            document.getElementById('treinoEditPanel').style.display = '';
        }

        function cancelarEdicao() {
            const id = parseInt(document.getElementById('treinoEditId').value);
            if (id) {
                // Return to view mode
                const t = db.treinos.find(t => t.id === id);
                if (t) {
                    document.getElementById('modalTreinoTitle').innerText = t.titulo;
                    renderViewPanel(t);
                    switchToViewMode();
                    return;
                }
            }
            closeModalTreino();
        }


        function selectTipo(tipo, el) {
            document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
            if (el) el.classList.add('active');
            selectedTipo = tipo;
            document.getElementById('treinoTipo').value = tipo;
        }

        // ============================================================
        //  BLOCOS
        // ============================================================
        function addBloco(data) {
            const id = ++blocoCounter;
            const nome = data?.nome || '';
            const dur = data?.duracaoMins || 15;
            const desc = data?.descricao || '';
            const exercicios = data?.exercicios || [];

            const div = document.createElement('div');
            div.className = 'bloco-card';
            div.id = `bloco_${id}`;
            div.innerHTML = `
                <div class="bloco-header">
                    <i class="ti ti-grip-vertical bloco-drag"></i>
                    <input type="text" class="form-control bloco-nome" style="flex:2;" placeholder="Nome do bloco (ex: Aquecimento)" value="${nome}">
                    <input type="number" class="form-control bloco-dur" style="width:80px;" min="1" max="120" value="${dur}" title="Duração (min)">
                    <span style="font-size:12px;color:var(--text-muted);white-space:nowrap;">min</span>
                    <button class="btn btn-icon danger" onclick="document.getElementById('bloco_${id}').remove()" title="Removeráá bloco">
                        <i class="ti ti-trash" style="color:var(--red);"></i>
                    </button>
                </div>
                <textarea class="form-control bloco-desc" rows="2" placeholder="Descrição / orientações deste bloco..." style="margin-bottom:10px;">${desc}</textarea>
                <div style="font-size:12px;font-weight:500;color:var(--text-muted);margin-bottom:4px;">Exercícios</div>
                <div class="exercicios-container" id="exContainer_${id}"></div>
                <div class="ex-add-row">
                    <div class="ex-nome-wrap">
                        <input type="text" id="exNome_${id}" class="form-control ex-nome-input"
                            placeholder="Nome do exercício..."
                            onkeydown="if(event.key==='Enter'){event.preventDefault();addExercicio(${id});}">
                        <button type="button" class="ex-nome-arrow" onclick="toggleExLibDropdown('${id}')">&#9660;</button>
                        <div class="ex-lib-dropdown" id="exLib_${id}"></div>
                    </div>
                    <select id="exTipo_${id}" class="form-control ex-tipo-sel" onchange="updateExValInput(${id})">
                        <option value="series">Séries × Rep</option>
                        <option value="tempo">Tempo</option>
                        <option value="quantidade">Quantidade</option>
                        <option value="texto">Texto livre</option>
                    </select>
                    <div id="exValWrap_${id}" class="ex-val-wrap">
                        <input type="number" id="exSets_${id}" class="form-control" min="1" max="20" value="3" style="width:48px;" title="Séries">
                        <span class="ex-sep">×</span>
                        <input type="number" id="exReps_${id}" class="form-control" min="1" max="200" value="10" style="width:52px;" title="Reps">
                    </div>
                    <button class="btn" onclick="addExercicio(${id})" style="flex-shrink:0;">
                        <i class="ti ti-plus"></i> Add
                    </button>
                </div>
                <input type="text" id="exObs_${id}" class="form-control ex-obs-input"
                    placeholder="Observação ou link do exercício... (opcional)">`;

            document.getElementById('blocosContainer').appendChild(div);
            populateExLibDatalist(id);

            // Allow dropping onto the container itself (at the end of the list)
            const exContainer = document.getElementById(`exContainer_${id}`);
            exContainer.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            exContainer.addEventListener('drop', e => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const dragged = document.getElementById(draggedId);
                if (!dragged) return;
                // Only append if the drop target is the container itself (not a child)
                if (e.target === exContainer) exContainer.appendChild(dragged);
            });

            exercicios.forEach(ex => {
                const exObj = typeof ex === 'string' ? { nome: ex, tipo: 'texto', valor: '' } : ex;
                addExercicioItem(id, exObj);
            });
        }

        function updateExValInput(blocoId) {
            const tipo = document.getElementById(`exTipo_${blocoId}`).value;
            const wrap = document.getElementById(`exValWrap_${blocoId}`);
            if (tipo === 'series') {
                wrap.innerHTML = `
                    <input type="number" id="exSets_${blocoId}" class="form-control" min="1" max="20" value="3" style="width:48px;" title="Séries">
                    <span class="ex-sep">×</span>
                    <input type="number" id="exReps_${blocoId}" class="form-control" min="1" max="200" value="10" style="width:52px;" title="Reps">`;
            } else if (tipo === 'tempo') {
                wrap.innerHTML = `<input type="text" id="exVal_${blocoId}" class="form-control" placeholder="ex: 3:00" style="width:80px;" title="Duração (mm:ss ou seg)">`;
            } else if (tipo === 'quantidade') {
                wrap.innerHTML = `
                    <input type="number" id="exVal_${blocoId}" class="form-control" min="1" value="10" style="width:56px;" title="Quantidade">
                    <input type="text" id="exUnit_${blocoId}" class="form-control" placeholder="unid." style="width:60px;" title="Unidade (m, kg, vezes...)">`;
            } else {
                wrap.innerHTML = `<input type="text" id="exVal_${blocoId}" class="form-control" placeholder="Descrição..." style="width:160px;">`;
            }
        }

        function addExercicio(blocoId) {
            const nomeInput = document.getElementById(`exNome_${blocoId}`);
            const nome = nomeInput.value.trim();
            if (!nome) return;

            const tipo = document.getElementById(`exTipo_${blocoId}`).value;
            let valor = '';

            if (tipo === 'series') {
                const sets = document.getElementById(`exSets_${blocoId}`)?.value || '3';
                const reps = document.getElementById(`exReps_${blocoId}`)?.value || '10';
                valor = `${sets} × ${reps}`;
            } else if (tipo === 'quantidade') {
                const qty = document.getElementById(`exVal_${blocoId}`)?.value || '';
                const unit = document.getElementById(`exUnit_${blocoId}`)?.value.trim() || '';
                valor = unit ? `${qty} ${unit}` : qty;
            } else {
                valor = document.getElementById(`exVal_${blocoId}`)?.value?.trim() || '';
            }

            const obsInput = document.getElementById(`exObs_${blocoId}`);
            const obs = obsInput ? obsInput.value.trim() : '';

            addExercicioItem(blocoId, { nome, tipo, valor, obs });
            saveExercicioLibrary(nome, blocoId);
            nomeInput.value = '';
            if (obsInput) obsInput.value = '';
            nomeInput.focus();
        }

        function addExercicioItem(blocoId, ex) {
            const container = document.getElementById(`exContainer_${blocoId}`);
            const itemId = `ex_${blocoId}_${Date.now()}`;
            const item = document.createElement('div');
            item.className = 'exercicio-item';
            item.id = itemId;
            item.dataset.nome = ex.nome;
            item.dataset.tipo = ex.tipo || 'texto';
            item.dataset.valor = ex.valor || '';
            item.dataset.obs = ex.obs || '';
            item.draggable = true;

            const isLink = ex.obs && (ex.obs.startsWith('http://') || ex.obs.startsWith('https://'));
            const obsHtml = ex.obs
                ? isLink
                    ? `<a href="${ex.obs}" target="_blank" rel="noopener" class="ex-item-obs ex-item-link"><i class="ti ti-link" style="font-size:10px;"></i> Ver link</a>`
                    : `<span class="ex-item-obs">${ex.obs}</span>`
                : '';

            item.innerHTML = `
                <span class="ex-drag-handle" title="Arrastar">⠿</span>
                <div class="ex-item-body">
                    <div class="ex-item-info">
                        <span class="ex-item-nome">${ex.nome}</span>
                        ${ex.valor ? `<span class="ex-item-val">${ex.valor}</span>` : ''}
                    </div>
                    ${obsHtml}
                    <div class="ex-item-edit-form" id="editForm_${itemId}">
                        <div class="edit-row">
                            <label>Nome</label>
                            <input type="text" id="editNome_${itemId}" value="${ex.nome.replace(/"/g, '&quot;')}">
                        </div>
                        <div class="edit-row">
                            <label>Carga/Reps</label>
                            <input type="text" id="editValor_${itemId}" value="${(ex.valor || '').replace(/"/g, '&quot;')}" placeholder="Ex: 3×10, 5kg, 30s">
                        </div>
                        <div class="edit-row">
                            <label>Obs/Link</label>
                            <input type="text" id="editObs_${itemId}" value="${(ex.obs || '').replace(/"/g, '&quot;')}" placeholder="Observação ou URL">
                        </div>
                        <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:2px;">
                            <button class="btn" style="font-size:11px; padding:4px 10px;" onclick="saveExItemEdit('${itemId}')">
                                <i class="ti ti-check" style="font-size:11px;"></i> Salvar
                            </button>
                            <button class="btn" style="font-size:11px; padding:4px 10px; background:transparent; border-color:rgba(255,255,255,0.1);" onclick="toggleExItemEdit('${itemId}', false)">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:4px; align-items:center; flex-shrink:0;">
                    <button class="btn btn-icon" onclick="toggleExItemEdit('${itemId}', true)" title="Editar" style="background:rgba(59,130,246,0.15); border-color:rgba(59,130,246,0.3); color:var(--primary);">
                        <i class="ti ti-pencil" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-icon danger" onclick="document.getElementById('${itemId}').remove()" title="Remover">
                        <i class="ti ti-x" style="font-size:11px;"></i>
                    </button>
                </div>`;

            setupExItemDrag(item, container);
            container.appendChild(item);
        }

        function toggleExItemEdit(itemId, open) {
            const form = document.getElementById(`editForm_${itemId}`);
            if (!form) return;
            if (open) {
                form.classList.add('open');
                document.getElementById(`editNome_${itemId}`)?.focus();
            } else {
                form.classList.remove('open');
            }
        }

        function saveExItemEdit(itemId) {
            const item = document.getElementById(itemId);
            if (!item) return;
            const nome = document.getElementById(`editNome_${itemId}`).value.trim();
            const valor = document.getElementById(`editValor_${itemId}`).value.trim();
            const obs = document.getElementById(`editObs_${itemId}`).value.trim();
            if (!nome) return;

            item.dataset.nome = nome;
            item.dataset.valor = valor;
            item.dataset.obs = obs;

            // Update visible spans
            item.querySelector('.ex-item-nome').textContent = nome;
            const valSpan = item.querySelector('.ex-item-val');
            if (valor) {
                if (valSpan) { valSpan.textContent = valor; }
                else { item.querySelector('.ex-item-info').insertAdjacentHTML('beforeend', `<span class="ex-item-val">${valor}</span>`); }
            } else if (valSpan) { valSpan.remove(); }

            // Update obs display (sibling of the info div, before the edit form)
            const infoDiv = item.querySelector('.ex-item-info');
            // Remove existing obs node (could be span or a)
            const existingObs = item.querySelector('.ex-item-obs');
            if (existingObs) existingObs.remove();
            const isLink = obs.startsWith('http://') || obs.startsWith('https://');
            if (obs) {
                const obsEl = isLink
                    ? `<a href="${obs}" target="_blank" rel="noopener" class="ex-item-obs ex-item-link"><i class="ti ti-link" style="font-size:10px;"></i> Ver link</a>`
                    : `<span class="ex-item-obs">${obs}</span>`;
                infoDiv.insertAdjacentHTML('afterend', obsEl);
            }

            toggleExItemEdit(itemId, false);
        }

        function setupExItemDrag(item, container) {
            item.addEventListener('dragstart', e => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.id);
                setTimeout(() => item.classList.add('dragging'), 0);
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                container.querySelectorAll('.exercicio-item').forEach(i => i.classList.remove('drag-over'));
            });
            item.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                container.querySelectorAll('.exercicio-item').forEach(i => i.classList.remove('drag-over'));
                if (!item.classList.contains('dragging')) item.classList.add('drag-over');
            });
            item.addEventListener('drop', e => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const dragged = document.getElementById(draggedId);
                if (!dragged || dragged === item) return;
                // Insert dragged before or after the target depending on mouse position
                const rect = item.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    container.insertBefore(dragged, item);
                } else {
                    item.insertAdjacentElement('afterend', dragged);
                }
                item.classList.remove('drag-over');
            });
        }


        function saveExercicioLibrary(nome, blocoId) {
            if (!db.exercicios) db.exercicios = [];
            if (!db.exercicios.includes(nome)) {
                db.exercicios.push(nome);
                saveDB();
            }
            // Update all dropdowns in the modal
            document.querySelectorAll('[id^="exLib_"]').forEach(dl => {
                populateExLibDropdownEl(dl);
            });
        }

        function populateExLibDropdownEl(el) {
            if (!el) return;
            const sorted = [...(db.exercicios || [])].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
            el.innerHTML = '';
            if (sorted.length === 0) {
                el.innerHTML = '<div class="ex-lib-empty">Nenhum exercício salvo</div>';
                return;
            }
            sorted.forEach(name => {
                const opt = document.createElement('div');
                opt.className = 'ex-lib-option';

                const label = document.createElement('span');
                label.className = 'ex-lib-option-label';
                label.textContent = name;
                label.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    const blocoId = el.id.replace('exLib_', '');
                    const input = document.getElementById(`exNome_${blocoId}`);
                    if (input) input.value = name;
                    el.classList.remove('open');
                });

                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'ex-lib-del';
                del.innerHTML = '&times;';
                del.title = 'Excluir';
                del.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    db.exercicios = (db.exercicios || []).filter(n => n !== name);
                    saveDB();
                    document.querySelectorAll('[id^="exLib_"]').forEach(d => populateExLibDropdownEl(d));
                });

                opt.appendChild(label);
                opt.appendChild(del);
                el.appendChild(opt);
            });
        }

        function populateExLibDatalist(blocoId) {
            const dl = document.getElementById(`exLib_${blocoId}`);
            populateExLibDropdownEl(dl);
        }

        function toggleExLibDropdown(blocoId) {
            const dl = document.getElementById(`exLib_${blocoId}`);
            if (!dl) return;
            const isOpen = dl.classList.contains('open');
            // Close all open dropdowns first
            document.querySelectorAll('.ex-lib-dropdown.open').forEach(d => d.classList.remove('open'));
            if (!isOpen) {
                populateExLibDropdownEl(dl);
                dl.classList.add('open');
                // Close when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', function closeOnOutside(e) {
                        if (!dl.closest('.ex-nome-wrap').contains(e.target)) {
                            dl.classList.remove('open');
                            document.removeEventListener('click', closeOnOutside);
                        }
                    });
                }, 0);
            }
        }

        // kept for backward compatibility with old saved data
        function addExercicioTag(blocoId, text) {
            addExercicioItem(blocoId, typeof text === 'string'
                ? { nome: text, tipo: 'texto', valor: '' }
                : text);
        }

        function getBlocosData() {
            const blocos = [];
            document.querySelectorAll('.bloco-card').forEach(card => {
                const nome = card.querySelector('.bloco-nome').value.trim();
                const dur = parseInt(card.querySelector('.bloco-dur').value) || 0;
                const desc = card.querySelector('.bloco-desc').value.trim();
                const exercicios = [...card.querySelectorAll('.exercicio-item')].map(item => ({
                    nome: item.dataset.nome,
                    tipo: item.dataset.tipo,
                    valor: item.dataset.valor,
                    obs: item.dataset.obs || ''
                }));
                blocos.push({ id: Date.now() + Math.random(), nome, duracaoMins: dur, descricao: desc, exercicios });
            });
            return blocos;
        }

        // ============================================================
        //  SAVE / DELETE
        // ============================================================

        // ============================================================
        //  TEMPLATES DE TREINO
        // ============================================================
        function saveAsTemplate() {
            const id = parseInt(document.getElementById('treinoEditId').value);
            const t = db.treinos.find(t => t.id === id);
            if (!t) return;

            if (!db.treinoTemplates) db.treinoTemplates = [];

            // Verifica se já existe template com mesmo nome
            const existing = db.treinoTemplates.find(tpl => tpl.nome === t.titulo);
            if (existing) {
                showConfirmModal(
                    'Template já existe',
                    `Já existe um template chamado "${t.titulo}". Deseja substituí-lo?`,
                    () => {
                        Object.assign(existing, {
                            tipo: t.tipo, blocos: JSON.parse(JSON.stringify(t.blocos || [])),
                            obs: t.obs || '', duracaoMins: t.duracaoMins, psePlanejada: t.psePlanejada,
                            macro: t.tipo
                        });
                        saveDB();
                        showToast(`Template "${t.titulo}" atualizado!`);
                    }
                );
                return;
            }

            db.treinoTemplates.push({
                id: Date.now(),
                nome: t.titulo,
                tipo: t.tipo,
                blocos: JSON.parse(JSON.stringify(t.blocos || [])),
                obs: t.obs || '',
                duracaoMins: t.duracaoMins,
                psePlanejada: t.psePlanejada
            });
            saveDB();
            showToast(`Template "${t.titulo}" salvo! Disponível ao criar nova sessão.`);
        }

        function renderTemplateSelector() {
            const templates = db.treinoTemplates || [];
            const container = document.getElementById('templateSelectorRow');
            if (!container) return;

            if (templates.length === 0) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'flex';
            const sel = document.getElementById('templateSelect');
            if (!sel) return;

            sel.innerHTML = '<option value="">Carregar template...</option>' +
                templates.map(tpl =>
                    `<option value="${tpl.id}">${tpl.nome} (${TIPO_LABELS[tpl.tipo] || tpl.tipo})</option>`
                ).join('');
        }

        function loadTemplateIntoForm() {
            const sel = document.getElementById('templateSelect');
            if (!sel || !sel.value) return;

            const tpl = (db.treinoTemplates || []).find(t => t.id === parseInt(sel.value));
            if (!tpl) return;

            showConfirmModal(
                'Carregar Template',
                `Isso substituirá os blocos e configurações atuais pelo template "${tpl.nome}". Continuar?`,
                () => {
                    // Set tipo
                    if (tpl.tipo) {
                        document.getElementById('treinoTipo').value = tpl.tipo;
                        // Determine macro and update tipo buttons
                        const isTkd = [...TIPOS_TAEKWONDO].some(t => t.id === tpl.tipo);
                        const radioTkd = document.querySelector('input[name="treinoMacro"][value="taekwondo"]');
                        const radioFis = document.querySelector('input[name="treinoMacro"][value="fisico"]');
                        if (isTkd && radioTkd) radioTkd.checked = true;
                        else if (radioFis) radioFis.checked = true;
                        updateTipoOpcoes();
                        setTimeout(() => {
                            const btn = document.querySelector(`.tipo-${tpl.tipo}`);
                            if (btn) selectTipo(tpl.tipo, btn);
                        }, 50);
                    }
                    // Set duracao / pse / obs
                    if (tpl.duracaoMins) document.getElementById('treinoDuracao').value = tpl.duracaoMins;
                    if (tpl.psePlanejada) document.getElementById('treinoPse').value = tpl.psePlanejada;
                    if (tpl.obs !== undefined) document.getElementById('treinoObs').value = tpl.obs;
                    // Rebuild blocos
                    document.getElementById('blocosContainer').innerHTML = '';
                    blocoCounter = 0;
                    (tpl.blocos || []).forEach(b => addBloco(b));
                    if ((tpl.blocos || []).length === 0) addBloco();
                    sel.value = '';
                    showToast(`Template "${tpl.nome}" carregado!`);
                }
            );
        }

        function showTemplateManager() {
            const templates = db.treinoTemplates || [];
            if (templates.length === 0) {
                showToast('Nenhum template salvo ainda. Salve um treino como template primeiro.', 'info');
                return;
            }
            // Reuse confirmModal structure for a simple list
            let modal = document.getElementById('_templateManagerModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = '_templateManagerModal';
                modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
                modal.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;max-width:420px;width:100%;max-height:80vh;overflow-y:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <h3 style="margin:0;font-size:16px;">Gerenciar Templates</h3>
                        <button onclick="document.getElementById('_templateManagerModal').style.display='none'" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;">×</button>
                    </div>
                    <div id="_templateList"></div>
                </div>`;
                document.body.appendChild(modal);
                modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
            }
            const list = document.getElementById('_templateList');
            list.innerHTML = templates.map(tpl => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);">
                    <div>
                        <div style="font-weight:600;font-size:14px;">${tpl.nome}</div>
                        <div style="font-size:11px;color:var(--text-muted);">${TIPO_LABELS[tpl.tipo] || tpl.tipo} • ${tpl.duracaoMins || '—'}min • PSE ${tpl.psePlanejada || '—'}</div>
                    </div>
                    <button class="btn btn-icon" style="color:var(--red);" onclick="deleteTemplate(${tpl.id});document.getElementById('_templateManagerModal').style.display='none';">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>`).join('');
            modal.style.display = 'flex';
        }

        function deleteTemplate(templateId) {
            const tpl = (db.treinoTemplates || []).find(t => t.id === templateId);
            if (!tpl) return;
            showConfirmModal('Excluir Template', `Excluir o template "${tpl.nome}"?`, () => {
                db.treinoTemplates = db.treinoTemplates.filter(t => t.id !== templateId);
                saveDB();
                renderTemplateSelector();
                showToast('Template excluído.');
            });
        }

        // ============================================================
        //  COPIAR SEMANA ANTERIOR
        // ============================================================
        function copyPreviousWeek() {
            const weekStart = getWeekStart(currentDate);
            const prevStart = new Date(weekStart);
            prevStart.setDate(prevStart.getDate() - 7);

            // Treinos da semana anterior
            const prevTreinos = (db.treinos || []).filter(t => {
                if (t.turmaId !== db.activeTurmaId) return false;
                const d = new Date(t.data + 'T12:00:00');
                return d >= prevStart && d < weekStart;
            });

            if (prevTreinos.length === 0) {
                showToast('Nenhum treino encontrado na semana anterior.', 'info');
                return;
            }

            // Verifica se já existem treinos na semana atual
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            const currentHasTreinos = (db.treinos || []).some(t => {
                if (t.turmaId !== db.activeTurmaId) return false;
                const d = new Date(t.data + 'T12:00:00');
                return d >= weekStart && d < weekEnd;
            });

            const doTheCopy = () => {
                prevTreinos.forEach(t => {
                    const prevDate = new Date(t.data + 'T12:00:00');
                    const newDate = new Date(prevDate);
                    newDate.setDate(newDate.getDate() + 7);
                    const clone = JSON.parse(JSON.stringify(t));
                    clone.id = Date.now() + Math.random() * 1000 | 0;
                    clone.data = toDateStr(newDate);
                    clone._updatedAt = Date.now();
                    db.treinos.push(clone);
                });
                saveDB();
                renderCalendar();
                showToast(`${prevTreinos.length} treino(s) copiado(s) da semana anterior!`);
            };

            if (currentHasTreinos) {
                showConfirmModal(
                    'Copiar semana anterior',
                    `A semana atual já tem treinos. Deseja adicionar os ${prevTreinos.length} treino(s) da semana passada mesmo assim?`,
                    doTheCopy
                );
            } else {
                doTheCopy();
            }
        }

        function duplicateTreinoAtual() {
            const id = parseInt(document.getElementById('treinoEditId').value);
            if (!id) return;

            const original = db.treinos.find(t => t.id === id);
            if (!original) return;

            const clone = JSON.parse(JSON.stringify(original));
            clone.id = Date.now();
            // Garante que o título seja identico mas limpo de sufixos de cópia antigos
            clone.titulo = (clone.titulo || '').replace(/\s*\(Cópia\)\s*$/i, '').trim();

            db.treinos.push(clone);
            saveDB();
            renderCalendar();
            closeModalTreino();
            showToast('Treino duplicado com sucesso!');
        }

        function saveTreino(e) {
            const titulo = getTituloFinal();
            if (!titulo) { showToast('Digite ou selecione um título para a sessão.', 'error'); return; }

            const editId = document.getElementById('treinoEditId').value;
            const trainingId = editId ? parseInt(editId) : Date.now();

            const protecao = document.querySelector('input[name="treinoProtecao"]:checked')?.value || 'sim';

            const duracaoMins = parseInt(document.getElementById('treinoDuracao').value) || 90;
            const psePlanejada = parseInt(document.getElementById('treinoPse').value);
            // Cálculo de Foster: Carga Total (CARGA) = PSE (Borg 0-10) × Duração (min)
            const cargaTreino = psePlanejada * duracaoMins;

            const destinatario = document.getElementById('treinoDestinatario').value || 'equipe';
            const atletasIds = destinatario === 'atletas' ? getSelectedAtletasIds() : [];

            const treino = {
                id: trainingId,
                data: document.getElementById('treinoData').value,
                titulo,
                tipo: document.getElementById('treinoTipo').value || 'tecnico',
                protecao,
                horario: document.getElementById('treinoHorario').value,
                duracaoMins,
                psePlanejada,
                cargaTreino,
                blocos: getBlocosData(),
                obs: document.getElementById('treinoObs').value.trim(),
                turmaId: db.activeTurmaId,
                destinatario,
                atletasIds,
                _updatedAt: Date.now()
            };

            if (editId) {
                const idx = db.treinos.findIndex(t => t.id === treino.id);
                if (idx > -1) db.treinos[idx] = treino;
            } else {
                db.treinos.push(treino);
                // Update hidden ID so subsequent saves in same session are "edits"
                document.getElementById('treinoEditId').value = trainingId;
            }

            saveDB();
            renderCalendar();
            showToast(`Sessão "${titulo}" salva com sucesso!`);

            // Re-render view panel so next time it opens in view mode
            document.getElementById('modalTreinoTitle').innerText = treino.titulo;
            renderViewPanel(treino);
            switchToViewMode();

            // Auto-close as requested by user
            closeModalTreino();
        }

        function deleteTreinoAtual() {
            const editId = parseInt(document.getElementById('treinoEditId').value);
            if (!editId) return;
            showConfirmModal('Excluir treino?', 'Esta sessão de treino será removida permanentemente.', () => {
                db.treinos = db.treinos.filter(t => t.id !== editId);
                saveDB();
                closeModalTreino();
                renderCalendar();
                showToast('Treino excluído.');
            });
        }

        // ============================================================
        //  HELPERS
        // ============================================================
        function toDateStr(d) {
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }

        function getTreinosDia(dateStr) {
            return (db.treinos || [])
                .filter(t => t.data === dateStr && t.turmaId === db.activeTurmaId)
                .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
        }

        // ============================================================
        //  PERIODIZAÇÃO — FUNÇÕES DE CÁLCULO
        // ============================================================

        /** Retorna data de início de semana (segunda-feira) para uma data */
        function getWeekStartFor(date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const day = d.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            d.setDate(d.getDate() + diff);
            return d;
        }

        /**
         * Retorna o foco de um treino: 'fisico' ou 'tkd'.
         * Usado para detectar conflito de foco entre treino de equipe e treino individual.
         */
        function getFocoTreino(tipo) {
            const FISICO_IDS = new Set(TIPOS_FISICO.map(t => t.id).concat(['fisico']));
            return FISICO_IDS.has(tipo) ? 'fisico' : 'tkd';
        }

        /**
         * Para um atletaId e uma data, retorna o conjunto de focos que têm
         * treino individual para esse atleta (destinatario === 'atleta').
         * Usado para excluir treinos de equipe do mesmo foco.
         */
        function getFocosIndividuaisNaData(atletaId, data) {
            return new Set(
                (db.treinos || [])
                    .filter(t => {
                        const dest = t.destinatario || 'equipe';
                        if (t.turmaId !== db.activeTurmaId || t.data !== data) return false;
                        if (dest !== 'atletas' && dest !== 'atleta') return false;
                        const ids = t.atletasIds || (t.atletaId ? [t.atletaId] : []);
                        return ids.includes(atletaId);
                    })
                    .map(t => getFocoTreino(t.tipo))
            );
        }

        /**
         * Verifica se um treino de equipe deve ser excluído para um atleta específico.
         * Regra: se no mesmo dia o atleta tem um treino individual com o MESMO foco,
         * o treino de equipe é substituído e não conta para esse atleta.
         */
        function treinoEquipeSubstituidoPorIndividual(treino, atletaId) {
            if (!atletaId) return false;
            const dest = treino.destinatario || 'equipe';
            if (dest !== 'equipe') return false;
            const focosIndividuais = getFocosIndividuaisNaData(atletaId, treino.data);
            return focosIndividuais.has(getFocoTreino(treino.tipo));
        }

        /**
         * Soma cargas de treinos da semana.
         * atletaId opcional: se fornecido, inclui apenas treinos da equipe
         * ou especificamente para este atleta (exclui treinos de outros atletas).
         * Regra de substituição: treino de equipe é excluído se o atleta tem
         * treino individual do mesmo foco no mesmo dia.
         */
        function calcWeekLoad(weekStart, atletaId) {
            const ws = toDateStr(weekStart);
            const we = new Date(weekStart);
            we.setDate(we.getDate() + 6);
            const weStr = toDateStr(we);
            return (db.treinos || [])
                .filter(t => {
                    if (t.turmaId !== db.activeTurmaId) return false;
                    if (t.data < ws || t.data > weStr) return false;
                    if (atletaId) {
                        const dest = t.destinatario || 'equipe';
                        if (dest === 'atletas' || dest === 'atleta') {
                            const ids = t.atletasIds || (t.atletaId ? [t.atletaId] : []);
                            if (!ids.includes(atletaId)) return false;
                        }
                        if (treinoEquipeSubstituidoPorIndividual(t, atletaId)) return false;
                    }
                    return true;
                })
                .reduce((sum, t) => sum + (t.cargaTreino || 0), 0);
        }

        /** Retorna cargas das últimas N semanas (mais recente primeiro) */
        function calcWeekLoads(n, referenceDate, atletaId) {
            const ref = getWeekStartFor(referenceDate || new Date());
            const loads = [];
            for (let i = 0; i < n; i++) {
                const ws = new Date(ref);
                ws.setDate(ref.getDate() - i * 7);
                loads.push({ weekStart: ws, load: calcWeekLoad(ws, atletaId) });
            }
            return loads; // índice 0 = semana atual
        }

        /** ACWR = Carga Aguda (semana 0) / Carga Crônica (média semanas 0-3) */
        function calcACWR(weekLoads) {
            const acute = weekLoads[0]?.load || 0;
            const chronic4 = weekLoads.slice(0, 4).map(w => w.load);
            const chronic = chronic4.reduce((s, v) => s + v, 0) / (chronic4.length || 1);
            return { acute, chronic: Math.round(chronic), acwr: chronic > 0 ? +(acute / chronic).toFixed(2) : null };
        }

        /** Monotonia = média_diaria / DP_diaria (últimos 7 dias) */
        function calcMonotonia(referenceDate, atletaId) {
            const ref = new Date(referenceDate || new Date());
            const dailyLoads = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(ref);
                d.setDate(ref.getDate() - i);
                const dStr = toDateStr(d);
                const dayLoad = (db.treinos || [])
                    .filter(t => {
                        if (t.turmaId !== db.activeTurmaId || t.data !== dStr) return false;
                        if (atletaId) {
                            const dest = t.destinatario || 'equipe';
                            if (dest === 'atleta' && t.atletaId !== atletaId) return false;
                            if (treinoEquipeSubstituidoPorIndividual(t, atletaId)) return false;
                        }
                        return true;
                    })
                    .reduce((s, t) => s + (t.cargaTreino || 0), 0);
                dailyLoads.push(dayLoad);
            }
            const mean = dailyLoads.reduce((s, v) => s + v, 0) / 7;
            const variance = dailyLoads.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / 7;
            const sd = Math.sqrt(variance);
            const mono = sd > 0 ? +(mean / sd).toFixed(2) : 0;
            return { mean: Math.round(mean), sd: Math.round(sd), mono };
        }

        /** Fase do mesociclo com base no ACWR e variação da carga */
        function getWeekPhase(acwr, currentLoad, previousLoad) {
            if (acwr === null) return null;
            // Detecção de taper/competição: carga muito baixa após carga alta
            if (currentLoad < previousLoad * 0.6 && previousLoad > 200) {
                return { label: 'Recuperação / Taper', icon: 'ti-heart-rate-monitor', cls: 'fase-recuperacao' };
            }
            if (acwr > 1.3) {
                return { label: 'Intensificação / Choque', icon: 'ti-bolt', cls: 'fase-intensificacao' };
            }
            if (acwr < 0.7) {
                return { label: 'Recuperação', icon: 'ti-heart-rate-monitor', cls: 'fase-recuperacao' };
            }
            // Progresso normal
            if (currentLoad >= previousLoad) {
                return { label: 'Acumulação / Volume', icon: 'ti-trending-up', cls: 'fase-acumulacao' };
            }
            return { label: 'Manutenção', icon: 'ti-equal', cls: 'fase-recuperacao' };
        }

        // ============================================================
        //  PERIODIZAÇÃO — RENDER
        // ============================================================
        let _cargaChartObj = null;

        function renderPainelCarga() {
            const painel = document.getElementById('painelPeriodizacao');
            if (!painel) return;
            if (currentView !== 'week') { painel.style.display = 'none'; return; }
            painel.style.display = 'flex';

            const today = new Date();
            const weekLoads6 = calcWeekLoads(6, today);
            const { acute, chronic, acwr } = calcACWR(weekLoads6);
            const { mono } = calcMonotonia(today);
            const strain = Math.round(acute * mono);
            const previousLoad = weekLoads6[1]?.load || 0;
            const fase = getWeekPhase(acwr, acute, previousLoad);

            // --- Carga Aguda ---
            const diffPct = previousLoad > 0 ? Math.round((acute - previousLoad) / previousLoad * 100) : null;
            document.getElementById('mCargaAguda').textContent = acute + ' CARGA';
            document.getElementById('mCargaAgudaSub').innerHTML = diffPct !== null
                ? `<span style="color:${diffPct >= 0 ? 'var(--green)' : 'var(--red)'}">${diffPct >= 0 ? '▲' : '▼'} ${Math.abs(diffPct)}%</span> vs semana anterior`
                : 'Sem dados anteriores';

            // --- ACWR ---
            const acwrEl = document.getElementById('mAcwr');
            const acwrStatusEl = document.getElementById('mAcwrStatus');
            if (acwr === null) {
                acwrEl.textContent = '—';
                acwrEl.className = 'metrica-value';
                acwrStatusEl.textContent = 'Dados insuficientes';
            } else {
                acwrEl.textContent = acwr.toFixed(2);
                if (acwr >= 0.8 && acwr <= 1.3) {
                    acwrEl.className = 'metrica-value acwr-verde';
                    acwrStatusEl.innerHTML = '🟢 Zona segura (0.80–1.30)';
                } else if ((acwr >= 0.5 && acwr < 0.8) || (acwr > 1.3 && acwr <= 1.5)) {
                    acwrEl.className = 'metrica-value acwr-amarelo';
                    acwrStatusEl.innerHTML = '🟡 Atenção — monitorar';
                } else {
                    acwrEl.className = 'metrica-value acwr-vermelho';
                    acwrStatusEl.innerHTML = acwr > 1.5 ? '🔴 Risco de overtraining' : '🔴 Subcarga / destreinamento';
                }
            }

            // --- Monotonia ---
            const monoEl = document.getElementById('mMonotonia');
            monoEl.textContent = mono.toFixed(2);
            monoEl.className = 'metrica-value ' + (mono > 2 ? 'acwr-vermelho' : mono > 1.5 ? 'acwr-amarelo' : 'acwr-verde');
            document.getElementById('mMonotoniaSub').textContent = mono > 2 ? 'Alta — estímulo repetitivo' : mono > 1.5 ? 'Moderada' : 'Boa variação';

            // --- Strain ---
            const strainEl = document.getElementById('mStrain');
            strainEl.textContent = strain;
            strainEl.className = 'metrica-value ' + (strain > 3000 ? 'acwr-vermelho' : strain > 1500 ? 'acwr-amarelo' : 'acwr-verde');
            document.getElementById('mStrainSub').textContent = strain > 3000 ? 'Elevado — risco overtraining' : strain > 1500 ? 'Moderado' : 'Controlado';

            // --- Fase do mesociclo ---
            const faseEl = document.getElementById('faseMesociclo');
            if (fase) {
                faseEl.innerHTML = `
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Fase do Mesociclo</div>
                    <div class="fase-badge ${fase.cls}"><i class="ti ${fase.icon}"></i> ${fase.label}</div>`;
            } else {
                faseEl.innerHTML = '';
            }

            // --- Distribuição por tipo ---
            renderDistTipos();

            // --- Gráfico ---
            renderCargaChart(weekLoads6, chronic);
        }

        function renderDistTipos() {
            const el = document.getElementById('distTipos');
            if (!el) return;

            const refStart = getWeekStartFor(new Date());
            const refEnd = new Date(refStart); refEnd.setDate(refStart.getDate() + 6);
            const ws = toDateStr(refStart), we = toDateStr(refEnd);

            const treinosSemana = (db.treinos || []).filter(t =>
                t.turmaId === db.activeTurmaId && t.data >= ws && t.data <= we);

            const TIPO_CORES = {
                forca: '#ef4444', potencia: '#f97316', transferencia: '#eab308', hiit: '#f43f5e', cardio: '#06b6d4',
                glicolitico: '#8b5cf6', regenerativo: '#10b981', mobilidade: '#14b8a6', flexibilidade: '#0ea5e9', core: '#64748b',
                tatico: '#f59e0b', tecnico: '#a855f7', tecnico_tatico: '#d946ef', simulatorio: '#ec4899', sparring: '#dc2626',
                fisico: '#3b82f6', recuperacao: '#10b981', competicao: '#ef4444', reuniao: '#6b7280'
            };

            const totalUA = treinosSemana.reduce((s, t) => s + (t.cargaTreino || 0), 0);
            const byTipo = {};
            treinosSemana.forEach(t => {
                byTipo[t.tipo] = (byTipo[t.tipo] || 0) + (t.cargaTreino || 0);
            });

            if (Object.keys(byTipo).length === 0) {
                el.innerHTML = '<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:16px 0;">Nenhum treino nesta semana</div>';
                return;
            }

            el.innerHTML = Object.entries(byTipo)
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, CARGA]) => {
                    const pct = totalUA > 0 ? Math.round(CARGA / totalUA * 100) : 0;
                    const cor = TIPO_CORES[tipo] || '#94a3b8';
                    const label = TIPO_LABELS[tipo] || tipo;
                    return `<div class="dist-row">
                        <div class="dist-label">${label}</div>
                        <div class="dist-bar-wrap">
                            <div class="dist-bar-fill" style="width:${pct}%;background:${cor};"></div>
                        </div>
                        <div class="dist-pct" style="color:${cor};">${pct}%</div>
                    </div>`;
                }).join('');
        }

        function renderCargaChart(weekLoads6, chronic) {
            const ctx = document.getElementById('chartCarga');
            if (!ctx || typeof Chart === 'undefined') return;

            // Destruir gráfico anterior se existir
            if (_cargaChartObj) { _cargaChartObj.destroy(); _cargaChartObj = null; }

            const labels = weekLoads6.map((w, i) => {
                const d = new Date(w.weekStart);
                return i === 0 ? 'Esta sem.' : `${d.getDate()}/${d.getMonth() + 1}`;
            }).reverse();

            const data = weekLoads6.map(w => w.load).reverse();
            const chronicLine = weekLoads6.map(() => chronic).reverse();

            _cargaChartObj = new Chart(ctx, {
                data: {
                    labels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Carga Semanal (CARGA)',
                            data,
                            backgroundColor: data.map((v, i) =>
                                i === data.length - 1 ? 'rgba(59,130,246,0.8)' : 'rgba(59,130,246,0.35)'),
                            borderRadius: 5,
                            borderSkipped: false,
                        },
                        {
                            type: 'line',
                            label: 'Carga Crônica (média 4 sem.)',
                            data: chronicLine,
                            borderColor: 'rgba(245,158,11,0.9)',
                            borderWidth: 2,
                            borderDash: [6, 4],
                            pointRadius: 0,
                            fill: false,
                            tension: 0,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 14 } },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} CARGA`
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
                    }
                }
            });
        }
        // ============================================================
        //  PLANEJADOR DE MESOCICLO
        // ============================================================

        // Fases do mesociclo — termos usados no Brasil
        const FASES_MESO = [
            { value: 'ordinario', label: 'Ordinário', color: '#c084fc' }, // base/fundamento
            { value: 'acumulacao', label: 'Acumulação', color: '#60a5fa' }, // volume
            { value: 'choque', label: 'Choque', color: '#f97316' }, // sobrecarga
            { value: 'intensificacao', label: 'Intensificação', color: '#facc15' }, // intensidade
            { value: 'transformacao', label: 'Transformação', color: '#a3e635' }, // transmução
            { value: 'precompetitivo', label: 'Pré-Competitivo', color: '#fb923c' }, // ajuste final
            { value: 'competicao', label: 'Competição', color: '#f87171' }, // competição
            { value: 'recuperacao', label: 'Recuperação', color: '#34d399' }, // taper/descanso
            { value: 'transicao', label: 'Transição', color: '#94a3b8' }, // entre mesociclos
        ];
        const DIAS_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

        let _activeMesoId = null;

        function openMesoModal(mesoId) {
            document.getElementById('modalMesoTitle').textContent = mesoId ? 'Editar Mesociclo' : 'Novo Mesociclo';
            document.getElementById('mesoEditId').value = mesoId || '';

            if (mesoId) {
                const m = (db.mesociclos || []).find(x => x.id === mesoId);
                if (!m) return;
                document.getElementById('mesoNome').value = m.nome || '';
                document.getElementById('mesoObjetivo').value = m.objetivo || '';
                document.getElementById('mesoDataInicio').value = m.dataInicio || '';
                document.getElementById('mesoDataFim').value = m.dataFim || '';
                document.getElementById('mesoCargaTotal').value = m.semanas?.reduce((s, w) => s + (w.cargaAlvo || 0), 0) || '';
            } else {
                document.getElementById('mesoNome').value = '';
                document.getElementById('mesoObjetivo').value = '';
                // Pré-preencher datas: início = próxima segunda
                const hoje = new Date();
                const dow = hoje.getDay();
                const diasAteSegunda = (dow === 0 ? 1 : 8 - dow);
                const inicio = new Date(hoje);
                inicio.setDate(hoje.getDate() + diasAteSegunda);
                const fim = new Date(inicio);
                fim.setDate(inicio.getDate() + 27); // 4 semanas padrão
                document.getElementById('mesoDataInicio').value = toDateStr(inicio);
                document.getElementById('mesoDataFim').value = toDateStr(fim);
                document.getElementById('mesoCargaTotal').value = '';
            }
            document.getElementById('modalMeso').classList.add('active');
        }

        function closeMesoModal() {
            document.getElementById('modalMeso').classList.remove('active');
        }

        function salvarMeso() {
            const nome = document.getElementById('mesoNome').value.trim();
            if (!nome) { showToast('Informe um nome para o mesociclo.', 'error'); return; }
            const dataInicio = document.getElementById('mesoDataInicio').value;
            const dataFim = document.getElementById('mesoDataFim').value;
            if (!dataInicio || !dataFim || dataFim <= dataInicio) { showToast('Datas inválidas. A data final deve ser após a inicial.', 'error'); return; }

            const editId = document.getElementById('mesoEditId').value;
            const cargaTotalAlvo = parseInt(document.getElementById('mesoCargaTotal').value) || 0;

            // Gerar semanas do período
            const semanas = gerarSemanasMeso(dataInicio, dataFim, cargaTotalAlvo, editId);

            const meso = {
                id: editId ? parseInt(editId) : Date.now(),
                turmaId: db.activeTurmaId,
                nome,
                objetivo: document.getElementById('mesoObjetivo').value.trim(),
                dataInicio,
                dataFim,
                semanas
            };

            if (!db.mesociclos) db.mesociclos = [];
            if (editId) {
                const idx = db.mesociclos.findIndex(m => m.id === meso.id);
                if (idx > -1) db.mesociclos[idx] = meso;
            } else {
                db.mesociclos.push(meso);
            }

            saveDB();
            closeMesoModal();
            _activeMesoId = meso.id;
            renderMesoView();
            showToast(`Mesociclo "${nome}" salvo!`);
        }

        function gerarSemanasMeso(dataInicio, dataFim, cargaTotalAlvo, editId) {
            // Preservar dados existentes se for edição
            const existing = editId
                ? ((db.mesociclos || []).find(m => m.id === parseInt(editId))?.semanas || [])
                : [];

            const semanas = [];
            let cur = getWeekStartFor(new Date(dataInicio + 'T00:00:00'));
            const fim = new Date(dataFim + 'T00:00:00');
            const totalWeeks = Math.ceil((fim - cur) / (7 * 86400000)) || 1;
            const cargaPorSemana = cargaTotalAlvo > 0 ? Math.round(cargaTotalAlvo / totalWeeks) : 0;

            let weekIdx = 0;
            while (cur <= fim) {
                const ws = toDateStr(cur);
                const prev = existing.find(s => s.weekStart === ws);
                semanas.push(prev || {
                    weekStart: ws,
                    fase: 'acumulacao',
                    cargaAlvo: cargaPorSemana,
                    sessoesDias: [[], [], [], [], [], [], []]
                });
                cur = new Date(cur);
                cur.setDate(cur.getDate() + 7);
                weekIdx++;
            }
            return semanas;
        }

        function deleteMeso(mesoId) {
            showConfirmModal('Excluir mesociclo?', 'Esta ação não poderá ser desfeita.', () => {
                db.mesociclos = (db.mesociclos || []).filter(m => m.id !== mesoId);
                saveDB();
                if (_activeMesoId === mesoId) _activeMesoId = null;
                renderMesoView();
                showToast('Mesociclo excluído.');
            });
        }

        function renderMesoView() {
            const container = document.getElementById('viewMeso');
            if (!container) return;

            const mesosDaTurma = (db.mesociclos || []).filter(m => m.turmaId === db.activeTurmaId);

            // Auto-selecionar o primeiro se nenhum ativo
            if (!_activeMesoId && mesosDaTurma.length > 0) _activeMesoId = mesosDaTurma[0].id;

            let listHtml = mesosDaTurma.map(m => {
                const ativo = m.id === _activeMesoId;
                const di = m.dataInicio?.split('-').reverse().join('/') || '';
                const df = m.dataFim?.split('-').reverse().join('/') || '';
                // Total carga alvo
                const totalAlvo = (m.semanas || []).reduce((s, w) => s + (w.cargaAlvo || 0), 0);
                const totalReal = (m.semanas || []).reduce((s, w) => {
                    const we = new Date(w.weekStart + 'T00:00:00');
                    we.setDate(we.getDate() + 6);
                    return s + calcWeekLoad(new Date(w.weekStart + 'T00:00:00'));
                }, 0);
                return `<div class="card meso-card${ativo ? ' active' : ''}" onclick="_activeMesoId=${m.id};renderMesoView()">
                    <div class="meso-nome">${m.nome}</div>
                    <div class="meso-meta">
                        ${m.objetivo ? `<span><i class="ti ti-trophy" style="color:var(--yellow);margin-right:4px;"></i>${m.objetivo}</span>` : ''}
                        <span><i class="ti ti-calendar" style="margin-right:4px;"></i>${di} → ${df}</span>
                        <span style="margin-top:4px;">${totalReal} / ${totalAlvo} CARGA realizadas</span>
                    </div>
                    <div style="display:flex;gap:6px;margin-top:10px;">
                        <button class="btn" style="flex:1;font-size:12px;padding:4px 8px;" onclick="event.stopPropagation();openMesoModal(${m.id})">
                            <i class="ti ti-edit"></i> Editar
                        </button>
                        <button class="btn" style="font-size:12px;padding:4px 8px;color:var(--red);background:rgba(239,68,68,0.1);" onclick="event.stopPropagation();deleteMeso(${m.id})">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');

            listHtml += `<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="openMesoModal(null)">
                <i class="ti ti-plus"></i> Novo Mesociclo
            </button>`;

            const activeMeso = mesosDaTurma.find(m => m.id === _activeMesoId);
            const gradeHtml = activeMeso ? renderMesoGrade(activeMeso) : `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:var(--text-muted);gap:12px;">
                    <i class="ti ti-chart-gantt" style="font-size:40px;opacity:0.3;"></i>
                    <span>Selecione ou crie um mesociclo</span>
                </div>`;

            container.innerHTML = `
                <div style="margin-bottom:16px;">
                    <div class="section-title" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);display:flex;align-items:center;gap:6px;margin-bottom:0;">
                        <i class="ti ti-chart-gantt"></i> Planejar Mesociclo
                    </div>
                </div>
                <div class="meso-layout">
                    <div class="meso-list-panel">${listHtml}</div>
                    <div class="meso-grade-panel">${gradeHtml}</div>
                </div>`;
        }

        function renderMesoGrade(meso) {
            const di = meso.dataInicio?.split('-').reverse().join('/') || '';
            const df = meso.dataFim?.split('-').reverse().join('/') || '';
            const totalAlvo = (meso.semanas || []).reduce((s, w) => s + (w.cargaAlvo || 0), 0);
            const totalReal = (meso.semanas || []).reduce((s, w) =>
                s + calcWeekLoad(new Date(w.weekStart + 'T00:00:00')), 0);
            const pctTotal = totalAlvo > 0 ? Math.min(Math.round(totalReal / totalAlvo * 100), 150) : 0;

            const faseOptions = FASES_MESO.map(f =>
                `<option value="${f.value}">${f.label}</option>`).join('');

            const semanasHtml = (meso.semanas || []).map((sem, idx) => {
                const realLoad = calcWeekLoad(new Date(sem.weekStart + 'T00:00:00'));
                const alvo = sem.cargaAlvo || 0;
                const pct = alvo > 0 ? Math.min(Math.round(realLoad / alvo * 100), 150) : 0;
                const overload = pct > 100;
                const faseCor = FASES_MESO.find(f => f.value === sem.fase)?.color || '#94a3b8';

                // Datas da semana
                const ws = new Date(sem.weekStart + 'T00:00:00');
                const we = new Date(ws); we.setDate(ws.getDate() + 6);
                const label = `Sem ${idx + 1} — ${ws.getDate()}/${ws.getMonth() + 1}`;

                // Percentage of this week relative to the whole meso
                const pctOfTotal = totalAlvo > 0 ? Math.round((alvo / totalAlvo) * 100) : 0;

                const diasHtml = DIAS_LABELS.map((dia, di) => {
                    const dateD = new Date(ws); dateD.setDate(ws.getDate() + di);
                    const dStr = toDateStr(dateD);
                    const realDia = (db.treinos || [])
                        .filter(t => t.turmaId === db.activeTurmaId && t.data === dStr)
                        .reduce((s, t) => s + (t.cargaTreino || 0), 0);

                    const sessoes = sem.sessoesDias?.[di] || [];
                    const cargaDiaPlanejada = sessoes.reduce((s, sess) => s + ((sess.min || 0) * (sess.pse || 0)), 0);

                    const sessoesHtml = sessoes.map((sess, sIdx) => `
                        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; background: rgba(255,255,255,0.03); padding: 4px 4px 6px 4px; border-radius: 4px;">
                            <div style="display: flex; gap: 4px; align-items: center; justify-content: space-between;">
                                <div style="display: flex; gap: 4px; align-items: center;">
                                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600;">Min:</span>
                                    <input class="meso-dia-input" type="number" placeholder="M" min="0" max="999" style="width: 38px; padding: 4px; font-size: 11px;"
                                        value="${sess.min || ''}" title="Minutos de Treino"
                                        onchange="onMesoSessionChange(${meso.id},'${sem.weekStart}',${di},${sIdx},'min',this.value)">
                                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; margin-left: 2px;">PSE:</span>
                                    <input class="meso-dia-input" type="number" placeholder="0-10" min="0" max="10" step="0.5" style="width: 38px; padding: 4px; font-size: 11px;"
                                        value="${sess.pse || ''}" title="PSE 0-10"
                                        onchange="onMesoSessionChange(${meso.id},'${sem.weekStart}',${di},${sIdx},'pse',this.value)">
                                </div>
                                <button class="btn btn-icon" style="min-width: 16px; width: 16px; height: 16px; color: var(--red);" title="Removeráá" onclick="removeMesoSession(${meso.id},'${sem.weekStart}',${di},${sIdx})">
                                    <i class="ti ti-x" style="font-size: 10px;"></i>
                                </button>
                            </div>
                            <select class="meso-dia-input" style="width: 100%; padding: 3px; font-size: 10px; border-radius: 3px; background-color: var(--card-bg, #1e293b); color: var(--text-color, #e2e8f0);"
                                onchange="onMesoSessionChange(${meso.id},'${sem.weekStart}',${di},${sIdx},'tipo',this.value)">
                                <option value="Taekwondo" style="background-color: var(--card-bg, #1e293b); color: var(--text-color, #e2e8f0);" ${(!sess.tipo || sess.tipo === 'Taekwondo') ? 'selected' : ''}>Taekwondo</option>
                                <option value="Físico" style="background-color: var(--card-bg, #1e293b); color: var(--text-color, #e2e8f0);" ${sess.tipo === 'Físico' ? 'selected' : ''}>Físico</option>
                            </select>
                        </div>
                    `).join('');

                    const labelDiaMes = `${dateD.getDate().toString().padStart(2, '0')}/${(dateD.getMonth() + 1).toString().padStart(2, '0')}`;

                    return `<div class="meso-dia-col" style="min-width: 140px; display: flex; flex-direction: column; align-items: center;">
                        <div class="meso-dia-label" style="text-align: center; width: 100%; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 8px;">${dia} <span style="font-size:11px; color:var(--text-muted);font-weight:normal;">${labelDiaMes}</span> <span style="font-size: 10px; color: var(--primary); font-weight: bold; float: right;">${cargaDiaPlanejada > 0 ? cargaDiaPlanejada : ''}</span></div>
                        
                        <div style="width: 100%; display: flex; flex-direction: column; gap: 2px;">
                            ${sessoesHtml}
                            <button class="btn" style="padding: 2px; font-size: 10px; width: 100%; justify-content: center; margin-top: 4px; color: var(--text-muted); background: rgba(255,255,255,0.05); border: 1px dashed var(--border-color);" onclick="addMesoSession(${meso.id},'${sem.weekStart}',${di})">
                                <i class="ti ti-plus" style="font-size: 10px;"></i> Add Treino
                            </button>
                        </div>

                        <div class="meso-dia-real" style="margin-top: 8px; width: 100%; text-align: center; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.05);" title="Realizado">${realDia > 0 ? realDia + ' CARGA Real.' : '<span style="opacity: 0.5;">—</span>'}</div>
                    </div>`;
                }).join('');

                const totalDias = (sem.sessoesDias || []).reduce((ts, dias) => ts + (dias || []).reduce((s, sess) => s + ((sess.min || 0) * (sess.pse || 0)), 0), 0);

                return `<div class="card meso-semana-row" data-weekstart="${sem.weekStart}">
                    <div class="meso-semana-top" onclick="toggleMesoDias(this)">
                        <div class="meso-semana-label">${label}</div>
                        <select class="meso-fase-sel" style="color:${faseCor};"
                            onchange="event.stopPropagation();onMesoChange(${meso.id},'${sem.weekStart}','fase',this.value)"
                            onclick="event.stopPropagation()">
                            ${FASES_MESO.map(f => `<option value="${f.value}"${sem.fase === f.value ? ' selected' : ''}>${f.label}</option>`).join('')}
                        </select>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div>
                                <input class="meso-carga-input" type="number" min="0" max="9999"
                                    value="${alvo}" placeholder="0"
                                    title="Carga alvo da semana (CARGA)"
                                    onclick="event.stopPropagation()"
                                    onchange="onMesoChange(${meso.id},'${sem.weekStart}','cargaAlvo',this.value)">
                                <span style="font-size:11px;color:var(--text-muted);margin-left:4px;">CARGA alvo</span>
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--primary); background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px;" title="Porcentagem da carga total do Mesociclo">
                                ${pctOfTotal}% do Ciclo
                            </div>
                        </div>
                        <div class="meso-progress-wrap">
                            <div class="meso-prog-bar">
                                <div class="meso-prog-fill${overload ? ' over' : ''}" style="width:${pct}%;"></div>
                            </div>
                            <div class="meso-prog-label">${realLoad}/${alvo} CARGA</div>
                        </div>
                        <div style="font-size:12px;color:var(--text-muted);text-align:right;">
                            <i class="ti ti-chevron-${_expandedWeeks.has(sem.weekStart) ? 'up' : 'down'}" style="font-size:14px;"></i>
                        </div>
                    </div>
                    <div class="meso-dias-expand" style="display:${_expandedWeeks.has(sem.weekStart) ? 'block' : 'none'};">
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Carga planejada por dia (CARGA) — clique na linha para expandir</div>
                        <div class="meso-dias-grid">${diasHtml}</div>
                        <div class="meso-dias-total" style="font-size:12px;color:var(--text-muted);margin-top:8px;text-align:right;">
                            Total dos dias: <strong>${totalDias} CARGA</strong>
                            ${totalDias !== alvo && alvo > 0 ? `<span style="color:var(--yellow);margin-left:6px;">(Alvo: ${alvo} CARGA)</span>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');

            return `
                <div style="margin-bottom:12px;">
                    <div style="font-size:15px;font-weight:700;">${meso.nome}</div>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">
                        ${meso.objetivo ? `<span style="color:var(--yellow);margin-right:8px;"><i class="ti ti-trophy"></i> ${meso.objetivo}</span>` : ''}
                        ${di} → ${df} · ${meso.semanas?.length || 0} semanas
                    </div>
                </div>
                <div class="meso-grade-header">
                    <div>Semana</div><div>Fase</div><div>Carga Alvo</div><div>Realizado</div><div></div>
                </div>
                ${semanasHtml}
                <div class="meso-total-row">
                    <span>TOTAL DO MESOCICLO</span>
                    <span>${totalReal} / ${totalAlvo} CARGA
                        <span style="margin-left:8px;font-size:12px;color:${pctTotal > 100 ? 'var(--red)' : pctTotal > 70 ? 'var(--green)' : 'var(--text-muted)'};">${pctTotal}% concluído</span>
                    </span>
                </div>`;
        }

        // Semanas cujos painéis diários estão expandidos
        const _expandedWeeks = new Set();

        function toggleMesoDias(rowTop) {
            const row = rowTop.parentElement;
            const expand = row.querySelector('.meso-dias-expand');
            if (!expand) return;
            const isOpen = expand.style.display === 'block';
            expand.style.display = isOpen ? 'none' : 'block';
            const icon = rowTop.querySelector('[class*="ti-chevron"]');
            if (icon) { icon.className = isOpen ? 'ti ti-chevron-down' : 'ti ti-chevron-up'; }
            // Rastrear estado
            const weekStart = row.dataset.weekstart;
            if (weekStart) {
                if (isOpen) _expandedWeeks.delete(weekStart);
                else _expandedWeeks.add(weekStart);
            }
        }

        function onMesoChange(mesoId, weekStart, campo, valor, diaIdx) {
            const meso = (db.mesociclos || []).find(m => m.id === mesoId);
            if (!meso) return;
            const semana = meso.semanas?.find(s => s.weekStart === weekStart);
            if (!semana) return;

            if (campo === 'fase') {
                semana.fase = valor;
            } else if (campo === 'cargaAlvo') {
                semana.cargaAlvo = parseInt(valor) || 0;
            }
            saveDB();
            // Para fase e cargaAlvo, re-renderizar a grade preservando estado expandido
            const gradePanel = document.querySelector('.meso-grade-panel');
            if (gradePanel) gradePanel.innerHTML = renderMesoGrade(meso);
        }

        window.addMesoSession = function (mesoId, weekStart, diaIdx) {
            const meso = (db.mesociclos || []).find(m => m.id === mesoId);
            if (!meso) return;
            const semana = meso.semanas?.find(s => s.weekStart === weekStart);
            if (!semana) return;

            if (!semana.sessoesDias) semana.sessoesDias = [[], [], [], [], [], [], []];
            if (!semana.sessoesDias[diaIdx]) semana.sessoesDias[diaIdx] = [];

            semana.sessoesDias[diaIdx].push({ min: null, pse: null });
            saveDB();

            // Re-render
            const gradePanel = document.querySelector('.meso-grade-panel');
            if (gradePanel) gradePanel.innerHTML = renderMesoGrade(meso);
        }

        window.removeMesoSession = function (mesoId, weekStart, diaIdx, sIdx) {
            const meso = (db.mesociclos || []).find(m => m.id === mesoId);
            if (!meso) return;
            const semana = meso.semanas?.find(s => s.weekStart === weekStart);
            if (!semana || !semana.sessoesDias || !semana.sessoesDias[diaIdx]) return;

            semana.sessoesDias[diaIdx].splice(sIdx, 1);
            saveDB();

            // Re-render
            const gradePanel = document.querySelector('.meso-grade-panel');
            if (gradePanel) gradePanel.innerHTML = renderMesoGrade(meso);
        }

        window.onMesoSessionChange = function (mesoId, weekStart, diaIdx, sIdx, campo, valor) {
            const meso = (db.mesociclos || []).find(m => m.id === mesoId);
            if (!meso) return;
            const semana = meso.semanas?.find(s => s.weekStart === weekStart);
            if (!semana || !semana.sessoesDias || !semana.sessoesDias[diaIdx]) return;

            const sess = semana.sessoesDias[diaIdx][sIdx];
            if (!sess) return;

            if (campo === 'min') {
                sess.min = parseInt(valor) || 0;
            } else if (campo === 'pse') {
                sess.pse = parseFloat(valor) || 0;
            } else if (campo === 'tipo') {
                sess.tipo = valor;
            }

            saveDB();

            // Re-render completely since it auto calculates totals
            const gradePanel = document.querySelector('.meso-grade-panel');
            if (gradePanel) gradePanel.innerHTML = renderMesoGrade(meso);
        }
