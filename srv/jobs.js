const cron = require('node-cron');
const cds = require('@sap/cds');

/**
 * Initializes scheduled tasks
 */
const initJobs = (service) => {
    // Scheduled for every day at 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron Job] Scanning for stalled requests...');

        // Execute in a separate thread with DB access
        cds.spawn({ user: cds.User.privileged }, async (tx) => {
            await checkPendingApprovals(tx, service);
            await checkSapErrors(tx, service);
        });
    });
    
    console.log('[Cron Job] Scheduled tasks initialized successfully.');
};

/**
 * Main timing evaluation logic
 */
async function checkPendingApprovals(tx, service) {
    const { RequestForm, FormApprovalSteps, ReviewHierarchy } = service.entities;
    
    // Number of days before sending reminder notification
    const daysLimit = parseInt(process.env.REMINDER_DAYS_LIMIT || '7', 10);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() - daysLimit);
    const sDeadline = deadlineDate.toISOString();

    // Get requests that have not finished the flow
    const pendingForms = await tx.run(
        SELECT.from(RequestForm).where({
            generalStatus: { 'in': ['Submitted', 'Partially Approved'] }
        })
    );

    for (const form of pendingForms) {
        // Get the approval history of this request
        const history = await tx.run(
            SELECT.from(FormApprovalSteps)
                .where({ parentForm_ID: form.ID })
                .orderBy('step desc')
        );

        let lastActionDate;
        let lastStatus = null;

        if (history.length === 0) {
            // Case: Just submitted (Status: Submitted)
            lastActionDate = form.createdAt;
        } else {
            // Case: Intermediate approval (Status: Partially Approved)
            lastActionDate = history[0].reviewedAt;
            lastStatus = history[0].status;
        }

        // Evaluate: Have the configured amount of days passed?
        if (lastActionDate < sDeadline && (lastStatus === 'APPROVED' || lastStatus === null)) {
            
            const nextStepNumber = history.length + 1;

            // Find who is next in the hierarchy for this plant and type
            const nextReviewers = await tx.run(
                SELECT.from(ReviewHierarchy).where({
                    plant_Plant: form.plant_plant_Plant,
                    formType_code: form.formType_code,
                    step: nextStepNumber
                })
            );

            if (nextReviewers.length > 0) {
                console.log(`[Job] Request ${form.ID} requires attention from step ${nextStepNumber}`);

                // N-7 · approval reminder to the current pending step's reviewers
                const reviewerEmails = [...new Set(nextReviewers.map(r => r.reviewer).filter(Boolean).map(e => e.toLowerCase()))];
                const daysWaiting = Math.floor((Date.now() - new Date(lastActionDate).getTime()) / 86400000);
                if (reviewerEmails.length && service.notifier) {
                    await service.notifier.reminder(form, reviewerEmails, {
                        daysWaiting,
                        nextStep: nextStepNumber,
                        lastActionDate,
                    });
                }
            }
        }
    }
}

/**
 * Notifies the last approver for requests that have been stuck in SAP_ERROR
 * for more than REMINDER_DAYS_LIMIT days (default: 7).
 */
async function checkSapErrors(tx, service) {
    const { RequestForm, FormApprovalSteps } = service.entities;

    const daysLimit = parseInt(process.env.REMINDER_DAYS_LIMIT || '7', 10);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() - daysLimit);
    const sDeadline = deadlineDate.toISOString();

    const stalledForms = await tx.run(
        SELECT.from(RequestForm).where({ generalStatus: 'SAP_ERROR' })
    );

    for (const form of stalledForms) {
        if (form.modifiedAt < sDeadline) {
            // The last approver is the reviewer who completed the final step
            const lastStep = await tx.run(
                SELECT.one.from(FormApprovalSteps)
                    .where({ parentForm_ID: form.ID })
                    .orderBy('step desc')
            );

            if (lastStep) {
                console.log(`[Job] Request ${form.formNumber} has been in SAP_ERROR for over ${daysLimit} days. Last approver: ${lastStep.reviewedBy}`);

                // N-8 · SAP error escalation to the final approver
                const daysWaiting = Math.floor((Date.now() - new Date(form.modifiedAt).getTime()) / 86400000);
                if (lastStep.reviewedBy && service.notifier) {
                    await service.notifier.sapErrorEscalation(form, lastStep.reviewedBy, {
                        daysWaiting,
                        lastActionDate: form.modifiedAt,
                    });
                }
            }
        }
    }
}

module.exports = { initJobs };