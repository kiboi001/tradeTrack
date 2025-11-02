document.addEventListener("DOMContentLoaded", () => {
  const trades = JSON.parse(localStorage.getItem("trades") || "[]");

  const totalTrades = trades.length;
  const totalProfit = trades.reduce((sum, t) => sum + Number(t.result), 0);
  const profit = Number(trade.profits);
  return acc + (isNaN(profit) ? 0 : profit ); },0);
  const wins = trades.filter(t => Number(t.profit) > 0).length;
  const losses = trades.filter(t => Number(t.result) < 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
  const avgRR = trades.length ? (
    trades.reduce ((acc , t) => acc + (Number(t.rr) || 0),0) / trades.length
  ).toFixed(2)
    : 0;

  // Update stat cards
  document.getElementById("total-trades").innerText = totalTrades;
  document.getElementById("total-profit").innerText = `$${totalProfit.toFixed(2)}`;
  document.getElementById("averageRR").innerText = '1:${avgRR};
  document.getElementById("win-rate").innerText= `${winRate}%`;

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


