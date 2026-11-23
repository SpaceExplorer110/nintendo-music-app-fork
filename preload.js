
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,
})

// Muziekgegevens doorgeven aan main.js
let lastMetadata = ''

function sendMediaMetadata() {
    if (!navigator.mediaSession) return

    const metadata = navigator.mediaSession.metadata

    if (!metadata) return

    const musicInfo = {
        title: metadata.title || '',
        artist: metadata.artist || '',
        album: metadata.album || '',
        artwork: metadata.artwork?.[0]?.src || '',
    }

    const currentMetadata = JSON.stringify(musicInfo)

    // Alleen versturen wanneer de informatie veranderd is
    if (currentMetadata === lastMetadata) return

    lastMetadata = currentMetadata
    ipcRenderer.send('music-metadata', musicInfo)
}

// Media Session regelmatig controleren
setInterval(sendMediaMetadata, 1000)

// Ook direct controleren wanneer de pagina geladen is
sendMediaMetadata()


// Bestaande spatiebalkfunctie
window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return

    // Alleen reageren als Nintendo Music focus heeft
    if (!document.hasFocus()) return

    const active = document.activeElement

    // Tekstvelden en bewerkbare elementen niet onderscheppen
    if (
        active &&
        (
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.tagName === 'SELECT' ||
            active.isContentEditable
        )
    ) return

    // Zoek de echte play/pause-knop
    const buttons = Array.from(document.querySelectorAll('button'))

    const btn = buttons.find(button => {
        const label = (button.getAttribute('aria-label') || '').toLowerCase()

        return (
            label.includes('play') ||
            label.includes('pause') ||
            label.includes('afspelen') ||
            label.includes('pauzeren')
        )
    })

    if (!btn) return

    e.preventDefault()
    e.stopPropagation()

    btn.click()
}, true)
