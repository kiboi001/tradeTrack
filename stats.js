document.addEventListener("DOMContentLoaded", () => {
  const trades = JSON.parse(localStorage.getItem("trades") || "[]");

  // Chart Tab Switching Logic
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

  // Chart.js setup
  const ctx1 = document.getElementById("profitChart").getContext("2d");
  const ctx2 = document.getElementById("equityChart").getContext("2d");
  const ctx3 = document.getElementById("winRateChart").getContext("2d");

  // Profit/Loss over time
  new Chart(ctx1, {
    type: "line",
    data: {
      labels: trades.map((t, i) => `Trade ${i + 1}`),
      datasets: [
        {
          label: "Profit/Loss ($)",
          data: trades.map(t => t.result),
          borderColor: "#00E676",
          backgroundColor: "rgba(0, 230, 118, 0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: "#ccc" } }, y: { ticks: { color: "#ccc" } } }
    }
  });

  // Equity curve
  let balance = 10000;
  const equity = trades.map(t => (balance += Number(t.result)));

  new Chart(ctx2, {
    type: "line",
    data: {
      labels: trades.map((t, i) => `Trade ${i + 1}`),
      datasets: [
        {
          label: "Equity Growth",
          data: equity,
          borderColor: "#00C3FF",
          backgroundColor: "rgba(0, 195, 255, 0.15)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: "#ccc" } }, y: { ticks: { color: "#ccc" } } }
    }
  });

  // Win rate chart
  new Chart(ctx3, {
    type: "doughnut",
    data: {
      labels: ["Wins", "Losses"],
      datasets: [
        {
          data: [wins, losses],
          backgroundColor: ["#00E676", "#FF5252"],
          hoverOffset: 10
        }
      ]
    },
    options: { plugins: { legend: { labels: { color: "#fff" } } } }
  });
});


