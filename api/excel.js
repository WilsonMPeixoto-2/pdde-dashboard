const crypto = require('crypto');
const https = require('https');
const xlsx = require('xlsx');

const DEFAULT_SHARE_URL = 'https://rioeduca-my.sharepoint.com/:x:/g/personal/wilson_mpeixoto_rioeduca_net/IQBfthSt4_rrSrPUrxqxwDY7AfUSuaRqf_03-JACEivzpkQ?e=YitaBf';
const DEFAULT_DOWNLOAD_URL = 'https://rioeduca-my.sharepoint.com/personal/wilson_mpeixoto_rioeduca_net/_layouts/15/download.aspx?share=IQBfthSt4_rrSrPUrxqxwDY7AfUSuaRqf_03-JACEivzpkQ';
const DEFAULT_WORKSHEET_NAME = 'CONTROLE';
const DEFAULT_SUMMARY_SHEET_NAME = 'DASHBOARD';

module.exports = async (req, res) => {
    setNoStoreHeaders(res);

    if (req.method && req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            success: false,
            error: 'Metodo nao suportado.',
        });
    }

    const shareUrl = process.env.EXCEL_SHARE_URL || DEFAULT_SHARE_URL;
    const downloadUrl = process.env.EXCEL_DOWNLOAD_URL || buildDownloadUrl(shareUrl) || DEFAULT_DOWNLOAD_URL;
    const controlSheetName = process.env.EXCEL_WORKSHEET_NAME || DEFAULT_WORKSHEET_NAME;
    const summarySheetName = process.env.EXCEL_SUMMARY_SHEET_NAME || DEFAULT_SUMMARY_SHEET_NAME;

    try {
        const downloaded = await downloadFile(downloadUrl);
        const workbook = xlsx.read(downloaded.buffer, { type: 'buffer', cellFormula: true });
        const payload = buildDashboardPayload({
            workbook,
            controlSheetName,
            summarySheetName,
            shareUrl,
            downloadUrl,
            downloaded,
        });

        return res.status(200).json({
            success: true,
            message: 'Dados extraidos com sucesso.',
            ...payload,
        });
    } catch (error) {
        console.error('Error fetching/parsing Excel:', error);

        return res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Verifique se o link do SharePoint continua publico para leitura e se a aba CONTROLE permanece disponivel.',
        });
    }
};

module.exports._internal = {
    buildDashboardPayload,
    buildDownloadUrl,
    buildColumnMap,
    calculateMetrics,
    classifyStatus,
    createSyntheticRecords,
    findWhitespaceOnlyProcessCells,
    normalizeWorkbook,
    parseDashboardTotals,
    validateRequiredColumns,
};

function setNoStoreHeaders(res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
}

function buildDownloadUrl(shareUrl) {
    if (!shareUrl) return null;
    if (shareUrl.includes('/download.aspx?share=')) return shareUrl;

    const tokenMatch = shareUrl.match(/\/([A-Za-z0-9_-]{20,})\?/);
    if (!tokenMatch) return null;

    return `https://rioeduca-my.sharepoint.com/personal/wilson_mpeixoto_rioeduca_net/_layouts/15/download.aspx?share=${tokenMatch[1]}`;
}

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const fetchUrl = (currentUrl, redirects = 0) => {
            if (redirects > 5) {
                reject(new Error('Muitos redirecionamentos ao tentar baixar a planilha.'));
                return;
            }

            const request = https.get(currentUrl, {
                headers: {
                    'User-Agent': 'pdde-dashboard-sync/2.0',
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
                    Pragma: 'no-cache',
                    'Cache-Control': 'no-cache',
                },
            }, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    let redirectUrl = response.headers.location;

                    if (!redirectUrl.startsWith('http')) {
                        const parsedUrl = new URL(currentUrl);
                        redirectUrl = `${parsedUrl.origin}${redirectUrl}`;
                    }

                    fetchUrl(redirectUrl, redirects + 1);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Falha no download. HTTP Status: ${response.statusCode}. Isso normalmente indica que o SharePoint passou a exigir login.`));
                    return;
                }

                const contentType = response.headers['content-type'] || '';
                if (contentType.includes('text/html')) {
                    reject(new Error('O SharePoint retornou HTML em vez do arquivo Excel. O link provavelmente caiu em tela de autenticacao.'));
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    resolve({
                        buffer: Buffer.concat(chunks),
                        headers: response.headers,
                        finalUrl: currentUrl,
                    });
                });
            });

            request.setTimeout(30000, () => {
                request.destroy(new Error('Tempo esgotado ao baixar a planilha do SharePoint.'));
            });

            request.on('error', reject);
        };

        fetchUrl(url);
    });
}

function buildDashboardPayload({ workbook, controlSheetName, summarySheetName, shareUrl, downloadUrl, downloaded }) {
    const resolvedControlSheet = findSheetName(workbook, controlSheetName) || workbook.SheetNames[0];
    const resolvedSummarySheet = findSheetName(workbook, summarySheetName);

    if (!resolvedControlSheet) {
        throw new Error('Nao foi possivel localizar a aba principal da planilha.');
    }

    const controlSheet = workbook.Sheets[resolvedControlSheet];
    const summarySheet = resolvedSummarySheet ? workbook.Sheets[resolvedSummarySheet] : null;
    const controlRows = xlsx.utils.sheet_to_json(controlSheet, { header: 1, defval: '' });
    const summaryRows = summarySheet ? xlsx.utils.sheet_to_json(summarySheet, { header: 1, defval: '' }) : [];

    if (controlRows.length <= 1) {
        throw new Error('A aba CONTROLE foi lida, mas nao possui linhas suficientes para montar o dashboard.');
    }

    const normalized = normalizeWorkbook(controlRows, summaryRows);

    return {
        headers: controlRows[0],
        records: normalized.records,
        metrics: normalized.metrics,
        issues: normalized.issues,
        source: {
            shareUrl,
            downloadUrl,
            fetchedAt: new Date().toISOString(),
            finalUrl: downloaded.finalUrl,
            lastModified: downloaded.headers['last-modified'] || null,
            etag: downloaded.headers.etag || null,
            contentLength: Number(downloaded.headers['content-length'] || downloaded.buffer.length),
            contentType: downloaded.headers['content-type'] || null,
            workbookHash: crypto.createHash('sha1').update(downloaded.buffer).digest('hex'),
            workbookSheets: workbook.SheetNames,
            controlSheetName: resolvedControlSheet,
            summarySheetName: resolvedSummarySheet || null,
        },
    };
}

function normalizeWorkbook(controlRows, summaryRows) {
    const headerRow = controlRows[0] || [];
    const columnMap = buildColumnMap(headerRow);
    validateRequiredColumns(columnMap);
    const totals = parseDashboardTotals(summaryRows);
    const whitespaceOnlyProcessCells = findWhitespaceOnlyProcessCells(controlRows, columnMap);

    const parsedRows = controlRows.slice(1).map((row, index) => parseControlRow(row, index + 2, columnMap));
    const namedRecords = parsedRows
        .filter((row) => row.nome)
        .map((row) => ({
            ...row,
            synthetic: false,
            syntheticKind: null,
            syntheticReason: null,
        }));

    const blankRows = parsedRows.filter((row) => !row.nome && !row.hasAnyValue);
    const dominantCreCode = getDominantCreCode(namedRecords);
    const syntheticRecords = createSyntheticRecords({
        namedRecords,
        blankRows,
        totals,
        dominantCreCode,
    });

    const records = [...namedRecords, ...syntheticRecords];
    const metrics = calculateMetrics(records);
    const issues = buildIssues({
        blankRows,
        totals,
        metrics,
        namedRecords,
        whitespaceOnlyProcessCells,
    });

    return {
        records,
        metrics,
        issues,
    };
}

function buildColumnMap(headerRow) {
    const normalizedHeaders = headerRow.map((value) => normalizeText(value));
    const docColumns = normalizedHeaders.reduce((indices, header, index) => {
        if (header === 'todas as documentacoes concluidas e assinadas - data') {
            indices.push(index);
        }
        return indices;
    }, []);

    return {
        ra: findHeaderIndex(normalizedHeaders, (header) => header === 'r.a.' || header === 'r a'),
        designation: findHeaderIndex(normalizedHeaders, (header) => header === 'designacao'),
        sici: findHeaderIndex(normalizedHeaders, (header) => header === 'sici'),
        name: findHeaderIndex(normalizedHeaders, (header) => header === 'nome da unidade escolar'),
        basicoDoc: docColumns[0] ?? 4,
        basicoProc: findHeaderIndex(normalizedHeaders, (header) => header.includes('processo basico')),
        qualidadeDoc: docColumns[1] ?? 9,
        qualidadeProc: findHeaderIndex(normalizedHeaders, (header) => header.includes('processo qualidade')),
        equidadeDoc: docColumns[2] ?? 14,
        equidadeProc: findHeaderIndex(normalizedHeaders, (header) => header.includes('processo equidade')),
        equidadeEligibility: findHeaderIndex(normalizedHeaders, (header) => header.includes('equidade') && (header.includes('eleg') || header.includes('criterio') || header.includes('perfil') || header.includes('publico'))),
    };
}

function findWhitespaceOnlyProcessCells(controlRows, columnMap) {
    const processColumns = [
        { type: 'basico', index: columnMap.basicoProc },
        { type: 'qualidade', index: columnMap.qualidadeProc },
        { type: 'equidade', index: columnMap.equidadeProc },
    ];

    return controlRows.slice(1).flatMap((row, index) => processColumns.flatMap((column) => {
        const rawValue = row[column.index];
        if (typeof rawValue !== 'string' || rawValue === '' || rawValue.trim() !== '') {
            return [];
        }

        return [{
            type: column.type,
            sourceRow: index + 2,
            nome: cleanText(row[columnMap.name]) || null,
            designacao: cleanText(row[columnMap.designation]) || null,
        }];
    }));
}

function validateRequiredColumns(columnMap) {
    const required = [
        { key: 'designation', label: 'DESIGNAÇÃO' },
        { key: 'name', label: 'NOME DA UNIDADE ESCOLAR' },
        { key: 'basicoProc', label: 'Nº Processo Básico' },
        { key: 'qualidadeProc', label: 'Nº Processo Qualidade' },
        { key: 'equidadeProc', label: 'Nº Processo EQUIDADE' },
    ];

    const missing = required
        .filter(({ key }) => !Number.isInteger(columnMap[key]) || columnMap[key] < 0)
        .map(({ label }) => label);

    if (missing.length > 0) {
        throw new Error(`Nao foi possivel localizar coluna(s) obrigatoria(s) na aba CONTROLE: ${missing.join(', ')}.`);
    }
}

function parseControlRow(row, excelRowNumber, columnMap) {
    const nome = cleanText(row[columnMap.name]);
    const designacao = cleanText(row[columnMap.designation]);
    const raValue = cleanText(row[columnMap.ra]);
    const siciValue = cleanText(row[columnMap.sici]);
    const creCode = extractCreCode(designacao);

    const basicoDoc = row[columnMap.basicoDoc];
    const basicoProc = row[columnMap.basicoProc];
    const qualidadeDoc = row[columnMap.qualidadeDoc];
    const qualidadeProc = row[columnMap.qualidadeProc];
    const equidadeDoc = row[columnMap.equidadeDoc];
    const equidadeProc = row[columnMap.equidadeProc];

    const explicitEquidadeEligibility = columnMap.equidadeEligibility >= 0
        ? toBoolean(row[columnMap.equidadeEligibility])
        : null;

    const hasEquidadeData = notEmpty(equidadeDoc) || notEmpty(equidadeProc);
    const equidadeEligible = explicitEquidadeEligibility === null ? hasEquidadeData : explicitEquidadeEligibility;

    return {
        nome,
        designacao,
        ra: raValue || null,
        sici: siciValue || null,
        creCode,
        sourceRow: excelRowNumber,
        hasAnyValue: row.some(notEmpty),
        basico: {
            status: classifyStatus(basicoDoc, basicoProc),
            docValue: serializeCellValue(basicoDoc),
            processValue: serializeCellValue(basicoProc),
        },
        qualidade: {
            status: classifyStatus(qualidadeDoc, qualidadeProc),
            docValue: serializeCellValue(qualidadeDoc),
            processValue: serializeCellValue(qualidadeProc),
        },
        equidade: {
            status: equidadeEligible ? classifyStatus(equidadeDoc, equidadeProc) : 'nao_aplicavel',
            docValue: serializeCellValue(equidadeDoc),
            processValue: serializeCellValue(equidadeProc),
        },
        equidadeEligible,
    };
}

function parseDashboardTotals(rows) {
    const totals = {
        basico: { concluded: null, total: null },
        qualidade: { concluded: null, total: null },
        equidade: { concluded: null, total: null },
    };

    rows.forEach((row) => {
        const label = normalizeText(row[0]);
        if (!label) return;

        if (label.includes('processos basico')) {
            totals.basico = {
                concluded: toNumber(row[1]),
                total: toNumber(row[2]),
            };
        } else if (label.includes('processos qualidade')) {
            totals.qualidade = {
                concluded: toNumber(row[1]),
                total: toNumber(row[2]),
            };
        } else if (label.includes('processos equidade')) {
            totals.equidade = {
                concluded: toNumber(row[1]),
                total: toNumber(row[2]),
            };
        }
    });

    return totals;
}

function createSyntheticRecords({ namedRecords, blankRows, totals, dominantCreCode }) {
    const syntheticRecords = [];
    const namedStats = {
        basico: calculateTypeMetrics(namedRecords, 'basico'),
        qualidade: calculateTypeMetrics(namedRecords, 'qualidade'),
        equidade: calculateTypeMetrics(namedRecords, 'equidade'),
    };
    const blankRowNumbers = blankRows.map((row) => row.sourceRow).filter(Boolean);

    Object.entries({
        basico: totals.basico,
        qualidade: totals.qualidade,
        equidade: totals.equidade,
    }).forEach(([type, official]) => {
        const named = namedStats[type];
        const officialTotal = named.total;
        const officialConcluded = official.concluded ?? named.concluded;
        const maxSynthetic = Math.max(0, officialTotal - named.total);
        const syntheticConcluded = Math.max(0, Math.min(officialConcluded - named.concluded, maxSynthetic));
        const syntheticAtraso = Math.max(0, officialTotal - (named.total + syntheticConcluded));

        for (let index = 0; index < syntheticConcluded; index += 1) {
            syntheticRecords.push(createSyntheticRecord({
                type,
                status: 'concluido',
                index,
                dominantCreCode,
                name: `Conclusao oficial sem identificacao nominal (${index + 1})`,
                reason: `A aba DASHBOARD contabiliza mais processos concluidos de ${type} do que a listagem nominal da aba CONTROLE permite identificar.`,
            }));
        }

        for (let index = 0; index < syntheticAtraso; index += 1) {
            const blankRowNumber = blankRowNumbers[index] || null;
            syntheticRecords.push(createSyntheticRecord({
                type,
                status: 'atraso',
                index,
                dominantCreCode,
                name: blankRowNumber
                    ? `Linha ${blankRowNumber} sem unidade identificada`
                    : `Unidade ${type} nao identificada (${index + 1})`,
                reason: blankRowNumber
                    ? `A linha ${blankRowNumber} da aba CONTROLE esta vazia dentro da faixa utilizada pela planilha e precisa ser conferida antes de atribuir nominalmente o total oficial de ${type}.`
                    : `O total oficial de ${type} na aba DASHBOARD e maior do que a listagem nominal disponivel na aba CONTROLE.`,
                sourceRow: blankRowNumber,
            }));
        }
    });

    return syntheticRecords;
}

function createSyntheticRecord({ type, status, index, dominantCreCode, name, reason, sourceRow = null }) {
    return {
        nome: name,
        designacao: 'Registro sintetico para alinhamento com a aba DASHBOARD',
        ra: null,
        sici: null,
        creCode: dominantCreCode,
        sourceRow,
        hasAnyValue: false,
        equidadeEligible: type === 'equidade',
        synthetic: true,
        syntheticKind: `${type}-${status}-gap`,
        syntheticReason: reason,
        basico: {
            status: type === 'basico' ? status : 'nao_aplicavel',
            docValue: null,
            processValue: null,
        },
        qualidade: {
            status: type === 'qualidade' ? status : 'nao_aplicavel',
            docValue: null,
            processValue: null,
        },
        equidade: {
            status: type === 'equidade' ? status : 'nao_aplicavel',
            docValue: null,
            processValue: null,
        },
    };
}

function calculateMetrics(records) {
    const basico = calculateTypeMetrics(records, 'basico');
    const qualidade = calculateTypeMetrics(records, 'qualidade');
    const equidade = calculateTypeMetrics(records, 'equidade');

    const globalTotal = basico.total + qualidade.total + equidade.total;
    const globalConcluded = basico.concluded + qualidade.concluded + equidade.concluded;
    const globalPending = basico.pending + qualidade.pending + equidade.pending;
    const globalAtraso = basico.atraso + qualidade.atraso + equidade.atraso;

    return {
        basico,
        qualidade,
        equidade,
        global: {
            total: globalTotal,
            concluded: globalConcluded,
            pending: globalPending,
            atraso: globalAtraso,
            pctConcluded: percentage(globalConcluded, globalTotal),
            pctPending: percentage(globalPending, globalTotal),
            pctAtraso: percentage(globalAtraso, globalTotal),
        },
    };
}

function calculateTypeMetrics(records, type) {
    const relevant = records.filter((record) => record[type] && record[type].status !== 'nao_aplicavel');
    const concluded = relevant.filter((record) => record[type].status === 'concluido').length;
    const pending = relevant.filter((record) => record[type].status === 'pendente').length;
    const atraso = relevant.filter((record) => record[type].status === 'atraso').length;
    const synthetic = relevant.filter((record) => record.synthetic).length;

    return {
        total: relevant.length,
        concluded,
        pending,
        atraso,
        synthetic,
        named: relevant.length - synthetic,
        pctConcluded: percentage(concluded, relevant.length),
        pctPending: percentage(pending, relevant.length),
        pctAtraso: percentage(atraso, relevant.length),
    };
}

function buildIssues({ blankRows, totals, metrics, namedRecords, whitespaceOnlyProcessCells = [] }) {
    const issues = [];
    const namedMetrics = {
        basico: calculateTypeMetrics(namedRecords, 'basico'),
        qualidade: calculateTypeMetrics(namedRecords, 'qualidade'),
        equidade: calculateTypeMetrics(namedRecords, 'equidade'),
    };

    if (blankRows.length > 0) {
        issues.push({
            code: 'blank-control-rows',
            severity: 'warning',
            message: `A aba CONTROLE possui ${blankRows.length} linha(s) vazia(s) dentro da faixa utilizada pela planilha. Elas exigem conferencia porque podem distorcer a conciliacao com o resumo oficial.`,
        });
    }

    whitespaceOnlyProcessCells.forEach((cell) => {
        const unitLabel = cell.nome ? `${cell.nome} (linha ${cell.sourceRow})` : `linha ${cell.sourceRow}`;
        issues.push({
            code: `${cell.type}-whitespace-process-cell`,
            severity: 'warning',
            message: `A coluna de processo de ${formatTypeLabel(cell.type)} em ${unitLabel} contem apenas espacos. A aba DASHBOARD pode contabilizar essa celula como processo concluido mesmo sem numero valido.`,
        });
    });

    Object.entries({
        basico: totals.basico,
        qualidade: totals.qualidade,
        equidade: totals.equidade,
    }).forEach(([type, official]) => {
        const named = namedMetrics[type];
        const reconciled = metrics[type];
        const officialTotal = named.total;
        const officialConcluded = official.concluded ?? named.concluded;
        const maxSynthetic = Math.max(0, officialTotal - named.total);
        const syntheticConcluded = Math.max(0, Math.min(officialConcluded - named.concluded, maxSynthetic));
        const syntheticAtraso = Math.max(0, officialTotal - (named.total + syntheticConcluded));
        const syntheticTotal = syntheticConcluded + syntheticAtraso;

        if (officialConcluded < named.concluded) {
            issues.push({
                code: `${type}-named-concluded-overflow`,
                severity: 'warning',
                message: `A aba CONTROLE identifica ${named.concluded} concluido(s) em ${formatTypeLabel(type)}, mas a aba DASHBOARD resume apenas ${officialConcluded}.`,
            });
        }

        if (official.total !== null && official.total > named.total) {
            issues.push({
                code: `${type}-dashboard-total-exceeds-control`,
                severity: 'warning',
                message: `A aba DASHBOARD indica ${official.total} unidade(s) para ${formatTypeLabel(type)}, mas a aba CONTROLE lista ${named.total}. O total real da aba CONTROLE foi adotado.`,
            });
        }

        if (official.total !== null && official.total < named.total) {
            issues.push({
                code: `${type}-named-total-overflow`,
                severity: 'warning',
                message: `A listagem nominal da aba CONTROLE soma ${named.total} registro(s) em ${formatTypeLabel(type)}, acima do total oficial ${official.total} mostrado na aba DASHBOARD.`,
            });
        }

        if (syntheticTotal > 0 && reconciled.synthetic > 0) {
            const details = [];
            if (syntheticConcluded > 0) {
                details.push(`${syntheticConcluded} conclusao(oes) sem identificacao nominal`);
            }
            if (syntheticAtraso > 0) {
                details.push(`${syntheticAtraso} unidade(s) ainda nao identificada(s)`);
            }

            issues.push({
                code: `${type}-synthetic-reconciliation`,
                severity: 'info',
                message: `A conciliacao entre CONTROLE e DASHBOARD em ${formatTypeLabel(type)} adicionou ${syntheticTotal} ajuste(s) sintetico(s): ${details.join(' e ')}.`,
            });
        }
    });

    return issues;
}

function formatTypeLabel(type) {
    const labels = {
        basico: 'Basico',
        qualidade: 'Qualidade',
        equidade: 'Equidade',
    };

    return labels[type] || type;
}

function classifyStatus(docValue, processValue) {
    if (notEmpty(processValue)) return 'concluido';
    if (notEmpty(docValue)) return 'pendente';
    return 'atraso';
}

function findSheetName(workbook, preferredName) {
    if (!preferredName) return null;

    const preferred = workbook.SheetNames.find((sheetName) => normalizeText(sheetName) === normalizeText(preferredName));
    if (preferred) return preferred;

    return workbook.SheetNames.find((sheetName) => normalizeText(sheetName).includes(normalizeText(preferredName))) || null;
}

function findHeaderIndex(headers, predicate) {
    return headers.findIndex((header) => predicate(header));
}

function getDominantCreCode(records) {
    const frequency = new Map();

    records.forEach((record) => {
        if (!record.creCode) return;
        frequency.set(record.creCode, (frequency.get(record.creCode) || 0) + 1);
    });

    const ranked = [...frequency.entries()].sort((left, right) => right[1] - left[1]);
    return ranked.length > 0 ? ranked[0][0] : null;
}

function extractCreCode(designacao) {
    if (!designacao) return null;
    const match = String(designacao).match(/\((\d{2})\./);
    if (!match) return null;
    return String(Number(match[1]));
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function cleanText(value) {
    const text = String(value ?? '').trim();
    return text === '' ? '' : text;
}

function notEmpty(value) {
    if (value === null || value === undefined || value === false) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
}

function serializeCellValue(value) {
    if (!notEmpty(value)) return null;
    return typeof value === 'string' ? value.trim() : String(value);
}

function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const normalized = Number(String(value || '').replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : null;
}

function toBoolean(value) {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    if (['1', 'true', 'sim', 's', 'x', 'ok'].includes(normalized)) return true;
    if (['0', 'false', 'nao', 'n'].includes(normalized)) return false;
    return null;
}

function percentage(partial, total) {
    if (!total) return 0;
    return Math.round((partial / total) * 100);
}
