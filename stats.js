
// Stats.js - Chart Tab Switching (Charts are created by chart.js)
document.addEventListener("DOMContentLoaded", () => {
  const profitChartCanvas = document.getElementById('profitChart');
  const equityChartCanvas = document.getElementById('equityChart');
  const winRateChartCanvas = document.getElementById('winRateChart');
  const bestTradesList = document.getElementById('bestTradesList');

  // Initially show only profit chart
  if (profitChartCanvas) profitChartCanvas.style.display = 'block';
  if (equityChartCanvas) equityChartCanvas.style.display = 'none';
  if (winRateChartCanvas) winRateChartCanvas.style.display = 'none';
  if (bestTradesList) bestTradesList.style.display = 'none';

  // Tab button click handlers
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      tabBtns.forEach(b => b.classList.remove('active'));
      // Add active to clicked
      btn.classList.add('active');

      // Hide all charts and lists
      if (profitChartCanvas) profitChartCanvas.style.display = 'none';
      if (equityChartCanvas) equityChartCanvas.style.display = 'none';
      if (winRateChartCanvas) winRateChartCanvas.style.display = 'none';
      if (bestTradesList) bestTradesList.style.display = 'none';

      // Show selected chart or list
      const chartType = btn.dataset.chart;
      if (chartType === 'profit' && profitChartCanvas) profitChartCanvas.style.display = 'block';
      else if (chartType === 'equity' && equityChartCanvas) equityChartCanvas.style.display = 'block';
      else if (chartType === 'winrate' && winRateChartCanvas) winRateChartCanvas.style.display = 'block';
      else if (chartType === 'best-trades' && bestTradesList) bestTradesList.style.display = 'block';
    });
  });
});

// Global function called by scripts.js - Moved outside listener to avoid race condition
window.renderBestTrades = function (trades) {
  const tbody = document.getElementById('best-trades-body');
  if (!tbody) return;

  if (!trades || trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No trades found</td></tr>';
    return;
  }

  // Sort by profit descending and take top 10
  const sorted = [...trades].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0)).slice(0, 10);

  tbody.innerHTML = sorted.map(t => `
    <tr>
      <td>${t.date || '---'}</td>
      <td>${t.pair || '---'}</td>
      <td><span class="status-badge ${t.status || ''}">${(t.status || 'win').toUpperCase()}</span></td>
      <td class="pnl positive" style="color: #00ffa3;">$${Number(t.profit || 0).toFixed(2)}</td>
      <td>1:${Number(t.rr || 0).toFixed(1)}</td>
    </tr>
  `).join('');
};
