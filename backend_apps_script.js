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
    today: today,
    timestamp: lastEditTimestamp
  });

  // --- UB (Sekarang baca langsung dari Sensus Ekonomi 2026 - UB) ---
  const ubChanged = calculateDaily(ss, {
    sourceSheet: "Sensus Ekonomi 2026 - UB",
    snapshotSheet: "snapshot-kemarin-ub",
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
  // [MODIFIED] Menggunakan getSheetByNameCI agar aman dari perbedaan huruf besar/kecil & spasi
  const source = getSheetByNameCI(ss, config.sourceSheet);
  const snapshot = getSheetByNameCI(ss, config.snapshotSheet);

  if (!source || !snapshot) {
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
    // [MODIFIED] Menggunakan getValCI agar pembacaan kolom Tanggal kebal perbedaan huruf/spasi
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
    // [MODIFIED] Menggunakan getValCI untuk pembacaan kolom snapshot
    let rowDate = getDateString(getValCI(row, "Tanggal"));
    let kode = String(getValCI(row, "Wilayah") || "").trim();
    let vals = {
      submit: Number(getValCI(row, "Submit") || getValCI(row, "Submit Kemarin") || 0),
      open: Number(getValCI(row, "Open") || 0),
      draft: Number(getValCI(row, "Draft") || 0)
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
    // [MODIFIED] Menggunakan getValCI untuk kebal casing kolom Wilayah dan nama kecamatan
    const kode = String(getValCI(row, "Wilayah") || "").trim();
    if (!kode) return;
    
    // Simpan nama wilayah untuk dipakai di laporan
    wilayahNames[kode] = getValCI(row, "Nama Wilayah") || getValCI(row, "Kecamatan") || getValCI(row, "Nama") || getValCI(row, "nama") || getValCI(row, "NMKEC") || "-";

    let totalSubmit = 0;
    SUBMIT_FIELDS.forEach(field => {
      totalSubmit += Number(getValCI(row, field) || 0);
    });
    
    todayMap[kode] = {
      submit: totalSubmit,
      open: Number(getValCI(row, "OPEN") || getValCI(row, "Open") || 0),
      draft: Number(getValCI(row, "DRAFT") || getValCI(row, "Draft") || 0)
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
  // (Penulisan ke sheet progress-harian-* sudah dihapus karena data dikalkulasi di frontend)

  // 5. Update snapshot history = submit, open, draft hari ini
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
    // [MODIFIED] Menggunakan getSheetByNameCI agar aman dari perbedaan huruf besar/kecil & spasi
    const sheet = getSheetByNameCI(ss, name);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = {};
        headers.forEach((h, j) => {
          row[h] = data[i][j];
        });
        
        // [MODIFIED] Map data agar kunci propertinya persis seperti yang diharapkan oleh index.html
        var mappedRow = {};
        if (name === "target-wilayah") {
          mappedRow["Wilayah"] = getValCI(row, "Wilayah") || getValCI(row, "kode");
          mappedRow["Target UMKM"] = getValCI(row, "Target UMKM") || getValCI(row, "TARGET UMKM");
          mappedRow["Target UB"] = getValCI(row, "Target UB") || getValCI(row, "TARGET UB");
          mappedRow["Target Keluarga"] = getValCI(row, "Target Keluarga") || getValCI(row, "TARGET KELUARGA");
          mappedRow["Nama Wilayah"] = getValCI(row, "Nama Wilayah") || getValCI(row, "nama");
        } else if (name === "snapshot-kemarin-umkm" || name === "snapshot-kemarin-ub") {
          mappedRow["Wilayah"] = getValCI(row, "Wilayah") || getValCI(row, "kode");
          mappedRow["Submit"] = getValCI(row, "Submit") || getValCI(row, "Submit Kemarin") || getValCI(row, "Submit_Kemarin") || 0;
          mappedRow["Open"] = getValCI(row, "Open") || 0;
          mappedRow["Draft"] = getValCI(row, "Draft") || 0;
          mappedRow["Tanggal"] = getValCI(row, "Tanggal") || "";
        } else if (name === "Sensus Ekonomi 2026" || name === "Sensus Ekonomi 2026 - UB") {
          mappedRow["Wilayah"] = getValCI(row, "Wilayah") || getValCI(row, "kode");
          mappedRow["OPEN"] = getValCI(row, "OPEN") || getValCI(row, "Open") || 0;
          mappedRow["DRAFT"] = getValCI(row, "DRAFT") || getValCI(row, "Draft") || 0;
          SUBMIT_FIELDS.forEach(function(field) {
            mappedRow[field] = getValCI(row, field) || 0;
          });
        } else if (name === "master-kec") {
          mappedRow["idkec"] = getValCI(row, "idkec") || getValCI(row, "id");
          mappedRow["nmkec"] = getValCI(row, "nmkec") || getValCI(row, "nama");
        } else {
          mappedRow = row;
        }
        
        rows.push(mappedRow);
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
      //.addItem('Upload CSV Data Kecamatan', 'openUploadDialog')
      //.addItem('Hitung Kenaikan Harian Manual', 'confirmRecordDailyProgress')
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
    // [MODIFIED] Menggunakan getSheetByNameCI agar aman dari perbedaan casing/spasi
    var sheet = getSheetByNameCI(ss, sName);
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
  // [MODIFIED] Menggunakan getSheetByNameCI agar aman dari casing/spasi
  var sheet = getSheetByNameCI(ss, sheetName);
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
    // [MODIFIED] Menggunakan getSheetByNameCI agar aman dari casing/spasi
    var sheet = getSheetByNameCI(ss, sheetName);
    
    if (!sheet) return "Error: Sheet dengan nama '" + sheetName + "' tidak ditemukan!";

    var csvData = Utilities.parseCsv(csvContent);
    if (csvData.length <= 1) return "Error: CSV kosong atau hanya berisi header.";

    // [MODIFIED] Map ke lowerCase trim agar pencarian kolom kebal terhadap spasi/huruf besar-kecil
    var csvHeaders = csvData[0].map(function(h) { return h.trim(); });
    var wilayahCsvIdx = -1;
    for (var i = 0; i < csvHeaders.length; i++) {
      var normH = csvHeaders[i].toLowerCase();
      if (normH === "wilayah" || normH === "kode") {
        wilayahCsvIdx = i;
        break;
      }
    }
    
    if (wilayahCsvIdx === -1) return "Error: Kolom 'Wilayah' tidak ditemukan pada CSV.";

    // Baca header yang sudah ada di sheet
    var lastCol = sheet.getLastColumn();
    var sheetHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    // Cek jika ada kolom baru di CSV yang belum ada di sheet
    var newColumnsAdded = false;
    for (var c = 0; c < csvHeaders.length; c++) {
      var headerName = csvHeaders[c].trim();
      if (headerName !== "") {
        // Cek secara case-insensitive
        var exists = false;
        var normHeaderName = headerName.toLowerCase().replace(/[\s_-]/g, "");
        for (var h = 0; h < sheetHeaders.length; h++) {
          if (sheetHeaders[h].toLowerCase().replace(/[\s_-]/g, "") === normHeaderName) {
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
          // [MODIFIED] Cari indeks kolom CSV secara case-insensitive & space-insensitive
          var csvIdx = -1;
          var normHeaderName = headerName.toLowerCase().replace(/[\s_-]/g, "");
          for (var c = 0; c < csvHeaders.length; c++) {
            if (csvHeaders[c].toLowerCase().replace(/[\s_-]/g, "") === normHeaderName) {
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

// ============================================================
// --- FUNGSI TAMBAHAN UNTUK INTEGRASI SCRAPER OTOMATIS ---
// ============================================================

/**
 * Menerima unggahan data otomatis dari Ekstensi Scraper.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var rawSheetName = data.sheetName || "Sheet1";
    
    // 1. Sanitasi nama sheet (Google Sheets melarang karakter: \ / ? * : [ ])
    var sheetName = sanitizeSheetName(rawSheetName);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetByNameCI(ss, sheetName);
    
    // 2. Jika tab dengan nama survey belum ada, buat baru secara otomatis
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // 3. Bersihkan seluruh isi tab tersebut agar diganti dengan data rekap terbaru
    sheet.clear();
    
    var rows = data.rows; // Array of { code, name, kabCode, kabName, lastUpdated, stats: { ... } }
    
    if (!rows || rows.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Tidak ada data rekapitulasi yang diterima."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. Kumpulkan seluruh kolom status secara dinamis dari data scraping
    var statusKeys = [];
    var seenKeys = {};
    for (var i = 0; i < rows.length; i++) {
      var stats = rows[i].stats;
      for (var key in stats) {
        if (!seenKeys[key]) {
          seenKeys[key] = true;
          statusKeys.push(key);
        }
      }
    }
    
    // Taruh metrik "total" di paling depan kolom status
    var totalIdx = statusKeys.indexOf("total");
    if (totalIdx > -1) {
      statusKeys.splice(totalIdx, 1);
      statusKeys.unshift("total");
    }
    
    // 5. Buat baris Header (Baris 1)
    var headers = ["Last Updated", "Wilayah", "Kecamatan", "Kabupaten"];
    for (var k = 0; k < statusKeys.length; k++) {
      headers.push(statusKeys[k]);
    }
    
    // 6. Siapkan kumpulan nilai baris
    var values = [headers];
    for (var i = 0; i < rows.length; i++) {
      var item = rows[i];
      var rowValues = [
        item.lastUpdated,
        item.code,
        item.name,
        item.kabName
      ];
      
      for (var k = 0; k < statusKeys.length; k++) {
        var key = statusKeys[k];
        rowValues.push(item.stats[key] !== undefined ? item.stats[key] : 0);
      }
      values.push(rowValues);
    }
    
    // 7. Tulis data ke sheet
    var range = sheet.getRange(1, 1, values.length, headers.length);
    range.setValues(values);
    
    // 8. Rapikan & Format Tipe Data Sel
    if (values.length > 1) {
      // Kode Wilayah diatur sebagai Plain Text agar tetap rapi (tidak memotong leading zero)
      sheet.getRange(2, 2, values.length - 1, 1).setNumberFormat("@");
      
      // Jumlah Metrik diatur sebagai Angka biasa dengan ribuan separator
      sheet.getRange(2, 5, values.length - 1, headers.length - 4).setNumberFormat("#,##0");
    }
    
    // 9. Berikan border halus (#e2e8f0) ke seluruh tabel data
    range.setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
    
    // 10. Terapkan styling premium pada Header (Baris 1)
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#f79039") // Oranye BPS Premium
               .setFontColor("#ffffff") // Teks putih
               .setFontWeight("bold")
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle");
                
    sheet.setRowHeight(1, 28); // Tinggi baris header longgar
    
    // 11. Atur Perataan Kolom (Alignment)
    if (values.length > 1) {
      // Kolom Tanggal & Wilayah di tengah (Center)
      sheet.getRange(2, 1, values.length - 1, 2).setHorizontalAlignment("center");
      // Kolom Kecamatan & Kabupaten rata kiri (Left)
      sheet.getRange(2, 3, values.length - 1, 2).setHorizontalAlignment("left");
      // Kolom angka rata kanan (Right)
      sheet.getRange(2, 5, values.length - 1, headers.length - 4).setHorizontalAlignment("right");
    }
    
    sheet.setFrozenRows(1); // Bekukan baris header
    
    // 12. Atur lebar kolom otomatis & berikan padding agar lega
    sheet.autoResizeColumns(1, headers.length);
    for (var col = 1; col <= headers.length; col++) {
      var currentWidth = sheet.getColumnWidth(col);
      sheet.setColumnWidth(col, currentWidth + 15); // Tambah 15px lebar ekstra
    }
    
    // 13. TRIGGER KALKULASI PROGRES HARIAN (Otomatis perbarui dashboard)
    // var calcMsg = "";
    // try {
    //   var calcResult = recordDailyProgress();
    //   calcMsg = " & Kalkulasi Kenaikan Harian Dashboard Berhasil.";
    // } catch (calcError) {
    //   Logger.log("Kalkulasi harian error: " + calcError.toString());
    //   calcMsg = " (Kalkulasi harian dilewati: " + calcError.toString() + ").";
    // }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Berhasil menulis " + rows.length + " baris data ke tab '" + sheetName + "'" + calcMsg,
      updatedCount: rows.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper: Mencari Sheet secara case-insensitive & mengabaikan spasi/simbol.
 */
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

/**
 * Helper: Mengambil properti objek secara case-insensitive & mengabaikan spasi/simbol.
 */
function getValCI(obj, key) {
  if (!obj || !key) return undefined;
  var normKey = String(key).toLowerCase().replace(/[\s_-]/g, "");
  for (var k in obj) {
    if (String(k).toLowerCase().replace(/[\s_-]/g, "") === normKey) {
      return obj[k];
    }
  }
  return undefined;
}

/**
 * Helper: Membersihkan nama sheet dari karakter ilegal.
 */
function sanitizeSheetName(name) {
  if (!name) return "Sheet1";
  var clean = name.replace(/[\\\/\?\*\:\[\]]/g, "");
  clean = clean.trim();
  if (clean.length > 99) {
    clean = clean.substring(0, 99);
  }
  return clean || "Sheet1";
}
