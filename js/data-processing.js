// data-processing.js

window.updateProgressCard = function () {
  const mode = document.getElementById('progress-mode').value;
  const statProgEl = document.getElementById('stat-progress');
  const progressBarFill = document.querySelector('.progress-bar-fill');

  const totalSubmit = sumData.umkmSubmit + sumData.ubSubmit;
  const totalHarian = (sumData.harianUmkm || 0) + (sumData.harianUb || 0);

  let denominator = 0;
  if (mode === 'fasih') {
    denominator = sumData.umkmTotal + sumData.ubTotal;
  } else {
    denominator = sumData.targetUmkm + sumData.targetUb + sumData.targetKeluarga;
  }

  const progressValue = calcProgressPct(totalSubmit, denominator);
  const dailyProgressPct = denominator > 0 ? (totalHarian / denominator) * 100 : 0;

  const mainProgColorVar = getProgressColor(progressValue);

  const percentSpan = `<span class="font-sans text-2xl font-bold ml-0.5" style="color: ${mainProgColorVar}">%</span>`;

  if (statProgEl) {
    statProgEl.className = `metric-value`;
    statProgEl.style.color = mainProgColorVar;
    statProgEl.innerHTML = fmtPct(progressValue) + percentSpan;
  }

  if (progressBarFill) {
    progressBarFill.style.width = Math.min(progressValue, 100).toFixed(2) + '%';
    progressBarFill.style.backgroundColor = mainProgColorVar;
  }

  const dailyChangeSpan = document.getElementById('stat-daily-change');
  if (dailyChangeSpan) {
    dailyChangeSpan.innerText = `▲ +${fmtPct(dailyProgressPct)}%`;
    dailyChangeSpan.style.color = getDailyColor(dailyProgressPct);
  }
};

window.syncProgressMode = function (sourceId) {
  const newVal = document.getElementById(sourceId).value;
  const ids = ['progress-mode', 'progress-mode-daily', 'progress-mode-table', 'progress-mode-chart'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.id !== sourceId) el.value = newVal;
  });

  updateProgressCard();
  updateProgressChart();
  updateDailyChart();
  updateTableData();
};

window.updateTableData = function () {
  const mode = document.getElementById('progress-mode-table') ? document.getElementById('progress-mode-table').value : 'fasih';

  dashboardData.forEach(w => {
    let totalSubmit = w.umkmSubmit + w.ubSubmit;
    let den = mode === 'fasih' ? w.umkmTotal + w.ubTotal : (w.targetUmkm + w.targetUb + w.targetKeluarga);
    w.progress = calcProgressPct(totalSubmit, den);

    w.kecamatans.forEach(k => {
      let kTotalSubmit = k.umkmSubmit + k.ubSubmit;
      let kDen = mode === 'fasih' ? k.umkmTotal + k.ubTotal : (k.targetUmkm + k.targetUb + k.targetKeluarga);
      k.progress = calcProgressPct(kTotalSubmit, kDen);
    });
  });

  // Update sumData progress globally for table province row
  let sumTotalSubmit = sumData.umkmSubmit + sumData.ubSubmit;
  let sumDen = mode === 'fasih' ? sumData.umkmTotal + sumData.ubTotal : (sumData.targetUmkm + sumData.targetUb + sumData.targetKeluarga);
  sumData.progress = calcProgressPct(sumTotalSubmit, sumDen);

  if (currentSortColumn !== null) {
    dashboardData.sort((a, b) => {
      let valA, valB;
      const key = currentSortColumn;
      switch (key) {
        case 'wilayah':
        case 1:
          valA = a.kode;
          valB = b.kode;
          break;
        case 'targetUmk':
          valA = a.targetUmk || 0;
          valB = b.targetUmk || 0;
          break;
        case 'targetUm':
          valA = a.targetUm || 0;
          valB = b.targetUm || 0;
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
  }

  renderTable(dashboardData);
  filterWilayah();
};

window.updateProgressChart = function () {
  if (!progressChart) return;
  const mode = document.getElementById('progress-mode-chart') ? document.getElementById('progress-mode-chart').value : 'fasih';

  const sortedByProgress = [...dashboardData].sort((a, b) => {
    let totalA = a.umkmSubmit + a.ubSubmit;
    let totalB = b.umkmSubmit + b.ubSubmit;
    let denA = mode === 'fasih' ? a.umkmTotal + a.ubTotal : (a.targetUmkm + a.targetUb + a.targetKeluarga);
    let denB = mode === 'fasih' ? b.umkmTotal + b.ubTotal : (b.targetUmkm + b.targetUb + b.targetKeluarga);
    let pctA = denA > 0 ? (totalA / denA) * 100 : 0;
    let pctB = denB > 0 ? (totalB / denB) * 100 : 0;
    return pctB - pctA;
  });

  const progressData = sortedByProgress.map(x => {
    let total = x.umkmSubmit + x.ubSubmit;
    let den = mode === 'fasih' ? x.umkmTotal + x.ubTotal : (x.targetUmkm + x.targetUb + x.targetKeluarga);
    return parseFloat((den > 0 ? (total / den) * 100 : 0).toFixed(2));
  });

  const newCategories = sortedByProgress.map(x => `[${x.kode}]`);

  progressChart.updateOptions({
    xaxis: { categories: newCategories },
    tooltip: {
      x: {
        formatter: (v, { dataPointIndex: i }) => {
          const item = sortedByProgress[i];
          return item ? `[${item.kode}] ${item.nama}` : '';
        }
      }
    }
  });
  progressChart.updateSeries([{
    name: 'Progres %',
    data: progressData
  }]);
};

window.updateDailyChart = function () {
  if (!dailyChart) return;
  const mode = document.getElementById('progress-mode') ? document.getElementById('progress-mode').value : 'fasih';

  const sortedByDaily = [...dashboardData].sort((a, b) => {
    const totalA = (a.harianUmkm || 0) + (a.harianUb || 0);
    const totalB = (b.harianUmkm || 0) + (b.harianUb || 0);
    let denA = mode === 'fasih' ? a.umkmTotal + a.ubTotal : a.targetUmkm + a.targetUb + a.targetKeluarga;
    let denB = mode === 'fasih' ? b.umkmTotal + b.ubTotal : b.targetUmkm + b.targetUb + b.targetKeluarga;
    const pctA = denA > 0 ? (totalA / denA) * 100 : 0;
    const pctB = denB > 0 ? (totalB / denB) * 100 : 0;
    return pctB - pctA;
  });

  const dailyData = sortedByDaily.map(x => {
    const total = (x.harianUmkm || 0) + (x.harianUb || 0);
    let den = mode === 'fasih' ? x.umkmTotal + x.ubTotal : x.targetUmkm + x.targetUb + x.targetKeluarga;
    return parseFloat((den > 0 ? (total / den) * 100 : 0).toFixed(2));
  });

  const newCategories = sortedByDaily.map(x => `[${x.kode}]`);

  dailyChart.updateOptions({
    xaxis: { categories: newCategories }
  });
  dailyChart.updateSeries([{
    name: 'Kenaikan Harian',
    data: dailyData
  }]);
};

function extractApprovedFromRow(row) {
  if (!row) return 0;
  const appPengawas = Number(row["TOTAL_APPROVED_BY_PENGAWAS"] || row["APPROVED BY Pengawas"] || 0);
  const compAdmin = Number(row["TOTAL_COMPLETED_BY_ADMIN_KABUPATEN"] || row["COMPLETED BY Admin Kabupaten"] || 0);
  const editAdmin = Number(row["TOTAL_EDITED_BY_ADMIN_KABUPATEN"] || row["EDITED BY Admin Kabupaten"] || 0);
  return appPengawas + compAdmin + editAdmin;
}

// Fungsi utama yang memproses data JSON (baik dari cache maupun dari fetch)
function processAndRenderData(data) {
  const masterSubSlsRaw = data["master-subsls"] || data["Master SLS"] || data["Master - SubSLS"] || data["master_subsls"] || [];
  masterSubSlsMap = new Map();
  masterDesaMap = new Map();
  masterKecMap = new Map();

  if (Array.isArray(masterSubSlsRaw)) {
    masterSubSlsRaw.forEach(row => {
      const code = String(row.idsubsls || row.KODE_SUB_SLS || row.kode_sub_sls || row.id_sub_sls || row.id || row.kode || row.wilayah || "").trim();
      const name = String(row.nmsls || row.SLS || row.nama_sls || row.NAMA_SLS || row.nama || "").trim();
      if (code && name) {
        masterSubSlsMap.set(code, name);
      }

      // Ekstrak dan agregasi nama desa dari kolom nmdesa / nama_desa / desa di master-subsls
      const nmDesa = String(row.nmdesa || row.NMDESA || row.nama_desa || row.NAMA_DESA || row.desa || row.DESA || row.Kelurahan || row.KELURAHAN || "").trim();
      let idDesa = String(row.iddesa || row.IDDESA || row.kode_desa || row.KODE_DESA || "").trim();
      if (!idDesa && code.length >= 10) {
        idDesa = code.substring(0, 10);
      }
      if (idDesa && nmDesa && nmDesa !== "-" && (!masterDesaMap.has(idDesa) || masterDesaMap.get(idDesa) === "-")) {
        masterDesaMap.set(idDesa, nmDesa);
      }

      // Ekstrak nama kecamatan jika ada
      const nmKec = String(row.nmkec || row.NMKEC || row.nama_kec || row.NAMA_KEC || row.kec || row.KEC || row.Kecamatan || row.KECAMATAN || "").trim();
      let idKec = String(row.idkec || row.IDKEC || row.kode_kec || row.KODE_KEC || "").trim();
      if (!idKec && code.length >= 7) {
        idKec = code.substring(0, 7);
      }
      if (idKec && nmKec && nmKec !== "-" && (!masterKecMap.has(idKec) || masterKecMap.get(idKec) === "-")) {
        masterKecMap.set(idKec, nmKec);
      }
    });
  }

  // Dukung juga jika ada sheet master-desa terpisah
  const masterDesaSheet = data["master-desa"] || data["Master Desa"] || data["master_desa"];
  if (Array.isArray(masterDesaSheet)) {
    masterDesaSheet.forEach(md => {
      const idDesa = String(md.iddesa || md.IDDESA || md.kode_desa || md.KODE_DESA || md.id || md.kode || "").trim();
      const nmDesa = String(md.nmdesa || md.NMDESA || md.nama_desa || md.NAMA_DESA || md.nama || "").trim();
      if (idDesa && nmDesa) {
        masterDesaMap.set(idDesa.length >= 10 ? idDesa.substring(0, 10) : idDesa, nmDesa);
      }
    });
  }

  const masterKecSheet = data["master-kec"];
  if (Array.isArray(masterKecSheet)) {
    masterKecSheet.forEach(mk => {
      const idKec = String(mk.idkec || mk.IDKEC || mk.id || "").trim();
      const nmKec = String(mk.nmkec || mk.NMKEC || mk.nama || "").trim();
      if (idKec && nmKec) masterKecMap.set(idKec.substring(0, 7), nmKec);
    });
  }

  preparePrelistBaseline(data);
  prelistSubSlsData = getPrelistSource(data).map(buildPrelistRow).filter(row => row.kode).sort((a, b) => a.kode.localeCompare(b.kode));
  prelistTreeData = buildPrelistHierarchy(prelistSubSlsData);
  updatePrelistKabDropdown();
  renderPrelistTable();
  updatePrelistSummaryCard();

  const targetSheet = data["target-wilayah"];
  const snapshotUmkmSheet = data["snapshot-kemarin-umkm"];
  const snapshotUbSheet = data["snapshot-kemarin-ub"];
  const umkmKecSheet = data["Sensus Ekonomi 2026"];
  const ubKecSheet = data["Sensus Ekonomi 2026 - UB"];

  if (!umkmKecSheet || !ubKecSheet) {
    console.warn("Data kecamatan (Sensus Ekonomi 2026 / Sensus Ekonomi 2026 - UB) tidak ditemukan di payload Apps Script.");
    return;
  }

  // Buat Index (Map) untuk O(1) lookup dengan dukungan agregasi Sub-SLS (7 digit awal kode sub sls)
  const mapByWilayah = (sheet) => {
    const map = new Map();
    if (sheet && Array.isArray(sheet)) {
      sheet.forEach(row => {
        let wil = "";
        const subsls = String(row.KODE_SUB_SLS || row.kode_sub_sls || "").trim();
        if (subsls && subsls.length >= 7) {
          wil = subsls.substring(0, 7);
        } else {
          const rawWil = String(row.Wilayah || row.wilayah || row.kode || "").trim();
          if (rawWil && rawWil.length >= 7) {
            wil = rawWil.substring(0, 7);
          } else if (rawWil && rawWil.length === 4) {
            wil = rawWil;
          } else if (row.KODE_KAB && row.KODE_KEC) {
            const prov = String(row.KODE_PROV || "13").trim();
            const kab = String(row.KODE_KAB).padStart(2, '0');
            const kec = String(row.KODE_KEC).padStart(3, '0');
            wil = `${prov}${kab}${kec}`;
          }
        }
        if (!wil) return;

        const kecName = String(row.KEC || row.kec || row.Kecamatan || row.kecamatan || row["Nama Wilayah"] || row.nama || "").trim();

        if (map.has(wil)) {
          const existing = map.get(wil);
          existing.OPEN = (Number(existing.OPEN || 0) + Number(row.OPEN || row.TOTAL_OPEN || 0));
          existing.DRAFT = (Number(existing.DRAFT || 0) + Number(row.DRAFT || row.TOTAL_DRAFT || 0));
          existing.APPROVED_COMBINED = (Number(existing.APPROVED_COMBINED || 0) + extractApprovedFromRow(row));
          ALL_SUBMIT_FIELDS.forEach(f => {
            existing[f] = (Number(existing[f] || 0) + Number(row[f] || 0));
          });
          if (kecName && (!existing.Kecamatan || existing.Kecamatan === "-")) {
            existing.Kecamatan = kecName;
          }
        } else {
          map.set(wil, {
            ...row,
            Wilayah: wil,
            Kecamatan: kecName || "-",
            OPEN: Number(row.OPEN || row.TOTAL_OPEN || 0),
            DRAFT: Number(row.DRAFT || row.TOTAL_DRAFT || 0),
            APPROVED_COMBINED: extractApprovedFromRow(row)
          });
        }
      });
    }
    return map;
  };

  const dataDateStr = data.lastUpdated ? data.lastUpdated.substring(0, 10) : "";

  const getYesterdaySnapshotDate = (sheet, currentDataDate) => {
    if (!sheet || sheet.length === 0) return "";
    const parseDate = (t) => {
      if (!t) return "";
      if (typeof t === 'string') return t.trim().replace(/^['"]/, '').substring(0, 10);
      return "";
    };
    const dates = [...new Set(sheet.map(row => parseDate(row.Tanggal || row.tanggal)).filter(Boolean))].sort().reverse();
    if (dates.length === 0) return "";
    if (dates[0] === currentDataDate && dates.length > 1) {
      return dates[1];
    }
    if (dates[0] !== currentDataDate) {
      return dates[0];
    }
    return ""; // Jika hanya ada data hari ini dan belum ada baseline kemarin
  };

  const filterSnapshotByDate = (sheet, targetDate) => {
    if (!sheet || !targetDate) return [];
    const parseDate = (t) => String(t || '').trim().replace(/^['"]/, '').substring(0, 10);
    return sheet.filter(row => parseDate(row.Tanggal || row.tanggal) === targetDate);
  };

  const targetUmkmDate = getYesterdaySnapshotDate(snapshotUmkmSheet, dataDateStr);
  const targetUbDate = getYesterdaySnapshotDate(snapshotUbSheet, dataDateStr);

  const filteredUmkmSnap = filterSnapshotByDate(snapshotUmkmSheet, targetUmkmDate);
  const filteredUbSnap = filterSnapshotByDate(snapshotUbSheet, targetUbDate);

  const targetMap = mapByWilayah(targetSheet);
  const snapUmkmMap = mapByWilayah(filteredUmkmSnap);
  const snapUbMap = mapByWilayah(filteredUbSnap);
  const umkmKecMap = mapByWilayah(umkmKecSheet);
  const ubKecMap = mapByWilayah(ubKecSheet);

  // Initialize dashboardData (Kabupaten) to 0, data will be aggregated from Kecamatan
  dashboardData.forEach(w => {
    w.targetUmk = 0;
    w.targetUm = 0;
    w.targetUmkm = 0;
    w.targetUb = 0;
    w.targetKeluarga = 0;

    w.umkmOpen = 0; w.umkmDraft = 0; w.umkmApproved = 0; w.umkmSubmit = 0; w.umkmTotal = 0;
    w.ubOpen = 0; w.ubDraft = 0; w.ubApproved = 0; w.ubSubmit = 0; w.ubTotal = 0;
    w.harianUmkm = 0; w.harianUb = 0;
    w.progress = 0;
    w.kecamatans = [];
  });

  // Proses Data Kecamatan (7 digit awal kode sub sls) & Agregasi ke Kabupaten (4 digit awal)
  if (masterKecSheet || umkmKecSheet || ubKecSheet) {
    const allKecMap = new Map();

    // 1. Collect from master
    if (masterKecSheet) {
      masterKecSheet.forEach(mk => {
        const idKec = String(mk.idkec || mk.IDKEC || mk.id || "").trim();
        const nmKec = mk.nmkec || mk.NMKEC || mk.nama || "-";
        if (idKec && idKec.length >= 7) allKecMap.set(idKec.substring(0, 7), nmKec);
      });
    }

    // 2. Collect from UMKM (7 digit kode & nama kecamatan)
    if (umkmKecSheet) {
      umkmKecMap.forEach((row, idKec) => {
        const nm = row.Kecamatan || row.KEC || "-";
        if (idKec && idKec.length >= 7) {
          const k7 = idKec.substring(0, 7);
          if (!allKecMap.has(k7) || allKecMap.get(k7) === "-") {
            allKecMap.set(k7, nm !== "-" ? nm : (allKecMap.get(k7) || "-"));
          }
        }
      });
    }

    // 3. Collect from UB (7 digit kode & nama kecamatan)
    if (ubKecSheet) {
      ubKecMap.forEach((row, idKec) => {
        const nm = row.Kecamatan || row.KEC || "-";
        if (idKec && idKec.length >= 7) {
          const k7 = idKec.substring(0, 7);
          if (!allKecMap.has(k7) || allKecMap.get(k7) === "-") {
            allKecMap.set(k7, nm !== "-" ? nm : (allKecMap.get(k7) || "-"));
          }
        }
      });
    }

    // 4. Collect from Target
    if (targetSheet) {
      targetSheet.forEach(row => {
        const idKec = String(row.Wilayah || row.wilayah || row.kode || "").trim();
        if (idKec && idKec.length >= 7) {
          const k7 = idKec.substring(0, 7);
          if (!allKecMap.has(k7)) {
            allKecMap.set(k7, row["Nama Wilayah"] || row.nama || "-");
          }
        }
      });
    }

    allKecMap.forEach((nmKec, idKec) => {
      const kabKode = idKec.substring(0, 4);
      const parentKab = dashboardData.find(w => w.kode === kabKode);

      if (parentKab) {
        let kData = {
          kode: idKec,
          nama: nmKec,
          targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0,
          umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0,
          ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0,
          progress: 0
        };

        // Target Kecamatan
        const targetRow = targetMap.get(idKec);
        if (targetRow) {
          const parseTarget = (val) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            return Number(String(val).replace(/,/g, '').replace(/\./g, '')) || 0;
          };
          const rawUmk = targetRow["Target UMK"] ?? targetRow["TARGET UMK"] ?? targetRow["UMK"];
          const rawUm = targetRow["Target UM"] ?? targetRow["TARGET UM"] ?? targetRow["UM"];
          const rawUmkm = targetRow["Target UMKM"] ?? targetRow["TARGET UMKM"];

          kData.targetUmk = parseTarget(rawUmk);
          kData.targetUm = parseTarget(rawUm);

          if (rawUmkm !== undefined && rawUmkm !== null && rawUmkm !== "") {
            kData.targetUmkm = parseTarget(rawUmkm);
            if (!rawUmk && !rawUm && kData.targetUmkm > 0) {
              kData.targetUmk = kData.targetUmkm;
            }
          } else {
            kData.targetUmkm = kData.targetUmk + kData.targetUm;
          }

          kData.targetUb = parseTarget(targetRow["Target UB"] || targetRow["TARGET UB"] || targetRow["UB"]);
          kData.targetKeluarga = parseTarget(targetRow["Target Keluarga"] || targetRow["TARGET KELUARGA"] || targetRow["Keluarga"]);
        }

        // UMKM Kecamatan
        if (umkmKecSheet) {
          const umkmRow = umkmKecMap.get(idKec);
          if (umkmRow) {
            kData.umkmOpen = Number(umkmRow.OPEN || umkmRow.TOTAL_OPEN || 0);
            kData.umkmDraft = Number(umkmRow.DRAFT || umkmRow.TOTAL_DRAFT || 0);
            kData.umkmApproved = umkmRow.APPROVED_COMBINED !== undefined ? umkmRow.APPROVED_COMBINED : extractApprovedFromRow(umkmRow);

            let submit = 0;
            ALL_SUBMIT_FIELDS.forEach(f => { submit += Number(umkmRow[f] || 0); });
            kData.umkmSubmit = submit;
            kData.umkmTotal = kData.umkmOpen + kData.umkmDraft + kData.umkmSubmit;
          }
        }

        // Harian UMKM Kecamatan
        let umkmKemarin = 0;
        if (targetUmkmDate) {
          const snapUmkm = snapUmkmMap.get(idKec);
          if (snapUmkm) {
            let sKemarin = 0;
            ALL_SUBMIT_FIELDS.forEach(f => { sKemarin += Number(snapUmkm[f] || 0); });
            umkmKemarin = sKemarin;
          }
          kData.harianUmkm = Math.max(0, kData.umkmSubmit - umkmKemarin);
        } else {
          kData.harianUmkm = 0;
        }

        // UB Kecamatan
        if (ubKecSheet) {
          const ubRow = ubKecMap.get(idKec);
          if (ubRow) {
            kData.ubOpen = Number(ubRow.OPEN || ubRow.TOTAL_OPEN || 0);
            kData.ubDraft = Number(ubRow.DRAFT || ubRow.TOTAL_DRAFT || 0);
            kData.ubApproved = ubRow.APPROVED_COMBINED !== undefined ? ubRow.APPROVED_COMBINED : extractApprovedFromRow(ubRow);

            let submit = 0;
            ALL_SUBMIT_FIELDS.forEach(f => { submit += Number(ubRow[f] || 0); });
            kData.ubSubmit = submit;
            kData.ubTotal = kData.ubOpen + kData.ubDraft + kData.ubSubmit;
          }
        }

        // Harian UB Kecamatan
        let ubKemarin = 0;
        if (targetUbDate) {
          const snapUb = snapUbMap.get(idKec);
          if (snapUb) {
            let sKemarin = 0;
            ALL_SUBMIT_FIELDS.forEach(f => { sKemarin += Number(snapUb[f] || 0); });
            ubKemarin = sKemarin;
          }
          kData.harianUb = Math.max(0, kData.ubSubmit - ubKemarin);
        } else {
          kData.harianUb = 0;
        }

        // Progres Kecamatan
        const totalTarget = kData.umkmTotal + kData.ubTotal;
        kData.progress = calcProgressPct(kData.umkmSubmit + kData.ubSubmit, totalTarget);

        // AGREGASI KE KABUPATEN INDUK
        parentKab.targetUmk += kData.targetUmk;
        parentKab.targetUm += kData.targetUm;
        parentKab.targetUmkm += kData.targetUmkm;
        parentKab.targetUb += kData.targetUb;
        parentKab.targetKeluarga += kData.targetKeluarga;

        parentKab.umkmOpen += kData.umkmOpen;
        parentKab.umkmDraft += kData.umkmDraft;
        parentKab.umkmApproved += kData.umkmApproved;
        parentKab.umkmSubmit += kData.umkmSubmit;
        parentKab.umkmTotal += kData.umkmTotal;

        parentKab.ubOpen += kData.ubOpen;
        parentKab.ubDraft += kData.ubDraft;
        parentKab.ubApproved += kData.ubApproved;
        parentKab.ubSubmit += kData.ubSubmit;
        parentKab.ubTotal += kData.ubTotal;

        parentKab.harianUmkm += kData.harianUmkm;
        parentKab.harianUb += kData.harianUb;

        parentKab.kecamatans.push(kData);
      }
    });

    // Sort kecamatan by kode
    dashboardData.forEach(w => {
      w.kecamatans.sort((a, b) => a.kode.localeCompare(b.kode));

      // Re-calculate Progress untuk tiap Kabupaten setelah diagregasi dari Kecamatan
      const totalAll = w.umkmTotal + w.ubTotal;
      w.progress = calcProgressPct(w.umkmSubmit + w.ubSubmit, totalAll);
    });
  }

  // Recalculate global sumData
  sumData.targetUmk = dashboardData.reduce((s, x) => s + (x.targetUmk || 0), 0);
  sumData.targetUm = dashboardData.reduce((s, x) => s + (x.targetUm || 0), 0);
  sumData.targetUmkm = dashboardData.reduce((s, x) => s + (x.targetUmkm || 0), 0);
  sumData.targetUb = dashboardData.reduce((s, x) => s + x.targetUb, 0);
  sumData.targetKeluarga = dashboardData.reduce((s, x) => s + (x.targetKeluarga || 0), 0);

  sumData.umkmOpen = dashboardData.reduce((s, x) => s + x.umkmOpen, 0);
  sumData.umkmDraft = dashboardData.reduce((s, x) => s + x.umkmDraft, 0);
  sumData.umkmApproved = dashboardData.reduce((s, x) => s + (x.umkmApproved || 0), 0);
  sumData.umkmSubmit = dashboardData.reduce((s, x) => s + x.umkmSubmit, 0);
  sumData.umkmTotal = dashboardData.reduce((s, x) => s + x.umkmTotal, 0);

  sumData.ubOpen = dashboardData.reduce((s, x) => s + x.ubOpen, 0);
  sumData.ubDraft = dashboardData.reduce((s, x) => s + x.ubDraft, 0);
  sumData.ubApproved = dashboardData.reduce((s, x) => s + (x.ubApproved || 0), 0);
  sumData.ubSubmit = dashboardData.reduce((s, x) => s + x.ubSubmit, 0);
  sumData.ubTotal = dashboardData.reduce((s, x) => s + x.ubTotal, 0);

  sumData.harianUmkm = dashboardData.reduce((s, x) => s + (x.harianUmkm || 0), 0);
  sumData.harianUb = dashboardData.reduce((s, x) => s + (x.harianUb || 0), 0);

  const globalTotalAssignment = sumData.umkmTotal + sumData.ubTotal;
  sumData.progress = calcProgressPct(sumData.umkmSubmit + sumData.ubSubmit, globalTotalAssignment);

  // Update values in HTML cards
  if (document.getElementById('stat-target')) {
    document.getElementById('stat-target').innerText = fmtNum(sumData.targetUmk + sumData.targetUm + sumData.targetUb + sumData.targetKeluarga);
  }
  if (document.getElementById('stat-target-umk')) {
    document.getElementById('stat-target-umk').innerText = fmtNum(sumData.targetUmk);
  }
  if (document.getElementById('stat-target-um')) {
    document.getElementById('stat-target-um').innerText = fmtNum(sumData.targetUm);
  }
  if (document.getElementById('stat-target-umkm')) {
    document.getElementById('stat-target-umkm').innerText = fmtNum(sumData.targetUmkm);
  }
  if (document.getElementById('stat-target-ub')) {
    document.getElementById('stat-target-ub').innerText = fmtNum(sumData.targetUb);
  }
  if (document.getElementById('stat-target-keluarga')) {
    document.getElementById('stat-target-keluarga').innerText = fmtNum(sumData.targetKeluarga);
  }

  if (document.getElementById('stat-assigned')) {
    document.getElementById('stat-assigned').innerText = fmtNum(sumData.umkmTotal + sumData.ubTotal);
  }
  if (document.getElementById('stat-open')) {
    document.getElementById('stat-open').innerText = fmtNum(sumData.umkmOpen + sumData.ubOpen);
  }
  if (document.getElementById('stat-draft')) {
    document.getElementById('stat-draft').innerText = fmtNum(sumData.umkmDraft + sumData.ubDraft);
  }
  if (document.getElementById('stat-submit')) {
    document.getElementById('stat-submit').innerText = fmtNum(sumData.umkmSubmit + sumData.ubSubmit);
  }
  if (document.getElementById('stat-umkm-total')) {
    document.getElementById('stat-umkm-total').innerText = fmtNum(sumData.umkmTotal);
  }
  if (document.getElementById('stat-ub-total')) {
    document.getElementById('stat-ub-total').innerText = fmtNum(sumData.ubTotal);
  }

  // Panggil fungsi update progress card agar mengikuti dropdown
  if (typeof updateProgressCard === 'function') {
    updateProgressCard();
  }

  // Update Sync time to Spreadsheet's last edit time from Apps Script
  if (data.lastUpdated) {
    const updateTime = new Date(data.lastUpdated);
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    };
    const syncEl = document.getElementById('sync-time');
    if (syncEl) syncEl.innerText = updateTime.toLocaleDateString('id-ID', options) + ' WIB';
  } else {
    const syncEl = document.getElementById('sync-time');
    if (syncEl) syncEl.innerText = '-';
  }

  // Update tabel & grafik setelah data diproses
  if (typeof updateTableData === 'function') updateTableData();
  if (typeof renderAllCharts === 'function') renderAllCharts();
  if (typeof updatePrelistKabDropdown === 'function') updatePrelistKabDropdown();
  if (typeof updatePrelistSummaryCard === 'function') updatePrelistSummaryCard();
}
