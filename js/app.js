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

/* ====================================================   GLOBAL EVENT DELEGATION
   Single delegated click handler routes to handlers via a selector-based map.
   ==================================================== */

/**
 * Dispatch table: CSS selector → handler function.
 * Handler receives (element, event). Order matters — first match wins.
 */
const CLICK_HANDLERS = [
  // Onboarding navigation
  { sel: ".ob-back-btn",          fn: (el, e) => { e.preventDefault(); if (typeof prevStep === "function") prevStep(); } },
  { sel: ".ob-skip",              fn: (el, e) => { e.preventDefault(); window.location.href = "dashboard.html"; } },
  { sel: ".ob-step-panel .btn-primary:not(#step-7 .btn-primary)", fn: (el, e) => { e.preventDefault(); if (typeof nextStep === "function") nextStep(); } },

  // Onboarding option selection
  { sel: "#step-2 .ob-option-card", fn: (el) => { if (typeof toggleOption === "function") toggleOption(el); } },
  { sel: "#step-3 .ob-option-card, #step-6 .ob-option-card", fn: (el) => { handleSingleSelect(el); } },
  { sel: "#step-4 .ob-option-row, #step-5 .ob-option-row", fn: (el) => { handleSingleSelect(el); } },
  { sel: ".ob-goal-card",         fn: (el) => { if (typeof toggleGoal === "function") toggleGoal(el); } },
  { sel: "#step-5 .chip",         fn: (el) => { if (typeof toggleChip === "function") toggleChip(el); } },

  // Dashboard
  { sel: ".toggle-option",        fn: (el) => { handlePeriodToggle(el); } },
  { sel: ".rec-item",             fn: () => { window.location.href = "actions.html"; } },

  // Insights
  { sel: ".insight-card-action",  fn: (el, e) => { const href = el.getAttribute("data-href"); if (href) { e.preventDefault(); window.location.href = href; } } },
];

/** Helper: select a card/row and store its value on the parent group. */
function handleSingleSelect(el) {
  if (typeof selectSingle !== "function") return;
  const group = el.closest(".ob-options-grid") || el.closest(".ob-options-list");
  selectSingle(el);
  if (group) {
    group.setAttribute("data-selected-value", el.querySelector("strong")?.textContent?.trim() || el.textContent.trim().split("\n")[0]);
  }
}

/** Helper: period toggle — deactivate siblings, activate clicked, notify. */
function handlePeriodToggle(el) {
  const group = el.closest(".toggle-group");
  if (!group) return;
  group.querySelectorAll(".toggle-option").forEach(s => {
    s.classList.remove("active");
    s.setAttribute("aria-selected", "false");
  });
  el.classList.add("active");
  el.setAttribute("aria-selected", "true");
  if (typeof window.switchPeriod === "function") window.switchPeriod(el);
}

function initGlobalEvents() {
  // Single delegated click handler — routes via dispatch table
  document.addEventListener("click", (e) => {
    for (const { sel, fn } of CLICK_HANDLERS) {
      const el = e.target.closest(sel);
      if (el) { fn(el, e); return; }
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
