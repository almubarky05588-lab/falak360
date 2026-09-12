/* =========================================================
   فلك ٣٦٠ — ظهورك في الذكاء الاصطناعي
   يسأل ChatGPT وGemini وPerplexity أسئلة عميل حقيقي،
   ثم يرصد هل يُذكر محلك ومن يُذكر مكانك.
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { icon, orbitRing, scoreColor } from "./icons.js";

const sb = createClient(
  "https://dpkvkwcofxeptpzdsjre.supabase.co",
  "sb_publishable_Krja6qX-HGdklghDfTJmjQ_XpmIgBPe",
);

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CSS = `
.ai-box{margin-top:var(--sp-5)}
.ai-hero{background:linear-gradient(135deg,var(--brand-tint),var(--surface));border:1px solid var(--line);
  border-radius:var(--r-lg);padding:18px}
.ai-hero h3{font-family:var(--font-display);font-size:17px;font-weight:600;display:flex;align-items:center;gap:8px}
.ai-hero h3 svg{width:19px;height:19px;color:var(--brand)}
.ai-hero p{font-size:13.5px;color:var(--ink-2);line-height:1.8;margin-top:6px}
.ai-plat{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.ai-plat span{padding:3px 10px;border-radius:var(--r-full);background:var(--surface);border:1px solid var(--line);
  font-size:11.5px;color:var(--ink-2)}
.ai-res{display:grid;gap:8px;margin-top:12px}
.ai-row{display:flex;gap:10px;align-items:flex-start;padding:11px 13px;border-radius:var(--r);
  background:var(--surface);border:1px solid var(--line)}
.ai-row.hit{border-color:#CFE6DC;background:var(--ok-tint)}
.ai-row .ic{flex:0 0 auto;margin-top:1px}
.ai-row .ic svg{width:17px;height:17px}
.ai-row.hit .ic svg{color:var(--ok)}
.ai-row.miss .ic svg{color:var(--ink-3)}
.ai-row .bd{flex:1;min-width:0}
.ai-row .pl{font-size:11.5px;color:var(--ink-3);margin-bottom:2px}
.ai-row .q{font-size:13.5px;line-height:1.6}
.ai-row .sn{font-size:12px;color:var(--ink-3);line-height:1.7;margin-top:6px;
  max-height:0;overflow:hidden;transition:max-height .25s}
.ai-row.open .sn{max-height:340px}
.ai-row .tg{border:0;background:none;font:inherit;font-size:11.5px;color:var(--brand);cursor:pointer;padding:4px 0 0}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

function mount() {
  const host = $("compBtn");
  if (!host || $("aiBox")) return;

  host.insertAdjacentHTML("beforebegin", `
    <div id="aiBox" class="ai-box">
      <div class="ai-hero">
        <h3>${icon("sparkles", 19)}ظهورك في الذكاء الاصطناعي</h3>
        <p>عملاؤك بدأوا يسألون المساعدات الذكية بدل البحث في قوقل.
           نسأل نيابةً عنهم أسئلة حقيقية، ونرى هل يُذكر محلك أم يُذكر منافسوك مكانك.</p>
        <div class="ai-plat"><span>ChatGPT</span><span>Gemini</span><span>Perplexity</span></div>
        <button id="aiBtn" class="btn block sp-t">افحص ظهوري في الذكاء الاصطناعي</button>
        <div id="aiMsg" class="msg"></div>
      </div>
      <div id="aiResult" class="hidden"></div>
      <div id="aiHist"></div>
    </div>`);

  $("aiBtn").onclick = run;
  loadHist();
}

function msg(kind, text) {
  const el = $("aiMsg");
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}

function render(d) {
  const box = $("aiResult");
  const label = d.score >= 75 ? "حضور قوي" : d.score >= 40 ? "حضور متوسط"
    : d.score > 0 ? "حضور ضعيف" : "غير ظاهر إطلاقاً";

  const rows = (d.results || []).map((r, i) => `
    <div class="ai-row ${r.mentioned ? "hit" : "miss"}" data-i="${i}">
      <div class="ic">${icon(r.mentioned ? "check-circle" : "x-circle", 17)}</div>
      <div class="bd">
        <div class="pl">${esc(r.platform)}</div>
        <div class="q">${esc(r.prompt)}</div>
        <div class="sn">${esc(r.snippet || "")}${(r.snippet || "").length >= 400 ? "…" : ""}</div>
        ${r.snippet ? `<button class="tg">اعرض ما أجاب به</button>` : ""}
      </div>
    </div>`).join("");

  box.innerHTML = `
    <div class="card sp-t">
      <div class="verdict-row">
        <div>${orbitRing(d.score, 100, scoreColor(d.score), 108, "ظهور")}</div>
        <div class="verdict-text">
          <div class="verdict-title" style="color:${scoreColor(d.score)}">${label}</div>
          <div class="verdict-note">يُذكر محلك في ${d.mentioned} من ${d.total} إجابة
            ${d.place ? ` · عن «${esc(d.category)} في ${esc(d.place)}»` : ""}</div>
        </div>
      </div>
      ${(d.advice || []).map((a) => `<div class="ind-means">${esc(a)}</div>`).join("")}
    </div>

    <div class="section-head"><h2>ماذا أجابت المساعدات</h2><span class="note">أسئلة عميل حقيقي</span></div>
    <div class="ai-res">${rows}</div>

    ${(d.rivals || []).length ? `
      <div class="section-head"><h2>من يُذكر مكانك</h2></div>
      ${d.rivals.map((r) => `<div class="list-row">
        <span>${esc(r.name)}</span>
        <span class="meta">ذُكر ${r.times} ${r.times === 1 ? "مرة" : "مرات"}</span>
      </div>`).join("")}` : ""}

    <div class="disclaimer">إجابات المساعدات الذكية تتغير من وقت لآخر ومن مستخدم لآخر،
      فاعتبر النتيجة مؤشراً على حضورك لا حكماً نهائياً. المصدر: ChatGPT وGemini وPerplexity.</div>`;

  box.querySelectorAll(".ai-row .tg").forEach((b) => b.onclick = () => {
    const row = b.closest(".ai-row");
    row.classList.toggle("open");
    b.textContent = row.classList.contains("open") ? "إخفاء" : "اعرض ما أجاب به";
  });

  box.className = "";
}

async function run() {
  const btn = $("aiBtn");
  const bizId = $("bizSelect")?.value;
  if (!bizId) return msg("error", "اختر محلك أولاً من شاشة نظرة عامة.");

  btn.disabled = true;
  const old = btn.textContent;
  btn.innerHTML = `<span class="spinner"></span>نسأل المساعدات الذكية`;
  msg("info", "نطرح تسعة أسئلة على ثلاث منصات — قد يستغرق دقيقة.");

  try {
    const { data, error } = await sb.functions.invoke("ai-visibility", { body: { business_id: bizId } });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "تعذّر الفحص");
    render(data);
    $("aiMsg").className = "msg";
    loadHist();
  } catch (e) {
    msg("error", String(e?.message || e).slice(0, 160));
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

async function loadHist() {
  const bizId = $("bizSelect")?.value;
  const box = $("aiHist");
  if (!box || !bizId) return;
  try {
    const { data } = await sb.from("ai_visibility")
      .select("id,score,mentioned,total,created_at")
      .eq("business_id", bizId).order("created_at", { ascending: false }).limit(1);
    const r = data?.[0];
    if (!r) { box.innerHTML = ""; return; }
    const d = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",
      { day: "numeric", month: "long" }).format(new Date(r.created_at));
    box.innerHTML = `<button class="btn ghost block sp-t" data-open="${r.id}">
      ${icon("clock", 16)}اعرض آخر فحص <span style="color:var(--ink-3);font-size:12px;margin-inline-start:6px">${d}</span>
    </button>`;
    box.querySelector("[data-open]").onclick = async (ev) => {
      const b = ev.currentTarget;
      b.disabled = true;
      const { data: full } = await sb.from("ai_visibility").select("*").eq("id", r.id).single();
      if (full) render(full);
      b.disabled = false;
      $("aiResult")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  } catch { /* */ }
}

function start() {
  mount();
  $("bizSelect")?.addEventListener("change", () => {
    $("aiResult") && ($("aiResult").className = "hidden");
    loadHist();
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 900));
else setTimeout(start, 900);
