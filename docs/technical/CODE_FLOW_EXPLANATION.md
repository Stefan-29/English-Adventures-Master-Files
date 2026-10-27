# Code flow: contextual writing images

Writing activity images are requested from Wikimedia Commons directly by the
browser. The API is free to query and requires no API key.

## Image request lifecycle

1. `App.init()` loads the local `config/imageMapping.json` before it loads the
   selected grammar module.
2. `WritingModule.preloadActivityImages()` requests an image for each writing
   activity without blocking the activity cards.
3. `ImageService.getImageData(activity, moduleId)` uses an explicit activity
   image when configured, then checks the module-and-activity cache.
4. The service searches Commons with the activity's `imageQuery`, or derives a
   short query from its question.
5. A result is cached for 30 days. If the API has no result or is unavailable,
   the service checks a local mapping scoped to the module, then uses
   `assets/fallback.jpg`.
6. The image appears on the matching activity card. Its link opens the Commons
   file page, and its caption shows available creator and license information.

## Curating an image match

In the corresponding `reproducibility/*.json` writing activity, use a concise
search phrase that describes a visible subject rather than grammar
instructions:

```json
{
  "id": "writing-1",
  "question": "Plan a weekend trip to Jakarta.",
  "imageQuery": "Jakarta city weekend travel",
  "imageAlt": "A view of Jakarta for a weekend travel plan"
}
```

`imageQuery` and `imageAlt` are optional. If omitted, the image service uses
the question for its search and alt text.

## API details

The service uses the public MediaWiki endpoint:

```text
https://commons.wikimedia.org/w/api.php
```

It requests a bitmap result, thumbnail URL, file description page, and
available license metadata with cross-origin access enabled. Returned URLs
must use HTTPS. External attribution values are rendered as escaped text, and
source/license links open with `noopener noreferrer`.

The image cache key includes the grammar module, activity ID, and search query.
This avoids cross-module image reuse and refreshes a result when its curated
query changes.

## Local development and verification

Run the app over HTTP so local JSON files can load and the browser can make the
Commons request:

```bash
npm start
```

Run the project QA checks with:

```bash
npm test
```

No API key, `.env` value, download tracking request, or third-party package is
needed. When the network is unavailable, writing activities remain usable
with local or fallback images.
