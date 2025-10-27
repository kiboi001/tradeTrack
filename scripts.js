// scripts.js (FINAL)
// Master CRUD + sync + balance management

(function () {
  // safe helpers
  const q = sel => document.querySelector(sel);
  const id = n => document.getElementById(n);

  // keys
  const TRADES_KEY = 'trades';
  const BAL_KEY = 'accountBalance';

  // load trades safely
  function readTrades() {
    try {
      const raw = localStorage.getItem(TRADES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error('readTrades parse error', e);
      return [];
    }
  }

  function saveTrades(arr) {
    try {
      localStorage.setItem(TRADES_KEY, JSON.stringify(arr));
      // notify everything
      updateAllViews();
      // also fire storage event for other tabs:
      // (cannot trigger real storage event in same tab; other tabs get it automatically)
    } catch (e) {
      console.error('saveTrades error', e);
    }
  }

  // normalize trade shape and profit sign
  function normalizeTrade(raw) {
    // raw expected fields: pair, profit (number or string), status/result (optional), lot, date, notes
    const profitNum = parseFloat(raw.profit ?? raw.result ?? 0);
    // if status provided and equals 'loss', force negative
    let profit = Number.isFinite(profitNum) ? profitNum : 0;
    if (raw.status && String(raw.status).toLowerCase() === 'loss') profit = -Math.abs(profit);
    // if profit value negative then status is loss
    const status = raw.status
      ? String(raw.status)
      : (profit < 0 ? 'loss' : 'win');

    return {
      id: raw.id || Date.now().toString(),
      pair: raw.pair || '',
      lot: raw.lot || '',
      profit: profit,
      status: status,
      date: raw.date || new Date().toISOString().split('T')[0],
      notes: raw.notes || ''
    };
  }

  // Public API: add or update
  function addOrUpdateTrade(raw, tradeId = null) {
    const trades = readTrades();
    const t = normalizeTrade(raw);
    if (tradeId) {
      const idx = trades.findIndex(x => x.id === tradeId);
      if (idx >= 0) { trades[idx] = { ...trades[idx], ...t }; }
      else trades.push(t);
    } else trades.push(t);
    saveTrades(trades);
  }

  function deleteTrade(idToRemove) {
    const trades = readTrades().filter(t => t.id !== idToRemove);
    saveTrades(trades);
  }

  // expose getter for other scripts
  window.getTrades = function () { return readTrades(); };
  window.addOrUpdateTrade = addOrUpdateTrade;
  window.deleteTrade = deleteTrade;

  // ---------- account balance ----------
  function readBalance() {
    const v = localStorage.getItem(BAL_KEY);
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  function saveBalance(n) {
    if (!Number.isFinite(n)) return;
    localStorage.setItem(BAL_KEY, String(n));
    updateAllViews();
  }
  window.getAccountBalance = readBalance;
  window.setAccountBalance = saveBalance;

  // ---------- UI hooks: journal form ----------
  // form ids expected: trade-form, pair, profitLoss (or result), status (optional), lot, date, notes, trade-table with tbody #journal-table tbody
  function wireForm() {
    const form = id('trade-form');
    if (!form) return;
    const pairEl = id('pair');
    const profitEl = id('profitLoss') || id('result') || null;
    const statusEl = id('status') || null; // optional
    const lotEl = id('lot');
    const dateEl = id('date');
    const notesEl = id('notes');
    const submitBtn = form.querySelector('button') || null;

    // handle submit
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const rawProfit = profitEl ? profitEl.value : '';
      const profitNum = parseFloat(rawProfit);
      if (!pairEl || !pairEl.value) return alert('Enter pair');
      if (profitEl && rawProfit.trim() === '') return alert('Enter profit or loss value');
      // prefer sign in value; but if status exists and is 'loss' ensure negative
      const candidate = {
        pair: pairEl.value.trim(),
        profit: Number.isFinite(profitNum) ? profitNum : 0,
        status: statusEl ? statusEl.value : (profitNum < 0 ? 'loss' : 'win'),
        lot: lotEl ? lotEl.value : '',
        date: (dateEl && dateEl.value) ? dateEl.value : new Date().toISOString().split('T')[0],
        notes: notesEl ? notesEl.value : ''
      };

      // If update mode
      if (submitBtn && submitBtn.dataset.mode === 'edit' && submitBtn.dataset.tradeId) {
        addOrUpdateTrade(candidate, submitBtn.dataset.tradeId);
        submitBtn.textContent = 'Add Trade';
        delete submitBtn.dataset.mode;
        delete submitBtn.dataset.tradeId;
      } else {
        addOrUpdateTrade(candidate, null);
      }
      form.reset();
    });
  }

  // ---------- UI hooks: journal table rendering ----------
  function renderJournalTable() {
    const tbody = document.querySelector('#journal-table tbody');
    if (!tbody) return;
    const trades = readTrades();
    tbody.innerHTML = '';
    trades.forEach((t) => {
      const tr = document.createElement('tr');
      const cls = t.profit > 0 ? 'positive' : (t.profit < 0 ? 'negative' : 'neutral');
      tr.innerHTML = `
        <td>${t.date}</td>
        <td>${t.pair}</td>
        <td>${t.lot || ''}</td>
        <td class="pnl ${cls}">${String(t.status || '').toUpperCase()}</td>
        <td class="pnl ${cls}">$${Number(t.profit || 0).toFixed(2)}</td>
        <td>${(t.notes || '').substring(0,50)}${(t.notes && t.notes.length>50)?'...':''}</td>
        <td>
          <button class="edit-btn" data-id="${t.id}">Edit</button>
          <button class="delete-btn" data-id="${t.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // attach
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Delete trade?')) return;
        deleteTrade(btn.dataset.id);
      };
    });

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = () => {
        const trade = readTrades().find(x => x.id === btn.dataset.id);
        if (!trade) return;
        // fill form (defensive)
        if (id('pair')) id('pair').value = trade.pair || '';
        if (id('profitLoss')) id('profitLoss').value = trade.profit;
        if (id('result') && !id('profitLoss')) id('result').value = trade.profit;
        if (id('status')) id('status').value = trade.status || (trade.profit < 0 ? 'loss' : 'win');
        if (id('lot')) id('lot').value = trade.lot || '';
        if (id('date')) id('date').value = trade.date || '';
        if (id('notes')) id('notes').value = trade.notes || '';

        const formBtn = document.querySelector('#trade-form button');
        if (formBtn) {
          formBtn.textContent = 'Update Trade';
          formBtn.dataset.mode = 'edit';
          formBtn.dataset.tradeId = trade.id;
          formBtn.scrollIntoView({ behavior: 'smooth' });
        }
      };
    });
  }

  // ---------- Stats summary ----------
  function computeSummary() {
    const trades = readTrades();
    const totalTrades = trades.length;
    const wins = trades.filter(t => Number(t.profit) > 0).length;
    const totalProfit = trades.reduce((s, t) => s + Number(t.profit || 0), 0);
    const winRate = totalTrades ? (wins / totalTrades * 100) : 0;
    const best = trades.length ? Math.max(...trades.map(t => Number(t.profit || 0))) : 0;
    const worst = trades.length ? Math.min(...trades.map(t => Number(t.profit || 0))) : 0;
    return { totalTrades, wins, totalProfit, winRate, best, worst };
  }

  function updateStatsUI() {
    const s = computeSummary();
    // try various IDs
    const setText = (ids, text) => {
      for (const i of ids) {
        const el = id(i);
        if (el) { el.textContent = text; break; }
      }
    };
    setText(['totalTrades','total-trades','total-trades-el'], s.totalTrades);
    setText(['winning-trades','winningTrades','winsCount'], s.wins);
    setText(['totalProfit','total-profit','total-profit'], `$${s.totalProfit.toFixed(2)}`);
    setText(['winRate','win-rate','win-rate-el'], `${s.winRate.toFixed(1)}%`);
    setText(['bestTrade','best-trade'], `$${s.best.toFixed(2)}`);
    setText(['worstTrade','worst-trade'], `$${s.worst.toFixed(2)}`);
  }

  // ---------- Dashboard update ----------
  function updateDashboardUI() {
    const s = computeSummary();
    const storedBalance = readBalance();
    const base = (Number.isFinite(storedBalance) ? storedBalance : null);
    const balance = (base !== null) ? Number(base) : (10000 + s.totalProfit);
    // put into possible IDs
    const setText = (ids, text) => {
      for (const i of ids) {
        const el = id(i);
        if (el) { el.textContent = text; break; }
      }
    };
    // account balance
    setText(['accountBalance','account-balance','account-balance-el','account-balance'], `$${Number(balance).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`);
    // total profit
    const profText = `${s.totalProfit >= 0 ? '+' : '-'}$${Math.abs(s.totalProfit).toFixed(2)}`;
    setText(['totalProfit','total-profit','total-profit-el'], profText);
    // win rate
    setText(['winRate','win-rate','win-rate-el'], `${s.winRate.toFixed(1)}%`);
    // open trades / total trades
    setText(['openTrades','open-trades','open-trades-el'], s.totalTrades);
    // apply classes to profit element if present
    const profitEl = id('totalProfit') || id('total-profit') || id('total-profit-el');
    if (profitEl) {
      profitEl.className = s.totalProfit > 0 ? 'value positive' : (s.totalProfit < 0 ? 'value negative' : 'value neutral');
    }
  }

  // main updater called after any change
  window.updateAllViews = function () {
    renderJournalTable();
    updateStatsUI();
    updateDashboardUI();
    if (typeof window.updateCharts === 'function') {
      try { window.updateCharts(); } catch (e) { console.error('updateCharts error', e); }
    }
  };

  // init
  document.addEventListener('DOMContentLoaded', () => {
    wireForm();
    renderJournalTable();
    updateAllViews();
    // balance input wiring if exists
    const balInput = id('balanceInput');
    if (balInput) {
      // populate
      const stored = readBalance();
      if (stored !== null) balInput.value = Number(stored);
      balInput.addEventListener('change', (e) => {
        const v = parseFloat(e.target.value);
        if (!Number.isFinite(v)) return alert('Enter valid number');
        saveBalance(v);
      });
    }
  });

  // storage cross-tab
  window.addEventListener('storage', (e) => {
    if (e.key === TRADES_KEY) {
      // update in-memory? not necessary since we always read from localStorage
      updateAllViews();
    }
    if (e.key === BAL_KEY) updateAllViews();
  });

  // expose a small helper to bootstrap sample data for quick testing in console
  window.__seedTrades = function (sampleArray) {
    if (!Array.isArray(sampleArray)) return;
    const norm = sampleArray.map(normalizeTrade);
    saveTrades(norm);
  };
})();
