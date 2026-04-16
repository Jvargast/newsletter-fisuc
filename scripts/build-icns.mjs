import fs from "fs";
import path from "path";

const [, , iconsetDirArg, outputFileArg] = process.argv;

if (!iconsetDirArg || !outputFileArg) {
  console.error("Uso: node scripts/build-icns.mjs <iconsetDir> <outputFile>");
  process.exit(1);
}

const iconsetDir = path.resolve(iconsetDirArg);
const outputFile = path.resolve(outputFileArg);

const iconEntries = [
  ["icp4", "icon_16x16.png"],
  ["ic11", "icon_16x16@2x.png"],
  ["icp5", "icon_32x32.png"],
  ["ic12", "icon_32x32@2x.png"],
  ["icp6", "icon_32x32@2x.png"],
  ["ic07", "icon_128x128.png"],
  ["ic13", "icon_128x128@2x.png"],
  ["ic08", "icon_256x256.png"],
  ["ic14", "icon_256x256@2x.png"],
  ["ic09", "icon_512x512.png"],
  ["ic10", "icon_512x512@2x.png"],
];

const chunks = iconEntries.map(([type, fileName]) => {
  const filePath = path.join(iconsetDir, fileName);
  const data = fs.readFileSync(filePath);
  const chunk = Buffer.alloc(8);
  chunk.write(type, 0, 4, "ascii");
  chunk.writeUInt32BE(data.length + 8, 4);
  return Buffer.concat([chunk, data]);
});

const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 8);
const header = Buffer.alloc(8);
header.write("icns", 0, 4, "ascii");
header.writeUInt32BE(totalLength, 4);

fs.writeFileSync(outputFile, Buffer.concat([header, ...chunks]));
console.log(outputFile);
