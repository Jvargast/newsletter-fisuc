const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let serverHandle = null;
let startupPromise = null;
let isQuitting = false;

function getAppRoot() {
  return path.join(__dirname, "..");
}

function resolveExistingPath(candidates) {
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function resolveEnvPath(rootDir) {
  return resolveExistingPath([
    path.join(process.cwd(), ".env"),
    path.join(rootDir, ".env"),
    path.join(app.getPath("userData"), ".env"),
    path.join(path.dirname(process.execPath), ".env"),
  ]);
}

async function ensureServer() {
  if (serverHandle) return serverHandle;
  if (startupPromise) return startupPromise;

  const rootDir = getAppRoot();
  const uploadsDir = path.join(app.getPath("userData"), "uploads");
  const envPath = resolveEnvPath(rootDir);

  startupPromise = import(path.join(rootDir, "server.mjs"))
    .then((serverModule) =>
      serverModule.startServer({
        rootDir,
        uploadsDir,
        envPath,
        host: "127.0.0.1",
        port: 0,
        quiet: true,
      })
    )
    .then((handle) => {
      serverHandle = handle;
      startupPromise = null;
      return handle;
    })
    .catch((error) => {
      startupPromise = null;
      throw error;
    });

  return startupPromise;
}

async function createMainWindow() {
  const server = await ensureServer();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1220,
    minHeight: 760,
    autoHideMenuBar: true,
    title: "FISUC Newsletter",
    backgroundColor: "#eef5f1",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(server.url);
  return mainWindow;
}

async function shutdownServer() {
  if (!serverHandle) return;

  try {
    const { stopServer } = await import(path.join(getAppRoot(), "server.mjs"));
    await stopServer(serverHandle.server);
  } catch (error) {
    console.error("No se pudo cerrar el servidor embebido:", error);
  } finally {
    serverHandle = null;
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", async () => {
    const win = await createMainWindow();
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(async () => {
    try {
      app.setAppUserModelId("cl.fisuc.newsletter");
      await createMainWindow();
    } catch (error) {
      console.error(error);
      dialog.showErrorBox(
        "No se pudo abrir la app",
        error?.message || "Error inesperado al iniciar la app de escritorio."
      );
      app.quit();
    }
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", async (event) => {
    if (isQuitting || !serverHandle) return;
    isQuitting = true;
    event.preventDefault();
    await shutdownServer();
    app.exit();
  });
}
