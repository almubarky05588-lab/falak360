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

/* الحالة */
let currentBiz = null;
let currentBizData = null;
let currentKw = null;
let userLoc = null;
let map, layer, locMap, locLayer, locPick = null;

/* ---------------- رسائل الحالة ---------------- */
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

/* ---------------- حالات فارغة ---------------- */
function emptyState(el, iconName, title, body, actionLabel, actionScreen) {
  el.innerHTML = `<div class="empty">
    ${icon(iconName, 34)}
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${actionLabel ? `<button class="btn" data-goto="${actionScreen}">${esc(actionLabel)}</button>` : ""}
  </div>`;
  el.querySelectorAll("[data-goto]").forEach((b) =>
    b.onclick = () => showScreen(b.dataset.goto));
}

/* ---------------- التنقّل ---------------- */
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.screen === name));
  const el = $(`screen-${name}`);
  if (el) el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "rank" && map) setTimeout(() => map.invalidateSize(), 60);
  if (name === "site") { initLocMap(); setTimeout(() => locMap && locMap.invalidateSize(), 60); }
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
  map = L.map("map", { scrollWheelZoom: false })
    .setView(userLoc ? [userLoc.lat, userLoc.lng] : [21.5433, 39.1728], 13);
  baseLayer().addTo(map);
  layer = L.layerGroup().addTo(map);
}

function initLocMap() {
  if (locMap) return;
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
    radius: +$("locRadius").value, color: "#263A63",
    weight: 1, fillOpacity: .07,
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
  return L.divIcon({
    className: "",
    html: `<div class="rank-pin" style="background:${rankColor(rank)};width:34px;height:34px">${rank ?? "—"}</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
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
  ["scanResult", "auditResult", "revResult", "compResult"].forEach((id) => {
    const el = $(id);
    if (el) el.className = "hidden";
  });
  ["scanMsg", "auditMsg", "revMsg", "compMsg"].forEach((id) => {
    const el = $(id);
    if (el) clearMsg(el);
  });
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
  }
  refreshGates();
};

async function renderOverview() {
  const b = currentBizData;
  if (!b) return;

  const [{ count: kwCount }, { count: scanCount }] = await Promise.all([
    sb.from("keywords").select("*", { count: "exact", head: true }).eq("business_id", b.id),
    sb.from("scans").select("*", { count: "exact", head: true })
      .eq("business_id", b.id).eq("status", "completed"),
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
    { s: "profile", i: "clipboard-check", t: "دقّق ملفك التجاري", d: "النواقص التي تُضعف ظهورك" },
    { s: "reviews", i: "message-square", t: "حلّل مراجعاتك", d: "ما يتكرر من مديح وشكاوى" },
    { s: "rivals", i: "users", t: "حلّل منافسيك", d: "يتطلب فحص ترتيب سابق" },
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

/* ---------------- الكلمات المفتاحية ---------------- */
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

/* ---------------- الحواجز ---------------- */
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
      vis >= 90 ? "ظاهر في معظم المنطقة" : vis >= 60 ? "ظهور جزئي" : "ظهور ضعيف";
    $("scanNote").textContent = data.avg_rank
      ? `متوسط ترتيبك ${data.avg_rank} عبر ${data.points_done} نقطة.`
      : "لم تظهر في نتائج هذه الكلمة.";

    $("stAvg").textContent = data.avg_rank ?? "—";
    $("stBest").textContent = data.best_rank ?? "—";
    $("stWorst").textContent = data.worst_rank ?? "—";
    $("stVis").textContent = vis + "%";

    $("scanResult").className = "";
    initMap();
    setTimeout(() => map.invalidateSize(), 60);

    const { data: pts } = await sb.from("scan_points").select("*").eq("scan_id", data.scan_id);
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
      ? `${failed} نقطة تحتاج معالجة. ابدأ بالأولى فأثرها أكبر.`
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
    $("weaknesses").innerHTML = topics(data.weaknesses, "var(--bad)");
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

/* ---------------- تحليل المنافسين ---------------- */
const threatClass = (t) => String(t || "").includes("مرتفع") ? "bad"
  : String(t || "").includes("منخفض") ? "ok" : "warn";

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
      chips.push(`فوقك في ${c.appearances} نقطة`);
      if (c.best_rank) chips.push(`أفضل ترتيب ${c.best_rank}`);
      const li = (arr) => (arr || []).length
        ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>—</li>";

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
  } finally { busy(btn, false, "حلّل المنافسين"); }
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
const fmtH = (h) => h === 0 ? "12ص" : h < 12 ? `${h}ص` : h === 12 ? "12م" : `${h - 12}م`;

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

    /* المؤشرات */
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

    /* المحيط */
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

    /* العلامات */
    const br = m.brands || [];
    if (br.length) {
      $("brandList").innerHTML = br.map((b) =>
        `<span class="chip">${icon("star", 13)}${esc(b.name)} · ${b.distance_m}م</span>`).join("");
      $("brandBox").className = "";
    } else $("brandBox").className = "hidden";

    /* الزخم */
    const mg = m.magnets || [];
    if (mg.length) {
      $("magList").innerHTML = mg.map((x) =>
        `<div class="list-row"><span>${esc(x.name)}</span>
         <span class="meta num">${x.reviews} مراجعة · ${x.distance_m}م</span></div>`).join("");
      $("magBox").className = "";
    } else $("magBox").className = "hidden";

    /* الساعات */
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

    /* المنافسون على الخريطة */
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
  initMap();

  const list = await loadBusinesses();
  refreshGates();
  if (list.length === 1) {
    $("bizSelect").value = list[0].id;
    $("bizSelect").dispatchEvent(new Event("change"));
  }
}
boot();
