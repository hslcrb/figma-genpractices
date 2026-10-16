# Motion and interaction coverage

The existing five routes retain their Figma imagery and brand styling. Motion is implemented with native CSS, Web Animations, IntersectionObserver and a requestAnimationFrame-coalesced scroll handler. No runtime animation dependency is required.

| Route | Implemented behavior |
| --- | --- |
| Collection | Intro entrance, rotating ornament, staggered cards, pointer tilt, image hover, category filters with result status, route exit/entry |
| Area | Sticky navigation with active sections, tablet perspective, product-preview dashboard, scroll reveals, four-slide feature gallery with buttons/keyboard/swipe/autoplay/pause, comparison hover, numbered steps, contact form |
| Running | Hero/image parallax, headline reveal, 30K count-up, progressive mission text, newsletter preview, registration preview, footer reveal |
| Event | Date reveal, active timeline, expandable agenda, historical template event ICS download, registration preview and sample ticket download |
| Aetherfield | Dashboard entrance and interactive chart preview, feature accordion with keyboard navigation, staggered value cards, case study, three reader views, careers accordion, CTA and footer effects |
| Shared | Progress bar, back to top, accessible mobile menus, dialog entrance/exit, Escape/backdrop dismissal, restored focus, form validity feedback, persistent motion toggle |

System reduced motion always wins over the page toggle. Stopping motion leaves content visible and controls functional. Hover/pointer effects are not installed on coarse pointers. Route changes abort listeners, observers, timers and animations. Autoplay pauses offscreen, on hover/focus, in hidden tabs and when motion is off. Ordinary scrolling is never intercepted.

## Boundaries

These are frontend design studies, not connected customer accounts or real events. Forms do not send or store personal information; registration, sample chart data, article prose and careers are labeled demonstrations. The supplied event date is retained as a historical template, not replaced with an invented future countdown.

## Asset status

The original 48 assets are served locally in a build, but the prior GitHub Actions importer is blocked by an account billing lock. Do not mistake a deployed local asset for an asset committed to Git. Verify `git ls-files public/assets` before claiming the originals are in the repository.
