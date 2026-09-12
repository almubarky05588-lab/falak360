/* =========================================================
   فلك ٣٦٠ — محمّل الوحدات الإضافية
   ========================================================= */

const MODULES = [
  "./zones-core.js",
  "./ai-visibility.js",
  "./keyword-intel.js",
  "./alt-sites.js",
  "./profile-qa.js",
];

MODULES.forEach((m) => {
  import(m).catch((e) => console.warn("module failed:", m, e?.message));
});
