# Contextual writing images

Writing activity banners use the public Wikimedia Commons MediaWiki API. It is free to query and does not require an API key or a server-side secret.

## How image matching works

Each writing card requests an image using its own `imageQuery`, when provided, or terms extracted from its question. The image is displayed on that same activity card and links to the Commons file page. The image cache is scoped by grammar module and activity ID so activities with reused IDs cannot receive another module's image.

Add a curated search phrase and accessible alt text to a writing activity when the prompt has a clear visual subject:

```json
{
  "id": "writing-1",
  "question": "Plan a weekend trip to Jakarta.",
  "imageQuery": "Jakarta city weekend travel",
  "imageAlt": "A view of Jakarta for a weekend travel plan"
}
```

The image service tries the free Commons API, then a module-matched local image mapping, then `assets/fallback.jpg`. Results are cached in local storage for 30 days. Attribution and the image's available license are shown below each banner.

## Running locally

Serve the project over HTTP so the app can load its local activity data and make the cross-origin Commons request:

```bash
npm start
```

No `.env` file, API key, or browser-console setup is needed. If Commons is unavailable, writing activities continue to work with local or fallback images.
