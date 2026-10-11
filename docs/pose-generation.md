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

## 第2回追加分の共通プロンプト

同日に6ポーズをさらに追加。組み込み画像生成ツールと、同じ2枚の参照素材を使用。

Use case: identity-preserve. Asset type: a new transparent full-body character PNG for the KOZO PHOTO camera compositing app. Input image 1 is the identity, clothes, proportions, and photographic style reference; input image 2 corroborates the same identity. Create exactly this same elderly Japanese man with the same recognizable smiling face, fine wrinkles, gray hair, navy Fishing Life cap with fish embroidery, pale sage polo shirt with small blue Japanese embroidery at the left chest, cream trousers, black athletic shoes, and black wristwatch on his left wrist. Preserve identity very closely. Natural realistic studio portrait, soft neutral lighting. Full body from cap through both complete shoes visible, centered in a portrait 2:3 canvas with breathing room; keep all hands and feet entirely inside the canvas. Exactly one man. Actual transparent alpha background with clean isolated edges, no backdrop, no glow or gradient halo, no floor or cast shadow, no border, no new text or accessories.

## ガッツポーズ — assets/kozo-cheer.png

Change only the pose: an enthusiastic but natural cheerful victory pose, both elbows bent and both hands in comfortable fists raised beside his shoulders, warmly smiling at the viewer. Five natural fingers per hand, no awkward muscle flexing.

## 指さし — assets/kozo-point.png

Change only the pose: standing upright and smiling at the viewer, right arm extended diagonally toward the viewer's left, right index finger pointing outward to the left, remaining fingers curled naturally, thumb visible. Left arm relaxed at his side.

## 両手を広げる — assets/kozo-welcome.png

Change only the pose: a friendly welcoming gesture, both arms comfortably opened outward with elbows slightly bent and both palms facing upward, as if inviting someone to join a commemorative photo. Front-facing and smiling. Keep the entire outstretched hands in frame.

## ハート — assets/kozo-heart.png

Change only the pose: warmly smiling at the viewer while forming one clear heart shape with both hands together in front of his upper chest, thumbs forming the lower point and curved index fingers forming the top of the heart. Natural five-finger hands with believable anatomy.

## 敬礼 — assets/kozo-salute.png

Change only the pose: a playful friendly salute, right hand held flat and naturally tilted at the right brim of his navy cap, fingers together, elbow outward. Left arm relaxed at his side. Same warm smiling face and cap.

## 腕組み — assets/kozo-arms-crossed.png

Change only the pose: relaxed arms gently crossed in front of his chest, left hand resting on the opposite upper arm and right hand tucked naturally beneath the opposite arm. Upright stance with both feet visible, warm confident friendly smile, not stern.
