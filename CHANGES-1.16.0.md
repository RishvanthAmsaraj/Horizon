# Horizon Tab (store build) 1.16.0 — worldwide weather, readability, UI scale

The Chrome Web Store build (`horizon-tab-store/`) catches up with the full build's major updates. This is the version to submit for the next store update.

## What's new

- **Worldwide weather (Open-Meteo).** Replaces the US-only National Weather Service feed. Search any city in settings (Open-Meteo geocoding), or enter coordinates manually. Units: Auto / °F / °C, auto follows your locale. Condition icons stay stroke-style SVGs.
- **Readability controls.** Contrast (Auto / Boosted / Maximum), a text outline for busy photos, and a backdrop scrim behind the clock and search box. Contrast acts as a floor under the glass slider, resolved in JS.
- **Interface scale, 80–150%.** Root font-size scaling with the layout px values converted to rem.
- **Weather robustness.** One retry on a transient failure before "unavailable" is shown; cache key includes the unit.

## Store compliance unchanged

- Still searches only through the browser's default search engine (Chrome Search API). Drawer tiles remain plain links to site homepages; no query injection, no engine switching.
- No bangs, no filters/refiners, no custom `%s` sources, no AI Signal content scripts. No new permission besides the two weather hosts, declared and documented in `PRIVACY.md`.
- Single purpose intact: a new tab page.

## Verified

- Loaded as a real extension (chrome-extension:// origin): live weather, city search (Tokyo), contrast floor, settings render, no console errors.
- Drawer tiles verified as plain `<a>` homepage links; `chrome.search` present.

## Privacy

`PRIVACY.md` updated: weather now comes from `api.open-meteo.com`; typing a city name sends that text to `geocoding-api.open-meteo.com` only when you press Search. Both hosts are declared in `host_permissions` and used only for those two calls.
