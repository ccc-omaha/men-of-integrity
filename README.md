# findintegrity.com

Site for Men of Integrity, a Renewal ministry of Christ Community Church.

## Editing

Staff edit text, links, resources and photos at https://app.pagescms.org (sign in with GitHub, open `ccc-omaha/men-of-integrity`). Saving commits to GitHub and Netlify rebuilds the site in about a minute.

Text boxes support `*italic*`, `**bold**`, `[link text](https://...)` and Enter for a new line.

Uploaded photos over 1600px or 500 KB are shrunk automatically by `.github/workflows/optimize-images.yml`.

## How it's built

- `content/*.json` holds every editable word (configured in `.pages.yml`)
- `src/index.njk` is the page template, with `src/styles.css` and `src/site.js` inlined at build time
- `public/` is copied to the site as-is (images live in `public/images`)
- `build.mjs` renders everything into `dist/`; Netlify runs `npm run build` (see `netlify.toml`)

Local build: `npm install && npm run build`, then open `dist/index.html`.
