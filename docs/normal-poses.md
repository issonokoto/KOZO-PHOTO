# 普段着の定番ポーズ24種類を追加

いつもの紺色の帽子、淡いセージ色のポロシャツ、クリーム色のズボン、黒い靴のまま、記念写真に合わせやすい自然な仕草を追加しました。元の314種類を保ち、合計338種類・18ジャンル、うち「定番」は36ポーズです。

ジャンル「定番」で全36種類、検索「ノーマル」「普段着」「定番追加24」で今回の24種類を表示できます。

| ポーズ | 素材ID |
| --- | --- |
| 後ろで手を組む | normal-hands-back |
| 前で手を添える | normal-hands-front |
| 片手を腰に | normal-one-hand-hip |
| 両手を腰に | normal-both-hands-hips |
| 両手ピース | normal-double-peace |
| 両手グッド | normal-double-thumbs |
| 両手でバイバイ | normal-double-wave |
| 小さく手を振る | normal-small-wave |
| 指ハート | normal-finger-heart |
| オッケー | normal-okay |
| 考え中 | normal-thinking |
| 口元に手を添えて笑う | normal-laugh |
| 手を合わせてありがとう | normal-thanks |
| 拍手 | normal-clap |
| 胸に手を添える | normal-hand-chest |
| こちらへどうぞ | normal-beckon |
| 軽く会釈 | normal-small-nod |
| ゆっくり歩く | normal-walking |
| 左向きでにっこり | normal-turn-left |
| 右向きでにっこり | normal-turn-right |
| 左に寄り添う | normal-lean-left |
| 右に寄り添う | normal-lean-right |
| 空を見上げる | normal-look-up |
| 小さく応援 | normal-small-fist |

内蔵画像生成ツールで、元の幸造さんの画像 assets/003.png を顔・服装・体格の参照として1点ずつ生成しました。[全プロンプト](normal-poses-prompts.json)に共通条件と各ポーズの条件、[修正プロンプト](normal-poses-revisions.json)に右向き・右への寄り添いの方向調整を記録しています。背景は実際のアルファ透過で、頭・手・靴を含む全身を収めます。胸元の刺繍は上段「徳島県」、下段「クラゲ漁業組合」とし、全身と胸元の拡大画像を確認します。

透過PNG原本はローカル作業フォルダー output/normal24/originals/ に保管し、公開用は assets/library/normal-*.webp、一覧用は assets/thumbnails/normal-*.webp、単体HTML用は assets/offline/normal-*.webp に書き出します。解像度と透明部分は保ちます。

全24枚の透過・全身の収まりを検査し、全身と胸元の拡大画像を確認しました。PC・スマートフォン幅で24枚すべての選択、定番36種類のページ送り、検索、おまかせ選択、配置の維持、1200×1600の合成PNG保存、単体HTMLの追加素材選択を確認しています。既存314種類の登録内容は保持しています。
