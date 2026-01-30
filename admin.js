// admin.js
(function () {
  const q = sel => document.querySelector(sel);
  const id = n => document.getElementById(n);

  let ALL_USERS = [];
  let SELECTED_USER_ID = null;

  async function initAdmin() {
    console.log("Admin Panel: Initializing...");

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = 'admin-login.html';
        return;
      }

      // 1. Verify Admin Status (Simple check for now, recommend Custom Claims later)
      // Check if user is in 'admins' collection or has custom claim
      // For this implementation, we will check if we can read the 'users' collection.
      try {
        await fetchAllUsers();
        await fetchGlobalStats();
      } catch (err) {
        console.error("Admin access denied or Error:", err);
        const listEl = id('user-list');
        const projectId = firebase.app().options.projectId;
        if (listEl) {
          listEl.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; color: #FF5252; padding: 40px;">
                <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 10px;">Auth Error: Permission Denied</div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; margin: 20px auto; max-width: 500px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid #333;">
                  <div>
                    <div style="color: #888; font-size: 0.75rem;">CONNECTED PROJECT ID</div>
                    <div style="font-family: monospace; color: #00E676;">${projectId}</div>
                  </div>
                  <div>
                    <div style="color: #888; font-size: 0.75rem;">YOUR USER UID</div>
                    <div style="font-family: monospace; color: #fff;">${user.uid}</div>
                  </div>
                </div>

                <div style="color: #888; font-size: 0.8rem; margin-top: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                   <b>Final Verification Checklist:</b><br><br>
                   1. Is your Firebase Console showing Project ID: <b style="color:#00E676">${projectId}</b>?<br>
                   2. Is there a collection named exactly <b style="color:#fff">admins</b>?<br>
                   3. Does that collection have a document with ID <b style="color:#fff">${user.uid}</b>?<br>
                   4. Did you paste the rules and click <b style="color:#fff">PUBLISH</b>?
                </div>
              </td>
            </tr>
          `;
        }
      }
    });
  }

  async function fetchAllUsers() {
    const listEl = id('user-list');
    if (!listEl) return;

    try {
      const snap = await db.collection('users').get();
      ALL_USERS = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`Loaded ${ALL_USERS.length} users.`);
      renderUserTable();
    } catch (e) {
      console.error("Error fetching users:", e);
      listEl.innerHTML = `<tr><td colspan="5" style="color: #FF5252; text-align: center;">Permission Denied (Firestore)</td></tr>`;
      throw e;
    }
  }

  function renderUserTable() {
    const listEl = id('user-list');
    if (!listEl) return;

    if (ALL_USERS.length === 0) {
      listEl.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">No users found</td></tr>`;
      return;
    }

    listEl.innerHTML = ALL_USERS.map(user => {
      return `
        <tr>
          <td>
            <div style="font-weight: 600;">${user.id.substring(0, 8)}...</div>
            <div style="font-size: 0.8rem; color: #888;">${user.email || 'No email provided'}</div>
          </td>
          <td>User</td>
          <td><span class="status-badge">Active</span></td>
          <td>
             <button onclick="window.viewUserTrades('${user.id}')" style="background: var(--primary); color: #000; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">View Details</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function fetchGlobalStats() {
    // This is expensive in Firestore for large datasets (collectionGroup)
    // For small apps, it works fine.
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
         <table class="user-table" style="font-size: 0.9rem;">
           <thead>
             <tr>
               <th>Date</th>
               <th>Pair</th>
               <th>Result</th>
               <th>P/L</th>
             </tr>
           </thead>
           <tbody>
             ${trades.map(t => `
               <tr>
                 <td>${t.date}</td>
                 <td>${t.pair}</td>
                 <td>${(t.status || 'win').toUpperCase()}</td>
                 <td style="color: ${t.profit >= 0 ? '#00E676' : '#FF5252'}">$${Number(t.profit).toFixed(2)}</td>
               </tr>
             `).join('')}
           </tbody>
         </table>
       `;
    } catch (e) {
      modalContent.innerHTML = `<p style="color: #FF5252;">Error loading user data: ${e.message}</p>`;
    }
  }

  window.closeModal = function () {
    id('user-details-modal').style.display = 'none';
  }

  document.addEventListener('DOMContentLoaded', initAdmin);
})();
