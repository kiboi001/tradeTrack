// chart.js
let profitChartInstance = null;
let equityChartInstance = null;
let winRateChartInstance = null;

function getTradesSafe() {
  try {
    if (typeof window.getTrades === 'function') return window.getTrades();
    return JSON.parse(localStorage.getItem('trades') || '[]');
  } catch {
    return [];
  }
}

function destroyChart(chart) {
  try {
    if (chart && typeof chart.destroy === 'function') chart.destroy();
  } catch (e) { /* ignore */ }
}

function renderCharts() {
  const trades = getTradesSafe();
  // If there's no trade data, clear canvases and return
  if (!trades || trades.length === 0) {
    destroyChart(profitChartInstance);
    destroyChart(equityChartInstance);
    destroyChart(winRateChartInstance);
    console.log("chart.js: no trades to render");
    return;
  }

  const labels = trades.map((t, i) => t.date ? t.date : `T${i+1}`);
  const profits = trades.map(t => Number(t.profit || 0));

  // profit per trade (bar)
  const profitCtx = document.getElementById('profitChart')?.getContext('2d');
  destroyChart(profitChartInstance);
  if (profitCtx) {
    profitChartInstance = new Chart(profitCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Profit / Loss',
          data: profits,
          backgroundColor: profits.map(p => p >= 0 ? 'rgba(0,230,118,0.6)' : 'rgba(255,82,82,0.6)'),
          borderColor: profits.map(p => p >= 0 ? '#00E676' : '#FF5252'),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#cfe8ff' } },
          y: { ticks: { color: '#cfe8ff' } }
        }
      }
    });
  }

  // equity curve (cumulative)
  const equityCtx = document.getElementById('equityChart')?.getContext('2d');
  destroyChart(equityChartInstance);
  if (equityCtx) {
    let cumulative = 10000; // starting balance - you can change or make dynamic
    const equity = profits.map(p => (cumulative += Number(p)));
    equityChartInstance = new Chart(equityCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Equity',
          data: equity,
          borderColor: '#00C3FF',
          backgroundColor: 'rgba(0,195,255,0.12)',
          fill: true,
          tension: 0.25
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#cfe8ff' } },
          y: { ticks: { color: '#cfe8ff' } }
        }
      }
    });
  }

  // win rate (doughnut)
  const winRateCtx = document.getElementById('winRateChart')?.getContext('2d');
  destroyChart(winRateChartInstance);
  if (winRateCtx) {
    const wins = profits.filter(p => p > 0).length;
    const losses = profits.filter(p => p < 0).length;
    winRateChartInstance = new Chart(winRateCtx, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses'],
        datasets: [{
          data: [wins, losses],
          backgroundColor: ['#00E676', '#FF5252']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#fff' } } }
      }
    });
  }
}

// Expose updateCharts
window.updateCharts = function () {
  try {
    renderCharts();
  } catch (err) {
    console.error("Error rendering charts:", err);
  }
};

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
  // Delay a tick to allow scripts.js to initialize trades if it runs first
  setTimeout(() => {
    window.updateCharts();
  }, 50);
});

// Listen for storage changes (other tabs)
window.addEventListener('storage', (e) => {
  if (e.key === 'trades') {
    try { trades = JSON.parse(e.newValue || '[]'); } catch { trades = []; }
    window.updateCharts();
  }
});
