import { app, ipcMain, BrowserWindow, shell } from "electron";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import * as fs from "fs";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";
import { exec } from "node:child_process";
const { autoUpdater } = createRequire(import.meta.url)("electron-updater");
function update(win2) {
  autoUpdater.autoDownload = false;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.on("checking-for-update", function() {
  });
  autoUpdater.on("update-available", (arg) => {
    win2.webContents.send("update-can-available", { update: true, version: app.getVersion(), newVersion: arg == null ? void 0 : arg.version });
  });
  autoUpdater.on("update-not-available", (arg) => {
    win2.webContents.send("update-can-available", { update: false, version: app.getVersion(), newVersion: arg == null ? void 0 : arg.version });
  });
  ipcMain.handle("check-update", async () => {
    if (!app.isPackaged) {
      const error = new Error("The update feature is only available after the package.");
      return { message: error.message, error };
    }
    try {
      return await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      return { message: "Network error", error };
    }
  });
  ipcMain.handle("start-download", (event) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          event.sender.send("update-error", { message: error.message, error });
        } else {
          event.sender.send("download-progress", progressInfo);
        }
      },
      () => {
        event.sender.send("update-downloaded");
      }
    );
  });
  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true);
  });
}
function startDownload(callback, complete) {
  autoUpdater.on("download-progress", (info) => callback(null, info));
  autoUpdater.on("error", (error) => callback(error, null));
  autoUpdater.on("update-downloaded", complete);
  autoUpdater.downloadUpdate();
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function unpackEpub(epubPath, epubName) {
  const zip = new AdmZip(epubPath);
  const zipEntries = zip.getEntries();
  zipEntries.forEach((entry) => {
    const entryName = entry.entryName;
    const outputFilePath = path.join(__dirname, "../../public/books/", epubName, entryName);
    console.log(`Extracting to: ${outputFilePath}`);
    if (entry.isDirectory) {
      if (!fs.existsSync(outputFilePath)) {
        fs.mkdirSync(outputFilePath, { recursive: true });
      }
    } else {
      const dir = path.dirname(outputFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputFilePath, entry.getData());
    }
  });
  const rwpFilePath = path.join(__dirname, "../../electron/go-toolkit/rwp");
  exec(`${rwpFilePath} manifest "${epubPath}"`, (err, output) => {
    if (err) {
      console.error("could not execute command: ", err);
      return;
    } else {
      fs.writeFileSync(path.join(__dirname, `../../public/books/${epubName}.json`), output);
    }
    var jsonOutput = JSON.parse(output);
    var foundHref = "";
    for (var resource of jsonOutput["resources"]) {
      if (resource.rel === "cover") {
        foundHref = resource.href;
      }
    }
    console.log(`Cover href: ${foundHref}`);
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../../public/books.json"), "utf8"));
    data.push({
      "title": epubName,
      "href": `/books/${epubName}`,
      "manifest": `/books/${epubName}.json`,
      "cover": `/books/${epubName}` + foundHref
    });
    var txt = JSON.stringify(data);
    fs.writeFileSync(path.join(__dirname, "../../public/books.json"), txt);
  });
}
ipcMain.handle("unpack-epub", async (_, epubPath, epubName) => {
  unpackEpub(epubPath, epubName);
});
ipcMain.handle("read-json", async () => {
  const data = fs.readFileSync(path.join(__dirname, "../../public/books.json"), "utf8");
  return JSON.parse(data);
});
process.env.APP_ROOT = path.join(__dirname, "../..");
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();
if (process.platform === "win32") app.setAppUserModelId(app.getName());
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
let win = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");
async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      nodeIntegration: true
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  update(win);
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
//# sourceMappingURL=index.js.map
