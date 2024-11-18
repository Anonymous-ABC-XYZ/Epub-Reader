import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import path, { dirname } from 'node:path'
import os from 'node:os'
import { update } from './update'
import * as fs from 'fs';
import AdmZip from "adm-zip";
import { fileURLToPath } from 'url';
import { exec } from 'node:child_process';
// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//

const __dirname = path.dirname(fileURLToPath(import.meta.url));



function unpackEpub(epubPath: any, epubName: string) {
  const zip = new AdmZip(epubPath);
  const zipEntries = zip.getEntries();

  zipEntries.forEach((entry: any) => {
    const entryName = entry.entryName;
    const outputFilePath = path.join(__dirname, "../../public/books/", epubName, entryName);

    console.log(`Extracting to: ${outputFilePath}`);

    if (entry.isDirectory) {
      if (!fs.existsSync(outputFilePath)) {
        fs.mkdirSync(outputFilePath, { recursive: true });
      }
    }
    else {
      const dir = path.dirname(outputFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputFilePath, entry.getData());

    }



  });

  const rwpFilePath = path.join(__dirname, '../../electron/go-toolkit/rwp')

  exec(`${rwpFilePath} manifest "${epubPath}"`, (err, output) => {
    // once the command has completed, the callback function is called
    if (err) {
      console.error("could not execute command: ", err)
      return
    } else {
      fs.writeFileSync(path.join(__dirname, `../../public/books/${epubName}.json`), output)

    }

    var jsonOutput = JSON.parse(output)
    let count = 0;
    var foundPos = 0;
    var foundHref = ''
    for (var resource of jsonOutput['resources']) {

      count++;

      if (resource.rel === "cover") {
        foundPos = count
        foundHref = resource.href
      }
    }
    console.log(`Cover href: ${foundHref}`)
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/books.json'), 'utf8'));
    data.push({
      "title": epubName,
      "href": `/books/${epubName}`,
      "manifest": `/books/${epubName}.json`,
      "cover": `/books/${epubName}` + foundHref
    })
    var txt = JSON.stringify(data);
    fs.writeFileSync(path.join(__dirname, '../../public/books.json'), txt)

  })





}

ipcMain.handle('unpack-epub', async (_, epubPath: string, epubName: string) => {
  unpackEpub(epubPath, epubName);
});

ipcMain.handle('read-json', async () => {
  const data = fs.readFileSync(path.join(__dirname, '../../public/books.json'), 'utf8');
  return JSON.parse(data);
});

process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

