/* =========================================================
   فلك ٣٦٠ — منطق التطبيق
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { icon, logoMark, orbitRing, scoreColor, rankColor } from "./icons.js";

const SUPABASE_URL = "https://dpkvkwcofxeptpzdsjre.supabase.co";
const SUPABASE_KEY = "sb_publishable_Krja6qX-HGdklghDfTJmjQ_XpmIgBPe";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let currentBiz = null, currentBizData = null, currentKw = null, userLoc = null;
let TX = {};
const T = (k, fb) => TX[k] ?? fb;
const shown = (k) => TX[k] !== "off";

async function loadTexts() {
  try {
    const cached = sessionStorage.getItem("falakTexts");
    if (cached) TX = JSON.parse(cached);
  } catch { /* */ }
  applyTexts();
  try {
    const { data } = await sb.rpc("site_texts");
    if (data?.t) {
      TX = data.t;
      applyTexts();
      try { sessionStorage.setItem("falakTexts", JSON.stringify(TX)); } catch { /* */ }
    }
  } catch { /* تبقى النصوص الأصلية */ }
}
function applyTexts() {
  document.querySelectorAll("[data-c]").forEach((el) => {
    const v = TX[el.dataset.c];
    if (v) el.textContent = v;
  });
}
let map, layer, locMap, locLayer, locPick = null;
let buyTarget = null;

/* ---------------- رسائل ---------------- */
function msg(el, kind, text) {
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}
function clearMsg(el) { el.className = "msg"; el.innerHTML = ""; }

// رسالة مفهومة للعميل بلا تفاصيل تقنية ولا أسماء مزوّدين
function friendly(e) {
  const m = String(e?.message ?? e ?? "");
  if (/Invalid login credentials/i.test(m)) return "البريد أو كلمة المرور غير صحيحة.";
  if (/already registered|already been registered/i.test(m)) return "هذا البريد مسجّل لدينا — سجّل الدخول.";
  if (/Password should be|at least 6|weak/i.test(m)) return "كلمة المرور قصيرة — ٦ أحرف على الأقل.";
  if (/rate limit|too many/i.test(m)) return "محاولات كثيرة — انتظر دقيقة ثم حاول.";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "تعذّر الاتصال — تحقق من الشبكة وحاول مجدداً.";
  const arabic = /[\u0600-\u06FF]/.test(m);
  const technical = /HTTP|Claude|DataForSEO|JWT|supabase|fetch|timeout|status|undefined|null|\{|\}/i.test(m);
  if (arabic && !technical) return m;
  return T("msg.error", "تعذّر إكمال العملية الآن — حاول بعد قليل.");
}

function busy(btn, on, label) {
  if (on) {
    btn.dataset.label = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>${esc(label || "جارٍ العمل")}`;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || label || "";
  }
}

function emptyState(el, iconName, title, body, actionLabel, actionScreen) {
  el.innerHTML = `<div class="empty">
    ${icon(iconName, 34)}
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${actionLabel ? `<button class="btn" data-goto="${actionScreen}">${esc(actionLabel)}</button>` : ""}
  </div>`;
  el.querySelectorAll("[data-goto]").forEach((b) => b.onclick = () => showScreen(b.dataset.goto));
}

const timeAgo = (iso) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "أمس" : `قبل ${days} يوماً`;
};

const fmtH = (h) => h === 0 ? "12ص" : h < 12 ? `${h}ص` : h === 12 ? "12م" : `${h - 12}م`;

/* ---------------- التنقّل: مجموعات + بار سفلي ---------------- */
const NAV = [
  { key: "my", icon: "building", label: ["nav.my", "محلي"], items: [
    { id: "overview", icon: "compass", label: ["tab.overview", "نظرة عامة"] },
    { id: "rank", icon: "map-pin", label: ["tab.rank", "الترتيب"], show: "show.rank" },
    { id: "profile", icon: "clipboard-check", label: ["tab.profile", "الملف التجاري"], show: "show.profile" },
    { id: "reviews", icon: "message-square", label: ["tab.reviews", "المراجعات"], show: "show.reviews" },
    { id: "rivals", icon: "users", label: ["tab.rivals", "المنافسون"], show: "show.rivals" },
  ] },
  { key: "suppliers", icon: "shopping-cart", label: ["nav.suppliers", "الموردون"], items: [
    { id: "suppliers", icon: "shopping-cart", label: ["tab.suppliers", "موردون لنشاطك"], show: "show.suppliers" },
  ] },
  { key: "studies", icon: "telescope", label: ["nav.studies", "الدراسات"], items: [
    { id: "site", icon: "telescope", label: ["tab.site", "موقع مشروع"], show: "show.site" },
    { id: "buy", icon: "briefcase", label: ["tab.buy", "محل معروض للبيع"], show: "show.buy" },
  ] },
  { key: "account", icon: "banknote", label: ["nav.account", "حسابي"], items: [
    { id: "account", icon: "banknote", label: ["tab.account", "اشتراكي"] },
  ] },
];
let currentScreen = "overview";

const groupItems = (g) => g.items.filter((it) => !it.show || shown(it.show));
const liveGroups = () => NAV.filter((g) => groupItems(g).length);
const groupOf = (id) => liveGroups().find((g) => groupItems(g).some((it) => it.id === id));

function renderNav() {
  const groups = liveGroups();
  const cur = groupOf(currentScreen) || groups[0];

  $("navbar").innerHTML = groups.map((g) => `
    <button type="button" class="navbtn ${g === cur ? "on" : ""}" data-group="${g.key}">
      ${icon(g.icon, 21)}<span>${esc(T(...g.label))}</span>
    </button>`).join("");
  $("navbar").querySelectorAll("[data-group]").forEach((b) =>
    b.onclick = () => openGroup(b.dataset.group));

  $("rail").innerHTML = groups.map((g) => `
    <div class="rail-g">
      <b>${icon(g.icon, 16)}${esc(T(...g.label))}</b>
      ${groupItems(g).map((it) => `
        <a role="button" tabindex="0" class="${it.id === currentScreen ? "on" : ""}" data-screen="${it.id}">
          ${esc(T(...it.label))}</a>`).join("")}
    </div>`).join("");
  $("rail").querySelectorAll("[data-screen]").forEach((a) => {
    a.onclick = () => showScreen(a.dataset.screen);
    a.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showScreen(a.dataset.screen); } };
  });

  const items = cur ? groupItems(cur) : [];
  const tabs = $("tabs");
  tabs.innerHTML = items.length > 1 ? items.map((it) => `
    <button class="tab ${it.id === currentScreen ? "active" : ""}" data-screen="${it.id}">
      ${icon(it.icon, 17)}${esc(T(...it.label))}</button>`).join("") : "";
  tabs.style.display = items.length > 1 ? "" : "none";
  tabs.querySelectorAll(".tab").forEach((t) => t.onclick = () => showScreen(t.dataset.screen));
}

function openGroup(key) {
  const g = liveGroups().find((x) => x.key === key);
  if (!g) return;
  const items = groupItems(g);
  const stay = items.some((it) => it.id === currentScreen);
  showScreen(stay ? currentScreen : items[0].id);
}

function showScreen(name) {
  currentScreen = name;
  if (name === "account") {
    renderNav();
    if (window.falakAccount?.open) return window.falakAccount.open();
  }
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const el = $(`screen-${name}`);
  if (el) el.classList.add("active");
  renderNav();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (name === "rank") {
    initMap();
    requestAnimationFrame(() => setTimeout(() => map && map.invalidateSize(), 80));
  }
  if (name === "site") {
    initLocMap();
    requestAnimationFrame(() => setTimeout(() => locMap && locMap.invalidateSize(), 80));
  }
  if (name === "suppliers") loadSuppliers();
}
// account.js يبدّل الشاشات بنفسه — نراقب شاشته لنبقى متزامنين
function watchAccountScreen() {
  const tryWatch = () => {
    const el = $("screen-account");
    if (!el) return false;
    new MutationObserver(() => {
      if (el.classList.contains("active") && currentScreen !== "account") { currentScreen = "account"; renderNav(); }
    }).observe(el, { attributes: true, attributeFilter: ["class"] });
    return true;
  };
  if (!tryWatch()) setTimeout(tryWatch, 1500);
}

function initChrome() {
  $("authLogo").innerHTML = logoMark(44);
  $("headerLogo").innerHTML = logoMark(30);
  renderNav();
  watchAccountScreen();
}

/* ---------------- المصادقة ---------------- */
$("loginBtn").onclick = async () => {
  clearMsg($("authMsg"));
  const btn = $("loginBtn");
  busy(btn, true, "جارٍ الدخول");
  const { error } = await sb.auth.signInWithPassword({
    email: $("email").value.trim(), password: $("password").value,
  });
  busy(btn, false, "دخول");
  if (error) return msg($("authMsg"), "error", friendly(error));
  boot();
};

$("signupBtn").onclick = async () => {
  clearMsg($("authMsg"));
  const btn = $("signupBtn");
  busy(btn, true, "جارٍ الإنشاء");
  const { error } = await sb.auth.signUp({
    email: $("email").value.trim(), password: $("password").value,
  });
  busy(btn, false, "إنشاء حساب جديد");
  if (error) return msg($("authMsg"), "error", friendly(error));
  msg($("authMsg"), "done", "تم إنشاء الحساب. سجّل الدخول الآن.");
};

$("logoutBtn").onclick = async () => { await sb.auth.signOut(); location.reload(); };

/* ---------------- الخرائط ---------------- */
function baseLayer() {
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap", maxZoom: 19 });
}

function initMap() {
  if (map) return;
  if (!$("map")) return;
  map = L.map("map", { scrollWheelZoom: false })
    .setView(userLoc ? [userLoc.lat, userLoc.lng] : [24.7136, 46.6753], 13);
  baseLayer().addTo(map);
  layer = L.layerGroup().addTo(map);
}

function initLocMap() {
  if (locMap) return;
  if (!$("locMap")) return;
  locMap = L.map("locMap", { scrollWheelZoom: false })
    .setView(userLoc ? [userLoc.lat, userLoc.lng] : [24.7136, 46.6753], userLoc ? 14 : 12);
  baseLayer().addTo(locMap);
  locLayer = L.layerGroup().addTo(locMap);
  locMap.on("click", (e) => setPick(e.latlng.lat, e.latlng.lng, false));
}

function setPick(lat, lng, fly = true, zoom = 16) {
  locPick = { lat, lng };
  drawPick();
  $("locBtn").disabled = false;
  if (fly && locMap) locMap.setView([lat, lng], zoom);
}

function drawPick() {
  if (!locLayer) return;
  locLayer.clearLayers();
  L.marker([locPick.lat, locPick.lng], { icon: mePin() }).addTo(locLayer);
  L.circle([locPick.lat, locPick.lng], {
    radius: +$("locRadius").value, color: "#263A63", weight: 1, fillOpacity: .07,
  }).addTo(locLayer);
}
$("locRadius").onchange = () => { if (locPick) drawPick(); };

function locateUser() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (map && !currentBiz) map.setView([userLoc.lat, userLoc.lng], 14);
      if (locMap && !locPick) locMap.setView([userLoc.lat, userLoc.lng], 14);
    },
    () => {}, { enableHighAccuracy: true, timeout: 8000 },
  );
}

function rankPin(rank) {
  const size = rank == null ? 26 : rank <= 3 ? 38 : rank <= 6 ? 34 : rank <= 10 ? 31 : 28;
  const inner = rank == null
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>`
    : rank;
  const cls = rank == null ? "rank-pin gone" : "rank-pin";
  const bg = rank == null ? "" : `background:${rankColor(rank)};`;
  const fs = rank == null ? "" : `font-size:${size >= 34 ? 14 : 12.5}px;`;
  return L.divIcon({
    className: "",
    html: `<div class="${cls}" style="${bg}${fs}">${inner}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}
function mePin() {
  return L.divIcon({
    className: "",
    html: `<div class="me-pin">${icon("crosshair", 15)}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
  });
}

/* ---------------- المحلات ---------------- */
async function loadBusinesses() {
  const { data } = await sb.from("businesses").select("*").order("created_at");
  const sel = $("bizSelect");
  sel.innerHTML = `<option value="">— اختر محلاً أو ابحث عن جديد —</option>`;
  (data || []).forEach((b) => {
    const o = document.createElement("option");
    o.value = b.id; o.textContent = b.name;
    sel.appendChild(o);
  });
  return data || [];
}

function resetResults() {
  ["scanResult", "auditResult", "revResult", "compResult", "planResult"].forEach((id) => {
    const el = $(id); if (el) el.className = "hidden";
  });
  ["scanMsg", "auditMsg", "revMsg", "compMsg", "watchMsg", "planMsg"].forEach((id) => {
    const el = $(id); if (el) clearMsg(el);
  });
  const sp = $("spread"); if (sp) sp.className = "spread hidden";
  const dg = $("diagnose"); if (dg) dg.className = "diagnose hidden";
  ["watchEvents", "watchList", "ovAlerts"].forEach((id) => {
    const el = $(id); if (el) el.innerHTML = "";
  });
  $("watchTime").textContent = "لم تبدأ المراقبة بعد";
  $("ovAlertsBox").className = "hidden";
  if (layer) layer.clearLayers();
}

$("bizSelect").onchange = async (e) => {
  currentBiz = e.target.value || null;
  currentKw = null;
  resetResults();
  $("addBizWrap").className = currentBiz ? "sp-t hidden" : "sp-t";
  if (!currentBiz) { currentBizData = null; $("bizSummary").className = "hidden"; }
  else {
    const { data } = await sb.from("businesses").select("*").eq("id", currentBiz).single();
    currentBizData = data;
    await renderOverview();
    await loadKeywords();
    await loadAlerts();
    await loadLastWatch();
  }
  refreshGates();
  supCache = null;
  if (currentScreen === "suppliers") loadSuppliers();
  await loadHistory();
};

async function renderOverview() {
  const b = currentBizData;
  if (!b) return;
  const [{ count: kwCount }, { count: scanCount }] = await Promise.all([
    sb.from("keywords").select("*", { count: "exact", head: true }).eq("business_id", b.id),
    sb.from("scans").select("*", { count: "exact", head: true }).eq("business_id", b.id).eq("status", "completed"),
  ]);

  const rate = b.google_rating ?? null;
  const pct = rate ? Math.round((rate / 5) * 100) : null;
  $("ovRing").innerHTML = orbitRing(rate ?? "—", 5, scoreColor(pct), 96, "من 5", "sm");
  $("ovName").textContent = b.name;
  $("ovMeta").textContent = [b.category, b.address].filter(Boolean).join(" · ") || "—";
  $("ovRating").textContent = rate ?? "—";
  $("ovReviews").textContent = b.google_reviews_count ?? 0;
  $("ovKeywords").textContent = kwCount ?? 0;
  $("ovScans").textContent = scanCount ?? 0;

  const actions = [
    { s: "rank", i: "map-pin", t: "افحص ترتيبك", d: "اعرف من أي الأحياء تظهر ومن أيها تختفي" },
    { s: "profile", i: "clipboard-check", t: "أنشئ خطة رفع ظهورك", d: "محتوى جاهز وملصق تقييم للطباعة" },
    { s: "reviews", i: "message-square", t: "حلّل مراجعاتك", d: "ما يتكرر من مديح وشكاوى" },
    { s: "rivals", i: "users", t: "راقب منافسيك", d: "من دخل نطاقك ومن يتسارع" },
  ];
  $("quickActions").innerHTML = actions.map((a) => `
    <div class="icon-row" style="cursor:pointer" data-goto="${a.s}">
      <div class="ico">${icon(a.i, 17)}</div>
      <div class="body"><div class="t">${a.t}</div><div class="d">${a.d}</div></div>
      ${icon("external-link", 15, "muted")}
    </div>`).join("");
  $("quickActions").querySelectorAll("[data-goto]").forEach((el) =>
    el.onclick = () => showScreen(el.dataset.goto));

  $("bizSummary").className = "";
}

/* ---------------- التنبيهات ---------------- */
const ALERT_ICON = {
  new_rival: "alert-triangle", rival_left: "trending-down",
  rival_surge: "trending-up", rank_drop: "trending-down",
  review_negative: "message-square",
};
const ALERT_CLASS = { high: "high", warn: "warn", info: "calm" };

async function loadAlerts() {
  const { data } = await sb.from("alerts")
    .select("*").eq("business_id", currentBiz)
    .order("created_at", { ascending: false }).limit(6);

  if (!(data || []).length) { $("ovAlertsBox").className = "hidden"; return; }

  $("ovAlerts").innerHTML = data.map((a) => `
    <div class="event ${ALERT_CLASS[a.severity] || "calm"}">
      <div class="ic">${icon(ALERT_ICON[a.kind] || "info", 17)}</div>
      <div>
        <div class="t">${esc(a.title)}</div>
        <div class="d">${esc(a.body || "")} <span class="muted">· ${timeAgo(a.created_at)}</span></div>
      </div>
    </div>`).join("");
  $("ovAlertsBox").className = "";
}

/* ---------------- البحث عن محل ---------------- */
$("searchBtn").onclick = async () => {
  const q = $("searchQ").value.trim();
  if (q.length < 2) return msg($("searchMsg"), "error", "اكتب حرفين على الأقل.");
  const btn = $("searchBtn");
  busy(btn, true, "بحث");
  msg($("searchMsg"), "info", T("msg.search", "نبحث عن المحل…"));
  $("searchResults").innerHTML = "";

  try {
    const { data, error } = await sb.functions.invoke("search-business", {
      body: { query: q, lat: userLoc?.lat, lng: userLoc?.lng },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    if (!data.results.length) return msg($("searchMsg"), "error", "لا نتائج. اكتب الاسم كما هو على لوحة المحل، أو أضف اسم المدينة.");

    clearMsg($("searchMsg"));
    $("searchResults").innerHTML = data.results.map((r, i) => `
      <div class="result" data-i="${i}">
        <div class="n">${esc(r.name)}</div>
        <div class="a">${esc(r.address || "")}</div>
        <div class="m">
          <span class="num">${r.rating ? "★ " + r.rating : "بلا تقييم"}</span>
          <span>${r.reviews ?? 0} مراجعة</span>
          ${r.category ? `<span>${esc(r.category)}</span>` : ""}
        </div>
      </div>`).join("");
    $("searchResults").querySelectorAll(".result").forEach((el) =>
      el.onclick = () => saveBusiness(data.results[+el.dataset.i]));
  } catch (e) {
    msg($("searchMsg"), "error", friendly(e));
  } finally { busy(btn, false, "بحث"); }
};
$("searchQ").addEventListener("keydown", (e) => { if (e.key === "Enter") $("searchBtn").click(); });

async function saveBusiness(r) {
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from("businesses").insert({
    owner_id: user.id, name: r.name, category: r.category, address: r.address,
    lat: r.lat, lng: r.lng, place_id: r.place_id, cid: r.cid,
    website: r.website, phone: r.phone,
    google_rating: r.rating, google_reviews_count: r.reviews,
  }).select().single();
  if (error) return msg($("searchMsg"), "error", friendly(error));

  $("searchResults").innerHTML = "";
  $("searchQ").value = "";
  await loadBusinesses();
  $("bizSelect").value = data.id;
  $("bizSelect").dispatchEvent(new Event("change"));
}

/* ---------------- الكلمات ---------------- */
async function loadKeywords() {
  const { data } = await sb.from("keywords").select("*").eq("business_id", currentBiz);
  const box = $("kwList");
  if (!(data || []).length) {
    box.innerHTML = `<div class="hint">لم تُضف كلمات بعد.</div>`;
  } else {
    box.innerHTML = data.map((k) => `
      <div class="list-row ${currentKw === k.id ? "mine" : ""}">
        <span>${esc(k.term)}</span>
        <button class="btn ${currentKw === k.id ? "" : "ghost"} sm" data-kw="${k.id}">
          ${currentKw === k.id ? "محدّدة" : "اختر"}
        </button>
      </div>`).join("");
    box.querySelectorAll("[data-kw]").forEach((b) =>
      b.onclick = () => { currentKw = b.dataset.kw; loadKeywords(); updateScanBtn(); });
  }
  updateScanBtn();
}

$("addKw").onclick = async () => {
  if (!currentBiz) return;
  const term = $("kwTerm").value.trim();
  if (!term) return;
  const { error } = await sb.from("keywords").insert({ business_id: currentBiz, term });
  if (error) return msg($("scanMsg"), "error", friendly(error));
  $("kwTerm").value = "";
  await loadKeywords();
};

function updateScanBtn() { $("scanBtn").disabled = !(currentBiz && currentKw); }

function refreshGates() {
  const gates = [
    ["rankGate", "rankBody"], ["profileGate", "profileBody"],
    ["reviewsGate", "reviewsBody"], ["rivalsGate", "rivalsBody"],
  ];
  gates.forEach(([g, b]) => {
    if (currentBiz) { $(g).innerHTML = ""; $(b).className = ""; }
    else {
      $(b).className = "hidden";
      emptyState($(g), "map-pin", "اختر محلك أولاً",
        "نحتاج معرفة محلك قبل أن نفحص أي شيء.", "اذهب إلى نظرة عامة", "overview");
    }
  });
  updateScanBtn();
}

/* ---------------- عرض نتائج الفحص ---------------- */
function renderSpread(pts) {
  const el = $("spread");
  if (!el) return;
  const total = pts.length || 1;
  const seg = [
    { n: pts.filter((p) => p.rank != null && p.rank <= 3).length, c: "var(--ok)", t: "1–3" },
    { n: pts.filter((p) => p.rank != null && p.rank > 3 && p.rank <= 10).length, c: "var(--warn)", t: "4–10" },
    { n: pts.filter((p) => p.rank != null && p.rank > 10).length, c: "#C4762A", t: "11–20" },
    { n: pts.filter((p) => p.rank == null).length, c: "#C4837D", t: "غير ظاهر" },
  ].filter((x) => x.n > 0);

  el.innerHTML = seg.map((x) => {
    const pct = (x.n / total) * 100;
    const label = pct >= 16 ? `${x.t} <span>${x.n}</span>` : `<span>${x.n}</span>`;
    return `<div style="flex:${x.n};background:${x.c}" title="${x.t}: ${x.n}">${label}</div>`;
  }).join("");
  el.className = "spread";
}

function renderDiagnose(data, pts) {
  const el = $("diagnose");
  if (!el) return;
  const vis = data.visibility_pct ?? 0;

  if (vis === 0) {
    el.innerHTML = `<h4>${icon("alert-triangle", 17)}محلك لم يظهر في أي نقطة</h4>
      <p>بحثنا من ${pts.length} نقطة حول محلك ولم يظهر ضمن أول عشرين نتيجة في أيٍّ منها. الأسباب الأكثر شيوعاً:</p>
      <ul>
        <li>الكلمة عامة جداً ويزاحمك عليها كثيرون — جرّب كلمة أدق تصف ما تقدّمه تحديداً.</li>
        <li>نطاق الشبكة أوسع من نطاق محلك الفعلي — قلّل المسافة إلى 500 متر.</li>
        <li>ملفك التجاري ناقص أو تصنيفه غير دقيق — أنشئ خطة رفع الظهور من تبويب «الملف التجاري».</li>
      </ul>`;
    el.className = "diagnose";
    return;
  }

  if (vis < 60) {
    const gone = pts.filter((p) => p.rank == null).length;
    el.innerHTML = `<h4>${icon("alert-triangle", 17)}ظهورك محدود في نطاقك</h4>
      <p>تختفي في ${gone} نقطة من ${pts.length}. النقاط الحمراء تكشف الأحياء التي يفقدك فيها الباحثون —
      اضغط على أي نقطة لترى من يظهر مكانك هناك.</p>`;
    el.className = "diagnose";
    return;
  }

  el.className = "diagnose hidden";
}

/* ---------------- فحص الترتيب ---------------- */
$("scanBtn").onclick = async () => {
  const btn = $("scanBtn");
  busy(btn, true, "جارٍ الفحص");
  msg($("scanMsg"), "info", "نستعلم من كل نقطة في الشبكة. يستغرق نصف دقيقة تقريباً.");

  try {
    const { data, error } = await sb.functions.invoke("run-scan", {
      body: {
        business_id: currentBiz, keyword_id: currentKw,
        grid_size: +$("gridSize").value, grid_spacing_m: +$("spacing").value,
      },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    const vis = data.visibility_pct ?? 0;
    $("scanRing").innerHTML = orbitRing(Math.round(vis), 100, scoreColor(vis), 108, "ظهور");
    $("scanVerdict").textContent =
      vis >= 90 ? "ظاهر في معظم المنطقة" : vis >= 60 ? "ظهور جزئي" : vis > 0 ? "ظهور ضعيف" : "غير ظاهر";
    $("scanNote").textContent = data.avg_rank
      ? `متوسط ترتيبك ${data.avg_rank} عبر ${data.points_done} نقطة.`
      : "لم تظهر في نتائج هذه الكلمة.";

    $("stAvg").textContent = data.avg_rank ?? "—";
    $("stBest").textContent = data.best_rank ?? "—";
    $("stWorst").textContent = data.worst_rank ?? "—";
    $("stVis").textContent = vis + "%";

    $("scanResult").className = "";
    initMap();
    requestAnimationFrame(() => setTimeout(() => map && map.invalidateSize(), 80));

    const { data: pts } = await sb.from("scan_points").select("*").eq("scan_id", data.scan_id);

    renderSpread(pts || []);
    renderDiagnose(data, pts || []);

    layer.clearLayers();
    const bounds = [];
    (pts || []).forEach((p) => {
      const rows = (p.top_competitors || []).map((c) =>
        `<div class="r ${c.is_mine ? "me" : ""}">
          <span>${c.rank}. ${esc(c.name)}${c.is_mine ? " — محلك" : ""}</span>
          <span>${c.rating ? "★" + c.rating : "—"} · ${c.reviews ?? 0}</span>
        </div>`).join("");
      L.marker([p.lat, p.lng], { icon: rankPin(p.rank) })
        .bindPopup(`<div class="pop"><h4>ترتيبك هنا: ${p.rank ?? "غير ظاهر"}</h4>${rows}</div>`)
        .addTo(layer);
      bounds.push([p.lat, p.lng]);
    });

    const b = data.business;
    if (b) {
      L.marker([b.lat, b.lng], { icon: mePin(), zIndexOffset: 1000 })
        .bindPopup(`<div class="pop"><h4>${esc(b.name)}</h4>
          <div class="r"><span>متوسط ترتيبك</span><span>${data.avg_rank ?? "—"}</span></div></div>`)
        .addTo(layer);
      bounds.push([b.lat, b.lng]);
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });

    clearMsg($("scanMsg"));
    renderOverview();
  } catch (e) {
    msg($("scanMsg"), "error", friendly(e));
  } finally { busy(btn, false, "ابدأ الفحص"); updateScanBtn(); }
};

/* ---------------- تدقيق الملف ---------------- */
$("auditBtn").onclick = async () => {
  const btn = $("auditBtn");
  busy(btn, true, "جارٍ الفحص");
  msg($("auditMsg"), "info", T("msg.audit", "نحلّل ملفك التجاري…"));

  try {
    const { data, error } = await sb.functions.invoke("audit-profile", { body: { business_id: currentBiz } });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    renderAudit(data);
    savedNote("audit", null);
    clearMsg($("auditMsg"));
    refreshHistory("audit");
  } catch (e) {
    msg($("auditMsg"), "error", friendly(e));
  } finally { busy(btn, false, btnLabel("audit")); }
};

function renderAudit(data) {
    $("auditRing").innerHTML = orbitRing(data.score, 100, scoreColor(data.score), 108, "اكتمال");
    const failed = data.checks.filter((c) => !c.pass).length;
    $("auditVerdict").textContent =
      data.score >= 80 ? "ملف مكتمل" : data.score >= 55 ? "ملف يحتاج تحسيناً" : "ملف ناقص";
    $("auditNote").textContent = failed
      ? `${failed} نقطة تحتاج معالجة. أنشئ خطتك أدناه لتحصل على محتواها جاهزاً.`
      : "كل النقاط مكتملة. حافظ على التحديث المنتظم.";

    const sorted = [...data.checks].sort((a, b) =>
      a.pass === b.pass ? b.weight - a.weight : (a.pass ? 1 : -1));
    $("checks").innerHTML = sorted.map((c) => `
      <div class="check ${c.pass ? "pass" : "fail"}">
        <div class="mark">${icon(c.pass ? "check-circle" : "x-circle", 18)}</div>
        <div style="flex:1">
          <div class="t">${esc(c.label)}<span class="w">أثر ${esc(c.impact)}</span></div>
          <div class="d">${esc(c.detail)}</div>
          ${c.action ? `<div class="a">${esc(c.action)}</div>` : ""}
        </div>
      </div>`).join("");

    const comps = data.competitors || [];
    if (comps.length) {
      $("auditCompList").innerHTML =
        `<div class="list-row mine"><span>${esc(data.my_stats.name)} — محلك</span>
          <span class="meta num">★${data.my_stats.rating ?? "—"} · ${data.my_stats.reviews ?? 0}</span></div>` +
        comps.map((c) => `<div class="list-row"><span>${esc(c.name)}</span>
          <span class="meta num">★${c.rating ?? "—"} · ${c.reviews ?? 0}</span></div>`).join("");
      $("auditCompBox").className = "";
    } else $("auditCompBox").className = "hidden";

    $("auditResult").className = "";
}

/* ---------------- ملصق طلب التقييم ---------------- */
const SIZES = {
  card:  { cls: "s-card",  qr: 4, label: "بطاقة مع الطلب", hint: "صغير" },
  table: { cls: "s-table", qr: 5, label: "ملصق طاولة", hint: "متوسط" },
  wall:  { cls: "s-wall",  qr: 7, label: "ملصق جداري", hint: "كبير" },
};
let stickerSize = "table";

function reviewUrl() {
  const pid = currentBizData?.place_id;
  if (pid) return `https://search.google.com/local/writereview?placeid=${pid}`;
  const cid = currentBizData?.cid;
  if (cid) return `https://search.google.com/local/writereview?placeid=${cid}`;
  return null;
}

function qrHtml(text, cell) {
  try {
    const q = qrcode(0, "M");
    q.addData(text);
    q.make();
    return q.createImgTag(cell, 0);
  } catch {
    return `<div style="font-size:11px;color:#101820;padding:14px">تعذّر توليد الرمز</div>`;
  }
}

const starSvg = `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.4l-5.8 3 1.1-6.45-4.7-4.6 6.5-.95z"/></svg>`;

function stickerHtml() {
  const url = reviewUrl();
  if (!url) return null;
  const s = SIZES[stickerSize];
  const name = currentBizData?.name ?? "متجرك";

  return `<div class="sticker ${s.cls}">
    <div class="shop">${esc(name)}</div>
    <div class="ask-ar">شاركنا تقييمك على قوقل ماب</div>
    <div class="ask-en">Review us on Google Maps</div>
    <div class="stars">${starSvg.repeat(5)}</div>
    <div class="qbox">${qrHtml(url, s.qr)}</div>
    <div class="tap">قرّب كاميرا جوالك أو امسح الرمز</div>
    <div class="foot">
      ${logoMark(19)}
      <span>هذا الرمز مقدَّم من فلك ٣٦٠ · falak360.net</span>
    </div>
  </div>`;
}

function renderSticker() {
  const box = $("stickerBox");
  if (!box) return;
  const html = stickerHtml();

  if (!html) {
    box.innerHTML = `<div class="hint">لا يتوفر رابط التقييم لهذا المحل — أعد إضافته من شاشة «نظرة عامة» عبر البحث ليُحفظ رابطه.</div>`;
    return;
  }

  box.innerHTML = `
    <div class="size-row">
      ${Object.entries(SIZES).map(([k, v]) => `
        <button class="size-opt ${k === stickerSize ? "on" : ""}" data-size="${k}">
          ${v.label}<small>${v.hint}</small>
        </button>`).join("")}
    </div>
    <div class="sticker-wrap">${html}</div>
    <div class="sticker-actions">
      <button class="btn" id="printSticker">${icon("clipboard-check", 17)}اطبع الملصق</button>
      <button class="btn ghost" id="copyLink">${icon("external-link", 17)}انسخ رابط التقييم</button>
    </div>
    <div class="hint">اطبعه وضعه على طاولة الكاشير، أو أرفق نسخة صغيرة مع كل طلب — بحسب طبيعة نشاطك.</div>
    <div class="policy-note">${icon("alert-triangle", 15)}<span>اطلب الرأي بلا مقابل. تقديم خصم أو هدية مقابل التقييم مخالف لسياسات منصات التقييم وقد يُعرّض ملفك للتعليق.</span></div>`;

  box.querySelectorAll("[data-size]").forEach((b) =>
    b.onclick = () => { stickerSize = b.dataset.size; renderSticker(); });

  $("printSticker").onclick = () => {
    $("printArea").innerHTML = stickerHtml();
    window.print();
  };

  $("copyLink").onclick = async (e) => {
    const b = e.currentTarget;
    try {
      await navigator.clipboard.writeText(reviewUrl());
      b.innerHTML = `${icon("check-circle", 17)}تم النسخ`;
      setTimeout(() => { b.innerHTML = `${icon("external-link", 17)}انسخ رابط التقييم`; }, 1800);
    } catch { /* */ }
  };
}

/* ---------------- خطة رفع الظهور ---------------- */
function copyBtn(id) {
  return `<button class="btn-copy" data-copy="${id}">${icon("clipboard-check", 14)}نسخ</button>`;
}

function bindCopy(root, store) {
  root.querySelectorAll("[data-copy]").forEach((b) => {
    b.onclick = async () => {
      try {
        await navigator.clipboard.writeText(store[b.dataset.copy] || "");
        b.classList.add("done");
        b.innerHTML = `${icon("check-circle", 14)}تم النسخ`;
        setTimeout(() => {
          b.classList.remove("done");
          b.innerHTML = `${icon("clipboard-check", 14)}نسخ`;
        }, 1800);
      } catch {
        b.textContent = "انسخ يدوياً";
      }
    };
  });
}

const STEP_ALIAS = {
  review_target: "reviews", review: "reviews", ask_text: "reviews",
  description_text: "description", photo_plan: "photos", keyword_ideas: "keywords",
};
let lastPlan = null;

function renderPlan(d) {
  d = { ...d, steps: (d.steps || []).map((s) => ({ ...s, content_key: STEP_ALIAS[s.content_key] || s.content_key })) };
  lastPlan = d;
  const store = {};

  $("planSummary").innerHTML = d.summary
    ? `<div class="summary">${esc(d.summary)}</div>` : "";

  if ((d.blockers || []).length) {
    $("blockerList").innerHTML = d.blockers.map((b, i) => `
      <div class="blocker ${String(b.weight || "").includes("عال") ? "" : "mid"}">
        <div class="n">${i + 1}</div>
        <div>
          <div class="t">${esc(b.issue)}</div>
          <div class="w">${esc(b.why || "")}</div>
        </div>
      </div>`).join("");
    $("blockerBox").className = "";
  } else $("blockerBox").className = "hidden";

  const content = (key) => {
    if (key === "primary_category" || key === "extra_categories") {
      const all = [];
      if (d.primary_category) all.push(`<span class="tag-cat primary">${esc(d.primary_category)}</span>`);
      (d.extra_categories || []).forEach((c) => all.push(`<span class="tag-cat">${esc(c)}</span>`));
      if (!all.length) return "";
      store["cats"] = [d.primary_category, ...(d.extra_categories || [])].filter(Boolean).join("\n");
      return `<div class="act-content">
        <div class="copy-row"><span class="lbl">الرئيسي أولاً ثم الفرعية</span>${copyBtn("cats")}</div>
        <div class="tag-list">${all.join("")}</div>
      </div>`;
    }

    if (key === "description" && d.description_text) {
      store["desc"] = d.description_text;
      return `<div class="act-content">
        <div class="copy-row"><span class="lbl">وصف جاهز — ${d.description_text.length} حرف</span>${copyBtn("desc")}</div>
        <div class="copy-box">${esc(d.description_text)}</div>
      </div>`;
    }

    if (key === "services" && (d.services || []).length) {
      store["svcs"] = d.services.join("\n");
      return `<div class="act-content">
        <div class="copy-row"><span class="lbl">أضف كل واحدة كخدمة منفصلة</span>${copyBtn("svcs")}</div>
        ${d.services.map((s) => `<div class="svc">${icon("check-circle", 15)}${esc(s)}</div>`).join("")}
      </div>`;
    }

    if (key === "photos" && d.photo_plan?.breakdown?.length) {
      return `<div class="act-content">
        <div class="copy-row"><span class="lbl">المجموع ${d.photo_plan.total ?? ""} صورة</span></div>
        ${d.photo_plan.breakdown.map((p) => `
          <div class="shot">
            <div class="cnt">${p.count}</div>
            <div><div class="t">${esc(p.type)}</div>
            ${p.tip ? `<div class="tip">${esc(p.tip)}</div>` : ""}</div>
          </div>`).join("")}
      </div>`;
    }

    if (key === "reviews") {
      const t = d.review_target || {};
      if (t.ask_text) store["ask"] = t.ask_text;
      return `<div class="act-content">
        ${t.target ? `<div class="target-grid">
          <div class="target-cell"><b>${t.target}</b><small>مراجعة هدفاً</small></div>
          <div class="target-cell"><b>${t.weeks ?? "—"}</b><small>أسبوعاً</small></div>
          <div class="target-cell"><b>${t.per_week ?? "—"}</b><small>أسبوعياً</small></div>
        </div>` : ""}
        ${t.how ? `<div class="ind-means">${esc(t.how)}</div>` : ""}
        ${t.ask_text ? `
          <div class="copy-row" style="margin-top:12px"><span class="lbl">رسالة جاهزة لطلب التقييم</span>${copyBtn("ask")}</div>
          <div class="copy-box">${esc(t.ask_text)}</div>` : ""}
        <div class="copy-row" style="margin-top:18px"><span class="lbl">ملصق جاهز للطباعة برمز متجرك</span></div>
        <div id="stickerBox" class="badge-tool"></div>
      </div>`;
    }

    if (key === "posts" && (d.posts || []).length) {
      return `<div class="act-content">
        ${d.posts.map((p, i) => {
          store[`post${i}`] = p.text;
          return `<div class="post-item">
            <div class="copy-row">
              <span class="h">${esc(p.title || `المنشور ${i + 1}`)}</span>
              ${copyBtn(`post${i}`)}
            </div>
            <div class="copy-box">${esc(p.text)}</div>
          </div>`;
        }).join("")}
        <div class="hint">انشر واحداً كل أسبوع. المنشور يبقى ظاهراً سبعة أيام.</div>
      </div>`;
    }

    if (key === "keywords" && (d.keyword_ideas || []).length) {
      return `<div class="act-content">
        ${d.keyword_ideas.map((k) => `
          <div class="list-row"><span>${esc(k.term)}</span>
          <span class="meta">${esc(k.why || "")}</span></div>`).join("")}
      </div>`;
    }

    return "";
  };

  $("planSteps").innerHTML = (d.steps || []).map((s) => `
    <div class="act">
      <div class="act-head">
        <div class="n">${s.order}</div>
        <div class="body">
          <div class="t">${esc(s.title)}
            <span class="meta">أثر ${esc(s.impact || "—")} · ${esc(s.timeframe || "")}</span>
          </div>
          ${s.detail ? `<div class="d">${esc(s.detail)}</div>` : ""}
        </div>
      </div>
      ${s.where ? `<div class="act-where">${icon("map-pin", 15)}<span>${esc(s.where)}</span></div>` : ""}
      ${content(s.content_key)}
    </div>`).join("") || `<div class="hint">لا توجد خطوات.</div>`;

  bindCopy($("planSteps"), store);
  renderSticker();

  $("rangeNote").innerHTML = d.realistic_range_m
    ? `<div class="range-note">${icon("info", 16)}<span>نطاقك الواقعي حالياً نحو ${d.realistic_range_m} متر حول محلك — هذا أبعد مدى ظهرت فيه فعلاً. خارج هذا النطاق يحكم القرب لا الجودة، ولا تستطيع أي أداة تجاوزه.</span></div>`
    : "";

  $("planResult").className = "";
}

$("planBtn").onclick = async () => {
  const btn = $("planBtn");
  busy(btn, true, "جارٍ الإنشاء");
  msg($("planMsg"), "info", T("msg.plan", "نقرأ ملفك وفحوصاتك ومنافسيك ونكتب خطتك. قد يستغرق دقيقة."));
  try {
    const { data, error } = await sb.functions.invoke("growth-plan", {
      body: { business_id: currentBiz },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    renderPlan(data);
    savedNote("plan", data.existing ? data.created_at : null);
    clearMsg($("planMsg"));
    refreshHistory("plan");
  } catch (e) {
    msg($("planMsg"), "error", friendly(e));
  } finally { busy(btn, false, btnLabel("plan")); }
};

/* ---------------- تحليل المراجعات ---------------- */
$("revBtn").onclick = async () => {
  const btn = $("revBtn");
  busy(btn, true, "جارٍ التحليل");
  msg($("revMsg"), "info", T("msg.reviews", "نقرأ مراجعاتك ونحللها. قد يستغرق دقيقة."));

  try {
    const { data, error } = await sb.functions.invoke("analyze-reviews", {
      body: { business_id: currentBiz, depth: 50 },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    renderReviews(data);
    savedNote("rev", null);
    clearMsg($("revMsg"));
    refreshHistory("rev");
  } catch (e) {
    msg($("revMsg"), "error", friendly(e));
  } finally { busy(btn, false, btnLabel("rev")); }
};

function renderReviews(data) {
    $("rvTotal").textContent = data.total_reviews;
    $("rvPos").textContent = data.positive;
    $("rvNeg").textContent = data.negative;
    $("rvNoRep").textContent = data.negative_without_reply;
    $("revSummary").textContent = data.summary || "—";

    const topics = (arr, color) => (arr || []).length
      ? arr.map((x) => {
          const p = Math.min(100, Math.max(0, x.percent ?? 0));
          return `<div class="topic">
            <div class="h"><span>${esc(x.topic)}</span><span class="pct" style="color:${color}">${p}%</span></div>
            <div class="d">${esc(x.detail || "")}</div>
            <div class="track"><i style="width:${p}%;background:${color}"></i></div>
          </div>`;
        }).join("")
      : `<div class="hint">لا توجد بيانات كافية.</div>`;

    $("strengths").innerHTML = topics(data.strengths, "var(--ok)");
    $("weaknesses").innerHTML = (data.weaknesses || []).length
      ? topics(data.weaknesses, "var(--bad)")
      : `<div class="point ok">لا شكاوى متكررة في مراجعاتك — عملاؤك راضون بشكل عام. حافظ على المستوى.</div>`;
    $("revRecs").innerHTML = (data.recommendations || [])
      .map((r) => `<div class="point warn">${esc(r)}</div>`).join("")
      || `<div class="hint">لا توجد توصيات.</div>`;

    const ns = data.negative_samples || [];
    if (ns.length) {
      $("negList").innerHTML = ns.map((r) => `
        <div class="card" style="padding:14px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--ink-3)">
            <span>${esc(r.author || "زائر")} · <span class="num">${r.rating}★</span></span>
            ${r.replied ? `<span class="badge ok">${icon("check-circle", 13)}تم الرد</span>`
                        : `<span class="badge bad">${icon("alert-triangle", 13)}بلا رد</span>`}
          </div>
          <div style="font-size:13.5px;line-height:1.7;margin-top:7px">${esc((r.text || "").slice(0, 300))}</div>
        </div>`).join("");
      $("negBox").className = "";
    } else $("negBox").className = "hidden";

    $("revResult").className = "";
}

/* ---------------- مراقبة المنافسين ---------------- */
function deltaTag(d) {
  if (d == null) return "";
  if (d > 0) return `<span class="delta up">+${d}</span>`;
  if (d < 0) return `<span class="delta down">${d}</span>`;
  return `<span class="delta flat">—</span>`;
}

async function loadLastWatch() {
  const { data } = await sb.from("competitor_snapshots")
    .select("captured_at").eq("business_id", currentBiz)
    .order("captured_at", { ascending: false }).limit(1).maybeSingle();
  $("watchTime").textContent = data
    ? `آخر مراقبة ${timeAgo(data.captured_at)}`
    : "لم تبدأ المراقبة بعد";
}

function renderWatch(data) {
  $("watchTime").textContent = data.previous_check
    ? `قورنت بمراقبة ${timeAgo(data.previous_check)}`
    : "أول مراقبة لنطاقك";

  const ev = [];

  if (data.first_run) {
    ev.push({
      cls: "calm", ic: "telescope", t: "بدأت مراقبة نطاقك",
      d: `سجّلنا ${data.rivals.length} منافساً في محيطك. من الآن فصاعداً سننبّهك عند دخول أي وافد جديد أو تسارع أحدهم.`,
    });
  } else {
    (data.newcomers || []).forEach((n) => {
      const close = n.distance_m <= 500;
      ev.push({
        cls: close ? "high" : "warn", ic: "alert-triangle",
        t: `منافس جديد على بعد ${n.distance_m} متر`,
        d: `«${n.name}» دخل نطاقك${n.rating ? ` بتقييم ${n.rating}` : ""}${n.reviews ? ` و${n.reviews} مراجعة` : ""}. ${close ? "قريب جداً منك — راقبه عن كثب." : "راقب نموه في المراقبات القادمة."}`,
      });
    });

    (data.departed || []).forEach((d) => {
      ev.push({
        cls: "good", ic: "trending-down", t: "منافس لم يعد يظهر",
        d: `«${d.name}» اختفى من نتائج منطقتك — حصته السوقية متاحة الآن.`,
      });
    });

    (data.surges || []).forEach((s) => {
      ev.push({
        cls: "warn", ic: "trending-up", t: "منافس يتسارع",
        d: `«${s.name}» كسب ${s.delta} مراجعة منذ آخر مراقبة (المجموع ${s.reviews_now}).`,
      });
    });

    if (!ev.length) {
      ev.push({
        cls: "good", ic: "check-circle", t: "لا وافدين جدد",
        d: "راقبنا نطاقك ولم يدخله منافس جديد ولم يتسارع أحد. مشهدك مستقر — استغل الاستقرار لتوسيع فارقك.",
      });
    }
  }

  $("watchEvents").innerHTML = ev.map((e) => `
    <div class="event ${e.cls}">
      <div class="ic">${icon(e.ic, 17)}</div>
      <div><div class="t">${esc(e.t)}</div><div class="d">${esc(e.d)}</div></div>
    </div>`).join("");

  const me = data.my_stats;
  const rows = [`
    <div class="watch-row mine">
      <div class="nm">${esc(me.name)} — محلك
        ${me.peak_top?.length ? `<small>ذروتك: ${me.peak_top.map(fmtH).join("، ")}</small>` : ""}
      </div>
      <div class="fig"><b>${me.rating ?? "—"}</b><small>تقييم</small></div>
      <div class="fig"><b>${me.reviews ?? 0}</b><small>مراجعة</small></div>
    </div>`];

  (data.rivals || []).slice(0, 10).forEach((r) => {
    rows.push(`
      <div class="watch-row">
        <div class="nm">${esc(r.name)}
          ${r.is_new ? `<span class="pill-new">جديد</span>` : ""}
          ${r.busy_now != null && r.busy_now >= 60 ? `<span class="pill-busy">مزدحم الآن</span>` : ""}
          <small>${r.distance_m}م${r.peak_top?.length ? ` · ذروته ${r.peak_top.map(fmtH).join("، ")}` : ""}</small>
        </div>
        <div class="fig"><b>${r.rating ?? "—"}</b><small>${deltaTag(r.rating_delta) || "تقييم"}</small></div>
        <div class="fig"><b>${r.reviews ?? 0}</b><small>${deltaTag(r.reviews_delta) || "مراجعة"}</small></div>
      </div>`);
  });

  $("watchList").innerHTML = rows.join("");
}

$("watchBtn").onclick = async () => {
  const btn = $("watchBtn");
  busy(btn, true, "جارٍ");
  msg($("watchMsg"), "info", "نراقب نطاقك…");
  try {
    const { data, error } = await sb.functions.invoke("monitor-rivals", {
      body: { business_id: currentBiz, radius_m: 1500 },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    renderWatch(data);
    clearMsg($("watchMsg"));
    loadAlerts();
  } catch (e) {
    msg($("watchMsg"), "error", friendly(e));
  } finally { busy(btn, false, "تحديث الآن"); }
};

/* ---------------- تحليل المنافسين ---------------- */
const threatClass = (t) => String(t || "").includes("مرتفع") ? "bad"
  : String(t || "").includes("منخفض") ? "ok" : "warn";

function renderDuel(d, me) {
  if (!d) { $("duelCard").innerHTML = ""; return; }
  const total = Math.max(d.reviews ?? 1, me.reviews ?? 0, 1);
  const myPct = Math.max(3, ((me.reviews ?? 0) / total) * 100);

  const mine = me.momentum?.per_month ?? 0;
  const his = d.momentum?.per_month ?? 0;
  const trend = d.momentum?.trend;
  const trendCls = trend === "يتحسّن" ? "down" : trend === "يتراجع" ? "up" : "";

  $("duelCard").innerHTML = `
    <div class="duel">
      <div class="duel-tag">${icon("target", 13)} خصمك الأول</div>
      <div class="duel-name">${esc(d.name)}</div>
      <div class="duel-sub">يظهر فوقك في ${d.appearances} من ${d.total_points} نقطة في نطاقك</div>

      <div class="duel-bar">
        <div class="duel-ends">
          <span>أنت<b>${me.reviews ?? 0}</b></span>
          <span style="text-align:left">${esc(d.name)}<b>${d.reviews ?? 0}</b></span>
        </div>
        <div class="duel-track"><i style="width:${myPct}%"></i></div>
        <div class="duel-verdict">${esc(d.gap_verdict)}${d.gap ? ` · الفجوة ${d.gap} مراجعة` : ""}</div>
      </div>

      <div class="duel-grid">
        <div class="duel-cell">
          <div class="v ${mine >= his ? "up" : "down"}">${mine}</div>
          <div class="l">مراجعاتك شهرياً</div>
        </div>
        <div class="duel-cell">
          <div class="v">${his}</div>
          <div class="l">مراجعاته شهرياً</div>
        </div>
        <div class="duel-cell">
          <div class="v ${trendCls}">${trend ?? "—"}</div>
          <div class="l">اتجاهه</div>
        </div>
      </div>

      ${d.momentum ? `<div class="duel-verdict" style="margin-top:12px">
        آخر 30 يوماً: كسب ${d.momentum.last_30d} مراجعة —
        ${d.momentum.positive_30d} إيجابية و${d.momentum.negative_30d} سلبية.
        ${d.needed_per_month ? ` للحاق به خلال سنة تحتاج ${d.needed_per_month} مراجعة شهرياً.` : ""}
      </div>` : ""}

      ${d.weak_spot ? `<div class="duel-move">
        <div class="h">نقطة ضعفه</div>
        <div class="t">${esc(d.weak_spot)}</div>
      </div>` : ""}

      ${d.move ? `<div class="duel-move">
        <div class="h">خطوتك ضده</div>
        <div class="t">${esc(d.move)}</div>
      </div>` : ""}
    </div>`;
}

$("compBtn").onclick = async () => {
  const btn = $("compBtn");
  busy(btn, true, "جارٍ التحليل");
  msg($("compMsg"), "info", T("msg.rivals", "نقرأ ملفات منافسيك ومراجعاتهم. قد يستغرق دقيقتين."));

  try {
    const { data, error } = await sb.functions.invoke("analyze-competitors", {
      body: { business_id: currentBiz, max_competitors: 3, review_depth: 30 },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    renderComp(data);
    savedNote("comp", null);
    clearMsg($("compMsg"));
    refreshHistory("comp");
  } catch (e) {
    msg($("compMsg"), "error", friendly(e));
  } finally { busy(btn, false, btnLabel("comp")); }
};

function renderComp(data) {
    renderDuel(data.top_rival, data.my_stats || {});
    $("positioning").textContent = data.positioning || "—";

    $("planList").innerHTML = (data.battle_plan || []).map((p, i) => `
      <div class="step">
        <div class="n">${p.priority ?? i + 1}</div>
        <div>
          <div class="t">${esc(p.action || "")}</div>
          <div class="r">${esc(p.reason || "")}${p.impact ? ` · أثر ${esc(p.impact)}` : ""}</div>
        </div>
      </div>`).join("") || `<div class="hint">لا توجد خطوات.</div>`;

    $("rivalList").innerHTML = (data.competitors || []).map((c) => {
      const chips = [];
      if (c.rating) chips.push(`★ ${c.rating}`);
      if (c.reviews != null) chips.push(`${c.reviews} مراجعة`);
      if (c.price_level) chips.push(`سعر ${c.price_level}`);
      if (c.category) chips.push(c.category);
      chips.push(`فوقك في ${c.appearances} من ${c.total_points}`);
      if (c.reply_rate != null) chips.push(`يرد على ${c.reply_rate}%`);
      if (c.momentum?.trend) chips.push(`اتجاهه ${c.momentum.trend}`);
      const li = (arr) => (arr || []).length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>—</li>";

      return `<div class="card" style="padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div style="font-size:15.5px;font-weight:700">${esc(c.name)}</div>
          ${c.threat_level ? `<span class="badge ${threatClass(c.threat_level)}">خطورة ${esc(c.threat_level)}</span>` : ""}
        </div>
        <div style="margin-top:9px">${chips.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>
        ${c.why ? `<div class="ind-means">${esc(c.why)}</div>` : ""}
        ${c.price_impression ? `<div class="ind-means">${icon("banknote", 15)} ${esc(c.price_impression)}</div>` : ""}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
          <div><div style="font-size:12.5px;color:var(--ink-3);margin-bottom:4px">قوّته</div>
            <ul style="font-size:12.5px;line-height:1.7;padding-inline-start:16px;color:var(--ok)">${li(c.strengths)}</ul></div>
          <div><div style="font-size:12.5px;color:var(--ink-3);margin-bottom:4px">ضعفه</div>
            <ul style="font-size:12.5px;line-height:1.7;padding-inline-start:16px;color:var(--bad)">${li(c.weaknesses)}</ul></div>
        </div>
        ${c.menu_url ? `<div class="sp-t"><a href="${esc(c.menu_url)}" target="_blank" rel="noopener">قائمة الأسعار ↗</a></div>` : ""}
      </div>`;
    }).join("");

    fillPoints("oppBox", "oppList", data.opportunities, "ok");
    fillPoints("thrBox", "thrList", data.threats, "bad");

    $("compResult").className = "";
}

function fillPoints(boxId, listId, arr, cls) {
  if (!(arr || []).length) { $(boxId).className = "hidden"; return; }
  $(listId).innerHTML = arr.map((x) => `<div class="point ${cls}">${esc(x)}</div>`).join("");
  $(boxId).className = "";
}
   
   /* ---------------- محل معروض للبيع ---------------- */
$("buySearchBtn").onclick = async () => {
  const q = $("buyQ").value.trim();
  if (q.length < 2) return msg($("buySearchMsg"), "error", "اكتب اسم المحل.");
  const btn = $("buySearchBtn");
  busy(btn, true, "بحث");
  msg($("buySearchMsg"), "info", T("msg.search", "نبحث عن المحل…"));
  $("buyResults").innerHTML = "";

  try {
    const { data, error } = await sb.functions.invoke("search-business", {
      body: { query: q, lat: userLoc?.lat, lng: userLoc?.lng },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    if (!data.results.length) return msg($("buySearchMsg"), "error", "لا نتائج. اكتب الاسم مع المدينة.");

    clearMsg($("buySearchMsg"));
    $("buyResults").innerHTML = data.results.map((r, i) => `
      <div class="result" data-i="${i}">
        <div class="n">${esc(r.name)}</div>
        <div class="a">${esc(r.address || "")}</div>
        <div class="m">
          <span class="num">${r.rating ? "★ " + r.rating : "بلا تقييم"}</span>
          <span>${r.reviews ?? 0} مراجعة</span>
          ${r.category ? `<span>${esc(r.category)}</span>` : ""}
        </div>
      </div>`).join("");

    $("buyResults").querySelectorAll(".result").forEach((el) =>
      el.onclick = () => {
        buyTarget = data.results[+el.dataset.i];
        $("buyResults").innerHTML = "";
        $("buyPickedName").textContent = buyTarget.name;
        $("buyPicked").className = "";
        $("buyResult").className = "hidden";
      });
  } catch (e) {
    msg($("buySearchMsg"), "error", friendly(e));
  } finally { busy(btn, false, "بحث"); }
};
$("buyQ").addEventListener("keydown", (e) => { if (e.key === "Enter") $("buySearchBtn").click(); });

$("buyChange").onclick = () => {
  buyTarget = null;
  $("buyPicked").className = "hidden";
  $("buyResult").className = "hidden";
  $("buyQ").focus();
};

function vdClass(text, kind) {
  const t = String(text || "");
  if (kind === "activity") {
    if (t.includes("متوقفة")) return "bad";
    if (t.includes("متراجعة")) return "warn";
    if (t.includes("متنامية")) return "good";
    return "";
  }
  if (kind === "location") {
    if (t.includes("قوي")) return "good";
    if (t.includes("ضعيف")) return "bad";
    return "warn";
  }
  if (t.includes("بنيوية")) return "bad";
  if (t.includes("تشغيلية")) return "good";
  return "warn";
}

function renderBuy(d) {
  const v = d.vitals || {};

  $("buyRing").innerHTML = orbitRing(d.score, 100, scoreColor(d.score), 116, "المؤشر");
  $("buyVerdict").textContent = d.verdict;
  $("buyVerdict").style.color = scoreColor(d.score);
  $("buyMeta").textContent = [d.target?.category, d.target?.address].filter(Boolean).join(" · ") || "—";

  $("buyVerdicts").innerHTML = `
    <div class="vd ${vdClass(d.activity_status, "activity")}">
      <div class="lb">حالة المحل</div><div class="vl">${esc(d.activity_status || "—")}</div>
    </div>
    <div class="vd ${vdClass(d.location_grade, "location")}">
      <div class="lb">الموقع نفسه</div><div class="vl">${esc(d.location_grade || "—")}</div>
    </div>
    <div class="vd ${vdClass(d.fixability, "fix")}">
      <div class="lb">قابلية الإصلاح</div><div class="vl">${esc(d.fixability || "—")}</div>
    </div>`;

  $("buySummary").textContent = d.summary || "—";

  // النبض
  if (v.last_90d != null) {
    const dir = v.last_90d < v.prev_90d ? "down" : v.last_90d > v.prev_90d ? "up" : "";
    let note = "";
    if (v.momentum === "متوقف") {
      note = `آخر مراجعة وصلته قبل ${v.days_since_last} يوماً. حركة العملاء متوقفة أو شبه متوقفة.`;
    } else if (v.momentum === "متراجع") {
      note = `عدد مراجعاته انخفض إلى نحو النصف مقارنة بالفترة السابقة — تراجع واضح في حركة العملاء.`;
    } else if (v.momentum === "متسارع") {
      note = `حركته تتزايد. اسأل البائع لماذا يبيع محلاً ينمو.`;
    } else {
      note = `حركته ثابتة تقريباً بين الفترتين.`;
    }
    if (v.quality_trend === "يتراجع") note += " ومتوسط تقييم مراجعاته الأخيرة أقل من السابق — الجودة تنزل.";
    else if (v.quality_trend === "يتحسّن") note += " ومتوسط تقييم مراجعاته الأخيرة أعلى من السابق.";

    $("buyPulse").innerHTML = `
      <div class="pulse ${dir}">
        <div class="p-side"><b>${v.prev_90d ?? 0}</b><small>الـ90 يوماً السابقة</small></div>
        <div class="p-arrow">←</div>
        <div class="p-side"><b>${v.last_90d}</b><small>آخر 90 يوماً</small></div>
      </div>
      <div class="pulse-note">${esc(note)}</div>`;
  } else {
    $("buyPulse").innerHTML = `<div class="point warn">لا تتوفر مراجعات مؤرّخة كافية لقياس حركته — وهذا بحد ذاته إشارة تستحق السؤال.</div>`;
  }

  $("buyStats").innerHTML = `
    <div class="stat"><div class="stat-val num">${v.rating ?? "—"}</div><div class="stat-lbl">تقييمه</div></div>
    <div class="stat"><div class="stat-val num">${v.reviews_total ?? 0}</div><div class="stat-lbl">مراجعاته</div></div>
    <div class="stat"><div class="stat-val num">${v.vs_area_pct != null ? v.vs_area_pct + "%" : "—"}</div><div class="stat-lbl">مقابل متوسط المنطقة</div></div>
    <div class="stat"><div class="stat-val num">${v.rivals_count ?? "—"}</div><div class="stat-lbl">منافس حوله</div></div>`;

  if (d.reading) {
    $("buyReading").textContent = d.reading;
    $("buyReadingBox").className = "";
  } else $("buyReadingBox").className = "hidden";

  fillPoints("buyRedBox", "buyRed", d.red_flags, "bad");
  fillPoints("buyGreenBox", "buyGreen", d.green_flags, "ok");

  const cmp = d.complaints || [];
  if (cmp.length) {
    $("buyCmp").innerHTML = cmp.map((c) => {
      const fixable = String(c.fixable || "").includes("نعم");
      return `<div class="cmp-row">
        <div>
          <div class="t">${esc(c.topic)}${c.percent ? ` — ${c.percent}%` : ""}</div>
          ${c.note ? `<div class="n">${esc(c.note)}</div>` : ""}
        </div>
        <span class="fx ${fixable ? "y" : "n"}">${fixable ? "قابلة للإصلاح" : "يصعب إصلاحها"}</span>
      </div>`;
    }).join("");
    $("buyCmpBox").className = "";
  } else $("buyCmpBox").className = "hidden";

  const ask = d.ask_seller || [];
  if (ask.length) {
    $("buyAsk").innerHTML = ask.map((a, i) => `
      <div class="ask">
        <div class="n">${i + 1}</div>
        <div>
          <div class="q">${esc(a.q)}</div>
          ${a.why ? `<div class="why">${esc(a.why)}</div>` : ""}
        </div>
      </div>`).join("");
    $("buyAskBox").className = "";
  } else $("buyAskBox").className = "hidden";

  const ver = d.verify_yourself || [];
  if (ver.length) {
    $("buyVerify").innerHTML = ver.map((x) => `
      <div class="icon-row">
        <div class="ico">${icon("clipboard-check", 17)}</div>
        <div class="body">
          <div class="t">${esc(x.item)}</div>
          ${x.why ? `<div class="d">${esc(x.why)}</div>` : ""}
        </div>
      </div>`).join("");
    $("buyVerifyBox").className = "";
  } else $("buyVerifyBox").className = "hidden";

  fillPoints("buyNegBox", "buyNeg", d.negotiation, "warn");

  const rv = d.rivals || [];
  if (rv.length) {
    $("buyRivals").innerHTML = rv.map((r) => `
      <div class="list-row"><span>${esc(r.name)}
        ${r.busy_now != null && r.busy_now >= 60 ? `<span class="pill-busy">مزدحم الآن</span>` : ""}
      </span>
      <span class="meta num">★${r.rating ?? "—"} · ${r.reviews ?? 0} · ${r.distance_m}م</span></div>`).join("");
    $("buyRivalsBox").className = "";
  } else $("buyRivalsBox").className = "hidden";

  $("buyScope").innerHTML = `<div class="scope">${icon("info", 16)}<span>${esc(d.scope_note || "")}</span></div>`;

  $("buyResult").className = "";
}

$("buyBtn").onclick = async () => {
  if (!buyTarget) return msg($("buyMsg"), "error", "اختر المحل من نتائج البحث.");
  const btn = $("buyBtn");
  busy(btn, true, "جارٍ التحليل");
  msg($("buyMsg"), "info", T("msg.buy", "نقيس حركته ونقرأ مراجعاته ونفحص موقعه ومنافسيه. قد يستغرق دقيقتين."));

  try {
    const { data, error } = await sb.functions.invoke("analyze-acquisition", {
      body: {
        name: buyTarget.name,
        place_id: buyTarget.place_id ?? null,
        cid: buyTarget.cid ?? null,
        lat: buyTarget.lat, lng: buyTarget.lng,
        category: buyTarget.category ?? null,
        address: buyTarget.address ?? null,
        radius_m: 1500,
      },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    renderBuy(data);
    savedNote("buy", null);
    clearMsg($("buyMsg"));
    refreshHistory("buy");
  } catch (e) {
    msg($("buyMsg"), "error", friendly(e));
  } finally { busy(btn, false, btnLabel("buy")); }
};

/* ---------------- تحديد موقع المشروع ---------------- */
$("geoBtn").onclick = async () => {
  const city = $("locCity").value.trim();
  const district = $("locDistrict").value.trim();
  const street = $("locStreet").value.trim();

  if (city.length < 2) return msg($("geoMsg"), "error", "اكتب اسم المدينة.");
  if (district.length < 2) return msg($("geoMsg"), "error", "اكتب اسم الحي.");

  const btn = $("geoBtn");
  busy(btn, true, "جارٍ البحث");
  msg($("geoMsg"), "info", "نبحث عن الموقع…");

  try {
    const { data, error } = await sb.functions.invoke("geocode", {
      body: { city, district, street: street || null },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    initLocMap();
    setPick(data.lat, data.lng, true, data.approximate ? 13 : street ? 17 : 15);
    setTimeout(() => locMap && locMap.invalidateSize(), 100);

    if (data.approximate) msg($("geoMsg"), "info", data.note);
    else msg($("geoMsg"), "done",
      `وُجد: ${data.label}${data.address ? " — " + data.address : ""}. اضغط على الخريطة لضبط الموقع بدقة.`);
  } catch (e) {
    msg($("geoMsg"), "error", friendly(e));
  } finally { busy(btn, false, "ابحث عن الموقع"); }
};

["locCity", "locDistrict", "locStreet"].forEach((id) =>
  $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") $("geoBtn").click(); }));

$("coordBtn").onclick = () => {
  const raw = $("locCoords").value.trim();
  if (!raw) return msg($("geoMsg"), "error", "الصق الإحداثيات أو رابط الخريطة.");

  let lat = null, lng = null;
  let m = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) { lat = +m[1]; lng = +m[2]; }
  if (lat == null) {
    m = raw.match(/[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (m) { lat = +m[1]; lng = +m[2]; }
  }
  if (lat == null) {
    m = raw.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (m) { lat = +m[1]; lng = +m[2]; }
  }

  if (lat == null || isNaN(lat) || isNaN(lng)) {
    return msg($("geoMsg"), "error", "لم نتعرّف على الإحداثيات. الصيغة المتوقعة: 24.7136, 46.6753");
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return msg($("geoMsg"), "error", "الإحداثيات خارج النطاق الصحيح.");
  }

  initLocMap();
  setPick(lat, lng, true, 17);
  setTimeout(() => locMap && locMap.invalidateSize(), 100);
  msg($("geoMsg"), "done", `انتقلنا إلى ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
};

$("locCoords").addEventListener("keydown", (e) => { if (e.key === "Enter") $("coordBtn").click(); });

/* ---------------- تحليل موقع مشروع ---------------- */
const ANCHOR_ICONS = {
  "مدارس": "graduation-cap", "مساجد": "mosque",
  "مستشفيات ومراكز طبية": "heart-pulse", "بنوك": "building",
  "جهات حكومية": "landmark", "مراكز تسوق": "shopping-bag",
  "محطات وقود": "fuel", "أسواق ومتاجر كبرى": "shopping-cart",
};
const COMPLEMENT_ICONS = {
  "صالة رياضية": "dumbbell", "مكاتب إدارية": "briefcase",
  "عيادة": "stethoscope", "صالون حلاقة": "scissors",
};
const IND_ICONS = {
  concentration: "pie-chart", purchasing_power: "banknote", price_gap: "tag",
  rising: "trending-up", demand: "bar-chart", maturity: "layers",
  complements: "route", rent: "building2", peak: "clock",
};

$("locBtn").onclick = async () => {
  const act = $("locAct").value.trim();
  if (act.length < 2) return msg($("locMsg"), "error", "اكتب نوع النشاط.");
  if (!locPick) return msg($("locMsg"), "error", "ابحث عن الموقع أو اضغط على الخريطة لتحديده.");

  const btn = $("locBtn");
  busy(btn, true, "جارٍ التحليل");
  msg($("locMsg"), "info", T("msg.site", "نمسح المنطقة ونقرأ المنافسين والمحيط. قد يستغرق دقيقتين."));

  const areaLabel = [$("locDistrict").value.trim(), $("locCity").value.trim()]
    .filter(Boolean).join("، ") || null;

  try {
    const { data, error } = await sb.functions.invoke("analyze-location", {
      body: {
        activity: act, lat: locPick.lat, lng: locPick.lng,
        area_label: areaLabel,
        radius_m: +$("locRadius").value,
      },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    renderLocation(data);
    savedNote("loc", null);
    clearMsg($("locMsg"));
    refreshHistory("loc");
  } catch (e) {
    msg($("locMsg"), "error", friendly(e));
  } finally { busy(btn, false, btnLabel("loc")); }
};

function renderLocation(data) {
    const m = data.market_signals || {};
    $("locRing").innerHTML = orbitRing(data.score, 100, scoreColor(data.score), 116, "جاذبية");
    $("locVerdict").textContent = data.verdict;
    $("locVerdict").style.color = scoreColor(data.score);
    $("locNote").textContent =
      `أقرب منافس: ${m.nearest_name ?? "—"} على بعد ${m.nearest_distance_m ?? "—"} متر · ${m.vitality_label ?? ""}`;

    $("lcComp").textContent = data.competitors_count ?? "—";
    $("lcRating").textContent = m.avg_rating ?? "—";
    $("lcWeak").textContent = m.weak_competitors ?? "—";
    $("lcVital").textContent = (m.vitality_score ?? "—") + "%";
    $("locSummary").textContent = data.summary || "—";

    if (data.area_character) {
      $("areaChar").textContent = data.area_character;
      $("areaChar").className = "summary";
    } else $("areaChar").className = "summary hidden";

    const inds = data.indicators || m.indicators || [];
    if (inds.length) {
      $("indList").innerHTML = inds.map((x) => {
        let extra = "";
        if (x.key === "rising" && (x.items || []).length) {
          extra = x.items.map((r) => `<div class="list-row" style="margin-top:8px">
            <span>${esc(r.name)}</span>
            <span class="meta num">★${r.rating} · ${r.reviews} · ${r.distance_m}م</span></div>`).join("");
        }
        if (x.key === "complements" && (x.items || []).length) {
          extra = `<div style="margin-top:9px">` + x.items.map((c) =>
            `<span class="chip">${icon(COMPLEMENT_ICONS[c.type] || "map-pin", 13)}${esc(c.type)}: ${c.count} · ${c.nearest_distance_m}م</span>`
          ).join("") + `</div>`;
        }
        return `<div class="indicator ${x.status || "neutral"}">
          <div class="ind-head">
            <div class="ind-title">${icon(IND_ICONS[x.key] || "info", 17)}${esc(x.title)}</div>
            <div class="ind-val">${esc(x.value)}</div>
          </div>
          <div class="ind-what">${esc(x.what)}</div>
          <div class="ind-means">${esc(x.means)}</div>
          ${extra}
        </div>`;
      }).join("");
      $("indBox").className = "";
    } else $("indBox").className = "hidden";

    const an = (m.anchors || []).slice().sort((a, b) => a.nearest_distance_m - b.nearest_distance_m);
    if (an.length) {
      $("anchList").innerHTML = an.map((a) => `
        <div class="icon-row">
          <div class="ico">${icon(ANCHOR_ICONS[a.type] || "map-pin", 17)}</div>
          <div class="body">
            <div class="t">${esc(a.type)} · ${a.count}</div>
            <div class="d">أقربها: ${esc(a.nearest)}</div>
          </div>
          <div class="val">${a.nearest_distance_m}م</div>
        </div>`).join("");
      $("anchBox").className = "";
    } else $("anchBox").className = "hidden";

    const br = m.brands || [];
    if (br.length) {
      $("brandList").innerHTML = br.map((b) =>
        `<span class="chip">${icon("star", 13)}${esc(b.name)} · ${b.distance_m}م</span>`).join("");
      $("brandBox").className = "";
    } else $("brandBox").className = "hidden";

    const mg = m.magnets || [];
    if (mg.length) {
      $("magList").innerHTML = mg.map((x) =>
        `<div class="list-row"><span>${esc(x.name)}</span>
         <span class="meta num">${x.reviews} مراجعة · ${x.distance_m}م</span></div>`).join("");
      $("magBox").className = "";
    } else $("magBox").className = "hidden";

    const ph = data.peak_hours || {};
    if ((ph.hourly || []).length) {
      const byHour = {}; ph.hourly.forEach((h) => byHour[h.hour] = h.value);
      const max = Math.max(...ph.hourly.map((h) => h.value), 1);
      let html = "";
      for (let h = 0; h < 24; h++) {
        const val = byHour[h] ?? 0;
        const pk = (ph.top || []).includes(h) ? " class='peak'" : "";
        html += `<i${pk} style="height:${Math.max(3, (val / max) * 100)}%" title="${fmtH(h)}"></i>`;
      }
      $("hoursBar").innerHTML = html;
      $("peakTxt").textContent = (ph.top || []).length
        ? `أنشط الساعات: ${ph.top.map(fmtH).join("، ")} — مبني على ${ph.sources} محل.` : "";
      $("hoursBox").className = "";
    } else $("hoursBox").className = "hidden";

    fillPoints("gapBox", "gapList", data.market_gaps, "warn");
    fillPoints("lOppBox", "lOppList", data.opportunities, "ok");
    fillPoints("lRiskBox", "lRiskList", data.risks, "bad");
    fillPoints("succBox", "succList", data.success_factors, "plain");

    const cs = data.competitors || [];
    if (cs.length) {
      $("lcCompList").innerHTML = cs.map((c) =>
        `<div class="list-row"><span>${esc(c.name)}</span>
         <span class="meta num">★${c.rating ?? "—"} · ${c.reviews ?? 0} · ${c.distance_m}م</span></div>`).join("");
      $("lcCompBox").className = "";
      if (locLayer) cs.forEach((c) => {
        if (c.lat == null || c.lng == null) return;
        L.circleMarker([c.lat, c.lng], {
          radius: 7, color: "#fff", weight: 1.5,
          fillColor: (c.rating ?? 5) < 4 ? "#A8271F" : "#A96A12", fillOpacity: .95,
        }).bindPopup(`<div class="pop"><h4>${esc(c.name)}</h4>
          <div class="r"><span>★ ${c.rating ?? "—"}</span><span>${c.reviews ?? 0} مراجعة</span></div></div>`)
          .addTo(locLayer);
      });
    } else $("lcCompBox").className = "hidden";

    $("locDisc").textContent = data.disclaimer || "التحليل مبني على بيانات سوقية محدّثة، ولا يغني عن دراسة جدوى شاملة.";
    $("locResult").className = "";
}

/* ---------------- النتائج المحفوظة ---------------- */
const fmtDay = (iso) => iso
  ? new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso))
  : "";
const fmtDayTime = (iso) => iso
  ? new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso))
  : "";

const HIST = {
  plan: {
    table: "growth_plans", cols: "id, created_at, visibility_pct", btn: "planBtn", result: "planResult", msgEl: "planMsg",
    get first() { return T("plan.btn", "أنشئ خطتي"); },
    get again() { return T("plan.btn_again", "أنشئ خطة جديدة"); },
    get view() { return T("plan.view", "اعرض خطتي السابقة"); },
    tag: (r) => r.visibility_pct != null ? `ظهور ${r.visibility_pct}%` : "",
    show: async (row) => renderPlan(row),
  },
  audit: {
    table: "profile_audits", cols: "id, created_at, score", btn: "auditBtn", result: "auditResult", msgEl: "auditMsg",
    get first() { return T("profile.audit_btn", "افحص ملفي"); }, again: "افحص ملفي من جديد", view: "اعرض آخر فحص",
    tag: (r) => r.score != null ? `${r.score}/100` : "",
    show: async (row) => renderAudit({
      score: row.score ?? 0, checks: row.checks || [], competitors: row.competitors || [],
      my_stats: {
        name: currentBizData?.name ?? "محلك",
        rating: currentBizData?.google_rating ?? null,
        reviews: currentBizData?.google_reviews_count ?? 0,
      },
    }),
  },
  rev: {
    table: "review_analyses", cols: "id, created_at, total_reviews, avg_rating", btn: "revBtn", result: "revResult", msgEl: "revMsg",
    first: "حلّل المراجعات", again: "حلّل المراجعات من جديد", view: "اعرض آخر تحليل",
    tag: (r) => r.total_reviews != null ? `${r.total_reviews} مراجعة` : "",
    show: async (row) => {
      const [neg, noRep] = await Promise.all([
        sb.from("reviews").select("author, rating, text, owner_replied")
          .eq("business_id", row.business_id).lte("rating", 2)
          .order("review_date", { ascending: false }).limit(5),
        sb.from("reviews").select("id", { count: "exact", head: true })
          .eq("business_id", row.business_id).lte("rating", 2).eq("owner_replied", false),
      ]);
      renderReviews({
        total_reviews: row.total_reviews ?? 0,
        positive: row.positive_count ?? 0,
        negative: row.negative_count ?? 0,
        negative_without_reply: noRep.count ?? "—",
        summary: row.summary,
        strengths: row.strengths || [], weaknesses: row.weaknesses || [],
        recommendations: row.recommendations || [],
        negative_samples: (neg.data || []).map((r) => ({ author: r.author, rating: r.rating, text: r.text, replied: r.owner_replied })),
      });
    },
  },
  loc: {
    table: "location_reports", cols: "id, created_at, score, area_label, activity", byOwner: true,
    btn: "locBtn", result: "locResult", msgEl: "locMsg",
    get first() { return T("site.btn", "حلّل الموقع"); }, again: "حلّل موقعاً آخر", view: "اعرض آخر تحليل موقع",
    tag: (r) => [r.activity, r.area_label].filter(Boolean).join(" · ") || (r.score != null ? `${r.score}/100` : ""),
    show: async (row) => renderLocation({
      ...row,
      indicators: row.market_signals?.indicators ?? [],
      area_character: row.market_signals?.area_character ?? "",
      market_gaps: row.market_signals?.market_gaps ?? [],
      success_factors: row.market_signals?.success_factors ?? [],
    }),
  },
  buy: {
    table: "acquisition_reports", cols: "id, created_at, score, target_name", byOwner: true,
    btn: "buyBtn", result: "buyResult", msgEl: "buyMsg",
    get first() { return T("buy.btn", "حلّل هذا المحل"); }, again: "حلّل محلاً آخر", view: "اعرض آخر تحليل",
    tag: (r) => r.target_name || (r.score != null ? `${r.score}/100` : ""),
    show: async (row) => renderBuy({
      ...row,
      target: { name: row.target_name, category: row.category, address: row.address,
        rating: row.vitals?.rating ?? null, reviews: row.vitals?.reviews_total ?? 0 },
      scope_note: row.scope_note ?? "نحلّل السوق ولا نطّلع على دفاتر المحل — لذلك جهّزنا لك ما تسأل عنه وتتحقق منه قبل الشراء.",
    }),
  },
  comp: {
    table: "competitor_analyses", cols: "id, created_at", btn: "compBtn", result: "compResult", msgEl: "compMsg",
    first: "حلّل المنافسين بعمق", again: "حلّل المنافسين من جديد", view: "اعرض آخر تحليل",
    tag: () => "",
    show: async (row) => {
      const x = row.extra || {};
      renderComp({
        positioning: row.positioning, battle_plan: row.battle_plan || [], competitors: row.competitors || [],
        top_rival: x.top_rival ?? null, my_stats: x.my_stats ?? {},
        opportunities: x.opportunities ?? [], threats: x.threats ?? [],
      });
    },
  },
};
Object.values(HIST).forEach((h) => { h.rows = []; });

const btnLabel = (k) => (HIST[k].rows.length ? HIST[k].again : HIST[k].first);

function histInit() {
  Object.entries(HIST).forEach(([k, h]) => {
    const btn = $(h.btn);
    if (!btn || $(`${k}Hist`)) return;
    btn.insertAdjacentHTML("afterend", `<div id="${k}Hist" class="hist hidden"></div>`);
    $(h.result).insertAdjacentHTML("afterbegin", `<div id="${k}Saved" class="saved-note hidden"></div>`);
  });
  $("planResult").insertAdjacentHTML("afterbegin", `
    <div class="plan-tools">
      <button class="btn ghost" id="planPdf">${icon("file-text", 16)}تنزيل PDF</button>
    </div>`);
  $("planPdf").onclick = printPlan;
}

function renderHistBar(k) {
  const h = HIST[k];
  const box = $(`${k}Hist`);
  const btn = $(h.btn);
  if (btn && !btn.disabled && !btn.dataset.label) btn.textContent = btnLabel(k);
  if (!box) return;
  if (!h.rows.length) { box.className = "hist hidden"; box.innerHTML = ""; return; }
  const r0 = h.rows[0];
  box.className = "hist";
  box.innerHTML = `
    <button class="btn ghost block" data-open="${esc(r0.id)}">${icon("clock", 16)}${h.view}
      <span class="hist-date">${fmtDay(r0.created_at)}</span></button>
    ${h.rows.length > 1 ? `
      <select class="select hist-sel" aria-label="النتائج السابقة">
        <option value="">النتائج السابقة (${h.rows.length})</option>
        ${h.rows.map((r) => `<option value="${esc(r.id)}">${fmtDayTime(r.created_at)}${h.tag(r) ? ` · ${esc(h.tag(r))}` : ""}</option>`).join("")}
      </select>` : ""}`;
  box.querySelector("[data-open]").onclick = (e) => openHist(k, r0.id, e.currentTarget);
  const sel = box.querySelector(".hist-sel");
  if (sel) sel.onchange = () => { if (sel.value) openHist(k, sel.value, null); sel.value = ""; };
}

async function refreshHistory(k) {
  const h = HIST[k];
  if (h.byOwner) {
    const { data } = await sb.from(h.table).select(h.cols)
      .eq("status", "completed").order("created_at", { ascending: false }).limit(30);
    h.rows = data || [];
    renderHistBar(k);
    return;
  }
  if (!currentBiz) { h.rows = []; renderHistBar(k); return; }
  const biz = currentBiz;
  const { data } = await sb.from(h.table).select(h.cols)
    .eq("business_id", biz).order("created_at", { ascending: false }).limit(30);
  if (biz !== currentBiz) return;
  h.rows = data || [];
  renderHistBar(k);
}

async function loadHistory() {
  await Promise.all(Object.keys(HIST).map((k) => refreshHistory(k).catch(() => {})));
}

function savedNote(k, iso) {
  const el = $(`${k}Saved`);
  if (!el) return;
  if (!iso) { el.className = "saved-note hidden"; el.innerHTML = ""; return; }
  el.className = "saved-note";
  el.innerHTML = `${icon("clock", 15)}<span>نتيجة محفوظة من ${fmtDayTime(iso)}</span>`;
}

async function openHist(k, id, btn) {
  const h = HIST[k];
  if (btn) busy(btn, true, "جارٍ الفتح");
  try {
    const { data, error } = await sb.from(h.table).select("*").eq("id", id).single();
    if (error) throw error;
    await h.show(data);
    savedNote(k, data.created_at);
    clearMsg($(h.msgEl));
    $(h.result).scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    msg($(h.msgEl), "error", friendly(e));
  } finally {
    if (btn) { busy(btn, false, ""); renderHistBar(k); }
  }
}

/* ---------------- تنزيل الخطة PDF ---------------- */
function planPrintHtml(d) {
  const b = currentBizData || {};
  const li = (arr) => (arr || []).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("");
  const t = d.review_target || {};
  const block = (key) => {
    if ((key === "primary_category" || key === "extra_categories") && (d.primary_category || (d.extra_categories || []).length)) {
      return `<div class="pp-box"><b>التصنيف الرئيسي:</b> ${esc(d.primary_category || "—")}
        ${(d.extra_categories || []).length ? `<br><b>التصنيفات الفرعية:</b> ${esc(d.extra_categories.join("، "))}` : ""}</div>`;
    }
    if (key === "description" && d.description_text) return `<div class="pp-box pp-copy">${esc(d.description_text)}</div>`;
    if (key === "services" && (d.services || []).length) return `<div class="pp-box"><ul>${li(d.services)}</ul></div>`;
    if (key === "photos" && d.photo_plan?.breakdown?.length) {
      return `<div class="pp-box"><ul>${d.photo_plan.breakdown.map((p) =>
        `<li><b>${esc(p.count)} × ${esc(p.type)}</b>${p.tip ? ` — ${esc(p.tip)}` : ""}</li>`).join("")}</ul></div>`;
    }
    if (key === "reviews") {
      return `<div class="pp-box">
        ${t.target ? `<b>الهدف:</b> ${esc(t.target)} مراجعة خلال ${esc(t.weeks ?? "—")} أسبوعاً (${esc(t.per_week ?? "—")} أسبوعياً)<br>` : ""}
        ${t.how ? `${esc(t.how)}<br>` : ""}
        ${t.ask_text ? `<div class="pp-copy" style="margin-top:6px">${esc(t.ask_text)}</div>` : ""}
        <div style="margin-top:6px">ملصق التقييم في آخر صفحة.</div></div>`;
    }
    if (key === "posts" && (d.posts || []).length) {
      return d.posts.map((p, i) => `<div class="pp-box"><b>${esc(p.title || `المنشور ${i + 1}`)}</b><div class="pp-copy">${esc(p.text)}</div></div>`).join("");
    }
    if (key === "keywords" && (d.keyword_ideas || []).length) {
      return `<div class="pp-box"><ul>${d.keyword_ideas.map((k) => `<li><b>${esc(k.term)}</b>${k.why ? ` — ${esc(k.why)}` : ""}</li>`).join("")}</ul></div>`;
    }
    return "";
  };
  const sticker = stickerHtml();
  return `<div class="pp">
    <div class="pp-head">
      <div class="pp-brand">${logoMark(34)}<span>فلك ٣٦٠</span></div>
      <div class="pp-meta">${fmtDay(d.created_at || new Date().toISOString())}</div>
    </div>
    <h1>خطة رفع ظهور ${esc(b.name || "متجرك")}</h1>
    ${b.address ? `<div class="pp-sub">${esc(b.address)}</div>` : ""}
    ${d.visibility_pct != null || d.realistic_range_m ? `<div class="pp-stats">
      ${d.visibility_pct != null ? `<div><b>${esc(d.visibility_pct)}%</b><span>ظهورك الحالي</span></div>` : ""}
      ${d.realistic_range_m ? `<div><b>${esc(d.realistic_range_m)} م</b><span>نطاقك الواقعي</span></div>` : ""}
      <div><b>${(d.steps || []).length}</b><span>خطوات</span></div></div>` : ""}
    ${d.summary ? `<h2>الخلاصة</h2><p>${esc(d.summary)}</p>` : ""}
    ${(d.blockers || []).length ? `<h2>ما يعيق ظهورك</h2><ol>${d.blockers.map((x) =>
      `<li><b>${esc(x.issue)}</b>${x.why ? ` — ${esc(x.why)}` : ""}</li>`).join("")}</ol>` : ""}
    <h2>الخطوات بالترتيب</h2>
    ${(d.steps || []).map((s) => `<div class="pp-step">
      <div class="pp-step-h"><span class="pp-n">${esc(s.order)}</span><b>${esc(s.title)}</b>
        <small>أثر ${esc(s.impact || "—")}${s.timeframe ? ` · ${esc(s.timeframe)}` : ""}</small></div>
      ${s.detail ? `<p>${esc(s.detail)}</p>` : ""}
      ${s.where ? `<div class="pp-where">أين: ${esc(s.where)}</div>` : ""}
      ${block(s.content_key)}
    </div>`).join("")}
    <div class="pp-foot">falak360.net · التحليلات إرشادية ولا تضمن ترتيباً معيناً</div>
    ${sticker ? `<div class="pp-page">${sticker}</div>` : ""}
  </div>`;
}

function printPlan() {
  if (!lastPlan) return;
  $("printArea").innerHTML = planPrintHtml(lastPlan);
  document.body.classList.add("printing-plan");
  const done = () => { document.body.classList.remove("printing-plan"); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  setTimeout(() => window.print(), 50);
}

const HIST_CSS = `
.hist{display:grid;gap:8px;margin-top:10px}
.hist .btn{justify-content:center}
.hist-date{font-size:12px;color:var(--ink-3);font-weight:400;margin-inline-start:6px}
.hist-sel{height:40px;font-size:13.5px}
.saved-note{display:flex;align-items:center;gap:8px;padding:9px 12px;margin-bottom:12px;border-radius:var(--r);
  background:var(--info-tint,#eef3fb);color:var(--info,#2f5d9b);font-size:13px}
.saved-note svg{width:15px;height:15px;flex:0 0 auto}
.plan-tools{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px}
#printArea .pp{display:none}
@media print{
  body.printing-plan #printArea{position:static!important;display:block!important;inset:auto;background:#fff}
  body.printing-plan #printArea .pp{display:block}
  @page{size:A4;margin:14mm}
  .pp{font-family:inherit;color:#101820;direction:rtl;font-size:12.5px;line-height:1.75;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pp-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #263A63;padding-bottom:8px;margin-bottom:14px}
  .pp-brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;color:#263A63}
  .pp-meta{color:#666;font-size:12px}
  .pp h1{font-size:20px;margin:0 0 4px;color:#101820}
  .pp-sub{color:#666;font-size:12px;margin-bottom:10px}
  .pp h2{font-size:15px;color:#263A63;margin:16px 0 6px;border-bottom:1px solid #e3e6ec;padding-bottom:4px}
  .pp p{margin:4px 0}
  .pp ol,.pp ul{margin:4px 0;padding-inline-start:20px}
  .pp-stats{display:flex;gap:10px;margin:10px 0}
  .pp-stats div{flex:1;border:1px solid #e3e6ec;border-radius:8px;padding:8px;text-align:center}
  .pp-stats b{display:block;font-size:17px;color:#263A63}
  .pp-stats span{font-size:11px;color:#666}
  .pp-step{border:1px solid #e3e6ec;border-radius:8px;padding:10px 12px;margin:8px 0;break-inside:avoid}
  .pp-step-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .pp-step-h small{color:#666;font-size:11px}
  .pp-n{width:22px;height:22px;border-radius:50%;background:#263A63;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px}
  .pp-where{font-size:11.5px;color:#555;margin-top:4px}
  .pp-box{background:#f5f6f8;border-radius:6px;padding:8px 10px;margin-top:6px}
  .pp-copy{white-space:pre-line}
  .pp-foot{margin-top:16px;font-size:10.5px;color:#888;text-align:center}
  .pp-page{break-before:page;display:flex;justify-content:center;padding-top:30mm}
  .pp-page .sticker{box-shadow:none}
}`;
(() => { const st = document.createElement("style"); st.textContent = HIST_CSS; document.head.appendChild(st); })();
histInit();

/* =========================================================
   موردون لنشاطك
   ========================================================= */
let supCache = null, supState = { q: "", city: "" }, supOpen = new Set();

async function loadSuppliers(force) {
  const gate = $("supGate"), body = $("supBody");
  if (!currentBiz) {
    body.innerHTML = "";
    return emptyState(gate, "shopping-cart", "اختر محلك أولاً",
      "نحتاج معرفة نشاط محلك لنعرض لك الموردين المناسبين.", "اذهب إلى نظرة عامة", "overview");
  }
  gate.innerHTML = "";
  if (supCache && !force) return renderSuppliers();
  body.innerHTML = `<div class="card" style="display:flex;align-items:center;gap:10px">
    <span class="spinner" style="border-color:var(--line-2);border-top-color:var(--brand)"></span>نبحث عن موردين لنشاطك…</div>`;
  try {
    const { data, error } = await sb.rpc("suppliers_for_business", { p_business: currentBiz });
    if (error) throw error;
    supCache = data;
    renderSuppliers();
  } catch {
    body.innerHTML = "";
    msg2(body, "error", T("msg.error", "تعذّر إكمال العملية الآن — حاول بعد قليل."));
  }
}

function msg2(box, kind, text) {
  const d = document.createElement("div");
  d.className = "msg";
  box.appendChild(d);
  msg(d, kind, text);
}

function renderSuppliers() {
  const d = supCache, body = $("supBody");
  if (!d) return;
  if (d.error) { body.innerHTML = `<div class="hint">${esc(d.error)}</div>`; return; }
  if (d.no_sector) {
    body.innerHTML = "";
    return emptyState(body, "shopping-cart", "نشاط محلك غير محدد بعد",
      "أعد إضافة محلك من شاشة «نظرة عامة» عبر البحث ليُحدَّد نشاطه، فنعرض لك الموردين المناسبين.", "اذهب إلى نظرة عامة", "overview");
  }
  if (d.locked) return renderSupLock();

  const reg = d.registered || [], maps = d.maps || [];
  const q = supState.q.trim();
  const match = (s) => (!q || (s.name || "").includes(q) || (s.category || "").includes(q))
    && (!supState.city || s.city === supState.city);
  const regF = reg.filter(match), mapsF = maps.filter(match);
  const cities = [...new Set(maps.map((m) => m.city).filter(Boolean))];

  body.innerHTML = `
    <div class="sup-head">
      <div class="sup-count">${esc(d.sector_name || "")}${d.city ? ` · ${esc(d.city)}` : ""} —
        ${reg.length ? `${reg.length} مورد موثّق و` : ""}${maps.length} نشاط قريب</div>
    </div>
    ${d.tools ? `<div class="sup-tools">
      <input id="supQ" class="input" type="search" placeholder="ابحث باسم المورد أو تخصصه" value="${esc(supState.q)}">
      <select id="supCity" class="select">
        <option value="">كل المدن</option>
        ${cities.map((c) => `<option ${c === supState.city ? "selected" : ""}>${esc(c)}</option>`).join("")}
      </select>
    </div>` : ""}

    ${regF.length ? `<div class="section-head" style="margin-top:0"><h2>${esc(T("suppliers.registered_head", "موردون موثّقون"))}</h2></div>
      ${regF.map(supCard).join("")}
      <div class="sup-note">${esc(T("suppliers.verified_note", "التوثيق يعني أننا تحققنا من السجل التجاري للمنشأة، ولا يعني ضمان جودة منتجاتها."))}</div>` : ""}

    ${mapsF.length ? `<div class="section-head"><h2>${esc(T("suppliers.maps_head", "موردون آخرون في منطقتك"))}</h2>
        ${d.maps_city && d.maps_city !== d.city ? `<span class="note">أقرب مدينة متوفرة: ${esc(d.maps_city)}</span>` : ""}</div>
      ${mapsF.map(mapsCard).join("")}` : ""}

    ${!regF.length && !mapsF.length ? `<div class="hint">${esc(q || supState.city
      ? "لا نتائج مطابقة — جرّب كلمة أخرى."
      : T("suppliers.empty", "لم نجد موردين لنشاطك في منطقتك بعد — نضيف موردين جدداً باستمرار."))}</div>` : ""}`;

  wireSuppliers();
}

function supCard(s) {
  const acts = [];
  if (s.whatsapp) acts.push(`<a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener" data-track="${esc(s.id)}|whatsapp">${icon("message-square", 15)}واتساب</a>`);
  if (s.phone) acts.push(`<a href="tel:+${esc(s.phone)}" data-track="${esc(s.id)}|call">${icon("phone", 15)}اتصال</a>`);
  if (s.maps_url) acts.push(`<a href="${esc(s.maps_url)}" target="_blank" rel="noopener" data-track="${esc(s.id)}|map">${icon("map-pin", 15)}قوقل ماب</a>`);
  const open = supOpen.has(s.id);
  const det = open ? (s.details || null) : null;

  return `<div class="sup verified">
    <div class="sup-top">
      <div class="sup-logo">${s.logo_url ? `<img src="${esc(s.logo_url)}" alt="">` : esc(String(s.name || "م").charAt(0))}</div>
      <div class="sup-t">
        <div class="sup-name">${esc(s.name)}</div>
        <div class="sup-meta">${esc(s.city || "")}${s.covers_all_ksa ? " · يوصل لكل المملكة"
          : (s.coverage_cities || []).length ? ` · يوصل إلى ${esc(s.coverage_cities.slice(0, 3).join("، "))}` : ""}</div>
        <div class="sup-badges">
          <span class="vb">${icon("check-circle", 13)}${esc(T("suppliers.verified_badge", "سجل تجاري موثّق"))}</span>
          ${s.featured ? `<span class="vb star">${icon("star", 13)}مميز</span>` : ""}
        </div>
      </div>
    </div>
    ${s.bio || s.min_order || s.website ? `<div class="sup-body">
      ${s.bio ? `<div class="bio">${esc(open ? s.bio : String(s.bio).slice(0, 160) + (s.bio.length > 160 ? "…" : ""))}</div>` : ""}
      ${s.min_order ? `<div>الحد الأدنى للطلب: ${esc(s.min_order)}</div>` : ""}
      ${s.website ? `<div><a href="${esc(s.website)}" target="_blank" rel="noopener" data-track="${esc(s.id)}|website">الموقع الإلكتروني ↗</a></div>` : ""}
    </div>` : ""}
    ${det?.products?.length ? `<div class="sup-prods">${det.products.map((p) => `
      <div class="sup-prod"><b>${esc(p.name)}</b>
        ${p.description ? `<div>${esc(p.description)}</div>` : ""}
        ${p.price_text ? `<div class="p">${esc(p.price_text)}</div>` : ""}</div>`).join("")}</div>` : ""}
    ${acts.length ? `<div class="sup-acts">${acts.join("")}</div>` : ""}
    ${s.products_count || s.bio ? `<button class="sup-more" data-detail="${esc(s.id)}">${open ? "إخفاء التفاصيل" : `التفاصيل${s.products_count ? ` و${s.products_count} منتجاً` : ""}`}</button>` : ""}
  </div>`;
}

function mapsCard(s) {
  const acts = [];
  if (s.phone) acts.push(`<a href="tel:${esc(s.phone)}" data-track="${esc(s.id)}|call">${icon("phone", 15)}اتصال</a>`);
  if (s.maps_url) acts.push(`<a href="${esc(s.maps_url)}" target="_blank" rel="noopener" data-track="${esc(s.id)}|map">${icon("map-pin", 15)}قوقل ماب</a>`);
  return `<div class="sup">
    <div class="sup-top">
      <div class="sup-logo">${esc(String(s.name || "م").charAt(0))}</div>
      <div class="sup-t">
        <div class="sup-name">${esc(s.name)}</div>
        <div class="sup-meta">${esc(s.category || "")}${s.distance_km != null ? ` · ${s.distance_km} كم` : ""}${
          s.rating ? ` · ★ ${s.rating} (${s.reviews ?? 0})` : ""}</div>
        <div class="sup-badges"><span class="vb maps">${esc(T("suppliers.maps_label", "نشاط على قوقل ماب — غير موثّق"))}</span></div>
      </div>
    </div>
    ${s.address || s.website ? `<div class="sup-body">${s.address ? esc(s.address) : ""}
      ${s.website ? `<div><a href="${esc(s.website)}" target="_blank" rel="noopener" data-track="${esc(s.id)}|website">الموقع الإلكتروني ↗</a></div>` : ""}</div>` : ""}
    ${acts.length ? `<div class="sup-acts">${acts.join("")}</div>` : ""}
    ${s.claimable ? `<a class="sup-claim" href="supplier.html?claim=${esc(s.id)}" target="_blank" rel="noopener">
      ${icon("building", 15)}${esc(T("suppliers.claim", "هل هذا نشاطك؟ وثّقه واظهر في المقدمة"))}</a>` : ""}
    <button class="sup-more" data-report="${esc(s.id)}">إبلاغ عن بيانات غير صحيحة</button>
  </div>`;
}

function wireSuppliers() {
  const body = $("supBody");
  const q = $("supQ");
  if (q) {
    let t = null;
    q.oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        supState.q = q.value;
        renderSuppliers();
        const n = $("supQ"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
      }, 300);
    };
    $("supCity").onchange = () => { supState.city = $("supCity").value; renderSuppliers(); };
  }
  body.querySelectorAll("[data-track]").forEach((a) => a.addEventListener("click", () => {
    const [id, kind] = a.dataset.track.split("|");
    sb.rpc("supplier_track", { p_supplier: id, p_kind: kind }).catch(() => {});
  }));
  body.querySelectorAll("[data-detail]").forEach((b) => b.onclick = async () => {
    const id = b.dataset.detail;
    if (supOpen.has(id)) { supOpen.delete(id); return renderSuppliers(); }
    busy(b, true, "جارٍ الفتح");
    const s = (supCache.registered || []).find((x) => x.id === id);
    try {
      const { data } = await sb.rpc("supplier_profile", { p_supplier: id });
      if (s && data && !data.error && !data.locked) s.details = data;
    } catch { /* */ }
    supOpen.add(id);
    renderSuppliers();
  });
  body.querySelectorAll("[data-report]").forEach((b) => b.onclick = async () => {
    const reason = prompt("ما المشكلة في هذا المورد؟ (مثل: رقم غير صحيح، أو مغلق نهائياً)");
    if (!reason) return;
    busy(b, true, "جارٍ الإرسال");
    try {
      const { data } = await sb.rpc("report_supplier", { p_supplier: b.dataset.report, p_reason: reason });
      busy(b, false, "إبلاغ عن بيانات غير صحيحة");
      b.textContent = data?.message || "وصلنا بلاغك";
    } catch { busy(b, false, "إبلاغ عن بيانات غير صحيحة"); }
  });
}

/* شاشة الاشتراك — للباقة المجانية */
const PLAN_FEATURES = {
  basic: ["موردون موثّقون وموردون في منطقتك", "فحص الترتيب وتدقيق الملف", "خطة رفع الظهور"],
  growth: ["كل ما في الأساسية", "فلترة الموردين بالمدينة والبحث فيهم", "تحليل المنافسين ومراقبة نطاقك"],
  pro: ["كل ما في النمو", "حصص أعلى لكل التحاليل", "أولوية في الدعم"],
};

async function renderSupLock() {
  const d = supCache, body = $("supBody");
  const n = (d.counts?.registered || 0) + (d.counts?.maps || 0);
  let plans = [];
  try {
    const { data } = await sb.from("plans").select("code, name, price_sar, sort_order")
      .eq("is_active", true).gt("price_sar", 0).order("sort_order");
    plans = data || [];
  } catch { /* */ }

  body.innerHTML = `
    <div class="lock">
      <h2>${esc(T("suppliers.locked_title", "موردون لنشاطك في منطقتك"))}</h2>
      <p>${esc(T("suppliers.locked_body", "اشترك في إحدى الباقات ليظهر لك الموردون المتوافقون مع نشاطك في منطقتك."))}</p>
      ${n ? `<div class="lock-count">${icon("shopping-cart", 16)}${n} مورداً جاهزاً لقطاع ${esc(d.sector_name || "نشاطك")}${d.city ? ` في ${esc(d.city)}` : ""}</div>` : ""}
      <div class="blur">
        ${[0, 1].map(() => `<div class="sup" style="margin-bottom:8px"><div class="sup-top">
          <div class="sup-logo">م</div>
          <div class="sup-t"><div class="sup-name">مؤسسة التوريد الحديثة</div>
            <div class="sup-meta">${esc(d.city || "مدينتك")} · يوصل لكل المملكة</div></div></div></div>`).join("")}
      </div>
      <div class="plan-cards">
        ${plans.map((p) => `
          <div class="plan-c ${p.code === "growth" ? "best" : ""}">
            <h4>${esc(p.name)}</h4>
            <div class="pr"><b class="num">${p.price_sar}</b> ريال شهرياً</div>
            <ul>${(PLAN_FEATURES[p.code] || []).map((f) => `<li>${icon("check-circle", 15)}<span>${esc(f)}</span></li>`).join("")}</ul>
            <button class="btn block ${p.code === "growth" ? "" : "ghost"}" data-sub="${esc(p.code)}">اشترك في ${esc(p.name)}</button>
          </div>`).join("")}
      </div>
      <div id="supPay"></div>
    </div>`;

  body.querySelectorAll("[data-sub]").forEach((b) => b.onclick = async () => {
    busy(b, true, "جارٍ التجهيز");
    try {
      const { data, error } = await sb.rpc("request_subscription", { p_plan_code: b.dataset.sub });
      if (error) throw error;
      const url = data?.payment_link;
      $("supPay").innerHTML = `<div class="card sp-t" style="text-align:start">
        <b>${esc(data?.plan || "")} — ${esc(data?.amount_sar ?? "")} ريال</b>
        <div class="hint" style="margin:6px 0 0">${esc(data?.message || "")}</div>
        ${url ? `<a class="btn block sp-t" href="${esc(url)}" target="_blank" rel="noopener" data-pay="${esc(data.subscription_id)}">ادفع الآن</a>` : ""}</div>`;
      window.falakAccount?.refreshBadge?.();
      $("supPay").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
      msg2($("supPay"), "error", friendly(e));
    }
    busy(b, false, "");
  });
}

/* ---------------- الإقلاع ---------------- */
async function boot() {
  await loadTexts();
  initChrome();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { $("authScreen").className = "auth-wrap"; return; }

  $("authScreen").className = "auth-wrap hidden";
  $("app").className = "";
  locateUser();

  const list = await loadBusinesses();
  refreshGates();
  refreshHistory("loc").catch(() => {});
  refreshHistory("buy").catch(() => {});
  if (list.length === 1) {
    $("bizSelect").value = list[0].id;
    $("bizSelect").dispatchEvent(new Event("change"));
  }
}
boot();


