// TERRA - GLOBAL CORE JAVASCRIPT
// Dependencies: js/constants.js → js/app.js → js/main.js

/* ====================================================
   SHARED DOM HELPERS
   Small, pure functions for common element creation patterns.
   ==================================================== */

/** Create a <span> with a CSS class and text. */
function createSpan(className, text) {
  const span = document.createElement("span");
  if (className) span.className = className;
  span.textContent = text;
  return span;
}

/** Create a unit label span (e.g. "kg", "kg CO₂e"). */
function createUnitSpan(unit) {
  return createSpan("text-muted-sm", unit);
}

/** Update a category row bar, percentage label, and value text. */
function updateCategoryRow(fill, pct, val) {
  if (!fill) return;
  fill.style.setProperty("--bar-pct", String(pct));
  const row = fill.closest(".cbc-row");
  if (!row) return;
  row.querySelector(".cbc-row-pct").textContent = `${Math.round(pct)}%`;
  const valEl = row.querySelector(".cbc-row-val");
  valEl.textContent = String(val);
  valEl.appendChild(createUnitSpan(" kg"));
}

document.addEventListener("DOMContentLoaded", () => {
  // Load user profile & state
  initAppProfile();

  // Check-in and Log habits page integrations
  initCheckinScreen();

  // Actions bookmark/filter integrations
  initActionsScreen();
});

/* ====================================================
   APP PROFILE & STATE
   ==================================================== */
let appUser = null;

/** Load user from localStorage or fall back to default. */
function loadAppUser() {
  appUser = safeJSONParse(STORAGE_KEYS.user, null);
  if (!appUser) appUser = DEFAULT_PROFILE;
}

/* -- Greeting & date -- */

function populateGreeting() {
  const name = escapeHTML(appUser ? appUser.name : "Arjun");
  const dateString = getFormattedDateString();
  const titleEl = document.querySelector(".page-title");
  if (titleEl && titleEl.textContent.includes("Good evening, Arjun")) {
    titleEl.textContent = `Good evening, ${name} 👋`;
    const subtitle = titleEl.nextElementSibling;
    if (subtitle && subtitle.classList.contains("page-subtitle")) {
      subtitle.textContent = `${dateString} · Week 23 of the year`;
    }
  }
}

/* -- Footprint summary (dashboard hero card) -- */

function populateFootprintSummary() {
  if (!appUser?.footprint) return;

  const fp = appUser.footprint;
  // Cache DOM references once per render
  const els = {
    fscNumber: document.querySelector(".fsc-number"),
    fscContext: document.querySelector(".fsc-context"),
    fscComparison: document.querySelector(".fsc-comparison"),
    sidebarVal: document.querySelector("[data-sidebar-footprint]"),
  };

  if (els.fscNumber) {
    els.fscNumber.textContent = String(fp.total);
    els.fscNumber.appendChild(createUnitSpan("kg CO₂e"));
  }

  if (els.fscContext) {
    els.fscContext.textContent = "";
    const avgRef = fp.total > 41 ? "48.5" : "41.7";
    els.fscContext.appendChild(document.createTextNode("You're "));
    const strong = document.createElement("strong");
    strong.textContent = `${fp.comparisonPct}% ${fp.comparisonLabel}`;
    els.fscContext.appendChild(strong);
    els.fscContext.appendChild(document.createTextNode(` of ${avgRef} kg/week for your household profile. The climate-efficient range for your lifestyle is 22–28 kg/week.`));
  }

  if (els.fscComparison) {
    const isBelow = fp.comparisonLabel.includes("below");
    els.fscComparison.className = isBelow ? "fsc-comparison better" : "fsc-comparison worse";
    els.fscComparison.textContent = `${isBelow ? "↓" : "↑"} ${fp.comparisonPct}% vs average`;
  }

  if (els.sidebarVal) els.sidebarVal.textContent = fp.total;
}

/* -- Category bars ("Where it's coming from") -- */

function calcCategoryPercentages() {
  const fp = appUser.footprint;
  const total = fp.total;
  return {
    travel: (fp.commute / total) * 100,
    home: (fp.energy / total) * 100,
    food: (fp.food / total) * 100,
    shop: (fp.shopping / total) * 100,
  };
}

function populateCategoryBars() {
  if (!appUser?.footprint) return;
  const pcts = calcCategoryPercentages();
  const fp = appUser.footprint;

  updateCategoryRow(document.querySelector(".fill-travel"), pcts.travel, fp.commute);
  updateCategoryRow(document.querySelector(".fill-home"), pcts.home, fp.energy);
  updateCategoryRow(document.querySelector(".fill-food"), pcts.food, fp.food);
  updateCategoryRow(document.querySelector(".fill-shop"), pcts.shop, fp.shopping);

  // Donut legend values
  const legends = document.querySelectorAll(".legend-item");
  if (legends.length === 4) {
    legends[0].querySelector(".legend-value").textContent = fp.commute;
    legends[1].querySelector(".legend-value").textContent = fp.energy;
    legends[2].querySelector(".legend-value").textContent = fp.food;
    legends[3].querySelector(".legend-value").textContent = fp.shopping;
  }
}

/* -- Streak card -- */

function populateStreak() {
  const loggedToday = localStorage.getItem("terra_logged_today") === "true";
  const streakCountVal = localStorage.getItem("terra_streak_count") || "11";

  const streakCard = document.querySelector(".streak-card");
  if (!streakCard) return;

  const countEl = streakCard.querySelector(".streak-count");
  countEl.textContent = String(streakCountVal);
  countEl.appendChild(createSpan("", " days"));

  if (loggedToday) {
    const todayEl = streakCard.querySelector(".streak-day.today");
    if (todayEl) todayEl.className = "streak-day done";
  }
}

/* -- Main init orchestrator -- */

function initAppProfile() {
  loadAppUser();
  populateGreeting();
  populateFootprintSummary();
  populateCategoryBars();
  populateStreak();
}

/* ====================================================   PERIOD SWITCHER (weekly / monthly)
   ==================================================== */

const MONTHLY_FACTOR = 4.33;

function getFootprintValues() {
  const fp = appUser?.footprint || DEFAULT_PROFILE.footprint;
  return [fp.commute, fp.energy, fp.food, fp.shopping];
}

function updateLegendValues(values) {
  const legendValues = document.querySelectorAll(".legend-value");
  if (legendValues.length === 4) {
    values.forEach((v, i) => { legendValues[i].textContent = String(v); });
  }
}

function setFootprintDisplay(numberEl, value) {
  if (!numberEl) return;
  numberEl.textContent = String(value);
  numberEl.appendChild(createUnitSpan("kg CO₂e"));
}

window.switchPeriod = function (period, btn) {
  btn.parentNode.querySelectorAll(".toggle-option").forEach(s => s.classList.remove("active"));
  btn.classList.add("active");

  const totalWeekly = appUser?.footprint.total ?? DEFAULT_PROFILE.footprint.total;
  const fscNumber = document.querySelector(".fsc-number");
  const fscLabel = document.querySelector(".fsc-period-label");
  const baseValues = getFootprintValues();

  if (period === "month") {
    setFootprintDisplay(fscNumber, (totalWeekly * MONTHLY_FACTOR).toFixed(1));
    if (fscLabel) fscLabel.textContent = "Monthly footprint estimate";
    updateLegendValues(baseValues.map(v => (v * MONTHLY_FACTOR).toFixed(1)));
  } else {
    setFootprintDisplay(fscNumber, totalWeekly);
    if (fscLabel) fscLabel.textContent = "Weekly footprint";
    updateLegendValues(baseValues);
  }
};

function getFormattedDateString() {
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const today = new Date();
  return today.toLocaleDateString("en-IN", options);
}

/* ====================================================
   BREAKDOWN SCREEN
   (accordion toggle logic is in app.js)
   ==================================================== */

function calcBreakdownPercentages() {
  const fp = appUser.footprint;
  const total = fp.total;
  return {
    travel: (fp.commute / total) * 100,
    home: (fp.energy / total) * 100,
    food: (fp.food / total) * 100,
    shop: (fp.shopping / total) * 100,
  };
}

function updateStackedBar(pcts) {
  const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.style.setProperty("--seg-pct", String(val)); };
  set(".seg-travel", pcts.travel);
  set(".seg-home", pcts.home);
  set(".seg-food", pcts.food);
  set(".seg-shop", pcts.shop);
}

function updateBreakdownLegends(pcts) {
  const keys = ["travel", "home", "food", "shop"];
  document.querySelectorAll(".bh-leg-item").forEach((item, i) => {
    if (i < 4) item.querySelector(".bh-leg-pct").textContent = `${Math.round(pcts[keys[i]])}%`;
  });
}

function updateBreakdownTotal() {
  const el = document.querySelector(".bh-total-val");
  if (!el) return;
  el.textContent = String(appUser.footprint.total);
  el.appendChild(createSpan("bh-total-unit", "kg CO₂e/week"));
}

function updateComparisonGraph() {
  const el = document.querySelector(".bh-comp-fill.yours");
  if (!el) return;
  const relativePct = Math.round((appUser.footprint.total / BENCHMARKS.comparisonBaseMax) * 100);
  el.style.setProperty("--bar-pct", String(Math.min(100, relativePct)));
  const valEl = el.closest(".bh-comp-row")?.querySelector(".bh-comp-val");
  if (valEl) valEl.textContent = `${appUser.footprint.total} kg`;
}

function updateCategoryCardValues() {
  const fp = appUser.footprint;
  const entries = [
    { icon: "travel", val: fp.commute },
    { icon: "home", val: fp.energy },
    { icon: "food", val: fp.food },
    { icon: "shop", val: fp.shopping },
  ];
  for (const { icon, val } of entries) {
    const card = document.querySelector(`.bdc-card .bdc-icon.${icon}`)?.closest(".bdc-card");
    if (!card) continue;
    const valueEl = card.querySelector(".bdc-value");
    if (valueEl) {
      valueEl.textContent = String(val);
      valueEl.appendChild(createSpan("bdc-value-unit", " kg CO₂e"));
    }
  }
}

function updateBreakdownValues() {
  if (!appUser?.footprint) return;
  const pcts = calcBreakdownPercentages();
  updateStackedBar(pcts);
  updateBreakdownLegends(pcts);
  updateBreakdownTotal();
  updateComparisonGraph();
  updateCategoryCardValues();
}

/* ====================================================
   ACTIONS SCREEN INTERACTION
   ==================================================== */
let savedActions = [];

function initActionsScreen() {
  const actionContainer = document.querySelector(".actions-list");
  if (!actionContainer) return;

  // Load saved actions from LocalStorage
  const savedData = localStorage.getItem("terra_saved_actions");
  if (savedData) {
    try {
      savedActions = JSON.parse(savedData);
    } catch (e) {
      console.warn("Corrupted saved actions data, resetting.");
    }
  }

  // Bind Bookmark buttons
  const bookmarkBtns = document.querySelectorAll(".action-card-save");
  bookmarkBtns.forEach(btn => {
    const card = btn.closest(".action-card");
    const actionId = card.getAttribute("data-action-id") || card.querySelector(".action-card-title").textContent.trim();
    
    // Check if currently saved
    if (savedActions.includes(actionId)) {
      card.classList.add("saved");
      btn.textContent = "✓ Saved";
    }

    btn.addEventListener("click", () => {
      if (card.classList.contains("saved")) {
        card.classList.remove("saved");
        btn.textContent = "+ Save";
        savedActions = savedActions.filter(id => id !== actionId);
      } else {
        card.classList.add("saved");
        btn.textContent = "✓ Saved";
        savedActions.push(actionId);
      }
      localStorage.setItem("terra_saved_actions", JSON.stringify(savedActions));
      updateSavedSidebar();
    });
  });

  // Bind filter buttons
  const filterChips = document.querySelectorAll(".actions-filters .chip");
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      
      const category = chip.getAttribute("data-category") || "all";
      document.querySelectorAll(".action-card").forEach(card => {
        const cardCat = card.getAttribute("data-category");
        card.classList.toggle("is-hidden", category !== "all" && cardCat !== category);
      });
    });
  });

  // Calculate and update the summary sidebar values
  updateSavedSidebar();
}

function updateSavedSidebar() {
  const countEl = document.querySelector(".potential-saving-label span");
  const savingEl = document.querySelector(".potential-saving");
  if (!savingEl) return;

  let totalSavings = 0;
  let savedCount = 0;

  const cards = document.querySelectorAll(".action-card.saved");
  savedCount = cards.length;
  cards.forEach(card => {
    const impactText = card.querySelector(".acm-value.impact").textContent;
    const kgSaved = parseFloat(impactText.replace("−", "").replace(" kg", "")) || 0;
    totalSavings += kgSaved;
  });

  savingEl.textContent = `−${totalSavings.toFixed(1)} kg`;
  if (countEl) {
    countEl.textContent = `${savedCount} action${savedCount === 1 ? '' : 's'} committed`;
  }
}

/* ====================================================
   DAILY CHECK-IN SCREEN
   ==================================================== */
let loggedSavings = 0;

function initCheckinScreen() {
  if (!document.querySelector(".checkin-layout")) return;
  bindSteppers();
  bindModeChips();
  bindMealChips();
  bindBatchingToggle();
  bindSubmitButton();
  calculateDailySavings();
}

/* -- Steppers (commute distance) -- */

function bindSteppers() {
  document.querySelectorAll(".ci-stepper").forEach(stepper => {
    const decBtn = stepper.querySelector(".ci-stepper-btn:first-child");
    const incBtn = stepper.querySelector(".ci-stepper-btn:last-child");
    const valSpan = stepper.querySelector(".ci-stepper-val");
    const max = parseInt(stepper.getAttribute("data-max")) || 10;

    decBtn.addEventListener("click", () => {
      const val = parseInt(valSpan.textContent) || 0;
      if (val > 0) { valSpan.textContent = val - 1; calculateDailySavings(); }
    });
    incBtn.addEventListener("click", () => {
      const val = parseInt(valSpan.textContent) || 0;
      if (val < max) { valSpan.textContent = val + 1; calculateDailySavings(); }
    });
  });
}

/* -- Mode chips (transport, AC) -- */

function bindModeChips() {
  document.querySelectorAll(".ci-mode-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const parent = chip.closest(".ci-mode-chips");
      parent.querySelectorAll(".ci-mode-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      calculateDailySavings();
    });
  });
}

/* -- Meal chips -- */

function bindMealChips() {
  document.querySelectorAll(".ci-meal-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      calculateDailySavings();
    });
  });
}

/* -- Batching toggle -- */

function bindBatchingToggle() {
  document.querySelectorAll(".ci-toggle input").forEach(toggle => {
    toggle.addEventListener("change", calculateDailySavings);
  });
}

/* -- Submit -- */

function bindSubmitButton() {
  const submitBtn = document.querySelector(".ci-submit-area .btn-primary");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    updateStreak();
    updateFootprintFromSavings();
    showLogConfirmation();
  });
}

function updateStreak() {
  let streak = parseInt(localStorage.getItem("terra_streak_count") || "11");
  if (localStorage.getItem("terra_logged_today") !== "true") {
    streak += 1;
    localStorage.setItem("terra_streak_count", streak);
    localStorage.setItem("terra_logged_today", "true");
  }
}

function updateFootprintFromSavings() {
  if (appUser?.footprint && loggedSavings > 0) {
    appUser.footprint.total = parseFloat(
      Math.max(20.0, appUser.footprint.total - (loggedSavings / 7)).toFixed(1)
    );
    localStorage.setItem("terra_user", JSON.stringify(appUser));
  }
}

function calculateDailySavings() {
  const previewVal = document.querySelector(".ci-impact-val");
  if (!previewVal) return;

  const df = EMISSION_FACTORS.dailySavings;
  let savings = 0;

  // 1. Commute savings — uses EMISSION_FACTORS.dailySavings constants
  const activeCommute = document.querySelector(".ci-mode-chip.active");
  const commuteDist = parseInt(document.querySelector("#commuteLogStepper")?.textContent) || 0;
  if (activeCommute && commuteDist > 0) {
    const mode = activeCommute.innerText.trim();
    if (mode.includes("Bicycle") || mode.includes("Walk"))       savings += commuteDist * df.bicyclePerKm;
    else if (mode.includes("Public transit"))                     savings += commuteDist * df.transitPerKm;
    else if (mode.includes("Carpool"))                            savings += commuteDist * df.carpoolPerKm;
  }

  // 2. Meal choices savings
  document.querySelectorAll(".ci-meal-chip.selected").forEach(meal => {
    const label = meal.querySelector(".ci-meal-label").textContent;
    if (label.includes("Vegetarian") || label.includes("Vegan")) savings += df.meatFreeMeal;
  });

  // 3. Home Energy (AC setting)
  document.querySelectorAll(".ci-mode-chip.active").forEach(chip => {
    const label = chip.innerText;
    if (label.includes("AC at 24°C"))       savings += df.ac24;
    else if (label.includes("AC turned off")) savings += df.acOff;
  });

  // 4. Shopping batching
  if (document.querySelector(".ci-toggle input:checked")) savings += df.batching;

  loggedSavings = parseFloat(savings.toFixed(1));
  previewVal.textContent = `− ${loggedSavings} kg CO₂e`;
  // Announce dynamic value change to screen readers
  previewVal.setAttribute("aria-live", "polite");
}

function showLogConfirmation() {
  const layout = document.querySelector(".checkin-layout");
  if (!layout) return;
  layout.textContent = "";

  const card = document.createElement("div");
  card.className = "ci-confirmation-card";

  const icon = document.createElement("div");
  icon.className = "ci-confirmation-icon";
  icon.textContent = "🌿";
  card.appendChild(icon);

  const heading = document.createElement("h2");
  heading.className = "ci-confirmation-title";
  heading.textContent = "Log completed!";
  card.appendChild(heading);

  const msg = document.createElement("p");
  msg.className = "ci-confirmation-msg";
  msg.textContent = `Great check-in! You saved approximately ${loggedSavings} kg CO₂e today. Your dashboard metrics and streak have been updated.`;
  card.appendChild(msg);

  const link = document.createElement("a");
  link.href = "dashboard.html";
  link.className = "btn btn-primary";
  link.textContent = "Back to Dashboard";
  card.appendChild(link);

  layout.appendChild(card);
}
