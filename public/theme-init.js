// Stamp the theme before first paint to avoid a flash (mirrors src/lib/theme.ts).
// External file rather than inline so the Content-Security-Policy can stay "script-src 'self'".
try {
  var t = localStorage.getItem('wwip:theme')
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t)
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('system-dark')
} catch (e) {
  /* storage unavailable */
}
