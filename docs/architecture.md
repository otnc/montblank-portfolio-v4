# コードの構成

Astro 7 を SSR (`output: 'server'`) で動かし、Cloudflare Pages に置いています。adapter は [astro-adapter-cloudflare-pages](https://www.npmjs.com/package/astro-adapter-cloudflare-pages) です。構成は otoneko.cat ([otnc-portfolio-v3](https://github.com/otnc/otnc-portfolio-v3)) に合わせています。

## ディレクトリ

```text
src/
├── pages/index.astro            データを取得し、部品を並べるだけ
├── pages/404.astro              見つからないページ
├── layouts/DuskLayout.astro     <head>、ヘッダー、港の水面と石畳、フッター、共通スクリプト
├── components/
│   ├── dusk/
│   │   ├── Hero.astro               夕焼けの空、アイコン、名前、SNS アイコン
│   │   ├── DuskSky.astro            雲、一番星、カラス
│   │   ├── BayView.astro            函館山、ロープウェイ、元町の屋根、赤レンガ倉庫と運河、水面
│   │   ├── Marquee.astro            流れるメッセージ
│   │   ├── HarborLife.astro         港の水面の波、泳ぐイカ、カモメ
│   │   ├── StonePath.astro          ウィンドウの下の石畳 (八幡坂の舗装)
│   │   ├── AboutWindow.astro        自己紹介、キャッチコピー、趣味・所属など、SNS
│   │   ├── BlogWindow.astro         記事 (ブログ、Zenn、Qiita、note)
│   │   ├── GithubWindow.astro       GitHub の統計、全言語の割合、直近31日のグラフ
│   │   ├── WorksWindow.astro        作品 (GitHub の pinned)
│   │   ├── ContributionsWindow.astro  他のリポジトリにマージされた PR
│   │   ├── CareerWindow.astro       経歴
│   │   ├── CrossLinksWindow.astro   相互リンク、申請、このサイトのバナー
│   │   ├── TramStop.astro           岸壁と市電の通り。otoneko.cat への入口
│   │   ├── LanguageBar.astro        言語の割合のバー
│   │   └── Window.astro             ウィンドウ枠と開くアニメーション
│   ├── Octocat.astro            手を振る octocat
│   └── PixelIcon.astro          16x16 のドット絵アイコン
├── scripts/                     ブラウザで動くスクリプト (アイコンのディザ、表示時のアニメーション、画面外での停止、バナー、タイプライター)
├── data/
│   ├── profile.ts               名前、自己紹介、所属、経歴、アカウント、相互リンク、otoneko.cat の紹介文
│   ├── scene.ts                 背景のドット絵の色
│   └── pixel-icons.ts           アカウントと記事サイトのドット絵、octocat
├── lib/
│   ├── github.ts                GitHub の統計、作品、コントリビューション (トークンがあるとき、GraphQL)
│   ├── github-public.ts         同じものをトークンなしで取る
│   ├── feeds.ts                 ブログ、Zenn、Qiita、note の RSS / Atom
│   ├── cache.ts                 取得結果を Cloudflare のキャッシュに1時間置く
│   ├── pixel-grid.ts            コードで描くドット絵 (色の格子を SVG のパスにする)
│   ├── pixel-path.ts            小さなドット絵をパスにまとめる
│   └── format.ts                数と日付の表記
├── styles/
│   ├── dusk.css                 色のトークン、文字、ボタン、ページの列、凸凹の線
│   └── pixelmplus.css           フォントの @font-face (生成物、git 管理外)
├── worker.ts                    Pages の入口。www を montblank.fun に転送
└── env.d.ts                     Pages の環境変数の型
public/
├── _routes.json                 Worker を通すパス (静的ファイルは通さない)
├── icon.png                     アイコン
└── pixel/                       凸凹の線の SVG
fonts/pixelmplus/                フォントの元ファイルとライセンス
scripts/build-fonts.mjs          フォントのサブセット生成
scripts/build-images.mjs         OGP 画像、相互リンク用バナー、favicon の生成
```

## 背景のドット絵

景色は画像ファイルではなく、`src/lib/pixel-grid.ts` の `Grid` に色を塗ってビルド時に SVG にしています (`BayView`、`TramStop`、`StonePath` など)。1マスが 3px (1ドット) です。動くもの (窓の明かり、ロープウェイ、波、船、カモメ) は、その上に重ねた要素を CSS の `steps()` で動かします。

色は `src/data/scene.ts` にまとめています。ヒーローの水面の色とページの水面の色 (`DuskLayout.astro`) は同じ値にして、境目を見せません。

## データの取得

`src/pages/index.astro` がリクエストのたびに4つを並行して取得します。結果は `src/lib/cache.ts` が Cloudflare のキャッシュ (Cache API) に1時間置くので、外部 API を呼ぶのはデータセンターごとに1時間1回です。Cache API は `*.pages.dev` では効かないので、そこでは毎回取得します。

取得に失敗したセクションは、ページ全体を落とさずにそのセクションだけ案内を出します (`orNull`)。記事は、取れたサイトの分だけ出します。

### GitHub

Pages の環境変数 `GITHUB_TOKEN` があるかどうかで取り方を変えます。

| セクション | トークンあり (`github.ts`、GraphQL) | トークンなし (`github-public.ts`、portfolio-v3 と同じ取り方) |
| --- | --- | --- |
| 統計 | `user` の followers、自分の公開リポジトリ (フォーク以外) の数とスターの合計と言語ごとのバイト数、`contributionsCollection` (年ごとのエイリアスで全期間を合計、直近31日) | REST の `/users/otnc` と `/users/otnc/repos`、github.com のコントリビューションのカレンダー (年ごと)。言語はリポジトリの大きさを主言語に足すだけなので、割合はおおよそ |
| Works | `pinnedItems` | pinned.berrysauce.dev、Website 欄はリポジトリ一覧、言語は REST の `/languages` |
| Contributions | `search` (`type:pr author:otnc is:merged -user:otnc`)。スター数と言語は検索結果に付いてくる | REST の検索 (最大2ページ) と ungh.cc のスター数。言語は出さない |

GraphQL にしたのは、リクエスト数を抑えるためです。Pages の Worker は1リクエストあたりの外部リクエスト数に上限があり、REST の Search API には短時間の連続呼び出しの制限 (secondary rate limit) もあります。トークンなしの取り方は外部リクエストが多く、未認証の REST は IP ごとに1時間60回までなので、本番ではトークンを設定します。

### 足した技術

| 技術 | 理由 |
| --- | --- |
| fast-xml-parser | RSS / Atom の解析。Worker で動く純粋な JavaScript で、今の portfolio-v3 でも使っていた |

## よくある変更

### 文言を変える

`src/data/profile.ts` を直します。新しい文字 (特に漢字) を使うとフォントの生成対象が変わりますが、`npm run dev` と `npm run build` は先にフォントを作り直すので、特別な作業はいりません。

### 経歴を足す

`src/data/profile.ts` の `career` の先頭に足します (新しい順)。`lines` は1行ずつ表示されます。`category` は `work` (学歴・職歴)、`project` (開発)、`award` (受賞) です。

### 相互リンクを足す

`src/data/profile.ts` の `crossLinks` に `{ author, url }` を足します。画像は相手のサイトの OGP 画像かアイコンを高さ 120px に縮めて `public/partners/` に置き、`banner: { src, width, height }` で指定します (表示は半分の大きさ)。大きな元画像を直リンクすると重くなるので、必ず縮めて置きます。

### アカウントを足す

1. `src/data/pixel-icons.ts` に 16x16 のアイコンを足します。`rows` は16文字の行が16行で、`0` は透明、`1` 以降は `colors` の番号です。
2. `src/data/profile.ts` の `accounts` に `icon` 付きで足します。ヒーローと about.txt の両方に出ます。

### ウィンドウ (セクション) を足す

1. `src/components/dusk/` に部品を作り、中身を `Window` で包みます。`class="window--left"` か `window--right` で左右に少しずらします。
2. 部品のスタイルはその `.astro` の `<style>` に書きます。
3. `src/pages/index.astro` の `<main>` に並べます。
