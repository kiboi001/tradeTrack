// admin.js (Enhanced)
(function () {
  const q = sel => document.querySelector(sel);
  const id = n => document.getElementById(n);

  let ALL_USERS = [];
  let SELECTED_USER_ID = null;

  async function initAdmin() {
    console.log("Admin Panel: Initializing...");

    // Mobile Sidebar Toggle
    const mobileBtn = id('mobileMenuBtn');
    const sidebar = id('sidebar');
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
      // Close when clicking links on mobile
      sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => sidebar.classList.remove('active'));
      });
    }

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = 'admin-login.html';
        return;
      }

      try {
        await fetchAllUsers();
        await fetchGlobalStats();
      } catch (err) {
        console.error("Admin access denied or Error:", err);
        renderAccessError(user, err);
      }
    });
  }

  function renderAccessError(user, err) {
    const listEl = id('user-list');
    const projectId = firebase.app().options.projectId;
    if (listEl) {
      listEl.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #FF5252; padding: 40px;">
            <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 10px;">Access Forbidden</div>
            <p style="color: #888; font-size: 0.9rem; margin-bottom: 20px;">You are not in the authorized administrators list.</p>
            <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; display: inline-block; text-align: left;">
                <div style="font-size: 0.7rem; color: #666;">REQUIRED CREDENTIALS</div>
                <div style="font-family: monospace; color: #fff;">UID: ${user.uid}</div>
            </div>
          </td>
        </tr>`;
    }
  }

  async function fetchAllUsers() {
    const listEl = id('user-list');
    if (!listEl) return;

    try {
      const snap = await db.collection('users').get();
      ALL_USERS = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const badge = id('user-count-badge');
      if (badge) badge.textContent = ALL_USERS.length;

      renderUserTable();
    } catch (e) {
      console.error("Error fetching users:", e);
      throw e;
    }
  }

  function renderUserTable() {
    const listEl = id('user-list');
    if (!listEl) return;

    if (ALL_USERS.length === 0) {
      listEl.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">No users found in database</td></tr>`;
      return;
    }

    listEl.innerHTML = ALL_USERS.map(user => {
      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #fff;">${user.id.substring(0, 8)}...</div>
            <div style="font-size: 0.75rem; color: #888;">${user.email || 'No email saved'}</div>
          </td>
          <td><span style="color: #00d4ff;">${user.subscription || 'Free'}</span></td>
          <td><span class="status-badge" style="${user.disabled ? 'background:rgba(255,77,77,0.1);color:#ff4d4d;' : ''}">${user.disabled ? 'Disabled' : 'Active'}</span></td>
          <td style="white-space: nowrap;">
             <button class="action-btn" onclick="window.viewUserTrades('${user.id}')" title="Audit Trades">🔎 View</button>
             <button class="action-btn" onclick="window.emailUser('${user.email}')" title="Send Email">✉️ Email</button>
             <button class="action-btn" onclick="window.editUser('${user.id}')" title="Edit Settings">⚙️ Edit</button>
             <button class="action-btn delete" onclick="window.deleteUserRecord('${user.id}')" title="Delete Account">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- Management Functions ---

  window.emailUser = function (email) {
    if (!email || email === 'No email saved') return alert('No valid email for this user.');
    window.location.href = `mailto:${email}?subject=TradeTrackFX Support Notification`;
  };

  window.editUser = function (userId) {
    const user = ALL_USERS.find(u => u.id === userId);
    const newTier = prompt(`Update subscription tier for ${user.email}:`, user.subscription || 'Free');
    if (newTier !== null) {
      db.collection('users').doc(userId).set({ subscription: newTier }, { merge: true })
        .then(() => {
          alert('User updated successfully');
          fetchAllUsers();
        });
    }
  };

  window.deleteUserRecord = async function (userId) {
    if (!confirm(`CRITICAL: Are you sure you want to delete this user's record from the database? This will clear their Firestore document but NOT their Auth account.`)) return;

    try {
      await db.collection('users').doc(userId).delete();
      alert('User document deleted.');
      fetchAllUsers();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  // --- Statistics ---

  async function fetchGlobalStats() {
    try {
      const tradesSnap = await db.collectionGroup('trades').get();
      const totalTrades = tradesSnap.size;

      let totalProfit = 0;
      let totalWins = 0;

      tradesSnap.forEach(doc => {
        const t = doc.data();
        totalProfit += parseFloat(t.profit || 0);
        if (parseFloat(t.profit || 0) > 0) totalWins++;
      });

      const winRate = totalTrades ? (totalWins / totalTrades * 100).toFixed(1) : 0;

      id('total-platform-trades').textContent = totalTrades;
      id('total-platform-users').textContent = ALL_USERS.length;
      id('platform-win-rate').textContent = winRate + '%';
      id('platform-pnl').textContent = `$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      id('platform-pnl').style.color = totalProfit >= 0 ? '#00E676' : '#FF5252';

    } catch (e) {
      console.error("Global stats error:", e);
    }
  }

  // --- Audit View ---

  // --- Statistics ---

  async function fetchGlobalStats() {
    try {
      // Platform Metrics
      const tradesSnap = await db.collectionGroup('trades').get();
      const totalTrades = tradesSnap.size;

      let totalProfit = 0;
      let totalWins = 0;

      tradesSnap.forEach(doc => {
        const t = doc.data();
        totalProfit += parseFloat(t.profit || 0);
        if (parseFloat(t.profit || 0) > 0) totalWins++;
      });

      const winRate = totalTrades ? (totalWins / totalTrades * 100).toFixed(1) : 0;

      id('total-platform-trades').textContent = totalTrades;
      id('total-platform-users').textContent = ALL_USERS.length;
      id('platform-win-rate').textContent = winRate + '%';
      id('platform-pnl').textContent = `$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      id('platform-pnl').style.color = totalProfit >= 0 ? '#00E676' : '#FF5252';

    } catch (e) {
      console.error("Global stats error:", e);
    }
  }

  // --- Audit View ---

  window.viewUserTrades = async function (userId) {
    const modal = id('user-details-modal');
    const modalContent = id('user-trades-list');
    if (!modal || !modalContent) return;

    modal.style.display = 'block';
    modalContent.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Fetching user data...</p>';

    try {
      const snap = await db.collection('users').doc(userId).collection('trades').get();
      const trades = snap.docs.map(d => d.data());

      if (trades.length === 0) {
        modalContent.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">This user has no trades yet.</p>';
        return;
      }

      modalContent.innerHTML = `
         <table class="user-table" style="font-size: 0.9rem; color: #fff;">
           <thead>
             <tr style="color: #666; font-size: 0.8rem;">
               <th>DATE</th>
               <th>PAIR</th>
               <th>RESULT</th>
               <th>P/L ($)</th>
             </tr>
           </thead>
           <tbody>
             ${trades.map(t => `
               <tr>
                 <td>${t.date}</td>
                 <td>${t.pair}</td>
                 <td style="color: ${t.profit > 0 ? '#00ffa3' : '#ff4d4d'}">${(t.status || 'win').toUpperCase()}</td>
                 <td style="font-weight: 700; color: ${t.profit >= 0 ? '#00E676' : '#FF5252'}">$${Number(t.profit).toFixed(2)}</td>
               </tr>
             `).join('')}
           </tbody>
         </table>
       `;
    } catch (e) {
      modalContent.innerHTML = `<p style="color: #FF5252;">Error loading user data: ${e.message}</p>`;
    }
  }

  // --- Ticket Management ---

  async function fetchTickets() {
    const ticketList = id('ticket-list'); // If you add this later
    // For now, let's just alert the admin if there are new tickets
    const snap = await db.collection('tickets').where('status', '==', 'open').get();
    console.log(`Found ${snap.size} open support tickets.`);
  }

  window.closeModal = function () {
    id('user-details-modal').style.display = 'none';
  }

  // Close modals when clicking outside
  window.onclick = function (event) {
    const modal = id('user-details-modal');
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', initAdmin);
})();
