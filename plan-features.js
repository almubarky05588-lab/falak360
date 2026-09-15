/* =========================================================
   فلك ٣٦٠ — مزايا الباقات في الصفحة التعريفية
   تعرض كل المزايا في كل باقة، وتشطب ما لا تشمله
   ========================================================= */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const TICK = `<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const DASH = `<svg class="dash" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>`;

/* كل المزايا مرتبة — ولكل باقة ما تشمله */
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
  { t: "البحث في الموردين وفلترتهم", in: ["growth", "pro"] },
  { t: "عدة محلات أو فروع في حساب واحد", in: ["pro"] },
  { t: "مقارنة أداء الفروع", in: ["pro"] },
  { t: "حصص أعلى وأولوية في الدعم", in: ["pro"] },
];

function listFor(code) {
  return FEATURES.map((f) => {
    const on = f.in.includes(code);
    return `<li class="${on ? "" : "off"}">${on ? TICK : DASH}<span>${esc(f.t)}</span></li>`;
  }).join("");
}

/* نستبدل قائمة كل بطاقة بالقائمة الكاملة المشطوبة */
function paint() {
  const cards = document.querySelectorAll("#plansBox .plan");
  if (!cards.length) return false;

  cards.forEach((card) => {
    if (card.dataset.fkFeat === "1") return;
    const ul = card.querySelector(".feats");
    if (!ul) return;

    // نستنتج رمز الباقة من اسمها
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
  if (paint() || n > 30) return;
  setTimeout(() => watch(n + 1), 500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => watch());
} else watch();

/* لو أُعيد بناء الباقات لاحقاً */
const box = document.getElementById("plansBox");
if (box) new MutationObserver(() => setTimeout(paint, 100)).observe(box, { childList: true });
