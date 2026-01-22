// dashboard.js (FINAL)
document.addEventListener('DOMContentLoaded', () => {
  function find(...ids) {
    for (const i of ids) {
      const e = document.getElementById(i);
      if (e) return e;
    }
    return null;
  }

  const acctEl = find('accountBalance', 'account-balance', 'account-balance-el', 'account-balance');
  const profitEl = find('totalProfit', 'total-profit', 'total-profit-el');
  const winRateEl = find('winRate', 'win-rate', 'win-rate-el');
  const openEl = find('openTrades', 'open-trades', 'open-trades-el');

  function refresh() {
    const trades = window.getTrades ? window.getTrades() : [];
    const totalProfit = trades.reduce((s, t) => s + Number(t.profit || 0), 0);
    const wins = trades.filter(t => Number(t.profit || 0) > 0).length;
    const total = trades.length;
    const winRate = total ? ((wins / total) * 100).toFixed(1) : '0.0';

    // account balance: Initial Balance + Total Profit
    const initialBal = window.getInitialBalance ? window.getInitialBalance() : 0;
    const balance = initialBal + totalProfit;

    if (acctEl) acctEl.textContent = `$${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (profitEl) {
      profitEl.textContent = `${totalProfit >= 0 ? '+' : '-'}$${Math.abs(totalProfit).toFixed(2)}`;
      profitEl.className = totalProfit >= 0 ? 'value positive' : 'value negative';
    }
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    if (openEl) openEl.textContent = total;
  }

  // expose for scripts to call
  window.updateDashboard = refresh;

  // initial run
  refresh();

  // update on storage changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'trades' || e.key === 'initialBalance') refresh();
  });
});
