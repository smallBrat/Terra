/**
 * TERRA — SHARED DOM UTILITIES
 * Pure helper functions for common DOM manipulation patterns.
 * Each function does one thing and has no side effects beyond its target element.
 */

/* ====================================================   TEXT & CONTENT
   ==================================================== */

/**
 * Safely set text content on an element.
 * @param {string|Element} target — Selector or element
 * @param {string} text — Text content to set
 */
function setText(target, text) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (el) el.textContent = String(text);
}

/**
 * Set multiple text values from a {selector: value} map.
 * @param {Object} map — { selector: textValue, ... }
 */
function setTextMap(map) {
  for (const [selector, value] of Object.entries(map)) {
    const el = document.querySelector(selector);
    if (el) el.textContent = String(value);
  }
}

/* ====================================================   CSS CUSTOM PROPERTIES (bar charts)
   ==================================================== */

/**
 * Set a CSS custom property on an element's style.
 * @param {string|Element} target — Selector or element
 * @param {string} prop — CSS custom property name (e.g. '--bar-pct')
 * @param {string|number} value — Value to set
 */
function setStyleProp(target, prop, value) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (el) el.style.setProperty(prop, String(value));
}

/**
 * Set --bar-pct on a bar fill element.
 * @param {string|Element} target — Selector or element
 * @param {number} pct — Percentage value (0–100)
 */
function setBarPct(target, pct) {
  setStyleProp(target, "--bar-pct", String(pct));
}

/* ====================================================   VISIBILITY
   ==================================================== */

/**
 * Show/hide an element by toggling the .is-hidden class.
 * @param {string|Element} target — Selector or element
 * @param {boolean} visible — true to show, false to hide
 */
function setVisible(target, visible) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (el) el.classList.toggle("is-hidden", !visible);
}

/**
 * Show a group of elements matching a selector, hide the rest.
 * @param {string} groupSelector — Selector for all elements in the group
 * @param {string} showSelector — Selector for the subset to show
 */
function showGroup(groupSelector, showSelector) {
  document.querySelectorAll(groupSelector).forEach(el => {
    el.classList.toggle("is-hidden", !el.matches(showSelector));
  });
}

/* ====================================================   ELEMENT CREATION
   ==================================================== */

/**
 * Create a <span> with a given CSS class and text content.
 * @param {string} className — CSS class(es) for the span
 * @param {string} text — Text content
 * @returns {HTMLSpanElement}
 */
function createSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

/**
 * Create a unit label span (e.g. "kg", "kg CO₂e").
 * @param {string} unit — Unit text
 * @returns {HTMLSpanElement}
 */
function createUnitSpan(unit) {
  return createSpan("text-muted-sm", unit);
}

/* ====================================================   SELECTOR CONSTANTS
   Centralized DOM selectors to avoid magic strings scattered through code.
   ==================================================== */

const S = {
  // Page header
  pageTitle: ".page-title",
  pageSubtitle: ".page-subtitle",

  // Dashboard — footprint summary
  fscNumber: ".fsc-number",
  fscContext: ".fsc-context",
  fscComparison: ".fsc-comparison",
  fscPeriodLabel: ".fsc-period-label",
  fscUnit: ".fsc-unit",

  // Dashboard — category bars
  fillTravel: ".fill-travel",
  fillHome: ".fill-home",
  fillFood: ".fill-food",
  fillShop: ".fill-shop",

  // Dashboard — legend
  legendItems: ".legend-item",
  legendValue: ".legend-value",

  // Dashboard — sidebar
  sidebarFootprintValue: ".sidebar-footprint-value",

  // Dashboard — streak
  streakCard: ".streak-card",
  streakCount: ".streak-count",

  // Breakdown
  bhTotalVal: ".bh-total-val",
  segTravel: ".seg-travel",
  segHome: ".seg-home",
  segFood: ".seg-food",
  segShop: ".seg-shop",
  bhCompFillYours: ".bh-comp-fill.yours",
  bhCompVal: ".bh-comp-val",
  bhLegItems: ".bh-leg-item",
  bhLegPct: ".bh-leg-pct",

  // Actions
  actionsList: ".actions-list",
  actionCard: ".action-card",
  actionCardSave: ".action-card-save",
  potentialSaving: ".potential-saving",
  potentialSavingLabel: ".potential-saving-label span",

  // Check-in
  checkinLayout: ".checkin-layout",
  ciImpactVal: ".ci-impact-val",
  ciSubmitArea: ".ci-submit-area",
  ciModeChip: ".ci-mode-chip",
  ciMealChip: ".ci-meal-chip",
  ciToggleInput: ".ci-toggle input",
  ciStepper: ".ci-stepper",
  ciStepperVal: ".ci-stepper-val",
  ciStepperBtn: ".ci-stepper-btn",

  // Onboarding
  progressFill: "#progressFill",
  stepCounterDisplay: "#stepCounterDisplay",
  sidebarTag: "#sidebarTag",
  sidebarTitle: "#sidebarTitle",
  sidebarDesc: "#sidebarDesc",
  stepsNav: "#stepsNav",

  // Profile
  profileName: ".profile-name",
  profileStatVal: ".profile-stat-val",
  dataRows: ".data-row",
  dataRowValue: ".data-row-value",
  goalsList: ".goals-list",
};
