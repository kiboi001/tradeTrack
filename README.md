# TradeTrackFX 📈

> **The ultimate companion for the disciplined trader.** > TradeTrackFX is a high-performance trading journal designed to help traders log, analyze, and refine their market strategies with precision.

[Explore the Live App](https://tradetrackfx.vercel.app/)

---

## 🚀 Key Features

* **Detailed Trade Logging:** Capture entry, exit, stop-loss, and take-profit levels with ease.
* **Performance Analytics:** Automated calculation of Win Rate, Risk-to-Reward (RR) ratios, and equity curves.
* **Psychology Tracking:** Log your emotional state and "Trade Setup" types (e.g., SMC, ICT, Trend Following) to identify behavioral patterns.
* **Real-time Data:** Integrated market tracking to ensure your journal stays synced with the charts.
* **Cloud Sync:** Secure authentication and real-time database updates so your data is available on any device.

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React / Next.js |
| **Styling** | Tailwind CSS |
| **Backend/Auth** | Firebase (Firestore & Authentication) |
| **Deployment** | Vercel |

## 📐 Core Logic

The application automates the heavy lifting of trading math. For example, the **Risk-to-Reward Ratio** is calculated as:

$$RR = \frac{|Exit\ Price - Entry\ Price|}{|Entry\ Price - Stop\ Loss|}$$

This allows traders to instantly see if their setups meet their minimum profitability criteria before and after execution.

## 📂 Project Structure

```text
├── public/          # Static assets & branding
├── src/
│   ├── components/  # Reusable UI (Charts, Modals, Forms)
│   ├── hooks/       # Custom React hooks for Firebase logic
│   ├── pages/       # Next.js file-based routing
│   └── styles/      # Global CSS and Tailwind configurations
└── firebase.config.js # Backend connection settings
