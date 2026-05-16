# weDream ♥

> A little webapp for couples to share their dreams with each other — illustrated with AI, synced between phones, in English and Japanese.
>
> ふたりだけの夢のおきば。書いた夢にAIが絵をつけてくれて、相手の端末ともリアルタイムで共有できる小さなウェブアプリです。日本語と英語に対応しています。

**Live site / ライブサイト:** https://alexberns.github.io/myDream/

---

## ✨ Features / 機能

- **Pair via QR code** — one taps to create, the other scans to join. No email, no password. / QRコードでペアリング — メールもパスワードも不要。
- **AI-illustrated dreams** — every dream gets a soft pastel anime image via Pollinations.ai (free, unlimited). / すべての夢にパステル調アニメ風の画像をAIで生成（Pollinations.ai、無料・無制限）。
- **Real-time sync** between partners via Firebase Firestore. / Firebaseでパートナーとリアルタイム同期。
- **Categories**: travel, home, adventure, career, family, other. / カテゴリー：旅行、おうち、冒険、しごと、家族、その他。
- **EN / 日本語 toggle** — auto-detects browser language. / EN / 日本語切替（ブラウザの言語を自動判定）。
- **🌸 Sakura petals** drifting down the page, in a 90s shoujo manga aesthetic. / 90年代少女漫画風のデザインに、画面いっぱいに舞う桜の花びら。
- **Browser back/forward** — proper navigation between setup, app, QR screen. / ブラウザの戻る・進むボタンに対応。

## 🏗 Tech / 技術構成

Pure static site (HTML / CSS / JS) deployed on GitHub Pages. No build step.

| File | Purpose |
|---|---|
| `index.html` | Page structure (setup / app / QR / modal) |
| `style.css` | Mobile-first responsive styling, sakura animation |
| `app.js` | App logic, navigation, Firestore + Pollinations integration |
| `firebase.js` | Firebase init + anonymous auth |
| `i18n.js` | EN / 日本語 translations |
| `firestore.rules` | Firestore security rules |

### Data model / データモデル

```
couples/{8-char ID}              → { members: [name1, name2], createdAt }
couples/{ID}/dreams/{dreamId}    → { title, details, category, owner, imageUrl, createdAt }
```

`owner` is `"p1"`, `"p2"`, or `"shared"`. Couple ID acts as the shared secret.

## 🏃 Running locally / ローカルで動かす

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Firebase Anonymous Auth needs an `http://` origin (not `file://`), so use the server.

## 🚀 Deploying / デプロイ

Hosted free on **GitHub Pages**. Every push to `main` auto-deploys within ~1 minute.

## 🔥 Firebase setup / Firebaseの初期設定

1. Create project at https://console.firebase.google.com (or use existing `wedream-43204`)
2. Build → **Firestore Database** → Create (production mode, `asia-northeast1`)
3. Build → **Authentication** → Get started → **Anonymous** → Enable
4. Authentication → Settings → Authorized domains → add `alexberns.github.io`
5. Firestore → Rules → paste contents of `firestore.rules` → Publish
6. Project Overview → register a Web app → copy the `firebaseConfig` into `firebase.js`

## ⚠️ Prototype notes / プロトタイプの注意点

- Image generation uses **Pollinations.ai** (free, anonymous, no key). Generation can take 5–30 seconds — the dream card shows a shimmer placeholder while waiting.
- Firestore rules are intentionally permissive: any authenticated user can read/write any couple if they know the couple ID. The couple ID is the shared secret. Fine for prototype, tighten before going public.
- Images stored as base64 in Firestore docs (~200–500 KB each). Free tier handles many dozens of dreams per couple; for thousands, move to Firebase Storage.

## 🛤 Progress / 進捗

**Done / 完了**
- [x] Setup screen with sakura petals and 4 seeded example dreams / 桜の花びらと4つの例示夢が表示されるセットアップ画面
- [x] Pair via 8-char couple ID + QR code (no email needed) / 8文字のIDとQRコードでペアリング（メール不要）
- [x] Firebase Firestore real-time sync between partners / Firebaseでパートナーとリアルタイム同期
- [x] AI image generation via Pollinations.ai (anime style) / Pollinations.aiでアニメ風の画像をAI生成
- [x] EN / 日本語 with auto-detection and live switching / 日英切替（自動検出・即時反映）
- [x] Browser back/forward navigation + URL hash routing / ブラウザの戻る・進むボタン対応
- [x] Regenerate (↻) button on each dream card / 各夢カードに再生成ボタン

**Next / 次のステップ**
- [ ] Reactions / comments on each other's dreams / 夢へのリアクション・コメント
- [ ] Photo uploads (Firebase Storage) / 写真アップロード
- [ ] NFC tag deep-link option (Android) / NFCタグ対応（Android）
- [ ] PWA install (add to home screen) / PWA化（ホーム画面に追加）
- [ ] Tighter Firestore security rules before going public / 公開前にセキュリティルールを厳格化
