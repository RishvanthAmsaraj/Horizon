# Horizon Tab 1.15.1 — weather fix

## Bug

Weather showed "unavailable" in some environments even though the city search worked.

## Cause

The Open-Meteo hosts were not declared in `host_permissions`. Chromium extension pages can reach them via CORS, but Firefox refuses cross-origin requests from extension pages unless the host is declared — so the forecast fetch was blocked outright on Firefox. A transient network failure could also print "unavailable" and stick until the next 30-minute refresh.

## Fix

- Declared `api.open-meteo.com` and `geocoding-api.open-meteo.com` in `host_permissions` (both are documented in `PRIVACY.md`; no other permission changes).
- `fetchWeather()` now retries once after 1.2 s before giving up, so a single dropped request no longer produces a persistent "unavailable".

## Verified

- Loaded as a real extension in headless Chromium (chrome-extension:// origin): weather renders live data, zero console errors.
- Full feature regression (mock harness): search drawer, themes, custom sources, hide/show toggles, contrast/halo/scrim/UI-scale, city search + geocode, °F/°C units, persistence. All pass.
- The same run exercises the `XAPI` (Firefox) code path, since Chromium exposes `browser.*` there.
