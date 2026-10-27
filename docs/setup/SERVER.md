# Grammar101 Server

## Quick Start

### Codespaces, macOS, or Linux
```bash
npm run dev
```

This serves the repository root, including `index.html`, on port **8001**.
In Codespaces, open the **Ports** panel and choose **Open in Browser** for
port **8001**. Stop the server with **Ctrl+C**; rerun `npm run dev` anytime
to preview the app again.

The development server serves the repository root; `src/` is not the app
directory. This exposes source JSON and is for local development only. For
production, run `npm run build` and deploy **only `dist/`**. The build excludes
topic and activity JSON. See
[the content access setup guide](CONTENT_ACCESS_SETUP.md) before deploying
the gated application.

Set `PORT` to use a different port:
```bash
PORT=3000 npm run dev
```

Alternatively, start it with `bash scripts/server/start-dev-server.sh`.

## What This Does
The server serves your Grammar101 application over HTTP so that JavaScript `fetch()` calls can load JSON configuration files (required due to browser CORS restrictions).
