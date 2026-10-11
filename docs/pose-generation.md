# 追加ポーズの生成条件

2026年10月11日、Codexの組み込み画像生成ツールで追加。参照素材は `assets/003.png` と `assets/002.png`。人物の顔、帽子、服装、全身の比率を引き継ぎ、透明背景を指定した。元の3素材はそのまま保持している。

## 共通プロンプト

Use case: identity-preserve. Asset type: a new transparent full-body character PNG for the KOZO PHOTO camera compositing app. Input image 1 is the identity, clothes, proportions, and photographic style reference; input image 2 corroborates the same identity. Create exactly this same elderly Japanese man with the same recognizable smiling face, fine wrinkles, gray hair, navy Fishing Life cap with fish embroidery, pale sage polo shirt with small blue Japanese embroidery at the left chest, cream trousers, black athletic shoes, and black wristwatch on his left wrist. Preserve identity very closely. Natural realistic studio portrait, soft neutral lighting. Full body from cap through both complete shoes visible, centered in a portrait 2:3 canvas with small breathing room, consistent scale with the references. Exactly one man. Actual transparent alpha background with clean isolated edges, no backdrop, no glow or gradient halo, no floor or cast shadow, no border, no new text or accessories.

## 手を振る — assets/kozo-wave.png

Change only the pose: friendly smile, right hand lifted beside his head with an open palm and five natural fingers waving toward the viewer; left arm relaxed at his side. Face mostly frontal.

## おじぎ — assets/kozo-bow.png

Change only the pose: a polite modest Japanese bow, upper torso inclined forward about 20 degrees, both hands neatly resting together in front of his waist. Keep his face recognizable and visible, softly smiling and looking forward slightly downward. Feet together in a natural stable stance.

## 案内 — assets/kozo-guide.png

Change only the pose: friendly guide presenting something on the viewer's left, his right arm extended to that side at waist-to-chest height with relaxed open palm facing upward, elbow slightly bent. Left arm relaxed by his side. Face mostly frontal and smiling.
