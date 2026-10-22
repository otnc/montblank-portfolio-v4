# 運用

## 開発

```sh
npm ci
npm run dev      # フォントと画像を生成してから astro dev
npm run build    # フォントと画像を生成してから astro build
```

Node.js は 22.12 以上が必要です (Astro 7 の要件)。

手元で GitHub のセクションを表示するには、リポジトリ直下に `.dev.vars` (git 管理外) を置きます。

```sh
GITHUB_TOKEN=github_pat_...
```

## デプロイ

`main` にプッシュすると、GitHub Actions ([.github/workflows/deploy.yml](../.github/workflows/deploy.yml)) がビルドして、Cloudflare の `devuloper` アカウントにある Pages プロジェクト `montblank-portfolio` にデプロイします。プロジェクトがまだなければ、最初の実行で作ります。

Pages プロジェクトは直接アップロード型なので、Cloudflare 側の Git 連携は使いません。Actions から `wrangler pages deploy` を呼んでいます。

リポジトリに次の設定が必要です。

| 種類 | 名前 | 中身 |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare の API トークン (`devuloper` アカウントの Cloudflare Pages: Edit) |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | `devuloper` のアカウント ID (`48866beebe80d684ef2a7cb5764190a1`) |

手元からデプロイするときは、`devuloper` にログインした wrangler で `npm run deploy` を実行します。

## Pages の環境変数

| 名前 | 必須 | 用途 |
| --- | --- | --- |
| `GITHUB_TOKEN` | 必須 | GitHub GraphQL API のトークン。読み取り専用の fine-grained token (公開リポジトリの読み取りだけ) で足りる。ないと GitHub、Works、Contributions に案内が出る |

Secret として登録します。

```sh
npx wrangler pages secret put GITHUB_TOKEN --project-name montblank-portfolio
```

## ドメイン

| ドメイン | 扱い |
| --- | --- |
| `montblank.fun` | 正規のドメイン |
| `www.montblank.fun` | `montblank.fun` に 301 |

ゾーン `montblank.fun` は `devuloper` アカウントにあります。今は VPS (nginx) の portfolio-v3 を向いていて、新サイトが公開できる状態になってから DNS を Pages に向け直します。`blog.montblank.fun` など他のサブドメインは触りません。

転送は `src/worker.ts` が Astro より先に行います。`public/_routes.json` でページは全部 Worker を通します。

## OGP 画像、相互リンク用バナー、favicon

`npm run images` ([scripts/build-images.mjs](../scripts/build-images.mjs)) が次の画像を作ります。PixelMplus の字形で描き、アイコンは `public/avatar.png` をもとにします。今の絵柄は仮で、コンセプトが決まったら描き直します。

| ファイル | 大きさ | 用途 |
| --- | --- | --- |
| `public/thumbnail.png` | 1200x630 | OGP 画像 |
| `public/banners/normal.png` | 200x40 | 相互リンク用バナー |
| `public/favicon.svg`、`public/favicon.png` | 32x32 | favicon |

`npm run dev` と `npm run build` の前に毎回作り直します。生成物は git 管理外です。生成した画像は 4倍から8倍に拡大して目で確かめます。

## アイコン

アイコンは `public/avatar.png` (400x400) の1枚です。今は portfolio-v3 のアイコンを仮に置いています。差し替えるときは、この画像を置き換えて `npm run images` を実行します。線画なら明暗を強めてから置きます。小さいバナーと favicon は頭のまわりを切り抜いているので、構図が大きく変わったら `scripts/build-images.mjs` の `bannerAvatar` の切り抜き位置も合わせます。

## フォント

`fonts/pixelmplus/` の PixelMplus10 / PixelMplus12 から、`scripts/build-fonts.mjs` が2段のサブセットを作ります。

1. `PixelMplusNN`: `src/` のソースに出てくる文字だけ。普段はこれだけ読み込まれます。
2. `PixelMplusNN Extra`: 全文字を Unicode の範囲ごとに分けたもの。GitHub やフィードから取ってきた文など、1にない文字があるときだけ読み込まれます。

生成物 (`public/fonts/pixelmplus/`、`src/styles/pixelmplus.css`) は git 管理外です。

## ライセンス

コードは MIT ([LICENSE](../LICENSE))、文章と自作のドット絵は CC BY 4.0 ([CONTENT-LICENSE.md](../CONTENT-LICENSE.md)) です。アイコンの画像、各サービスのマーク、フォントは対象外です。外部素材の著作権表示は [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) にまとめています。
