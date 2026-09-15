/* =========================================================
   فلك ٣٦٠ — الصفحة التعريفية: الشعار + مزايا الباقات + الفوتر
   ========================================================= */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CSS = `
.feats li.off{color:var(--ink-3)}
.feats li.off span{text-decoration:line-through;text-decoration-color:var(--line-2);text-decoration-thickness:1.5px}
.feats li.off svg,.plan .feats li.off svg{color:var(--line-2)}

.fk-foot{border-top:1px solid var(--line);margin-top:20px;padding:44px 0 34px}
.fk-cols{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:34px}
@media(max-width:820px){.fk-cols{grid-template-columns:1fr 1fr;gap:28px}}
@media(max-width:520px){.fk-cols{grid-template-columns:1fr}}
.fk-brand{display:flex;align-items:center;gap:10px;font-family:var(--f-d);font-weight:600;font-size:18px;color:var(--brand)}
.fk-brand span{color:var(--ink-3);font-weight:400}
.fk-about{font-size:14px;color:var(--ink-2);line-height:1.85;margin-top:14px;max-width:320px}
.fk-col h4{font-family:var(--f-d);font-size:14.5px;font-weight:600;margin-bottom:14px;color:var(--ink)}
.fk-col a,.fk-col div.it{display:block;font-size:14px;color:var(--ink-2);text-decoration:none;
  margin-bottom:11px;line-height:1.6}
.fk-col a:hover{color:var(--brand)}
.fk-bar{border-top:1px solid var(--line);margin-top:34px;padding-top:22px;display:flex;
  justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--ink-3)}
.fk-bar a{color:var(--ink-3);text-decoration:none}
.fk-bar a:hover{color:var(--brand)}
.fk-sources{font-size:12.5px;color:var(--ink-3);line-height:1.9;margin-top:10px}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

/* ---------------- الشعار المعتمد ---------------- */
const logoMark = (size) => `<svg width="${size || 30}" height="${size || 30}" viewBox="0 0 48 48"
  fill="none" aria-hidden="true">
  <path d="M 10 34 A 18 18 0 1 1 38 34" stroke="var(--brand)" stroke-width="2.6"
    stroke-linecap="round" fill="none"/>
  <path d="M 19.5 30 V 13 H 30.5 M 19.5 21 H 28" stroke="var(--brand)" stroke-width="3.3"
    stroke-linecap="round" stroke-linejoin="round"/>
  <text x="24" y="41.5" font-family="inherit" font-size="9.5" font-weight="700"
    fill="var(--brand)" text-anchor="middle">360&#176;</text>
</svg>`;

/* استبدال أي شعار قديم في الصفحة */
function fixLogos() {
  document.querySelectorAll(".logo > svg, .fk-brand > svg").forEach((svg) => {
    if (svg.dataset.fkLogo === "1") return;
    const size = svg.getAttribute("width") || 30;
    const holder = document.createElement("span");
    holder.innerHTML = logoMark(size);
    const fresh = holder.firstElementChild;
    fresh.dataset.fkLogo = "1";
    svg.replaceWith(fresh);
  });
}

/* ---------------- مزايا الباقات ---------------- */
const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>`;
const DASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>`;

const FEATURES = [
  { t: "فحص ترتيبك على خريطة قوقل", in: ["basic", "growth", "pro"] },
  { t: "تدقيق ملفك التجاري", in: ["basic", "growth", "pro"] },
  { t: "خطة رفع الظهور بمحتوى جاهز", in: ["basic", "growth", "pro"] },
  { t: "تحليل مراجعاتك", in: ["basic", "growth", "pro"] },
  { t: "موردون موثّقون في منطقتك", in: ["basic", "growth", "pro"] },
  { t: "حجم البحث الفعلي على نشاطك", in: ["basic", "growth", "pro"] },
  { t: "تحليل المنافسين ومراقبة نطاقك", in: ["growth", "pro"] },
  { t: "ظهورك في الذكاء الاصطناعي", in: ["growth", "pro"] },
  { t: "أسئلة عملائك على قوقل ماب", in: ["growth", "pro"] },
  { t: "تنبيهات عند دخول منافس أو تراجع ترتيبك", in: ["growth", "pro"] },
  { t: "سجل أدائك عبر الزمن", in: ["growth", "pro"] },
  { t: "البحث في الموردين وفلترتهم بالمدينة", in: ["growth", "pro"] },
  { t: "عدة محلات أو فروع في حساب واحد", in: ["pro"] },
  { t: "مقارنة أداء الفروع", in: ["pro"] },
  { t: "حصص أعلى وأولوية في الدعم", in: ["pro"] },
];

const listFor = (code) => FEATURES.map((f) => {
  const on = f.in.includes(code);
  return `<li class="${on ? "" : "off"}">${on ? TICK : DASH}<span>${esc(f.t)}</span></li>`;
}).join("");

function paintPlans() {
  const cards = document.querySelectorAll("#plansBox .plan");
  if (!cards.length) return false;
  cards.forEach((card) => {
    if (card.dataset.fkFeat === "1") return;
    const ul = card.querySelector(".feats");
    if (!ul) return;
    const name = card.querySelector("h3")?.textContent?.trim() || "";
    const code = /احتراف/.test(name) ? "pro"
      : /نمو/.test(name) ? "growth"
      : /أساس|اساس/.test(name) ? "basic" : null;
    if (!code) return;
    ul.innerHTML = listFor(code);
    card.dataset.fkFeat = "1";
  });
  return true;
}

/* ---------------- الفوتر ---------------- */
function buildFooter() {
  const old = document.querySelector("footer");
  if (!old || old.dataset.fkFoot === "1") return;
  const year = new Date().getFullYear();

  old.outerHTML = `
    <footer class="fk-foot" data-fk-foot="1">
      <div class="fk-cols">
        <div>
          <div class="fk-brand">${logoMark(28)}فلك <span>٣٦٠</span></div>
          <p class="fk-about">
            منصة سعودية تقيس ظهور محلك في خرائط قوقل والمساعدات الذكية،
            وتكشف لك أين تختفي ومن يأخذ مكانك — بقياس فعلي لا بتخمين.
          </p>
        </div>

        <div class="fk-col">
          <h4>المنصة</h4>
          <a href="index.html#how">كيف تعمل</a>
          <a href="index.html#pricing">الباقات والأسعار</a>
          <a href="index.html#reports">التقارير المفردة</a>
          <a href="index.html#faq">أسئلة شائعة</a>
        </div>

        <div class="fk-col">
          <h4>قانوني</h4>
          <a href="terms.html#terms">شروط الاستخدام</a>
          <a href="terms.html#privacy">سياسة الخصوصية</a>
          <a href="terms.html#refund">الاسترجاع والإلغاء</a>
        </div>

        <div class="fk-col">
          <h4>تواصل</h4>
          <a href="mailto:support@falak360.net">support@falak360.net</a>
          <a href="app.html">تسجيل الدخول</a>
          <a href="supplier.html">انضم كمورّد</a>
        </div>
      </div>

      <div class="fk-bar">
        <div>© ${year} فلك ٣٦٠ · جميع الحقوق محفوظة</div>
        <div>التحليلات إرشادية ولا تضمن ترتيباً معيّناً</div>
      </div>

      <div class="fk-sources">
        مصادر البيانات: مؤشرات الإيجار من الهيئة العامة للعقار ·
        كثافة المباني من Microsoft Global Building Footprints ·
        بيانات الطرق من OpenStreetMap
      </div>
    </footer>`;
}

/* ---------------- التشغيل ---------------- */
function tick(n = 0) {
  fixLogos();
  buildFooter();
  fixLogos();
  if (paintPlans() || n > 40) return;
  setTimeout(() => tick(n + 1), 400);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => tick());
else tick();

const box = document.getElementById("plansBox");
if (box) new MutationObserver(() => setTimeout(paintPlans, 80)).observe(box, { childList: true });
