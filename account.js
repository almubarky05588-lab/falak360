/* =========================================================
   فلك ٣٦٠ — شاشة «اشتراكي»
   تُحقن تلقائياً: تبويب + شاشة + شارة الأيام في الترويسة
   + بوابة الرصيد أمام تحليل «موقع مشروع» و«محل معروض للبيع»
   ========================================================= */

import { icon } from "./icons.js";

const SUPABASE_URL = "https://dpkvkwcofxeptpzdsjre.supabase.co";
const SUPABASE_KEY = "sb_publishable_Krja6qX-HGdklghDfTJmjQ_XpmIgBPe";
const STORE_KEY = "sb-dpkvkwcofxeptpzdsjre-auth-token";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const safeUrl = (u) => (typeof u === "string" && /^https:\/\//i.test(u) ? u : null);
const fmtDate = (iso) => iso
  ? new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",
      { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso))
  : "—";
const daysAr = (n) => n <= 0 ? "ينتهي اليوم" : n === 1 ? "يوم واحد" : n === 2 ? "يومان"
  : n <= 10 ? `${n} أيام` : `${n} يوماً`;

const daysLeftWord = (n) => n <= 0 ? "آخر يوم" : n === 1 ? "يوم متبقٍ" : n === 2 ? "يومان متبقيان"
  : n <= 10 ? "أيام متبقية" : "يوماً متبقياً";

const REPORTS = {
  location: {
    title: "تحليل موقع مشروع", note: "لمن ينوي فتح محل جديد",
    offers: [{ qty: 1, price: 199, label: "تقرير واحد" }, { qty: 3, price: 599, label: "3 تقارير" }],
  },
  acquisition: {
    title: "تحليل محل معروض للبيع", note: "قبل أن تشتري (تقبّل) محلاً",
    offers: [{ qty: 1, price: 349, label: "تقرير واحد" }],
  },
};

const METERS = [
  ["scans", "فحص الترتيب على الخريطة"],
  ["audits", "تدقيق الملف التجاري"],
  ["reviews", "تحليل المراجعات"],
  ["competitors", "تحليل المنافسين"],
  ["plans", "خطة النمو"],
  ["monitors", "رصد تحركات المنافسين"],
];

const reportsAr = (n) => n === 1 ? "تقرير واحد" : n === 2 ? "تقريران"
  : n <= 10 ? `${n} تقارير` : `${n} تقريراً`;

const GATES = [
  { kind: "location", btn: "locBtn", msgEl: "locMsg", result: "locResult" },
  { kind: "acquisition", btn: "buyBtn", msgEl: "buyMsg", result: "buyResult" },
];

let plansCache = [];
let loading = false;
let credits = { location: null, acquisition: null };

/* ---------------- الاتصال ---------------- */
function token() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return s?.access_token ?? s?.currentSession?.access_token ?? null;
  } catch { return null; }
}

async function api(path, { method = "GET", body, headers = {} } = {}) {
  const t = token();
  if (!t) throw new Error("انتهت الجلسة — سجّل الدخول من جديد");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${t}`,
      "Content-Type": "application/json", ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error("انتهت الجلسة — حدّث الصفحة");
  const txt = method === "HEAD" ? "" : await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) throw new Error(data?.message || `تعذّر الاتصال (${res.status})`);
  return { data, res };
}
const rpc = async (fn, args = {}) => (await api(`rpc/${fn}`, { method: "POST", body: args })).data;

/* ---------------- أدوات الواجهة ---------------- */
function msg(el, kind, text) {
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}

function busy(btn, on) {
  if (on) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>لحظة`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.label || "";
  }
}

const CSS = `
.acc-head-actions{display:flex;align-items:center;gap:8px}
.acc-badge.warn{color:var(--warn);border-color:var(--warn)}
.acc-badge.bad{color:var(--bad);border-color:var(--bad)}
.acc-loading{display:flex;align-items:center;gap:10px;color:var(--ink-2);font-size:14px}
.acc-spin{width:16px;height:16px;border:2px solid var(--line-2);border-top-color:var(--brand);border-radius:50%;animation:spin .7s linear infinite}
.acc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.acc-name{font-family:var(--font-display);font-size:20px;font-weight:600;letter-spacing:-.02em}
.acc-tag{color:var(--ink-2);font-size:13.5px;margin-top:4px}
.acc-trial{background:var(--brand-tint);color:var(--brand)}
.acc-days{display:flex;align-items:baseline;gap:8px;margin-top:18px}
.acc-days b{font-family:var(--font-num);font-size:34px;font-weight:600;color:var(--brand);line-height:1}
.acc-days span{font-size:14px;color:var(--ink-2)}
.acc-track{height:6px;background:var(--line);border-radius:999px;overflow:hidden;margin-top:10px}
.acc-track i{display:block;height:100%;background:var(--brand);border-radius:inherit}
.acc-line{font-size:13.5px;color:var(--ink-2);margin-top:10px;line-height:1.7}
.acc-line.warn{color:var(--warn)}
.acc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.acc-meter{padding:12px 0;border-bottom:1px solid var(--line)}
.acc-meter:last-of-type{border-bottom:0}
.acc-mhead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:14px}
.acc-mhead .num{font-size:13px;color:var(--ink-2)}
.acc-meter .acc-track{height:5px;margin-top:8px}
.acc-meter.off .acc-mhead{color:var(--ink-3)}
.acc-full{font-size:12px;color:var(--bad);margin-top:5px}
.acc-credits{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.acc-credit{border:1px solid var(--line);border-radius:var(--r-lg);padding:16px;background:var(--surface)}
.acc-ctop{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.acc-ctitle{font-family:var(--font-display);font-size:15px;font-weight:600}
.acc-cval{text-align:center;min-width:56px}
.acc-cval b{display:block;font-family:var(--font-num);font-size:26px;font-weight:600;line-height:1.1}
.acc-cval span{font-size:11px;color:var(--ink-3)}
.acc-cbtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.acc-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.acc-pcard{border:1px solid var(--line);border-radius:var(--r-lg);padding:18px;background:var(--surface);display:flex;flex-direction:column;gap:12px}
.acc-pcard.current{border-color:var(--brand);background:var(--brand-tint)}
.acc-pname{display:flex;justify-content:space-between;align-items:center;gap:8px;font-family:var(--font-display);font-size:16px;font-weight:600}
.acc-price{font-family:var(--font-num);font-size:26px;font-weight:600;line-height:1}
.acc-price small{font-family:var(--font-body);font-size:12.5px;color:var(--ink-3);font-weight:400;margin-inline-start:4px}
.acc-pcard p{font-size:13px;color:var(--ink-2);line-height:1.6}
.acc-pcard ul{list-style:none;font-size:13px;color:var(--ink-2);display:grid;gap:6px;flex:1}
.acc-pcard li{display:flex;gap:7px;align-items:flex-start}
.acc-pcard li svg{width:14px;height:14px;color:var(--ok);flex:0 0 auto;margin-top:3px}
.acc-paylink{font-weight:600;color:inherit;text-decoration:underline;margin-inline-start:6px}
.acc-gate{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:var(--r);background:var(--brand-tint);color:var(--brand);font-size:13.5px;line-height:1.6;margin-top:var(--sp-4)}
.acc-gate.ok{background:var(--ok-tint);color:var(--ok)}
.acc-gate svg{width:16px;height:16px;flex:0 0 auto;margin-top:3px}
.acc-gate b{font-family:var(--font-num)}
.acc-gate .acc-cbtns{margin-top:10px}
`;

/* ---------------- التركيب ---------------- */
function mount() {
  const tabs = $("tabs");
  const main = document.querySelector("main.page");
  if (!tabs || !main || $("screen-account")) return;

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  tabs.insertAdjacentHTML("beforeend",
    `<button class="tab" data-screen="account" data-icon="banknote">${icon("banknote", 17)}اشتراكي</button>`);
  tabs.lastElementChild.addEventListener("click", open);

  main.insertAdjacentHTML("beforeend", `
    <section id="screen-account" class="screen">
      <h1 class="page-title">اشتراكي</h1>
      <p class="page-sub">باقتك، وما استهلكته منها، ورصيد تقاريرك.</p>
      <div id="accMsg" class="msg"></div>
      <div id="accBody"></div>
    </section>`);

  const logout = $("logoutBtn");
  if (logout) {
    const wrap = document.createElement("div");
    wrap.className = "acc-head-actions";
    logout.parentNode.insertBefore(wrap, logout);
    wrap.innerHTML = `<button id="accBadge" class="btn ghost sm acc-badge hidden"></button>`;
    wrap.appendChild(logout);
    $("accBadge").onclick = open;
  }

  // بعد تسجيل الدخول يظهر التطبيق — حدّث الشارة
  const app = $("app");
  if (app) {
    new MutationObserver(() => {
      if (!app.classList.contains("hidden")) refreshBadge();
    }).observe(app, { attributes: true, attributeFilter: ["class"] });
  }
  mountGates();
  if (token()) refreshBadge();
}

function open() {
  document.querySelectorAll(".screen").forEach((s) =>
    s.classList.toggle("active", s.id === "screen-account"));
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.screen === "account"));
  window.scrollTo({ top: 0, behavior: "smooth" });
  load();
}

/* ---------------- الشارة ---------------- */
function paintBadge(acc) {
  const b = $("accBadge");
  if (!b || !acc?.plan) return;
  const p = acc.plan;
  b.classList.remove("hidden", "warn", "bad");
  if (p.code === "none") { b.textContent = "اشترك الآن"; b.classList.add("bad"); }
  else if (p.in_grace) { b.textContent = "انتهى اشتراكك — جدّد"; b.classList.add("bad"); }
  else {
    b.textContent = `${p.name} · ${daysAr(p.days_left)}`;
    if (p.days_left <= 3) b.classList.add("warn");
  }
}

function sync(acc) {
  paintBadge(acc);
  if (acc?.credits) {
    credits = { location: acc.credits.location ?? 0, acquisition: acc.credits.acquisition ?? 0 };
    paintGates();
  }
}

async function refreshBadge() {
  try { sync(await rpc("my_account")); } catch { /* الشارة ليست حرجة */ }
}

/* ---------------- التحميل ---------------- */
async function load() {
  if (loading) return;
  loading = true;
  const body = $("accBody");
  if (!body.dataset.ready) {
    body.innerHTML = `<div class="card acc-loading"><span class="acc-spin"></span>جارٍ تحميل اشتراكك…</div>`;
  }
  try {
    const [acc, plans, subs, pendCredits, bizCount] = await Promise.all([
      rpc("my_account"),
      api("plans?select=code,name,price_sar,tagline,max_businesses,max_keywords_per_business,scans_per_month,audits_per_month,reviews_per_month,competitors_per_month,monitors_per_month,features&is_active=eq.true&price_sar=gt.0&order=sort_order")
        .then((r) => r.data || []),
      api("subscriptions?select=id,plan_code,amount_sar,payment_link,created_at&status=eq.pending&order=created_at.desc")
        .then((r) => r.data || []),
      api("report_credits?select=id,kind,total,price_sar,payment_link,created_at&status=eq.pending&order=created_at.desc")
        .then((r) => r.data || []),
      api("businesses?select=id", { method: "HEAD", headers: { Prefer: "count=exact" } })
        .then(({ res }) => Number((res.headers.get("content-range") || "").split("/")[1]) || 0)
        .catch(() => null),
    ]);
    if (acc?.error) throw new Error(acc.error);
    plansCache = plans;
    render(acc, subs, pendCredits, bizCount);
    sync(acc);
    body.dataset.ready = "1";
  } catch (e) {
    body.innerHTML = `<div class="empty">${icon("alert-triangle", 34)}
      <h3>تعذّر تحميل اشتراكك</h3><p>${esc(e.message || e)}</p>
      <button class="btn" id="accRetry">حاول مرة أخرى</button></div>`;
    $("accRetry").onclick = load;
  } finally { loading = false; }
}

/* ---------------- العرض ---------------- */
function render(acc, subs, pendCredits, bizCount) {
  const p = acc.plan || {};
  const L = acc.limits || {};
  const U = acc.used || {};
  const bal = acc.credits || {};
  const planOf = (code) => plansCache.find((x) => x.code === code);
  const cur = planOf(p.code);
  const hasPlan = p.code && p.code !== "none";

  /* —— بطاقة الباقة —— */
  let badge, line, lineWarn = false;
  if (!hasPlan) {
    badge = `<span class="badge bad">${icon("x-circle", 13)}بلا اشتراك</span>`;
    line = "انتهت فترتك التجريبية أو اشتراكك. اختر باقة لتكمل متابعة محلك.";
  } else if (p.in_grace) {
    badge = `<span class="badge warn">${icon("clock", 13)}مهلة سماح</span>`;
    line = `انتهى اشتراكك في ${fmtDate(p.ends_at)}. الخدمات متاحة لأيام قليلة فقط — جدّد حتى لا تتوقف.`;
    lineWarn = true;
  } else if (p.is_trial) {
    badge = `<span class="badge acc-trial">${icon("sparkles", 13)}تجربة مجانية</span>`;
    line = `تنتهي تجربتك في ${fmtDate(p.ends_at)}. اشترك قبلها لتبقى بياناتك ومتابعتك مستمرة.`;
  } else {
    badge = `<span class="badge ok">${icon("check-circle", 13)}نشط</span>`;
    line = `ينتهي في ${fmtDate(p.ends_at)} ولا يتجدد تلقائياً — تجدّده بنفسك متى شئت.`;
    lineWarn = p.days_left <= 5;
  }

  let progress = "";
  if (hasPlan && !p.in_grace && p.starts_at && p.ends_at) {
    const s = Date.parse(p.starts_at), e = Date.parse(p.ends_at);
    const left = Math.max(0, Math.min(100, ((e - Date.now()) / (e - s)) * 100));
    progress = `<div class="acc-days"><b class="num">${p.days_left}</b><span>${daysLeftWord(p.days_left)}</span></div>
      <div class="acc-track"><i style="width:${left.toFixed(1)}%"></i></div>`;
  }

  const actions = [];
  if (cur && !p.is_trial) {
    actions.push(`<button class="btn" data-sub="${esc(cur.code)}">جدّد ${esc(cur.name)} · ${cur.price_sar} ر.س</button>`);
    actions.push(`<button class="btn ghost" data-scroll="accPlans">قارن الباقات</button>`);
  } else {
    actions.push(`<button class="btn" data-scroll="accPlans">اختر باقتك</button>`);
  }

  const planCard = `
    <div class="card">
      <div class="acc-top">
        <div>
          <div class="acc-name">${esc(p.name || "—")}</div>
          <div class="acc-tag">${esc(p.tagline || "")}</div>
        </div>
        ${badge}
      </div>
      ${progress}
      <div class="acc-line${lineWarn ? " warn" : ""}">${esc(line)}</div>
      <div class="acc-actions">${actions.join("")}</div>
    </div>`;

  /* —— الاستهلاك —— */
  let usage = "";
  if (hasPlan) {
    const rows = [["businesses", "المحلات", bizCount, L.businesses],
      ...METERS.map(([k, t]) => [k, t, U[k] ?? 0, L[k] ?? 0])];
    const meters = rows.map(([, title, used, limit]) => {
      if (!limit || limit <= 0) {
        return `<div class="acc-meter off"><div class="acc-mhead"><span>${esc(title)}</span>
          <span class="meta">غير متاح في باقتك</span></div></div>`;
      }
      const u = used ?? 0;
      const pct = Math.min(100, (u / limit) * 100);
      const color = pct >= 100 ? "var(--bad)" : pct >= 80 ? "var(--warn)" : "var(--brand)";
      return `<div class="acc-meter">
        <div class="acc-mhead"><span>${esc(title)}</span><span class="num">${used == null ? "—" : u} / ${limit}</span></div>
        <div class="acc-track"><i style="width:${pct.toFixed(1)}%;background:${color}"></i></div>
        ${pct >= 100 ? `<div class="acc-full">استنفدت حدّ هذه الفترة</div>` : ""}
      </div>`;
    }).join("");

    usage = `
      <div class="section-head"><h2>استهلاكك</h2><span class="note">من بداية اشتراكك الحالي</span></div>
      <div class="card">
        ${meters}
        <div class="hint">كلمات البحث: حتى ${L.keywords ?? 0} لكل محل · العمليات الكبيرة اليوم: ${U.heavy_today ?? 0} من ${L.daily_heavy ?? 0}.
        الحدود لا تُرحّل إلى الشهر التالي.</div>
      </div>`;
  }

  /* —— رصيد التقارير —— */
  const creditCards = Object.entries(REPORTS).map(([kind, r]) => `
    <div class="acc-credit">
      <div class="acc-ctop">
        <div><div class="acc-ctitle">${r.title}</div><div class="hint" style="margin-top:2px">${r.note}</div></div>
        <div class="acc-cval"><b>${bal[kind] ?? 0}</b><span>متاح</span></div>
      </div>
      <div class="acc-cbtns">
        ${r.offers.map((o, i) => `<button class="btn sm${i ? " ghost" : ""}" data-report="${kind}" data-qty="${o.qty}">${o.label} · ${o.price} ر.س</button>`).join("")}
      </div>
    </div>`).join("");

  const reports = `
    <div class="section-head"><h2>رصيد التقارير</h2><span class="note">تُشترى بالتقرير ولا تنتهي بانتهاء الشهر</span></div>
    <div class="acc-credits">${creditCards}</div>`;

  /* —— طلبات بانتظار السداد —— */
  const pend = [
    ...subs.map((s) => ({
      title: `اشتراك ${planOf(s.plan_code)?.name ?? s.plan_code}`,
      amount: s.amount_sar, link: safeUrl(s.payment_link), at: s.created_at,
    })),
    ...pendCredits.map((c) => ({
      title: `${REPORTS[c.kind]?.title ?? "تقرير"}${c.total > 1 ? ` × ${c.total}` : ""}`,
      amount: c.price_sar, link: safeUrl(c.payment_link), at: c.created_at,
    })),
  ];
  const pending = pend.length ? `
    <div class="section-head"><h2>بانتظار السداد</h2></div>
    ${pend.map((x) => `
      <div class="list-row">
        <div><div>${esc(x.title)}</div><div class="meta"><span class="num">${x.amount ?? "—"}</span> ر.س · ${fmtDate(x.at)}</div></div>
        ${x.link
          ? `<a class="btn sm" href="${esc(x.link)}">${icon("banknote", 15)}ادفع الآن</a>`
          : `<span class="chip" style="margin:0">بانتظار رابط السداد</span>`}
      </div>`).join("")}
    <div class="hint">رابط السداد صالح لمرة واحدة. بعد السداد نؤكّد الدفع ونفعّل طلبك — عادةً خلال ساعات العمل.</div>` : "";

  /* —— الباقات —— */
  const pendingPlans = new Set(subs.map((s) => s.plan_code));
  const curPrice = (!p.is_trial && cur) ? cur.price_sar : 0;
  const plansHtml = plansCache.map((pl) => {
    const isCur = cur && pl.code === cur.code && !p.is_trial && !p.in_grace;
    const f = pl.features || {};
    const items = [
      pl.max_businesses > 1 ? `حتى ${pl.max_businesses} محلات أو فروع` : "محل واحد",
      `${pl.max_keywords_per_business} كلمات بحث لكل محل`,
      `${pl.scans_per_month} فحص ترتيب شهرياً`,
      `${pl.audits_per_month} تدقيق للملف · ${pl.reviews_per_month} تحليل مراجعات`,
      pl.competitors_per_month > 0 ? `${pl.competitors_per_month} تحليل منافسين شهرياً` : null,
      f.alerts ? "تنبيهات بتحركات المنافسين" : null,
      f.history ? "سجل أدائك عبر الزمن" : null,
      f.branches ? "مقارنة أداء الفروع" : null,
    ].filter(Boolean);

    let label;
    if (pendingPlans.has(pl.code)) label = "أكمل السداد";
    else if (isCur) label = "جدّد باقتك";
    else if (!curPrice) label = `اشترك في ${pl.name}`;
    else label = pl.price_sar > curPrice ? `رقِّ إلى ${pl.name}` : `انتقل إلى ${pl.name}`;

    return `
      <div class="acc-pcard${isCur ? " current" : ""}">
        <div class="acc-pname"><span>${esc(pl.name)}</span>${isCur ? `<span class="badge ok">باقتك</span>` : ""}</div>
        <div class="acc-price num">${pl.price_sar}<small>ر.س / شهر</small></div>
        <p>${esc(pl.tagline || "")}</p>
        <ul>${items.map((t) => `<li>${icon("check-circle", 14)}<span>${esc(t)}</span></li>`).join("")}</ul>
        <button class="btn${isCur ? "" : " ghost"} block" data-sub="${esc(pl.code)}">${esc(label)}</button>
      </div>`;
  }).join("");

  const plansSec = `
    <div class="section-head" id="accPlans"><h2>الباقات</h2><span class="note">شهرية بلا تجديد تلقائي</span></div>
    <div class="acc-plans">${plansHtml}</div>
    <div class="hint">الترقية أو الانتقال يبدأ شهراً جديداً كاملاً من يوم التفعيل.</div>`;

  const body = $("accBody");
  body.innerHTML = planCard + pending + usage + reports + plansSec;

  body.querySelectorAll("[data-sub]").forEach((b) => b.onclick = () => requestSub(b));
  body.querySelectorAll("[data-report]").forEach((b) => b.onclick = () => requestReport(b));
  body.querySelectorAll("[data-scroll]").forEach((b) => b.onclick = () =>
    $(b.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

/* ---------------- الطلبات ---------------- */
function showPay(r, el = $("accMsg")) {
  if (!r?.ok) return msg(el, "error", r?.message || "تعذّر إنشاء الطلب");
  const link = safeUrl(r.payment_link);
  el.className = "msg show done";
  el.innerHTML = `${icon("check-circle", 17)}<span>${esc(r.message)}${link
    ? ` <a class="acc-paylink" href="${esc(link)}">افتح رابط السداد</a>` : ""}</span>`;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function requestSub(btn) {
  busy(btn, true);
  try {
    showPay(await rpc("request_subscription", { p_plan_code: btn.dataset.sub }));
    await load();
  } catch (e) {
    msg($("accMsg"), "error", e.message || String(e));
  } finally { if (btn.isConnected) busy(btn, false); }
}

async function requestReport(btn) {
  busy(btn, true);
  try {
    showPay(await rpc("request_report", { p_kind: btn.dataset.report, p_qty: Number(btn.dataset.qty) || 1 }));
    await load();
  } catch (e) {
    msg($("accMsg"), "error", e.message || String(e));
  } finally { if (btn.isConnected) busy(btn, false); }
}

/* ---------------- بوابة التقارير المدفوعة ---------------- */
function mountGates() {
  GATES.forEach((g) => {
    const btn = $(g.btn);
    if (!btn || $(`gate-${g.kind}`)) return;
    btn.insertAdjacentHTML("beforebegin", `<div id="gate-${g.kind}"></div>`);
    // يعمل قبل معالج app.js: نتحقق من الرصيد ثم نشغّل التحليل بأنفسنا
    btn.addEventListener("click", (ev) => gateClick(ev, g), { capture: true });

    const res = $(g.result);
    if (res) {
      new MutationObserver(() => { if (res.className === "") refreshBadge(); })
        .observe(res, { attributes: true, attributeFilter: ["class"] });
    }
    const m = $(g.msgEl);
    if (m) {
      new MutationObserver(() => { if (m.classList.contains("error")) refreshBadge(); })
        .observe(m, { attributes: true, attributeFilter: ["class"] });
    }
  });
}

function paintGates() {
  GATES.forEach((g) => {
    const el = $(`gate-${g.kind}`);
    const bal = credits[g.kind];
    if (!el) return;
    if (bal == null) { el.innerHTML = ""; return; }
    const r = REPORTS[g.kind];
    if (bal > 0) {
      el.innerHTML = `<div class="acc-gate ok">${icon("check-circle", 16)}
        <span>رصيدك: ${reportsAr(bal)} — يُخصم تقرير واحد عند التحليل.</span></div>`;
      return;
    }
    el.innerHTML = `<div class="acc-gate">${icon("banknote", 16)}<div>
      <div>هذا التحليل يُشترى بالتقرير ولا يحتاج اشتراكاً. اشترِ تقريراً، وبعد تأكيد الدفع يُضاف لرصيدك.</div>
      <div class="acc-cbtns">${r.offers.map((o, i) =>
        `<button class="btn sm${i ? " ghost" : ""}" data-gbuy="${g.kind}" data-qty="${o.qty}">${o.label} · ${o.price} ر.س</button>`).join("")}
      </div></div></div>`;
    el.querySelectorAll("[data-gbuy]").forEach((b) => b.onclick = () => buyFromGate(g, b));
  });
}

async function gateClick(ev, g) {
  const btn = ev.currentTarget;
  if (btn.disabled) return;
  ev.stopImmediatePropagation();
  ev.preventDefault();

  let bal = null;
  try {
    const acc = await rpc("my_account");
    sync(acc);
    bal = credits[g.kind];
  } catch { /* الخادم يتحقق على كل حال */ }

  if (bal === 0) {
    msg($(g.msgEl), "info", "لا يوجد لديك رصيد لهذا التقرير — اشترِ تقريراً من الأعلى.");
    $(`gate-${g.kind}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (bal != null && !window.confirm(`سيُخصم تقرير واحد من رصيدك (لديك ${reportsAr(bal)}). متابعة؟`)) return;

  if (typeof btn.onclick === "function") btn.onclick.call(btn, ev);
}

async function buyFromGate(g, btn) {
  busy(btn, true);
  try {
    const r = await rpc("request_report", { p_kind: g.kind, p_qty: Number(btn.dataset.qty) || 1 });
    showPay(r, $(g.msgEl));
  } catch (e) {
    msg($(g.msgEl), "error", e.message || String(e));
  } finally { if (btn.isConnected) busy(btn, false); }
}

/* ---------------- للشاشات الأخرى ---------------- */
window.falakAccount = { open, refresh: load, refreshBadge };

mount();
