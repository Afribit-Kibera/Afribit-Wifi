import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const output = path.resolve('mikrotik/hotspot-mesh');
const sources = [
  ['artifacts/mesh-lab/photo-candidates/person Scanning to pay in bitcoin.jpg', 'learn-bitcoin.jpg', 720],
  ['artifacts/mesh-lab/photo-candidates/Kibera Aerial view.jpg', 'learn-community.jpg', 720],
  ['artifacts/mesh-learning/diploma-cover.png', 'learn-diploma.jpg', 420],
];
for (const [source, name, width] of sources) {
  await sharp(source).resize({ width, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(output, name));
  console.log(name, fs.statSync(path.join(output, name)).size);
}
