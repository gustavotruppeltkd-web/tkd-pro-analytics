document.addEventListener('DOMContentLoaded', () => {
    // Navigation highlighting
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // === STATE ===
    let sessionConfig = {
        atletaId: null,
        atletaNome: 'Atleta',
        oponente: 'Oponente',
        totalRounds: 3
    };

    let scores = { blue: 0, red: 0 };
    let currentRound = 1;
    let roundsData = [];
    let currentRoundEvents = [];
    let currentHeatmapPoints = [];
    let timerSeconds = 120;
    let timerRunning = false;
    let timerInterval = null;

    // === DOM REFS ===
    const scoreBlueEl = document.getElementById('score-blue-val');
    const scoreRedEl = document.getElementById('score-red-val');
    const statusHint = document.getElementById('status-hint');
    const timerVal = document.getElementById('timer-val');
    const roundLabel = document.getElementById('round-label');
    const athleteNameEl = document.getElementById('athlete-name-display');
    const opponentNameEl = document.getElementById('opponent-name-display');
    const faultBlueBtn = document.getElementById('fault-blue-btn');
    const faultRedBtn = document.getElementById('fault-red-btn');

    // === SETUP MODAL ===
    const setupModal = document.getElementById('modal-setup');

    function openSetupModal() {
        setupModal.style.display = 'flex';
        populateAtletaSelect();
    }

    function populateAtletaSelect() {
        const select = document.getElementById('setup-atleta-select');
        select.innerHTML = '<option value="">-- Selecione o Atleta --</option>';

        if (window.db && window.db.alunos && window.db.alunos.length > 0) {
            const alunos = window.db.activeTurmaId
                ? window.db.alunos.filter(a => a.turmaId === window.db.activeTurmaId)
                : window.db.alunos;

            alunos.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = a.nome;
                select.appendChild(opt);
            });
        }
    }

    document.getElementById('btn-start-scout').addEventListener('click', () => {
        const atletaSelect = document.getElementById('setup-atleta-select');
        const oponenteInput = document.getElementById('setup-oponente');
        const roundsInput = document.getElementById('setup-rounds');

        const atletaId = atletaSelect.value || null;
        const atletaNome = atletaId
            ? (atletaSelect.options[atletaSelect.selectedIndex]?.text || 'Atleta')
            : 'Atleta';
        const oponente = oponenteInput.value.trim() || 'Oponente';
        const totalRounds = parseInt(roundsInput.value) || 3;

        sessionConfig = { atletaId, atletaNome, oponente, totalRounds };

        // Update UI with real names
        if (athleteNameEl) athleteNameEl.textContent = `${atletaNome} (Chung)`;
        if (opponentNameEl) opponentNameEl.textContent = `${oponente} (Hong)`;
        if (faultBlueBtn) faultBlueBtn.childNodes[0].textContent = `Falta do ${oponente} `;
        if (faultRedBtn) faultRedBtn.childNodes[0].textContent = `Falta do ${atletaNome} `;

        roundLabel.textContent = `Round 1 de ${totalRounds}`;
        setupModal.style.display = 'none';
        startTimer();
    });

    // Open setup modal on page load
    openSetupModal();

    // === TIMER ===
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function startTimer() {
        if (timerRunning) return;
        timerRunning = true;
        document.getElementById('btn-play-pause').innerHTML = '<i class="ti ti-player-pause"></i>';
        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                timerVal.textContent = formatTime(timerSeconds);
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                document.getElementById('btn-play-pause').innerHTML = '<i class="ti ti-player-play"></i>';
                statusHint.textContent = `Round ${currentRound} encerrado!`;
                statusHint.style.color = 'var(--text-muted)';
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!timerRunning) return;
        timerRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('btn-play-pause').innerHTML = '<i class="ti ti-player-play"></i>';
    }

    document.getElementById('btn-play-pause').addEventListener('click', () => {
        if (timerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    // === NEXT ROUND ===
    document.getElementById('btn-next-round').addEventListener('click', () => {
        if (currentRound >= sessionConfig.totalRounds) {
            statusHint.textContent = 'Último round! Use "Encerrar Scout" para finalizar.';
            statusHint.style.color = 'var(--text-muted)';
            return;
        }

        // Save current round data
        roundsData.push({
            round: currentRound,
            pontos_atleta: scores.blue,
            pontos_oponente: scores.red,
            eventos: [...currentRoundEvents],
            heatmap: [...currentHeatmapPoints]
        });

        // Advance round
        currentRound++;
        currentRoundEvents = [];
        currentHeatmapPoints = [];
        scores = { blue: 0, red: 0 };
        scoreBlueEl.textContent = '0';
        scoreRedEl.textContent = '0';
        timerSeconds = 120;
        timerVal.textContent = formatTime(timerSeconds);
        roundLabel.textContent = `Round ${currentRound} de ${sessionConfig.totalRounds}`;

        // Clear heatmap visuals
        document.querySelectorAll('#court-map .heatmap-point').forEach(p => p.remove());

        pauseTimer();
        startTimer();

        statusHint.textContent = `Round ${currentRound} iniciado`;
        statusHint.style.color = 'var(--text-muted)';
    });

    // === SCOUT ACTION BUTTONS ===
    const scoutBtns = document.querySelectorAll('.btn-scout');
    let pressTimer;
    const longPressDuration = 600;

    scoutBtns.forEach(btn => {
        btn.addEventListener('contextmenu', e => e.preventDefault());
        btn.addEventListener('mousedown', () => startPress(btn));
        btn.addEventListener('mouseup', () => endPress(btn));
        btn.addEventListener('mouseleave', () => cancelPress());
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startPress(btn);
        });
        btn.addEventListener('touchend', () => endPress(btn));
        btn.addEventListener('touchcancel', () => cancelPress());
    });

    function startPress(btn) {
        pressTimer = setTimeout(() => {
            handleLongPress(btn);
            pressTimer = null;
        }, longPressDuration);
    }

    function endPress(btn) {
        if (pressTimer) {
            clearTimeout(pressTimer);
            handleShortPress(btn);
        }
    }

    function cancelPress() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }

    function handleShortPress(btn) {
        const target = btn.dataset.target;
        const tech = btn.dataset.tech;
        const displayName = target === 'blue' ? sessionConfig.atletaNome : sessionConfig.oponente;

        currentRoundEvents.push({
            tipo: 'tentativa',
            target,
            tecnica: tech,
            pontos: 0,
            round: currentRound,
            timestamp: new Date().toISOString()
        });

        statusHint.textContent = `[Tentativa] ${displayName} tentou ${tech}`;
        statusHint.style.color = 'var(--text-muted)';
        btn.style.opacity = '0.5';
        setTimeout(() => btn.style.opacity = '1', 150);
    }

    function handleLongPress(btn) {
        const target = btn.dataset.target;
        const points = parseInt(btn.dataset.points);
        const tech = btn.dataset.tech;
        const displayName = target === 'blue' ? sessionConfig.atletaNome : sessionConfig.oponente;

        if (target === 'blue') {
            scores.blue += points;
            scoreBlueEl.textContent = scores.blue;
        } else {
            scores.red += points;
            scoreRedEl.textContent = scores.red;
        }

        currentRoundEvents.push({
            tipo: 'ponto',
            target,
            tecnica: tech,
            pontos: points,
            round: currentRound,
            timestamp: new Date().toISOString()
        });

        statusHint.textContent = `[Ponto Confirmado] ${displayName} - ${tech} (+${points})`;
        statusHint.style.color = target === 'blue' ? 'var(--primary)' : 'var(--red)';
        btn.style.transform = 'scale(1.05)';
        setTimeout(() => btn.style.transform = 'scale(1)', 200);
    }

    // === HEATMAP ===
    const courtMap = document.getElementById('court-map');
    courtMap.addEventListener('click', (e) => {
        const rect = courtMap.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        const point = document.createElement('div');
        point.className = 'heatmap-point confirmed';
        point.style.left = `${xPercent}%`;
        point.style.top = `${yPercent}%`;
        courtMap.appendChild(point);

        currentHeatmapPoints.push({ x: xPercent, y: yPercent, round: currentRound });
    });

    // === FINISH SCOUT ===
    document.getElementById('btn-finish-scout').addEventListener('click', () => {
        pauseTimer();
        openResultModal();
    });

    // === RESULT MODAL ===
    const resultModal = document.getElementById('modal-result');

    function openResultModal() {
        // Save current round before opening modal
        roundsData.push({
            round: currentRound,
            pontos_atleta: scores.blue,
            pontos_oponente: scores.red,
            eventos: [...currentRoundEvents],
            heatmap: [...currentHeatmapPoints]
        });

        const totalBlue = roundsData.reduce((sum, r) => sum + r.pontos_atleta, 0);
        const totalRed = roundsData.reduce((sum, r) => sum + r.pontos_oponente, 0);

        document.getElementById('result-summary').textContent =
            `${sessionConfig.atletaNome}: ${totalBlue} pts | ${sessionConfig.oponente}: ${totalRed} pts`;

        // Pre-select based on score
        if (totalBlue > totalRed) {
            document.getElementById('result-vitoria').checked = true;
        } else if (totalRed > totalBlue) {
            document.getElementById('result-derrota').checked = true;
        } else {
            document.getElementById('result-empate').checked = true;
        }

        resultModal.style.display = 'flex';
    }

    document.getElementById('btn-confirm-result').addEventListener('click', () => {
        const resultado = document.querySelector('input[name="resultado"]:checked')?.value || 'empate';
        resultModal.style.display = 'none';
        saveScoutSession(resultado);
    });

    document.getElementById('btn-cancel-result').addEventListener('click', () => {
        // Remove the last round that was added when opening the modal (undo)
        roundsData.pop();
        resultModal.style.display = 'none';
        startTimer();
    });

    function saveScoutSession(resultado) {
        if (!window.db) {
            alert('Erro: banco de dados não carregado. Tente recarregar a página.');
            return;
        }

        if (!window.db.lutasScout) window.db.lutasScout = [];

        const totalBlue = roundsData.reduce((sum, r) => sum + r.pontos_atleta, 0);
        const totalRed = roundsData.reduce((sum, r) => sum + r.pontos_oponente, 0);

        const session = {
            id: Date.now(),
            tipo: 'beira-quadra',
            dataRegistro: new Date().toISOString(),
            atletaId: sessionConfig.atletaId,
            atletaNome: sessionConfig.atletaNome,
            oponente: sessionConfig.oponente,
            resultado,
            placarFinal: { atleta: totalBlue, oponente: totalRed },
            rounds: roundsData
        };

        window.db.lutasScout.push(session);

        if (typeof saveDB === 'function') {
            saveDB();
        }

        if (typeof showToast === 'function') {
            showToast('Scout salvo com sucesso!', 'success');
        }

        statusHint.textContent = 'Scout salvo! Redirecionando...';
        statusHint.style.color = 'var(--text-muted)';

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
});
