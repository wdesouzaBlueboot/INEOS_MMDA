const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { buildHttpRequest } = require('@sap-cloud-sdk/http-client');
const axios = require('axios');
const { toList, postWithRetry } = require('./util');
const { randomDelay } = require('random-delay');

const EMAIL_DESTINATION = 'Email_Notification_Webhook';

/**
 * Email channel. Posts to a Power Automate flow whose "Send an email (V3)" action maps:
 *   request/to      ← triggerBody()?['to']
 *   request/subject ← triggerBody()?['subject']
 *   request/text    ← triggerBody()?['body']
 *
 * @returns {Promise<{ send(to: string|string[], subject: string, html: string): Promise<string|Error> }>}
 */
async function getMailService() {
  return {
    async send(to, subject, html) {
      const destination = await getDestination({ destinationName: EMAIL_DESTINATION });
      if (!destination) {
        console.error(`[mail] destination "${EMAIL_DESTINATION}" not found`);
        return new Error('Mail destination not found');
      }

      const recipients = toList(to);
      if (recipients.length === 0) return new Error('No mail recipients');

      const config = await buildHttpRequest(destination);

      const sig = destination.password;
      if (sig) config.params = { ...(config.params || {}), sig };
      if (config.headers) { delete config.headers.authorization; delete config.headers.Authorization; }
      const axiosInstance = axios.create(config);

      const tasks = [];
      for (const to of recipients) {
        if (tasks.length) await randomDelay({ minDelay: 300, maxDelay: 1500 });
        const payload = { to, subject, body: html };
        tasks.push(postWithRetry(axiosInstance, '', payload, { label: 'mail' }));
      }
      const results = await Promise.allSettled(tasks);

      const failed = [];
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          failed.push(recipients[i]);
          console.error(`[mail] send error for ${recipients[i]}:`, r.reason?.response?.data || r.reason?.message);
        }
      });

      // NOTE: 202 Accepted means "queued by Power Automate", not "delivered".
      if (failed.length === recipients.length) {
        return new Error(`Failed to send email to all ${recipients.length} recipient(s)`);
      }
      if (failed.length) {
        return new Error(`Email partially failed (${failed.length}/${recipients.length}): ${failed.join(', ')}`);
      }
      return `Email accepted for ${recipients.length} recipient(s)`;
    },
  };
}

module.exports = { getMailService };
