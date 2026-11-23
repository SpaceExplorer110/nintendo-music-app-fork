This is a fork from Juniper258/nintendo-music-app: https://github.com/Juniper258/nintendo-music-app

I removed the top bar, made it feel more like an application in stead of a website, and added proper spacebar support.
Logging in can be hard, because you will get a lot of Windows hello popups. I don't know what to do about it. You can use ctrl+shift+I to open DevTools, and then it might stop.

## Setup

### 1. Replace the application icon

Before running the application:

1. Choose an icon image of your own.
2. Convert it to `.ico` format if necessary.
3. Replace the existing `nintendo_music.ico` file with your own icon.
4. Make sure the filename remains exactly `nintendo_music.ico`.

### 2. Optional: Discord Rich Presence

This step is only necessary if you want to use Discord Rich Presence.

1. Visit the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create your own Discord application.
3. Copy your application's **Application ID**.
4. Copy `config.example.json` and rename the copy to `config.json`.
5. Open `config.json` and replace `YOUR_APPLICATION_ID_HERE` with your Application ID.
6. In your Discord application's Rich Presence Assets section, upload an image of your choice.
7. Name the image asset `nintendo_music`.

You can now launch the application with Discord Rich Presence enabled.

**Note:** Discord Rich Presence is optional. The application can be used without configuring Discord.


Original README below:

# Nintendo Music Desktop

Desktop wrapper for [Nintendo Music](https://music.nintendo.com) using Electron with Widevine DRM support.

## Requirements

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Run in development

```bash
npm start
```

## Build for distribution

```bash
npm run dist
```

The installer will be generated in `dist/`.

## Structure

```
├── main.js          # Electron main process
├── preload.js       # Preload script (context bridge)
├── package.json     # Project configuration
└── nintendo_music.ico  # App icon
```

## License

MIT
