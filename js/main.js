// TERRA - GLOBAL CORE JAVASCRIPT
// Note: initMobileNav, initBreakdownScreen, and global event delegation
// are now in js/app.js which loads before this file.

document.addEventListener("DOMContentLoaded", () => {
  // Load user profile & state
  initAppProfile();

  // Check-in and Log habits page integrations
  initCheckinScreen();

  // Actions bookmark/filter integrations
  initActionsScreen();
});

/* ====================================================
   APP PROFILE & STATE INTEGRATION
   ==================================================== */
let appUser = null;

function initAppProfile() {
  appUser = safeJSONParse(STORAGE_KEYS.user, null);
  if (!appUser) appUser = DEFAULT_PROFILE;

  // Populate user data across dashboards and screens
  const userNameEls = document.querySelectorAll(".page-title");
  userNameEls.forEach(el => {
    if (el.textContent.includes("Good evening, Arjun")) {
      const name = escapeHTML(appUser ? appUser.name : "Arjun");
      const dateString = getFormattedDateString();
      el.textContent = `Good evening, ${name} 👋`;
      const subtitle = el.nextElementSibling;
      if (subtitle && subtitle.classList.contains("page-subtitle")) {
        subtitle.textContent = `${dateString} · Week 23 of the year`;
      }
    }
  });

  // If we have user data, update the main weekly footprint summary components on the page
  if (appUser && appUser.footprint) {
    const fscNumber = document.querySelector(".fsc-number");
    if (fscNumber) {
      fscNumber.textContent = String(appUser.footprint.total);
      const unit = document.createElement("span");
      unit.className = "fsc-unit";
      unit.textContent = "kg CO₂e";
      fscNumber.appendChild(unit);
    }

    const fscContext = document.querySelector(".fsc-context");
    if (fscContext) {
      fscContext.textContent = "";
      const avgRef = appUser.footprint.total > 41 ? "48.5" : "41.7";
      fscContext.appendChild(document.createTextNode("You're "));
      const strong = document.createElement("strong");
      strong.textContent = `${appUser.footprint.comparisonPct}% ${appUser.footprint.comparisonLabel}`;
      fscContext.appendChild(strong);
      fscContext.appendChild(document.createTextNode(` of ${avgRef} kg/week for your household profile. The climate-efficient range for your lifestyle is 22–28 kg/week.`));
    }

    const fscComparison = document.querySelector(".fsc-comparison");
    if (fscComparison) {
      if (appUser.footprint.comparisonLabel.includes("below")) {
        fscComparison.className = "fsc-comparison better";
        fscComparison.textContent = `↓ ${appUser.footprint.comparisonPct}% vs average`;
      } else {
        fscComparison.className = "fsc-comparison worse";
        fscComparison.textContent = `↑ ${appUser.footprint.comparisonPct}% vs average`;
      }
    }

    // Mini sidebar footprint panel
    const sidebarVal = document.querySelector("aside div div div:nth-child(2)");
    if (sidebarVal && sidebarVal.style.fontSize === "1.75rem") {
      sidebarVal.textContent = appUser.footprint.total;
    }

    // Update Category Bars in main list
    const fillTravel = document.querySelector(".fill-travel");
    const fillHome = document.querySelector(".fill-home");
    const fillFood = document.querySelector(".fill-food");
    const fillShop = document.querySelector(".fill-shop");

    const pctTravel = (appUser.footprint.commute / appUser.footprint.total) * 100;
    const pctHome = (appUser.footprint.energy / appUser.footprint.total) * 100;
    const pctFood = (appUser.footprint.food / appUser.footprint.total) * 100;
    const pctShop = (appUser.footprint.shopping / appUser.footprint.total) * 100;

    function updateCategoryRow(fill, pct, val) {
      if (!fill) return;
      fill.style.setProperty('--bar-pct', `${pct}`);
      const row = fill.closest(".cbc-row");
      if (!row) return;
      row.querySelector(".cbc-row-pct").textContent = `${Math.round(pct)}%`;
      const valEl = row.querySelector(".cbc-row-val");
      valEl.textContent = String(val);
      const unit = document.createElement("span");
      unit.className = "text-muted-sm";
      unit.textContent = " kg";
      valEl.appendChild(unit);
    }

    updateCategoryRow(fillTravel, pctTravel, appUser.footprint.commute);
    updateCategoryRow(fillHome, pctHome, appUser.footprint.energy);
    updateCategoryRow(fillFood, pctFood, appUser.footprint.food);
    updateCategoryRow(fillShop, pctShop, appUser.footprint.shopping);

    // Donut Legend labels
    const legends = document.querySelectorAll(".legend-item");
    if (legends.length === 4) {
      legends[0].querySelector(".legend-value").textContent = appUser.footprint.commute;
      legends[1].querySelector(".legend-value").textContent = appUser.footprint.energy;
      legends[2].querySelector(".legend-value").textContent = appUser.footprint.food;
      legends[3].querySelector(".legend-value").textContent = appUser.footprint.shopping;
    }
  }

  // Update Streak Count based on localStorage
  const loggedToday = localStorage.getItem("terra_logged_today") === "true";
  const streakCountVal = localStorage.getItem("terra_streak_count") || "11";
  
  const streakCard = document.querySelector(".streak-card");
  if (streakCard) {
    const countEl = streakCard.querySelector(".streak-count");
    countEl.textContent = String(streakCountVal);
    const daysSpan = document.createElement("span");
    daysSpan.textContent = " days";
    countEl.appendChild(daysSpan);
    
    // Check Saturday marker if logged today (default is Wk 23 checkins)
    if (loggedToday) {
      const todayEl = streakCard.querySelector(".streak-day.today");
      if (todayEl) {
        todayEl.className = "streak-day done";
      }
    }
  }
}

// Period Switcher: Weekly/Monthly
window.switchPeriod = function(period, btn) {
  const siblings = btn.parentNode.querySelectorAll(".toggle-option");
  siblings.forEach(s => s.classList.remove("active"));
  btn.classList.add("active");

  const totalWeekly = appUser ? appUser.footprint.total : 34.2;
  const fscNumber = document.querySelector(".fsc-number");
  const fscLabel = document.querySelector(".fsc-period-label");

  function setFootprintDisplay(numberEl, value) {
    if (!numberEl) return;
    numberEl.textContent = String(value);
    const unit = document.createElement("span");
    unit.className = "fsc-unit";
    unit.textContent = "kg CO₂e";
    numberEl.appendChild(unit);
  }

  if (period === "month") {
    const monthlyTotal = (totalWeekly * 4.33).toFixed(1);
    setFootprintDisplay(fscNumber, monthlyTotal);
    if (fscLabel) fscLabel.textContent = "Monthly footprint estimate";

    const legendValues = document.querySelectorAll(".legend-value");
    if (legendValues.length === 4) {
      const factor = 4.33;
      const vals = [
        appUser ? appUser.footprint.commute : 17.8,
        appUser ? appUser.footprint.energy : 9.6,
        appUser ? appUser.footprint.food : 6.1,
        appUser ? appUser.footprint.shopping : 0.7
      ];
      vals.forEach((v, i) => { legendValues[i].textContent = (v * factor).toFixed(1); });
    }
  } else {
    setFootprintDisplay(fscNumber, totalWeekly);
    if (fscLabel) fscLabel.textContent = "Weekly footprint";

    const legendValues = document.querySelectorAll(".legend-value");
    if (legendValues.length === 4) {
      const vals = appUser ? [
        appUser.footprint.commute, appUser.footprint.energy,
        appUser.footprint.food, appUser.footprint.shopping
      ] : [17.8, 9.6, 6.1, 0.7];
      vals.forEach((v, i) => { legendValues[i].textContent = String(v); });
    }
  }
};

function getFormattedDateString() {
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const today = new Date();
  return today.toLocaleDateString("en-IN", options);
}

/* ====================================================
   BREAKDOWN VALUES UPDATE
   (accordion logic moved to app.js)
   ==================================================== */
function updateBreakdownValues() {
  if (!appUser || !appUser.footprint) return;

  // Stacked bar heights representation
  const segTravel = document.querySelector(".seg-travel");
  const segHome = document.querySelector(".seg-home");
  const segFood = document.querySelector(".seg-food");
  const segShop = document.querySelector(".seg-shop");

  const total = appUser.footprint.total;
  const pctTravel = (appUser.footprint.commute / total) * 100;
  const pctHome = (appUser.footprint.energy / total) * 100;
  const pctFood = (appUser.footprint.food / total) * 100;
  const pctShop = (appUser.footprint.shopping / total) * 100;

  if (segTravel) segTravel.style.setProperty('--seg-pct', `${pctTravel}`);
  if (segHome) segHome.style.setProperty('--seg-pct', `${pctHome}`);
  if (segFood) segFood.style.setProperty('--seg-pct', `${pctFood}`);
  if (segShop) segShop.style.setProperty('--seg-pct', `${pctShop}`);

  // Update percentages on legends
  const legendItems = document.querySelectorAll(".bh-leg-item");
  if (legendItems.length === 4) {
    legendItems[0].querySelector(".bh-leg-pct").textContent = `${Math.round(pctTravel)}%`;
    legendItems[1].querySelector(".bh-leg-pct").textContent = `${Math.round(pctHome)}%`;
    legendItems[2].querySelector(".bh-leg-pct").textContent = `${Math.round(pctFood)}%`;
    legendItems[3].querySelector(".bh-leg-pct").textContent = `${Math.round(pctShop)}%`;
  }

  // Update total display in breakdown hero
  const bhTotal = document.querySelector(".bh-total-val");
  if (bhTotal) {
    bhTotal.textContent = String(total);
    const unit = document.createElement("span");
    unit.className = "bh-total-unit";
    unit.textContent = "kg CO₂e/week";
    bhTotal.appendChild(unit);
  }

  // Update profile comparison graph
  const yoursFill = document.querySelector(".bh-comp-fill.yours");
  if (yoursFill) {
    const relativePct = Math.round((total / BENCHMARKS.comparisonBaseMax) * 100);
    yoursFill.style.setProperty('--bar-pct', `${Math.min(100, relativePct)}`);
    const yoursVal = yoursFill.closest(".bh-comp-row")?.querySelector(".bh-comp-val");
    if (yoursVal) yoursVal.textContent = `${total} kg`;
  }

  // Update category card headings
  function updateBdcValue(card, val) {
    if (!card) return;
    const el = card.querySelector(".bdc-value");
    if (!el) return;
    el.textContent = String(val);
    const unit = document.createElement("span");
    unit.className = "bdc-value-unit";
    unit.textContent = " kg CO₂e";
    el.appendChild(unit);
  }

  updateBdcValue(document.querySelector(".bdc-card .bdc-icon.travel")?.closest(".bdc-card"), appUser.footprint.commute);
  updateBdcValue(document.querySelector(".bdc-card .bdc-icon.home")?.closest(".bdc-card"), appUser.footprint.energy);
  updateBdcValue(document.querySelector(".bdc-card .bdc-icon.food")?.closest(".bdc-card"), appUser.footprint.food);
  updateBdcValue(document.querySelector(".bdc-card .bdc-icon.shop")?.closest(".bdc-card"), appUser.footprint.shopping);
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
    } catch (e) {}
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
      const cards = document.querySelectorAll(".action-card");
      cards.forEach(card => {
        const cardCat = card.getAttribute("data-category");
        if (category === "all" || cardCat === category) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
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
   DAILY HABITS LOG / CHECK-IN SCREEN
   ==================================================== */
let loggedSavings = 0;

function initCheckinScreen() {
  const checkinLayout = document.querySelector(".checkin-layout");
  if (!checkinLayout) return;

  // Bind Steppers
  const steppers = document.querySelectorAll(".ci-stepper");
  steppers.forEach(stepper => {
    const decBtn = stepper.querySelector(".ci-stepper-btn:first-child");
    const incBtn = stepper.querySelector(".ci-stepper-btn:last-child");
    const valSpan = stepper.querySelector(".ci-stepper-val");
    const max = parseInt(stepper.getAttribute("data-max")) || 10;
    
    decBtn.addEventListener("click", () => {
      let val = parseInt(valSpan.textContent) || 0;
      if (val > 0) {
        valSpan.textContent = val - 1;
        calculateDailySavings();
      }
    });

    incBtn.addEventListener("click", () => {
      let val = parseInt(valSpan.textContent) || 0;
      if (val < max) {
        valSpan.textContent = val + 1;
        calculateDailySavings();
      }
    });
  });

  // Bind Selectable chips (transport & AC switches)
  const modeChips = document.querySelectorAll(".ci-mode-chip");
  modeChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const parent = chip.closest(".ci-mode-chips");
      // Single select inside this cluster
      parent.querySelectorAll(".ci-mode-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      calculateDailySavings();
    });
  });

  // Bind toggles (deliveries batching)
  const toggles = document.querySelectorAll(".ci-toggle input");
  toggles.forEach(toggle => {
    toggle.addEventListener("change", () => {
      calculateDailySavings();
    });
  });

  // Bind Meal selector chips
  const mealChips = document.querySelectorAll(".ci-meal-chip");
  mealChips.forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      calculateDailySavings();
    });
  });

  // Bind submit button
  const submitBtn = document.querySelector(".ci-submit-area .btn-primary");
  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Update streak
      let streak = parseInt(localStorage.getItem("terra_streak_count") || "11");
      const loggedToday = localStorage.getItem("terra_logged_today") === "true";
      if (!loggedToday) {
        streak += 1;
        localStorage.setItem("terra_streak_count", streak);
        localStorage.setItem("terra_logged_today", "true");
      }

      // Deduct saved footprint slightly
      if (appUser && appUser.footprint && loggedSavings > 0) {
        // Shave off portion of daily logging
        appUser.footprint.total = parseFloat(Math.max(20.0, appUser.footprint.total - (loggedSavings / 7)).toFixed(1));
        localStorage.setItem("terra_user", JSON.stringify(appUser));
      }

      // Add a visual confirmation toast
      showLogConfirmation();
    });
  }

  // Run initial calculation
  calculateDailySavings();
}

function calculateDailySavings() {
  const previewVal = document.querySelector(".ci-impact-val");
  if (!previewVal) return;

  let savings = 0;

  // 1. Commute savings
  const activeCommute = document.querySelector(".ci-mode-chip.active");
  const commuteDist = parseInt(document.querySelector("#commuteLogStepper")?.textContent) || 0;
  if (activeCommute && commuteDist > 0) {
    const mode = activeCommute.innerText.trim();
    if (mode.includes("Bicycle") || mode.includes("Walk")) {
      savings += commuteDist * 0.18; // Saved full car commute emissions
    } else if (mode.includes("Public transit")) {
      savings += commuteDist * 0.12; // partially saved
    } else if (mode.includes("Carpool")) {
      savings += commuteDist * 0.08;
    }
  }

  // 2. Meal choices savings
  const selectedMeals = document.querySelectorAll(".ci-meal-chip.selected");
  selectedMeals.forEach(meal => {
    const mealLabel = meal.querySelector(".ci-meal-label").textContent;
    if (mealLabel.includes("Vegetarian") || mealLabel.includes("Vegan")) {
      savings += 0.8; // savings per meat-free meal
    }
  });

  // 3. Home Energy (AC setting)
  const activeAc = document.querySelector(".ci-mode-chips:has(.ci-mode-chip) .ci-mode-chip.active"); // wait, check selector
  const acToggles = document.querySelectorAll(".ci-mode-chip.active");
  acToggles.forEach(toggle => {
    const label = toggle.innerText;
    if (label.includes("AC at 24°C")) {
      savings += 0.4;
    } else if (label.includes("AC turned off")) {
      savings += 0.8;
    }
  });

  // 4. Shopping batching
  const batchToggle = document.querySelector(".ci-toggle input:checked");
  if (batchToggle) {
    savings += 0.3;
  }

  loggedSavings = parseFloat(savings.toFixed(1));
  previewVal.textContent = `− ${loggedSavings} kg CO₂e`;
}

function showLogConfirmation() {
  const layout = document.querySelector(".checkin-layout");
  if (!layout) return;

  layout.textContent = "";

  const card = document.createElement("div");
  card.className = "text-center bg-raised rounded-xl";
  card.style.padding = "var(--space-8) var(--space-4)";
  card.style.border = "1.5px solid var(--sage-200)";

  const icon = document.createElement("div");
  icon.style.fontSize = "3.5rem";
  icon.style.marginBottom = "var(--space-4)";
  icon.textContent = "🌿";
  card.appendChild(icon);

  const heading = document.createElement("h2");
  heading.className = "fw-700 text-primary mb-2";
  heading.style.fontSize = "1.5rem";
  heading.textContent = "Log completed!";
  card.appendChild(heading);

  const msg = document.createElement("p");
  msg.className = "text-secondary";
  msg.style.maxWidth = "320px";
  msg.style.margin = "0 auto var(--space-6)";
  msg.style.fontSize = "0.9375rem";
  msg.style.lineHeight = "1.6";
  msg.textContent = `Great check-in! You saved approximately ${loggedSavings} kg CO₂e today. Your dashboard metrics and streak have been updated.`;
  card.appendChild(msg);

  const link = document.createElement("a");
  link.href = "dashboard.html";
  link.className = "btn btn-primary";
  link.textContent = "Back to Dashboard";
  card.appendChild(link);

  layout.appendChild(card);
}
