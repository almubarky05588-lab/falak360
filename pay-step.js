/* =========================================================
   فلك ٣٦٠ — حجز رابط السداد في مكان الزر نفسه
   الروابط تُفتح لمرة واحدة، فلا تُحجز إلا بضغطة واعية
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { icon } from "./icons.js";

const sb = createClient(
  "https://dpkvkwcofxeptpzdsjre.supabase.co",
  "sb_publishable_Krja6qX-HGdklghDfTJmjQ_XpmIgBPe",
);

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CSS = `
.pay-hint{font-size:12px;color:var(--warn,#A96A12);line-height:1.7;margin-top:9px;
  display:flex;gap:6px;align-items:flex-start}
.pay-hint svg{width:13px;height:13px;flex:0 0 auto;margin-top:3px}
.pay-ready{font-size:12.5px;color:var(--ok,#1E7A55);line-height:1.7;margin-top:9px;
  display:flex;gap:6px;align-items:flex-start}
.pay-ready svg{width:14px;height:14px;flex:0 0 auto;margin-top:2px}
.btn.pay-go{background:var(--ok,#1E7A55)}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

/* يحوّل الزر إلى رابط دفع في مكانه */
async function bookLink(btn, planCode) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>نحجز رابطك`;

  try {
    const { data, error } = await sb.rpc("request_subscription", {
      p_plan_code: planCode, p_want_link: true,
    });
    if (error) throw error;

    if (data?.payment_link) {
      const link = document.createElement("a");
      link.className = "btn block pay-go";
      link.href = data.payment_link;
      link.target = "_blank";
      link.rel = "noopener";
      link.innerHTML = `${icon("external-link", 17)}ادفع الآن · ${esc(data.amount_sar)} ر.س`;

      const ready = document.createElement("div");
      ready.className = "pay-ready";
      ready.innerHTML = `${icon("check-circle", 14)}<span>رابطك جاهز — أكمل السداد ويُفعّل اشتراكك تلقائياً خلال دقيقة.</span>`;

      btn.replaceWith(link);
      link.after(ready);
      link.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      btn.disabled = false;
      btn.innerHTML = original;
      const note = document.createElement("div");
      note.className = "pay-hint";
      note.innerHTML = `${icon("info", 13)}<span>${esc(data?.message || "سنرسل لك رابط السداد قريباً.")}</span>`;
      btn.after(note);
    }
  } catch {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

/* نعترض أزرار الاشتراك قبل أن يعالجها app.js */
document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("[data-sub]");
  if (!btn || btn.dataset.payBound === "1") return;

  const code = btn.dataset.sub;
  if (!code || code === "trial") return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  btn.dataset.payBound = "1";
  bookLink(btn, code);
}, true);

/* تنبيه أسفل كل زر اشتراك: الرابط لمرة واحدة */
function addHints() {
  document.querySelectorAll("[data-sub]").forEach((b) => {
    if (b.dataset.sub === "trial" || b.dataset.hinted === "1") return;
    if (b.nextElementSibling?.classList?.contains("pay-hint")) return;
    b.dataset.hinted = "1";
    const h = document.createElement("div");
    h.className = "pay-hint";
    h.innerHTML = `${icon("alert-triangle", 13)}<span>رابط السداد يُفتح لمرة واحدة — اضغط وأنت جاهز للدفع.</span>`;
    b.after(h);
  });
}

new MutationObserver(() => setTimeout(addHints, 120))
  .observe(document.body, { childList: true, subtree: true });
setTimeout(addHints, 1200);
