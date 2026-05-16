# weDream ♥

A little webapp for couples to share their dreams with each other — works on phones and laptops, available in English and Japanese.

**Live site:** https://alexberns.github.io/myDream/

---

## What it does

- **Setup once** with you and your partner's names
- **Add dreams** with a title, details, category (travel, home, adventure, career, family, other), and whose dream it is (mine / theirs / shared)
- **Browse** all dreams or filter by Mine / Theirs / Shared
- **Edit and delete** dreams anytime
- **Bilingual** — full EN / 日本語 support, auto-detected from browser language, switchable anytime via the toggle in the header
- **Mobile-friendly** — responsive layout for phones and desktops
- **Pink/heart theme** with a soft, romantic feel

## Tech

Pure static site — no framework, no build step, no backend (yet).

| File | Purpose |
|---|---|
| `index.html` | Page structure (setup screen, app, add/edit modal) |
| `style.css` | Mobile-first responsive styling |
| `app.js` | State, rendering, localStorage persistence |
| `i18n.js` | English + Japanese translations and language switching |

Data is currently stored in the browser's `localStorage` under the key `wedream.v1`.

## Running locally

Open the file directly:

```bash
open index.html
```

Or run a local server (matches how GitHub Pages serves it):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Hosted free on **GitHub Pages**. Every push to `main` auto-deploys within ~1 minute.

To set up Pages the first time:
1. Go to repo **Settings → Pages**
2. Source: **Deploy from a branch** → branch **`main`** → folder **`/ (root)`** → Save
3. Site goes live at `https://<username>.github.io/<repo>/`

## Progress

**Done**
- [x] Initial draft of the webapp structure (HTML / CSS / JS)
- [x] Setup flow with partner names
- [x] Add / edit / delete dreams with categories and owner
- [x] Tab filtering (All / Mine / Theirs / Shared)
- [x] Mobile + desktop responsive layout
- [x] Renamed from `OurDreams` to `weDream`
- [x] Bilingual EN / 日本語 with auto-detection and live switching
- [x] Pushed to GitHub and hosted on GitHub Pages

**Known limitation**
- Dreams are stored locally in each browser, so **you and your partner can't see each other's dreams yet** — each device has its own data.

**Next up**
- [ ] Real backend (Firebase or Supabase free tier) so both partners share the same data across devices
- [ ] Simple pairing flow (one couple = one shared space)
- [ ] Optional: reactions / comments on each other's dreams
- [ ] Optional: photos attached to dreams
- [ ] Optional: PWA install (add to home screen)
