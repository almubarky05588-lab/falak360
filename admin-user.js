/* =========================================================
   فلك ٣٦٠ — لوحة الإدارة: صفحة العميل
   بياناته وتعديلها · اشتراكاته ومدفوعاته · محلاته
   كل تقاريره كما ظهرت له · سجل بحثه ونشاطه
   يُحمَّل من admin.html عند فتح عميل، ويتحدّث تلقائياً
   ========================================================= */

let F = null;            // أدوات admin.html (window.falakAdmin)
let root = null;
let uid = null;
let data = null;
let dataKey = "";
let tab = null;
let repFilter = "all";
const opened = new Set();
const gridCache = new Map();

const TABS = [
  ["reports", "التقارير"],
  ["account", "الحساب"],
  ["billing", "الاشتراك والمدفوعات"],
  ["biz", "المحلات"],
  ["activity", "البحث والنشاط"],
];
const REP = {
  scan: "فحص الترتيب", audit: "تدقيق الملف", reviews: "تحليل المراجعات", competitors: "تحليل المنافسين",
  growth: "خطة النمو", location: "تحليل موقع مشروع", acquisition: "تحليل محل للبيع",
};
const SUB_ST = { active: ["ok", "نشط"], pending: ["warn", "بانتظار السداد"], cancelled: ["mute", "ملغي"], expired: ["mute", "منتهي"] };
const CR_ST = { active: ["ok", "رصيد متاح"], pending: ["warn", "بانتظار السداد"], consumed: ["mute", "مستهلك"], cancelled: ["mute", "ملغي"] };
const RUN_ST = { completed: ["ok", "مكتمل"], running: ["warn", "قيد التشغيل"], failed: ["bad", "فشل"], pending: ["warn", "بانتظار"] };
const AUDIT_AR = {
  update_user: "تعديل الحساب", reset_password_sql: "تعيين كلمة مرور", set_business_sector: "تغيير قطاع محل",
  set_payment_test: "تغيير نوع دفعة", map_category: "ربط تصنيف", save_sector: "حفظ قطاع",
};
const FIELD_AR = { full_name: "الاسم", phone: "الجوال", email: "الإيميل", password: "كلمة المرور" };

const CSS = `
.up-head{display:flex;gap:14px;align-items:flex-start}
.up-av{width:52px;height:52px;flex:0 0 auto;border-radius:50%;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:600;font-size:20px}
.up-name{font-family:var(--font-display);font-size:19px;font-weight:600;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.up-line{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;color:var(--ink-2);margin-top:6px}
.up-line span{display:inline-flex;align-items:center;gap:5px}
.up-line svg{width:14px;height:14px;color:var(--ink-3)}
.up-line .num{direction:ltr;unicode-bidi:embed}
.up-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.up-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:var(--sp-5) 0 var(--sp-4);overflow-x:auto;scrollbar-width:none}
.up-tabs::-webkit-scrollbar{display:none}
.up-tabs button{flex:0 0 auto;height:40px;padding:0 14px;border:0;border-bottom:2px solid transparent;background:none;font:inherit;font-size:14px;color:var(--ink-2);cursor:pointer;margin-bottom:-1px}
.up-tabs button.on{color:var(--brand);border-bottom-color:var(--brand);font-weight:600}
.up-tabs .n{font-family:var(--font-num);font-size:11.5px;color:var(--ink-3);margin-inline-start:4px}
.up-rep{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);margin-bottom:8px;overflow:hidden}
.up-rep-h{display:flex;gap:12px;align-items:center;padding:12px 14px;cursor:pointer}
.up-rep-h:hover{background:var(--surface-2)}
.up-rep-ic{width:34px;height:34px;flex:0 0 auto;border-radius:var(--r-sm);background:var(--brand-tint);color:var(--brand);display:flex;align-items:center;justify-content:center}
.up-rep-ic svg{width:17px;height:17px}
.up-rep-t{flex:1;min-width:0}
.up-rep-t b{display:block;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.up-rep-t span{display:block;font-size:12px;color:var(--ink-3);margin-top:2px}
.up-rep-v{text-align:left;flex:0 0 auto}
.up-rep-v b{display:block;font-family:var(--font-num);font-size:18px;font-weight:600;line-height:1.1}
.up-rep-v span{font-size:11px;color:var(--ink-3)}
.up-rep-b{border-top:1px solid var(--line);padding:14px;background:var(--surface-2)}
.up-sec{margin-bottom:14px}
.up-sec:last-child{margin-bottom:0}
.up-sec h4{font-size:12.5px;font-weight:600;color:var(--ink-2);margin:0 0 7px}
.up-sec p{font-size:13.5px;line-height:1.8;color:var(--ink);margin:0;white-space:pre-line}
.up-items{display:grid;gap:6px}
.up-item{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-sm);padding:9px 11px;font-size:13px;line-height:1.7}
.up-item b{font-weight:600}
.up-item .d{color:var(--ink-2)}
.up-item .m{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.up-item.pass{border-inline-start:3px solid var(--ok)}
.up-item.fail{border-inline-start:3px solid var(--bad)}
.up-bul{margin:0;padding-inline-start:18px;font-size:13.5px;line-height:1.8}
.up-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}
.up-kv div{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-sm);padding:8px 10px}
.up-kv span{display:block;font-size:11.5px;color:var(--ink-3)}
.up-kv b{display:block;font-size:14px;font-weight:600;margin-top:2px;word-break:break-word}
.up-grid{display:grid;gap:3px;max-width:420px;direction:ltr}
.up-grid i{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-style:normal;font-family:var(--font-num);font-size:12px;font-weight:600;color:#fff;cursor:default}
.up-legend{display:flex;flex-wrap:wrap;gap:10px;font-size:11.5px;color:var(--ink-3);margin-top:8px}
.up-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:4px;vertical-align:-1px}
.up-meter{padding:9px 0;border-bottom:1px solid var(--line)}
.up-meter:last-child{border-bottom:0}
.up-meter .h{display:flex;justify-content:space-between;font-size:13.5px}
.up-meter .h span:last-child{font-family:var(--font-num);color:var(--ink-2);font-size:12.5px}
.up-meter .tr{height:5px;background:var(--line);border-radius:999px;margin-top:6px;overflow:hidden}
.up-meter .tr i{display:block;height:100%;border-radius:inherit}
.up-biz{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:14px;margin-bottom:8px}
.up-biz-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
.up-biz .select{height:36px;font-size:13px;width:auto;min-width:180px}
.up-log{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);font-size:13.5px}
.up-log:last-child{border-bottom:0}
.up-log .ic{width:30px;height:30px;flex:0 0 auto;border-radius:50%;background:var(--surface-2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink-2)}
.up-log .ic svg{width:15px;height:15px}
.up-log .t{flex:1;min-width:0}
.up-log .s{font-size:12px;color:var(--ink-3);margin-top:2px}
.up-pw{display:flex;gap:6px}
.up-pw .input{flex:1;direction:ltr;text-align:right;font-family:var(--font-num)}
.up-tbl td .badge{margin:0}
`;

/* ---------------- أدوات صغيرة ---------------- */
const $ = (id) => document.getElementById(id);
const E = (s) => F.esc(s);
const has = (v) => v != null && v !== "" && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
const badge = ([cls, t]) => `<span class="badge ${cls}">${E(t)}</span>`;
const chip = (t) => `<span class="tag">${E(t)}</span>`;
const pct = (n) => (n == null ? "—" : `${F.nf(n)}%`);
const rankColor = (r, found) => (!found || r == null || r > 20) ? "var(--ink-3)"
  : r <= 3 ? "var(--ok)" : r <= 10 ? "#C08A1E" : "var(--bad)";

function ensureCss() {
  if (document.getElementById("upCss")) return;
  const s = document.createElement("style");
  s.id = "upCss";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* عرض عام لأي قيمة JSON (قوائم ونصوص وكائنات) بشكل مقروء */
const TITLE_KEYS = ["title", "topic", "issue", "name", "label", "action", "q", "item", "term", "flag", "point", "type", "text", "key"];
const BODY_KEYS = ["detail", "why", "reason", "description", "means", "answer", "note", "tip", "how", "where", "value"];
const META_KEYS = { impact: "الأثر", weight: "الوزن", percent: "النسبة", priority: "الأولوية", timeframe: "المدة",
  rating: "التقييم", reviews: "المراجعات", avg_rank: "متوسط الترتيب", best_rank: "أفضل ترتيب", distance_m: "المسافة م",
  severity: "الخطورة", order: "الترتيب", count: "العدد", nearest_distance_m: "أقرب مسافة م", fixable: "قابل للإصلاح",
  threat_level: "التهديد", appearances: "مرات الظهور" };
const KEY_AR = {
  ...META_KEYS, type: "النوع", total: "الإجمالي", anchors: "مولدات الحركة القريبة", vitality: "حيوية المحيط",
  location_score: "درجة الموقع", sampled: "مراجعات مفحوصة", last_90d: "آخر ٩٠ يوماً", prev_90d: "الـ٩٠ يوماً السابقة",
  last_180d: "آخر ١٨٠ يوماً", last_365d: "آخر سنة", momentum: "الزخم", older_avg: "متوسط التقييم القديم",
  recent_avg: "متوسط التقييم الحديث", reply_rate: "نسبة رد المالك", busy_rivals: "منافسون مزدحمون الآن",
  vs_area_pct: "مقارنة بالمنطقة ٪", negative_90d: "سلبية آخر ٩٠ يوماً", positive_90d: "إيجابية آخر ٩٠ يوماً",
  rivals_count: "عدد المنافسين", quality_trend: "اتجاه الجودة", reviews_total: "إجمالي المراجعات",
  strong_rivals: "منافسون أقوياء", area_avg_rating: "متوسط تقييم المنطقة", days_since_last: "أيام منذ آخر مراجعة",
  area_avg_reviews: "متوسط مراجعات المنطقة", breakdown: "التفصيل", how: "الطريقة", weeks: "الأسابيع",
  target: "الهدف", per_week: "أسبوعياً", ask_text: "نص الطلب الجاهز", tip: "نصيحة", trend: "الاتجاه",
  last_30d: "آخر ٣٠ يوماً", per_month: "شهرياً", positive_30d: "إيجابية آخر ٣٠ يوماً", negative_30d: "سلبية آخر ٣٠ يوماً",
  price_impression: "انطباع الأسعار", total_points: "نقاط الشبكة", photos: "الصور", category: "التصنيف",
  website: "الموقع الإلكتروني", menu_url: "المنيو", is_top: "الأقوى", busy_now: "مزدحم الآن", is_target: "المحل المستهدف",
  price_level: "مستوى الأسعار", indicators: "المؤشرات", means: "المعنى", what: "ماذا يقيس", status: "الحالة", value: "القيمة",
};

function itemHtml(it) {
  if (it == null) return "";
  if (typeof it !== "object") return `<div class="up-item">${E(it)}</div>`;
  const tk = TITLE_KEYS.find((k) => typeof it[k] === "string" && it[k]);
  const bk = BODY_KEYS.filter((k) => k !== tk && typeof it[k] === "string" && it[k]);
  const meta = Object.entries(META_KEYS).filter(([k]) => it[k] != null && it[k] !== "")
    .map(([k, l]) => chip(`${l}: ${k === "percent" ? pct(it[k]) : it[k]}`));
  const lists = Object.entries(it).filter(([k, v]) => Array.isArray(v) && v.length && v.every((x) => typeof x === "string"))
    .map(([k, v]) => `<ul class="up-bul">${v.map((x) => `<li>${E(x)}</li>`).join("")}</ul>`);
  const cls = it.pass === true ? " pass" : it.pass === false ? " fail" : "";
  if (!tk && !bk.length && !meta.length && !lists.length) {
    return `<div class="up-item">${kvHtml(it)}</div>`;
  }
  return `<div class="up-item${cls}">
    ${tk ? `<b>${it.pass === true ? "✓ " : it.pass === false ? "✗ " : ""}${E(it[tk])}</b>` : ""}
    ${bk.map((k) => `<div class="d">${E(it[k])}</div>`).join("")}
    ${lists.join("")}
    ${meta.length ? `<div class="m">${meta.join("")}</div>` : ""}
  </div>`;
}

function kvHtml(obj) {
  const rows = Object.entries(obj || {}).filter(([, v]) => has(v) && typeof v !== "object");
  if (!rows.length) return "";
  return `<div class="up-kv">${rows.map(([k, v]) =>
    `<div><span>${E(KEY_AR[k] || k)}</span><b>${E(typeof v === "boolean" ? (v ? "نعم" : "لا") : v)}</b></div>`).join("")}</div>`;
}

function valueHtml(v) {
  if (!has(v)) return "";
  if (typeof v === "string" || typeof v === "number") return `<p>${E(v)}</p>`;
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== "object")) return `<ul class="up-bul">${v.map((x) => `<li>${E(x)}</li>`).join("")}</ul>`;
    return `<div class="up-items">${v.map(itemHtml).join("")}</div>`;
  }
  // كائن: القيم البسيطة في شبكة، والقوائم الداخلية تحتها
  const simple = kvHtml(v);
  const nested = Object.entries(v).filter(([, x]) => typeof x === "object" && has(x))
    .map(([k, x]) => `<div class="up-sec" style="margin-top:8px"><h4>${E(KEY_AR[k] || k)}</h4>${valueHtml(x)}</div>`).join("");
  return simple + nested;
}
const sec = (title, v) => has(v) ? `<div class="up-sec"><h4>${E(title)}</h4>${valueHtml(v)}</div>` : "";

/* =========================================================
   الدخول للصفحة
   ========================================================= */
export async function openUser(id, el) {
  F = window.falakAdmin;
  ensureCss();
  root = el;
  if (uid !== id) {
    uid = id; data = null; dataKey = ""; tab = null; repFilter = "all";
    opened.clear(); gridCache.clear();
  }
  F.onTick = () => refresh(true);
  await F.ensureSectors().catch(() => {});
  await refresh(false);
}

async function refresh(silent) {
  if (!uid || !root?.isConnected) return;
  // لا نعيد الرسم أثناء الكتابة في حقل
  const a = document.activeElement;
  if (silent && a && root.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  try {
    const d = await F.rpc("admin_user_detail", { p_user: uid });
    if (d?.error) throw new Error(d.error);
    const key = JSON.stringify({ ...d, generated_at: null });
    F.stamp();
    if (silent && key === dataKey) return;
    data = d; dataKey = key;
    if (!tab) tab = reportsList().length ? "reports" : "account";
    render();
  } catch (e) {
    if (!silent) {
      root.innerHTML = `<div class="back-bar"><button class="btn ghost sm" data-back>رجوع</button></div>
        ${F.empty("alert-triangle", "تعذّر فتح ملف العميل", e.message || String(e))}`;
      root.querySelector("[data-back]").onclick = F.back;
    }
  }
}

/* =========================================================
   الرسم
   ========================================================= */
function reportsList() {
  const d = data || {};
  const out = [];
  (d.scans || []).forEach((x) => out.push({ type: "scan", id: x.id, at: x.created_at, x }));
  (d.audits || []).forEach((x) => out.push({ type: "audit", id: x.id, at: x.created_at, x }));
  (d.reviews || []).forEach((x) => out.push({ type: "reviews", id: x.id, at: x.created_at, x }));
  (d.competitors || []).forEach((x) => out.push({ type: "competitors", id: x.id, at: x.created_at, x }));
  (d.growth || []).forEach((x) => out.push({ type: "growth", id: x.id, at: x.created_at, x }));
  (d.location || []).forEach((x) => out.push({ type: "location", id: x.id, at: x.created_at, x }));
  (d.acquisition || []).forEach((x) => out.push({ type: "acquisition", id: x.id, at: x.created_at, x }));
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

function render() {
  const d = data, u = d.user || {}, p = d.plan || {}, t = d.totals || {};
  const name = u.full_name || u.email || "—";
  const reps = reportsList();
  const secs = [...new Set((d.businesses || []).map((b) => b.sector_name).filter(Boolean))];
  const wa = u.phone ? F.waLink(u.phone, `مرحباً ${u.full_name || ""}، معك فريق فلك ٣٦٠.`) : null;
  const costSar = Number(t.cost_usd || 0) * 3.75;

  const head = `
    <div class="back-bar"><button class="btn ghost sm" data-back>رجوع</button></div>
    <div class="card">
      <div class="up-head">
        <div class="up-av">${E(String(name).trim().charAt(0).toUpperCase())}</div>
        <div style="flex:1;min-width:0">
          <div class="up-name">${E(name)} ${F.planBadge(p)}
            ${u.is_admin ? `<span class="badge info">مشرف</span>` : ""}
            ${u.banned_until && Date.parse(u.banned_until) > Date.now() ? `<span class="badge bad">موقوف</span>` : ""}
            ${!u.email_confirmed_at ? `<span class="badge warn">بريد غير مؤكد</span>` : ""}</div>
          <div class="up-line">
            <span>${F.icon("inbox", 14)}${E(u.email)}</span>
            ${u.phone ? `<span>${F.icon("phone", 14)}<span class="num">${E(F.localPhone(u.phone))}</span></span>` : `<span style="color:var(--warn)">بلا جوال</span>`}
            <span>${F.icon("clock", 14)}سجّل ${F.fmtD(u.created_at)}</span>
            <span>آخر دخول ${F.ago(u.last_sign_in_at)}</span>
          </div>
          ${secs.length ? `<div class="u-tags" style="margin-top:8px">${secs.map((s) => `<span class="tag sec">${E(s)}</span>`).join("")}</div>` : ""}
          <div class="up-acts">
            ${wa ? `<a class="btn ghost sm" href="${E(wa)}" target="_blank" rel="noopener">واتساب</a>` : ""}
            <a class="btn ghost sm" href="mailto:${E(u.email)}">إيميل</a>
            <button class="btn ghost sm" data-copy="${E(u.email)}">نسخ الإيميل</button>
          </div>
        </div>
      </div>
    </div>
    <div class="kpis" style="margin-top:var(--sp-4)">
      <div class="kpi hero"><b>${F.sar(t.paid_real)}</b><span>دفع فعلياً</span>${Number(t.paid_test) ? `<small>+ ${F.sar(t.paid_test)} تجريبي</small>` : ""}</div>
      <div class="kpi"><b>${F.sar(costSar)}</b><span>تكلفة تشغيله</span><small>$${F.nf(t.cost_usd)}</small></div>
      <div class="kpi"><b>${F.nf(reps.length)}</b><span>تقرير وفحص</span></div>
      <div class="kpi"><b>${F.nf((d.businesses || []).length)}</b><span>محل</span></div>
      <div class="kpi"><b>${F.nf((d.searches || []).length)}</b><span>عملية بحث</span></div>
      <div class="kpi"><b>${F.nf(d.credits?.location ?? 0)}</b><span>رصيد تحليل موقع</span><small>محل للبيع: ${F.nf(d.credits?.acquisition ?? 0)}</small></div>
    </div>`;

  const counts = { reports: reps.length, biz: (d.businesses || []).length, activity: (d.searches || []).length };
  const tabs = `<div class="up-tabs">${TABS.map(([k, l]) =>
    `<button data-tab="${k}" class="${tab === k ? "on" : ""}">${l}${counts[k] ? `<span class="n">${counts[k]}</span>` : ""}</button>`).join("")}</div>`;

  const body = { reports: tabReports, account: tabAccount, billing: tabBilling, biz: tabBiz, activity: tabActivity }[tab]();

  root.innerHTML = head + tabs + `<div id="upBody">${body}</div>`;
  wire();
}

/* ---------------- التقارير ---------------- */
function repHead(r) {
  const x = r.x;
  const st = RUN_ST[x.status] || null;
  let icon = "file-text", title = REP[r.type], sub = x.business_name || "", val = "", valLbl = "";
  if (r.type === "scan") {
    icon = "map-pin"; title = `فحص الترتيب: «${x.term || "—"}»`;
    val = x.avg_rank != null ? F.nf(x.avg_rank) : "—"; valLbl = "متوسط الترتيب";
  } else if (r.type === "audit") {
    icon = "clipboard-check"; val = x.score ?? "—"; valLbl = "من 100";
  } else if (r.type === "reviews") {
    icon = "message-square"; val = x.avg_rating ?? "—"; valLbl = `${F.nf(x.total_reviews)} مراجعة`;
  } else if (r.type === "competitors") {
    icon = "users"; val = F.nf((x.competitors || []).length); valLbl = "منافس";
  } else if (r.type === "growth") {
    icon = "trending-up"; val = x.visibility_pct != null ? pct(x.visibility_pct) : "—"; valLbl = "الظهور";
  } else if (r.type === "location") {
    icon = "telescope"; title = `موقع مشروع: ${x.activity || ""}`; sub = [x.area_label, x.sector_name].filter(Boolean).join(" · ");
    val = x.score ?? "—"; valLbl = x.verdict || "الدرجة";
  } else if (r.type === "acquisition") {
    icon = "briefcase"; title = `محل للبيع: ${x.target_name || ""}`; sub = [x.category, x.sector_name].filter(Boolean).join(" · ");
    val = x.score ?? "—"; valLbl = x.verdict || "الدرجة";
  }
  return `<div class="up-rep-h" data-open="${E(r.type)}:${E(r.id)}">
    <span class="up-rep-ic">${F.icon(icon, 17)}</span>
    <div class="up-rep-t"><b>${E(title)}</b><span>${E(sub)}${sub ? " · " : ""}${F.fmtDT(r.at)}${st && x.status !== "completed" ? " · " : ""}${st && x.status !== "completed" ? st[1] : ""}</span></div>
    <div class="up-rep-v"><b>${E(val)}</b><span>${E(valLbl)}</span></div>
  </div>`;
}

function repBody(r) {
  const x = r.x;
  const status = x.status && x.status !== "completed" ? `<div class="up-sec">${badge(RUN_ST[x.status] || ["mute", x.status])}${x.error_message ? ` <span style="color:var(--bad);font-size:13px">${E(x.error_message)}</span>` : ""}</div>` : "";
  const cost = x.cost_usd != null ? `<div class="hint" style="margin-top:10px">تكلفة التشغيل: $${F.nf(x.cost_usd)}</div>` : "";

  if (r.type === "scan") {
    const key = x.id;
    const g = gridCache.get(key);
    return status + `<div class="up-kv" style="margin-bottom:12px">
        <div><span>الكلمة</span><b>${E(x.term || "—")}</b></div>
        <div><span>متوسط الترتيب</span><b>${x.avg_rank ?? "—"}</b></div>
        <div><span>أفضل ترتيب</span><b>${x.best_rank ?? "—"}</b></div>
        <div><span>أسوأ ترتيب</span><b>${x.worst_rank ?? "—"}</b></div>
        <div><span>الظهور في الشبكة</span><b>${pct(x.visibility_pct)}</b></div>
        <div><span>الشبكة</span><b>${x.grid_size ?? "—"}×${x.grid_size ?? "—"}</b></div>
        <div><span>المسافة بين النقاط</span><b>${F.nf(x.grid_spacing_m)} م</b></div>
        <div><span>النقاط</span><b>${F.nf(x.points_done)} / ${F.nf(x.points_total)}</b></div>
      </div>
      ${g ? gridHtml(g, x.grid_size) : `<button class="btn ghost sm" data-grid="${E(key)}">${F.icon("map-pin", 15)}اعرض خريطة الترتيب</button>`}` + cost;
  }
  if (r.type === "audit") {
    const checks = Array.isArray(x.checks) ? x.checks : [];
    const fails = checks.filter((c) => c.pass === false).length;
    return `<div class="up-sec"><h4>النتيجة: ${x.score ?? "—"}/100 · ${F.nf(checks.length - fails)} سليم · ${F.nf(fails)} يحتاج إصلاح</h4>
      <div class="up-items">${[...checks].sort((a, b) => (a.pass === b.pass ? 0 : a.pass ? 1 : -1)).map(itemHtml).join("")}</div></div>`
      + sec("منافسون قورن بهم", x.competitors) + cost;
  }
  if (r.type === "reviews") {
    return `<div class="up-kv" style="margin-bottom:12px">
        <div><span>المراجعات المحللة</span><b>${F.nf(x.total_reviews)}</b></div>
        <div><span>متوسط التقييم</span><b>${x.avg_rating ?? "—"}</b></div>
        <div><span>إيجابي · سلبي · محايد</span><b>${F.nf(x.positive_count)} · ${F.nf(x.negative_count)} · ${F.nf(x.neutral_count)}</b></div>
      </div>` + sec("الخلاصة", x.summary) + sec("نقاط القوة", x.strengths) + sec("نقاط الضعف", x.weaknesses)
      + sec("التوصيات", x.recommendations) + cost;
  }
  if (r.type === "competitors") {
    return sec("التموضع", x.positioning) + sec("المنافسون", x.competitors) + sec("خطة المواجهة", x.battle_plan) + cost;
  }
  if (r.type === "growth") {
    return `<div class="up-kv" style="margin-bottom:12px">
        <div><span>الظهور الحالي</span><b>${pct(x.visibility_pct)}</b></div>
        <div><span>التصنيف الرئيسي المقترح</span><b>${E(x.primary_category || "—")}</b></div>
        <div><span>النطاق الواقعي</span><b>${x.realistic_range_m ? `${F.nf(x.realistic_range_m)} م` : "—"}</b></div>
      </div>` + sec("الخلاصة", x.summary) + sec("ما يعيق ظهوره", x.blockers) + sec("الخطوات", x.steps)
      + sec("تصنيفات فرعية", x.extra_categories) + sec("الوصف المقترح", x.description_text) + sec("الخدمات", x.services)
      + sec("كلمات مقترحة", x.keyword_ideas) + sec("المنشورات", x.posts) + sec("خطة الصور", x.photo_plan)
      + sec("هدف المراجعات", x.review_target) + cost;
  }
  if (r.type === "location") {
    const ms = x.market_signals || {};
    return status + `<div class="up-kv" style="margin-bottom:12px">
        <div><span>النشاط</span><b>${E(x.activity || "—")}</b></div>
        <div><span>المنطقة</span><b>${E(x.area_label || "—")}</b></div>
        <div><span>النطاق</span><b>${x.radius_m ? `${F.nf(x.radius_m)} م` : "—"}</b></div>
        <div><span>الدرجة</span><b>${x.score ?? "—"}</b></div>
        <div><span>الحكم</span><b>${E(x.verdict || "—")}</b></div>
        <div><span>المنافسون في النطاق</span><b>${F.nf(x.competitors_count)}</b></div>
        <div><span>القطاع</span><b>${E(x.sector_name || "غير مصنّف")}</b></div>
      </div>
      ${x.lat && x.lng ? `<a class="btn ghost sm" href="https://www.google.com/maps?q=${x.lat},${x.lng}" target="_blank" rel="noopener" style="margin-bottom:12px">${F.icon("external-link", 15)}الموقع على قوقل ماب</a>` : ""}`
      + sec("الخلاصة", x.summary) + sec("طبيعة المحيط", ms.area_character) + sec("المؤشرات", ms.indicators)
      + sec("الفرص", x.opportunities) + sec("المخاطر", x.risks) + sec("ثغرات السوق", ms.market_gaps)
      + sec("عوامل النجاح", ms.success_factors) + sec("أقرب المنافسين", (x.competitors || []).slice(0, 10)) + cost;
  }
  if (r.type === "acquisition") {
    return status + `<div class="up-kv" style="margin-bottom:12px">
        <div><span>المحل</span><b>${E(x.target_name || "—")}</b></div>
        <div><span>التصنيف</span><b>${E(x.category || "—")}</b></div>
        <div><span>الدرجة</span><b>${x.score ?? "—"}</b></div>
        <div><span>الحكم</span><b>${E(x.verdict || "—")}</b></div>
        <div><span>حالة النشاط</span><b>${E(x.activity_status || "—")}</b></div>
        <div><span>تقييم الموقع</span><b>${E(x.location_grade || "—")}</b></div>
        <div><span>قابلية الإصلاح</span><b>${E(x.fixability || "—")}</b></div>
      </div>
      ${x.address ? `<div class="hint" style="margin:0 0 12px">${E(x.address)}</div>` : ""}`
      + sec("الخلاصة", x.summary) + sec("القراءة", x.reading) + sec("المؤشرات الحيوية", x.vitals)
      + sec("علامات تحذير", x.red_flags) + sec("علامات إيجابية", x.green_flags) + sec("شكاوى العملاء", x.complaints)
      + sec("اسأل البائع", x.ask_seller) + sec("تحقق بنفسك", x.verify_yourself) + sec("التفاوض", x.negotiation)
      + sec("إشارات الموقع", x.location_signals) + sec("المنافسون", x.rivals) + cost;
  }
  return valueHtml(x);
}

function gridHtml(points, n) {
  if (!points.length) return `<div class="hint">لا توجد نقاط محفوظة لهذا الفحص.</div>`;
  const size = n || Math.round(Math.sqrt(points.length)) || 1;
  // الشمال أعلى والغرب يسار — مثل الخريطة
  const sorted = [...points].sort((a, b) => (a.lat != null && b.lat != null)
    ? (b.lat - a.lat) || (a.lng - b.lng) : (b.row - a.row) || (a.col - b.col));
  const cells = sorted.map((pt) => {
    const top = (pt.top || []).map((c, i) => `${i + 1}. ${c.name || ""}${c.rating ? ` (${c.rating}★)` : ""}`).join("\n");
    const label = pt.found && pt.rank != null ? pt.rank : "×";
    return `<i style="background:${rankColor(pt.rank, pt.found)}" title="${E(`ترتيبه هنا: ${pt.found ? pt.rank : "غير ظاهر"}${top ? `\nالمتصدرون:\n${top}` : ""}`)}">${E(label)}</i>`;
  }).join("");
  return `<div class="up-grid" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
    <div class="up-legend"><span><i style="background:var(--ok)"></i>١–٣</span><span><i style="background:#C08A1E"></i>٤–١٠</span>
      <span><i style="background:var(--bad)"></i>١١–٢٠</span><span><i style="background:var(--ink-3)"></i>غير ظاهر</span>
      <span>الشمال أعلى · مرّر على المربع لترى المتصدرين</span></div>`;
}

function tabReports() {
  const all = reportsList();
  if (!all.length) return F.empty("file-text", "لا تقارير بعد", "لم يشغّل هذا العميل أي فحص أو تحليل حتى الآن.");
  const kinds = Object.keys(REP).filter((k) => all.some((r) => r.type === k));
  const list = repFilter === "all" ? all : all.filter((r) => r.type === repFilter);
  return `<div class="adm-filter">
      <span class="chip ${repFilter === "all" ? "on" : ""}" data-rf="all">الكل ${all.length}</span>
      ${kinds.map((k) => `<span class="chip ${repFilter === k ? "on" : ""}" data-rf="${k}">${REP[k]} ${all.filter((r) => r.type === k).length}</span>`).join("")}
    </div>
    ${list.map((r) => {
      const k = `${r.type}:${r.id}`;
      return `<div class="up-rep">${repHead(r)}${opened.has(k) ? `<div class="up-rep-b">${repBody(r)}</div>` : ""}</div>`;
    }).join("")}`;
}

/* ---------------- الحساب ---------------- */
function tabAccount() {
  const u = data.user || {};
  const audit = data.audit || [];
  return `
    <div class="card">
      <div class="row">
        <div class="field"><label for="upName">الاسم</label>
          <input id="upName" class="input" maxlength="80" value="${E(u.full_name || "")}" placeholder="اسم العميل"></div>
        <div class="field"><label for="upPhone">الجوال</label>
          <input id="upPhone" class="input" inputmode="tel" dir="ltr" style="text-align:right" value="${E(F.localPhone(u.phone || ""))}" placeholder="05xxxxxxxx"></div>
      </div>
      <div class="field"><label for="upEmail">الإيميل (يُستخدم للدخول)</label>
        <input id="upEmail" class="input" type="email" dir="ltr" style="text-align:right" value="${E(u.email || "")}"></div>
      <div class="field"><label for="upPw">كلمة مرور جديدة <span class="muted">— اتركها فارغة إن لم ترد تغييرها</span></label>
        <div class="up-pw">
          <input id="upPw" class="input" type="text" autocomplete="off" maxlength="72" placeholder="٨ أحرف على الأقل">
          <button class="btn ghost sm" id="upGen" type="button">توليد</button>
        </div>
        <div class="hint">كلمة المرور الحالية لا يمكن عرضها لأنها محفوظة مشفّرة. عيّن كلمة جديدة ثم أرسلها للعميل.</div></div>
      <button class="btn" id="upSave">${F.icon("check-circle", 16)}حفظ التعديلات</button>
      <div id="upMsg" class="msg"></div>
    </div>

    <div class="section-head"><h2>معلومات الحساب</h2></div>
    <div class="up-kv">
      <div><span>تاريخ التسجيل</span><b>${F.fmtDT(u.created_at)}</b></div>
      <div><span>تأكيد البريد</span><b>${u.email_confirmed_at ? F.fmtDT(u.email_confirmed_at) : "غير مؤكد"}</b></div>
      <div><span>آخر دخول</span><b>${F.fmtDT(u.last_sign_in_at)}</b></div>
      <div><span>نوع الحساب</span><b>${E(u.account_type || "—")}</b></div>
      <div><span>معرّف الحساب</span><b style="font-family:var(--font-num);font-size:11.5px;direction:ltr">${E(u.id)}</b></div>
    </div>

    <div class="section-head"><h2>سجل تعديلات المشرفين</h2></div>
    <div class="card">${audit.length ? audit.map((a) => {
      const f = a.details?.fields ? a.details.fields.map((x) => FIELD_AR[x] || x).join("، ") : "";
      const extra = a.details?.new_email ? ` · من ${a.details.old_email} إلى ${a.details.new_email}` : "";
      return `<div class="up-log"><span class="ic">${F.icon("clipboard-check", 15)}</span>
        <div class="t"><div>${E(AUDIT_AR[a.action] || a.action)}${f ? `: ${E(f)}` : ""}${E(extra)}</div>
        <div class="s">${E(a.admin || "النظام")} · ${F.fmtDT(a.created_at)}</div></div></div>`;
    }).join("") : `<div class="hint" style="margin:0">لم يُعدَّل هذا الحساب من اللوحة.</div>`}</div>`;
}

async function saveAccount(btn) {
  const u = data.user || {};
  const body = { action: "update_user", user_id: uid };
  const name = $("upName").value.trim();
  const phone = $("upPhone").value.trim();
  const email = $("upEmail").value.trim().toLowerCase();
  const pw = $("upPw").value;
  if (name !== (u.full_name || "")) body.full_name = name;
  if (phone.replace(/\D/g, "") !== F.localPhone(u.phone || "").replace(/\D/g, "")) body.phone = phone;
  if (email !== String(u.email || "").toLowerCase()) body.email = email;
  if (pw) body.password = pw;
  const changes = Object.keys(body).filter((k) => !["action", "user_id"].includes(k));
  if (!changes.length) return F.msg($("upMsg"), "info", "لا يوجد تغيير للحفظ");

  const list = changes.map((k) => FIELD_AR[k] || k).join("، ");
  if (!window.confirm(`حفظ التعديلات (${list}) لحساب ${u.email}؟${body.email ? "\n\nسيتغيّر إيميل الدخول فوراً." : ""}${body.password ? "\nكلمة المرور القديمة لن تعمل بعد الحفظ." : ""}`)) return;

  F.busy(btn, true, "جارٍ الحفظ");
  try {
    const { data: r, error } = await F.sb.functions.invoke("admin-users", { body });
    if (error) throw new Error(error.message || "تعذّر الاتصال بخدمة الحسابات");
    if (!r?.ok) { F.msg($("upMsg"), "error", r?.message || "تعذّر الحفظ"); return; }
    const newEmail = body.email || u.email;
    const pwSet = body.password;
    const phoneNow = body.phone !== undefined ? body.phone : u.phone;
    dataKey = "";
    await refresh(false);
    tab = "account"; render();
    F.msg($("upMsg"), "done", `تم الحفظ: ${list}`);
    if (pwSet && phoneNow) {
      const wa = F.waLink(phoneNow, `مرحباً، هذه بيانات دخولك الجديدة في فلك ٣٦٠:\nالإيميل: ${newEmail}\nكلمة المرور: ${pwSet}\n\nننصحك بتغييرها بعد الدخول.`);
      $("upMsg").insertAdjacentHTML("beforeend", ` <a class="btn ghost sm" href="${E(wa)}" target="_blank" rel="noopener" style="margin-inline-start:8px">أرسلها له واتساب</a>`);
    }
  } catch (e) {
    F.msg($("upMsg"), "error", e.message || String(e));
  } finally { if (btn.isConnected) F.busy(btn, false); }
}

/* ---------------- الاشتراك والمدفوعات ---------------- */
function tabBilling() {
  const p = data.plan || {}, use = data.usage || {};
  const meters = [
    ["scans", "scans_per_month", "فحص الترتيب"], ["audits", "audits_per_month", "تدقيق الملف"],
    ["reviews", "reviews_per_month", "تحليل المراجعات"], ["competitors", "competitors_per_month", "تحليل المنافسين"],
    ["plans", "plans_per_month", "خطة النمو"], ["monitors", "monitors_per_month", "رصد المنافسين"],
  ].map(([u, l, t]) => {
    const lim = Number(p[l] || 0), used = Number(use[u] || 0);
    if (!lim) return `<div class="up-meter"><div class="h"><span style="color:var(--ink-3)">${t}</span><span>غير متاح</span></div></div>`;
    const w = Math.min(100, (used / lim) * 100);
    const c = w >= 100 ? "var(--bad)" : w >= 80 ? "var(--warn)" : "var(--brand)";
    return `<div class="up-meter"><div class="h"><span>${t}</span><span>${F.nf(used)} / ${F.nf(lim)}</span></div>
      <div class="tr"><i style="width:${w.toFixed(1)}%;background:${c}"></i></div></div>`;
  }).join("");

  const planCard = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <div><div class="up-name" style="font-size:17px">${E(p.plan_name || "بلا اشتراك")}</div>
          <div class="hint" style="margin:4px 0 0">${p.starts_at ? `من ${F.fmtD(p.starts_at)} إلى ${F.fmtD(p.ends_at)}` : "لا يوجد اشتراك ساري"}${p.in_grace ? " · في مهلة السماح" : ""}</div></div>
        ${F.planBadge(p)}
      </div>
      ${p.plan_code ? `<div style="margin-top:12px">${meters}</div>
        <div class="hint">العمليات الكبيرة اليوم: ${F.nf(use.heavy_today)} من ${F.nf(p.daily_heavy_cap)} · تكلفة الفترة: $${F.nf(use.cost_period)}</div>` : ""}
    </div>`;

  const subs = data.subscriptions || [];
  const subsHtml = subs.length ? `<div class="card tbl-wrap"><table class="adm-inv up-tbl">
      <thead><tr><th>الباقة</th><th>الحالة</th><th>المبلغ</th><th>السداد</th><th>تنتهي</th><th>النوع</th></tr></thead>
      <tbody>${subs.map((s) => `<tr>
        <td>${E(s.plan_name || s.plan_code)}${s.payment_note ? `<div class="hint" style="margin:2px 0 0">${E(s.payment_note)}</div>` : ""}</td>
        <td>${badge(SUB_ST[s.status] || ["mute", s.status])}</td>
        <td class="num">${s.amount_sar ?? "—"}</td>
        <td>${s.paid_at ? F.fmtDT(s.paid_at) : "—"}</td>
        <td>${s.ends_at ? F.fmtD(s.ends_at) : "—"}</td>
        <td>${s.paid_at ? testToggle("subscription", s) : ""}</td>
      </tr>`).join("")}</tbody></table></div>` : `<div class="hint">لا اشتراكات.</div>`;

  const cr = data.report_credits || [];
  const crHtml = cr.length ? `<div class="card tbl-wrap"><table class="adm-inv up-tbl">
      <thead><tr><th>التقرير</th><th>الحالة</th><th>المستخدم</th><th>المبلغ</th><th>السداد</th><th>النوع</th></tr></thead>
      <tbody>${cr.map((c) => `<tr>
        <td>${E(c.kind === "location" ? "موقع مشروع" : c.kind === "acquisition" ? "محل للبيع" : c.kind)}${c.total > 1 ? ` × ${c.total}` : ""}</td>
        <td>${badge(CR_ST[c.status] || ["mute", c.status])}</td>
        <td class="num">${F.nf(c.used)} / ${F.nf(c.total)}</td>
        <td class="num">${c.price_sar ?? "—"}</td>
        <td>${c.paid_at ? F.fmtDT(c.paid_at) : "—"}</td>
        <td>${c.paid_at ? testToggle("report", c) : ""}</td>
      </tr>`).join("")}</tbody></table></div>` : `<div class="hint">لم يشترِ تقارير.</div>`;

  return planCard +
    `<div class="section-head"><h2>رصيد التقارير</h2></div>
     <div class="up-kv"><div><span>تحليل موقع مشروع</span><b>${F.nf(data.credits?.location ?? 0)} متاح</b></div>
       <div><span>تحليل محل للبيع</span><b>${F.nf(data.credits?.acquisition ?? 0)} متاح</b></div></div>
     <div class="section-head"><h2>سجل الاشتراكات</h2></div>${subsHtml}
     <div class="section-head"><h2>مشتريات التقارير</h2></div>${crHtml}`;
}

const testToggle = (type, r) => `${r.is_test ? `<span class="badge warn">تجريبية</span>` : `<span class="badge ok">حقيقية</span>`}
  <button class="btn ghost sm" data-test="${type}|${E(r.id)}|${r.is_test ? "0" : "1"}">${r.is_test ? "اجعلها حقيقية" : "اجعلها تجريبية"}</button>`;

/* ---------------- المحلات ---------------- */
function tabBiz() {
  const list = data.businesses || [];
  if (!list.length) return F.empty("building", "لم يضف محلاً", "هذا العميل لم يضف أي محل بعد.");
  const sectors = F.sectors();
  return list.map((b) => {
    const maps = b.place_id ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(b.place_id)}`
      : (b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}` : null);
    const opts = `<option value="">تلقائي${!b.sector_manual && b.sector_name ? ` (${E(b.sector_name)})` : ""}</option>` +
      sectors.filter((s) => s.is_active || s.code === b.sector_code).map((s) =>
        `<option value="${E(s.code)}"${b.sector_manual && s.code === b.sector_code ? " selected" : ""}>${E(s.name)}</option>`).join("");
    return `<div class="up-biz">
      <div class="up-biz-top">
        <div><div class="up-name" style="font-size:16px">${E(b.name)} ${b.is_active === false ? `<span class="badge mute">موقوف</span>` : ""}</div>
          <div class="hint" style="margin:3px 0 0">${E(b.category || "بلا تصنيف")}${b.city ? ` · ${E(b.city)}` : ""}${b.address ? ` · ${E(b.address)}` : ""}</div></div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <span class="hint" style="margin:0">القطاع</span>
          <select class="select" data-bsec="${E(b.id)}">${opts}</select>
        </div>
      </div>
      <div class="up-kv" style="margin-top:12px">
        <div><span>تقييم قوقل</span><b>${b.google_rating ?? "—"} ${b.google_reviews_count != null ? `(${F.nf(b.google_reviews_count)})` : ""}</b></div>
        <div><span>الجوال في قوقل</span><b style="direction:ltr;text-align:right">${E(b.phone || "—")}</b></div>
        <div><span>الموقع الإلكتروني</span><b>${b.website ? `<a href="${E(b.website)}" target="_blank" rel="noopener">فتح</a>` : "لا يوجد"}</b></div>
        <div><span>أُضيف</span><b>${F.fmtD(b.created_at)}</b></div>
      </div>
      ${(b.keywords || []).length ? `<div class="up-sec" style="margin-top:12px"><h4>كلمات البحث المتابَعة</h4>
        <div class="u-tags">${b.keywords.map((k) => `<span class="tag${k.active ? "" : " "}"${k.active ? "" : ' style="opacity:.55"'}>${E(k.term)}</span>`).join("")}</div></div>` : ""}
      ${maps ? `<div class="up-acts"><a class="btn ghost sm" href="${E(maps)}" target="_blank" rel="noopener">${F.icon("external-link", 15)}قوقل ماب</a></div>` : ""}
    </div>`;
  }).join("");
}

/* ---------------- البحث والنشاط ---------------- */
function tabActivity() {
  const s = data.searches || [], al = data.alerts || [];
  const searches = s.length ? s.map((x) => `
    <div class="up-log"><span class="ic">${F.icon(x.kind === "geocode" ? "map-pin" : "search", 15)}</span>
      <div class="t"><div><b>${E(x.query)}</b>${x.city && x.kind === "business" ? ` <span class="muted">· ${E(x.city)}</span>` : ""}</div>
        <div class="s">${x.kind === "geocode" ? "بحث عن موقع على الخريطة" : "بحث عن محل"} ·
          ${x.results_count == null ? `<span style="color:var(--bad)">فشل</span>` : `${F.nf(x.results_count)} نتيجة`}
          ${x.top_result ? ` · ${E(x.top_result)}` : ""} · ${F.fmtDT(x.created_at)}</div></div></div>`).join("")
    : `<div class="hint" style="margin:0">لا عمليات بحث مسجّلة. التسجيل بدأ اليوم، فالبحوث السابقة غير محفوظة.</div>`;

  const alerts = al.length ? al.map((a) => `
    <div class="up-log"><span class="ic">${F.icon("alert-triangle", 15)}</span>
      <div class="t"><div><b>${E(a.title)}</b></div>
        <div class="s">${E(a.business_name || "")} · ${F.fmtDT(a.created_at)}${a.is_read ? " · مقروء" : ""}</div>
        ${a.body ? `<div style="font-size:13px;color:var(--ink-2);margin-top:4px">${E(a.body)}</div>` : ""}</div></div>`).join("")
    : `<div class="hint" style="margin:0">لا تنبيهات.</div>`;

  return `<div class="section-head" style="margin-top:0"><h2>عمليات البحث</h2><span class="note">آخر ١٠٠</span></div>
    <div class="card">${searches}</div>
    <div class="section-head"><h2>التنبيهات التي وصلته</h2></div>
    <div class="card">${alerts}</div>`;
}

/* =========================================================
   الأحداث
   ========================================================= */
function wire() {
  root.querySelector("[data-back]").onclick = F.back;
  root.querySelectorAll("[data-copy]").forEach((b) => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "نُسخ"; } catch { b.textContent = "تعذّر"; }
    setTimeout(() => (b.textContent = "نسخ الإيميل"), 1500);
  });
  root.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });

  root.querySelectorAll("[data-rf]").forEach((c) => c.onclick = () => { repFilter = c.dataset.rf; render(); });
  root.querySelectorAll("[data-open]").forEach((h) => h.onclick = () => {
    const k = h.dataset.open;
    opened.has(k) ? opened.delete(k) : opened.add(k);
    render();
  });
  root.querySelectorAll("[data-grid]").forEach((b) => b.onclick = async (ev) => {
    ev.stopPropagation();
    F.busy(b, true, "جارٍ التحميل");
    try {
      gridCache.set(b.dataset.grid, await F.rpc("admin_scan_points", { p_scan: b.dataset.grid }));
      render();
    } catch (e) { F.topMsg("error", e.message); if (b.isConnected) F.busy(b, false); }
  });

  if ($("upSave")) {
    $("upSave").onclick = (ev) => saveAccount(ev.currentTarget);
    $("upGen").onclick = () => {
      const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      const a = new Uint32Array(10);
      crypto.getRandomValues(a);
      $("upPw").value = [...a].map((n) => abc[n % abc.length]).join("");
    };
  }

  root.querySelectorAll("[data-test]").forEach((b) => b.onclick = async () => {
    const [type, id, flag] = b.dataset.test.split("|");
    const toTest = flag === "1";
    if (!window.confirm(toTest ? "تعليم هذه الدفعة تجريبية؟ ستُستبعد من أرقام الإيرادات." : "تعليم هذه الدفعة حقيقية؟ ستدخل في أرقام الإيرادات.")) return;
    F.busy(b, true);
    try {
      const r = await F.rpc("admin_set_payment_test", { p_type: type, p_id: id, p_is_test: toTest });
      F.topMsg(r.ok ? "done" : "error", r.message);
      F.invalidate();
      dataKey = "";
      await refresh(false);
    } catch (e) { F.topMsg("error", e.message); if (b.isConnected) F.busy(b, false); }
  });

  root.querySelectorAll("[data-bsec]").forEach((s) => s.onchange = async () => {
    s.disabled = true;
    try {
      const r = await F.rpc("admin_set_business_sector", { p_business: s.dataset.bsec, p_sector: s.value || null });
      F.topMsg(r.ok ? "done" : "error", r.message);
      F.invalidate();
      dataKey = "";
      await refresh(false);
    } catch (e) { F.topMsg("error", e.message); s.disabled = false; }
  });
}
