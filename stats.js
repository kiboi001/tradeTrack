document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tradeForm");
  const totalTrades = document.getElementById("total-trades");
  const winningTrades = document.getElementById("winning-trades");
  const winRate = document.getElementById("win-rate");
  const totalProfit = document.getElementById("total-profit");
  const avgRR = document.getElementById("avg-rr");
  const bestTrade = document.getElementById("best-trade");

  const profitChartCanvas = document.getElementById("profitChart");
  const equityChartCanvas = document.getElementById("equityChart");
  const winRateChartCanvas = document.getElementById("winRateChart");

  const trades = JSON.parse(localStorage.getItem("trades") || "[]");

  let profitChart, equityChart, winRateChart;

  // ✅ Save Trade
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const trade = {
      pair: document.getElementById("pair").value,
      result: document.getElementById("result").value,
      profit: parseFloat(document.getElementById("profitLoss").value),
      rr: document.getElementById("riskReward").value,
      lot: document.getElementById("lotSize").value,
      date: new Date().toLocaleDateString(),
    };

    trades.push(trade);
    localStorage.setItem("trades", JSON.stringify(trades));

    form.reset();
    updateStats();
  });

  // ✅ Update Stats + Charts
  function updateStats() {
    const total = trades.length;
    const wins = trades.filter(t => t.result === "win");
    const losses = trades.filter(t => t.result === "loss");
    const totalProfitValue = trades.reduce((acc, t) => acc + t.profit, 0);
    const best = trades.length ? Math.max(...trades.map(t => t.profit)) : 0;

    const avgRRValue = trades.length
      ? trades.reduce((acc, t) => {
          const val = parseFloat(t.rr.split(":")[1] || 0);
          return acc + val;
        }, 0) / trades.length
      : 0;

    const winRateValue = total > 0 ? ((wins.length / total) * 100).toFixed(1) : 0;

    totalTrades.textContent = total;
    winningTrades.textContent = wins.length;
    winRate.textContent = `${winRateValue}%`;
    totalProfit.textContent = `$${totalProfitValue.toFixed(2)}`;
    avgRR.textContent = `1:${avgRRValue.toFixed(2)}`;
    bestTrade.textContent = `$${best.toFixed(2)}`;

    renderCharts(trades);
  }

  // ✅ Render Charts
  function renderCharts(data) {
    const labels = data.map((t, i) => t.date || `Trade ${i + 1}`);
    const profits = data.map(t => t.profit);

    const equityData = [];
    let balance = 10000;
    for (const t of data) {
      balance += t.profit;
      equityData.push(balance);
    }

    // Destroy old charts before re-rendering
    if (profitChart) profitChart.destroy();
    if (equityChart) equityChart.destroy();
    if (winRateChart) winRateChart.destroy();

    // Profit Chart
    profitChart = new Chart(profitChartCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Profit/Loss ($)",
          data: profits,
          backgroundColor: profits.map(p => (p >= 0 ? "#00E676" : "#FF5252")),
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: "#fff" } }, y: { ticks: { color: "#fff" } } },
      },
    });

    // Equity Growth
    equityChart = new Chart(equityChartCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Equity Growth",
          data: equityData,
          borderColor: "#00C3FF",
          backgroundColor: "rgba(0, 195, 255, 0.1)",
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        plugins: { legend: { labels: { color: "#fff" } } },
        scales: { x: { ticks: { color: "#fff" } }, y: { ticks: { color: "#fff" } } },
      },
    });

    // Win Rate Chart
    const wins = data.filter(t => t.result === "win").length;
    const losses = data.filter(t => t.result === "loss").length;

    winRateChart = new Chart(winRateChartCanvas, {
      type: "doughnut",
      data: {
        labels: ["Wins", "Losses"],
        datasets: [{
          data: [wins, losses],
          backgroundColor: ["#00E676", "#FF5252"],
        }],
      },
      options: {
        plugins: { legend: { labels: { color: "#fff" } } },
      },
    });
  }

  // ✅ Tab Switching
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const chartType = btn.dataset.chart;

      profitChartCanvas.style.display = chartType === "profit" ? "block" : "none";
      equityChartCanvas.style.display = chartType === "equity" ? "block" : "none";
      winRateChartCanvas.style.display = chartType === "winrate" ? "block" : "none";
    });
  });

  // ✅ Initialize
  updateStats();
});
