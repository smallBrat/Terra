// TERRA - GLOBAL CORE JAVASCRIPT
// Dependencies: js/constants.js → js/app.js → js/ui.js → js/main.js

document.addEventListener("DOMContentLoaded", () => {
  initAppProfile();
  initCheckinScreen();
  initActionsScreen();
});

/* ====================================================
   MODULE STATE
   Mutable state isolated in one place. Internal code uses
   the raw variables; external access goes through getState().
   ==================================================== */

let _appUser = null;       // loaded user profile
let _savedActions = [];    // bookmarked action IDs (actions screen)
let _loggedSavings = 0;    // today's check-in savings (check-in screen)

/** Read-only snapshot of current state. */
function getState() {
  return {
    appUser: _appUser,
    savedActions: _savedActions,
    loggedSavings: _loggedSavings,
  };
}

/** Load user from localStorage or fall back to default. */
function loadAppUser() {
  _appUser = safeJSONParse(STORAGE_KEYS.user, null);
  if (!_appUser) _appUser = DEFAULT_PROFILE;
}

/* -- Greeting & date -- */

function populateGreeting() {
  const name = escapeHTML(appUser ? appUser.name : "Arjun");
  const dateString = getFormattedDateString();
  const titleEl = document.querySelector(S.pageTitle);
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

  // Main number
  setText(S.fscNumber, fp.total);
  document.querySelector(S.fscNumber)?.appendChild(createUnitSpan("kg CO₂e"));

  // Context text
  const fscContext = document.querySelector(S.fscContext);
  if (fscContext) {
    fscContext.textContent = "";
    const avgRef = fp.total > 41 ? "48.5" : "41.7";
    fscContext.appendChild(document.createTextNode("You're "));
    const strong = document.createElement("strong");
    strong.textContent = `${fp.comparisonPct}% ${fp.comparisonLabel}`;
    fscContext.appendChild(strong);
    fscContext.appendChild(document.createTextNode(` of ${avgRef} kg/week for your household profile. The climate-efficient range for your lifestyle is 22–28 kg/week.`));
  }

  // Comparison badge
  const fscComparison = document.querySelector(S.fscComparison);
  if (fscComparison) {
    const isBelow = fp.comparisonLabel.includes("below");
    fscComparison.className = isBelow ? "fsc-comparison better" : "fsc-comparison worse";
    fscComparison.textContent = `${isBelow ? "↓" : "↑"} ${fp.comparisonPct}% vs average`;
  }

  // Sidebar mini footprint
  const sidebarVal = document.querySelector("aside div div div:nth-child(2)");
  if (sidebarVal && sidebarVal.style.fontSize === "1.75rem") {
    sidebarVal.textContent = fp.total;
  }
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

function populateCategoryBars() {
  if (!appUser?.footprint) return;
  const pcts = calcCategoryPercentages();
  const fp = appUser.footprint;

  updateCategoryRow(document.querySelector(S.fillTravel), pcts.travel, fp.commute);
  updateCategoryRow(document.querySelector(S.fillHome), pcts.home, fp.energy);
  updateCategoryRow(document.querySelector(S.fillFood), pcts.food, fp.food);
  updateCategoryRow(document.querySelector(S.fillShop), pcts.shop, fp.shopping);

  // Donut legend values
  const legends = document.querySelectorAll(S.legendItems);
  if (legends.length === 4) {
    setText(legends[0].querySelector(S.legendValue), fp.commute);
    setText(legends[1].querySelector(S.legendValue), fp.energy);
    setText(legends[2].querySelector(S.legendValue), fp.food);
    setText(legends[3].querySelector(S.legendValue), fp.shopping);
  }
}

/* -- Streak card -- */

function populateStreak() {
  const loggedToday = localStorage.getItem("terra_logged_today") === "true";
  const streakCountVal = localStorage.getItem("terra_streak_count") || "11";

  const streakCard = document.querySelector(S.streakCard);
  if (!streakCard) return;

  const countEl = streakCard.querySelector(S.streakCount);
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

/* ====================================================
   PERIOD SWITCHER (weekly / monthly)
   ==================================================== */

const MONTHLY_FACTOR = 4.33;

function getFootprintValues() {
  const fp = appUser?.footprint || DEFAULT_PROFILE.footprint;
  return [fp.commute, fp.energy, fp.food, fp.shopping];
}

function updateLegendValues(values) {
  const legendValues = document.querySelectorAll(S.legendValue);
  if (legendValues.length === 4) {
    values.forEach((v, i) => { legendValues[i].textContent = String(v); });
  }
}

window.switchPeriod = function (period, btn) {
  // Toggle active state
  btn.parentNode.querySelectorAll(".toggle-option").forEach(s => s.classList.remove("active"));
  btn.classList.add("active");

  const totalWeekly = appUser?.footprint.total ?? DEFAULT_PROFILE.footprint.total;
  const fscNumber = document.querySelector(S.fscNumber);
  const fscLabel = document.querySelector(S.fscPeriodLabel);
  const baseValues = getFootprintValues();

  if (period === "month") {
    setText(fscNumber, (totalWeekly * MONTHLY_FACTOR).toFixed(1));
    fscNumber?.appendChild(createUnitSpan("kg CO₂e"));
    if (fscLabel) fscLabel.textContent = "Monthly footprint estimate";
    updateLegendValues(baseValues.map(v => (v * MONTHLY_FACTOR).toFixed(1)));
  } else {
    setText(fscNumber, totalWeekly);
    fscNumber?.appendChild(createUnitSpan("kg CO₂e"));
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
  setStyleProp(S.segTravel, "--seg-pct", String(pcts.travel));
  setStyleProp(S.segHome, "--seg-pct", String(pcts.home));
  setStyleProp(S.segFood, "--seg-pct", String(pcts.food));
  setStyleProp(S.segShop, "--seg-pct", String(pcts.shop));
}

function updateBreakdownLegends(pcts) {
  const items = document.querySelectorAll(S.bhLegItems);
  if (items.length === 4) {
    setText(items[0].querySelector(S.bhLegPct), `${Math.round(pcts.travel)}%`);
    setText(items[1].querySelector(S.bhLegPct), `${Math.round(pcts.home)}%`);
    setText(items[2].querySelector(S.bhLegPct), `${Math.round(pcts.food)}%`);
    setText(items[3].querySelector(S.bhLegPct), `${Math.round(pcts.shop)}%`);
  }
}

function updateBreakdownTotal() {
  const el = document.querySelector(S.bhTotalVal);
  if (!el) return;
  el.textContent = String(appUser.footprint.total);
  el.appendChild(createSpan("bh-total-unit", "kg CO₂e/week"));
}

function updateComparisonGraph() {
  const el = document.querySelector(S.bhCompFillYours);
  if (!el) return;
  const relativePct = Math.round((appUser.footprint.total / BENCHMARKS.comparisonBaseMax) * 100);
  el.style.setProperty("--bar-pct", String(Math.min(100, relativePct)));
  const valEl = el.closest(".bh-comp-row")?.querySelector(S.bhCompVal);
  if (valEl) valEl.textContent = `${appUser.footprint.total} kg`;
}

function updateCategoryCardValues() {
  const fp = appUser.footprint;
  const iconMap = { travel: "travel", home: "home", food: "food", shop: "shop" };
  const valMap = { travel: fp.commute, home: fp.energy, food: fp.food, shop: fp.shopping };
  for (const [key, val] of Object.entries(valMap)) {
    const card = document.querySelector(`.bdc-card .bdc-icon.${iconMap[key]}`)?.closest(".bdc-card");
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
   ACTIONS SCREEN
   Uses _savedActions from module state.
   ==================================================== */

function initActionsScreen() {
  if (!document.querySelector(S.actionsList)) return;
  loadSavedActions();
  bindBookmarkButtons();
  bindFilterChips();
  updateSavedSidebar();
}

function loadSavedActions() {
  const savedData = localStorage.getItem("terra_saved_actions");
  if (savedData) {
    try { _savedActions = JSON.parse(savedData); } catch (e) { /* ignore */ }
  }
}

function bindBookmarkButtons() {
  document.querySelectorAll(S.actionCardSave).forEach(btn => {
    const card = btn.closest(S.actionCard);
    const actionId = card.getAttribute("data-action-id") || card.querySelector(".action-card-title").textContent.trim();

    if (_savedActions.includes(actionId)) {
      card.classList.add("saved");
      btn.textContent = "✓ Saved";
    }

    btn.addEventListener("click", () => {
      if (card.classList.contains("saved")) {
        card.classList.remove("saved");
        btn.textContent = "+ Save";
        _savedActions = _savedActions.filter(id => id !== actionId);
      } else {
        card.classList.add("saved");
        btn.textContent = "✓ Saved";
        _savedActions.push(actionId);
      }
      localStorage.setItem("terra_saved_actions", JSON.stringify(_savedActions));
      updateSavedSidebar();
    });
  });
}

function bindFilterChips() {
  const filterChips = document.querySelectorAll(".actions-filters .chip");
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const category = chip.getAttribute("data-category") || "all";
      document.querySelectorAll(S.actionCard).forEach(card => {
        const cardCat = card.getAttribute("data-category");
        setVisible(card, category === "all" || cardCat === category);
      });
    });
  });
}

function updateSavedSidebar() {
  const savingEl = document.querySelector(S.potentialSaving);
  if (!savingEl) return;

  let totalSavings = 0;
  const savedCards = document.querySelectorAll(".action-card.saved");
  savedCards.forEach(card => {
    const impactText = card.querySelector(".acm-value.impact").textContent;
    totalSavings += parseFloat(impactText.replace("−", "").replace(" kg", "")) || 0;
  });

  savingEl.textContent = `−${totalSavings.toFixed(1)} kg`;
  const labelEl = document.querySelector(S.potentialSavingLabel);
  if (labelEl) {
    const n = savedCards.length;
    labelEl.textContent = `${n} action${n === 1 ? "" : "s"} committed`;
  }
}

/* ====================================================
   DAILY CHECK-IN SCREEN
   Uses _loggedSavings from module state.
   ==================================================== */

function initCheckinScreen() {
  if (!document.querySelector(S.checkinLayout)) return;
  bindSteppers();
  bindModeChips();
  bindMealChips();
  bindBatchingToggle();
  bindSubmitButton();
  calculateDailySavings();
}

/* -- Steppers (commute distance) -- */

function bindSteppers() {
  document.querySelectorAll(S.ciStepper).forEach(stepper => {
    const decBtn = stepper.querySelector(`${S.ciStepperBtn}:first-child`);
    const incBtn = stepper.querySelector(`${S.ciStepperBtn}:last-child`);
    const valSpan = stepper.querySelector(S.ciStepperVal);
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
  document.querySelectorAll(S.ciModeChip).forEach(chip => {
    chip.addEventListener("click", () => {
      const parent = chip.closest(".ci-mode-chips");
      parent.querySelectorAll(S.ciModeChip).forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      calculateDailySavings();
    });
  });
}

/* -- Meal chips -- */

function bindMealChips() {
  document.querySelectorAll(S.ciMealChip).forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      calculateDailySavings();
    });
  });
}

/* -- Batching toggle -- */

function bindBatchingToggle() {
  document.querySelectorAll(S.ciToggleInput).forEach(toggle => {
    toggle.addEventListener("change", calculateDailySavings);
  });
}

/* -- Submit -- */

function bindSubmitButton() {
  const submitBtn = document.querySelector(`${S.ciSubmitArea} .btn-primary`);
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
  if (_appUser?.footprint && _loggedSavings > 0) {
    _appUser.footprint.total = parseFloat(
      Math.max(20.0, _appUser.footprint.total - (_loggedSavings / 7)).toFixed(1)
    );
    localStorage.setItem("terra_user", JSON.stringify(_appUser));
  }
}

/* -- Savings calculation (uses EMISSION_FACTORS constants) -- */

function calcCommuteSavings(distance) {
  const active = document.querySelector(`${S.ciModeChip}.active`);
  if (!active || distance <= 0) return 0;
  const mode = active.innerText.trim();
  const df = EMISSION_FACTORS.dailySavings;
  if (mode.includes("Bicycle") || mode.includes("Walk"))       return distance * df.bicyclePerKm;
  if (mode.includes("Public transit"))                          return distance * df.transitPerKm;
  if (mode.includes("Carpool"))                                 return distance * df.carpoolPerKm;
  return 0;
}

function calcMealSavings() {
  let savings = 0;
  document.querySelectorAll(`${S.ciMealChip}.selected`).forEach(meal => {
    const label = meal.querySelector(".ci-meal-label").textContent;
    if (label.includes("Vegetarian") || label.includes("Vegan")) {
      savings += EMISSION_FACTORS.dailySavings.meatFreeMeal;
    }
  });
  return savings;
}

function calcAcSavings() {
  let savings = 0;
  document.querySelectorAll(`${S.ciModeChip}.active`).forEach(chip => {
    const label = chip.innerText;
    if (label.includes("AC at 24°C"))       savings += EMISSION_FACTORS.dailySavings.ac24;
    else if (label.includes("AC turned off")) savings += EMISSION_FACTORS.dailySavings.acOff;
  });
  return savings;
}

function calcBatchingSavings() {
  return document.querySelector(`${S.ciToggleInput}:checked`)
    ? EMISSION_FACTORS.dailySavings.batching
    : 0;
}

function calculateDailySavings() {
  const previewVal = document.querySelector(S.ciImpactVal);
  if (!previewVal) return;

  const commuteDist = parseInt(document.querySelector("#commuteLogStepper")?.textContent) || 0;
  const savings = calcCommuteSavings(commuteDist)
    + calcMealSavings()
    + calcAcSavings()
    + calcBatchingSavings();

  _loggedSavings = parseFloat(savings.toFixed(1));
  previewVal.textContent = `− ${_loggedSavings} kg CO₂e`;
}

/* -- Confirmation card -- */

function showLogConfirmation() {
  const layout = document.querySelector(S.checkinLayout);
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
  msg.textContent = `Great check-in! You saved approximately ${_loggedSavings} kg CO₂e today. Your dashboard metrics and streak have been updated.`;
  card.appendChild(msg);

  const link = document.createElement("a");
  link.href = "dashboard.html";
  link.className = "btn btn-primary";
  link.textContent = "Back to Dashboard";
  card.appendChild(link);

  layout.appendChild(card);
}
