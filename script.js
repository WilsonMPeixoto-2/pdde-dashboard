// ========================================
// PDDE 2026 Dashboard V4 — SaaS Premium Polish
// ========================================

const DENOM_BASIC_QUAL = 164;
const DENOM_EQUIT = 38;

let ESCOLAS = [];

function generateSchoolData() {
    const nomes = [
        "E.M. ALENCASTRO GUIMARÃES","E.M. ALFREDO DE PAULA FREITAS","E.M. ALICE DO AMARAL PEIXOTO",
        "E.M. ALMEIDA GARRETT","E.M. ÁLVARO ALBERTO","E.M. AMAZONAS","E.M. AMILCAR VASCONCELLOS",
        "E.M. ANA NÉRI","E.M. ANDRÉ URANI","E.M. ANÍBAL FREIRE","E.M. ANÍSIO TEIXEIRA",
        "E.M. ANTÔNIO AUSTREGÉSILO","E.M. ANTÔNIO BANDEIRA","E.M. ARAGÃO GOMES",
        "E.M. ARTUR AZEVEDO","E.M. AZEVEDO SODRÉ","E.M. BARÃO DE ITACURUSSÁ",
        "E.M. BARÃO DO AMPARO","E.M. BERNARDO DE VASCONCELLOS","E.M. BOA ESPERANÇA",
        "E.M. BOLÍVAR","E.M. BRIGADEIRO FARIA LIMA","E.M. CAMILO CASTELO BRANCO",
        "E.M. CARDEAL LEME","E.M. CARLOS DRUMMOND DE ANDRADE","E.M. CARLOS GOMES",
        "E.M. CARLOS MAXIMIANO","E.M. CARLOS ZÉPHIRO","E.M. CASTRO ALVES",
        "E.M. CECÍLIA MEIRELES","E.M. CLÓVIS BEVILÁQUA","E.M. COMPOSITOR LUIZ GONZAGA",
        "E.M. CONDESSA LAGES","E.M. CONSELHEIRO MAYRINK","E.M. CORAÇÃO DE MARIA",
        "E.M. CYRO MONTEIRO","E.M. D. JAIME CÂMARA","E.M. DARCY RIBEIRO",
        "E.M. DOM AQUINO CORRÊA","E.M. DOM HÉLDER CÂMARA","E.M. DOM PEDRO I",
        "E.M. DOUTOR CÍCERO PENNA","E.M. DOUTOR COCIO BARCELLOS","E.M. DRUMOND",
        "E.M. EDMUNDO BITTENCOURT","E.M. EDMUNDO LINS","E.M. EDUARDO RABELO",
        "E.M. EMBAIXADOR ARAÚJO CASTRO","E.M. ENGENHEIRO GASTÃO RANGEL",
        "E.M. EPITÁCIO PESSOA","E.M. ERNESTO DE SOUSA","E.M. ESTADO DA GUANABARA",
        "E.M. ÉZIO COSTA","E.M. FERNANDO RODRIGUES DA SILVEIRA","E.M. FLORIANO PEIXOTO",
        "E.M. FRANCISCO ALVES","E.M. FRANCISCO CAMPOS","E.M. FRANCISCO DE PAULA BRITO",
        "E.M. FRIEDENREICH","E.M. GENERAL OSÓRIO","E.M. GENTIL DE MOURA",
        "E.M. GETÚLIO VARGAS","E.M. GONÇALVES DIAS","E.M. GUILHERME TELL",
        "E.M. HAYDEN WHITE","E.M. HENRIQUE DODSWORTH","E.M. HERÁCLITO FONTOURA SOBRAL PINTO",
        "E.M. HERBERTO SALES","E.M. HILTON SANTOS","E.M. HOLANDA",
        "E.M. HONÓRIO GURGEL","E.M. IRENE BARBOSA MONTEIRO","E.M. ISMAEL NERY",
        "E.M. ITÁLIA","E.M. JÂNIO QUADROS","E.M. JEAN BAPTISTE DEBRET",
        "E.M. JOAQUIM NABUCO","E.M. JOÃO BARBALHO","E.M. JOÃO KÖPKE",
        "E.M. JORGE AMADO","E.M. JOSÉ ACCIOLI","E.M. JOSÉ APARECIDO",
        "E.M. JOSÉ BONIFÁCIO","E.M. JOSÉ DE ALENCAR","E.M. JOSÉ PANCETTI",
        "E.M. JOSÉ VERÍSSIMO","E.M. JOSUÉ DE CASTRO","E.M. JÚLIA KUBITSCHEK",
        "E.M. JÚLIA LOPES DE ALMEIDA","E.M. LEITÃO DA CUNHA","E.M. LEOPOLDO MACHADO",
        "E.M. LEVINDO COELHO","E.M. LINS DE VASCONCELOS","E.M. LUIZ CAMILLO",
        "E.M. LUIZ CARLOS DA FONSECA","E.M. MACHADO DE ASSIS","E.M. MARECHAL TROMPOWSKY",
        "E.M. MARIA CLARA MACHADO","E.M. MARIA QUITÉRIA","E.M. MARIETA DA CUNHA",
        "E.M. MARIO FACCINI","E.M. MARQUÊS DE MARICÁ","E.M. MARQUÊS DO HERVAL",
        "E.M. MATO GROSSO","E.M. MENDES VIANA","E.M. MESTRE DARCY DO JONGO",
        "E.M. MIGUEL COUTO FILHO","E.M. MONTEIRO LOBATO","E.M. NARCISA AMÁLIA",
        "E.M. NELSON MANDELA","E.M. NERVAL DE GOUVEIA","E.M. NILO PEÇANHA",
        "E.M. NICARÁGUA","E.M. OLINTO DA GAMA BOTELHO","E.M. OLÍVIO CAMPISTA",
        "E.M. ORESTES BARBOSA","E.M. OROZIMBO NONATO","E.M. OSCAR CLARK",
        "E.M. OSÓRIO DUQUE ESTRADA","E.M. PADRE AGOSTINHO","E.M. PADRE LEONEL FRANCA",
        "E.M. PANAMÁ","E.M. PARANAGUÁ","E.M. PARANÁ",
        "E.M. PASTOR SAMUEL","E.M. PAULO DE FRONTIN","E.M. PAULO FREIRE",
        "E.M. PEDRO ERNESTO","E.M. PEREIRA PASSOS","E.M. PERNAMBUCO",
        "E.M. PIXINGUINHA","E.M. POETA M. BANDEIRA","E.M. PRESIDENTE KENNEDY",
        "E.M. QUINTINO BOCAIÚVA","E.M. RAUL PEDERNEIRAS","E.M. REPÚBLICA ARGENTINA",
        "E.M. REPÚBLICA DO PERU","E.M. RIBEIRO DE ANDRADA","E.M. RIO DE JANEIRO",
        "E.M. RIO GRANDE DO SUL","E.M. RODRIGO OTÁVIO","E.M. ROSA LUXEMBURGO",
        "E.M. RUBENS BERARDO","E.M. RUY BARBOSA","E.M. SALGADO FILHO",
        "E.M. SANTA CATARINA","E.M. SANTA LUZIA","E.M. SANTO AMARO",
        "E.M. SÃO SEBASTIÃO","E.M. SILVEIRA SAMPAIO","E.M. SOBRAL PINTO",
        "E.M. SOUZA AGUIAR","E.M. TASSO DA SILVEIRA","E.M. TAVARES BASTOS",
        "E.M. TENENTE ANTÔNIO JOÃO","E.M. TENENTE RENATO CÉSAR","E.M. TIRADENTES",
        "E.M. THOMÉ DE SOUZA","E.M. TOMÁS ANTÔNIO GONZAGA","E.M. VIRGÍLIO DE MELO FRANCO",
        "E.M. VISCONDE DE CAIRU","E.M. VISCONDE DE ITABORAÍ","E.M. VITA BRASIL",
        "E.M. VIVALDO COARACY","E.M. VOLTA REDONDA","E.M. ZUZU ANGEL"
    ];

    while (nomes.length < 164) { nomes.push(`E.M. UNIDADE ESCOLAR ${nomes.length + 1}`); }

    const schools = [];
    for (let i = 0; i < 164; i++) {
        const isEquidadeEligible = i < DENOM_EQUIT; 
        
        // Mock generation
        let bDoc = i < 136, bProc = i < 106 ? `000704.${String(3000+i).padStart(6,'0')}/2026-${String(10+(i%90)).padStart(2,'0')}` : null;
        let qDoc = i < 109, qProc = i < 59 ? `000704.${String(2000+i).padStart(6,'0')}/2026-${String(10+(i%90)).padStart(2,'0')}` : null;
        let eDoc = isEquidadeEligible && i < 33, eProc = isEquidadeEligible && i < 27 ? `000704.${String(3200+i).padStart(6,'0')}/2026-${String(10+(i%90)).padStart(2,'0')}` : null;

        schools.push({
            nome: nomes[i],
            equidadeEligible: isEquidadeEligible,
            basico:    { docOk: bDoc, processo: bProc },
            qualidade: { docOk: qDoc, processo: qProc },
            equidade:  { docOk: eDoc, processo: eProc }
        });
    }
    return schools;
}

function getStatus(escola, tipo) {
    const data = escola[tipo];
    if (!data) return null;
    if (tipo === 'equidade' && !escola.equidadeEligible) return null;

    if (data.processo) return 'concluido';
    if (data.docOk) return 'pendente';
    return 'atraso';
}

function getSchoolsByStatus(tipo, status) {
    return ESCOLAS.filter(e => getStatus(e, tipo) === status);
}

function countByStatus(tipo) {
    const eligible = tipo === 'equidade' ? ESCOLAS.filter(e => e.equidadeEligible) : ESCOLAS;
    const denom = tipo === 'equidade' ? DENOM_EQUIT : DENOM_BASIC_QUAL;

    const concluido = eligible.filter(e => getStatus(e, tipo) === 'concluido').length;
    const pendente = eligible.filter(e => getStatus(e, tipo) === 'pendente').length;
    
    // For Equidade, the gap between eligible (found) and denom (total expected) is also "atraso"
    // For Básico/Qualidade, denom=164 matches ESCOLAS.length, so it's consistent.
    const atraso = denom - (concluido + pendente);

    return {
        concluido, pendente, atraso, denom,
        pctConcluido: denom > 0 ? Math.round((concluido / denom) * 100) : 0,
        pctPendente: denom > 0 ? Math.round((pendente / denom) * 100) : 0,
        pctAtraso: denom > 0 ? Math.round((atraso / denom) * 100) : 0
    };
}

let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AOS
    if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true });

    // Custom Awwwards Magnet Effect & Cursor Follower
    initMagnetEffect();

    // Initialize Tooltips
    if (typeof tippy !== 'undefined') {
        tippy('[title]', {
            theme: 'translucent',
            animation: 'shift-away',
            inertia: true
        });
    }

    // Starts with mock data immediately to not leave screen blank
    ESCOLAS = generateSchoolData();
    initCharts();
    updateDashboard();
    attachEventListeners();
    updateSyncTime();
    
    // Try to fetch LIVE DATA behind the scenes
    await fetchLiveData();
});

async function fetchLiveData() {
    try {
        const btnSync = document.querySelector('.sync-icon');
        const syncText = document.getElementById('sync-time');
        
        btnSync.setAttribute('data-lucide', 'refresh-cw');
        btnSync.classList.add('spinning'); // Assume we add CSS animation for this
        lucide.createIcons();
        syncText.textContent = 'Buscando do Excel...';

        const response = await fetch('/api/excel');
        const result = await response.json();

        if (response.ok && result.success) {
            console.log('Real Data Arrived:', result.data.length, 'linhas');
            ESCOLAS = parseRealExcelToObjects(result.data);
            updateDashboard();
            updateSyncTime();
            
            btnSync.setAttribute('data-lucide', 'check-circle-2');
            btnSync.classList.remove('spinning');
            
            // Wow effect: Confetti!
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b']
                });
            }
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Dados Atualizados',
                    text: 'O motor de análise foi sincronizado com sucesso!',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        } else {
            throw new Error(result.error + ' - ' + (result.hint || ''));
        }
    } catch (error) {
        console.warn('Fallback to Local Mock Data. Reason:', error.message);
        
        const syncSection = document.querySelector('.connection-status');
        syncSection.innerHTML = `
            <i data-lucide="alert-triangle" class="sync-icon" style="color: var(--color-atraso);"></i>
            <div style="display:flex; flex-direction:column;">
                <p style="color:var(--color-atraso);">Bloqueio de Login da Azure/OneDrive</p>
                <span style="font-size:0.7rem; line-height:1.2; padding-top:4px;">Para conectar o motor, o Excel precisa estar com acesso: "Qualquer pessoa com o link". Leia o painel.</span>
            </div>
        `;
        lucide.createIcons();
    }
}

function parseRealExcelToObjects(rows) {
    // rows = array of arrays (each row is an array of cell values by column index)
    // Column mapping based on the REAL Excel structure:
    // Col D (idx 3) = NOME DA UNIDADE ESCOLAR
    // Col E (idx 4) = "Todas as documentações concluídas e assinadas - Data" (Básico Doc)
    // Col F (idx 5) = "Nº Processo Básico"
    // Col J (idx 9) = "Todas as documentações concluídas e assinadas - Data" (Qualidade Doc)
    // Col K (idx 10) = "Nº Processo Qualidade"
    // Col O (idx 14) = "Todas as documentações concluídas e assinadas - Data" (Equidade Doc)
    // Col P (idx 15) = "Nº Processo EQUIDADE"
    
    const COL_NOME = 3;
    const COL_BASICO_DOC = 4;
    const COL_BASICO_PROC = 5;
    const COL_QUALIDADE_DOC = 9;
    const COL_QUALIDADE_PROC = 10;
    const COL_EQUIDADE_DOC = 14;
    const COL_EQUIDADE_PROC = 15;

    const notEmpty = (val) => val !== undefined && val !== null && val !== '' && val !== false;

    const schools = [];
    
    // First pass: find which schools have ANY equidade data to determine eligibility
    rows.forEach(row => {
        const nome = row[COL_NOME];
        if (!nome || String(nome).trim() === '') return;
        
        const hasEquidadeData = notEmpty(row[COL_EQUIDADE_DOC]) || notEmpty(row[COL_EQUIDADE_PROC]);
        
        schools.push({
            nome: String(nome).trim(),
            equidadeEligible: hasEquidadeData,
            basico: {
                docOk: notEmpty(row[COL_BASICO_DOC]),
                processo: notEmpty(row[COL_BASICO_PROC]) ? row[COL_BASICO_PROC] : null
            },
            qualidade: {
                docOk: notEmpty(row[COL_QUALIDADE_DOC]),
                processo: notEmpty(row[COL_QUALIDADE_PROC]) ? row[COL_QUALIDADE_PROC] : null
            },
            equidade: {
                docOk: notEmpty(row[COL_EQUIDADE_DOC]),
                processo: notEmpty(row[COL_EQUIDADE_PROC]) ? row[COL_EQUIDADE_PROC] : null
            }
        });
    });
    
    console.log('Parsed', schools.length, 'schools from real Excel data');
    console.log('Equidade eligible:', schools.filter(s => s.equidadeEligible).length);
    
    return schools;
}

function attachEventListeners() {
    document.querySelectorAll('.custom-checkbox input').forEach(cb => {
        cb.addEventListener('change', updateDashboard);
    });
    document.getElementById('filter-status').addEventListener('change', updateDashboard);
    document.getElementById('btn-export').addEventListener('click', exportReport);
    
    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    themeToggleBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        
        const icon = themeToggleBtn.querySelector('i');
        const span = themeToggleBtn.querySelector('span');
        
        if (newTheme === 'dark') {
            icon.setAttribute('data-lucide', 'sun');
            span.textContent = 'Tema Claro';
        } else {
            icon.setAttribute('data-lucide', 'moon');
            span.textContent = 'Tema Escuro';
        }
        
        lucide.createIcons();
        applyColorsToCharts();
    });

    // Mobile Simulation Toggle
    const btnMobileView = document.getElementById('btn-mobile-view');
    if (btnMobileView) {
        btnMobileView.addEventListener('click', () => {
            const container = document.querySelector('.app-container');
            container.classList.toggle('mobile-simulated');
            
            const isMobile = container.classList.contains('mobile-simulated');
            const icon = btnMobileView.querySelector('i');
            const span = btnMobileView.querySelector('span');
            
            if (isMobile) {
                icon.setAttribute('data-lucide', 'monitor');
                span.textContent = 'Voltar ao PC';
            } else {
                icon.setAttribute('data-lucide', 'smartphone');
                span.textContent = 'Mobile';
            }
            lucide.createIcons();
            setTimeout(() => window.dispatchEvent(new Event('resize')), 500); // Delayed resize for smooth transition
        });
    }

    // Actual Mobile Sidebar Toggle
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
        status: document.getElementById('filter-status').value
    };
}

function updateSyncTime() {
    const now = new Date();
    document.getElementById('sync-time').textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function applyColorsToCharts() {
    const style = getComputedStyle(document.body);
    const cConcluido = style.getPropertyValue('--color-concluido').trim();
    const cPendente = style.getPropertyValue('--color-pendente').trim();
    const cAtraso = style.getPropertyValue('--color-atraso').trim();
    const textMain = style.getPropertyValue('--text-main').trim();
    const textMuted = style.getPropertyValue('--text-muted').trim();
    const borderHeavy = style.getPropertyValue('--border-heavy').trim();
    const bgCard = style.getPropertyValue('--bg-card').trim();

    Chart.defaults.color = textMuted;

    if(charts.doughnut) {
        charts.doughnut.data.datasets[0].backgroundColor = [cConcluido, cPendente, cAtraso];
        charts.doughnut.options.plugins.tooltip.backgroundColor = bgCard;
        charts.doughnut.options.plugins.tooltip.titleColor = textMain;
        charts.doughnut.options.plugins.tooltip.bodyColor = textMain;
        charts.doughnut.options.plugins.tooltip.borderColor = borderHeavy;
        charts.doughnut.update();
    }
    
    if(charts.bar) {
        charts.bar.data.datasets[0].backgroundColor = cConcluido;
        charts.bar.data.datasets[1].backgroundColor = cPendente;
        charts.bar.data.datasets[2].backgroundColor = cAtraso;
        charts.bar.options.plugins.tooltip.backgroundColor = bgCard;
        charts.bar.options.plugins.tooltip.titleColor = textMain;
        charts.bar.options.plugins.tooltip.bodyColor = textMain;
        charts.bar.options.plugins.tooltip.borderColor = borderHeavy;
        charts.bar.options.scales.x.grid.color = 'transparent';
        charts.bar.options.scales.y.grid.color = style.getPropertyValue('--border-color').trim();
        charts.bar.update();
    }
}

function updateDashboard() {
    const filters = getActiveFilters();
    const activeTypes = [];
    if (filters.basico) activeTypes.push('basico');
    if (filters.qualidade) activeTypes.push('qualidade');
    if (filters.equidade) activeTypes.push('equidade');

    const stats = {};
    activeTypes.forEach(t => { stats[t] = countByStatus(t); });

    let totalConcluido = 0, totalPendente = 0, totalAtraso = 0;
    activeTypes.forEach(t => {
        totalConcluido += stats[t].concluido;
        totalPendente += stats[t].pendente;
        totalAtraso += stats[t].atraso;
    });

    document.getElementById('total-geral').textContent = totalConcluido;
    
    const pctB = stats.basico ? stats.basico.pctConcluido : 0;
    const pctQ = stats.qualidade ? stats.qualidade.pctConcluido : 0;
    const pctE = stats.equidade ? stats.equidade.pctConcluido : 0;

    document.getElementById('pct-basico').textContent = filters.basico ? pctB : '0';
    document.getElementById('pct-qualidade').textContent = filters.qualidade ? pctQ : '0';
    document.getElementById('pct-equidade').textContent = filters.equidade ? pctE : '0';

    document.getElementById('bar-basico').style.width = (filters.basico ? pctB : 0) + '%';
    document.getElementById('bar-qualidade').style.width = (filters.qualidade ? pctQ : 0) + '%';
    document.getElementById('bar-equidade').style.width = (filters.equidade ? pctE : 0) + '%';

    document.getElementById('count-basico').textContent = filters.basico ? `${stats.basico.concluido} de ${stats.basico.denom} (${stats.basico.pctConcluido}%)` : '';
    document.getElementById('count-qualidade').textContent = filters.qualidade ? `${stats.qualidade.concluido} de ${stats.qualidade.denom} (${stats.qualidade.pctConcluido}%)` : '';
    document.getElementById('count-equidade').textContent = filters.equidade ? `${stats.equidade.concluido} de ${stats.equidade.denom} (${stats.equidade.pctConcluido}%)` : '';

    const globalTotal = totalConcluido + totalPendente + totalAtraso;
    const gPctC = globalTotal > 0 ? Math.round((totalConcluido / globalTotal) * 100) : 0;

    if (charts.doughnut) {
        charts.doughnut.data.datasets[0].data = [totalConcluido, totalPendente, totalAtraso];
        charts.doughnut.update();
    }
    document.getElementById('global-pct').textContent = gPctC + '%';

    if (charts.bar) {
        const labels = [];
        const dataConcluido = [];
        const dataPendente = [];
        const dataAtraso = [];

        activeTypes.forEach(t => {
            const s = stats[t];
            const labelMap = { basico: 'Básico', qualidade: 'Qualidade', equidade: 'Equidade' };
            labels.push(labelMap[t]);
            dataConcluido.push(s.concluido);
            dataPendente.push(s.pendente);
            dataAtraso.push(s.atraso);
        });

        charts.bar.data.labels = labels;
        charts.bar.data.datasets[0].data = dataConcluido;
        charts.bar.data.datasets[1].data = dataPendente;
        charts.bar.data.datasets[2].data = dataAtraso;
        charts.bar.update();
    }

    renderSchoolLists(activeTypes, filters.status, stats);
    lucide.createIcons();
}

function renderSchoolLists(activeTypes, statusFilter, stats) {
    const container = document.getElementById('school-lists');
    container.innerHTML = '';

    const statusTypes = ['concluido', 'pendente', 'atraso'];
    const statusLabels = {
        concluido: 'Processos Gerados na 4ª CRE',
        pendente: 'Pendentes de Instrução Processual',
        atraso: 'Atraso na Entrega Documental à GAD'
    };
    const statusIcons = { concluido: 'check-circle', pendente: 'clock', atraso: 'alert-triangle' };
    const statusClasses = { concluido: 'status-concluido', pendente: 'status-pendente', atraso: 'status-atraso' };

    statusTypes.forEach(status => {
        if (statusFilter !== 'all' && statusFilter !== status) return;

        const card = document.createElement('div');
        card.className = `school-list-card kpi-card ${statusClasses[status]}`;
        card.setAttribute('data-aos', 'fade-up');

        const schoolsByType = {};
        activeTypes.forEach(tipo => {
            const s = stats[tipo];
            const tipoLabel = { basico: 'Básico', qualidade: 'Qualidade', equidade: 'Equidade' }[tipo];
            const schoolsFound = getSchoolsByStatus(tipo, status);
            
            // Note: count reflects the logic (38 base for Equidade), while schoolsFound shows names from the file.
            let count = s[status];
            schoolsByType[tipoLabel] = { 
                schools: schoolsFound, 
                count: count, 
                denom: s.denom, 
                pct: status === 'concluido' ? s.pctConcluido : (status === 'pendente' ? s.pctPendente : s.pctAtraso)
            };
        });

        const totalSchools = Object.values(schoolsByType).reduce((sum, v) => sum + v.count, 0);

        card.innerHTML = `
            <div class="school-list-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div class="school-list-title">
                    <i data-lucide="${statusIcons[status]}"></i>
                    <h3>${statusLabels[status]}</h3>
                    <span class="school-list-badge">${totalSchools}</span>
                </div>
                <i data-lucide="chevron-down" class="expand-icon"></i>
            </div>
            <div class="school-list-body">
                ${Object.entries(schoolsByType).map(([tipoLabel, data]) => `
                    <div class="school-list-type-section">
                        <h4>${tipoLabel} <span class="school-type-count">${data.count} de ${data.denom} (${data.pct}%)</span></h4>
                        <div class="school-names-grid">
                            ${data.schools.map(e => `<div class="school-name-chip">${e.nome}</div>`).join('')}
                            ${data.schools.length === 0 ? '<p class="empty-list">Nenhuma unidade escolar nesta categoria.</p>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
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
                borderSkipped: false
            }]
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
                    callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} unidades` }
                }
            }
        }
    });

    const ctxBar = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Processos Gerados', data: [], backgroundColor: '#10b981', borderRadius: 8, barPercentage: 0.6 },
                { label: 'Instrução Pendente', data: [], backgroundColor: '#f59e0b', borderRadius: 8, barPercentage: 0.6 },
                { label: 'Atraso Documental', data: [], backgroundColor: '#ef4444', borderRadius: 8, barPercentage: 0.6 }
            ]
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
                        font: { size: 12, weight: '700' }
                    }
                },
                tooltip: {
                    padding: 12,
                    cornerRadius: 8,
                    bodyFont: { weight: '600' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    stacked: true, 
                    border: { display: false }, 
                    grid: { color: 'rgba(0,0,0,0.03)' } 
                },
                x: { 
                    stacked: true, 
                    grid: { display: false }, 
                    border: { display: false } 
                }
            }
        }
    });

    applyColorsToCharts(); // Apply current theme colors immediately
}

function exportReport() {
    const element = document.createElement('div');
    element.className = 'pdf-report-container';
    element.innerHTML = `
        <div class="pdf-signature">relatório produzido por "PDDE online 4ª CRE"</div>
        <div class="pdf-header">
            <h1>Acompanhamento Gerencial PDDE 2026</h1>
            <p>Relatório de Status de Processos — GAD 4ª CRE</p>
        </div>
        <div class="pdf-summary-grid">
            ${['basico', 'qualidade', 'equidade'].map(tipo => {
                const s = countByStatus(tipo);
                const label = { basico: 'Básico', qualidade: 'Qualidade', equidade: 'Equidade' }[tipo];
                return `
                    <div class="pdf-card">
                        <h3>${label}</h3>
                        <div class="pdf-stat">Concluídos: ${s.concluido} de ${s.denom} (${s.pctConcluido}%)</div>
                        <div class="pdf-stat">Pendentes: ${s.pendente}</div>
                        <div class="pdf-stat">Atraso: ${s.atraso}</div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="pdf-details">
            ${['concluido', 'pendente', 'atraso'].map(status => {
                const label = {
                    concluido: 'Processos Gerados na 4ª CRE',
                    pendente: 'Pendentes de Instrução Processual',
                    atraso: 'Atraso na Entrega Documental à GAD'
                }[status];
                return `
                    <div class="pdf-section">
                        <h2>${label}</h2>
                        ${['basico', 'qualidade', 'equidade'].map(tipo => {
                            const schools = getSchoolsByStatus(tipo, status);
                            if (schools.length === 0) return '';
                            const tipoLabel = { basico: 'Básico', qualidade: 'Qualidade', equidade: 'Equidade' }[tipo];
                            return `
                                <div class="pdf-type">
                                    <h4>${tipoLabel}</h4>
                                    <div class="pdf-school-list">
                                        ${schools.map(e => `<span>${e.nome}</span>`).join(', ')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    document.body.appendChild(element);

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Relatorio_PDDE_4CRE_${new Date().toLocaleDateString()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
    });
}
function updateSyncTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('pt-BR');
    const el = document.getElementById('sync-time');
    if (el) el.textContent = `${dateStr} às ${timeStr}`;
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
        // Doughnut doesn't usually have scales but could have custom font colors
        charts.doughnut.update();
    }
}
function initMagnetEffect() {
    const cards = document.querySelectorAll('.kpi-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            card.style.transform = `translateY(-12px) scale(1.03) rotateX(${-y/20}deg) rotateY(${x/20}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}
