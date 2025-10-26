// dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  function findEl(...ids) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  // DOM targets (support multiple naming conventions)
  const accountBalanceEl = findEl("accountBalance", "account-balance", "accountBalanceEl", "account-balance-el", "account-balance");
  const totalProfitEl = findEl("totalProfit", "total-profit", "total-profit-el");
  const winRateEl = findEl("winRate", "win-rate", "win-rate-el");
  const openTradesEl = findEl("openTrades", "open-trades", "open-trades-el");

  function updateDashboard() {
    const trades = window.getTrades ? window.getTrades() : JSON.parse(localStorage.getItem('trades') || '[]');

    const totalProfit = trades.reduce((s, t) => s + Number(t.profit || 0), 0);
    const wins = trades.filter(t => Number(t.profit || 0) > 0).length;
    const total = trades.length;
    const winRate = total ? ((wins / total) * 100).toFixed(1) : 0;
    const balanceBase = 10000;
    const accountBalance = balanceBase + totalProfit;

    if (accountBalanceEl) accountBalanceEl.textContent = `$${Number(accountBalance).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    if (totalProfitEl) {
      totalProfitEl.textContent = `${totalProfit >= 0 ? '+' : '-'}$${Math.abs(Number(totalProfit)).toFixed(2)}`;
      totalProfitEl.className = totalProfit >= 0 ? 'value positive' : 'value negative';
    }
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    if (openTradesEl) openTradesEl.textContent = total;
  }

  // expose for scripts.js to call
  window.updateDashboard = updateDashboard;

  // initial run
  updateDashboard();

  // also listen to storage to refresh automatically when other tabs change
  window.addEventListener('storage', (e) => {
    if (e.key === 'trades') updateDashboard();
  });
});
