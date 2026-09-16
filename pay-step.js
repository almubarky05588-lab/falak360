/* =========================================================
   فلك ٣٦٠ — حجز رابط السداد عند الطلب
   الروابط تُفتح لمرة واحدة، فلا نحجزها إلا عند الجاهزية
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

const CSS = `
.pay-box{background:var(--surface,#fff);border:1px solid var(--line,#E3E5E0);
  border-radius:var(--r-lg,18px);padding:20px;margin-top:var(--sp-4,14px)}
.pay-box h4{font-family:var(--font-display,inherit);font-size:16px;font-weight:600;margin-bottom:4px}
.pay-box .amt{font-family:var(--font-num,monospace);font-size:26px;font-weight:600;
  color:var(--brand,#263A63);margin:8px 0 2px}
.pay-box .sub{font-size:13px;color:var(--ink-3,#7C8794)}
.pay-warn{display:flex;gap:8px;align-items:flex-start;margin:14px 0;padding:11px 13px;
  border-radius:var(--r,12px);background:var(--warn-tint,#FDF3E3);color:var(--warn,#A96A12);
  font-size:12.5px;line-height:1.7}
.pay-warn svg{width:15px;height:15px;flex:0 0 auto;margin-top:2px}
.pay-done{display:flex;gap:8px;align-items:flex-start;margin-top:12px;padding:11px 13px;
  border-radius:var(--r,12px);background:var(--ok-tint,#E8F3EE);color:var(--ok,#1E7A55);
  font-size:12.5px;line-height:1.7}
.pay-done svg{width:15px;height:15px;flex:0 0 auto;margin-top:2px}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

/* نعترض نتيجة طلب الاشتراك ونعرض خطوة الحجز */
function renderPayStep(host, res) {
  if (!host) return;
  const id = `pay_${Math.random().toString(36).slice(2, 8)}`;

  host.innerHTML = `
    <div class="pay-box" id="${id}">
      <h4>${esc(res.plan || "اشتراكك")}</h4>
      <div class="amt">${esc(res.amount_sar ?? "")} <span style="font-size:14px">ريال</span></div>
      <div class="sub">اشتراك شهري · يُفعّل تلقائياً بعد السداد</div>

      <div class="pay-warn">
        ${icon("alert-triangle", 15)}
        <span>رابط السداد يُفتح <b>لمرة واحدة</b> — لا تفتحه إلا وأنت جاهز للدفع الآن.
        إن فتحته ولم تُكمل، انتظر ٤٥ دقيقة ليعود صالحاً.</span>
      </div>

      <button class="btn block" data-book>${icon("banknote", 17)}احجز رابط السداد</button>
      <div class="msg" data-msg></div>
    </div>`;

  const box = $(id);
  const btn = box.querySelector("[data-book]");
  const msg = box.querySelector("[data-msg]");

  btn.onclick = async () => {
    btn.disabled = true;
    const old = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span>نحجز رابطك`;
    try {
      const { data, error } = await sb.rpc("request_subscription", {
        p_plan_code: res.plan_code, p_want_link: true,
      });
      if (error) throw error;

      if (data?.payment_link) {
        box.querySelector(".pay-warn").outerHTML = `
          <div class="pay-done">${icon("check-circle", 15)}
            <span>رابطك جاهز. أكمل السداد، ويُفعّل اشتراكك تلقائياً خلال دقيقة.</span></div>`;
        btn.outerHTML = `<a class="btn block" href="${esc(data.payment_link)}"
          target="_blank" rel="noopener">${icon("external-link", 17)}ادفع الآن</a>`;
      } else {
        msg.className = "msg show info";
        msg.innerHTML = `${icon("info", 17)}<span>${esc(data?.message || "سنرسل لك رابط السداد قريباً.")}</span>`;
        btn.disabled = false;
        btn.innerHTML = old;
      }
    } catch (e) {
      msg.className = "msg show error";
      msg.innerHTML = `${icon("alert-triangle", 17)}<span>تعذّر حجز الرابط — حاول بعد قليل.</span>`;
      btn.disabled = false;
      btn.innerHTML = old;
    }
  };
}

/* نلتقط ضغط أزرار الاشتراك في كل الشاشات */
document.addEventListener("click", async (e) => {
  const b = e.target?.closest?.("[data-sub]");
  if (!b) return;
  const code = b.dataset.sub;
  if (!code) return;

  // نترك السلوك الأصلي يعمل، ثم نستبدل النتيجة بخطوة الحجز
  setTimeout(async () => {
    const host = $("supPay") || $("accPay") || b.closest(".plan-c, .acc-pcard")?.parentElement;
    if (!host) return;
    try {
      const { data } = await sb.rpc("request_subscription", { p_plan_code: code });
      if (data?.ok) renderPayStep(host, { ...data, plan_code: code });
    } catch { /* */ }
  }, 400);
}, true);

window.falakPay = { renderPayStep };
