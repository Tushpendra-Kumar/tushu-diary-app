const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ultra-Luxury Gold & Obsidian TushuDiary "T+D" Monogram Icon Generator
function createTushuMonogramIcon(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanlines
  const lineLength = width * 4 + 1;
  const rawData = Buffer.alloc(lineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerRingRadius = width * 0.46;
  const midRingRadius = width * 0.43;
  const innerRingRadius = width * 0.41;
  const innerDiscRadius = width * 0.39;

  for (let y = 0; y < height; y++) {
    const lineOffset = y * lineLength;
    rawData[lineOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = lineOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default: Deep Velvet Obsidian Background (#07080A)
      let r = 7, g = 8, b = 10, a = 255;

      // Outer gold glowing accent ring
      if (dist >= midRingRadius && dist <= outerRingRadius) {
        // Gold shimmer gradient based on angle and y
        const t = (y / height);
        r = Math.floor(245 * (1 - t * 0.2));
        g = Math.floor(158 * (1 - t * 0.2));
        b = 11;
        a = 255;
      } else if (dist > innerRingRadius && dist < midRingRadius) {
        // Thin dark gap
        r = 14; g = 14; b = 18; a = 255;
      } else if (dist <= innerRingRadius && dist >= innerDiscRadius) {
        // Inner delicate gold accent line
        r = 251; g = 191; b = 36; a = 255;
      } else if (dist < innerDiscRadius) {
        // Deep Radial Background inside shield (#14120E to #08080A)
        const radT = dist / innerDiscRadius;
        r = Math.floor(24 * (1 - radT) + 9 * radT);
        g = Math.floor(20 * (1 - radT) + 9 * radT);
        b = Math.floor(12 * (1 - radT) + 12 * radT);
        a = 255;

        // ══════════════════════════════════════════════════════════════════
        // T + D MONOGRAM GEOMETRY
        // ══════════════════════════════════════════════════════════════════
        
        // 1. T Top Bar:
        // Horizontal bar from x in [-0.24W, +0.22W], y in [-0.22H, -0.13H]
        const isTBar = (dx >= -width * 0.24 && dx <= width * 0.22) && 
                       (dy >= -height * 0.22 && dy <= -height * 0.13);

        // 2. Vertical Spine (Stem of T and Spine of D):
        // From dx in [-0.10W, +0.01W], dy in [-0.22H, +0.24H]
        const isSpine = (dx >= -width * 0.10 && dx <= width * 0.01) &&
                        (dy >= -height * 0.22 && dy <= height * 0.24);

        // 3. T Base Step (Anchor at bottom of stem):
        const isTStep = (dx >= -width * 0.14 && dx <= width * 0.04) &&
                        (dy >= height * 0.22 && dy <= height * 0.26);

        // 4. Letter D Outer Curved Arch:
        // Arch starts from top of spine (dx=0, dy=-0.20H) to bottom of spine (dx=0, dy=+0.22H)
        // Normalized ellipse coordinate for D loop:
        // Center of D loop is at (dx0 = 0.00W, dy0 = +0.01H)
        // Outer radii: rxOut = 0.25W, ryOut = 0.21H
        // Inner radii: rxIn  = 0.15W, ryIn  = 0.12H
        const dLoopY = dy - height * 0.01;
        const dNormX = dx / (width * 0.25);
        const dNormY = dLoopY / (height * 0.21);
        const dDistOuter = (dNormX * dNormX) + (dNormY * dNormY);

        const dNormInX = (dx - width * 0.01) / (width * 0.15);
        const dNormInY = dLoopY / (height * 0.12);
        const dDistInner = (dNormInX * dNormInX) + (dNormInY * dNormInY);

        const isDArch = (dx >= -width * 0.02) && (dDistOuter <= 1.0) && (dDistInner >= 1.0);

        // 5. Monogram Accent Jewel Dot at left wing of T:
        const dotDx = dx - (-width * 0.18);
        const dotDy = dy - (-height * 0.175);
        const isJewel = (dotDx * dotDx + dotDy * dotDy) <= (width * 0.022 * width * 0.022);

        if (isTBar || isSpine || isTStep || isDArch || isJewel) {
          // Luxury 24K Gold Shimmer: #FFE066 -> #F59E0B -> #D97706
          const goldNorm = (y / height) * 0.8 + (x / width) * 0.2;
          
          if (isJewel) {
            // Sparkling diamond highlight
            r = 255; g = 255; b = 255;
          } else {
            // Gold gradient
            r = Math.floor(255 - goldNorm * 40);
            g = Math.floor(220 - goldNorm * 75);
            b = Math.floor(60 - goldNorm * 45);
          }
          a = 255;
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, body, crcBuf]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

// Target Paths
const assetsDir = path.join(__dirname, '..', 'assets');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

console.log('Generating high-resolution TushuDiary T+D Monogram App Icons...');

// 1. Core Expo Assets
const icon1024 = createTushuMonogramIcon(1024, 1024);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon1024);
fs.writeFileSync(path.join(assetsDir, 'android-icon-foreground.png'), icon1024);
fs.writeFileSync(path.join(assetsDir, 'android-icon-background.png'), icon1024);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), icon1024);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), createTushuMonogramIcon(192, 192));
console.log('✅ Updated mobile/assets/ (1024x1024 icon.png, splash, android foreground/background)');

// 2. Android Native Mipmap Folders
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

for (const m of mipmaps) {
  const targetDir = path.join(androidResDir, m.dir);
  if (fs.existsSync(targetDir)) {
    const iconData = createTushuMonogramIcon(m.size, m.size);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), iconData);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), iconData);
    console.log(`✅ Updated ${m.dir} (${m.size}x${m.size})`);
  }
}

console.log('🎉 All TushuDiary T+D Monogram App Icons successfully generated!');