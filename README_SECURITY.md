# Security Assessment — Terra Carbon Footprint Platform

## Purpose

This document evaluates the **security posture** of the Terra repository — focusing on input validation, output sanitization, DOM safety, security headers, attack surface reduction, and safe error handling. It covers what controls are present, what risks were found and fixed, and what limitations remain.

## Repository Overview

Terra is a static client-side application with no server, no authentication, and no backend API. All data is stored in localStorage. The security model is therefore focused on client-side protections: CSP headers, input validation, output sanitization, and safe DOM handling.

## Threat Model Summary

| Threat | Mitigation | Status |
|--------|-----------|--------|
| XSS via user input | `escapeHTML()` function, CSP `script-src 'self'` | ✅ Mitigated |
| XSS via localStorage data | `escapeHTML()` on goal text in `profile.js` | ✅ Mitigated |
| Clickjacking | CSP `frame-ancestors 'none'` | ✅ Mitigated |
| MIME sniffing | `X-Content-Type-Options: nosniff` | ✅ Mitigated |
| Referrer leakage | `Referrer-Policy: no-referrer` | ✅ Mitigated |
| Feature abuse | `Permissions-Policy` restricting camera/mic/geolocation/payment | ✅ Mitigated |
| CSP violations | `securitypolicyviolation` event listener for logging | ✅ Mitigated |
| Corrupted localStorage | `safeJSONParse()` with try/catch + auto-reset | ✅ Mitigated |
| Input injection | `validateCity()` with regex + length + character sanitization | ✅ Mitigated |
| Input overflow | `validateRange()` with min/max clamping | ✅ Mitigated |

## Security Controls Present

### Content Security Policy

All 8 HTML pages include a CSP meta tag with the following directives:

```
default-src 'self'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
script-src 'self'
img-src 'self' data:
frame-ancestors 'none'
```

**Note:** `style-src` requires `'unsafe-inline'` due to 75+ CSS custom property overrides via `style="--bar-pct: X"` attributes. This is a known limitation of static HTML — without server-side nonce generation, inline style attributes cannot be eliminated.

### Additional Security Headers

All 8 pages include:
- `<meta name="referrer" content="no-referrer">` — prevents referrer leakage
- `<meta http-equiv="X-Content-Type-Options" content="nosniff">` — prevents MIME sniffing
- `<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()">` — restricts browser features

### CSP Violation Monitoring (`app.js`)

```javascript
document.addEventListener("securitypolicyviolation", (e) => {
  console.warn(`CSP violation: ${e.violatedDirective} blocked ${e.blockedURI}`);
});
```

### Input Validation (`constants.js`)

**`validateCity(city)`:** Regex pattern `^[a-zA-Z\s\-,.'()]{2,50}$` with length limits and character sanitization. Returns `{ valid, value, message }`.

**`validateRange(val, min, max)`:** Integer parsing with min/max clamping. Returns `{ valid, value }`.

### Output Sanitization (`constants.js`)

**`escapeHTML(str)`:** Creates a temporary div, sets `textContent`, returns `innerHTML`. Used in:
- `populateGreeting()` — user name from localStorage
- `renderGoals()` — goal text from localStorage

### Safe JSON Parsing (`constants.js`)

**`safeJSONParse(key, fallback)`:** Try/catch around `JSON.parse()` with automatic `localStorage.removeItem()` on corruption and fallback return.

### No Dangerous Patterns

- Zero `eval()` calls
- Zero `onclick=` or `oninput=` inline handlers in HTML
- Zero `innerHTML` with unescaped user data
- Zero `document.write()`
- Zero external script loads (all `src="js/..."`)

## Security-Sensitive Files

| File | Risks Addressed | Controls Present |
|------|----------------|------------------|
| `constants.js` | Input validation, output encoding, safe parsing | `validateCity`, `validateRange`, `escapeHTML`, `safeJSONParse` |
| `profile.js` | XSS via localStorage goal data | `escapeHTML` on goal text, `DocumentFragment` for batch insertion |
| `main.js` | Silent error swallowing | Empty catch now logs warning |
| `app.js` | CSP violations going unnoticed | `securitypolicyviolation` event listener |
| All HTML pages | Clickjacking, MIME sniffing, referrer leakage, feature abuse | CSP `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |

## What Attackers Could Try

1. **XSS via localStorage contamination:** If another script or browser extension writes malicious data to `terra_user`, the `renderGoals()` function would insert it into the DOM. **Mitigated** by `escapeHTML()` on goal text.

2. **CSP bypass via style injection:** The `unsafe-inline'` in `style-src` means an attacker who can inject a `<style>` tag could modify page appearance. **Limitation** — cannot be fixed without eliminating all inline `style=` attributes.

3. **Clickjacking:** Without `frame-ancestors`, the page could be embedded in an iframe. **Mitigated** by `frame-ancestors 'none'`.

4. **Data exfiltration via referrer:** Without `Referrer-Policy`, navigating to external URLs would leak the page URL. **Mitigated** by `no-referrer`.

5. **Feature abuse:** Without `Permissions-Policy`, scripts could request camera, microphone, or geolocation access. **Mitigated** by explicit denial.

## Security Risks Found and Fixed

| Risk | File | Fix |
|------|------|-----|
| Missing `frame-ancestors` in CSP | All HTML | Added `frame-ancestors 'none'` |
| Missing `Referrer-Policy` | All HTML | Added `<meta name="referrer" content="no-referrer">` |
| Missing `X-Content-Type-Options` | All HTML | Added `nosniff` |
| Missing `Permissions-Policy` | All HTML | Added feature restrictions |
| No CSP violation logging | `app.js` | Added `securitypolicyviolation` listener |
| `innerHTML +=` with user data | `profile.js` | Replaced with `escapeHTML` + DOM creation |
| Empty catch swallows errors | `main.js` | Added `console.warn` |

## Security Risks Still Remaining

| Risk | Reason | Severity |
|------|--------|----------|
| CSP `style-src unsafe-inline'` | 75+ CSS custom property overrides require inline `style=` attributes | Medium — known static site limitation |
| No `Strict-Transport-Security` | Requires HTTP headers, not available in static HTML | Medium — server-side only |
| localStorage stores PII in plaintext | Name, city, habits stored without encryption | Low — client-only app, no server sync |
| No Subresource Integrity | All scripts are local, but SRI would add defense-in-depth | Low — no external scripts |

## Recommended Next Steps

| Priority | Improvement | Feasibility |
|----------|------------|-------------|
| High | Add `Cross-Origin-Opener-Policy: same-origin` meta tag | Easy — 1 line per page |
| High | Add `X-Permitted-Cross-Domain-Policies: none` meta tag | Easy — 1 line per page |
| Medium | Eliminate `unsafe-inline` from CSP | Hard — requires eliminating all inline `style=` attributes |
| Medium | Add HSTS header | Impossible — requires server-side control |

## Final Assessment

The security posture is strong for a static client-side application. CSP is properly configured with `script-src 'self'` (no unsafe-inline), `frame-ancestors` prevents clickjacking, and all standard security meta tags are present. Input validation uses regex + length limits + sanitization. Output encoding via `escapeHTML` is applied to all user-controlled text before DOM insertion. The main limitation is CSP `style-src unsafe-inline'` which is a known constraint of static HTML with CSS custom properties. No server-side controls (HSTS, secure cookies) are possible in this architecture, which is an honest limitation, not an oversight.
