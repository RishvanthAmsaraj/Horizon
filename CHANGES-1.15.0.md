# Horizon Tab 1.15.0 — Firefox, worldwide weather, readability, UI scale

Built on the 1.14.0 full build (all customization features kept: custom search sources, hide/show toggles, text color override, animated backgrounds, five themes). All JS passes `node --check`, manifest validates, and the merged build is verified headlessly in a real browser against the shipped source.

---

## 1. Firefox compatibility

Three real blockers, one non-issue:

- **The background worker never loaded on Firefox.** The manifest declared only `background.service_worker`, which Firefox doesn't implement — it reads `background.scripts`. Everything the worker owns (dynamic page-detector registration, the AI prompt bridge, the Safe Browsing relay) was silently dead on Firefox. Both keys are now declared; each browser reads its own and ignores the other.
- **Settings never synced on Firefox.** The code used `await chrome.storage…` throughout. Firefox's `chrome.*` compatibility layer is **callback-only**, so those awaits resolved to `undefined`, the destructure threw, and the `try/catch` quietly fell through to the `localStorage` fallback — meaning no cross-device sync and a silent downgrade nobody would notice. Added an `XAPI` shim that prefers Firefox's promise-based `browser.*` and falls back to `chrome.*`; callback-style calls are untouched since both browsers support those.
- **The hero spacing fix was Chromium-only.** The equidistant greeting/clock/date rhythm relies on `text-box: trim-both cap alphabetic` to strip the 5rem clock's font leading. Firefox ignores it, so the gaps would have gone uneven again. Added an `@supports not (…)` fallback that approximates the trim with negative margins for the system sans stack. Chromium is untouched.
- **Non-issue, verified rather than assumed:** `chrome_url_overrides.newtab` *is* supported by Firefox (MDN confirms, manifest v2+).

## 2. International weather

**api.weather.gov is United States only** — every user outside the US got a permanent "unavailable". Replaced with **Open-Meteo**: free, keyless, CORS-enabled, worldwide, and no new permissions.

- **City search.** Settings now has a search box backed by Open-Meteo's geocoding endpoint — type "Lisbon", pick from the matches. Manual latitude/longitude moved into a collapsed disclosure for anyone who wants it.
- **Units.** Auto / °F / °C. Auto follows the browser locale and correctly limits °F to the three countries that use it (US, Liberia, Myanmar).
- **Conditions** now come from WMO weather codes rather than parsing English forecast text; all 28 codes mapped, and an unknown code degrades to a neutral label instead of blank. Icons stay the extension's stroke-style SVGs.
- Caching, the 8-second abort and render-stale-then-refresh behavior are unchanged; the cache key now includes the unit (and was bumped for the new data shape) so toggling °C/°F refreshes immediately.

## 3. Readability controls

The light-background problem had a concrete cause: the light themes set `--surface-opacity: 0.02` and borders to 5% black, so over a bright photo the buttons, chips and drawer were **effectively invisible**, and muted text sat at `#909090` on near-white. New **Readability** group in settings:

- **Contrast: Auto / Boosted / Maximum.** Raises surface opacity, border strength and text tone, with separate values for light-ink and dark-ink theme families. Maximum also thickens control borders from 1px to 2px, which is where faint hairlines hurt most.
- **Text outline.** A halo behind the clock, date, weather, links and search text, coloured to *contrast* with the text — white halo under dark text, black under light. This is the single most effective fix for text over a busy photo.
- **Backdrop (0–100%).** Fades a soft radial panel behind the clock and search box. Soft-edged rather than a hard card, so it doesn't fight the wallpaper.

One subtlety worth knowing: the glass slider writes `--surface-opacity` as an **inline** style on `<html>`, and inline styles beat stylesheet rules — so a contrast mode setting the same variable in CSS would have been silently ignored. Surface opacity is now resolved in JS, with the contrast level acting as a **floor the slider can exceed but not sink below** (glass 0.04 → 0.24 at Maximum; glass 0.40 stays 0.40 at every level).

## 4. UI scale

**Interface size, 80–150%**, in the same Readability group. Implemented by scaling the root font size, which works because the layout is rem-based. Converted 14 layout-critical `px` values (container and links widths, drawer tile sizing, panel width, label clamps) to `rem` so they scale too — while deliberately leaving borders, shadows and small radii in `px`, since a 1px hairline should stay a hairline at any zoom.

Slider repaints are rAF-coalesced, like the existing glass and background sliders.

## Privacy note

The weather provider changed. `PRIVACY.md` now says coordinates go to **Open-Meteo** (`api.open-meteo.com`), and that typing a city name sends that text to Open-Meteo's geocoding endpoint (`geocoding-api.open-meteo.com`) — only when you press Search. The NWS reference is removed. No permissions changed.
