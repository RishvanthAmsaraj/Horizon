/* ════════════════════════════════════════════════
   Horizon Tab — Web Store build (compliant)
   ════════════════════════════════════════════════
   Same premium dashboard and shortcut drawer as the full build, with
   the changes the Chrome Web Store single-purpose policy requires:

   - The search box ALWAYS searches the user's own default engine
     (chrome.search API). Horizon never picks an engine for you.
   - Drawer tiles (AI chats, stores, search engines) are PLAIN LINKS
     that open in a new tab — no query is injected anywhere.
   - Removed for compliance only: query filters/refiners, bangs,
     custom search sources, AI Signal, prompt bridge.

   The full build with all features lives in the Horizon GitHub repo
   as the load-unpacked version. */

const LAT=40.7982,LON=-77.8599;

/* Search engine labels + homepages (tiles only — no query building). */
const WEB_L={google:"Google",duckduckgo:"DuckDuckGo",brave:"Brave",bing:"Bing",startpage:"Startpage",kagi:"Kagi",qwant:"Qwant",searxng:"SearXNG"};
const WEB_HOMES={google:"https://www.google.com",duckduckgo:"https://duckduckgo.com",brave:"https://search.brave.com",bing:"https://www.bing.com",startpage:"https://www.startpage.com",kagi:"https://kagi.com",qwant:"https://www.qwant.com",searxng:"https://searx.be"};
const WEB_ORDER=["google","duckduckgo","brave","bing","startpage","kagi","qwant","searxng"];

/* AI chat providers — tiles open the chat in a new tab. */
const AI_L={perplexity:"Perplexity",grok:"Grok",gemini:"Gemini",chatgpt:"ChatGPT",claude:"Claude",deepseek:"DeepSeek"};
const AI_HOMES={perplexity:"https://www.perplexity.ai",grok:"https://grok.com",gemini:"https://gemini.google.com",chatgpt:"https://chatgpt.com",claude:"https://claude.ai",deepseek:"https://chat.deepseek.com"};
const AI_ORDER=["perplexity","grok","gemini","chatgpt","claude","deepseek"];

/* ── SVG Logo Icons ── */
const LOGOS={
  google:`<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1.1 2.5-2.3 3.3v2.7h3.7c2.2-2 3.4-5 3.4-8z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.7-2.7c-1 .7-2.3 1.1-3.5 1.1-2.7 0-5-1.8-5.9-4.3H2.3v2.7C4.1 20.5 7.8 23 12 23z"/><path fill="#FBBC05" d="M6.1 14.5c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V7.7H2.3C1.5 9.1 1 10.5 1 12s.5 2.9 1.3 4.3l3.8-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.5 2.3 7.7l3.8 2.8c.9-2.5 3.2-4.3 5.9-4.3z"/></svg>`,
  duckduckgo:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#DE5833"/><path fill="#FFF" d="M7 10.5c0-.7.6-1.3 1.3-1.3s1.3.6 1.3 1.3v.6c.4-.3.9-.5 1.4-.5h.5c.3 0 .5.2.5.5s-.2.5-.5.5h-.5c-.8 0-1.4.6-1.4 1.4v1.3c0 .9-.5 1.7-1.3 2-.3.1-.6.2-.9.2-.8 0-1.5-.4-1.9-1-.4-.6-.5-1.4-.3-2.1.2-.7.7-1.2 1.4-1.5.1 0 .2-.1.3-.1v-1.3zm9 0c0-.7.6-1.3 1.3-1.3s1.3.6 1.3 1.3v1.3c.1 0 .2.1.3.1.7.3 1.2.8 1.4 1.5.2.7.1 1.5-.3 2.1-.4.6-1.1 1-1.9 1-.3 0-.6-.1-.9-.2-.8-.3-1.3-1.1-1.3-2v-1.3c0-.8-.6-1.4-1.4-1.4h-.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h.5c.5 0 1 .2 1.4.5v-.6z"/><path fill="#FFF" d="M9.5 14.5c-.3.3-.6.5-1 .6-.4.1-.8 0-1.1-.3-.3-.3-.4-.7-.3-1.1.1-.4.4-.7.8-.8.4-.1.9 0 1.2.3.3.3.5.7.4 1.3z"/></svg>`,
  brave:`<svg viewBox="0 0 24 24"><path fill="#FB542B" d="M12 1.5L3 5.4v6.5c0 5.6 4 9.7 9 10.6 5-.9 9-5 9-10.6V5.4L12 1.5z"/><path fill="#FFF" d="M12 4.5L6.7 7.1l.9 4.4L12 14l4.4-2.5.9-4.4L12 4.5z"/><path fill="#FB542B" d="M9.2 13l2.8 1.6 2.8-1.6L12 16.2 9.2 13z"/></svg>`,
  bing:`<svg viewBox="0 0 24 24"><path fill="#008373" d="M3 3l9 2.2v15.6L3 18.5V3z"/><path fill="#0066CC" d="M12 5.2l9-2.2v15.6l-9 2.4V5.2z"/><path fill="#FFF" d="M14.5 9.8c1.6-.5 3.2.3 3.6 1.8.4 1.5-.5 3-2.1 3.5l-2.4.7-1.5-1.4 2.4-.6zm-3 4.7l1.5 1.4-1.2.4-1.8-.4 1.5-1.4z" opacity=".95"/></svg>`,
  startpage:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#7B68EE"/><circle cx="12" cy="12" r="7" fill="none" stroke="#FFF" stroke-width="1.5"/><circle cx="12" cy="12" r="4.2" fill="#FFF"/><circle cx="12" cy="12" r="2" fill="#7B68EE"/></svg>`,
  kagi:`<svg viewBox="0 0 24 24"><path fill="#FFB300" d="M12 1.5L3 5.4v6.4c0 5.4 4.1 9.4 9 10.2 4.9-.8 9-4.8 9-10.2V5.4L12 1.5z"/><path fill="#FFF" d="M8.5 7h2v4.2L14.5 7h2.5l-4.5 5 4.8 5h-2.6L10.5 12.4V17h-2V7z"/></svg>`,
  qwant:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4CC2FF"/><path fill="#FF596A" d="M12 16.5s-4.5-2.7-4.5-6.2c0-1.8 1.4-3.3 3.2-3.3 1 0 1.9.5 2.3 1.3.4-.8 1.3-1.3 2.3-1.3 1.8 0 3.2 1.5 3.2 3.3 0 3.5-4.5 6.2-4.5 6.2z"/></svg>`,
  searxng:`<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5" fill="#3056D3"/><path fill="#FFF" d="M7 8.5h7v1.6H7zm0 3h7v1.6H7zm0 3h4.5v1.6H7z"/><circle cx="17" cy="15" r="2.6" fill="none" stroke="#F3C623" stroke-width="1.6"/><path stroke="#F3C623" stroke-width="1.6" stroke-linecap="round" d="M19 17l2 2"/></svg>`,
  perplexity:`<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="3.5" fill="#1F1F1F"/><path fill="none" stroke="#20808D" stroke-width="2" stroke-linecap="round" d="M5 8l3.5 4-3.5 4M19 8l-3.5 4 3.5 4M9.5 17l5-10"/></svg>`,
  grok:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000"/><path stroke="#FFF" stroke-width="3.2" stroke-linecap="round" d="M16 7.5L8 16.5"/></svg>`,
  gemini:`<svg viewBox="0 0 24 24"><defs><linearGradient id="gG" x1="0" x2="1"><stop offset="0" stop-color="#4796E3"/><stop offset="1" stop-color="#9177C7"/></linearGradient></defs><path fill="url(#gG)" d="M12 2l1.8 8.2L22 12l-8.2 1.8L12 22l-1.8-8.2L2 12l8.2-1.8L12 2z"/></svg>`,
  chatgpt:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#10A37F"/><path fill="#FFF" d="M15.4 8.6c.5-1.3.1-2.7-1-3.4-1.1-.8-2.6-.7-3.6.2-1-.9-2.5-1-3.6-.2-1.1.7-1.5 2.1-1 3.4-1.3.5-2 1.7-1.8 3 .2 1.3 1.2 2.3 2.5 2.5.2 1.3 1.2 2.3 2.5 2.5.5 0 1-.1 1.5-.3.5.2 1 .3 1.5.3 1.3-.2 2.3-1.2 2.5-2.5 1.3-.2 2.3-1.2 2.5-2.5.2-1.3-.5-2.5-1.8-3zm-3.4 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`,
  claude:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#D97757"/><path fill="#FFF" d="M16.4 8.5c-.6-.9-1.6-1.5-2.7-1.5H11c-.4 0-.8.1-1.1.3-.3-.5-.9-.8-1.5-.8-1 0-1.8.8-1.8 1.8 0 .4.1.7.3 1-.6.6-1 1.5-1 2.4 0 1.9 1.5 3.4 3.4 3.4.6 0 1.2-.2 1.7-.5.5.3 1.1.5 1.7.5 1.9 0 3.4-1.5 3.4-3.4 0-1.4-.8-2.5-2-3 .4-.1.6-.4.6-.7 0-.3-.1-.5-.3-.5zm-5.9 5.5c-.7 0-1.3-.6-1.3-1.3 0-.4.2-.7.4-.9.2.1.5.2.8.2.1.3.2.5.4.7-.1.7-.3 1.3-.3 1.3zm3.2-2c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z"/></svg>`,
  deepseek:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#4D6BFE"/><path fill="#FFF" d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-1 4h2v6h-2V8zm0 7h2v2h-2v-2z"/></svg>`
};

/* ── Stores — lettermark tiles (deliberately not imitation brand logos) ── */
const SHOP={
  amazon:{label:"Amazon",home:"https://www.amazon.com",mark:"a",color:"#FF9900"},
  ebay:{label:"eBay",home:"https://www.ebay.com",mark:"e",color:"#E53238"},
  walmart:{label:"Walmart",home:"https://www.walmart.com",mark:"W",color:"#0071DC"},
  target:{label:"Target",home:"https://www.target.com",mark:"T",color:"#CC0000"},
  bestbuy:{label:"Best Buy",home:"https://www.bestbuy.com",mark:"B",color:"#0046BE"},
  costco:{label:"Costco",home:"https://www.costco.com",mark:"C",color:"#E32224"},
  homedepot:{label:"Home Depot",home:"https://www.homedepot.com",mark:"H",color:"#F96302"},
  lowes:{label:"Lowe's",home:"https://www.lowes.com",mark:"L",color:"#004990"},
  etsy:{label:"Etsy",home:"https://www.etsy.com",mark:"E",color:"#F1641E"},
  newegg:{label:"Newegg",home:"https://www.newegg.com",mark:"N",color:"#0070CD"},
  bhphoto:{label:"B&H",home:"https://www.bhphotovideo.com",mark:"B",color:"#0A2240"},
  ikea:{label:"IKEA",home:"https://www.ikea.com",mark:"I",color:"#0058A3"},
  wayfair:{label:"Wayfair",home:"https://www.wayfair.com",mark:"W",color:"#7F187F"},
  aliexpress:{label:"AliExpress",home:"https://www.aliexpress.com",mark:"A",color:"#E62E04"}
};
const SHOP_ORDER=["amazon","ebay","walmart","target","bestbuy","costco","homedepot","lowes","etsy","newegg","bhphoto","ikea","wayfair","aliexpress"];
function markLogo(mark,color){
  return `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5.5" fill="${color}"/><text x="12" y="16.6" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${esc(mark)}</text></svg>`;
}
function shopLogo(key){
  const s=SHOP[key];if(!s)return LOGOS.google;
  return markLogo(s.mark,s.color);
}

/* Mode-tag icons per drawer tab — inline SVG, never emoji. */
const TAB_ICONS={
  web:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  ai:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3z"/></svg>`,
  shop:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`
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
  theme:"slate",mode:"web",links:DL,showLinks:true,glassOpacity:0.04,
  customBg:"#0d0d0d",customAccent:"#7a8a9a",customLight:false,
  weatherLat:null,weatherLon:null,
  weatherUnit:"auto",weatherPlace:"",uiScale:1,textHalo:false,contrastMode:"auto",scrim:0,
  bgBlur:0,bgDim:null,bgDark:true,bgText:"auto",
  textColor:null
};
let state={...DS},linkId=100;

/* ── Cached element lookups ── */
const STATIC_IDS=new Set(["bgLayer","ambient","greeting","time","date","weather","weatherIcon","weatherTemp","weatherDesc","weatherHiLo","searchSection","searchForm","searchInput","searchArrow","modeTag","searchBody","searchDrawer","drawerTabbar","drawerGrid","drawerFooter","filterBar","aiModeHint","links","settingsToggle","settingsBackdrop","settingsPanel","settingsTitle","settingsBody","settingsClose","bgUpload"]);
const _elCache={};
function $(id){
  if(!STATIC_IDS.has(id))return document.getElementById(id);
  return _elCache[id]||(_elCache[id]=document.getElementById(id));
}

/* ── Security helpers ── */
function esc(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function safeHref(u){
  const raw=String(u||"").trim();
  try{const p=new URL(raw);if(p.protocol==="http:"||p.protocol==="https:")return p.href}catch{}
  try{const p=new URL("https://"+raw.replace(/^\/+/,""));if(p.hostname.includes("."))return p.href}catch{}
  return "#";
}

/* ── Storage ── */
const SYS="hz",BG_KEY="***";
const KNOWN_KEYS=["theme","mode","links","showLinks","glassOpacity","customBg","customAccent","customLight",
  "weatherLat","weatherLon","weatherUnit","weatherPlace","uiScale","textHalo","contrastMode","scrim",
  "bgBlur","bgDim","bgDark","bgText","textColor"];
let extraState={};      // keys owned by the full build — preserved verbatim on save
let lastSavedJSON="";
let lastSavedBG=null;
let saveTimer=null;

async function loadState(){
  try{
    const s=await chrome.storage.sync.get([SYS]);
    if(s[SYS]){
      state={...DS,...s[SYS],links:s[SYS].links||DL};
      for(const k of Object.keys(s[SYS]))if(!KNOWN_KEYS.includes(k))extraState[k]=s[SYS][k];
    }
  }catch{try{const s=localStorage.getItem(SYS);if(s)state={...DS,...JSON.parse(s),links:JSON.parse(s).links||DL}}catch{}}
  try{
    const b=await chrome.storage.local.get([BG_KEY]);
    if(b[BG_KEY])state.bg=b[BG_KEY];
  }catch{try{const b=localStorage.getItem(BG_KEY);if(b)state.bg=b}catch{}}
  if(state.mode!=="web"&&state.mode!=="ai"&&state.mode!=="shop")state.mode="web";
  lastSavedBG=state.bg||null;
  lastSavedJSON=JSON.stringify(snapshotState());
}
function snapshotState(){
  const o={...extraState};
  for(const k of KNOWN_KEYS)o[k]=state[k];
  return o;
}
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
window.addEventListener("pagehide",()=>{if(saveTimer)saveStateNow()});

/* ── Clock ── */
function greet(){return["good morning","good afternoon","good evening","good night"][Math.min(Math.floor(new Date().getHours()/6),3)]}
function updateClock(){
  const n=new Date();
  $("time").textContent=`${n.getHours()%12||12}:${String(n.getMinutes()).padStart(2,"0")} ${n.getHours()>=12?"PM":"AM"}`;
  $("greeting").textContent=greet();
  $("date").textContent=n.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  if(state.theme==="modern"&&!state.bg)swModern();
}
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
   Replaces api.weather.gov, which only covers the United States.
   Open-Meteo is free, keyless, CORS-enabled and global, and its
   companion geocoding endpoint turns a typed city name into
   coordinates so nobody has to look up their own latitude.
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
   the background. 8 s abort per attempt so a slow API never hangs the
   badge; one retry absorbs a transient network blip. */
async function fetchWeather(){
  const[lat,lon]=weatherCoords(),unit=weatherUnit();
  let cached=null;
  try{const c=await chrome.storage.local.get([WEATHER_KEY]);cached=c[WEATHER_KEY]}catch{}
  if(cached&&cached.lat===lat&&cached.lon===lon&&cached.unit===unit&&cached.d){
    renderWeather(cached.d);
    if(Date.now()-cached.t<WEATHER_TTL)return;
  }
  for(let attempt=0;attempt<2;attempt++){
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
      try{const pr=chrome.storage.local.set({[WEATHER_KEY]:{t:Date.now(),lat,lon,unit,d:data}});if(pr&&pr.catch)pr.catch(()=>{})}catch{}
      return;
    }catch(err){
      if(attempt===0){await new Promise(r=>setTimeout(r,1200));continue}
      if(!cached)$("weatherDesc").textContent="unavailable";
    }
  }
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
    const dark=state.bgText==="white"?true:state.bgText==="black"?false:(center<=.55);
    state.bgDark=dark;
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
   SHORTCUT DRAWER — Web / AI Chat / Shop sections.
   Every tile is a PLAIN LINK that opens its site in a new
   tab. No query is ever injected; the search box above
   always uses the browser's default search engine.
   ══════════════════════════════════════════════════ */
function isAI(){return state.mode==="ai"}
function isShop(){return state.mode==="shop"}
function svgIcon(key){
  if(LOGOS[key])return LOGOS[key];
  if(SHOP[key])return shopLogo(key);
  return LOGOS.google;
}

function updateModeTag(){
  const tag=$("modeTag");
  const m=state.mode||"web";
  const icon=m==="ai"?TAB_ICONS.ai:m==="shop"?TAB_ICONS.shop:TAB_ICONS.web;
  const label=m==="ai"?"AI Chat":m==="shop"?"Shop":"Web Search";
  tag.innerHTML=icon+' <span class="mode-label">'+label+'</span>';
}
function tagOnInput(){
  const i=$("searchInput");
  $("modeTag").classList.toggle("compact",i.value.length>0);
}

function isDrawerOpen(){return $("searchSection").classList.contains("open")}
function openDrawer(){
  $("searchSection").classList.add("open");
}
function closeDrawer(){
  const sec=$("searchSection");
  sec.classList.remove("open");
  sec.style.marginBottom="";
}
function toggleDrawer(){isDrawerOpen()?closeDrawer():openDrawer()}

function renderTabs(){
  const m=state.mode||"web";
  const tab=(k,l)=>`<button class="drawer-tab${m===k?" active":""}" data-mode="${k}">${l}</button>`;
  $("drawerTabbar").innerHTML=tab("web","Web Search")+tab("ai","AI Chat")+tab("shop","Shop");
}

function renderDrawer(){
  renderTabs();
  const grid=$("drawerGrid");
  const ai=isAI(),shop=isShop();
  let items;
  if(ai)items=AI_ORDER.map(k=>[k,AI_L[k],"ai"]);
  else if(shop)items=SHOP_ORDER.map(k=>[k,SHOP[k].label,"shop"]);
  else items=WEB_ORDER.map(k=>[k,WEB_L[k],"web"]);
  grid.classList.toggle("ai-grid",ai);
  grid.classList.toggle("shop-grid",shop);
  grid.innerHTML=items.map(([key,label,kind])=>{
    const home=kind==="ai"?AI_HOMES[key]:kind==="shop"?SHOP[key].home:WEB_HOMES[key];
    return `<a class="drawer-btn" data-kind="${kind}" data-key="${key}" href="${esc(home)}" target="_blank" rel="noopener noreferrer" title="${esc(label)} — opens in a new tab"><span class="db-svg">${svgIcon(key)}</span><span class="db-name">${esc(label)}</span></a>`;
  }).join("");
}

/* Hint line under the grid — per-tab, honest about what clicking does. */
function renderHint(){
  const hint=$("aiModeHint");
  if(isAI()){hint.textContent="Opens the chat in a new tab — your query stays where you type it.";hint.classList.add("active");return}
  if(isShop()){hint.textContent="Opens the store in a new tab — no query is sent.";hint.classList.add("active");return}
  hint.textContent="Searches run through your browser's default search engine. These tiles just open their sites in a new tab.";
  hint.classList.add("active");
}

function updatePlaceholder(){
  $("searchInput").placeholder="Search with your default engine...";
}

function refreshUI(){
  updateModeTag();renderDrawer();renderHint();updatePlaceholder();saveState();
}

/* ── Search: the user's default engine, always ── */
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
function submitSearch(q){
  if(!q)return;
  const nav=navURL(q);
  if(nav){window.location.href=nav;return}
  /* Always the user's default search provider (Chrome Search API).
     Horizon never decides which engine runs the query — this is the
     single-purpose compliance point for the Web Store build. */
  try{
    if(chrome.search&&chrome.search.query){
      chrome.search.query({text:q,disposition:"NEW_TAB"});
      return;
    }
  }catch{}
  // Non-Chrome fallback (Firefox has no chrome.search).
  window.location.href="https://www.google.com/search?q="+encodeURIComponent(q);
}

/* ══════════════════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════════════════ */
function openSettings(){$("settingsPanel").classList.add("open");$("settingsBackdrop").classList.add("open");renderSettings()}
function closeSettings(){$("settingsPanel").classList.remove("open");$("settingsBackdrop").classList.remove("open")}

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
      <label class="settings-label">Search & Shortcuts</label>
      <p class="settings-hint">Searches run through your browser's own default search engine — whatever you picked in Chrome settings. The shortcut drawer below the search box (Web, AI Chat, Shop) contains plain links that open in a new tab. Type a URL to navigate instead of searching.</p>
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
  document.querySelectorAll("#customLinksRendered .link-editor").forEach(ed=>{const idx=parseInt(ed.dataset.idx);const save=()=>{
    const newUrl=ed.querySelector(".le-url").value.trim()||"https://example.com";
    const newImg=ed.querySelector(".le-img").value.trim();
    let image=newImg;
    if(!image){
      try{image=`https://www.google.com/s2/favicons?domain=${new URL(safeHref(newUrl)).hostname}&sz=64`}catch{image=""}
    }
    state.links[idx]={...state.links[idx],emoji:ed.querySelector(".le-emoji").value||"🌐",label:ed.querySelector(".le-label").value||"Link",url:newUrl,image};
    saveState();renderLinks()
  };ed.querySelector(".le-emoji")?.addEventListener("input",save);ed.querySelector(".le-label")?.addEventListener("input",save);ed.querySelector(".le-url")?.addEventListener("input",save);ed.querySelector(".le-img")?.addEventListener("input",save);ed.querySelector(".link-remove")?.addEventListener("click",()=>{state.links.splice(idx,1);saveState();renderLinks();renderSettings()})});
  $("toggleLinksBtn")?.addEventListener("click",()=>{state.showLinks=!state.showLinks;saveState();renderLinks();renderSettings()});
  $("addLinkBtn")?.addEventListener("click",()=>{const newUrl = "https://example.com"; const newDomain = (new URL(newUrl)).hostname; state.links.push({id:`lc${linkId++}`,label:"New Link",url:newUrl,emoji:"",image:`https://www.google.com/s2/favicons?domain=${newDomain}&sz=64`});saveState();renderLinks();renderSettings();$("settingsPanel").scrollTop=$("settingsPanel").scrollHeight});
  $("uploadBgBtn")?.addEventListener("click",()=>$("bgUpload").click());
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
  document.querySelectorAll("#settingsBody [data-bgtext]").forEach(b=>b.addEventListener("click",()=>{
    state.bgText=b.dataset.bgtext;
    if(state.bg)applyBg(state.bg,true);
    saveState();renderSettings();
  }));
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
    if(document.activeElement===$("searchInput")&&e.key!=="ArrowDown")return;
    e.preventDefault();
    const btns=[...document.querySelectorAll(".drawer-btn")];
    const tabs=[...document.querySelectorAll(".drawer-tab")];
    const active=document.activeElement;
    const activeIdx=btns.indexOf(active);
    const tabIdx=tabs.indexOf(active);

    if(active&&activeIdx>=0){
      const perRow=Math.max(1,Math.floor((document.querySelector(":root").offsetWidth-80)/145));
      const col=activeIdx%perRow;
      const isFirstCol=col===0;
      const isLastCol=col===perRow-1||activeIdx===btns.length-1;
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
          const activeTab2=document.querySelector(".drawer-tab.active");
          if(activeTab2)activeTab2.focus();
        }
      }
    }else if(active&&tabIdx>=0){
      if(e.key==="ArrowRight"&&tabIdx<tabs.length-1){
        tabs[tabIdx+1].click();
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
        const tab=active.dataset.mode;
        const firstBtn=btns.find(b=>b.dataset.kind===tab);
        if(firstBtn)firstBtn.focus();
        else if(btns.length>0)btns[0].focus();
      }
    }else if(active===$("searchInput")){
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

  document.querySelector(".search-row").addEventListener("click",e=>{
    if(e.target===input||input.contains(e.target)){openDrawer();return}
    toggleDrawer();
    if(isDrawerOpen())input.focus();
  });

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
  input.focus({preventScroll:true});
  input.addEventListener("focus",openDrawer);
  input.addEventListener("input",tagOnInput);

  // Tabs switch which shortcut section the drawer shows.
  $("drawerTabbar").addEventListener("click",e=>{
    const tab=e.target.closest(".drawer-tab");if(!tab)return;
    e.stopPropagation();
    const mode=tab.dataset.mode;
    if(mode&&mode!==state.mode){state.mode=mode;refreshUI()}
  });

  // Close drawer on outside click.
  document.addEventListener("pointerdown",e=>{
    if(isDrawerOpen()&&!sec.contains(e.target)){
      closeDrawer();
    }
  });

  // Form submit — always the browser's default search engine.
  $("searchForm").addEventListener("submit",e=>{e.preventDefault();submitSearch(input.value.trim())});

  renderDrawer();refreshUI();

  // Settings
  $("settingsToggle").addEventListener("click",openSettings);
  $("settingsClose").addEventListener("click",closeSettings);
  $("settingsBackdrop").addEventListener("click",closeSettings);
})();
