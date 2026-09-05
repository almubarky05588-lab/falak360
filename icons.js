/* =========================================================
   فلك ٣٦٠ — مكتبة الأيقونات
   أيقونات SVG بخطوط موحّدة (سماكة 1.75) — لا رموز تعبيرية.
   الاستخدام:  icon("search")  →  نص SVG جاهز للإدراج
   ========================================================= */

const ICON_PATHS = {
  /* ---- التنقّل ---- */
  compass:      '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 5-5 2.1 2.1-5z"/>',
  "map-pin":    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  "message-square":'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  users:        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "clipboard-check":'<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  telescope:    '<path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/>',

  /* ---- الحالات ---- */
  "check-circle":'<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>',
  "x-circle":   '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  "alert-triangle":'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info:         '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  "loader":     '<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/>',

  /* ---- الأفعال ---- */
  search:       '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus:         '<path d="M12 5v14"/><path d="M5 12h14"/>',
  play:         '<path d="M6 4.5v15l13-7.5z"/>',
  "log-out":    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  "external-link":'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  crosshair:    '<circle cx="12" cy="12" r="9"/><path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/>',

  /* ---- المؤشرات ---- */
  "trending-up":'<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  "trending-down":'<path d="M22 17 13.5 8.5 8.5 13.5 2 7"/><path d="M16 17h6v-6"/>',
  "bar-chart":  '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>',
  "pie-chart":  '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  banknote:     '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  tag:          '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  clock:        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkles:     '<path d="m12 3-1.9 5.8L4.3 10.7l5.8 1.9L12 18.4l1.9-5.8 5.8-1.9-5.8-1.9z"/><path d="M19 3v4"/><path d="M21 5h-4"/>',
  layers:       '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m2.6 12.09 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9"/><path d="m2.6 16.09 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9"/>',
  target:       '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  route:        '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',

  /* ---- مولّدات الحركة في المحيط ---- */
  "graduation-cap":'<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  mosque:       '<path d="M12 2c1.8 1.6 3 3 3 4.5S13.8 9 12 10c-1.8-1-3-2-3-3.5S10.2 3.6 12 2"/><path d="M4 22V12a8 8 0 0 1 16 0v10"/><path d="M4 22h16"/><path d="M9 22v-4a3 3 0 0 1 6 0v4"/>',
  "heart-pulse":'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  landmark:     '<path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M6 18v-7"/><path d="m12 2 9 5H3z"/><path d="M3 22h18"/><path d="M3 18h18"/>',
  building:     '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/>',
  "shopping-bag":'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  fuel:         '<path d="M3 22h12"/><path d="M4 9h10"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
  "shopping-cart":'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  dumbbell:     '<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',
  briefcase:    '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  stethoscope:  '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 4v5a6 6 0 0 0 12 0V4"/><path d="M8 15v1a6 6 0 0 0 12 0v-4"/><circle cx="20" cy="10" r="2"/>',
  scissors:     '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 20 20"/><path d="M14.8 14.8 20 4"/><circle cx="6" cy="18" r="3"/><path d="M8.12 15.88 12 12"/>',

  /* ---- متنوّع ---- */
  star:         '<path d="M11.5 2.5 14.2 8l6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.5 2.9 1-6.1L2.6 8.9 8.7 8z"/>',
  globe:        '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
  phone:        '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2"/>',
  image:        '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L3 21"/>',
  "file-text":  '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/>',
  building2:    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  "inbox":      '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11"/>',
};

/* رسم أيقونة — size بالبكسل، cls صنف اختياري */
function icon(name, size, cls){
  const p = ICON_PATHS[name];
  if (!p) return "";
  const s = size || 18;
  return `<svg class="${cls || ""}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${p}</svg>`;
}

/* =========================================================
   الشعار — حرف F داخل قوس 360°
   قوس مفتوح من الأسفل + حرف F في المركز + "°360" تحته.
   ========================================================= */
function logoMark(size, color){
  const s = size || 30;
  const c = color || "var(--brand)";
  return `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M 10 34 A 18 18 0 1 1 38 34" stroke="${c}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <path d="M 19.5 30 V 13 H 30.5 M 19.5 21 H 28" stroke="${c}" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="24" y="41.5" font-family="inherit" font-size="9.5" font-weight="700" fill="${c}" text-anchor="middle">360&#176;</text>
  </svg>`;
}

/* =========================================================
   حلقة المدار — مؤشر دائري للدرجات
   ========================================================= */
function orbitRing(value, max, color, size, caption, cls){
  const s = size || 108;
  const r = (s / 2) - 7;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, (value ?? 0) / (max || 100)));
  const dash = circ * pct;
  return `<div class="orbit ${cls || ""}" style="width:${s}px;height:${s}px">
    <svg width="${s}" height="${s}">
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="7"/>
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${color}" stroke-width="7"
        stroke-linecap="round" stroke-dasharray="${dash} ${circ - dash}"/>
    </svg>
    <div class="orbit-val">
      <span class="orbit-num" style="color:${color}">${value ?? "—"}</span>
      ${caption ? `<span class="orbit-cap">${caption}</span>` : ""}
    </div>
  </div>`;
}

/* لون حسب الدرجة (0–100) */
function scoreColor(v){
  if (v == null) return "var(--ink-3)";
  if (v >= 75) return "var(--ok)";
  if (v >= 60) return "#2E8B63";
  if (v >= 45) return "var(--warn)";
  return "var(--bad)";
}

/* لون حسب الترتيب في نتائج البحث */
function rankColor(r){
  if (r == null) return "var(--bad)";
  if (r <= 3) return "var(--ok)";
  if (r <= 10) return "var(--warn)";
  return "#C4762A";
}

export { icon, logoMark, orbitRing, scoreColor, rankColor, ICON_PATHS };
