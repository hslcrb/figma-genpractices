// Pure helpers shared by the motion controller and its regression tests.
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const wrapIndex = (index, count) => count > 0 ? ((index % count) + count) % count : 0;
export const motionAllowed = (reduced, preference) => !reduced && preference !== 'off';
export const coverage = Object.freeze({
 gallery: ['headline entrance', 'staggered cards', 'pointer tilt', 'category filters', 'route exit and entrance'],
 area: ['tablet reveal and scroll perspective', 'section reveals', 'swipeable feature carousel', 'comparison emphasis', 'step progress', 'sticky navigation'],
 running: ['hero zoom and parallax', 'scroll typography', 'fundraiser count-up', 'mission word progression', 'newsletter and registration dialogs'],
 event: ['date entrance', 'scroll timeline', 'expandable agenda', 'calendar file export', 'registration dialog'],
 aetherfield: ['dashboard reveal', 'feature accordion', 'value card stagger', 'case-study dialog', 'journal reader', 'testimonial reveal', 'footer parallax']
});
export function createScope() {
 const abort = new AbortController();
 const disposers = new Set();
 let dead = false;
 return {
  signal: abort.signal,
  get disposed() { return dead; },
  on(target, type, handler, options = {}) { target?.addEventListener(type, handler, {...options, signal: abort.signal}); },
  add(dispose) { if (dead) dispose(); else disposers.add(dispose); return dispose; },
  dispose() { if (dead) return; dead = true; abort.abort(); for (const dispose of disposers) dispose(); disposers.clear(); }
 };
}
