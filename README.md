# Birdbox

Birdbox 2 is a lightweight, low-latency system for remotely managing and monitoring a Raspberry Pi–powered camera enclosure. It uses a Node.js backend, WebSocket-based control channel, and Raspberry Pi–side camera tools to trigger recording, capture stills, and stream image frames to any connected browser client.

This project maintains the architecture and behaviors from the original Birdbox design, but simplifies configuration and improves cross-device communication.

---

## Features

- **WebSocket command/control**  
  Browser clients connect to `/ws` and send commands like `start_record`, `stop_record`, `capture_frame`, and more.

- **REST API for Pi-facing automation**  
  The Raspberry Pi periodically calls `POST /api/register/pi` to announce itself and retrieve the currently requested recording state.  
  It also pushes logs and camera still images to the server using simple HTTP endpoints.

- **Live camera still transfer (base64)**  
  The Pi captures a JPEG still, base64-encodes it, and uploads it via `POST /api/upload_still`.  
  The server then broadcasts the image to all connected browsers requesting a live view.

- **Configurable UI for controlling the Pi**  
  Browser clients can toggle recording, view logs, and view camera stills streamed through the server.

- **Simple, dependency-light architecture**  
  No database, minimal middleware, no frontend build tools, no client accounts.

---

## Repository Structure

```
birdbox/
├── server.js            # Main Node.js server (Express + WebSocket)
├── public/
│   ├── index.html       # Browser UI
│   ├── index.js         # Browser WebSocket client logic
│   └── styles.css
└── README.md
```

---

## Requirements

### Raspberry Pi Side

- Raspberry Pi OS Lite (2023+)
- `libcamera` tools installed  
  (On modern Pi OS, these should already be present)
- Network access to the Node.js server

### Server Side

- Node.js 18+
- No database required
- Works on any Linux VM (your Hetzner VPS, local dev machine, etc.)

---

## Installation

### 1. Clone the Repository

```
git clone https://github.com/ttosi/birdbox.git
cd birdbox
```

### 2. Install Dependencies

```
npm install
```

### 3. Start Server

```
node server.js
```

Server runs on `http://localhost:3000`.

---

## Raspberry Pi Configuration

### Install libcamera

On current Raspberry Pi OS:

```
sudo apt update
sudo apt install -y libcamera-apps
```

Verify:

```
libcamera-jpeg --version
```

### Configure Pi to Report to the Server

Use `cron`, `systemd`, or a lightweight Node/Python client to:

1. Call `POST /api/register/pi`
2. Perform camera actions based on server response
3. Upload still frames via `POST /api/upload_still`

Example still capture:

```
libcamera-jpeg -n -o frame.jpg -t 1
```

Encode to base64:

```
base64 frame.jpg
```

Upload to server.

---

## WebSocket Control Protocol

Browser → Server commands:

```json
{ "cmd": "start_record" }
{ "cmd": "stop_record" }
{ "cmd": "view_live" }
{ "cmd": "stop_live" }
{ "cmd": "request_still" }
```

Server → Browser broadcasts:

```json
{ "type": "log", "msg": "Pi connected" }
{ "type": "frame", "data": "<base64 JPEG>" }
{ "type": "status", "recording": true }
```

---

## Live Streaming Strategy

Birdbox streams frames by:

1. Pi captures a JPEG still
2. Pi sends it to server base64
3. Server pushes to all clients subscribed to live view

This avoids video encoders and works reliably even on Pi Zero hardware.

---

## Development Notes

- All browser-side JavaScript uses vanilla ES6
- All communication is via WebSocket or JSON over HTTP
- No cookies or authentication yet (can be added)
- Designed for offline-friendly local networks

---

## Roadmap

- Add token authentication for Pi registration
- Implement motion-triggered captures
- Add multipart MJPEG streaming mode
- Add configurable recording presets

---

## License

MIT
