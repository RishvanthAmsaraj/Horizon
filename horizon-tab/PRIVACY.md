# Privacy Policy — Horizon Tab

**Last updated:** September 2026

Horizon Tab is a local-first browser extension. It does **not** collect, store, or transmit any personal data to the developer, and it has no accounts, no analytics, and no advertising or tracking SDKs.

## What the extension stores

All of your settings — theme, quick links, custom search sources, background image, dismissed AI-Signal domains — are stored **locally in your browser** via Chrome's `chrome.storage` API (and sync between your own devices through Chrome Sync, if you have it enabled). None of it is sent to any Horizon server, because there is no Horizon server.

## Network requests the extension makes

Horizon makes a small number of network requests only to power specific features. None of them are sent to the developer.

| Feature | Destination | What is sent |
|---|---|---|
| Weather | `api.open-meteo.com` (forecast) and `geocoding-api.open-meteo.com` (city search) | Your configured coordinates or a city name you type into settings, to fetch the local forecast. Worldwide coverage; no API key. |
| Quick-link favicons | `google.com/s2/favicons` | The domain of a quick link, to fetch its icon. |
| Safe Browsing (optional) | `safebrowsing.googleapis.com` | The hostname of a page you visit — **only** if you have explicitly added your own Google Safe Browsing API key in settings. |
| Searches, AI chats, store search | the service you pick (Google, Amazon, etc.) | Whatever you type into the search box. These are normal navigations you initiate, identical to typing the query on the site directly. |

## Data that never leaves your device

- **AI Signal** reads only the title and snippet already shown on a search results page (or the article text, if you opt into the Page Detector). The analysis runs entirely on-device; no page content is uploaded anywhere.
- The **Prompt Bridge** reads only the query you just typed, to paste it into the chat box on the AI site you navigated to — it never reads your conversation or anything else.

## AI Signal is a heuristic, not a verdict

AI Signal is a statistical "smell test." It can and will produce false positives (formal human writing flagged as AI) and false negatives (lightly-edited AI text that passes). Treat it as a first-pass hint, never as proof.

## Contact

For privacy questions, open an issue on the project's repository or contact the developer.
