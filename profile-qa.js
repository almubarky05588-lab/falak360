/* =========================================================
   فلك ٣٦٠ — أسئلة ملفك ومنشورات منافسيك
   تُضاف في تبويب «الملف التجاري»
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
.qa-box{margin-top:var(--sp-5)}
.qa-hero{background:linear-gradient(135deg,var(--brand-tint),var(--surface));
  border:1px solid var(--line);border-radius:var(--r-lg);padding:18px}
.qa-hero h3{font-family:var(--font-display);font-size:17px;font-weight:600;display:flex;align-items:center;gap:8px}
.qa-hero h3 svg{width:19px;height:19px;color:var(--brand)}
.qa-hero p{font-size:13.5px;color:var(--ink-2);line-height:1.8;margin-top:6px}
.qa-item{border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface);
  padding:14px;margin-bottom:9px}
.qa-item.none{border-color:#EBD3CF;background:#FDF7F6}
.qa-q{font-size:14px;font-weight:600;line-height:1.65;display:flex;gap:8px;align-items:flex-start}
.qa-q svg{width:16px;height:16px;flex:0 0 auto;margin-top:3px;color:var(--ink-3)}
.qa-item.none .qa-q svg{color:var(--bad)}
.qa-tag{display:inline-block;font-size:10.5px;padding:2px 8px;border-radius:var(--r-full);margin-top:8px}
.qa-tag.no{background:var(--bad-tint,#FBEDEB);color:var(--bad)}
.qa-tag.other{background:var(--warn-tint,#FDF3E3);color:var(--warn)}
.qa-tag.ok{background:var(--ok-tint);color:var(--ok)}
.qa-ans{font-size:13px;color:var(--ink-2);line-height:1.75;margin-top:9px;padding-top:9px;
  border-top:1px dashed var(--line)}
.qa-draft{background:var(--surface-2);border-radius:var(--r);padding:11px 13px;margin-top:10px}
.qa-draft .lbl{font-size:11.5px;color:var(--ink-3);display:flex;justify-content:space-between;
  align-items:center;margin-bottom:6px}
.qa-draft .txt{font-size:13.5px;line-height:1.8;white-space:pre-line}
.qa-copy{border:0;background:none;font:inherit;font-size:11.5px;color:var(--brand);cursor:pointer;
  display:flex;align-items:center;gap:5px;padding:2px 0}
.qa-copy svg{width:13px;height:13px}
.qa-copy.done{color:var(--ok)}
.qa-rival{display:flex;gap:9px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);
  font-size:13.5px;line-height:1.7}
.qa-rival:last-child{border-bottom:0}
.qa-rival svg{width:15px;height:15px;flex:0 0 auto;margin-top:3px;color:var(--ink-3)}
.qa-rival small{display:block;color:var(--ink-3);font-size:11.5px;margin-top:2px}
.qa-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.qa-stat{text-align:center;padding:10px 6px;background:var(--surface);border:1px solid var(--line);
  border-radius:var(--r)}
.qa-stat b{display:block;font-family:var(--font-num);font-size:19px;font-weight:600}
.qa-stat small{font-size:10.5px;color:var(--ink-3)}
`;
(() => { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); })();

function mount() {
  const host = document.querySelector("#profileBody .plan-hero");
  if (!host || $("qaBox")) return;

  host.insertAdjacentHTML("beforebegin", `
    <div id="qaBox" class="qa-box">
      <div class="qa-hero">
        <h3>${icon("message-square", 19)}أسئلة عملائك على قوقل ماب</h3>
        <p>يطرح الناس أسئلة على ملفك، وأي أحد يقدر يجيب — لا أنت وحدك.
           نرصد ما بقي بلا رد، وما أجاب عنه غيرك، وما يسأله عملاء منافسيك.</p>
        <button id="qaBtn" class="btn block sp-t">افحص أسئلة ملفي</button>
        <div id="qaMsg" class="msg"></div>
      </div>
      <div id="qaResult" class="hidden"></div>
    </div>`);
  $("qaBtn").onclick = run;
}

function msg(kind, text) {
  const el = $("qaMsg");
  const ic = kind === "error" ? "alert-triangle" : kind === "done" ? "check-circle" : "info";
  el.className = `msg show ${kind}`;
  el.innerHTML = `${icon(ic, 17)}<span>${esc(text)}</span>`;
}

const store = {};

function render(d) {
  const box = $("qaResult");
  const st = d.stats || {};
  const drafts = d.drafts || [];
  const draftOf = (qq) => drafts.find((x) => String(x.question || "").trim() === String(qq || "").trim());

  const mine = (d.mine || []).map((x, i) => {
    const dr = draftOf(x.question);
    if (dr) store[`d${i}`] = dr.answer;
    const state = x.answers === 0 ? "none" : "";
    const tag = x.answers === 0
      ? `<span class="qa-tag no">بلا رد</span>`
      : x.answered_by_owner
      ? `<span class="qa-tag ok">أجبتَ عنه</span>`
      : `<span class="qa-tag other">أجاب عنه غيرك</span>`;
    return `<div class="qa-item ${state}">
      <div class="qa-q">${icon("message-square", 16)}<span>${esc(x.question)}</span></div>
      ${tag}
      ${x.answer_text ? `<div class="qa-ans">${esc(x.answer_text)}</div>` : ""}
      ${dr ? `<div class="qa-draft">
        <div class="lbl"><span>رد مقترح</span>
          <button class="qa-copy" data-copy="d${i}">${icon("clipboard-check", 13)}نسخ</button></div>
        <div class="txt">${esc(dr.answer)}</div></div>` : ""}
    </div>`;
  }).join("");

  const extra = drafts.filter((x) => !(d.mine || []).some((m) =>
    String(m.question).trim() === String(x.question).trim()));
  const extraHtml = extra.map((x, i) => {
    store[`e${i}`] = x.answer;
    return `<div class="qa-item">
      <div class="qa-q">${icon("message-square", 16)}<span>${esc(x.question)}</span></div>
      <div class="qa-draft">
        <div class="lbl"><span>رد جاهز — انشره كسؤال وجواب في ملفك</span>
          <button class="qa-copy" data-copy="e${i}">${icon("clipboard-check", 13)}نسخ</button></div>
        <div class="txt">${esc(x.answer)}</div></div>
    </div>`;
  }).join("");

  const rivals = (d.rivals_qa || []).map((x) => `
    <div class="qa-rival">${icon("users", 15)}
      <div>${esc(x.question)}<small>على ملف ${esc(x.rival)}</small></div>
    </div>`).join("");

  const posts = (d.rival_posts || []).map((p) => `
    <div class="qa-rival">${icon("sparkles", 15)}
      <div>${esc(p.text)}<small>منشور من ${esc(p.rival)}</small></div>
    </div>`).join("");

  box.innerHTML = `
    <div class="card sp-t">
      <div class="qa-stats">
        <div class="qa-stat"><b>${st.total ?? 0}</b><small>سؤال على ملفك</small></div>
        <div class="qa-stat"><b style="color:var(--bad)">${st.unanswered ?? 0}</b><small>بلا رد</small></div>
        <div class="qa-stat"><b style="color:var(--warn)">${st.by_others ?? 0}</b><small>أجاب عنه غيرك</small></div>
      </div>
      ${(d.advice || []).map((a) => `<div class="ind-means">${esc(a)}</div>`).join("")}
    </div>

    ${mine ? `<div class="section-head"><h2>أسئلة ملفك</h2></div>${mine}` : ""}

    ${extraHtml ? `<div class="section-head"><h2>أسئلة متوقعة ورودها</h2>
      <span class="note">من ملفات منافسيك</span></div>${extraHtml}` : ""}

    ${rivals ? `<div class="section-head"><h2>ما يسأله عملاء منافسيك</h2>
      <span class="note">يكشف ما يهم السوق</span></div><div class="card">${rivals}</div>` : ""}

    ${posts ? `<div class="section-head"><h2>آخر منشورات منافسك الأقوى</h2>
      <span class="note">نشاطه التسويقي</span></div><div class="card">${posts}</div>` : ""}

    <div class="disclaimer">قسم الأسئلة والأجوبة يظهر أسفل ملفك في قوقل ماب — افتحه من تطبيق قوقل ماب على جوالك وردّ من هناك.</div>`;

  box.querySelectorAll("[data-copy]").forEach((b) => b.onclick = async () => {
    try {
      await navigator.clipboard.writeText(store[b.dataset.copy] || "");
      b.classList.add("done");
      b.innerHTML = `${icon("check-circle", 13)}تم النسخ`;
      setTimeout(() => {
        b.classList.remove("done");
        b.innerHTML = `${icon("clipboard-check", 13)}نسخ`;
      }, 1800);
    } catch { /* */ }
  });

  box.className = "";
}

async function run() {
  const btn = $("qaBtn");
  const bizId = $("bizSelect")?.value;
  if (!bizId) return msg("error", "اختر محلك أولاً.");

  btn.disabled = true;
  const old = btn.textContent;
  btn.innerHTML = `<span class="spinner"></span>نقرأ أسئلة ملفك`;
  msg("info", "نجلب أسئلة ملفك وأسئلة منافسيك ونجهّز ردوداً — قد يستغرق دقيقة.");

  try {
    const { data, error } = await sb.functions.invoke("profile-qa", { body: { business_id: bizId } });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "تعذّر الفحص");
    render(data);
    $("qaMsg").className = "msg";
  } catch (e) {
    msg("error", String(e?.message || e).slice(0, 160));
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

async function loadLast() {
  const bizId = $("bizSelect")?.value;
  if (!bizId || !$("qaResult")) return;
  try {
    const { data } = await sb.from("profile_qa").select("*")
      .eq("business_id", bizId).order("created_at", { ascending: false }).limit(1);
    if (data?.[0]) render({ ...data[0], drafts: [] });
  } catch { /* */ }
}

function start() {
  mount();
  loadLast();
  $("bizSelect")?.addEventListener("change", () => {
    if ($("qaResult")) $("qaResult").className = "hidden";
    setTimeout(loadLast, 400);
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 1200));
else setTimeout(start, 1200);
