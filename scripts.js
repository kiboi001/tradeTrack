// scripts.js (FINAL)
// Master CRUD + sync + balance management

(function () {
  // safe helpers
  const q = sel => document.querySelector(sel);
  const id = n => document.getElementById(n);

  // keys
  const TRADES_KEY = 'trades';
  const INIT_BAL_KEY = 'initialBalance';
  const TRANSACTIONS_KEY = 'transactions'; // NEW

  // ---------- Local State Cache ----------
  let TRADES = [];
  let TRANSACTIONS = [];
  let INITIAL_BALANCE = 0;
  let isFirebaseReady = false;
  let CURRENT_USER_ID = null;

  // Global init function called by auth.js
  window.initAppWithUser = function (userId) {
    console.log("scripts.js: initAppWithUser called with", userId);
    CURRENT_USER_ID = userId;
    initFirebaseSync();
  };

  // Check if auth.js already found a user before we loaded
  if (window.pendingUser) {
    console.log("scripts.js: Found pending user, initializing...");
    window.initAppWithUser(window.pendingUser.uid);
    window.pendingUser = null; // clear
  }

  // load trades safely
  function readTrades() {
    return TRADES;
  }

  async function saveTrades(arr) {
    if (!isFirebaseReady) return;
    // We update the whole collection or individual docs? 
    // Usually better to update individual docs in addOrUpdateTrade.
    // But if normalizeTrade/saveTrades is used for bulk, we handle it:
    for (const t of arr) {
      await db.collection('users').doc(CURRENT_USER_ID).collection('trades').doc(t.id).set(t);
    }
  }

  // normalize trade shape
  function normalizeTrade(raw) {
    const profitNum = parseFloat(raw.profit ?? raw.result ?? 0);
    let profit = Number.isFinite(profitNum) ? profitNum : 0;
    if (raw.status && String(raw.status).toLowerCase() === 'loss') profit = -Math.abs(profit);

    const status = raw.status
      ? String(raw.status)
      : (profit < 0 ? 'loss' : 'win');

    return {
      id: raw.id || Date.now().toString(),
      pair: raw.pair || '',
      lot: raw.lot || '',
      direction: raw.direction || 'buy',
      entryTime: raw.entryTime || '',
      exitTime: raw.exitTime || '',
      rr: parseFloat(raw.rr) || 0,
      strategy: raw.strategy || '',
      screenshot: raw.screenshot || null,
      profit: profit,
      status: status,
      date: raw.date || new Date().toISOString().split('T')[0],
      notes: raw.notes || ''
    };
  }

  // Public API: add or update
  async function addOrUpdateTrade(raw, tradeId = null) {
    const t = normalizeTrade(raw);
    if (tradeId) t.id = tradeId;
    if (isFirebaseReady && CURRENT_USER_ID) {
      console.log(`Saving trade ${t.id} to Firebase for user ${CURRENT_USER_ID}...`);
      // If we have a local base64 image, upload to Storage first
      if (t.screenshot && t.screenshot.startsWith('data:image')) {
        try {
          const storageRef = storage.ref(`trades/${CURRENT_USER_ID}/${t.id}.png`);
          const snapshot = await storageRef.putString(t.screenshot, 'data_url');
          t.screenshot = await snapshot.ref.getDownloadURL();
        } catch (err) {
          console.error('Storage upload failed', err);
        }
      }
      try {
        await db.collection('users').doc(CURRENT_USER_ID).collection('trades').doc(t.id).set(t);
        console.log("Trade saved successfully to Firestore.");
      } catch (e) {
        console.error("Firestore Save Error:", e);
        alert("Error saving trade: " + e.message);
      }
    } else {
      // fallback to local for now if firebase not ready (unlikely after init)
      console.warn('Firebase not ready, using local storage fallback');
      const trades = JSON.parse(localStorage.getItem(TRADES_KEY) || '[]');
      const idx = trades.findIndex(x => x.id === t.id);
      if (idx >= 0) trades[idx] = t; else trades.push(t);
      localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
      TRADES = trades;
      updateAllViews();
    }
  }

  async function deleteTrade(idToRemove) {
    if (isFirebaseReady && CURRENT_USER_ID) {
      await db.collection('users').doc(CURRENT_USER_ID).collection('trades').doc(idToRemove).delete();
      // Also try to delete image from storage
      try {
        await storage.ref(`trades/${CURRENT_USER_ID}/${idToRemove}.png`).delete();
      } catch (e) { }
    } else {
      const trades = JSON.parse(localStorage.getItem(TRADES_KEY) || '[]').filter(t => t.id !== idToRemove);
      localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
      TRADES = trades;
      updateAllViews();
    }
  }

  // expose getter for other scripts
  window.getTrades = () => TRADES;
  window.addOrUpdateTrade = addOrUpdateTrade;
  window.deleteTrade = deleteTrade;

  // ---------- Transaction Management ----------
  function readTransactions() {
    return TRANSACTIONS;
  }

  async function saveTransaction(transaction) {
    const normalized = {
      id: transaction.id || Date.now().toString(),
      type: transaction.type || 'withdrawal',
      amount: parseFloat(transaction.amount) || 0,
      date: transaction.date || new Date().toISOString().split('T')[0],
      notes: transaction.notes || ''
    };
    if (isFirebaseReady && CURRENT_USER_ID) {
      await db.collection('users').doc(CURRENT_USER_ID).collection('transactions').doc(normalized.id).set(normalized);
    } else {
      const txs = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
      txs.push(normalized);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
      TRANSACTIONS = txs;
      updateAllViews();
    }
  }

  async function deleteTransaction(idToRemove) {
    if (isFirebaseReady && CURRENT_USER_ID) {
      await db.collection('users').doc(CURRENT_USER_ID).collection('transactions').doc(idToRemove).delete();
    } else {
      const txs = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]').filter(t => t.id !== idToRemove);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
      TRANSACTIONS = txs;
      updateAllViews();
    }
  }

  window.getTransactions = readTransactions;
  window.saveTransaction = saveTransaction;
  window.deleteTransaction = deleteTransaction;

  // ---------- Settings (Balance) ----------
  function readInitialBalance() {
    return INITIAL_BALANCE;
  }
  async function saveInitialBalance(n) {
    if (!Number.isFinite(n)) return;
    INITIAL_BALANCE = n;
    if (isFirebaseReady && CURRENT_USER_ID) {
      await db.collection('users').doc(CURRENT_USER_ID).collection('settings').doc('account').set({ initialBalance: n }, { merge: true });
    } else {
      localStorage.setItem(INIT_BAL_KEY, String(n));
      updateAllViews();
    }
  }
  window.getInitialBalance = readInitialBalance;
  window.setInitialBalance = saveInitialBalance;

  // ---------- reset data ----------
  async function resetAllData() {
    if (!CURRENT_USER_ID) return;
    if (!confirm('ARE YOU SURE? This will delete ALL trades and reset your balance in the CLOUD. This cannot be undone.')) return;

    try {
      if (isFirebaseReady) {
        const userRef = db.collection('users').doc(CURRENT_USER_ID);

        // Delete Trades
        const tradesSnap = await userRef.collection('trades').get();
        const tradesBatch = db.batch();
        tradesSnap.forEach(doc => {
          tradesBatch.delete(doc.ref);
        });
        await tradesBatch.commit();

        // Delete Transactions
        const txSnap = await userRef.collection('transactions').get();
        const txBatch = db.batch();
        txSnap.forEach(doc => {
          txBatch.delete(doc.ref);
        });
        await txBatch.commit();

        // Reset settings
        await userRef.collection('settings').doc('account').delete();
      }

      localStorage.removeItem(TRADES_KEY);
      localStorage.removeItem(INIT_BAL_KEY);
      localStorage.removeItem(TRANSACTIONS_KEY);

      const balInput = id('initialBalanceInput');
      if (balInput) balInput.value = '';

      alert('All data has been reset.');
      window.location.reload(); // Refresh to clear local state
    } catch (e) {
      console.error('Reset failed', e);
      alert('Error resetting data: ' + e.message);
    }
  }
  window.resetAllData = resetAllData;

  // ---------- UI hooks: journal form ----------
  // form ids expected: trade-form, pair, profitLoss (or result), status (optional), lot, date, notes, trade-table with tbody #journal-table tbody
  function wireForm() {
    const form = id('trade-form');
    if (!form) return;
    const pairEl = id('pair');
    const profitEl = id('profitLoss') || id('result') || null;
    const statusEl = id('status') || id('result') || null;
    const lotEl = id('lot');
    const directionEl = id('direction');
    const entryTimeEl = id('entryTime');
    const exitTimeEl = id('exitTime');
    const rrEl = id('rr');
    const strategyEl = id('strategy');
    const fileEl = id('screenshot');
    const dateEl = id('date');
    const notesEl = id('notes');
    const submitBtn = form.querySelector('button') || null;

    // handle submit
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const rawProfit = profitEl ? profitEl.value : '';
      const profitNum = parseFloat(rawProfit);
      if (!pairEl || !pairEl.value) return alert('Enter pair');
      if (profitEl && rawProfit.trim() === '') return alert('Enter profit or loss value');

      // Process Screenshot
      let screenData = null;
      if (fileEl && fileEl.files && fileEl.files[0]) {
        const file = fileEl.files[0];
        if (file.size > 300 * 1024) { // 300KB limit
          return alert('Image file is too large! Please use an image under 300KB.');
        }
        try {
          screenData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch (err) {
          console.error('File read error', err);
          return alert('Error reading image file');
        }
      } else {
        // preserve existing screenshot if editing and no new file selected
        if (submitBtn && submitBtn.dataset.mode === 'edit' && submitBtn.dataset.tradeId) {
          const existing = readTrades().find(t => t.id === submitBtn.dataset.tradeId);
          if (existing) screenData = existing.screenshot;
        }
      }

      const candidate = {
        pair: pairEl.value.trim(),
        profit: Number.isFinite(profitNum) ? profitNum : 0,
        status: statusEl ? statusEl.value : (profitNum < 0 ? 'loss' : 'win'),
        lot: lotEl ? lotEl.value : '',
        direction: directionEl ? directionEl.value : 'buy', // NEW
        entryTime: entryTimeEl ? entryTimeEl.value : '', // NEW
        exitTime: exitTimeEl ? exitTimeEl.value : '', // NEW
        rr: rrEl ? rrEl.value : 0,
        strategy: strategyEl ? strategyEl.value : '',
        screenshot: screenData,
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
      if (fileEl) fileEl.value = ''; // Clear file input
    });
  }

  // ---------- UI hooks: journal table rendering ----------
  function renderJournalTable() {
    const tbody = document.querySelector('#journal-table tbody');
    if (!tbody) return;
    let trades = readTrades();

    // Sort chronological: oldest first
    trades.sort((a, b) => new Date(a.date) - new Date(b.date));

    tbody.innerHTML = '';
    trades.forEach((t) => {
      const tr = document.createElement('tr');
      const cls = t.profit > 0 ? 'positive' : (t.profit < 0 ? 'negative' : 'neutral');
      const rrDisplay = t.rr ? `1:${t.rr}` : '-';

      // Calculate duration
      let durationDisplay = '-';
      if (t.entryTime && t.exitTime) {
        const [eh, em] = t.entryTime.split(':').map(Number);
        const [xh, xm] = t.exitTime.split(':').map(Number);
        const entryMins = eh * 60 + em;
        const exitMins = xh * 60 + xm;
        const diffMins = exitMins - entryMins;
        if (diffMins > 0) {
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          durationDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }
      }

      // Screenshot Button
      let screenHtml = '-';
      if (t.screenshot) {
        screenHtml = `<button class="view-btn" data-img="${t.screenshot}" style="background:none; border:none; cursor:pointer;" title="View Screenshot">📷</button>`;
      }

      tr.innerHTML = `
        <td>${t.date}</td>
        <td>${t.pair}</td>
        <td style="color: ${t.direction === 'buy' ? '#00E676' : '#FF5252'};">${(t.direction || 'buy').toUpperCase()}</td>
        <td>${durationDisplay}</td>
        <td>${t.lot || ''}</td>
        <td>${t.strategy || '-'}</td>
        <td>${rrDisplay}</td>
        <td class="pnl ${cls}">${String(t.status || '').toUpperCase()}</td>
        <td class="pnl ${cls}">$${Number(t.profit || 0).toFixed(2)}</td>
        <td>${(t.notes || '').substring(0, 50)}${(t.notes && t.notes.length > 50) ? '...' : ''}</td>
        <td>${screenHtml}</td>
        <td>
          <button class="edit-btn" data-id="${t.id}">Edit</button>
          <button class="delete-btn" data-id="${t.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach View Screenshot Handler
    tbody.querySelectorAll('.view-btn').forEach(btn => {
      btn.onclick = () => {
        const imgData = btn.dataset.img;
        const win = window.open("", "Screenshot", "width=800,height=600");
        if (win) {
          win.document.write(`<img src="${imgData}" style="max-width:100%; height:auto;">`);
        }
      };
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

        // Fill ALL form fields
        if (id('pair')) id('pair').value = trade.pair || '';
        if (id('lot')) id('lot').value = trade.lot || '';
        if (id('direction')) id('direction').value = trade.direction || 'buy';
        if (id('entryTime')) id('entryTime').value = trade.entryTime || '';
        if (id('exitTime')) id('exitTime').value = trade.exitTime || '';
        if (id('rr')) id('rr').value = trade.rr || '';
        if (id('strategy')) id('strategy').value = trade.strategy || '';
        if (id('result')) id('result').value = trade.status || 'win';
        if (id('profitLoss')) id('profitLoss').value = trade.profit;
        if (id('date')) id('date').value = trade.date || '';
        if (id('notes')) id('notes').value = trade.notes || '';
        // Note: Cannot set file input for security

        const formBtn = document.querySelector('#trade-form button[type="submit"]');
        if (formBtn) {
          formBtn.textContent = 'Update Trade';
          formBtn.dataset.mode = 'edit';
          formBtn.dataset.tradeId = trade.id;
          formBtn.scrollIntoView({ behavior: 'smooth' });
        }
      };
    });
  }


  // ---------- Filtering Logic ----------
  function getFilteredTrades() {
    let trades = readTrades();
    const startEl = id('filter-start');
    const endEl = id('filter-end');
    const pairEl = id('filter-pair');
    const resultEl = id('filter-result');

    // Date Filter
    if (startEl && startEl.value) {
      trades = trades.filter(t => t.date >= startEl.value);
    }
    if (endEl && endEl.value) {
      trades = trades.filter(t => t.date <= endEl.value);
    }

    // Pair Filter
    if (pairEl && pairEl.value) {
      trades = trades.filter(t => t.pair === pairEl.value);
    }

    // Result Filter
    if (resultEl && resultEl.value) {
      if (resultEl.value === 'win') trades = trades.filter(t => t.profit > 0);
      else if (resultEl.value === 'loss') trades = trades.filter(t => t.profit <= 0);
    }

    // Direction Filter
    const directionEl = id('filter-direction');
    if (directionEl && directionEl.value) {
      trades = trades.filter(t => t.direction === directionEl.value);
    }

    return trades;
  }

  // Populate Filter Dropdowns
  function populateFilters() {
    const trades = readTrades();
    const pairEl = id('filter-pair');
    if (!pairEl) return;

    // Unique pairs
    const pairs = [...new Set(trades.map(t => t.pair).filter(p => p))].sort();

    // Save current selection
    const current = pairEl.value;

    // Rebuild options
    pairEl.innerHTML = '<option value="">All Pairs</option>';
    pairs.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      pairEl.appendChild(opt);
    });

    pairEl.value = current;
  }

  // ---------- Stats summary (Formatted) ----------
  function computeSummary(tradesOverride = null) {
    const trades = tradesOverride || readTrades();
    const totalTrades = trades.length;
    const wins = trades.filter(t => Number(t.profit) > 0).length;
    const totalProfit = trades.reduce((s, t) => s + Number(t.profit || 0), 0);
    const winRate = totalTrades ? (wins / totalTrades * 100) : 0;
    const best = trades.length ? Math.max(...trades.map(t => Number(t.profit || 0))) : 0;
    const worst = trades.length ? Math.min(...trades.map(t => Number(t.profit || 0))) : 0;

    // Average RR Calculation
    let avgRR = 0;
    if (totalTrades > 0) {
      const sumRR = trades.reduce((acc, t) => acc + (parseFloat(t.rr) || 0), 0);
      avgRR = sumRR / totalTrades;
    }

    return { totalTrades, wins, totalProfit, winRate, best, worst, avgRR };
  }

  function updateStatsUI() {
    // If we are on stats page with filters, use filtered trades for STATS CARDS
    // If dashboard, use ALL trades
    const isStatsPage = !!id('filter-start');
    const trades = isStatsPage ? getFilteredTrades() : readTrades();

    const s = computeSummary(trades);
    const initialBal = readInitialBalance();

    // try various IDs
    const setText = (ids, text) => {
      for (const i of ids) {
        const el = id(i);
        if (el) { el.textContent = text; break; }
      }
    };
    setText(['totalTrades', 'total-trades', 'total-trades-el'], s.totalTrades);
    setText(['winning-trades', 'winningTrades', 'winsCount'], s.wins);
    setText(['totalProfit', 'total-profit', 'total-profit'], `$${s.totalProfit.toFixed(2)}`);
    setText(['winRate', 'win-rate', 'win-rate-el'], `${s.winRate.toFixed(1)}%`);
    setText(['bestTrade', 'best-trade'], `$${s.best.toFixed(2)}`);
    // setText(['worstTrade', 'worst-trade'], `$${s.worst.toFixed(2)}`); // Optional if used

    // NEW: Average RR
    setText(['avgRR', 'avg-rr', 'average-rr'], `1:${s.avgRR.toFixed(2)}`);
    // Update initial balance display if exists
    const initBalEl = id('initialBalanceDisplay');
    if (initBalEl) initBalEl.textContent = `$${initialBal.toFixed(2)}`;

    // Trigger Chart Updates if function exists
    if (window.updateCharts) window.updateCharts(trades);
  }

  // ---------- Dashboard update ----------
  function updateDashboardUI() {
    const s = computeSummary();
    const initialBal = readInitialBalance();

    // Calculate transactions totals
    const transactions = readTransactions();
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // NEW FORMULA: Initial + P/L + Deposits - Withdrawals
    const currentBalance = initialBal + s.totalProfit + totalDeposits - totalWithdrawals;

    // put into possible IDs
    const setText = (ids, text) => {
      for (const i of ids) {
        const el = id(i);
        if (el) { el.textContent = text; break; }
      }
    };
    // account balance = Initial + Profit
    setText(['accountBalance', 'account-balance', 'account-balance-el', 'account-balance'], `$${Number(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    // total profit
    const profText = `${s.totalProfit >= 0 ? '+' : '-'}$${Math.abs(s.totalProfit).toFixed(2)}`;
    setText(['totalProfit', 'total-profit', 'total-profit-el'], profText);
    // win rate
    setText(['winRate', 'win-rate', 'win-rate-el'], `${s.winRate.toFixed(1)}%`);
    // open trades / total trades
    setText(['openTrades', 'open-trades', 'open-trades-el'], s.totalTrades);
    // apply classes to profit element if present
    const profitEl = id('totalProfit') || id('total-profit') || id('total-profit-el');
    if (profitEl) {
      profitEl.className = s.totalProfit > 0 ? 'value positive' : (s.totalProfit < 0 ? 'value negative' : 'value neutral');
    }
  }

  // main updater called after any change
  // main updater called after any change
  window.updateAllViews = function () {
    renderJournalTable();
    renderGallery();
    renderTransactionLog();
    renderRecentTradesDashboard();
    populateFilters();
    updateStatsUI();
    updateDashboardUI();
    // Also sync the balance input if it exists
    const balInput = id('initialBalanceInput');
    if (balInput && document.activeElement !== balInput) {
      balInput.value = readInitialBalance();
    }
  };

  // ---------- Screenshot Gallery Rendering ----------
  function renderGallery() {
    const galleryGrid = id('gallery-grid');
    if (!galleryGrid) return;

    const trades = readTrades().filter(t => t.screenshot);

    if (trades.length === 0) {
      galleryGrid.innerHTML = '<p style="color: #888; grid-column: 1/-1;">No screenshots yet.</p>';
      return;
    }

    galleryGrid.innerHTML = '';
    trades.forEach(t => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `<img src="${t.screenshot}" alt="${t.pair}">`;
      item.onclick = () => openModal(t);
      galleryGrid.appendChild(item);
    });
  }

  function openModal(trade) {
    const modal = id('imgModal');
    const modalImg = id('modalImg');
    const caption = id('modalCaption');

    if (!modal || !modalImg || !caption) return;

    modal.style.display = 'block';
    modalImg.src = trade.screenshot;

    const statusColor = trade.profit > 0 ? '#00E676' : '#FF5252';
    const statusText = trade.profit > 0 ? 'WIN' : 'LOSS';

    caption.innerHTML = `
      <strong style="color: ${statusColor}; font-size: 1.4rem;">${statusText}</strong><br>
      <span style="color: #8899a6;">Date:</span> ${trade.date} | 
      <span style="color: #8899a6;">Pair:</span> ${trade.pair} | 
      <span style="color: #8899a6;">P/L:</span> <span style="color: ${statusColor}">$${Number(trade.profit || 0).toFixed(2)}</span>
    `;
  }

  // ---------- Dashboard Recent Trades ----------
  function renderRecentTradesDashboard() {
    const logEl = id('recent-trades-log');
    if (!logEl) return;

    const trades = readTrades().slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (trades.length === 0) {
      logEl.innerHTML = '<p style="color: #888; text-align: center;">No trades yet</p>';
      return;
    }

    logEl.innerHTML = trades.map(t => {
      const color = t.profit > 0 ? '#00E676' : (t.profit < 0 ? '#FF5252' : '#fff');
      const sign = t.profit >= 0 ? '+' : '';

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.02); border-radius: 10px; border-left: 3px solid ${color};">
          <div>
            <strong style="color: #fff; font-size: 0.9rem;">${t.pair}</strong>
            <p style="color: #8899a6; font-size: 0.8rem; margin: 4px 0 0 0;">${t.date} • ${(t.strategy || 'No Strategy')}</p>
          </div>
          <div style="text-align: right;">
            <strong style="color: ${color}; font-size: 1.1rem;">${sign}$${Number(t.profit).toFixed(2)}</strong>
            <p style="color: #8899a6; font-size: 0.7rem; margin-top: 2px;">${(t.status || '').toUpperCase()}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------- Transaction Form & Log ----------
  function wireTransactionForm() {
    const form = id('transaction-form');
    if (!form) return;

    const typeEl = id('transactionType');
    const amountEl = id('transactionAmount');
    const dateEl = id('transactionDate');
    const notesEl = id('transactionNotes');

    // Set default date to today
    if (dateEl && !dateEl.value) {
      dateEl.value = new Date().toISOString().split('T')[0];
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();

      const amount = parseFloat(amountEl.value);
      if (!amount || amount <= 0) return alert('Enter a valid amount');

      saveTransaction({
        type: typeEl.value,
        amount: amount,
        date: dateEl.value,
        notes: notesEl.value
      });

      form.reset();
      if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    });
  }

  function renderTransactionLog() {
    const logEl = id('transaction-log');
    if (!logEl) return;

    const transactions = readTransactions().slice().reverse(); // Most recent first

    if (transactions.length === 0) {
      logEl.innerHTML = '<p style="color: #888; text-align: center;">No transactions yet</p>';
      return;
    }

    logEl.innerHTML = transactions.map(t => {
      const isDeposit = t.type === 'deposit';
      const color = isDeposit ? '#00E676' : '#FF5252';
      const sign = isDeposit ? '+' : '-';
      const label = isDeposit ? 'DEPOSIT' : 'WITHDRAWAL';

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.02); border-radius: 10px; border-left: 3px solid ${color};">
          <div>
            <strong style="color: ${color}; font-size: 0.85rem;">${label}</strong>
            <p style="color: #8899a6; font-size: 0.8rem; margin: 4px 0 0 0;">${t.date}${t.notes ? ' • ' + t.notes : ''}</p>
          </div>
          <div style="text-align: right;">
            <strong style="color: ${color}; font-size: 1.2rem;">${sign}$${Number(t.amount).toFixed(2)}</strong>
            <button onclick="window.deleteTransaction('${t.id}')" style="margin-left: 10px; background: transparent; border: 1px solid #FF5252; color: #FF5252; padding: 4px 8px; border-radius: 5px; cursor: pointer; font-size: 0.7rem;">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------- CSV Export ----------
  window.exportToCSV = function () {
    const trades = readTrades();
    if (trades.length === 0) return alert('No trades to export!');

    const headers = ['Date', 'Pair', 'Lot', 'Strategy', 'RR', 'Result', 'Profit/Loss', 'Notes'];
    const rows = trades.map(t => [
      t.date || '',
      t.pair || '',
      t.lot || '',
      t.strategy || '',
      t.rr || '',
      t.status || '',
      t.profit || 0,
      (t.notes || '').replace(/,/g, ';') // Escape commas
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Advanced Metrics ----------
  function computeAdvancedMetrics(trades) {
    if (!trades || trades.length === 0) {
      return { maxDrawdown: 0, profitFactor: 0, maxWinStreak: 0, maxLossStreak: 0 };
    }

    // Max Drawdown (peak to trough)
    let maxDrawdown = 0;
    let peak = 0;
    let equity = 0;
    trades.forEach(t => {
      equity += Number(t.profit || 0);
      if (equity > peak) peak = equity;
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Profit Factor (gross profit / gross loss)
    const grossProfit = trades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
    const grossLoss = Math.abs(trades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    // Win/Loss Streaks
    let maxWinStreak = 0, maxLossStreak = 0;
    let currentWinStreak = 0, currentLossStreak = 0;
    trades.forEach(t => {
      if (t.profit > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (t.profit < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      }
    });

    return { maxDrawdown, profitFactor, maxWinStreak, maxLossStreak };
  }

  window.getAdvancedMetrics = computeAdvancedMetrics;

  // ---------- Firebase Sync & Migration ----------
  async function initFirebaseSync() {
    console.log("🔄 initFirebaseSync: Starting...");

    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK not loaded!');
      alert('Error: Firebase is not loaded. Please refresh the page.');
      return;
    }

    if (!CURRENT_USER_ID) {
      console.error('❌ No user ID provided to initFirebaseSync');
      return;
    }

    if (!db) {
      console.error('❌ Firestore (db) is not initialized!');
      alert('Error: Database connection failed. Please refresh the page.');
      return;
    }

    console.log(`✅ Firebase ready for user: ${CURRENT_USER_ID}`);
    isFirebaseReady = true;

    const userRef = db.collection('users').doc(CURRENT_USER_ID);

    // Listen to Trades
    console.log("👂 Setting up Trades listener...");
    userRef.collection('trades').onSnapshot(snap => {
      console.log(`📦 Trades snapshot received: ${snap.docs.length} trades`);
      TRADES = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateAllViews();
    }, error => {
      console.error('❌ Trades listener error:', error);
    });

    // Listen to Transactions
    console.log("👂 Setting up Transactions listener...");
    userRef.collection('transactions').onSnapshot(snap => {
      console.log(`💰 Transactions snapshot received: ${snap.docs.length} transactions`);
      TRANSACTIONS = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateAllViews();
    }, error => {
      console.error('❌ Transactions listener error:', error);
    });

    // Listen to Settings
    console.log("👂 Setting up Settings listener...");
    userRef.collection('settings').doc('account').onSnapshot(doc => {
      if (doc.exists) {
        INITIAL_BALANCE = doc.data().initialBalance || 0;
        console.log(`⚙️ Settings loaded: Initial Balance = $${INITIAL_BALANCE}`);
        updateAllViews();
      } else {
        console.log("⚙️ No settings document found, using default balance");
      }
    }, error => {
      console.error('❌ Settings listener error:', error);
    });

    // Check for local data to migrate
    await migrateLocalToFirebase();
    console.log("✅ Firebase sync initialized successfully");
  }

  async function migrateLocalToFirebase() {
    if (!CURRENT_USER_ID) return;
    const localTrades = JSON.parse(localStorage.getItem(TRADES_KEY) || '[]');
    const localTxs = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
    const localBal = parseFloat(localStorage.getItem(INIT_BAL_KEY) || '0');

    if (localTrades.length > 0 || localTxs.length > 0 || localBal !== 0) {
      console.log('Migrating local data to Firebase for user:', CURRENT_USER_ID);

      const userRef = db.collection('users').doc(CURRENT_USER_ID);
      const batch = db.batch();

      // Migrate Trades
      for (const t of localTrades) {
        batch.set(userRef.collection('trades').doc(t.id), t);
      }

      // Migrate Transactions
      for (const t of localTxs) {
        batch.set(userRef.collection('transactions').doc(t.id), t);
      }

      // Migrate Settings
      if (localBal !== 0) {
        batch.set(userRef.collection('settings').doc('account'), { initialBalance: localBal }, { merge: true });
      }

      await batch.commit();
      console.log('Migration complete!');

      // Clear local storage so we don't migrate again
      localStorage.removeItem(TRADES_KEY);
      localStorage.removeItem(TRANSACTIONS_KEY);
      localStorage.removeItem(INIT_BAL_KEY);
    }
  }

  // main updater called after any change
  window.updateAllViews = function () {
    renderJournalTable();
    renderGallery();
    renderTransactionLog();
    renderRecentTradesDashboard(); // NEW
    populateFilters();
    updateStatsUI();
    updateDashboardUI();

    // Update calendar if it exists
    if (typeof window.initCalendar === 'function') {
      window.initCalendar();
    }

    // Update charts if they exist
    if (typeof window.updateCharts === 'function') {
      window.updateCharts();
    }

    // Also sync the balance input if it exists
    const balInput = id('initialBalanceInput');
    if (balInput && document.activeElement !== balInput) {
      balInput.value = readInitialBalance();
    }
  };

  // init
  document.addEventListener('DOMContentLoaded', () => {
    wireForm();
    wireTransactionForm();
    renderJournalTable();

    // Balance
    const balInput = id('initialBalanceInput');
    if (balInput) {
      // populate
      const stored = readInitialBalance();
      balInput.value = Number(stored);
      balInput.addEventListener('change', (e) => {
        const v = parseFloat(e.target.value);
        if (!Number.isFinite(v)) return alert('Enter valid number');
        saveInitialBalance(v);
      });
    }

    // Filter Listeners
    ['filter-start', 'filter-end', 'filter-pair', 'filter-result', 'filter-direction'].forEach(fid => {
      const el = id(fid);
      if (el) {
        el.addEventListener('change', () => {
          updateStatsUI(); // re-runs with filters
        });
      }
    });

    // Reset Filter Button
    const resetFilterBtn = id('reset-filter');
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        id('filter-start').value = '';
        id('filter-end').value = '';
        id('filter-pair').value = '';
        id('filter-result').value = '';
        updateStatsUI();
      });
    }

    // Apply button (redundant if using change but good for explicit action)
    const applyBtn = id('apply-filter');
    if (applyBtn) {
      applyBtn.addEventListener('click', updateStatsUI);
    }


    // Universal Mobile Toggle Logic
    const initToggles = () => {
      // 1. Sidebar Toggle (Index/Dashboard)
      const sideToggle = document.getElementById('sidebarToggle');
      const sidebar = document.getElementById('sidebar');
      if (sideToggle && sidebar) {
        sideToggle.addEventListener('click', (e) => {
          e.preventDefault();
          sidebar.classList.toggle('active');
        });
      }

      // 2. Navbar Toggle (Stats/Journal)
      const navToggle = document.getElementById('navToggle');
      const navLinks = document.querySelector('.nav-links');
      if (navToggle && navLinks) {
        navToggle.addEventListener('click', (e) => {
          e.preventDefault();
          navLinks.classList.toggle('show');
        });
      }
    };
    initToggles();

    // Firebase is now initialized via auth.js + initAppWithUser
    // We don't render until we have a user ID and data
    console.log("App ready. Waiting for Auth...");
  });

  // storage cross-tab
  window.addEventListener('storage', (e) => {
    if (e.key === TRADES_KEY) {
      updateAllViews();
    }
    if (e.key === INIT_BAL_KEY) updateAllViews();
  });

  // expose a small helper to bootstrap sample data for quick testing in console
  window.__seedTrades = function (sampleArray) {
    if (!Array.isArray(sampleArray)) return;
    const norm = sampleArray.map(normalizeTrade);
    saveTrades(norm);
  };
})();
