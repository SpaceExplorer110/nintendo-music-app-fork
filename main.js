
const { app, BrowserWindow, session, components, ipcMain } = require('electron')
const path = require('path')
const RPC = require('discord-rpc')
const config = require('./config.json')

const NINTENDO_MUSIC_URL = 'https://music.nintendo.com'
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

let mainWindow
let rpc = null
let discordReady = false
let connecting = false
let reconnectTimer = null
let isQuitting = false

let currentMusic = null
let appStartTimestamp = Date.now()

// Discord Rich Presence bijwerken
async function updateDiscordRPC(musicInfo) {
  if (!discordReady || !rpc || !musicInfo) return

  const title = String(musicInfo.title || '').slice(0, 128)
  const artist = String(musicInfo.artist || '').slice(0, 128)
  const album = String(musicInfo.album || '').slice(0, 128)

  if (!title && !artist && !album) return

  try {
    await rpc.setActivity({
      details: title || 'Nintendo Music',
      state: artist || album || 'Listening to music',
      startTimestamp: appStartTimestamp,
      largeImageKey: 'nintendo_music',
      largeImageText: album || 'Nintendo Music',
      instance: false,
    })

    console.log('Discord activity updated:', title, artist, album)
  } catch (error) {
    console.log('Discord activity update failed:', error.message)
  }
}

// Over 5 seconden opnieuw proberen
function scheduleDiscordReconnect() {
  if (isQuitting || reconnectTimer) return

  console.log('Discord opnieuw proberen over 5 seconden...')

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    startDiscordRPC()
  }, 5000)
}

// Verbinding maken met Discord
async function startDiscordRPC() {
  if (isQuitting || discordReady || connecting) return

  connecting = true

  const client = new RPC.Client({ transport: 'ipc' })
  rpc = client

  client.on('ready', () => {
    if (rpc !== client) return

    discordReady = true
    connecting = false

    console.log('Discord Rich Presence connected!')

    if (currentMusic) {
      updateDiscordRPC(currentMusic)
    } else {
      client.setActivity({
        details: 'Nintendo Music',
        state: 'Browsing music',
        instance: false,
      }).catch(error => {
        console.log('Discord activity update failed:', error.message)
      })
    }
  })

  client.on('disconnected', () => {
    if (rpc !== client || isQuitting) return

    console.log('Discord connection lost. Reconnecting...')
    discordReady = false
    connecting = false

    scheduleDiscordReconnect()
  })

  client.on('error', error => {
    console.log('Discord RPC error:', error.message)
  })

  try {
    await client.login({ clientId: config.discordApplicationId })
  } catch (error) {
    console.log('Discord RPC connection failed:', error.message)

    if (rpc === client) {
      discordReady = false
      connecting = false

      try {
        await client.destroy()
      } catch (destroyError) {
        console.log('Discord cleanup failed:', destroyError.message)
      }

      rpc = null
    }

    scheduleDiscordReconnect()
  }
}

// Muziekinformatie ontvangen vanuit preload.js
ipcMain.on('music-metadata', (event, musicInfo) => {
  // Alleen berichten accepteren van het hoofdvenster
  if (!mainWindow || event.sender !== mainWindow.webContents) return

  if (!musicInfo || typeof musicInfo !== 'object') return

  currentMusic = musicInfo
  updateDiscordRPC(musicInfo)
})

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'nintendo_music.ico'),
    title: 'Nintendo Music',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      partition: 'persist:nintendo-music',
      enableDRM: true,
    }
  })

  mainWindow.maximize()
  mainWindow.removeMenu()

  mainWindow.loadURL(NINTENDO_MUSIC_URL, { userAgent: CHROME_UA })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 800,
        height: 700,
        parent: mainWindow,
        autoHideMenuBar: true,
        webPreferences: {
          partition: 'persist:nintendo-music',
          sandbox: false,
          contextIsolation: true,
          nodeIntegration: false,
          enableDRM: true,
        }
      }
    }
  })

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true)
  })

  mainWindow.webContents.on('did-finish-load', async () => {
    mainWindow.webContents.setUserAgent(CHROME_UA)

    await mainWindow.webContents.insertCSS(`
      *:focus,
      *:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
    `)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('enable-widevine')

app.whenReady().then(async () => {
  app.userAgentFallback = CHROME_UA
  await components.whenReady()

  startDiscordRPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  discordReady = false

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (rpc) {
    rpc.destroy().catch(() => {})
  }
})
