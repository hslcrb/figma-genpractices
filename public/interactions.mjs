import { createScope, wrapIndex } from './motion-core.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const asset = (brand, name) => `./assets/${brand}/${name}`;
const waitFor = animation => animation ? animation.finished.catch(() => {}) : Promise.resolve();
export function mountInteractions(root, route, setting) {
 const scope = createScope();
 const animations = new Set();
 const timers = new Set();
 const dialog = document.querySelector('#contact-dialog');
 let returnFocus = null;
 let dialogVersion = 0;
 function animate(node, frames, options = {}) {
  if (!setting.enabled || !node?.animate) return null;
  const a = node.animate(frames, {duration: 400, easing: 'cubic-bezier(.16,1,.3,1)', ...options});
  animations.add(a); a.finished.catch(() => {}).finally(() => animations.delete(a)); return a;
 }
 function saveFile(name, type, text) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  const timer = setTimeout(() => {URL.revokeObjectURL(url); timers.delete(timer);}, 1500); timers.add(timer);
  scope.add(() => URL.revokeObjectURL(url));
 }
 function show(title, body, opener) {
  dialogVersion++;
  if (opener?.isConnected) returnFocus = opener;
  dialog.className = `interactive-modal modal-${route}`;
  dialog.innerHTML = `<button type="button" class="dialog-close" data-modal-close aria-label="Close dialog">×</button><p class="eyebrow">INTERACTIVE DESIGN STUDY</p><h2 id="dialog-title">${escape(title)}</h2><div class="modal-body">${body}</div>`;
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
  animate(dialog, [{opacity: 0, transform: 'translateY(22px) scale(.96)'}, {opacity: 1, transform: 'none'}], {duration: 420});
  dialog.querySelector('input,button,select')?.focus({preventScroll: true});
 }
 async function close() {
  const version = ++dialogVersion;
  await waitFor(animate(dialog, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(15px) scale(.98)'}], {duration: 170}));
  if (scope.disposed || version !== dialogVersion) return;
  dialog.close(); document.body.classList.remove('modal-open');
  if (returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
 }
 const formMarkup = kind => {
  const register = kind === 'registration';
  const newsletter = kind === 'newsletter';
  return `<p class="demo-disclosure">Local ${register ? 'registration' : newsletter ? 'newsletter' : 'request'} preview. Nothing is sent to a server or stored. ${register ? 'The template event date, May 12, 2025, is in the past; this does not book a real event.' : ''}</p><form data-interactive-form="${kind}">${newsletter ? '' : '<label>Your name<input name="name" autocomplete="name" maxlength="100" required></label>'}<label>Email address<input name="email" type="email" autocomplete="email" maxlength="254" required></label>${register ? '<label>Participation<select name="participation"><option>Community run</option><option>Walk with the community</option><option>Volunteer</option></select></label>' : newsletter ? '<label class="check-label"><input type="checkbox" name="consent" required> Try the subscription preview</label>' : '<label>What would you like to explore?<select name="interest"><option>Product overview</option><option>Analytics and reporting</option><option>Team workflows</option></select></label>'}<button class="button" type="submit">${register ? 'Preview registration' : newsletter ? 'Preview subscription' : 'Preview request'} ↗</button><p class="form-feedback" role="status" aria-live="polite"></p></form>`;
 };
 function dashboard(brand, opener) {
  const values = [32,41,36,55,48,61,54,69,72,64,81,87];
  show(brand === 'area' ? 'Your global snapshot' : 'Sustainability dashboard', `<p class="demo-disclosure">Interactive sample data, not a live business account.</p><div class="period-picker" role="group" aria-label="Reporting period"><button data-period="year" aria-pressed="true">Year</button><button data-period="quarter" aria-pressed="false">Quarter</button><button data-period="month" aria-pressed="false">Month</button></div><div class="demo-metric"><span data-metric>87</span><small>sample impact score</small></div><div class="live-chart" aria-label="Interactive sample bar chart">${values.map((v,i) => `<button class="chart-bar" style="--bar:${v}%" data-chart-value="${v}" aria-label="Period ${i+1}: ${v}"><span>${v}</span></button>`).join('')}</div><p class="chart-feedback" role="status">Select a period or a bar to inspect the sample data.</p>`, opener);
 }
 function article(index, opener) {
  const sections = [
   ['Start with one reliable source','Bring your energy, emissions, and operational records into one clearly labeled view. The first useful dashboard is one your team can understand.'],
   ['Give the data context','Keep units, reporting periods, and ownership visible. A useful comparison tells readers what was measured and when, rather than presenting a number in isolation.'],
   ['Turn a report into a next step','Choose an owner and a review date for each action. Keep the original evidence close to the decision so that your team can revisit it.']
  ];
  show('How to Build a Climate-Ready Data Stack', `<p class="demo-disclosure">Sample reader content written for this design study. Not a published Aetherfield article.</p><img class="reader-image" src="${asset('aetherfield',`journal-${index+1}.png`)}" alt="Sustainability journal illustration"><p class="eyebrow">TOOLING · READING ${index+1} / 3</p>${sections.map(([h,p])=>`<h3>${h}</h3><p>${p}</p>`).join('')}<div class="reader-controls"><button type="button" data-article="${wrapIndex(index-1,3)}">← Previous</button><button type="button" data-article="${wrapIndex(index+1,3)}">Next →</button></div>`, opener);
 }
 function openAction(action, opener) {
  if (/registration/i.test(action)) return show('Join the community', formMarkup('registration'), opener);
  if (/newsletter/i.test(action)) return show('Don’t miss a step', formMarkup('newsletter'), opener);
  if (/case study/i.test(action)) return show('Why Acme Inc chose Aetherfield', `<img class="reader-image" src="${asset('aetherfield','case-study.png')}" alt="Colleagues in blue duotone"><p>With fragmented data and growing reporting pressure, Acme turned to Aetherfield to streamline their ESG workflows.</p><div class="case-results"><strong>34%<small>more coverage in the template case study</small></strong><strong>01<small>shared reporting workspace</small></strong></div><p class="demo-disclosure">Fictional case study supplied by the design template. Explore the sample dashboard below.</p><button class="button" data-live-demo="aetherfield">Explore sample dashboard ↗</button>`, opener);
  if (/journal article/i.test(action)) return article(Number(opener.dataset.article || 0), opener);
  if (/journal preview/i.test(action)) return show('From the journal', `<p class="demo-disclosure">Three sample reader views from this design study.</p>${[0,1,2].map(i=>`<button class="reader-row" data-article="${i}"><img src="${asset('aetherfield',`journal-${i+1}.png`)}" alt="Journal illustration"><span>How to Build a Climate-Ready Data Stack<small>Tooling · View ${i+1}</small></span><span>↗</span></button>`).join('')}`, opener);
  if (/careers/i.test(action)) return show('Build with purpose', '<p class="demo-disclosure">Sample careers interaction. These are not real vacancies.</p><details open><summary>Product designer <small>Design · Sample role</small></summary><p>Design clear tools for complex sustainability data, from the first sketch to a working interface.</p></details><details><summary>Frontend engineer <small>Engineering · Sample role</small></summary><p>Build accessible, responsive interfaces and reusable interactive components.</p></details><details><summary>Customer success <small>Operations · Sample role</small></summary><p>Help teams understand their data and turn reporting into practical next steps.</p></details>', opener);
  if (/specifications/i.test(action)) return show('Area specifications', '<p>A closer look at the capabilities presented in the original design.</p><div class="spec-rows">'+['Ultra-fast browsing','Advanced AI insights','Seamless integration','Full UTF-8 support'].map((t,i)=>`<details ${i===0?'open':''}><summary>${t}</summary><p>Explore this capability in the interactive product preview. The figures and controls are demonstration data, not a connected service.</p></details>`).join('')+'</div><button class="button" data-live-demo="area">Open product preview ↗</button>', opener);
  if (/discover|explore aetherfield/i.test(action)) return dashboard(route === 'area' ? 'area' : 'aetherfield', opener);
  return show(action, formMarkup('request'), opener);
 }
 // Capture before the original generic dialog handler so each CTA has its own real behavior.
 scope.on(root, 'click', e => {
  const demo = e.target.closest('[data-live-demo]');
  const trigger = e.target.closest('[data-dialog]');
  if (demo || trigger) { e.preventDefault(); e.stopImmediatePropagation(); if (demo) dashboard(demo.dataset.liveDemo, demo); else openAction(trigger.dataset.dialog, trigger); }
 }, {capture: true});
 scope.on(root, 'keydown', e => {
  const demo = e.target.closest('img[data-live-demo]');
  if (demo && ['Enter',' '].includes(e.key)) {e.preventDefault(); dashboard(demo.dataset.liveDemo, demo);}
 });
 scope.on(dialog, 'cancel', e => {e.preventDefault(); e.stopImmediatePropagation(); close();}, {capture: true});
 scope.on(dialog, 'close', () => document.body.classList.remove('modal-open'));
 scope.on(dialog, 'click', e => {
  const button = e.target.closest('button');
  if (e.target === dialog) {
   const r = dialog.getBoundingClientRect();
   if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {e.stopImmediatePropagation(); close();}
   return;
  }
  if (!button) return;
  if (button.hasAttribute('data-modal-close')) {e.stopImmediatePropagation(); close();}
  if (button.hasAttribute('data-article')) article(Number(button.dataset.article), returnFocus);
  if (button.hasAttribute('data-live-demo')) dashboard(button.dataset.liveDemo, returnFocus);
  if (button.hasAttribute('data-period')) {
   dialog.querySelectorAll('[data-period]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
   const sets = {year:[32,41,36,55,48,61,54,69,72,64,81,87],quarter:[62,42,78,49,81,67,41,83,75,91,67,72],month:[23,39,31,42,33,51,39,44,54,67,52,64]};
   const values = sets[button.dataset.period];
   dialog.querySelectorAll('.chart-bar').forEach((bar,i) => {bar.style.setProperty('--bar',values[i]+'%');bar.dataset.chartValue=values[i];bar.setAttribute('aria-label',`Period ${i+1}: ${values[i]}`);bar.firstElementChild.textContent=values[i];});
   dialog.querySelector('[data-metric]').textContent = values.at(-1);
   dialog.querySelector('.chart-feedback').textContent = `${button.textContent} sample view selected.`;
  }
  if (button.hasAttribute('data-chart-value')) dialog.querySelector('.chart-feedback').textContent = `Selected sample value: ${button.dataset.chartValue}.`;
  if (button.hasAttribute('data-ticket')) {
   saveFile('sample-running-ticket.txt','text/plain','RUNNING FOR CHANGE\nDESIGN STUDY — NOT A REAL REGISTRATION\nMay 12, 2025 · 6AM–NOON\nGreen Bay Trail, Glencoe, IL\n');
  }
 }, {capture: true});
 scope.on(dialog, 'submit', e => {
  const form = e.target.closest('[data-interactive-form]'); if (!form) return;
  e.preventDefault(); e.stopImmediatePropagation(); if (!form.reportValidity()) return;
  const status = form.querySelector('.form-feedback');
  status.textContent = '✓ Preview complete. No request was sent and no personal data was stored.';
  status.classList.add('success'); animate(status,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}]);
  if (form.dataset.interactiveForm==='registration' && !form.querySelector('[data-ticket]')) {
   const ticket=document.createElement('button');ticket.type='button';ticket.className='button ticket-button';ticket.dataset.ticket='';ticket.textContent='Save sample ticket ↓';form.append(ticket);
  }
 });
 root.querySelectorAll('.tablet img,.aether-dashboard').forEach(image => {image.dataset.liveDemo=route;image.tabIndex=0;image.setAttribute('role','button');image.setAttribute('aria-label','Explore interactive sample dashboard');image.title='Explore interactive sample dashboard';});
 root.querySelectorAll('.journal-item').forEach((item,i)=>item.dataset.article=String(i));

 // Accessible animated mobile navigation for every brand.
 const nav = root.querySelector('.area-nav nav,#aether-menu,.run-nav>div');
 if (nav) {
  const parent = nav.parentElement;
  let toggle = parent.querySelector('.menu-toggle');
  if (!toggle) {toggle=document.createElement('button');toggle.type='button';toggle.className='motion-menu-toggle';toggle.textContent='Menu +';parent.append(toggle);}
  nav.id ||= `${route}-mobile-menu`;nav.classList.add('motion-menu');toggle.dataset.navToggle='';toggle.setAttribute('aria-controls',nav.id);toggle.setAttribute('aria-expanded','false');
  let open=false;
  function setMenu(value, focus=false) {
   open=value;nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Close −':'Menu +';
   nav.inert=innerWidth<=760&&!open;
   if(open) animate(nav,[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}]);
   if(focus)toggle.focus();
  }
  setMenu(false);
  scope.on(root,'click',e=>{
   if(e.target.closest('[data-nav-toggle]')){e.preventDefault();e.stopImmediatePropagation();setMenu(!open);}
   else if(e.target.closest('[data-scroll],a[href^="#/"]'))setMenu(false);
  },{capture:true});
  scope.on(document,'click',e=>{if(open&&!parent.contains(e.target))setMenu(false);});
  scope.on(document,'keydown',e=>{if(e.key==='Escape'&&open&&!dialog.open){e.preventDefault();setMenu(false,true);}});
  scope.on(window,'resize',()=>{nav.inert=innerWidth<=760&&!open;},{passive:true});
 }
 if(route==='gallery') {
  const index=root.querySelector('.gallery-index');
  const filters=document.createElement('div');filters.className='collection-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter collection');
  filters.innerHTML=['All','Product','Community','SaaS'].map((label,i)=>`<button type="button" data-filter="${label}" aria-pressed="${i===0}">${label}</button>`).join('')+'<span class="filter-status" role="status" aria-live="polite">3 sites</span>';
  index.after(filters);
  scope.on(filters,'click',e=>{const button=e.target.closest('[data-filter]');if(!button)return;
   filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   let visible=0;root.querySelectorAll('.project-card').forEach(card=>{const show=button.dataset.filter==='All'||card.querySelector('.eyebrow').textContent===button.dataset.filter;card.hidden=!show;if(show){visible++;animate(card,[{opacity:0,transform:'translateY(16px) scale(.98)'},{opacity:1,transform:'none'}]);}});
   filters.querySelector('.filter-status').textContent=`${visible} ${visible===1?'site':'sites'}`;
  });
 }
 if(route==='area') {
  const image=root.querySelector('.area-split>img');
  const list=[...root.querySelectorAll('.numbered-list li')];
  if(image) {
   const carousel=document.createElement('div');carousel.className='area-carousel';carousel.setAttribute('role','region');carousel.setAttribute('aria-roledescription','carousel');carousel.setAttribute('aria-label','Area feature gallery');
   image.replaceWith(carousel);carousel.append(image);
   const controls=document.createElement('div');controls.className='carousel-controls';
   controls.innerHTML='<button type="button" data-slide-step="-1" aria-label="Previous feature">←</button><span class="slide-status" aria-live="polite">01 / 04</span><div class="slide-dots">'+list.map((_,i)=>`<button type="button" data-slide-index="${i}" aria-label="Show feature ${i+1}" aria-pressed="${i===0}"></button>`).join('')+'</div><button type="button" data-carousel-pause aria-label="Pause automatic slides">Ⅱ</button><button type="button" data-slide-step="1" aria-label="Next feature">→</button>';
   carousel.append(controls);image.draggable=false;
   const names=['columns.png','spheres.png','landscape.png','mountains.png'];
   const alts=['White cylindrical columns','A sphere balanced between two larger spheres','A winding green mountain path','Layered mountain ranges'];
   let index=0,paused=false,hovered=false;
   const showSlide=next=>{index=wrapIndex(next,names.length);image.src=asset('area',names[index]);image.alt=alts[index];carousel.dataset.slide=String(index);controls.querySelector('.slide-status').textContent=`0${index+1} / 04`;controls.querySelectorAll('[data-slide-index]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));list.forEach((li,i)=>li.setAttribute('aria-pressed',String(i===index)));animate(image,[{opacity:.15,transform:'scale(1.04)'},{opacity:1,transform:'scale(1)'}],{duration:650});};
   list.forEach((li,i)=>{li.tabIndex=0;li.setAttribute('role','button');li.setAttribute('aria-label',`Show feature ${i+1}: ${li.textContent}`);li.setAttribute('aria-pressed',String(i===0));scope.on(li,'click',()=>showSlide(i));scope.on(li,'keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();showSlide(i);}});});
   scope.on(controls,'click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-slide-step'))showSlide(index+Number(b.dataset.slideStep));if(b.hasAttribute('data-slide-index'))showSlide(Number(b.dataset.slideIndex));if(b.hasAttribute('data-carousel-pause')){paused=!paused;b.textContent=paused?'▶':'Ⅱ';b.setAttribute('aria-label',paused?'Play automatic slides':'Pause automatic slides');b.setAttribute('aria-pressed',String(paused));}});
   carousel.tabIndex=0;carousel.dataset.slide='0';
   scope.on(carousel,'keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();showSlide(index+(e.key==='ArrowRight'?1:-1));}});
   let start=null;
   scope.on(image,'pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
   scope.on(image,'pointerup',e=>{if(start&&Math.abs(e.clientX-start.x)>45&&Math.abs(e.clientX-start.x)>Math.abs(e.clientY-start.y))showSlide(index+(e.clientX<start.x?1:-1));start=null;});
   scope.on(image,'pointercancel',()=>start=null);
   scope.on(carousel,'pointerenter',()=>hovered=true);scope.on(carousel,'pointerleave',()=>hovered=false);
   const interval=setInterval(()=>{const r=carousel.getBoundingClientRect();if(setting.enabled&&!paused&&!hovered&&!document.hidden&&!carousel.contains(document.activeElement)&&r.bottom>0&&r.top<innerHeight)showSlide(index+1);},6000);scope.add(()=>clearInterval(interval));
  }
 }
 if(route==='running') {
  const number=root.querySelector('.run-raised h2');if(number)number.innerHTML='<span data-counter="30">30</span>K<br>Raised';
  const mission=root.querySelector('.run-mission h2');if(mission){const text=mission.textContent;mission.classList.add('mission-words');mission.setAttribute('aria-label',text);mission.innerHTML=text.split(/\s+/).map(word=>`<span aria-hidden="true">${escape(word)}</span>`).join(' ');}
 }
 if(route==='event') {
  root.querySelectorAll('.event-agenda article').forEach((article,i)=>{
   article.id=`agenda-${i}`;const title=article.querySelector('h2');const panel=article.querySelector('p');panel.id=`agenda-panel-${i}`;
   title.innerHTML=`<button class="agenda-toggle" type="button" aria-expanded="true" aria-controls="${panel.id}">${escape(title.textContent)}<span aria-hidden="true">−</span></button>`;
   scope.on(title.firstElementChild,'click',()=>{const button=title.firstElementChild;const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.lastElementChild.textContent=open?'−':'+';panel.hidden=!open;if(open)animate(panel,[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}]);});
  });
  const calendar=document.createElement('button');calendar.type='button';calendar.className='button calendar-button';calendar.textContent='Save template event .ics ↓';root.querySelector('.event-agenda>div').append(calendar);
  scope.on(calendar,'click',()=>saveFile('running-for-change-template.ics','text/calendar;charset=utf-8',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Figma Design Study//Running For Change//EN','BEGIN:VEVENT','UID:running-for-change-template-20250512@figma-genpractices','DTSTAMP:20250501T000000Z','DTSTART:20250512T110000Z','DTEND:20250512T170000Z','SUMMARY:Running for Change (template event)','LOCATION:Green Bay Trail\\, Glencoe\\, IL','DESCRIPTION:Historical design-template event. Not a real booking.','END:VEVENT','END:VCALENDAR',''].join('\r\n')));
 }
 if(route==='aetherfield') {
  const items=[...root.querySelectorAll('.feature-item')];
  items.forEach((item,i)=>{const title=item.querySelector('h3');const panel=item.querySelector('p');panel.id=`feature-panel-${i}`;title.innerHTML=`<button type="button" class="feature-trigger" aria-expanded="${i===0}" aria-controls="${panel.id}">${title.innerHTML}<b aria-hidden="true">${i===0?'−':'+'}</b></button>`;panel.hidden=i!==0;item.classList.toggle('feature-active',i===0);
   scope.on(title.firstElementChild,'click',()=>{
    const wasOpen=title.firstElementChild.getAttribute('aria-expanded')==='true';
    items.forEach((other,j)=>{const button=other.querySelector('.feature-trigger');const p=other.querySelector('p');const open=j===i&&!wasOpen;button.setAttribute('aria-expanded',String(open));button.querySelector('b').textContent=open?'−':'+';other.classList.toggle('feature-active',open);p.hidden=!open;if(open)animate(p,[{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'none'}]);});
   });
   scope.on(title.firstElementChild,'keydown',e=>{let next=i;if(e.key==='ArrowDown')next=wrapIndex(i+1,items.length);else if(e.key==='ArrowUp')next=wrapIndex(i-1,items.length);else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else return;e.preventDefault();items[next].querySelector('button').focus();});
  });
 }
 scope.add(()=>{dialogVersion++;animations.forEach(a=>a.cancel());timers.forEach(t=>clearTimeout(t));if(dialog.open)dialog.close();document.body.classList.remove('modal-open');});
 return ()=>scope.dispose();
}
