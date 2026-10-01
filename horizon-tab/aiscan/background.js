/* ════════════════════════════════════════════════════════════════════
   Horizon AI Signal — Background Service Worker

   Two jobs:

   1. DYNAMIC PAGE-DETECTOR REGISTRATION (new in v2.1)
      The in-page detector used to be a static <all_urls> content
      script — ~65 KB of JS+CSS injected into every page the user
      visited, whether or not they wanted it (and the README promised
      the opposite). It's now registered dynamically, only when BOTH:
        • the user turns on "Page detector" in settings, and
        • the optional <all_urls> host permission is granted.
      Turning the setting off (or revoking the permission) unregisters
      the script. SERP badges are unaffected — they stay as a static
      content script scoped to the three search engines.

   2. SAFE BROWSING RELAY
      Handles cross-origin fetches the content script can't make.

      SECURITY MODEL (v3.1):
        The Google Safe Browsing API requires an API key. In v2.x the
        key was hardcoded in this file, which put it in PUBLIC GIT
        HISTORY. GitHub's secret scanner flagged it; the key had to
        be rotated. The right pattern for a client-side extension is:
          - The user provides their own key via the extension's
            settings page.
          - The key is stored in chrome.storage.sync (per-browser
            sync, never bundled with the extension).
          - It is applied at request time, never committed to source.
        If the user has not provided a key, the Safe Browsing check
        is skipped silently — no network call, no warning spam.
   ════════════════════════════════════════════════════════════════════ */

/* Firefox exposes promise-based `browser.*`; Chrome exposes promise-based
   `chrome.*` (MV3). Firefox's `chrome.*` compatibility layer is
   callback-only, so `await XAPI.storage…` resolved to undefined there
   and every settings read fell through to the localStorage fallback —
   i.e. no sync at all on Firefox. Await through XAPI; keep plain
   `chrome.*` for callback-style calls, which both browsers support. */
const XAPI=(typeof browser!=="undefined"&&browser.runtime)?browser:chrome;

/* ──────────────────────────────────────────────────────────────────
   1. Dynamic page-detector registration
   ────────────────────────────────────────────────────────────────── */
const DETECTOR_SCRIPT_ID = "hz-page-detector";
const SERP_MATCHES = [
  "*://*.google.com/search*",
  "*://*.duckduckgo.com/*",
  "*://search.brave.com/search*",
];

async function detectorRegistered() {
  try {
    const scripts = await XAPI.scripting.getRegisteredContentScripts({ ids: [DETECTOR_SCRIPT_ID] });
    return !!(scripts && scripts.length);
  } catch (e) {
    return false;
  }
}

async function hasAllUrlsPermission() {
  try {
    return await XAPI.permissions.contains({ origins: ["<all_urls>"] });
  } catch (e) {
    return false;
  }
}

/* ── AI prompt bridge (opt-in) ──────────────────────────────────────
   Registered only for the AI origins the user has actually granted,
   and only while the setting is on. Nothing is injected otherwise. */
const BRIDGE_SCRIPT_ID = "hz-ai-bridge";
const BRIDGE_ORIGINS = [
  "https://gemini.google.com/*",
  "https://chat.deepseek.com/*",
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  "https://grok.com/*",
  "https://www.perplexity.ai/*",
];

async function grantedBridgeOrigins() {
  const granted = [];
  for (const o of BRIDGE_ORIGINS) {
    try { if (await XAPI.permissions.contains({ origins: [o] })) granted.push(o); }
    catch (e) { /* skip */ }
  }
  return granted;
}

async function syncBridgeRegistration() {
  if (!chrome.scripting || !chrome.scripting.registerContentScripts) return;

  let enabled = false;
  try {
    const r = await XAPI.storage.sync.get(["hz"]);
    enabled = !!(r && r.hz && r.hz.aiBridge);
  } catch (e) { /* default off */ }

  const origins = enabled ? await grantedBridgeOrigins() : [];
  let existing = [];
  try { existing = await XAPI.scripting.getRegisteredContentScripts({ ids: [BRIDGE_SCRIPT_ID] }); }
  catch (e) { existing = []; }
  const have = existing && existing.length ? existing[0] : null;

  try {
    if (!origins.length) {
      if (have) {
        await XAPI.scripting.unregisterContentScripts({ ids: [BRIDGE_SCRIPT_ID] });
        console.log("[Horizon] AI bridge unregistered");
      }
      return;
    }
    const spec = {
      id: BRIDGE_SCRIPT_ID,
      js: ["aiscan/ai-bridge.js"],
      matches: origins,
      runAt: "document_idle",
      persistAcrossSessions: true,
    };
    // Re-register when the granted origin set changes.
    const same = have && have.matches && have.matches.length === origins.length &&
                 origins.every((o) => have.matches.includes(o));
    if (same) return;
    if (have) await XAPI.scripting.updateContentScripts([spec]);
    else await XAPI.scripting.registerContentScripts([spec]);
    console.log("[Horizon] AI bridge registered for", origins.length, "origin(s)");
  } catch (err) {
    console.error("[Horizon] bridge registration failed:", err);
  }
}

async function syncDetectorRegistration() {
  if (!chrome.scripting || !chrome.scripting.registerContentScripts) return;

  let enabled = false;
  try {
    const r = await XAPI.storage.sync.get(["hz"]);
    enabled = !!(r && r.hz && r.hz.aiPageDetector);
  } catch (e) { /* default off */ }

  const want = enabled && (await hasAllUrlsPermission());
  const have = await detectorRegistered();

  try {
    if (want && !have) {
      await XAPI.scripting.registerContentScripts([{
        id: DETECTOR_SCRIPT_ID,
        js: ["aiscan/score.js", "aiscan/detector.js"],
        css: ["aiscan/badge.css"],
        matches: ["<all_urls>"],
        excludeMatches: SERP_MATCHES,
        runAt: "document_idle",
        persistAcrossSessions: true,
      }]);
      console.log("[Horizon] Page detector registered");
    } else if (!want && have) {
      await XAPI.scripting.unregisterContentScripts({ ids: [DETECTOR_SCRIPT_ID] });
      console.log("[Horizon] Page detector unregistered");
    }
  } catch (err) {
    console.error("[Horizon] detector registration failed:", err);
  }
}

function syncAll() { syncDetectorRegistration(); syncBridgeRegistration(); }

chrome.runtime.onInstalled.addListener(syncAll);
if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(syncAll);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.hz) syncAll();
});
if (chrome.permissions && chrome.permissions.onAdded) chrome.permissions.onAdded.addListener(syncAll);
if (chrome.permissions && chrome.permissions.onRemoved) chrome.permissions.onRemoved.addListener(syncAll);
// Also reconcile whenever the worker wakes up.
syncAll();

/* ──────────────────────────────────────────────────────────────────
   2. Safe Browsing relay
   ────────────────────────────────────────────────────────────────── */

// In-memory cache so we don't hammer the Safe Browsing API for the
// same hostname within an hour.
const safeBrowsingCache = {};
const SAFE_BROWSING_TTL_MS = 60 * 60 * 1000;

/* Read the user's Safe Browsing API key from chrome.storage.sync.
   Returns null if the user has not provided one. */
async function getSafeBrowsingKey() {
  try {
    const r = await XAPI.storage.sync.get(["hz_sb_key"]);
    return typeof r.hz_sb_key === "string" && r.hz_sb_key.length > 10
      ? r.hz_sb_key
      : null;
  } catch {
    return null;
  }
}

/* Check a hostname against Google Safe Browsing. Returns:
     { skipped: true }            — no key configured, no check
     { checked: true, threats: [] } — clean
     { checked: true, threats: [...] } — flagged */
async function checkSafeBrowsing(hostname) {
  const now = Date.now();
  if (safeBrowsingCache[hostname] && (now - safeBrowsingCache[hostname].t) < SAFE_BROWSING_TTL_MS) {
    return safeBrowsingCache[hostname].result;
  }

  const apiKey = await getSafeBrowsingKey();
  if (!apiKey) {
    return { skipped: true, reason: "no api key configured" };
  }

  try {
    const url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`;
    const body = {
      client: { clientId: "horizon-tab", clientVersion: "3.1" },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [
          { url: `https://${hostname}` },
          { url: `http://${hostname}` },
        ],
      },
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const result = { checked: true, threats: data.matches || [] };
    safeBrowsingCache[hostname] = { t: now, result };
    return result;
  } catch (err) {
    console.error("[AI Signal Background] Safe Browsing check failed:", err);
    return { skipped: true, reason: "request failed", error: String(err && err.message || err) };
  }
}

// Message router for content script -> background.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === "checkSafeBrowsing" && request.hostname) {
    checkSafeBrowsing(request.hostname).then(result => {
      sendResponse({ ok: true, result });
    }).catch(err => {
      sendResponse({ ok: false, error: String(err && err.message || err) });
    });
    return true; // keep channel open for async response
  }
  sendResponse({ ok: false, reason: "no handler" });
  return true;
});
