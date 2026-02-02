// admin.js (Premium Refit)
(function () {
  const q = sel => document.querySelector(sel);
  const id = n => document.getElementById(n);

  let ALL_USERS = [];

  async function initAdmin() {
    console.log("Admin Panel: Initializing Premium UI (v2026.02.02.1557)...");

    // Mobile Toggle Logic
    const menuToggle = id('menuToggle');
    const sidebar = id('sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        menuToggle.textContent = sidebar.classList.contains('active') ? '✕' : '☰';
      });
      // Close sidebar when clicking outside or on a link
      id('sidebar').querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          sidebar.classList.remove('active');
          menuToggle.textContent = '☰';
        });
      });
    }

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = 'admin-login.html';
        return;
      }

      console.log("Admin Panel: Authenticating UID:", user.uid);

      try {
        const adminDoc = await db.collection('admins').doc(user.uid).get();

        // Safety net: If collection check fails but UID matches the owner
        const isOwner = user.uid === "33EFXNGFH1XXK5nHyDh6AzG4kDL2";

        if (!adminDoc.exists && !isOwner) {
          renderAccessError(user);
          return;
        }

        // Live stats sync
        setupLiveListeners();
      } catch (err) {
        // Even if Firestore fails (permissions), let the owner through if UID matches
        if (user.uid === "33EFXNGFH1XXK5nHyDh6AzG4kDL2") {
          setupLiveListeners();
        } else {
          console.error("Admin Auth Error:", err);
          renderAccessError(user);
        }
      }
    });
  }

  function setupLiveListeners() {
    // 1. Listen for ALL users
    db.collection('users').onSnapshot(snap => {
      ALL_USERS = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const badge = id('user-count-badge-top');
      if (badge) badge.textContent = `${ALL_USERS.length} Users`;
      if (id('total-platform-users')) id('total-platform-users').textContent = ALL_USERS.length;
      renderUserTable();
    });

    // 2. Listen for support tickets
    db.collection('tickets').orderBy('createdAt', 'desc').onSnapshot(snap => {
      const tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const badge = id('ticket-count-badge');
      if (badge) {
        badge.textContent = tickets.length;
        badge.style.display = tickets.length > 0 ? 'inline-block' : 'none';
      }
      renderTicketTable(tickets);
    });

    // 3. Global Stats Group Listener
    db.collectionGroup('trades').onSnapshot(snap => {
      let totalTrades = snap.size;
      let totalProfit = 0;
      let totalWins = 0;

      snap.forEach(doc => {
        const t = doc.data();
        const p = parseFloat(t.profit || 0);
        totalProfit += p;
        if (p >= 0) totalWins++;
      });

      const winRate = totalTrades ? (totalWins / totalTrades * 100).toFixed(1) : 0;

      if (id('total-platform-trades')) id('total-platform-trades').textContent = totalTrades;
      if (id('platform-win-rate')) id('platform-win-rate').textContent = winRate + '%';
      const pnlEl = id('platform-pnl');
      if (pnlEl) {
        pnlEl.textContent = `$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        pnlEl.style.color = totalProfit >= 0 ? '#00ff88' : '#ff4d4d';
      }
    });
  }

  function renderUserTable() {
    const listEl = id('user-list');
    if (!listEl) return;

    if (ALL_USERS.length === 0) {
      listEl.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888; padding: 40px;">No users found.</td></tr>';
      return;
    }

    listEl.innerHTML = ALL_USERS.map(user => {
      const tierColor = user.subscription === 'Pro Annual' ? '#ff9100' : (user.subscription === 'Pro Monthly' ? '#00d4ff' : '#8b949e');
      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${user.email || 'Anonymous'}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">UID: ${user.id.substring(0, 12)}...</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
               <div style="width: 8px; height: 8px; border-radius: 50%; background: ${tierColor};"></div>
               <span style="font-weight: 600; color: ${tierColor};">${user.subscription || 'Free'}</span>
            </div>
          </td>
          <td>
            <span style="background: ${user.disabled ? 'rgba(255,75,75,0.1)' : 'rgba(0,255,136,0.1)'}; 
                        color: ${user.disabled ? '#ff4d4d' : '#00ff88'}; 
                        padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.05);">
                ${user.disabled ? 'SUSPENDED' : 'ACTIVE'}
            </span>
          </td>
          <td style="text-align: right;">
            <div class="btn-group" style="justify-content: flex-end;">
              <button class="btn-icon" onclick="window.viewUserTrades('${user.id}', '${user.email || 'User'}')" title="Audit">🕵️</button>
              <button class="btn-icon" onclick="window.emailUser('${user.email}')" title="Email">✉️</button>
              <button class="btn-icon" onclick="window.editUser('${user.id}')" title="Tier">💎</button>
              <button class="btn-icon danger" onclick="window.deleteUserRecord('${user.id}')" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderTicketTable(tickets) {
    const listEl = id('admin-ticket-list');
    if (!listEl) return;

    if (tickets.length === 0) {
      listEl.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888; padding: 40px;">Support queue is empty.</td></tr>';
      return;
    }

    listEl.innerHTML = tickets.map(t => {
      const statusColor = t.status === 'resolved' ? '#00ff88' : (t.status === 'closed' ? '#ff4d4d' : '#ff9100');
      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #fff;">${t.subject || 'No Subject'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${t.email}</div>
          </td>
          <td><span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${(t.category || 'general').toUpperCase()}</span></td>
          <td>
            <span style="color: ${statusColor}; font-weight: 800; font-size: 0.7rem;">● ${t.status.toUpperCase()}</span>
          </td>
          <td><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem; color: #aaa;">${t.description}</div></td>
          <td style="text-align: right;">
            <div class="btn-group" style="justify-content: flex-end;">
              <button class="btn-icon" style="color: #00ff88;" onclick="window.updateTicketStatus('${t.id}', 'resolved')" title="Resolve">✓</button>
              <button class="btn-icon danger" onclick="window.updateTicketStatus('${t.id}', 'closed')" title="Close">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.viewUserTrades = async function (userId, email) {
    const modal = id('user-details-modal');
    const modalContent = id('user-trades-list');
    const emailEl = id('modal-user-email');
    if (!modal || !modalContent) return;

    modal.style.display = 'grid';
    if (emailEl) emailEl.textContent = email;
    modalContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Fetching audit trail...</div>';

    try {
      const snap = await db.collection('users').doc(userId).collection('trades').orderBy('date', 'desc').get();
      const trades = snap.docs.map(d => d.data());

      if (trades.length === 0) {
        modalContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">No trading history found for this account.</div>';
        return;
      }

      modalContent.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pair</th>
              <th>Side</th>
              <th>Result</th>
              <th style="text-align: right;">P/L</th>
            </tr>
          </thead>
          <tbody>
            ${trades.map(t => `
              <tr>
                <td style="font-family: monospace; font-size: 0.8rem;">${t.date}</td>
                <td style="font-weight: 700;">${t.pair}</td>
                <td style="color: ${t.direction === 'buy' ? '#00d4ff' : '#ff9100'}; font-weight: 800; font-size: 0.7rem;">${(t.direction || 'BUY').toUpperCase()}</td>
                <td><span style="font-size: 0.75rem; color: ${parseFloat(t.profit) >= 0 ? '#00ff88' : '#ff4d4d'}; font-weight: 800;">${(t.status || 'win').toUpperCase()}</span></td>
                <td style="text-align: right; font-weight: 800; color: ${parseFloat(t.profit) >= 0 ? '#fff' : '#ff4d4d'}">$${Number(t.profit).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      modalContent.innerHTML = `<div style="color: #ff4d4d; padding: 20px;">Error: ${e.message}</div>`;
    }
  }

  window.showAdminTab = function (tabName) {
    document.querySelectorAll('.admin-content-section').forEach(sec => sec.style.display = 'none');
    const target = id(`admin-section-${tabName}`);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = id(`link-${tabName}`);
    if (activeLink) activeLink.classList.add('active');
  }

  window.closeModal = () => id('user-details-modal').style.display = 'none';

  function renderAccessError(user) {
    const listEl = id('user-list');
    if (listEl) {
      listEl.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #ff4d4d; padding: 60px;">
            <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px;">ACCESS DENIED</div>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; max-width: 400px; margin-inline: auto;">
              Your account <strong>${user.email}</strong> is not registered in the system's administrator whitelist.
            </p>
            <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 16px; border: 1px solid var(--border); display: inline-block; text-align: left;">
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 800; letter-spacing: 1px;">AUTHORIZED UID REQUIRED</div>
                <div style="font-family: monospace; color: var(--primary); font-size: 0.85rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">${user.uid}</div>
            </div>
          </td>
        </tr>`;
    }
  }

  window.emailUser = (email) => {
    if (!email || email === 'No email saved') return alert('No valid email');
    window.location.href = `mailto:${email}?subject=TradeTrackFX Support`;
  };

  window.editUser = function (userId) {
    const user = ALL_USERS.find(u => u.id === userId);
    const newTier = prompt(`Update tier for ${user.email}:`, user.subscription || 'Free');
    if (newTier) {
      db.collection('users').doc(userId).set({ subscription: newTier }, { merge: true });
    }
  };

  window.deleteUserRecord = async function (userId) {
    if (confirm("Permanently delete this user's data record?")) {
      await db.collection('users').doc(userId).delete();
    }
  };

  window.updateTicketStatus = async function (ticketId, newStatus) {
    await db.collection('tickets').doc(ticketId).update({ status: newStatus });
  };

  window.onclick = (e) => { if (e.target == id('user-details-modal')) window.closeModal(); };

  document.addEventListener('DOMContentLoaded', initAdmin);
})();
