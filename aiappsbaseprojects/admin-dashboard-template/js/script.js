// Pulse Admin Dashboard Template — interactions

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initThemeToggle();
  initSidebar();
  animateCounters();
  initRevenueChart();
  initTrafficChart();
});

function initThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const iconSun = document.getElementById('iconSun');
  const iconMoon = document.getElementById('iconMoon');

  const stored = localStorage.getItem('pulse-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored ? stored === 'dark' : prefersDark;
  setTheme(isDark);

  toggle.addEventListener('click', () => setTheme(!root.classList.contains('dark')));

  function setTheme(dark) {
    root.classList.toggle('dark', dark);
    localStorage.setItem('pulse-theme', dark ? 'dark' : 'light');
    iconSun.classList.toggle('hidden', dark);
    iconMoon.classList.toggle('hidden', !dark);
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');

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
