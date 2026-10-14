export const BUNDLED_FRAMES = [
  { id: 'tokushima-jellyfish', name: '徳島のクラゲ', label: 'クラゲ', src: 'assets/frames/tokushima-jellyfish.webp', thumbnail: 'assets/frames/thumbnails/tokushima-jellyfish.webp' },
  { id: 'naruto-whirlpools', name: '鳴門の渦潮', label: '渦潮', src: 'assets/frames/naruto-whirlpools.webp', thumbnail: 'assets/frames/thumbnails/naruto-whirlpools.webp' },
  { id: 'awa-odori', name: '阿波踊り', label: '阿波踊り', src: 'assets/frames/awa-odori.webp', thumbnail: 'assets/frames/thumbnails/awa-odori.webp' },
  { id: 'sudachi', name: 'すだちとクラゲ', label: 'すだち', src: 'assets/frames/sudachi.webp', thumbnail: 'assets/frames/thumbnails/sudachi.webp' }
];

// Keep each corner's proportions, and extend the connecting edges to fit the
// photo. Preview and export share this mapping, including landscape photos.
export function drawPhotoFrame(context, image, width, height) {
  if (!image || width <= 0 || height <= 0) return;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const sourceCorner = Math.min(sourceWidth, sourceHeight) * .4;
  const corner = Math.min(width, height) * .4;
  const sourceX = [0, sourceCorner, sourceWidth - sourceCorner, sourceWidth];
  const sourceY = [0, sourceCorner, sourceHeight - sourceCorner, sourceHeight];
  const targetX = [0, corner, width - corner, width];
  const targetY = [0, corner, height - corner, height];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      // The central photo window always stays clear.
      if (row === 1 && column === 1) continue;
      context.drawImage(image,
        sourceX[column], sourceY[row], sourceX[column + 1] - sourceX[column], sourceY[row + 1] - sourceY[row],
        targetX[column], targetY[row], targetX[column + 1] - targetX[column], targetY[row + 1] - targetY[row]);
    }
  }
}
