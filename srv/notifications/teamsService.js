const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { buildHttpRequest } = require('@sap-cloud-sdk/http-client');
const axios = require('axios');
const { toList, postWithRetry } = require('./util');
const { randomDelay } = require('random-delay');

const TEAMS_DESTINATION = 'Teams_Notification_Webhook';

/**
 * Microsoft Teams channel. Posts an Adaptive Card to a Power Automate flow,
 * which forwards it to the recipient via "Post card in a chat or channel".
 *
 * The flow reads:
 *   - triggerBody()?['recipient']                          → recipient
 *   - triggerBody()?['attachments']?[0]?['content']        → the Adaptive Card
 *
 * @returns {Promise<{ send(recipient: string|string[], card: object): Promise<string|Error> }>}
 */
async function getTeamsService() {
  return {
    async send(recipient, card) {
      const destination = await getDestination({ destinationName: TEAMS_DESTINATION });
      if (!destination) {
        console.error(`[teams] destination "${TEAMS_DESTINATION}" not found`);
        return new Error('Teams destination not found');
      }

      const recipients = toList(recipient);
      if (recipients.length === 0) return new Error('No Teams recipients');

      const config = await buildHttpRequest(destination);
      const sig = destination.password;
      if (sig) config.params = { ...(config.params || {}), sig };
      if (config.headers) { delete config.headers.authorization; delete config.headers.Authorization; }
      const axiosInstance = axios.create(config);

      const tasks = [];
      for (const to of recipients) {
        if (tasks.length) await randomDelay({ minDelay: 100, maxDelay: 600 });
        const payload = {
          recipient: to,
          type: 'message',
          attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', content: card }],
        };
        tasks.push(postWithRetry(axiosInstance, '', payload, { label: 'teams' }));
      }
      const results = await Promise.allSettled(tasks);

      const failed = [];
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          failed.push(recipients[i]);
          console.error(`[teams] send error for ${recipients[i]}:`, r.reason?.response?.data || r.reason?.message);
        }
      });

      // NOTE: 202 Accepted means "queued by Power Automate", not "delivered to Teams".
      if (failed.length === recipients.length) {
        return new Error(`Failed to send Teams notification to all ${recipients.length} recipient(s)`);
      }
      if (failed.length) {
        return new Error(`Teams notification partially failed (${failed.length}/${recipients.length}): ${failed.join(', ')}`);
      }
      return `Teams notification accepted for ${recipients.length} recipient(s)`;
    },
  };
}

module.exports = { getTeamsService };
