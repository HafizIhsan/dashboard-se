// table-prelist.js

function getPrelistSource(data) {
  return data['Rekap Prelist SubSLS'] || data['Rekap Prelist SE2026 - SubSLS'] || [];
}

function preparePrelistBaseline(data) {
  prelistBaselineDate = '';
  prelistBaselineByCode = new Map();
  const history = data['History - Rekap Prelist SubSLS'] || data['History - Rekap Prelist SE2026 - SubSLS'] || [];
  const currentDate = String(data.lastUpdated || '').substring(0, 10);

  const parseDate = (d) => String(d || '').trim().replace(/^['"]/, '').substring(0, 10);

  const dates = [...new Set(history.map(row => parseDate(row['Tanggal Baseline'] || row['Tanggal'] || row.Tanggal_Baseline)).filter(Boolean))]
    .filter(date => !currentDate || date < currentDate).sort().reverse();
  if (!dates.length) return;
  prelistBaselineDate = dates[0];
  const baselineRows = history.filter(row => parseDate(row['Tanggal Baseline'] || row['Tanggal'] || row.Tanggal_Baseline) === prelistBaselineDate);
  baselineRows.forEach(row => {
    const code = String(row.KODE_SUB_SLS ?? row.kode ?? '').trim();
    if (code) prelistBaselineByCode.set(code, buildPrelistRow(row));
  });
}

function buildPrelistRow(row) {
  const nonBku = prelistNumber(row.JUMLAH_NONBKU_PRELIST);
  const lainnyaJml = nonBku; // Dummy tidak dihitung, hanya Non BKU
  const kode = String(row.KODE_SUB_SLS ?? row.kode ?? '').trim();
  const namaSls = masterSubSlsMap.get(kode) || String(row.NAMA_SLS || row.nama_sls || row.SLS || row.nmsls || '').trim();

  const klgPrelistJml = prelistNumber(row.JUMLAH_KELUARGA_PRELIST);
  const klgPrelistSubmit = prelistNumber(row.KELUARGA_PRELIST_SUBMIT);

  const usahaPrelistJml = prelistNumber(row.JUMLAH_USAHA_PRELIST);
  const usahaPrelistSubmit = prelistNumber(row.USAHA_PRELIST_SUBMIT);

  const lainnyaSubmit = prelistNumber(row.NONBKU_PRELIST_SUBMIT);

  // Prelist Total = Keluarga + Usaha + Non BKU (Dummy tidak dihitung)
  const prelistJml = klgPrelistJml + usahaPrelistJml + lainnyaJml;
  const prelistSubmit = klgPrelistSubmit + usahaPrelistSubmit + lainnyaSubmit;

  const glKlgJml = prelistNumber(row.JUMLAH_KELUARGA_GENERAL_LINK);
  const glKlgSubmit = prelistNumber(row.KELUARGA_GENERAL_LINK_SUBMIT);

  const glUsahaJml = prelistNumber(row.JUMLAH_USAHA_GENERAL_LINK);
  const glUsahaSubmit = prelistNumber(row.USAHA_GENERAL_LINK_SUBMIT);

  const klgBaruJml = prelistNumber(row.JUMLAH_KELUARGA_BARU);
  const klgBaruSubmit = prelistNumber(row.KELUARGA_BARU_SUBMIT);

  const usahaBaruJml = prelistNumber(row.JUMLAH_USAHA_BARU);
  const usahaBaruSubmit = prelistNumber(row.USAHA_BARU_SUBMIT);

  const lainnyaBaruJml = prelistNumber(row.JUMLAH_NONBKU_BARU);
  const lainnyaBaruSubmit = prelistNumber(row.NONBKU_BARU_SUBMIT);

  const assignJml = prelistNumber(row.JUMLAH_ASSIGNMENT_BARU);
  const assignSubmit = klgBaruSubmit + usahaBaruSubmit + lainnyaBaruSubmit;

  // Total Keseluruhan (Kumulasi semua jenis assignment: Prelist + General Link + Assignment Baru)
  const totalSemuaJml = prelistJml + glKlgJml + glUsahaJml + assignJml;
  const totalSemuaSubmit = prelistSubmit + glKlgSubmit + glUsahaSubmit + assignSubmit;
  const totalSemuaPct = prelistPercent(totalSemuaSubmit, totalSemuaJml);

  const result = {
    kode,
    namaSls,
    klgPrelistJml, klgPrelistSubmit, klgPrelistPct: prelistPercent(klgPrelistSubmit, klgPrelistJml),
    usahaPrelistJml, usahaPrelistSubmit, usahaPrelistPct: prelistPercent(usahaPrelistSubmit, usahaPrelistJml),
    lainnyaJml, lainnyaSubmit, lainnyaPct: prelistPercent(lainnyaSubmit, lainnyaJml),
    prelistJml, prelistSubmit, prelistPct: prelistPercent(prelistSubmit, prelistJml),
    glKlgJml, glKlgSubmit, glKlgPct: prelistPercent(glKlgSubmit, glKlgJml),
    glUsahaJml, glUsahaSubmit, glUsahaPct: prelistPercent(glUsahaSubmit, glUsahaJml),
    klgBaruJml, klgBaruSubmit, klgBaruPct: prelistPercent(klgBaruSubmit, klgBaruJml),
    usahaBaruJml, usahaBaruSubmit, usahaBaruPct: prelistPercent(usahaBaruSubmit, usahaBaruJml),
    lainnyaBaruJml, lainnyaBaruSubmit, lainnyaBaruPct: prelistPercent(lainnyaBaruSubmit, lainnyaBaruJml),
    assignJml, assignSubmit, assignPct: prelistPercent(assignSubmit, assignJml),
    totalSemuaJml, totalSemuaSubmit, totalSemuaPct
  };

  const baseline = prelistBaselineByCode.get(result.kode);
  result.delta = {};
  prelistPctKeys.forEach(key => {
    result.delta[key] = baseline && result[key] !== null && baseline[key] !== null ? result[key] - baseline[key] : null;
  });
  result.delta.totalSemuaSubmit = baseline && result.totalSemuaSubmit !== null && baseline.totalSemuaSubmit !== null
    ? (result.totalSemuaSubmit - baseline.totalSemuaSubmit)
    : 0;
  return result;
}

function aggregatePrelistMetrics(items) {
  const agg = {
    klgPrelistJml: 0, klgPrelistSubmit: 0,
    usahaPrelistJml: 0, usahaPrelistSubmit: 0,
    lainnyaJml: 0, lainnyaSubmit: 0,
    prelistJml: 0, prelistSubmit: 0,
    glKlgJml: 0, glKlgSubmit: 0,
    glUsahaJml: 0, glUsahaSubmit: 0,
    klgBaruJml: 0, klgBaruSubmit: 0,
    usahaBaruJml: 0, usahaBaruSubmit: 0,
    lainnyaBaruJml: 0, lainnyaBaruSubmit: 0,
    assignJml: 0, assignSubmit: 0,
    totalSemuaJml: 0, totalSemuaSubmit: 0
  };

  items.forEach(item => {
    agg.klgPrelistJml += item.klgPrelistJml || 0;
    agg.klgPrelistSubmit += item.klgPrelistSubmit || 0;
    agg.usahaPrelistJml += item.usahaPrelistJml || 0;
    agg.usahaPrelistSubmit += item.usahaPrelistSubmit || 0;
    agg.lainnyaJml += item.lainnyaJml || 0;
    agg.lainnyaSubmit += item.lainnyaSubmit || 0;
    agg.prelistJml += item.prelistJml || 0;
    agg.prelistSubmit += item.prelistSubmit || 0;
    agg.glKlgJml += item.glKlgJml || 0;
    agg.glKlgSubmit += item.glKlgSubmit || 0;
    agg.glUsahaJml += item.glUsahaJml || 0;
    agg.glUsahaSubmit += item.glUsahaSubmit || 0;
    agg.klgBaruJml += item.klgBaruJml || 0;
    agg.klgBaruSubmit += item.klgBaruSubmit || 0;
    agg.usahaBaruJml += item.usahaBaruJml || 0;
    agg.usahaBaruSubmit += item.usahaBaruSubmit || 0;
    agg.lainnyaBaruJml += item.lainnyaBaruJml || 0;
    agg.lainnyaBaruSubmit += item.lainnyaBaruSubmit || 0;
    agg.assignJml += item.assignJml || 0;
    agg.assignSubmit += item.assignSubmit || 0;
    agg.totalSemuaJml += item.totalSemuaJml || 0;
    agg.totalSemuaSubmit += item.totalSemuaSubmit || 0;
  });

  agg.klgPrelistPct = prelistPercent(agg.klgPrelistSubmit, agg.klgPrelistJml);
  agg.usahaPrelistPct = prelistPercent(agg.usahaPrelistSubmit, agg.usahaPrelistJml);
  agg.lainnyaPct = prelistPercent(agg.lainnyaSubmit, agg.lainnyaJml);
  agg.prelistPct = prelistPercent(agg.prelistSubmit, agg.prelistJml);
  agg.glKlgPct = prelistPercent(agg.glKlgSubmit, agg.glKlgJml);
  agg.glUsahaPct = prelistPercent(agg.glUsahaSubmit, agg.glUsahaJml);
  agg.klgBaruPct = prelistPercent(agg.klgBaruSubmit, agg.klgBaruJml);
  agg.usahaBaruPct = prelistPercent(agg.usahaBaruSubmit, agg.usahaBaruJml);
  agg.lainnyaBaruPct = prelistPercent(agg.lainnyaBaruSubmit, agg.lainnyaBaruJml);
  agg.assignPct = prelistPercent(agg.assignSubmit, agg.assignJml);
  agg.totalSemuaPct = prelistPercent(agg.totalSemuaSubmit, agg.totalSemuaJml);

  agg.delta = {};
  if (prelistBaselineByCode && prelistBaselineByCode.size > 0) {
    const pctPairs = [
      ['klgPrelistPct', 'klgPrelistJml', 'klgPrelistSubmit'],
      ['usahaPrelistPct', 'usahaPrelistJml', 'usahaPrelistSubmit'],
      ['lainnyaPct', 'lainnyaJml', 'lainnyaSubmit'],
      ['prelistPct', 'prelistJml', 'prelistSubmit'],
      ['glKlgPct', 'glKlgJml', 'glKlgSubmit'],
      ['glUsahaPct', 'glUsahaJml', 'glUsahaSubmit'],
      ['klgBaruPct', 'klgBaruJml', 'klgBaruSubmit'],
      ['usahaBaruPct', 'usahaBaruJml', 'usahaBaruSubmit'],
      ['lainnyaBaruPct', 'lainnyaBaruJml', 'lainnyaBaruSubmit'],
      ['assignPct', 'assignJml', 'assignSubmit'],
      ['totalSemuaPct', 'totalSemuaJml', 'totalSemuaSubmit']
    ];

    pctPairs.forEach(([pctKey, jmlKey, subKey]) => {
      let baseJml = 0;
      let baseSub = 0;
      items.forEach(it => {
        const baseRow = prelistBaselineByCode.get(it.kode);
        if (baseRow) {
          baseJml += baseRow[jmlKey] || 0;
          baseSub += baseRow[subKey] || 0;
        }
      });
      if (baseJml > 0 && agg[pctKey] !== null) {
        const basePct = (baseSub / baseJml) * 100;
        agg.delta[pctKey] = agg[pctKey] - basePct;
      } else {
        agg.delta[pctKey] = null;
      }
    });

    let baseTotalSemuaSub = 0;
    items.forEach(it => {
      const baseRow = prelistBaselineByCode.get(it.kode);
      if (baseRow) {
        baseTotalSemuaSub += baseRow.totalSemuaSubmit || 0;
      }
    });
    agg.delta.totalSemuaSubmit = agg.totalSemuaSubmit - baseTotalSemuaSub;
  } else {
    prelistPctKeys.forEach(k => { agg.delta[k] = null; });
    agg.delta.totalSemuaSubmit = 0;
  }

  return agg;
}

function buildPrelistHierarchy(rows) {
  const kabMap = new Map();

  rows.forEach(row => {
    const kode = row.kode;
    if (!kode) return;
    const kodeKab = kode.substring(0, 4);
    const kodeKec = kode.length >= 7 ? kode.substring(0, 7) : kode;
    const kodeDesa = kode.length >= 10 ? kode.substring(0, 10) : kode;

    if (!kabMap.has(kodeKab)) {
      const matchedKab = Array.isArray(dashboardData) ? dashboardData.find(w => w.kode === kodeKab) : null;
      const namaKab = matchedKab ? matchedKab.nama : `Kabupaten [${kodeKab}]`;
      kabMap.set(kodeKab, {
        id: `kab_${kodeKab}`,
        kode: kodeKab,
        nama: namaKab,
        level: 'kab',
        kecMap: new Map(),
        leaves: []
      });
    }
    const kabNode = kabMap.get(kodeKab);
    kabNode.leaves.push(row);

    if (!kabNode.kecMap.has(kodeKec)) {
      const nmKec = masterKecMap.get(kodeKec) || `Kecamatan [${kodeKec.slice(-3)}]`;
      kabNode.kecMap.set(kodeKec, {
        id: `kec_${kodeKec}`,
        kode: kodeKec,
        nama: nmKec,
        level: 'kec',
        desaMap: new Map(),
        leaves: []
      });
    }
    const kecNode = kabNode.kecMap.get(kodeKec);
    kecNode.leaves.push(row);

    if (!kecNode.desaMap.has(kodeDesa)) {
      const nmDesa = masterDesaMap.get(kodeDesa) || `Desa [${kodeDesa.slice(-3)}]`;
      kecNode.desaMap.set(kodeDesa, {
        id: `desa_${kodeDesa}`,
        kode: kodeDesa,
        nama: nmDesa,
        level: 'desa',
        subSlsList: [],
        leaves: []
      });
    }
    const desaNode = kecNode.desaMap.get(kodeDesa);
    desaNode.leaves.push(row);
    desaNode.subSlsList.push({
      ...row,
      id: `subsls_${row.kode}`,
      level: 'subsls'
    });
  });

  const resultTree = [];
  const sortedKabKeys = [...kabMap.keys()].sort();

  sortedKabKeys.forEach(kabKey => {
    const kab = kabMap.get(kabKey);
    const kabAgg = aggregatePrelistMetrics(kab.leaves);
    Object.assign(kab, kabAgg);

    const kecList = [];
    const sortedKecKeys = [...kab.kecMap.keys()].sort();
    sortedKecKeys.forEach(kecKey => {
      const kec = kab.kecMap.get(kecKey);
      const kecAgg = aggregatePrelistMetrics(kec.leaves);
      Object.assign(kec, kecAgg);

      const desaList = [];
      const sortedDesaKeys = [...kec.desaMap.keys()].sort();
      sortedDesaKeys.forEach(desaKey => {
        const desa = kec.desaMap.get(desaKey);
        const desaAgg = aggregatePrelistMetrics(desa.leaves);
        Object.assign(desa, desaAgg);

        desa.subSlsList.sort((a, b) => a.kode.localeCompare(b.kode));
        desa.children = desa.subSlsList;
        desaList.push(desa);
      });

      kec.children = desaList;
      kecList.push(kec);
    });

    kab.children = kecList;
    resultTree.push(kab);
  });

  return resultTree;
}

function formatPrelistValue(value, isPercent = false, delta = null) {
  if (value === null || value === undefined) return '<span class="text-[var(--text-muted)]">-</span>';
  if (!isPercent) return fmtNum(value);

  const pctText = fmtPct(value);
  const color = getProgressColor(value);

  if (delta === null || delta === undefined) {
    return `<span class="font-bold" style="color:${color}">${pctText}%</span>`;
  }

  const sign = delta >= 0 ? '+' : '';
  const dColor = getDeltaColor(delta);
  const deltaText = `(${sign}${fmtPct(delta)}%)`;

  return `<span class="font-bold" style="color:${color}">${pctText}%</span><span class="text-[10px] font-semibold block mt-0.5" style="color:${dColor}" title="Perubahan terhadap baseline ${escapePrelistHtml(prelistBaselineDate)}">${deltaText}</span>`;
}

function escapePrelistHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderPrelistHeader() {
  const thead = document.querySelector('#prelist-subsls-table thead');
  if (!thead) return;
  const leafGroup = (isCategoryEnd = false, isBold = false, isHighlight = false, isLastGroup = false) => `
    <th class="text-right select-none py-1.5 px-3 min-w-[85px] ${isHighlight ? 'col-total-keseluruhan' : ''} ${isBold ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)] font-medium'}">Total</th>
    <th class="text-right select-none py-1.5 px-3 min-w-[85px] ${isHighlight ? 'col-total-keseluruhan' : ''} ${isBold ? 'text-[var(--success-color)] font-bold' : 'text-[var(--success-color)] font-medium'}">Submit</th>
    <th class="text-right select-none py-1.5 px-3 min-w-[95px] ${isHighlight ? 'col-total-keseluruhan' : ''} ${isBold ? 'text-[var(--accent-color)] font-bold' : 'text-[var(--accent-color)] font-medium'} ${isCategoryEnd ? 'border-r-2 border-category-divider' : (!isLastGroup ? 'border-r border-[var(--border-color)]' : '')}">SUB %</th>
  `;
  thead.innerHTML = `
    <!-- Row 1: Main Category Headers -->
    <tr class="text-[9px] md:text-[10px] whitespace-nowrap">
      <th rowspan="3" class="pl-6 select-none align-middle text-left border-r-2 border-category-divider min-w-[260px]">
        Wilayah / SLS / Sub SLS
      </th>
      <th colspan="12" class="text-center th-prelist-main border-r-2 border-category-divider" style="border-bottom: 2px solid var(--border-hover);">Prelist</th>
      <th colspan="6" class="text-center th-gl-main border-r-2 border-category-divider" style="border-bottom: 2px solid var(--border-hover);">General Link</th>
      <th colspan="12" class="text-center th-assign-main border-r-2 border-category-divider" style="border-bottom: 2px solid var(--border-hover);">Assignment Baru</th>
      <th colspan="3" class="text-center col-total-keseluruhan-header" style="border-bottom: 2px solid var(--accent-color);">Total Keseluruhan</th>
    </tr>
    <!-- Row 2: Sub-group Headers -->
    <tr class="text-[9px] md:text-[10px] whitespace-nowrap">
      <th colspan="3" class="text-center th-prelist-sub border-r border-[var(--border-color)]">Keluarga</th>
      <th colspan="3" class="text-center th-prelist-sub border-r border-[var(--border-color)]">Usaha</th>
      <th colspan="3" class="text-center th-prelist-sub border-r border-[var(--border-color)]">Non BKU</th>
      <th colspan="3" class="text-center th-prelist-sub border-r-2 border-category-divider font-bold text-[var(--text-primary)]">Total</th>
      <th colspan="3" class="text-center th-gl-sub border-r border-[var(--border-color)]">Keluarga</th>
      <th colspan="3" class="text-center th-gl-sub border-r-2 border-category-divider">Usaha</th>
      <th colspan="3" class="text-center th-assign-sub border-r border-[var(--border-color)]">Keluarga</th>
      <th colspan="3" class="text-center th-assign-sub border-r border-[var(--border-color)]">Usaha</th>
      <th colspan="3" class="text-center th-assign-sub border-r border-[var(--border-color)]">Non BKU</th>
      <th colspan="3" class="text-center th-assign-sub border-r-2 border-category-divider font-bold text-[var(--text-primary)]">Total</th>
      <th colspan="3" class="text-center col-total-keseluruhan-subheader font-bold text-[var(--accent-color)]">Total</th>
    </tr>
    <!-- Row 3: Leaf Headers -->
    <tr class="text-[8px] md:text-[9px] whitespace-nowrap">
      ${leafGroup(false, false, false, false)}
      ${leafGroup(false, false, false, false)}
      ${leafGroup(false, false, false, false)}
      ${leafGroup(true, true, false, false)}
      ${leafGroup(false, false, false, false)}
      ${leafGroup(true, false, false, false)}
      ${leafGroup(false, false, false, false)}
      ${leafGroup(false, false, false, false)}
      ${leafGroup(false, false, false, false)}
      ${leafGroup(true, true, false, false)}
      ${leafGroup(false, true, true, true)}
    </tr>`;
}

function renderPrelistTable() {
  renderPrelistHeader();
  const tbody = document.getElementById('prelist-subsls-body');
  const pageInfo = document.getElementById('prelist-page-info');
  if (!tbody) return;

  const filterKab = selectedKabPrelist || document.getElementById('filter-kab-prelist')?.value || '';
  const filterTerm = (document.getElementById('search-prelist')?.value || '').trim().toLowerCase();

  // Filter tree data by kabupaten
  const filteredTree = prelistTreeData.filter(kab => !filterKab || kab.kode === filterKab);

  let totalKabCount = 0;
  let totalKecCount = 0;
  let totalDesaCount = 0;
  let totalSubSlsCount = 0;

  // Count totals for summary
  filteredTree.forEach(kab => {
    totalKabCount++;
    if (kab.children) {
      totalKecCount += kab.children.length;
      kab.children.forEach(kec => {
        if (kec.children) {
          totalDesaCount += kec.children.length;
          kab.children.forEach(desa => {
            if (desa.children) totalSubSlsCount += desa.children.length;
          });
        }
      });
    }
  });

  let html = '';

  // 1. Province or Filtered Kabupaten Summary Total Row
  if (prelistSubSlsData.length > 0) {
    const activeLeaves = [];
    filteredTree.forEach(kab => activeLeaves.push(...kab.leaves));
    const summaryAgg = aggregatePrelistMetrics(activeLeaves);

    let summaryLabel = 'Sumatera Barat';
    if (filterKab) {
      const matchedKab = Array.isArray(dashboardData) ? dashboardData.find(w => w.kode === filterKab) : null;
      summaryLabel = matchedKab ? matchedKab.nama : `Kabupaten [${filterKab}]`;
    }

    const renderGroupCells = (valTotal, valSub, valPct, delta, isCategoryEnd = false, isLast = false, isHighlight = false) => `
      <td class="text-right py-3.5 px-3 whitespace-nowrap text-xs font-bold ${isHighlight ? 'col-total-keseluruhan-summary text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}">${fmtNum(valTotal)}</td>
      <td class="text-right py-3.5 px-3 text-[var(--success-color)] whitespace-nowrap text-xs font-bold ${isHighlight ? 'col-total-keseluruhan-summary' : ''}">${fmtNum(valSub)}</td>
      <td class="text-right py-3.5 px-3 whitespace-nowrap text-xs font-bold ${isHighlight ? 'col-total-keseluruhan-summary' : ''} ${isCategoryEnd ? 'border-r-2 border-category-divider' : (!isLast ? 'border-r border-[var(--border-color)]' : '')}">${formatPrelistValue(valPct, true, delta)}</td>
    `;

    html += `<tr class="bg-[rgba(212,178,122,0.08)] font-bold border-b-2 border-[var(--border-color)]">
      <td class="pl-6 py-3.5 whitespace-nowrap text-xs border-r-2 border-category-divider text-[var(--text-primary)] font-bold">${escapePrelistHtml(summaryLabel)}</td>
      ${renderGroupCells(summaryAgg.klgPrelistJml, summaryAgg.klgPrelistSubmit, summaryAgg.klgPrelistPct, summaryAgg.delta.klgPrelistPct, false)}
      ${renderGroupCells(summaryAgg.usahaPrelistJml, summaryAgg.usahaPrelistSubmit, summaryAgg.usahaPrelistPct, summaryAgg.delta.usahaPrelistPct, false)}
      ${renderGroupCells(summaryAgg.lainnyaJml, summaryAgg.lainnyaSubmit, summaryAgg.lainnyaPct, summaryAgg.delta.lainnyaPct, false)}
      ${renderGroupCells(summaryAgg.prelistJml, summaryAgg.prelistSubmit, summaryAgg.prelistPct, summaryAgg.delta.prelistPct, true)}
      ${renderGroupCells(summaryAgg.glKlgJml, summaryAgg.glKlgSubmit, summaryAgg.glKlgPct, summaryAgg.delta.glKlgPct, false)}
      ${renderGroupCells(summaryAgg.glUsahaJml, summaryAgg.glUsahaSubmit, summaryAgg.glUsahaPct, summaryAgg.delta.glUsahaPct, true)}
      ${renderGroupCells(summaryAgg.klgBaruJml, summaryAgg.klgBaruSubmit, summaryAgg.klgBaruPct, summaryAgg.delta.klgBaruPct, false)}
      ${renderGroupCells(summaryAgg.usahaBaruJml, summaryAgg.usahaBaruSubmit, summaryAgg.usahaBaruPct, summaryAgg.delta.usahaBaruPct, false)}
      ${renderGroupCells(summaryAgg.lainnyaBaruJml, summaryAgg.lainnyaBaruSubmit, summaryAgg.lainnyaBaruPct, summaryAgg.delta.lainnyaBaruPct, false)}
      ${renderGroupCells(summaryAgg.assignJml, summaryAgg.assignSubmit, summaryAgg.assignPct, summaryAgg.delta.assignPct, true)}
      ${renderGroupCells(summaryAgg.totalSemuaJml, summaryAgg.totalSemuaSubmit, summaryAgg.totalSemuaPct, summaryAgg.delta.totalSemuaPct, false, true, true)}
    </tr>`;
  }

  const renderKabGroup = (valTotal, valSub, valPct, delta, isCategoryEnd = false, isLast = false, isHighlight = false) => `
    <td class="text-right py-2.5 px-3 whitespace-nowrap text-xs font-bold ${isHighlight ? 'col-total-keseluruhan text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}">${fmtNum(valTotal)}</td>
    <td class="text-right py-2.5 px-3 text-[var(--success-color)] whitespace-nowrap text-xs font-bold ${isHighlight ? 'col-total-keseluruhan' : ''}">${fmtNum(valSub)}</td>
    <td class="text-right py-2.5 px-3 whitespace-nowrap text-xs font-bold ${isHighlight ? 'col-total-keseluruhan' : ''} ${isCategoryEnd ? 'border-r-2 border-category-divider' : (!isLast ? 'border-r border-[var(--border-color)]' : '')}">${formatPrelistValue(valPct, true, delta)}</td>
  `;

  const renderKecGroup = (valTotal, valSub, valPct, delta, isCategoryEnd = false, isLast = false, isHighlight = false) => `
    <td class="text-right py-2 px-3 whitespace-nowrap text-xs font-semibold ${isHighlight ? 'col-total-keseluruhan text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}">${fmtNum(valTotal)}</td>
    <td class="text-right py-2 px-3 text-[var(--success-color)] whitespace-nowrap text-xs font-semibold ${isHighlight ? 'col-total-keseluruhan' : ''}">${fmtNum(valSub)}</td>
    <td class="text-right py-2 px-3 whitespace-nowrap text-xs font-semibold ${isHighlight ? 'col-total-keseluruhan' : ''} ${isCategoryEnd ? 'border-r-2 border-category-divider' : (!isLast ? 'border-r border-[var(--border-color)]' : '')}">${formatPrelistValue(valPct, true, delta)}</td>
  `;

  const renderDesaGroup = (valTotal, valSub, valPct, delta, isCategoryEnd = false, isLast = false, isHighlight = false) => `
    <td class="text-right py-2 px-3 whitespace-nowrap text-xs font-medium ${isHighlight ? 'col-total-keseluruhan text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}">${fmtNum(valTotal)}</td>
    <td class="text-right py-2 px-3 text-[var(--success-color)] whitespace-nowrap text-xs font-medium ${isHighlight ? 'col-total-keseluruhan' : ''}">${fmtNum(valSub)}</td>
    <td class="text-right py-2 px-3 whitespace-nowrap text-xs font-medium ${isHighlight ? 'col-total-keseluruhan' : ''} ${isCategoryEnd ? 'border-r-2 border-category-divider' : (!isLast ? 'border-r border-[var(--border-color)]' : '')}">${formatPrelistValue(valPct, true, delta)}</td>
  `;

  const renderSubGroup = (valTotal, valSub, valPct, delta, isCategoryEnd = false, isLast = false, isHighlight = false) => `
    <td class="text-right py-1.5 px-3 whitespace-nowrap text-xs ${isHighlight ? 'col-total-keseluruhan text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] font-normal'}">${fmtNum(valTotal)}</td>
    <td class="text-right py-1.5 px-3 text-[var(--success-color)] whitespace-nowrap text-xs ${isHighlight ? 'col-total-keseluruhan font-semibold' : 'font-normal'}">${fmtNum(valSub)}</td>
    <td class="text-right py-1.5 px-3 whitespace-nowrap text-xs ${isHighlight ? 'col-total-keseluruhan' : ''} ${isCategoryEnd ? 'border-r-2 border-category-divider' : (!isLast ? 'border-r border-[var(--border-color)]' : '')}">${formatPrelistValue(valPct, true, delta)}</td>
  `;

  if (filteredTree.length === 0) {
    html += '<tr><td colspan="34" class="text-center py-8 text-[var(--text-muted)]">Tidak ada data yang sesuai filter.</td></tr>';
  } else {
    filteredTree.forEach(kab => {
      const isKabOpen = expandedPrelistNodes.has(kab.id);
      const kabHasChildren = kab.children && kab.children.length > 0;
      const kabToggle = kabHasChildren
        ? `<span class="tree-toggle-icon" onclick="togglePrelistNode('${kab.id}', event)">${isKabOpen ? '[-]' : '[+]'}</span>`
        : '<span class="inline-block w-4 mr-1.5"></span>';

      html += `<tr class="tree-node-kab border-b border-[var(--border-color)] transition-colors cursor-pointer" onclick="togglePrelistNode('${kab.id}', event)">
        <td class="pl-6 py-2.5 whitespace-nowrap border-r-2 border-category-divider">
          <div class="flex items-center">
            ${kabToggle}
            <span class="font-bold text-xs text-[var(--text-primary)]">[${kab.kode}] ${escapePrelistHtml(kab.nama)}</span>
          </div>
        </td>
        ${renderKabGroup(kab.klgPrelistJml, kab.klgPrelistSubmit, kab.klgPrelistPct, kab.delta.klgPrelistPct, false)}
        ${renderKabGroup(kab.usahaPrelistJml, kab.usahaPrelistSubmit, kab.usahaPrelistPct, kab.delta.usahaPrelistPct, false)}
        ${renderKabGroup(kab.lainnyaJml, kab.lainnyaSubmit, kab.lainnyaPct, kab.delta.lainnyaPct, false)}
        ${renderKabGroup(kab.prelistJml, kab.prelistSubmit, kab.prelistPct, kab.delta.prelistPct, true)}
        ${renderKabGroup(kab.glKlgJml, kab.glKlgSubmit, kab.glKlgPct, kab.delta.glKlgPct, false)}
        ${renderKabGroup(kab.glUsahaJml, kab.glUsahaSubmit, kab.glUsahaPct, kab.delta.glUsahaPct, true)}
        ${renderKabGroup(kab.klgBaruJml, kab.klgBaruSubmit, kab.klgBaruPct, kab.delta.klgBaruPct, false)}
        ${renderKabGroup(kab.usahaBaruJml, kab.usahaBaruSubmit, kab.usahaBaruPct, kab.delta.usahaBaruPct, false)}
        ${renderKabGroup(kab.lainnyaBaruJml, kab.lainnyaBaruSubmit, kab.lainnyaBaruPct, kab.delta.lainnyaBaruPct, false)}
        ${renderKabGroup(kab.assignJml, kab.assignSubmit, kab.assignPct, kab.delta.assignPct, true)}
        ${renderKabGroup(kab.totalSemuaJml, kab.totalSemuaSubmit, kab.totalSemuaPct, kab.delta.totalSemuaPct, false, true, true)}
      </tr>`;

      if (isKabOpen && kab.children) {
        kab.children.forEach(kec => {
          const isKecOpen = expandedPrelistNodes.has(kec.id);
          const kecHasChildren = kec.children && kec.children.length > 0;
          const kecToggle = kecHasChildren
            ? `<span class="tree-toggle-icon" onclick="togglePrelistNode('${kec.id}', event)">${isKecOpen ? '[-]' : '[+]'}</span>`
            : '<span class="inline-block w-4 mr-1.5"></span>';

          html += `<tr class="tree-node-kec border-b border-[var(--border-color)] transition-colors cursor-pointer" onclick="togglePrelistNode('${kec.id}', event)">
            <td class="pl-10 py-2 whitespace-nowrap border-r-2 border-category-divider">
              <div class="flex items-center">
                ${kecToggle}
                <span class="font-semibold text-xs text-[var(--text-primary)]">└ [${kec.kode}] ${escapePrelistHtml(kec.nama)}</span>
              </div>
            </td>
            ${renderKecGroup(kec.klgPrelistJml, kec.klgPrelistSubmit, kec.klgPrelistPct, kec.delta.klgPrelistPct, false)}
            ${renderKecGroup(kec.usahaPrelistJml, kec.usahaPrelistSubmit, kec.usahaPrelistPct, kec.delta.usahaPrelistPct, false)}
            ${renderKecGroup(kec.lainnyaJml, kec.lainnyaSubmit, kec.lainnyaPct, kec.delta.lainnyaPct, false)}
            ${renderKecGroup(kec.prelistJml, kec.prelistSubmit, kec.prelistPct, kec.delta.prelistPct, true)}
            ${renderKecGroup(kec.glKlgJml, kec.glKlgSubmit, kec.glKlgPct, kec.delta.glKlgPct, false)}
            ${renderKecGroup(kec.glUsahaJml, kec.glUsahaSubmit, kec.glUsahaPct, kec.delta.glUsahaPct, true)}
            ${renderKecGroup(kec.klgBaruJml, kec.klgBaruSubmit, kec.klgBaruPct, kec.delta.klgBaruPct, false)}
            ${renderKecGroup(kec.usahaBaruJml, kec.usahaBaruSubmit, kec.usahaBaruPct, kec.delta.usahaBaruPct, false)}
            ${renderKecGroup(kec.lainnyaBaruJml, kec.lainnyaBaruSubmit, kec.lainnyaBaruPct, kec.delta.lainnyaBaruPct, false)}
            ${renderKecGroup(kec.assignJml, kec.assignSubmit, kec.assignPct, kec.delta.assignPct, true)}
            ${renderKecGroup(kec.totalSemuaJml, kec.totalSemuaSubmit, kec.totalSemuaPct, kec.delta.totalSemuaPct, false, true, true)}
          </tr>`;

          if (isKecOpen && kec.children) {
            kec.children.forEach(desa => {
              const isDesaOpen = expandedPrelistNodes.has(desa.id);
              const desaHasChildren = desa.children && desa.children.length > 0;
              const desaToggle = desaHasChildren
                ? `<span class="tree-toggle-icon" onclick="togglePrelistNode('${desa.id}', event)">${isDesaOpen ? '[-]' : '[+]'}</span>`
                : '<span class="inline-block w-4 mr-1.5"></span>';

              html += `<tr class="tree-node-desa border-b border-[var(--border-color)] transition-colors cursor-pointer" onclick="togglePrelistNode('${desa.id}', event)">
                <td class="pl-14 py-2 whitespace-nowrap border-r-2 border-category-divider">
                  <div class="flex items-center">
                    ${desaToggle}
                    <span class="font-medium text-xs text-[var(--text-secondary)]">└── [${desa.kode}] ${escapePrelistHtml(desa.nama)}</span>
                  </div>
                </td>
                ${renderDesaGroup(desa.klgPrelistJml, desa.klgPrelistSubmit, desa.klgPrelistPct, desa.delta.klgPrelistPct, false)}
                ${renderDesaGroup(desa.usahaPrelistJml, desa.usahaPrelistSubmit, desa.usahaPrelistPct, desa.delta.usahaPrelistPct, false)}
                ${renderDesaGroup(desa.lainnyaJml, desa.lainnyaSubmit, desa.lainnyaPct, desa.delta.lainnyaPct, false)}
                ${renderDesaGroup(desa.prelistJml, desa.prelistSubmit, desa.prelistPct, desa.delta.prelistPct, true)}
                ${renderDesaGroup(desa.glKlgJml, desa.glKlgSubmit, desa.glKlgPct, desa.delta.glKlgPct, false)}
                ${renderDesaGroup(desa.glUsahaJml, desa.glUsahaSubmit, desa.glUsahaPct, desa.delta.glUsahaPct, true)}
                ${renderDesaGroup(desa.klgBaruJml, desa.klgBaruSubmit, desa.klgBaruPct, desa.delta.klgBaruPct, false)}
                ${renderDesaGroup(desa.usahaBaruJml, desa.usahaBaruSubmit, desa.usahaBaruPct, desa.delta.usahaBaruPct, false)}
                ${renderDesaGroup(desa.lainnyaBaruJml, desa.lainnyaBaruSubmit, desa.lainnyaBaruPct, desa.delta.lainnyaBaruPct, false)}
                ${renderDesaGroup(desa.assignJml, desa.assignSubmit, desa.assignPct, desa.delta.assignPct, true)}
                ${renderDesaGroup(desa.totalSemuaJml, desa.totalSemuaSubmit, desa.totalSemuaPct, desa.delta.totalSemuaPct, false, true, true)}
              </tr>`;

              if (isDesaOpen && desa.children) {
                desa.children.forEach(sub => {
                  if (filterTerm && !sub.kode.toLowerCase().includes(filterTerm) && (!sub.namaSls || !sub.namaSls.toLowerCase().includes(filterTerm))) {
                    return;
                  }
                  const sub2Digit = sub.kode.length >= 2 ? sub.kode.slice(-2) : '';
                  const subDisplayName = sub.namaSls
                    ? `<span class="font-bold text-xs text-[var(--text-primary)]">${escapePrelistHtml(sub.namaSls)}</span> <span class="subsls-badge font-mono">[${sub2Digit}]</span>`
                    : `<span class="font-mono text-xs text-[var(--text-primary)] font-semibold">[${escapePrelistHtml(sub.kode)}]</span>`;

                  html += `<tr class="tree-node-subsls border-b border-[var(--border-color)] hover:bg-[rgba(229,185,116,0.08)] transition-colors">
                    <td class="pl-20 py-2 whitespace-nowrap border-r-2 border-category-divider">
                      <div class="leading-tight">${subDisplayName}</div>
                      <div class="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">${escapePrelistHtml(sub.kode)}</div>
                    </td>
                    ${renderSubGroup(sub.klgPrelistJml, sub.klgPrelistSubmit, sub.klgPrelistPct, sub.delta.klgPrelistPct, false)}
                    ${renderSubGroup(sub.usahaPrelistJml, sub.usahaPrelistSubmit, sub.usahaPrelistPct, sub.delta.usahaPrelistPct, false)}
                    ${renderSubGroup(sub.lainnyaJml, sub.lainnyaSubmit, sub.lainnyaPct, sub.delta.lainnyaPct, false)}
                    ${renderSubGroup(sub.prelistJml, sub.prelistSubmit, sub.prelistPct, sub.delta.prelistPct, true)}
                    ${renderSubGroup(sub.glKlgJml, sub.glKlgSubmit, sub.glKlgPct, sub.delta.glKlgPct, false)}
                    ${renderSubGroup(sub.glUsahaJml, sub.glUsahaSubmit, sub.glUsahaPct, sub.delta.glUsahaPct, true)}
                    ${renderSubGroup(sub.klgBaruJml, sub.klgBaruSubmit, sub.klgBaruPct, sub.delta.klgBaruPct, false)}
                    ${renderSubGroup(sub.usahaBaruJml, sub.usahaBaruSubmit, sub.usahaBaruPct, sub.delta.usahaBaruPct, false)}
                    ${renderSubGroup(sub.lainnyaBaruJml, sub.lainnyaBaruSubmit, sub.lainnyaBaruPct, sub.delta.lainnyaBaruPct, false)}
                    ${renderSubGroup(sub.assignJml, sub.assignSubmit, sub.assignPct, sub.delta.assignPct, true)}
                    ${renderSubGroup(sub.totalSemuaJml, sub.totalSemuaSubmit, sub.totalSemuaPct, sub.delta.totalSemuaPct, false, true, true)}
                  </tr>`;
                });
              }
            });
          }
        });
      }
    });
  }

  tbody.innerHTML = html;

  if (pageInfo) {
    pageInfo.textContent = `Menampilkan ${fmtNum(totalKabCount)} Kabupaten, ${fmtNum(totalKecCount)} Kecamatan, ${fmtNum(totalDesaCount)} Desa, ${fmtNum(totalSubSlsCount)} Sub SLS`;
  }

  const baselineInfo = document.getElementById('prelist-baseline-info');
  if (baselineInfo) {
    baselineInfo.textContent = prelistBaselineDate ? `Baseline perubahan: ${prelistBaselineDate}` : 'Baseline harian belum tersedia (data pertama).';
  }
}

function togglePrelistNode(nodeId, e) {
  if (e) e.stopPropagation();
  if (expandedPrelistNodes.has(nodeId)) {
    expandedPrelistNodes.delete(nodeId);
  } else {
    expandedPrelistNodes.add(nodeId);
  }
  renderPrelistTable();
}

function resetPrelistTable() {
  selectedKabPrelist = '';
  const kabInput = document.getElementById('filter-kab-prelist');
  if (kabInput) kabInput.value = '';
  const kabLabel = document.getElementById('prelist-kab-label');
  if (kabLabel) kabLabel.textContent = 'Semua Kabupaten/Kota';
  const searchInput = document.getElementById('search-prelist');
  if (searchInput) searchInput.value = '';
  expandedPrelistNodes.clear();
  renderPrelistTable();
}

const debouncedFilterPrelistSubSls = debounce(() => {
  filterPrelistSubSls();
}, 300);

function filterPrelistSubSls() {
  const term = (document.getElementById('search-prelist')?.value || '').trim().toLowerCase();

  if (term) {
    prelistTreeData.forEach(kabNode => {
      let kabHasMatch = false;
      if (kabNode.children) {
        kabNode.children.forEach(kecNode => {
          let kecHasMatch = false;
          if (kecNode.children) {
            kecNode.children.forEach(desaNode => {
              let desaHasMatch = false;
              if (desaNode.children) {
                desaNode.children.forEach(subNode => {
                  const matchSub = subNode.kode.toLowerCase().includes(term) || (subNode.namaSls && subNode.namaSls.toLowerCase().includes(term));
                  if (matchSub) {
                    desaHasMatch = true;
                    kecHasMatch = true;
                    kabHasMatch = true;
                  }
                });
              }
              if (desaHasMatch || desaNode.nama.toLowerCase().includes(term) || desaNode.kode.toLowerCase().includes(term)) {
                expandedPrelistNodes.add(desaNode.id);
                kecHasMatch = true;
                kabHasMatch = true;
              }
            });
          }
          if (kecHasMatch || kecNode.nama.toLowerCase().includes(term) || kecNode.kode.toLowerCase().includes(term)) {
            expandedPrelistNodes.add(kecNode.id);
            kabHasMatch = true;
          }
        });
      }
      if (kabHasMatch || kabNode.nama.toLowerCase().includes(term) || kabNode.kode.toLowerCase().includes(term)) {
        expandedPrelistNodes.add(kabNode.id);
      }
    });
  }

  renderPrelistTable();
}

async function exportPrelistExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Library Excel sedang dimuat. Silakan coba beberapa saat lagi.');
    return;
  }

  showExportProgress('Menyiapkan Rekap Sub SLS', 'Mengumpulkan dan memfilter baris data Sub SLS...', 10, 'Membaca data Sub SLS...');
  await new Promise(r => setTimeout(r, 80));

  try {
    const headers = [
      'Kode Kabupaten', 'Nama Kabupaten',
      'Kode Kecamatan', 'Nama Kecamatan',
      'Kode Desa', 'Nama Desa',
      'Kode Sub SLS', 'Nama SLS / Sub SLS',
      'Prelist Keluarga Total', 'Prelist Keluarga Submit', 'Prelist Keluarga %',
      'Prelist Usaha Total', 'Prelist Usaha Submit', 'Prelist Usaha %',
      'Prelist Non BKU Total', 'Prelist Non BKU Submit', 'Prelist Non BKU %',
      'Total Prelist Total', 'Total Prelist Submit', 'Total Prelist %',
      'GL Keluarga Total', 'GL Keluarga Submit', 'GL Keluarga %',
      'GL Usaha Total', 'GL Usaha Submit', 'GL Usaha %',
      'Assignment Baru Keluarga Total', 'Assignment Baru Keluarga Submit', 'Assignment Baru Keluarga %',
      'Assignment Baru Usaha Total', 'Assignment Baru Usaha Submit', 'Assignment Baru Usaha %',
      'Assignment Baru Non BKU Total', 'Assignment Baru Non BKU Submit', 'Assignment Baru Non BKU %',
      'Total Assignment Baru Total', 'Total Assignment Baru Submit', 'Total Assignment Baru %',
      'Total Keseluruhan Beban', 'Total Keseluruhan Submit', 'Total Keseluruhan %',
      'Delta Harian Total Keseluruhan (Jml)', 'Delta Harian Total Keseluruhan (%)'
    ];

    const filterKab = selectedKabPrelist || document.getElementById('filter-kab-prelist')?.value || '';
    const filterTerm = (document.getElementById('search-prelist')?.value || '').trim().toLowerCase();

    // Flat data per Sub SLS saja (tanpa baris induk hierarki)
    const excelRows = [headers];

    const totalSubRows = prelistSubSlsData.length;
    let processed = 0;

    for (let i = 0; i < totalSubRows; i++) {
      const sub = prelistSubSlsData[i];
      const kode = String(sub.kode || '');
      const kodeKab = kode.substring(0, 4);
      if (filterKab && kodeKab !== filterKab) continue;

      if (filterTerm) {
        const match = kode.toLowerCase().includes(filterTerm) || (sub.namaSls && sub.namaSls.toLowerCase().includes(filterTerm));
        if (!match) continue;
      }

      const kodeKec = kode.length >= 7 ? kode.substring(0, 7) : '';
      const kodeDesa = kode.length >= 10 ? kode.substring(0, 10) : '';

      const kabObj = Array.isArray(dashboardData) ? dashboardData.find(w => w.kode === kodeKab) : null;
      const namaKab = kabObj ? kabObj.nama : `[${kodeKab}]`;
      const namaKec = masterKecMap.get(kodeKec) || `Kecamatan [${kodeKec.slice(-3)}]`;
      const namaDesa = masterDesaMap.get(kodeDesa) || `Desa [${kodeDesa.slice(-3)}]`;
      const sub2 = kode.length >= 2 ? ` [${kode.slice(-2)}]` : '';
      const namaSls = `${sub.namaSls || 'Sub SLS'}${sub2}`;

      const deltaJml = (sub.delta && sub.delta.totalSemuaSubmit !== undefined && sub.delta.totalSemuaSubmit !== null)
        ? sub.delta.totalSemuaSubmit
        : 0;
      const deltaPct = (sub.delta && sub.delta.totalSemuaPct !== undefined && sub.delta.totalSemuaPct !== null)
        ? sub.delta.totalSemuaPct / 100
        : 0;

      const row = [
        kodeKab, namaKab,
        kodeKec, namaKec,
        kodeDesa, namaDesa,
        kode, namaSls,
        sub.klgPrelistJml || 0, sub.klgPrelistSubmit || 0, sub.klgPrelistPct !== null ? sub.klgPrelistPct / 100 : 0,
        sub.usahaPrelistJml || 0, sub.usahaPrelistSubmit || 0, sub.usahaPrelistPct !== null ? sub.usahaPrelistPct / 100 : 0,
        sub.lainnyaJml || 0, sub.lainnyaSubmit || 0, sub.lainnyaPct !== null ? sub.lainnyaPct / 100 : 0,
        sub.prelistJml || 0, sub.prelistSubmit || 0, sub.prelistPct !== null ? sub.prelistPct / 100 : 0,
        sub.glKlgJml || 0, sub.glKlgSubmit || 0, sub.glKlgPct !== null ? sub.glKlgPct / 100 : 0,
        sub.glUsahaJml || 0, sub.glUsahaSubmit || 0, sub.glUsahaPct !== null ? sub.glUsahaPct / 100 : 0,
        sub.klgBaruJml || 0, sub.klgBaruSubmit || 0, sub.klgBaruPct !== null ? sub.klgBaruPct / 100 : 0,
        sub.usahaBaruJml || 0, sub.usahaBaruSubmit || 0, sub.usahaBaruPct !== null ? sub.usahaBaruPct / 100 : 0,
        sub.lainnyaBaruJml || 0, sub.lainnyaBaruSubmit || 0, sub.lainnyaBaruPct !== null ? sub.lainnyaBaruPct / 100 : 0,
        sub.assignJml || 0, sub.assignSubmit || 0, sub.assignPct !== null ? sub.assignPct / 100 : 0,
        sub.totalSemuaJml || 0, sub.totalSemuaSubmit || 0, sub.totalSemuaPct !== null ? sub.totalSemuaPct / 100 : 0,
        deltaJml, deltaPct
      ];
      excelRows.push(row);
      processed++;
    }

    updateExportProgress(45, `Menyusun ${fmtNum(excelRows.length - 1)} baris ke sheet...`, 'Membangun tabel Excel...');
    await new Promise(r => setTimeout(r, 60));

    const ws = XLSX.utils.aoa_to_sheet(excelRows);

    // Desain Header #f79039 (Oranye Mewah)
    const headerStyle = {
      fill: { fgColor: { rgb: "F79039" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", sz: 10.5 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "D4721C" } },
        bottom: { style: "thin", color: { rgb: "D4721C" } },
        left: { style: "thin", color: { rgb: "D4721C" } },
        right: { style: "thin", color: { rgb: "D4721C" } }
      }
    };

    const borderStyle = {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } }
    };

    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");

    // Lebar kolom rapi
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      if (C === 0) colWidths.push({ wch: 15 }); // Kode Kab
      else if (C === 1) colWidths.push({ wch: 28 }); // Nama Kab
      else if (C === 2) colWidths.push({ wch: 15 }); // Kode Kec
      else if (C === 3) colWidths.push({ wch: 25 }); // Nama Kec
      else if (C === 4) colWidths.push({ wch: 15 }); // Kode Desa
      else if (C === 5) colWidths.push({ wch: 25 }); // Nama Desa
      else if (C === 6) colWidths.push({ wch: 18 }); // Kode Sub SLS
      else if (C === 7) colWidths.push({ wch: 30 }); // Nama SLS
      else if (C >= 38) colWidths.push({ wch: 24 }); // Total Keseluruhan & Delta
      else colWidths.push({ wch: 18 });
    }
    ws['!cols'] = colWidths;
    ws['!rows'] = [{ hpt: 30 }];
    ws['!autofilter'] = { ref: ws['!ref'] };
    ws['!views'] = [{ state: 'frozen', xSplit: 2, ySplit: 1, topLeftCell: 'C2', activePane: 'bottomRight' }];

    updateExportProgress(75, 'Menerapkan format angka, warna & batas sel...', 'Memformat cell...');
    await new Promise(r => setTimeout(r, 60));

    // Format sel
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;

        if (R === 0) {
          cell.s = headerStyle;
        } else {
          const isStandardPctCol = (C >= 8 && C <= 40) && ((C - 8) % 3 === 2);
          const isDeltaPctCol = (C === 42);
          const isPctCol = isStandardPctCol || isDeltaPctCol;
          const isDeltaNumCol = (C === 41);
          const isNumCol = (C >= 8) && !isPctCol;
          const isHighlightCol = (C >= 38);

          const cellStyle = {
            font: { name: "Calibri", sz: 10, bold: isHighlightCol },
            border: borderStyle,
            alignment: {
              horizontal: isNumCol || isPctCol ? "right" : "left",
              vertical: "center"
            }
          };

          if (isHighlightCol) {
            cellStyle.fill = { fgColor: { rgb: R % 2 === 0 ? "FFF5EB" : "FFF9F3" } };
          } else if (R % 2 === 0) {
            cellStyle.fill = { fgColor: { rgb: "F8FAFC" } };
          }

          if (isDeltaPctCol) {
            cell.z = "+0.00%;-0.00%;0.00%";
          } else if (isDeltaNumCol) {
            cell.z = "+#,##0;-#,##0;0";
          } else if (isPctCol) {
            cell.z = "0.00%";
          } else if (isNumCol) {
            cell.z = "#,##0";
          } else {
            cell.t = 's';
          }

          cell.s = cellStyle;
        }
      }
    }

    updateExportProgress(92, 'Menyimpan berkas spreadsheet...', 'Mengunduh file Excel...');
    await new Promise(r => setTimeout(r, 60));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Sub SLS");
    const filterSuffix = filterKab ? `_Kab${filterKab}` : "";
    XLSX.writeFile(wb, `Rekap_Prelist_SubSLS${filterSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    hideExportProgress();
  } catch (err) {
    console.error('Gagal export prelist excel:', err);
    hideExportProgress();
    alert('Terjadi kesalahan saat mengekspor data Rekap Prelist ke Excel.');
  }
}

function exportPrelistCSV() {
  exportPrelistExcel();
}

function updatePrelistSummaryCard() {
  if (!prelistSubSlsData || prelistSubSlsData.length === 0) return;

  const totalPrelist = prelistSubSlsData.reduce((s, r) => s + r.prelistJml, 0);
  const totalKlgPrelist = prelistSubSlsData.reduce((s, r) => s + r.klgPrelistJml, 0);
  const totalUsahaPrelist = prelistSubSlsData.reduce((s, r) => s + r.usahaPrelistJml, 0);
  const totalLainnyaPrelist = prelistSubSlsData.reduce((s, r) => s + r.lainnyaJml, 0);

  const subPrelist = prelistSubSlsData.reduce((s, r) => s + r.prelistSubmit, 0);
  const subKlgPrelist = prelistSubSlsData.reduce((s, r) => s + r.klgPrelistSubmit, 0);
  const subUsahaPrelist = prelistSubSlsData.reduce((s, r) => s + r.usahaPrelistSubmit, 0);
  const subLainnyaPrelist = prelistSubSlsData.reduce((s, r) => s + r.lainnyaSubmit, 0);

  const pctPrelist = prelistPercent(subPrelist, totalPrelist) ?? 0;
  const pctKlgPrelist = prelistPercent(subKlgPrelist, totalKlgPrelist) ?? 0;
  const pctUsahaPrelist = prelistPercent(subUsahaPrelist, totalUsahaPrelist) ?? 0;
  const pctLainnyaPrelist = prelistPercent(subLainnyaPrelist, totalLainnyaPrelist) ?? 0;

  let deltaPrelistSum = null;
  if (prelistBaselineByCode && prelistBaselineByCode.size > 0) {
    let baseTotalPrelist = 0;
    let baseSubPrelist = 0;
    prelistBaselineByCode.forEach(baseRow => {
      baseTotalPrelist += baseRow.prelistJml || 0;
      baseSubPrelist += baseRow.prelistSubmit || 0;
    });
    if (baseTotalPrelist > 0) {
      const basePct = (baseSubPrelist / baseTotalPrelist) * 100;
      deltaPrelistSum = pctPrelist - basePct;
    }
  }

  const elStatPrelistTotal = document.getElementById('stat-prelist-total');
  if (elStatPrelistTotal) elStatPrelistTotal.innerText = fmtNum(totalPrelist);

  const elStatPrelistPct = document.getElementById('stat-prelist-total-pct');
  if (elStatPrelistPct) {
    elStatPrelistPct.innerText = `${fmtPct(pctPrelist)}%`;
    elStatPrelistPct.style.color = getProgressColor(pctPrelist);
  }

  const elStatPrelistDaily = document.getElementById('stat-prelist-daily-change');
  if (elStatPrelistDaily) {
    if (deltaPrelistSum !== null) {
      const sign = deltaPrelistSum > 0 ? '+' : '';
      const icon = deltaPrelistSum > 0 ? '▲' : deltaPrelistSum < 0 ? '▼' : '•';
      elStatPrelistDaily.innerText = `${icon} ${sign}${fmtPct(deltaPrelistSum)}%`;
      elStatPrelistDaily.style.color = getDeltaColor(deltaPrelistSum);
      elStatPrelistDaily.title = `Perubahan vs baseline ${prelistBaselineDate}`;
      elStatPrelistDaily.style.display = 'inline-block';
    } else {
      elStatPrelistDaily.style.display = 'none';
    }
  }

  const elStatPrelistKlg = document.getElementById('stat-prelist-klg-total');
  if (elStatPrelistKlg) elStatPrelistKlg.innerText = fmtNum(totalKlgPrelist);
  const elStatPrelistKlgPct = document.getElementById('stat-prelist-klg-pct');
  if (elStatPrelistKlgPct) {
    elStatPrelistKlgPct.innerText = `(${fmtPct(pctKlgPrelist)}%)`;
    elStatPrelistKlgPct.style.color = getProgressColor(pctKlgPrelist);
  }

  const elStatPrelistUsaha = document.getElementById('stat-prelist-usaha-total');
  if (elStatPrelistUsaha) elStatPrelistUsaha.innerText = fmtNum(totalUsahaPrelist);
  const elStatPrelistUsahaPct = document.getElementById('stat-prelist-usaha-pct');
  if (elStatPrelistUsahaPct) {
    elStatPrelistUsahaPct.innerText = `(${fmtPct(pctUsahaPrelist)}%)`;
    elStatPrelistUsahaPct.style.color = getProgressColor(pctUsahaPrelist);
  }

  const elStatPrelistLainnya = document.getElementById('stat-prelist-lainnya-total');
  if (elStatPrelistLainnya) elStatPrelistLainnya.innerText = fmtNum(totalLainnyaPrelist);
  const elStatPrelistLainnyaPct = document.getElementById('stat-prelist-lainnya-pct');
  if (elStatPrelistLainnyaPct) {
    elStatPrelistLainnyaPct.innerText = `(${fmtPct(pctLainnyaPrelist)}%)`;
    elStatPrelistLainnyaPct.style.color = getProgressColor(pctLainnyaPrelist);
  }
}

function updatePrelistKabDropdown() {
  const menu = document.getElementById('prelist-kab-menu');
  const labelEl = document.getElementById('prelist-kab-label');
  const hiddenInput = document.getElementById('filter-kab-prelist');
  if (!menu) return;

  const kabCodes = [...new Set(prelistSubSlsData.map(row => row.kode.substring(0, 4)).filter(Boolean))].sort();

  let menuHtml = `
    <div onclick="selectPrelistKab('', 'Semua Kabupaten/Kota')"
      class="px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-between ${!selectedKabPrelist ? 'bg-[var(--accent-color)]/15 font-bold text-[var(--accent-color)]' : 'hover:bg-[rgba(249,115,22,0.1)] text-[var(--text-primary)]'}">
      <span>Semua Kabupaten/Kota</span>
      ${!selectedKabPrelist ? '<span class="text-[10px]">✓</span>' : ''}
    </div>
  `;

  kabCodes.forEach(code => {
    const kabObj = Array.isArray(dashboardData) ? dashboardData.find(w => w.kode === code) : null;
    const name = kabObj ? kabObj.nama : code;
    const displayName = `[${code}] ${name}`;
    const isSelected = selectedKabPrelist === code;
    menuHtml += `
      <div onclick="selectPrelistKab('${code}', '${displayName.replace(/'/g, "\\'")}')"
        class="px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-[var(--accent-color)]/15 font-bold text-[var(--accent-color)]' : 'hover:bg-[rgba(249,115,22,0.1)] text-[var(--text-primary)]'}">
        <span class="truncate pr-2">${displayName}</span>
        ${isSelected ? '<span class="text-[10px]">✓</span>' : ''}
      </div>
    `;
  });

  menu.innerHTML = menuHtml;

  if (selectedKabPrelist) {
    const kabObj = Array.isArray(dashboardData) ? dashboardData.find(w => w.kode === selectedKabPrelist) : null;
    if (labelEl) labelEl.textContent = kabObj ? `[${selectedKabPrelist}] ${kabObj.nama}` : `[${selectedKabPrelist}]`;
  } else {
    if (labelEl) labelEl.textContent = 'Semua Kabupaten/Kota';
  }
  if (hiddenInput) hiddenInput.value = selectedKabPrelist;
}

function togglePrelistKabDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('prelist-kab-menu');
  const arrow = document.getElementById('prelist-kab-arrow');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (arrow) arrow.classList.add('rotate-180');
  } else {
    menu.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180');
  }
}

function selectPrelistKab(code, label) {
  selectedKabPrelist = code;
  const hiddenInput = document.getElementById('filter-kab-prelist');
  if (hiddenInput) hiddenInput.value = code;
  const labelEl = document.getElementById('prelist-kab-label');
  if (labelEl) labelEl.textContent = label;

  const menu = document.getElementById('prelist-kab-menu');
  const arrow = document.getElementById('prelist-kab-arrow');
  if (menu) menu.classList.add('hidden');
  if (arrow) arrow.classList.remove('rotate-180');

  updatePrelistKabDropdown();
  renderPrelistTable();
}

document.addEventListener('click', function (event) {
  const container = document.getElementById('prelist-kab-dropdown-container');
  const menu = document.getElementById('prelist-kab-menu');
  const arrow = document.getElementById('prelist-kab-arrow');
  if (container && menu && !container.contains(event.target)) {
    menu.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180');
  }
});
