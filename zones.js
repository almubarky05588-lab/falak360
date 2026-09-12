/* =========================================================
   فلك ٣٦٠ — محمّل الوحدات الإضافية
   يُحمَّل من app.html، ويجلب بقية الوحدات تلقائياً
   ========================================================= */

const MODULES = [
  "./zones-core.js",
  "./ai-visibility.js",
  "./keyword-intel.js",
];

MODULES.forEach((m) => {
  import(m).catch((e) => console.warn("module failed:", m, e?.message));
});
