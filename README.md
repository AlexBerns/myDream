# weDream ♥

A little webapp for couples to share their dreams with each other — works on phones and laptops, available in English and Japanese, with real-time sync between partners powered by Firebase.

**Live site:** https://alexberns.github.io/myDream/

---

## What it does

- **Sign up** with email + password
- **Pair with your partner**: one of you creates a couple space (gets an invite code), the other joins with that code
- **Add dreams** with a title, details, category, and whose dream it is (mine / theirs / shared)
- **Real-time sync**: when one partner adds or edits a dream, the other sees it within a second — no refresh
- **Browse** all dreams or filter by Mine / Theirs / Shared
- **Edit and delete** dreams (your own or shared ones)
- **Bilingual** — full EN / 日本語, auto-detected from browser language, switchable anytime

## Tech

Pure static site, no build step. Firebase is loaded via CDN as ES modules.

| File | Purpose |
|---|---|
| `index.html` | Page structure (loading / auth / couple setup / app / modal) |
| `style.css` | Mobile-first responsive styling |
| `app.js` | Auth state, couple logic, dreams CRUD with real-time sync (ES module) |
| `firebase.js` | Firebase initialization and SDK re-exports (ES module) |
| `i18n.js` | English + Japanese translations and language switching |
| `firestore.rules` | Firestore security rules (paste into Firebase Console) |

### Data model

```
users/{uid}              → { email, coupleId, displayName }
couples/{coupleId}       → { members: [uid1, uid2], inviteCode, names: { uid: name } }
couples/{coupleId}/dreams/{dreamId}
                         → { title, details, category, owner, createdBy, createdAt }
```

`owner` is either a member uid (mine/theirs) or the string `"shared"`.

## Running locally

Firebase Auth needs an `http://` origin (not `file://`), so use a local server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

`localhost` is already an authorized domain in Firebase by default.

## Deploying

Hosted free on **GitHub Pages**. Every push to `main` auto-deploys within ~1 minute.

The GitHub Pages domain (`alexberns.github.io`) must be added to Firebase Console → Authentication → Settings → Authorized domains.

## Firebase setup checklist

If setting this up on a fresh Firebase project:

1. Create project at https://console.firebase.google.com
2. Build → **Firestore Database** → Create (production mode, `asia-northeast1`)
3. Build → **Authentication** → Get started → Email/Password → Enable
4. Authentication → Settings → Authorized domains → add your GitHub Pages domain
5. Project overview → register a Web app → copy the `firebaseConfig` into `firebase.js`
6. Firestore → Rules → paste `firestore.rules` content → Publish

## Progress

**Done**
- [x] Initial draft of the webapp structure (HTML / CSS / JS)
- [x] Add / edit / delete dreams with categories and ownership
- [x] Tab filtering (All / Mine / Theirs / Shared)
- [x] Mobile + desktop responsive layout
- [x] Renamed `OurDreams` → `weDream`
- [x] Bilingual EN / 日本語 with live switching
- [x] Pushed to GitHub and hosted on GitHub Pages
- [x] **Firebase backend** — Auth (email/password) + Firestore + real-time sync
- [x] **Couple pairing** via invite code
- [x] **Firestore security rules** so only paired partners can read each other's data

**Next up**
- [ ] Image generation for each dream via Gemini API (free tier) — likely as a Cloud Function so the API key stays server-side
- [ ] Photo uploads (Firebase Storage)
- [ ] Reactions / comments on each other's dreams
- [ ] Password reset flow
- [ ] PWA install (add to home screen)
- [ ] Account deletion + data export
