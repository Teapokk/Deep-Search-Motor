/**
 * DSM API — v1 XML Endpoint
 * Serverless function (Vercel) that orchestrates a DSM variant search
 * and returns results as application/xml.
 *
 * POST /api/v1/xml
 * Body: { url: string, limit: number, variant?: string }
 */

const { search } = require('../../../packages/core/orchestrator');

/**
 * Serializes a SearchResult payload to an XML string.
 * @param {object} payload
 * @returns {string}
 */
function toXml(payload) {
  const { meta, results } = payload;

  const metaXml = `
    <meta>
      <variant>${escapeXml(meta.variant)}</variant>
      <version>${escapeXml(meta.version)}</version>
      <url>${escapeXml(meta.url)}</url>
      <limit>${meta.limit}</limit>
      <count>${meta.count}</count>
      <duration_ms>${meta.duration_ms}</duration_ms>
      <crawl_type>${escapeXml(meta.crawl_type)}</crawl_type>
    </meta>`;

  const resultsXml = results
    .map(
      (r) => `
    <result>
      <title>${escapeXml(r.title)}</title>
      <url>${escapeXml(r.url)}</url>
      <description>${escapeXml(r.description)}</description>
      <logo>${escapeXml(r.logo)}</logo>
      <timestamp>${escapeXml(r.timestamp)}</timestamp>
    </result>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<dsm>${metaXml}
  <results>${resultsXml}
  </results>
</dsm>`;
}

/**
 * Escapes special characters for safe XML output.
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(405).send('<error>Method Not Allowed. Use POST.</error>');
  }

  const { url, limit = 0, variant = 'sky' } = req.body ?? {};

  if (!url || typeof url !== 'string') {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(400).send('<error>"url" is required and must be a string.</error>');
  }

  const parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 0) {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(400).send('<error>"limit" must be a non-negative integer.</error>');
  }

  try {
    const payload = await search({ url, limit: parsedLimit, variant });
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(toXml(payload));
  } catch (err) {
    console.error('[DSM XML API]', err.message);
    res.setHeader('Content-Type', 'application/xml');
    return res.status(500).send(`<error>${escapeXml(err.message)}</error>`);
  }
};
