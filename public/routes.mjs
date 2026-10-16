const routes = Object.freeze({ '/': 'gallery', '/area': 'area', '/running': 'running', '/running/event': 'event', '/aetherfield': 'aetherfield' });
/** Resolve only known routes; never interpolate untrusted URL content into HTML. */
export function resolveRoute(hash = '') {
  try { const path = decodeURIComponent(hash.replace(/^#/, '')).replace(/\/$/, '') || '/'; return Object.hasOwn(routes, path) ? routes[path] : 'gallery'; }
  catch { return 'gallery'; }
}
