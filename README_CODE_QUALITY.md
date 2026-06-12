# Code Quality Assessment — Terra Carbon Footprint Platform

## Purpose

This document evaluates the **code quality** of the Terra repository — focusing on readability, modularity, naming, separation of concerns, duplication, maintainability, error handling, and consistency. It covers what was found, what was improved, and what still needs work.

## Repository Overview

Terra is a static vanilla HTML/CSS/JS application (no framework, no build step, no server). It consists of 8 HTML pages, 6 JS modules, and 5 CSS files totaling approximately 2,500 lines of code. The app helps users calculate and track their carbon footprint through onboarding, dashboard visualization, daily check-ins, and action recommendations.

## What Was Analyzed

- All 6 JS modules (`constants.js`, `app.js`, `main.js`, `onboarding.js`, `charts.js`, `profile.js`)
- All 8 HTML pages for structural patterns
- All 5 CSS files for organization
- ESLint and Prettier configuration
- Test file structure and coverage

## Architecture Summary

The codebase follows a modular architecture with clear file boundaries:

| File | Responsibility | LOC | Quality Notes |
|------|---------------|-----|---------------|
| `constants.js` | All data, pure calculation (`calculateFootprint`), validation (`validateCity`, `validateRange`), utilities (`safeJSONParse`, `escapeHTML`) | ~310 | Excellent — single source of truth, pure functions, well-commented |
| `app.js` | Shared shell: event delegation, accessibility enhancements, live region, mobile nav | ~260 | Good — route table pattern replaces 9 repetitive click blocks |
| `main.js` | Page-specific DOM: profile rendering, period toggle, breakdown, actions, check-in | ~530 | Needs work — largest file, handles 4 different pages |
| `onboarding.js` | Stepper navigation, option selection, form data gathering + save | ~200 | Good — `gatherOnboardingInputs()` cleanly separates data gathering from persistence |
| `charts.js` | Canvas donut + trend charts with DPR scaling | ~150 | Good — focused single responsibility, lazy-initialized |
| `profile.js` | Profile page data rendering from localStorage | ~90 | Good — data-driven `GOAL_MAPPINGS` config, sanitized DOM creation |

## Key Improvements Made

### 1. Event Delegation Refactored to Route Table (`app.js`)

**Before:** 9 separate `document.addEventListener("click")` blocks with repetitive `if (target.classList.contains(...))` patterns.

**After:** A single route table with 11 entries, each mapping a CSS selector to a handler function. One delegated click listener dispatches to the correct handler.

**Why this improves maintainability:** Adding a new click handler requires adding one line to the route table, not a new 5-10 block. The pattern is self-documenting — the table reads like a map of all click interactions.

### 2. `updateCategoryRow` Hoisted to Module Level (`main.js`)

**Before:** Defined as a closure inside `initAppProfile()`, not reusable or testable in isolation.

**After:** Standalone function at module level, called by `populateCategoryBars()`.

**Why this improves maintainability:** The function is now independently testable and reusable. No hidden coupling between functions.

### 3. `createSpan` and `createUnitSpan` Helpers Extracted (`main.js`)

**Before:** 4 identical `document.createElement("span")` + `className` + `textContent` patterns scattered through the file.

**After:** Two reusable helpers at the top of the file. All span creation is now a one-liner.

### 4. `saveOnboardingData` Split into Gather + Save (`onboarding.js`)

**Before:** One 70-line function gathering 10+ form fields with repetitive DOM queries.

**After:** `gatherOnboardingInputs()` with helper functions `readSelectedText()` and `readSelectedCards()`, plus a clean `saveOnboardingData()` that calls `calculateFootprint` and persists.

### 5. `innerHTML +=` Replaced with Sanitized DOM Creation (`profile.js`)

**Before:** `goalsList.innerHTML += \`...\`` with template literals containing user data.

**After:** `document.createDocumentFragment()` with `createElement`, `escapeHTML` on user-controlled text, and `appendChild`.

### 6. Empty Catch Block Fixed (`main.js`)

**Before:** `catch (e) {}` — silently swallows JSON parse errors in actions loading.

**After:** `catch (e) { console.warn("Corrupted saved actions data, resetting."); }`

### 7. Fragile DOM Selector Replaced (`main.js` + 6 HTML files)

**Before:** `document.querySelector("aside div div div:nth-child(2)")` with `style.fontSize === "1.75rem"` check.

**After:** `document.querySelector("[data-sidebar-footprint]")` with a data attribute on the target element.

### 8. DOM Queries Cached in `populateFootprintSummary` (`main.js`)

**Before:** 4 separate `querySelector` calls for `.fsc-number`, `.fsc-context`, `.fsc-comparison`, `[data-sidebar-footprint]`.

**After:** Single `els` object caching all 4 references at once.

### 9. `updateBreakdownLegends` Consolidated (`main.js`)

**Before:** 4 individual `querySelector` + `textContent` assignments.

**After:** Single `forEach` loop over `querySelectorAll(".bh-leg-item")` with a keys array.

### 10. `updateCategoryCardValues` Data-Driven (`main.js`)

**Before:** 4 separate `querySelector` calls for each category card.

**After:** Loop over an entries array with icon/val pairs.

## Files and Modules Involved

| File | Role | Key Functions |
|------|------|---------------|
| `js/constants.js` | Data + pure logic | `calculateFootprint`, `validateCity`, `validateRange`, `safeJSONParse`, `escapeHTML` |
| `js/app.js` | Shared shell | `initGlobalEvents` (route table), `initAccessibilityEnhancements`, `announceUpdate`, `initMobileNavEnhanced` |
| `js/main.js` | Page DOM logic | `initAppProfile`, `populateFootprintSummary`, `switchPeriod`, `updateBreakdownValues`, `initActionsScreen`, `initCheckinScreen` |
| `js/onboarding.js` | Onboarding flow | `nextStep`, `prevStep`, `updateUI`, `gatherOnboardingInputs`, `saveOnboardingData` |
| `js/charts.js` | Canvas rendering | `renderCharts`, `drawDonutChart`, `drawTrendChart`, `getThemeColors` |
| `js/profile.js` | Profile rendering | `populateProfileData`, `renderGoals`, `resolveGoalDisplay` |

## Strengths

- **Single source of truth:** `constants.js` centralizes all emission factors, benchmarks, validation rules, and default data
- **Pure business logic:** `calculateFootprint()` is a pure function with no DOM access, fully unit-testable
- **Consistent naming:** `populateX` for DOM rendering, `bindX` for event binding, `calcX` for computation, `updateX` for state updates
- **No `var`, no `eval`, no `==`:** ESLint enforces modern patterns
- **Helper extraction:** `createSpan`, `createUnitSpan`, `updateCategoryRow` eliminate duplication
- **Route table pattern:** `app.js` event delegation is data-driven and extensible
- **Error handling:** `safeJSONParse` with corruption recovery, empty catch now logs
- **ESLint + Prettier:** Configured and enforced

## Weaknesses / Remaining Issues

1. **`main.js` is 530 lines** — handles 4 different pages (dashboard, breakdown, actions, check-in). Should be split into page-specific modules.
2. **No JSDoc on public functions** — block comments are used but not standardized JSDoc format.
3. **`setFootprintDisplay` nested inside `switchPeriod`** — small function but could be module-level.
4. **No TypeScript or type checking** — plain JS means no compile-time safety (acceptable for hackathon scope).
5. **Module-level mutable globals** — `appUser`, `savedActions`, `loggedSavings` in `main.js` create hidden coupling.

## Recommended Next Steps

| Priority | Improvement | Effort | Impact |
|----------|------------|--------|--------|
| High | Split `main.js` into `dashboard.js`, `breakdown.js`, `actions.js`, `check-in.js` | Medium | High |
| Medium | Add JSDoc to all public functions | Medium | Medium |
| Low | Extract `setFootprintDisplay` to module level | Low | Low |
| Low | Add TypeScript or JSDoc type annotations | High | Medium |

## Final Assessment

The codebase demonstrates solid engineering practices for a hackathon project. Module boundaries are clear, pure functions are separated from DOM manipulation, naming is consistent, and duplication has been actively reduced. The route table pattern in `app.js` and the data-driven approach in `updateBreakdownValues` show intentional design. The main structural weakness is `main.js` at 530 lines handling 4 pages — splitting this would be the highest-impact remaining improvement. Error handling is appropriate (safeJSONParse with recovery, logged catches), and the ESLint/Prettier setup shows professional tooling awareness.
