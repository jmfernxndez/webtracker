# WebTrack

**A minimalist, private time tracker for your browser.**  
WebTrack helps you measure how much time you spend on each website — locally, without sending a single byte to external servers.

---

## 🔒 Key Features

- 🕒 Tracks time spent on active browser tabs
- 🌐 Per-domain breakdown of usage
- 🔐 100% local — no cloud, no sync, no tracking
- ⚡ Lightweight and unobtrusive
- 🧩 Easy to install, no configuration required

---

## 📦 Installation

1. Clone or download this repository.
2. Open your browser and go to `chrome://extensions/`
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the extension folder.

---

## 📁 Project Structure

```plaintext
webtrack/
├── img/                → Extension icons (16px, 32px, 48px, 128px)
├── popup.html          → UI popup for toolbar
├── options.html        → Extension settings
├── background.js       → Background script logic
├── popup.js            → Injected script for tab activity
├── manifest.json       → Chrome Extension manifest v3
└── README.md