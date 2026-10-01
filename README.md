# Horizon

A minimal, beautiful, customizable new tab page — and a private, on-device AI-content detector. Your horizon, your way.

## Download

**Want the full version? [Download the zip](https://github.com/RishvanthAmsaraj/Horizon/releases/download/v1.15.0/horizon-tab-full-1.15.0.zip).**

Unzip it, open `chrome://extensions` in Chrome, turn on **Developer mode**, click **Load unpacked**, and select the unzipped folder. That's the whole install.

Prefer a one-click install from the store?

- [Horizon Tab](https://chromewebstore.google.com/detail/horizon-tab/gkhmbjhhpbeihhnobhkocagfabojfjoa): the new tab page
- [Horizon AI Signal](https://chromewebstore.google.com/detail/horizon-ai-signal/njolionpcojhnogoinllcmamnjcbkdgg): the detector

All files are also on the [Releases page](https://github.com/RishvanthAmsaraj/Horizon/releases).

Horizon began as one extension that did two things: replace the new tab with a fast, private dashboard (clock, weather, search drawer, quick links), and add **AI Signal**, a heuristic that flags AI-written text on search results.

The Chrome Web Store's single-purpose policy doesn't allow one extension to change both the new tab page *and* the search experience. So Horizon ships in three forms:

| Build | Where | What's inside |
| --- | --- | --- |
| `horizon-tab` | Load unpacked (Chromium / Firefox) | The **full build** — everything, together. |
| `horizon-tab-store` | Chrome Web Store — "Horizon Tab" | New tab page only; search respects your default engine via the Chrome Search API. |
| `horizon-ai-signal` | Chrome Web Store — "Horizon AI Signal" | AI Signal only; scores search results and pages, fully on-device. |

## The full build (load unpacked)

This is the real product — everything the store builds can't ship together:

- **Search drawer** — one box, three tabs: web search (8 engines), AI chat (6 providers), store search (14 retailers). Bangs, filters, refiners, AI-Free mode.
- **AI Signal** — an optional, fully on-device heuristic that flags AI-flavored writing on search results (Google, DuckDuckGo, Brave) and article pages.
- **Dashboard** — clock, greeting, worldwide weather (Open-Meteo, city search), quick links, custom background, five themes, glass intensity, text-color override, readability controls (contrast, text outline, backdrop), and UI scale (80–150%).
- **Prompt bridge** — optional auto-fill for AI chats that ignore prefilled links (Gemini, DeepSeek).

### Install (from the zip)

1. Download the zip and unzip it. The files (including `manifest.json`) land directly in the folder you unzipped to.
2. **Chrome / Edge / Brave:** open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select that folder.
3. **Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select the `manifest.json` inside that folder.

### Install (from source)

If you cloned the repo instead, the builds live in `horizon-tab/`, `horizon-tab-store/`, and `horizon-ai-signal/`. Load unpacked on whichever you want.

## The store builds

Both are one-click installs from the Chrome Web Store:

- **Horizon Tab** (`horizon-tab-store/`) — the dashboard, with search delegated to your default search engine.
- **Horizon AI Signal** (`horizon-ai-signal/`) — the detector, standalone, with its own options page.

## Why the split exists

Google's single-purpose policy (our violation was "Red Argon") requires an extension to do one narrow thing. A new tab page that also rewires search results is two things, so:

1. The new-tab build uses the **Chrome Search API** — it respects your selected search engine instead of overriding it.
2. **AI Signal** ships as its own extension, because scoring search results is a separate purpose from a new tab page.

The full build here keeps both together, which is perfectly fine outside the store.

## Privacy

Local-first. No accounts, no analytics, no tracking. Settings stay in your browser profile; weather comes from `api.open-meteo.com` (worldwide, no API key); AI Signal analyzes text on-device and uploads nothing. See `PRIVACY.md` in each build folder.

## Contributing

This is open source on purpose — please take it and make it better. Fork it, break it, ship your own version. The search tables in `tab.js` are plain objects, so adding an engine or provider is usually a one-line change. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
