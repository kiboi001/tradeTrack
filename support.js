// support.js
(function () {
    const id = n => document.getElementById(n);

    let CURRENT_UID = null;

    function initSupport() {
        console.log("Support Console: Initializing...");

        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            CURRENT_UID = user.uid;
            fetchTickets();
        });

        const form = id('support-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = id('submit-btn');

                const ticket = {
                    uid: CURRENT_UID,
                    email: auth.currentUser.email,
                    category: id('category').value,
                    subject: id('subject').value,
                    description: id('description').value,
                    status: 'open',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                try {
                    btn.disabled = true;
                    btn.textContent = 'Transmitting...';

                    await db.collection('tickets').add(ticket);

                    alert('Ticket transmitted successfully! We will get back to you soon.');
                    form.reset();
                    fetchTickets();
                } catch (err) {
                    console.error("Ticket error:", err);
                    alert("Failed to transmit ticket: " + err.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Transmit Ticket';
                }
            });
        }
    }

    async function fetchTickets() {
        const listEl = id('ticket-list');
        if (!listEl || !CURRENT_UID) return;

        try {
            const snap = await db.collection('tickets')
                .where('uid', '==', CURRENT_UID)
                .orderBy('createdAt', 'desc')
                .get();

            if (snap.empty) {
                listEl.innerHTML = '<p style="color: #666; text-align: center; padding: 30px;">🎫 No tickets available yet. Submit one above if you need help!</p>';
                return;
            }

            listEl.innerHTML = snap.docs.map(doc => {
                const t = doc.data();
                const date = t.createdAt ? t.createdAt.toDate().toLocaleDateString() : 'Pending...';
                return `
                    <div class="ticket-item">
                        <div class="ticket-item-info">
                            <div class="subject">${t.subject}</div>
                            <div class="meta">${t.category.toUpperCase()} • ${date}</div>
                        </div>
                        <span class="status-pill status-${t.status}">${t.status}</span>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error("Fetch tickets error:", err);
            listEl.innerHTML = `<p style="color: #ff4d4d; text-align:center; padding: 20px;">⚠️ Could not load ticket history.</p>`;
        }
    }

    document.addEventListener('DOMContentLoaded', initSupport);
})();
