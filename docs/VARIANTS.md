# DSM — Creating New Variants

A DSM variant is a self-contained module that implements the crawling and extraction strategy for a specific use case.

## Required Interface

Every variant must export the following from its `index.js`:

```js
/**
 * @param {string} url    - Root URL to start from.
 * @param {number} limit  - 0 = deep crawl; N > 0 = first N results.
 * @returns {Promise<Result[]>}
 */
async function run(url, limit) { ... }

const MODULE_NAME    = 'my-variant'; // matches folder name
const MODULE_VERSION = '1.0.0';

module.exports = { run, MODULE_NAME, MODULE_VERSION };
```

## Folder Convention

```
packages/modules/<variant-name>/
  ├── index.js      ← required, exports run/MODULE_NAME/MODULE_VERSION
  └── extractor.js  ← recommended, page-level extraction logic
```

## Planned Variants

| Name  | Description                                      | Status     |
|-------|--------------------------------------------------|------------|
| Sky   | Title, URL, description, logo, timestamp         | ✅ Active  |
| Moon  | Night-mode: extracts structured JSON-LD only     | 🔜 Planned |
| Sun   | Full-text indexing variant for search engines    | 🔜 Planned |
