/* =========================================================
   فلك ٣٦٠ — لوحة الإدارة: الموردون + المحتوى
   يُحمَّل من admin.html عند فتح أحد القسمين
   ========================================================= */

let F = null;
const $ = (id) => document.getElementById(id);
const E = (s) => F.esc(s);

const STYLE = `
.sx-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:var(--sp-3);margin-bottom:var(--sp-4)}
.sx-kpi{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;cursor:pointer;text-align:start;font:inherit;color:inherit}
.sx-kpi:hover{border-color:var(--line-2)}
.sx-kpi.on{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand) inset}
.sx-kpi b{display:block;font-family:var(--font-num);font-size:22px;font-weight:600;line-height:1.15}
.sx-kpi span{font-size:12.5px;color:var(--ink-3)}
.sx-kpi.warn b{color:var(--warn)} .sx-kpi.bad b{color:var(--bad)}
.sx-tools{display:flex;gap:8px;margin-bottom:var(--sp-3)}
.sx-tools .input{flex:1}
.sx-row{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);margin-bottom:8px;overflow:hidden}
.sx-head{display:flex;gap:12px;align-items:center;padding:12px 14px;cursor:pointer}
.sx-head:hover{background:var(--surface-2)}
.sx-logo{width:40px;height:40px;border-radius:10px;background:var(--brand-tint);color:var(--brand);flex:0 0 auto;display:flex;
  align-items:center;justify-content:center;font-family:var(--font-display);font-weight:600;overflow:hidden}
.sx-logo img{width:100%;height:100%;object-fit:cover}
.sx-t{flex:1;min-width:0}
.sx-t b{display:block;font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sx-t span{display:block;font-size:12.5px;color:var(--ink-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sx-badges{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;flex:0 0 auto;max-width:45%}
.sx-body{border-top:1px solid var(--line);padding:14px;background:var(--surface-2)}
.sx-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px;margin-bottom:12px}
.sx-kv div{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-sm);padding:8px 10px}
.sx-kv span{display:block;font-size:11.5px;color:var(--ink-3)}
.sx-kv b{display:block;font-size:13.5px;font-weight:600;margin-top:2px;word-break:break-word}
.sx-bio{font-size:13.5px;line-height:1.8;color:var(--ink-2);margin-bottom:12px;white-space:pre-line}
.sx-acts{display:flex;gap:6px;flex-wrap:wrap}
.sx-acts a.btn{text-decoration:none}
.sx-sec{margin-top:var(--sp-5)}
.sx-cities{display:flex;flex-wrap:wrap;gap:6px}
.sx-city{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:var(--r-full);border:1px solid var(--line-2);
  background:var(--surface);font:inherit;font-size:13px;cursor:pointer;color:var(--ink-2)}
.sx-city.on{background:var(--brand);border-color:var(--brand);color:#fff}
.sx-city.done{background:var(--ok-tint);border-color:#CFE6DC;color:var(--ok);cursor:default}
.sx-city small{font-family:var(--font-num);font-size:11.5px;opacity:.8}
.sx-job{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
.sx-job:last-child{border-bottom:0}
.sx-rep{padding:12px 0;border-bottom:1px solid var(--line)}
.sx-rep:last-child{border-bottom:0}

.cx-group{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);margin-bottom:10px;overflow:hidden}
.cx-gh{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer;font-weight:600}
.cx-gh:hover{background:var(--surface-2)}
.cx-gh small{font-weight:400;color:var(--ink-3);font-size:12.5px}
.cx-items{border-top:1px solid var(--line)}
.cx-item{padding:12px 14px;border-bottom:1px solid var(--line)}
.cx-item:last-child{border-bottom:0}
.cx-lbl{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:13px;color:var(--ink-2);margin-bottom:6px}
.cx-lbl code{font-family:var(--font-num);font-size:11px;color:var(--ink-3);direction:ltr}
.cx-row{display:flex;gap:6px;align-items:flex-start}
.cx-row .input{flex:1}
.cx-row textarea.input{height:auto;min-height:70px;padding-top:9px;padding-bottom:9px;line-height:1.7;resize:vertical}
.cx-def{font-size:12px;color:var(--ink-3);margin-top:5px}
.cx-switch{display:flex;align-items:center;gap:10px;font-size:14px}
.cx-switch input{width:40px;height:22px;accent-color:var(--brand)}

.cx-tabs{display:flex;gap:6px;margin-bottom:var(--sp-4);flex-wrap:wrap}
.cx-tab{height:36px;padding:0 16px;border-radius:var(--r-full);border:1px solid var(--line-2);background:var(--surface);
  font:inherit;font-size:13.5px;color:var(--ink-2);cursor:pointer}
.cx-tab.on{background:var(--brand);border-color:var(--brand);color:#fff}

.pz-mode{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:var(--r);margin-bottom:var(--sp-4);
  background:var(--warn-tint);color:var(--warn);font-size:13.5px;line-height:1.7}
.pz-mode.off{background:var(--ok-tint);color:var(--ok)}
.pz-mode svg{width:17px;height:17px;flex:0 0 auto;margin-top:3px}
.pz-mode .btn{flex:0 0 auto;margin-inline-start:auto}
.pz-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);margin-bottom:10px;overflow:hidden}
.pz-card.feat{border-color:var(--brand)}
.pz-head{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer}
.pz-head b{font-size:14.5px}
.pz-head .pr{margin-inline-start:auto;font-family:var(--font-num);font-weight:600;font-size:15px;white-space:nowrap}
.pz-body{border-top:1px solid var(--line);padding:14px;background:var(--surface-2)}
.pz-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:620px){.pz-2{grid-template-columns:1fr}}
.pz-lims{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:10px}
.pz-lims label{display:block;font-size:12px;color:var(--ink-3);margin-bottom:3px}
.pz-lims .input{height:36px;font-size:13px}
.pz-bul{width:100%;min-height:120px;padding:10px 12px;font:inherit;font-size:13.5px;line-height:1.9;
  border:1px solid var(--line-2);border-radius:var(--r);background:var(--surface);resize:vertical}
.pz-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}
.pz-acts label{display:flex;align-items:center;gap:6px;font-size:13px}
.pz-acts input[type=checkbox]{width:17px;height:17px;accent-color:var(--brand)}
`;

function ensureCss() {
  if ($("sxCss")) return;
  const s = document.createElement("style");
  s.id = "sxCss"; s.textContent = STYLE;
  document.head.appendChild(s);
}
const typing = (root) => {
  const a = document.activeElement;
  return a && root.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
};

/* =========================================================
   الموردون
   ========================================================= */
const VS = {
  verified: ["ok", "موثّق"], pending: ["warn", "بانتظار التوثيق"],
  rejected: ["bad", "مرفوض"], none: ["mute", "بلا سجل"],
};
const ST = { hidden: ["mute", "مخفي"], suspended: ["bad", "موقوف"] };
const FILTERS = [
  ["", "الكل"], ["pending", "بانتظار التوثيق"], ["registered", "المسجّلون"], ["visible", "الظاهرون للعملاء"],
  ["maps", "بطاقات قوقل ماب"], ["hidden", "المخفية والموقوفة"], ["reported", "عليها بلاغات"],
];
let sx = { root: null, data: null, filter: "pending", search: "", open: new Set(), pickCities: new Set(), timer: null };

export async function openSuppliers(el) {
  F = window.falakAdmin; ensureCss();
  sx.root = el;
  F.onTick = () => loadSuppliers(true);
  if (!sx.data) el.innerHTML = F.loadingBox();
  await loadSuppliers(false);
}

async function loadSuppliers(silent) {
  if (!sx.root?.isConnected) return;
  if (silent && typing(sx.root)) return;
  try {
    const d = await F.rpc("admin_suppliers", { p_filter: sx.filter || null, p_search: sx.search || null });
    // أول فتح بلا طلبات معلّقة: اعرض الكل
    if (!sx.data && sx.filter === "pending" && !d.counts.pending) {
      sx.filter = "";
      sx.data = await F.rpc("admin_suppliers", { p_filter: null, p_search: sx.search || null });
    } else sx.data = d;
    const badge = document.getElementById("nSup");
    if (badge) badge.textContent = (sx.data.counts.pending + sx.data.counts.reports) || "";
    renderSuppliers();
    F.stamp();
  } catch (e) {
    if (!silent) { sx.root.innerHTML = ""; F.topMsg("error", e.message); }
  }
}

function supBadges(r) {
  const b = [];
  if (r.source === "maps") b.push(`<span class="badge mute">قوقل ماب</span>`);
  else {
    const v = VS[r.verification_status] || VS.none;
    b.push(`<span class="badge ${v[0]}">${v[1]}</span>`);
    b.push(r.active_plan
      ? `<span class="badge ${r.active_plan === "supplier_featured" ? "info" : "ok"}">${r.active_plan === "supplier_featured" ? "مميز" : "أساسي"}</span>`
      : r.pending_sub ? `<span class="badge warn">بانتظار السداد</span>` : `<span class="badge mute">بلا اشتراك</span>`);
    if (r.visible) b.push(`<span class="badge ok">ظاهر</span>`);
  }
  if (ST[r.status]) b.push(`<span class="badge ${ST[r.status][0]}">${ST[r.status][1]}</span>`);
  if (r.open_reports) b.push(`<span class="badge bad">${r.open_reports} بلاغ</span>`);
  return b.join("");
}

function supBody(r) {
  const kv = [];
  const add = (k, v) => { if (v != null && v !== "") kv.push(`<div><span>${k}</span><b>${v}</b></div>`); };
  if (r.source === "registered") {
    add("حساب الدخول", E(r.account_email));
    add("رقم السجل", `<span class="num" style="direction:ltr">${E(r.cr_number || "—")}</span>`);
    add("انتهاء السجل", r.cr_expiry ? F.fmtD(r.cr_expiry) : "—");
    add("الاشتراك", r.active_plan ? `حتى ${F.fmtD(r.active_ends_at)}` : r.pending_sub ? "بانتظار السداد" : "لا يوجد");
    add("المنتجات", F.nf(r.products));
    add("المشاهدات · التواصل (٣٠ يوماً)", `${F.nf(r.views_30d)} · ${F.nf(r.clicks_30d)}`);
  } else {
    add("تصنيف قوقل", E(r.category));
    add("التقييم", r.rating != null ? `${r.rating} (${F.nf(r.reviews)})` : "—");
  }
  add("الجوال", r.phone ? `<span class="num" style="direction:ltr">${E(F.localPhone(r.phone))}</span>` : "");
  add("المدينة", E(r.city));
  add("التغطية", r.covers_all_ksa ? "كل المملكة" : E((r.coverage_cities || []).join("، ")));
  add("الحد الأدنى للطلب", E(r.min_order));
  add("أُضيف", F.fmtD(r.created_at));

  const acts = [];
  if (r.source === "registered") {
    if (r.cr_file_path) acts.push(`<button class="btn ghost sm" data-cr="${E(r.cr_file_path)}">عرض السجل التجاري</button>`);
    if (r.verification_status !== "verified") acts.push(`<button class="btn sm" data-verify="${E(r.id)}">توثيق</button>`);
    if (r.verification_status !== "rejected") acts.push(`<button class="btn ghost sm" data-reject="${E(r.id)}">رفض السجل</button>`);
    const wa = r.whatsapp || r.phone ? F.waLink(r.whatsapp || r.phone, `مرحباً ${r.name}، معك فريق فلك ٣٦٠ بخصوص حسابكم كمورّد.`) : null;
    if (wa) acts.push(`<a class="btn ghost sm" href="${E(wa)}" target="_blank" rel="noopener">واتساب</a>`);
  }
  if (r.maps_url) acts.push(`<a class="btn ghost sm" href="${E(F.safeUrl ? F.safeUrl(r.maps_url) : r.maps_url)}" target="_blank" rel="noopener">قوقل ماب</a>`);
  if (r.website) acts.push(`<a class="btn ghost sm" href="${E(F.safeUrl ? F.safeUrl(r.website) : r.website)}" target="_blank" rel="noopener">الموقع</a>`);
  if (r.status === "active") {
    acts.push(`<button class="btn ghost sm" data-status="${E(r.id)}|hidden">إخفاء عن العملاء</button>`);
    if (r.source === "registered") acts.push(`<button class="btn ghost sm" data-status="${E(r.id)}|suspended">إيقاف الحساب</button>`);
  } else acts.push(`<button class="btn ghost sm" data-status="${E(r.id)}|active">إعادة للظهور</button>`);

  return `<div class="sx-body">
    ${r.verification_note && r.verification_status === "rejected" ? `<div class="msg show error" style="margin:0 0 10px">${F.icon("alert-triangle", 17)}<span>سبب الرفض: ${E(r.verification_note)}</span></div>` : ""}
    ${r.bio ? `<div class="sx-bio">${E(r.bio)}</div>` : ""}
    <div class="sx-kv">${kv.join("")}</div>
    <div class="sx-acts">${acts.join("")}</div>
  </div>`;
}

function renderSuppliers() {
  const d = sx.data, c = d.counts;
  const kpi = (f, n, label, cls = "") =>
    `<button type="button" class="sx-kpi ${cls} ${sx.filter === f ? "on" : ""}" data-f="${f}"><b>${F.nf(n)}</b><span>${label}</span></button>`;
  const rows = d.rows || [];

  sx.root.innerHTML = `
    <div class="sx-kpis">
      ${kpi("pending", c.pending, "بانتظار التوثيق", c.pending ? "warn" : "")}
      ${kpi("registered", c.registered, "موردون مسجّلون")}
      ${kpi("visible", c.visible, "ظاهرون للعملاء")}
      ${kpi("maps", c.maps, "بطاقات قوقل ماب")}
      ${kpi("hidden", c.hidden, "مخفية وموقوفة")}
      ${kpi("reported", c.reports, "بلاغات مفتوحة", c.reports ? "bad" : "")}
    </div>
    <div class="sx-tools">
      <input id="sxSearch" class="input" type="search" placeholder="ابحث بالاسم أو المدينة أو الجوال أو رقم السجل أو الإيميل" value="${E(sx.search)}">
    </div>
    <div class="adm-filter">${FILTERS.map(([f, l]) => `<span class="chip ${sx.filter === f ? "on" : ""}" data-f="${f}">${l}</span>`).join("")}</div>

    ${rows.length ? rows.map((r) => `
      <div class="sx-row">
        <div class="sx-head" data-open="${E(r.id)}">
          <div class="sx-logo">${r.logo_url ? `<img src="${E(r.logo_url)}" alt="">` : E(String(r.name || "م").charAt(0))}</div>
          <div class="sx-t"><b>${E(r.name)}</b>
            <span>${E(r.city || "—")}${(r.sector_names || []).length ? ` · ${E(r.sector_names.slice(0, 3).join("، "))}` : ""}${r.source === "registered" && r.account_email ? ` · ${E(r.account_email)}` : ""}</span></div>
          <div class="sx-badges">${supBadges(r)}</div>
        </div>
        ${sx.open.has(r.id) ? supBody(r) : ""}
      </div>`).join("")
      : F.empty("building", "لا نتائج", "لا يوجد موردون في هذا الفلتر.")}
    ${rows.length >= 300 ? `<div class="hint">يظهر أول ٣٠٠ — استخدم البحث للوصول لمورد محدد.</div>` : ""}

    ${(d.reports || []).length ? `<div class="sx-sec">
      <div class="section-head"><h2>البلاغات المفتوحة</h2></div>
      <div class="card">${d.reports.map((p) => `
        <div class="sx-rep">
          <div><b>${E(p.supplier)}</b> — ${E(p.reason)}</div>
          ${p.details ? `<div class="hint" style="margin:4px 0 0">${E(p.details)}</div>` : ""}
          <div class="hint" style="margin:4px 0 8px">${E(p.reporter || "عميل")} · ${F.fmtDT(p.created_at)}</div>
          <div class="sx-acts">
            <button class="btn ghost sm" data-goto="${E(p.supplier_id)}">افتح المورد</button>
            <button class="btn ghost sm" data-rep="${E(p.id)}|resolved">عولج — أغلق البلاغ</button>
            <button class="btn ghost sm" data-rep="${E(p.id)}|dismissed">تجاهل</button>
          </div>
        </div>`).join("")}</div></div>` : ""}

    <div class="sx-sec">
      <div class="section-head"><h2>سحب موردين من قوقل ماب</h2><span class="note">لكل القطاعات · تكلفة المدينة نحو ٥ سنتات</span></div>
      <div class="card">
        <div class="sx-cities">${(d.cities || []).map((ct) => ct.seeded
          ? `<span class="sx-city done">${E(ct.name)} <small>${F.nf(ct.maps)}</small></span>`
          : `<button type="button" class="sx-city ${sx.pickCities.has(ct.name) ? "on" : ""}" data-city="${E(ct.name)}">${E(ct.name)}</button>`).join("")}</div>
        <div class="hint">المدن الخضراء مسحوبة (بعدد بطاقاتها). اختر مدناً جديدة ثم اضغط «اسحب».</div>
        <button class="btn sp-t" id="sxSeed" ${sx.pickCities.size ? "" : "disabled"}>اسحب موردين لـ ${F.nf(sx.pickCities.size)} مدينة</button>
        ${(d.jobs || []).length ? `<div class="sp-t">${d.jobs.map((j) => `
          <div class="sx-job"><span>${E(j.city)} · ${F.fmtDT(j.created_at)}</span>
            <span>${j.status === "done" ? `<span class="badge ok">${F.nf(j.result?.suppliers)} مورد</span>`
              : j.status === "failed" ? `<span class="badge bad">فشل</span>` : `<span class="badge warn">جارٍ</span>`}</span></div>`).join("")}</div>` : ""}
      </div>
    </div>`;

  wireSuppliers();
}

function wireSuppliers() {
  const root = sx.root;
  root.querySelectorAll("[data-f]").forEach((b) => b.onclick = () => { sx.filter = b.dataset.f; loadSuppliers(false); });
  const s = $("sxSearch");
  s.oninput = () => {
    clearTimeout(sx.timer);
    sx.timer = setTimeout(() => { sx.search = s.value.trim(); loadSuppliers(false).then(() => { const n = $("sxSearch"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); }, 350);
  };
  root.querySelectorAll("[data-open]").forEach((h) => h.onclick = () => {
    const id = h.dataset.open; sx.open.has(id) ? sx.open.delete(id) : sx.open.add(id); renderSuppliers();
  });
  root.querySelectorAll("[data-goto]").forEach((b) => b.onclick = () => {
    sx.open.add(b.dataset.goto); sx.filter = "reported"; loadSuppliers(false);
  });
  root.querySelectorAll("[data-cr]").forEach((b) => b.onclick = async () => {
    F.busy(b, true);
    const { data, error } = await F.sb.storage.from("supplier-docs").createSignedUrl(b.dataset.cr, 300);
    F.busy(b, false);
    if (error) return F.topMsg("error", "تعذّر فتح السجل: " + error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  });
  root.querySelectorAll("[data-verify]").forEach((b) => b.onclick = async () => {
    if (!confirm("توثيق هذا المورد؟ تأكد أن السجل ساري ويطابق اسم المنشأة.")) return;
    await act(b, "admin_supplier_review", { p_id: b.dataset.verify, p_decision: "verify", p_note: null });
  });
  root.querySelectorAll("[data-reject]").forEach((b) => b.onclick = async () => {
    const note = prompt("سبب الرفض (يظهر للمورد):", "الصورة غير واضحة — ارفع نسخة واضحة من السجل");
    if (note == null) return;
    await act(b, "admin_supplier_review", { p_id: b.dataset.reject, p_decision: "reject", p_note: note });
  });
  root.querySelectorAll("[data-status]").forEach((b) => b.onclick = async () => {
    const [id, st] = b.dataset.status.split("|");
    const q = { hidden: "إخفاء المورد عن العملاء؟", suspended: "إيقاف حساب المورد؟ لن يظهر لأي عميل.", active: "إعادة المورد للظهور؟" }[st];
    if (!confirm(q)) return;
    await act(b, "admin_supplier_status", { p_id: id, p_status: st });
  });
  root.querySelectorAll("[data-rep]").forEach((b) => b.onclick = async () => {
    const [id, st] = b.dataset.rep.split("|");
    await act(b, "admin_supplier_report", { p_id: id, p_status: st });
  });
  root.querySelectorAll("[data-city]").forEach((b) => b.onclick = () => {
    const c = b.dataset.city; sx.pickCities.has(c) ? sx.pickCities.delete(c) : sx.pickCities.add(c); renderSuppliers();
  });
  const seed = $("sxSeed");
  if (seed) seed.onclick = async () => {
    const list = [...sx.pickCities];
    if (!confirm(`سحب موردين لـ ${list.join("، ")}؟ التكلفة نحو ${(list.length * 0.06).toFixed(2)} دولار.`)) return;
    F.busy(seed, true, "جارٍ البدء");
    try {
      const r = await F.rpc("admin_seed_suppliers", { p_cities: list });
      F.topMsg("done", r.message);
      sx.pickCities.clear();
      await loadSuppliers(false);
      setTimeout(() => loadSuppliers(true), 45000);
      setTimeout(() => loadSuppliers(true), 90000);
    } catch (e) { F.topMsg("error", e.message); F.busy(seed, false); }
  };
}

async function act(btn, fn, args) {
  F.busy(btn, true);
  try {
    const r = await F.rpc(fn, args);
    F.topMsg(r.ok ? "done" : "error", r.message);
    F.invalidate();
    await loadSuppliers(false);
  } catch (e) { F.topMsg("error", e.message); if (btn.isConnected) F.busy(btn, false); }
}

/* =========================================================
   المحتوى
   ========================================================= */
let cx = { root: null, list: null, openGroups: new Set(["التنقل"]), q: "", tab: "app", pricing: null, open: new Set() };
const LANDING = "الصفحة التعريفية";

export async function openContent(el) {
  F = window.falakAdmin; ensureCss();
  cx.root = el;
  F.onTick = null;
  if (!cx.list) el.innerHTML = F.loadingBox();
  try {
    cx.list = await F.rpc("admin_content_list");
    if (cx.tab === "pricing") cx.pricing = await F.rpc("admin_pricing");
    renderTab();
    F.stamp();
  } catch (e) { el.innerHTML = ""; F.topMsg("error", e.message); }
}

function tabsHtml() {
  const t = [["app", "نصوص التطبيق"], ["landing", "الصفحة التعريفية"], ["pricing", "الأسعار والباقات"]];
  return `<div class="cx-tabs">${t.map(([k, l]) =>
    `<button type="button" class="cx-tab ${cx.tab === k ? "on" : ""}" data-ct="${k}">${l}</button>`).join("")}</div>`;
}

function renderTab() {
  if (cx.tab === "pricing") renderPricing();
  else renderContent();
  cx.root.querySelectorAll("[data-ct]").forEach((b) => b.onclick = async () => {
    cx.tab = b.dataset.ct;
    cx.q = "";
    if (cx.tab === "pricing" && !cx.pricing) {
      cx.root.innerHTML = tabsHtml() + F.loadingBox();
      cx.root.querySelectorAll("[data-ct]").forEach((x) => x.onclick = null);
      try { cx.pricing = await F.rpc("admin_pricing"); } catch (e) { return F.topMsg("error", e.message); }
    }
    renderTab();
  });
}

function itemHtml(it) {
  const k = E(it.key);
  let ctrl;
  if (it.kind === "toggle") {
    ctrl = `<label class="cx-switch"><input type="checkbox" data-toggle="${k}" ${it.value === "on" ? "checked" : ""}>
      <span>${it.value === "on" ? "ظاهر للعملاء" : "مخفي"}</span></label>`;
  } else {
    const input = it.kind === "longtext"
      ? `<textarea class="input" data-in="${k}" maxlength="2000">${E(it.value)}</textarea>`
      : `<input class="input" data-in="${k}" maxlength="300" value="${E(it.value)}">`;
    ctrl = `<div class="cx-row">${input}
      <button class="btn sm" data-save="${k}">حفظ</button>
      ${it.custom ? `<button class="btn ghost sm" data-reset="${k}">الأصلي</button>` : ""}</div>
      ${it.custom ? `<div class="cx-def">الأصلي: ${E(it.default)}</div>` : ""}`;
  }
  return `<div class="cx-item">
    <div class="cx-lbl"><span>${E(it.label)} ${it.custom ? `<span class="badge info">معدّل</span>` : ""}</span><code>${k}</code></div>
    ${ctrl}
  </div>`;
}

function renderContent() {
  const q = cx.q.toLowerCase();
  const scope = (cx.list || []).filter((it) => cx.tab === "landing" ? it.screen === LANDING : it.screen !== LANDING);
  const list = scope.filter((it) => !q || [it.label, it.value, it.key, it.screen].some((x) => String(x).toLowerCase().includes(q)));
  const groups = [];
  list.forEach((it) => {
    let g = groups.find((x) => x.name === it.screen);
    if (!g) groups.push(g = { name: it.screen, items: [] });
    g.items.push(it);
  });
  const edited = scope.filter((x) => x.custom).length;

  cx.root.innerHTML = tabsHtml() + `
    <div class="card" style="margin-bottom:var(--sp-4)">
      <div style="font-size:14px;line-height:1.8">${cx.tab === "landing"
        ? "عدّل نصوص الصفحة التعريفية، وتظهر للزوار فوراً. الأسعار تُدار من تبويب «الأسعار والباقات»."
        : "عدّل أي نص في التطبيق، ويظهر لكل العملاء فوراً بدون تحديث الملفات."}
        زر «الأصلي» يرجع النص كما كان. ومفاتيح «إظهار» تخفي القسم مؤقتاً بدون حذفه.</div>
      <div class="hint">${F.nf(scope.length)} نصاً · المعدّل منها ${F.nf(edited)}</div>
    </div>
    <div class="sx-tools"><input id="cxSearch" class="input" type="search" placeholder="ابحث في النصوص" value="${E(cx.q)}"></div>
    ${groups.map((g) => {
      const open = q || cx.openGroups.has(g.name);
      const n = g.items.filter((x) => x.custom).length;
      return `<div class="cx-group">
        <div class="cx-gh" data-g="${E(g.name)}"><span>${E(g.name)}</span>
          <small>${F.nf(g.items.length)} نصاً${n ? ` · ${F.nf(n)} معدّل` : ""} ${open ? "▴" : "▾"}</small></div>
        ${open ? `<div class="cx-items">${g.items.map(itemHtml).join("")}</div>` : ""}
      </div>`;
    }).join("") || F.empty("search", "لا نتائج", "جرّب كلمة أخرى.")}`;
  wireContent();
}

/* ---------- الأسعار والباقات ---------- */
const LIMS = [["keywords", "كلمات لكل محل"], ["businesses", "عدد المحلات"], ["scans", "فحص شهرياً"],
  ["audits", "تدقيق شهرياً"], ["reviews", "تحليل مراجعات"], ["competitors", "تحليل منافسين"],
  ["plans", "خطط النمو"], ["monitors", "مراقبة المنافسين"]];

function renderPricing() {
  const d = cx.pricing;
  const sar = (n) => `${F.nf(n)} ر.س`;

  cx.root.innerHTML = tabsHtml() + `
    <div class="pz-mode ${d.test_mode ? "" : "off"}">
      ${F.icon(d.test_mode ? "alert-triangle" : "check-circle", 17)}
      <div>${d.test_mode
        ? "<b>وضع التجربة شغال</b> — كل الأسعار تظهر للعملاء بريال واحد. الأسعار الحقيقية أدناه محفوظة وتُطبَّق فور الإيقاف."
        : "<b>الأسعار الحقيقية مفعّلة</b> — ما تعدّله هنا يظهر للعملاء مباشرة."}</div>
      <button class="btn ${d.test_mode ? "" : "ghost"} sm" id="pzMode">${d.test_mode ? "أوقف وضع التجربة" : "شغّل وضع التجربة"}</button>
    </div>

    <div class="section-head" style="margin-top:0"><h2>باقات الاشتراك</h2><span class="note">تظهر في الصفحة التعريفية وداخل المنصة</span></div>
    ${(d.plans || []).map((p) => {
      const open = cx.open.has("p:" + p.code);
      return `<div class="pz-card ${p.featured ? "feat" : ""}">
        <div class="pz-head" data-open="p:${F.esc(p.code)}">
          <b>${F.esc(p.name)}</b>
          ${p.public ? `<span class="badge ok">في الصفحة</span>` : `<span class="badge mute">مخفية</span>`}
          ${p.featured ? `<span class="badge info">مميزة</span>` : ""}
          <span class="pr">${p.price ? sar(p.price) : "مجانية"}${d.test_mode && p.price ? ` <small style="color:var(--warn)">· الآن ${sar(p.live_price)}</small>` : ""}</span>
        </div>
        ${open ? `<div class="pz-body">
          <div class="pz-2">
            <div class="field" style="margin:0"><label>اسم الباقة</label>
              <input class="input" data-pf="${F.esc(p.code)}|name" value="${F.esc(p.name)}"></div>
            <div class="field" style="margin:0"><label>السعر الحقيقي (ر.س شهرياً)</label>
              <input class="input" type="number" min="0" data-pf="${F.esc(p.code)}|price" value="${p.price ?? 0}"></div>
          </div>
          <div class="field sp-t" style="margin:0"><label>لمن تناسب (يظهر في الصفحة التعريفية)</label>
            <input class="input" data-pf="${F.esc(p.code)}|tagline" value="${F.esc(p.tagline || "")}"></div>
          <div class="field sp-t" style="margin:0"><label>المزايا — ميزة في كل سطر</label>
            <textarea class="pz-bul" data-pf="${F.esc(p.code)}|bullets">${F.esc((p.bullets || []).join("\n"))}</textarea></div>
          <div class="pz-lims">${LIMS.map(([k, l]) =>
            `<div><label>${l}</label><input class="input" type="number" min="0" data-pf="${F.esc(p.code)}|${k}" value="${p.limits?.[k] ?? 0}"></div>`).join("")}</div>
          <div class="pz-acts">
            <label><input type="checkbox" data-pf="${F.esc(p.code)}|public" ${p.public ? "checked" : ""}> تظهر في الصفحة التعريفية</label>
            <label><input type="checkbox" data-pf="${F.esc(p.code)}|featured" ${p.featured ? "checked" : ""}> باقة مميزة</label>
            <button class="btn sm" data-psave="${F.esc(p.code)}" style="margin-inline-start:auto">احفظ</button>
          </div>
        </div>` : ""}
      </div>`;
    }).join("")}

    <div class="section-head"><h2>التقارير المنفصلة</h2><span class="note">تُشترى مرة واحدة</span></div>
    ${(d.reports || []).map((r) => `
      <div class="pz-card"><div class="pz-body" style="border-top:0">
        <div class="pz-2">
          <div class="field" style="margin:0"><label>${r.kind === "location" ? "تقرير موقع مشروع" : "تقرير محل معروض للبيع"} — الوصف</label>
            <input class="input" data-rf="${F.esc(r.code)}|label" value="${F.esc(r.label)}"></div>
          <div class="field" style="margin:0"><label>السعر الحقيقي (ر.س)</label>
            <input class="input" type="number" min="1" data-rf="${F.esc(r.code)}|price" value="${r.price}"></div>
        </div>
        <div class="field sp-t" style="margin:0"><label>شرح التقرير في الصفحة التعريفية</label>
          <textarea class="pz-bul" style="min-height:70px" data-rf="${F.esc(r.code)}|tagline">${F.esc(r.tagline || "")}</textarea></div>
        <div class="pz-acts">
          <span class="hint" style="margin:0">${d.test_mode ? `يظهر الآن بـ ${sar(r.live_price)}` : ""}</span>
          <button class="btn sm" data-rsave="${F.esc(r.code)}" style="margin-inline-start:auto">احفظ</button>
        </div>
      </div></div>`).join("")}

    <div class="section-head"><h2>باقات الموردين</h2><span class="note">اشتراك شهري للمورّدين</span></div>
    ${(d.supplier_plans || []).map((s) => `
      <div class="pz-card"><div class="pz-body" style="border-top:0">
        <div class="pz-2">
          <div class="field" style="margin:0"><label>الاسم</label>
            <input class="input" data-sf="${F.esc(s.code)}|name" value="${F.esc(s.name)}"></div>
          <div class="field" style="margin:0"><label>السعر الحقيقي (ر.س شهرياً)</label>
            <input class="input" type="number" min="1" data-sf="${F.esc(s.code)}|price" value="${s.price}"></div>
        </div>
        <div class="pz-acts">
          <span class="hint" style="margin:0">${s.max_sectors} نشاط · ${s.max_products} منتجاً${d.test_mode ? ` · يظهر الآن بـ ${sar(s.live_price)}` : ""}</span>
          <button class="btn sm" data-ssave="${F.esc(s.code)}" style="margin-inline-start:auto">احفظ</button>
        </div>
      </div></div>`).join("")}`;

  wirePricing();
}

function field(sel, key) {
  const el = cx.root.querySelector(`[data-${sel}="${CSS.escape(key)}"]`);
  if (!el) return null;
  return el.type === "checkbox" ? el.checked : el.value;
}

async function reloadPricing(btn) {
  try {
    cx.pricing = await F.rpc("admin_pricing");
    const y = window.scrollY;
    renderPricing();
    window.scrollTo(0, y);
  } catch (e) { F.topMsg("error", e.message); if (btn?.isConnected) F.busy(btn, false); }
}

function wirePricing() {
  const root = cx.root;
  root.querySelectorAll("[data-open]").forEach((h) => h.onclick = () => {
    const k = h.dataset.open;
    cx.open.has(k) ? cx.open.delete(k) : cx.open.add(k);
    renderPricing();
  });

  root.querySelectorAll("[data-psave]").forEach((b) => b.onclick = async () => {
    const code = b.dataset.psave;
    const g = (f) => field("pf", `${code}|${f}`);
    const payload = {
      code, name: g("name"), price: g("price"), tagline: g("tagline"),
      bullets: String(g("bullets") || "").split("\n").map((x) => x.trim()).filter(Boolean),
      public: g("public"), featured: g("featured"),
    };
    LIMS.forEach(([k]) => payload[k] = g(k));
    F.busy(b, true);
    try {
      const r = await F.rpc("admin_save_plan", { p: payload });
      F.topMsg(r.ok ? "done" : "error", r.message);
      F.invalidate();
      if (r.ok) await reloadPricing(b); else F.busy(b, false);
    } catch (e) { F.topMsg("error", e.message); F.busy(b, false); }
  });

  root.querySelectorAll("[data-rsave]").forEach((b) => b.onclick = async () => {
    const code = b.dataset.rsave;
    F.busy(b, true);
    try {
      const r = await F.rpc("admin_save_report_price", {
        p_code: code, p_price: Number(field("rf", `${code}|price`)),
        p_label: field("rf", `${code}|label`), p_tagline: field("rf", `${code}|tagline`),
      });
      F.topMsg(r.ok ? "done" : "error", r.message);
      if (r.ok) await reloadPricing(b); else F.busy(b, false);
    } catch (e) { F.topMsg("error", e.message); F.busy(b, false); }
  });

  root.querySelectorAll("[data-ssave]").forEach((b) => b.onclick = async () => {
    const code = b.dataset.ssave;
    F.busy(b, true);
    try {
      const r = await F.rpc("admin_save_supplier_plan", {
        p_code: code, p_price: Number(field("sf", `${code}|price`)), p_name: field("sf", `${code}|name`),
      });
      F.topMsg(r.ok ? "done" : "error", r.message);
      if (r.ok) await reloadPricing(b); else F.busy(b, false);
    } catch (e) { F.topMsg("error", e.message); F.busy(b, false); }
  });

  const mode = document.getElementById("pzMode");
  if (mode) mode.onclick = async () => {
    const on = !cx.pricing.test_mode;
    if (!confirm(on
      ? "تشغيل وضع التجربة؟ كل الأسعار ستظهر للعملاء بريال واحد."
      : "إيقاف وضع التجربة؟ ستظهر الأسعار الحقيقية للعملاء فوراً.")) return;
    F.busy(mode, true);
    try {
      const r = await F.rpc("admin_test_mode", { p_on: on });
      F.topMsg("done", r.message);
      F.invalidate();
      await reloadPricing(mode);
    } catch (e) { F.topMsg("error", e.message); F.busy(mode, false); }
  };
}

async function saveKey(key, value, btn) {
  if (btn) F.busy(btn, true);
  try {
    const r = await F.rpc("admin_content_save", { p_key: key, p_value: value });
    F.topMsg(r.ok ? "done" : "error", r.message);
    if (r.ok) {
      cx.list = await F.rpc("admin_content_list");
      const y = window.scrollY;
      renderTab();
      window.scrollTo(0, y);
    } else if (btn) F.busy(btn, false);
  } catch (e) { F.topMsg("error", e.message); if (btn?.isConnected) F.busy(btn, false); }
}

function wireContent() {
  const root = cx.root;
  const s = $("cxSearch");
  s.oninput = () => {
    cx.q = s.value.trim(); renderTab();
    const n = $("cxSearch"); n.focus(); n.setSelectionRange(n.value.length, n.value.length);
  };
  root.querySelectorAll("[data-g]").forEach((h) => h.onclick = () => {
    const g = h.dataset.g; cx.openGroups.has(g) ? cx.openGroups.delete(g) : cx.openGroups.add(g); renderTab();
  });
  root.querySelectorAll("[data-save]").forEach((b) => b.onclick = () => {
    const k = b.dataset.save;
    const el = root.querySelector(`[data-in="${CSS.escape(k)}"]`);
    const v = el.value.trim();
    if (!v) return F.topMsg("error", "النص فارغ — استخدم «الأصلي» للرجوع للنص الأصلي.");
    saveKey(k, v, b);
  });
  root.querySelectorAll("[data-reset]").forEach((b) => b.onclick = () => {
    if (confirm("إرجاع هذا النص للأصلي؟")) saveKey(b.dataset.reset, null, b);
  });
  root.querySelectorAll("[data-in]").forEach((el) => el.onkeydown = (e) => {
    if (e.key === "Enter" && el.tagName === "INPUT") root.querySelector(`[data-save="${CSS.escape(el.dataset.in)}"]`)?.click();
  });
  root.querySelectorAll("[data-toggle]").forEach((c) => c.onchange = () => {
    const k = c.dataset.toggle;
    const off = !c.checked;
    if (off && !confirm("إخفاء هذا التبويب عن كل العملاء؟")) { c.checked = true; return; }
    saveKey(k, c.checked ? "on" : "off", null);
  });
}
