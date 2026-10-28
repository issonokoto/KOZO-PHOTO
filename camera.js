import { renderTextCanvas } from './text.js';
import { BUNDLED_POSES } from './poses.js?v=20261028-jobs24';
import { BUNDLED_FRAMES, drawPhotoFrame } from './frames.js?v=20261027-frames';
const ASSET_VERSION = '20261012-library';
function assetUrl(src, version = ASSET_VERSION) {
  if (!src) return null;
  const source = new URL(src, import.meta.url);
  if (source.protocol === 'https:' || source.protocol === 'http:') source.searchParams.set('v', version);
  return source.href;
}
const CHARACTERS = BUNDLED_POSES.map(pose => {
  return {
    ...pose,
    name: pose.name || ({ smile: '笑顔', peace: 'ピース', thumb: 'サムズアップ' })[pose.id] || pose.id,
    category: pose.category || '定番',
    tags: pose.tags || [],
    src: assetUrl(pose.src),
    thumbnail: assetUrl(pose.thumbnail || pose.src)
  };
});
const $ = id => document.getElementById(id);
const FRAMES = BUNDLED_FRAMES.map(frame => ({ ...frame, src: assetUrl(frame.src, '20261027-frames'), thumbnail: assetUrl(frame.thumbnail, '20261027-frames') }));
const frameCanvas = $('frame-layer');
let currentFrame = null;
let frameImage = null;
let frameLoading = false;
let frameSelectionSequence = 0;
let frameListSignature = '';
const stage = $('camera-stage');
const video = $('camera-video');
let backgroundImage = $('background-image');
const layers = {
  logo: { element: $('logo-layer'), x: .79, y: .87, size: .3, rotation: 0, flip: false }
};
const creditCanvas = $('credit-layer');
const CREDIT_TEXT = '';
const MAX_CHARACTERS = 3;
const characters = [];
const texts = [];
const MAX_TEXTS = 3;
let nextTextId = 1;
let nextCharacterId = 1;
const state = { selected: null, mode: 'camera', backgroundUrl: null, backgroundType: 'image/jpeg', backgroundSequence: 0, overlaySequence: 0, overlayLoading: false, facing: 'environment', stream: null, opening: false, captureBusy: false, captureSequence: 0, shapeSequence: 0, shapeLoading: false, sequence: 0, blob: null, saveUrl: null, fileName: '' };
let currentPose = null;
let lastCapturePose = null;
let poseLayer = null;
let poseSelectionSequence = 0;
const POSE_PAGE_SIZE = 24;
let poseLimit = POSE_PAGE_SIZE;
let poseListSignature = '';
const poseUrls = new Map();
const pointers = new Map();
let gesture = null;
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
const compactTools = matchMedia('(max-width: 1100px), (pointer: coarse), (orientation: landscape) and (max-height: 600px)');
let openTool = null;
const toolTitles = { materials: '人物', frames: 'フレーム', text: '文字', placement: '配置・名前' };
function renderToolPanel() {
  const compact = compactTools.matches;
  if (!compact) openTool = null;
  if (compact && openTool) document.body.dataset.toolOpen = openTool;
  else delete document.body.dataset.toolOpen;
  const panel = $('controls-panel');
  panel.inert = compact && !openTool;
  if (compact) panel.setAttribute('aria-hidden', String(!openTool));
  else panel.removeAttribute('aria-hidden');
  for (const section of panel.querySelectorAll('[data-tool-page]')) section.hidden = compact && section.dataset.toolPage !== openTool;
  for (const button of $('tool-launcher').querySelectorAll('button')) button.setAttribute('aria-expanded', String(compact && button.dataset.openTool === openTool));
  $('tool-sheet-title').textContent = toolTitles[openTool] || '写真の設定';
}
function closeTools(focusTarget = null) {
  const previous = openTool;
  openTool = null; renderToolPanel();
  if (compactTools.matches && focusTarget) focusTarget.focus({ preventScroll: true });
  else if (compactTools.matches && $('controls-panel').contains(document.activeElement)) {
    $('tool-launcher').querySelector(`[data-open-tool="${previous}"]`)?.focus({ preventScroll: true });
  }
}
for (const button of $('tool-launcher').querySelectorAll('button')) button.addEventListener('click', () => {
  if (openTool === button.dataset.openTool) { closeTools(button); return; }
  openTool = button.dataset.openTool; renderToolPanel(); $('close-tools').focus({ preventScroll: true });
});
$('close-tools').addEventListener('click', () => closeTools());
document.addEventListener('pointerdown', event => {
  // Keep the shutter in place between pointerdown and click when a tool is open.
  if (openTool && !event.target.closest('#controls-panel, #tool-launcher, #camera-stage, .shutter-bar, dialog')) closeTools();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && openTool && !document.querySelector('dialog[open]')) {
    if (!fullscreenElement()) event.preventDefault();
    closeTools();
  }
});
let sheetSwipe = null;
$('tool-sheet-head').addEventListener('pointerdown', event => {
  if (event.target.closest('button')) return;
  sheetSwipe = { id: event.pointerId, y: event.clientY };
  $('tool-sheet-head').setPointerCapture(event.pointerId);
});
$('tool-sheet-head').addEventListener('pointerup', event => {
  if (sheetSwipe?.id === event.pointerId && event.clientY - sheetSwipe.y > 40) closeTools();
  sheetSwipe = null;
});
$('tool-sheet-head').addEventListener('pointercancel', () => { sheetSwipe = null; });
compactTools.addEventListener('change', renderToolPanel);
renderToolPanel();

// Fullscreen the document so camera overlays and modal dialogs remain available.
const fullscreenButton = $('toggle-fullscreen');
const appDisplayModes = [matchMedia('(display-mode: standalone)'), matchMedia('(display-mode: fullscreen)')];
let fullscreenBusy = false;
let fullscreenOrientationSession = null;
const orientationFallbackMessage = 'この端末では全画面中も、スマホの回転設定に従います。';
function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement;
}
function releaseFullscreenOrientation() {
  const session = fullscreenOrientationSession;
  if (!session) return;
  fullscreenOrientationSession = null;
  // Also cancel an in-flight lock request when fullscreen ends.
  if (session.requested) {
    try { screen.orientation.unlock(); } catch { /* The browser can also release it on exit. */ }
  }
  if (session.previousStatus && $('camera-status').textContent === orientationFallbackMessage) {
    status(session.previousStatus.message, session.previousStatus.error);
  }
}
function showOrientationFallback(session) {
  if (fullscreenOrientationSession !== session || !matchMedia('(pointer: coarse)').matches) return;
  const message = $('camera-status');
  session.previousStatus = { message: message.textContent, error: message.classList.contains('error') };
  status(orientationFallbackMessage);
}
async function syncFullscreenOrientation() {
  // Manifest fullscreen counts, while a normal tab or standalone window keeps
  // the device's default policy. Do not set a global manifest orientation.
  const fullscreen = Boolean(fullscreenElement()) || appDisplayModes[1].matches;
  if (!fullscreen || document.visibilityState !== 'visible') { releaseFullscreenOrientation(); return; }
  if (fullscreenOrientationSession) return;
  const session = { requested: false };
  fullscreenOrientationSession = session;
  const orientation = screen.orientation;
  if (typeof orientation?.lock !== 'function' || typeof orientation?.unlock !== 'function') {
    showOrientationFallback(session); return;
  }
  session.requested = true;
  try {
    // "any" allows both portrait and landscape instead of fixing one direction.
    await orientation.lock('any');
  } catch {
    showOrientationFallback(session);
  }
  // A browser may resolve a request after the user has already left fullscreen.
  // Do not release a newer fullscreen session during a quick exit/re-entry.
  if (fullscreenOrientationSession !== session && !fullscreenOrientationSession) {
    try { orientation.unlock(); } catch { /* No active lock remains in supported browsers. */ }
  }
}
function renderFullscreenButton() {
  const active = Boolean(fullscreenElement());
  fullscreenButton.hidden = !active && (navigator.standalone === true || appDisplayModes.some(mode => mode.matches));
  fullscreenButton.textContent = active ? '解除' : '全画面';
  fullscreenButton.setAttribute('aria-pressed', String(active));
  fullscreenButton.setAttribute('aria-label', active ? '全画面を解除' : '全画面にする');
  fullscreenButton.disabled = fullscreenBusy;
}
async function toggleFullscreen() {
  if (fullscreenBusy) return;
  fullscreenBusy = true; renderFullscreenButton();
  try {
    if (fullscreenElement()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else await document.webkitExitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      // The call must stay inside the user's click, before any asynchronous work.
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } else if (document.documentElement.webkitRequestFullscreen) {
      await document.documentElement.webkitRequestFullscreen();
    } else {
      $('fullscreen-help').showModal();
    }
  } catch {
    if (!fullscreenElement() && !$('fullscreen-help').open) $('fullscreen-help').showModal();
    else if (fullscreenElement()) status('全画面を解除できませんでした。端末の戻る操作やEscキーでも解除できます。', true);
  } finally {
    fullscreenBusy = false; renderFullscreenButton();
  }
}
fullscreenButton.addEventListener('click', toggleFullscreen);
$('close-fullscreen-help').addEventListener('click', () => $('fullscreen-help').close());
for (const eventName of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(eventName, () => {
  renderFullscreenButton(); syncFullscreenOrientation(); requestAnimationFrame(fitStage);
});
for (const mode of appDisplayModes) mode.addEventListener('change', () => {
  renderFullscreenButton(); syncFullscreenOrientation();
});
document.addEventListener('visibilitychange', syncFullscreenOrientation);
window.addEventListener('pagehide', releaseFullscreenOrientation);
window.addEventListener('pageshow', syncFullscreenOrientation);
renderFullscreenButton(); syncFullscreenOrientation();

function renderFramePreview() {
  frameCanvas.hidden = !frameImage;
  frameCanvas.dataset.frameId = currentFrame || '';
  if (!frameImage) return;
  const { width, height } = stage.getBoundingClientRect();
  if (!width || !height) return;
  const scale = Math.min(devicePixelRatio || 1, 2, 1600 / Math.max(width, height));
  frameCanvas.width = Math.max(1, Math.round(width * scale));
  frameCanvas.height = Math.max(1, Math.round(height * scale));
  drawPhotoFrame(frameCanvas.getContext('2d', { colorSpace: 'srgb', colorType: 'unorm8' }), frameImage, frameCanvas.width, frameCanvas.height);
}
function filteredFrames() {
  const filter = $('frame-filter').value;
  if (filter === 'now') {
    const month = new Date().getMonth() + 1;
    return FRAMES.filter(frame => frame.group === 'seasonal' && frame.months.includes(month));
  }
  if (filter.startsWith('group:')) return FRAMES.filter(frame => frame.group === filter.slice(6));
  if (filter.startsWith('category:')) return FRAMES.filter(frame => frame.categories.includes(filter.slice(9)));
  return FRAMES;
}
function prepareFrameFilter() {
  const select = $('frame-filter');
  if (select.options.length) return;
  const add = (parent, value, label, count) => {
    const option = document.createElement('option'); option.value = value; option.textContent = `${label}（${count}）`; parent.append(option);
  };
  const month = new Date().getMonth() + 1;
  add(select, '', 'すべての枠', FRAMES.length);
  add(select, 'now', '今の季節', FRAMES.filter(frame => frame.group === 'seasonal' && frame.months.includes(month)).length);
  for (const [id, label] of [['seasonal', '季節・行事'], ['category', 'カテゴリー向け'], ['local', '徳島・クラゲ']]) {
    add(select, `group:${id}`, label, FRAMES.filter(frame => frame.group === id).length);
  }
  const categories = document.createElement('optgroup'); categories.label = '素材のジャンルに合わせる';
  for (const category of [...new Set(CHARACTERS.map(pose => pose.category))]) {
    const count = FRAMES.filter(frame => frame.categories.includes(category)).length;
    if (count) add(categories, `category:${category}`, category, count);
  }
  select.append(categories);
}
function renderFrameChoices() {
  prepareFrameFilter();
  $('frame-count').textContent = `${FRAMES.length}種類`;
  const list = $('frame-list');
  const frames = filteredFrames();
  const signature = JSON.stringify(frames.map(frame => frame.id));
  if (signature !== frameListSignature) {
    frameListSignature = signature; list.replaceChildren();
    for (const frame of [{ id: '', name: '枠なし' }, ...frames]) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'frame-choice'; button.dataset.frameId = frame.id;
      button.setAttribute('aria-label', frame.name);
      if (frame.thumbnail) {
        const image = new Image(); image.src = frame.thumbnail; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
        button.append(image);
      } else {
        const preview = document.createElement('span'); preview.className = 'frame-empty-preview'; preview.textContent = '—'; preview.setAttribute('aria-hidden', 'true');
        button.append(preview);
      }
      const label = document.createElement('span'); label.textContent = frame.label || frame.name; button.append(label);
      button.addEventListener('click', () => selectFrame(frame.id)); list.append(button);
    }
  }
  for (const button of list.children) button.setAttribute('aria-pressed', String(button.dataset.frameId === (currentFrame || '')));
  list.setAttribute('aria-label', `写真のフレーム（${frames.length}種類）`);
  list.setAttribute('aria-busy', String(frameLoading));
}
$('frame-filter').addEventListener('change', renderFrameChoices);
async function selectFrame(id) {
  const sequence = ++frameSelectionSequence;
  if (!id) {
    currentFrame = null; frameImage = null; frameLoading = false;
    renderFramePreview(); renderFrameChoices(); $('frame-status').textContent = '枠なし';
    $('capture-photo').disabled = state.captureBusy || !sourceReady();
    return;
  }
  const frame = FRAMES.find(item => item.id === id);
  if (!frame) return;
  frameLoading = true; renderFrameChoices(); $('capture-photo').disabled = true;
  $('frame-status').textContent = `${frame.name}を準備しています…`;
  const image = new Image(); image.src = frame.src;
  let timer;
  try {
    await Promise.race([image.decode(), new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 12000); })]);
    if (sequence !== frameSelectionSequence) return;
    currentFrame = frame.id; frameImage = image; renderFramePreview();
    $('frame-status').textContent = `${frame.name}を選びました。`;
  } catch {
    if (sequence === frameSelectionSequence) $('frame-status').textContent = 'フレームを開けませんでした。もう一度選んでください。';
  } finally {
    clearTimeout(timer);
    if (sequence === frameSelectionSequence) {
      frameLoading = false; renderFrameChoices(); $('capture-photo').disabled = state.captureBusy || !sourceReady();
    }
  }
}
$('choose-frame').addEventListener('click', () => {
  if (compactTools.matches) {
    openTool = 'frames'; renderToolPanel(); $('close-tools').focus({ preventScroll: true });
  } else {
    $('frame-section').scrollIntoView({ block: 'start' });
    $('frame-list').querySelector('button').focus({ preventScroll: true });
  }
});

function status(message, error = false) {
  $('camera-status').textContent = message;
  $('camera-status').classList.toggle('error', error);
}
function layerSizeLimits(id) {
  return { min: texts.includes(id) ? .001 : .08, max: characters.includes(id) ? 6 : 1.1 };
}
function moveLayer(id, x, y) {
  const layer = layers[id];
  if (!characters.includes(id)) {
    layer.x = clamp(x, 0, 1); layer.y = clamp(y, 0, 1);
    return;
  }
  const bounds = stage.getBoundingClientRect();
  const ratio = bounds.width / (bounds.height || bounds.width || 1);
  const image = layer.element;
  const aspect = (image.naturalHeight || image.height || 1) / (image.naturalWidth || image.width || 1);
  const angle = layer.rotation * Math.PI / 180;
  const cosine = Math.abs(Math.cos(angle)), sine = Math.abs(Math.sin(angle));
  const halfWidth = layer.size * (cosine + sine * aspect) / 2;
  const halfHeight = layer.size * ratio * (sine + cosine * aspect) / 2;
  // The center can leave the frame for close-ups. Keep a small part reachable.
  const visibleX = Math.min(.05, halfWidth), visibleY = Math.min(.05, halfHeight);
  layer.x = clamp(x, visibleX - halfWidth, 1 + halfWidth - visibleX);
  layer.y = clamp(y, visibleY - halfHeight, 1 + halfHeight - visibleY);
}
function resizeLayer(id, size) {
  const limits = layerSizeLimits(id);
  const layer = layers[id];
  layer.size = clamp(size, limits.min, limits.max);
  moveLayer(id, layer.x, layer.y);
}
function renderLayers() {
  const selected = layers[state.selected];
  $('layer-size').disabled = !selected;
  $('layer-rotation').disabled = !selected;
  if (selected) {
    const limits = layerSizeLimits(state.selected);
    $('layer-size').min = limits.min * 100;
    $('layer-size').max = Math.round(limits.max * 100);
    $('layer-size').step = texts.includes(state.selected) ? .1 : 1;
    $('layer-size').value = Math.round(selected.size * 100);
    $('size-value').textContent = Math.round(selected.size * 100) + '%';
    $('layer-rotation').value = Math.round(selected.rotation);
    $('rotation-value').textContent = Math.round(selected.rotation) + '°';
  }
  for (const [id, layer] of Object.entries(layers)) {
    Object.assign(layer.element.style, {
      left: `${layer.x * 100}%`, top: `${layer.y * 100}%`, width: `${layer.size * 100}%`,
      transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scaleX(${layer.flip ? -1 : 1})`
    });
    layer.element.classList.toggle('selected', state.selected === id);
  }
  layers.logo.element.hidden = !$('show-logo').checked;
  creditCanvas.hidden = !characters.some(id => layers[id].requiresCredit);
  video.classList.toggle('mirrored', state.facing === 'user' && $('mirror-selfie').checked);
}
function selectLayer(id) {
  if (id && !layers[id]) return;
  if (id === 'logo' && !$('show-logo').checked) return;
  if (state.selected !== id) clearGesture();
  state.selected = id;
  syncControls();
  renderLayers();
}
function syncControls() {
  $('select-logo').setAttribute('aria-pressed', String(state.selected === 'logo'));
  $('select-logo').disabled = !$('show-logo').checked;
  $('flip-layer').disabled = !state.selected;
  $('remove-character').disabled = !characters.includes(state.selected) && !texts.includes(state.selected);
  $('edit-text').hidden = !texts.includes(state.selected);
  $('reset-layer').hidden = !characters.includes(state.selected);
  $('selected-name').textContent = state.selected === 'logo' ? '名前' : layers[state.selected]?.element.alt || '幸造さんを選んでね';
  for (const button of document.querySelectorAll('#placed-characters button, #placed-texts .placed-text-choice')) button.setAttribute('aria-pressed', String(button.dataset.layerId === state.selected));
}
function searchKey(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
}
function filteredPoses() {
  const terms = searchKey($('pose-search').value).trim().split(/\s+/).filter(Boolean);
  const category = $('pose-category').value;
  return CHARACTERS.filter(pose => (!category || pose.category === category) && terms.every(term => searchKey([pose.name, pose.id, pose.category, ...pose.tags].join(' ')).includes(term)));
}
function renderCharacters() {
  const list = $('character-list');
  list.classList.toggle('many-poses', CHARACTERS.length > 9);
  $('pose-count').textContent = `${CHARACTERS.length}種類`;
  const matches = filteredPoses();
  const visible = matches.slice(0, poseLimit);
  $('pose-result-count').textContent = `${matches.length}種類中 ${visible.length}種類を表示`;
  $('pose-empty').hidden = matches.length !== 0;
  $('more-poses').hidden = visible.length >= matches.length;
  $('more-poses').textContent = `もっと見る（あと${matches.length - visible.length}種類）`;
  $('random-pose').disabled = matches.length === 0;
  const signature = JSON.stringify(visible.map(pose => [pose.id, pose.src, pose.thumbnail]));
  // Selecting a pose keeps the focused card, scroll position, and decoded thumbnails.
  if (signature === poseListSignature) {
    for (const button of list.children) button.setAttribute('aria-pressed', String(currentPose === button.dataset.characterId));
    return;
  }
  poseListSignature = signature;
  list.replaceChildren();
  for (const character of visible) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'character-choice';
    button.dataset.characterId = character.id;
    button.setAttribute('aria-label', `${character.name}に切り替える`);
    const image = new Image();
    image.loading = 'lazy'; image.decoding = 'async';
    image.width = 160; image.height = 240;
    if (character.src) image.src = character.thumbnail || character.src;
    else { image.src = './assets/pose-placeholder.svg'; button.disabled = true; }
    image.alt = '';
    const name = document.createElement('span');
    name.textContent = character.name;
    button.append(image, name);
    button.setAttribute('aria-pressed', String(currentPose === character.id));
    button.addEventListener('click', () => selectPose(character));
    list.append(button);
  }
}
for (const category of [...new Set(CHARACTERS.map(pose => pose.category))]) {
  const option = document.createElement('option'); option.value = category; option.textContent = category;
  $('pose-category').append(option);
}
function filterPoses() { poseLimit = POSE_PAGE_SIZE; renderCharacters(); }
$('pose-search').addEventListener('input', filterPoses);
$('pose-category').addEventListener('change', filterPoses);
$('clear-pose-search').addEventListener('click', () => {
  $('pose-search').value = ''; $('pose-category').value = ''; filterPoses(); $('pose-search').focus({preventScroll: true});
});
$('more-poses').addEventListener('click', () => { poseLimit += POSE_PAGE_SIZE; renderCharacters(); });
function chooseRandomPose(poses, previous = currentPose) {
  const candidates = poses.filter(pose => pose.id !== previous);
  const choices = candidates.length ? candidates : poses;
  return choices[Math.floor(Math.random() * choices.length)];
}
$('random-pose').addEventListener('click', () => {
  const pose = chooseRandomPose(filteredPoses());
  if (pose) selectPose(pose);
});
$('random-on-capture').addEventListener('change', () => {
  updateShutterLabel();
  status($('random-on-capture').checked ? '撮るまで衣装はお楽しみ。位置・大きさは今の幸造さんに合わせてください。' : '選んだ幸造さんと一緒に撮れます。');
});
function renderPlacements() {
  const list = $('placed-characters');
  list.replaceChildren();
  characters.forEach((id, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'placed-choice';
    button.dataset.layerId = id;
    const name = `${index + 1} ${layers[id].element.alt}`;
    button.setAttribute('aria-label', `${name}を編集`);
    button.title = name;
    const image = new Image();
    image.src = layers[id].element.src;
    image.alt = '';
    const label = document.createElement('span');
    label.textContent = name;
    button.append(image, label);
    button.addEventListener('click', () => selectLayer(id));
    list.append(button);
  });
  for (let i = characters.length; i < MAX_CHARACTERS; i++) {
    const slot = document.createElement('span');
    slot.className = 'empty-slot';
    slot.textContent = '＋ 追加できます';
    list.append(slot);
  }
  const full = characters.length === MAX_CHARACTERS;
  $('character-count').textContent = `${characters.length} / 3枚`;
  $('character-list').querySelectorAll('button').forEach(button => { button.disabled = !CHARACTERS.find(p => p.id === button.dataset.characterId)?.src; });
  $('add-overlay-image').disabled = full || state.overlayLoading;

  $('add-text').disabled = texts.length >= MAX_TEXTS;
  const textList = $('placed-texts'); textList.replaceChildren(); textList.hidden = !texts.length;
  for (const [index, id] of texts.entries()) {
    const row = document.createElement('div'); row.className = 'placed-text-row';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'placed-text-choice'; button.dataset.layerId = id;
    const content = layers[id].text.content.replace(/\n/g, ' ');
    const name = `${index + 1} ${content}`; button.textContent = `T ${name}`; button.title = name; button.setAttribute('aria-label', `文字${name}を編集`);
    button.addEventListener('click', () => { selectLayer(id); openTextEditor(id); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-delete-button'; remove.dataset.deleteText = id;
    remove.textContent = '削除'; remove.setAttribute('aria-label', `文字「${content}」を削除`);
    remove.addEventListener('click', () => deleteText(id));
    row.append(button, remove); textList.append(row);
  }
  syncControls();
}
function addCharacter(character, preparedImage = null, objectUrl = null) {
  if (characters.length >= MAX_CHARACTERS) return;
  const id = `character-${nextCharacterId++}`;
  const image = preparedImage || new Image();
  image.id = id;
  image.className = 'photo-layer character-layer';
  image.dataset.layerId = id;
  if (!preparedImage) image.src = character.src;
  image.alt = character.name;
  image.draggable = false;
  image.tabIndex = 0;
  image.title = 'ドラッグで移動・ホイールで拡大縮小・Shift＋ホイールで回転';
  // DOM order and export order stay identical, with the logo above every character.
  stage.insertBefore(image, texts.length ? layers[texts[0]].element : layers.logo.element);
  layers[id] = { element: image, objectUrl, requiresCredit: false, x: [.5, .22, .78][characters.length], y: .62, size: characters.length ? .3 : .38, rotation: 0, flip: false };
  characters.push(id);
  selectLayer(id);
  renderPlacements();
  if (openTool) closeTools(image);
  image.decode().catch(() => { if (layers[id]) status('画像を読み込めませんでした。削除して、もう一度追加してください。', true); });
}
function removeCharacter(id = state.selected) {
  const items = characters.includes(id) ? characters : texts;
  if (!items.includes(id)) return;
  clearGesture();
  const index = items.indexOf(id);
  items.splice(index, 1);
  layers[id].element.remove();
  if (layers[id].objectUrl) URL.revokeObjectURL(layers[id].objectUrl);
  delete layers[id];
  selectLayer(state.selected !== id ? state.selected : items[Math.min(index, items.length - 1)] || characters[0] || texts[0] || ($('show-logo').checked ? 'logo' : null));
  renderPlacements();
}
function fitStage() {
  clearGesture();
  const shell = stage.parentElement;
  const ratio = state.mode === 'image' && backgroundImage.naturalWidth ? backgroundImage.naturalWidth / backgroundImage.naturalHeight : matchMedia('(orientation: portrait)').matches ? 3 / 4 : 4 / 3;
  const width = Math.max(0, Math.min(shell.clientWidth - 2, (shell.clientHeight - 2) * ratio));
  stage.style.width = `${width}px`;
  stage.style.height = `${width / ratio}px`;
  const credit = creditPlacement(ratio);
  Object.assign(creditCanvas.style, { left: `${credit.x * 100}%`, top: `${credit.y * 100}%`, width: `${credit.size * 100}%` });
  renderLayers();
  renderFramePreview();
}
function creditPlacement(ratio) {
  const creditRatio = creditCanvas.height / creditCanvas.width;
  const size = Math.min(.34, .4 / (ratio * creditRatio));
  return { size, x: .98 - size / 2, y: .98 - size * creditRatio * ratio / 2 };
}
function drawCredit(context, width, height) {
  if (!characters.some(id => layers[id].requiresCredit)) return;
  // Character copyright is independent of editable layers and DOM visibility.
  const credit = creditPlacement(width / height);
  const drawWidth = width * credit.size;
  const drawHeight = drawWidth * creditCanvas.height / creditCanvas.width;
  context.drawImage(creditCanvas, width * credit.x - drawWidth / 2, height * credit.y - drawHeight / 2, drawWidth, drawHeight);
}
function prepareCredit() {
  const canvas = creditCanvas;
  const context = canvas.getContext('2d', { colorSpace: 'srgb', colorType: 'unorm8' });
  const font = '600 96px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.font = font;
  canvas.width = Math.ceil(context.measureText(CREDIT_TEXT).width) + 40;
  canvas.height = 144;
  context.font = font;
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 6;
  context.strokeStyle = '#000a';
  context.fillStyle = '#fff';
  context.strokeText(CREDIT_TEXT, 20, canvas.height / 2);
  context.fillText(CREDIT_TEXT, 20, canvas.height / 2);
}
function sourceReady() {
  return !frameLoading && (state.mode === 'image' ? !!backgroundImage.naturalWidth : !!state.stream && video.readyState >= 2);
}
function setSourceMode(mode) {
  state.mode = mode;
  document.body.dataset.mode = mode;
  backgroundImage.hidden = mode !== 'image';
  video.hidden = mode === 'image';
  $('use-camera').setAttribute('aria-pressed', String(mode === 'camera'));
  $('choose-background').setAttribute('aria-pressed', String(mode === 'image'));
  updateShutterLabel();
  $('switch-camera').textContent = mode === 'image' ? '画像を変更' : state.facing === 'user' ? '↻ アウトカメラへ' : '↻ インカメラへ';
  $('switch-camera').disabled = mode === 'camera' && !state.stream;
  $('mirror-selfie').disabled = mode === 'image';
  $('capture-photo').disabled = !sourceReady();
  $('camera-placeholder').hidden = mode === 'image' || !!state.stream;
  $('photo-title').textContent = mode === 'image' ? 'できあがり！' : '一緒に撮れた！';
  $('retake-photo').textContent = mode === 'image' ? '編集に戻る' : '撮り直す';
  fitStage();
}
async function readLocalImage(file) {
  const sourceUrl = URL.createObjectURL(file);
  const source = new Image();
  source.src = sourceUrl;
  let normalizedUrl = null;
  let canvas = null;
  try {
    await source.decode();
    if (!source.naturalWidth || !source.naturalHeight) throw new Error();
    // Never put the uploaded HDR source in the DOM. Freeze its decoded colours
    // in an SDR bitmap before display so HDR gain maps cannot dim other layers.
    const scale = Math.min(1, 4096 / Math.max(source.naturalWidth, source.naturalHeight));
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
    const context = canvas.getContext('2d', { colorSpace: 'srgb', colorType: 'unorm8' });
    if (!context) throw new Error();
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    // PNG retains transparency and pixel values without carrying the source's
    // HDR gain map. Final JPEG/PNG output still follows the background file type.
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error();
    normalizedUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.src = normalizedUrl;
    await image.decode();
    return { image, url: normalizedUrl };
  } catch (_) {
    if (normalizedUrl) URL.revokeObjectURL(normalizedUrl);
    throw new Error('この画像を開けませんでした。JPEG・PNGなどの画像でお試しください。');
  } finally {
    URL.revokeObjectURL(sourceUrl);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
async function openBackground(file) {
  if (!file) return;
  const sequence = ++state.backgroundSequence;
  status('画像を開いています…');
  try {
    const { image, url } = await readLocalImage(file);
    if (sequence !== state.backgroundSequence) { URL.revokeObjectURL(url); return; }
    ++state.sequence;
    state.opening = false;
    $('start-camera').disabled = false;
    stopCamera();
    image.id = 'background-image';
    image.alt = '背景に選んだ画像';
    image.draggable = false;
    backgroundImage.replaceWith(image);
    backgroundImage = image;
    if (state.backgroundUrl) URL.revokeObjectURL(state.backgroundUrl);
    state.backgroundUrl = url;
    state.backgroundType = /^image\/jpe?g$/i.test(file.type) ? 'image/jpeg' : 'image/png';
    setSourceMode('image');
    status('写真を編集しています · 幸造さんを置いて「完成」');
  } catch (error) { if (sequence === state.backgroundSequence) status(error.message, true); }
}
async function openOverlay(file) {
  if (!file || characters.length >= MAX_CHARACTERS) return;
  const sequence = ++state.overlaySequence;
  state.overlayLoading = true;
  renderPlacements();
  try {
    const { image, url } = await readLocalImage(file);
    if (sequence !== state.overlaySequence || characters.length >= MAX_CHARACTERS) { URL.revokeObjectURL(url); return; }
    addCharacter({ name: file.name.replace(/\.[^.]+$/, '') || '追加画像' }, image, url);
  } catch (error) { if (sequence === state.overlaySequence) status(error.message, true); }
  finally { if (sequence === state.overlaySequence) { state.overlayLoading = false; renderPlacements(); } }
}

function stopCamera() {
  state.stream?.getTracks().forEach(track => track.stop());
  state.stream = null;
  video.srcObject = null;
  $('capture-photo').disabled = !sourceReady();
  $('switch-camera').disabled = state.mode === 'camera';
}
function cameraError(error) {
  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'カメラが許可されていません。ブラウザのサイト設定でカメラを許可し、もう一度開いてください。';
  if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') return 'このカメラを利用できません。別のカメラで試してください。';
  if (error.name === 'NotReadableError') return 'カメラを開けませんでした。他のカメラアプリを閉じてから試してください。';
  return 'カメラを開けませんでした。もう一度試してください。';
}
async function openCamera(facing = state.facing, exact = false) {
  if (state.opening) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    status('カメラにはHTTPSでの接続が必要です。対応ブラウザで開いてください。', true);
    return;
  }
  state.opening = true;
  ++state.backgroundSequence;
  setSourceMode('camera');
  const sequence = ++state.sequence;
  $('start-camera').disabled = true;
  stopCamera();
  status('カメラを開いています…');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { [exact ? 'exact' : 'ideal']: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
    if (sequence !== state.sequence || document.visibilityState === 'hidden') { stream.getTracks().forEach(track => track.stop()); return; }
    state.stream = stream;
    state.facing = stream.getVideoTracks()[0].getSettings().facingMode || facing;
    video.srcObject = stream;
    await video.play();
    if (sequence !== state.sequence) return;
    $('camera-placeholder').hidden = true;
    $('capture-photo').disabled = !sourceReady();
    $('switch-camera').disabled = false;
    $('switch-camera').textContent = state.facing === 'user' ? '↻ アウトカメラへ' : '↻ インカメラへ';
    renderLayers();
    status(`${state.facing === 'user' ? 'インカメラ' : 'アウトカメラ'}で撮影中 · 写真は端末内で処理します。`);
  } catch (error) {
    if (sequence !== state.sequence) return;
    stopCamera();
    $('camera-placeholder').hidden = false;
    status(cameraError(error), true);
  } finally {
    if (sequence === state.sequence) {
      state.opening = false;
      $('start-camera').disabled = false;
    }
  }
}

// One shared layer transform drives the preview and exported image. Normalize
// positions to the stage so resizing or device rotation doesn't alter placement.
function updateShutterLabel() {
  const random = $('random-on-capture').checked;
  $('capture-photo').setAttribute('aria-label', random ? 'ランダムの幸造さんと一緒に撮る' : state.mode === 'image' ? '合成画像を作る' : '写真を撮る');
  $('capture-photo').querySelector('span').textContent = random ? 'おまかせ' : state.mode === 'image' ? '完成' : '';
}
function drawLayer(context, layer, width, height) {
  const image = layer.element;
  if (image.hidden) return;
  const isCanvas = image instanceof HTMLCanvasElement;
  if (!isCanvas && (!image.complete || !image.naturalWidth)) throw new Error('画像の読み込みを待って、もう一度撮影してください。');
  const drawWidth = width * layer.size;
  const drawHeight = drawWidth * (isCanvas ? image.height / image.width : image.naturalHeight / image.naturalWidth);
  context.save();
  context.translate(width * layer.x, height * layer.y);
  context.rotate(layer.rotation * Math.PI / 180);
  context.scale(layer.flip ? -1 : 1, 1);
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();
}
function clearSavedPhoto() {
  const image = $('saved-photo'), link = $('save-photo');
  image.onload = null; image.onerror = null; image.hidden = true; image.removeAttribute('src');
  $('captured-photo').hidden = false;
  link.removeAttribute('href'); link.removeAttribute('download');
  link.setAttribute('aria-disabled', 'true'); link.tabIndex = -1;
  if (state.saveUrl) {
    const previousUrl = state.saveUrl;
    state.saveUrl = null;
    setTimeout(() => URL.revokeObjectURL(previousUrl), 120000);
  }
}
function prepareSavedPhoto(blob, sequence) {
  const url = URL.createObjectURL(blob);
  state.saveUrl = url;
  const image = $('saved-photo');
  image.onload = () => {
    if (sequence !== state.captureSequence || state.saveUrl !== url) return;
    image.hidden = false; $('captured-photo').hidden = true;
  };
  image.onerror = () => {
    if (sequence === state.captureSequence) $('photo-status').textContent = '保存用の画像を表示できませんでした。「画像を保存」または共有をお試しください。';
  };
  image.src = url;
  // Prepare a real link before the tap. Chrome handles its trusted activation
  // directly; no script-created click or asynchronous work starts the download.
  const link = $('save-photo');
  link.href = url; link.download = state.fileName;
  link.setAttribute('aria-disabled', 'false'); link.tabIndex = 0;
}
async function capturePhoto() {
  if (!sourceReady() || state.captureBusy || (state.mode === 'camera' && !video.videoWidth)) return;
  const sequence = ++state.captureSequence;
  const capturedFrame = frameImage;
  state.captureBusy = true;
  $('capture-photo').disabled = true;
  clearSavedPhoto();
  $('share-photo').disabled = true;
  $('share-photo').hidden = true;
  state.blob = null;
  const captureControls = [document.querySelector('.camera-layout'), document.querySelector('.header-actions'), $('tool-launcher')];
  for (const element of captureControls) element.inert = true;
  try {
    clearGesture();
    const bounds = stage.getBoundingClientRect();
    const fromImage = state.mode === 'image';
    const ratio = fromImage ? backgroundImage.naturalWidth / backgroundImage.naturalHeight : bounds.width / bounds.height;
    // Match object-fit: cover exactly. Never upscale beyond the camera frame.
    const source = fromImage ? backgroundImage : video;
    const fullWidth = fromImage ? backgroundImage.naturalWidth : video.videoWidth;
    const fullHeight = fromImage ? backgroundImage.naturalHeight : video.videoHeight;
    let sourceWidth = fullWidth;
    let sourceHeight = fullHeight;
    if (sourceWidth / sourceHeight > ratio) sourceWidth = sourceHeight * ratio;
    else sourceHeight = sourceWidth / ratio;
    const scale = Math.min(1, (fromImage ? 4096 : 2048) / Math.max(sourceWidth, sourceHeight));
    const canvas = $('captured-photo');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext('2d', { colorSpace: 'srgb', colorType: 'unorm8' });
    context.save();
    if (!fromImage && state.facing === 'user' && $('mirror-selfie').checked) { context.translate(canvas.width, 0); context.scale(-1, 1); }
    context.drawImage(source, (fullWidth - sourceWidth) / 2, (fullHeight - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    context.restore();
    let randomPose = null;
    let randomLayer = null;
    if ($('random-on-capture').checked) {
      if (!poseLayer || !layers[poseLayer]) throw new Error('ランダムで撮るには、幸造さんを1人配置してください。');
      randomPose = chooseRandomPose(CHARACTERS.filter(pose => pose.src), lastCapturePose || currentPose);
      if (!randomPose) throw new Error('素材を読み込んでから、もう一度撮影してください。');
      status('撮った写真に、幸造さんが登場します…');
      const image = new Image(); image.src = randomPose.src;
      let timer;
      try {
        await Promise.race([image.decode(), new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 12000); })]);
      } catch { throw new Error('ランダム素材を開けませんでした。もう一度撮影してください。'); }
      finally { clearTimeout(timer); }
      if (sequence !== state.captureSequence) return;
      // The user's frame was frozen at the shutter press, before image loading.
      // Substitute only the exported Kozo layer; keep the placement preview intact.
      randomLayer = {...layers[poseLayer], element: image};
    }
    for (const id of [...characters, ...texts]) drawLayer(context, id === poseLayer && randomLayer ? randomLayer : layers[id], canvas.width, canvas.height);
    drawLayer(context, layers.logo, canvas.width, canvas.height);
    drawPhotoFrame(context, capturedFrame, canvas.width, canvas.height);
    drawCredit(context, canvas.width, canvas.height);
    // Paint the frozen, fully composed frame before any JPEG encoding. Keep
    // the same canvas for preview and save, so no decode or extra copy is needed.
    $('photo-status').textContent = `${canvas.width} × ${canvas.height}px・保存用の画像を準備しています…`;
    $('photo-dialog').showModal();
    video.pause();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (sequence !== state.captureSequence) return;
    const outputType = fromImage ? state.backgroundType : 'image/jpeg';
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('画像の作成に失敗しました。')), outputType, .94));
    if (sequence !== state.captureSequence) return;
    state.blob = blob;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    state.fileName = `kohzo-photo-${fromImage ? 'image' : 'camera'}-${stamp}.${outputType === 'image/png' ? 'png' : 'jpg'}`;
    if (randomPose) lastCapturePose = randomPose.id;
    $('photo-status').textContent = `${randomPose ? '今回の幸造さん：' + randomPose.name + ' · ' : ''}${canvas.width} × ${canvas.height}px・保存が始まらない場合は、完成画像を長押し（PCは右クリック）して保存できます。`;
    prepareSavedPhoto(blob, sequence);
    let canShare = false;
    try {
      const file = new File([blob], state.fileName, { type: blob.type });
      canShare = Boolean(navigator.share && navigator.canShare?.({ files: [file] }));
    } catch { /* Optional sharing must not disable image downloads. */ }
    $('share-photo').hidden = !canShare;
    $('share-photo').disabled = false;
  } catch (error) {
    if (sequence !== state.captureSequence) return;
    const message = error.message || '写真を作成できませんでした。もう一度試してください。';
    if ($('photo-dialog').open) $('photo-status').textContent = `${message}「撮り直す」で再度お試しください。`;
    else status(message, true);
  } finally {
    for (const element of captureControls) element.inert = false;
    if (sequence === state.captureSequence) {
      state.captureBusy = false;
      $('capture-photo').disabled = !sourceReady();
    }
  }
}

function beginGesture() {
  const points = [...pointers.values()];
  if (!points.length || !layers[state.selected]) { gesture = null; return; }
  const layer = layers[state.selected];
  const a = points[0], b = points[1] || a;
  gesture = { id: state.selected, x: layer.x, y: layer.y, size: layer.size, rotation: layer.rotation, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, distance: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
}
function clearGesture() {
  for (const id of pointers.keys()) if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
  pointers.clear();
  gesture = null;
  Object.values(layers).forEach(layer => layer.element.classList.remove('dragging'));
}
stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || pointers.size >= 2) return;
    const id = pointers.size ? state.selected : event.target.dataset.layerId;
    if (!id || !layers[id] || layers[id].element.hidden) return;
    event.preventDefault();
    selectLayer(id);
    const layer = layers[id];
    layer.element.focus({ preventScroll: true });
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    layer.element.classList.add('dragging');
    beginGesture();
});
stage.addEventListener('keydown', event => {
    const id = event.target.dataset.layerId;
    if (!layers[id]) return;
    const layer = layers[id];
    const movement = { ArrowLeft: [-.01, 0], ArrowRight: [.01, 0], ArrowUp: [0, -.01], ArrowDown: [0, .01] }[event.key];
    if (!movement && !['Delete', '+', '=', '-', '[', ']'].includes(event.key)) return;
    event.preventDefault();
    selectLayer(id);
    if (event.key === 'Delete') { removeCharacter(); return; }
    if (movement) {
      moveLayer(id, layer.x + movement[0], layer.y + movement[1]);
    } else if (event.key === '[' || event.key === ']') {
      layer.rotation += event.key === '[' ? -5 : 5;
    } else resizeLayer(id, layer.size * (event.key === '-' ? .95 : 1.05));
    renderLayers();
});
stage.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId) || !gesture) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const points = [...pointers.values()];
  const a = points[0], b = points[1] || a;
  const bounds = stage.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const layer = layers[gesture.id];
  if (points.length > 1 && gesture.distance > 0) {
    const limits = layerSizeLimits(gesture.id);
    layer.size = clamp(gesture.size * Math.hypot(b.x - a.x, b.y - a.y) / gesture.distance, limits.min, limits.max);
    const degrees = gesture.rotation + (Math.atan2(b.y - a.y, b.x - a.x) - gesture.angle) * 180 / Math.PI;
    layer.rotation = ((degrees + 180) % 360 + 360) % 360 - 180;
  }
  moveLayer(gesture.id, gesture.x + ((a.x + b.x) / 2 - gesture.cx) / bounds.width,
    gesture.y + ((a.y + b.y) / 2 - gesture.cy) / bounds.height);
  renderLayers();
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(eventName, event => {
  pointers.delete(event.pointerId);
  if (!pointers.size) Object.values(layers).forEach(layer => layer.element.classList.remove('dragging'));
  beginGesture();
});
stage.addEventListener('wheel', event => {
  const id = event.target.dataset.layerId;
  if (!layers[id]) return;
  event.preventDefault();
  selectLayer(id);
  if (event.shiftKey) layers[id].rotation += event.deltaY > 0 ? 5 : -5;
  else resizeLayer(id, layers[id].size * (event.deltaY > 0 ? .95 : 1.05));
  renderLayers();
}, { passive: false });

const textEditor = { target: null, sequence: 0, bitmap: null, draft: null };
let lastTextStyle = { content: '幸造さんと記念写真', font: 'gothic', direction: 'horizontal', color: '#ffffff', effect: 'plain', outline: true, outlineColor: '#000000' };
function textDraft() {
  return { content: $('text-content').value, font: $('text-font').value, direction: $('text-direction').value, color: $('text-color').value, effect: $('text-effect').value, outline: $('text-outline').checked, outlineColor: $('text-outline-color').value };
}
async function previewText() {
  const sequence = ++textEditor.sequence;
  textEditor.bitmap = null; $('apply-text').disabled = true; $('text-outline-color').disabled = !$('text-outline').checked;
  $('text-message').textContent = '文字の仕上がりを準備しています…';
  const draft = textDraft();
  document.querySelector('.text-preview-box').dataset.direction = draft.direction;
  try {
    const bitmap = await renderTextCanvas(draft);
    if (sequence !== textEditor.sequence || !$('text-dialog').open) return;
    const canvas = $('text-preview'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext('2d', { colorSpace: 'srgb', colorType: 'unorm8' }).drawImage(bitmap, 0, 0); textEditor.bitmap = bitmap; textEditor.draft = draft;
    $('apply-text').disabled = false; $('text-message').textContent = '文字を置いたあと、指で移動・2本で拡大／回転できます。';
  } catch (_) {
    if (sequence !== textEditor.sequence || !$('text-dialog').open) return;
    $('text-preview').getContext('2d', { colorSpace: 'srgb', colorType: 'unorm8' }).clearRect(0, 0, $('text-preview').width, $('text-preview').height);
    $('text-message').textContent = !draft.content.trim() ? '文字を入力してください。' : draft.content.split('\n').length > 6 ? '改行は6行（縦書きは6列）までにしてください。' : draft.content.length > 120 ? '文字は120文字以内で入力してください。' : '文字を準備できませんでした。フォントを選び直して再度お試しください。';
  }
}
function openTextEditor(id = null) {
  if (!id && texts.length >= MAX_TEXTS) return;
  textEditor.target = id;
  const draft = id ? layers[id].text : lastTextStyle;
  $('text-direction').value = draft.direction || 'horizontal'; $('text-content').value = draft.content; $('text-font').value = draft.font; $('text-color').value = draft.color;
  $('text-effect').value = draft.effect; $('text-outline').checked = draft.outline; $('text-outline-color').value = draft.outlineColor;
  $('text-title').textContent = id ? '文字を編集' : '文字を追加'; $('apply-text').textContent = id ? '変更する' : '追加する';
  $('delete-text').hidden = !id;
  $('text-dialog').showModal(); previewText();
}
function deleteText(id) {
  if (!texts.includes(id)) return;
  if ($('text-dialog').open && textEditor.target === id) $('text-dialog').close();
  removeCharacter(id);
  status('文字を削除しました。');
  const next = $('placed-texts').querySelector(`[data-layer-id="${state.selected}"]`) || $('add-text');
  if (!$('controls-panel').inert && next.getClientRects().length) next.focus({ preventScroll: true });
  else if (compactTools.matches) $('tool-launcher').querySelector('[data-open-tool="text"]').focus({ preventScroll: true });
}
function fitTextSize(bitmap, maxWidth = .64, maxHeight = .4) {
  const rect = stage.getBoundingClientRect();
  const heightPerWidth = (rect.width / (rect.height || rect.width)) * bitmap.height / bitmap.width;
  return Math.min(maxWidth, maxHeight / heightPerWidth);
}
function applyText() {
  if (!textEditor.bitmap || $('apply-text').disabled) return;
  const draft = { ...textEditor.draft }, bitmap = textEditor.bitmap;
  let id = textEditor.target;
  if (id && !texts.includes(id)) return;
  if (!id) {
    if (texts.length >= MAX_TEXTS) return;
    id = `text-${nextTextId++}`;
    const canvas = document.createElement('canvas'); canvas.id = id; canvas.className = 'photo-layer text-layer'; canvas.dataset.layerId = id;
    canvas.setAttribute('role', 'img'); canvas.tabIndex = 0;
    layers[id] = { element: canvas, x: .5, y: [.22, .38, .54][texts.length], size: fitTextSize(bitmap), rotation: 0, flip: false };
    texts.push(id); stage.insertBefore(canvas, layers.logo.element);
  }
  const layer = layers[id];
  if (layer.text && layer.text.direction !== draft.direction) {
    // Keep the longest visible dimension when the writing direction changes.
    const oldAspect = layer.element.height / layer.element.width, newAspect = bitmap.height / bitmap.width;
    layer.size *= Math.max(1, oldAspect) / Math.max(1, newAspect);
    if (layer.x > 0 && layer.x < 1 && layer.y > 0 && layer.y < 1) {
      layer.size = Math.min(layer.size, fitTextSize(bitmap, 1.9 * Math.min(layer.x, 1 - layer.x), 1.9 * Math.min(layer.y, 1 - layer.y)));
    }
  }
  layer.text = draft;
  const canvas = layer.element; canvas.width = bitmap.width; canvas.height = bitmap.height; canvas.getContext('2d', { colorSpace: 'srgb', colorType: 'unorm8' }).drawImage(bitmap, 0, 0);
  canvas.alt = draft.content; canvas.setAttribute('aria-label', draft.content); canvas.title = '指で移動・拡大／回転。「文字を編集」で内容と文字効果を変更';
  lastTextStyle = draft; selectLayer(id); renderPlacements(); $('text-dialog').close(); closeTools(canvas);
}
$('add-text').addEventListener('click', () => openTextEditor());
$('edit-text').addEventListener('click', () => openTextEditor(state.selected));
$('delete-text').addEventListener('click', () => deleteText(textEditor.target));
$('close-text').addEventListener('click', () => $('text-dialog').close());
$('text-dialog').addEventListener('close', () => { ++textEditor.sequence; textEditor.bitmap = null; });
for (const id of ['text-content', 'text-font', 'text-direction', 'text-color', 'text-effect', 'text-outline', 'text-outline-color']) $(id).addEventListener('input', previewText);
$('apply-text').addEventListener('click', applyText);

$('start-camera').addEventListener('click', () => openCamera());
$('use-camera').addEventListener('click', () => openCamera());
$('choose-background').addEventListener('click', () => $('background-file').click());
$('add-overlay-image').addEventListener('click', () => $('overlay-file').click());
for (const [id, open] of [['background-file', openBackground], ['overlay-file', openOverlay]]) $(id).addEventListener('change', event => { const file = event.target.files[0]; event.target.value = ''; open(file); });
$('switch-camera').addEventListener('click', () => state.mode === 'image' ? $('background-file').click() : openCamera(state.facing === 'user' ? 'environment' : 'user', true));
$('capture-photo').addEventListener('click', capturePhoto);
$('select-logo').addEventListener('click', () => { selectLayer('logo'); closeTools(layers.logo.element); });
$('remove-character').addEventListener('click', () => removeCharacter());
$('flip-layer').addEventListener('click', () => { if (state.selected) { layers[state.selected].flip = !layers[state.selected].flip; renderLayers(); } });
$('show-logo').addEventListener('change', () => {
  if (!$('show-logo').checked && state.selected === 'logo') selectLayer(characters[0] || texts[0] || null);
  if ($('show-logo').checked && !state.selected) selectLayer('logo');
  syncControls();
  renderLayers();
});
$('mirror-selfie').addEventListener('change', renderLayers);
$('reset-placement').addEventListener('click', () => {
  clearGesture();
  characters.forEach((id, index) => Object.assign(layers[id], { x: (index + 1) / (characters.length + 1), y: .62, size: characters.length === 1 ? .38 : .3, rotation: 0, flip: false }));
  texts.forEach((id, index) => Object.assign(layers[id], { x: .5, y: [.22, .38, .54][index], size: fitTextSize(layers[id].element), rotation: 0, flip: false }));
  Object.assign(layers.logo, { x: .79, y: .87, size: .3, rotation: 0, flip: false });
  syncControls(); fitStage();
});
for (const id of ['close-photo', 'retake-photo']) $(id).addEventListener('click', () => $('photo-dialog').close());
$('photo-dialog').addEventListener('close', () => {
  ++state.captureSequence;
  state.captureBusy = false;
  $('capture-photo').disabled = !sourceReady();
  if (state.stream && document.visibilityState === 'visible') video.play().catch(() => status('カメラを再開できませんでした。もう一度開いてください。', true));
});
$('save-photo').addEventListener('click', event => {
  if (!state.blob || !state.saveUrl || $('save-photo').getAttribute('aria-disabled') === 'true') {
    event.preventDefault(); return;
  }
  $('photo-status').textContent = 'ダウンロードをご確認ください。反応しない場合は、完成画像を長押し（PCは右クリック）して保存できます。';
});
$('share-photo').addEventListener('click', async () => {
  if (!state.blob) return;
  try {
    await navigator.share({ files: [new File([state.blob], state.fileName, { type: state.blob.type })], title: 'KOHZO PHOTO｜山仲幸造さんと記念写真' });
  } catch (error) { if (error.name !== 'AbortError') $('photo-status').textContent = '共有できませんでした。「画像を保存」か、完成画像の長押し保存をお試しください。'; }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    ++state.sequence; stopCamera(); clearGesture();
    state.opening = false;
    $('start-camera').disabled = false;
    if (state.mode === 'camera') {
      $('camera-placeholder').hidden = false;
      status('カメラを停止しました。「カメラを開く」で再開できます。');
    }
  }
});
window.addEventListener('pagehide', () => { ++state.sequence; stopCamera(); });
new ResizeObserver(fitStage).observe(stage.parentElement);
window.addEventListener('resize', fitStage);

async function selectPose(pose) {
  if (!pose.src) return;
  const selectionSequence = ++poseSelectionSequence;
  const selectedPose = pose.id;
  status(`${pose.name}の幸造さんを準備しています。`);
  const image = new Image(); image.src = pose.src;
  try { await image.decode(); } catch { status('ポーズの画像を開けませんでした。素材を読み直してください。', true); return; }
  if (selectionSequence !== poseSelectionSequence) return;
  if (poseLayer && layers[poseLayer]) {
    const layer = layers[poseLayer];
    layer.element.src = pose.src; layer.element.alt = '山仲幸造 · ' + pose.name;
    selectLayer(poseLayer); renderPlacements();
  } else {
    if (characters.length >= MAX_CHARACTERS) { status('画像は3枚までです。1枚削除してから選んでください。', true); return; }
    addCharacter({name:'山仲幸造 · ' + pose.name}, image);
    poseLayer = characters.at(-1);
  }
  currentPose = selectedPose; renderCharacters();
  status('幸造さんを追加しました。指で動かして、2本指で大きさと向きを調整できます。');
}
function openPoseDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kozo-photo-assets', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('poses');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function rememberPose(id, file) {
  const db = await openPoseDatabase();
  try { await new Promise((resolve, reject) => {
    const tx = db.transaction('poses', 'readwrite'); tx.objectStore('poses').put(file, id);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  }); } finally { db.close(); }
}
async function installPose(pose, file) {
  const {image, url} = await readLocalImage(file);
  if (poseUrls.has(pose.id)) URL.revokeObjectURL(poseUrls.get(pose.id));
  poseUrls.set(pose.id, url); pose.src = url; pose.thumbnail = url;
  return image;
}
async function restorePoses() {
  try {
    const db = await openPoseDatabase();
    const files = await Promise.all(CHARACTERS.map(pose => new Promise((resolve, reject) => {
      const request = db.transaction('poses').objectStore('poses').get(pose.id);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    })));
    db.close();
    for (let i = 0; i < files.length; i++) if (files[i]) await installPose(CHARACTERS[i], files[i]);
    renderCharacters();
    const first = CHARACTERS.find(pose => pose.src);
    if (first) await selectPose(first);
  } catch {
    // Bundled portraits also work when browser storage is unavailable.
    renderCharacters();
    const first = CHARACTERS.find(pose => pose.src);
    if (first) await selectPose(first);
  }
}
$('pose-files').addEventListener('change', async event => {
  const files = [...event.target.files]; event.target.value = '';
  if (!files.length) return;
  $('import-poses').disabled = true;
  try {
    const assignments = new Map();
    for (const file of files) {
      const name = file.name;
      const aliases = { smile: /笑顔|老紳士|smile|^001\.png$/i, peace: /ピース|peace|^002\.png$/i, thumb: /サムズ|親指|thumb|^003\.png$/i, wave: /手を振る|手振り|wave/i, bow: /おじぎ|お辞儀|bow/i, guide: /案内|guide/i, cheer: /ガッツ|cheer/i, point: /指さし|指差し|point/i, welcome: /両手|歓迎|welcome/i, heart: /ハート|heart/i, salute: /敬礼|salute/i, 'arms-crossed': /腕組み|arms.crossed/i };
      const stem = name.replace(/\.(png|webp)$/i, '').replace(/^kozo-/i, '').toLowerCase();
      const id = CHARACTERS.find(pose => pose.id.toLowerCase() === stem)?.id || CHARACTERS.find(pose => aliases[pose.id]?.test(name) || name.toLowerCase().includes(pose.id.toLowerCase()) || name.includes(pose.name))?.id;
      if (id && !assignments.has(id)) assignments.set(id, file);
      else {
        const available = CHARACTERS.find(pose => !assignments.has(pose.id));
        if (available) assignments.set(available.id, file);
      }
    }
    let persisted = true;
    for (const [id, file] of assignments) {
      await installPose(CHARACTERS.find(pose => pose.id === id), file);
      try { await rememberPose(id, file); } catch { persisted = false; }
    }
    renderCharacters();
    await selectPose(CHARACTERS.find(pose => pose.id === currentPose && pose.src) || CHARACTERS.find(pose => pose.src));
    status(persisted ? 'ポーズを読み込みました。このブラウザでは次回も使えます。' : 'ポーズを読み込みました。次回はもう一度読み込んでください。');
  } catch (error) { status(error.message || '素材を読み込めませんでした。', true); }
  finally { $('import-poses').disabled = false; }
});
$('import-poses').addEventListener('click', () => $('pose-files').click());
$('reset-layer').addEventListener('click', () => {
  if (!characters.includes(state.selected)) return;
  clearGesture();
  Object.assign(layers[state.selected], { x: .5, y: .62, size: .38, rotation: 0 });
  renderLayers();
});
$('layer-size').addEventListener('input', event => { if (layers[state.selected]) { clearGesture(); resizeLayer(state.selected, Number(event.target.value) / 100); renderLayers(); } });
$('layer-rotation').addEventListener('input', event => { const layer = layers[state.selected]; if (layer) { clearGesture(); layer.rotation = Number(event.target.value); renderLayers(); } });

prepareCredit(); renderCharacters(); renderFrameChoices(); fitStage(); restorePoses();

