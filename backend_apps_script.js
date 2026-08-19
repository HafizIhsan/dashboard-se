// ============================================================
// KONFIGURASI & BACKEND APPS SCRIPT DASHBOARD SE2026
// BPS PROVINSI SUMATERA BARAT
// ============================================================

// Kolom yang Dihitung secara eksplisit sebagai SUBMIT
const SUBMIT_FIELDS = [
  "SUBMITTED BY Pencacah",
  "APPROVED BY Pengawas",
  "SUBMITTED RESPONDENT",
  "EDITED BY Pengawas",
  "EDITED BY Admin Kabupaten",
  "COMPLETED BY Admin Kabupaten",
  "REJECTED BY Pengawas",
  "REJECTED BY Admin Kabupaten",
  "REVOKED BY Pengawas",
  "TOTAL_SUBMITTED_BY_PENCACAH",
  "TOTAL_APPROVED_BY_PENGAWAS",
  "TOTAL_SUBMITTED_RESPONDENT",
  "TOTAL_EDITED_BY_PENGAWAS",
  "TOTAL_EDITED_BY_ADMIN_KABUPATEN",
  "TOTAL_COMPLETED_BY_ADMIN_KABUPATEN",
  "TOTAL_REJECTED_BY_PENGAWAS",
  "TOTAL_REJECTED_BY_ADMIN_KABUPATEN",
  "TOTAL_REVOKED_BY_PENGAWAS",
  "TOTAL_REVOKED_BY_ADMIN_KABUPATEN"
];

/**
 * Helper: Ekstrak kode Kecamatan (7 digit, misal: 1301011) dari baris data
 */
function extractKecCode(row) {
  var subsls = String(getValCI(row, "KODE_SUB_SLS") || getValCI(row, "kode_sub_sls") || "").trim();
  if (subsls && subsls.length >= 7) return subsls.substring(0, 7);
  
  var wil = String(getValCI(row, "Wilayah") || getValCI(row, "wilayah") || getValCI(row, "kode") || "").trim();
  if (wil && wil.length >= 7) return wil.substring(0, 7);
  if (wil && wil.length === 4) return wil; // Level Kabupaten jika ada
  
  var prov = String(getValCI(row, "KODE_PROV") || "13").trim();
  var kab = String(getValCI(row, "KODE_KAB") || "").trim();
  var kec = String(getValCI(row, "KODE_KEC") || "").trim();
  if (kab && kec) {
    if (kab.length === 1) kab = "0" + kab;
    while (kec.length < 3) kec = "0" + kec;
    return (prov || "13") + kab + kec;
  }
  return wil || "";
}

/**
 * Helper: Ekstrak metrik OPEN, DRAFT, SUBMIT dari suatu baris data
 */
function extractRowMetrics(row) {
  var open = Number(getValCI(row, "TOTAL_OPEN") || getValCI(row, "OPEN") || getValCI(row, "Open") || 0);
  var draft = Number(getValCI(row, "TOTAL_DRAFT") || getValCI(row, "DRAFT") || getValCI(row, "Draft") || 0);
  
  var submit = 0;
  SUBMIT_FIELDS.forEach(function(col) {
    var v = Number(getValCI(row, col) || 0);
    if (!isNaN(v)) submit += v;
  });
  
  return { open: open, draft: draft, submit: submit };
}

// ============================================================
// FUNGSI UTAMA: Hitung Kenaikan Harian (Jalankan via Trigger)
// ============================================================
function recordDailyProgress() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let today;
  let lastEditTimestamp;
  try {
    const file = DriveApp.getFileById(ss.getId());
    const lastUpdated = file.getLastUpdated();
    today = Utilities.formatDate(lastUpdated, "Asia/Jakarta", "yyyy-MM-dd");
    lastEditTimestamp = Utilities.formatDate(
      lastUpdated,
      "Asia/Jakarta",
      "yyyy-MM-dd HH:mm:ss",
    );
  } catch (e) {
    const now = new Date();
    today = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
    lastEditTimestamp = Utilities.formatDate(
      now,
      "Asia/Jakarta",
      "yyyy-MM-dd HH:mm:ss",
    );
  }

  // --- UMKM (Mendukung data Kecamatan maupun Sub-SLS) ---
  const umkmChanged = calculateDaily(ss, {
    sourceSheet: "Sensus Ekonomi 2026",
    snapshotSheet: "snapshot-kemarin-umkm",
    today: today,
    timestamp: lastEditTimestamp,
  });

  // --- UB (Mendukung data Kecamatan maupun Sub-SLS) ---
  const ubChanged = calculateDaily(ss, {
    sourceSheet: "Sensus Ekonomi 2026 - UB",
    snapshotSheet: "snapshot-kemarin-ub",
    today: today,
    timestamp: lastEditTimestamp,
  });

  Logger.log(
    "✅ Kenaikan harian level KECAMATAN/WILAYAH berhasil dihitung untuk tanggal: " +
      lastEditTimestamp,
  );

  return {
    umkm: umkmChanged,
    ub: ubChanged,
    today: today,
    timestamp: lastEditTimestamp,
  };
}

function calculateDaily(ss, config) {
  const source = getSheetByNameCI(ss, config.sourceSheet);
  const snapshot = getSheetByNameCI(ss, config.snapshotSheet);

  if (!source || !snapshot) {
    Logger.log("❌ Sheet tidak ditemukan: " + config.sourceSheet);
    return;
  }

  // 1. Baca data sumber (Kecamatan / Sub SLS)
  const sourceData = getSheetAsObjects(source);

  // 2. Baca snapshot kemarin
  const snapshotData = getSheetAsObjects(snapshot);

  function getDateString(rawVal) {
    if (!rawVal) return "";
    if (rawVal instanceof Date) {
      return Utilities.formatDate(rawVal, "Asia/Jakarta", "yyyy-MM-dd");
    }
    return String(rawVal).trim().substring(0, 10);
  }

  let latestPastDate = "";
  let hasTodaySnapshot = false;

  snapshotData.forEach((row) => {
    let rowDate = getDateString(getValCI(row, "Tanggal"));
    if (rowDate === config.today) {
      hasTodaySnapshot = true;
    } else if (rowDate && rowDate < config.today && rowDate > latestPastDate) {
      latestPastDate = rowDate;
    }
  });

  const latestPastMap = {};
  const currentTodaySnapshotMap = {};
  let firstRowToday = -1;

  snapshotData.forEach((row, idx) => {
    let rowDate = getDateString(getValCI(row, "Tanggal"));
    let kode = String(getValCI(row, "Wilayah") || "").trim();
    let vals = {
      submit: Number(
        getValCI(row, "Submit") || getValCI(row, "Submit Kemarin") || 0,
      ),
      open: Number(getValCI(row, "Open") || 0),
      draft: Number(getValCI(row, "Draft") || 0),
    };

    if (!rowDate || rowDate === latestPastDate) {
      latestPastMap[kode] = vals;
    }

    if (rowDate === config.today) {
      currentTodaySnapshotMap[kode] = vals;
      if (firstRowToday === -1) firstRowToday = idx + 2;
    }
  });

  // 3. Agregasi submit, open, draft hari ini per kecamatan (jika baris berupa Sub SLS)
  const todayMap = {};

  sourceData.forEach((row) => {
    const kode = extractKecCode(row);
    if (!kode) return;

    if (!todayMap[kode]) {
      todayMap[kode] = { submit: 0, open: 0, draft: 0 };
    }

    const metrics = extractRowMetrics(row);
    todayMap[kode].submit += metrics.submit;
    todayMap[kode].open += metrics.open;
    todayMap[kode].draft += metrics.draft;
  });

  const allKodes = Object.keys(todayMap);

  let hasChanges = false;
  const mapToCompare = hasTodaySnapshot
    ? currentTodaySnapshotMap
    : latestPastMap;

  for (let i = 0; i < allKodes.length; i++) {
    const kode = allKodes[i];
    const todayVals = todayMap[kode];
    const compVals = mapToCompare[kode] || { submit: 0, open: 0, draft: 0 };

    if (
      todayVals.submit !== compVals.submit ||
      todayVals.open !== compVals.open ||
      todayVals.draft !== compVals.draft
    ) {
      hasChanges = true;
      break;
    }
  }

  if (!hasChanges) {
    Logger.log(
      "⏩ Tidak ada perubahan data untuk " +
        config.sourceSheet +
        ", proses dilewati.",
    );
    return false;
  }

  // 4. Update snapshot history
  const snapshotHeaders = ["Tanggal", "Wilayah", "Submit", "Open", "Draft"];
  const snapshotRows = allKodes.map((kode) => {
    const vals = todayMap[kode];
    return ["'" + config.timestamp, kode, vals.submit, vals.open, vals.draft];
  });

  if (snapshot.getLastRow() === 0) {
    snapshot
      .getRange(1, 1, 1, snapshotHeaders.length)
      .setValues([snapshotHeaders]);
  }

  if (snapshotRows.length > 0) {
    if (firstRowToday !== -1) {
      const lastRow = snapshot.getLastRow();
      const numRowsToClear = lastRow - firstRowToday + 1;
      if (numRowsToClear > 0) {
        snapshot
          .getRange(firstRowToday, 1, numRowsToClear, snapshotHeaders.length)
          .clearContent();
      }
      snapshot
        .getRange(firstRowToday, 1, snapshotRows.length, snapshotHeaders.length)
        .setValues(snapshotRows);
    } else {
      const lastRow = snapshot.getLastRow();
      snapshot
        .getRange(lastRow + 1, 1, snapshotRows.length, snapshotHeaders.length)
        .setValues(snapshotRows);
    }
  }

  return true;
}

// ============================================================
// HELPER: Baca sheet jadi array of objects
// ============================================================
function getSheetAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = data[i][j];
    });
    rows.push(obj);
  }
  return rows;
}

// ============================================================
// doGet: Web App endpoint (Dibaca oleh Dashboard)
// ============================================================
function doGet() {
  var cache = CacheService.getScriptCache();
  var cachedData = cache.get("dashboardPayload");

  if (cachedData != null) {
    return ContentService.createTextOutput(cachedData).setMimeType(
      ContentService.MimeType.JSON,
    );
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let lastUpdatedTime;
  try {
    const file = DriveApp.getFileById(ss.getId());
    lastUpdatedTime = Utilities.formatDate(
      file.getLastUpdated(),
      "Asia/Jakarta",
      "yyyy-MM-dd'T'HH:mm:ssXXX",
    );
  } catch (e) {
    lastUpdatedTime = new Date().toISOString();
  }

  const sheetNames = [
    "target-wilayah",
    "snapshot-kemarin-umkm",
    "snapshot-kemarin-ub",
    "Sensus Ekonomi 2026",
    "Sensus Ekonomi 2026 - UB",
    "master-kec",
    "master-subsls",
    "Master SLS",
    "Rekap Prelist SubSLS",
    "History - Rekap Prelist SubSLS"
  ];

  const result = {
    lastUpdated: lastUpdatedTime,
  };

  sheetNames.forEach((name) => {
    const sheet = getSheetByNameCI(ss, name);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) {
        result[name] = [];
        return;
      }
      const headers = data[0];

      // Penanganan khusus sheet Sensus Ekonomi 2026 / UB jika berisi data Sub-SLS
      if (name === "Sensus Ekonomi 2026" || name === "Sensus Ekonomi 2026 - UB") {
        var isSubSlsLevel = headers.some(function(h) {
          var norm = String(h).toLowerCase().replace(/[\s_-]/g, "");
          return norm === "kodesubsls" || norm === "kodekec" || norm === "kodedesa" || norm === "totalsubmittedbypencacah";
        });

        if (isSubSlsLevel) {
          var kecMap = {};
          for (var i = 1; i < data.length; i++) {
            var rowObj = {};
            headers.forEach(function(h, j) { rowObj[h] = data[i][j]; });
            var idkec = extractKecCode(rowObj);
            if (!idkec) continue;

            if (!kecMap[idkec]) {
              kecMap[idkec] = {
                Wilayah: idkec,
                Kecamatan: getValCI(rowObj, "KEC") || getValCI(rowObj, "Kecamatan") || getValCI(rowObj, "Nama Wilayah") || "-",
                Kabupaten: getValCI(rowObj, "KAB") || getValCI(rowObj, "Kabupaten") || "-",
                OPEN: 0,
                DRAFT: 0,
                "SUBMITTED BY Pencacah": 0,
                "APPROVED BY Pengawas": 0,
                "SUBMITTED RESPONDENT": 0,
                "EDITED BY Pengawas": 0,
                "EDITED BY Admin Kabupaten": 0,
                "COMPLETED BY Admin Kabupaten": 0,
                "REJECTED BY Pengawas": 0,
                "REJECTED BY Admin Kabupaten": 0,
                "REVOKED BY Pengawas": 0,
                "REVOKED BY Admin Kabupaten": 0
              };
            }

            kecMap[idkec].OPEN += Number(getValCI(rowObj, "TOTAL_OPEN") || getValCI(rowObj, "OPEN") || 0);
            kecMap[idkec].DRAFT += Number(getValCI(rowObj, "TOTAL_DRAFT") || getValCI(rowObj, "DRAFT") || 0);
            kecMap[idkec]["SUBMITTED BY Pencacah"] += Number(getValCI(rowObj, "TOTAL_SUBMITTED_BY_PENCACAH") || getValCI(rowObj, "SUBMITTED BY Pencacah") || 0);
            kecMap[idkec]["APPROVED BY Pengawas"] += Number(getValCI(rowObj, "TOTAL_APPROVED_BY_PENGAWAS") || getValCI(rowObj, "APPROVED BY Pengawas") || 0);
            kecMap[idkec]["SUBMITTED RESPONDENT"] += Number(getValCI(rowObj, "TOTAL_SUBMITTED_RESPONDENT") || getValCI(rowObj, "SUBMITTED RESPONDENT") || 0);
            kecMap[idkec]["EDITED BY Pengawas"] += Number(getValCI(rowObj, "TOTAL_EDITED_BY_PENGAWAS") || getValCI(rowObj, "EDITED BY Pengawas") || 0);
            kecMap[idkec]["EDITED BY Admin Kabupaten"] += Number(getValCI(rowObj, "TOTAL_EDITED_BY_ADMIN_KABUPATEN") || getValCI(rowObj, "EDITED BY Admin Kabupaten") || 0);
            kecMap[idkec]["COMPLETED BY Admin Kabupaten"] += Number(getValCI(rowObj, "TOTAL_COMPLETED_BY_ADMIN_KABUPATEN") || getValCI(rowObj, "COMPLETED BY Admin Kabupaten") || 0);
            kecMap[idkec]["REJECTED BY Pengawas"] += Number(getValCI(rowObj, "TOTAL_REJECTED_BY_PENGAWAS") || getValCI(rowObj, "REJECTED BY Pengawas") || 0);
            kecMap[idkec]["REJECTED BY Admin Kabupaten"] += Number(getValCI(rowObj, "TOTAL_REJECTED_BY_ADMIN_KABUPATEN") || getValCI(rowObj, "REJECTED BY Admin Kabupaten") || 0);
            kecMap[idkec]["REVOKED BY Pengawas"] += Number(getValCI(rowObj, "TOTAL_REVOKED_BY_PENGAWAS") || getValCI(rowObj, "REVOKED BY Pengawas") || 0);
            kecMap[idkec]["REVOKED BY Admin Kabupaten"] += Number(getValCI(rowObj, "TOTAL_REVOKED_BY_ADMIN_KABUPATEN") || getValCI(rowObj, "REVOKED BY Admin Kabupaten") || 0);
          }
          result[name] = Object.values(kecMap);
          return;
        }
      }

      // Pemrosesan reguler
      const rows = [];
      for (let i = 1; i < data.length; i++) {
        const row = {};
        headers.forEach((h, j) => {
          row[h] = data[i][j];
        });

        var mappedRow = {};
        if (name === "target-wilayah") {
          mappedRow["Wilayah"] =
            getValCI(row, "Wilayah") || getValCI(row, "kode");
          mappedRow["Target UMKM"] =
            getValCI(row, "Target UMKM") || getValCI(row, "TARGET UMKM");
          mappedRow["Target UB"] =
            getValCI(row, "Target UB") || getValCI(row, "TARGET UB");
          mappedRow["Target Keluarga"] =
            getValCI(row, "Target Keluarga") ||
            getValCI(row, "TARGET KELUARGA");
          mappedRow["Nama Wilayah"] =
            getValCI(row, "Nama Wilayah") || getValCI(row, "nama");
        } else if (
          name === "snapshot-kemarin-umkm" ||
          name === "snapshot-kemarin-ub"
        ) {
          mappedRow["Wilayah"] =
            getValCI(row, "Wilayah") || getValCI(row, "kode");
          mappedRow["Submit"] =
            getValCI(row, "Submit") ||
            getValCI(row, "Submit Kemarin") ||
            getValCI(row, "Submit_Kemarin") ||
            0;
          mappedRow["Open"] = getValCI(row, "Open") || 0;
          mappedRow["Draft"] = getValCI(row, "Draft") || 0;
          mappedRow["Tanggal"] = getValCI(row, "Tanggal") || "";
        } else if (
          name === "Sensus Ekonomi 2026" ||
          name === "Sensus Ekonomi 2026 - UB"
        ) {
          mappedRow["Wilayah"] =
            getValCI(row, "Wilayah") || getValCI(row, "kode");
          mappedRow["OPEN"] =
            getValCI(row, "OPEN") || getValCI(row, "TOTAL_OPEN") || getValCI(row, "Open") || 0;
          mappedRow["DRAFT"] =
            getValCI(row, "DRAFT") || getValCI(row, "TOTAL_DRAFT") || getValCI(row, "Draft") || 0;
          SUBMIT_FIELDS.forEach(function (field) {
            mappedRow[field] = getValCI(row, field) || 0;
          });
        } else if (name === "master-kec") {
          mappedRow["idkec"] = getValCI(row, "idkec") || getValCI(row, "id");
          mappedRow["nmkec"] = getValCI(row, "nmkec") || getValCI(row, "nama");
        } else if (name === "master-subsls" || name === "Master SLS" || name === "Master - SubSLS") {
          mappedRow["idsubsls"] =
            getValCI(row, "idsubsls") || getValCI(row, "KODE_SUB_SLS") || getValCI(row, "kode_sub_sls") || getValCI(row, "id_sub_sls") || getValCI(row, "id") || getValCI(row, "kode") || getValCI(row, "wilayah") || "";
          mappedRow["nmsls"] =
            getValCI(row, "nmsls") || getValCI(row, "SLS") || getValCI(row, "nama_sls") || getValCI(row, "NAMA_SLS") || getValCI(row, "nama") || "";
        } else if (name === "Rekap Prelist SubSLS" || name === "Rekap Prelist SE2026 - SubSLS") {
          mappedRow["KODE_SUB_SLS"] = getValCI(row, "KODE_SUB_SLS") || "";
          mappedRow["JUMLAH_PRELIST"] = Number(getValCI(row, "JUMLAH_PRELIST") || 0);
          mappedRow["JUMLAH_PRELIST_OPEN_DRAFT"] = Number(getValCI(row, "JUMLAH_PRELIST_OPEN_DRAFT") || 0);
          mappedRow["JUMLAH_PRELIST_SELAIN_OPEN_DRAFT"] = Number(getValCI(row, "JUMLAH_PRELIST_SELAIN_OPEN_DRAFT") || 0);
          mappedRow["JUMLAH_KELUARGA_PRELIST"] = Number(getValCI(row, "JUMLAH_KELUARGA_PRELIST") || 0);
          mappedRow["KELUARGA_PRELIST_SUBMIT"] = Number(getValCI(row, "KELUARGA_PRELIST_SUBMIT") || 0);
          mappedRow["JUMLAH_USAHA_PRELIST"] = Number(getValCI(row, "JUMLAH_USAHA_PRELIST") || 0);
          mappedRow["USAHA_PRELIST_SUBMIT"] = Number(getValCI(row, "USAHA_PRELIST_SUBMIT") || 0);
          mappedRow["JUMLAH_NONBKU_PRELIST"] = Number(getValCI(row, "JUMLAH_NONBKU_PRELIST") || 0);
          mappedRow["NONBKU_PRELIST_SUBMIT"] = Number(getValCI(row, "NONBKU_PRELIST_SUBMIT") || 0);
          mappedRow["JUMLAH_DUMMY"] = Number(getValCI(row, "JUMLAH_DUMMY") || 0);
          mappedRow["JUMLAH_USAHA_GENERAL_LINK"] = Number(getValCI(row, "JUMLAH_USAHA_GENERAL_LINK") || 0);
          mappedRow["USAHA_GENERAL_LINK_SUBMIT"] = Number(getValCI(row, "USAHA_GENERAL_LINK_SUBMIT") || 0);
          mappedRow["JUMLAH_KELUARGA_GENERAL_LINK"] = Number(getValCI(row, "JUMLAH_KELUARGA_GENERAL_LINK") || 0);
          mappedRow["KELUARGA_GENERAL_LINK_SUBMIT"] = Number(getValCI(row, "KELUARGA_GENERAL_LINK_SUBMIT") || 0);
          mappedRow["JUMLAH_ASSIGNMENT_BARU"] = Number(getValCI(row, "JUMLAH_ASSIGNMENT_BARU") || 0);
          mappedRow["JUMLAH_KELUARGA_BARU"] = Number(getValCI(row, "JUMLAH_KELUARGA_BARU") || 0);
          mappedRow["KELUARGA_BARU_SUBMIT"] = Number(getValCI(row, "KELUARGA_BARU_SUBMIT") || 0);
          mappedRow["JUMLAH_USAHA_BARU"] = Number(getValCI(row, "JUMLAH_USAHA_BARU") || 0);
          mappedRow["USAHA_BARU_SUBMIT"] = Number(getValCI(row, "USAHA_BARU_SUBMIT") || 0);
          mappedRow["JUMLAH_BARU_STATUS_DRAFT"] = Number(getValCI(row, "JUMLAH_BARU_STATUS_DRAFT") || 0);
        } else {
          mappedRow = row;
        }

        rows.push(mappedRow);
      }
      result[name] = rows;
    }
  });

  const outputString = JSON.stringify(result);

  try {
    cache.put("dashboardPayload", outputString, 21600);
  } catch (e) {
    Logger.log("Gagal menyimpan ke cache: " + e.toString());
  }

  return ContentService.createTextOutput(outputString).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ============================================================
// HELPER: Snapshot Baseline Harian Rekap Prelist SubSLS
// ============================================================
function recordPrelistBaseline(sheetName) {
  if (sheetName !== "Rekap Prelist SubSLS" && sheetName !== "Rekap Prelist SE2026 - SubSLS") {
    return "Skipped: baseline hanya dicatat untuk Rekap Prelist SubSLS.";
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = getSheetByNameCI(ss, sheetName);
  if (!sourceSheet) return "Error: Sheet sumber prelist tidak ditemukan.";

  const historySheetName = "History - Rekap Prelist SubSLS";
  let historySheet = getSheetByNameCI(ss, historySheetName);
  if (!historySheet) {
    historySheet = ss.insertSheet(historySheetName);
  }

  const sourceData = sourceSheet.getDataRange().getValues();
  if (sourceData.length < 2) {
    return "Error: Data sumber prelist kosong.";
  }

  const sourceHeaders = sourceData[0];
  const historyHeaders = ["Tanggal Baseline"].concat(sourceHeaders);

  const timestamp = Utilities.formatDate(
    new Date(),
    "Asia/Jakarta",
    "yyyy-MM-dd HH:mm:ss",
  );
  const todayDate = Utilities.formatDate(
    new Date(),
    "Asia/Jakarta",
    "yyyy-MM-dd",
  );

  const existingHistory = historySheet.getDataRange().getValues();
  let retainedRows = [];

  if (existingHistory.length >= 2) {
    for (let r = 1; r < existingHistory.length; r++) {
      const rowDate = String(existingHistory[r][0] || "").substring(0, 10);
      if (rowDate && rowDate !== todayDate) {
        retainedRows.push(existingHistory[r]);
      }
    }
  }

  const newRows = [];
  for (let s = 1; s < sourceData.length; s++) {
    newRows.push(["'" + timestamp].concat(sourceData[s]));
  }

  const finalRows = [historyHeaders].concat(retainedRows, newRows);
  historySheet.clear();
  historySheet
    .getRange(1, 1, finalRows.length, historyHeaders.length)
    .setValues(finalRows);

  const codeIdx = historyHeaders.findIndex(
    (h) => String(h).toLowerCase().replace(/[\s_-]/g, "") === "kodesubsls",
  );
  if (codeIdx > -1) {
    historySheet
      .getRange(2, codeIdx + 1, finalRows.length - 1, 1)
      .setNumberFormat("@");
  }

  return "OK: Baseline prelist harian berhasil disimpan (" + newRows.length + " baris).";
}

// ============================================================
// HELPER: Mengosongkan data sheet sebelum batch upload
// ============================================================
function clearSheetBeforeUpload(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByNameCI(ss, sheetName);
  if (!sheet && (sheetName === "Rekap Prelist SubSLS" || sheetName === "master-subsls" || sheetName === "Master SLS" || sheetName === "Sensus Ekonomi 2026" || sheetName === "Sensus Ekonomi 2026 - UB")) {
    sheet = ss.insertSheet(sheetName);
  }
  if (!sheet) return "Error: Sheet '" + sheetName + "' tidak ditemukan!";

  clearSheetData_(sheet);

  try {
    CacheService.getScriptCache().remove("dashboardPayload");
  } catch (e) {}

  return "OK";
}

function clearSheetData_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

// ============================================================
// PROSES CSV / EXCEL UPLOAD
// ============================================================
function processCSV(csvContent, sheetName, shouldClear) {
  if (shouldClear === undefined) shouldClear = true;

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var isPrelistSubSls = sheetName === "Rekap Prelist SubSLS" || sheetName === "Rekap Prelist SE2026 - SubSLS";
    var isMasterSubSls = sheetName === "master-subsls" || sheetName === "Master SLS" || sheetName === "Master - SubSLS";
    var sheet = getSheetByNameCI(ss, sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var csvData = Utilities.parseCsv(csvContent);
    if (csvData.length <= 1)
      return "Error: CSV kosong atau hanya berisi header.";

    var csvHeaders = csvData[0].map(function (h) {
      return h.trim();
    });
    
    var wilayahCsvIdx = -1;
    var validKeyPatterns = ["wilayah", "kode", "kodesubsls", "idsubsls", "kodekab", "kodekec", "kodedesa", "id", "sls", "nmsls", "no"];
    for (var i = 0; i < csvHeaders.length; i++) {
      var normH = csvHeaders[i].toLowerCase().replace(/[\s_-]/g, "");
      if (validKeyPatterns.indexOf(normH) > -1) {
        wilayahCsvIdx = i;
        break;
      }
    }

    if (wilayahCsvIdx === -1) {
      if (csvHeaders.length > 0) wilayahCsvIdx = 0;
      else return "Error: File tidak memiliki kolom valid.";
    }

    // Baca header yang sudah ada di sheet
    var lastCol = sheet.getLastColumn();
    var sheetHeaders =
      lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

    // Cek jika ada kolom baru di CSV yang belum ada di sheet
    var newColumnsAdded = false;
    for (var c = 0; c < csvHeaders.length; c++) {
      var headerName = csvHeaders[c].trim();
      if (headerName !== "") {
        var exists = false;
        var normHeaderName = headerName.toLowerCase().replace(/[\s_-]/g, "");
        for (var h = 0; h < sheetHeaders.length; h++) {
          if (
            sheetHeaders[h].toLowerCase().replace(/[\s_-]/g, "") ===
            normHeaderName
          ) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          sheetHeaders.push(headerName);
          newColumnsAdded = true;
        }
      }
    }

    // Tambahkan kolom 'Last Updated' jika belum ada
    if (!isPrelistSubSls && !isMasterSubSls && sheetHeaders.indexOf("Last Updated") === -1) {
      sheetHeaders.push("Last Updated");
      newColumnsAdded = true;
    }

    if (newColumnsAdded) {
      sheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]);
    }

    if (shouldClear) {
      clearSheetData_(sheet);
    }

    var startRow = shouldClear ? 2 : Math.max(2, sheet.getLastRow() + 1);

    var timestamp = Utilities.formatDate(
      new Date(),
      "Asia/Jakarta",
      "yyyy-MM-dd HH:mm:ss",
    );
    var rowsToWrite = [];

    for (var j = 1; j < csvData.length; j++) {
      var csvRow = csvData[j];
      var wilayahVal = String(csvRow[wilayahCsvIdx]).trim();
      if (!wilayahVal) continue;

      var newRowData = [];
      for (var col = 0; col < sheetHeaders.length; col++) {
        var headerName = sheetHeaders[col];
        if (headerName === "Last Updated") {
          newRowData.push("'" + timestamp);
        } else {
          var csvIdx = -1;
          var normHeaderName = headerName.toLowerCase().replace(/[\s_-]/g, "");
          for (var c = 0; c < csvHeaders.length; c++) {
            if (
              csvHeaders[c].toLowerCase().replace(/[\s_-]/g, "") ===
              normHeaderName
            ) {
              csvIdx = c;
              break;
            }
          }
          if (csvIdx > -1) {
            newRowData.push(csvRow[csvIdx]);
          } else {
            newRowData.push("");
          }
        }
      }
      rowsToWrite.push(newRowData);
    }

    // Format kolom teks identifier seperti KODE_SUB_SLS
    if (rowsToWrite.length > 0) {
      sheetHeaders.forEach(function(hName, hIdx) {
        var normH = String(hName).toLowerCase().replace(/[\s_-]/g, "");
        if (normH === "kodesubsls" || normH === "kode" || normH === "wilayah" || normH === "idsubsls" || normH === "idkec") {
          sheet.getRange(startRow, hIdx + 1, rowsToWrite.length, 1).setNumberFormat("@");
        }
      });

      sheet
        .getRange(startRow, 1, rowsToWrite.length, sheetHeaders.length)
        .setValues(rowsToWrite);
    }

    try {
      CacheService.getScriptCache().remove("dashboardPayload");
    } catch (cacheErr) {
      Logger.log("Gagal menghapus cache dashboard setelah upload: " + cacheErr);
    }

    var pesan =
      "Sukses! " +
      rowsToWrite.length +
      " baris data ditambahkan ke [" +
      sheetName +
      "].";
    if (shouldClear) pesan += " (Sheet dikosongkan terlebih dahulu).";
    if (newColumnsAdded)
      pesan += " (Ada penambahan kolom baru).";

    return pesan;
  } catch (error) {
    return "Error memproses data: " + error.toString();
  }
}

// ============================================================
// HELPER UTILITIES
// ============================================================
function getSheetByNameCI(ss, name) {
  if (!ss || !name) return null;
  var sheets = ss.getSheets();
  var normName = name.toLowerCase().replace(/[\s_-]/g, "");
  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName();
    if (sName.toLowerCase().replace(/[\s_-]/g, "") === normName) {
      return sheets[i];
    }
  }
  return null;
}

function getValCI(obj, key) {
  if (!obj || !key) return undefined;
  var normKey = String(key)
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  for (var k in obj) {
    if (
      String(k)
        .toLowerCase()
        .replace(/[\s_-]/g, "") === normKey
    ) {
      return obj[k];
    }
  }
  return undefined;
}

function sanitizeSheetName(name) {
  if (!name) return "Sheet1";
  var clean = name.replace(/[\\\/\?\*\:\[\]]/g, "");
  clean = clean.trim();
  if (clean.length > 99) {
    clean = clean.substring(0, 99);
  }
  return clean || "Sheet1";
}

// ============================================================
// MENU CUSTOM GOOGLE SPREADSHEET (NAVIGASI DASHBOARD SE)
// ============================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Dashboard SE')
    .addItem('Upload Data (CSV / Excel)', 'openUploadDialog')
    .addSeparator()
    .addItem('Hitung Kenaikan Harian Manual', 'recordDailyProgressManual')
    .addItem('Catat Baseline Prelist SubSLS Manual', 'recordPrelistBaselineManual')
    .addSeparator()
    .addItem('Hapus Cache Web Dashboard', 'clearDashboardCacheManual')
    .addToUi();
}

function openUploadDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Upload')
    .setWidth(580)
    .setHeight(520)
    .setTitle('Upload Data Dashboard SE2026');
  SpreadsheetApp.getUi().showModalDialog(html, 'Upload Data Dashboard SE2026');
}

function recordDailyProgressManual() {
  var res = recordDailyProgress();
  SpreadsheetApp.getUi().alert(
    'Selesai! Kenaikan harian berhasil dihitung.\n' +
    'UMKM diperbarui: ' + (res.umkm ? 'Ya' : 'Tidak') + '\n' +
    'UB diperbarui: ' + (res.ub ? 'Ya' : 'Tidak') + '\n' +
    'Waktu: ' + res.timestamp
  );
}

function recordPrelistBaselineManual() {
  var msg = recordPrelistBaseline('Rekap Prelist SubSLS');
  SpreadsheetApp.getUi().alert(msg);
}

function clearDashboardCacheManual() {
  try {
    CacheService.getScriptCache().remove('dashboardPayload');
    SpreadsheetApp.getUi().alert('Sukses! Cache dashboard berhasil dibersihkan.');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Gagal membersihkan cache: ' + e.toString());
  }
}

