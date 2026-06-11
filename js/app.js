/**
 * TERRA — SHARED APP SHELL
 * Binds global event handlers via delegation, replacing inline onclick=.
 * Loaded on every app page after constants.js, before main.js.
 */

document.addEventListener("DOMContentLoaded", () => {
  initGlobalEvents();
  initAccessibilityEnhancements();
});

/* ====================================================
   ACCESSIBILITY ENHANCEMENTS
   Adds tabindex, role="button", and aria attributes to
   interactive non-button elements.
   ==================================================== */
function initAccessibilityEnhancements() {
  // Make clickable divs keyboard-accessible
  const clickableSelectors = [
    ".ob-option-card",
    ".ob-option-row",
    ".ob-goal-card",
    ".ci-meal-chip",
    ".rec-item",
    ".bdc-header",
    ".insight-card-action"
  ];

  clickableSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    });
  });

  // Accordion headers: aria-expanded
  document.querySelectorAll(".bdc-header").forEach(header => {
    const card = header.closest(".bdc-card");
    if (card) {
      header.setAttribute("aria-expanded", card.classList.contains("open") ? "true" : "false");
    }
  });

  // Nav links: aria-current="page"
  document.querySelectorAll(".nav-link.active, .sidebar-link.active").forEach(link => {
    link.setAttribute("aria-current", "page");
  });

  // Period toggle: role="tablist"
  document.querySelectorAll(".toggle-group").forEach(group => {
    group.setAttribute("role", "tablist");
    group.querySelectorAll(".toggle-option").forEach(opt => {
      opt.setAttribute("role", "tab");
      opt.setAttribute("aria-selected", opt.classList.contains("active") ? "true" : "false");
    });
  });

  // Range slider: ARIA attributes
  const rangeSlider = document.getElementById("commuteKm");
  if (rangeSlider) {
    rangeSlider.setAttribute("aria-valuemin", rangeSlider.min || "0");
    rangeSlider.setAttribute("aria-valuemax", rangeSlider.max || "100");
    rangeSlider.setAttribute("aria-valuenow", rangeSlider.value || "15");
    rangeSlider.setAttribute("aria-describedby", "commuteKmVal");
    rangeSlider.addEventListener("input", () => {
      rangeSlider.setAttribute("aria-valuenow", rangeSlider.value);
    });
  }

  // Form inputs: autocomplete
  const cityInput = document.getElementById("city");
  if (cityInput && !cityInput.hasAttribute("autocomplete")) {
    cityInput.setAttribute("autocomplete", "address-level2");
  }
}

/* ====================================================
   GLOBAL EVENT DELEGATION
   Replaces all inline onclick= handlers with JS-bound events.
   ==================================================== */
function initGlobalEvents() {
  // Onboarding: navigation buttons
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("ob-back-btn")) {
      e.preventDefault();
      if (typeof prevStep === "function") prevStep();
    }
    if (target.classList.contains("btn-primary") && target.closest(".ob-step-panel") && !target.closest("#step-7")) {
      e.preventDefault();
      if (typeof nextStep === "function") nextStep();
    }
    if (target.classList.contains("ob-skip")) {
      e.preventDefault();
      window.location.href = "dashboard.html";
    }
  });

  // Onboarding: option cards (multi-select commute)
  document.addEventListener("click", (e) => {
    const card = e.target.closest("#step-2 .ob-option-card");
    if (card && typeof toggleOption === "function") toggleOption(card);
  });

  // Onboarding: single-select cards (cooking, AC, flight type)
  document.addEventListener("click", (e) => {
    const card = e.target.closest("#step-3 .ob-option-card, #step-6 .ob-option-card");
    if (card && typeof selectSingle === "function") {
      const group = card.closest(".ob-options-grid");
      const groupName = card.closest("#step-3") ? "cooking" : "flighttype";
      selectSingle(card, groupName);
      if (group) {
        group.setAttribute("data-selected-value", card.querySelector("strong")?.textContent?.trim() || card.textContent.trim().split("\n")[0]);
      }
    }
  });

  // Onboarding: single-select rows (diet, shopping)
  document.addEventListener("click", (e) => {
    const row = e.target.closest("#step-4 .ob-option-row, #step-5 .ob-option-row");
    if (row && typeof selectSingle === "function") {
      const group = row.closest(".ob-options-list") || row.closest(".ob-options-grid");
      selectSingle(row, "diet");
      if (group) {
        group.setAttribute("data-selected-value", row.querySelector("strong")?.textContent?.trim() || row.textContent.trim().split("\n")[0]);
      }
    }
  });

  // Onboarding: goal cards (multi-select)
  document.addEventListener("click", (e) => {
    const goal = e.target.closest(".ob-goal-card");
    if (goal && typeof toggleGoal === "function") toggleGoal(goal);
  });

  // Onboarding: chips (multi-select)
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("#step-5 .chip");
    if (chip && typeof toggleChip === "function") toggleChip(chip);
  });

  // Dashboard: period toggle
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".toggle-option");
    if (toggle && toggle.closest(".toggle-group")) {
      const group = toggle.closest(".toggle-group");
      const isWeek = toggle.textContent.trim() === "Week";
      group.querySelectorAll(".toggle-option").forEach(s => {
        s.classList.remove("active");
        s.setAttribute("aria-selected", "false");
      });
      toggle.classList.add("active");
      toggle.setAttribute("aria-selected", "true");
      if (typeof window.switchPeriod === "function") window.switchPeriod(toggle);
    }
  });

  // Dashboard: recommendation items
  document.addEventListener("click", (e) => {
    const rec = e.target.closest(".rec-item");
    if (rec) window.location.href = "actions.html";
  });

  // Insights: action buttons (support both data-href and onclick patterns)
  document.addEventListener("click", (e) => {
    const action = e.target.closest(".insight-card-action");
    if (action) {
      const href = action.getAttribute("data-href");
      if (href) {
        e.preventDefault();
        window.location.href = href;
      }
    }
  });

  // Keyboard accessibility for clickable non-button elements
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = e.target;
    const isClickable =
      target.classList.contains("ob-option-card") ||
      target.classList.contains("ob-option-row") ||
      target.classList.contains("ob-goal-card") ||
      target.classList.contains("ci-meal-chip") ||
      target.classList.contains("rec-item") ||
      target.classList.contains("bdc-header") ||
      target.classList.contains("insight-card-action");
    if (isClickable) { e.preventDefault(); target.click(); }
  });
}

/* ====================================================
   LIVE REGION FOR DYNAMIC UPDATES
   ==================================================== */
let _liveRegion = null;

function getLiveRegion() {
  if (!_liveRegion) {
    _liveRegion = document.createElement("div");
    _liveRegion.setAttribute("role", "status");
    _liveRegion.setAttribute("aria-live", "polite");
    _liveRegion.setAttribute("aria-atomic", "true");
    _liveRegion.className = "visually-hidden";
    document.body.appendChild(_liveRegion);
  }
  return _liveRegion;
}

function announceUpdate(message) {
  const region = getLiveRegion();
  region.textContent = "";
  requestAnimationFrame(() => { region.textContent = message; });
}

/* ====================================================
   MOBILE NAVIGATION (enhanced with aria-expanded)
   ==================================================== */
function initMobileNavEnhanced() {
  const toggleBtn = document.getElementById("mobileMenuToggle");
  const navInner = document.querySelector(".nav-inner");
  if (toggleBtn && navInner) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = navInner.classList.toggle("mobile-open");
      toggleBtn.classList.toggle("active");
      toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggleBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      if (isOpen) {
        const firstLink = navInner.querySelector(".nav-link, .btn");
        if (firstLink) firstLink.focus();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initMobileNavEnhanced);
