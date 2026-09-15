/* =========================================================
   فلك ٣٦٠ — نافذة تأكيد بتصميم المنصة
   تعترض نوافذ المتصفح الخام وتستبدلها بواجهة لائقة
   ========================================================= */

import { icon } from "./icons.js";

const CSS = `
.fk-ov{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;
  padding:22px;background:rgba(16,24,32,.45);backdrop-filter:blur(3px);opacity:0;transition:opacity .16s}
.fk-ov.in{opacity:1}
.fk-dlg{background:var(--surface,#fff);border-radius:var(--r-lg,18px);padding:26px 22px 20px;
  max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(16,24,32,.28);
  transform:translateY(10px) scale(.98);transition:transform .18s}
.fk-ov.in .fk-dlg{transform:none}
.fk-dlg .fk-ic{width:52px;height:52px;margin:0 auto 14px;border-radius:50%;display:flex;
  align-items:center;justify-content:center;background:var(--brand-tint,#EEF1F7);color:var(--brand,#263A63)}
.fk-dlg .fk-ic svg{width:24px;height:24px}
.fk-dlg h3{font-family:var(--font-display,inherit);font-size:17.5px;font-weight:600;margin:0 0 8px;
  color:var(--ink,#111820)}
.fk-dlg p{font-size:14.5px;line-height:1.8;color:var(--ink-2,#4A5563);margin:0}
.fk-dlg p b{color:var(--ink,#111820);font-weight:600}
.fk-note{display:flex;gap:7px;align-items:flex-start;margin-top:13px;padding:10px 13px;
  border-radius:var(--r,12px);background:var(--surface-2,#FAFAF8);color:var(--ink-3,#7C8794);
  font-size:12.5px;line-height:1.65;text-align:start}
.fk-note svg{width:14px;height:14px;flex:0 0 auto;margin-top:2px}
.fk-acts{display:flex;gap:9px;margin-top:20px}
.fk-acts .btn{flex:1;justify-content:center}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

/* ---------------- النافذة ---------------- */
function askConfirm({ title, body, note, ok = "متابعة", cancel = "رجوع", ic = "banknote" }) {
  return new Promise((resolve) => {
    document.getElementById("fkConfirm")?.remove();

    const wrap = document.createElement("div");
    wrap.id = "fkConfirm";
    wrap.className = "fk-ov";
    wrap.innerHTML = `
      <div class="fk-dlg" role="dialog" aria-modal="true" aria-labelledby="fkcT">
        <div class="fk-ic">${icon(ic, 24)}</div>
        <h3 id="fkcT">${title}</h3>
        <p>${body}</p>
        ${note ? `<div class="fk-note">${icon("info", 14)}<span>${note}</span></div>` : ""}
        <div class="fk-acts">
          <button class="btn ghost" data-no>${cancel}</button>
          <button class="btn" data-yes>${ok}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const done = (v) => {
      wrap.classList.remove("in");
      document.removeEventListener("keydown", onKey);
      setTimeout(() => wrap.remove(), 160);
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === "Escape") done(false);
      if (e.key === "Enter") done(true);
    };

    wrap.querySelector("[data-no]").onclick = () => done(false);
    wrap.querySelector("[data-yes]").onclick = () => done(true);
    wrap.onclick = (e) => { if (e.target === wrap) done(false); };
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => {
      wrap.classList.add("in");
      wrap.querySelector("[data-yes]").focus();
    });
  });
}

/* ---------------- اعتراض نوافذ المتصفح ----------------
   window.confirm متزامنة ونافذتنا غير متزامنة، فنحل ذلك هكذا:
   ١) نسجّل آخر زر ضُغط.
   ٢) عند الاعتراض نُلغي العملية ونعرض نافذتنا.
   ٣) إن وافق العميل، نرفع علم القبول ونعيد الضغط على الزر نفسه،
      فتمر المحاولة الثانية مباشرة.
-------------------------------------------------------- */
const CONFIRM_UNDER = 10;          // لا نزعج صاحب الرصيد الوافر
const native = window.confirm.bind(window);

let lastBtn = null;
let approved = false;

document.addEventListener("click", (e) => {
  const b = e.target?.closest?.("button, a.btn, [role=button]");
  if (b) lastBtn = b;
}, true);

window.confirm = function (msg) {
  const text = String(msg ?? "");

  if (!/سيُخصم|سيخصم/.test(text)) return native(msg);

  // المحاولة الثانية بعد الموافقة
  if (approved) { approved = false; return true; }

  const m = text.match(/لديك\s+(\d+)/);
  const n = m ? Number(m[1]) : null;

  // رصيد وافر أو غير معروف: نمرّ بلا إزعاج
  if (n == null || n > CONFIRM_UNDER) return true;

  const btn = lastBtn;
  askConfirm({
    title: "تأكيد استخدام رصيدك",
    body: `سيُخصم <b>تقرير واحد</b> من رصيدك، ويتبقى لك <b>${n - 1}</b>.`,
    note: "لن يُخصم شيء إذا تعذّر إكمال التحليل.",
    ok: "نعم، حلّل الآن",
  }).then((go) => {
    if (!go || !btn) return;
    approved = true;
    btn.click();
    setTimeout(() => { approved = false; }, 4000);   // لا يبقى العلم مرفوعاً
  });

  return false;
};

window.falakConfirm = askConfirm;
