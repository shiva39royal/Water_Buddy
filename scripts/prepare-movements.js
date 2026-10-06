const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

const ARTIFACT_DIR = 'C:\\Users\\ShivaKalyanD\\.gemini\\antigravity-ide\\brain\\af376d37-2b9f-40b1-8d03-7dc05b2500fa';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const MAN_DIR = path.join(ASSETS_DIR, 'characters', 'man');

const TOLERANCE = 75;

function removeBackground(image, tolerance) {
  const { width, height, data } = image.bitmap;

  const cornerIdx = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    ((height - 1) * width + (width - 1)) * 4,
  ];
  let br = 0, bg = 0, bb = 0;
  for (const i of cornerIdx) {
    br += data[i]; bg += data[i + 1]; bb += data[i + 2];
  }
  br /= 4; bg /= 4; bb /= 4;

  const tol2 = tolerance * tolerance;
  const visited = new Uint8Array(width * height);
  const stack = [];

  for (let x = 0; x < width; x++) {
    stack.push(x);
    stack.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width);
    stack.push(y * width + (width - 1));
  }

  while (stack.length) {
    const p = stack.pop();
    if (visited[p]) continue;
    visited[p] = 1;

    const i = p * 4;
    const dr = data[i] - br;
    const dg = data[i + 1] - bg;
    const db = data[i + 2] - bb;
    if (dr * dr + dg * dg + db * db > tol2) continue;

    data[i + 3] = 0;

    const x = p % width;
    const y = (p - x) / width;
    if (x + 1 < width) stack.push(p + 1);
    if (x - 1 >= 0) stack.push(p - 1);
    if (y + 1 < height) stack.push(p + width);
    if (y - 1 >= 0) stack.push(p - width);
  }

  // Also clear enclosed pockets that match the background color closely
  const strictTol2 = 36 * 36;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (visited[p]) continue;
      const i = p * 4;
      const dr = data[i] - br;
      const dg = data[i + 1] - bg;
      const db = data[i + 2] - bb;
      // If it matches the exact corner background color, flood fill this pocket
      if (dr * dr + dg * dg + db * db < strictTol2) {
        stack.push(p);
        while (stack.length) {
          const cp = stack.pop();
          if (visited[cp]) continue;
          visited[cp] = 1;
          const ci = cp * 4;
          const cdr = data[ci] - br;
          const cdg = data[ci + 1] - bg;
          const cdb = data[ci + 2] - bb;
          if (cdr * cdr + cdg * cdg + cdb * cdb > tol2) continue;
          data[ci + 3] = 0;
          const cx = cp % width;
          const cy = (cp - cx) / width;
          if (cx + 1 < width) stack.push(cp + 1);
          if (cx - 1 >= 0) stack.push(cp - 1);
          if (cy + 1 < height) stack.push(cp + width);
          if (cy - 1 >= 0) stack.push(cp - width);
        }
      }
    }
  }

  // Feather the silhouette
  const T2 = tolerance * 1.6;
  const T2sq = T2 * T2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      if (data[i + 3] === 0) continue;

      const touchesEmpty =
        (x > 0 && data[(p - 1) * 4 + 3] === 0) ||
        (x < width - 1 && data[(p + 1) * 4 + 3] === 0) ||
        (y > 0 && data[(p - width) * 4 + 3] === 0) ||
        (y < height - 1 && data[(p + width) * 4 + 3] === 0);
      if (!touchesEmpty) continue;

      const dr = data[i] - br;
      const dg = data[i + 1] - bg;
      const db = data[i + 2] - bb;
      const dist2 = dr * dr + dg * dg + db * db;
      if (dist2 < T2sq) {
        const d = Math.sqrt(dist2);
        const a = Math.round(((d - tolerance) / (T2 - tolerance)) * 255);
        const clamped = Math.max(0, Math.min(255, a));
        if (clamped < data[i + 3]) data[i + 3] = clamped;
      }
    }
  }

  return image;
}

async function processFile(srcPath, destPath) {
  console.log(`Processing: ${srcPath} -> ${destPath}`);
  const img = await Jimp.read(srcPath);
  removeBackground(img, TOLERANCE);
  try {
    img.autocrop({ tolerance: 0.002, cropOnlyFrames: false });
  } catch (e) {
    console.log(`  (autocrop skipped: ${e.message})`);
  }
  await img.writeAsync(destPath);
  console.log(`Saved transparent sprite: ${destPath}`);
}

(async () => {
  const items = [
    {
      src: path.join(ARTIFACT_DIR, 'woman_broom_1791200494352.jpg'),
      dest: path.join(ASSETS_DIR, 'broom.png'),
    },
    {
      src: path.join(ARTIFACT_DIR, 'woman_crying_1791200516662.jpg'),
      dest: path.join(ASSETS_DIR, 'crying.png'),
    },
    {
      src: path.join(ARTIFACT_DIR, 'man_broom_1791200541390.jpg'),
      dest: path.join(MAN_DIR, 'broom.png'),
    },
    {
      src: path.join(ARTIFACT_DIR, 'man_crying_1791200565348.jpg'),
      dest: path.join(MAN_DIR, 'crying.png'),
    },
  ];

  for (const item of items) {
    await processFile(item.src, item.dest);
  }
  console.log('All movement assets successfully generated and processed!');
})();
