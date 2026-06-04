# DSM — Deep Search Motor

> **Project:** DSM (Deep Search Motor)
> **Current Variant:** Sky `v1.0.0`
> **License:** MIT

---

## What is DSM?

DSM is an open-source, modular search engine framework designed for deep web crawling and structured data extraction. The core project (`dsm`) provides the orchestration layer; actual crawling behavior is implemented by **variants** — swappable modules that define how pages are fetched and parsed.

```
DSM (core)
 ├── Sky   ← current variant (title, url, description, logo, timestamp)
 ├── Moon  ← future variant
 └── Sun   ← future variant
```

---

## Variant: Sky

Sky is the first official DSM variant. It extracts the following fields from any crawled page:

| Field         | Source                                          |
|---------------|-------------------------------------------------|
| `title`       | `og:title`, `twitter:title`, or `<title>`       |
| `url`         | The page URL                                    |
| `description` | `og:description` or `meta[name=description]`   |
| `logo`        | `og:image`, `apple-touch-icon`, or favicon      |
| `timestamp`   | ISO 8601 extraction time                        |

---

## Architecture

```
dsm/
├── packages/
│   ├── core/
│   │   ├── index.js          # Core entry point
│   │   ├── orchestrator.js   # Variant resolver + search runner
│   │   └── queue.js          # Bounded async concurrency queue
│   └── modules/
│       └── sky/
│           ├── index.js      # Sky variant: run(), MODULE_NAME, MODULE_VERSION
│           └── extractor.js  # Page fetching and field extraction
├── api/
│   └── v1/
│       ├── json/index.js     # Serverless: POST → application/json
│       └── xml/index.js      # Serverless: POST → application/xml
├── docs/
├── vercel.json
├── package.json
└── README.md
```

---

## API Reference

Both endpoints accept a `POST` request with a JSON body.

### `POST /api/v1/json`

Returns results as `application/json`.

**Request body:**

```json
{
  "url": "https://example.com",
  "limit": 5,
  "variant": "sky"
}
```

**Fields:**

| Field     | Type     | Required | Description                                      |
|-----------|----------|----------|--------------------------------------------------|
| `url`     | `string` | ✅       | The root URL to crawl.                           |
| `limit`   | `number` | ✅       | `0` = deep crawl; `N > 0` = first N results.     |
| `variant` | `string` | ❌       | Module variant. Defaults to `"sky"`.             |

**Response:**

```json
{
  "meta": {
    "variant": "sky",
    "version": "1.0.0",
    "url": "https://example.com",
    "limit": 5,
    "count": 5,
    "duration_ms": 1234,
    "crawl_type": "shallow"
  },
  "results": [
    {
      "title": "Example Domain",
      "url": "https://example.com",
      "description": "This domain is for use in illustrative examples.",
      "logo": "https://example.com/favicon.ico",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/v1/xml`

Same request body as the JSON endpoint. Returns results as `application/xml`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dsm>
  <meta>
    <variant>sky</variant>
    <version>1.0.0</version>
    <url>https://example.com</url>
    <limit>5</limit>
    <count>5</count>
    <duration_ms>1234</duration_ms>
    <crawl_type>shallow</crawl_type>
  </meta>
  <results>
    <result>
      <title>Example Domain</title>
      <url>https://example.com</url>
      <description>This domain is for use in illustrative examples.</description>
      <logo>https://example.com/favicon.ico</logo>
      <timestamp>2024-01-01T00:00:00.000Z</timestamp>
    </result>
  </results>
</dsm>
```

---

## Depth Logic

| `limit` value | Behaviour                                                                  |
|---------------|----------------------------------------------------------------------------|
| `0`           | **Deep crawl** — BFS across all reachable internal links. 10s safety timeout. |
| `N > 0`       | **Shallow crawl** — root page + first `N-1` linked pages.                 |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally (programmatic)

```js
const { search } = require('./packages/core');

const result = await search({
  url: 'https://example.com',
  limit: 3,       // 0 = deep crawl
  variant: 'sky', // default
});

console.log(result);
```

### 3. Deploy to Vercel

```bash
npx vercel deploy
```

---

## Adding a New Variant

1. Create `packages/modules/<variant>/index.js`
2. Export `run(url, limit)`, `MODULE_NAME`, and `MODULE_VERSION`
3. Pass `"variant": "<variant>"` in the API request body

No changes to the core or API layer are needed.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT © DSM Contributors
