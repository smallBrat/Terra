/**
 * TERRA — SMOKE TEST SUITE
 * Validates critical data flows and DOM integrity without a browser.
 * Run: node tests/smoke-test.js
 */

const fs = require("fs");
const path = require("path");

const BASE = path.resolve(__dirname, "..");
const PAGES = [
  "index.html", "onboarding.html", "dashboard.html",
  "breakdown.html", "actions.html", "checkin.html",
  "insights.html", "profile.html"
];
const CSS_FILES = [
  "css/design-system.css", "css/dashboard.css", "css/screens.css",
  "css/landing.css", "css/onboarding.css"
];
const JS_FILES = [
  "js/constants.js", "js/app.js", "js/main.js", "js/charts.js", "js/onboarding.js"
];

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    errors.push(message);
    console.log(`  ✗ ${message}`);
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.join(BASE, relPath), "utf-8");
}

// ─── TEST: All pages exist ───
console.log("\n[1/8] Page existence");
PAGES.forEach(p => {
  assert(fs.existsSync(path.join(BASE, p)), `${p} exists`);
});

// ─── TEST: All CSS files exist ───
console.log("\n[2/8] CSS file existence");
CSS_FILES.forEach(f => {
  assert(fs.existsSync(path.join(BASE, f)), `${f} exists`);
});

// ─── TEST: All JS files exist ───
console.log("\n[3/8] JS file existence");
JS_FILES.forEach(f => {
  assert(fs.existsSync(path.join(BASE, f)), `${f} exists`);
});

// ─── TEST: HTML structure ───
console.log("\n[4/8] HTML structure validation");
PAGES.forEach(p => {
  const html = readFile(p);
  assert(html.includes("<!DOCTYPE html>"), `${p}: has DOCTYPE`);
  assert(html.includes('<html lang="en">'), `${p}: has lang attribute`);
  assert(html.includes('name="viewport"'), `${p}: has viewport meta`);
  assert(html.includes("</head>"), `${p}: has closing head`);
  assert(html.includes("</body>"), `${p}: has closing body`);
});

// ─── TEST: Security — no inline event handlers with user data ───
console.log("\n[5/8] Security checks");
JS_FILES.forEach(f => {
  const js = readFile(f);
  // Check for innerHTML with template literals containing variables
  const riskyPatterns = [
    /innerHTML\s*=\s*`[^`]*\$\{[^}]*\}/g,
    /\.innerHTML\s*=.*\+/
  ];
  riskyPatterns.forEach((pattern, idx) => {
    const matches = js.match(pattern);
    assert(
      !matches || matches.length === 0,
      `${f}: no risky innerHTML template literals (pattern ${idx + 1})`
    );
  });
});

// ─── TEST: Constants file exports ───
console.log("\n[6/8] Constants module");
const constants = readFile("js/constants.js");
assert(constants.includes("EMISSION_FACTORS"), "constants.js: has EMISSION_FACTORS");
assert(constants.includes("BENCHMARKS"), "constants.js: has BENCHMARKS");
assert(constants.includes("DEFAULT_PROFILE"), "constants.js: has DEFAULT_PROFILE");
assert(constants.includes("STORAGE_KEYS"), "constants.js: has STORAGE_KEYS");
assert(constants.includes("safeJSONParse"), "constants.js: has safeJSONParse");
assert(constants.includes("escapeHTML"), "constants.js: has escapeHTML");

// ─── TEST: CSS custom properties ───
console.log("\n[7/8] CSS design tokens");
const ds = readFile("css/design-system.css");
assert(ds.includes(":root"), "design-system.css: has :root");
assert(ds.includes("--sage-"), "design-system.css: has sage color tokens");
assert(ds.includes("--mineral-"), "design-system.css: has mineral color tokens");
assert(ds.includes("--space-"), "design-system.css: has spacing tokens");
assert(ds.includes("--radius-"), "design-system.css: has radius tokens");
assert(ds.includes("prefers-reduced-motion"), "design-system.css: has reduced-motion support");

// ─── TEST: Inline style audit ───
console.log("\n[8/8] Inline style audit");
const INLINE_STYLE_THRESHOLD = 80; // CSS custom property overrides are acceptable
let totalInlineStyles = 0;
const stylePattern = /style="[^"]*"/g;
PAGES.forEach(p => {
  const html = readFile(p);
  const matches = html.match(stylePattern);
  const count = matches ? matches.length : 0;
  totalInlineStyles += count;
  // Count only non-CSS-variable inline styles (real inline styles that set visual properties)
  // CSS custom property overrides like style="--bar-pct: 52" are acceptable
  const nonVarStyles = matches ? matches.filter(m => {
    const content = m.replace(/^style="(.+)"$/, '$1');
    return !/^--[\w-:.\s]+$/.test(content.trim());
  }) : [];
  // Allow 1 dynamic JS template literal (--bar-pct: ${pct}) in profile.html
  assert(
    nonVarStyles.length <= (p === 'profile.html' ? 1 : 0),
    `${p}: no visual inline styles (found ${nonVarStyles.length} non-CSS-var styles)`
  );
});
assert(
  totalInlineStyles <= INLINE_STYLE_THRESHOLD,
  `total inline style attributes ≤ ${INLINE_STYLE_THRESHOLD} (found ${totalInlineStyles})`
);
console.log(`  ℹ ${totalInlineStyles} CSS custom property overrides across all pages (threshold: ${INLINE_STYLE_THRESHOLD})`);

// ─── TEST: Accessibility ───
console.log("\n[9/9] Accessibility checks");
PAGES.forEach(p => {
  const html = readFile(p);
  if (p !== "index.html" && p !== "onboarding.html") {
    assert(html.includes('role="complementary"'), `${p}: sidebar has complementary role`);
    assert(html.includes('aria-label="Main navigation"'), `${p}: nav has aria-label`);
    assert(html.includes('class="skip-link"'), `${p}: has skip link`);
    assert(html.includes('id="main-content"'), `${p}: has main-content anchor`);
  }
});

// ─── SUMMARY ───
console.log("\n" + "=".repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
  console.log("\nFailed checks:");
  errors.forEach(e => console.log(`  - ${e}`));
}
console.log("=".repeat(50));

process.exit(failed > 0 ? 1 : 0);
