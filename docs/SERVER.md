# Grammar101 Server

## Quick Start

### Windows
Double-click **`start-server.cmd`** or run:
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```

The server will start at **http://localhost:8001**

### Mac/Linux
```bash
python3 -m http.server 8001
```

Then open http://localhost:8001 in your browser.

## What This Does
The server serves your Grammar101 application over HTTP so that JavaScript `fetch()` calls can load JSON configuration files (required due to browser CORS restrictions).
