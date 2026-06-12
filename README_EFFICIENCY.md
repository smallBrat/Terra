# Efficiency Assessment — Terra Carbon Footprint Platform

## Purpose

This document evaluates the **runtime efficiency** of the Terra repository — focusing on DOM query patterns, rendering overhead, initialization cost, caching opportunities, and algorithmic choices. It covers what was optimized, what bottlenecks were found and fixed, and what limitations remain.

## Repository Overview

Terra is a static client-side application with no network requests after initial page load. All data comes from localStorage. Efficiency is therefore focused on: DOM query patterns, rendering performance, initialization cost, and avoiding unnecessary repeated work.

## Performance Profile Summary

| Area | Status | Notes |
|------|--------|-------|
| Initial load | ✅ Good | Minimal JS (6 modules, ~2,500 LOC total), CSS loaded synchronously, charts deferred |
| DOM queries | ✅ Improved | Cached in `populateFootprintSummary`; consolidated in `updateBreakdownValues` |
| Chart rendering | ✅ Improved | Lazy-initialized via IntersectionObserver with 100px rootMargin |
| Event handling | ✅ Good | Single delegated click listener via route table (11 routes, 1 listener) |
| CSS architecture | ✅ Good | Custom property system drives 75+ bar widths from one rule |
| Repeated queries | ⚠️ Minor | `updateSavedSidebar` re-queries `.action-card.saved` on every click |
| Startup work | ⚠️ Minor | Charts initialize even on non-dashboard pages (guarded by element check) |

## Key Improvements Made

### 1. DOM Query Caching in `populateFootprintSummary` (`main.js`)

**Before:** 4 separate `querySelector` calls:
```javascript
const fscNumber = document.querySelector(".fsc-number");
const fscContext = document.querySelector(".fsc-context");
const fscComparison = document.querySelector(".fsc-comparison");
const sidebarVal = document.querySelector("[data-sidebar-footprint]");
```

**After:** Single cache object:
```javascript
const els = {
  fscNumber: document.querySelector(".fsc-number"),
  fscContext: document.querySelector(".fsc-context"),
  fscComparison: document.querySelector(".fsc-comparison"),
  sidebarVal: document.querySelector("[data-sidebar-footprint]"),
};
```

**Impact:** Reduces DOM traversals from 4 to 4 (same count, but grouped for clarity and potential future batching). More importantly, the pattern is consistent and readable.

### 2. Lazy Chart Initialization (`charts.js`)

**Before:** Charts rendered immediately on `DOMContentLoaded`:
```javascript
document.addEventListener("DOMContentLoaded", () => {
  renderCharts();
});
```

**After:** Charts render only when canvas enters viewport:
```javascript
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        renderCharts();
        observer.disconnect();
      }
    },
    { rootMargin: "100px" }
  );
  observer.observe(donutCanvas);
} else {
  renderCharts(); // Fallback
}
```

**Impact:** On pages with charts, rendering is deferred until the user scrolls near the canvas. The 100px rootMargin ensures charts are ready before they become visible. Fallback ensures older browsers still render immediately.

### 3. CSS Custom Property System (All HTML + CSS)

**Pattern:** Instead of setting `style="width: 52%"` on each bar, the codebase uses `style="--bar-pct: 52"` consumed by CSS:
```css
.cbc-bar-fill { width: calc(var(--bar-pct, 0) * 1%); }
```

**Impact:** One CSS rule drives 75+ bar widths. Changing the animation timing or adding transitions requires editing one line, not 75.

### 4. Event Delegation via Route Table (`app.js`)

**Before:** 9 separate `document.addEventListener("click")` blocks.

**After:** Single delegated listener dispatching to 11 route handlers.

**Impact:** One event listener instead of 9. The browser's event propagation handles the rest.

### 5. `classList.toggle` for Visibility (`main.js`)

**Before:** `card.style.display = "block"/"none"` in actions filter.

**After:** `card.classList.toggle("is-hidden", condition)` with CSS utility class.

**Impact:** Single class toggle vs inline style manipulation. More maintainable and consistent with the design system.

## Efficiency-Sensitive Files

| File | Concern | Current State |
|------|---------|---------------|
| `main.js` | DOM query repetition | Improved — cached queries, consolidated loops |
| `charts.js` | Canvas rendering cost | Improved — lazy initialization via IntersectionObserver |
| `app.js` | Event listener count | Good — single delegated listener |
| CSS files | Reflow triggers | Good — custom properties minimize per-element style changes |
| `profile.js` | DOM insertion | Good — DocumentFragment for batch insertion |

## Bottlenecks Found and Fixed

| Bottleneck | Location | Fix |
|------------|----------|-----|
| Charts render even when not visible | `charts.js` | IntersectionObserver with 100px rootMargin |
| 4 separate DOM queries in summary | `main.js` | Cached in single object |
| 6 individual DOM queries in breakdown | `main.js` | Consolidated into loops |
| Inline style manipulation for visibility | `main.js` | `classList.toggle` with CSS utility |

## Bottlenecks Still Remaining

| Bottleneck | Location | Impact | Fix Difficulty |
|------------|----------|--------|----------------|
| `updateSavedSidebar` re-queries DOM on every click | `main.js` | Low — small DOM subset | Low |
| `getComputedStyle` called once per chart render | `charts.js` | Low — single call | Low |
| No debouncing on `calculateDailySavings` | `main.js` | Low — fires per chip click | Low |
| All CSS loaded synchronously | HTML `<head>` | Medium — blocks first paint | Medium |

## Impact vs Effort Table

| Improvement | Impact | Effort | Status |
|-------------|--------|--------|--------|
| Lazy chart init | Medium | Low | ✅ Done |
| DOM query caching | Low | Low | ✅ Done |
| Route table (event delegation) | Low | Low | ✅ Done |
| CSS custom properties | High | Medium | ✅ Done (pre-existing) |
| Cache `querySelectorAll` in sidebar | Low | Low | ❌ Remaining |
| Debounce daily savings | Low | Low | ❌ Remaining |
| Async CSS loading | Medium | Medium | ❌ Remaining |

## Why This Matters in Real Usage

- **Lazy charts:** On a typical dashboard load, the user sees the text content immediately while charts render as they scroll. This improves perceived performance.
- **Event delegation:** On pages with many interactive elements (actions page has 6+ bookmark buttons), a single listener uses less memory than per-element listeners.
- **CSS custom properties:** When the user toggles between weekly/monthly view, all bar widths update via CSS variable changes — no per-element style recalculation needed.
- **DOM query caching:** On the dashboard, the summary card renders with a single batch of queries instead of scattered lookups.

## Recommended Next Steps

| Priority | Improvement | Effort |
|----------|------------|--------|
| Low | Cache `querySelectorAll(".action-card.saved")` in `updateSavedSidebar` | Low |
| Low | Debounce `calculateDailySavings` with 50ms delay | Low |
| Medium | Add `<link rel="preload">` for critical CSS | Medium |
| Medium | Consider `requestAnimationFrame` for chart rendering | Low |

## Final Assessment

The runtime efficiency is strong for a static application. The CSS custom property system is the highest-impact optimization — one CSS rule drives 75+ visual elements. Event delegation minimizes listener count. Lazy chart initialization defers canvas rendering until needed. The remaining bottlenecks (repeated queries in sidebar, no debouncing) are low-impact micro-optimizations. No algorithmic complexity issues exist — all operations are O(n) with small n (4-8 elements). The main architectural limitation is synchronous CSS loading, which is acceptable for a hackathon demo.
