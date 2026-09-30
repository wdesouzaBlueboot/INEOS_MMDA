// Shared helpers for the notification channels (email + Teams).

// ---- recipient normalization ----------------------------------------------

/**
 * Normalize a recipient input (string, ';'/','-separated string, or array) into a
 * clean list of trimmed addresses.
 * @param {string|string[]} v
 * @returns {string[]}
 */
function toList(v) {
  return Array.isArray(v)
    ? v.map((s) => String(s).trim()).filter(Boolean)
    : String(v || '')
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

// ---- transient-error retry for webhook POSTs ------------------------------

const retry = require('async-retry');

// Transient, safe-to-retry statuses: gateway errors (502/503/504), request timeout (408),
// and throttling (429 Too Many Requests — common under a fan-out / connector rate limits).
const TRANSIENT_STATUS = new Set([408, 429, 502, 503, 504]);

/**
 * POST with retry on transient gateway/network errors, using async-retry's exponential
 * backoff WITH JITTER (randomize: true) so retries don't synchronize across recipients.
 * @param {import('axios').AxiosInstance} axiosInstance
 * @param {string} path
 * @param {object} payload
 * @param {{ retries?: number, minTimeout?: number, maxTimeout?: number, label?: string }} [opts]
 */
async function postWithRetry(axiosInstance, path, payload, opts = {}) {
  const { retries = 3, minTimeout = 500, maxTimeout = 8000, label = 'notify' } = opts;

  return retry(
    async (bail, attempt) => {
      try {
        return await axiosInstance.post(path, payload);
      } catch (error) {
        const status = error?.response?.status;
        const transient = status ? TRANSIENT_STATUS.has(status) : isNetworkError(error);
        if (!transient) {
          bail(error); // 4xx etc. — real rejection, stop retrying
          return;
        }
        console.warn(`[${label}] transient ${status || error.code || 'network error'} — attempt ${attempt}/${retries + 1}`);
        throw error; // signals async-retry to retry after a randomized backoff
      }
    },
    { retries, factor: 2, minTimeout, maxTimeout, randomize: true },
  );
}

// No HTTP response means connection reset / timeout / DNS, etc. — retryable.
function isNetworkError(error) {
  return !error?.response && Boolean(error?.code || error?.request);
}

module.exports = { toList, postWithRetry };
