# Figma 실험실

Three Figma community design studies, with a custom collection entry page.

## Routes

- `#/` — selected-sites collection
- `#/area` — Browse everything / Area
- `#/running` — Running for Change
- `#/running/event` — event agenda
- `#/aetherfield` — Aetherfield sustainability SaaS

Vanilla HTML, CSS and JavaScript modules. No runtime framework or package dependencies. Responsive layouts, anchor navigation, a mobile menu, reduced-motion support and accessible native dialogs are included.

## Run

Requires Node.js 22+, curl and Python 3 for the convenience development server.

```sh
npm test
npm run check
npm run build
npm run dev
```

Open `http://localhost:5173`. `npm run build` imports the original images/SVGs into `public/assets` and copies the complete static site into `dist`. Vercel settings are provided in `vercel.json`.

## Important status

This commit contains the page implementation, not a verified production deployment. The three automated source/route checks and JavaScript syntax checks passed locally. Full browser visual comparison and original asset download could not be verified in the offline working environment.

Figma image URLs in `sources/figma-assets.json` are temporary import sources, not runtime URLs. The initial build needs network access and valid source URLs. It fails rather than publishing missing or invalid assets. After a successful import, commit `public/assets/` to preserve the images permanently; future builds reuse those local files. Expired sources must be refreshed from the Figma files.

Forms are explicitly local demonstrations: they do not send, save, register, subscribe or email anything. Careers, article and case-study actions open demo dialogs; their full secondary-page designs are not implemented. Running event dates and template copy are preserved from the source, not presented as current live event information.

## Design sources

- Area: https://www.figma.com/design/strrnYvNNmjqM812xBcnDU/
- Running for Change: https://www.figma.com/design/KbkUnA1meuz9UtqWePozFN/
- Aetherfield: https://www.figma.com/design/4CHzMSXaRh58zevjgKeceG/

Figma Community template names, copy and imagery are retained for the design study. Google Fonts are loaded through their stylesheet API; no font binaries are redistributed in this repository.
