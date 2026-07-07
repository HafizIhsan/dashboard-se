// ============================================================
// KONFIGURASI
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
  "REVOKED BY Pengawas"
];

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
    lastEditTimestamp = Utilities.formatDate(lastUpdated, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  } catch (e) {
    const now = new Date();
    today = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
    lastEditTimestamp = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  }

  // --- UMKM (Sekarang baca langsung dari Sensus Ekonomi 2026) ---
  const umkmChanged = calculateDaily(ss, {
    sourceSheet: "Sensus Ekonomi 2026",
    snapshotSheet: "snapshot-kemarin-umkm",
    dailySheet: "progress-harian-umkm",
    today: today,
    timestamp: lastEditTimestamp
  });

  // --- UB (Sekarang baca langsung dari Sensus Ekonomi 2026 - UB) ---
  const ubChanged = calculateDaily(ss, {
    sourceSheet: "Sensus Ekonomi 2026 - UB",
    snapshotSheet: "snapshot-kemarin-ub",
    dailySheet: "progress-harian-ub",
    today: today,
    timestamp: lastEditTimestamp
  });

  Logger.log("✅ Kenaikan harian level KECAMATAN berhasil dihitung untuk tanggal: " + lastEditTimestamp);
  
  return {
    umkm: umkmChanged,
    ub: ubChanged,
    today: today,
    timestamp: lastEditTimestamp
  };
}

function calculateDaily(ss, config) {
  const source = ss.getSheetByName(config.sourceSheet);
  const snapshot = ss.getSheetByName(config.snapshotSheet);
  const daily = ss.getSheetByName(config.dailySheet);

  if (!source || !snapshot || !daily) {
    Logger.log("❌ Sheet tidak ditemukan: " + config.sourceSheet);
    return;
  }

  // 1. Baca data sumber kecamatan
  const sourceData = getSheetAsObjects(source);

  // 2. Baca snapshot kemarin (cari data dengan tanggal terbaru SEBELUM hari ini)
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

  snapshotData.forEach(row => {
    let rowDate = getDateString(row["Tanggal"]);
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
    let rowDate = getDateString(row["Tanggal"]);
    let kode = String(row["Wilayah"]).trim();
    let vals = {
      submit: Number(row["Submit"] || row["Submit Kemarin"] || 0),
      open: Number(row["Open"] || 0),
      draft: Number(row["Draft"] || 0)
    };

    // Baca baris jika tanggalnya cocok dengan latestPastDate (atau kosong untuk kompatibilitas data lama)
    if (!rowDate || rowDate === latestPastDate) {
      latestPastMap[kode] = vals;
    }
    
    // Baca baris jika tanggalnya adalah hari ini (untuk update/overwrite)
    if (rowDate === config.today) {
      currentTodaySnapshotMap[kode] = vals;
      if (firstRowToday === -1) firstRowToday = idx + 2; // +2 karena 0-index dan 1 baris header
    }
  });

  // 3. Hitung submit, open, draft hari ini per kecamatan
  const todayMap = {};
  const wilayahNames = {}; // Untuk menyimpan nama kecamatannya
  
  sourceData.forEach(row => {
    const kode = String(row["Wilayah"]).trim();
    if (!kode) return;
    
    // Simpan nama wilayah untuk dipakai di laporan
    wilayahNames[kode] = row["Nama Wilayah"] || row["Nama"] || row["nama"] || row["NMKEC"] || "-";

    let totalSubmit = 0;
    SUBMIT_FIELDS.forEach(field => {
      totalSubmit += Number(row[field] || 0);
    });
    
    todayMap[kode] = {
      submit: totalSubmit,
      open: Number(row["OPEN"] || 0),
      draft: Number(row["DRAFT"] || 0)
    };
  });

  const allKodes = Object.keys(todayMap); // Ambil semua kode unik kecamatan yang ada di data

  // Cek apakah ada perubahan data sama sekali (dibandingkan dengan snapshot terakhir yang tercatat)
  let hasChanges = false;
  const mapToCompare = hasTodaySnapshot ? currentTodaySnapshotMap : latestPastMap;

  for (let i = 0; i < allKodes.length; i++) {
    const kode = allKodes[i];
    const todayVals = todayMap[kode];
    const compVals = mapToCompare[kode] || { submit: 0, open: 0, draft: 0 };
    
    if (todayVals.submit !== compVals.submit || todayVals.open !== compVals.open || todayVals.draft !== compVals.draft) {
      hasChanges = true;
      break;
    }
  }

  if (!hasChanges) {
    Logger.log("⏩ Tidak ada perubahan data untuk " + config.sourceSheet + ", proses dilewati.");
    return false;
  }

  // 4. Hitung kenaikan = today - kemarin (selalu bandingkan dengan latestPastDate)
  // 5. Update sheet progress-harian-*
  const dailyHeaders = ["Wilayah", "Nama Wilayah", "Kenaikan Harian", "Tanggal Update"];
  const dailyRows = allKodes.map(kode => {
    const submitToday = todayMap[kode].submit || 0;
    const pastVals = latestPastMap[kode] || { submit: 0 };
    const submitKemarin = pastVals.submit || 0;
    const kenaikan = Math.max(0, submitToday - submitKemarin);
    return [kode, wilayahNames[kode], kenaikan, "'" + config.timestamp];
  });

  daily.clearContents();
  daily.getRange(1, 1, 1, dailyHeaders.length).setValues([dailyHeaders]);
  if (dailyRows.length > 0) {
    daily.getRange(2, 1, dailyRows.length, dailyHeaders.length).setValues(dailyRows);
  }

  // 6. Update snapshot history = submit, open, draft hari ini
  const snapshotHeaders = ["Tanggal", "Wilayah", "Submit", "Open", "Draft"];
  const snapshotRows = allKodes.map(kode => {
    const vals = todayMap[kode];
    return ["'" + config.timestamp, kode, vals.submit, vals.open, vals.draft];
  });

  if (snapshot.getLastRow() === 0) {
    snapshot.getRange(1, 1, 1, snapshotHeaders.length).setValues([snapshotHeaders]);
  }
  
  if (snapshotRows.length > 0) {
    if (firstRowToday !== -1) {
      // Overwrite data hari ini agar tidak menjadi double
      const lastRow = snapshot.getLastRow();
      const numRowsToClear = lastRow - firstRowToday + 1;
      if (numRowsToClear > 0) {
        snapshot.getRange(firstRowToday, 1, numRowsToClear, snapshotHeaders.length).clearContent();
      }
      snapshot.getRange(firstRowToday, 1, snapshotRows.length, snapshotHeaders.length).setValues(snapshotRows);
    } else {
      // Tambahkan data baru
      const lastRow = snapshot.getLastRow();
      snapshot.getRange(lastRow + 1, 1, snapshotRows.length, snapshotHeaders.length).setValues(snapshotRows);
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let lastUpdatedTime;
  try {
    const file = DriveApp.getFileById(ss.getId());
    lastUpdatedTime = Utilities.formatDate(file.getLastUpdated(), "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ssXXX");
  } catch (e) {
    lastUpdatedTime = new Date().toISOString();
  }

  // NOTE: progress-assignment-umkm dan progress-assignment-ub sudah DIHAPUS dari beban kirim!
  const sheetNames = [
    "target-wilayah",
    "snapshot-kemarin-umkm",
    "snapshot-kemarin-ub",
    "Sensus Ekonomi 2026",
    "Sensus Ekonomi 2026 - UB",
    "master-kec"
  ];
  
  const result = {
    lastUpdated: lastUpdatedTime
  };
  
  sheetNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = {};
        headers.forEach((h, j) => {
          row[h] = data[i][j];
        });
        rows.push(row);
      }
      
      result[name] = rows;
    }
  });
  
  // Return JSON yang sangat ringkas dan efisien ke web dashboard
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// --- KODE UNTUK UPLOAD CSV ---
// ============================================================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Dashboard SE')
      .addItem('Upload CSV Data Kecamatan', 'openUploadDialog')
      .addItem('Hitung Kenaikan Harian Manual', 'confirmRecordDailyProgress')
      .addItem('Setel Jadwal Otomatis (Setiap Malam)', 'createDailyTrigger')
      .addToUi();
}

function createDailyTrigger() {
  var ui = SpreadsheetApp.getUi();
  try {
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'recordDailyProgress') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    ScriptApp.newTrigger('recordDailyProgress')
      .timeBased()
      .atHour(23)
      .everyDays(1)
      .create();
      
    ui.alert('Sukses', 'Jadwal otomatis berhasil dibuat! Snapshot akan direkam otomatis setiap malam (antara pukul 23:00 - 24:00).', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error', 'Gagal membuat jadwal otomatis. Pastikan Anda memiliki izin yang cukup. Error: ' + e.message, ui.ButtonSet.OK);
  }
}

function confirmRecordDailyProgress() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Konfirmasi', 
    'Apakah Anda yakin ingin menghitung dan mencatat kenaikan harian sekarang?', 
    ui.ButtonSet.YES_NO
  );
  
  if (response == ui.Button.YES) {
    var result = recordDailyProgress();
    var msg = "Penghitungan selesai (Tanggal Data: " + result.timestamp + ").\n\n";
    msg += "• UMKM: " + (result.umkm ? "Diperbarui (Ada perubahan)" : "Dilewati (Tidak ada perubahan)") + "\n";
    msg += "• UB: " + (result.ub ? "Diperbarui (Ada perubahan)" : "Dilewati (Tidak ada perubahan)");
    
    ui.alert('Sukses', msg, ui.ButtonSet.OK);
  }
}

function openUploadDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Upload')
      .setWidth(400)
      .setHeight(250)
      .setTitle('Upload CSV - Data Kecamatan');
  SpreadsheetApp.getUi().showModalDialog(html, 'Upload Data Kecamatan');
}

/**
 * Proses BATCH upload: terima array of {csvContent, sheetName}.
 * Clear data HANYA SEKALI per sheet di awal, lalu append semua file CSV.
 * Dipanggil dari Upload.html.
 */
function processMultipleCSV(filesArray) {
  var results = [];
  
  // Kelompokkan file berdasarkan sheetName agar clear per sheet hanya 1x
  var grouped = {};
  for (var i = 0; i < filesArray.length; i++) {
    var sheetName = filesArray[i].sheetName;
    if (!grouped[sheetName]) grouped[sheetName] = [];
    grouped[sheetName].push(filesArray[i].csvContent);
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  for (var sName in grouped) {
    var sheet = ss.getSheetByName(sName);
    if (!sheet) {
      results.push("Error: Sheet dengan nama '" + sName + "' tidak ditemukan!");
      continue;
    }
    
    // CLEAR DATA SEKALI SAJA untuk sheet ini
    clearSheetData_(sheet);
    
    // Proses setiap file CSV (mode append, tanpa clear)
    var csvContents = grouped[sName];
    for (var f = 0; f < csvContents.length; f++) {
      var msg = processCSV(csvContents[f], sName, false); // false = jangan clear lagi
      results.push(msg);
    }
  }
  
  return results;
}

/**
 * Helper: Kosongkan seluruh isi data di bawah header (baris 2 ke bawah).
 * Dipanggil sekali sebelum batch upload.
 */
function clearSheetData_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

/**
 * Fungsi PUBLIK: Dipanggil dari Upload.html SEKALI sebelum loop upload.
 * Mengosongkan seluruh isi data sheet (baris 2 ke bawah), mempertahankan header.
 * @param {string} sheetName - Nama sheet yang akan dikosongkan.
 */
function clearSheetBeforeUpload(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return "Error: Sheet '" + sheetName + "' tidak ditemukan!";
  clearSheetData_(sheet);
  return "OK";
}

/**
 * Proses satu file CSV ke sheet.
 * @param {string} csvContent - Isi CSV sebagai string.
 * @param {string} sheetName - Nama sheet tujuan.
 * @param {boolean} [shouldClear=true] - Jika true, kosongkan sheet dulu (mode lama/single file).
 *                                        Jika false, append ke baris berikutnya (mode batch).
 */
function processCSV(csvContent, sheetName, shouldClear) {
  // Default: clear data (backward compatible jika dipanggil langsung dengan 2 argumen)
  if (shouldClear === undefined) shouldClear = true;
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) return "Error: Sheet dengan nama '" + sheetName + "' tidak ditemukan!";

    var csvData = Utilities.parseCsv(csvContent);
    if (csvData.length <= 1) return "Error: CSV kosong atau hanya berisi header.";

    var csvHeaders = csvData[0];
    var wilayahCsvIdx = csvHeaders.indexOf("Wilayah");
    
    if (wilayahCsvIdx === -1) return "Error: Kolom 'Wilayah' tidak ditemukan pada CSV.";

    // Baca header yang sudah ada di sheet
    var lastCol = sheet.getLastColumn();
    var sheetHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    // Cek jika ada kolom baru di CSV yang belum ada di sheet
    var newColumnsAdded = false;
    for (var c = 0; c < csvHeaders.length; c++) {
      var headerName = csvHeaders[c].trim();
      if (headerName !== "" && sheetHeaders.indexOf(headerName) === -1) {
        sheetHeaders.push(headerName);
        newColumnsAdded = true;
      }
    }

    // Tambahkan kolom 'Last Updated' jika belum ada
    if (sheetHeaders.indexOf("Last Updated") === -1) {
      sheetHeaders.push("Last Updated");
      newColumnsAdded = true;
    }
    
    // Jika ada kolom baru, perbarui header di sheet
    if (newColumnsAdded) {
      sheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]);
    }

    // Clear data HANYA jika shouldClear = true (mode single file / legacy)
    if (shouldClear) {
      clearSheetData_(sheet);
    }

    // Tentukan baris awal untuk menulis data
    // Jika mode append: tulis setelah data yang sudah ada
    var startRow = shouldClear ? 2 : Math.max(2, sheet.getLastRow() + 1);

    // Dapatkan timestamp waktu sekarang (Asia/Jakarta)
    var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var rowsToWrite = [];

    // Map setiap baris CSV sesuai urutan kolom pada sheetHeaders
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
          var csvIdx = csvHeaders.indexOf(headerName);
          if (csvIdx > -1) {
            newRowData.push(csvRow[csvIdx]);
          } else {
            newRowData.push(""); 
          }
        }
      }
      rowsToWrite.push(newRowData);
    }

    // Tulis data baru secara BATCHING
    if (rowsToWrite.length > 0) {
      sheet.getRange(startRow, 1, rowsToWrite.length, sheetHeaders.length).setValues(rowsToWrite);
    }
    
    var pesan = "Sukses! " + rowsToWrite.length + " baris data ditambahkan ke [" + sheetName + "].";
    if (shouldClear) pesan += " (Sheet dikosongkan terlebih dahulu).";
    if (newColumnsAdded) pesan += " (Ada penambahan kolom baru / kolom 'Last Updated').";
    
    return pesan;

  } catch (error) {
    return "Error memproses data: " + error.toString();
  }
}
