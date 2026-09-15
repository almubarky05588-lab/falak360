/* =========================================================
   فلك ٣٦٠ — مزايا الباقات في الصفحة التعريفية
   تعرض كل المزايا في كل باقة، وتشطب ما لا تشمله الباقة
   ========================================================= */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CSS = `
.feats li.off{color:var(--ink-3)}
.feats li.off span{text-decoration:line-through;text-decoration-color:var(--line-2);text-decoration-thickness:1.5px}
.feats li.off svg,.plan .feats li.off svg{color:var(--line-2)}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>`;
const DASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>`;

/* كل المزايا، ولكل باقة ما تشمله */
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

function paint() {
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

function watch(n = 0) {
  if (paint() || n > 40) return;
  setTimeout(() => watch(n + 1), 400);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => watch());
else watch();

const box = document.getElementById("plansBox");
if (box) new MutationObserver(() => setTimeout(paint, 80)).observe(box, { childList: true });
