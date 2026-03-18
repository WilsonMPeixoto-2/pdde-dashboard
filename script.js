const CACHE_KEY = 'pdde-dashboard-live-cache-v2';
const DEFAULT_SOURCE_URL = 'https://rioeduca-my.sharepoint.com/:x:/g/personal/wilson_mpeixoto_rioeduca_net/IQBfthSt4_rrSrPUrxqxwDY7AfUSuaRqf_03-JACEivzpkQ?e=YitaBf';

const TYPE_META = {
    basico: { label: 'Básico' },
    qualidade: { label: 'Qualidade' },
    equidade: { label: 'Equidade' },
};

const STATUS_META = {
    concluido: {
        label: 'Processos Gerados na 4ª CRE',
        icon: 'check-circle',
        className: 'status-concluido',
    },
    pendente: {
        label: 'Pendentes de Instrução Processual',
        icon: 'clock',
        className: 'status-pendente',
    },
    atraso: {
        label: 'Atraso na Entrega Documental à GAD',
        icon: 'alert-triangle',
        className: 'status-atraso',
    },
};

let ESCOLAS = [];
let DASHBOARD_PAYLOAD = null;
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }

    initTooltips();
    initCharts();
    attachEventListeners();
    initMagnetEffect();
    hydrateFromCache();
    updateDashboard();
    await fetchLiveData({ announceSuccess: ESCOLAS.length === 0 });
});

function initTooltips() {
    if (typeof tippy === 'undefined') return;

    tippy('[title]', {
        theme: 'translucent',
        animation: 'shift-away',
        inertia: true,
    });
}

function hydrateFromCache() {
    const rawCache = window.localStorage.getItem(CACHE_KEY);
    if (!rawCache) {
        setSyncState('loading', 'Conectando à planilha online...', 'Aguardando a primeira leitura do SharePoint.');
        return;
    }

    try {
        const cachedPayload = JSON.parse(rawCache);
        if (!cachedPayload || !Array.isArray(cachedPayload.records)) {
            throw new Error('Cache inválido.');
        }

        applyPayload(cachedPayload);
        setSyncState(
            'warning',
            'Exibindo o último snapshot salvo',
            buildSyncSubtitle(cachedPayload.source, 'Enquanto a atualização online não termina.')
        );
    } catch (error) {
        console.warn('Não foi possível restaurar o cache local:', error.message);
        window.localStorage.removeItem(CACHE_KEY);
        setSyncState('loading', 'Conectando à planilha online...', 'Aguardando a primeira leitura do SharePoint.');
    }
}

async function fetchLiveData({ announceSuccess = false, manual = false } = {}) {
    setSyncState('loading', 'Sincronizando com a planilha online...', 'Consultando a API do Excel em tempo real.');

    try {
        const response = await fetch(`/api/excel?ts=${Date.now()}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'A API retornou uma resposta inválida.');
        }

        applyPayload(result);
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        updateDashboard();

        setSyncState(
            'success',
            'Sincronizado com a planilha online',
            buildSyncSubtitle(result.source, 'Clique aqui para forçar uma nova leitura.')
        );

        if ((manual || announceSuccess) && typeof confetti !== 'undefined') {
            confetti({
                particleCount: 130,
                spread: 68,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#f59e0b'],
            });
        }

        if (manual && typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Sincronização concluída',
                text: 'Os dados foram atualizados diretamente da planilha online.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2600,
            });
        }
    } catch (error) {
        console.warn('Falha ao sincronizar com a planilha online:', error.message);

        const fallbackAvailable = ESCOLAS.length > 0;
        const state = fallbackAvailable ? 'warning' : 'error';
        const label = fallbackAvailable
            ? 'Falha na atualização; mantendo último snapshot confiável'
            : 'Falha ao sincronizar com a planilha online';
        const subtitle = fallbackAvailable
            ? `${error.message} Exibindo o último resultado salvo localmente.`
            : error.message;

        setSyncState(state, label, subtitle);
        renderSyncDetails();

        if (manual && typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Sincronização indisponível',
                text: subtitle,
                icon: 'warning',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3800,
            });
        }
    }
}

function applyPayload(payload) {
    DASHBOARD_PAYLOAD = payload;
    ESCOLAS = Array.isArray(payload.records) ? payload.records : [];

    const sourceLink = document.getElementById('source-link');
    const sourceFileName = document.getElementById('source-file-name');

    if (sourceLink) {
        sourceLink.href = payload.source?.shareUrl || DEFAULT_SOURCE_URL;
    }

    if (sourceFileName) {
        sourceFileName.textContent = payload.source?.controlSheetName
            ? `PDDE_2026_FINAL.xlsx · aba ${payload.source.controlSheetName}`
            : 'PDDE_2026_FINAL.xlsx';
    }

    renderSyncDetails();
}

function attachEventListeners() {
    document.querySelectorAll('.custom-checkbox input').forEach((checkbox) => {
        checkbox.addEventListener('change', updateDashboard);
    });

    document.getElementById('filter-status').addEventListener('change', updateDashboard);
    document.getElementById('filter-cre').addEventListener('change', updateDashboard);
    document.getElementById('btn-export').addEventListener('click', exportReport);

    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
        connectionStatus.addEventListener('click', () => fetchLiveData({ manual: true }));
        connectionStatus.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fetchLiveData({ manual: true });
            }
        });
    }

    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    themeToggleBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const icon = themeToggleBtn.querySelector('i');
        const label = themeToggleBtn.querySelector('span');

        html.setAttribute('data-theme', newTheme);

        if (newTheme === 'dark') {
            icon.setAttribute('data-lucide', 'sun');
            label.textContent = 'Tema Claro';
        } else {
            icon.setAttribute('data-lucide', 'moon');
            label.textContent = 'Tema Escuro';
        }

        lucide.createIcons();
        applyColorsToCharts();
    });

    const btnMobileView = document.getElementById('btn-mobile-view');
    if (btnMobileView) {
        btnMobileView.addEventListener('click', () => {
            const container = document.querySelector('.app-container');
            const icon = btnMobileView.querySelector('i');
            const label = btnMobileView.querySelector('span');

            container.classList.toggle('mobile-simulated');

            if (container.classList.contains('mobile-simulated')) {
                icon.setAttribute('data-lucide', 'monitor');
                label.textContent = 'Voltar ao PC';
            } else {
                icon.setAttribute('data-lucide', 'smartphone');
                label.textContent = 'Mobile';
            }

            lucide.createIcons();
            setTimeout(() => window.dispatchEvent(new Event('resize')), 450);
        });
    }

    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    if (btnMenu && sidebar) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        btnMenu.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

function getActiveFilters() {
    return {
        basico: document.getElementById('filter-basico').checked,
        qualidade: document.getElementById('filter-qualidade').checked,
        equidade: document.getElementById('filter-equidade').checked,
        status: document.getElementById('filter-status').value,
        cre: document.getElementById('filter-cre').value,
    };
}

function getFilteredSchools() {
    const { cre } = getActiveFilters();
    if (cre === 'all') return ESCOLAS;

    return ESCOLAS.filter((school) => {
        if (!school.creCode) return true;
        return String(school.creCode) === String(Number(cre));
    });
}

function updateDashboard() {
    const filters = getActiveFilters();
    const activeTypes = Object.keys(TYPE_META).filter((type) => filters[type]);
    const filteredSchools = getFilteredSchools();
    const stats = {};

    activeTypes.forEach((type) => {
        stats[type] = calculateTypeStats(filteredSchools, type);
    });

    const totalConcluded = activeTypes.reduce((sum, type) => sum + stats[type].concluded, 0);
    const totalPending = activeTypes.reduce((sum, type) => sum + stats[type].pending, 0);
    const totalAtraso = activeTypes.reduce((sum, type) => sum + stats[type].atraso, 0);
    const globalTotal = totalConcluded + totalPending + totalAtraso;
    const globalPct = globalTotal > 0 ? Math.round((totalConcluded / globalTotal) * 100) : 0;

    document.getElementById('total-geral').textContent = totalConcluded;

    updateTypeCard('basico', filters.basico ? stats.basico : buildEmptyStats());
    updateTypeCard('qualidade', filters.qualidade ? stats.qualidade : buildEmptyStats());
    updateTypeCard('equidade', filters.equidade ? stats.equidade : buildEmptyStats());

    if (charts.doughnut) {
        charts.doughnut.data.datasets[0].data = [totalConcluded, totalPending, totalAtraso];
        charts.doughnut.update();
    }

    document.getElementById('global-pct').textContent = `${globalPct}%`;
    updateBarChart(activeTypes, stats);
    renderSchoolLists(activeTypes, filters.status, stats, filteredSchools);
    lucide.createIcons();
}

function updateTypeCard(type, stats) {
    document.getElementById(`pct-${type}`).textContent = stats.pctConcluded;
    document.getElementById(`bar-${type}`).style.width = `${stats.pctConcluded}%`;
    document.getElementById(`count-${type}`).textContent = stats.total > 0
        ? `${stats.concluded} de ${stats.total} (${stats.pctConcluded}%)`
        : '';
}

function calculateTypeStats(schools, type) {
    const relevant = schools.filter((school) => school[type] && school[type].status !== 'nao_aplicavel');
    const concluded = relevant.filter((school) => school[type].status === 'concluido').length;
    const pending = relevant.filter((school) => school[type].status === 'pendente').length;
    const atraso = relevant.filter((school) => school[type].status === 'atraso').length;
    const total = relevant.length;

    return {
        total,
        concluded,
        pending,
        atraso,
        pctConcluded: total > 0 ? Math.round((concluded / total) * 100) : 0,
        pctPending: total > 0 ? Math.round((pending / total) * 100) : 0,
        pctAtraso: total > 0 ? Math.round((atraso / total) * 100) : 0,
    };
}

function buildEmptyStats() {
    return {
        total: 0,
        concluded: 0,
        pending: 0,
        atraso: 0,
        pctConcluded: 0,
        pctPending: 0,
        pctAtraso: 0,
    };
}

function updateBarChart(activeTypes, stats) {
    if (!charts.bar) return;

    charts.bar.data.labels = activeTypes.map((type) => TYPE_META[type].label);
    charts.bar.data.datasets[0].data = activeTypes.map((type) => stats[type].concluded);
    charts.bar.data.datasets[1].data = activeTypes.map((type) => stats[type].pending);
    charts.bar.data.datasets[2].data = activeTypes.map((type) => stats[type].atraso);
    charts.bar.update();
}

function renderSchoolLists(activeTypes, statusFilter, stats, filteredSchools) {
    const container = document.getElementById('school-lists');
    container.innerHTML = '';

    Object.entries(STATUS_META).forEach(([status, meta]) => {
        if (statusFilter !== 'all' && statusFilter !== status) return;

        const totalStatusCount = activeTypes.reduce((sum, type) => sum + getSchoolsByStatus(filteredSchools, type, status).length, 0);
        const card = document.createElement('div');
        card.className = `school-list-card kpi-card ${meta.className}`;
        card.setAttribute('data-aos', 'fade-up');

        card.innerHTML = `
            <div class="school-list-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div class="school-list-title">
                    <i data-lucide="${meta.icon}"></i>
                    <h3>${meta.label}</h3>
                    <span class="school-list-badge">${totalStatusCount}</span>
                </div>
                <i data-lucide="chevron-down" class="expand-icon"></i>
            </div>
            <div class="school-list-body">
                ${activeTypes.map((type) => renderTypeSection(type, stats[type], getSchoolsByStatus(filteredSchools, type, status), status)).join('')}
            </div>
        `;

        container.appendChild(card);
    });
}

function renderTypeSection(type, stats, schools, status) {
    const groupedSynthetic = groupSyntheticSchools(schools.filter((school) => school.synthetic));
    const realSchools = schools.filter((school) => !school.synthetic);
    const syntheticHtml = groupedSynthetic.map((group) => `
        <div class="school-name-chip synthetic-chip" title="${escapeHtml(group.reason)}">
            ${escapeHtml(group.label)}
        </div>
    `).join('');

    const realHtml = realSchools.map((school) => `
        <div class="school-name-chip" ${school.syntheticReason ? `title="${escapeHtml(school.syntheticReason)}"` : ''}>
            ${escapeHtml(school.nome)}
        </div>
    `).join('');

    const emptyState = realSchools.length === 0 && groupedSynthetic.length === 0
        ? '<p class="empty-list">Nenhuma unidade escolar nesta categoria.</p>'
        : '';

    const pctMap = {
        concluido: stats.pctConcluded,
        pendente: stats.pctPending,
        atraso: stats.pctAtraso,
    };

    const countMap = {
        concluido: stats.concluded,
        pendente: stats.pending,
        atraso: stats.atraso,
    };

    return `
        <div class="school-list-type-section">
            <h4>${TYPE_META[type].label} <span class="school-type-count">${countMap[status]} de ${stats.total} (${pctMap[status]}%)</span></h4>
            <div class="school-names-grid">
                ${realHtml}
                ${syntheticHtml}
                ${emptyState}
            </div>
        </div>
    `;
}

function groupSyntheticSchools(syntheticSchools) {
    const groups = new Map();

    syntheticSchools.forEach((school) => {
        const key = `${school.syntheticKind}|${school.syntheticReason}`;
        if (!groups.has(key)) {
            groups.set(key, {
                kind: school.syntheticKind,
                reason: school.syntheticReason || '',
                count: 0,
            });
        }

        groups.get(key).count += 1;
    });

    return [...groups.values()].map((group) => ({
        ...group,
        label: group.kind === 'blank-control-row'
            ? `${group.count} linha(s) vazia(s) contabilizada(s) na planilha`
            : `${group.count} unidade(s) ainda não identificada(s) nominalmente`,
    }));
}

function getSchoolsByStatus(schools, type, status) {
    return schools.filter((school) => school[type] && school[type].status === status);
}

function setSyncState(state, label, subtitle) {
    const container = document.getElementById('connection-status');
    const icon = container.querySelector('.sync-icon');
    const labelNode = document.getElementById('sync-label');
    const timeNode = document.getElementById('sync-time');

    container.classList.remove('sync-loading', 'sync-success', 'sync-warning', 'sync-error');
    container.classList.add(`sync-${state}`);

    const iconByState = {
        loading: 'refresh-cw',
        success: 'check-circle-2',
        warning: 'alert-triangle',
        error: 'shield-alert',
    };

    icon.setAttribute('data-lucide', iconByState[state] || 'refresh-cw');
    labelNode.textContent = label;
    timeNode.textContent = subtitle;
    lucide.createIcons();
}

function renderSyncDetails() {
    const syncDetails = document.getElementById('sync-details');
    if (!syncDetails) return;

    const source = DASHBOARD_PAYLOAD?.source;
    const issues = DASHBOARD_PAYLOAD?.issues || [];
    const recordCount = ESCOLAS.length;

    const parts = [];

    if (source) {
        const fetchedAt = formatDateTime(source.fetchedAt);
        parts.push(`
            <div class="sync-detail">
                <strong>Leitura online:</strong> ${fetchedAt || 'agora'}<br>
                <strong>Aba:</strong> ${escapeHtml(source.controlSheetName || 'CONTROLE')}<br>
                <strong>Registros:</strong> ${recordCount}
            </div>
        `);
    }

    if (issues.length > 0) {
        parts.push(`
            <details class="sync-issue-group">
                <summary>${issues.length} alerta(s) de integridade da planilha</summary>
                <div class="sync-issue-list">
                    ${issues.map((issue) => `
                        <div class="sync-issue ${issue.severity || 'warning'}">
                            ${escapeHtml(issue.message)}
                        </div>
                    `).join('')}
                </div>
            </details>
        `);
    }

    if (!source && issues.length === 0) {
        parts.push(`
            <div class="sync-detail">
                Aguardando a primeira resposta da API para exibir os detalhes da sincronização.
            </div>
        `);
    }

    syncDetails.innerHTML = parts.join('');
}

function buildSyncSubtitle(source, suffix = '') {
    const fetchedAt = formatDateTime(source?.fetchedAt);
    const modifiedAt = formatDateTime(source?.lastModified);
    const details = [];

    if (fetchedAt) details.push(`Lido em ${fetchedAt}`);
    if (modifiedAt) details.push(`arquivo ${modifiedAt}`);
    if (suffix) details.push(suffix);

    return details.join(' · ');
}

function getShareToken(shareUrl) {
    if (!shareUrl) return '';
    const tokenMatch = shareUrl.match(/\/([A-Za-z0-9_-]{20,})\?/);
    return tokenMatch ? tokenMatch[1] : '';
}

function shortToken(token) {
    if (!token || token.length <= 14) return token || '';
    return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function initCharts() {
    Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
    Chart.defaults.font.weight = '600';

    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    charts.doughnut = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['Processos Gerados', 'Instrução Pendente', 'Atraso Documental'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                borderRadius: 12,
                borderSkipped: false,
            }],
        },
        options: {
            cutout: '80%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    borderWidth: 1,
                    padding: 12,
                    titleFont: { weight: '700', size: 14 },
                    bodyFont: { size: 13, weight: '600' },
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.raw} unidades`,
                    },
                },
            },
        },
    });

    const ctxBar = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Processos Gerados', data: [], backgroundColor: '#10b981', borderRadius: 8, barPercentage: 0.6 },
                { label: 'Instrução Pendente', data: [], backgroundColor: '#f59e0b', borderRadius: 8, barPercentage: 0.6 },
                { label: 'Atraso Documental', data: [], backgroundColor: '#ef4444', borderRadius: 8, barPercentage: 0.6 },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 24,
                        font: { size: 12, weight: '700' },
                    },
                },
                tooltip: {
                    padding: 12,
                    cornerRadius: 8,
                    bodyFont: { weight: '600' },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true,
                    border: { display: false },
                    grid: { color: 'rgba(0,0,0,0.03)' },
                },
                x: {
                    stacked: true,
                    grid: { display: false },
                    border: { display: false },
                },
            },
        },
    });

    applyColorsToCharts();
}

function applyColorsToCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    if (charts.bar) {
        charts.bar.options.scales.x.ticks.color = textColor;
        charts.bar.options.scales.y.ticks.color = textColor;
        charts.bar.options.scales.y.grid.color = gridColor;
        charts.bar.update();
    }

    if (charts.doughnut) {
        charts.doughnut.update();
    }
}

function exportReport() {
    const filters = getActiveFilters();
    const activeTypes = Object.keys(TYPE_META).filter((type) => filters[type]);
    const filteredSchools = getFilteredSchools();
    const stats = {};

    activeTypes.forEach((type) => {
        stats[type] = calculateTypeStats(filteredSchools, type);
    });

    const element = document.createElement('div');
    element.className = 'pdf-report-container';
    element.innerHTML = `
        <div class="pdf-signature">relatório produzido por "PDDE online 4ª CRE"</div>
        <div class="pdf-header">
            <h1>Acompanhamento Gerencial PDDE 2026</h1>
            <p>Relatório de Status de Processos — GAD 4ª CRE</p>
        </div>
        <div class="pdf-summary-grid">
            ${activeTypes.map((type) => `
                <div class="pdf-card">
                    <h3>${TYPE_META[type].label}</h3>
                    <div class="pdf-stat">Concluídos: ${stats[type].concluded} de ${stats[type].total} (${stats[type].pctConcluded}%)</div>
                    <div class="pdf-stat">Pendentes: ${stats[type].pending}</div>
                    <div class="pdf-stat">Atraso: ${stats[type].atraso}</div>
                </div>
            `).join('')}
        </div>
        <div class="pdf-details">
            ${Object.entries(STATUS_META).map(([status, meta]) => `
                <div class="pdf-section">
                    <h2>${meta.label}</h2>
                    ${activeTypes.map((type) => {
                        const schools = getSchoolsByStatus(filteredSchools, type, status);
                        if (schools.length === 0) return '';

                        const realSchools = schools.filter((school) => !school.synthetic).map((school) => school.nome);
                        const syntheticGroups = groupSyntheticSchools(schools.filter((school) => school.synthetic)).map((group) => group.label);
                        const details = [...realSchools, ...syntheticGroups];

                        return `
                            <div class="pdf-type">
                                <h4>${TYPE_META[type].label}</h4>
                                <div class="pdf-school-list">${details.join(', ')}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(element);

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Relatorio_PDDE_4CRE_${new Date().toLocaleDateString('pt-BR')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
    });
}

function initMagnetEffect() {
    return;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
