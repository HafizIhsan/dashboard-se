// helpers.js

// Helper format angka Indonesia: titik pemisah ribuan, koma pemisah desimal
function fmtNum(n) { return Number(n).toLocaleString('id-ID'); }
function fmtPct(n) { return Number(n).toFixed(2).replace('.', ','); }

// Hitung persentase target progress berdasarkan hari berjalan (15 Juni 2026 - 31 Agustus 2026)
function getTargetProgress() {
  const totalDays = 78;
  const start = new Date(2026, 5, 15);
  const end = new Date(2026, 7, 31);

  const current = new Date();
  current.setHours(0, 0, 0, 0);

  if (current < start) return 0;
  if (current > end) return 100;

  const diffTime = current - start;
  // Dihitung H-1 (hari ini tidak dihitung karena belum selesai)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return (diffDays / totalDays) * 100;
}

function getProgressColor(progress) {
  if (progress === null || progress === undefined || isNaN(progress)) return 'inherit';
  const target = getTargetProgress();
  if (target <= 0) {
    if (progress > 0) return 'var(--success-color)';
    return 'var(--text-muted)';
  }
  if (progress >= target) return 'var(--success-color)';
  if (progress >= target * 0.75) return 'var(--warning-color)';
  return 'var(--danger-color)';
}

function getDailyColor(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return 'inherit';
  const dailyTarget = 100 / 78; // Target harian minimum (~1.28%)
  if (pct <= 0) return 'var(--danger-color)';
  if (pct < dailyTarget) return 'var(--warning-color)';
  return 'var(--success-color)';
}

function getDeltaColor(delta) {
  if (delta === null || delta === undefined || isNaN(delta)) return 'inherit';
  const dailyTarget = 100 / 78; // ~1.28%
  if (delta >= dailyTarget) return 'var(--success-color)';
  if (delta > 0) return 'var(--warning-color)';
  if (delta === 0) return 'var(--warning-color)';
  return 'var(--danger-color)';
}

// Hitung dan tampilkan hari ke-berapa dari total hari pendataan
function updateDayCounter() {
  const totalDays = 78;
  const start = new Date(2026, 5, 15); // 15 Juni 2026
  const end = new Date(2026, 7, 31);   // 31 Agustus 2026

  const current = new Date();
  current.setHours(0, 0, 0, 0);

  const el = document.getElementById('day-counter-text');
  if (!el) return;

  if (current < start) {
    const diffTime = start - current;
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    el.textContent = daysUntil + ' hari lagi menuju Pendataan SE2026';
  } else if (current > end) {
    el.textContent = 'Pendataan SE2026 telah selesai';
  } else {
    // Hari ke-1 = 15 Juni, hari ke-2 = 16 Juni, dst.
    const diffTime = current - start;
    const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    el.textContent = 'Hari ke-' + dayNumber + ' dari ' + totalDays + ' hari Pendataan SE2026 (15 Juni - 31 Agustus 2026)';
  }
}
updateDayCounter();

// ====== EXPORT PROGRESS MODAL CONTROLLER ======
function showExportProgress(title = 'Menyiapkan File Excel', status = 'Mengolah data...', pct = 10, step = 'Memulai proses...') {
  const modal = document.getElementById('export-modal');
  const titleEl = document.getElementById('export-modal-title');
  const statusEl = document.getElementById('export-modal-status');
  const barEl = document.getElementById('export-modal-bar');
  const pctEl = document.getElementById('export-modal-pct');
  const stepEl = document.getElementById('export-modal-step');

  if (titleEl) titleEl.textContent = title;
  if (statusEl) statusEl.textContent = status;
  if (barEl) barEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  if (stepEl) stepEl.textContent = step;

  if (modal) modal.classList.remove('hidden');
}

function updateExportProgress(pct, status, step) {
  const barEl = document.getElementById('export-modal-bar');
  const pctEl = document.getElementById('export-modal-pct');
  const statusEl = document.getElementById('export-modal-status');
  const stepEl = document.getElementById('export-modal-step');

  if (barEl) barEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  if (status && statusEl) statusEl.textContent = status;
  if (step && stepEl) stepEl.textContent = step;
}

function hideExportProgress() {
  updateExportProgress(100, 'Selesai!', 'Pengunduhan dimulai');
  setTimeout(() => {
    const modal = document.getElementById('export-modal');
    if (modal) modal.classList.add('hidden');
  }, 350);
}
