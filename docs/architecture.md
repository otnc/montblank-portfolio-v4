# コードの構成

Astro 7 を `output: 'server'` で動かし、Cloudflare Pages に置いています。トップページはビルド時に静的な HTML にし (`prerender`)、GitHub と記事のデータの部分だけを server islands でリクエスト時に描きます。adapter は [astro-adapter-cloudflare-pages](https://www.npmjs.com/package/astro-adapter-cloudflare-pages) です。構成は otoneko.cat ([otnc-portfolio-v3](https://github.com/otnc/otnc-portfolio-v3)) に合わせています。

## ディレクトリ

```text
src/
├── pages/index.astro            部品を並べるだけ。ビルド時に静的な HTML になる
├── pages/links.astro            相互リンクの一覧と、相互リンクする方への情報。ビルド時に静的な HTML になる
├── pages/404.astro              見つからないページ
├── pages/pixel/[name].svg.ts    ドット絵の SVG をビルド時に dist/pixel/ へ書き出す
├── layouts/DuskLayout.astro     <head>、港の水面と石畳、フッター、共通スクリプト
├── components/
│   ├── dusk/
│   │   ├── Hero.astro               夕焼けの空、アイコン、名前、SNS アイコン
│   │   ├── DuskSky.astro            雲、一番星、カラス
│   │   ├── BayView.astro            函館山、ロープウェイ、元町の屋根、赤レンガ倉庫と運河、水面
│   │   ├── Marquee.astro            流れるメッセージ
│   │   ├── HarborLife.astro         港の水面の波、泳ぐイカ、カモメ
│   │   ├── SiteHeader.astro         画面上部に固定するヘッダー。ロゴ (トップへ)、Links、そのページのセクションへ飛ぶメニュー
│   │   ├── StonePath.astro          ウィンドウの下の石畳 (八幡坂の舗装)
│   │   ├── GasLamps.astro           石畳の道の両端のガス灯
│   │   ├── AboutWindow.astro        自己紹介、キャッチコピー、趣味・所属など、SNS
│   │   ├── BlogWindow.astro         記事のウィンドウの枠と各サイトへのリンク
│   │   ├── BlogPosts.astro          記事 (ブログ、Zenn、Qiita、note) の一覧 (server island)
│   │   ├── GithubWindow.astro       GitHub のウィンドウの枠
│   │   ├── GithubSummary.astro      GitHub の統計、全言語の割合、直近31日のグラフ (server island)
│   │   ├── WorksWindow.astro        作品のウィンドウの枠
│   │   ├── WorksList.astro          作品 (GitHub の pinned) の一覧 (server island)
│   │   ├── ContributionsWindow.astro  コントリビューションのウィンドウの枠
│   │   ├── ContributionsList.astro  他のリポジトリにマージされた PR の一覧 (server island)
│   │   ├── Loading.astro            server island が届くまでの「読み込み中」
│   │   ├── CareerWindow.astro       経歴
│   │   ├── CrossLinksWindow.astro   /links への入口と、相互リンクする方への情報
│   │   ├── LinkingInfo.astro        相互リンクする方への情報 (名前、サイト名、URL とコピーボタン) とアイコン・バナー。トップと /links で使う
│   │   ├── TramStop.astro           岸壁と市電の通り。市電が otoneko.cat への隠しリンク
│   │   ├── LanguageBar.astro        言語の割合のバー
│   │   ├── StatsColumn.astro        スター、マージ済み PR、Issue の数 (ドット絵のアイコン付き)
│   │   └── Window.astro             ウィンドウ枠と開くアニメーション
│   ├── Octocat.astro            手を振る octocat
│   └── PixelIcon.astro          16x16 のドット絵アイコン
├── scripts/                     ブラウザで動くスクリプト (アイコンのディザ、画面外での停止、誕生日 (11月2日、日本時間) だけ上がるドット絵の花火)
│   └── inline/                  HTML に直接書くスクリプト (表示時のアニメーション、流れるメッセージ、タイプライター)
├── data/
│   ├── profile.ts               名前、自己紹介、所属、経歴、アカウント、相互リンク、otoneko.cat の紹介文
│   ├── sections.ts              ヘッダーのメニューに出す、ページごとのセクションと id
│   ├── scene.ts                 背景のドット絵の色
│   ├── pixel-icons.ts           アカウントと記事サイトのドット絵、octocat
│   ├── pixel-files.ts           /pixel/ に静的ファイルとして出すドット絵の一覧
│   ├── bay-view.ts              函館山、元町、赤レンガ倉庫の景色と、明かりの位置
│   ├── tram.ts                  市電
│   ├── stone-path.ts            石畳のタイル
│   └── sprites.ts               繰り返し出る小さなドット絵 (ガス灯、波、スター、マージ、Issue、ピン)
├── lib/
│   ├── github.ts                GitHub の統計、作品、コントリビューション (トークンがあるとき、GraphQL)
│   ├── github-public.ts         同じものをトークンなしで取る
│   ├── feeds.ts                 ブログ、Zenn、Qiita、note の RSS / Atom
│   ├── cache.ts                 取得結果を Cloudflare のキャッシュに1時間置く
│   ├── cross-link-image.ts      相互リンク先の画像の URL (書いていなければ相手のページの OGP 画像やアイコン)
│   ├── pixel-grid.ts            コードで描くドット絵 (色の格子を SVG のパスにする)
│   ├── pixel-path.ts            小さなドット絵をパスにまとめる
│   └── format.ts                数と日付の表記
├── styles/
│   ├── dusk.css                 色のトークン、文字、ボタン、ページの列、凸凹の線、言語のバーと数の列
│   └── pixelmplus.css           フォントの @font-face (生成物、git 管理外)
├── worker.ts                    Pages の入口。www を montblank.fun に転送
└── env.d.ts                     Pages の環境変数の型
public/
├── _routes.json                 Worker を通すパス (静的ファイルは通さない)
├── icon.png                     アイコン
├── logo.png                     ロゴ (ヘッダー)
└── pixel/                       凸凹の線の SVG
fonts/pixelmplus/                フォントの元ファイルとライセンス
scripts/build-fonts.mjs          フォントのサブセット生成
scripts/build-images.mjs         OGP 画像、相互リンク用バナー、favicon の生成
```

## 背景のドット絵

景色は `src/lib/pixel-grid.ts` の `Grid` に色を塗って SVG にしています。1マスが 3px (1ドット) です。同じ色の横並びが上下に続くところは、1つの長方形にまとめて SVG を小さくします。

形が決まっているドット絵 (函館山とベイエリアの景色、市電、石畳、ガス灯、波、スターなどの繰り返し出るアイコン) は、otoneko.cat の `public/pixel/` と同じく静的ファイルにしています。`src/data/pixel-files.ts` に並べたものを `src/pages/pixel/[name].svg.ts` がビルド時に `/pixel/*.svg` として書き出し、部品は `<img>` か CSS の `url()` で読みます。HTML に毎回同じ SVG を入れずに済み、ブラウザもキャッシュできます。`/pixel/*` は `public/_routes.json` で Worker を通しません。ドット絵を足すときは `src/data/` に描き、`pixel-files.ts` に名前を足します。

動くもの (窓の明かり、ロープウェイ、波、船、カモメ) は、その上に重ねた要素を CSS の `steps()` で動かします。

色は `src/data/scene.ts` にまとめています。ヒーローの水面の色とページの水面の色 (`DuskLayout.astro`) は同じ値にして、境目を見せません。

## データの取得

トップページ (`src/pages/index.astro`) は `prerender` でビルド時に静的な HTML にし、Pages が Worker を動かさずに返します。外部 API の応答を待たないので、ページ全体がすぐ届きます。アプリ内ブラウザ (Twitter など) が、読み込みの終わらないページを表示できないことがあったためです。

GitHub と記事のデータを表示する部分だけは server islands (`server:defer`) にしています。ウィンドウの枠と見出しは静的な HTML に入れ、中身の一覧 (`BlogPosts`、`GithubSummary`、`WorksList`、`ContributionsList`) は、ページを開いた直後に Astro のスクリプトが `/_server-islands/*` へ取りに行きます。各 island の Worker がデータを取得して HTML を返し、届くまでは `Loading` の「読み込み中」を出します。4つの island は別々のリクエストなので、届いたものから表示されます。

server island の部品に `<style>` を書いても、その CSS はページにも island の応答にも入りません。island の中身のスタイルは、静的な枠の部品 (`BlogWindow` など) の `<style is:global>` に書きます。island の中でしか描かない `LanguageBar` と `StatsColumn` のスタイルは、3つのウィンドウで共通なので `src/styles/dusk.css` に置いています。

最初の画面に関わるスクリプト (スクロールで窓を開く処理、流れるメッセージ、タイプライター) は、`src/scripts/inline/` の JavaScript を `?raw` で読み込んで `<script is:inline>` として HTML に直接書いています。ヒーローのアイコンの窓は `Window` の `open` で、スクロールを待たずに最初から開きます。

取得結果は `src/lib/cache.ts` が Cloudflare のキャッシュ (Cache API) に1時間置くので、外部 API を呼ぶのはデータセンターごとに1時間1回です。キャッシュのキーは `https://montblank.fun/_cache/...` の形の URL ですが、キーとして使うだけで、そのパスには何も置いていません。Cache API は `*.pages.dev` では効かないので、そこでは毎回取得します。

取得に失敗したセクションは、ページ全体を落とさずにそのセクションだけ案内を出します (`orNull`)。記事は、取れたサイトの分だけ出します。

### GitHub

Pages の環境変数 `GITHUB_TOKEN` があるかどうかで取り方を変えます。

| セクション | トークンあり (`github.ts`、GraphQL) | トークンなし (`github-public.ts`、portfolio-v3 と同じ取り方) |
| --- | --- | --- |
| 統計 | `user` の followers、自分の公開リポジトリ (フォーク以外) の数とスターの合計と言語ごとのバイト数、`contributionsCollection` (年ごとのエイリアスで全期間を合計、直近31日) | REST の `/users/otnc` と `/users/otnc/repos`、[github-contributions-api.jogruber.de](https://github-contributions-api.jogruber.de) (全期間の年ごとの合計と日別の数を1回で取れる。落ちていたら github.com のカレンダーを年ごとに読む)。言語はリポジトリの大きさを主言語に足すだけなので、割合はおおよそ |
| Works | `pinnedItems` と、スター順の自分のリポジトリ (ピン留め以外の上位9件)。リポジトリ全体のマージ済み PR 数と Issue 数も取る | pinned.berrysauce.dev と REST のリポジトリ一覧。ピン留め以外は主言語だけで、PR 数と Issue 数は出さない (`-`) |
| Contributions | `search` で `type:pr author:otnc is:merged -user:otnc` と `type:issue author:otnc -user:otnc` を検索し、リポジトリごとにマージ済み PR と Issue を数える。スター数と言語は検索結果に付いてくる | REST の検索 (最大10ページずつ) と ungh.cc のスター数。言語は出さない |

GitHub の GraphQL は1回の応答に数秒かかる (2026-11-25 の計測で、言語付きのリポジトリ100件や検索結果100件で 2〜4 秒) ので、順番に待たずに並行して取ります。統計は、作った順の古い側と新しい側の100件ずつを同時に取り、200件までなら1回分の時間で全リポジトリがそろいます。Contributions の検索は、先に件数だけを取り、全ページを同時に取ります。検索のカーソルが今は `cursor:<位置>` の base64 なのを使っています。GitHub がこの形式を変えたら、1ページ目の結果で気づいて、ページを順番にたどる取り方に戻ります。キャッシュがないときの GitHub の取得は、合計で約17秒から約4秒になりました。

GraphQL にしたのは、リクエスト数を抑えるためです。Pages の Worker は1リクエストあたりの外部リクエスト数に上限があり、REST の Search API には短時間の連続呼び出しの制限 (secondary rate limit) もあります。トークンなしの取り方は外部リクエストが多く、未認証の REST は IP ごとに1時間60回までなので、本番ではトークンを設定します。


### トークンなしで使える非公式 API (2026-10-23 に調べた結果)

| API | 取れるもの | 使い方 |
| --- | --- | --- |
| [pinned.berrysauce.dev](https://pinned.berrysauce.dev) | ピン留めリポジトリ (説明、主言語、スター数) | Works で使う |
| [ungh.cc](https://ungh.cc) | ユーザー、リポジトリ一覧、リポジトリごとのスター数。キャッシュ付きでレート制限は実質なし。言語、Website 欄、フォークかどうかは取れない | Contributions のスター数で使う |
| [github-contributions-api.jogruber.de](https://github-contributions-api.jogruber.de) | 全期間の年ごとのコントリビューション数と日別の数 | 統計で使う |
| gh-pinned-repos.egoist.dev | (Deno Deploy Classic の終了で動いていない) | 使わない |

### ピン留め以外の Works の言語の割合

トークンがあるときは、ピン留めと同じ GraphQL の1回のクエリで全部の言語のバイト数が取れるので、追加の負担なく正確に出しています。

トークンがないときは、ピン留め以外 (9件) は主言語だけにしています。正確に出すには REST の `/languages` を1件ずつ呼ぶ必要があり、キャッシュが切れるたびに9回増えます。未認証の REST は IP ごとに1時間60回まで (Cloudflare では他のサイトと共有) で、Worker の1リクエストあたりの外部リクエスト数 (無料プランは50) も、トークンなしではすでに40前後使っているためです。トークンなしで Contributions のスター数を ungh.cc から取るのを20件までにしているのも、同じ理由です。

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

`src/data/profile.ts` の `crossLinks` に `{ author, url, image }` を足します。一覧は `/links` に出ます。相手が相互リンク用のバナーを用意していれば、`image` にその URL をそのまま書きます。`image` を省くと、ビルド時に `src/lib/cross-link-image.ts` が相手のページを取得し、`og:image`、`twitter:image`、`apple-touch-icon`、`icon` の順に見つかった画像の URL を使います。ページを取得できなければ画像なしで並べます。画像を出したくないときは `image: false` と書きます。画像の大きさは書かなくてよく、読み込んだときに横長 (幅が高さの1.5倍より大きい) ならバナー、そうでなければアイコンとして並べます。足す前に、相手のサイトの相互リンクのページなどで直リンクが禁止されていないかを確かめます。

### アカウントを足す

1. `src/data/pixel-icons.ts` に 16x16 のアイコンを足します。`rows` は16文字の行が16行で、`0` は透明、`1` 以降は `colors` の番号です。
2. `src/data/profile.ts` の `accounts` に `icon` 付きで足します。ヒーローと about.txt の両方に出ます。

### ウィンドウ (セクション) を足す

1. `src/components/dusk/` に部品を作り、中身を `Window` で包みます。`class="window--left"` か `window--right` で左右に少しずらします。
2. 部品のスタイルはその `.astro` の `<style>` に書きます。
3. `src/pages/index.astro` の `<main>` に並べます。
4. `src/data/sections.ts` に `{ id, label }` を足し、`Window` に同じ `id` を渡します。ヘッダーのメニューに出て、`#id` で飛べるようになります。
