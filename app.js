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
let map, layer, locMap, locLayer, locPick = null;

/* ---------------- رسائل ---------------- */
function msg(el, kind, text) {
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}
function clearMsg(el) { el.className = "msg"; el.innerHTML = ""; }

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

/* ---------------- التنقّل ---------------- */
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.screen === name));
  const el = $(`screen-${name}`);
  if (el) el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (name === "rank") {
    initMap();
    requestAnimationFrame(() => setTimeout(() => map && map.invalidateSize(), 80));
  }
  if (name === "site") {
    initLocMap();
    requestAnimationFrame(() => setTimeout(() => locMap && locMap.invalidateSize(), 80));
  }
}

function initChrome() {
  $("authLogo").innerHTML = logoMark(44);
  $("headerLogo").innerHTML = logoMark(30);
  document.querySelectorAll(".tab").forEach((t) => {
    t.insertAdjacentHTML("afterbegin", icon(t.dataset.icon, 17));
    t.onclick = () => showScreen(t.dataset.screen);
  });
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
  if (error) return msg($("authMsg"), "error", error.message);
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
  if (error) return msg($("authMsg"), "error", error.message);
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
    .setView(userLoc ? [userLoc.lat, userLoc.lng] : [21.5433, 39.1728], 13);
  baseLayer().addTo(map);
  layer = L.layerGroup().addTo(map);
}

function initLocMap() {
  if (locMap) return;
  if (!$("locMap")) return;
  locMap = L.map("locMap", { scrollWheelZoom: false })
    .setView(userLoc ? [userLoc.lat, userLoc.lng] : [21.5433, 39.1728], userLoc ? 14 : 12);
  baseLayer().addTo(locMap);
  locLayer = L.layerGroup().addTo(locMap);
  locMap.on("click", (e) => {
    locPick = { lat: e.latlng.lat, lng: e.latlng.lng };
    drawPick();
    $("locBtn").disabled = false;
  });
}

function drawPick() {
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
  msg($("searchMsg"), "info", "نبحث في قوقل ماب…");
  $("searchResults").innerHTML = "";

  try {
    const { data, error } = await sb.functions.invoke("search-business", {
      body: { query: q, lat: userLoc?.lat, lng: userLoc?.lng },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    if (!data.results.length) return msg($("searchMsg"), "error", "لا نتائج. جرّب الاسم كما هو مكتوب في قوقل.");

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
    msg($("searchMsg"), "error", "تعذّر البحث: " + (e.message || e));
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
  if (error) return msg($("searchMsg"), "error", error.message);

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
  if (error) return msg($("scanMsg"), "error", error.message);
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
    msg($("scanMsg"), "error", "تعذّر الفحص: " + (e.message || e));
  } finally { busy(btn, false, "ابدأ الفحص"); updateScanBtn(); }
};

/* ---------------- تدقيق الملف ---------------- */
$("auditBtn").onclick = async () => {
  const btn = $("auditBtn");
  busy(btn, true, "جارٍ الفحص");
  msg($("auditMsg"), "info", "نقرأ ملفك من قوقل…");

  try {
    const { data, error } = await sb.functions.invoke("audit-profile", { body: { business_id: currentBiz } });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

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
    clearMsg($("auditMsg"));
  } catch (e) {
    msg($("auditMsg"), "error", "تعذّر الفحص: " + (e.message || e));
  } finally { busy(btn, false, "افحص ملفي"); }
};

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
    box.innerHTML = `<div class="hint">لا يتوفر معرّف قوقل لهذا المحل — أعد إضافته من شاشة «نظرة عامة» عبر البحث ليُحفظ معرّفه.</div>`;
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
    <div class="policy-note">${icon("alert-triangle", 15)}<span>اطلب الرأي بلا مقابل. تقديم خصم أو هدية مقابل التقييم مخالف لسياسات قوقل وقد يُعرّض ملفك للتعليق.</span></div>`;

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

function renderPlan(d) {
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
  msg($("planMsg"), "info", "نقرأ ملفك وفحوصاتك ومنافسيك ونكتب خطتك. قد يستغرق دقيقة.");
  try {
    const { data, error } = await sb.functions.invoke("growth-plan", {
      body: { business_id: currentBiz },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    renderPlan(data);
    clearMsg($("planMsg"));
  } catch (e) {
    msg($("planMsg"), "error", "تعذّر إنشاء الخطة: " + (e.message || e));
  } finally { busy(btn, false, "أنشئ خطتي"); }
};

/* ---------------- تحليل المراجعات ---------------- */
$("revBtn").onclick = async () => {
  const btn = $("revBtn");
  busy(btn, true, "جارٍ التحليل");
  msg($("revMsg"), "info", "نسحب المراجعات ونحللها. قد يستغرق دقيقة.");

  try {
    const { data, error } = await sb.functions.invoke("analyze-reviews", {
      body: { business_id: currentBiz, depth: 50 },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

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
    clearMsg($("revMsg"));
  } catch (e) {
    msg($("revMsg"), "error", "تعذّر التحليل: " + (e.message || e));
  } finally { busy(btn, false, "حلّل المراجعات"); }
};

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
    msg($("watchMsg"), "error", "تعذّرت المراقبة: " + (e.message || e));
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
  msg($("compMsg"), "info", "نقرأ ملفات منافسيك ومراجعاتهم. قد يستغرق دقيقتين.");

  try {
    const { data, error } = await sb.functions.invoke("analyze-competitors", {
      body: { business_id: currentBiz, max_competitors: 3, review_depth: 30 },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

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
    clearMsg($("compMsg"));
  } catch (e) {
    msg($("compMsg"), "error", "تعذّر التحليل: " + (e.message || e));
  } finally { busy(btn, false, "حلّل المنافسين بعمق"); }
};

function fillPoints(boxId, listId, arr, cls) {
  if (!(arr || []).length) { $(boxId).className = "hidden"; return; }
  $(listId).innerHTML = arr.map((x) => `<div class="point ${cls}">${esc(x)}</div>`).join("");
  $(boxId).className = "";
}

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
  if (!locPick) return msg($("locMsg"), "error", "اضغط على الخريطة لتحديد الموقع.");

  const btn = $("locBtn");
  busy(btn, true, "جارٍ التحليل");
  msg($("locMsg"), "info", "نمسح المنطقة ونقرأ المنافسين والمحيط. قد يستغرق دقيقتين.");

  try {
    const { data, error } = await sb.functions.invoke("analyze-location", {
      body: {
        activity: act, lat: locPick.lat, lng: locPick.lng,
        area_label: $("locArea").value.trim() || null,
        radius_m: +$("locRadius").value,
      },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);

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
        const v = byHour[h] ?? 0;
        const pk = (ph.top || []).includes(h) ? " class='peak'" : "";
        html += `<i${pk} style="height:${Math.max(3, (v / max) * 100)}%" title="${fmtH(h)}"></i>`;
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
      cs.forEach((c) => {
        L.circleMarker([c.lat, c.lng], {
          radius: 7, color: "#fff", weight: 1.5,
          fillColor: (c.rating ?? 5) < 4 ? "#A8271F" : "#A96A12", fillOpacity: .95,
        }).bindPopup(`<div class="pop"><h4>${esc(c.name)}</h4>
          <div class="r"><span>★ ${c.rating ?? "—"}</span><span>${c.reviews ?? 0} مراجعة</span></div></div>`)
          .addTo(locLayer);
      });
    } else $("lcCompBox").className = "hidden";

    $("locDisc").textContent = data.disclaimer || "";
    $("locResult").className = "";
    clearMsg($("locMsg"));
  } catch (e) {
    msg($("locMsg"), "error", "تعذّر التحليل: " + (e.message || e));
  } finally { busy(btn, false, "حلّل الموقع"); }
};

/* ---------------- الإقلاع ---------------- */
async function boot() {
  initChrome();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { $("authScreen").className = "auth-wrap"; return; }

  $("authScreen").className = "auth-wrap hidden";
  $("app").className = "";
  locateUser();

  const list = await loadBusinesses();
  refreshGates();
  if (list.length === 1) {
    $("bizSelect").value = list[0].id;
    $("bizSelect").dispatchEvent(new Event("change"));
  }
}
boot();
