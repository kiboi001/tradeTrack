// chart.js (FINAL)
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

function renderAllCharts() {
  const trades = safeTrades();
  if (!trades || trades.length === 0) {
    destroy(_profitChart); destroy(_equityChart); destroy(_winChart);
    console.log('chart.js: no trades');
    return;
  }

  const labels = trades.map((t,i) => t.date || `T${i+1}`);
  const profits = trades.map(t => Number(t.profit || 0));

  // Profit per trade (bar)
  const pCtx = document.getElementById('profitChart')?.getContext('2d');
  destroy(_profitChart);
  if (pCtx) {
    _profitChart = new Chart(pCtx, {
      type: 'bar',
      data: { labels, datasets: [{ label:'P/L', data: profits, backgroundColor: profits.map(v => v>=0 ? 'rgba(0,230,118,0.6)' : 'rgba(255,82,82,0.6)'), borderColor: profits.map(v => v>=0 ? '#00E676' : '#FF5252'), borderWidth:1 }]},
      options: { responsive:true, scales: { x:{ ticks:{ color:'#ccc'} }, y:{ ticks:{ color:'#ccc'} } }, plugins:{ legend:{ display:false } } }
    });
  }

  // Equity curve
  const eCtx = document.getElementById('equityChart')?.getContext('2d');
  destroy(_equityChart);
  if (eCtx) {
    const startBal = (typeof window.getAccountBalance === 'function' && window.getAccountBalance() !== null) ? window.getAccountBalance() : 10000;
    const equity = [];
    let bal = Number(startBal);
    for (const p of profits) { bal += Number(p); equity.push(Number(bal.toFixed(2))); }

    _equityChart = new Chart(eCtx, {
      type: 'line',
      data: { labels, datasets: [{ label:'Equity', data: equity, borderColor:'#00C3FF', backgroundColor:'rgba(0,195,255,0.12)', fill:true, tension:0.2 }]},
      options: { responsive:true, scales:{ x:{ ticks:{ color:'#ccc'} }, y:{ ticks:{ color:'#ccc'} } }, plugins:{ legend:{ display:false } } }
    });
  }

  // Win rate doughnut
  const wCtx = document.getElementById('winRateChart')?.getContext('2d');
  destroy(_winChart);
  if (wCtx) {
    const wins = profits.filter(p => p > 0).length;
    const losses = profits.filter(p => p < 0).length;
    _winChart = new Chart(wCtx, {
      type: 'doughnut',
      data: { labels:['Wins','Losses'], datasets:[{ data:[wins, losses], backgroundColor:['#00E676','#FF5252'] }]},
      options: { responsive:true, plugins:{ legend:{ labels:{ color:'#fff' } } } }
    });
  }
}

window.updateCharts = function () { try { renderAllCharts(); } catch (e) { console.error(e); } };

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
