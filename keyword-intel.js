/* =========================================================
   فلك ٣٦٠ — حجم البحث وموسمية الطلب
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
const nf = (n) => Number(n || 0).toLocaleString("en");

const CSS = `
.kwi-box{margin-top:var(--sp-4)}
.kwi-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:10px 0;
  border-bottom:1px solid var(--line);font-size:13.5px}
.kwi-row:last-child{border-bottom:0}
.kwi-row.mine{background:var(--brand-tint);margin-inline:-12px;padding-inline:12px;border-radius:var(--r-sm)}
.kwi-t{display:flex;align-items:center;gap:7px;min-width:0}
.kwi-t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kwi-tag{flex:0 0 auto;font-size:10.5px;padding:1px 7px;border-radius:var(--r-full);
  background:var(--brand);color:#fff}
.kwi-v{text-align:start;white-space:nowrap}
.kwi-v b{font-family:var(--font-num);font-size:14px;font-weight:600;display:block;line-height:1.2}
.kwi-v small{color:var(--ink-3);font-size:10.5px}
.kwi-comp{display:inline-block;width:7px;height:7px;border-radius:50%;margin-inline-end:5px;flex:0 0 auto}
.kwi-comp.LOW{background:var(--ok)}.kwi-comp.MEDIUM{background:var(--warn)}.kwi-comp.HIGH{background:var(--bad)}
.kwi-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--ink-3);margin-top:10px;
  padding-top:10px;border-top:1px solid var(--line)}
.kwi-legend span{display:flex;align-items:center;gap:5px}
.seas{display:flex;align-items:flex-end;gap:3px;height:96px;margin:14px 0 6px}
.seas i{flex:1;background:var(--brand-tint);border-radius:4px 4px 0 0;min-height:4px}
.seas i.hi{background:var(--brand)}
.seas i.lo{background:var(--line-2)}
.seas-axis{display:flex;gap:3px;font-size:9.5px;color:var(--ink-3);text-align:center}
.seas-axis span{flex:1}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

function mount() {
  const host = $("kwList");
  if (!host || $("kwiBox")) return;

  host.insertAdjacentHTML("afterend", `
    <div id="kwiBox" class="kwi-box">
      <button id="kwiBtn" class="btn ghost block">
        ${icon("bar-chart", 16)}كم يبحث الناس عن نشاطك؟
      </button>
      <div id="kwiMsg" class="msg"></div>
      <div id="kwiResult" class="hidden"></div>
    </div>`);
  $("kwiBtn").onclick = run;
}

function msg(kind, text) {
  const el = $("kwiMsg");
  if (!el) return;
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}

const volWord = (n) => n === 1 ? "بحث واحد شهرياً"
  : n === 2 ? "بحثان شهرياً" : "بحث شهرياً";

function render(d) {
  const box = $("kwiResult");
  const kws = d.keywords || [];

  const rows = kws.slice(0, 25).map((k) => `
    <div class="kwi-row ${k.mine ? "mine" : ""}">
      <div class="kwi-t">
        ${k.competition ? `<span class="kwi-comp ${esc(k.competition)}"></span>` : ""}
        <span>${esc(k.term)}</span>
        ${k.mine ? `<span class="kwi-tag">تتابعها</span>` : ""}
      </div>
      <div class="kwi-v"><b>${nf(k.volume)}</b><small>${volWord(k.volume)}</small></div>
    </div>`).join("");

  const s = d.seasonality;
  let seasHtml = "";
  if (s?.index?.length === 12) {
    const mx = Math.max(...s.index), mn = Math.min(...s.index);
    const bars = s.index.map((v, i) => {
      const cls = v === mx ? "hi" : v === mn ? "lo" : "";
      return `<i class="${cls}" style="height:${Math.max(6, (v / (mx || 1)) * 100)}%" title="${esc(s.months[i])}"></i>`;
    }).join("");
    seasHtml = `
      <div class="section-head"><h2>موسمية الطلب</h2><span class="note">${esc(s.level)}</span></div>
      <div class="card">
        <div class="seas">${bars}</div>
        <div class="seas-axis">${s.months.map((m) => `<span>${esc(m.slice(0, 3))}</span>`).join("")}</div>
        <div class="ind-means" style="margin-top:12px">${esc(s.means)}</div>
      </div>`;
  }

  box.innerHTML = `
    <div class="card sp-t">
      <div style="font-size:13.5px;color:var(--ink-2);line-height:1.8">
        أرقام البحث الشهرية الفعلية في ${esc(d.city)} لنشاط «${esc(d.seed)}».
      </div>
      ${(d.insights || []).map((x) => `<div class="ind-means">${esc(x)}</div>`).join("")}
    </div>

    <div class="section-head"><h2>الكلمات مرتبة بحجم البحث</h2></div>
    <div class="card">
      ${rows || `<div class="hint">لا بيانات كافية لهذا النشاط.</div>`}
      <div class="kwi-legend">
        <span><i class="kwi-comp LOW"></i>منافسة منخفضة</span>
        <span><i class="kwi-comp MEDIUM"></i>متوسطة</span>
        <span><i class="kwi-comp HIGH"></i>مرتفعة</span>
      </div>
    </div>

    ${seasHtml}

    <div class="disclaimer">أرقام البحث من مخطط كلمات قوقل، وهي متوسطات شهرية تقريبية للمنطقة المحددة.</div>`;

  box.className = "";
}

async function run() {
  const btn = $("kwiBtn");
  const bizId = $("bizSelect")?.value;
  if (!bizId) return msg("error", "اختر محلك أولاً.");

  btn.disabled = true;
  const old = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span>نجلب أرقام البحث`;
  msg("info", "نقيس كم يبحث الناس عن نشاطك في مدينتك…");

  try {
    const { data, error } = await sb.functions.invoke("keyword-intel", { body: { business_id: bizId } });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "تعذّر الجلب");
    render(data);
    $("kwiMsg").className = "msg";
  } catch (e) {
    msg("error", String(e?.message || e).slice(0, 160));
  } finally {
    btn.disabled = false;
    btn.innerHTML = old;
  }
}

async function loadLast() {
  const bizId = $("bizSelect")?.value;
  if (!bizId || !$("kwiResult")) return;
  try {
    const { data } = await sb.from("keyword_intel").select("*")
      .eq("business_id", bizId).order("created_at", { ascending: false }).limit(1);
    if (data?.[0]) render({ ...data[0], insights: [] });
  } catch { /* */ }
}

function start() {
  mount();
  loadLast();
  $("bizSelect")?.addEventListener("change", () => {
    if ($("kwiResult")) $("kwiResult").className = "hidden";
    setTimeout(loadLast, 400);
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 1000));
else setTimeout(start, 1000);
