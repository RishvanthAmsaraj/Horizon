/* ════════════════════════════════════════════════
   Horizon Tab v3.0 — Premium drawer + SVG logos
   ════════════════════════════════════════════════ */

/* Firefox exposes promise-based `browser.*`; Chrome exposes promise-based
   `chrome.*` (MV3). Firefox's `chrome.*` compatibility layer is
   callback-only, so `await XAPI.storage…` resolved to undefined there
   and every settings read fell through to the localStorage fallback —
   i.e. no sync at all on Firefox. Await through XAPI; keep plain
   `chrome.*` for callback-style calls, which both browsers support. */
const XAPI=(typeof browser!=="undefined"&&browser.runtime)?browser:chrome;

const LAT=40.7982,LON=-77.8599;

const SE={
  google:"https://www.google.com/search?q=",
  duckduckgo:"https://duckduckgo.com/?q=",
  brave:"https://search.brave.com/search?q=",
  bing:"https://www.bing.com/search?q=",
  startpage:"https://www.startpage.com/do/dsearch?query=",
  kagi:"https://kagi.com/search?q=",
  qwant:"https://www.qwant.com/?q=",
  searxng:"https://searx.be/search?q="
};
const WEB_L={google:"Google",duckduckgo:"DuckDuckGo",brave:"Brave",bing:"Bing",startpage:"Startpage",kagi:"Kagi",qwant:"Qwant",searxng:"SearXNG"};

/* AI chat providers.
   `url`    — base URL, query appended URL-encoded
   `origin` — for the optional prompt bridge's host permission
   `mode`   — what actually happens when you land there:
     "search"  the provider runs the query itself (true auto-search)
     "prefill" the text lands in the composer; you press Enter
     "bridge"  the provider ignores URL params entirely — only the
               opt-in prompt bridge can fill it (else you retype)
   Verified July 2026. Gemini has never supported URL prefill: the old
   entry here pointed at aistudio.google.com (Google's DEVELOPER
   console) purely because prefill works there — wrong destination for
   anyone wanting the normal Gemini chat. */
const AI={
  perplexity:{url:"https://www.perplexity.ai/search?q=",origin:"https://www.perplexity.ai/*",mode:"search"},
  chatgpt:{url:"https://chatgpt.com/?q=",origin:"https://chatgpt.com/*",mode:"prefill"},
  claude:{url:"https://claude.ai/new?q=",origin:"https://claude.ai/*",mode:"prefill"},
  grok:{url:"https://grok.com/?q=",origin:"https://grok.com/*",mode:"prefill"},
  gemini:{url:"https://gemini.google.com/app?q=",origin:"https://gemini.google.com/*",mode:"bridge"},
  deepseek:{url:"https://chat.deepseek.com/?q=",origin:"https://chat.deepseek.com/*",mode:"bridge"}
};
const AI_MODE_NOTE={search:"runs your query automatically",prefill:"fills the box — press Enter to send",bridge:"ignores prefilled links; enable Prompt bridge below to auto-fill"};
const AI_L={perplexity:"Perplexity",grok:"Grok",gemini:"Gemini",chatgpt:"ChatGPT",claude:"Claude",deepseek:"DeepSeek"};
/* Drawer badge per provider, derived from real capability.
   The old AI_AUTO set listed gemini as "auto" — the one provider that
   can't even accept a prefilled prompt. */
function aiBadge(k){
  const c=customAIById(k),m=c?c.mode:(AI[k]||{}).mode;
  if(m==="search")return "→ auto";
  if(m==="prefill")return "✎ prefill";
  return state.aiBridge?"⇥ bridge":"↗ opens chat";
}
const AI_ORDER=["perplexity","grok","gemini","chatgpt","claude","deepseek"];

/* ── SVG Logo Icons ──
   Brand-accurate single-color (or minimal-multi-color) glyphs sized
   to a 24×24 grid. Each is one path or a small set of primitive
   shapes — no large duplicated geometry, no clipping hacks. */
const LOGOS={
  // ── Web search engines ──────────────────────────────────────────
  // Google "G" — the four-color ring + bar from the current brand mark.
  google:`<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1.1 2.5-2.3 3.3v2.7h3.7c2.2-2 3.4-5 3.4-8z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.7-2.7c-1 .7-2.3 1.1-3.5 1.1-2.7 0-5-1.8-5.9-4.3H2.3v2.7C4.1 20.5 7.8 23 12 23z"/><path fill="#FBBC05" d="M6.1 14.5c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V7.7H2.3C1.5 9.1 1 10.5 1 12s.5 2.9 1.3 4.3l3.8-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.5 2.3 7.7l3.8 2.8c.9-2.5 3.2-4.3 5.9-4.3z"/></svg>`,

  // DuckDuckGo — orange disc with the white "duck head" silhouette.
  duckduckgo:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#DE5833"/><path fill="#FFF" d="M7 10.5c0-.7.6-1.3 1.3-1.3s1.3.6 1.3 1.3v.6c.4-.3.9-.5 1.4-.5h.5c.3 0 .5.2.5.5s-.2.5-.5.5h-.5c-.8 0-1.4.6-1.4 1.4v1.3c0 .9-.5 1.7-1.3 2-.3.1-.6.2-.9.2-.8 0-1.5-.4-1.9-1-.4-.6-.5-1.4-.3-2.1.2-.7.7-1.2 1.4-1.5.1 0 .2-.1.3-.1v-1.3zm9 0c0-.7.6-1.3 1.3-1.3s1.3.6 1.3 1.3v1.3c.1 0 .2.1.3.1.7.3 1.2.8 1.4 1.5.2.7.1 1.5-.3 2.1-.4.6-1.1 1-1.9 1-.3 0-.6-.1-.9-.2-.8-.3-1.3-1.1-1.3-2v-1.3c0-.8-.6-1.4-1.4-1.4h-.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h.5c.5 0 1 .2 1.4.5v-.6z"/><path fill="#FFF" d="M9.5 14.5c-.3.3-.6.5-1 .6-.4.1-.8 0-1.1-.3-.3-.3-.4-.7-.3-1.1.1-.4.4-.7.8-.8.4-.1.9 0 1.2.3.3.3.5.7.4 1.3z"/></svg>`,

  // Brave — lion-head shield in orange.
  brave:`<svg viewBox="0 0 24 24"><path fill="#FB542B" d="M12 1.5L3 5.4v6.5c0 5.6 4 9.7 9 10.6 5-.9 9-5 9-10.6V5.4L12 1.5z"/><path fill="#FFF" d="M12 4.5L6.7 7.1l.9 4.4L12 14l4.4-2.5.9-4.4L12 4.5z"/><path fill="#FB542B" d="M9.2 13l2.8 1.6 2.8-1.6L12 16.2 9.2 13z"/></svg>`,

  // Bing — teal "b" letterform.
  bing:`<svg viewBox="0 0 24 24"><path fill="#008373" d="M3 3l9 2.2v15.6L3 18.5V3z"/><path fill="#0066CC" d="M12 5.2l9-2.2v15.6l-9 2.4V5.2z"/><path fill="#FFF" d="M14.5 9.8c1.6-.5 3.2.3 3.6 1.8.4 1.5-.5 3-2.1 3.5l-2.4.7-1.5-1.4 2.4-.6zm-3 4.7l1.5 1.4-1.2.4-1.8-.4 1.5-1.4z" opacity=".95"/></svg>`,

  // Startpage — three concentric rings (target).
  startpage:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#7B68EE"/><circle cx="12" cy="12" r="7" fill="none" stroke="#FFF" stroke-width="1.5"/><circle cx="12" cy="12" r="4.2" fill="#FFF"/><circle cx="12" cy="12" r="2" fill="#7B68EE"/></svg>`,

  // Kagi — yellow shield with stylized "K" centered.
  kagi:`<svg viewBox="0 0 24 24"><path fill="#FFB300" d="M12 1.5L3 5.4v6.4c0 5.4 4.1 9.4 9 10.2 4.9-.8 9-4.8 9-10.2V5.4L12 1.5z"/><path fill="#FFF" d="M8.5 7h2v4.2L14.5 7h2.5l-4.5 5 4.8 5h-2.6L10.5 12.4V17h-2V7z"/></svg>`,

  // Qwant — cyan ring + magenta heart.
  qwant:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4CC2FF"/><path fill="#FF596A" d="M12 16.5s-4.5-2.7-4.5-6.2c0-1.8 1.4-3.3 3.2-3.3 1 0 1.9.5 2.3 1.3.4-.8 1.3-1.3 2.3-1.3 1.8 0 3.2 1.5 3.2 3.3 0 3.5-4.5 6.2-4.5 6.2z"/></svg>`,

  // SearXNG — blue card with magnifying glass + "S".
  searxng:`<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5" fill="#3056D3"/><path fill="#FFF" d="M7 8.5h7v1.6H7zm0 3h7v1.6H7zm0 3h4.5v1.6H7z"/><circle cx="17" cy="15" r="2.6" fill="none" stroke="#F3C623" stroke-width="1.6"/><path stroke="#F3C623" stroke-width="1.6" stroke-linecap="round" d="M19 17l2 2"/></svg>`,

  // ── AI providers ────────────────────────────────────────────────
  // Perplexity — dark card with the brand teal "perplexity" mark.
  perplexity:`<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="3.5" fill="#1F1F1F"/><path fill="none" stroke="#20808D" stroke-width="2" stroke-linecap="round" d="M5 8l3.5 4-3.5 4M19 8l-3.5 4 3.5 4M9.5 17l5-10"/></svg>`,

  // Grok — black circle, the xAI forward-slash mark (the recognizable
  // 2023–2025 "slash in a square" glyph, not the letter-G approximation
  // that read as an "N" at small sizes).
  grok:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000"/><path stroke="#FFF" stroke-width="3.2" stroke-linecap="round" d="M16 7.5L8 16.5"/></svg>`,

  // Gemini — the four-point star, two-color gradient.
  gemini:`<svg viewBox="0 0 24 24"><defs><linearGradient id="gG" x1="0" x2="1"><stop offset="0" stop-color="#4796E3"/><stop offset="1" stop-color="#9177C7"/></linearGradient></defs><path fill="url(#gG)" d="M12 2l1.8 8.2L22 12l-8.2 1.8L12 22l-1.8-8.2L2 12l8.2-1.8L12 2z"/></svg>`,

  // ChatGPT — green circle, the spiral "flower" shape.
  chatgpt:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#10A37F"/><path fill="#FFF" d="M15.4 8.6c.5-1.3.1-2.7-1-3.4-1.1-.8-2.6-.7-3.6.2-1-.9-2.5-1-3.6-.2-1.1.7-1.5 2.1-1 3.4-1.3.5-2 1.7-1.8 3 .2 1.3 1.2 2.3 2.5 2.5.2 1.3 1.2 2.3 2.5 2.5.5 0 1-.1 1.5-.3.5.2 1 .3 1.5.3 1.3-.2 2.3-1.2 2.5-2.5 1.3-.2 2.3-1.2 2.5-2.5.2-1.3-.5-2.5-1.8-3zm-3.4 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`,

  // Claude — orange circle, the Claude "C" mark (asterisk-style).
  claude:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#D97757"/><path fill="#FFF" d="M16.4 8.5c-.6-.9-1.6-1.5-2.7-1.5H11c-.4 0-.8.1-1.1.3-.3-.5-.9-.8-1.5-.8-1 0-1.8.8-1.8 1.8 0 .4.1.7.3 1-.6.6-1 1.5-1 2.4 0 1.9 1.5 3.4 3.4 3.4.6 0 1.2-.2 1.7-.5.5.3 1.1.5 1.7.5 1.9 0 3.4-1.5 3.4-3.4 0-1.4-.8-2.5-2-3 .4-.1.6-.4.6-.7 0-.3-.1-.5-.3-.5zm-5.9 5.5c-.7 0-1.3-.6-1.3-1.3 0-.4.2-.7.4-.9.2.1.5.2.8.2.1.3.2.5.4.7-.1.7-.3 1.3-.3 1.3zm3.2-2c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z"/></svg>`,

  // DeepSeek — blue circle, the "whale" simplified to a stylized D.
  deepseek:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#4D6BFE"/><path fill="#FFF" d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-1 4h2v6h-2V8zm0 7h2v2h-2v-2z"/></svg>`
};

const AI_FREE_PARAMS={
  google:"&udm=14",duckduckgo:"&ia=web",brave:"&source=web",
  bing:"&adlt=strict&qft=interval%3d%22%22",kagi:"&ai_mode=off",
};


/* ══════════════════════════════════════════════════
   FILTERS — two orthogonal axes, freely combinable
   ══════════════════════════════════════════════════
   Until v1.12 a single `searchType` value held the mode AND the filter,
   so you could pick exactly ONE of {Reddit, News, PDF, Video, Images}
   and nothing could combine. "Images from Reddit" or "news PDFs" were
   simply unexpressible.

   Now:
     VERTICAL  — which result surface (All / News / Images / Video).
                 Mutually exclusive by nature; every engine has all four
                 (see MEDIA_URL — all 8 engines, no gaps).
     REFINERS  — multi-select narrowings that ride ON TOP of any
                 vertical. Text refiners are search operators appended
                 to the query, so they work on every engine; the Recent
                 refiner is a per-engine URL parameter.

   Any vertical × any refiner set × any engine is a valid combination. */

const VERTICAL_L={all:"All",article:"News",images:"Images",video:"Video"};

/* Text refiners — standard operators, honored by every engine here. */
const REFINERS={
  reddit:{label:"Reddit",op:" site:reddit.com"},
  academic:{label:"Academic",op:" (site:.edu OR site:arxiv.org OR site:jstor.org)"},
  pdf:{label:"PDF",op:" filetype:pdf"},
  exact:{label:"Exact",op:null},   // wraps the query in quotes instead
  recent:{label:"Recent",op:null}  // per-engine URL param, see TIME_PARAM
};
const REFINER_ORDER=["reddit","academic","pdf","exact","recent"];

/* Recent = past month, per engine. Kagi exposes no documented URL
   parameter for time range, so the chip reports itself unavailable
   there rather than silently doing nothing. */
const TIME_PARAM={
  google:"&tbs=qdr:m",
  duckduckgo:"&df=m",
  brave:"&tf=pm",
  bing:"&filters=ex1%3A%22ez3%22",
  startpage:"&with_date=m",
  qwant:"&freshness=month",
  searxng:"&time_range=month",
  kagi:null
};
const MEDIA_URL={
  google:{article:"https://www.google.com/search?q=%s&tbm=nws",video:"https://www.google.com/search?q=%s&tbm=vid",images:"https://www.google.com/search?q=%s&tbm=isch"},
  duckduckgo:{article:"https://duckduckgo.com/?q=%s&iar=news&ia=news",video:"https://duckduckgo.com/?q=%s&iax=videos&ia=videos",images:"https://duckduckgo.com/?q=%s&iax=images&ia=images"},
  brave:{article:"https://search.brave.com/news?q=%s",video:"https://search.brave.com/videos?q=%s",images:"https://search.brave.com/images?q=%s"},
  bing:{article:"https://www.bing.com/news/search?q=%s",video:"https://www.bing.com/videos/search?q=%s",images:"https://www.bing.com/images/search?q=%s"},
  startpage:{article:"https://www.startpage.com/sp/search?query=%s&cat=news",video:"https://www.startpage.com/sp/search?query=%s&cat=video",images:"https://www.startpage.com/sp/search?query=%s&cat=images"},
  kagi:{article:"https://kagi.com/news?q=%s",video:"https://kagi.com/videos?q=%s",images:"https://kagi.com/images?q=%s"},
  qwant:{article:"https://www.qwant.com/?q=%s&t=news",video:"https://www.qwant.com/?q=%s&t=videos",images:"https://www.qwant.com/?q=%s&t=images"},
  searxng:{article:"https://searx.be/search?q=%s&categories=news",video:"https://searx.be/search?q=%s&categories=videos",images:"https://searx.be/search?q=%s&categories=images"}
};

/* ══════════════════════════════════════════════════
   SHOP — direct product search at major retailers
   ══════════════════════════════════════════════════
   %s = URL-encoded query. Patterns verified July 2026; Target's
   ?searchTerm= and Home Depot's path-based /s/<query> were both
   confirmed against live URL samples rather than assumed.
   `mark` + `color` drive a generated lettermark tile — deliberately
   NOT imitation brand logos, which would be both inaccurate and a
   trademark problem for a published extension. */
const SHOP={
  amazon:{label:"Amazon",url:"https://www.amazon.com/s?k=%s",mark:"a",color:"#FF9900"},
  ebay:{label:"eBay",url:"https://www.ebay.com/sch/i.html?_nkw=%s",mark:"e",color:"#E53238"},
  walmart:{label:"Walmart",url:"https://www.walmart.com/search?q=%s",mark:"W",color:"#0071DC"},
  target:{label:"Target",url:"https://www.target.com/s?searchTerm=%s",mark:"T",color:"#CC0000"},
  bestbuy:{label:"Best Buy",url:"https://www.bestbuy.com/site/searchpage.jsp?st=%s",mark:"B",color:"#0046BE"},
  costco:{label:"Costco",url:"https://www.costco.com/CatalogSearch?keyword=%s",mark:"C",color:"#E32224"},
  homedepot:{label:"Home Depot",url:"https://www.homedepot.com/s/%s",mark:"H",color:"#F96302"},
  lowes:{label:"Lowe's",url:"https://www.lowes.com/search?searchTerm=%s",mark:"L",color:"#004990"},
  etsy:{label:"Etsy",url:"https://www.etsy.com/search?q=%s",mark:"E",color:"#F1641E"},
  newegg:{label:"Newegg",url:"https://www.newegg.com/p/pl?d=%s",mark:"N",color:"#0070CD"},
  bhphoto:{label:"B&H",url:"https://www.bhphotovideo.com/c/search?q=%s",mark:"B",color:"#0A2240"},
  ikea:{label:"IKEA",url:"https://www.ikea.com/us/en/search/?q=%s",mark:"I",color:"#0058A3"},
  wayfair:{label:"Wayfair",url:"https://www.wayfair.com/keyword.php?keyword=%s",mark:"W",color:"#7F187F"},
  aliexpress:{label:"AliExpress",url:"https://www.aliexpress.com/wholesale?SearchText=%s",mark:"A",color:"#E62E04"}
};
const SHOP_ORDER=["amazon","ebay","walmart","target","bestbuy","costco","homedepot","lowes","etsy","newegg","bhphoto","ikea","wayfair","aliexpress"];

/* Generated lettermark tile — consistent, honest, and zero bytes of
   traced brand geometry. */
function markLogo(mark,color){
  return `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5.5" fill="${color}"/><text x="12" y="16.6" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${esc(mark)}</text></svg>`;
}
function shopLogo(key){
  const s=SHOP[key];if(!s)return LOGOS.google;
  return markLogo(s.mark,s.color);
}

/* ══════════════════════════════════════════════════
   BANGS — "!yt kittens" jumps straight to YouTube
   ══════════════════════════════════════════════════
   A leading !token retargets a single search without changing any of
   your saved settings. Engine/AI/shop bangs reuse the tables above;
   site bangs carry their own %s template. */
const BANGS={
  g:"engine:google",ddg:"engine:duckduckgo",br:"engine:brave",bing:"engine:bing",
  kagi:"engine:kagi",sp:"engine:startpage",qw:"engine:qwant",sx:"engine:searxng",
  p:"ai:perplexity",gpt:"ai:chatgpt",claude:"ai:claude",grok:"ai:grok",
  gem:"ai:gemini",ds:"ai:deepseek",
  a:"shop:amazon",amazon:"shop:amazon",ebay:"shop:ebay",wm:"shop:walmart",
  tgt:"shop:target",bb:"shop:bestbuy",costco:"shop:costco",hd:"shop:homedepot",
  lowes:"shop:lowes",etsy:"shop:etsy",newegg:"shop:newegg",ikea:"shop:ikea",
  ali:"shop:aliexpress",wf:"shop:wayfair",bh:"shop:bhphoto",
  img:"vertical:images",news:"vertical:article",vid:"vertical:video",
  yt:"url:https://www.youtube.com/results?search_query=%s",
  w:"url:https://en.wikipedia.org/w/index.php?search=%s",
  gh:"url:https://github.com/search?q=%s",
  so:"url:https://stackoverflow.com/search?q=%s",
  mdn:"url:https://developer.mozilla.org/en-US/search?q=%s",
  npm:"url:https://www.npmjs.com/search?q=%s",
  r:"url:https://www.reddit.com/search/?q=%s",
  maps:"url:https://www.google.com/maps/search/%s",
  imdb:"url:https://www.imdb.com/find/?q=%s",
  x:"url:https://x.com/search?q=%s"
};

const DL=[
  {id:"l1",label:"ChatGPT",url:"https://chatgpt.com",emoji:"",image:"https://www.google.com/s2/favicons?domain=chatgpt.com&sz=64"},
  {id:"l2",label:"GitHub",url:"https://github.com",emoji:"",image:"https://www.google.com/s2/favicons?domain=github.com&sz=64"},
  {id:"l3",label:"Calendar",url:"https://calendar.google.com",emoji:"",image:"https://www.google.com/s2/favicons?domain=google.com&sz=64"},
  {id:"l4",label:"Mail",url:"https://mail.google.com",emoji:"",image:"https://www.google.com/s2/favicons?domain=google.com&sz=64"},
  {id:"l5",label:"Canvas",url:"https://canvas.psu.edu",emoji:"",image:"https://www.google.com/s2/favicons?domain=psu.edu&sz=64"},
  {id:"l6",label:"OpenClaw",url:"https://openclaw.ai",emoji:"",image:"https://www.google.com/s2/favicons?domain=openclaw.ai&sz=64"}
];

const DS={
  theme:"slate",searchEngine:"google",aiProvider:"perplexity",
  links:DL,showLinks:true,glassOpacity:0.04,searchType:"all",
  mode:"web",vertical:"all",refiners:[],shopSite:"amazon",resetFilters:false,
  customBg:"#0d0d0d",customAccent:"#7a8a9a",customLight:false,aiFreeOn:false,
  aiSignal:false,aiSensitivity:"med",aiHideAbove:0,
  aiPageDetector:false,weatherLat:null,weatherLon:null,
  weatherUnit:"auto",weatherPlace:"",uiScale:1,textHalo:false,contrastMode:"auto",scrim:0,
  bgBlur:0,bgDim:null,bgDark:true,bgText:"auto",aiBridge:false,aiBridgeSubmit:false,
  hiddenWeb:[],hiddenAI:[],hiddenShop:[],customWeb:[],customAI:[],customShop:[],
  textColor:null
};
let state={...DS},linkId=100;

/* ── Cached element lookups ──
   Ids in the static tab.html shell are never re-created, so their
   lookups are cached after first hit. Ids born inside renderSettings /
   showMethodology are re-created every render and pass straight
   through to an uncached lookup. */
const STATIC_IDS=new Set(["bgLayer","ambient","greeting","time","date","weather","weatherIcon","weatherTemp","weatherDesc","weatherHiLo","searchSection","searchForm","searchInput","searchArrow","modeTag","searchBody","searchDrawer","drawerTabbar","drawerGrid","drawerFooter","filterBar","aiModeHint","links","settingsToggle","settingsBackdrop","settingsPanel","settingsTitle","settingsBody","settingsClose","bgUpload"]);
const _elCache={};
function $(id){
  if(!STATIC_IDS.has(id))return document.getElementById(id);
  return _elCache[id]||(_elCache[id]=document.getElementById(id));
}

/* ── Security helpers ── */
function esc(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
/* Only http(s) URLs come back from here — javascript:/data: links a user
   (or imported settings) might put in a quick link are neutralized. */
function safeHref(u){
  const raw=String(u||"").trim();
  try{const p=new URL(raw);if(p.protocol==="http:"||p.protocol==="https:")return p.href}catch{}
  try{const p=new URL("https://"+raw.replace(/^\/+/,""));if(p.hostname.includes("."))return p.href}catch{}
  return "#";
}
/* Custom search templates take a %s query placeholder. Only http(s)
   URLs that actually contain %s are accepted — anything else (including
   javascript:/data: schemes) is rejected so a synced or typed template
   can never inject a non-web scheme into window.location. */
function safeTemplate(u){
  const raw=String(u||"").trim();
  if(!/^https?:\/\//i.test(raw)||!raw.includes("%s"))return null;
  return raw;
}

/* ── Storage ── */
const SYS="hz",BG_KEY="***";
const KNOWN_KEYS=["theme","searchEngine","aiProvider","links","showLinks","glassOpacity","searchType",
  "customBg","customAccent","customLight","aiFreeOn","aiSignal","aiSensitivity","aiHideAbove",
  "aiPageDetector","weatherLat","weatherLon","weatherUnit","weatherPlace","uiScale","textHalo","contrastMode","scrim",
  "bgBlur","bgDim","bgDark","bgText","aiBridge","aiBridgeSubmit",
  "mode","vertical","refiners","shopSite","resetFilters",
  "hiddenWeb","hiddenAI","hiddenShop","customWeb","customAI","customShop","textColor"];
let extraState={};      // keys under "hz" owned by other parts of the extension — preserved verbatim on save
let lastSavedJSON="";   // diff guard: identical snapshots never hit storage (sync quota: 120 writes/min)
let lastSavedBG=null;   // the bg data-URL (up to ~500 KB) is only written when it actually changes
let saveTimer=null;

async function loadState(){
  try{
    const s=await XAPI.storage.sync.get([SYS]);
    if(s[SYS]){
      state={...DS,...s[SYS],links:s[SYS].links||DL};
      for(const k of Object.keys(s[SYS]))if(!KNOWN_KEYS.includes(k))extraState[k]=s[SYS][k];
    }
  }catch{try{const s=localStorage.getItem(SYS);if(s)state={...DS,...JSON.parse(s),links:JSON.parse(s).links||DL}}catch{}}
  try{
    const b=await XAPI.storage.local.get([BG_KEY]);
    if(b[BG_KEY])state.bg=b[BG_KEY];
  }catch{try{const b=localStorage.getItem(BG_KEY);if(b)state.bg=b}catch{}}
  migrateSearchState();
  sanitizeCustom();
  if(state.resetFilters){state.vertical="all";state.refiners=[];state.aiFreeOn=false}
  ensureActive();
  lastSavedBG=state.bg||null;
  lastSavedJSON=JSON.stringify(snapshotState());
}
function snapshotState(){
  const o={...extraState};
  for(const k of KNOWN_KEYS)o[k]=state[k];
  return o;
}
/* Debounced + diffed: rapid slider drags / typing coalesce into one
   write 250 ms after the last change, and no-op saves don't write at
   all. v1 wrote to chrome.storage.sync on every keystroke and every
   slider pixel — hitting the 120 writes/min quota was easy. */
function saveState(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveStateNow,250);
}
function saveStateNow(){
  clearTimeout(saveTimer);saveTimer=null;
  const o=snapshotState(),j=JSON.stringify(o);
  if(j!==lastSavedJSON){
    lastSavedJSON=j;
    try{const p=chrome.storage.sync.set({[SYS]:o});if(p&&p.catch)p.catch(()=>{})}
    catch{try{localStorage.setItem(SYS,j)}catch{}}
  }
  const bg=state.bg||null;
  if(bg!==lastSavedBG){
    lastSavedBG=bg;
    if(bg){try{const p=chrome.storage.local.set({[BG_KEY]:bg});if(p&&p.catch)p.catch(()=>{})}catch{try{localStorage.setItem(BG_KEY,bg)}catch{}}}
    else{try{chrome.storage.local.remove(BG_KEY)}catch{}}
  }
}
// A pending debounced save must not be lost when the tab navigates
// (e.g. changing a filter and pressing Enter within 250 ms).
window.addEventListener("pagehide",()=>{if(saveTimer)saveStateNow()});

/* Fold the old single-value `searchType` into the mode+vertical model.
   Runs once per profile; afterwards `mode` exists and it is a no-op.
   searchType is still written to storage so that downgrading to an
   older build doesn't land the user on a broken setting. */
function migrateSearchState(){
  if(!Array.isArray(state.refiners))state.refiners=[];
  // Shop/AI/web validity (including custom sources) is enforced later by
  // ensureActive(), which runs AFTER sanitizeCustom() so it can see both
  // built-ins and user-added entries. A plain SHOP[] check here would
  // wipe a custom-store selection on every load.
  if(state.mode==="web"||state.mode==="ai"||state.mode==="shop"){
    if(!VERTICAL_L[state.vertical])state.vertical="all";
    return;
  }
  // Even older profiles carried `searchMode` instead of `searchType`.
  // That fixup used to live in boot() — i.e. AFTER this function — and
  // was dead anyway, since the DS spread always supplies a searchType.
  // Handle it here, first, where it can actually win.
  if(state.searchMode){
    state.mode=state.searchMode==="ai"?"ai":"web";
    state.vertical="all";delete state.searchMode;
    return;
  }
  const t=state.searchType;
  if(t==="ai"){state.mode="ai";state.vertical="all"}
  else if(t==="reddit"){state.mode="web";state.vertical="all";state.refiners=["reddit"]}
  else if(t==="pdf"){state.mode="web";state.vertical="all";state.refiners=["pdf"]}
  else if(VERTICAL_L[t]){state.mode="web";state.vertical=t}
  else{state.mode="web";state.vertical="all"}
}

/* ── Clock ── */
function greet(){return["good morning","good afternoon","good evening","good night"][Math.min(Math.floor(new Date().getHours()/6),3)]}
function updateClock(){
  const n=new Date();
  $("time").textContent=`${n.getHours()%12||12}:${String(n.getMinutes()).padStart(2,"0")} ${n.getHours()>=12?"PM":"AM"}`;
  $("greeting").textContent=greet();
  $("date").textContent=n.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  if(state.theme==="modern"&&!state.bg)swModern(); // keep auto day/night correct on long-lived tabs
}
/* The display has minute resolution, so tick once per minute (aligned
   to the minute boundary) instead of every second — 60× fewer wakeups.
   visibilitychange re-syncs a tab restored from the background. */
let clockTimer=null;
function scheduleClock(){
  clearTimeout(clockTimer);
  updateClock();
  const n=new Date();
  clockTimer=setTimeout(scheduleClock,Math.max(250,(60-n.getSeconds())*1000-n.getMilliseconds()));
}

/* ══════════════════════════════════════════════════
   WEATHER — Open-Meteo (worldwide, no API key)
   ══════════════════════════════════════════════════
   Replaces api.weather.gov, which only covers the United States —
   everyone outside the US got "unavailable" forever. Open-Meteo is
   free, keyless, CORS-enabled and global, and its companion geocoding
   endpoint turns a typed city name into coordinates so nobody has to
   look up their own latitude.
   Units follow the locale by default (°F in the US, Liberia, Myanmar;
   °C everywhere else) and can be forced either way. */
const WEATHER_KEY="hzWeather3",WEATHER_TTL=10*60*1000;
const GEO_API="https://geocoding-api.open-meteo.com/v1/search";
const WX_API="https://api.open-meteo.com/v1/forecast";

function prefersFahrenheit(){
  const loc=(navigator.languages&&navigator.languages[0])||navigator.language||"en-US";
  return /-(US|LR|MM)\b/i.test(loc)||/^en-US$/i.test(loc);
}
function weatherUnit(){
  const u=state.weatherUnit;
  if(u==="f")return "fahrenheit";
  if(u==="c")return "celsius";
  return prefersFahrenheit()?"fahrenheit":"celsius";
}
function unitSymbol(){return weatherUnit()==="fahrenheit"?"°F":"°C"}

/* WMO weather interpretation codes → short label. Icons stay stroke-style
   SVG via wi() — no emoji. https://open-meteo.com/en/docs */
const WMO={
  0:"Clear",1:"Mostly clear",2:"Partly cloudy",
  3:"Overcast",45:"Fog",48:"Freezing fog",
  51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",
  56:"Freezing drizzle",57:"Freezing drizzle",
  61:"Light rain",63:"Rain",65:"Heavy rain",
  66:"Freezing rain",67:"Freezing rain",
  71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",
  80:"Showers",81:"Showers",82:"Heavy showers",
  85:"Snow showers",86:"Snow showers",
  95:"Thunderstorm",96:"Thunderstorm",99:"Thunderstorm"
};
function wmoDesc(code){return WMO[code]||"—"}

/* City search → coordinates. Used by the settings location field. */
async function geocode(q){
  const ac=new AbortController();const to=setTimeout(()=>ac.abort(),8000);
  try{
    const r=await fetch(`${GEO_API}?name=${encodeURIComponent(q)}&count=5&language=en&format=json`,{signal:ac.signal});
    const j=await r.json();
    return (j.results||[]).map(p=>({
      name:p.name,admin:p.admin1||"",country:p.country||"",cc:p.country_code||"",
      lat:p.latitude,lon:p.longitude
    }));
  }catch{return []}
  finally{clearTimeout(to)}
}

function weatherCoords(){
  const lat=parseFloat(state.weatherLat),lon=parseFloat(state.weatherLon);
  return Number.isFinite(lat)&&Number.isFinite(lon)?[lat,lon]:[LAT,LON];
}
function renderWeather(d){
  const el=$("weather");
  if(el)el.title=d.place?`${d.place} · ${d.desc}`:d.desc;
  $("weatherIcon").innerHTML=d.icon;
  $("weatherTemp").textContent=d.temp;
  $("weatherDesc").textContent=d.desc;
  $("weatherHiLo").textContent=d.hilo;
}
/* Cached in chrome.storage.local: opening ten tabs in a row costs one
   round-trip, not ten. Stale data renders instantly, then refreshes in
   the background. 8 s abort so a slow API never hangs the badge. */
async function fetchWeather(){
  const[lat,lon]=weatherCoords(),unit=weatherUnit();
  let cached=null;
  try{const c=await XAPI.storage.local.get([WEATHER_KEY]);cached=c[WEATHER_KEY]}catch{}
  if(cached&&cached.lat===lat&&cached.lon===lon&&cached.unit===unit&&cached.d){
    renderWeather(cached.d);
    if(Date.now()-cached.t<WEATHER_TTL)return;
  }
  try{
    const ac=new AbortController();const to=setTimeout(()=>ac.abort(),8000);
    const url=`${WX_API}?latitude=${lat}&longitude=${lon}`+
      `&current=temperature_2m,weather_code,is_day`+
      `&daily=temperature_2m_max,temperature_2m_min`+
      `&timezone=auto&forecast_days=1&temperature_unit=${unit}`;
    const j=await(await fetch(url,{signal:ac.signal})).json();
    clearTimeout(to);
    if(!j||!j.current)throw new Error("no data");
    const cur=j.current,day=j.daily||{},isDay=cur.is_day===1;
    const desc=wmoDesc(cur.weather_code);
    const hi=Array.isArray(day.temperature_2m_max)?Math.round(day.temperature_2m_max[0]):null;
    const lo=Array.isArray(day.temperature_2m_min)?Math.round(day.temperature_2m_min[0]):null;
    const data={
      icon:wi(desc,isDay),temp:`${Math.round(cur.temperature_2m)}°`,desc,
      hilo:(hi!=null&&lo!=null)?`H ${hi}° L ${lo}°`:"",
      place:state.weatherPlace||""
    };
    renderWeather(data);
    try{const pr=XAPI.storage.local.set({[WEATHER_KEY]:{t:Date.now(),lat,lon,unit,d:data}});if(pr&&pr.catch)pr.catch(()=>{})}catch{}
  }catch{if(!cached)$("weatherDesc").textContent="unavailable"}
}
/* Stroke-style SVG condition icons (feather-like, currentColor) —
   consistent with the rest of the UI; no emoji. */
function wi(f,d){
  const F=f.toLowerCase();
  const svg=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const sun=svg(`<circle cx="12" cy="12" r="5"/><path d="M12 1.5v2M12 20.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1.5 12h2M20.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>`);
  const moon=svg(`<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`);
  const cloud=svg(`<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>`);
  const pcloud=svg(`<circle cx="9" cy="8" r="3.5"/><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>`);
  if(F.includes("sunny")||F.includes("clear"))return d?sun:moon;
  if(F.includes("cloud")||F.includes("overcast"))return cloud;
  if(F.includes("partly"))return d?pcloud:cloud;
  if(F.includes("rain")||F.includes("shower")||F.includes("drizzle"))return svg(`<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 13v8M12 15v8M16 13v8"/>`);
  if(F.includes("thunder")||F.includes("storm"))return svg(`<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M13 11l-4 6h4l-1 6"/>`);
  if(F.includes("snow")||F.includes("flurr")||F.includes("blizzard"))return svg(`<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15v7M12 13v9M16 15v7"/>`);
  if(F.includes("fog")||F.includes("mist")||F.includes("haze"))return svg(`<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M5 16.5h14M8 19.5h10"/>`);
  if(F.includes("wind")||F.includes("breez"))return svg(`<path d="M9.59 4.59A2 2 0 1 1 11 8H2M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2M12.59 19.41A2 2 0 1 0 14 16H2"/>`);
  return d?sun:moon;
}

/* ── Theme ── */
function applyTheme(theme){
  state.theme=theme;const root=document.documentElement;root.classList.remove("has-bg");
  if(theme==="modern"&&!state.bg){swModern();saveState();return}
  if(theme==="custom"){applyCustomTheme();return}
  root.setAttribute("data-theme",theme);saveState();
}
function swModern(){
  const want=new Date().getHours()>=6&&new Date().getHours()<20?"modern-day":"modern";
  const root=document.documentElement;
  if(root.getAttribute("data-theme")!==want)root.setAttribute("data-theme",want);
}
function hexToRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
function luminance(r,g,b){return(0.299*r+0.587*g+0.114*b)/255}
function applyCustomTheme(){
  const root=document.documentElement;root.setAttribute("data-theme","custom");
  const bg=state.customBg||"#0d0d0d",ac=state.customAccent||"#7a8a9a";
  const[br,bgG,bgB]=hexToRgb(bg);const[ar,ag,ab]=hexToRgb(ac);const l=luminance(br,bgG,bgB),isLight=l>.5;
  root.dataset.customMode=isLight?"light":"dark";
  root.style.setProperty("--user-bg",bg);root.style.setProperty("--user-bg2",isLight?darken(bg,8):lighten(bg,8));
  root.style.setProperty("--user-accent",ac);root.style.setProperty("--user-accent-glow",`rgba(${ar},${ag},${ab},${isLight?0.12:0.22})`);
  const tc=isLight?"#1e1e1e":"#E8EBED";root.style.setProperty("--user-text",tc);root.style.setProperty("--user-text-dim",isLight?"#606060":"#8a929a");
  root.style.setProperty("--user-text-muted",isLight?"#909090":"#5a626a");root.style.setProperty("--user-hero-text",isLight?"#111111":"#F0F2F4");
  root.style.setProperty("--user-hero-sub",isLight?"#404040":"#C0C6CC");saveState();
}
function lighten(h,p){const[r,g,b]=hexToRgb(h);const m=c=>Math.round(c+(255-c)*p/100);return`#${m(r).toString(16).padStart(2,"0")}${m(g).toString(16).padStart(2,"0")}${m(b).toString(16).padStart(2,"0")}`}
function darken(h,p){const[r,g,b]=hexToRgb(h);const m=c=>Math.round(c*(1-p/100));return`#${m(r).toString(16).padStart(2,"0")}${m(g).toString(16).padStart(2,"0")}${m(b).toString(16).padStart(2,"0")}`}
/* Global text-color override. When set, the chosen color (plus auto-derived
   dim/muted tints) is applied inline on the root — beating every theme's own
   text vars. When null, the inline props are cleared and the theme default
   wins again. */
function applyTextColor(){
  const root=document.documentElement,props=["--text","--text-dim","--text-muted","--hero-text","--hero-sub"];
  const c=state.textColor;
  if(!c||!/^#[0-9a-fA-F]{6}$/.test(c)){props.forEach(k=>root.style.removeProperty(k));return}
  const[r,g,b]=hexToRgb(c);
  root.style.setProperty("--text",c);
  root.style.setProperty("--text-dim",`rgba(${r},${g},${b},0.7)`);
  root.style.setProperty("--text-muted",`rgba(${r},${g},${b},0.45)`);
  root.style.setProperty("--hero-text",c);
  root.style.setProperty("--hero-sub",`rgba(${r},${g},${b},0.7)`);
}

/* ── Glass / BG ── */
/* The glass slider drives every frosted surface at once, so a drag used
   to trigger a style recalc per input event (well above 60/s). Coalesce
   the write into one animation frame. */
let glassFrame=0;
function applyGlassOpacity(val){
  state.glassOpacity=parseFloat(val);
  if(!glassFrame)glassFrame=requestAnimationFrame(()=>{glassFrame=0;pushSurfaceOpacity()});
  saveState();
}

/* ── Readability & UI scale ──
   Surfaces have to satisfy BOTH the glass slider and the contrast mode.
   The slider writes --surface-opacity inline on <html>, and an inline
   style beats any stylesheet rule — so a contrast mode that set the same
   variable in CSS would be silently ignored. Resolve it here instead:
   the contrast level acts as a floor the slider can exceed but not sink
   below. */
const SURFACE_FLOOR={auto:0,boost:0.12,max:0.24};
function surfaceOpacity(){
  const base=parseFloat(state.glassOpacity);
  return Math.max(Number.isFinite(base)?base:0.04,SURFACE_FLOOR[state.contrastMode||"auto"]||0);
}
function pushSurfaceOpacity(){
  document.documentElement.style.setProperty("--surface-opacity",String(surfaceOpacity()));
}
/* Applied as attributes/vars on <html> so every theme and the
   background-image themes (darkbg/lightbg) inherit them. */
function applyDisplayPrefs(){
  const r=document.documentElement;
  const s=Math.min(1.5,Math.max(0.8,parseFloat(state.uiScale)||1));
  r.style.setProperty("--ui-scale",String(s));
  r.style.setProperty("--scrim",String(Math.min(1,Math.max(0,(state.scrim||0)/100))));
  if(state.textHalo)r.setAttribute("data-halo","1");else r.removeAttribute("data-halo");
  const c=state.contrastMode||"auto";
  if(c==="auto")r.removeAttribute("data-contrast");else r.setAttribute("data-contrast",c);
  pushSurfaceOpacity();   // contrast level raises the surface floor
}
/* Sample the image on a 32x32 grid instead of a single pixel.
   The old code drew the whole image into a 1x1 canvas and read that
   one pixel: browsers don't guarantee a true average when downscaling
   that hard, so a mostly-dark wallpaper could report a BRIGHT sample,
   flip to "light image" and get a 60%-WHITE veil dropped on it — the
   washed-out look on dark backgrounds. Center-weighted because that's
   where the clock and search box sit. */
function analyze(img){
  const N=32,c=document.createElement("canvas");c.width=c.height=N;
  const ctx=c.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,0,0,N,N);
  let d;try{d=ctx.getImageData(0,0,N,N).data}catch{return{mean:.5,center:.5}}
  let sum=0,cSum=0,cN=0;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=(y*N+x)*4,l=luminance(d[i],d[i+1],d[i+2]);
    sum+=l;
    if(x>=N*0.15&&x<N*0.85&&y>=N*0.2&&y<N*0.8){cSum+=l;cN++}
  }
  return{mean:sum/(N*N),center:cN?cSum/cN:sum/(N*N)};
}

/* How much dimming does legibility ACTUALLY require?
   Compositing a black veil of alpha a over luminance L gives L(1-a);
   a white veil gives L+a(1-L). Solve for the alpha that just reaches
   the contrast target and use that — so a wallpaper that's already
   dark enough gets NO overlay at all, instead of the old flat 35–60%
   that washed every image out. */
function autoDim(lum,dark){
  const a=dark?(lum<=.30?0:1-.30/Math.max(lum,.001)):(lum>=.78?0:(.78-lum)/(1-lum));
  return Math.round(Math.max(0,Math.min(.62,a))*100);
}
function bgVars(){
  const el=$("bgLayer"),dark=state.bgDark!==false;
  const dim=(state.bgDim==null?50:state.bgDim)/100;
  el.style.setProperty("--overlay-c",dark?`rgba(0,0,0,${dim.toFixed(2)})`:`rgba(255,255,255,${dim.toFixed(2)})`);
  const blur=state.bgBlur==null?0:state.bgBlur;
  el.style.setProperty("--bg-blur",`${blur}px`);
  el.classList.toggle("has-blur",blur>0);
}
function applyBg(data,recompute){
  if(!data){clearBg();return}
  const img=new Image();
  img.onload=()=>{
    const{mean,center}=analyze(img);
    // "white" = force light text, "black" = force dark text, "auto" reads
    // the image. `dark` drives BOTH the text theme (darkbg/lightbg) and
    // the dim veil direction, so they never contradict each other.
    const dark=state.bgText==="white"?true:state.bgText==="black"?false:(center<=.55);
    state.bgDark=dark;
    // Auto-pick the dim only for a NEW image; a user-set value sticks.
    if(recompute||state.bgDim==null)state.bgDim=autoDim(center,dark);
    const el=$("bgLayer");el.style.setProperty("--user-bg",`url(${data})`);el.classList.add("has-image");
    bgVars();
    $("ambient").style.display="none";document.documentElement.setAttribute("data-theme",dark?"darkbg":"lightbg");document.documentElement.classList.add("has-bg");
    state.bg=data;saveState();
  };img.onerror=clearBg;img.src=data;
}
function clearBg(){
  const el=$("bgLayer");el.classList.remove("has-image","has-blur");el.style.removeProperty("--user-bg");el.style.removeProperty("--overlay-c");el.style.removeProperty("--bg-blur");
  state.bgDim=null;state.bgDark=undefined;
  $("ambient").style.display="";document.documentElement.classList.remove("has-bg");
  const t=state.theme||"slate";if(t==="custom")applyCustomTheme();else if(t==="modern")swModern();else document.documentElement.setAttribute("data-theme",t);
  delete state.bg;saveState();
}

/* Bang cheat-sheet, GENERATED from the BANGS table so the reference can
   never drift out of sync with what actually works. Grouped by target
   kind; site bangs take their label from the URL's hostname. */
/* Display names where naive capitalization or the bare hostname would
   read wrong ("Duckduckgo", "google.com" for Maps). */
const BANG_LABEL={duckduckgo:"DuckDuckGo",searxng:"SearXNG",startpage:"Startpage",
  bing:"Bing",kagi:"Kagi",qwant:"Qwant",brave:"Brave",google:"Google",
  maps:"Google Maps",x:"X / Twitter",w:"Wikipedia",gh:"GitHub",so:"Stack Overflow",
  mdn:"MDN",npm:"npm",yt:"YouTube",r:"Reddit",imdb:"IMDb"};
function bangLabelFor(spec,tok){
  if(BANG_LABEL[tok])return BANG_LABEL[tok];
  const i=spec.indexOf(":"),kind=spec.slice(0,i),val=spec.slice(i+1);
  if(kind==="engine")return BANG_LABEL[val]||val.charAt(0).toUpperCase()+val.slice(1);
  if(kind==="ai")return AI_L[val]||val;
  if(kind==="shop")return (SHOP[val]||{}).label||val;
  if(kind==="vertical")return VERTICAL_L[val]||val;
  try{return new URL(val.replace("%s","x")).hostname.replace(/^www\./,"")}catch{return val}
}
function bangReference(){
  const groups={engine:["Search engines",[]],ai:["AI chats",[]],shop:["Stores",[]],vertical:["Filters",[]],url:["Sites",[]]};
  const seen=new Set();
  for(const [tok,spec] of Object.entries(BANGS)){
    const kind=spec.slice(0,spec.indexOf(":"));
    if(!groups[kind])continue;
    if(seen.has(spec))continue;           // first token wins for duplicates (!a / !amazon)
    seen.add(spec);
    groups[kind][1].push(`<span class="bang-item"><code>!${esc(tok)}</code>${esc(bangLabelFor(spec,tok))}</span>`);
  }
  return Object.values(groups).filter(([,items])=>items.length)
    .map(([title,items])=>`<div class="bang-group"><span class="bang-title">${title}</span>${items.join("")}</div>`).join("");
}

/* ── Links ── */
function renderLinks(){
  const linksEl=$("links");linksEl.style.display=state.showLinks?"":"none";
  linksEl.innerHTML=state.links.map(l=>{
    const href=safeHref(l.url);
    const icon=l.image?`<img src="${esc(l.image)}" alt="" loading="lazy">`:esc(l.emoji||"🌐");
    return `<a href="${esc(href)}" class="link-item" title="${esc(l.url)}"><span class="link-icon">${icon}</span><span class="link-label">${esc(l.label)}</span></a>`;
  }).join("");
}

/* ══════════════════════════════════════════════════
   SEARCH — Expandable drawer
   ══════════════════════════════════════════════════ */

function isAI(){return state.mode==="ai"}
function isShop(){return state.mode==="shop"}
/* Keep the legacy key in sync so an older build (or a half-synced
   profile) still lands somewhere sensible. */
function syncLegacyType(){
  state.searchType=isAI()?"ai":(state.vertical||"all");
}
function hasRefiner(k){return (state.refiners||[]).includes(k)}
function toggleRefiner(k){
  const r=new Set(state.refiners||[]);
  r.has(k)?r.delete(k):r.add(k);
  state.refiners=REFINER_ORDER.filter(x=>r.has(x));
}
function currentLabel(){
  if(isAI())return aiLabel(state.aiProvider);
  if(isShop())return shopLabel(state.shopSite);
  return webLabel(state.searchEngine);
}

/* ── SVG icon for a key ── */
function svgIcon(key){
  if(LOGOS[key])return LOGOS[key];
  if(SHOP[key])return shopLogo(key);
  const cs=customShopById(key);if(cs)return markLogo(cs.mark,cs.color);
  const ca=customAIById(key);if(ca)return markLogo((ca.label||"?").charAt(0).toUpperCase(),"#3a3f45");
  const cw=customWebById(key);if(cw)return markLogo((cw.label||"?").charAt(0).toUpperCase(),"#3a3f45");
  return LOGOS.google;
}

/* ══════════════════════════════════════════════════
   SOURCES — visibility + custom additions
   ══════════════════════════════════════════════════
   Each category (web / ai / shop) = the built-ins above plus any
   user-added custom entries. Hidden built-ins are listed by key in
   state.hiddenWeb/AI/Shop; custom entries are objects in
   state.customWeb/AI/Shop carrying a %s query template. Everything
   downstream reads through the *entries() accessors so the drawer,
   settings and submit path can never disagree about what exists. */
function webLabel(k){const c=customWebById(k);return c?c.label:(WEB_L[k]||k)}
function aiLabel(k){const c=customAIById(k);return c?c.label:(AI_L[k]||"AI")}
function shopLabel(k){const c=customShopById(k);return c?c.label:(SHOP[k]?SHOP[k].label:"Store")}
function customWebById(id){return (state.customWeb||[]).find(x=>x.id===id)}
function customAIById(id){return (state.customAI||[]).find(x=>x.id===id)}
function customShopById(id){return (state.customShop||[]).find(x=>x.id===id)}
function webEntries(){
  const h=new Set(state.hiddenWeb||[]);
  const b=Object.keys(SE).filter(k=>!h.has(k)).map(k=>({key:k,label:webLabel(k),builtin:true}));
  return b.concat((state.customWeb||[]).map(x=>({key:x.id,label:x.label,builtin:false})));
}
function aiEntries(){
  const h=new Set(state.hiddenAI||[]);
  const b=AI_ORDER.filter(k=>!h.has(k)).map(k=>({key:k,label:AI_L[k],mode:AI[k].mode,builtin:true}));
  return b.concat((state.customAI||[]).map(x=>({key:x.id,label:x.label,mode:x.mode||"prefill",builtin:false})));
}
function shopEntries(){
  const h=new Set(state.hiddenShop||[]);
  const b=SHOP_ORDER.filter(k=>!h.has(k)).map(k=>({key:k,label:SHOP[k].label,builtin:true}));
  return b.concat((state.customShop||[]).map(x=>({key:x.id,label:x.label,builtin:false})));
}
/* The settings panel renders the FULL list (hidden included) so a source
   the user turned off stays visible with its toggle "off" and can be
   re-enabled — the drawer is the only place that filters via *entries(). */
function webAll(){return Object.keys(SE).map(k=>({key:k,label:webLabel(k),builtin:true})).concat((state.customWeb||[]).map(x=>({key:x.id,label:x.label,builtin:false})))}
function aiAll(){return AI_ORDER.map(k=>({key:k,label:AI_L[k],mode:AI[k].mode,builtin:true})).concat((state.customAI||[]).map(x=>({key:x.id,label:x.label,mode:x.mode||"prefill",builtin:false})))}
function shopAll(){return SHOP_ORDER.map(k=>({key:k,label:SHOP[k].label,builtin:true})).concat((state.customShop||[]).map(x=>({key:x.id,label:x.label,builtin:false})))}
/* If the user hides (or removes) the currently-active default, fall back
   to the first still-visible entry so the mode tag / submit never point
   at a source that no longer renders. */
function ensureActive(){
  const wk=webEntries().map(e=>e.key);
  if(!wk.includes(state.searchEngine))state.searchEngine=wk[0]||"google";
  const ak=aiEntries().map(e=>e.key);
  if(!ak.includes(state.aiProvider))state.aiProvider=ak[0]||"perplexity";
  const sk=shopEntries().map(e=>e.key);
  if(!sk.includes(state.shopSite))state.shopSite=sk[0]||"amazon";
}
/* Reject anything that couldn't have been produced by the UI — dropped
   keys, non-template URLs, junk fields — so a synced profile can't put
   the extension in an inconsistent state. */
function sanitizeCustom(){
  state.hiddenWeb=(state.hiddenWeb||[]).filter(k=>SE[k]);
  state.hiddenAI=(state.hiddenAI||[]).filter(k=>AI[k]);
  state.hiddenShop=(state.hiddenShop||[]).filter(k=>SHOP[k]);
  state.customWeb=(state.customWeb||[]).filter(x=>x&&safeTemplate(x.url))
    .map(x=>({id:String(x.id||""),label:String(x.label||"Custom"),url:safeTemplate(x.url)}));
  state.customAI=(state.customAI||[]).filter(x=>x&&safeTemplate(x.url))
    .map(x=>({id:String(x.id||""),label:String(x.label||"Custom"),url:safeTemplate(x.url),mode:x.mode==="search"?"search":"prefill"}));
  state.customShop=(state.customShop||[]).filter(x=>x&&safeTemplate(x.url))
    .map(x=>({id:String(x.id||""),label:String(x.label||"Store"),url:safeTemplate(x.url),mark:String(x.mark||"?").charAt(0).toUpperCase(),color:/^#[0-9a-fA-F]{3,8}$/.test(x.color||"")?x.color:"#555"}));
}

/* ── Tag + drawer open/close ── */
function updateModeTag(){
  const tag=$("modeTag");
  const key = isAI() ? state.aiProvider : isShop() ? state.shopSite : state.searchEngine;
  const icon = svgIcon(key);
  const label = currentLabel();
  // Wrap label in a span so the compact (icon-only) state can fade
  // the label out independently of the icon.
  tag.innerHTML = icon + ' <span class="mode-label">' + esc(label) + '</span>';
}
function tagOnInput(){
  const i=$("searchInput");
  // Compact the chip to icon-only while typing so the input gets more
  // room without losing the brand indicator entirely.
  $("modeTag").classList.toggle("compact",i.value.length>0);
}

function isDrawerOpen(){return $("searchSection").classList.contains("open")}
function openDrawer(){
  $("searchSection").classList.add("open");
  // Drawer expands absolutely below the search row.
  // Links stay fixed — no layout push needed.
}
function closeDrawer(){
  const sec=$("searchSection");
  sec.classList.remove("open");
  sec.style.marginBottom=""; // restore resting margin (1rem from CSS)
}
function toggleDrawer(){isDrawerOpen()?closeDrawer():openDrawer()}

/* ── Tab bar ── */
function renderTabs(){
  const m=state.mode||"web";
  const tab=(k,l)=>`<button class="drawer-tab${m===k?" active":""}" data-mode="${k}">${l}</button>`;
  $("drawerTabbar").innerHTML=tab("web","Web Search")+tab("ai","AI Chat")+tab("shop","Shop");
}

/* ── Render drawer grid ──
     In AI mode the grid uses the .ai-grid modifier so the 6 providers
     render as 4-on-top, 2-on-bottom (centered under cols 2-3).
     The 8 web search engines keep the auto-fill column layout. */
function renderDrawer(){
  renderTabs();
  const grid=$("drawerGrid");
  const ai=isAI(),shop=isShop();
  let items;
  if(ai)items=aiEntries().map(e=>[e.key,e.label,"ai",aiBadge(e.key)]);
  else if(shop)items=shopEntries().map(e=>[e.key,e.label,"shop","shop"]);
  else items=webEntries().map(e=>[e.key,e.label,"web","web"]);
  grid.classList.toggle("ai-grid",ai);
  grid.classList.toggle("shop-grid",shop);
  grid.innerHTML=items.map(([key,label,kind,tag])=>{
    const act=(kind==="web"&&!ai&&!shop&&state.searchEngine===key)||
              (kind==="ai"&&ai&&state.aiProvider===key)||
              (kind==="shop"&&shop&&state.shopSite===key);
    return `<button class="drawer-btn${act?" active":""}" data-kind="${kind}" data-key="${key}"><span class="db-svg">${svgIcon(key)}</span><span class="db-name">${esc(label)}</span><span class="db-tag">${tag}</span></button>`;
  }).join("");
}

/* ── Filter bar + AI hint (inside drawer) ── */
function renderFilterBar(){
  const bar=$("filterBar");
  const hint=$("aiModeHint");
  if(isAI()){
    bar.classList.remove("visible");
    const c=customAIById(state.aiProvider),mode=c?c.mode:(AI[state.aiProvider]||{}).mode;
    hint.textContent=(mode==="bridge"&&state.aiBridge)
      ? (state.aiBridgeSubmit?"Prompt bridge fills and sends it for you":"Prompt bridge fills the chat box — press Enter to send")
      : AI_MODE_NOTE[mode];
    hint.classList.add("active");
    return;
  }
  if(isShop()){
    bar.classList.remove("visible");
    hint.textContent=`Searches ${shopLabel(state.shopSite)} directly — filters don't apply here`;
    hint.classList.add("active");
    return;
  }
  hint.classList.remove("active");
  const engine=state.searchEngine,isCustom=!SE[engine];
  const actV=isCustom?"all":(state.vertical||"all");
  // Verticals (pick one) then refiners (pick any) — the divider makes
  // the two axes legible at a glance. Media verticals don't exist on a
  // custom engine (no per-engine media URL), so they read as unsupported.
  const verts=Object.keys(VERTICAL_L).map(k=>{
    const off=isCustom&&k!=="all";
    const title=off?` title="Custom engine — media search isn't available"`:"";
    return `<button class="filter-chip${actV===k?" active":""}${off?" unsupported":""}" data-vertical="${k}"${title}${off?" disabled":""}>${VERTICAL_L[k]}</button>`;
  }).join("");
  const refs=REFINER_ORDER.map(k=>{
    const off=(k==="recent"&&!TIME_PARAM[engine]);
    const title=off?` title="${esc(webLabel(engine))} has no time-range parameter"`:"";
    return `<button class="filter-chip refiner${hasRefiner(k)?" active":""}${off?" unsupported":""}" data-refiner="${k}"${title}${off?" disabled":""}>${REFINERS[k].label}</button>`;
  }).join("");
  const aiFreeOff=!AI_FREE_PARAMS[engine];
  const aiFreeTitle=aiFreeOff?' title="This engine doesn\'t inject AI answers — nothing to turn off"':"";
  bar.innerHTML=verts+'<span class="filter-div" aria-hidden="true"></span>'+refs+
    `<button class="filter-chip aifree${state.aiFreeOn?" active":""}${aiFreeOff?" unsupported":""}" id="aiFreeChip"${aiFreeTitle}${aiFreeOff?" disabled":""}>AI-Free</button>`;
  bar.classList.add("visible");
}

function updatePlaceholder(){
  const i=$("searchInput");
  if(isAI()){i.placeholder=`Ask ${aiLabel(state.aiProvider)} anything...`;return}
  if(isShop()){i.placeholder=`Search ${shopLabel(state.shopSite)}...`;return}
  const isCustom=!SE[state.searchEngine];
  const bits=[];
  if(state.aiFreeOn&&AI_FREE_PARAMS[state.searchEngine])bits.push("AI-free");
  if(!isCustom&&(state.vertical||"all")!=="all")bits.push(VERTICAL_L[state.vertical]);
  for(const k of (state.refiners||[])){
    if(k==="recent"&&!TIME_PARAM[state.searchEngine])continue;
    bits.push(REFINERS[k].label);
  }
  i.placeholder=bits.length?`Search · ${bits.join(" · ")}...`:"Search...";
}

function refreshUI(){
  syncLegacyType();
  updateModeTag();renderDrawer();renderFilterBar();updatePlaceholder();saveState();
}

/* ── Submit ── */
/* URL detection: full URLs, bare domains ("github.com/user"),
   localhost[:port] and IPv4 addresses navigate directly; everything
   else searches. Bare domains only navigate when the last label is a
   real, common TLD — so "node.js" or "vue.js" search (as intended)
   while "svelte.dev" navigates.
   v1 required the string to ALREADY start with http, so typing
   "example.com" searched instead of navigating, and the localhost
   branch was unreachable (it also demanded a dot). */
const NAV_TLDS=new Set(("com net org edu gov mil int io ai co dev app me us uk ca de fr jp cn in au br ru ch nl se no dk fi es it pl eu info biz tv gg sh xyz tech site online store blog news wiki to ly fm am so gl cc ws nz ie at be pt cz gr kr mx za ar cl tw hk sg my ph th vn id tr sa ae il pk").split(" "));
function navURL(q){
  if(/\s/.test(q))return null;
  if(/^https?:\/\//i.test(q)){try{return new URL(q).href}catch{return null}}
  if(/^localhost(:\d{1,5})?([\/?#]|$)/i.test(q))return "http://"+q;
  if(/^\d{1,3}(\.\d{1,3}){3}(:\d{1,5})?([\/?#]\S*)?$/.test(q))return "http://"+q;
  const m=q.match(/^[\w-]+(\.[\w-]+)*\.([a-z]{2,24})(:\d{1,5})?([\/?#]\S*)?$/i);
  if(m&&NAV_TLDS.has(m[2].toLowerCase())){
    try{return new URL("https://"+q).href}catch{return null}
  }
  return null;
}
/* Build the web-search URL for a query + vertical + refiner set.
   Refiners are folded into the QUERY TEXT before encoding, so they
   survive on any vertical and any engine — that is what makes
   "Images + Reddit" or "News + PDF" work at all. The Recent refiner
   is the one exception: it is a per-engine URL parameter. */
function webSearchURL(q,{engine,vertical,refiners,aiFree}){
  let text=q;
  if(refiners.includes("exact")&&!/^".*"$/.test(text.trim()))text=`"${text.trim()}"`;
  for(const k of refiners){
    const op=REFINERS[k]&&REFINERS[k].op;
    if(op)text+=op;
  }
  const enc=encodeURIComponent(text);
  // Custom engines carry a %s template; text refiners (site:, filetype:,
  // quotes) still fold into the query, but per-engine URL params (media
  // vertical, Recent, AI-Free) don't exist for them.
  const custom=customWebById(engine);
  if(custom)return custom.url.replace("%s",enc);
  const media=MEDIA_URL[engine]&&MEDIA_URL[engine][vertical];
  let url=media?media.replace("%s",enc):(SE[engine]||SE.google)+enc;
  if(aiFree&&!media)url+=AI_FREE_PARAMS[engine]||"";
  if(refiners.includes("recent")){
    const t=TIME_PARAM[engine];
    if(t)url+=t;
  }
  return url;
}
function aiURL(q,provider){
  const c=customAIById(provider);
  if(c)return c.url.replace("%s",encodeURIComponent(q));
  const p=AI[provider]||AI.perplexity;
  // The bridge content script (opt-in) looks for hz_q and fills the
  // composer on providers that ignore native prefill params.
  const extra=(p.mode==="bridge"&&state.aiBridge)?"&hz_q="+encodeURIComponent(q):"";
  return p.url+encodeURIComponent(q)+extra;
}
function shopURL(q,site){
  const c=customShopById(site);
  if(c)return c.url.replace("%s",encodeURIComponent(q));
  const s=SHOP[site]||SHOP.amazon;
  return s.url.replace("%s",encodeURIComponent(q));
}

/* Bangs: a leading !token retargets this ONE search without touching
   any saved setting. "!a usb c cable" → Amazon; "!img otters" → the
   current engine's image vertical. Unknown tokens fall through and are
   searched literally, so a query that merely starts with "!" is safe. */
function resolveBang(raw){
  const m=raw.match(/^!([a-z0-9]+)\s+([\s\S]+)$/i);
  if(!m)return null;
  const spec=BANGS[m[1].toLowerCase()];
  if(!spec)return null;
  const q=m[2].trim();
  if(!q)return null;
  const i=spec.indexOf(":"),kind=spec.slice(0,i),val=spec.slice(i+1);
  if(kind==="engine")return webSearchURL(q,{engine:val,vertical:state.vertical,refiners:state.refiners||[],aiFree:state.aiFreeOn});
  if(kind==="ai")return aiURL(q,val);
  if(kind==="shop")return shopURL(q,val);
  if(kind==="vertical")return webSearchURL(q,{engine:state.searchEngine,vertical:val,refiners:state.refiners||[],aiFree:state.aiFreeOn});
  if(kind==="url")return val.replace("%s",encodeURIComponent(q));
  return null;
}

function submitSearch(q){
  if(!q)return;
  const bang=resolveBang(q);
  if(bang){window.location.href=bang;return}
  if(isAI()){window.location.href=aiURL(q,state.aiProvider);return}
  if(isShop()){window.location.href=shopURL(q,state.shopSite);return}
  const nav=navURL(q);
  if(nav){window.location.href=nav;return}
  window.location.href=webSearchURL(q,{
    engine:state.searchEngine,vertical:state.vertical||"all",
    refiners:state.refiners||[],aiFree:state.aiFreeOn
  });
}

/* ══════════════════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════════════════ */
function openSettings(){$("settingsPanel").classList.add("open");$("settingsBackdrop").classList.add("open");renderSettings()}
function closeSettings(){$("settingsPanel").classList.remove("open");$("settingsBackdrop").classList.remove("open")}

/* ── Methodology modal — shown when the user taps the "methodology"
     link in the AI Signal section of settings. We open a lightweight
     modal on top of the settings panel with full disclosure. */
function showMethodology(){
  let modal=$("aiMethodologyModal");
  if(!modal){
    modal=document.createElement("div");
    modal.id="aiMethodologyModal";
    modal.className="ai-methodology";
    modal.innerHTML=`
      <div class="ai-methodology-card">
        <div class="ai-methodology-head">
          <h3>How AI Signal works</h3>
          <button type="button" id="aiMethodologyClose" aria-label="Close">✕</button>
        </div>
        <div class="ai-methodology-body">
          <p><strong>What it is.</strong> A client-side "smell test" for AI-flavored writing. Every score is an <em>estimate</em>, not a verdict.</p>
          <p><strong>What it looks at.</strong> Each search result's title and snippet (the text Google / DuckDuckGo / Brave already shows you), plus the URL shape. We never fetch the article body — your browsing history stays yours.</p>
          <p><strong>Three signals, combined.</strong></p>
          <ul>
            <li><strong>Text patterns</strong> (65% weight) — a curated lexicon of ~80 AI-isms ("delve into", "navigate the complexities", "in today's digital landscape", etc.), each capped so repetition can't max the score, plus sentence-length uniformity, "Firstly…Secondly…Finally" scaffolding, transition-word and em-dash density. Evidence is normalized per ~45 words, so long text doesn't inflate the score.</li>
            <li><strong>Author / byline</strong> (15% weight) — looks for named humans ("By Jane Smith") in the snippet; penalizes self-disclosure ("AI-generated").</li>
            <li><strong>Domain signals</strong> (20% weight) — URL shape (TLD, hyphen slug), plus a curated list of human-edited publications (NYT, Atlantic, Wired, etc.) matched on the parsed hostname, which pulls the score downward.</li>
          </ul>
          <p><strong>Calibration.</strong> Three sensitivities that bend the score curve — Low compresses mid-range scores so only extreme evidence gets flagged, Medium is the default, High stretches scores upward. The default is conservative on purpose: false positives — accusing a real journalist of being AI — are worse than false negatives.</p>
          <p><strong>Hide-above mode.</strong> When you set a hide threshold, results meeting/exceeding that score collapse to a single hover-to-expand line. We don't delete them from the DOM (that would break SERP pagination). Hover any collapsed result to expand it for that moment.</p>
          <p><strong>Per-result dismissal.</strong> Every badge has a "✕" that hides it for that domain. Your dismissed domains persist in chrome.storage.sync and never show the badge again.</p>
          <p><strong>What it will NOT do.</strong> It will not catch lightly-edited AI text. It will not catch a human who happens to write in a corporate / listicle style. It will not give you a definitive "this is AI" answer. Anyone who tells you they can do that from a browser extension is lying.</p>
          <p class="ai-methodology-foot">Score is computed locally. No page is fetched, no data is sent off-device. The whole module adds ~15KB to the extension.</p>
        </div>
      </div>`;
    document.body.appendChild(modal);
    $("aiMethodologyClose").addEventListener("click",()=>{
      modal.classList.remove("open");
    });
    modal.addEventListener("click",(e)=>{
      if(e.target===modal)modal.classList.remove("open");
    });
  }
  modal.classList.add("open");
}

/* ── Sources management UI (settings) ── */
function srcHidden(kind){
  return kind==="web"?state.hiddenWeb:kind==="ai"?state.hiddenAI:state.hiddenShop;
}
function srcRow(kind,e,activeKey){
  const visible=e.builtin?!srcHidden(kind).includes(e.key):true;
  return `<div class="src-row${activeKey===e.key?" active":""}" data-kind="${kind}" data-key="${esc(e.key)}" data-builtin="${e.builtin?1:0}">
    <button type="button" class="src-vis${visible?" on":""}" data-role="vis" title="${visible?"Hide":"Show"}" aria-label="${visible?"Hide":"Show"}"></button>
    <span class="src-icon">${svgIcon(e.key)}</span>
    <span class="src-name">${esc(e.label)}</span>
    ${activeKey===e.key?'<span class="src-def">default</span>':''}
    ${e.builtin?'':'<button type="button" class="src-del" data-role="del" title="Remove" aria-label="Remove">✕</button>'}
  </div>`;
}
function srcList(kind,entries,activeKey){
  return entries.map(e=>srcRow(kind,e,activeKey)).join("");
}
function addFormHTML(kind){
  const ai=kind==="ai",shop=kind==="shop";
  const namePh=shop?"Store name":ai?"AI name":"Engine name";
  return `<div class="src-form">
    <input class="src-input src-label" placeholder="${namePh}" maxlength="40" spellcheck="false">
    <input class="src-input src-url" placeholder="https://…search?q=%s" spellcheck="false" autocomplete="off">
    ${ai?'<select class="src-input src-mode"><option value="prefill">Fills the box — press Enter</option><option value="search">Runs the search itself</option></select>':''}
    ${shop?'<div class="src-form-row"><input class="src-input src-mark" placeholder="Letter" maxlength="1" style="max-width:64px"><input type="color" class="src-input src-color" value="#7a8a9a" style="max-width:64px;padding:2px"></div>':''}
    <div class="src-form-row" style="justify-content:flex-end">
      <button type="button" class="btn-sm src-cancel">Cancel</button>
      <button type="button" class="btn-sm src-save">Add</button>
    </div>
    <p class="settings-hint" style="margin-top:0">Use <code>%s</code> where the query goes — e.g. <code>https://temu.com/search_result.html?search_key=%s</code>.</p>
  </div>`;
}
function openAddForm(kind){
  const btn=document.querySelector(`#settingsBody [data-addsrc="${kind}"]`);
  if(!btn||(btn.nextElementSibling&&btn.nextElementSibling.classList.contains("src-form")))return;
  btn.insertAdjacentHTML("afterend",addFormHTML(kind));
  const form=btn.nextElementSibling;
  form.querySelector(".src-label").focus();
  form.querySelector(".src-cancel").addEventListener("click",()=>form.remove());
  form.querySelector(".src-save").addEventListener("click",()=>{
    const label=form.querySelector(".src-label").value.trim();
    const t=safeTemplate(form.querySelector(".src-url").value.trim());
    if(!label){form.querySelector(".src-label").style.borderColor="#ff5a5a";return}
    if(!t){form.querySelector(".src-url").style.borderColor="#ff5a5a";return}
    if(kind==="web")state.customWeb.push({id:"cw"+(linkId++),label,url:t});
    else if(kind==="ai"){const mode=form.querySelector(".src-mode").value;state.customAI.push({id:"ca"+(linkId++),label,url:t,mode});}
    else{const mark=(form.querySelector(".src-mark").value.trim()||label).charAt(0).toUpperCase();const color=form.querySelector(".src-color").value||"#7a8a9a";state.customShop.push({id:"cs"+(linkId++),label,url:t,mark,color});}
    saveState();renderSettings();refreshUI();
  });
}

function renderSettings(){
  const gi=Math.round((state.glassOpacity||.04)*100);
  $("settingsTitle").textContent="Horizon Settings";
  $("settingsBody").innerHTML=`
    <div class="settings-group">
      <label class="settings-label">Theme</label>
      <div class="theme-grid">
        <button class="theme-btn${state.theme==="slate"?" active":""}" data-theme="slate"><span class="theme-swatch" style="background:#0d0d0d;border:1px solid #444"></span>Slate</button>
        <button class="theme-btn${state.theme==="ivory"?" active":""}" data-theme="ivory"><span class="theme-swatch" style="background:#f3f1ed;border:1px solid #ccc"></span>Ivory</button>
        <button class="theme-btn${state.theme==="navy"?" active":""}" data-theme="navy"><span class="theme-swatch" style="background:#001E44"></span>Navy</button>
        <button class="theme-btn${state.theme==="modern"?" active":""}" data-theme="modern"><span class="theme-swatch" style="background:linear-gradient(135deg,#0d0d0d 50%,#f8f6f0 50%);border:1px solid #666"></span>Modern</button>
        <button class="theme-btn${state.theme==="custom"?" active":""}" data-theme="custom" style="grid-column:1/-1"><span class="theme-swatch" style="background:${state.customBg||"#333"};border:1px solid ${state.customAccent||"#666"}"></span>Custom</button>
      </div>
      ${state.theme==="custom"?`<div class="color-pickers"><div class="color-pick-group"><label>Background</label><input type="color" class="color-input" id="customBgInput" value="${state.customBg||"#0d0d0d"}"></div><div class="color-pick-group"><label>Accent</label><input type="color" class="color-input" id="customAccentInput" value="${state.customAccent||"#7a8a9a"}"></div></div>`:""}
    </div>
    <div class="settings-group">
      <label class="settings-label">Text Color</label>
      <p class="settings-hint">Override the text color on every theme. Pick a color, or reset to the theme's own.</p>
      <div style="display:flex;gap:.5rem;align-items:center">
        <input type="color" class="color-input" id="textColorInput" value="${state.textColor||"#e8ebed"}" style="width:60px;height:38px;flex-shrink:0">
        <button class="btn-sm" id="resetTextColorBtn">Use theme default</button>
      </div>
    </div>
    <div class="settings-group">
      <label class="settings-label">Background</label>
      <p class="settings-hint">Upload your own image. Persists across tabs.</p>
      <div style="display:flex;gap:.4rem">
        <button class="upload-btn" id="uploadBgBtn">Upload Image</button>
        ${state.bg?'<button class="upload-btn" id="clearBgBtn">× Clear</button>':''}
      </div>
      ${state.bg?`
      <div class="bg-tune">
        <div class="tune-row">
          <label for="bgBlurSlider">Blur<span class="tune-val" id="bgBlurVal">${state.bgBlur?state.bgBlur+"px":"Off"}</span></label>
          <input type="range" class="glass-slider" id="bgBlurSlider" min="0" max="24" step="1" value="${state.bgBlur||0}">
        </div>
        <div class="tune-row">
          <label for="bgDimSlider">Dim<span class="tune-val" id="bgDimVal">${state.bgDim==null?"Auto":(state.bgDim?state.bgDim+"%":"Off")}</span></label>
          <input type="range" class="glass-slider" id="bgDimSlider" min="0" max="80" step="1" value="${state.bgDim==null?50:state.bgDim}">
        </div>
        <div class="tune-row">
          <label>Text color</label>
          <div class="theme-grid" style="grid-template-columns:repeat(3,1fr);gap:.3rem;margin-top:.3rem">
            <button class="engine-btn${state.bgText==="auto"?" active":""}" data-bgtext="auto">Auto</button>
            <button class="engine-btn${state.bgText==="white"?" active":""}" data-bgtext="white">White</button>
            <button class="engine-btn${state.bgText==="black"?" active":""}" data-bgtext="black">Black</button>
          </div>
        </div>
        <p class="settings-hint" style="margin-top:.15rem">Auto reads your image and picks the most readable text. White and Black force it.</p>
        <p class="settings-hint">Blur is off by default so your image stays sharp. Dim is auto-set per image — only as much as the text needs — and stays where you put it.</p>
      </div>`:""}
    </div>
    <div class="settings-group">
      <label class="settings-label">Search Behavior</label>
      <div class="theme-grid" style="grid-template-columns:1fr">
        <button class="engine-btn${state.resetFilters?" active":""}" id="resetFiltersToggle">
          ${state.resetFilters?"✓ Filters reset on every new tab":"○ Filters stay as you left them"}
        </button>
      </div>
      <p class="settings-hint" style="margin-top:.25rem">Resets the vertical (News/Images/Video), the refiner chips and AI-Free each time a new tab opens. Your engine, AI provider and store selection are kept — those are preferences, not filters.</p>
      <p class="settings-hint" style="margin-top:.4rem"><strong>Bangs</strong> — start a query with one of these to redirect that single search without changing any setting:</p>
      <div class="bang-ref">${bangReference()}</div>
    </div>
    <div class="settings-group">
      <label class="settings-label">Glass Intensity</label>
      <div class="glass-slider-row"><span>◻</span><input type="range" class="glass-slider" id="glassSlider" min="0" max="15" value="${gi}"><span>◼</span></div>
    </div>
    <div class="settings-group">
      <label class="settings-label">Readability</label>
      <p class="settings-hint">Light or busy background images can wash out text and buttons. These help without changing your theme.</p>
      <label class="settings-label" style="margin-top:.5rem;font-size:.7rem;opacity:.75">Contrast</label>
      <div class="seg-row">
        ${[["auto","Auto"],["boost","Boosted"],["max","Maximum"]].map(([v,l])=>
          `<button class="seg-btn${(state.contrastMode||"auto")===v?" active":""}" data-contrast="${v}">${l}</button>`).join("")}
      </div>
      <div class="theme-grid" style="grid-template-columns:1fr;margin-top:.45rem">
        <button class="engine-btn${state.textHalo?" active":""}" id="haloToggle">
          ${state.textHalo?"✓ Text outline on — readable over any image":"○ Text outline off"}
        </button>
      </div>
      <div class="tune-row" style="margin-top:.5rem">
        <label for="scrimSlider">Backdrop<span class="tune-val" id="scrimVal">${state.scrim?state.scrim+"%":"Off"}</span></label>
        <input type="range" class="glass-slider" id="scrimSlider" min="0" max="100" step="1" value="${state.scrim||0}">
      </div>
      <p class="settings-hint" style="margin-top:.3rem">Backdrop fades a soft panel behind the clock and search box.</p>
      <div class="tune-row" style="margin-top:.55rem">
        <label for="uiScaleSlider">Interface size<span class="tune-val" id="uiScaleVal">${Math.round((state.uiScale||1)*100)}%</span></label>
        <input type="range" class="glass-slider" id="uiScaleSlider" min="80" max="150" step="5" value="${Math.round((state.uiScale||1)*100)}">
      </div>
    </div>
    <div class="settings-group">
      <label class="settings-label">Weather Location</label>
      <p class="settings-hint">Search any city worldwide.${state.weatherPlace?` Currently: <strong>${esc(state.weatherPlace)}</strong>.`:""}</p>
      <div style="display:flex;gap:.4rem">
        <input type="text" class="coord-input" id="weatherSearch" placeholder="City, e.g. Lisbon" autocomplete="off" spellcheck="false">
        <button class="btn-sm" id="weatherSearchBtn" style="align-self:auto">Search</button>
      </div>
      <div id="weatherResults" class="geo-results"></div>
      <details class="adv-details">
        <summary>Enter coordinates manually</summary>
        <div style="display:flex;gap:.4rem;margin-top:.35rem">
          <input type="text" class="coord-input" id="weatherLatInput" inputmode="decimal" placeholder="Latitude" value="${state.weatherLat??""}">
          <input type="text" class="coord-input" id="weatherLonInput" inputmode="decimal" placeholder="Longitude" value="${state.weatherLon??""}">
        </div>
      </details>
      <label class="settings-label" style="margin-top:.6rem;font-size:.7rem;opacity:.75">Units</label>
      <div class="seg-row">
        ${["auto","f","c"].map(u=>`<button class="seg-btn${(state.weatherUnit||"auto")===u?" active":""}" data-unit="${u}">${u==="auto"?"Auto":u==="f"?"°F":"°C"}</button>`).join("")}
      </div>
    </div>
    <div class="settings-group">
      <label class="settings-label">Search Sources</label>
      <p class="settings-hint">Toggle what appears in the search drawer. Tap a name to set it as the default; add your own with a <code>%s</code> search template.</p>
      <div class="src-block">
        <div class="src-head">Web Search</div>
        <div class="src-list">${srcList("web",webAll(),state.searchEngine)}</div>
        <button class="btn-sm" data-addsrc="web">+ Add custom engine</button>
      </div>
      <div class="src-block">
        <div class="src-head">AI Chat</div>
        <div class="src-list">${srcList("ai",aiAll(),state.aiProvider)}</div>
        <button class="btn-sm" data-addsrc="ai">+ Add custom AI</button>
      </div>
      <div class="src-block">
        <div class="src-head">Stores</div>
        <div class="src-list">${srcList("shop",shopAll(),state.shopSite)}</div>
        <button class="btn-sm" data-addsrc="shop">+ Add custom store</button>
      </div>
    </div>
    <div class="settings-group">
      <label class="settings-label">AI Signal<span style="font-weight:400;text-transform:none;letter-spacing:0;opacity:.65"> · beta</span></label>
      <p class="settings-hint">Heuristic score on Google / DuckDuckGo / Brave search results. Shows an "AI: NN%" badge per result, optionally hides high-AI ones. Pure client-side, no API.</p>
      <div class="theme-grid" style="grid-template-columns:1fr">
        <button class="engine-btn${state.aiSignal?" active":""}" id="aiSignalToggle" data-on="${state.aiSignal}">
          ${state.aiSignal?"✓ Enabled — showing AI % on search results":"○ Off — click to enable"}
        </button>
      </div>
      <div class="theme-grid" style="grid-template-columns:1fr;margin-top:.35rem">
        <button class="engine-btn${state.aiPageDetector?" active":""}" id="aiPageDetToggle">
          ${state.aiPageDetector?"✓ Page detector on — floating score on article pages":"○ Page detector off — click to score pages you visit"}
        </button>
      </div>
      <p class="settings-hint" style="margin-top:.25rem">Optional and off by default. Asks for permission to run on all sites; the text analysis itself stays on-device.</p>
      <div style="margin-top:.75rem">
        <label class="settings-label" style="font-size:.7rem;opacity:.75">Prompt bridge<span style="font-weight:400;text-transform:none;letter-spacing:0;opacity:.65"> · optional</span></label>
        <div class="theme-grid" style="grid-template-columns:1fr;margin-top:.25rem">
          <button class="engine-btn${state.aiBridge?" active":""}" id="aiBridgeToggle">
            ${state.aiBridge?"✓ On — fills the chat box on Gemini &amp; DeepSeek":"○ Off — those chats open empty"}
          </button>
        </div>
        ${state.aiBridge?`<div class="theme-grid" style="grid-template-columns:1fr;margin-top:.35rem">
          <button class="engine-btn${state.aiBridgeSubmit?" active":""}" id="aiBridgeSubmitToggle">
            ${state.aiBridgeSubmit?"✓ Auto-send — sends without waiting":"○ Fill only — you press Enter"}
          </button>
        </div>`:""}
        <p class="settings-hint" style="margin-top:.25rem">Gemini and DeepSeek ignore prefilled links, so a search there opens an empty chat. With the bridge on, Horizon types your query into the box for you. Asks permission per AI site; reads only the query it just sent.</p>
      </div>
      <div style="margin-top:.75rem">
        <label class="settings-label" style="font-size:.7rem;opacity:.75">Safe Browsing key<span style="font-weight:400;text-transform:none;letter-spacing:0;opacity:.65"> · optional</span></label>
        <input type="text" class="coord-input" id="sbKeyInput" placeholder="Enter here" spellcheck="false" autocomplete="off" style="margin-top:.25rem">
        <p class="settings-hint" style="margin-top:.25rem">If set, the page detector also checks sites against Google Safe Browsing and warns on flagged ones — this sends the hostname to Google. Leave blank to skip entirely. <a href="https://developers.google.com/safe-browsing/v4/get-started" target="_blank" rel="noopener" style="color:var(--accent)">Get a key</a></p>
      </div>
      ${state.aiSignal?`
        <div style="margin-top:.4rem">
          <label class="settings-label" style="font-size:.7rem;opacity:.75">Sensitivity</label>
          <div class="theme-grid" style="grid-template-columns:1fr 1fr 1fr;gap:.3rem">
            <button class="engine-btn${state.aiSensitivity==="low"?" active":""}" data-aisens="low">Low<br><span style="font-size:.6rem;opacity:.65">only flag obvious</span></button>
            <button class="engine-btn${state.aiSensitivity==="med"?" active":""}" data-aisens="med">Medium<br><span style="font-size:.6rem;opacity:.65">default</span></button>
            <button class="engine-btn${state.aiSensitivity==="high"?" active":""}" data-aisens="high">High<br><span style="font-size:.6rem;opacity:.65">sensitive</span></button>
          </div>
        </div>
        <div style="margin-top:.4rem">
          <label class="settings-label" style="font-size:.7rem;opacity:.75">Auto-hide results: <span id="aiHideVal">${state.aiHideAbove?`≥ ${state.aiHideAbove}%`:"Off"}</span></label>
          <div class="glass-slider-row"><span>off</span><input type="range" class="glass-slider" id="aiHideSlider" min="0" max="95" step="5" value="${state.aiHideAbove}"><span>95%</span></div>
          <p class="settings-hint" style="margin-top:.25rem">Results scoring at or above the threshold collapse — hover one to reveal it. Slide left to turn off.</p>
        </div>
        <p class="settings-hint" style="margin-top:.4rem">
          <strong>Heuristic, not a verdict.</strong> False positives are possible — formal human writing can get flagged. Every result can be dismissed (\u2715) per-domain. Read the
          <a href="#" id="aiHowLink" style="color:var(--accent)">methodology</a> for details.
        </p>
      `:""}
    </div>
    <div class="settings-group">
      <label class="settings-label">Quick Links</label>
      <div class="custom-links" id="customLinksRendered">
        ${state.links.map((l,i)=>`<div class="link-editor" data-idx="${i}"><input class="le-emoji" value="${esc(l.emoji||"🌐")}" maxlength="2" placeholder="🌐"><input class="le-label" value="${esc(l.label)}" placeholder="Label"><input class="le-url" value="${esc(l.url)}" placeholder="https://..."><input class="le-img" value="${esc(l.image||"")}" placeholder="Img URL"><button class="link-remove" title="Remove">✕</button></div>`).join("")}
      </div>
      <button class="btn-sm" id="addLinkBtn">+ Add Link</button>
      <button class="btn-sm" id="toggleLinksBtn">${state.showLinks?"✓ Visible":"⊟ Hidden"}</button>
    </div>`;

  const ci=$("customBgInput"),ca=$("customAccentInput");
  if(ci&&ca){ci.addEventListener("input",()=>{state.customBg=ci.value;applyCustomTheme()});ca.addEventListener("input",()=>{state.customAccent=ca.value;applyCustomTheme()})}
  const tci=$("textColorInput");
  if(tci)tci.addEventListener("input",()=>{state.textColor=tci.value;applyTextColor();saveState()});
  $("resetTextColorBtn")?.addEventListener("click",()=>{state.textColor=null;applyTextColor();saveState();renderSettings()});
  $("glassSlider")?.addEventListener("input",e=>applyGlassOpacity(e.target.value/100));
  document.querySelectorAll("#settingsBody .theme-btn").forEach(btn=>{btn.addEventListener("click",()=>{if(state.bg)clearBg();applyTheme(btn.dataset.theme);renderSettings()})});
  // Sources management — toggle visibility, remove custom, set default.
  document.querySelectorAll("#settingsBody .src-row").forEach(row=>{
    row.addEventListener("click",e=>{
      const roleEl=e.target.closest("[data-role]");
      const kind=row.dataset.kind,key=row.dataset.key;
      if(roleEl){
        if(roleEl.dataset.role==="vis"){
          const l=srcHidden(kind),i=l.indexOf(key);
          i>=0?l.splice(i,1):l.push(key);
          ensureActive();saveState();renderSettings();refreshUI();
        }else if(roleEl.dataset.role==="del"){
          if(kind==="web")state.customWeb=(state.customWeb||[]).filter(x=>x.id!==key);
          else if(kind==="ai")state.customAI=(state.customAI||[]).filter(x=>x.id!==key);
          else state.customShop=(state.customShop||[]).filter(x=>x.id!==key);
          ensureActive();saveState();renderSettings();refreshUI();
        }
        return;
      }
      if(kind==="web")state.searchEngine=key;
      else if(kind==="ai")state.aiProvider=key;
      else state.shopSite=key;
      saveState();renderSettings();refreshUI();
    });
  });
  document.querySelectorAll("#settingsBody [data-addsrc]").forEach(b=>{
    b.addEventListener("click",()=>openAddForm(b.dataset.addsrc));
  });
  document.querySelectorAll("#customLinksRendered .link-editor").forEach(ed=>{const idx=parseInt(ed.dataset.idx);const save=()=>{
    const newUrl=ed.querySelector(".le-url").value.trim()||"https://example.com";
    const newImg=ed.querySelector(".le-img").value.trim();
    let image=newImg;
    if(!image){
      // v1 called new URL(newUrl) unguarded — a half-typed URL threw and
      // killed the whole input handler. Now it just skips the favicon.
      try{image=`https://www.google.com/s2/favicons?domain=${new URL(safeHref(newUrl)).hostname}&sz=64`}catch{image=""}
    }
    state.links[idx]={...state.links[idx],emoji:ed.querySelector(".le-emoji").value||"🌐",label:ed.querySelector(".le-label").value||"Link",url:newUrl,image};
    saveState();renderLinks()
  };ed.querySelector(".le-emoji")?.addEventListener("input",save);ed.querySelector(".le-label")?.addEventListener("input",save);ed.querySelector(".le-url")?.addEventListener("input",save);ed.querySelector(".le-img")?.addEventListener("input",save);ed.querySelector(".link-remove")?.addEventListener("click",()=>{state.links.splice(idx,1);saveState();renderLinks();renderSettings()})});
  $("toggleLinksBtn")?.addEventListener("click",()=>{state.showLinks=!state.showLinks;saveState();renderLinks();renderSettings()});
  $("addLinkBtn")?.addEventListener("click",()=>{const newUrl = "https://example.com"; const newDomain = (new URL(newUrl)).hostname; state.links.push({id:`lc${linkId++}`,label:"New Link",url:newUrl,emoji:"",image:`https://www.google.com/s2/favicons?domain=${newDomain}&sz=64`});saveState();renderLinks();renderSettings();$("settingsPanel").scrollTop=$("settingsPanel").scrollHeight});
  $("uploadBgBtn")?.addEventListener("click",()=>$("bgUpload").click());
  $("resetFiltersToggle")?.addEventListener("click",()=>{
    state.resetFilters=!state.resetFilters;
    saveState();saveStateNow();renderSettings();
  });
  $("clearBgBtn")?.addEventListener("click",()=>{clearBg();renderSettings()});
  let tuneFrame=0;
  const tune=()=>{tuneFrame=0;bgVars()};
  const scheduleTune=()=>{if(!tuneFrame)tuneFrame=requestAnimationFrame(tune)};
  const bb=$("bgBlurSlider");
  if(bb)bb.addEventListener("input",()=>{
    state.bgBlur=parseInt(bb.value,10)||0;
    $("bgBlurVal").textContent=state.bgBlur?state.bgBlur+"px":"Off";
    scheduleTune();saveState();
  });
  const bd=$("bgDimSlider");
  if(bd)bd.addEventListener("input",()=>{
    state.bgDim=parseInt(bd.value,10)||0;
    $("bgDimVal").textContent=state.bgDim?state.bgDim+"%":"Off";
    scheduleTune();saveState();
  });
  // Text-color override for custom backgrounds: Auto reads the image,
  // White/Black force light/dark text (and the matching dim veil).
  document.querySelectorAll("#settingsBody [data-bgtext]").forEach(b=>b.addEventListener("click",()=>{
    state.bgText=b.dataset.bgtext;
    if(state.bg)applyBg(state.bg,true);
    saveState();renderSettings();
  }));

  // AI Signal settings wiring
  $("aiSignalToggle")?.addEventListener("click",()=>{state.aiSignal=!state.aiSignal;saveState();renderSettings()});
  $("aiPageDetToggle")?.addEventListener("click",async()=>{
    if(!state.aiPageDetector){
      // Turning ON: ask for the optional <all_urls> permission first.
      // background.js registers the detector script only when both the
      // setting and the permission are in place.
      let granted=false;
      try{granted=await XAPI.permissions.request({origins:["<all_urls>"]})}catch{}
      if(!granted){renderSettings();return}
    }
    state.aiPageDetector=!state.aiPageDetector;
    saveState();renderSettings();
  });
  $("aiBridgeToggle")?.addEventListener("click",async()=>{
    if(!state.aiBridge){
      let granted=false;
      try{granted=await XAPI.permissions.request({origins:["https://gemini.google.com/*","https://chat.deepseek.com/*"]})}catch{}
      if(!granted){renderSettings();return}
    }
    state.aiBridge=!state.aiBridge;
    if(!state.aiBridge)state.aiBridgeSubmit=false;
    saveState();saveStateNow();renderSettings();renderDrawer();renderFilterBar();
  });
  $("aiBridgeSubmitToggle")?.addEventListener("click",()=>{
    state.aiBridgeSubmit=!state.aiBridgeSubmit;
    saveState();saveStateNow();renderSettings();renderFilterBar();
  });
  const sbInput=$("sbKeyInput");
  if(sbInput){
    try{chrome.storage.sync.get(["hz_sb_key"],r=>{if(r&&typeof r.hz_sb_key==="string")sbInput.value=r.hz_sb_key})}catch{}
    sbInput.addEventListener("change",()=>{
      const v=sbInput.value.trim();
      try{
        if(v){const p=chrome.storage.sync.set({hz_sb_key:v});if(p&&p.catch)p.catch(()=>{})}
        else{const p=chrome.storage.sync.remove("hz_sb_key");if(p&&p.catch)p.catch(()=>{})}
      }catch{}
    });
  }
  $("settingsBody")?.querySelectorAll("[data-contrast]").forEach(b=>b.addEventListener("click",()=>{
    state.contrastMode=b.dataset.contrast;applyDisplayPrefs();saveState();renderSettings();
  }));
  $("haloToggle")?.addEventListener("click",()=>{
    state.textHalo=!state.textHalo;applyDisplayPrefs();saveState();renderSettings();
  });
  let dispFrame=0;
  const scheduleDisp=()=>{if(!dispFrame)dispFrame=requestAnimationFrame(()=>{dispFrame=0;applyDisplayPrefs()})};
  const scr=$("scrimSlider");
  if(scr)scr.addEventListener("input",()=>{
    state.scrim=parseInt(scr.value,10)||0;
    $("scrimVal").textContent=state.scrim?state.scrim+"%":"Off";
    scheduleDisp();saveState();
  });
  const uis=$("uiScaleSlider");
  if(uis)uis.addEventListener("input",()=>{
    state.uiScale=(parseInt(uis.value,10)||100)/100;
    $("uiScaleVal").textContent=Math.round(state.uiScale*100)+"%";
    scheduleDisp();saveState();
  });
  const wla=$("weatherLatInput"),wlo=$("weatherLonInput");
  if(wla&&wlo){
    const upd=()=>{
      const la=parseFloat(wla.value),lo=parseFloat(wlo.value);
      state.weatherLat=Number.isFinite(la)&&Math.abs(la)<=90?la:null;
      state.weatherLon=Number.isFinite(lo)&&Math.abs(lo)<=180?lo:null;
      state.weatherPlace="";
      saveState();fetchWeather();
    };
    wla.addEventListener("change",upd);wlo.addEventListener("change",upd);
  }
  const wsIn=$("weatherSearch"),wsBtn=$("weatherSearchBtn"),wsOut=$("weatherResults");
  if(wsIn&&wsBtn&&wsOut){
    const runSearch=async()=>{
      const q=wsIn.value.trim();
      if(!q){wsOut.innerHTML="";return}
      wsOut.innerHTML='<div class="geo-msg">Searching…</div>';
      const hits=await geocode(q);
      if(!hits.length){wsOut.innerHTML='<div class="geo-msg">No matches</div>';return}
      wsOut.innerHTML=hits.map((h,i)=>{
        const label=[h.name,h.admin,h.country].filter(Boolean).join(", ");
        return `<button class="geo-hit" data-i="${i}">${esc(label)}</button>`;
      }).join("");
      wsOut.querySelectorAll(".geo-hit").forEach(b=>b.addEventListener("click",()=>{
        const h=hits[parseInt(b.dataset.i,10)];
        state.weatherLat=h.lat;state.weatherLon=h.lon;
        state.weatherPlace=[h.name,h.admin,h.country].filter(Boolean).join(", ");
        saveState();saveStateNow();fetchWeather();renderSettings();
      }));
    };
    wsBtn.addEventListener("click",runSearch);
    wsIn.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();runSearch()}});
  }
  $("settingsBody")?.querySelectorAll("[data-unit]").forEach(b=>b.addEventListener("click",()=>{
    state.weatherUnit=b.dataset.unit;saveState();saveStateNow();fetchWeather();renderSettings();
  }));
  document.querySelectorAll("[data-aisens]").forEach(b=>b.addEventListener("click",()=>{state.aiSensitivity=b.dataset.aisens;saveState();renderSettings()}));
  $("aiHideSlider")?.addEventListener("input",e=>{
    state.aiHideAbove=parseInt(e.target.value,10)||0;
    $("aiHideVal").textContent=state.aiHideAbove?`≥ ${state.aiHideAbove}%`:"Off";
    saveState();
  });
  $("aiHowLink")?.addEventListener("click",e=>{
    e.preventDefault();
    showMethodology();
  });
}

/* ── Upload ── */
$("bgUpload").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      let q=.85,w=img.width,h=img.height;const MD=1920;
      if(w>MD||h>MD){const R=Math.min(MD/w,MD/h);w=Math.round(w*R);h=Math.round(h*R)}
      const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
      const comp=qu=>{const d=c.toDataURL("image/jpeg",qu);return d.length*.75>500*1024&&qu>.1?comp(qu-.05):d};
      state.bgDim=null;applyBg(comp(q),true);renderSettings();
    };img.src=r.result;
  };r.readAsDataURL(f);e.target.value="";
});

document.addEventListener("keydown",e=>{
  const el=e.target;
  const typing=el&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA"||el.isContentEditable);
  const settingsOpen=$("settingsPanel").classList.contains("open");

  // Cmd/Ctrl+K always focuses search; bare "/" only when not typing.
  // (v1 hijacked "/" and "?" even inside the search box — you couldn't
  // type a URL path or end a question with "?" without opening settings.)
  if(((e.key==="/"&&!typing)||(e.key==="k"&&(e.metaKey||e.ctrlKey)))&&!settingsOpen){
    e.preventDefault();
    $("searchInput").focus({preventScroll:true});
    return;
  }
  if(e.key==="?"&&!typing&&!isDrawerOpen()&&!settingsOpen){
    e.preventDefault();
    openSettings();
    return;
  }
  if(e.key==="Escape"&&$("settingsPanel").classList.contains("open"))closeSettings();
  if(e.key==="Escape"&&isDrawerOpen())closeDrawer();

  // Arrow navigation in the drawer grid
  if(isDrawerOpen()&&["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)){
    // While the caret is in the search input, Left/Right/Up must keep
    // moving the caret (v1 preventDefault'd them to switch drawer tabs,
    // so the text cursor couldn't move at all). Only ArrowDown hands
    // focus to the drawer.
    if(document.activeElement===$("searchInput")&&e.key!=="ArrowDown")return;
    e.preventDefault();
    const btns=[...document.querySelectorAll(".drawer-btn")];
    const tabs=[...document.querySelectorAll(".drawer-tab")];
    const active=document.activeElement;
    const activeIdx=btns.indexOf(active);
    const tabIdx=tabs.indexOf(active);

    if(active&&activeIdx>=0){
      // Currently on a grid button
      const perRow=Math.max(1,Math.floor((document.querySelector(":root").offsetWidth-80)/145));
      const col=activeIdx%perRow;
      const isFirstCol=col===0;
      const isLastCol=col===perRow-1||activeIdx===btns.length-1;
      // ArrowLeft from first column → switch to previous tab
      if(e.key==="ArrowLeft"&&isFirstCol){
        const tabs2=[...document.querySelectorAll(".drawer-tab")];
        const activeTab=document.querySelector(".drawer-tab.active");
        const tIdx=tabs2.indexOf(activeTab);
        if(tIdx>0){
          tabs2[tIdx-1].click();
          requestAnimationFrame(()=>{
            const nt=[...document.querySelectorAll(".drawer-tab")];
            if(nt[tIdx-1])nt[tIdx-1].focus();
          });
          return;
        }
      }
      // ArrowRight from last column → switch to next tab
      if(e.key==="ArrowRight"&&isLastCol){
        const tabs2=[...document.querySelectorAll(".drawer-tab")];
        const activeTab=document.querySelector(".drawer-tab.active");
        const tIdx=tabs2.indexOf(activeTab);
        if(tIdx<tabs2.length-1){
          tabs2[tIdx+1].click();
          requestAnimationFrame(()=>{
            const nt=[...document.querySelectorAll(".drawer-tab")];
            if(nt[tIdx+1])nt[tIdx+1].focus();
          });
          return;
        }
      }
      // Normal grid navigation
      if(e.key==="ArrowRight"&&activeIdx<btns.length-1){
        btns[activeIdx+1].focus();
      }else if(e.key==="ArrowLeft"&&activeIdx>0){
        btns[activeIdx-1].focus();
      }else if(e.key==="ArrowDown"&&activeIdx+perRow<btns.length){
        btns[activeIdx+perRow].focus();
      }else if(e.key==="ArrowUp"){
        if(activeIdx-perRow>=0){
          btns[activeIdx-perRow].focus();
        }else{
          // Jump to active tab
          const activeTab2=document.querySelector(".drawer-tab.active");
          if(activeTab2)activeTab2.focus();
        }
      }
    }else if(active&&tabIdx>=0){
      // Currently on a tab
      if(e.key==="ArrowRight"&&tabIdx<tabs.length-1){
        tabs[tabIdx+1].click();
        // After click the drawer re-renders, so re-query the new tab by index
        requestAnimationFrame(()=>{
          const newTabs=[...document.querySelectorAll(".drawer-tab")];
          if(newTabs[tabIdx+1])newTabs[tabIdx+1].focus();
        });
      }else if(e.key==="ArrowLeft"&&tabIdx>0){
        tabs[tabIdx-1].click();
        requestAnimationFrame(()=>{
          const newTabs=[...document.querySelectorAll(".drawer-tab")];
          if(newTabs[tabIdx-1])newTabs[tabIdx-1].focus();
        });
      }else if(e.key==="ArrowUp"||e.key==="ArrowDown"){
        // Jump to first engine of current tab
        const tab=active.dataset.mode;
        const firstBtn=btns.find(b=>b.dataset.kind===tab);
        if(firstBtn)firstBtn.focus();
        else if(btns.length>0)btns[0].focus();
      }
    }else if(active===$("searchInput")){
      // From the input, ArrowDown enters the drawer (Left/Right/Up
      // stay with the text caret and returned early above).
      if(e.key==="ArrowDown"){
        const activeTab=document.querySelector(".drawer-tab.active");
        if(activeTab)activeTab.focus();
      }
    }
  }
});

/* ══════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════ */
(async function boot(){
  await loadState();
  applyDisplayPrefs();   // pushes the resolved surface opacity too
  if(!state.aiProvider)state.aiProvider="perplexity";

  if(state.bg)applyBg(state.bg,false);
  else applyTheme(state.theme||"slate");
  applyTextColor();

  scheduleClock();
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)scheduleClock()});
  fetchWeather();setInterval(fetchWeather,1800000);
  renderLinks();

  /* ── Search: click row toggles drawer, focus opens it ── */
  const sec=$("searchSection");
  const input=$("searchInput");

  // Clicking the search row (anywhere outside input) toggles drawer
  document.querySelector(".search-row").addEventListener("click",e=>{
    if(e.target===input||input.contains(e.target)){openDrawer();return}
    toggleDrawer();
    if(isDrawerOpen())input.focus();
  });

  // Mode tag and arrow both toggle drawer directly
  $("modeTag").addEventListener("click",e=>{
    e.stopPropagation();
    toggleDrawer();
    if(isDrawerOpen())input.focus();
  });
  $("searchArrow").addEventListener("click",e=>{
    e.stopPropagation();
    toggleDrawer();
    if(isDrawerOpen())input.focus();
  });
  // Focus the input BEFORE attaching the focus→open listener, so a
  // fresh tab starts focused with the drawer closed. (v1 used the HTML
  // autofocus attribute, which only worked because it happened to fire
  // before the async boot attached this listener.)
  input.focus({preventScroll:true});
  input.addEventListener("focus",openDrawer);
  input.addEventListener("input",tagOnInput);

  // Event delegation for drawer controls — the render functions emit
  // markup only now, so re-renders never churn listeners, and picking
  // an engine in the current mode is a cheap class swap instead of an
  // innerHTML rebuild mid-animation.
  $("drawerTabbar").addEventListener("click",e=>{
    const tab=e.target.closest(".drawer-tab");if(!tab)return;
    e.stopPropagation();
    const mode=tab.dataset.mode;
    if(mode&&mode!==state.mode){state.mode=mode;refreshUI()}
  });
  $("drawerGrid").addEventListener("click",e=>{
    const btn=e.target.closest(".drawer-btn");if(!btn)return;
    e.stopPropagation();
    const kind=btn.dataset.kind,key=btn.dataset.key;
    const modeFor={web:"web",ai:"ai",shop:"shop"}[kind];
    if(modeFor!==state.mode){ // stale grid from another mode — full refresh
      state.mode=modeFor;
      if(kind==="web")state.searchEngine=key;
      else if(kind==="ai")state.aiProvider=key;
      else state.shopSite=key;
      refreshUI();return;
    }
    if(kind==="web")state.searchEngine=key;
    else if(kind==="ai")state.aiProvider=key;
    else state.shopSite=key;
    $("drawerGrid").querySelector(".drawer-btn.active")?.classList.remove("active");
    btn.classList.add("active");
    syncLegacyType();updateModeTag();updatePlaceholder();
    // Web: chip availability (Recent / AI-Free) is engine-dependent.
    // AI + Shop: the hint line names the provider/retailer.
    renderFilterBar();
    saveState();
  });
  $("filterBar").addEventListener("click",e=>{
    const chip=e.target.closest(".filter-chip");if(!chip)return;
    e.stopPropagation();
    if(chip.disabled)return;
    if(chip.id==="aiFreeChip")state.aiFreeOn=!state.aiFreeOn;
    else if(chip.dataset.vertical)state.vertical=chip.dataset.vertical;   // one of
    else if(chip.dataset.refiner)toggleRefiner(chip.dataset.refiner);      // any of
    else return;
    syncLegacyType();renderFilterBar();updatePlaceholder();saveState();
  });

  // Close drawer on outside click.
  // Use pointerdown (not click) so this fires BEFORE the focus
  // event, preventing the click target from receiving focus and
  // re-triggering openDrawer via the input focus listener.
  document.addEventListener("pointerdown",e=>{
    if(isDrawerOpen()&&!sec.contains(e.target)){
      closeDrawer();
    }
  });

  // Form submit
  $("searchForm").addEventListener("submit",e=>{e.preventDefault();submitSearch(input.value.trim())});

  renderDrawer();refreshUI();

  // Settings
  $("settingsToggle").addEventListener("click",openSettings);
  $("settingsClose").addEventListener("click",closeSettings);
  $("settingsBackdrop").addEventListener("click",closeSettings);
})();
