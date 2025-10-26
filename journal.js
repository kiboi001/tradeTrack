document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trade-form");
  const tradeList = document.getElementById("trade-list");

  function renderTrades() {
    const trades = JSON.parse(localStorage.getItem("trades") || "[]");
    tradeList.innerHTML = trades
      .map(
        (t, i) => `
      <div class="trade-item ${t.result >= 0 ? "win" : "loss"}">
        <p><strong>${t.pair}</strong> — ${t.result >= 0 ? "+" : "-"}$${Math.abs(t.result)}</p>
        <p>Status: ${t.status}</p>
        <button data-index="${i}" class="delete">Delete</button>
      </div>`
      )
      .join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const pair = document.getElementById("pair").value.trim();
    const result = parseFloat(document.getElementById("result").value);
    const status = document.getElementById("status").value;

    if (!pair || isNaN(result)) return alert("Please fill all fields correctly.");

    const trades = JSON.parse(localStorage.getItem("trades") || "[]");
    trades.push({ pair, result, status, date: new Date().toISOString() });
    localStorage.setItem("trades", JSON.stringify(trades));
    form.reset();
    renderTrades();
  });

  tradeList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete")) {
      const index = e.target.dataset.index;
      const trades = JSON.parse(localStorage.getItem("trades") || "[]");
      trades.splice(index, 1);
      localStorage.setItem("trades", JSON.stringify(trades));
      renderTrades();
    }
  });

  renderTrades();
});
