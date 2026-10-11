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

現在、人物PNGのコミットは確認できていません。透明背景の3枚を次の場所に追加してください。`poses.js` はこの配置を読み込む設定です。

| ポーズ | リポジトリ内のパス |
| --- | --- |
| 笑顔 | `assets/001.png` |
| ピース | `assets/002.png` |
| サムズアップ | `assets/003.png` |

[assetsフォルダー](https://github.com/issonokoto/KOZO-PHOTO/tree/main/assets) で **Add file → Upload files** を選び、3枚を追加して **Commit changes** まで進めてください。画像がコミットされると、利用者が素材を選ぶ必要はなくなります。

## 使い方

1. 公開URLをスマートフォンで開きます。
2. 「カメラを開く」で撮影するか、「写真を選ぶ」で背景を選びます。
3. 笑顔・ピース・サムズアップを選び、人物を配置します。
4. 指1本で移動、指2本で拡大・回転。PCではホイールで拡大縮小、Shift＋ホイールで回転できます。
5. シャッター／「保存」で写真を保存します。対応端末では共有メニューも使えます。

撮影・合成はブラウザー内で行います。撮影した写真を外部へ送信する処理はありません。共有ボタンは端末の共有メニューを開きます。

## 開発

Node.jsで `npm run check` を実行すると、JavaScriptの構文と画面要素の参照を確認できます。

別名のPNGを組み込む場合は、3枚を `incoming` フォルダーへ置いて `npm run assets` を実行してください。「老紳士」「ピース」「親指」などのファイル名、または `001.png`、`002.png`、`003.png` から判別し、画像と `poses.js` を更新します。

`npm run build` は、人物画像を配置したあとに、オフライン利用向けの `KOZO_PHOTO.html` を生成する追加機能です。GitHub Pagesの公開には不要です。

元の [dokodemo-nauru](https://github.com/issonokoto/dokodemo-nauru) のカメラ処理を基に独立させました。カメラ、写真読み込み、人物の配置、文字入れ、保存・共有に対応しています。

JavaScriptの構文と画面要素の参照は確認済みです。実機のカメラ・保存・iPhoneの共有動作は未確認です。
