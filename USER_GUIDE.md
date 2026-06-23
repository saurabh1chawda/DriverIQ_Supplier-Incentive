# 📖 DriverIQ Walkthrough Scenario Script (v2.0)

This guide provides step-by-step scenario walks to validate all Phase 2 business rules, spatial geofencing mappings, dormant reactivation ladders, and scenario forecasting models in the sandbox.

---

## 🏃 Interactive Scenario Walkthroughs

### Scenario 1: Dormant Driver Progressive Reactivation (Segment D)
* **Goal:** Verify that inactive drivers receive low-threshold activation quests, instant payouts, and transaction fee offsets.
1. Open the **Driver Simulator** tab.
2. Select driver profile **David M. (Helsinki - Dormant)**. Observe his Days Inactive is **34 days**.
3. Click **Generate Quest Thresholds**.
   * *Observe the output shows the Reactivation Ladder Day 1, 2, and 3 challenges instead of Bronze/Silver/Gold.*
4. Click **⚡ Sync Selected Driver to Mobile Viewport**.
5. You are redirected to the **Driver App Viewport**. 
6. Observe the Reactivation Day 1 Card (target: 1 trip for €5) is selected.
7. Tap **Opt In & Start**.
8. On the control panel slider, drag completed trips to **1 completed trip**.
9. Notice the circular progress bar marks completion. The status changes to: *"Day 1 Reactivated! €5 instantly sent to your bank. (Processing fees waived)"*.

---

### Scenario 2: Client-Side Geofencing H3 Surge & Originating Price Lock
* **Goal:** Verify H3 hexagon spatial crossings and the 15-minute price lock guarantee.
1. Select driver profile **Alex K.** and start a quest (e.g. Silver).
2. Inside the mobile phone mockup, locate the **Mock Map** at the top.
3. Currently, the driver is located in **H3-8512 (Suburbs)**.
4. On the control panel dropdown, change the simulated position to **Hex H3-8513 (Helsinki Central)**, or **click the H3-8513 Hexagon directly on the phone map screen**.
5. Observe the map updates:
   * The green GPS dot highlights H3-8513.
   * A flashing green banner appears: `🛡️ H3-8513 SURGE PRICE LOCK`.
   * A countdown timer starts at `15:00` and counts down.
   * A push notification logs: *"Surge Lock Activated! +€3.00 guaranteed for the next 15 minutes."*

---

### Scenario 3: H3 k-ring = 1 Adjacent Surge Hold
* **Goal:** Verify that moving to immediately adjacent cells (k-ring = 1) keeps the price lock active.
1. While the countdown timer is running in H3-8513, change simulated position to **Hex H3-8514 (Helsinki East)** (adjacent).
2. Observe the map:
   * The GPS dot moves to H3-8514.
   * The `SURGE PRICE LOCK` countdown banner remains visible and continues counting down (as H3-8514 is an adjacent cell).
3. Now change position to **Hex H3-8515 (Helsinki North)** (out of bounds).
4. Observe the map: the lock banner disappears immediately, reflecting that the driver has exited the geofenced boundary zone.

---

### Scenario 4: Pre-Shift Coach & Shift Earnings Range Slider
* **Goal:** Verify pre-shift coaching forecasts and range estimation logic.
1. Select driver **Alex K.** (hourly yield: €24/hr). Start a quest (e.g., Silver Quest, target 23).
2. On the control panel, drag the completed trips slider to **10 completed trips**.
3. In the active driver app dashboard view, notice the **Daily Coach Brief** card showing rainy commute details.
4. Locate the **Forecast Shift Yield** card at the bottom of the phone screen.
5. Drag the hours slider inside the mobile viewport to **8 hours**.
6. Observe the estimated yield:
   * It calculates: $(8 \text{ hours} \times €24) = €192$ base shift earnings.
   * It adds the Quest Reward (€35) since 8 hours at 1.8 trips/hr ($14 \text{ trips}$) plus the 10 completed trips ($10 + 14 = 24$) successfully reaches his 23-trip target.
   * Total Expected = €227.
   * The range displays **€193 - €261**, reflecting the $\pm 15\%$ variance cap.
7. Drag the hours slider back to 0 hours and watch it return to baseline.
