# Horizon Tab

A minimal, beautiful, customizable new tab page. Your horizon, your way.

Horizon replaces Chrome's default new tab with a fast, private dashboard — a clock, weather, and a search bar that fans out into a drawer of engines, AI chats, and store search. Every source is yours to curate.

## Features

- **Unified search drawer** — one box that searches the web, chats an AI, or shops a store. Switch with a click, tab, or arrow key.
  - **8 search engines** — Google, DuckDuckGo, Brave, Bing, Startpage, Kagi, Qwant, SearXNG.
  - **6 AI providers** — Perplexity, ChatGPT, Claude, Grok, Gemini, DeepSeek (with an opt-in prompt bridge for providers that ignore URL prefill).
  - **14 stores** — Amazon, eBay, Walmart, Target, Best Buy, Costco, Home Depot, Lowe's, Etsy, Newegg, B&H, IKEA, Wayfair, AliExpress.
- **Your sources, your way** — hide any built-in source you don't use, and add your own search engine, AI, or store with a `%s` search template. A store you care about missing? Add it in seconds (e.g. Temu: `https://www.temu.com/search_result.html?search_key=%s`).
- **Two-axis filters** — verticals (All / News / Images / Video) × refiners (Reddit, Academic, PDF, Exact, Recent), freely combinable, plus an AI-Free toggle on engines that inject AI answers.
- **Bangs** — start a query with `!yt`, `!a`, `!w`, `!gpt`, `!news` and more to retarget that single search without touching any setting.
- **Themes** — Slate, Ivory, Navy, Modern (auto day/night), and a fully custom color theme.
- **Custom background** — upload any image; auto-contrast dimming and optional blur keep the text legible.
- **Readability controls** — contrast modes (auto / boosted / maximum), a text outline for busy photos, and a backdrop scrim behind the clock and search box, all without changing your theme.
- **Interface scale** — resize the whole UI from 80% to 150% in settings.
- **Firefox ready** — the full build loads in Firefox too (see install notes below); weather, storage, and the prompt bridge work on both engines.
- **Quick links** — your own row of shortcuts, editable inline.
- **Weather** — worldwide forecast from Open-Meteo (no API key), cached so ten tabs cost one request. Search any city in settings, or enter coordinates manually; units follow your locale (°F/°C) or lock to one.
- **AI Signal (beta)** — a fully client-side "smell test" that scores search results for AI-flavored writing. No pages are fetched; nothing leaves your device. Optional page detector + Safe Browsing check (bring your own API key).

## Privacy

Horizon is local-first. There are no accounts, no analytics, and no tracking. Your settings and background sync through Chrome's own `storage.sync`. The only network calls are the ones you trigger (a search) or explicitly opt into (weather, Safe Browsing, the prompt bridge). The AI Signal scorer reads only the title and snippet already on the search page — it never fetches article bodies.

## Install (development)

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Open a new tab.

**Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select `manifest.json` inside this folder.

## Permissions

- `storage` — save your settings and background.
- `scripting` — register the optional page detector and prompt bridge only when you turn them on.
- Optional host permissions (requested at runtime, never granted silently):
  - `<all_urls>` — only if you enable the page detector.
  - Individual AI origins — only if you enable the prompt bridge.
- `safebrowsing.googleapis.com` — only used if you add your own Safe Browsing API key.

## Contributing

Horizon is open source. Bug reports, feature ideas, and pull requests are welcome. The search source tables (`SE`, `AI`, `SHOP`, `BANGS`) are plain objects in `tab.js` — adding a new engine, provider, store, or bang is usually a one-line change.

## License

[MIT](LICENSE)
