// app.js - DriverIQ v2 Simulation Logic

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const DRIVERS = [
    {
        id: "driver-1",
        name: "Alex K. (Helsinki)",
        tenure: 14,
        rating: 4.85,
        history: [22, 24, 18, 20, 25, 21, 23, 19, 22, 20, 24, 21], // Segment B (Part-time chaser)
        gaming: false,
        city: "Helsinki",
        dormancy: 0,
        hourlyYield: 24
    },
    {
        id: "driver-2",
        name: "Matias S. (Tallinn)",
        tenure: 28,
        rating: 4.92,
        history: [45, 48, 50, 47, 52, 44, 46, 48, 51, 49, 47, 48], // Segment A (High frequency)
        gaming: false,
        city: "Tallinn",
        dormancy: 0,
        hourlyYield: 28
    },
    {
        id: "driver-3",
        name: "Sarah L. (London)",
        tenure: 3,
        rating: 4.70,
        history: [8, 12, 10, 5, 4, 11, 7, 6, 8, 5, 4, 3], // Segment C (Low frequency / At-risk)
        gaming: false,
        city: "London",
        dormancy: 4,
        hourlyYield: 20
    },
    {
        id: "driver-4",
        name: "Jonas V. (Warsaw)",
        tenure: 9,
        rating: 4.80,
        history: [28, 30, 29, 31, 27, 28, 30, 29, 12, 10, 11, 9], // Gaming driver
        gaming: true,
        city: "Warsaw",
        dormancy: 0,
        hourlyYield: 22
    },
    {
        id: "driver-5",
        name: "David M. (Helsinki - Dormant)",
        tenure: 18,
        rating: 4.80,
        history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Segment D (Dormant driver)
        gaming: false,
        city: "Helsinki",
        dormancy: 34,
        hourlyYield: 22
    }
];

let selectedDriver = DRIVERS[0];
let activeQuest = null; // Quest state: { tier: 'bronze'|'silver'|'gold'|'reactivation', target: X, reward: Y }
let completedTrips = 0;

// V2 Spatial State
let driverHex = "H3-8512"; // Default position
let priceLockTimer = null;
let priceLockSecondsLeft = 0;

// Centralized DOM cache to avoid redundant DOM queries
const DOM = {
    // Nav & page headers
    navButtons: null,
    panels: null,
    pageTitle: null,
    pageDesc: null,

    // Simulator Tab Inputs
    tripWeeksContainer: null,
    driverNameInput: null,
    driverTenure: null,
    driverRating: null,
    driverDormancy: null,
    driverHourlyYield: null,
    gamingFlagInput: null,
    calculateThresholdsBtn: null,
    syncToDriverBtn: null,

    // Simulator Results
    stat4weekAvg: null,
    stat85p: null,
    statGamingStatus: null,
    questOffersWrapper: null,

    // ROI Model Tab
    sliderBaselineTrips: null,
    valBaselineTrips: null,
    sliderStaticQuestPayout: null,
    valStaticQuestPayout: null,
    sliderAdaptiveQuestPayout: null,
    valAdaptiveQuestPayout: null,
    sliderStaticCompletionRate: null,
    valStaticCompletionRate: null,
    sliderAdaptiveCompletionRate: null,
    valAdaptiveCompletionRate: null,
    sliderIncrementalLift: null,
    valIncrementalLift: null,
    roiControlSpend: null,
    roiControlTrips: null,
    roiControlCpit: null,
    roiTreatmentSpend: null,
    roiTreatmentTrips: null,
    roiTreatmentCpit: null,
    roiMessage: null,

    // Experiment Tab
    expMarket: null,
    expSfrValue: null,
    sliderSampleSize: null,
    valSampleSize: null,
    sliderSplit: null,
    valSplit: null,
    sliderMde: null,
    valMde: null,
    expSignificance: null,
    expPower: null,
    statTreatmentN: null,
    statControlN: null,
    statRequiredN: null,
    statPowerVerdict: null,
    powerChart: null,

    // Driver App Viewport Tab
    driverActiveSelect: null,
    sliderCompletedTrips: null,
    valCompletedTrips: null,
    driverSimCoordinate: null,
    driverSimDay: null,
    driverSimHour: null,
    mockPhoneTime: null,
    phoneAppView: null,
    notificationDrawer: null,
    closeDrawerBtn: null,
    notificationContent: null,

    // Dynamic components
    tripWeeksInputs: [],
    appOptInBtn: null,
    goldUpgradeBanner: null,
    silverUpgradeBanner: null,
    appCurrentTrips: null,
    appWidgetTitle: null,
    appWidgetDesc: null,
    syncIcon: null,
    syncText: null,
    scenarioForecastPayout: null,
    sliderForecastHours: null,
    valForecastHours: null,
    simulateNudgeBtn: null,
    surgeLockBanner: null,
    surgeLockClock: null,
    progressRingFill: null,
    mapCells: null,
    questCards: null
};

// Caches all static DOM elements once on DOMContentLoaded
function cacheStaticElements() {
    DOM.navButtons = document.querySelectorAll(".nav-btn");
    DOM.panels = document.querySelectorAll(".tab-panel");
    DOM.pageTitle = document.getElementById("page-title");
    DOM.pageDesc = document.getElementById("page-desc");

    DOM.tripWeeksContainer = document.getElementById("trip-weeks-container");
    DOM.driverNameInput = document.getElementById("driver-name-input");
    DOM.driverTenure = document.getElementById("driver-tenure");
    DOM.driverRating = document.getElementById("driver-rating");
    DOM.driverDormancy = document.getElementById("driver-dormancy");
    DOM.driverHourlyYield = document.getElementById("driver-hourly-yield");
    DOM.gamingFlagInput = document.getElementById("gaming-flag-input");
    DOM.calculateThresholdsBtn = document.getElementById("calculate-thresholds-btn");
    DOM.syncToDriverBtn = document.getElementById("sync-to-driver-btn");

    DOM.stat4weekAvg = document.getElementById("stat-4week-avg");
    DOM.stat85p = document.getElementById("stat-85p");
    DOM.statGamingStatus = document.getElementById("stat-gaming-status");
    DOM.questOffersWrapper = document.getElementById("quest-offers-wrapper");

    DOM.sliderBaselineTrips = document.getElementById("slider-baseline-trips");
    DOM.valBaselineTrips = document.getElementById("val-baseline-trips");
    DOM.sliderStaticQuestPayout = document.getElementById("slider-static-quest-payout");
    DOM.valStaticQuestPayout = document.getElementById("val-static-quest-payout");
    DOM.sliderAdaptiveQuestPayout = document.getElementById("slider-adaptive-quest-payout");
    DOM.valAdaptiveQuestPayout = document.getElementById("val-adaptive-quest-payout");
    DOM.sliderStaticCompletionRate = document.getElementById("slider-static-completion-rate");
    DOM.valStaticCompletionRate = document.getElementById("val-static-completion-rate");
    DOM.sliderAdaptiveCompletionRate = document.getElementById("slider-adaptive-completion-rate");
    DOM.valAdaptiveCompletionRate = document.getElementById("val-adaptive-completion-rate");
    DOM.sliderIncrementalLift = document.getElementById("slider-incremental-lift");
    DOM.valIncrementalLift = document.getElementById("val-incremental-lift");

    DOM.roiControlSpend = document.getElementById("roi-control-spend");
    DOM.roiControlTrips = document.getElementById("roi-control-trips");
    DOM.roiControlCpit = document.getElementById("roi-control-cpit");
    DOM.roiTreatmentSpend = document.getElementById("roi-treatment-spend");
    DOM.roiTreatmentTrips = document.getElementById("roi-treatment-trips");
    DOM.roiTreatmentCpit = document.getElementById("roi-treatment-cpit");
    DOM.roiMessage = document.getElementById("roi-message");

    DOM.expMarket = document.getElementById("exp-market");
    DOM.expSfrValue = document.getElementById("exp-sfr-value");
    DOM.sliderSampleSize = document.getElementById("slider-sample-size");
    DOM.valSampleSize = document.getElementById("val-sample-size");
    DOM.sliderSplit = document.getElementById("slider-split");
    DOM.valSplit = document.getElementById("val-split");
    DOM.sliderMde = document.getElementById("slider-mde");
    DOM.valMde = document.getElementById("val-mde");
    DOM.expSignificance = document.getElementById("exp-significance");
    DOM.expPower = document.getElementById("exp-power");
    DOM.statTreatmentN = document.getElementById("stat-treatment-n");
    DOM.statControlN = document.getElementById("stat-control-n");
    DOM.statRequiredN = document.getElementById("stat-required-n");
    DOM.statPowerVerdict = document.getElementById("stat-power-verdict");
    DOM.powerChart = document.getElementById("powerChart");

    DOM.driverActiveSelect = document.getElementById("driver-active-select");
    DOM.sliderCompletedTrips = document.getElementById("slider-completed-trips");
    DOM.valCompletedTrips = document.getElementById("val-completed-trips");
    DOM.driverSimCoordinate = document.getElementById("driver-sim-coordinate");
    DOM.driverSimDay = document.getElementById("driver-sim-day");
    DOM.driverSimHour = document.getElementById("driver-sim-hour");
    DOM.mockPhoneTime = document.getElementById("mock-phone-time");
    DOM.phoneAppView = document.getElementById("phone-app-view");
    DOM.notificationDrawer = document.getElementById("notification-drawer");
    DOM.closeDrawerBtn = document.getElementById("close-drawer-btn");
    DOM.notificationContent = document.getElementById("notification-content");
}

function triggerDriverSync(driverId) {
    const driver = DRIVERS.find(d => d.id === driverId);
    if (!driver) return;
    
    selectedDriver = driver;
    calculateDriverThresholds();

    activeQuest = null;
    completedTrips = 0;
    driverHex = "H3-8512";
    DOM.driverSimCoordinate.value = "H3-8512";
    
    // Clear locks
    priceLockSecondsLeft = 0;
    if (priceLockTimer) clearInterval(priceLockTimer);

    DOM.sliderCompletedTrips.value = 0;
    DOM.valCompletedTrips.innerText = `0 completed trips`;

    renderMobileQuestSelector();
}

function handleDriverGPSChange(hexCoord) {
    driverHex = hexCoord;
    
    // Render the visual highlight updates on active phone map overlays
    if (DOM.mapCells) {
        DOM.mapCells.forEach(c => {
            c.classList.remove("active-position");
            if (c.getAttribute("data-hex") === hexCoord) {
                c.classList.add("active-position");
            }
        });
    }

    if (hexCoord === "H3-8513") {
        // Entering surge cell: start 15-min Price Lock countdown (V2 rule)
        priceLockSecondsLeft = 900; // 15 minutes
        if (priceLockTimer) clearInterval(priceLockTimer);
        
        priceLockTimer = setInterval(() => {
            priceLockSecondsLeft--;
            if (priceLockSecondsLeft <= 0) {
                clearInterval(priceLockTimer);
                syncGPSPriceLockState();
                triggerPushNudge("LOCK_EXPIRED");
            } else {
                updatePriceLockDisplay();
            }
        }, 1000);

        syncGPSPriceLockState();
        triggerPushNudge("LOCK_ACTIVATED");
    } else if (hexCoord === "H3-8514") {
        // Border H3 Hexagon: adjacent (k-ring = 1) -> lock remains active if already triggered
        syncGPSPriceLockState();
    } else {
        // Out of bounds: Price lock expires immediately if they exit the H3 zone boundary
        priceLockSecondsLeft = 0;
        if (priceLockTimer) clearInterval(priceLockTimer);
        syncGPSPriceLockState();
    }
}

function syncGPSPriceLockState() {
    const banner = DOM.surgeLockBanner;
    if (!banner) return;
    
    if (priceLockSecondsLeft > 0 && (driverHex === "H3-8513" || driverHex === "H3-8514")) {
        banner.style.display = "flex";
        updatePriceLockDisplay();
    } else {
        banner.style.display = "none";
    }
}

// ==========================================
// 2. MATHEMATICAL & INCENTIVE CALCULATIONS
// ==========================================
function calculateDriverThresholds() {
    const history = selectedDriver.history;
    const gamingChecked = selectedDriver.gaming;
    const dormancy = selectedDriver.dormancy;

    const last4Weeks = history.slice(-4);
    const avg4Weeks = last4Weeks.reduce((a, b) => a + b, 0) / 4;
    DOM.stat4weekAvg.innerText = Math.round(avg4Weeks);

    const sorted = [...history].sort((a, b) => a - b);
    const pctIndex = Math.ceil(sorted.length * 0.85) - 1;
    const percentile85 = sorted[pctIndex] || 0;
    DOM.stat85p.innerText = percentile85;

    const prev10 = history.slice(0, 10);
    const avgPrev10 = prev10.length > 0 ? prev10.reduce((a, b) => a + b, 0) / prev10.length : 0;
    const last2 = history.slice(-2);
    const avgLast2 = last2.length > 0 ? last2.reduce((a, b) => a + b, 0) / last2.length : 0;
    const detectedGaming = (avgPrev10 > 15) && (avgLast2 < avgPrev10 * 0.7);

    const isGaming = gamingChecked || detectedGaming;
    const gamingStatusSpan = DOM.statGamingStatus;
    if (isGaming) {
        gamingStatusSpan.innerText = "LOCKED";
        gamingStatusSpan.className = "stat-value text-red";
    } else {
        gamingStatusSpan.innerText = "CLEAN";
        gamingStatusSpan.className = "stat-value text-green";
    }

    const wrapper = DOM.questOffersWrapper;
    wrapper.innerHTML = "";

    if (dormancy >= 30) {
        // RENDER: Segment D Dormant progressive activation ladder
        selectedDriver.calculatedQuests = {
            type: "reactivation",
            day1: { target: 1, reward: 5, rate: 5.00 },
            day2: { target: 2, reward: 10, rate: 5.00 },
            day3: { target: 3, reward: 20, rate: 6.67 },
            isGaming: false,
            avg4Weeks: 0
        };

        wrapper.innerHTML = `
            <div class="quest-offers-comparison">
                <div class="quest-tier-box bronze">
                    <div class="tier-badge" style="background-color:rgba(0, 202, 101, 0.15); color:var(--bolt-green); border:1px solid var(--bolt-green);">REACTIVATION DAY 1</div>
                    <div class="tier-target">1 trip</div>
                    <div class="tier-reward">€5.00</div>
                    <div class="tier-description">€5.00/trip. Eligible for Instant payout.</div>
                </div>
                <div class="quest-tier-box silver">
                    <div class="tier-badge" style="background-color:rgba(0, 202, 101, 0.15); color:var(--bolt-green); border:1px solid var(--bolt-green);">REACTIVATION DAY 2</div>
                    <div class="tier-target">2 trips</div>
                    <div class="tier-reward">€10.00</div>
                    <div class="tier-description">€5.00/trip. Eligible for Instant payout.</div>
                </div>
                <div class="quest-tier-box gold">
                    <div class="tier-badge" style="background-color:rgba(0, 202, 101, 0.15); color:var(--bolt-green); border:1px solid var(--bolt-green);">REACTIVATION DAY 3</div>
                    <div class="tier-target">3 trips</div>
                    <div class="tier-reward">€20.00</div>
                    <div class="tier-description">€6.67/trip. Payout fees waived at completion.</div>
                </div>
            </div>
        `;
    } else {
        // RENDER: Standard Quest selector
        let bronze, silver, gold;
        const maxHist = Math.max(...history);

        if (isGaming) {
            bronze = maxHist;
            silver = Math.round(maxHist * 1.1);
            gold = Math.round(maxHist * 1.25);
        } else {
            bronze = Math.max(10, Math.round(avg4Weeks));
            silver = Math.max(12, Math.round(avg4Weeks * 1.15));
            gold = Math.max(15, Math.round(percentile85 * 1.2));
            if (silver <= bronze) silver = bronze + 2;
            if (gold <= silver) gold = silver + 4;
        }

        let bReward = 20, sReward = 35, gReward = 50;

        selectedDriver.calculatedQuests = {
            type: "standard",
            bronze: { target: bronze, reward: bReward, locked: avg4Weeks > bronze },
            silver: { target: silver, reward: sReward, locked: false },
            gold: { target: gold, reward: gReward, locked: false },
            avg4Weeks: Math.round(avg4Weeks),
            isGaming: isGaming
        };

        wrapper.innerHTML = `
            <div class="quest-offers-comparison">
                <div class="quest-tier-box bronze">
                    <div class="tier-badge">BRONZE</div>
                    <div class="tier-target">${bronze} trips</div>
                    <div class="tier-reward">€${bReward.toFixed(2)}</div>
                    <div class="tier-description">Rate: €${(bReward/bronze).toFixed(2)}/trip. locked if 4-wk average > target.</div>
                </div>
                <div class="quest-tier-box silver">
                    <div class="tier-badge">SILVER</div>
                    <div class="tier-target">${silver} trips</div>
                    <div class="tier-reward">€${sReward.toFixed(2)}</div>
                    <div class="tier-description">Rate: €${(sReward/silver).toFixed(2)}/trip. Stretch bonus.</div>
                </div>
                <div class="quest-tier-box gold">
                    <div class="tier-badge">GOLD</div>
                    <div class="tier-target">${gold} trips</div>
                    <div class="tier-reward">€${gReward.toFixed(2)}</div>
                    <div class="tier-description">Rate: €${(gReward/gold).toFixed(2)}/trip. Maximum stretch.</div>
                </div>
            </div>
        `;
    }
}

function updateROIModelAnalysis() {
    const baselineTrips = parseInt(DOM.sliderBaselineTrips.value);
    const staticPayout = parseInt(DOM.sliderStaticQuestPayout.value);
    const adaptivePayout = parseInt(DOM.sliderAdaptiveQuestPayout.value);
    const staticRate = parseInt(DOM.sliderStaticCompletionRate.value) / 100;
    const adaptiveRate = parseInt(DOM.sliderAdaptiveCompletionRate.value) / 100;
    const incrementalLift = parseFloat(DOM.sliderIncrementalLift.value) / 100;

    const controlCompletedDrivers = Math.round(baselineTrips * 0.15 * staticRate);
    const controlSpend = controlCompletedDrivers * staticPayout;
    const controlIncrementalTrips = Math.round(controlCompletedDrivers * 0.12 * 12);
    const controlCpIT = controlSpend / (controlIncrementalTrips || 1);

    const treatmentCompletedDrivers = Math.round(baselineTrips * 0.15 * adaptiveRate);
    const treatmentSpend = treatmentCompletedDrivers * adaptivePayout;
    const baseAdaptiveIncremental = treatmentCompletedDrivers * 0.18 * 14;
    const extraLiftTrips = baselineTrips * incrementalLift;
    const treatmentIncrementalTrips = Math.round(baseAdaptiveIncremental + extraLiftTrips);
    const treatmentCpIT = treatmentSpend / (treatmentIncrementalTrips || 1);

    DOM.roiControlSpend.innerText = `€${Math.round(controlSpend).toLocaleString()}`;
    DOM.roiControlTrips.innerText = Math.round(baselineTrips).toLocaleString();
    DOM.roiControlCpit.innerText = `€${controlCpIT.toFixed(2)}`;

    DOM.roiTreatmentSpend.innerText = `€${Math.round(treatmentSpend).toLocaleString()}`;
    DOM.roiTreatmentTrips.innerText = Math.round(baselineTrips * (1 + incrementalLift)).toLocaleString();
    DOM.roiTreatmentCpit.innerText = `€${treatmentCpIT.toFixed(2)}`;

    const cpitReduction = ((controlCpIT - treatmentCpIT) / controlCpIT) * 100;
    const msgBox = DOM.roiMessage;

    if (cpitReduction >= 12) {
        msgBox.className = "roi-summary-message positive-yield mt-20";
        msgBox.innerHTML = `
            <strong>🎉 Goal Achieved:</strong> Adaptive quest thresholds yield a <strong>${cpitReduction.toFixed(1)}% reduction</strong> in Cost per Incremental Trip (CpIT). This satisfies our hiring OKR threshold (&ge;12% CpIT reduction) while protecting the incentive P&L.
        `;
    } else if (cpitReduction > 0) {
        msgBox.className = "roi-summary-message mt-20";
        msgBox.innerHTML = `
            <strong>⚠️ Partial Improvement:</strong> CpIT is improved by <strong>${cpitReduction.toFixed(1)}%</strong>. However, this is below our strategic 12% target. Consider adjusting the Stretch Payout rates or increasing the Completion Rate yield.
        `;
    } else {
        msgBox.className = "roi-summary-message negative-yield mt-20";
        msgBox.innerHTML = `
            <strong>🚨 Negative Yield:</strong> Cost per Incremental Trip has increased by <strong>${Math.abs(cpitReduction).toFixed(1)}%</strong>. High completion rates on low stretch targets are bloating the P&L with deadweight spend. Re-calibrate thresholds!
        `;
    }
}

function updateExperimentParameters() {
    const totalN = parseInt(DOM.sliderSampleSize.value);
    const splitRatio = parseInt(DOM.sliderSplit.value) / 100;
    const mde = parseFloat(DOM.sliderMde.value) / 100;
    const alpha = parseFloat(DOM.expSignificance.value);
    const power = parseFloat(DOM.expPower.value);

    DOM.valSampleSize.innerText = totalN.toLocaleString();
    DOM.valSplit.innerText = `${splitRatio * 100}% Treatment / ${(1 - splitRatio) * 100}% Holdout`;
    DOM.valMde.innerText = `${(mde * 100).toFixed(1)}%`;

    const treatmentN = Math.round(totalN * splitRatio);
    const controlN = totalN - treatmentN;

    DOM.statTreatmentN.innerText = treatmentN.toLocaleString();
    DOM.statControlN.innerText = controlN.toLocaleString();

    const variance = 0.25;
    const zAlpha = alpha === 0.01 ? 2.58 : (alpha === 0.05 ? 1.96 : 1.64);
    const zBeta = power === 0.80 ? 0.84 : 1.28;
    const factor = Math.pow(zAlpha + zBeta, 2);
    
    const nRequired = Math.round((factor * variance * (1/splitRatio + 1/(1-splitRatio))) / Math.pow(mde, 2));

    DOM.statRequiredN.innerText = nRequired.toLocaleString();

    const verdictSpan = DOM.statPowerVerdict;
    if (totalN >= nRequired) {
        verdictSpan.innerText = "SUFFICIENT";
        verdictSpan.style.color = "var(--bolt-green)";
    } else {
        verdictSpan.innerText = "UNDERPOWERED";
        verdictSpan.style.color = "var(--danger)";
    }

    drawPowerChartCurve();
}

function updateForecastedScenario(hours) {
    if (!activeQuest) return;
    const hourlyRate = selectedDriver.hourlyYield;
    
    // Base shift earnings
    let baseShiftEarnings = hours * hourlyRate;
    
    // Quest contribution progress
    let questBonus = 0;
    // Calculate if they hit target with simulated hours (assuming driver does average 1.8 trips/hour)
    const simulatedTripsTotal = completedTrips + Math.round(hours * 1.8);
    if (simulatedTripsTotal >= activeQuest.target) {
        questBonus = activeQuest.reward;
    }

    const expectedTotal = baseShiftEarnings + questBonus;
    
    // Apply V2 PRD Variance Cap: +/- 15% range
    const lowEnd = Math.round(expectedTotal * 0.85);
    const highEnd = Math.round(expectedTotal * 1.15);

    DOM.scenarioForecastPayout.innerText = `€${lowEnd} - €${highEnd}`;
}

// ==========================================
// 3. VISUALIZATION & CANVAS CHART DRAWING
// ==========================================
function drawPowerChartCurve() {
    const canvas = DOM.powerChart;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const alpha = parseFloat(DOM.expSignificance.value);
    const mdeVal = parseFloat(DOM.sliderMde.value);

    const mu0 = W * 0.35;
    const mu1 = mu0 + (mdeVal * 4);
    const sigma = 35;

    ctx.lineWidth = 2;

    function pdf(x, mu, sig) {
        return Math.exp(-0.5 * Math.pow((x - mu) / sig, 2)) / (sig * Math.sqrt(2 * Math.PI));
    }

    const criticalVal = mu0 + (alpha === 0.01 ? 2.33 : (alpha === 0.05 ? 1.64 : 1.28)) * 12;

    ctx.fillStyle = "rgba(0, 202, 101, 0.2)";
    ctx.beginPath();
    ctx.moveTo(criticalVal, H - 10);
    for (let x = criticalVal; x < W; x++) {
        const y = H - 10 - pdf(x, mu1, sigma) * 2800;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H - 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
        const y = H - 10 - pdf(x, mu0, sigma) * 2800;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "var(--bolt-green)";
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
        const y = H - 10 - pdf(x, mu1, sigma) * 2800;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "var(--danger)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(criticalVal, 10);
    ctx.lineTo(criticalVal, H - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "var(--text-secondary)";
    ctx.font = "9px Inter";
    ctx.fillText("Control", mu0 - 15, H - 45);
    ctx.fillStyle = "var(--bolt-green)";
    ctx.fillText("Treatment", mu1 - 20, H - 45);
    ctx.fillStyle = "var(--danger)";
    ctx.fillText("Critical Val", criticalVal - 22, 8);
}

// ==========================================
// 4. DOM RENDERING HELPERS & DYNAMIC HTML
// ==========================================
function populateSimulatorFields(driver) {
    DOM.driverNameInput.value = driver.name;
    DOM.driverTenure.value = driver.tenure;
    DOM.driverRating.value = driver.rating;
    DOM.gamingFlagInput.checked = driver.gaming;
    DOM.driverDormancy.value = driver.dormancy;
    DOM.driverHourlyYield.value = driver.hourlyYield;

    for (let i = 0; i < 12; i++) {
        if (DOM.tripWeeksInputs[i]) {
            DOM.tripWeeksInputs[i].value = driver.history[i];
        }
    }
}

function generateWeeksInputs() {
    DOM.tripWeeksContainer.innerHTML = "";
    DOM.tripWeeksInputs = [];
    for (let i = 1; i <= 12; i++) {
        const weekBox = document.createElement("div");
        weekBox.className = "week-input-box";
        weekBox.innerHTML = `
            <span>Wk ${i}</span>
            <input type="number" id="trip-wk-${i}" min="0" max="100" value="0">
        `;
        DOM.tripWeeksContainer.appendChild(weekBox);
        DOM.tripWeeksInputs.push(document.getElementById(`trip-wk-${i}`));
    }
}

function populateDriverDropdown() {
    const select = DOM.driverActiveSelect;
    select.innerHTML = "";
    DRIVERS.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.innerText = `${d.name} (${d.dormancy >= 30 ? 'Dormant ' + d.dormancy + 'd' : 'Tenure: ' + d.tenure + 'mo'})`;
        select.appendChild(opt);
    });
}

function renderMobileQuestSelector() {
    const view = DOM.phoneAppView;
    const data = selectedDriver.calculatedQuests;

    if (data.type === "reactivation") {
        view.innerHTML = `
            <div class="app-header">
                <span class="app-logo"><svg viewBox="0 0 100 100" width="28" height="28" class="bolt-logo-svg"><circle cx="50" cy="50" r="48" fill="#00CA65"/><g transform="translate(3, 27.25)"><path d="M12,5 h8 c5,0 8.5,2.5 8.5,6.5 c0,2.8 -1.8,4.8 -4.5,5.5 c3,0.8 5,2.8 5,6 c0,4.5 -3.5,7.5 -9,7.5 h-8 V5 Z M17.5,14 h3 c2,0 3.2,-0.8 3.2,-2.2 c0,-1.5 -1.2,-2.2 -3.2,-2.2 h-3 V14 Z M17.5,26.5 h3.5 c2,0 3.5,-0.8 3.5,-2.3 c0,-1.5 -1.5,-2.2 -3.5,-2.2 h-3 V26.5 Z" fill="#FFFFFF"/><circle cx="44" cy="20.5" r="6.5" stroke="#FFFFFF" stroke-width="4.5" fill="none"/><rect x="57" y="5" width="4.5" height="25" rx="1" fill="#FFFFFF"/><path d="M70,11 v3.5 h-2.5 v4 h2.5 v6.5 c0,3 1.8,4.5 4.5,4.5 c1,0 1.8,-0.1 2.2,-0.4 v-3.5 c-0.2,0.1 -0.5,0.1 -0.8,0.1 c-1,0 -1.4,-0.5 -1.4,-1.4 v-5.8 h2.2 v-4 h-2.2 v-3.5 H70 Z" fill="#FFFFFF"/><circle cx="44" cy="36.5" r="4" fill="#FFFFFF"/></g></svg></span>
                <span class="online-toggle">Reactivate</span>
            </div>
            <div class="selector-view">
                <h3>Welcome Back! 👋</h3>
                <p class="desc">Complete the progressive matches below to unlock immediate payouts.</p>
                
                <div class="mock-quest-cards">
                    <div class="mock-quest-card gold selected" data-tier="reactivation" data-target="${data.day1.target}" data-reward="${data.day1.reward}">
                        <div class="card-header-row">
                            <span class="card-badge" style="background-color:rgba(16, 185, 129, 0.2); color:#10b981;">DAY 1 TARGET</span>
                            <span style="font-size: 8px; color: #10b981; font-weight:700;">FAST TRANSFER</span>
                        </div>
                        <div class="card-main-row">
                            <span class="card-target">${data.day1.target} Trip</span>
                            <span class="card-rate">€${data.day1.rate.toFixed(2)}/trip</span>
                            <span class="card-payout">€${data.day1.reward}</span>
                        </div>
                    </div>
                    
                    <div class="mock-quest-card disabled" style="opacity:0.7;">
                        <div class="card-header-row">
                            <span class="card-badge" style="background-color:rgba(15, 23, 42, 0.08); color:var(--text-secondary);">DAY 2 TARGET</span>
                            <span class="card-lock-icon">🔒 locks until Day 1 complete</span>
                        </div>
                        <div class="card-main-row">
                            <span class="card-target">${data.day2.target} Trips</span>
                            <span class="card-rate">€${data.day2.rate.toFixed(2)}/trip</span>
                            <span class="card-payout">€${data.day2.reward}</span>
                        </div>
                    </div>
                </div>
                
                <button class="opt-in-btn-app" id="app-opt-in-btn">Opt In & Start</button>
            </div>
        `;
    } else {
        let bronzeLock = data.locked ? "disabled" : "";
        let lockIcon = data.locked ? '<span class="card-lock-icon">🔒 locked</span>' : '';
        let gamingAlert = data.isGaming ? '<div class="card-gamer-warning">⚠️ Locked: Anti-Gaming Rule Active</div>' : '';

        view.innerHTML = `
            <div class="app-header">
                <span class="app-logo"><svg viewBox="0 0 100 100" width="28" height="28" class="bolt-logo-svg"><circle cx="50" cy="50" r="48" fill="#00CA65"/><g transform="translate(3, 27.25)"><path d="M12,5 h8 c5,0 8.5,2.5 8.5,6.5 c0,2.8 -1.8,4.8 -4.5,5.5 c3,0.8 5,2.8 5,6 c0,4.5 -3.5,7.5 -9,7.5 h-8 V5 Z M17.5,14 h3 c2,0 3.2,-0.8 3.2,-2.2 c0,-1.5 -1.2,-2.2 -3.2,-2.2 h-3 V14 Z M17.5,26.5 h3.5 c2,0 3.5,-0.8 3.5,-2.3 c0,-1.5 -1.5,-2.2 -3.5,-2.2 h-3 V26.5 Z" fill="#FFFFFF"/><circle cx="44" cy="20.5" r="6.5" stroke="#FFFFFF" stroke-width="4.5" fill="none"/><rect x="57" y="5" width="4.5" height="25" rx="1" fill="#FFFFFF"/><path d="M70,11 v3.5 h-2.5 v4 h2.5 v6.5 c0,3 1.8,4.5 4.5,4.5 c1,0 1.8,-0.1 2.2,-0.4 v-3.5 c-0.2,0.1 -0.5,0.1 -0.8,0.1 c-1,0 -1.4,-0.5 -1.4,-1.4 v-5.8 h2.2 v-4 h-2.2 v-3.5 H70 Z" fill="#FFFFFF"/><circle cx="44" cy="36.5" r="4" fill="#FFFFFF"/></g></svg></span>
                <span class="online-toggle">Offline</span>
            </div>
            <div class="selector-view">
                <h3>Choose Weekly Challenge</h3>
                <p class="desc">Select your target. Tiers restricted by rolling 4-week average.</p>
                
                <div class="mock-quest-cards">
                    <div class="mock-quest-card bronze ${bronzeLock}" data-tier="bronze" data-target="${data.bronze.target}" data-reward="${data.bronze.reward}">
                        <div class="card-header-row">
                            <span class="card-badge">BRONZE</span>
                            ${lockIcon}
                        </div>
                        <div class="card-main-row">
                            <span class="card-target">${data.bronze.target} Trips</span>
                            <span class="card-rate">€${(data.bronze.reward / data.bronze.target).toFixed(2)}/trip</span>
                            <span class="card-payout">€${data.bronze.reward}</span>
                        </div>
                        ${data.locked ? '<div style="font-size:8px; color:var(--text-secondary); margin-top:4px;">Locks: Below 4-week average.</div>' : ''}
                        ${data.isGaming ? gamingAlert : ''}
                    </div>
                    
                    <div class="mock-quest-card silver" data-tier="silver" data-target="${data.silver.target}" data-reward="${data.silver.reward}">
                        <div class="card-header-row">
                            <span class="card-badge">SILVER</span>
                        </div>
                        <div class="card-main-row">
                            <span class="card-target">${data.silver.target} Trips</span>
                            <span class="card-rate">€${(data.silver.reward / data.silver.target).toFixed(2)}/trip</span>
                            <span class="card-payout">€${data.silver.reward}</span>
                        </div>
                        ${data.isGaming ? gamingAlert : ''}
                    </div>
                    
                    <div class="mock-quest-card gold" data-tier="gold" data-target="${data.gold.target}" data-reward="${data.gold.reward}">
                        <div class="card-header-row">
                            <span class="card-badge">GOLD</span>
                        </div>
                        <div class="card-main-row">
                            <span class="card-target">${data.gold.target} Trips</span>
                            <span class="card-rate">€${(data.gold.reward / data.gold.target).toFixed(2)}/trip</span>
                            <span class="card-payout">€${data.gold.reward}</span>
                        </div>
                        ${data.isGaming ? gamingAlert : ''}
                    </div>
                </div>
                
                <button class="opt-in-btn-app" id="app-opt-in-btn">Start Challenge</button>
            </div>
        `;
    }

    // Cache dynamic elements
    DOM.appOptInBtn = document.getElementById("app-opt-in-btn");
    DOM.questCards = view.querySelectorAll(".mock-quest-card");

    let activeSelection = null;

    DOM.questCards.forEach(card => {
        if (card.classList.contains("disabled")) return;
        
        card.addEventListener("click", () => {
            DOM.questCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            if (data.type === "reactivation") {
                activeSelection = {
                    tier: 'reactivation',
                    target: data.day1.target,
                    reward: data.day1.reward
                };
            } else {
                activeSelection = {
                    tier: card.getAttribute("data-tier"),
                    target: parseInt(card.getAttribute("data-target")),
                    reward: parseInt(card.getAttribute("data-reward"))
                };
            }
        });
    });

    const firstActive = view.querySelector(".mock-quest-card:not(.disabled)");
    if (firstActive) {
        firstActive.click();
    }

    if (DOM.appOptInBtn) {
        DOM.appOptInBtn.addEventListener("click", () => {
            if (!activeSelection) return;
            activeQuest = activeSelection;
            
            DOM.sliderCompletedTrips.max = activeQuest.target + 8;
            
            renderMobileAppWidget();
        });
    }
}

function renderMobileAppWidget() {
    const view = DOM.phoneAppView;
    if (!activeQuest) return;

    view.innerHTML = `
        <div class="app-header">
            <span class="app-logo"><svg viewBox="0 0 100 100" width="28" height="28" class="bolt-logo-svg"><circle cx="50" cy="50" r="48" fill="#00CA65"/><g transform="translate(3, 27.25)"><path d="M12,5 h8 c5,0 8.5,2.5 8.5,6.5 c0,2.8 -1.8,4.8 -4.5,5.5 c3,0.8 5,2.8 5,6 c0,4.5 -3.5,7.5 -9,7.5 h-8 V5 Z M17.5,14 h3 c2,0 3.2,-0.8 3.2,-2.2 c0,-1.5 -1.2,-2.2 -3.2,-2.2 h-3 V14 Z M17.5,26.5 h3.5 c2,0 3.5,-0.8 3.5,-2.3 c0,-1.5 -1.5,-2.2 -3.5,-2.2 h-3 V26.5 Z" fill="#FFFFFF"/><circle cx="44" cy="20.5" r="6.5" stroke="#FFFFFF" stroke-width="4.5" fill="none"/><rect x="57" y="5" width="4.5" height="25" rx="1" fill="#FFFFFF"/><path d="M70,11 v3.5 h-2.5 v4 h2.5 v6.5 c0,3 1.8,4.5 4.5,4.5 c1,0 1.8,-0.1 2.2,-0.4 v-3.5 c-0.2,0.1 -0.5,0.1 -0.8,0.1 c-1,0 -1.4,-0.5 -1.4,-1.4 v-5.8 h2.2 v-4 h-2.2 v-3.5 H70 Z" fill="#FFFFFF"/><circle cx="44" cy="36.5" r="4" fill="#FFFFFF"/></g></svg></span>
            <span class="online-toggle" style="background-color: var(--success);">Online</span>
        </div>
        <div class="widget-view">
            
            <!-- V2 GEOFENCED CORRIDOR MAP OVERLAY -->
            <div class="hex-map-container" id="mock-map">
                <div class="map-background-grid"></div>
                <div class="hex-grid-overlay">
                    <div class="map-hex-cell ${driverHex === 'H3-8512' ? 'active-position' : ''}" data-hex="H3-8512">
                        <span class="hex-label">H3-8512</span>
                        <span class="hex-status">Suburbs</span>
                    </div>
                    <div class="map-hex-cell surge-cell ${driverHex === 'H3-8513' ? 'active-position' : ''}" data-hex="H3-8513">
                        <span class="hex-label">H3-8513</span>
                        <span class="hex-status">+€3.00</span>
                    </div>
                    <div class="map-hex-cell adjacent-cell ${driverHex === 'H3-8514' ? 'active-position' : ''}" data-hex="H3-8514">
                        <span class="hex-label">H3-8514</span>
                        <span class="hex-status">Adjacent</span>
                    </div>
                </div>
            </div>

            <!-- V2 SURGE PRICE LOCK BANNER (Only renders when timer is active) -->
            <div class="price-lock-banner" id="surge-lock-banner" style="display: none;">
                <span class="price-lock-title">🛡️ H3-8513 SURGE PRICE LOCK (Origin match only)</span>
                <span class="price-lock-timer" id="surge-lock-clock">15:00</span>
            </div>

            <!-- V2 PRE-SHIFT COACH BRIEF CARD -->
            <div class="coach-brief-card">
                <div class="coach-brief-header">
                    <span>⚡ Daily Coach Brief</span>
                    <span>Helsinki • Rainy</span>
                </div>
                <div class="coach-brief-body">
                    Rainy commute expected. Entering Hex H3-8513 triggers a 15-minute price lock. complete your target to unlock instant payouts.
                </div>
            </div>

            <div class="active-quest-widget">
                <span class="active-badge">${activeQuest.tier.toUpperCase()} CHALLENGE</span>
                <h4>Weekly Target Progress</h4>
                
                <!-- SVG Circular Progress Bar -->
                <div class="progress-circle-container">
                    <svg class="progress-ring" width="110" height="110">
                        <circle class="progress-ring__bg" stroke="rgba(15, 23, 42, 0.08)" stroke-width="8" fill="transparent" r="48" cx="55" cy="55"/>
                        <circle class="progress-ring__circle" id="progress-ring-fill" stroke="var(--bolt-green)" stroke-width="8" fill="transparent" r="48" cx="55" cy="55"/>
                    </svg>
                    <div class="progress-value-overlay">
                        <span class="current-count" id="app-current-trips">0</span>
                        <span class="total-count">/ ${activeQuest.target} trips</span>
                    </div>
                </div>
                
                <h5 id="app-widget-title">Week started!</h5>
                <p id="app-widget-desc">Complete your matches to unlock the €${activeQuest.reward} bonus.</p>
                
                <!-- Centered Upgrade Banners (FB-001 Fix) -->
                <div class="upgrade-banners-container" style="margin-top: 14px;">
                    ${activeQuest.tier === 'bronze' ? `
                        <div class="upgrade-banner" id="silver-upgrade-banner" style="margin-bottom: 8px;">
                            <div class="upgrade-title">🥈 UPGRADE TO SILVER</div>
                            <div class="upgrade-desc">Aim for ${selectedDriver.calculatedQuests.silver.target} trips & unlock €35.00! (retroactive)</div>
                        </div>
                        <div class="upgrade-banner" id="gold-upgrade-banner">
                            <div class="upgrade-title">⭐ UPGRADE TO GOLD</div>
                            <div class="upgrade-desc">Stretch to ${selectedDriver.calculatedQuests.gold.target} trips & unlock €50.00! (retroactive)</div>
                        </div>
                    ` : activeQuest.tier === 'silver' ? `
                        <div class="upgrade-banner" id="gold-upgrade-banner">
                            <div class="upgrade-title">⭐ UPGRADE TO GOLD</div>
                            <div class="upgrade-desc">Stretch to ${selectedDriver.calculatedQuests.gold.target} trips & unlock €50.00! (retroactive)</div>
                        </div>
                    ` : ''}
                </div>

                <!-- Live Data Synced Indicator (FB-004 Fix) -->
                <div class="sync-indicator">
                    <span id="sync-icon">🟢</span> <span id="sync-text">Trips Synced (Real-time)</span>
                </div>
            </div>

            <!-- V2 DRIVER EARNINGS SCENARIO SLIDER CARD -->
            <div class="scenario-calculator-card">
                <div class="scenario-header">
                    <span>Forecast Shift Yield</span>
                    <span class="scenario-range" id="scenario-forecast-payout">€0 - €0</span>
                </div>
                <div class="scenario-slider-wrapper">
                    <input type="range" id="slider-forecast-hours" min="0" max="20" value="0" step="1">
                    <span class="scenario-slider-val" id="val-forecast-hours">0 hrs</span>
                </div>
                <div class="scenario-disclaimer">
                    Estimates are calculated at €${selectedDriver.hourlyYield}/hr based on your historical yield, variance capped at &plusmn;15%.
                </div>
            </div>
            
            <button class="btn btn-secondary w-full mt-20" id="simulate-nudge-btn">📢 Send In-App Nudge</button>
        </div>
    `;

    // Immediately cache newly rendered dynamic DOM elements
    DOM.goldUpgradeBanner = document.getElementById("gold-upgrade-banner");
    DOM.silverUpgradeBanner = document.getElementById("silver-upgrade-banner");
    DOM.appCurrentTrips = document.getElementById("app-current-trips");
    DOM.appWidgetTitle = document.getElementById("app-widget-title");
    DOM.appWidgetDesc = document.getElementById("app-widget-desc");
    DOM.syncIcon = document.getElementById("sync-icon");
    DOM.syncText = document.getElementById("sync-text");
    DOM.scenarioForecastPayout = document.getElementById("scenario-forecast-payout");
    DOM.sliderForecastHours = document.getElementById("slider-forecast-hours");
    DOM.valForecastHours = document.getElementById("val-forecast-hours");
    DOM.simulateNudgeBtn = document.getElementById("simulate-nudge-btn");
    DOM.surgeLockBanner = document.getElementById("surge-lock-banner");
    DOM.surgeLockClock = document.getElementById("surge-lock-clock");
    DOM.progressRingFill = document.getElementById("progress-ring-fill");
    DOM.mapCells = view.querySelectorAll(".map-hex-cell");

    // Bind upgrade click listeners
    if (DOM.goldUpgradeBanner) {
        DOM.goldUpgradeBanner.addEventListener("click", () => {
            activeQuest = {
                tier: 'gold',
                target: selectedDriver.calculatedQuests.gold.target,
                reward: selectedDriver.calculatedQuests.gold.reward
            };
            upgradeQuestSync();
        });
    }

    if (DOM.silverUpgradeBanner) {
        DOM.silverUpgradeBanner.addEventListener("click", () => {
            activeQuest = {
                tier: 'silver',
                target: selectedDriver.calculatedQuests.silver.target,
                reward: selectedDriver.calculatedQuests.silver.reward
            };
            upgradeQuestSync();
        });
    }

    function upgradeQuestSync() {
        DOM.sliderCompletedTrips.max = activeQuest.target + 8;
        DOM.valCompletedTrips.innerText = `${completedTrips} completed trips`;
        renderMobileAppWidget();
        updateMobileAppWidgetProgress();
        triggerPushNudge("UPGRADE_SUCCESS");
    }

    if (DOM.simulateNudgeBtn) {
        DOM.simulateNudgeBtn.addEventListener("click", () => {
            triggerContextualNudge();
        });
    }

    // Bind Scenario Hours Slider
    if (DOM.sliderForecastHours) {
        DOM.sliderForecastHours.addEventListener("input", (e) => {
            const hours = parseInt(e.target.value);
            DOM.valForecastHours.innerText = `${hours} hrs`;
            updateForecastedScenario(hours);
        });
    }

    // Bind click listeners directly to map cells (QA V2 Fix)
    if (DOM.mapCells) {
        DOM.mapCells.forEach(cell => {
            cell.addEventListener("click", () => {
                const hex = cell.getAttribute("data-hex");
                DOM.driverSimCoordinate.value = hex;
                handleDriverGPSChange(hex);
            });
        });
    }

    // Sync views
    updateMobileAppWidgetProgress();
    updateForecastedScenario(0);
    syncGPSPriceLockState();
}

function updateMobileAppWidgetProgress() {
    const fill = DOM.progressRingFill;
    const currentText = DOM.appCurrentTrips;
    const title = DOM.appWidgetTitle;
    const desc = DOM.appWidgetDesc;
    
    if (!fill || !activeQuest) return;

    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    fill.style.strokeDasharray = `${circumference} ${circumference}`;
    
    const pct = Math.min(completedTrips / activeQuest.target, 1);
    const offset = circumference - (pct * circumference);
    fill.style.strokeDashoffset = offset;
    
    currentText.innerText = completedTrips;

    const remaining = activeQuest.target - completedTrips;
    if (pct === 0) {
        title.innerText = "Ready to earn?";
        desc.innerText = `Complete your first trip to kick off the €${activeQuest.reward} challenge.`;
    } else if (pct < 0.5) {
        title.innerText = "Nice start!";
        desc.innerText = `${remaining} more trips to unlock your €${activeQuest.reward} bonus.`;
    } else if (pct < 0.85) {
        title.innerText = "Over halfway!";
        desc.innerText = `Keep it up. Just ${remaining} more trips to reach your target!`;
    } else if (pct < 1) {
        title.innerText = "Almost there!";
        desc.innerText = `Excellent pace. Just ${remaining} trips left to secure your €${activeQuest.reward}!`;
        fill.style.stroke = "var(--warning)";
    } else {
        // V2 Payout logic integration check
        if (activeQuest.tier === "reactivation") {
            title.innerText = "Day 1 Reactivated! 🚀";
            desc.innerText = `Instant transfer of €${activeQuest.reward} sent to your bank. (Processing fees waived)`;
        } else {
            title.innerText = "Challenge Completed! 🎉";
            desc.innerText = `You earned your €${activeQuest.reward} bonus! It will be added to your payouts.`;
        }
        fill.style.stroke = "var(--success)";
    }
}

function updatePriceLockDisplay() {
    const banner = DOM.surgeLockBanner;
    const clock = DOM.surgeLockClock;
    if (banner && clock) {
        banner.style.display = "flex";
        const mins = Math.floor(priceLockSecondsLeft / 60);
        const secs = priceLockSecondsLeft % 60;
        clock.innerText = `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }
}

function triggerLiveSyncAnimation() {
    const syncIcon = DOM.syncIcon;
    const syncText = DOM.syncText;
    if (syncIcon && syncText) {
        syncIcon.innerText = "🔄";
        syncIcon.style.animation = "spin 1s linear infinite";
        syncText.innerText = "Syncing matches...";
        
        setTimeout(() => {
            syncIcon.innerText = "🟢";
            syncIcon.style.animation = "none";
            syncText.innerText = "Trips Synced (Real-time)";
        }, 400);
    }
}

function triggerContextualNudge() {
    if (!activeQuest) return;

    const day = DOM.driverSimDay.value;
    const hour = DOM.driverSimHour.value;
    const remaining = activeQuest.target - completedTrips;
    const pct = completedTrips / activeQuest.target;

    let messageType = "GENERIC";

    if (pct >= 1) {
        messageType = "COMPLETED";
    } else if (remaining <= 3 && pct >= 0.8) {
        messageType = "LATE_STAGE_ACCEL";
    } else if (day === "Wednesday" && pct < 0.3) {
        messageType = "BEHIND_PACE_MIDWEEK";
    } else if (day === "Friday" && pct < 0.6) {
        messageType = "FRIDAY_STRETCH";
    } else if (hour === "09:00" || hour === "18:00") {
        messageType = "PEAK_HOUR_ROUTING";
    }

    triggerPushNudge(messageType);
}

function triggerPushNudge(type) {
    const drawer = DOM.notificationDrawer;
    const content = DOM.notificationContent;
    const day = DOM.driverSimDay.value;
    const hour = DOM.driverSimHour.value;
    const timestamp = `${day} • ${hour}`;

    let body = "";

    switch(type) {
        case "LOCK_ACTIVATED":
            body = `
                <span class="nudge-time">${timestamp} • Spatial geofencing</span>
                <div class="nudge-body">
                    <strong>Surge Lock Activated! 🛡️</strong><br>
                    Entered Hex H3-8513. Your +€3.00 surge payout is guaranteed for the next 15 minutes for central originating pickups!
                </div>
            `;
            break;
        case "LOCK_EXPIRED":
            body = `
                <span class="nudge-time">${timestamp} • Spatial geofencing</span>
                <div class="nudge-body">
                    <strong>Surge Lock Expired ❌</strong><br>
                    The 15-minute price lock for Hex H3-8513 has expired. Re-enter the zone to refresh geofencing locks.
                </div>
            `;
            break;
        case "COMPLETED":
            body = `
                <span class="nudge-time">${timestamp} • Achievement unlocked</span>
                <div class="nudge-body">
                    <strong>Challenge Complete! 🥳</strong><br>
                    You completed the ${activeQuest.target} trip goal and earned your €${activeQuest.reward} bonus. Thanks for keeping the city moving!
                </div>
            `;
            break;
        case "LATE_STAGE_ACCEL":
            body = `
                <span class="nudge-time">${timestamp} • Goals coach</span>
                <div class="nudge-body">
                    <strong>Almost there, ${selectedDriver.name.split(" ")[0]}! 🚀</strong><br>
                    Just ${activeQuest.target - completedTrips} more trips to unlock your €${activeQuest.reward} bonus. Drive now while demand is high!
                </div>
            `;
            break;
        case "BEHIND_PACE_MIDWEEK":
            body = `
                <span class="nudge-time">${timestamp} • Mid-week boost</span>
                <div class="nudge-body">
                    <strong>Need a boost? ⚡</strong><br>
                    You are slightly behind pace for your ${activeQuest.target}-trip challenge. Head to Central Helsinki now where dynamic surge is active!
                </div>
            `;
            break;
        case "FRIDAY_STRETCH":
            body = `
                <span class="nudge-time">${timestamp} • Weekend push</span>
                <div class="nudge-body">
                    <strong>Weekend quest alert! 🕒</strong><br>
                    Friday evening commute matches count for double surge. Finish your remaining ${activeQuest.target - completedTrips} trips tonight!
                </div>
            `;
            break;
        case "PEAK_HOUR_ROUTING":
            body = `
                <span class="nudge-time">${timestamp} • Demand alert</span>
                <div class="nudge-body">
                    <strong>Peak hour demand! 📍</strong><br>
                    Fulfilment rates are low near airport corridor. Hop online now — complete 3 trips here for +€10 extra surge!
                </div>
            `;
            break;
        case "UPGRADE_SUCCESS":
            body = `
                <span class="nudge-time">${timestamp} • Quest upgraded</span>
                <div class="nudge-body">
                    <strong>Tier Upgraded! 🌟</strong><br>
                    Your challenge target has been updated to ${activeQuest.target} trips for a €${activeQuest.reward} reward. Drive safe!
                </div>
            `;
            break;
        default:
            body = `
                <span class="nudge-time">${timestamp} • Incentive intelligence</span>
                <div class="nudge-body">
                    <strong>Drive and Earn ⚡</strong><br>
                    You have completed ${completedTrips} trips this week. Keep active to maximize your contribution yield.
                </div>
            `;
    }

    content.innerHTML = body;
    drawer.classList.add("open");
}

// ==========================================
// 5. EVENT BINDING & ROUTING
// ==========================================
function initNavigation() {
    const navButtons = DOM.navButtons;
    const panels = DOM.panels;
    const pageTitle = DOM.pageTitle;
    const pageDesc = DOM.pageDesc;

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const activeTabId = btn.getAttribute("data-tab");
            
            panels.forEach(p => {
                if (p.id === activeTabId) {
                    p.classList.add("active");
                }
            });

            if (activeTabId === "simulator-tab") {
                pageTitle.innerText = "Driver Simulator";
                pageDesc.innerText = "Simulate a driver's historical trip volume and calculate personalized incentive quest thresholds.";
            } else if (activeTabId === "roi-tab") {
                pageTitle.innerText = "ROI & P&L Model";
                pageDesc.innerText = "Interactive P&L scenario tool. Analyze the yield and Cost per Incremental Trip (CpIT) improvements.";
            } else if (activeTabId === "experiment-tab") {
                pageTitle.innerText = "Experiment Designer";
                pageDesc.innerText = "Configure treatment/holdout splits and run statistical power calculations for your target market.";
            } else if (activeTabId === "driver-app-tab") {
                pageTitle.innerText = "Driver App Viewport";
                pageDesc.innerText = "Interact with the Bolt Driver App simulation. Experience quest selection and progress tracking.";
            }
            
            if (activeTabId === "experiment-tab") {
                setTimeout(drawPowerChartCurve, 50);
            }
        });
    });
}

function initDriverSimulator() {
    generateWeeksInputs();
    populateSimulatorFields(selectedDriver);

    DOM.calculateThresholdsBtn.addEventListener("click", () => {
        readSimulatorInputsAndCalculate();
    });

    DOM.syncToDriverBtn.addEventListener("click", () => {
        readSimulatorInputsAndCalculate();
        const select = DOM.driverActiveSelect;
        const index = DRIVERS.findIndex(d => d.id === selectedDriver.id);
        if (index !== -1) {
            DRIVERS[index] = { ...selectedDriver };
        }
        populateDriverDropdown();
        select.value = selectedDriver.id;
        triggerDriverSync(selectedDriver.id);
        
        DOM.navButtons.forEach(btn => {
            if (btn.getAttribute("data-tab") === "driver-app-tab") {
                btn.click();
            }
        });
    });
}

function initROIModel() {
    const sliders = [
        "baseline-trips",
        "static-quest-payout",
        "adaptive-quest-payout",
        "static-completion-rate",
        "adaptive-completion-rate",
        "incremental-lift"
    ];

    sliders.forEach(id => {
        let sliderElement, valSpanElement;
        if (id === "baseline-trips") {
            sliderElement = DOM.sliderBaselineTrips;
            valSpanElement = DOM.valBaselineTrips;
        } else if (id === "static-quest-payout") {
            sliderElement = DOM.sliderStaticQuestPayout;
            valSpanElement = DOM.valStaticQuestPayout;
        } else if (id === "adaptive-quest-payout") {
            sliderElement = DOM.sliderAdaptiveQuestPayout;
            valSpanElement = DOM.valAdaptiveQuestPayout;
        } else if (id === "static-completion-rate") {
            sliderElement = DOM.sliderStaticCompletionRate;
            valSpanElement = DOM.valStaticCompletionRate;
        } else if (id === "adaptive-completion-rate") {
            sliderElement = DOM.sliderAdaptiveCompletionRate;
            valSpanElement = DOM.valAdaptiveCompletionRate;
        } else if (id === "incremental-lift") {
            sliderElement = DOM.sliderIncrementalLift;
            valSpanElement = DOM.valIncrementalLift;
        }

        if (sliderElement && valSpanElement) {
            sliderElement.addEventListener("input", (e) => {
                let val = e.target.value;
                if (id === "baseline-trips") {
                    valSpanElement.innerText = parseInt(val).toLocaleString();
                } else if (id.includes("payout")) {
                    valSpanElement.innerText = `€${val}`;
                } else if (id.includes("rate")) {
                    valSpanElement.innerText = `${val}%`;
                } else if (id === "incremental-lift") {
                    valSpanElement.innerText = `${parseFloat(val).toFixed(1)}%`;
                }
                updateROIModelAnalysis();
            });
        }
    });
}

function initExperimentDesigner() {
    DOM.sliderSampleSize.addEventListener("input", () => {
        updateExperimentParameters();
    });
    DOM.sliderSplit.addEventListener("input", () => {
        updateExperimentParameters();
    });
    DOM.sliderMde.addEventListener("input", () => {
        updateExperimentParameters();
    });

    DOM.expMarket.addEventListener("change", (e) => {
        const value = e.target.value;
        const sfrSpan = DOM.expSfrValue;
        if (value === "Helsinki") sfrSpan.innerText = "94.2%";
        else if (value === "Tallinn") sfrSpan.innerText = "95.8%";
        else if (value === "London") sfrSpan.innerText = "91.5%";
        else if (value === "Warsaw") sfrSpan.innerText = "93.1%";
        updateExperimentParameters();
    });

    DOM.expSignificance.addEventListener("change", updateExperimentParameters);
    DOM.expPower.addEventListener("change", updateExperimentParameters);
    
    updateExperimentParameters();
}

function initDriverAppSandbox() {
    populateDriverDropdown();

    DOM.driverActiveSelect.addEventListener("change", (e) => {
        triggerDriverSync(e.target.value);
    });

    DOM.sliderCompletedTrips.addEventListener("input", (e) => {
        completedTrips = parseInt(e.target.value);
        DOM.valCompletedTrips.innerText = `${completedTrips} completed trips`;
        updateMobileAppWidgetProgress();
        triggerLiveSyncAnimation();
    });

    DOM.driverSimHour.addEventListener("change", (e) => {
        DOM.mockPhoneTime.innerText = e.target.value;
    });

    DOM.closeDrawerBtn.addEventListener("click", () => {
        DOM.notificationDrawer.classList.remove("open");
    });

    DOM.driverSimCoordinate.addEventListener("change", (e) => {
        handleDriverGPSChange(e.target.value);
    });
    
    triggerDriverSync(DOM.driverActiveSelect.value);
}

function readSimulatorInputsAndCalculate() {
    const history = [];
    for (let i = 0; i < 12; i++) {
        history.push(parseInt(DOM.tripWeeksInputs[i].value) || 0);
    }
    
    selectedDriver = {
        id: selectedDriver.id || "custom-driver",
        name: DOM.driverNameInput.value,
        tenure: parseInt(DOM.driverTenure.value) || 1,
        rating: parseFloat(DOM.driverRating.value) || 4.5,
        history: history,
        gaming: DOM.gamingFlagInput.checked,
        dormancy: parseInt(DOM.driverDormancy.value) || 0,
        hourlyYield: parseInt(DOM.driverHourlyYield.value) || 24,
        city: selectedDriver.city || "Helsinki"
    };

    calculateDriverThresholds();
}

document.addEventListener("DOMContentLoaded", () => {
    cacheStaticElements();
    
    initNavigation();
    initDriverSimulator();
    initROIModel();
    initExperimentDesigner();
    initDriverAppSandbox();
    
    // Initial runs
    calculateDriverThresholds();
    updateROIModelAnalysis();
    drawPowerChartCurve();
});
