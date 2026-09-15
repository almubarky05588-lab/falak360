/* =========================================================
   فلك ٣٦٠ — الصفحة التعريفية
   الشعار · زر المورّد · قسم الموردين · الباقات · الفوتر
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
.fk-col a{display:block;font-size:14px;color:var(--ink-2);text-decoration:none;margin-bottom:11px;line-height:1.6}
.fk-col a:hover{color:var(--brand)}
.fk-bar{border-top:1px solid var(--line);margin-top:34px;padding-top:22px;display:flex;
  justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--ink-3)}
.fk-bar a{color:var(--ink-3);text-decoration:none}
.fk-bar a:hover{color:var(--brand)}
.fk-sources{font-size:12.5px;color:var(--ink-3);line-height:1.9;margin-top:10px}

.fk-sup{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 15px;
  border:1px solid var(--line-2);border-radius:var(--r-full);background:var(--surface);
  color:var(--ink-2);font-size:13.5px;font-weight:500;text-decoration:none;white-space:nowrap;
  transition:border-color .15s,color .15s}
.fk-sup:hover{border-color:var(--brand);color:var(--brand)}
.fk-sup svg{width:16px;height:16px;flex:0 0 auto}
@media(max-width:620px){.fk-sup span{display:none}.fk-sup{padding:0 11px}}
header .nav{gap:10px}

.fk-sup-sec{padding:60px 0;background:var(--surface);border-block:1px solid var(--line);margin-top:20px}
.fk-sup-in{max-width:1040px;margin:0 auto;padding:0 20px}
.fk-sup-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:46px;align-items:center}
@media(max-width:860px){.fk-sup-grid{grid-template-columns:1fr;gap:32px}}
.fk-sup-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;
  color:var(--brand);background:var(--brand-tint);padding:6px 14px;border-radius:var(--r-full);margin-bottom:18px}
.fk-sup-eyebrow svg{width:15px;height:15px}
.fk-sup-sec h2{font-family:var(--f-d);font-size:clamp(23px,3.5vw,31px);font-weight:600;
  letter-spacing:-.025em;line-height:1.35}
.fk-sup-sec .lede{font-size:16.5px;color:var(--ink-2);margin-top:14px;line-height:1.9}
.fk-sup-pts{display:grid;gap:14px;margin-top:24px}
.fk-sup-pt{display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:flex-start}
.fk-sup-pt .ic{width:34px;height:34px;flex:0 0 auto;border-radius:10px;background:var(--brand-tint);
  color:var(--brand);display:flex;align-items:center;justify-content:center}
.fk-sup-pt .ic svg{width:17px;height:17px}
.fk-sup-pt b{display:block;font-size:15px;font-weight:600;margin-bottom:2px}
.fk-sup-pt p{font-size:14px;color:var(--ink-2);line-height:1.75}
.fk-sup-card{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-lg);padding:26px}
.fk-sup-card h3{font-family:var(--f-d);font-size:17px;font-weight:600;margin-bottom:6px}
.fk-sup-card .sub{font-size:13.5px;color:var(--ink-3);margin-bottom:18px}
.fk-sup-steps{display:grid;gap:13px;margin-bottom:20px}
.fk-sup-step{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:flex-start}
.fk-sup-step .n{width:25px;height:25px;flex:0 0 auto;border-radius:50%;background:var(--brand);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:600}
.fk-sup-step div{font-size:14px;color:var(--ink-2);line-height:1.7}
.fk-sup-note{font-size:12.5px;color:var(--ink-3);margin-top:13px;line-height:1.75;text-align:center}
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

function fixLogos() {
  document.querySelectorAll(".logo > svg, .fk-brand > svg").forEach((svg) => {
    if (svg.dataset.fkLogo === "1") return;
    if (svg.getAttribute("viewBox") === "0 0 48 48") { svg.dataset.fkLogo = "1"; return; }
    const size = svg.getAttribute("width") || 30;
    const holder = document.createElement("span");
    holder.innerHTML = logoMark(size);
    const fresh = holder.firstElementChild;
    fresh.dataset.fkLogo = "1";
    svg.replaceWith(fresh);
  });
}

/* ---------------- الأيقونات ---------------- */
const SUP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
  stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9h18M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/>
  <path d="M9 13h6"/></svg>`;

const I = {
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  free: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
};

/* ---------------- زر المورّد في الهيدر ---------------- */
function addSupplierBtn() {
  const nav = document.querySelector("header .nav");
  if (!nav || nav.querySelector(".fk-sup")) return;
  const cta = nav.querySelector('a.btn[href="app.html"], a.btn.sm');
  const link = document.createElement("a");
  link.className = "fk-sup";
  link.href = "supplier.html";
  link.innerHTML = `${SUP_ICON}<span>انضم كمورّد</span>`;
  if (cta) cta.before(link); else nav.appendChild(link);
}

/* ---------------- قسم الموردين ---------------- */
function buildSupplierSection() {
  if (document.getElementById("fkSupSec")) return;
  const anchor = document.getElementById("reports") || document.getElementById("faq");
  if (!anchor) return;

  anchor.insertAdjacentHTML("afterend", `
    <section class="fk-sup-sec" id="fkSupSec">
      <div class="fk-sup-in">
        <div class="fk-sup-grid">
          <div>
            <div class="fk-sup-eyebrow">${SUP_ICON}للموردين وتجار الجملة</div>
            <h2>عملاؤك هم أصحاب المحلات — وهم عندنا</h2>
            <p class="lede">
              كل صاحب محل يستخدم فلك ٣٦٠ يحتاج موردين لنشاطه.
              نعرض منشأتك أمامه في الوقت الذي يبحث فيه فعلاً، مصنّفةً بقطاعه ومنطقته —
              لا إعلاناً عابراً يمر عليه.
            </p>

            <div class="fk-sup-pts">
              <div class="fk-sup-pt">
                <div class="ic">${I.target}</div>
                <div><b>وصول مستهدف لا عشوائي</b>
                  <p>تظهر لأصحاب المحلات في قطاعك ومنطقتك فقط — من يحتاج ما تبيعه فعلاً.</p></div>
              </div>
              <div class="fk-sup-pt">
                <div class="ic">${I.shield}</div>
                <div><b>توثيق يبني الثقة</b>
                  <p>بعد التحقق من سجلك التجاري تظهر بشارة «موثّق» على منشأتك — فوق الأنشطة غير الموثّقة.</p></div>
              </div>
              <div class="fk-sup-pt">
                <div class="ic">${I.users}</div>
                <div><b>تواصل مباشر</b>
                  <p>يصلك العميل على واتساب أو هاتفك مباشرة — بلا وسيط وبلا عمولة على صفقاتك.</p></div>
              </div>
              <div class="fk-sup-pt">
                <div class="ic">${I.free}</div>
                <div><b>ابدأ بلا تكلفة</b>
                  <p>سجّل منشأتك ومنتجاتك مجاناً، وادفع فقط إن أردت الظهور في المقدمة.</p></div>
              </div>
            </div>
          </div>

          <div class="fk-sup-card">
            <h3>كيف تنضم؟</h3>
            <div class="sub">ثلاث خطوات، ولا تحتاج خبرة تقنية.</div>
            <div class="fk-sup-steps">
              <div class="fk-sup-step"><div class="n">1</div>
                <div>سجّل منشأتك وارفع سجلك التجاري.</div></div>
              <div class="fk-sup-step"><div class="n">2</div>
                <div>حدّد قطاعك والمدن التي توصّل إليها، وأضف منتجاتك.</div></div>
              <div class="fk-sup-step"><div class="n">3</div>
                <div>نراجع طلبك، وتظهر لأصحاب المحلات في نطاقك.</div></div>
            </div>
            <a class="btn block" href="supplier.html">سجّل منشأتك كمورّد</a>
            <div class="fk-sup-note">
              المراجعة تستغرق يوم عمل واحد عادةً.
            </div>
          </div>
        </div>
      </div>
    </section>`);
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
  addSupplierBtn();
  buildSupplierSection();
  buildFooter();
  fixLogos();
  if (paintPlans() || n > 40) return;
  setTimeout(() => tick(n + 1), 400);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => tick());
else tick();

const box = document.getElementById("plansBox");
if (box) new MutationObserver(() => setTimeout(paintPlans, 80)).observe(box, { childList: true });
