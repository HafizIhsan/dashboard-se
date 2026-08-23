// charts.js

function destroyCharts() {
  if (donutChart) donutChart.destroy();
  if (progressChart) progressChart.destroy();
  if (submitChart) submitChart.destroy();
  if (dailyChart) dailyChart.destroy();
}

function initAllCharts() {
  const isDark = document.documentElement.classList.contains('dark');
  const textPrimaryColor = isDark ? '#f4f1eb' : '#2d2b27';
  const borderThemeColor = isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(234, 88, 12, 0.18)';

  const themeColors = {
    orange: isDark ? '#f97316' : '#ea580c',
    mutedOrange: isDark ? '#ea580c' : '#c2410c',
    success: isDark ? '#a3c9a8' : '#558564',
    warning: isDark ? '#e5b974' : '#c98e30',
    danger: isDark ? '#d17a7a' : '#b24c4c',
    neutrals: isDark ? '#3c3a35' : '#eae5dc'
  };
  const chartResponsive = [{ breakpoint: 1024, options: { chart: { height: 340 }, dataLabels: { offsetX: 32, style: { fontSize: '10px' } } } }, { breakpoint: 768, options: { chart: { height: 300 }, dataLabels: { offsetX: 25, style: { fontSize: '9px' } }, plotOptions: { bar: { barHeight: '55%', borderRadius: 3 } }, grid: { padding: { left: 4, right: 18 } } } }];

  // 1. Donut Chart (Superteam Asset Hub style)
  const donutOptions = {
    responsive: chartResponsive,
    series: [sumData.umkmOpen + sumData.ubOpen, sumData.umkmDraft + sumData.ubDraft, sumData.umkmSubmit + sumData.ubSubmit],
    labels: ['Open', 'Draft', 'Submitted'],
    chart: {
      type: 'donut',
      height: 280,
      background: 'transparent',
      toolbar: { show: false },
      foreColor: textPrimaryColor
    },
    colors: ['#3b82f6', '#f59e0b', '#10b981'], // Clean Blue, Amber, Emerald matching Asset Hub style
    stroke: {
      width: 0
    },
    legend: {
      position: 'bottom',
      fontFamily: 'Albert Sans',
      fontSize: '11px',
      labels: { colors: isDark ? '#9ca3af' : '#475569' }
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: '11px', fontWeight: '600' },
      dropShadow: { enabled: false }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val) => fmtNum(val) + ' usaha'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            value: {
              show: true,
              fontFamily: 'Albert Sans',
              color: textPrimaryColor,
              formatter: (val) => fmtNum(val)
            },
            total: {
              show: true,
              label: 'TOTAL',
              fontFamily: 'Albert Sans',
              fontWeight: 600,
              color: isDark ? '#9ca3af' : '#475569',
              formatter: (w) => fmtNum(w.globals.seriesTotals.reduce((a, b) => a + b, 0))
            }
          }
        }
      }
    }
  };
  donutChart = new ApexCharts(document.querySelector("#donutChart"), donutOptions);
  donutChart.render();

  // 2. Bar Chart: Progress Akumulatif (Superteam Asset Hub style)
  const sortedByProgress = [...dashboardData].sort((a, b) => b.progress - a.progress);
  const progressOptions = {
    responsive: chartResponsive,
    series: [{
      name: 'Progres %',
      data: sortedByProgress.map(x => parseFloat(x.progress.toFixed(2)))
    }],
    chart: {
      type: 'bar',
      height: 380,
      background: 'transparent',
      toolbar: { show: false },
      foreColor: textPrimaryColor,
      animations: { enabled: true, easing: 'easeinout', speed: 600 }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '55%',
        borderRadius: 3,
        dataLabels: { position: 'top' }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        gradientToColors: ['#10b981'], // Gradient to Emerald
        type: 'horizontal',
        stops: [0, 100]
      }
    },
    colors: ['#3b82f6'], // Base color Blue
    dataLabels: {
      enabled: true,
      offsetX: 40,
      style: {
        fontSize: '10px',
        fontWeight: '600',
        colors: [isDark ? '#f4f1eb' : '#2d2b27']
      },
      formatter: (v) => `${fmtPct(v)}%`
    },
    xaxis: {
      categories: sortedByProgress.map(x => `[${x.kode}]`),
      labels: {
        formatter: (v) => `${fmtPct(v)}%`,
        style: { fontFamily: 'Albert Sans', fontSize: '10px', colors: '#9ca3af' },
        hideOverlappingLabels: true
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 4
    },
    yaxis: {
      labels: {
        maxWidth: 80,
        style: { fontFamily: 'Albert Sans', fontSize: '10px', colors: '#9ca3af' }
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#cbd5e1',
      strokeDashArray: 3
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      bounds: 'window',
      x: {
        formatter: (v, { dataPointIndex: i }) => {
          const item = sortedByProgress[i];
          return item ? `[${item.kode}] ${item.nama}` : '';
        }
      },
      y: {
        formatter: (val) => `${fmtPct(val)}%`
      }
    }
  };
  progressChart = new ApexCharts(document.querySelector("#progressRankChart"), progressOptions);
  progressChart.render();

  // 3. Bar Chart: Volume Submit (Superteam Asset Hub style)
  const sortedBySubmit = [...dashboardData].sort((a, b) => (b.umkmSubmit + b.ubSubmit) - (a.umkmSubmit + a.ubSubmit));
  const submitOptions = {
    responsive: chartResponsive,
    series: [{
      name: 'Total Submit',
      data: sortedBySubmit.map(x => x.umkmSubmit + x.ubSubmit)
    }],
    chart: {
      type: 'bar',
      height: 380,
      background: 'transparent',
      toolbar: { show: false },
      foreColor: textPrimaryColor,
      animations: { enabled: true, easing: 'easeinout', speed: 600 }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '55%',
        borderRadius: 3,
        dataLabels: { position: 'top' }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        gradientToColors: ['#f59e0b'], // Gradient to Amber
        type: 'horizontal',
        stops: [0, 100]
      }
    },
    colors: ['#ef4444'], // Base color Red
    dataLabels: {
      enabled: true,
      offsetX: 40,
      style: {
        fontSize: '10px',
        fontWeight: '600',
        colors: [isDark ? '#f4f1eb' : '#2d2b27']
      },
      formatter: (v) => fmtNum(v)
    },
    xaxis: {
      categories: sortedBySubmit.map(x => `[${x.kode}]`),
      labels: {
        formatter: (v) => fmtNum(v),
        style: { fontFamily: 'Albert Sans', fontSize: '10px', colors: '#9ca3af' },
        hideOverlappingLabels: true
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 4
    },
    yaxis: {
      labels: {
        maxWidth: 80,
        style: { fontFamily: 'Albert Sans', fontSize: '10px', colors: '#9ca3af' }
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#cbd5e1',
      strokeDashArray: 3
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      bounds: 'window',
      x: {
        formatter: (v, { dataPointIndex: i }) => {
          const item = sortedBySubmit[i];
          return item ? `[${item.kode}] ${item.nama}` : '';
        }
      },
      y: {
        formatter: (val) => fmtNum(val) + ' Assignment'
      }
    }
  };
  const submitEl = document.querySelector("#submitRankChart");
  if (submitEl) {
    submitChart = new ApexCharts(submitEl, submitOptions);
    submitChart.render();
  }

  // 4. Bar Chart: Kenaikan Harian dalam % (Superteam Asset Hub style)
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
  const dailyOptions = {
    responsive: chartResponsive,
    series: [{
      name: 'Kenaikan Harian',
      data: dailyData
    }],
    chart: {
      type: 'bar',
      height: 380,
      background: 'transparent',
      toolbar: { show: false },
      foreColor: textPrimaryColor,
      animations: { enabled: true, easing: 'easeinout', speed: 600 }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '55%',
        borderRadius: 3,
        dataLabels: { position: 'top' }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        gradientToColors: ['#3b82f6'], // Gradient to Blue
        type: 'horizontal',
        stops: [0, 100]
      }
    },
    colors: ['#f59e0b'], // Base color Amber/Yellow
    dataLabels: {
      enabled: true,
      offsetX: 40,
      style: {
        fontSize: '10px',
        fontWeight: '600',
        colors: [isDark ? '#f4f1eb' : '#2d2b27']
      },
      formatter: (v) => `${fmtPct(v)}%`
    },
    xaxis: {
      categories: sortedByDaily.map(x => `[${x.kode}]`),
      labels: {
        formatter: (v) => `${fmtPct(v)}%`,
        style: { fontFamily: 'Albert Sans', fontSize: '10px', colors: '#9ca3af' },
        hideOverlappingLabels: true
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 4
    },
    yaxis: {
      labels: {
        maxWidth: 80,
        style: { fontFamily: 'Albert Sans', fontSize: '10px', colors: '#9ca3af' }
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#cbd5e1',
      strokeDashArray: 3
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      bounds: 'window',
      x: {
        formatter: (v, { dataPointIndex: i }) => {
          const item = sortedByDaily[i];
          return item ? `[${item.kode}] ${item.nama}` : '';
        }
      },
      y: {
        formatter: (val, { dataPointIndex: i }) => {
          const item = sortedByDaily[i];
          const total = (item.harianUmkm || 0) + (item.harianUb || 0);
          return `${fmtPct(val)}% (${fmtNum(total)} Assignment)`;
        }
      }
    }
  };
  dailyChart = new ApexCharts(document.querySelector("#dailyChart"), dailyOptions);
  dailyChart.render();
}
