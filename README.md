# KOZO PHOTO

徳島県クラゲ漁業組合 組合長 山仲幸造さんと、一緒に記念写真を撮るWebアプリ。

GitHub Pagesの公開先: **https://issonokoto.github.io/KOZO-PHOTO/**

## GitHubで公開する

このアプリはビルドなしで公開できます。リポジトリ直下の `index.html` が入口です。

1. [Settings → Pages](https://github.com/issonokoto/KOZO-PHOTO/settings/pages) を開きます。
2. **Source: Deploy from a branch** を選びます。
3. **Branch: main**、**Folder: / (root)** を選び、**Save** を押します。
4. GitHub Pagesの公開処理が完了すると、上記URLで使えます。

`.nojekyll` を同梱しています。JavaScript、CSS、画像は同じリポジトリから配信します。

## 人物画像

人物PNG12枚を同梱しています。`poses.js` は次の画像を自動で読み込む設定です。

| ポーズ | リポジトリ内のパス |
| --- | --- |
| 笑顔 | `assets/001.png` |
| ピース | `assets/002.png` |
| サムズアップ | `assets/003.png` |
| 手を振る | `assets/kozo-wave.png` |
| おじぎ | `assets/kozo-bow.png` |
| 案内 | `assets/kozo-guide.png` |
| ガッツポーズ | `assets/kozo-cheer.png` |
| 指さし | `assets/kozo-point.png` |
| 両手を広げる | `assets/kozo-welcome.png` |
| ハート | `assets/kozo-heart.png` |
| 敬礼 | `assets/kozo-salute.png` |
| 腕組み | `assets/kozo-arms-crossed.png` |

追加の9ポーズは元の人物画像を参照して生成した透過素材です。生成条件は [docs/pose-generation.md](docs/pose-generation.md) に記録しています。

人物画像は公開サイトから読み込むため、利用者が素材を選ぶ必要はありません。画像を差し替える場合は、assets内の同名PNGを更新してください。

## 使い方

1. 公開URLをスマートフォンで開きます。
2. 「カメラを開く」で撮影するか、「写真を選ぶ」で背景を選びます。
3. 12種類のポーズから選び、人物を配置します。ポーズを切り替えても配置・大きさ・回転は引き継ぎます。スマートフォンでは素材欄を上下にスクロールして、すべてのポーズを選べます。
4. 指1本で移動、指2本で拡大・回転。PCではホイールで拡大縮小、Shift＋ホイールで回転できます。
5. シャッター／「保存」で写真を保存します。対応端末では共有メニューも使えます。

撮影・合成はブラウザー内で行います。撮影した写真を外部へ送信する処理はありません。共有ボタンは端末の共有メニューを開きます。

## 開発

Node.jsで `npm run check` を実行すると、JavaScriptの構文と画面要素の参照を確認できます。

別名のPNGで元の3ポーズを差し替える場合は、3枚を `incoming` フォルダーへ置いて `npm run assets` を実行してください。「老紳士」「ピース」「親指」などのファイル名、または `001.png`、`002.png`、`003.png` から判別し、画像と `poses.js` を更新します。追加のポーズは保持します。ポーズをさらに増やす場合はPNGを `assets` に置き、`poses.js` に `id`、`name`、`src` を追加します。

`npm run build` は、人物画像を配置したあとに、オフライン利用向けの `KOZO_PHOTO.html` を生成する追加機能です。GitHub Pagesの公開には不要です。

元の [dokodemo-nauru](https://github.com/issonokoto/dokodemo-nauru) のカメラ処理を基に独立させました。カメラ、写真読み込み、人物の配置、文字入れ、保存・共有に対応しています。

JavaScriptの構文と画面要素の参照は確認済みです。実機のカメラ・保存・iPhoneの共有動作は未確認です。
