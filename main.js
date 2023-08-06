const path = require('path')
const os = require('os')
import { app, BrowserWindow, ipcMain, Menu } from 'electron'

// These have to be imported with the esm package as they electron does not support ES modules out of the box.
// If this is implemented then this will need ot change https://github.com/electron/electron/issues/21457
const imagemin = require('esm')({ module: 'imagemin' })
const imageminMozjpeg = require('esm')({ module: 'imageminMozjpeg' })
const imageminPngquant = require('esm')({ module: 'imagemin-pngquant' })
const slash = require('esm')({ module: 'slash' })

process.env.NODE_ENV = 'development'

const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

let mainWindow
let aboutWindow

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Image-App',
    width: isDev ? 777 : 500,
    height: 600,
    resizeable: isDev ? true : false,
    backgroundColor: 'grey',
    webPreferences: {
      nodeIntegration: true, // Integrates node with the renderer
      // In the updated electron api This is requred to be set to false for require()
      // to work in the renderer proccess
      contextIsolation: false,
    },
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.loadFile('./App/index.html')
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: 'About Image-App',
    width: 300,
    height: 300,
    resizeable: false,
    backgroundColor: 'grey',
  })

  aboutWindow.loadFile('./App/about.html')
}

app.on('ready', () => {
  createMainWindow()

  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)
  mainWindow.on('ready', () => (mainWindow = null))
})

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []), // Adds the menu for Mac, otherwise it just shows as electron
  {
    role: 'fileMenu',
  },
  {
    label: 'Help', // Added label for the 'Help' menu
    submenu: [
      {
        label: 'About',
        click: createAboutWindow,
      },
    ],
  },
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' }, // Corrected 'separator' spelling
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
]

// This catches the event from the renderer
ipcMain.on('image:minimize', (e, options) => {
  options.dest = path.join(os.homdir(), 'shrinkage')
  imageShrink(options)
})

// If user is on mac then the app will fully quit and not runn in the background
app.on('window-all-closed', () => {
  if (isMac) {
    app.quit()
  }
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
