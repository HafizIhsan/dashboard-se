# 📊 Dashboard Monitoring Harian SE2026 | BPS Provinsi Sumatera Barat

Command Center / Dashboard monitoring progres harian **Sensus Ekonomi 2026 (SE2026)** untuk Badan Pusat Statistik (BPS) Provinsi Sumatera Barat. Aplikasi ini mengusung desain premium, bersih, responsif, dan interaktif (mendukung mode gelap dan terang) guna memudahkan pemantauan kinerja pendataan di lapangan secara real-time.

---

## 🏗️ Arsitektur & Teknologi Sistem

Sistem ini didesain menggunakan arsitektur **Serverless** yang efisien dan hemat biaya:
1. **Frontend (SPA)**:
   - **HTML5 & CSS3**: Struktur dasar dan desain antarmuka kustom (*impeccable plinth design* dengan *grain overlay*).
   - **TailwindCSS (via CDN)**: Utility-first CSS framework untuk penataan layouting yang fleksibel dan responsif.
   - **ApexCharts**: Library grafik interaktif untuk visualisasi progres dan tren kenaikan harian.
   - **SheetJS (xlsx.full.min.js)**: Untuk pembacaan data spreadsheet pendukung jika diperlukan di sisi klien.
2. **Backend & Database**:
   - **Google Sheets**: Berperan sebagai database utama penyimpanan data rekapitulasi wilayah (Kecamatan) dan rekap petugas.
   - **Google Apps Script (GAS)**: Berfungsi sebagai *middleware* atau REST API Serverless.
     - `doGet`: Melayani permintaan data dari frontend dashboard dengan optimasi **Cache Service** (~50ms respon).
     - `doPost`: Menerima kiriman data hasil scraping otomatis (*push data*) dari ekstensi scraper (Chrome Extension / Python).
     - **Time-based Triggers**: Perekaman snapshot harian otomatis setiap malam (pukul 23:00 - 24:00) untuk menghitung kenaikan harian.

---

## 🌟 Fitur Utama

- **Command Center Dashboard**: Visualisasi ringkas prelist awal (UMKM, UB, Keluarga), assignment aplikasi Fasih BPS, serta akumulasi progres submit.
- **Dua Metode Penghitungan Progres**:
  - **Mode Fasih**: Menghitung progres berdasarkan total target assignment pada aplikasi Fasih.
  - **Mode Target Wilayah**: Menghitung progres terhadap target riil dokumen/prelist awal di wilayah tersebut.
- **Visualisasi Grafik ApexCharts**:
  - Donut Chart untuk komposisi status dokumen (Submit, Open, Draft).
  - Bar Chart progres akumulatif per Kabupaten/Kota (diurutkan dari progres tertinggi).
  - Bar Chart kenaikan harian per Kabupaten/Kota untuk memantau kecepatan entri harian.
- **Tabel Progres Interaktif**: Tabel rekapitulasi kabupaten/kota yang dapat diekspansi untuk menampilkan detail progres kecamatan di bawahnya. Dilengkapi fitur *sorting* dinamis pada kolom Wilayah dan Progres.
- **Monitoring Kinerja Petugas (PML & PCL)**:
  - Tab terpisah untuk memantau detail beban kerja dan status dokumen di bawah tanggung jawab **Pengawas (PML)** dan **Pencacah (PCL)**.
  - Dropdown filter berdasarkan Kabupaten/Kota dan bilah pencarian nama petugas.
  - Detail area kerja petugas yang dapat diekspansi (dropdown wilayah tugas).
  - Pagination dinamis (10 baris per halaman) untuk performa rendering tabel yang cepat.
- **Mekanisme Caching (GAS CacheService)**: Mengurangi beban baca ke Google Spreadsheet dengan menyimpan cache JSON data selama 10 menit, membuat pemuatan dashboard terasa sangat instan.
- **Sistem Pengunggah CSV Batch**: Fitur unggah file CSV di dalam Google Sheets untuk impor data secara bertahap tanpa mengosongkan data yang baru masuk (*append mode*).

---

## 📂 Struktur Berkas

- **`index.html`**: Antarmuka pengguna utama dashboard monitoring. Menampilkan bagan, metrik, tabel progres kabupaten/kecamatan, dan tabel kinerja petugas.
- **`backend_apps_script.js`**: Kode sumber Google Apps Script yang dipasang pada editor naskah spreadsheet pendukung.
- **`Upload.html`**: Antarmuka modal dialog yang digunakan oleh pengguna di dalam Google Sheets untuk mengunggah berkas CSV secara manual.

---

## 💾 Struktur Tabel & Spreadsheet (Database)

Google Spreadsheet database harus memiliki tab-tab dengan nama dan kolom berikut (case-insensitive & space-insensitive pada pencarian Apps Script):

### 1. `target-wilayah`
Menyimpan target riil sensus untuk masing-masing kabupaten.
*   **Kolom Wajib**: `Wilayah` (Kode Kab), `Target UMKM`, `Target UB`, `Target Keluarga`, `Nama Wilayah`

### 2. `master-kec` & `master-subsls`
Data master wilayah untuk pemetaan nama kecamatan dan sub-SLS.
*   `master-kec`: `idkec`, `nmkec`
*   `master-subsls`: `idsubsls`, `nmsls`

### 3. `Sensus Ekonomi 2026` & `Sensus Ekonomi 2026 - UB`
Tabel utama hasil pengumpulan data level wilayah untuk UMKM dan Usaha Besar (UB).
*   **Kolom Wajib**: `Wilayah` (Kode Kec/Kab), `OPEN`, `DRAFT`, dan kolom status submit:
    *   `SUBMITTED BY Pencacah`, `APPROVED BY Pengawas`, `SUBMITTED RESPONDENT`, `EDITED BY Pengawas`, `EDITED BY Admin Kabupaten`, `COMPLETED BY Admin Kabupaten`, `REJECTED BY Pengawas`, `REJECTED BY Admin Kabupaten`, `REVOKED BY Pengawas`

### 4. `Sensus Ekonomi 2026 - Rekap Petugas`
Tabel hasil pengumpulan data/scraping rekap petugas di lapangan.
*   **Kolom Wajib**: `Wilayah` (Kode SLS/Sub-SLS), `Pengawas`, `Pencacah`, dan kolom status dokumen (misal `OPEN`, `DRAFT`, `SUBMITTED BY Pencacah`, dll.).

### 5. `snapshot-kemarin-umkm` & `snapshot-kemarin-ub`
Menyimpan data historis harian level kecamatan untuk menghitung delta kenaikan harian.
*   **Kolom Wajib**: `Tanggal`, `Wilayah`, `Submit`, `Open`, `Draft`

### 6. `Snapshot - Petugas`
Menyimpan snapshot harian performa petugas (retensi otomatis 5 hari terakhir). Diperbarui secara otomatis oleh fungsi trigger.

---

## 🚀 Petunjuk Instalasi & Deployment

### Langkah 1: Persiapan Google Spreadsheet
1. Buat Google Spreadsheet baru.
2. Buat tab-tab sheet sesuai dengan nama yang tercantum pada bagian **Struktur Tabel** di atas.

### Langkah 2: Memasang Google Apps Script
1. Di Google Sheets, buka menu **Extensions** > **Apps Script**.
2. Hapus kode bawaan di berkas `Code.gs`, lalu salin seluruh isi berkas [backend_apps_script.js](file:///d:/BPS/2.%20IPDS/10.%20Ngibar%20UB%20SE%202026/06.%20Scrapper%20Dashboard%20Progres%20SE/dashboard-se/backend_apps_script.js) ke dalamnya. Ganti nama berkas menjadi `Code.gs`.
3. Buat file baru di Apps Script dengan tipe **HTML**, beri nama `Upload`. Salin seluruh isi berkas [Upload.html](file:///d:/BPS/2.%20IPDS/10.%20Ngibar%20UB%20SE%202026/06.%20Scrapper%20Dashboard%20Progres%20SE/dashboard-se/Upload.html) ke dalamnya.
4. Klik tombol **Save** (ikon disket).

### Langkah 3: Deploy sebagai Web App
1. Di editor Apps Script, klik tombol **Deploy** di kanan atas > **New deployment**.
2. Pilih tipe deployment **Web app** (klik ikon gerigi jika belum ada pilihan).
3. Isi deskripsi deployment (misalnya `v1.0.0`).
4. Setel konfigurasi berikut:
   - **Execute as**: `Me (email-anda@gmail.com)`
   - **Who has access**: `Anyone` (Penting agar dashboard frontend dapat membaca API).
5. Klik **Deploy** dan setujui izin akses (*Authorize Access*) dengan akun Google Anda.
6. Salin **Web app URL** yang muncul (misalnya: `https://script.google.com/macros/s/.../exec`).

### Langkah 4: Menghubungkan Frontend Dashboard
1. Buka berkas [index.html](file:///d:/BPS/2.%20IPDS/10.%20Ngibar%20UB%20SE%202026/06.%20Scrapper%20Dashboard%20Progres%20SE/dashboard-se/index.html) menggunakan editor teks Anda.
2. Cari variabel `APPS_SCRIPT_URL` pada baris **843**:
   ```javascript
   const APPS_SCRIPT_URL = "URL_WEB_APP_ANDA_DISINI";
   ```
3. Ganti nilainya dengan **Web app URL** yang Anda salin pada Langkah 3.
4. Simpan berkas `index.html`.

### Langkah 5: Setel Jadwal Otomatis (Trigger Snapshot)
1. Muat ulang halaman Google Sheets Anda. Menu baru bernama **`Dashboard SE`** akan muncul di bilah menu atas.
2. Klik **`Dashboard SE`** > **`Setel Jadwal Otomatis (Setiap Malam)`**.
3. Sistem akan membuat *time-based trigger* yang secara otomatis merekam progres harian setiap malam antara pukul 23:00 - 24:00 WIB ke sheet snapshot.

---

## 🔌 Integrasi Ekstensi Scraper (doPost API)

Untuk mengirimkan data secara otomatis dari scraper eksternal, lakukan HTTP POST request ke `APPS_SCRIPT_URL` dengan format payload JSON berikut:

```json
{
  "sheetName": "Sensus Ekonomi 2026",
  "scrapeType": "progress", 
  "rows": [
    {
      "code": "1301010",
      "name": "Kecamatan Siberut Barat",
      "kabName": "Kabupaten Kepulauan Mentawai",
      "stats": {
        "total": 120,
        "OPEN": 15,
        "DRAFT": 5,
        "SUBMITTED BY Pencacah": 80,
        "APPROVED BY Pengawas": 20
      }
    }
  ]
}
```
*Catatan*: Jika `scrapeType` diset ke `'petugas'`, data akan diproses dan dimasukkan ke sheet petugas tanpa kolom nama kecamatan.

---

## 🛠️ Pemeliharaan & Tips Troubleshooting

- **Payload Terlalu Besar (Cache Fail)**: `CacheService` milik Google memiliki batasan ukuran data maksimal 100KB per kunci. Jika total data rekap Anda melebihi limit ini, log Apps Script akan menampilkan peringatan. Sistem akan otomatis melompati cache dan mengambil data langsung dari Spreadsheet (tetap berjalan normal, namun pemuatan di awal akan memerlukan waktu 3-5 detik).
- **Perubahan Struktur Kolom**: Jika Anda mengubah nama kolom status di lapangan (misal menambah status baru di aplikasi Fasih), backend Apps Script dirancang secara dinamis mendeteksi kolom baru tersebut selama namanya didaftarkan di variabel `predefinedOrder` atau masuk ke dalam objek data scraping.
- **Reset Cache Manual**: Anda dapat mereset cache secara paksa dengan memanggil ulang pengunggahan data atau memicu fungsi `recordDailyProgress` secara manual dari menu spreadsheet.

---

BPS Provinsi Sumatera Barat — *Providing Quality Statistical Data for Better Decision Making.*
📊 **SE2026**: Kunci Informasi Ekonomi Indonesia.
