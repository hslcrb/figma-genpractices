import { clamp, createScope } from './motion-core.mjs';

const EASE = 'cubic-bezier(.16,1,.3,1)';
export function mountMotion(root, route, setting, progress) {
 const scope = createScope();
 const animations = new Set();
 const frames = new Set();
 const once = new WeakSet();
 const resetters = new Set();
 const page = root.firstElementChild;
 function frame(fn) { const id = requestAnimationFrame(t => { frames.delete(id); if (!scope.disposed) fn(t); }); frames.add(id); return id; }
 function play(node, keyframes, options = {}) {
  if (!node || !setting.enabled || !node.animate) return null;
  const animation = node.animate(keyframes, {duration: 850, easing: EASE, ...options});
  animations.add(animation);
  animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  return animation;
 }
 function appear(node, delay = 0, direction = 'up') {
  if (once.has(node)) return;
  once.add(node); node.dataset.motionSeen = 'true';
  play(node, [{opacity: 0, transform: direction === 'left' ? 'translate3d(-36px,0,0)' : 'translate3d(0,36px,0)', filter: 'blur(5px)'}, {opacity: 1, transform: 'none', filter: 'blur(0)'}], {delay, duration: 950});
 }
 function count(node, target, duration = 1600) {
  const finish = () => { node.textContent = String(target); };
  resetters.add(finish);
  if (!setting.enabled) { finish(); return; }
  const start = performance.now();
  const tick = now => {
   if (!setting.enabled) { finish(); return; }
   const p = clamp((now - start) / duration);
   node.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
   if (p < 1) frame(tick); else finish();
  };
  frame(tick);
 }
 const header = root.querySelector('.gallery-nav,.area-nav,.run-nav,.aether-nav');
 const hero = root.querySelector('.gallery-intro,.area-hero,.run-hero,.run-event-hero,.aether-hero');
 play(page, [{opacity: .1}, {opacity: 1}], {duration: 300});
 if (header) appear(header);
 if (hero) {
  hero.querySelectorAll('h1,.intro-note,.button-row,.run-hero-base').forEach((el, i) => appear(el, 100 + i * 100));
  hero.querySelectorAll('.photo-bg,.aether-dashboard,.tablet-stage').forEach(el => play(el, [{opacity: .2, transform: 'translateY(42px) scale(.97)'}, {opacity: 1, transform: 'none'}], {duration: 1400, delay: 150}));
 }
 const selector = 'main>section>h2,main>section>p,.project-card,.benefit-grid article,.steps article,.value-grid article,.journal-item,.area-split>div,.area-split>img,.testimonial blockquote,.aether-testimonial blockquote,.aether-testimonial>img,.aether-case>div,.centered-heading,.area-contact,.run-stride>div,.run-two>div,.run-mission h2,.event-agenda article,.area-footer,.aether-cta,.run-footer-wordmark';
 const groups = new Map();
 root.querySelectorAll(selector).forEach(el => {
  const i = groups.get(el.parentElement) || 0; groups.set(el.parentElement, i + 1); el.dataset.motionDelay = String(Math.min(i * 85, 340));
 });
 const candidates = [...root.querySelectorAll(selector)];
 const counter = root.querySelector('[data-counter]');
 if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
   for (const entry of entries) if (entry.isIntersecting) {
    appear(entry.target, Number(entry.target.dataset.motionDelay || 0));
    if (entry.target === counter) count(counter, Number(counter.dataset.counter));
    observer.unobserve(entry.target);
   }
  }, {threshold: .08, rootMargin: '0px 0px -30px 0px'});
  candidates.forEach(el => observer.observe(el));
  if (counter) observer.observe(counter);
  scope.add(() => observer.disconnect());
 } else {
  candidates.forEach(el => appear(el));
  if (counter) counter.textContent = counter.dataset.counter;
 }
 const scenes = [...root.querySelectorAll('.run-hero,.run-stride,.run-raised,.run-footer:not(.solid),.aether-values')].map(el => ({el, image: el.querySelector(':scope>.photo-bg')})).filter(x => x.image);
 const tablet = root.querySelector('.tablet');
 const tabletStage = root.querySelector('.tablet-stage');
 const dashboard = root.querySelector('.aether-dashboard');
 const sticker = root.querySelector('.journal-sticker');
 const mission = root.querySelector('.mission-words');
 const sections = [...root.querySelectorAll('section[id],.event-agenda article')];
 let scheduled = false;
 function updateScroll() {
  scheduled = false;
  const height = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${height > 0 ? clamp(scrollY / height) : 0})`;
  document.body.classList.toggle('page-scrolled', scrollY > 100);
  header?.classList.toggle('nav-scrolled', scrollY > 30);
  for (const {el, image} of scenes) {
   const r = el.getBoundingClientRect();
   if (r.bottom < -100 || r.top > innerHeight + 100) continue;
   const travel = setting.enabled ? clamp((innerHeight / 2 - r.top - r.height / 2) / innerHeight, -1, 1) * 34 : 0;
   image.style.transform = setting.enabled ? `translate3d(0,${travel}px,0) scale(1.08)` : '';
  }
  if (tablet && tabletStage) {
   const r = tabletStage.getBoundingClientRect();
   const p = clamp((innerHeight - r.top) / innerHeight);
   tablet.style.setProperty('--tablet-angle', setting.enabled ? `${(1 - p) * 12}deg` : '0deg');
  }
  if (dashboard && setting.enabled) {
   const r = dashboard.getBoundingClientRect();
   dashboard.style.setProperty('--dashboard-lift', `${clamp(r.top / innerHeight, 0, 1) * 16}px`);
  }
  if (sticker) sticker.style.setProperty('--sticker-angle', setting.enabled ? `${-10 + clamp((innerHeight - sticker.getBoundingClientRect().top) / innerHeight) * 7}deg` : '-10deg');
  if (mission) {
   const r = mission.getBoundingClientRect();
   const p = setting.enabled ? clamp((innerHeight * .85 - r.top) / (innerHeight * .6)) : 1;
   const words = [...mission.children];
   words.forEach((word, i) => word.classList.toggle('word-lit', i / words.length <= p));
  }
  let active = '';
  for (const section of sections) if (section.getBoundingClientRect().top <= innerHeight * .45) active = section.id;
  root.querySelectorAll('[data-scroll]').forEach(link => {
   if (active && link.dataset.scroll === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  root.querySelectorAll('.event-agenda article').forEach(el => el.classList.toggle('timeline-active', el.getBoundingClientRect().top < innerHeight * .65));
 }
 const scheduleScroll = () => { if (!scheduled) { scheduled = true; frame(updateScroll); } };
 scope.on(window, 'scroll', scheduleScroll, {passive: true});
 scope.on(window, 'resize', scheduleScroll, {passive: true});
 scope.on(root, 'load', scheduleScroll, {capture: true});
 scope.on(window, 'motionpreferencechange', () => {
  if (!setting.enabled) {
   for (const animation of animations) { try { animation.finish(); } catch { animation.cancel(); } }
   for (const finish of resetters) finish();
  }
  scheduleScroll();
 });
 // Pointer effects are scoped to fine pointers. Touch scrolling remains entirely native.
 if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  root.querySelectorAll('.project-card,.value-grid article').forEach(card => {
   let pending = false;
   scope.on(card, 'pointermove', e => {
    if (!setting.enabled || pending) return;
    const x = e.clientX, y = e.clientY; pending = true;
    frame(() => {
     pending = false; const r = card.getBoundingClientRect();
     card.style.setProperty('--tilt-x', `${-(y - r.top - r.height / 2) / r.height * 5}deg`);
     card.style.setProperty('--tilt-y', `${(x - r.left - r.width / 2) / r.width * 5}deg`);
     card.style.setProperty('--pointer-x', `${x - r.left}px`); card.style.setProperty('--pointer-y', `${y - r.top}px`);
    });
   }, {passive: true});
   scope.on(card, 'pointerleave', () => {card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg');});
  });
 }
 // Browser back/forward still renders immediately; ordinary internal links also get an exit.
 let navigating = false;
 scope.on(root, 'click', e => {
  const link = e.target.closest('a[href^="#/"]');
  if (!link || !setting.enabled || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.hash === location.hash || navigating) return;
  e.preventDefault(); navigating = true;
  const animation = play(page, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(-14px)'}], {duration: 160, easing: 'ease-in', fill: 'forwards'});
  const go = () => { if (!scope.disposed) location.hash = link.hash; };
  if (animation) animation.finished.then(go, go); else go();
 });
 updateScroll();
 scope.add(() => { animations.forEach(a => a.cancel()); frames.forEach(id => cancelAnimationFrame(id)); });
 return () => scope.dispose();
}
