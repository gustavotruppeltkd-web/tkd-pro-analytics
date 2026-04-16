        // Tabs Logic
        function switchTab(tabId) {
            // Função mantida para compatibilidade, mas simplificada pois agora só há uma aba
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            const target = document.getElementById(tabId);
            if (target) {
                target.classList.add('active');
            }
        }

        // --- DADOS DA TURMA ATUAL ---
        let currTurma = null;

        function loadPageData() {
            loadDB(); // Recarregar dados do localStorage
            currTurma = db.turmas.find(t => t.id === db.activeTurmaId);
            if (currTurma) {
                document.querySelector('.page-title h1').innerText = currTurma.nome;

                // Sidebar is now handled globally by renderSidebar() in app.js

                // Ajuste de Nomenclatura Atleta x Aluno
                const isRend = (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));
                if (isRend) {

                    // Ajuste de Nomenclatura Atleta x Aluno
                    const matriculaBtn = document.getElementById('btnSubmitMatricula');
                    if (matriculaBtn) matriculaBtn.innerText = 'Matricular Atleta';

                    const modalTitle = document.getElementById('modalAddTitle');
                    if (modalTitle) modalTitle.innerText = 'Adicionar Atleta à Equipe';

                    const labelFoto = document.getElementById('labelFoto');
                    if (labelFoto) labelFoto.innerText = 'Foto do Atleta (Do Computador)';

                    const btnAdd = document.querySelector('button[onclick="openModalAluno()"]');
                    if (btnAdd) btnAdd.innerHTML = '<i class="ti ti-user-plus"></i> Adicionar Atleta';
                    // Hide Commercial Elements
                    document.getElementById('cronogramaContainer').style.display = 'none';
                    document.getElementById('rendimentoWrapper').style.display = 'block';
                    document.getElementById('btnRelatorios').style.display = 'none';

                } else {
                    document.getElementById('pageSubtitle').style.display = 'block';
                    document.getElementById('totalAlunosTitle').innerText = 'Alunos Matriculados (0)';
                    document.getElementById('colNameHeader').innerText = 'Aluno e Faixa';
                    document.getElementById('modalAddTitle').innerText = 'Adicionar Aluno à Turma';
                    document.getElementById('btnSubmitMatricula').innerText = 'Matricular na Turma';
                    const btnAdd = document.querySelector('button[onclick="openModalAluno()"]');
                    if (btnAdd) btnAdd.innerHTML = '<i class="ti ti-user-plus"></i> Adicionar Aluno';

                    // Show Commercial Elements
                    document.getElementById('cronogramaContainer').style.display = 'block';
                    document.getElementById('rendimentoWrapper').style.display = 'none';
                    document.getElementById('btnRelatorios').style.display = 'flex';
                }
            }
            renderAlunosUI();
            renderScheduleGrids();
            renderWidgetTreinosHoje();
            try { renderWidgetCompeticoes(); } catch (e) { console.error("Erro renderWidgetCompeticoes:", e); }
            try { renderWidgetCargaTreino(); } catch (e) { console.error("Erro renderWidgetCargaTreino:", e); }
        }

        function renderWidgetCompeticoes() {
            const ultimasList = document.getElementById('widgetUltimasComp');
            const proximasDiv = document.getElementById('widgetProximasComp');
            if (!ultimasList || !proximasDiv) return;

            const currTurma = db.turmas.find(t => t.id === db.activeTurmaId);
            const isRendHere = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));
            if (!isRendHere) return;

            const agora = new Date();
            agora.setHours(0, 0, 0, 0);

            // Filtro robusto para 'Competição' (ignora acentos e case)
            const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const competicoes = (db.eventos || []).filter(ev => normalize(ev.tipo).includes('competicao'));

            // Ordenar por data
            competicoes.sort((a, b) => new Date(a.data + "T00:00:00") - new Date(b.data + "T00:00:00"));

            const passadas = competicoes.filter(ev => new Date((ev.dataFim || ev.data) + "T00:00:00") < agora).reverse();
            const futuras = competicoes.filter(ev => new Date((ev.dataFim || ev.data) + "T00:00:00") >= agora);

            // Renderizar Últimas (mostrar as 2 mais recentes)
            if (passadas.length === 0) {
                ultimasList.innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">Sem competições passadas</span>';
            } else {
                ultimasList.innerHTML = passadas.slice(0, 2).map(ev => {
                    const data = new Date(ev.data + "T00:00:00");
                    const mes = data.toLocaleString('pt-BR', { month: 'short' });
                    return `<div style="cursor: pointer; margin-bottom: 4px;" onclick="window.location.href='evento-detalhes.html?id=${ev.id}'">• ${ev.titulo} (${mes})</div>`;
                }).join('');
            }

            // Renderizar Próximo Alvo (a mais próxima no futuro)
            if (futuras.length === 0) {
                proximasDiv.innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">Sem competições agendadas</span>';
            } else {
                const prox = futuras[0];
                const dataInicio = new Date(prox.data + "T00:00:00");
                const dataFim = new Date((prox.dataFim || prox.data) + "T00:00:00");

                const diffTime = dataInicio - agora;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let countdownText = '';
                if (diffDays > 0) {
                    countdownText = `em ${diffDays} dias`;
                } else if (agora >= dataInicio && agora <= dataFim) {
                    countdownText = 'acontecendo agora!';
                } else {
                    countdownText = 'hoje!';
                }

                let statusExtra = '';
                if (diffDays <= 30 && diffDays >= 0) {
                    statusExtra = `<br><span style="color: var(--yellow); font-size: 12px;"><i class="ti ti-flag"></i> Inscrições Abertas</span>`;
                }

                proximasDiv.innerHTML = `
                    <div style="cursor: pointer;" onclick="window.location.href='evento-detalhes.html?id=${prox.id}'">
                        • ${prox.titulo} (${countdownText})
                        ${statusExtra}
                    </div>
                `;
            }
        }

        function renderWidgetCargaTreino() {
            const widget = document.getElementById('widgetCargaTreino');
            if (!widget) return;

            const currTurma = db.turmas.find(t => t.id === db.activeTurmaId);
            const isRendHere = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));
            if (!isRendHere) return;

            const agora = new Date();
            const Y = agora.getFullYear();
            const M = String(agora.getMonth() + 1).padStart(2, '0');
            const D = String(agora.getDate()).padStart(2, '0');
            const todayStr = `${Y}-${M}-${D}`;

            const treinosHoje = (db.treinos || []).filter(t => t.data === todayStr && t.turmaId === db.activeTurmaId);

            if (treinosHoje.length === 0) {
                widget.innerHTML = `<div class="widget-empty" style="padding: 20px 0;">
                    <i class="ti ti-shield-up" style="opacity: 0.35; font-size: 32px; margin-bottom: 8px;"></i>
                    <span style="color: var(--text-muted); font-size: 13px;">Sem treinos planejados hoje</span>
                </div>`;
                return;
            }

            // Separar Físico e Taekwondo para a view (ou outro tipo que venha)
            const renderTreinoCarga = (t) => {
                const duracao = t.duracaoMins || 0;
                const pse = t.psePlanejada || 0;
                const cargaApx = duracao * pse;

                let icon = 'ti-bolt';
                if (t.tipo === 'fisico') icon = 'ti-barbell';
                if (t.tipo === 'tecnico' || t.tipo === 'tatico' || t.tipo === 'tecnico_tatico' || t.tipo === 'simulatorio' || t.tipo === 'sparring') icon = 'ti-martial-arts-karate';

                let pseColor = 'var(--green)';
                if (pse >= 8) pseColor = 'var(--red)';
                else if (pse >= 5) pseColor = 'var(--yellow)';

                return `
                <div style="flex: 1; min-width: 0;">
                    <div style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                        <i class="ti ${icon}" style="color: var(--primary);"></i> ${t.titulo || 'Geral'}
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(0,0,0,0.15); border-radius: 6px;">
                            <span style="color: var(--text-muted); font-size: 11px;">Tempo</span>
                            <strong style="color: var(--text-main); font-size: 12px;">${duracao} min</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(0,0,0,0.15); border-radius: 6px;">
                            <span style="color: var(--text-muted); font-size: 11px;">PSE Ideal</span>
                            <strong style="color: ${pseColor}; font-size: 12px;">${pse}/10</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(0,0,0,0.15); border-radius: 6px;">
                            <span style="color: var(--text-muted); font-size: 11px;">Carga</span>
                            <strong style="color: ${pseColor}; font-size: 12px;">${cargaApx} u.a.</strong>
                        </div>
                    </div>
                </div>
                `;
            };

            let html = '<div style="display: flex; gap: 16px; width: 100%;">';

            // Render limit 2
            const itemsToRender = treinosHoje.slice(0, 2);
            itemsToRender.forEach((t, index) => {
                html += renderTreinoCarga(t);
                if (index < itemsToRender.length - 1) {
                    html += `<div style="width: 1px; background: rgba(255,255,255,0.05); align-self: stretch;"></div>`;
                }
            });
            html += '</div>';

            const totalDuracaoHoje = treinosHoje.reduce((sum, t) => sum + (t.duracaoMins || 0), 0);
            const totalCargaApx = treinosHoje.reduce((sum, t) => sum + ((t.duracaoMins || 0) * (t.psePlanejada || 0)), 0);

            html += `
                <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Carga Total do Dia</span>
                    <strong style="font-size: 14px; color: var(--yellow);">${totalCargaApx} u.a.</strong>
                </div>
            `;

            widget.innerHTML = html;
        }

        function renderWidgetTreinosHoje() {
            const widget = document.getElementById('widgetTreinosHoje');
            if (!widget) return;

            const currTurma = db.turmas.find(t => t.id === db.activeTurmaId);
            const isRendHere = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));
            if (!isRendHere) return;

            // Use LOCAL date (not UTC)
            const agora = new Date();
            const Y = agora.getFullYear();
            const M = String(agora.getMonth() + 1).padStart(2, '0');
            const D = String(agora.getDate()).padStart(2, '0');
            const todayStr = `${Y}-${M}-${D}`;

            const diasNome = ['Domingo', 'Segunda', 'Ter\u00e7a', 'Quarta', 'Quinta', 'Sexta', 'S\u00e1bado'];
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const diaNome = diasNome[agora.getDay()];
            const diaMes = `${agora.getDate()} ${meses[agora.getMonth()]}`;

            const treinos = Array.isArray(db.treinos) ? db.treinos : [];
            const treinosHoje = treinos
                .filter(t => t.data === todayStr && t.turmaId === db.activeTurmaId)
                .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

            const TIPO_LABELS = {
                forca: 'Força', potencia: 'Potência', transferencia: 'Transferência', hiit: 'HIIT', cardio: 'Cardio',
                glicolitico: 'Glicolítico', regenerativo: 'Regenerativo', mobilidade: 'Mobilidade', flexibilidade: 'Flexibilidade', core: 'Core',
                tatico: 'Tático', tecnico: 'Técnico', tecnico_tatico: 'Técnico/Tático', simulatorio: 'Simulatório', sparring: 'Sparring',
                fisico: 'Físico', recuperacao: 'Recuperação', competicao: 'Competição', reuniao: 'Reunião'
            };

            let html = `
                <div class="widget-day-col">
                    <div class="widget-day-header">
                        <div class="widget-day-num">${agora.getDate()}</div>
                        <div>
                            <div style="font-size:15px;font-weight:700;">${diaNome}</div>
                            <div style="font-size:11px;color:var(--text-muted);">${diaMes}</div>
                        </div>
                    </div>`;

            if (treinosHoje.length === 0) {
                html += `<div class="widget-empty">
                    <i class="ti ti-calendar-off"></i>
                    <span>Sem treinos hoje</span>
                </div>`;
            } else {
                treinosHoje.forEach(t => {
                    const label = TIPO_LABELS[t.tipo] || t.tipo;
                    const dur = t.duracaoMins ? `${t.duracaoMins}min` : '';
                    const hora = t.horario || '';
                    html += `
                        <div class="treino-chip tipo-${t.tipo}" onclick="abrirTreino(${t.id})">
                            <div class="chip-title">${hora ? hora + ' \u2014 ' : ''}${t.titulo}</div>
                            <div class="chip-meta">
                                <span>${label}</span>
                                ${dur ? `<span>${dur}</span>` : ''}
                                ${t.blocos && t.blocos.length ? `<span>${t.blocos.length} bloco(s)</span>` : ''}
                            </div>
                        </div>`;
                });
            }

            html += `<a href="treino-equipe.html" class="btn-add-row">
                        <i class="ti ti-plus"></i> Adicionar treino
                    </a>
                </div>`;

            widget.innerHTML = html;
        }

        function abrirTreino(id) {
            const t = db.treinos.find(treino => treino.id === id);
            if (!t) return;

            document.getElementById('modalTreinoTitle').innerText = t.titulo;
            renderViewPanel(t);

            const btnDownload = document.getElementById('btnDownloadPDF');
            btnDownload.onclick = () => downloadTreinoPDF(t.id);

            document.getElementById('modalTreino').classList.add('active');
        }

        function closeModalTreino() {
            document.getElementById('modalTreino').classList.remove('active');
        }

        function renderViewPanel(t) {
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
                <div style="padding: 20px;">
                    <div class="view-meta-row">
                        ${dataFmt ? `<span class="view-meta-item"><i class="ti ti-calendar"></i> ${dataFmt}</span>` : ''}
                        ${t.horario ? `<span class="view-meta-item"><i class="ti ti-clock"></i> ${t.horario}</span>` : ''}
                        <span class="view-tipo-badge tipo-${t.tipo}">${t.tipo.toUpperCase()}</span>
                        <span class="prot-badge ${protecao === 'sim' ? 'prot-sim' : 'prot-nao'}">
                            ${protecao === 'sim' ? 'Com Proteção' : 'Sem Proteção'}
                        </span>
                    </div>
                    <div class="view-stats-row">
                        ${t.duracaoMins ? `<div class="view-stat"><i class="ti ti-clock-hour-4"></i><span>${t.duracaoMins} min</span><small>Duração</small></div>` : ''}
                        ${t.psePlanejada ? `<div class="view-stat"><i class="ti ti-gauge"></i><span>PSE ${t.psePlanejada}</span><small>Intensidade</small></div>` : ''}
                    </div>
                    ${blocosHtml ? `<div class="view-section-label">Conteúdo da Sessão</div>${blocosHtml}` : ''}
                    ${t.obs ? `<div class="view-section-label">Observações</div><div class="view-obs-text">${t.obs}</div>` : ''}
                    
                    <div class="view-actions">
                        <button class="btn" onclick="closeModalTreino()">Fechar Visualização</button>
                        <a href="treino-equipe.html" class="btn btn-primary" onclick="sessionStorage.setItem('tkd_open_treino_id', ${t.id});">
                            <i class="ti ti-edit"></i> Abrir no Editor
                        </a>
                    </div>
                </div>`;
        }

        async function downloadTreinoPDF(id) {
            const t = db.treinos.find(treino => treino.id === id);
            if (!t) return;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

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


        function renderAlunosUI() {
            const alunosGrid = document.getElementById('alunosGrid');
            alunosGrid.innerHTML = '';

            const alunosTurma = db.alunos.filter(a => a.turmaId === db.activeTurmaId);
            const isRend = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));

            const labelTitle = isRend ? 'Atletas' : 'Alunos Matriculados';
            document.getElementById('totalAlunosTitle').innerText = `${labelTitle} (${alunosTurma.length})`;

            const isRendHere = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));

            alunosGrid.className = isRendHere ? 'student-grid' : 'class-list';

            const commercialListHeader = document.getElementById('commercialListHeader');
            if (commercialListHeader) {
                commercialListHeader.style.display = isRendHere ? 'none' : 'flex';
            }

            const selectComp = document.getElementById('selectComparison');
            if (selectComp && isRendHere) {
                const currentVal = selectComp.value;
                selectComp.innerHTML = '<option value="equipe">Toda a Equipe (Média)</option>';
                alunosTurma.forEach(a => {
                    selectComp.innerHTML += `<option value="${a.id}">${a.nome}</option>`;
                });
                if ([...selectComp.options].some(o => o.value === currentVal)) {
                    selectComp.value = currentVal;
                }
            }

            // Helper para níveis de Bem-Estar
            const DOT_COLORS_POS = ['#ef4444','#ef4444','#f59e0b','#10b981','#10b981']; // positivo: 1-2 vermelho, 3 amarelo, 4-5 verde
            const DOT_COLORS_NEG = ['#10b981','#10b981','#f59e0b','#ef4444','#ef4444']; // negativo: 1-2 verde, 3 amarelo, 4-5 vermelho
            const renderWellnessDots = (label, icon, value, reverseBad = false) => {
                if (value === undefined || value === null) return '';
                const palette = reverseBad ? DOT_COLORS_NEG : DOT_COLORS_POS;
                let dots = '';
                for (let i = 1; i <= 5; i++) {
                    const bg = i <= value ? palette[i - 1] : 'rgba(255,255,255,0.1)';
                    dots += `<div style="width: 6px; height: 6px; border-radius: 50%; background: ${bg}; transition: 0.3s;"></div>`;
                }
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="color: var(--text-muted); display:flex; align-items:center; gap:4px; font-size:11px;">
                            <i class="${icon}" style="font-size:13px;"></i> ${label}
                        </span>
                        <div style="display: flex; gap: 3px;">${dots}</div>
                    </div>
                `;
            };

            alunosTurma.forEach(a => {
                const idade = calcularIdade(a.dataNascimento);
                const descMatricula = `Desde: ${formatarMesCurto(a.matricula)}/${a.matricula.split('-')[0]}`;

                let card = '';
                if (isRendHere) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const allWLogs = (db.wellnessLogs || []).filter(w => w.atletaId == a.id).sort((x, y) => y.id - x.id);
                    const wLog = allWLogs[0]; // mais recente (qualquer dia)
                    const wLogToday = allWLogs.find(w => w.data === todayStr); // só hoje

                    // Formata o timestamp do último wellness
                    let ultimoWellnessLabel = '';
                    if (wLog) {
                        const ts = wLog._updatedAt || wLog.id;
                        const d = new Date(ts);
                        const hh = String(d.getHours()).padStart(2, '0');
                        const mm = String(d.getMinutes()).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        const mo = String(d.getMonth() + 1).padStart(2, '0');
                        const isToday = wLog.data === todayStr;
                        const isYesterday = wLog.data === new Date(Date.now() - 86400000).toISOString().split('T')[0];
                        const diaLabel = isToday ? 'Hoje' : isYesterday ? 'Ontem' : `${dd}/${mo}`;
                        const labelColor = isToday ? 'var(--green)' : 'var(--red)';
                        ultimoWellnessLabel = `<i class="ti ti-clock" style="font-size:10px; color:${labelColor};"></i> <span style="color:${labelColor};">${diaLabel} às ${hh}:${mm}</span>`;
                    } else {
                        ultimoWellnessLabel = `<i class="ti ti-clock" style="font-size:10px; color:var(--red);"></i> <span style="color:var(--red);">Nunca respondido</span>`;
                    }

                    // Usa o log mais recente disponível (hoje ou qualquer dia anterior)
                    const wLogDisplay = wLogToday || wLog;
                    let wellnessHTML = '';
                    if (wLogDisplay) {
                        const isStale = !wLogToday; // dado não é de hoje
                        wellnessHTML = `
                            <div style="margin: 10px 0 14px 0; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 8px; width: 100%; ${isStale ? 'opacity:0.75;' : ''}">
                                ${renderWellnessDots('Sono', 'ti ti-bed', wLogDisplay.sono)}
                                ${renderWellnessDots('Alimentação', 'ti ti-apple', wLogDisplay.alimentacao)}
                                ${renderWellnessDots('Humor', 'ti ti-mood-smile', wLogDisplay.humor)}
                                ${renderWellnessDots('Estresse', 'ti ti-brain', wLogDisplay.estresse, true)}
                                ${renderWellnessDots('Dor', 'ti ti-shield-up', wLogDisplay.dor, true)}
                                ${renderWellnessDots('Fadiga', 'ti ti-battery-2', wLogDisplay.fadiga, true)}
                            </div>
                        `;
                    } else {
                        wellnessHTML = `<div style="margin: 10px 0 14px 0; font-size:11px; color:var(--text-muted); text-align:center; padding: 10px 0; width:100%;"><i class="ti ti-clipboard-off" style="display:block; font-size:18px; margin-bottom:4px; opacity:0.4;"></i>Nunca respondido</div>`;
                    }

                    card = `
                        <div class="student-square-card" style="animation: fadeIn 0.4s ease-out; height: 100%; display: flex; flex-direction: column;">
                            <img src="${a.avatar}" alt="${a.nome}" class="student-square-avatar" style="align-self: center;" onerror="this.src=DEFAULT_AVATAR">
                            <h4 style="text-align: center;">${a.nome}</h4>
                            <p style="text-align: center; margin-bottom: 4px;"><strong>${a.categoriaIdade || 'S/ Idade'} ${a.categoriaPeso || 'S/ Peso'}</strong> ${(wLogDisplay && wLogDisplay.pesoAtual) ? ` <span style="background: rgba(59, 130, 246, 0.15); color: var(--primary); padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 4px;">${wLogDisplay.pesoAtual}kg</span>` : ''}<br>${idade} anos</p>
                            <div style="font-size: 10px; margin-bottom: 8px;">${ultimoWellnessLabel}</div>

                            <div style="flex-grow: 1;"></div>

                            ${wellnessHTML}

                            <div class="student-square-actions" style="display: flex; gap: 8px; margin-top: auto;">
                                <button class="btn btn-primary" style="flex: 1; justify-content: center; border-radius: 8px;" onclick="goToPerfil(${a.id})">Perfil</button>
                                <button class="btn-icon tooltip" style="color: var(--primary); border-color: rgba(59, 130, 246, 0.3); border-radius: 8px;" data-tooltip="Editar Dados" onclick="openModalEditAluno(${a.id})"><i class="ti ti-edit"></i></button>
                                <button class="btn-icon tooltip" style="color: var(--green); border-color: rgba(16, 185, 129, 0.3); border-radius: 8px;" data-tooltip="Copiar Link do Atleta" onclick="copiarLinkAtleta(${a.id})"><i class="ti ti-link"></i></button>
                                <button class="btn-icon tooltip" style="color: var(--red); border-color: rgba(239, 68, 68, 0.3); border-radius: 8px;" data-tooltip="Excluir Atleta" onclick="confirmDeleteAluno(${a.id})"><i class="ti ti-trash"></i></button>
                            </div>
                        </div>
                    `;
                } else {
                    card = `
                        <div class="student-row" style="animation: fadeIn 0.4s ease-out;">
                            <div class="col-info">
                                <img src="${a.avatar}" alt="${a.nome}" class="student-avatar">
                                <div class="student-details">
                                    <h4>${a.nome}</h4>
                                    <p><strong>${a.faixa}</strong> • ${descMatricula} ${((db.wellnessLogs || []).filter(w => w.atletaId == a.id).sort((x, y) => y.id - x.id)[0]?.pesoAtual) ? ` <span style="color: var(--primary); font-weight: 700;">(${(db.wellnessLogs || []).filter(w => w.atletaId == a.id).sort((x, y) => y.id - x.id)[0].pesoAtual}kg)</span>` : ''}</p>
                                </div>
                            </div>
                            <div class="col-age">
                                <span>${idade} anos</span>
                            </div>
                            <div class="col-action">
                                <button class="btn btn-primary" onclick="goToPerfil(${a.id})" style="padding: 8px 16px; white-space: nowrap;">Ver Perfil</button>
                                <button class="btn-icon tooltip" style="color: var(--red); border-color: rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 8px; height: auto;" data-tooltip="Excluir Aluno" onclick="confirmDeleteAluno(${a.id})"><i class="ti ti-trash"></i></button>
                            </div>
                        </div>
                    `;
                }
                alunosGrid.insertAdjacentHTML('beforeend', card);
            });

            if (isRendHere) {
                setTimeout(initComparisonCharts, 150);
                // Show filter bar for Rendimento turmas and populate category options
                const filterBar = document.getElementById('atletaFilterBar');
                if (filterBar) {
                    filterBar.style.display = 'flex';
                    const selCat = document.getElementById('atletaFilterCategoria');
                    const cats = [...new Set(alunosTurma.map(a => a.categoriaIdade).filter(Boolean))].sort();
                    selCat.innerHTML = '<option value="">Todas as categorias</option>' +
                        cats.map(c => `<option value="${c}">${c}</option>`).join('');
                }
            } else {
                const filterBar = document.getElementById('atletaFilterBar');
                if (filterBar) filterBar.style.display = 'none';
            }
        }

        function filterAtletas() {
            const query = (document.getElementById('atletaSearchInput')?.value || '').toLowerCase().trim();
            const catFilter = document.getElementById('atletaFilterCategoria')?.value || '';
            const statusFilter = document.getElementById('atletaFilterStatus')?.value || '';
            const todayStr = new Date().toISOString().split('T')[0];

            const cards = document.querySelectorAll('#alunosGrid .student-square-card');
            let visible = 0;

            cards.forEach(card => {
                // Extract atleta ID from the "Perfil" button onclick
                const perfilBtn = card.querySelector('[onclick*="goToPerfil"]');
                const atletaId = perfilBtn ? parseInt(perfilBtn.getAttribute('onclick').match(/\d+/)?.[0]) : null;
                const aluno = atletaId ? db.alunos.find(a => a.id === atletaId) : null;
                if (!aluno) { card.style.display = 'none'; return; }

                const matchName = !query || aluno.nome.toLowerCase().includes(query);
                const matchCat = !catFilter || aluno.categoriaIdade === catFilter;

                let matchStatus = true;
                if (statusFilter) {
                    const wLog = (db.wellnessLogs || []).find(w => w.atletaId == aluno.id && w.data === todayStr);
                    if (!wLog) {
                        matchStatus = statusFilter === 'semDados';
                    } else {
                        const score = typeof calcWellnessScore === 'function'
                            ? calcWellnessScore(wLog.sono, wLog.estresse, wLog.dor, wLog.humor, wLog.fadiga, wLog.alimentacao)
                            : 50;
                        if (statusFilter === 'apto') matchStatus = score >= 70;
                        else if (statusFilter === 'atencao') matchStatus = score >= 40 && score < 70;
                        else if (statusFilter === 'risco') matchStatus = score < 40;
                        else matchStatus = false;
                    }
                }

                const show = matchName && matchCat && matchStatus;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            const emptyMsg = document.getElementById('atletaEmptyFilter');
            if (emptyMsg) emptyMsg.style.display = (visible === 0 && cards.length > 0) ? 'block' : 'none';
        }

        function clearAtletaFilters() {
            const inp = document.getElementById('atletaSearchInput');
            const cat = document.getElementById('atletaFilterCategoria');
            const stat = document.getElementById('atletaFilterStatus');
            if (inp) inp.value = '';
            if (cat) cat.value = '';
            if (stat) stat.value = '';
            filterAtletas();
        }

        function goToPerfil(alunoId) {
            localStorage.setItem('tkd_view_aluno_id', alunoId);
            const currTurma = db.turmas.find(t => t.id === db.activeTurmaId);
            if (currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'))) {
                window.location.href = 'atleta-performance.html';
            } else {
                window.location.href = 'perfil-aluno.html';
            }
        }


        // Modal Logic Alunos
        const modalAluno = document.getElementById('modalAddAluno');
        // (Função goToPerfil duplicada removida)

        function openModalEditAluno(id) {
            localStorage.setItem('tkd_view_aluno_id', id);
            const currTurma = db.turmas.find(t => t.id === db.activeTurmaId);
            if (currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'))) {
                window.location.href = 'atleta-performance.html#edit';
            } else {
                window.location.href = 'perfil-aluno.html#edit';
            }
        }
        function copiarLinkAtleta(id) {
            // Include coach's user_id so the athlete page can fetch data from Supabase directly
            window.supabaseClient.auth.getUser().then(({ data: authData }) => {
                const coachId = authData?.user?.id || '';
                const base = window.location.href.split('/').slice(0, -1).join('/');
                const url = `${base}/atleta-login.html?atleta=${id}&coach=${coachId}`;
                navigator.clipboard.writeText(url).then(() => {
                    showToast('Link copiado! Envie ao atleta pelo WhatsApp ou e-mail.');
                }).catch(() => {
                    prompt('Copie o link abaixo:', url);
                });
            });
        }


        function openModalAluno() {
            const currTurma = db.turmas.find(t => t.id === db.activeTurmaId);
            const isRend = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));

            const reqComercial = document.querySelectorAll('#fieldsComercial [required]');
            const reqRendimento = document.querySelectorAll('#fieldsRendimento [required]');

            if (isRend) {
                document.getElementById('fieldsRendimento').style.display = 'block';
                document.getElementById('fieldsComercial').style.display = 'none';
                reqComercial.forEach(r => r.removeAttribute('required'));
                reqRendimento.forEach(r => r.setAttribute('required', 'required'));
            } else {
                document.getElementById('fieldsRendimento').style.display = 'none';
                document.getElementById('fieldsComercial').style.display = 'flex';
                reqRendimento.forEach(r => r.removeAttribute('required'));
                reqComercial.forEach(r => r.setAttribute('required', 'required'));
            }

            // Popula selects de faixas e pesos se abertos na mesma view
            const selectFaixa = document.querySelector('select[name="faixaAluno"]');
            if (selectFaixa) selectFaixa.innerHTML = db.faixas.map(f => `<option value="${f}">${f}</option>`).join('');

            const selectPeso = document.querySelector('select[name="pesoAtleta"]');
            if (selectPeso) selectPeso.innerHTML = '<option value="">Sem Categoria</option>' + (db.categoriasPeso || []).map(p => `<option value="${p}">${p}</option>`).join('');

            modalAluno.classList.add('active');
        }
        let temporaryAvatar = null;

        function handleFotoUpload(event) {
            const file = event.target.files[0];
            if (file) {
                openGlobalCropper(file, (croppedBase64) => {
                    temporaryAvatar = croppedBase64;
                    document.getElementById('fotoPreview').src = croppedBase64;
                    document.getElementById('fotoPreviewContainer').style.display = 'flex';
                });
            }
        }

        function closeModalAluno() {
            const modal = document.getElementById('modalAddAluno');
            if (modal) modal.classList.remove('active');

            temporaryAvatar = null;
            const previewContainer = document.getElementById('fotoPreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';

            const form = document.getElementById('formAddAluno');
            if (form) form.reset();
        }

        function confirmDeleteAluno(id) {
            const aluno = db.alunos.find(a => a.id === id);
            if (!aluno) return;

            const label = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição')) ? 'o atleta' : 'o aluno';

            if (confirm(`Tem certeza que deseja excluir permanentemente ${label} "${aluno.nome}"? Esta ação não pode ser desfeita.`)) {
                deleteAluno(id);
            }
        }

        function deleteAluno(id) {
            const index = db.alunos.findIndex(a => a.id === id);
            if (index !== -1) {
                db.alunos.splice(index, 1);

                // Atualiza contagem na turma
                if (currTurma) {
                    currTurma.alunosCount = Math.max(0, currTurma.alunosCount - 1);
                }

                saveDB();
                renderAlunosUI();
                showToast("Registro excluído com sucesso!", "info");
            }
        }

        function saveAluno(e) {
            e.preventDefault();
            const form = document.getElementById('formAddAluno');

            let defaultAvatar = DEFAULT_AVATAR;

            const isRend = currTurma && (currTurma.tipo.toLowerCase().includes('rendimento') || currTurma.tipo.toLowerCase().includes('competição'));

            const pinVal = isRend ? ((form.pinAtleta && form.pinAtleta.value.trim().length === 4) ? form.pinAtleta.value.trim() : '0000') : '';
            const novoAluno = {
                id: Date.now(),
                turmaId: db.activeTurmaId,
                nome: form.nomeAluno.value,
                faixa: form.faixaAluno.value,
                dataNascimento: form.nascimentoAluno.value,
                matricula: new Date().toISOString().split('T')[0],
                statusFin: isRend ? 'isento' : 'pago',
                vencimento: isRend ? '' : form.diaVencimento.value.padStart(2, '0'),
                mensalidade: isRend ? 0 : parseFloat(form.valorMensalidade.value) || 0,
                planoId: null,
                contato: form.contatoResp.value,
                email: form.emailAluno ? form.emailAluno.value : '',
                cpf: form.cpfAtleta ? form.cpfAtleta.value : '',
                rg: form.rgAtleta ? form.rgAtleta.value : '',
                sexo: form.sexoAtleta ? form.sexoAtleta.value : '',
                categoriaPeso: form.pesoAtleta ? form.pesoAtleta.value : '',
                categoriaIdade: form.idadeAtleta ? form.idadeAtleta.value : '',
                pin: pinVal,
                obs: '',
                avatar: defaultAvatar,
                presencas: 0,
                faltas: 0
            };

            const finalizeSave = () => {
                db.alunos.push(novoAluno);
                if (currTurma) currTurma.alunosCount++;
                saveDB();

                // Close modal and reset form immediately
                closeModalAluno();

                // Update UI after closing
                renderAlunosUI();
                showToast("Atleta adicionado com sucesso!");
            };

            if (temporaryAvatar) {
                novoAluno.avatar = temporaryAvatar;
            }

            finalizeSave();
        }

        // Horários
        const modalHorario = document.getElementById('modalEditHorario');

        function renderScheduleGrids() {
            const mainGrid = document.getElementById('mainScheduleGrid');
            const modalList = document.getElementById('modalScheduleList');

            mainGrid.innerHTML = '';
            modalList.innerHTML = '';

            const horTurma = db.horarios.filter(h => h.turmaId === db.activeTurmaId);

            horTurma.forEach(h => {
                let icon = h.tipo === 'especial'
                    ? `<div class="schedule-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--yellow);"><i class="ti ti-users-group"></i></div>`
                    : `<div class="schedule-icon"><i class="ti ti-calendar"></i></div>`;

                let extra = h.obs ? `<br><span style="font-size:11px; color:var(--yellow);">${h.obs}</span>` : '';

                mainGrid.insertAdjacentHTML('beforeend', `
                    <div class="schedule-card" style="animation: fadeIn 0.3s ease-out;" id="card-horario-${h.id}">
                        ${icon}
                        <div class="schedule-info">
                            <h4>${h.dia}</h4>
                            <p>${h.periodo} ${extra}</p>
                        </div>
                    </div>
                `);

                modalList.insertAdjacentHTML('beforeend', `
                    <div class="student-row" style="padding: 12px 16px; margin-bottom: 8px;" id="list-horario-${h.id}">
                        <div class="col-info">
                            <div class="schedule-icon" style="width: 32px; height: 32px; font-size: 16px; background: rgba(255,255,255,0.05); color: var(--text-main);"><i class="ti ti-clock"></i></div>
                            <div class="student-details">
                                <h4 style="font-size: 14px;">${h.dia}</h4>
                                <p>${h.periodo} ${h.obs || ''}</p>
                            </div>
                        </div>
                        <div class="col-action">
                            <button type="button" class="btn" onclick="deleteHorario(${h.id})" style="background: rgba(239, 68, 68, 0.1); color: var(--red); border: none; padding: 8px;"><i class="ti ti-trash"></i></button>
                        </div>
                    </div>
                `);
            });
        }

        function openModalHorario() {
            renderScheduleGrids();
            modalHorario.classList.add('active');
        }
        function closeModalHorario() { modalHorario.classList.remove('active'); }

        function saveHorario(e) {
            e.preventDefault();
            const form = document.getElementById('formAddHorario');

            const novoH = {
                id: Date.now(),
                turmaId: db.activeTurmaId,
                dia: form.diaSemana.value,
                periodo: `${form.horaInicio.value} - ${form.horaFim.value}`,
                tipo: form.diaSemana.value === 'Sábado' || form.diaSemana.value === 'Domingo' ? 'especial' : 'normal'
            };

            db.horarios.push(novoH);
            saveDB();
            renderScheduleGrids();
            form.reset();
            showToast("Horário salvo com sucesso!");
        }

        function deleteHorario(id) {
            db.horarios = db.horarios.filter(h => h.id !== id);
            saveDB();

            const el = document.getElementById(`list-horario-${id}`);
            if (el) {
                el.style.opacity = '0';
                setTimeout(() => renderScheduleGrids(), 200);
            }
        }

        // Gráficos movidos para dashboard-rendimento.html

        // Reports Logic
        function openModalRelatorios() {
            document.getElementById('modalRelatorios').classList.add('active');
        }

        function closeModalRelatorios() {
            document.getElementById('modalRelatorios').classList.remove('active');
        }

        function generateRelatorioAlunos() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const alunosTurma = db.alunos.filter(a => a.turmaId === db.activeTurmaId);
            const turma = db.turmas.find(t => t.id === db.activeTurmaId);

            doc.setFontSize(18);
            doc.text(`Relat\u00f3rio de Alunos - ${turma ? turma.nome : 'Turma'}`, 14, 20);

            const tableData = alunosTurma.map(a => [
                a.nome,
                a.cpf || '-',
                a.rg || '-',
                formatarDataBR(a.dataNascimento) || '-',
                a.faixa,
                calcularIdade(a.dataNascimento) + ' anos'
            ]);

            doc.autoTable({
                startY: 30,
                head: [['Nome', 'CPF', 'RG', 'Nascimento', 'Gradua\u00e7\u00e3o', 'Idade']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [65, 105, 225] }
            });

            doc.save(`relatorio_alunos_${turma.nome.replace(/\s+/g, '_')}.pdf`);
            showToast("PDF gerado com sucesso!");
        }

        function generateRelatorioChamada() {
            const mes = parseInt(document.getElementById('mesRelatorioChamada').value);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const alunosTurma = db.alunos.filter(a => a.turmaId === db.activeTurmaId);
            const turma = db.turmas.find(t => t.id === db.activeTurmaId);
            const mesNome = document.getElementById('mesRelatorioChamada').options[mes - 1].text;

            doc.setFontSize(18);
            doc.text(`Frequ\u00eancia Mensal - ${mesNome}`, 14, 20);
            doc.setFontSize(12);
            doc.text(`Turma: ${turma ? turma.nome : ''}`, 14, 28);

            const tableData = alunosTurma.map(a => {
                const chamadasMes = (db.chamadas || []).filter(c => {
                    const cData = new Date(c.data + "T00:00:00");
                    return c.turmaId === db.activeTurmaId && (cData.getMonth() + 1) === mes;
                });

                let presencas = 0;
                let faltas = 0;
                chamadasMes.forEach(c => {
                    if (c.presencas.includes(a.id)) presencas++;
                    else if (c.faltas.includes(a.id)) faltas++;
                });

                const total = presencas + faltas;
                const freq = total > 0 ? Math.round((presencas / total) * 100) + '%' : '0%';

                return [a.nome, presencas, faltas, freq];
            });

            doc.autoTable({
                startY: 35,
                head: [['Aluno', 'Presen\u00e7as', 'Faltas', '% Frequ\u00eancia']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] }
            });

            doc.save(`chamada_${mesNome}_${turma.nome.replace(/\s+/g, '_')}.pdf`);
            showToast("PDF gerado com sucesso!");
        }

        function generateRelatorioFinanceiro() {
            const mes = parseInt(document.getElementById('mesRelatorioFinanceiro').value);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const alunosTurma = db.alunos.filter(a => a.turmaId === db.activeTurmaId);
            const turma = db.turmas.find(t => t.id === db.activeTurmaId);
            const mesNome = document.getElementById('mesRelatorioFinanceiro').options[mes - 1].text;

            doc.setFontSize(18);
            doc.text(`Relat\u00f3rio Financeiro - ${mesNome}`, 14, 20);
            doc.setFontSize(12);
            doc.text(`Turma: ${turma ? turma.nome : ''}`, 14, 28);

            let totalPrevisto = 0;
            let totalRecebido = 0;

            const tableData = alunosTurma.map(a => {
                const valor = a.mensalidade || 0;
                const status = a.statusFin === 'pago' ? 'Pago' : (a.statusFin === 'isento' ? 'Isento' : 'Pendente');

                if (status !== 'Isento') {
                    totalPrevisto += valor;
                    if (status === 'Pago') totalRecebido += valor;
                }

                return [
                    a.nome,
                    status === 'Isento' ? 'Isento' : `R$ ${valor.toFixed(2)}`,
                    status,
                    status === 'Pago' ? `R$ ${valor.toFixed(2)}` : 'R$ 0,00'
                ];
            });

            doc.autoTable({
                startY: 35,
                head: [['Aluno', 'Mensalidade', 'Status', 'Valor Recebido']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59] }
            });

            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(14);
            doc.text(`Total Previsto: R$ ${totalPrevisto.toFixed(2)}`, 14, finalY);
            doc.text(`Total Recebido: R$ ${totalRecebido.toFixed(2)}`, 14, finalY + 8);

            doc.save(`financeiro_${mesNome}_${turma.nome.replace(/\s+/g, '_')}.pdf`);
            showToast("PDF gerado com sucesso!");
        }

        // Inicializar os horários na tela
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(loadPageData, 100);
            // Safety net: re-render the today widget and competitions after page data is loaded
            setTimeout(() => {
                try { renderWidgetTreinosHoje(); } catch (e) { }
                try { renderWidgetCompeticoes(); } catch (e) { }
                try { renderWidgetCargaTreino(); } catch (e) { }
            }, 400);
        });

