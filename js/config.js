// config.js — Konstanta, URL API, data awal, state variables

// URL Apps Script Web App Anda (Masukkan URL /exec Anda di sini)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyZCA2j8WkzRbpFm5qB0gKdfmQ12Omq-MxXY71XhiMcFnZ_LBcdrQgDW8smtXgzg4_57g/exec";

// Data Dashboard SE2026 Sumatera Barat (Nilai awal 0, diisi dinamis dari Apps Script)
const dashboardData = [
  { id: 1, kode: "1301", nama: "Kabupaten Kepulauan Mentawai", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 2, kode: "1302", nama: "Kabupaten Pesisir Selatan", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 3, kode: "1303", nama: "Kabupaten Solok", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 4, kode: "1304", nama: "Kabupaten Sijunjung", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 5, kode: "1305", nama: "Kabupaten Tanah Datar", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 6, kode: "1306", nama: "Kabupaten Padang Pariaman", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 7, kode: "1307", nama: "Kabupaten Agam", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 8, kode: "1308", nama: "Kabupaten Lima Puluh Kota", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 9, kode: "1309", nama: "Kabupaten Pasaman", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 10, kode: "1310", nama: "Kabupaten Solok Selatan", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 11, kode: "1311", nama: "Kabupaten Dharmasraya", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 12, kode: "1312", nama: "Kabupaten Pasaman Barat", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 13, kode: "1371", nama: "Kota Padang", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 14, kode: "1372", nama: "Kota Solok", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 15, kode: "1373", nama: "Kota Sawahlunto", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 16, kode: "1374", nama: "Kota Padang Panjang", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 17, kode: "1375", nama: "Kota Bukittinggi", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 18, kode: "1376", nama: "Kota Payakumbuh", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] },
  { id: 19, kode: "1377", nama: "Kota Pariaman", targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0, umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0, ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0, progress: 0, harianUmkm: 0, harianUb: 0, kecamatans: [] }
];

// Build overall Province summary (Default 0)
const sumData = {
  targetUmk: 0, targetUm: 0, targetUmkm: 0, targetUb: 0, targetKeluarga: 0,
  umkmOpen: 0, umkmDraft: 0, umkmApproved: 0, umkmSubmit: 0, umkmTotal: 0,
  ubOpen: 0, ubDraft: 0, ubApproved: 0, ubSubmit: 0, ubTotal: 0,
  progress: 0, harianUmkm: 0, harianUb: 0
};

// Global Sorting state
let currentSortColumn = null;
let isSortAsc = true;


// Charts references
let donutChart, progressChart, submitChart, dailyChart;

// ====== REKAP PRELIST & ASSIGNMENT BARU PER SUB SLS (HIERARKI 4 TINGKAT) ======
let prelistSubSlsData = [];
let prelistTreeData = [];
let expandedPrelistNodes = new Set();
let prelistBaselineDate = '';
let prelistBaselineByCode = new Map();
let masterSubSlsMap = new Map();
let masterDesaMap = new Map();
let masterKecMap = new Map();
let selectedKabPrelist = '';

const prelistPctKeys = ['klgPrelistPct', 'usahaPrelistPct', 'lainnyaPct', 'prelistPct', 'glKlgPct', 'glUsahaPct', 'klgBaruPct', 'usahaBaruPct', 'lainnyaBaruPct', 'assignPct', 'totalSemuaPct'];

const prelistNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const prelistPercent = (submitted, total) => {
  const denominator = prelistNumber(total);
  const sub = prelistNumber(submitted);
  if (denominator <= 0) return null;
  const pct = (sub / denominator) * 100;
  if (sub < denominator && pct >= 99.99) {
    return 99.99;
  }
  return pct;
};

// ====== STRATEGI 3: LocalStorage Caching di Browser ======
const DASHBOARD_CACHE_KEY = 'dashboardDataCache:v2';

const ALL_SUBMIT_FIELDS = [
  "SUBMITTED BY Pencacah", "APPROVED BY Pengawas", "SUBMITTED RESPONDENT",
  "EDITED BY Pengawas", "EDITED BY Admin Kabupaten", "COMPLETED BY Admin Kabupaten",
  "REJECTED BY Pengawas", "REJECTED BY Admin Kabupaten", "REVOKED BY Pengawas",
  "TOTAL_SUBMITTED_BY_PENCACAH", "TOTAL_APPROVED_BY_PENGAWAS", "TOTAL_SUBMITTED_RESPONDENT",
  "TOTAL_EDITED_BY_PENGAWAS", "TOTAL_EDITED_BY_ADMIN_KABUPATEN", "TOTAL_COMPLETED_BY_ADMIN_KABUPATEN",
  "TOTAL_REJECTED_BY_PENGAWAS", "TOTAL_REJECTED_BY_ADMIN_KABUPATEN", "TOTAL_REVOKED_BY_PENGAWAS",
  "TOTAL_REVOKED_BY_ADMIN_KABUPATEN", "Submit", "SUBMIT"
];


const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
