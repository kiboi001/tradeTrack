// scripts.js (updated)
// =======================================
// 1. DOM REFERENCES & INITIAL SETUP
// =======================================

const tradeForm = document.getElementById('trade-form');
const journalTableBody = document.querySelector('#journal-table tbody');
const addTradeButton = tradeForm ? tradeForm.querySelector('button') : null;
let trades = JSON.parse(localStorage.getItem("trades") || "[]");

// Defensive: ensure trades is an array
if (!Array.isArray(trades)) trades = [];

// Helper to safely find elements by multiple possible IDs
function findEl(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  // Set current date if element present
  const dateEl = findEl("currentDate", "date");
  if (dateEl) dateEl.textContent = new Date().toDateString();

  // Render Journal table if applicable
  if (journalTableBody) renderJournalTable();

  // Update stats + dashboard + charts on load
  updateAllViews();
});

// =======================================
// 2. DATA UTILITIES (CRUD)
// =======================================

function saveTrades() {
  localStorage.setItem("trades", JSON.stringify(trades));
  // notify other tabs/pages (storage event fires only on other tabs,
  // so we also call updateAllViews here)
  updateAllViews();
}

function addOrUpdateTrade(tradeData, tradeId = null) {
  // Normalizing: ensure profit is Number and sign is respected
  let profit = Number(tradeData.profit);
  if (isNaN(profit)) profit = 0;

  // If tradeData includes a 'result' field that is "loss" or "win",
  // interpret profit sign accordingly (if provided positive)
  if (tradeData.result && typeof tradeData.result === 'string') {
    const r = tradeData.result.toLowerCase();
    if (r === 'loss') profit = -Math.abs(profit);
    if (r === 'win') profit = Math.abs(profit);
  }

  const normalized = {
    id: tradeId || Date.now().toString(),
    pair: tradeData.pair || tradeData.symbol || '',
    lot: tradeData.lot || tradeData.lots || '',
    profit,
    result: (tradeData.result && tradeData.result.toString()) || (profit >= 0 ? 'win' : 'loss'),
    date: tradeData.date || new Date().toISOString().split('T')[0],
    notes: tradeData.notes || ''
  };

  if (tradeId) {
    const idx = trades.findIndex(t => t.id === tradeId);
    if (idx > -1) {
      trades[idx] = { ...trades[idx], ...normalized };
    } else {
      trades.push(normalized);
    }
  } else {
    trades.push(normalized);
  }

  saveTrades();
  if (journalTableBody) renderJournalTable();
}

// Expose simple API to add trade programmatically
window.addTrade = function (tradeObj) {
  addOrUpdateTrade(tradeObj, null);
};

// =======================================
// 3. STATS & ANALYSIS
// =======================================

function computeSummary(tradesArr = trades) {
  const totalTrades = tradesArr.length;
  const wins = tradesArr.filter(t => Number(t.profit) > 0).length;
  const totalProfit = tradesArr.reduce((sum, t) => sum + Number(t.profit || 0), 0);
  const winRate = totalTrades ? ((wins / totalTrades) * 100) : 0;
  const bestTrade = tradesArr.length ? Math.max(...tradesArr.map(t => Number(t.profit || 0))) : 0;
  const worstTrade = tradesArr.length ? Math.min(...tradesArr.map(t => Number(t.profit || 0))) : 0;

  return {
    totalTrades,
    wins,
    totalProfit,
    winRate,
    bestTrade,
    worstTrade
  };
}

function updateStats() {
  // Only update if stats elements exist
  const totalTradesEl = findEl("totalTrades", "total-trades");
  const winRateEl = findEl("winRate", "win-rate");
  const totalProfitEl = findEl("totalProfit", "total-profit");
  const bestTradeEl = findEl("bestTrade", "best-trade");
  const worstTradeEl = findEl("worstTrade", "worst-trade");

  if (!totalTradesEl && !winRateEl && !totalProfitEl) return;

  const summary = computeSummary(trades);

  if (totalTradesEl) totalTradesEl.innerText = summary.totalTrades;
  if (winRateEl) winRateEl.innerText = summary.winRate.toFixed(1) + "%";
  if (totalProfitEl) {
    totalProfitEl.innerText = `$${summary.totalProfit.toFixed(2)}`;
    totalProfitEl.className = summary.totalProfit > 0 ? 'value positive' : (summary.totalProfit < 0 ? 'value negative' : 'value neutral');
  }
  if (bestTradeEl) bestTradeEl.innerText = `$${summary.bestTrade.toFixed(2)}`;
  if (worstTradeEl) worstTradeEl.innerText = `$${summary.worstTrade.toFixed(2)}`;
}

// =======================================
// 4. JOURNAL TABLE RENDERING (UX)
// =======================================

function renderJournalTable() {
  if (!journalTableBody) return;
  journalTableBody.innerHTML = '';

  trades.forEach(trade => {
    const row = document.createElement('tr');
    const pnlStatus = trade.profit > 0 ? 'positive' : (trade.profit < 0 ? 'negative' : 'neutral');
    const formattedProfit = Number(trade.profit).toFixed(2);

    row.innerHTML = `
      <td>${trade.date}</td>
      <td>${trade.pair}</td>
      <td>${trade.lot}</td>
      <td class="pnl ${pnlStatus}">${trade.result.toUpperCase()}</td>
      <td class="pnl ${pnlStatus}">$${formattedProfit}</td>
      <td>${(trade.notes || '').substring(0, 50)}${(trade.notes && trade.notes.length>50)?'...':''}</td>
      <td>
        <button class="edit-btn" data-id="${trade.id}">Edit</button>
        <button class="delete-btn" data-id="${trade.id}">Delete</button>
      </td>
    `;
    journalTableBody.appendChild(row);
  });

  attachRowEventListeners();
}

// =======================================
// 5. EDIT & DELETE LOGIC (CRUD)
// =======================================

function attachRowEventListeners() {
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.removeEventListener('click', handleDelete);
    button.addEventListener('click', handleDelete);
  });

  document.querySelectorAll('.edit-btn').forEach(button => {
    button.removeEventListener('click', handleEdit);
    button.addEventListener('click', handleEdit);
  });
}

function handleDelete(e) {
  const tradeId = e.target.dataset.id;
  if (!tradeId) return;
  if (!confirm("Are you sure you want to delete this trade?")) return;

  trades = trades.filter(t => t.id !== tradeId);
  saveTrades();
  renderJournalTable();
  updateStats();
  // trigger charts/dash update
  if (typeof window.updateCharts === 'function') window.updateCharts();
}

function handleEdit(e) {
  const tradeId = e.target.dataset.id;
  if (!tradeId) return;
  const trade = trades.find(t => t.id === tradeId);
  if (!trade) return;

  // populate the form; handle missing fields defensively
  const pairEl = document.getElementById('pair');
  const lotEl = document.getElementById('lot');
  const profitEl = document.getElementById('profitLoss') || document.getElementById('result') || null;
  const dateEl = document.getElementById('date');
  const notesEl = document.getElementById('notes');

  if (pairEl) pairEl.value = trade.pair || '';
  if (lotEl) lotEl.value = trade.lot || '';
  if (profitEl) profitEl.value = trade.profit;
  if (dateEl) dateEl.value = trade.date;
  if (notesEl) notesEl.value = trade.notes || '';

  if (addTradeButton) {
    addTradeButton.textContent = 'Update Trade';
    addTradeButton.dataset.mode = 'edit';
    addTradeButton.dataset.tradeId = tradeId;
  }

  tradeForm.scrollIntoView({ behavior: 'smooth' });
}

function resetFormAndButton() {
  if (tradeForm) tradeForm.reset();
  if (addTradeButton) {
    addTradeButton.textContent = 'Add Trade';
    delete addTradeButton.dataset.mode;
    delete addTradeButton.dataset.tradeId;
  }
}

// =======================================
// 6. FORM HANDLING & VALIDATION
// =======================================

if (tradeForm) {
  tradeForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Read form fields (defensive)
    const pair = (document.getElementById('pair') ? document.getElementById('pair').value.trim() : '') ;
    const lot = (document.getElementById('lot') ? document.getElementById('lot').value.trim() : '');
    const profitLossValue = (document.getElementById('profitLoss') ? document.getElementById('profitLoss').value.trim() : (document.getElementById('result') ? document.getElementById('result').value.trim() : ''));
    const date = (document.getElementById('date') ? document.getElementById('date').value.trim() : new Date().toISOString().split('T')[0]);
    const notes = (document.getElementById('notes') ? document.getElementById('notes').value.trim() : '');

    if (!pair || !lot || profitLossValue === '' || profitLossValue === null) {
      alert("Please fill in all required fields (Pair, Lot, P&L).");
      return;
    }

    let profit = parseFloat(profitLossValue);
    if (isNaN(profit)) profit = 0;

    // Determine result from profit sign
    const result = profit >= 0 ? 'Win' : 'Loss';

    const tradeData = { pair, lot, profit, result, date, notes };

    // Check if we're updating an existing trade
    const mode = addTradeButton ? addTradeButton.dataset.mode : null;
    const tradeId = addTradeButton ? addTradeButton.dataset.tradeId : null;

    if (mode === 'edit' && tradeId) {
      addOrUpdateTrade(tradeData, tradeId);
    } else {
      addOrUpdateTrade(tradeData, null);
    }

    resetFormAndButton();

    // If other modules need to refresh (dashboard, charts, stats)
    if (typeof window.updateCharts === 'function') window.updateCharts();
  });
}

// =======================================
// 7. CROSS-TAB SYNC & PUBLIC API
// =======================================

// Listen for storage changes (other tab)
window.addEventListener('storage', (e) => {
  if (e.key === 'trades') {
    try {
      trades = JSON.parse(e.newValue || '[]');
    } catch {
      trades = [];
    }
    if (journalTableBody) renderJournalTable();
    updateAllViews();
  }
});

// expose a getter
window.getTrades = () => JSON.parse(localStorage.getItem('trades') || '[]');

// Unified function to update everything
function updateAllViews() {
  // Recompute stats
  updateStats();
  // Re-render journal if present
  if (journalTableBody) renderJournalTable();
  // Update dashboard and charts if functions exist
  if (typeof window.updateDashboard === 'function') window.updateDashboard();
  if (typeof window.updateCharts === 'function') window.updateCharts();
}
// run once on load
updateAllViews();
