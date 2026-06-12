/**
 * TERRA — SHARED APP SHELL
 * Binds global event handlers via delegation, replacing inline onclick=.
 * Loaded on every app page after constants.js, before main.js.
 */

document.addEventListener("DOMContentLoaded", () => {
  initGlobalEvents();
  initAccessibilityEnhancements();
});

/* ====================================================   CSP VIOLATION MONITORING
   Logs policy violations for security observability.
   ==================================================== */
if (typeof document.addEventListener === "function") {
  document.addEventListener("securitypolicyviolation", (e) => {
    console.warn(
      `CSP violation: ${e.violatedDirective} blocked ${e.blockedURI} on ${e.sourceFile}:${e.lineNumber}`
    );
  });
}

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
   Route table maps CSS selectors to handler functions.
   Replaces all inline onclick= handlers with JS-bound events.
   ==================================================== */
function initGlobalEvents() {
  // Route table: each entry matches a selector and delegates to a handler
  const clickRoutes = [
    {
      selector: ".ob-back-btn",
      handler: (e, el) => { e.preventDefault(); if (typeof prevStep === "function") prevStep(); },
    },
    {
      selector: ".btn-primary",
      handler: (e, el) => {
        const panel = el.closest(".ob-step-panel");
        if (panel && !el.closest("#step-7") && typeof nextStep === "function") {
          e.preventDefault(); nextStep();
        }
      },
    },
    {
      selector: ".ob-skip",
      handler: (e) => { e.preventDefault(); window.location.href = "dashboard.html"; },
    },
    {
      selector: "#step-2 .ob-option-card",
      handler: (e, el) => { if (typeof toggleOption === "function") toggleOption(el); },
    },
    {
      selector: "#step-3 .ob-option-card, #step-6 .ob-option-card",
      handler: (e, el) => {
        if (typeof selectSingle !== "function") return;
        const group = el.closest(".ob-options-grid");
        const groupName = el.closest("#step-3") ? "cooking" : "flighttype";
        selectSingle(el, groupName);
        if (group) {
          group.setAttribute("data-selected-value", el.querySelector("strong")?.textContent?.trim() || el.textContent.trim().split("\n")[0]);
        }
      },
    },
    {
      selector: "#step-4 .ob-option-row, #step-5 .ob-option-row",
      handler: (e, el) => {
        if (typeof selectSingle !== "function") return;
        const group = el.closest(".ob-options-list") || el.closest(".ob-options-grid");
        selectSingle(el, "diet");
        if (group) {
          group.setAttribute("data-selected-value", el.querySelector("strong")?.textContent?.trim() || el.textContent.trim().split("\n")[0]);
        }
      },
    },
    {
      selector: ".ob-goal-card",
      handler: (e, el) => { if (typeof toggleGoal === "function") toggleGoal(el); },
    },
    {
      selector: "#step-5 .chip",
      handler: (e, el) => { if (typeof toggleChip === "function") toggleChip(el); },
    },
    {
      selector: ".toggle-option",
      handler: (e, el) => {
        const group = el.closest(".toggle-group");
        if (!group) return;
        group.querySelectorAll(".toggle-option").forEach(s => {
          s.classList.remove("active");
          s.setAttribute("aria-selected", "false");
        });
        el.classList.add("active");
        el.setAttribute("aria-selected", "true");
        if (typeof window.switchPeriod === "function") window.switchPeriod(el);
        if (typeof announceUpdate === "function") {
          announceUpdate(`Period changed to ${el.textContent.trim()}`);
        }
      },
    },
    {
      selector: ".rec-item",
      handler: () => { window.location.href = "actions.html"; },
    },
    {
      selector: ".insight-card-action",
      handler: (e, el) => {
        const href = el.getAttribute("data-href");
        if (href) { e.preventDefault(); window.location.href = href; }
      },
    },
  ];

  // Single delegated click listener dispatches to route handlers
  document.addEventListener("click", (e) => {
    for (const route of clickRoutes) {
      const el = e.target.closest(route.selector);
      if (el) { route.handler(e, el); break; }
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
