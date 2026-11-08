// Pulse Admin Dashboard Template — interactions

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initThemeToggle();
  initSidebar();
  animateCounters();
  initRevenueChart();
  initTrafficChart();
  initVisitorsChart();
  initDeviceChart();
  initTabs();
});

function initThemeToggle() {
  // The dark/light class itself is already applied by the inline
  // no-flash script in <head>; this just keeps the toggle button and
  // its icons in sync with that state.
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const iconSun = document.getElementById('iconSun');
  const iconMoon = document.getElementById('iconMoon');
  if (!toggle) return;

  syncIcons();
  toggle.addEventListener('click', () => {
    const dark = !root.classList.contains('dark');
    root.classList.toggle('dark', dark);
    localStorage.setItem('pulse-theme', dark ? 'dark' : 'light');
    syncIcons();
  });

  function syncIcons() {
    const dark = root.classList.contains('dark');
    iconSun.classList.toggle('hidden', dark);
    iconMoon.classList.toggle('hidden', !dark);
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');
  if (!sidebar || !overlay || !toggle) return;

  const open = () => { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); };
  const close = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };

  toggle.addEventListener('click', () => sidebar.classList.contains('-translate-x-full') ? open() : close());
  overlay.addEventListener('click', close);
}

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function chartColors() {
  const dark = document.documentElement.classList.contains('dark');
  return {
    grid: dark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)',
    text: dark ? '#94a3b8' : '#64748b',
    brand: '#6366f1',
    brandFill: dark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.12)'
  };
}

function initRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  const c = chartColors();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      datasets: [{
        label: 'Revenue',
        data: [42000, 48500, 46200, 55800, 61200, 70400, 84290],
        borderColor: c.brand,
        backgroundColor: c.brandFill,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: c.brand,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.text, font: { size: 11 } } },
        y: {
          grid: { color: c.grid },
          ticks: {
            color: c.text,
            font: { size: 11 },
            callback: (v) => '$' + (v / 1000) + 'k'
          }
        }
      }
    }
  });
}

function initTrafficChart() {
  const ctx = document.getElementById('trafficChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Organic Search', 'Direct', 'Social'],
      datasets: [{
        data: [48, 31, 21],
        backgroundColor: ['#6366f1', '#10b981', '#fbbf24'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: { legend: { display: false } }
    }
  });
}

function initVisitorsChart() {
  const ctx = document.getElementById('visitorsChart');
  if (!ctx) return;
  const c = chartColors();

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Visitors',
        data: [5200, 6100, 5800, 7400, 8100, 6900, 7300],
        backgroundColor: c.brand,
        borderRadius: 6,
        maxBarThickness: 36
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.text, font: { size: 11 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.text, font: { size: 11 } } }
      }
    }
  });
}

function initDeviceChart() {
  const ctx = document.getElementById('deviceChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Desktop', 'Mobile', 'Tablet'],
      datasets: [{
        data: [56, 37, 7],
        backgroundColor: ['#6366f1', '#10b981', '#fbbf24'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: { legend: { display: false } }
    }
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('[data-tab-target]');
  if (!tabs.length) return;

  const panels = document.querySelectorAll('[data-tab-panel]');
  const activate = (name) => {
    tabs.forEach(t => t.classList.toggle('settings-tab-active', t.dataset.tabTarget === name));
    panels.forEach(p => p.classList.toggle('hidden', p.dataset.tabPanel !== name));
  };

  tabs.forEach(t => t.addEventListener('click', () => {
    activate(t.dataset.tabTarget);
    history.replaceState(null, '', '#' + t.dataset.tabTarget);
  }));

  const fromHash = location.hash.replace('#', '');
  activate(fromHash && document.querySelector(`[data-tab-target="${fromHash}"]`) ? fromHash : tabs[0].dataset.tabTarget);
}
