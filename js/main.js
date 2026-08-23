// main.js

// ====== Loading Overlay Controller (Clean & Minimal with Progress) ======
let loadingProgressTimer = null;
let currentLoadingPct = 0;

function setLoadingProgress(pct, text) {
  currentLoadingPct = Math.min(100, Math.max(0, pct));
  const pctEl = document.getElementById('loading-pct');
  const barEl = document.getElementById('loading-bar');
  const textEl = document.getElementById('loading-text');
  if (pctEl) pctEl.textContent = `${Math.round(currentLoadingPct)}%`;
  if (barEl) barEl.style.width = `${currentLoadingPct}%`;
  if (text && textEl) textEl.textContent = text;
}

function startLoadingProgress() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');
  setLoadingProgress(5, 'Menghubungkan ke server...');

  if (loadingProgressTimer) clearInterval(loadingProgressTimer);
  loadingProgressTimer = setInterval(() => {
    if (currentLoadingPct < 88) {
      const increment = Math.random() * 7 + 3;
      setLoadingProgress(currentLoadingPct + increment, currentLoadingPct > 40 ? 'Mengunduh data dashboard...' : 'Menghubungkan ke server...');
    }
  }, 200);
}

function finishLoadingProgress() {
  if (loadingProgressTimer) {
    clearInterval(loadingProgressTimer);
    loadingProgressTimer = null;
  }
  setLoadingProgress(100, 'Selesai');
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 200);
  }
}

// ====== IndexedDB Cache Helper (Mendukung data besar puluhan MB tanpa batas localStorage) ======
const IDB_DB_NAME = 'DashboardSE_DB';
const IDB_STORE_NAME = 'cacheStore';

function openCacheDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function setIDBCache(key, val) {
  try {
    const db = await openCacheDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('IndexedDB write error:', e);
  }
}

async function getIDBCache(key) {
  try {
    const db = await openCacheDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('IndexedDB read error:', e);
    return null;
  }
}

// Fetch data dari Apps Script dengan IndexedDB caching (instan & tanpa batas 5MB)
async function loadDataFromAppsScript() {
  startLoadingProgress();
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "") {
    console.log("Menggunakan data mockup lokal (APPS_SCRIPT_URL kosong).");
    finishLoadingProgress();
    return;
  }

  // ====== LANGKAH 1: Tampilkan data dari cache lokal secara INSTAN ======
  try {
    const cachedData = await getIDBCache(DASHBOARD_CACHE_KEY);
    if (cachedData) {
      console.log("âš¡ Menampilkan data dari cache lokal (instan)...");
      processAndRenderData(cachedData);
    }
  } catch (cacheErr) {
    console.warn("Cache lokal rusak, mengabaikan:", cacheErr);
  }

  // ====== LANGKAH 2: Fetch data terbaru dari server di background ======
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 detik timeout
    const response = await fetch(APPS_SCRIPT_URL, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
    const data = await response.json();

    // Simpan data baru ke IndexedDB untuk kunjungan berikutnya
    await setIDBCache(DASHBOARD_CACHE_KEY, data);

    // Re-render dashboard dengan data terbaru
    processAndRenderData(data);
    console.log("âœ… Data terbaru dari server berhasil dimuat.");
  } catch (err) {
    console.error("Gagal memuat data dari Apps Script:", err);
  } finally {
    finishLoadingProgress();
  }
}

// Page Init
window.addEventListener('DOMContentLoaded', async () => {
  // Restore Theme
  const savedTheme = localStorage.getItem('impeccable-theme') || 'dark';
  document.documentElement.className = savedTheme;
  updateThemeIcon(savedTheme);

  // Load data from Apps Script
  await loadDataFromAppsScript();

  // Populate Table
  if (typeof updateTableData === 'function') {
    updateTableData();
  } else {
    renderTable(dashboardData);
  }

  // Init Charts
  initAllCharts();
});

// Theme Toggle Function
function toggleTheme() {
  const html = document.documentElement;
  let nextTheme = 'dark';
  if (html.classList.contains('dark')) {
    html.className = 'light';
    nextTheme = 'light';
  } else {
    html.className = 'dark';
    nextTheme = 'dark';
  }
  localStorage.setItem('impeccable-theme', nextTheme);
  updateThemeIcon(nextTheme);

  // Update ApexCharts themes dynamically
  destroyCharts();
  initAllCharts();
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (theme === 'light') {
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f7f4ef');
  } else {
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0a0907');
  }
}

// Populate Table DOM
