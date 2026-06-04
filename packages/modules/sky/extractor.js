const axios = require('axios');
const cheerio = require('cheerio');

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Fetches and parses a single URL, returning a SkyResult object.
 * @param {string} url - The target URL to extract data from.
 * @returns {Promise<SkyResult>}
 */
async function extractPage(url) {
  const response = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'User-Agent': 'DSM-Sky/1.0 (Deep Search Motor; +https://github.com/your-org/dsm)',
    },
  });

  const $ = cheerio.load(response.data);

  const title = extractTitle($);
  const description = extractDescription($);
  const logo = extractLogo($, url);

  return {
    title,
    url,
    description,
    logo,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extracts the page title from og:title, twitter:title, or <title>.
 * @param {CheerioAPI} $
 * @returns {string}
 */
function extractTitle($) {
  return (
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').first().text().trim() ||
    'No title'
  );
}

/**
 * Extracts the page description from meta tags.
 * @param {CheerioAPI} $
 * @returns {string}
 */
function extractDescription($) {
  return (
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    ''
  );
}

/**
 * Extracts the site logo from og:image, apple-touch-icon, or favicon.
 * @param {CheerioAPI} $
 * @param {string} baseUrl
 * @returns {string}
 */
function extractLogo($, baseUrl) {
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href');
  if (appleTouchIcon) return resolveUrl(appleTouchIcon, baseUrl);

  const favicon = $('link[rel~="icon"]').first().attr('href');
  if (favicon) return resolveUrl(favicon, baseUrl);

  return '';
}

/**
 * Resolves a potentially relative URL against a base.
 * @param {string} href
 * @param {string} base
 * @returns {string}
 */
function resolveUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

module.exports = { extractPage };
