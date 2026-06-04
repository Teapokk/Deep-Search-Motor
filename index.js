/**
 * DSM API — v1 JSON Endpoint
 * Serverless function (Vercel) that orchestrates a DSM variant search
 * and returns results as application/json.
 *
 * POST /api/v1/json
 * Body: { url: string, limit: number, variant?: string }
 */

const { search } = require('../../../packages/core/orchestrator');

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { url, limit = 0, variant = 'sky' } = req.body ?? {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '"url" is required and must be a string.' });
  }

  const parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 0) {
    return res.status(400).json({ error: '"limit" must be a non-negative integer.' });
  }

  try {
    const payload = await search({ url, limit: parsedLimit, variant });
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[DSM JSON API]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
