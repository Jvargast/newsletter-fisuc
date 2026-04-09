module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "fisuc-newsletter",
    ignore: [/^\/\.npm-cache/, /^\/\.npm-prefix/, /^\/out/, /^\/dist/],
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux", "win32"],
    },
  ],
};
