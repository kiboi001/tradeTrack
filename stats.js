// Stats.js - Chart Tab Switching (Charts are created by chart.js)
document.addEventListener("DOMContentLoaded", () => {
  const profitChartCanvas = document.getElementById('profitChart');
  const equityChartCanvas = document.getElementById('equityChart');
  const winRateChartCanvas = document.getElementById('winRateChart');

  // Initially show only profit chart
  if (profitChartCanvas) profitChartCanvas.style.display = 'block';
  if (equityChartCanvas) equityChartCanvas.style.display = 'none';
  if (winRateChartCanvas) winRateChartCanvas.style.display = 'none';

  // Tab button click handlers
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      tabBtns.forEach(b => b.classList.remove('active'));
      // Add active to clicked
      btn.classList.add('active');

      // Hide all charts
      if (profitChartCanvas) profitChartCanvas.style.display = 'none';
      if (equityChartCanvas) equityChartCanvas.style.display = 'none';
      if (winRateChartCanvas) winRateChartCanvas.style.display = 'none';

      // Show selected chart
      const chartType = btn.dataset.chart;
      if (chartType === 'profit' && profitChartCanvas) profitChartCanvas.style.display = 'block';
      else if (chartType === 'equity' && equityChartCanvas) equityChartCanvas.style.display = 'block';
      else if (chartType === 'winrate' && winRateChartCanvas) winRateChartCanvas.style.display = 'block';
    });
  });
});
