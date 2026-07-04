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
  const today = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");

  // --- UMKM (Sekarang baca langsung dari Sensus Ekonomi 2026) ---
  calculateDaily(ss, {
    sourceSheet: "Sensus Ekonomi 2026",
    snapshotSheet: "snapshot-kemarin-umkm",
    dailySheet: "progress-harian-umkm",
    today: today
  });

  // --- UB (Sekarang baca langsung dari Sensus Ekonomi 2026 - UB) ---
  calculateDaily(ss, {
    sourceSheet: "Sensus Ekonomi 2026 - UB",
    snapshotSheet: "snapshot-kemarin-ub",
    dailySheet: "progress-harian-ub",
    today: today
  });

  Logger.log("✅ Kenaikan harian level KECAMATAN berhasil dihitung untuk tanggal: " + today);
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
  
  let latestPastDate = "";
  snapshotData.forEach(row => {
    let rowDate = String(row["Tanggal"] || "").trim();
    // Hanya ambil tanggal yang lebih kecil dari hari ini
    if (rowDate && rowDate < config.today && rowDate > latestPastDate) {
      latestPastDate = rowDate;
    }
  });

  const snapshotMap = {};
  snapshotData.forEach(row => {
    let rowDate = String(row["Tanggal"] || "").trim();
    // Baca baris jika tanggalnya cocok dengan latestPastDate (atau kosong untuk kompatibilitas data lama)
    if (!rowDate || rowDate === latestPastDate) {
      snapshotMap[String(row["Wilayah"]).trim()] = Number(row["Submit"] || row["Submit Kemarin"] || 0);
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

  // 4. Hitung kenaikan = today - kemarin
  // 5. Update sheet progress-harian-*
  const dailyHeaders = ["Wilayah", "Nama Wilayah", "Kenaikan Harian", "Tanggal Update"];
  const dailyRows = allKodes.map(kode => {
    const submitToday = todayMap[kode].submit || 0;
    const submitKemarin = snapshotMap[kode] || 0;
    const kenaikan = Math.max(0, submitToday - submitKemarin);
    return [kode, wilayahNames[kode], kenaikan, config.today];
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
    return [config.today, kode, vals.submit, vals.open, vals.draft];
  });

  if (snapshot.getLastRow() === 0) {
    snapshot.getRange(1, 1, 1, snapshotHeaders.length).setValues([snapshotHeaders]);
  }
  
  if (snapshotRows.length > 0) {
    const lastRow = snapshot.getLastRow();
    snapshot.getRange(lastRow + 1, 1, snapshotRows.length, snapshotHeaders.length).setValues(snapshotRows);
  }
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
      .addItem('Hitung Kenaikan Harian Manual', 'recordDailyProgress')
      .addToUi();
}

function openUploadDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Upload')
      .setWidth(400)
      .setHeight(250)
      .setTitle('Upload CSV - Data Kecamatan');
  SpreadsheetApp.getUi().showModalDialog(html, 'Upload Data Kecamatan');
}

function processCSV(csvContent, sheetName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) return "Error: Sheet dengan nama '" + sheetName + "' tidak ditemukan!";

    var csvData = Utilities.parseCsv(csvContent);
    if (csvData.length <= 1) return "Error: CSV kosong atau hanya berisi header.";

    var csvHeaders = csvData[0];
    var wilayahCsvIdx = csvHeaders.indexOf("Wilayah");
    
    if (wilayahCsvIdx === -1) return "Error: Kolom 'Wilayah' tidak ditemukan pada CSV.";

    var sheetData = sheet.getDataRange().getValues();
    var sheetHeaders = sheetData[0]; 
    
    var newColumnsAdded = false;
    for (var c = 0; c < csvHeaders.length; c++) {
      var headerName = csvHeaders[c].trim();
      if (headerName !== "" && sheetHeaders.indexOf(headerName) === -1) {
        sheetHeaders.push(headerName);
        newColumnsAdded = true;
      }
    }
    
    if (newColumnsAdded) {
      sheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]);
      for (var r = 0; r < sheetData.length; r++) {
        while (sheetData[r].length < sheetHeaders.length) {
          sheetData[r].push("");
        }
      }
    }

    var wilayahSheetIdx = sheetHeaders.indexOf("Wilayah");
    var sheetWilayahMap = {};
    for (var i = 1; i < sheetData.length; i++) {
      var rowWilayah = String(sheetData[i][wilayahSheetIdx]).trim();
      if (rowWilayah !== "") sheetWilayahMap[rowWilayah] = i; 
    }

    var rowsToAppend = [];

    for (var j = 1; j < csvData.length; j++) {
      var csvRow = csvData[j];
      var wilayahVal = String(csvRow[wilayahCsvIdx]).trim();
      if (!wilayahVal) continue; 

      var newRowData = [];
      for (var col = 0; col < sheetHeaders.length; col++) {
        var headerName = sheetHeaders[col];
        var csvIdx = csvHeaders.indexOf(headerName);
        if (csvIdx > -1) {
          newRowData.push(csvRow[csvIdx]);
        } else {
          newRowData.push(""); 
        }
      }

      if (sheetWilayahMap.hasOwnProperty(wilayahVal)) {
        var rowIdx = sheetWilayahMap[wilayahVal]; 
        var existingRow = sheetData[rowIdx];
        for (var c = 0; c < sheetHeaders.length; c++) {
          if (newRowData[c] === "") newRowData[c] = existingRow[c]; 
        }
        // Update di dalam memory array (batching) untuk menghindari ratusan API Call
        sheetData[rowIdx] = newRowData;
      } else {
        rowsToAppend.push(newRowData);
      }
    }

    // TULIS KEMBALI baris yang diperbarui secara BATCHING (jauh lebih cepat dan hemat Kuota Google)
    sheet.getRange(1, 1, sheetData.length, sheetHeaders.length).setValues(sheetData);

    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, sheetHeaders.length).setValues(rowsToAppend);
    }
    
    var pesan = "Sukses! Data [" + sheetName + "] berhasil diperbarui.";
    if (newColumnsAdded) pesan += " (Ada penambahan kolom baru).";
    
    return pesan;

  } catch (error) {
    return "Error memproses data: " + error.toString();
  }
}
