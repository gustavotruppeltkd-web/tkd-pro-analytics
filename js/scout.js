document.addEventListener('DOMContentLoaded', () => {
    // Navigation highlighting
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Score State
    let scores = {
        blue: 0,
        red: 0
    };

    const scoreBlueEl = document.getElementById('score-blue-val');
    const scoreRedEl = document.getElementById('score-red-val');
    const statusHint = document.getElementById('status-hint');

    // Scout Action Buttons logic (Short vs Long press)
    const scoutBtns = document.querySelectorAll('.btn-scout');

    let pressTimer;
    const longPressDuration = 600; // ms

    scoutBtns.forEach(btn => {
        // Prevent default context menu on mobile long press
        btn.addEventListener('contextmenu', e => e.preventDefault());

        // Mouse Events
        btn.addEventListener('mousedown', (e) => startPress(e, btn));
        btn.addEventListener('mouseup', (e) => endPress(e, btn));
        btn.addEventListener('mouseleave', () => cancelPress());

        // Touch Events
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevents mouse events from firing after touch
            startPress(e, btn);
        });
        btn.addEventListener('touchend', (e) => endPress(e, btn));
        btn.addEventListener('touchcancel', () => cancelPress());
    });

    function startPress(e, btn) {
        pressTimer = setTimeout(() => {
            handleLongPress(btn);
            pressTimer = null; // Reset so endPress knows it was handled
        }, longPressDuration);
    }

    function endPress(e, btn) {
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

        // Log Tentativa (Visual feedback only for now)
        statusHint.textContent = `[Tentativa] ${target === 'blue' ? 'Carlos' : 'Oponente'} tentou ${tech}`;
        statusHint.style.color = 'var(--text-muted)';

        // Brief visual flash
        btn.style.opacity = '0.5';
        setTimeout(() => btn.style.opacity = '1', 150);
    }

    function handleLongPress(btn) {
        const target = btn.dataset.target;
        const points = parseInt(btn.dataset.points);
        const tech = btn.dataset.tech;

        // Add Points
        if (target === 'blue') {
            scores.blue += points;
            scoreBlueEl.textContent = scores.blue;
        } else {
            scores.red += points;
            scoreRedEl.textContent = scores.red;
        }

        // Log Ponto Confirmado
        statusHint.textContent = `[Ponto Confirmado] ${target === 'blue' ? 'Carlos' : 'Oponente'} - ${tech} (+${points})`;
        statusHint.style.color = target === 'blue' ? 'var(--primary)' : 'var(--red)';

        // Success animation mapping to button scale
        btn.style.transform = 'scale(1.05)';
        setTimeout(() => btn.style.transform = 'scale(1)', 200);
    }

    // Heatmap Logic
    const courtMap = document.getElementById('court-map');

    courtMap.addEventListener('click', (e) => {
        const rect = courtMap.getBoundingClientRect();

        // Calculate relative X and Y percentages
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        // Create point element
        const point = document.createElement('div');
        point.className = 'heatmap-point';
        point.style.left = `${xPercent}%`;
        point.style.top = `${yPercent}%`;

        // Randomly assign it as confirmed for visual testing
        if (Math.random() > 0.5) {
            point.classList.add('confirmed');
        }

        courtMap.appendChild(point);
    });
});
