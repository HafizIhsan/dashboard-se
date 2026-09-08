// table-wilayah.js

// Toggle Kecamatan Rows Function
function toggleKecamatan(kodeKab) {
  const rows = document.querySelectorAll('.kec-row-' + kodeKab);
  const icon = document.getElementById('icon-' + kodeKab);
  let isHidden = true;
  rows.forEach(r => {
    if (r.style.display === 'none') {
      r.style.display = '';
      isHidden = false;
    } else {
      r.style.display = 'none';
    }
  });
  if (icon) {
    icon.innerText = isHidden ? '[+]' : '[-]';
  }
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  const fragment = document.createDocumentFragment();

  // First Row: Province Totals
  const mode = document.getElementById('progress-mode-table') ? document.getElementById('progress-mode-table').value : 'fasih';
  const showPct = mode === 'fasih';

  // Update Header visibility and colspans dynamically
  const thUmkmGroup = document.getElementById('th-umkm-group');
  const thUbGroup = document.getElementById('th-ub-group');
  const thUmkmPct = document.getElementById('th-umkm-pct');
  const thUbPct = document.getElementById('th-ub-pct');
  const thUmkmTotal = document.getElementById('th-umkm-total');
  const thUbTotal = document.getElementById('th-ub-total');

  if (thUmkmGroup) thUmkmGroup.colSpan = showPct ? 6 : 5;
  if (thUbGroup) thUbGroup.colSpan = showPct ? 6 : 5;
  if (thUmkmPct) thUmkmPct.style.display = showPct ? '' : 'none';
  if (thUbPct) thUbPct.style.display = showPct ? '' : 'none';

  if (thUmkmTotal) {
    if (showPct) thUmkmTotal.classList.remove('border-r-2', 'border-category-divider');
    else thUmkmTotal.classList.add('border-r-2', 'border-category-divider');
  }
  if (thUbTotal) {
    if (showPct) thUbTotal.classList.remove('border-r-2', 'border-category-divider');
    else thUbTotal.classList.add('border-r-2', 'border-category-divider');
  }

  const provTotalSubmit = sumData.umkmSubmit + sumData.ubSubmit;
  const provTotalHarian = (sumData.harianUmkm || 0) + (sumData.harianUb || 0);
  const provTotalTarget = mode === 'fasih' ? (sumData.umkmTotal + sumData.ubTotal) : (sumData.targetUmkm + sumData.targetUb + sumData.targetKeluarga);
  const provDailyPct = provTotalTarget > 0 ? (provTotalHarian / provTotalTarget * 100) : 0;
  sumData.progress = calcProgressPct(provTotalSubmit, provTotalTarget);

  const provUmkmTarget = mode === 'fasih' ? sumData.umkmTotal : (sumData.targetUmkm + sumData.targetKeluarga);
  const provUmkmProgress = calcProgressPct(sumData.umkmSubmit, provUmkmTarget);
  const provUmkmDailyPct = provUmkmTarget > 0 ? ((sumData.harianUmkm || 0) / provUmkmTarget * 100) : 0;

  const provUbTarget = mode === 'fasih' ? sumData.ubTotal : sumData.targetUb;
  const provUbProgress = calcProgressPct(sumData.ubSubmit, provUbTarget);
  const provUbDailyPct = provUbTarget > 0 ? ((sumData.harianUb || 0) / provUbTarget * 100) : 0;

  const provRow = document.createElement('tr');
  provRow.className = 'bg-[rgba(212,178,122,0.06)] font-bold';
  provRow.innerHTML = `
    <td class="pl-6 border-r-2 border-category-divider">Sumatera Barat</td>
    <td class="text-right text-[var(--text-secondary)]">${fmtNum(sumData.targetUmkm)}</td>
    <td class="text-right text-[var(--text-secondary)]">${fmtNum(sumData.targetUb)}</td>
    <td class="text-right text-[var(--text-secondary)]">${fmtNum(sumData.targetKeluarga)}</td>
    <td class="text-right border-r-2 border-category-divider text-[var(--text-secondary)] font-bold">${fmtNum(sumData.targetUmkm + sumData.targetUb + sumData.targetKeluarga)}</td>
    
    <td class="text-right text-neutral-400">${fmtNum(sumData.umkmOpen)}</td>
    <td class="text-right text-[var(--warning-color)]">${fmtNum(sumData.umkmDraft)}</td>
    <td class="text-right text-[var(--success-color)]">${fmtNum(sumData.umkmSubmit)}</td>
    <td class="text-right text-[var(--accent-color)] font-semibold">${fmtNum(sumData.umkmApproved || 0)}</td>
    <td class="text-right text-[var(--text-primary)] ${!showPct ? 'border-r-2 border-category-divider' : ''}">${fmtNum(sumData.umkmTotal)}</td>
    ${showPct ? `<td class="text-right border-r-2 border-category-divider font-bold" style="color: ${getProgressColor(provUmkmProgress)}">${fmtPct(provUmkmProgress)}% <span class="text-[10px] font-semibold block mt-0.5" style="color: ${getDailyColor(provUmkmDailyPct)}">(+${fmtPct(provUmkmDailyPct)}%)</span></td>` : ''}
    
    <td class="text-right text-neutral-400">${fmtNum(sumData.ubOpen)}</td>
    <td class="text-right text-[var(--warning-color)]">${fmtNum(sumData.ubDraft)}</td>
    <td class="text-right text-[var(--success-color)]">${fmtNum(sumData.ubSubmit)}</td>
    <td class="text-right text-[var(--accent-color)] font-semibold">${fmtNum(sumData.ubApproved || 0)}</td>
    <td class="text-right text-[var(--text-primary)] ${!showPct ? 'border-r-2 border-category-divider' : ''}">${fmtNum(sumData.ubTotal)}</td>
    ${showPct ? `<td class="text-right border-r-2 border-category-divider font-bold" style="color: ${getProgressColor(provUbProgress)}">${fmtPct(provUbProgress)}% <span class="text-[10px] font-semibold block mt-0.5" style="color: ${getDailyColor(provUbDailyPct)}">(+${fmtPct(provUbDailyPct)}%)</span></td>` : ''}
    
    <td class="text-right font-bold" style="color: ${getProgressColor(sumData.progress)}">${fmtPct(sumData.progress)}% <span class="text-xs font-semibold block mt-0.5" style="color: ${getDailyColor(provDailyPct)}">(+${fmtPct(provDailyPct)}%)</span></td>
  `;
  fragment.appendChild(provRow);

  // Wilayah Rows
  data.forEach((w, index) => {
    const totalSubmit = w.umkmSubmit + w.ubSubmit;
    const totalHarian = (w.harianUmkm || 0) + (w.harianUb || 0);
    const totalTarget = mode === 'fasih' ? (w.umkmTotal + w.ubTotal) : (w.targetUmkm + w.targetUb + w.targetKeluarga);
    const dailyPct = totalTarget > 0 ? (totalHarian / totalTarget * 100) : 0;
    w.progress = calcProgressPct(totalSubmit, totalTarget);

    const wUmkmTarget = mode === 'fasih' ? w.umkmTotal : (w.targetUmkm + w.targetKeluarga);
    const wUmkmProgress = calcProgressPct(w.umkmSubmit, wUmkmTarget);
    const wUmkmDailyPct = wUmkmTarget > 0 ? ((w.harianUmkm || 0) / wUmkmTarget * 100) : 0;

    const wUbTarget = mode === 'fasih' ? w.ubTotal : w.targetUb;
    const wUbProgress = calcProgressPct(w.ubSubmit, wUbTarget);
    const wUbDailyPct = wUbTarget > 0 ? ((w.harianUb || 0) / wUbTarget * 100) : 0;

    const hasKec = w.kecamatans && w.kecamatans.length > 0;
    const toggleIcon = hasKec ? `<span id="icon-${w.kode}" class="mr-2 text-[var(--accent-color)] text-lg cursor-pointer font-bold leading-none select-none" onclick="toggleKecamatan('${w.kode}')">[+]</span>` : '';

    const row = document.createElement('tr');
    row.id = `wil-row-${w.kode}`;
    const mainBgClass = index % 2 !== 0 ? 'bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.04)]' : '';
    row.className = `border-b border-[var(--border-color)] hover:bg-[rgba(229,185,116,0.08)] transition-colors ${mainBgClass}`;
    row.innerHTML = `
      <td class="font-medium pl-6 align-middle min-w-[140px] max-w-[200px] border-r-2 border-category-divider">
        <div class="flex items-center">${toggleIcon}<span class="line-clamp-2" title="[${w.kode}] ${w.nama}">[${w.kode}] ${w.nama}</span></div>
      </td>
      <td class="text-right text-[var(--text-muted)] align-middle">${fmtNum(w.targetUmkm)}</td>
      <td class="text-right text-[var(--text-muted)]">${fmtNum(w.targetUb)}</td>
      <td class="text-right text-[var(--text-muted)]">${fmtNum(w.targetKeluarga)}</td>
      <td class="text-right border-r-2 border-category-divider text-[var(--text-muted)] font-bold">${fmtNum(w.targetUmkm + w.targetUb + w.targetKeluarga)}</td>
      
      <td class="text-right text-[var(--text-muted)]">${fmtNum(w.umkmOpen)}</td>
      <td class="text-right text-[var(--warning-color)]">${fmtNum(w.umkmDraft)}</td>
      <td class="text-right text-[var(--success-color)]">${fmtNum(w.umkmSubmit)}</td>
      <td class="text-right text-[var(--accent-color)] font-semibold">${fmtNum(w.umkmApproved || 0)}</td>
      <td class="text-right font-semibold ${!showPct ? 'border-r-2 border-category-divider' : ''}">${fmtNum(w.umkmTotal)}</td>
      ${showPct ? `<td class="text-right border-r-2 border-category-divider font-bold" style="color: ${getProgressColor(wUmkmProgress)}">${fmtPct(wUmkmProgress)}% <span class="text-[10px] font-semibold block mt-0.5" style="color: ${getDailyColor(wUmkmDailyPct)}">(+${fmtPct(wUmkmDailyPct)}%)</span></td>` : ''}
      
      <td class="text-right text-[var(--text-muted)]">${fmtNum(w.ubOpen)}</td>
      <td class="text-right text-[var(--warning-color)]">${fmtNum(w.ubDraft)}</td>
      <td class="text-right text-[var(--success-color)]">${fmtNum(w.ubSubmit)}</td>
      <td class="text-right text-[var(--accent-color)] font-semibold">${fmtNum(w.ubApproved || 0)}</td>
      <td class="text-right font-semibold ${!showPct ? 'border-r-2 border-category-divider' : ''}">${fmtNum(w.ubTotal)}</td>
      ${showPct ? `<td class="text-right border-r-2 border-category-divider font-bold" style="color: ${getProgressColor(wUbProgress)}">${fmtPct(wUbProgress)}% <span class="text-[10px] font-semibold block mt-0.5" style="color: ${getDailyColor(wUbDailyPct)}">(+${fmtPct(wUbDailyPct)}%)</span></td>` : ''}
      
      <td class="text-right font-bold" style="color: ${getProgressColor(w.progress)}">${fmtPct(w.progress)}% <span class="text-[10px] font-semibold block mt-0.5" style="color: ${getDailyColor(dailyPct)}">(+${fmtPct(dailyPct)}%)</span></td>
    `;
    fragment.appendChild(row);

    if (hasKec) {
      w.kecamatans.forEach((kec, kIndex) => {
        const kTotalSubmit = kec.umkmSubmit + kec.ubSubmit;
        const kTotalTarget = mode === 'fasih' ? (kec.umkmTotal + kec.ubTotal) : (kec.targetUmkm + kec.targetUb + kec.targetKeluarga);
        kec.progress = calcProgressPct(kTotalSubmit, kTotalTarget);

        const kUmkmTarget = mode === 'fasih' ? kec.umkmTotal : (kec.targetUmkm + kec.targetKeluarga);
        const kUmkmProgress = calcProgressPct(kec.umkmSubmit, kUmkmTarget);

        const kUbTarget = mode === 'fasih' ? kec.ubTotal : kec.targetUb;
        const kUbProgress = calcProgressPct(kec.ubSubmit, kUbTarget);

        const bgClass = kIndex % 2 !== 0 ? 'bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.02)]' : 'bg-[rgba(0,0,0,0.015)] dark:bg-[rgba(255,255,255,0.01)]';
        const kecRow = document.createElement('tr');
        kecRow.className = `kec-row-${w.kode} border-b border-[var(--border-color)] hover:bg-[rgba(229,185,116,0.1)] transition-colors ${bgClass}`;
        kecRow.style.display = 'none'; // Hidden by default
        kecRow.innerHTML = `
          <td class="py-2 pl-12 text-[var(--text-primary)] font-medium text-[13px] opacity-80 min-w-[140px] max-w-[200px] border-r-2 border-category-divider">
            <div class="line-clamp-2" title="└ [${kec.kode}] ${kec.nama}">└ [${kec.kode}] ${kec.nama}</div>
          </td>
          <td class="text-right py-2 px-2 text-[var(--text-muted)] text-[13px]">${fmtNum(kec.targetUmkm)}</td>
          <td class="text-right py-2 px-2 text-[var(--text-muted)] text-[13px]">${fmtNum(kec.targetUb)}</td>
          <td class="text-right py-2 px-2 text-[var(--text-muted)] text-[13px]">${fmtNum(kec.targetKeluarga)}</td>
          <td class="text-right py-2 px-2 border-r-2 border-category-divider text-[var(--text-muted)] text-[13px] font-bold">${fmtNum(kec.targetUmkm + kec.targetUb + kec.targetKeluarga)}</td>
          
          <td class="text-right py-2 pr-2 pl-4 text-[var(--text-muted)] text-[13px]">${fmtNum(kec.umkmOpen)}</td>
          <td class="text-right py-2 px-2 text-[var(--warning-color)] text-[13px]">${fmtNum(kec.umkmDraft)}</td>
          <td class="text-right py-2 px-2 text-[var(--success-color)] text-[13px]">${fmtNum(kec.umkmSubmit)}</td>
          <td class="text-right py-2 px-2 text-[var(--accent-color)] text-[13px] font-semibold">${fmtNum(kec.umkmApproved || 0)}</td>
          <td class="text-right py-2 px-2 font-semibold text-[13px] ${!showPct ? 'border-r-2 border-category-divider' : ''}">${fmtNum(kec.umkmTotal)}</td>
          ${showPct ? `<td class="text-right py-2 px-2 border-r-2 border-category-divider font-bold text-[13px]" style="color: ${getProgressColor(kUmkmProgress)}">${fmtPct(kUmkmProgress)}%</td>` : ''}
          
          <td class="text-right py-2 pr-2 pl-4 text-[var(--text-muted)] text-[13px]">${fmtNum(kec.ubOpen)}</td>
          <td class="text-right py-2 px-2 text-[var(--warning-color)] text-[13px]">${fmtNum(kec.ubDraft)}</td>
          <td class="text-right py-2 px-2 text-[var(--success-color)] text-[13px]">${fmtNum(kec.ubSubmit)}</td>
          <td class="text-right py-2 px-2 text-[var(--accent-color)] text-[13px] font-semibold">${fmtNum(kec.ubApproved || 0)}</td>
          <td class="text-right py-2 px-2 font-semibold text-[13px] ${!showPct ? 'border-r-2 border-category-divider' : ''}">${fmtNum(kec.ubTotal)}</td>
          ${showPct ? `<td class="text-right py-2 px-2 border-r-2 border-category-divider font-bold text-[13px]" style="color: ${getProgressColor(kUbProgress)}">${fmtPct(kUbProgress)}%</td>` : ''}
          
          <td class="text-right py-2 pl-2 pr-4 font-bold text-[13px]" style="color: ${getProgressColor(kec.progress)}">${fmtPct(kec.progress)}%</td>
        `;
        fragment.appendChild(kecRow);
      });
    }
  });

  tbody.appendChild(fragment);
}

// Filter wilayah in search field
function filterWilayah() {
  const input = document.getElementById('search-wilayah');
  const filter = input.value.toUpperCase();
  const rows = document.querySelectorAll('#table-body > tr');

  let currentWilRow = null;
  let currentWilMatch = false;

  // Loop through all table rows
  rows.forEach(r => {
    if (r.id.startsWith('wil-row-')) {
      currentWilRow = r;
      const textCell = r.getElementsByTagName('td')[0];
      if (textCell) {
        const txtValue = textCell.textContent || textCell.innerText;
        currentWilMatch = txtValue.toUpperCase().indexOf(filter) > -1;

        if (currentWilMatch) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      }
    } else if (r.className.includes('kec-row-')) {
      if (!currentWilRow) return;

      const kode = currentWilRow.id.replace('wil-row-', '');
      const icon = document.getElementById('icon-' + kode);

      const txtValue = r.textContent || r.innerText;
      // Check if kecamatan matches. Ignore if filter is empty to prevent expanding all.
      const kecMatch = filter !== '' && txtValue.toUpperCase().indexOf(filter) > -1;

      if (kecMatch) {
        // Show parent and expand kecamatan if child matches
        currentWilRow.style.display = '';
        r.style.display = '';
        if (icon) icon.innerText = '[-]';
      } else {
        // Keep hidden or collapse
        r.style.display = 'none';
        if (icon) icon.innerText = '[+]';
      }
    }
  });
}

// Sort table rows dynamically
function sortTable(key) {
  if (currentSortColumn === key) {
    isSortAsc = !isSortAsc;
  } else {
    currentSortColumn = key;
    isSortAsc = true;
  }

  // Reset indicators
  const allSortKeys = [
    'wilayah', 'targetUmkm', 'targetUb', 'targetKeluarga', 'targetTotal',
    'umkmOpen', 'umkmDraft', 'umkmApproved', 'umkmSubmit', 'umkmTotal', 'umkmPct',
    'ubOpen', 'ubDraft', 'ubApproved', 'ubSubmit', 'ubTotal', 'ubPct', 'progress'
  ];
  allSortKeys.forEach(k => {
    const ind = document.getElementById(`sort-indicator-${k}`);
    if (ind) ind.innerText = '↕';
  });

  const indicator = document.getElementById(`sort-indicator-${key}`);
  if (indicator) {
    indicator.innerText = isSortAsc ? '▲' : '▼';
  }

  // Sort data array
  const mode = document.getElementById('progress-mode-table') ? document.getElementById('progress-mode-table').value : 'fasih';
  dashboardData.sort((a, b) => {
    let valA, valB;
    switch (key) {
      case 'wilayah':
      case 1:
        valA = a.kode;
        valB = b.kode;
        break;
      case 'targetUmkm':
        valA = a.targetUmkm;
        valB = b.targetUmkm;
        break;
      case 'targetUb':
        valA = a.targetUb;
        valB = b.targetUb;
        break;
      case 'targetKeluarga':
        valA = a.targetKeluarga || 0;
        valB = b.targetKeluarga || 0;
        break;
      case 'targetTotal':
        valA = a.targetUmkm + a.targetUb + (a.targetKeluarga || 0);
        valB = b.targetUmkm + b.targetUb + (b.targetKeluarga || 0);
        break;
      case 'umkmOpen':
        valA = a.umkmOpen;
        valB = b.umkmOpen;
        break;
      case 'umkmDraft':
        valA = a.umkmDraft;
        valB = b.umkmDraft;
        break;
      case 'umkmApproved':
        valA = a.umkmApproved || 0;
        valB = b.umkmApproved || 0;
        break;
      case 'umkmSubmit':
        valA = a.umkmSubmit;
        valB = b.umkmSubmit;
        break;
      case 'umkmTotal':
        valA = a.umkmTotal;
        valB = b.umkmTotal;
        break;
      case 'umkmPct':
        const aUmkmTarget = mode === 'fasih' ? a.umkmTotal : (a.targetUmkm + (a.targetKeluarga || 0));
        const bUmkmTarget = mode === 'fasih' ? b.umkmTotal : (b.targetUmkm + (b.targetKeluarga || 0));
        valA = aUmkmTarget > 0 ? (a.umkmSubmit / aUmkmTarget) : 0;
        valB = bUmkmTarget > 0 ? (b.umkmSubmit / bUmkmTarget) : 0;
        break;
      case 'ubOpen':
        valA = a.ubOpen;
        valB = b.ubOpen;
        break;
      case 'ubDraft':
        valA = a.ubDraft;
        valB = b.ubDraft;
        break;
      case 'ubApproved':
        valA = a.ubApproved || 0;
        valB = b.ubApproved || 0;
        break;
      case 'ubSubmit':
        valA = a.ubSubmit;
        valB = b.ubSubmit;
        break;
      case 'ubTotal':
        valA = a.ubTotal;
        valB = b.ubTotal;
        break;
      case 'ubPct':
        const aUbTarget = mode === 'fasih' ? a.ubTotal : a.targetUb;
        const bUbTarget = mode === 'fasih' ? b.ubTotal : b.targetUb;
        valA = aUbTarget > 0 ? (a.ubSubmit / aUbTarget) : 0;
        valB = bUbTarget > 0 ? (b.ubSubmit / bUbTarget) : 0;
        break;
      case 'progress':
      case 10:
        valA = a.progress;
        valB = b.progress;
        break;
      default:
        valA = a.kode;
        valB = b.kode;
    }

    if (valA < valB) return isSortAsc ? -1 : 1;
    if (valA > valB) return isSortAsc ? 1 : -1;
    return 0;
  });

  renderTable(dashboardData);
  filterWilayah();
}

// Excel Export for Table 1
// Excel Export for Table 1
async function exportExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Library Excel sedang dimuat. Silakan coba beberapa saat lagi.');
    return;
  }

  showExportProgress('Menyiapkan Rekap Wilayah', 'Mengumpulkan data kabupaten & kecamatan...', 15, 'Membaca data tabel...');
  await new Promise(r => setTimeout(r, 80));

  try {
    const mode = document.getElementById('progress-mode-table') ? document.getElementById('progress-mode-table').value : 'fasih';

    const headers = [
      'Kode Wilayah', 'Nama Wilayah',
      'Target Prelist UMKM', 'Target Prelist UB', 'Target Prelist Keluarga', 'Total Target Prelist',
      '[SE2026 UMKM] Open', '[SE2026 UMKM] Draft', '[SE2026 UMKM] Submit', '[SE2026 UMKM] Approved', '[SE2026 UMKM] Total', '[SE2026 UMKM] %',
      '[SE2026 UB] Open', '[SE2026 UB] Draft', '[SE2026 UB] Submit', '[SE2026 UB] Approved', '[SE2026 UB] Total', '[SE2026 UB] %',
      '% Progres Akumulatif'
    ];

    const excelRows = [headers];

    const addRow = (kode, nama, d, isProv = false, isKec = false) => {
      const totalTarget = mode === 'fasih' ? (d.umkmTotal + d.ubTotal) : (d.targetUmkm + d.targetUb + d.targetKeluarga);
      const totalSubmit = (d.umkmSubmit || 0) + (d.ubSubmit || 0);
      let overallProgress = totalTarget > 0 ? (totalSubmit / totalTarget) : 0;
      if (totalSubmit < totalTarget && overallProgress >= 0.9999) overallProgress = 0.9999;

      const umkmTarget = mode === 'fasih' ? d.umkmTotal : (d.targetUmkm + d.targetKeluarga);
      const uSubmit = d.umkmSubmit || 0;
      let umkmProgress = umkmTarget > 0 ? (uSubmit / umkmTarget) : 0;
      if (uSubmit < umkmTarget && umkmProgress >= 0.9999) umkmProgress = 0.9999;

      const ubTarget = mode === 'fasih' ? d.ubTotal : d.targetUb;
      const bSubmit = d.ubSubmit || 0;
      let ubProgress = ubTarget > 0 ? (bSubmit / ubTarget) : 0;
      if (bSubmit < ubTarget && ubProgress >= 0.9999) ubProgress = 0.9999;

      const tUmkm = d.targetUmkm || 0;
      const tUb = d.targetUb || 0;
      const tKel = d.targetKeluarga || 0;
      const tTot = tUmkm + tUb + tKel;

      excelRows.push([
        kode, nama,
        tUmkm, tUb, tKel, tTot,
        d.umkmOpen || 0, d.umkmDraft || 0, d.umkmSubmit || 0, d.umkmApproved || 0, d.umkmTotal || 0, umkmProgress,
        d.ubOpen || 0, d.ubDraft || 0, d.ubSubmit || 0, d.ubApproved || 0, d.ubTotal || 0, ubProgress,
        overallProgress
      ]);
    };

    addRow('-', 'Provinsi Sumatera Barat', sumData, true);

    dashboardData.forEach(w => {
      addRow(w.kode, w.nama, w);
      if (w.kecamatans && w.kecamatans.length > 0) {
        w.kecamatans.forEach(kec => {
          addRow(kec.kode, `  └ [${kec.kode}] ${kec.nama}`, kec, false, true);
        });
      }
    });

    updateExportProgress(50, 'Menyusun lembar kerja Excel...', 'Membuat worksheet...');
    await new Promise(r => setTimeout(r, 60));

    const ws = XLSX.utils.aoa_to_sheet(excelRows);

    const headerStyle = {
      fill: { fgColor: { rgb: "F79039" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", sz: 11 },
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

    ws['!cols'] = [
      { wch: 14 }, { wch: 32 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 22 }
    ];
    ws['!rows'] = [{ hpt: 28 }];
    ws['!autofilter'] = { ref: ws['!ref'] };
    ws['!views'] = [{ state: 'frozen', xSplit: 2, ySplit: 1, topLeftCell: 'C2', activePane: 'bottomRight' }];

    updateExportProgress(75, 'Menerapkan gaya sel & format persentase...', 'Memformat cell...');
    await new Promise(r => setTimeout(r, 60));

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;

        if (R === 0) {
          cell.s = headerStyle;
        } else {
          const isPctCol = (C === 11 || C === 17 || C === 18);
          const isNumCol = (C >= 2 && !isPctCol);
          const isProvRow = (R === 1);

          const cellStyle = {
            font: { name: "Calibri", sz: 10, bold: isProvRow || C === 18 },
            border: borderStyle,
            alignment: {
              horizontal: isNumCol || isPctCol ? "right" : "left",
              vertical: "center"
            }
          };

          if (isProvRow) {
            cellStyle.fill = { fgColor: { rgb: "FFF2E8" } };
          } else if (R % 2 === 0) {
            cellStyle.fill = { fgColor: { rgb: "F8FAFC" } };
          }

          if (isPctCol) {
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

    updateExportProgress(90, 'Menyimpan berkas spreadsheet...', 'Mengunduh file...');
    await new Promise(r => setTimeout(r, 60));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Progres Wilayah");
    XLSX.writeFile(wb, `SE2026_Progres_Harian_Sumbar_${new Date().toISOString().slice(0, 10)}.xlsx`);

    hideExportProgress();
  } catch (err) {
    console.error('Gagal export excel:', err);
    hideExportProgress();
    alert('Terjadi kesalahan saat mengekspor data ke Excel.');
  }
}

function exportCSV() {
  exportExcel();
}

// ApexCharts settings & updates
