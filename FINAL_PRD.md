# PRODUCT REQUIREMENTS DOCUMENT

## Domain: Supply Incentives · Rides Group
### DriverIQ: Adaptive Incentive Intelligence for Supply-Side Growth

**Status:** APPROVED & FINALIZED (V2.0 Post-Refactoring)  
**Author:** Candidate, Senior PM Supply Incentives  
**Date:** June 2026  

---

## 1️⃣ Clarifying Questions

Before designing any features, we interrogate the problem space to establish constraints and context:

*   **Q1: Company & Market Context:** Is Bolt a startup or a scaled platform?
    *   *Answer:* Bolt is a highly scaled platform with 45M+ riders and 3M+ active drivers across 45+ countries. This means we are solving an optimization and margin protection problem, not a 0 $\to$ 1 acquisition problem. Incentives must drive incremental trips efficiently without over-paying.
*   **Q2: Are there time/resource constraints?**
    *   *Answer:* Yes, engineering resources are shared. Solutions must be zero-dependency on the client side, leverage existing geolocation frameworks (like H3 indexing), and require minimal database write queries during hot paths (caching where possible).
*   **Q3: How do we handle latency and timezone sync?**
    *   *Answer:* All calculations freeze at 11:59:59 PM on Sunday in the driver's registered home city timezone to ensure Monday morning quest generations are deterministic and latency-free.
*   **Q4: What are the transaction fee and checkout policies?**
    *   *Answer:* Standard instant cashouts incur a €0.50 processing fee (Stripe/Adyen integration). However, for dormant reactivations, we can use these fees as a promotional lever—waiving them to drive habit formation.

---

## 2️⃣ Set a GOAL

DriverIQ is optimized for efficiency and supply density. 

*   **North Star Goal (The GOAL):**
    *   Reduce **Cost-per-Incremental-Trip (CpIT)** by **12%** in treatment markets within 6 months.
*   **Do No Harm / Guardrail Metrics:**
    *   Maintain **Supply Fulfillment Rate (SFR)** above **92%** in treatment zones.
    *   Keep push notification opt-out rates below **3%** to avoid driver fatigue.
    *   Maintain gross passenger trip margins at or above baseline.

---

## 3️⃣ Define Users

Supply incentives must influence driver behavior patterns. We segment users by activity patterns rather than demographic traits:

*   **Segment A — High-frequency, schedule-independent drivers:**
    *   *Behavior:* Complete 40–60+ trips/week. The platform is their primary income.
    *   *Response:* Highly responsive to quest mechanics, but pose a high risk of over-incentivization (they would complete these trips anyway). They represent ~20% of active drivers but ~50% of total incentive payout.
*   **Segment B — Part-time peak chasers:**
    *   *Behavior:* Complete 15–30 trips/week, heavily concentrated in morning and evening commute peaks.
    *   *Response:* Highly responsive to surge bonuses and time-boxed quests. They represent the highest incremental trip value to the platform.
*   **Segment C — Low-frequency, churn-risk drivers:**
    *   *Behavior:* Complete 5–15 trips/week, low platform attachment.
    *   *Response:* Responsive to low-threshold micro-quests.
*   **Segment D — Dormant drivers (Reactivation targets):**
    *   *Behavior:* Inactive on the platform for $\ge 30$ consecutive days.
    *   *Response:* Require significant promotional nudges to overcome inertia.

---

## 4️⃣ User Pain Points

To maximize **The GOAL** (improving CpIT and supply density), we select **Segment B (Part-time peak chasers)** as our primary target. Their behavior is highly elastic and directly impacts peak hours. We identify their three core pain points:

1.  **Earnings Volatility & Predictability Friction:** Peak hours are highly variable due to traffic, weather, and demand shifts. Drivers experience stress because they cannot predict whether heading online will yield a reliable payout.
2.  **Cognitive Fatigue from Mismatched Targets:** Standard, flat-rate incentive quests are either trivially easy (resulting in zero behavioral change) or impossibly out of reach, causing drivers to disengage.
3.  **Liquidity & Cash Flow Constraints:** Waiting for standard weekly bank deposits creates cash flow pressure, while standard early withdrawal features eat into their hard-earned money via flat transaction processing fees (€0.50/transfer).

---

## 5️⃣ Solutions (Solutions to all pain points)

We introduce three core solutions integrated into the DriverIQ dashboard and app viewport:

### Solution 1 (Reasonable): Personalized Adaptive Quest Selector
*Addresses Pain Point 2: Cognitive Target Mismatch*
*   **Adaptive Thresholds:** Drivers choose from three weekly quest tiers every Monday morning:
    *   **Bronze:** Baseline target (equal to the rolling 4-week average trip count).
    *   **Silver:** Medium stretch (rolling 4-week average $\times$ 1.15).
    *   **Gold:** High stretch (85th percentile of 12-week trip history $\times$ 1.2).
*   **Leakage Prevention:** To block self-selection gaming, drivers cannot select a quest tier below their rolling 4-week average. Disabled tiers are rendered with a clear, low-contrast legible state.
*   **Anti-Gaming Lockout:** If the system detects a deliberate drop in trip count ($\ge 2$ weeks of $\ge 30\%$ drop), quest options are locked to their historical 12-week max target.
*   **Effective Rate Transparency Badge:** Each card explicitly displays the calculated bonus contribution per trip (e.g., `€1.75/trip`) to minimize cognitive load and drive higher opt-in rates.
*   **Auto-Opt-In Fallback:** Drivers who fail to select a quest by Monday at 12:00 PM are auto-opted into the Bronze tier. manual upgrades are permitted until Friday at 12:00 PM, with retroactive trip accounting.

### Solution 2 (Reasonable): Geofenced H3 Corridor Surges & 15-Minute Price Lock
*Addresses Pain Point 1: Earnings Volatility*
*   **Client-Side Geofencing:** Ingests real-time demand signals and maps them to spatial H3 hexagons. 
*   **Surge Price Lock:** Entering a high-demand H3 hexagon (e.g., central cell `H3-8513`) locks in a guaranteed surge multiplier (+€3.00) for a 15-minute countdown window.
*   **Neighbor Hold (`k-ring = 1`):** The locked surge persists if the driver moves into adjacent hexagons (e.g., `H3-8514`), giving them routing flexibility to accept pickups. Exiting the adjacent boundary immediately cancels the lock.
*   **Trip Request-Time Binding:** The active surge multiplier is bound strictly to the **Trip Request Creation Timestamp** (not dispatch or match time) to prevent disputes during switchback rotations.

### Solution 3 (Moonshot): Pre-Shift AI Coach, Scenario Slider & Progressive Reactivation Ladder
*Addresses Pain Point 3: Payout Friction & Re-engagement of Segment D*
*   **AI Coach & Scenario Slider:** Renders pre-shift cards estimating yields by combining weather forecasts, event calendars, and historical hourly yields. Drivers use an interactive range slider to model their planned shifts, with estimates capped at a $\pm 15\%$ variance threshold to maintain platform trust.
*   **Progressive Reactivation Ladder:** For dormant drivers (Segment D, inactive $\ge 30$ days), we bypass standard quest tiers with a 3-day progressive ladder:
    *   **Day 1:** Complete 1 trip $\to$ earn €5.
    *   **Day 2:** Complete 2 trips $\to$ earn €10.
    *   **Day 3:** Complete 3 trips $\to$ earn €20.
*   **Fast Payout & Fee Waiving:** Payouts are made instantly to the driver's bank account. Completing the full 3-day ladder waives all standard €0.50 instant cashout processing fees (Stripe/Adyen). Early cashouts (e.g. after Day 1) deduct a €0.50 transaction fee, subject to a wallet balance check.

---

## 6️⃣ Prioritize Features

We prioritize features utilizing the Impact (toward CpIT and supply density), Effort (engineering dev time), and Urgency (time to market) framework:

| Feature | Impact | Effort | Urgency | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Personalized Challenge Selector** | **High** | **Medium** | **High** | **P0** |
| **Geofenced H3 Surge & 15-Min Price Lock** | **High** | **High** | **Medium** | **P1** |
| **Dormant Reactivation Ladder & Fee Waive** | **Medium-High**| **Medium** | **High** | **P1** |
| **Pre-Shift AI Coach & Earnings Slider** | **Medium** | **High** | **Low** | **P2** |

*Rationale:* The Personalized Selector directly addresses self-selection leakage (maximizing CpIT efficiency) and requires standard database changes (P0). H3 Surge locks and Reactivation ladders provide the geographical supply density and active driver re-engagement needed to protect peak margins (P1).

---

## 7️⃣ Measure Success

To evaluate the success of the DriverIQ launch, we track three tiers of metrics:

### North Star Metric (The GOAL)
*   **Cost-per-Incremental-Trip (CpIT):** Total incentive spend divided by the number of incremental trips generated. *Target:* 12% reduction in treatment markets within 6 months.

### Signposts (Feature Health Metrics)
*   **Quest Opt-In & Completion Rates:** Percentage of active drivers opting into Gold/Silver quests and successfully hitting targets (baseline treatment target $\ge 58\%$).
*   **Dormant Reactivation Rate:** Percentage of dormant drivers completing the Day 3 reactivation ladder within 14 days of offer dispatch (target +18%).
*   **Average Peak-Hour Supply Count:** Number of active drivers in high-demand H3 hexagons during peak hours.

### "Do No Harm" Metrics (Business Guardrails)
*   **Supply Fulfillment Rate (SFR):** Must stay above **92%** to ensure passenger wait times do not deteriorate.
*   **Notification Opt-Out Rate:** Must remain below **3%** to avoid driver churn and fatigue.
*   **Gross Margin per Ride:** Ensuring incentive payouts do not render individual peak rides unprofitable.
