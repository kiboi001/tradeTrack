// =======================================
// 1. DOM REFERENCES & INITIAL SETUP
// =======================================

// Essential DOM References
const tradeForm = document.getElementById('trade-form');
const journalTableBody = document.querySelector('#journal-table tbody'); 
const statsCards = document.querySelector('.stats-grid');
const addTradeButton = tradeForm ? tradeForm.querySelector('button') : null; // Check if form exists
let trades = JSON.parse(localStorage.getItem("trades")) || [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Set current date on dashboard (assuming ID "currentDate" exists)
    const dateEl = document.getElementById("currentDate");
    if (dateEl) {
        dateEl.textContent = new Date().toDateString();
    }
    
    // 2. Load and render data (only run on relevant pages)
    if (journalTableBody) {
        renderJournalTable();
    }
    updateStats(); 
});

// =======================================
// 2. DATA UTILITIES (CRUD)
// =======================================

/** Saves the current trades array to LocalStorage. */
function saveTrades() {
    localStorage.setItem("trades", JSON.stringify(trades));
}

/**
 * Adds or Updates a trade.
 * @param {object} tradeData - The trade object from the form.
 * @param {string | null} tradeId - The ID if updating, null if adding new.
 */
function addOrUpdateTrade(tradeData, tradeId = null) {
    if (tradeId) {
        // UPDATE: Find and replace the existing trade
        const index = trades.findIndex(t => t.id === tradeId);
        if (index > -1) {
            trades[index] = { ...trades[index], ...tradeData };
        }
    } else {
        // CREATE: Add new trade with a unique ID
        const newTrade = { 
            id: Date.now().toString(), // Simple unique ID for LocalStorage
            ...tradeData 
        };
        trades.push(newTrade);
    }
    
    saveTrades();
    updateStats();
    if (journalTableBody) {
        renderJournalTable();
    }
}

// =======================================
// 3. STATS & ANALYSIS
// =======================================

/** Updates all statistic cards on the Dashboard and Stats page. */
function updateStats() {
    // Only proceed if a stats element exists on the page
    if (!document.getElementById("totalTrades")) return; 

    const totalTrades = trades.length;
    // Note: We filter based on PNL > 0 for a win
    const wins = trades.filter(t => t.profit > 0).length; 
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);

    const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(2) : 0;
    const bestTrade = trades.length ? Math.max(...trades.map(t => t.profit)) : 0;
    const worstTrade = trades.length ? Math.min(...trades.map(t => t.profit)) : 0;

    // Apply the values and proper formatting
    document.getElementById("totalTrades").innerText = totalTrades;
    document.getElementById("winRate").innerText = winRate + "%";
    // Check if profit is negative to apply the right CSS class
    const totalProfitEl = document.getElementById("totalProfit");
    if (totalProfitEl) {
        totalProfitEl.innerText = `$${totalProfit.toFixed(2)}`;
        totalProfitEl.className = totalProfit > 0 ? 'value positive' : (totalProfit < 0 ? 'value negative' : 'value neutral');
    }
    document.getElementById("bestTrade").innerText = `$${bestTrade.toFixed(2)}`;
    document.getElementById("worstTrade").innerText = `$${worstTrade.toFixed(2)}`;
}

// =======================================
// 4. JOURNAL TABLE RENDERING (UX)
// =======================================

/** Clears and re-renders the entire journal table from the trades array. */
function renderJournalTable() {
    if (!journalTableBody) return; // Check again if we are on the journal page
    
    journalTableBody.innerHTML = ''; // Clear table
    
    trades.forEach(trade => {
        const row = document.createElement('tr');
        
        // Use PNL value to determine CSS class for the amount
        const pnlStatus = trade.profit > 0 ? 'positive' : (trade.profit < 0 ? 'negative' : 'neutral');
        const formattedProfit = trade.profit.toFixed(2);
        
        row.innerHTML = `
            <td>${trade.date}</td>
            <td>${trade.pair}</td>
            <td>${trade.lot}</td>
            <td class="pnl ${pnlStatus}">${trade.result.toUpperCase()}</td>
            <td class="pnl ${pnlStatus}">$${formattedProfit}</td>
            <td>${trade.notes.substring(0, 50)}...</td>
            <td>
                <button class="edit-btn" data-id="${trade.id}">Edit</button>
                <button class="delete-btn" data-id="${trade.id}">Delete</button>
            </td>
        `;
        journalTableBody.appendChild(row);
    });
    
    // Attach listeners for newly created buttons
    attachRowEventListeners();
}

// =======================================
// 5. EDIT & DELETE LOGIC (CRUD)
// =======================================

/** Attaches event listeners to all Edit/Delete buttons */
function attachRowEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.removeEventListener('click', handleDelete); // Prevent duplicates
        button.addEventListener('click', handleDelete);
    });
    
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.removeEventListener('click', handleEdit); // Prevent duplicates
        button.addEventListener('click', handleEdit);
    });
}

/** Handles the deletion of a trade. */
function handleDelete(e) {
    const tradeId = e.target.dataset.id;
    if (confirm("Are you sure you want to delete this trade?")) {
        trades = trades.filter(t => t.id !== tradeId);
        saveTrades();
        renderJournalTable();
        updateStats();
    }
}

/** Handles loading a trade into the form for editing. */
function handleEdit(e) {
    const tradeId = e.target.dataset.id;
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;

    // Populate the form (assuming consistent IDs)
    document.getElementById('pair').value = trade.pair;
    document.getElementById('lot').value = trade.lot;
    document.getElementById('profitLoss').value = trade.profit; 
    document.getElementById('date').value = trade.date;
    document.getElementById('notes').value = trade.notes;
    
    // Change button state to "Update"
    addTradeButton.textContent = 'Update Trade';
    addTradeButton.dataset.mode = 'edit';
    addTradeButton.dataset.tradeId = tradeId;

    tradeForm.scrollIntoView({ behavior: 'smooth' }); // Scroll to form
}

/** Resets the form and button after an update/add. */
function resetFormAndButton() {
    tradeForm.reset();
    addTradeButton.textContent = 'Add Trade';
    delete addTradeButton.dataset.mode;
    delete addTradeButton.dataset.tradeId;
}

// =======================================
// 6. FORM HANDLING & VALIDATION
// =======================================

if (tradeForm) {
    tradeForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. Retrieve Data from Form
        let pair = document.getElementById('pair').value.trim();
        let lot = document.getElementById('lot').value.trim();
        let profitLossValue = document.getElementById('profitLoss').value.trim();
        let date = document.getElementById('date').value.trim();
        let notes = document.getElementById('notes').value.trim();
        
        // Simple Validation
        if (!pair || !lot || !profitLossValue || !date) {
            alert("Please fill in all required fields (Pair, Lot, P&L, Date).");
            return;
        }

        let profit = parseFloat(profitLossValue);
        // Determine result based on PNL (more reliable than a separate field)
        let result = profit >= 0 ? 'Win' : 'Loss'; 
        
        // 2. Construct Data Object
        const tradeData = { result, profit, pair, lot, date, notes };
        
        // 3. Check for Edit Mode and call appropriate function
        const tradeId = addTradeButton.dataset.tradeId;
        addOrUpdateTrade(tradeData, tradeId); 

        // 4. Cleanup
        resetFormAndButton();
    });
}

// =======================================
// 7. REMOVED/IMPROVED SECTIONS
// =======================================
// The 'getFormData' function was redundant; logic is integrated into the submit handler.
// The manual inline style hover effects were removed. These should be handled entirely by CSS 
// (using the :hover pseudo-class) to keep JS clean and performant.

/* REMOVED: Inline style hover handling. Use CSS :hover instead.
document.querySelectorAll('.card').forEach(card => { ... });
document.querySelectorAll('.hover-box').forEach(box => { ... });
*/
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
