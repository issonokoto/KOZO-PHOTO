# 胸元の表記修正

2026年10月11日。ユーザー提供の元写真の刺繍を基準に、Codexの組み込み画像生成ツールで文字部分を修正。

正しい表記は、上段「徳島県」、下段「クラゲ漁業組合」。下段は `ク・ラ・ゲ・漁・業・組・合` の7文字。「ゲ」は「ケ」に濁点が付いた字で、「ブ」と区別する。

修正対象は `assets/002.png`、`assets/003.png`、`assets/kozo-wave.png`、`assets/kozo-bow.png`、`assets/kozo-guide.png`、`assets/kozo-cheer.png`、`assets/kozo-point.png`、`assets/kozo-welcome.png`、`assets/kozo-heart.png`、`assets/kozo-salute.png`、`assets/kozo-arms-crossed.png`。笑顔の `assets/001.png` も含め、全12種類を胸元の拡大表示で確認する。

全12種類の上段・下段を拡大して目視確認済み。各PNGの1024×1536pxと透過背景も確認済み。

## 編集プロンプト

Use case: text-localization, extremely localized correction of Japanese embroidery. Image 1 is the EDIT TARGET: keep this exact cutout portrait, exact face, expression, cap, hands, pose, clothes, all garment folds, scale, framing, dimensions and transparency. Image 2 is only a REFERENCE for the correct blue Japanese chest lettering; do not copy its pose or background or regenerate the face. Change ONLY the small blue embroidery above the man's left breast pocket (viewer's right). Replace the wrong lettering with these two exact lines, in the same small navy-blue embroidered style and same location:
Line 1: "徳島県"
Line 2: "クラゲ漁業組合"
Verbatim characters in line 2: ク / ラ / ゲ / 漁 / 業 / 組 / 合. The third Katakana MUST be ゲ, which is ケ with dakuten; it MUST NOT be ブ. Render all seven characters clearly, with no missing strokes or extra characters. Use the correct Japanese kanji 徳 島 県 漁 業 組 合. Match the photographed embroidery in Image 2, with realistic fabric perspective, subtle stitching and dark blue color. Preserve the rest of image 1, especially the recognizable face and fists, unchanged. Keep a true transparent alpha background. No backdrop, gradients, labels, new text, branding, border or shadows. Return the full original portrait with ONLY this tiny chest text correction.

ハート・腕組みには次の条件を追加。

If an arm, hand or wristwatch naturally occludes part of the embroidery, keep that occlusion exactly; do not print letters over skin or a watch and do not move the limbs.

## 今後の素材追加時の確認

- 生成指示に上段・下段の正確な文字列を必ず含める。
- 胸元を拡大し、カタカナ3文字と漢字4文字を一文字ずつ確認する。
- 透過背景、全身の構図、本人の顔、手・腕による自然な重なりも確認する。
- 公開版と単体HTML版の両方を更新する。
