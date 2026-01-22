// Calendar View for Trading Journal
// Renders a monthly calendar with trade data visualization

(function () {
    const q = sel => document.querySelector(sel);
    const id = n => document.getElementById(n);

    function renderCalendar(year, month) {
        const calendarEl = id('trading-calendar');
        if (!calendarEl) return;

        const trades = window.getTrades ? window.getTrades() : [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Group trades by date
        const tradesByDate = {};
        trades.forEach(t => {
            if (!t.date) return;
            if (!tradesByDate[t.date]) tradesByDate[t.date] = [];
            tradesByDate[t.date].push(t);
        });

        // Build calendar HTML
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let html = `
      <div class="calendar-header">
        <button onclick="window.changeMonth(-1)">◀</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button onclick="window.changeMonth(1)">▶</button>
      </div>
      <div class="calendar-grid">
        ${dayNames.map(d => `<div class="calendar-day-name">${d}</div>`).join('')}
    `;

        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-cell empty"></div>';
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTrades = tradesByDate[dateStr] || [];

            let dayClass = 'calendar-cell';
            let indicator = '';
            let dayPnL = 0;

            if (dayTrades.length > 0) {
                dayPnL = dayTrades.reduce((sum, t) => sum + Number(t.profit || 0), 0);
                dayClass += dayPnL > 0 ? ' profit-day' : dayPnL < 0 ? ' loss-day' : ' neutral-day';
                indicator = `<span class="trade-count">${dayTrades.length}</span>`;
            }

            html += `
        <div class="${dayClass}" data-date="${dateStr}">
          <span class="day-number">${day}</span>
          ${indicator}
          ${dayTrades.length > 0 ? `<span class="day-pnl">$${dayPnL.toFixed(0)}</span>` : ''}
        </div>
      `;
        }

        html += '</div>';
        calendarEl.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
            cell.onclick = () => {
                const date = cell.dataset.date;
                const dayTrades = tradesByDate[date];
                if (dayTrades && dayTrades.length > 0) {
                    showDayTrades(date, dayTrades);
                }
            };
        });
    }

    function showDayTrades(date, trades) {
        const modal = id('imgModal'); // Reuse existing modal
        if (!modal) return alert(`Trades on ${date}:\n${trades.map(t => `${t.pair}: $${t.profit}`).join('\n')}`);

        const modalImg = id('modalImg');
        const caption = id('modalCaption');

        modal.style.display = 'block';
        if (modalImg) modalImg.style.display = 'none'; // Hide image

        if (caption) {
            caption.innerHTML = `
        <h3 style="margin-bottom: 15px;">Trades on ${date}</h3>
        ${trades.map(t => {
                const color = t.profit > 0 ? '#00E676' : '#FF5252';
                return `
            <div style="text-align: left; padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid ${color};">
              <strong>${t.pair}</strong> • ${t.strategy || 'No strategy'}<br>
              <span style="color: ${color};">$${Number(t.profit).toFixed(2)}</span> • ${t.lot} lots • RR: 1:${t.rr || 0}
            </div>
          `;
            }).join('')}
      `;
        }
    }

    // Month navigation
    let currentDate = new Date();
    window.currentCalendarYear = currentDate.getFullYear();
    window.currentCalendarMonth = currentDate.getMonth();

    window.changeMonth = function (delta) {
        window.currentCalendarMonth += delta;
        if (window.currentCalendarMonth > 11) {
            window.currentCalendarMonth = 0;
            window.currentCalendarYear++;
        } else if (window.currentCalendarMonth < 0) {
            window.currentCalendarMonth = 11;
            window.currentCalendarYear--;
        }
        renderCalendar(window.currentCalendarYear, window.currentCalendarMonth);
    };

    window.initCalendar = function () {
        renderCalendar(window.currentCalendarYear, window.currentCalendarMonth);
    };

    // Auto-init
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.initCalendar && window.initCalendar(), 100);
    });
})();