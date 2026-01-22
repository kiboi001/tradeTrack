// chart.js (Premium Visuals + Filtering)
let _profitChart = null;
let _equityChart = null;
let _winChart = null;

function safeTrades() {
  try {
    return (typeof window.getTrades === 'function') ? window.getTrades() : JSON.parse(localStorage.getItem('trades') || '[]');
  } catch (e) {
    return [];
  }
}

function destroy(c) {
  if (c && typeof c.destroy === 'function') {
    try { c.destroy(); } catch (e) { /* ignore */ }
  }
}

// Accepts optional trades array (for filtering)
function renderAllCharts(tradesOverride = null) {
  const trades = tradesOverride || safeTrades();

  if (!trades || trades.length === 0) {
    destroy(_profitChart); destroy(_equityChart); destroy(_winChart);
    return;
  }

  const labels = trades.map((t, i) => t.date || `Trade ${i + 1}`);
  const profits = trades.map(t => Number(t.profit || 0));

  // --- 1. PREMIUM PROFIT/LOSS CHART (Top-Down Gradient Bars) ---
  const pCtx = document.getElementById('profitChart')?.getContext('2d');
  destroy(_profitChart);
  if (pCtx) {
    // Create Gradients
    const gradientWin = pCtx.createLinearGradient(0, 0, 0, 300);
    gradientWin.addColorStop(0, 'rgba(0, 230, 118, 0.8)');
    gradientWin.addColorStop(1, 'rgba(0, 230, 118, 0.1)');

    const gradientLoss = pCtx.createLinearGradient(0, 0, 0, 300);
    gradientLoss.addColorStop(0, 'rgba(255, 82, 82, 0.8)');
    gradientLoss.addColorStop(1, 'rgba(255, 82, 82, 0.1)');

    _profitChart = new Chart(pCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Net P/L ($)',
          data: profits,
          backgroundColor: profits.map(v => v >= 0 ? gradientWin : gradientLoss),
          borderColor: profits.map(v => v >= 0 ? '#00E676' : '#FF5252'),
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: profits.map(v => v >= 0 ? '#00FF88' : '#FF4444')
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20, 20, 30, 0.9)',
            titleColor: '#fff',
            bodyColor: '#ccc',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                return ` ${val >= 0 ? '+' : ''}$${Number(val).toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#8899a6' }, grid: { display: false } },
          y: { ticks: { color: '#8899a6' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // --- 2. PREMIUM EQUITY CURVE (Smooth Gradient Area) ---
  const eCtx = document.getElementById('equityChart')?.getContext('2d');
  destroy(_equityChart);
  if (eCtx) {
    const startBal = (typeof window.getInitialBalance === 'function') ? window.getInitialBalance() : 0;
    const equity = [];
    let bal = Number(startBal);
    // If filtering, we might want to show cumulative from 0 or from actual balance
    // For visual clarity, let's start from 0 relative change if filtered, or actual checks if full.
    // Simpler: Just accumulate P/L on top of StartBal for the filtered set
    for (const p of profits) { bal += Number(p); equity.push(Number(bal.toFixed(2))); }

    const gradientEquity = eCtx.createLinearGradient(0, 0, 0, 400);
    gradientEquity.addColorStop(0, 'rgba(0, 195, 255, 0.5)');
    gradientEquity.addColorStop(1, 'rgba(0, 195, 255, 0.0)');

    _equityChart = new Chart(eCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Equity Growth',
          data: equity,
          borderColor: '#00C3FF',
          backgroundColor: gradientEquity,
          borderWidth: 3,
          pointBackgroundColor: '#00C3FF',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4 // Smooth curve
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20, 20, 30, 0.9)',
            borderColor: 'rgba(0,195,255,0.3)',
            borderWidth: 1,
            callbacks: {
              label: (c) => ` $${Number(c.raw).toFixed(2)}`
            }
          }
        },
        scales: {
          x: { ticks: { color: '#8899a6' }, grid: { display: false } },
          y: { ticks: { color: '#8899a6' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // --- 3. PREMIUM WIN RATE (Hollow Doughnut) ---
  const wCtx = document.getElementById('winRateChart')?.getContext('2d');
  destroy(_winChart);
  if (wCtx) {
    const wins = profits.filter(p => p > 0).length;
    const losses = profits.filter(p => p <= 0).length;
    _winChart = new Chart(wCtx, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses'],
        datasets: [{
          data: [wins, losses],
          backgroundColor: ['#00E676', '#FF5252'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // Thinner ring
        plugins: {
          legend: { position: 'bottom', labels: { color: '#fff', font: { size: 12 } } }
        }
      }
    });
  }
}

// Global update function called by scripts.js
window.updateCharts = function (tradesOverride = null) {
  try { renderAllCharts(tradesOverride); } catch (e) { console.error(e); }
};

// auto-init after DOM
document.addEventListener('DOMContentLoaded', () => {
  // ensure scripts.js loaded and available
  setTimeout(() => window.updateCharts && window.updateCharts(), 60);
});

// keep charts updated across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'trades' || e.key === 'accountBalance') {
    window.updateCharts && window.updateCharts();
  }
});
