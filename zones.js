/* =========================================================
   فلك ٣٦٠ — إضافات الواجهة (الدفعة الأولى)
   تعمل فوق app.js بلا تعديله:
   • تنبيه على مفتاح ألوان الخريطة
   • تحليل الجهات: أين تقوى وأين تضعف ومن يسبقك
   ========================================================= */

import { icon } from "./icons.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CSS = `
.legend .lg-tip{color:var(--ink-3);display:inline-flex;align-items:center;gap:5px}
.legend .lg-tip svg{width:13px;height:13px;flex:0 0 auto}
.zone{display:grid;grid-template-columns:86px 1fr auto;gap:10px;align-items:center;padding:8px 0;
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
`;

(() => {
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
})();

/* اتجاه النقطة من المحل */
const dirOf = (dLat, dLng) => {
  if (Math.abs(dLat) < 1e-9 && Math.abs(dLng) < 1e-9) return "المركز";
  const ang = Math.atan2(dLat, dLng) * 180 / Math.PI;
  const i = Math.round(((ang + 360) % 360) / 45) % 8;
  return ["الشرق", "الشمال الشرقي", "الشمال", "الشمال الغربي",
          "الغرب", "الجنوب الغربي", "الجنوب", "الشمال الشرقي"][i] || "الشرق";
};

function legendTip() {
  const box = $("mapLegend");
  if (!box || box.querySelector(".lg-tip")) return;
  box.insertAdjacentHTML("beforeend",
    `<span class="lg-tip">${icon("info", 13)}اضغط أي نقطة لترى من يظهر فوقك فيها</span>`);
}

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
      if (c.is_mine) return;
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

/* يُستدعى من app.js بعد رسم نتيجة الفحص */
window.falakZones = { render: renderZones, legendTip };
