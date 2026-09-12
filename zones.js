/* =========================================================
   فلك ٣٦٠ — إضافات الواجهة (الدفعة الأولى)
   تعمل فوق app.js بلا تعديله:
   • تنبيه على مفتاح ألوان الخريطة
   • تحليل الجهات: أين تقوى وأين تضعف ومن يسبقك
   • بيانات رسمية عن موقع «محل معروض للبيع»
   • عرض مزايا الباقات كاملة مع شطب غير المتاح
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { icon } from "./icons.js";

const sb = createClient(
  "https://dpkvkwcofxeptpzdsjre.supabase.co",
  "sb_publishable_Krja6qX-HGdklghDfTJmjQ_XpmIgBPe",
);

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = (n) => Number(n).toLocaleString("en");

const CSS = `
.legend .lg-tip{color:var(--ink-3);display:inline-flex;align-items:center;gap:5px}
.legend .lg-tip svg{width:13px;height:13px;flex:0 0 auto}
.zone{display:grid;grid-template-columns:88px 1fr auto;gap:10px;align-items:center;padding:8px 0;
  border-bottom:1px solid var(--line);font-size:13px}
.zone:last-child{border-bottom:0}
.zone .zn{color:var(--ink-2)}
.zone .zb{height:7px;border-radius:99px;background:var(--line);overflow:hidden}
.zone .zb i{display:block;height:100%;background:var(--warn);border-radius:99px}
.zone.good .zb i{background:var(--ok)}
.zone.warn .zb i{background:#C4762A}
.zone.bad .zb i{background:var(--bad)}
.zone .zv{font-family:var(--font-num);font-size:12.5px;white-space:nowrap;text-align:end}
.zone .zv small{display:block;font-family:inherit;color:var(--ink-3);font-size:11px}
.ind-src{display:flex;align-items:center;gap:6px;margin-top:9px;padding-top:8px;border-top:1px solid var(--line);
  font-size:11.5px;color:var(--ink-3)}
.ind-src svg{width:13px;height:13px;flex:0 0 auto}
.plan-c ul li.off{color:var(--ink-3)}
.plan-c ul li.off span{text-decoration:line-through;text-decoration-color:var(--line-2);text-decoration-thickness:1.5px}
.plan-c ul li.off svg{color:var(--line-2)}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

/* ---------------- أدوات ---------------- */
const dirOf = (dLat, dLng) => {
  if (Math.abs(dLat) < 1e-9 && Math.abs(dLng) < 1e-9) return "المركز";
  const ang = Math.atan2(dLat, dLng) * 180 / Math.PI;
  const i = Math.round(((ang + 360) % 360) / 45) % 8;
  return ["الشرق", "الشمال الشرقي", "الشمال", "الشمال الغربي",
          "الغرب", "الجنوب الغربي", "الجنوب", "الجنوب الشرقي"][i];
};

function card(x) {
  return `<div class="indicator ${x.status || "neutral"}">
    <div class="ind-head">
      <div class="ind-title">${icon(x.ic || "info", 17)}${esc(x.title)}</div>
      <div class="ind-val">${esc(x.value)}</div>
    </div>
    <div class="ind-what">${esc(x.what)}</div>
    <div class="ind-means">${esc(x.means)}</div>
    ${x.source ? `<div class="ind-src">${icon("info", 13)}المصدر: ${esc(x.source)}</div>` : ""}
  </div>`;
}

function ctxCards(c, rivals) {
  const out = [];
  const rent = c?.rent?.found ? c.rent : null;
  const den = c?.density?.found ? c.density : null;
  const road = c?.roads?.found ? c.roads : null;

  if (rent) {
    const m = Number(rent.meter_price);
    const lvl = rent.level === "district" ? `حي ${rent.district}`
      : rent.level === "city" ? `مدينة ${rent.city}` : `متوسط أحياء ${rent.city}`;
    out.push({
      ic: "banknote", title: `متوسط إيجار ال${rent.unit_type} في نطاقه`,
      value: `${nf(Math.round(m))} ريال للمتر سنوياً`, status: "neutral",
      what: `متوسط قيمة الإيجار في ${lvl} — ${rent.period}${rent.deals ? ` · مبني على ${nf(rent.deals)} عقد موثّق` : ""}.`,
      means: `محل ١٠٠ متر يكلّف نحو ${nf(Math.round(m * 100))} ريال سنوياً. قارنه بالإيجار الذي يذكره البائع — `
        + `فالفارق الكبير إما فرصة تفاوض أو إشارة إلى عقد غير منطقي.`,
      source: rent.source,
    });
  }

  if (den) {
    const per = den.buildings && rivals ? Math.round(den.buildings / rivals) : null;
    out.push({
      ic: "building", title: "كثافة السكن حول المحل",
      value: `${nf(den.per_km2)} مبنى لكل كم²`,
      status: den.percentile >= 60 ? "ok" : den.percentile >= 30 ? "neutral" : "warn",
      what: `${den.label} — أعلى من ${den.percentile}% من النطاقات المحيطة، وإجمالي ${nf(den.buildings)} مبنى ضمن كيلومتر.`,
      means: den.percentile >= 60
        ? "قاعدة سكانية كثيفة — ضعف المحل ليس بسبب قلة الناس حوله، فابحث عن السبب في إدارته أو خدمته."
        : den.percentile >= 30
        ? "كثافة متوسطة — الحي وحده لا يكفي، والمحل يحتاج من يمر به لا من يسكن حوله فقط."
          + (per ? ` ويقابل كل منافس نحو ${nf(per)} مبنى.` : "")
        : "السكن حوله قليل — قد يكون هذا سبب ضعف حركته، وهو عيب موقع لا يُصلح بالإدارة.",
      source: den.source,
    });
  }

  if (road) {
    out.push({
      ic: "route", title: "تعرّض الموقع للحركة",
      value: `${road.label} · ${road.score}/100`,
      status: road.score >= 60 ? "ok" : road.score >= 30 ? "neutral" : "warn",
      what: `ضمن كيلومتر حوله: ${road.major_roads} طريقاً رئيسياً`
        + (road.motorway ? ` (منها ${road.motorway} سريع)` : "")
        + `، و${(road.secondary || 0) + (road.tertiary || 0)} طريقاً فرعياً`
        + (road.max_lanes ? `، وأعرضها ${road.max_lanes} مسارات` : "") + ".",
      means: road.score >= 60
        ? "الموقع على شبكة طرق قوية — تعرّضه للحركة جيد، فضعفه إن وُجد ليس من موقعه."
        : "الوصول إليه يعتمد على شوارع داخلية — إن كانت حركته ضعيفة فقد يكون هذا سببها، وهو ما لا تغيّره الإدارة.",
      source: road.source,
    });
  }
  return out;
}

/* ---------------- ١) تنبيه مفتاح الخريطة ---------------- */
function legendTip() {
  const box = $("mapLegend");
  if (!box || box.querySelector(".lg-tip")) return;
  box.insertAdjacentHTML("beforeend",
    `<span class="lg-tip">${icon("info", 13)}اضغط أي نقطة لترى من يظهر فوقك فيها</span>`);
}

/* ---------------- ٢) تحليل الجهات ---------------- */
function renderZones(pts, biz) {
  const box = $("zonesBox");
  if (!box) return;
  const ok = (pts || []).filter((p) => p.lat != null && p.lng != null);
  if (ok.length < 5 || !biz || biz.lat == null) { box.className = "hidden"; return; }

  const groups = {};
  ok.forEach((p) => {
    const d = dirOf(p.lat - biz.lat, p.lng - biz.lng);
    (groups[d] ??= []).push(p);
  });

  const rows = Object.entries(groups).map(([dir, arr]) => {
    const seen = arr.filter((p) => p.rank != null);
    const avg = seen.length ? seen.reduce((s, p) => s + p.rank, 0) / seen.length : null;
    return { dir, n: arr.length, seen: seen.length, avg, pct: Math.round((seen.length / arr.length) * 100) };
  }).sort((a, b) => (a.avg ?? 99) - (b.avg ?? 99));

  const best = rows[0], worst = rows[rows.length - 1];

  const beat = {};
  ok.forEach((p) => {
    const me = p.rank;
    (p.top_competitors || []).forEach((c) => {
      if (c.is_mine || !c.name) return;
      if (me != null && c.rank >= me) return;
      const e = (beat[c.name] ??= { name: c.name, n: 0, dirs: {} });
      e.n++;
      const d = dirOf(p.lat - biz.lat, p.lng - biz.lng);
      e.dirs[d] = (e.dirs[d] ?? 0) + 1;
    });
  });
  const rivals = Object.values(beat).sort((a, b) => b.n - a.n).slice(0, 3)
    .map((r) => ({ ...r, top: Object.entries(r.dirs).sort((a, b) => b[1] - a[1])[0] }));

  box.className = "";
  $("zonesList").innerHTML = rows.map((r) => {
    const cls = r.avg == null ? "bad" : r.avg <= 3 ? "good" : r.avg <= 10 ? "" : "warn";
    return `<div class="zone ${cls}">
      <div class="zn">${esc(r.dir)}</div>
      <div class="zb"><i style="width:${r.pct}%"></i></div>
      <div class="zv">${r.avg == null ? "لا تظهر" : `متوسط ${r.avg.toFixed(1)}`}
        <small>${r.seen} من ${r.n}</small></div>
    </div>`;
  }).join("");

  $("zonesNote").innerHTML = best && worst && best.dir !== worst.dir
    ? `<div class="ind-means">أقوى جهاتك ${esc(best.dir)}${best.avg != null ? ` (متوسط ${best.avg.toFixed(1)})` : ""}، `
      + `وأضعفها ${esc(worst.dir)}${worst.avg == null ? " حيث لا تظهر إطلاقاً" : ` (متوسط ${worst.avg.toFixed(1)})`}. `
      + `وجّه إعلاناتك ولوحاتك نحو الجهة الضعيفة، لأن القوية تصلك مجاناً.</div>`
    : "";

  $("zonesRivals").innerHTML = rivals.length
    ? `<div class="section-head sp-t"><h2>من يسبقك ميدانياً</h2></div>`
      + rivals.map((r) => `<div class="list-row">
          <span>${esc(r.name)}</span>
          <span class="meta">يسبقك في ${r.n} نقطة${r.top ? ` · أكثرها ${esc(r.top[0])}` : ""}</span>
        </div>`).join("")
    : "";
}

async function loadZones() {
  legendTip();
  const sel = $("bizSelect");
  const bizId = sel?.value;
  if (!bizId) return;
  try {
    const [{ data: biz }, { data: scan }] = await Promise.all([
      sb.from("businesses").select("lat,lng").eq("id", bizId).maybeSingle(),
      sb.from("scans").select("id").eq("business_id", bizId).eq("status", "completed")
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!biz || !scan?.id) return;
    const { data: pts } = await sb.from("scan_points")
      .select("lat,lng,rank,top_competitors").eq("scan_id", scan.id);
    renderZones(pts || [], biz);
  } catch { /* التقرير يبقى كاملاً */ }
}

/* ---------------- ٣) بيانات رسمية لمحل معروض للبيع ---------------- */
let lastBuyKey = "";
async function loadBuyCtx() {
  const box = $("buyCtx");
  const nameEl = $("buyPickedName");
  if (!box) return;
  const key = (nameEl?.textContent || "") + ($("buyMeta")?.textContent || "");
  if (!key.trim() || key === lastBuyKey) return;
  lastBuyKey = key;
  box.innerHTML = "";

  try {
    const { data: row } = await sb.from("acquisition_reports")
      .select("lat,lng,address,rivals").eq("status", "completed")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!row?.lat) return;

    const { data: c } = await sb.rpc("site_context_auto", {
      p_lat: row.lat, p_lng: row.lng, p_area: row.address ?? null, p_unit_type: "محل",
    });
    if (!c) return;
    const cards = ctxCards(c, (row.rivals || []).length);
    if (!cards.length) return;
    box.innerHTML = `<div class="section-head"><h2>بيانات رسمية عن موقعه</h2>
      <span class="note">تكشف هل ضعفه من موقعه أم من إدارته</span></div>` + cards.map(card).join("");
    if (!c.roads?.found) sb.functions.invoke("road-exposure", { body: { lat: row.lat, lng: row.lng } }).catch(() => {});
  } catch { /* */ }
}

/* ---------------- ٤) مزايا الباقات مع الشطب ---------------- */
const ALL_FEATURES = [
  { t: "موردون موثّقون وموردون في منطقتك", in: ["basic", "growth", "pro"] },
  { t: "فحص الترتيب وتدقيق الملف التجاري", in: ["basic", "growth", "pro"] },
  { t: "خطة رفع الظهور بمحتوى جاهز", in: ["basic", "growth", "pro"] },
  { t: "تحليل المراجعات", in: ["basic", "growth", "pro"] },
  { t: "البحث في الموردين وفلترتهم بالمدينة", in: ["growth", "pro"] },
  { t: "تحليل المنافسين ومراقبة نطاقك", in: ["growth", "pro"] },
  { t: "تنبيهات فورية عند دخول منافس أو تراجع ترتيبك", in: ["growth", "pro"] },
  { t: "سجل التطور ومقارنة قبل / بعد", in: ["growth", "pro"] },
  { t: "إدارة عدة فروع من لوحة واحدة", in: ["pro"] },
  { t: "حصص أعلى لكل التحاليل وأولوية في الدعم", in: ["pro"] },
];

function strikePlans() {
  document.querySelectorAll(".plan-c[data-fk-done='1']").forEach(() => {});
  document.querySelectorAll(".plan-c").forEach((cardEl) => {
    if (cardEl.dataset.fkDone === "1") return;
    const btn = cardEl.querySelector("[data-sub]");
    const code = btn?.dataset.sub;
    const ul = cardEl.querySelector("ul");
    if (!code || !ul) return;
    ul.innerHTML = ALL_FEATURES.map((f) => {
      const on = f.in.includes(code);
      return `<li class="${on ? "" : "off"}">${icon(on ? "check-circle" : "x-circle", 15)}<span>${esc(f.t)}</span></li>`;
    }).join("");
    cardEl.dataset.fkDone = "1";
  });
}

/* ---------------- المراقبة ---------------- */
function watch(id, fn) {
  const el = $(id);
  if (!el) return;
  new MutationObserver(() => {
    if (!el.classList.contains("hidden")) setTimeout(fn, 250);
  }).observe(el, { attributes: true, attributeFilter: ["class"] });
}

function start() {
  watch("scanResult", loadZones);
  watch("buyResult", loadBuyCtx);

  const sup = $("supBody");
  if (sup) new MutationObserver(strikePlans).observe(sup, { childList: true, subtree: true });

  const acc = document.querySelector("#screen-account");
  if (acc) new MutationObserver(strikePlans).observe(acc, { childList: true, subtree: true });

  // لو كانت النتيجة ظاهرة أصلاً عند التحميل
  if ($("scanResult") && !$("scanResult").classList.contains("hidden")) loadZones();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else setTimeout(start, 600);

window.falakZones = { render: renderZones, legendTip, strikePlans };
