/* =========================================================
   فلك ٣٦٠ — مواقع بديلة مرشّحة
   تُضاف في شاشة «موقع مشروع»
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { icon, scoreColor } from "./icons.js";

const sb = createClient(
  "https://dpkvkwcofxeptpzdsjre.supabase.co",
  "sb_publishable_Krja6qX-HGdklghDfTJmjQ_XpmIgBPe",
);

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = (n) => Number(n || 0).toLocaleString("en");

const CSS = `
.alt-hero{background:linear-gradient(135deg,var(--brand-tint),var(--surface));
  border:1px solid var(--line);border-radius:var(--r-lg);padding:18px;margin-top:var(--sp-5)}
.alt-hero h3{font-family:var(--font-display);font-size:17px;font-weight:600;display:flex;align-items:center;gap:8px}
.alt-hero h3 svg{width:19px;height:19px;color:var(--brand)}
.alt-hero p{font-size:13.5px;color:var(--ink-2);line-height:1.8;margin-top:6px}
.alt-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.alt-site{border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface);
  padding:15px;margin-bottom:10px}
.alt-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.alt-rank{width:28px;height:28px;flex:0 0 auto;border-radius:50%;background:var(--brand);color:#fff;
  display:flex;align-items:center;justify-content:center;font-family:var(--font-num);font-size:13px;font-weight:600}
.alt-hd{flex:1;min-width:0}
.alt-vd{font-family:var(--font-display);font-size:15px;font-weight:600}
.alt-meta{font-size:12px;color:var(--ink-3);margin-top:2px;line-height:1.6}
.alt-score{text-align:center;flex:0 0 auto}
.alt-score b{display:block;font-family:var(--font-num);font-size:22px;font-weight:600;line-height:1}
.alt-score small{font-size:10px;color:var(--ink-3)}
.alt-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;
  padding-top:12px;border-top:1px solid var(--line)}
.alt-st{text-align:center}
.alt-st b{display:block;font-family:var(--font-num);font-size:15px;font-weight:600}
.alt-st small{font-size:10.5px;color:var(--ink-3)}
.alt-why{margin-top:11px;display:grid;gap:5px}
.alt-why div{font-size:12.5px;display:flex;gap:7px;align-items:flex-start;line-height:1.6}
.alt-why svg{width:14px;height:14px;flex:0 0 auto;margin-top:2px}
.alt-why .ok svg{color:var(--ok)}
.alt-why .no svg{color:var(--warn)}
.alt-acts{display:flex;gap:8px;margin-top:12px}
.alt-acts .btn{flex:1;justify-content:center;font-size:12.5px}
.alt-base{background:var(--surface-2);border-radius:var(--r);padding:11px 13px;font-size:12.5px;
  color:var(--ink-2);line-height:1.7;margin-bottom:10px}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

/* إحداثيات نقطة الانطلاق — من دائرة النطاق التي يرسمها app.js على الخريطة */
function pickedPoint() {
  const m = String($("locCoords")?.value || "").match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (m) return { lat: +m[1], lng: +m[2] };

  // نقرأها من طبقة الخريطة مباشرة
  try {
    const el = $("locMap");
    const inst = el?._leaflet_id ? window.L?.DomUtil?.get?.(el) : null;
    if (window.__falakLocPick) return window.__falakLocPick;
    // آخر محاولة: مركز الخريطة الظاهرة
    const maps = Object.values(window).find((v) => v && v._leaflet_id && v.getCenter);
    if (maps?.getCenter) { const c = maps.getCenter(); return { lat: c.lat, lng: c.lng }; }
  } catch { /* */ }
  return null;
}

function mount() {
  const host = $("locResult");
  if (!host || $("altBox")) return;

  host.insertAdjacentHTML("beforebegin", `
    <div id="altBox">
      <div class="alt-hero">
        <h3>${icon("compass", 19)}مواقع بديلة مرشّحة</h3>
        <p>نمسح المنطقة ونرشّح أفضل المواقع لنشاطك — بناءً على كثافة السكن
           وشبكة الطرق وعدد المنافسين الفعليين في كل موقع.</p>
        <div class="alt-opts">
          <div class="field" style="margin:0">
            <label for="altRadius">نطاق البحث</label>
            <select id="altRadius" class="select">
              <option value="3">3 كم — الحي وما حوله</option>
              <option value="6" selected>6 كم — نطاق واسع</option>
              <option value="12">12 كم — جزء من المدينة</option>
              <option value="20">20 كم — المدينة كاملة</option>
            </select>
          </div>
          <div class="field" style="margin:0">
            <label for="altPriority">الأولوية</label>
            <select id="altPriority" class="select">
              <option value="balanced" selected>توازن</option>
              <option value="density">كثافة سكنية أعلى</option>
              <option value="traffic">حركة وطرق أقوى</option>
            </select>
          </div>
        </div>
        <button id="altBtn" class="btn block sp-t">رشّح لي مواقع بديلة</button>
        <div id="altMsg" class="msg"></div>
      </div>
      <div id="altResult" class="hidden"></div>
    </div>`);

  $("altBtn").onclick = run;
}

function msg(kind, text) {
  const el = $("altMsg");
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}

function render(d) {
  const box = $("altResult");
  const b = d.baseline || {};

  const baseTxt = b.per_km2
    ? `نقطتك الحالية: ${nf(b.per_km2)} مبنى لكل كم²${b.road_score != null ? ` · تعرّض مروري ${b.road_score}/100` : ""} — قارنها بالمرشحات أدناه.`
    : "";

  const sites = (d.sites || []).map((s, i) => `
    <div class="alt-site">
      <div class="alt-top">
        <div class="alt-rank">${i + 1}</div>
        <div class="alt-hd">
          <div class="alt-vd" style="color:${scoreColor(s.score)}">${esc(s.verdict)}</div>
          <div class="alt-meta">على بعد ${s.dist_km} كم من نقطتك</div>
        </div>
        <div class="alt-score">
          <b style="color:${scoreColor(s.score)}">${s.score}</b><small>من 100</small>
        </div>
      </div>

      <div class="alt-stats">
        <div class="alt-st"><b>${nf(s.per_km2)}</b><small>مبنى/كم²</small></div>
        <div class="alt-st"><b>${s.road_score ?? "—"}</b><small>تعرّض مروري</small></div>
        <div class="alt-st"><b>${s.rivals ?? "—"}</b><small>منافس قريب</small></div>
      </div>

      <div class="alt-why">
        ${(s.why || []).map((w) => `<div class="ok">${icon("check-circle", 14)}<span>${esc(w)}</span></div>`).join("")}
        ${(s.caution || []).map((w) => `<div class="no">${icon("alert-triangle", 14)}<span>${esc(w)}</span></div>`).join("")}
      </div>

      ${(s.rivals_list || []).length ? `
        <div class="alt-meta" style="margin-top:10px">أقرب المنافسين:
          ${s.rivals_list.map((r) => `${esc(r.name)} (${r.distance_m}م)`).join("، ")}</div>` : ""}

      <div class="alt-acts">
        <a class="btn ghost sm" target="_blank" rel="noopener"
           href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}">
           ${icon("map-pin", 15)}افتح في الخرائط</a>
        <button class="btn sm" data-pick="${s.lat},${s.lng}">${icon("telescope", 15)}حلّله بعمق</button>
      </div>
    </div>`).join("");

  box.innerHTML = `
    <div class="section-head sp-t"><h2>أفضل المواقع لنشاطك</h2>
      <span class="note">من ${d.scanned} منطقة مفحوصة</span></div>
    ${baseTxt ? `<div class="alt-base">${esc(baseTxt)}</div>` : ""}
    ${sites || `<div class="hint">لم نجد مرشحات مناسبة — وسّع نطاق البحث.</div>`}
    <div class="disclaimer">${esc(d.note || "")}</div>`;

  box.querySelectorAll("[data-pick]").forEach((btn) => btn.onclick = () => {
    const inp = $("locCoords");
    if (inp) {
      inp.value = btn.dataset.pick.replace(",", ", ");
      $("coordBtn")?.click();
      setTimeout(() => $("locBtn")?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    }
  });

  box.className = "";
}

async function run() {
  const btn = $("altBtn");
  const act = $("locAct")?.value?.trim();
  if (!act || act.length < 2) {
    msg("error", "اكتب نوع النشاط في الأعلى أولاً.");
    $("locAct")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const p = pickedPoint();
  if (!p) {
    msg("error", "حدّد نقطة انطلاق أولاً — ابحث عن حيّك أعلى الصفحة أو اضغط على الخريطة.");
    return;
  }

  btn.disabled = true;
  const old = btn.textContent;
  btn.innerHTML = `<span class="spinner"></span>نمسح المنطقة`;
  msg("info", "نفحص عشرات المناطق ونقارن كثافتها وطرقها ومنافسيها — قد يستغرق دقيقة.");

  try {
    const { data, error } = await sb.functions.invoke("alt-sites", {
      body: {
        lat: p.lat, lng: p.lng, activity: act,
        radius_km: Number($("altRadius")?.value || 6),
        priority: $("altPriority")?.value || "balanced",
        city: $("locCity")?.value?.trim() || null,
      },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "تعذّر الترشيح");
    render(data);
    $("altMsg").className = "msg";
    $("altResult")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    msg("error", String(e?.message || e).slice(0, 160));
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(mount, 1100));
else setTimeout(mount, 1100);
