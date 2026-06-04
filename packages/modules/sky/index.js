/**
 * DSM — Sky Module Entry Point
 * Exposes the Sky variant's crawl capabilities to the core orchestrator.
 */

const { extractPage } = require('./extractor');

const MODULE_NAME = 'sky';
const MODULE_VERSION = '1.0.0';

/**
 * Runs the Sky extraction engine.
 * @param {string} url   - The root URL to start from.
 * @param {number} limit - 0 = full deep crawl; N > 0 = first N results only.
 * @returns {Promise<SkyResult[]>}
 */
async function run(url, limit) {
  if (limit === 0) {
    return deepCrawl(url);
  }
  return shallowCrawl(url, limit);
}

/**
 * Performs a shallow crawl: extracts only the root page plus up to (limit - 1)
 * linked pages discovered on it.
 * @param {string} url
 * @param {number} limit
 * @returns {Promise<SkyResult[]>}
 */
async function shallowCrawl(url, limit) {
  const rootResult = await extractPage(url);
  const results = [rootResult];

  if (limit <= 1) return results;

  const linkedUrls = await discoverLinks(url, limit - 1);

  const linkedResults = await Promise.allSettled(
    linkedUrls.map((linkedUrl) => extractPage(linkedUrl))
  );

  for (const outcome of linkedResults) {
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
    }
  }

  return results;
}

/**
 * Performs a deep crawl with a safety timeout of 10 seconds.
 * Crawls breadth-first until all reachable pages are visited or timeout fires.
 * @param {string} startUrl
 * @returns {Promise<SkyResult[]>}
 */
async function deepCrawl(startUrl) {
  const DEEP_CRAWL_TIMEOUT_MS = 10_000;
  const visited = new Set();
  const queue = [startUrl];
  const results = [];

  const deadline = Date.now() + DEEP_CRAWL_TIMEOUT_MS;

  while (queue.length > 0 && Date.now() < deadline) {
    const current = queue.shift();

    if (visited.has(current)) continue;
    visited.add(current);

    try {
      const result = await extractPage(current);
      results.push(result);

      const links = await discoverLinks(current, 50);
      const newLinks = links.filter((l) => !visited.has(l));
      queue.push(...newLinks);
    } catch {
      // Skip unreachable pages silently during deep crawl
    }
  }

  return results;
}

/**
 * Discovers internal links on a page, up to maxLinks.
 * @param {string} url
 * @param {number} maxLinks
 * @returns {Promise<string[]>}
 */
async function discoverLinks(url, maxLinks) {
  const axios = require('axios');
  const cheerio = require('cheerio');

  try {
    const base = new URL(url);
    const response = await axios.get(url, { timeout: 5_000 });
    const $ = cheerio.load(response.data);

    const links = [];
    $('a[href]').each((_, el) => {
      if (links.length >= maxLinks) return false;
      try {
        const href = $(el).attr('href');
        const resolved = new URL(href, base.origin).href;
        if (resolved.startsWith(base.origin)) {
          links.push(resolved);
        }
      } catch {
        // Ignore malformed hrefs
      }
    });

    return links;
  } catch {
    return [];
  }
}

module.exports = {
  run,
  MODULE_NAME,
  MODULE_VERSION,
};
