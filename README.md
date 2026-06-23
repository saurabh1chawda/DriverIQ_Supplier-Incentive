# ⚡ Bolt DriverIQ — Spatial & Adaptive Supply Incentives

> Interactive full-stack prototype demonstrating adaptive quest design, client-side geofencing, H3 hexagon spatial surge mapping, and statistical switchback experiment scaffolding for Bolt rides supply-side incentives optimization.

---

## 📋 Project Overview
**DriverIQ** is an optimization engine built to calibrate supply-side incentives at scale. This repository hosts the Phase 2 prototype which integrates:
1. **Adaptive Quests:** Calculates personalized Gold, Silver, and Bronze quest thresholds based on driver historical averages.
2. **Dormant Reactivation Ladders:** A 3-day progressive activation framework targeting drivers inactive for $\ge 30$ days (low-friction Day 1 quests, fast bank cashouts, and transaction fee offsets).
3. **Spatial Geofencing:** Client-side geofencing tracking driver crossings into H3 hexagons.
4. **Surge Price Locks:** Guarantees dynamic surge payouts (+€3.00) for 15 minutes upon entering high-demand hexagons (origin-bound, H3 `k-ring = 1` neighbor checking).
5. **Interactive Driver Coach:** Pre-shift briefs and an earnings range scenario slider capped at a $\pm 15\%$ variance threshold.

---

## 📂 Repository Structure
```directory
Bolt_SPM_Supplier Incentives/
│
├── index.html          # Core dashboard layout, manager controls, and mobile mockup
├── style.css           # Premium light styling, animations, map cells, and mobile phone framing
├── app.js              # State machine, geofencing timers, H3 grid triggers, and ROI math
│
├── README.md           # This project overview
└── USER_GUIDE.md       # Step-by-step scenario walks and test scripts
```

---

## 🛠️ Running the Prototype
Since the codebase relies on a zero-dependency vanilla web stack (HTML5, CSS3, ES6 JavaScript):
1. Clone or download the repository.
2. Double-click [index.html](file:///c:/Users/saura/OneDrive/Desktop/LIVE%20PROTOTYPES/Bolt_SPM_Supplier%20Incentives/index.html) to run it directly in any browser.
3. Recommended: Run a local server from the folder:
   * Using **Node.js (NPX)**: `npx http-server -p 8080`
   * Using **Python**: `python -m http.server 8080`
4. Access `http://localhost:8080` in your web browser.

---

## 🧪 Math & Business Rule Formulations

### 1. Personalized Target Selection
$$\text{Gold Target} = \text{Percentile}_{85}(\text{Trips}_{12\text{-weeks}}) \times 1.2$$
$$\text{Silver Target} = \text{Average}_{4\text{-weeks}}(\text{Trips}) \times 1.15$$
$$\text{Bronze Target} = \text{Average}_{4\text{-weeks}}(\text{Trips})$$
*Drivers cannot select targets below their rolling 4-week trip average (Leakage Prevention Rule).*

### 2. Earnings Scenario Estimates (Capped Variance)
$$\text{Low Estimate} = \text{Expected Earnings} \times 0.85$$
$$\text{High Estimate} = \text{Expected Earnings} \times 1.15$$
$$\text{Expected Earnings} = (\text{Hours} \times \text{Hourly Yield}) + \text{Quest Bonus} + \text{Surge Premium}$$
* Capped range variance of $\pm 15\%$ to preserve driver platform trust.*

### 3. Switchback Time-Spatial Isolation
* Randomized at H3 hexagon grid-cell level.
* Switchback time window set to **2 hours** to allow clean telemetry synchronization.
* Multipliers are locked at the **Trip Match Timestamp** to prevent rotation overlap disputes.
