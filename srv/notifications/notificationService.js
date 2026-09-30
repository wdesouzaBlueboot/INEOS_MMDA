const { getMailService } = require('./mailService');
const { getTeamsService } = require('./teamsService');

const reviewLink = (form) =>
  (process.env.MMDA_APP_URL || '').replace('{{ID}}', encodeURIComponent(form?.ID || ''));

/**
 * Notification orchestrator. Fans each business event out to the configured
 * channels; one channel failing never blocks the other (Promise.allSettled).
 */
async function getNotificationService() {
  const mail = await getMailService();
  const teams = await getTeamsService();

  // Every notification goes out on both channels: email and Teams.
  // One channel failing never blocks the other.
  const dispatch = async (id, recipients, { subject, html, card }) => {
    if (!card) console.error(`[notify ${id}] missing Adaptive Card — every notification must provide one`);
    await Promise.allSettled([
      run(id, 'email', () => mail.send(recipients, subject, html)),
      run(id, 'teams', () => teams.send(recipients, card)),
    ]);
  };

  return {
    // N-1 · Form submitted — requestor confirmation
    submitted: (form) =>
      dispatch('N1', form.requestorEmail, {
        subject: `[MMDA] Request ${form.formNumber} Successfully Submitted`,
        html: emailLayout({
          greeting: `Dear ${form.requestorName || ''},`,
          intro: 'Your material master data request has been successfully submitted and is now pending review.',
          fields: baseFields(form),
          cta: { title: 'Track Request', url: reviewLink(form) },
          closing: 'You will be notified once the request has been reviewed. You can track the current status of your request at any time.',
        }),
        card: actionCard({
          title: 'Request submitted',
          text: `Your request ${form.formNumber} has been submitted and is now pending review.`,
          fields: baseFields(form),
          cta: { title: 'Track Request', url: reviewLink(form) },
        }),
      }),

    // N-2 / N-3 · Action required — current/next step reviewers
    // ctx: { currentStep, nextStep, totalSteps }
    pendingAction: (form, reviewerEmails, ctx = {}) => {
      const isInitial = !ctx.currentStep; // step 0 submission → N-2, otherwise N-3
      const stepLabel = ctx.totalSteps ? ` (Step ${ctx.nextStep} of ${ctx.totalSteps})` : '';
      const fields = {
        ...baseFields(form),
        'Submitted By': contact(form.requestorName, form.requestorEmail),
      };
      return dispatch(isInitial ? 'N2' : 'N3', reviewerEmails, {
        subject: isInitial
          ? `[MMDA] Action Required — New ${form.formType_code} Request ${form.formNumber}`
          : `[MMDA] Action Required — ${form.formType_code} Request ${form.formNumber}${stepLabel}`,
        html: emailLayout({
          intro: isInitial
            ? 'A new material master data request requires your action.'
            : `A material master data request has been approved at Step ${ctx.currentStep} and is now awaiting your action at Step ${ctx.nextStep}.`,
          fields,
          cta: { title: 'Review Request', url: reviewLink(form) },
          closing: 'Please review the request and approve or reject it as appropriate.',
        }),
        card: actionCard({
          title: 'Action required',
          text: `Request ${form.formNumber} (${form.formType_code}) needs your review.`,
          fields,
          cta: { title: 'Review Request', url: reviewLink(form) },
        }),
      });
    },

    // N-4 · Request rejected — requestor + previous approvers + rejector
    // ctx: { reviewerName, reviewerEmail, currentStep, rejectionComments }
    rejected: (form, recipients, ctx = {}) => {
      const fields = {
        ...baseFields(form),
        'Submitted By': contact(form.requestorName, form.requestorEmail),
        'Rejected By': contact(ctx.reviewerName, ctx.reviewerEmail),
        'Rejection Reason': ctx.rejectionComments || form.rejectionComments,
      };
      return dispatch('N4', recipients, {
        subject: `[MMDA] Request ${form.formNumber} Has Been Rejected`,
        html: emailLayout({
          intro: `The following material master data request has been rejected at Step ${ctx.currentStep ?? ''}.`,
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
          closing: 'The requestor has been notified and may edit and resubmit the request after addressing the rejection reason.',
        }),
        card: actionCard({
          title: 'Request rejected',
          text: `Request ${form.formNumber} was rejected at Step ${ctx.currentStep ?? ''}.`,
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
      });
    },

    // N-5 · Request fully approved — requestor + all approvers
    finalApproved: (form, recipients) => {
      // Deletion has no automated SAP step — the material must be deleted manually.
      const isDeletion = form.formType_code === 'Deletion';
      const fields = {
        ...baseFields(form),
        'Submitted By': contact(form.requestorName, form.requestorEmail),
        'SAP Material Number': form.sapMaterialNumber_Product,
        'SAP Material Desc.': form.materialDescription,
      };
      const intro = isDeletion
        ? 'The following material master data request has been fully approved. The material must now be deleted manually in SAP.'
        : 'The following material master data request has been fully approved and successfully processed in SAP.';
      const cardText = isDeletion
        ? `Request ${form.formNumber} has been fully approved. The material must be deleted manually in SAP.`
        : `Request ${form.formNumber} has been fully approved and processed in SAP.`;
      const subject = isDeletion
        ? `[MMDA] Request ${form.formNumber} Fully Approved`
        : `[MMDA] Request ${form.formNumber} Fully Approved — SAP Material ${form.sapMaterialNumber_Product || ''}`;
      return dispatch('N5', recipients, {
        subject,
        html: emailLayout({
          intro,
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
        card: actionCard({
          title: 'Request fully approved',
          text: cardText,
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
      });
    },

    // N-6 · SAP creation error — final approver
    sapError: (form, recipient) =>
      dispatch('N6', recipient, {
        subject: `[MMDA] SAP Error — Request ${form.formNumber} Requires Attention`,
        html: emailLayout({
          intro: 'The material master data request below was fully approved, but an error occurred during SAP processing. The request has been placed in SAP_ERROR status and requires your attention.',
          fields: { ...baseFields(form), 'Submitted By': contact(form.requestorName, form.requestorEmail), 'SAP Error Detail': form.sapError },
          cta: { title: 'Open Request', url: reviewLink(form) },
          closing: 'To retry, open the request and use the Approve action again once the underlying issue has been resolved.',
        }),
        card: actionCard({
          title: 'SAP error — attention required',
          text: `Request ${form.formNumber} failed during SAP processing.`,
          fields: { 'SAP Error': form.sapError },
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
      }),

    // N-7 · Action reminder — stalled request
    // ctx: { daysWaiting, nextStep, lastActionDate }
    reminder: (form, reviewerEmails, ctx = {}) =>
      dispatch('N7', reviewerEmails, {
        subject: `[MMDA] Reminder — Request ${form.formNumber} Is Awaiting Your Action (${ctx.daysWaiting} days)`,
        html: emailLayout({
          intro: `This is a reminder that the following material master data request has been waiting for your action for ${ctx.daysWaiting} days.`,
          fields: {
            ...baseFields(form),
            'Submitted By': contact(form.requestorName, form.requestorEmail),
            'Pending Since': fmtDate(ctx.lastActionDate),
            'Current Step': ctx.nextStep,
          },
          cta: { title: 'Review Request', url: reviewLink(form) },
          closing: 'Please review and action the request at your earliest convenience.',
        }),
        card: actionCard({
          title: 'Action reminder',
          text: `Request ${form.formNumber} has been waiting ${ctx.daysWaiting} days for your action.`,
          cta: { title: 'Review Request', url: reviewLink(form) },
        }),
      }),

    // N-8 · SAP error escalation — stalled in SAP_ERROR
    // ctx: { daysWaiting, lastActionDate }
    sapErrorEscalation: (form, recipient, ctx = {}) =>
      dispatch('N8', recipient, {
        subject: `[MMDA] Reminder — Request ${form.formNumber} Is Still in SAP Error (${ctx.daysWaiting} days)`,
        html: emailLayout({
          intro: `This is a reminder that the following material master data request has been in SAP_ERROR status for ${ctx.daysWaiting} days and still requires your attention.`,
          fields: { ...baseFields(form), 'Submitted By': contact(form.requestorName, form.requestorEmail), 'In Error Since': fmtDate(ctx.lastActionDate), 'SAP Error Detail': form.sapError },
          cta: { title: 'Open Request', url: reviewLink(form) },
          closing: 'To retry, open the request and use the Approve action again once the underlying issue has been resolved.',
        }),
        card: actionCard({
          title: 'SAP error still pending',
          text: `Request ${form.formNumber} has been in SAP error for ${ctx.daysWaiting} days.`,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
      }),

    // N-9 · BOM planner — new material in plant
    bomPlanner: (form, recipient) => {
      const fields = {
        'Request Number': form.formNumber,
        Plant: form.plant_plant_Plant,
        'SAP Material Number': form.sapMaterialNumber_Product,
        'SAP Material Desc.': form.materialDescription,
        'Functional Location': form.functionalLocation,
        'Equipment Number': form.equipmentNumber,
      };
      return dispatch('N9', recipient, {
        subject: `[MMDA] New Material Part of BOM — ${form.formNumber} | Plant ${form.plant_plant_Plant}`,
        html: emailLayout({
          intro: 'A new material master data request that includes a Bill of Materials association has been fully approved and created in SAP.',
          note: 'Please proceed with creating the BOM for this material.',
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
        card: actionCard({
          title: 'New material part of BOM',
          text: `Request ${form.formNumber} (Plant ${form.plant_plant_Plant}) was approved and created in SAP. Please proceed with creating the BOM for this material.`,
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
      });
    },

    // N-10 · InfoRecord planner — new material created
    infoRecordPlanner: (form, recipients) => {
      const fields = {
        ...baseFields(form),
        'SAP Material Number': form.sapMaterialNumber_Product,
        'SAP Material Desc.': form.materialDescription,
        Vendor: form.vendor_Supplier,
        'Manufacturer Part No.': form.manufacturerPartNumber,
        'Est. Cost Per Unit': form.estCostPerUnit != null ? `USD ${form.estCostPerUnit}` : undefined,
        'Est. Delivery Time': form.estDeliveryTime != null ? `${form.estDeliveryTime} days` : undefined,
      };
      return dispatch('N10', recipients, {
        subject: `[MMDA] New Material Created — ${form.formNumber} | ${form.formType_code} | Plant ${form.plant_plant_Plant}`,
        html: emailLayout({
          intro: 'A new material master data request has been fully approved and created in SAP.',
          note: 'Please proceed with creating the InfoRecord for this material.',
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
        card: actionCard({
          title: 'New material created',
          text: `Request ${form.formNumber} (${form.formType_code}) was approved and created in SAP. Please proceed with creating the InfoRecord for this material.`,
          fields,
          cta: { title: 'Open Request', url: reviewLink(form) },
        }),
      });
    },
  };
}

// ---- shared field set + rendering helpers ---------------------------------

const baseFields = (form) => ({
  'Request Number': form.formNumber,
  'Request Type': form.formType_code,
  Plant: form.plant_plant_Plant,
});

const contact = (name, email) => [name, email && `(${email})`].filter(Boolean).join(' ');

// Format a date/ISO string as "DD Mon YYYY" (e.g. 24 Jun 2026), dropping the time;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (v) => {
  const d = new Date(v);
  if (!v || isNaN(d)) return v;
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

async function run(id, channel, fn) {
  try {
    const result = await fn();
    if (result instanceof Error) console.error(`[notify ${id}] ${channel} failed: ${result.message}`);
    else console.log(`[notify ${id}] ${channel}: ${result}`);
  } catch (err) {
    console.error(`[notify ${id}] ${channel} threw:`, err?.message || err);
  }
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function emailLayout({ greeting = 'Hello,', intro, note, fields, cta, closing }) {
  const rows = Object.entries(fields || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:1px 16px 1px 0;font-weight:bold;vertical-align:top">${esc(k)}</td><td style="padding:1px 0">${esc(v)}</td></tr>`,
    )
    .join('');
  const link = cta?.url ? `<p><a href="${esc(cta.url)}">${esc(cta.title)}</a></p>` : '';
  return `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#000">
  ${greeting ? `<p>${esc(greeting)}</p>` : ''}
  ${intro ? `<p>${esc(intro)}</p>` : ''}
  ${note ? `<p>${esc(note)}</p>` : ''}
  <table style="border-collapse:collapse;margin:12px 0">${rows}</table>
  ${link}
  ${closing ? `<p>${esc(closing)}</p>` : ''}
  <p style="color:#777;font-size:12px;margin-top:24px">This is an automated message. Please do not reply to this email.</p>
  </body></html>`;
}

function actionCard({ title, text, fields, cta }) {
  const body = [{ type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium', wrap: true }];
  if (text) body.push({ type: 'TextBlock', text, wrap: true });
  const facts = Object.entries(fields || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([title, value]) => ({ title, value: String(value) }));
  if (facts.length) body.push({ type: 'FactSet', facts });

  const card = {
    type: 'AdaptiveCard',
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.2',
    body,
  };
  if (cta?.url) card.actions = [{ type: 'Action.OpenUrl', title: cta.title, url: cta.url, style: 'positive' }];
  return card;
}

module.exports = { getNotificationService };
