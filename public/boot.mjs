import './app.mjs';
import { mountMotion } from './motion.mjs';
import { mountInteractions } from './interactions.mjs';
import { resolveRoute } from './routes.mjs';
import { motionAllowed } from './motion-core.mjs';

const app = document.querySelector('#app');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let preference;
try { preference = localStorage.getItem('figma-motion'); } catch { preference = null; }
const setting = { enabled: motionAllowed(reduced.matches, preference) };
const toolbar = document.createElement('aside');
toolbar.className = 'motion-toolbar';
toolbar.setAttribute('aria-label', 'Page controls');
toolbar.innerHTML = '<button type="button" data-motion-toggle aria-pressed="false">Motion on</button><button type="button" data-top aria-label="Back to top">↑</button>';
document.body.append(toolbar);
const progress = document.createElement('div');
progress.className = 'reading-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.append(progress);
let disposeMotion = () => {}, disposeInteractions = () => {};
function reflect() {
 setting.enabled = motionAllowed(reduced.matches, preference);
 document.documentElement.dataset.motion = setting.enabled ? 'on' : 'off';
 const toggle = toolbar.querySelector('[data-motion-toggle]');
 toggle.textContent = reduced.matches ? 'Reduced motion' : setting.enabled ? 'Motion on' : 'Motion off';
 toggle.setAttribute('aria-pressed', String(!setting.enabled));
 toggle.setAttribute('aria-label', reduced.matches ? 'Reduced motion follows your system setting' : setting.enabled ? 'Pause decorative motion' : 'Enable decorative motion');
 toggle.disabled = reduced.matches;
 window.dispatchEvent(new Event('motionpreferencechange'));
}
toolbar.querySelector('[data-motion-toggle]').addEventListener('click', () => {
 preference = setting.enabled ? 'off' : 'on';
 try { localStorage.setItem('figma-motion', preference); } catch { /* Private mode still supports the session toggle. */ }
 reflect();
});
toolbar.querySelector('[data-top]').addEventListener('click', () => window.scrollTo({top: 0, behavior: setting.enabled ? 'smooth' : 'instant'}));
reduced.addEventListener('change', reflect);
reflect();
function mount() {
 disposeMotion(); disposeInteractions();
 const route = resolveRoute(location.hash);
 document.body.dataset.page = route;
 // The old card-only reveal must never compete with the new animation lifecycle.
 app.querySelectorAll('.reveal').forEach(node => node.classList.add('arrived'));
 disposeInteractions = mountInteractions(app, route, setting);
 disposeMotion = mountMotion(app, route, setting, progress);
}
new MutationObserver(mount).observe(app, { childList: true });
mount();
