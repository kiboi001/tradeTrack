// === Stats Page Logic ===
document.addEventListener("DOMContentLoaded", () => {
  const trades = JSON.parse(localStorage.getItem("trades")) || [];

  if (document.body.classList.contains("stats-page")) {
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.profit > 0).length;
    const losses = trades.filter(t => t.profit < 0).length;
    const totalProfit = trades.reduce((acc, t) => acc + (t.profit || 0), 0);
    const avgProfit =
      wins > 0 ? trades.filter(t => t.profit > 0).reduce((a, b) => a + b.profit, 0) / wins : 0;
    const avgLoss =
      losses > 0 ? trades.filter(t => t.profit < 0).reduce((a, b) => a + b.profit, 0) / losses : 0;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;

    document.getElementById("totalTrades").textContent = totalTrades;
    document.getElementById("winningTrades").textContent = wins;
    document.getElementById("winRate").textContent = `${winRate}%`;
    document.getElementById("avgProfit").textContent = `$${avgProfit.toFixed(2)}`;
    document.getElementById("avgLoss").textContent = `$${avgLoss.toFixed(2)}`;
    document.getElementById("totalProfit").textContent = `$${totalProfit.toFixed(2)}`;
  }
});
const tabButtons = document.querySelectorAll('.tab-btn');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const chartType = btn.dataset.chart;
    let newData;

    if (chartType === "profit") newData = chartData.week;
    if (chartType === "equity") newData = chartData['3months'].map(v => v + 500);
    if (chartType === "winrate") newData = chartData.week.map(v => (v > 0 ? 75 : 40));

    profitChart.data.datasets[0].label = btn.textContent;
    profitChart.data.datasets[0].data = newData;
    profitChart.update();
  });
});

// Interactive Sync Button Behavior
const syncBtn = document.getElementById("sync-btn");
const syncStatus = document.getElementById("sync-status");

syncBtn.addEventListener("click", () => {
  syncBtn.innerText = "⏳ Syncing...";
  syncBtn.disabled = true;
  syncBtn.style.opacity = "0.7";

  // Simulate Sync Animation
  setTimeout(() => {
    syncBtn.innerText = "✅ Synced";
    syncBtn.style.opacity = "1";
    syncStatus.innerText = "Last synced: " + new Date().toLocaleTimeString();
    syncBtn.disabled = false;

    // Subtle flash animation on status
    syncStatus.animate([
      { color: "#00ff99" },
      { color: "#aaa" }
    ], { duration: 1200, fill: "forwards" });
  }, 2000);
});
