# Writing activity images

Writing activities can show a contextual banner image matched to the activity's
prompt. The browser queries Wikimedia Commons directly; no key, paid service,
or additional package is required.

## Matching an image to a prompt

Add a concise, visual search phrase and a human-readable alt description to a
writing activity in its `reproducibility/*.json` data file:

```json
{
  "id": "writing-1",
  "question": "Plan a weekend trip to Jakarta.",
  "imageQuery": "Jakarta city weekend travel",
  "imageAlt": "A view of Jakarta for a weekend travel plan"
}
```

Without `imageQuery`, the service extracts search terms from the activity
question. Each result is requested and cached using both the grammar module ID
and activity ID, then appears on that same activity card. A Commons result
links to its file page. Available creator and license details are shown below
the image.

## Fallbacks

If the API has no matching result or cannot be reached, the image service uses
a local image mapping for that module and activity, then `assets/fallback.jpg`.
The rest of the writing activity remains usable offline.

## Run and verify

Serve the app over HTTP:

```bash
npm start
```

Run the project QA suite:

```bash
npm test
```

For implementation details and example queries, see
[the image setup guide](../setup/API_KEY_SETUP.md).
