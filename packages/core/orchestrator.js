/**
 * DSM — Core Orchestrator
 * Resolves the requested module variant and delegates search execution.
 * Designed for extensibility: new variants (moon, sun, etc.) need only
 * be placed at packages/modules/<variant>/index.js.
 */

const path = require('path');

/**
 * Resolves and loads a DSM module variant dynamically.
 * @param {string} variant - The module name (e.g. 'sky', 'moon').
 * @returns {object} The loaded module.
 * @throws {Error} If the variant module is not found.
 */
function resolveModule(variant) {
  const modulePath = path.resolve(
    __dirname,
    `../modules/${variant}/index.js`
  );

  try {
    return require(modulePath);
  } catch (err) {
    throw new Error(
      `DSM: Module variant "${variant}" not found. ` +
      `Expected at packages/modules/${variant}/index.js`
    );
  }
}

/**
 * Runs a search using the specified DSM variant.
 * @param {object} options
 * @param {string} options.url     - The target URL.
 * @param {number} options.limit   - 0 = deep crawl; N > 0 = first N results.
 * @param {string} options.variant - The module variant to use (default: 'sky').
 * @returns {Promise<SearchResult>}
 */
async function search({ url, limit = 0, variant = 'sky' }) {
  if (!url) throw new Error('DSM: "url" is required.');
  if (typeof limit !== 'number' || limit < 0) {
    throw new Error('DSM: "limit" must be a non-negative integer.');
  }

  const module = resolveModule(variant);

  const startedAt = Date.now();
  const results = await module.run(url, limit);
  const duration = Date.now() - startedAt;

  return {
    meta: {
      variant: module.MODULE_NAME,
      version: module.MODULE_VERSION,
      url,
      limit,
      count: results.length,
      duration_ms: duration,
      crawl_type: limit === 0 ? 'deep' : 'shallow',
    },
    results,
  };
}

module.exports = { search, resolveModule };
