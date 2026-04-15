const path = require("path");
const fs = require("fs");

const makers = [
  {
    name: "@electron-forge/maker-zip",
    platforms: ["darwin", "linux", "win32"],
  },
];

try {
  require.resolve("@electron-forge/maker-dmg");
  makers.push({
    name: "@electron-forge/maker-dmg",
    platforms: ["darwin"],
  });
} catch (_error) {}

const iconBase = path.join(__dirname, "public", "app-icon");
const hasPackagedIcon = [".icns", ".ico", ".png"].some((extension) =>
  fs.existsSync(`${iconBase}${extension}`)
);

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "fisuc-newsletter",
    ignore: [/^\/\.npm-cache/, /^\/\.npm-prefix/, /^\/out/, /^\/dist/],
    ...(hasPackagedIcon ? { icon: iconBase } : {}),
  },
  makers,
};
