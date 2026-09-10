/* =========================================================
   فلك ٣٦٠ — التسجيل والدخول
   تسجيل (الاسم، الجوال، البريد، كلمة المرور) + رمز تحقق على البريد
   + نسيت كلمة المرور + تغيير كلمة المرور من شاشة «اشتراكي»
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { icon } from "./icons.js";

const sb = createClient(
  "https://dpkvkwcofxeptpzdsjre.supabase.co",
  "sb_publishable_Krja6qX-HGdklghDfTJmjQ_XpmIgBPe",
  { auth: { autoRefreshToken: false, persistSession: true, detectSessionInUrl: false } },
);

const STORE_KEY = "sb-dpkvkwcofxeptpzdsjre-auth-token";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const latin = (s) => String(s ?? "")
  .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
  .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

let flowEmail = "";
let flowType = "signup";
let cooldownTimer = null;

/* ---------------- أدوات ---------------- */
function msg(kind, text, el = $("auMsg")) {
  if (!el) return;
  if (!text) { el.className = "msg"; el.innerHTML = ""; return; }
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}

function busy(btn, on, label = "لحظة") {
  if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>${esc(label)}`; }
  else { btn.disabled = false; btn.innerHTML = btn.dataset.label || ""; }
}

function arError(err) {
  const code = err?.code || "";
  const m = String(err?.message || err || "");
  if (code === "invalid_credentials" || /invalid login credentials/i.test(m)) return "البريد أو كلمة المرور غير صحيحة.";
  if (code === "user_already_exists" || /already registered/i.test(m)) return "هذا البريد مسجّل مسبقاً — سجّل الدخول أو استعد كلمة المرور.";
  if (code === "weak_password" || /password should be/i.test(m)) return "كلمة المرور ضعيفة — 6 أحرف على الأقل.";
  if (code === "same_password") return "كلمة المرور الجديدة مطابقة للقديمة.";
  if (code === "email_address_invalid" || /invalid email|unable to validate email/i.test(m)) return "صيغة البريد الإلكتروني غير صحيحة.";
  if (code === "otp_expired" || /token has expired|token is invalid|otp/i.test(m)) return "الرمز غير صحيح أو انتهت صلاحيته.";
  if (code.includes("rate_limit") || /rate limit|too many/i.test(m)) return "طلبات كثيرة خلال وقت قصير — انتظر دقيقة ثم أعد المحاولة.";
  return m || "حدث خطأ غير متوقع.";
}

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
function normPhone(p) {
  let d = latin(p).replace(/\D/g, "");
  if (d.startsWith("00966")) d = d.slice(2);
  if (/^05\d{8}$/.test(d)) return "966" + d.slice(1);
  if (/^5\d{8}$/.test(d)) return "966" + d;
  if (/^9665\d{8}$/.test(d)) return d;
  return null;
}
const val = (id) => ($(id)?.value ?? "").trim();

function currentEmail() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null")?.user?.email ?? ""; }
  catch { return ""; }
}

/* ---------------- الواجهة ---------------- */
const CSS = `
.au-view{display:none}
.au-view.active{display:block}
.au-links{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:var(--sp-3);font-size:13px}
.au-link{background:none;border:0;padding:4px 0;color:var(--brand);font:inherit;font-size:13px;font-weight:500;cursor:pointer}
.au-link:disabled{color:var(--ink-3);cursor:default}
.au-sep{display:flex;align-items:center;gap:10px;color:var(--ink-3);font-size:12px;margin:var(--sp-4) 0}
.au-sep::before,.au-sep::after{content:"";flex:1;height:1px;background:var(--line)}
.au-sub{font-size:13.5px;color:var(--ink-2);line-height:1.7;margin-bottom:var(--sp-4);text-align:center}
.au-sub b{color:var(--ink);direction:ltr;unicode-bidi:embed}
.au-code{text-align:center;letter-spacing:.45em;font-family:var(--font-num);font-size:22px;direction:ltr}
.au-ltr{direction:ltr;text-align:right}
.au-card{margin-top:var(--sp-5)}
.au-card h2{font-family:var(--font-display);font-size:16px;font-weight:600;margin-bottom:4px}
.au-card .au-mail{font-size:13px;color:var(--ink-3);margin-bottom:var(--sp-4);direction:ltr;text-align:right}
`;

function view(name) {
  document.querySelectorAll(".au-view").forEach((v) => v.classList.toggle("active", v.id === `au-${name}`));
  msg();
  const first = document.querySelector(`#au-${name} input`);
  if (first) setTimeout(() => first.focus(), 50);
}

function mountAuth() {
  const card = document.querySelector("#authScreen .auth-card");
  if (!card || $("au-login")) return;

  // إخفاء عناصر النموذج القديم (تبقى في الصفحة لأن app.js يشير إليها)
  const legacy = document.createElement("div");
  legacy.className = "hidden";
  [...card.children].filter((el) => !el.classList.contains("auth-head")).forEach((el) => legacy.appendChild(el));
  card.appendChild(legacy);

  card.insertAdjacentHTML("beforeend", `
    <section id="au-login" class="au-view active">
      <div class="field"><label for="auLoginEmail">البريد الإلكتروني</label>
        <input id="auLoginEmail" class="input au-ltr" type="email" inputmode="email" autocomplete="username" placeholder="you@example.com"></div>
      <div class="field"><label for="auLoginPass">كلمة المرور</label>
        <input id="auLoginPass" class="input" type="password" autocomplete="current-password"></div>
      <button id="auLoginBtn" class="btn block">دخول</button>
      <div class="au-links"><button class="au-link" data-go="forgot">نسيت كلمة المرور؟</button></div>
      <div class="au-sep">ليس لديك حساب؟</div>
      <button class="btn ghost block" data-go="signup">إنشاء حساب جديد</button>
    </section>

    <section id="au-signup" class="au-view">
      <div class="field"><label for="auName">الاسم</label>
        <input id="auName" class="input" autocomplete="name" placeholder="اسمك كما تحب أن نناديك"></div>
      <div class="field"><label for="auPhone">رقم الجوال</label>
        <input id="auPhone" class="input au-ltr" type="tel" inputmode="tel" autocomplete="tel" placeholder="05XXXXXXXX"></div>
      <div class="field"><label for="auEmail">البريد الإلكتروني</label>
        <input id="auEmail" class="input au-ltr" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"></div>
      <div class="field"><label for="auPass">كلمة المرور</label>
        <input id="auPass" class="input" type="password" autocomplete="new-password" placeholder="6 أحرف على الأقل"></div>
      <button id="auSignupBtn" class="btn block">إنشاء الحساب</button>
      <div class="au-links"><button class="au-link" data-go="login">لديك حساب؟ سجّل الدخول</button></div>
    </section>

    <section id="au-verify" class="au-view">
      <p class="au-sub">أرسلنا رمز التحقق إلى <b id="auVerifyTo"></b><br>اكتبه هنا لتفعيل حسابك.</p>
      <div class="field"><label for="auCode">رمز التحقق</label>
        <input id="auCode" class="input au-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="••••••"></div>
      <button id="auVerifyBtn" class="btn block">تأكيد</button>
      <div class="au-links">
        <button class="au-link" id="auResend">إعادة إرسال الرمز</button>
        <button class="au-link" data-go="signup">تغيير البريد</button>
      </div>
      <p class="hint" style="text-align:center">لم يصلك؟ تفقّد مجلد الرسائل غير المرغوب فيها.</p>
    </section>

    <section id="au-forgot" class="au-view">
      <p class="au-sub">اكتب بريدك، وسنرسل لك رمزاً لتعيين كلمة مرور جديدة.</p>
      <div class="field"><label for="auForgotEmail">البريد الإلكتروني</label>
        <input id="auForgotEmail" class="input au-ltr" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"></div>
      <button id="auForgotBtn" class="btn block">أرسل الرمز</button>
      <div class="au-links"><button class="au-link" data-go="login">رجوع لتسجيل الدخول</button></div>
    </section>

    <section id="au-reset" class="au-view">
      <p class="au-sub">أرسلنا رمز الاستعادة إلى <b id="auResetTo"></b></p>
      <div class="field"><label for="auResetCode">رمز الاستعادة</label>
        <input id="auResetCode" class="input au-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="••••••"></div>
      <div class="field"><label for="auNewPass">كلمة المرور الجديدة</label>
        <input id="auNewPass" class="input" type="password" autocomplete="new-password" placeholder="6 أحرف على الأقل"></div>
      <button id="auResetBtn" class="btn block">حفظ كلمة المرور</button>
      <div class="au-links">
        <button class="au-link" id="auResendReset">إعادة إرسال الرمز</button>
        <button class="au-link" data-go="login">رجوع</button>
      </div>
    </section>

    <div id="auMsg" class="msg"></div>`);

  card.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => view(b.dataset.go));

  $("auLoginBtn").onclick = login;
  $("auSignupBtn").onclick = signup;
  $("auVerifyBtn").onclick = verify;
  $("auResend").onclick = () => resend("signup");
  $("auForgotBtn").onclick = forgot;
  $("auResetBtn").onclick = reset;
  $("auResendReset").onclick = () => resend("recovery");

  // Enter يرسل النموذج الظاهر
  card.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const v = card.querySelector(".au-view.active");
    const btn = v?.querySelector(".btn.block:not(.ghost)");
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  });
}

/* ---------------- العمليات ---------------- */
async function login() {
  const email = val("auLoginEmail").toLowerCase();
  const password = $("auLoginPass").value;
  if (!validEmail(email)) return msg("error", "اكتب بريدك الإلكتروني بشكل صحيح.");
  if (!password) return msg("error", "اكتب كلمة المرور.");

  const btn = $("auLoginBtn");
  busy(btn, true, "جارٍ الدخول");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  busy(btn, false);

  if (error) {
    if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) {
      flowEmail = email;
      await sb.auth.resend({ type: "signup", email });
      showVerify();
      return msg("info", "بريدك لم يُفعّل بعد — أرسلنا لك رمز التحقق.");
    }
    return msg("error", arError(error));
  }
  location.reload();
}

async function signup() {
  const name = val("auName");
  const phone = normPhone(val("auPhone"));
  const email = val("auEmail").toLowerCase();
  const password = $("auPass").value;

  if (name.length < 2) return msg("error", "اكتب اسمك.");
  if (!phone) return msg("error", "اكتب رقم جوال سعودي صحيح يبدأ بـ 05.");
  if (!validEmail(email)) return msg("error", "اكتب بريدك الإلكتروني بشكل صحيح.");
  if (password.length < 6) return msg("error", "كلمة المرور 6 أحرف على الأقل.");

  const btn = $("auSignupBtn");
  busy(btn, true, "جارٍ الإنشاء");
  const { data, error } = await sb.auth.signUp({
    email, password, options: { data: { full_name: name, phone } },
  });
  busy(btn, false);

  if (error) return msg("error", arError(error));
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return msg("error", "هذا البريد مسجّل مسبقاً — سجّل الدخول أو استعد كلمة المرور.");
  }
  if (data?.session) { location.reload(); return; }

  flowEmail = email;
  showVerify();
}

function showVerify() {
  flowType = "signup";
  $("auVerifyTo").textContent = flowEmail;
  $("auCode").value = "";
  view("verify");
  startCooldown($("auResend"));
}

async function verify() {
  const token = latin(val("auCode")).replace(/\D/g, "");
  if (token.length < 6) return msg("error", "اكتب الرمز كاملاً.");

  const btn = $("auVerifyBtn");
  busy(btn, true, "جارٍ التأكيد");
  const { data, error } = await sb.auth.verifyOtp({ email: flowEmail, token, type: "signup" });
  busy(btn, false);

  if (error) return msg("error", arError(error));
  if (data?.session) {
    msg("done", "تم تفعيل حسابك — أهلاً بك في فلك.");
    setTimeout(() => location.reload(), 700);
  } else {
    msg("done", "تم تفعيل حسابك. سجّل الدخول الآن.");
    view("login");
    $("auLoginEmail").value = flowEmail;
  }
}

async function forgot() {
  const email = val("auForgotEmail").toLowerCase();
  if (!validEmail(email)) return msg("error", "اكتب بريدك الإلكتروني بشكل صحيح.");

  const btn = $("auForgotBtn");
  busy(btn, true, "جارٍ الإرسال");
  const { error } = await sb.auth.resetPasswordForEmail(email);
  busy(btn, false);
  if (error) return msg("error", arError(error));

  flowEmail = email;
  flowType = "recovery";
  $("auResetTo").textContent = email;
  $("auResetCode").value = "";
  $("auNewPass").value = "";
  view("reset");
  msg("info", "إن كان البريد مسجّلاً عندنا فسيصلك الرمز خلال لحظات.");
  startCooldown($("auResendReset"));
}

async function reset() {
  const token = latin(val("auResetCode")).replace(/\D/g, "");
  const password = $("auNewPass").value;
  if (token.length < 6) return msg("error", "اكتب الرمز كاملاً.");
  if (password.length < 6) return msg("error", "كلمة المرور 6 أحرف على الأقل.");

  const btn = $("auResetBtn");
  busy(btn, true, "جارٍ الحفظ");
  const { error: vErr } = await sb.auth.verifyOtp({ email: flowEmail, token, type: "recovery" });
  if (vErr) { busy(btn, false); return msg("error", arError(vErr)); }
  const { error } = await sb.auth.updateUser({ password });
  busy(btn, false);
  if (error) return msg("error", arError(error));

  msg("done", "تم تعيين كلمة المرور الجديدة.");
  setTimeout(() => location.reload(), 700);
}

async function resend(type) {
  const btn = type === "signup" ? $("auResend") : $("auResendReset");
  if (!flowEmail || btn.disabled) return;
  const { error } = type === "signup"
    ? await sb.auth.resend({ type: "signup", email: flowEmail })
    : await sb.auth.resetPasswordForEmail(flowEmail);
  if (error) return msg("error", arError(error));
  msg("done", "أعدنا إرسال الرمز.");
  startCooldown(btn);
}

function startCooldown(btn, secs = 60) {
  clearInterval(cooldownTimer);
  const label = "إعادة إرسال الرمز";
  let left = secs;
  btn.disabled = true;
  btn.textContent = `${label} (${left})`;
  cooldownTimer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(cooldownTimer);
      btn.disabled = false;
      btn.textContent = label;
    } else btn.textContent = `${label} (${left})`;
  }, 1000);
}

/* ---------------- تغيير كلمة المرور (داخل «اشتراكي») ---------------- */
function mountChangePassword() {
  const screen = $("screen-account");
  if (!screen || $("auChangeCard")) return;

  screen.insertAdjacentHTML("beforeend", `
    <div class="card au-card" id="auChangeCard">
      <h2>بيانات الدخول</h2>
      <div class="au-mail" id="auMyEmail"></div>
      <button class="btn ghost sm" id="auOpenChange">تغيير كلمة المرور</button>
      <div id="auChangeForm" class="hidden" style="margin-top:var(--sp-4)">
        <div class="field"><label for="auCurPass">كلمة المرور الحالية</label>
          <input id="auCurPass" class="input" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="auNewPass2">كلمة المرور الجديدة</label>
          <input id="auNewPass2" class="input" type="password" autocomplete="new-password" placeholder="6 أحرف على الأقل"></div>
        <div class="field"><label for="auNewPass3">أعد كتابة كلمة المرور الجديدة</label>
          <input id="auNewPass3" class="input" type="password" autocomplete="new-password"></div>
        <div class="row" style="gap:8px">
          <button class="btn" id="auSavePass">حفظ</button>
          <button class="btn ghost" id="auCancelPass">إلغاء</button>
        </div>
      </div>
      <div id="auChangeMsg" class="msg"></div>
    </div>`);

  const refreshEmail = () => { $("auMyEmail").textContent = currentEmail(); };
  refreshEmail();
  document.querySelector('.tab[data-screen="account"]')?.addEventListener("click", refreshEmail);

  const form = $("auChangeForm");
  const out = $("auChangeMsg");
  $("auOpenChange").onclick = () => {
    form.classList.remove("hidden");
    $("auOpenChange").classList.add("hidden");
    msg(null, null, out);
    $("auCurPass").focus();
  };
  $("auCancelPass").onclick = () => {
    form.classList.add("hidden");
    $("auOpenChange").classList.remove("hidden");
    ["auCurPass", "auNewPass2", "auNewPass3"].forEach((id) => { $(id).value = ""; });
    msg(null, null, out);
  };

  $("auSavePass").onclick = async () => {
    const email = currentEmail();
    const cur = $("auCurPass").value;
    const next = $("auNewPass2").value;
    if (!cur) return msg("error", "اكتب كلمة المرور الحالية.", out);
    if (next.length < 6) return msg("error", "كلمة المرور الجديدة 6 أحرف على الأقل.", out);
    if (next !== $("auNewPass3").value) return msg("error", "كلمتا المرور الجديدتان غير متطابقتين.", out);

    const btn = $("auSavePass");
    busy(btn, true, "جارٍ الحفظ");
    const { error: authErr } = await sb.auth.signInWithPassword({ email, password: cur });
    if (authErr) { busy(btn, false); return msg("error", "كلمة المرور الحالية غير صحيحة.", out); }
    const { error } = await sb.auth.updateUser({ password: next });
    busy(btn, false);
    if (error) return msg("error", arError(error), out);

    $("auCancelPass").click();
    msg("done", "تم تغيير كلمة المرور.", out);
  };
}

/* ---------------- التشغيل ---------------- */
const style = document.createElement("style");
style.textContent = CSS;
document.head.appendChild(style);
mountAuth();
mountChangePassword();
