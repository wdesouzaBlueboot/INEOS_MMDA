# MMDA — Email Notification Templates

This document defines all email notifications sent by the application, including trigger conditions, recipients, and message content. Each notification maps to a function stub in [srv/cat-service.js](srv/cat-service.js).

Variables use `{{camelCase}}` notation and correspond to fields available on the `RequestForm` entity or derived from context at the time the notification fires.

---

## Available Variables

| Variable | Source |
|---|---|
| `{{formNumber}}` | `RequestForm.formNumber` (e.g. `NW-0012`) |
| `{{formType}}` | Human-readable form type (`New Stock`, `Non-Stock`, `Safety Stock Level Change`, `Deletion`, `Non-Stock to New Stock`) |
| `{{plant}}` | Plant code + name (e.g. `Carson - 3080`) |
| `{{requestorName}}` | `RequestForm.requestorName` |
| `{{requestorEmail}}` | `RequestForm.requestorEmail` |
| `{{reviewerName}}` | Display name of the reviewer performing the action |
| `{{reviewerEmail}}` | Email of the reviewer performing the action |
| `{{currentStep}}` | Step number just completed |
| `{{nextStep}}` | Next step number pending action |
| `{{nextReviewers}}` | Comma-separated list of emails for the next step |
| `{{rejectionComments}}` | `RequestForm.rejectionComments` |
| `{{sapMaterialNumber}}` | SAP material number returned after creation |
| `{{sapMaterialDescription}}` | SAP material description returned after creation |
| `{{sapError}}` | `RequestForm.sapError` |
| `{{daysWaiting}}` | Number of days since the last action |
| `{{lastActionDate}}` | Date of the last approval action taken on the form |
| `{{totalSteps}}` | Total number of approval steps in the chain |
| `{{vendor}}` | `RequestForm.vendor_Supplier` — vendor name |
| `{{functionalLocation}}` | `RequestForm.functionalLocation` |
| `{{equipmentNumber}}` | `RequestForm.equipmentNumber` |
| `{{estCostPerUnit}}` | `RequestForm.estCostPerUnit` (USD) |
| `{{unitOfMeasure}}` | `RequestForm.unitOfMeasure_UnitOfMeasure` |
| `{{estDeliveryTime}}` | `RequestForm.estDeliveryTime` (days) |
| `{{manufacturerPartNumber}}` | `RequestForm.manufacturerPartNumber` |

---

## N-1 · Form Successfully Submitted — Requestor Confirmation

**Trigger:** `after('CREATE', 'RequestForm')` → `_requestorNotification`  
**Recipients:** `requestorEmail`  
**Condition:** Always on form creation

**Subject:**
```
[MMDA] Request {{formNumber}} Successfully Submitted
```

**Body:**
```
Dear {{requestorName}},

Your material master data request has been successfully submitted and is now pending review.

  Request Number : {{formNumber}}
  Request Type   : {{formType}}
  Plant          : {{plant}}

You will be notified once the request has been reviewed. You can track the current status of your request at any time.

This is an automated message. Please do not reply to this email.
```

---

## N-2 · Action Required — Step 1 Reviewers (Initial Submission)

**Trigger:** `after('CREATE', 'RequestForm')` → `_handlePendingActionNotification(form, 0)`  
**Recipients:** All reviewers configured at Step 1 for the form's plant + form type  
**Condition:** Only when environment variable `NOTIFY_{{FORMTYPE}}` is set to `TRUE`

**Subject:**
```
[MMDA] Action Required — New {{formType}} Request {{formNumber}}
```

**Body:**
```
Hello,

A new material master data request requires your approval.

  Request Number : {{formNumber}}
  Request Type   : {{formType}}
  Plant          : {{plant}}
  Submitted By   : {{requestorName}} ({{requestorEmail}})

Please review the request and approve or reject it as appropriate.

This is an automated message. Please do not reply to this email.
```

---

## N-3 · Action Required — Next Step Reviewers (Partial Approval)

**Trigger:** `_manageRequestForm` → approval decision → `_handlePendingActionNotification(form, currentStep)`  
**Recipients:** All reviewers configured at Step `{{nextStep}}` for the form's plant + form type  
**Condition:** When a step is approved and there are remaining steps (form moves to `Partially Approved`)

**Subject:**
```
[MMDA] Action Required — {{formType}} Request {{formNumber}} (Step {{nextStep}} of {{totalSteps}})
```

**Body:**
```
Hello,

A material master data request has been approved at Step {{currentStep}} and is now awaiting your action at Step {{nextStep}}.

  Request Number : {{formNumber}}
  Request Type   : {{formType}}
  Plant          : {{plant}}
  Submitted By   : {{requestorName}} ({{requestorEmail}})

Please review the request and approve or reject it as appropriate.

This is an automated message. Please do not reply to this email.
```

---

## N-4 · Request Rejected — Requestor and Previous Approvers

**Trigger:** `_manageRequestForm` → `'REJECTED'` decision → `_handleRejectionNotifications`  
**Recipients:**
- `requestorEmail`
- All reviewers who previously approved the form (from `FormApprovalSteps` where `status = 'APPROVED'`)
- The reviewer who performed the rejection (`reviewerEmail`)

**Condition:** When any reviewer rejects a form at their step

**Subject:**
```
[MMDA] Request {{formNumber}} Has Been Rejected
```

**Body:**
```
Hello,

The following material master data request has been rejected at Step {{currentStep}}.

  Request Number  : {{formNumber}}
  Request Type    : {{formType}}
  Plant           : {{plant}}
  Submitted By    : {{requestorName}} ({{requestorEmail}})
  Rejected By     : {{reviewerName}} ({{reviewerEmail}})
  Rejection Reason: {{rejectionComments}}

The requestor has been notified and may edit and resubmit the request after addressing the rejection reason.

This is an automated message. Please do not reply to this email.
```

---

## N-5 · Request Fully Approved — Requestor and All Approvers

**Trigger:** `_manageRequestForm` → `currentStep === totalSteps` → `_handleFinalApprovalNotification`  
**Recipients:**
- `requestorEmail`
- All reviewers who approved the form (from `FormApprovalSteps`)  
**Condition:** After final approval step and successful SAP material creation/update

**Subject:**
```
[MMDA] Request {{formNumber}} Fully Approved — SAP Material {{sapMaterialNumber}}
```

**Body:**
```
Hello,

The following material master data request has been fully approved and successfully processed in SAP.

  Request Number       : {{formNumber}}
  Request Type         : {{formType}}
  Plant                : {{plant}}
  Submitted By         : {{requestorName}} ({{requestorEmail}})
  SAP Material Number  : {{sapMaterialNumber}}
  SAP Material Desc.   : {{sapMaterialDescription}}

This is an automated message. Please do not reply to this email.
```

> **Note:** For `SafetyStock` and `NonToStock` requests, `{{sapMaterialNumber}}` and `{{sapMaterialDescription}}` refer to the existing material — the one whose safety stock was updated (`SafetyStock`) or that was converted to stock (`NonToStock`). For `Deletion` requests, there is no SAP material creation and this notification is sent immediately after final approval.

---

## N-6 · SAP Creation Error — Final Approver

**Trigger:** `_executeSAPMaterialCreate`, `_executeSAPSafetyStockUpdate`, or `_executeSAPNonToStockConversion` catch block → sets `generalStatus = 'SAP_ERROR'`  
**Recipients:** The reviewer who performed the final approval (last step reviewer), identified from the most recent `FormApprovalSteps` entry  
**Condition:** When the SAP API call fails after final approval

**Subject:**
```
[MMDA] SAP Error — Request {{formNumber}} Requires Attention
```

**Body:**
```
Hello,

The material master data request below was fully approved, but an error occurred during SAP processing. The request has been placed in SAP_ERROR status and requires your attention.

  Request Number  : {{formNumber}}
  Request Type    : {{formType}}
  Plant           : {{plant}}
  Submitted By    : {{requestorName}} ({{requestorEmail}})
  SAP Error Detail: {{sapError}}

To retry, open the request and use the Approve action again once the underlying issue has been resolved.

This is an automated message. Please do not reply to this email.
```

---

## N-7 · Approval Reminder — Stalled Request

**Trigger:** Daily cron job (`jobs.js`, runs at 00:00) → `checkPendingApprovals`  
**Recipients:** All reviewers configured at the current pending step for the form's plant + form type  
**Condition:** A form has been in `Submitted` or `Partially Approved` status for more than `REMINDER_DAYS_LIMIT` days (default: 7) without action at the current step

**Subject:**
```
[MMDA] Reminder — Request {{formNumber}} Is Awaiting Your Approval ({{daysWaiting}} days)
```

**Body:**
```
Hello,

This is a reminder that the following material master data request has been waiting for your approval for {{daysWaiting}} days.

  Request Number : {{formNumber}}
  Request Type   : {{formType}}
  Plant          : {{plant}}
  Submitted By   : {{requestorName}} ({{requestorEmail}})
  Pending Since  : {{lastActionDate}}
  Current Step   : {{nextStep}}

Please review and action the request at your earliest convenience.

This is an automated message. Please do not reply to this email.
```

---

## N-8 · SAP Error Escalation — Stalled in SAP_ERROR

**Trigger:** Daily cron job (`jobs.js`, runs at 00:00) → `checkSapErrors`  
**Recipients:** The reviewer who performed the final approval step (`FormApprovalSteps` entry with highest step number)  
**Condition:** A form has been in `SAP_ERROR` status for more than `REMINDER_DAYS_LIMIT` days (default: 7)

**Subject:**
```
[MMDA] Reminder — Request {{formNumber}} Is Still in SAP Error ({{daysWaiting}} days)
```

**Body:**
```
Hello,

This is a reminder that the following material master data request has been in SAP_ERROR status for {{daysWaiting}} days and still requires your attention.

  Request Number   : {{formNumber}}
  Request Type     : {{formType}}
  Plant            : {{plant}}
  Submitted By     : {{requestorName}} ({{requestorEmail}})
  In Error Since   : {{lastActionDate}}
  SAP Error Detail : {{sapError}}

To retry, open the request and use the Approve action again once the underlying issue has been resolved.

This is an automated message. Please do not reply to this email.
```

---

## N-9 · BOM Planner Notification — New Material in Plant

**Trigger:** `_handleFinalApprovalNotification` → `_handleInfoRecordBOMNotifications`  
**Recipients:** The `PlanningLead` of type `BOM` configured for the form's plant  
**Condition:** Form type is `NewStock` or `NonStock`, final approval is complete, and `isPartOfBOM = true`

**Subject:**
```
[MMDA] New Material Part of BOM — {{formNumber}} | Plant {{plant}}
```

**Body:**
```
Hello,

A new material master data request that includes a Bill of Materials association has been fully approved and created in SAP.

  Request Number       : {{formNumber}}
  Plant                : {{plant}}
  SAP Material Number  : {{sapMaterialNumber}}
  SAP Material Desc.   : {{sapMaterialDescription}}
  Functional Location  : {{functionalLocation}}
  Equipment Number     : {{equipmentNumber}}

This is an automated message. Please do not reply to this email.
```

---

## N-10 · InfoRecord Planner Notification — New Material Created

**Trigger:** `_handleFinalApprovalNotification` → `_handleInfoRecordBOMNotifications`  
**Recipients:** All `PlanningLead` entries of type `InfoRecord` matching the form's plant or wildcard (`*`)  
**Condition:** Form type is `NewStock` or `NonStock`, final approval is complete

**Subject:**
```
[MMDA] New Material Created — {{formNumber}} | {{formType}} | Plant {{plant}}
```

**Body:**
```
Hello,

A new material master data request has been fully approved and created in SAP. An InfoRecord may need to be created.

  Request Number         : {{formNumber}}
  Request Type           : {{formType}}
  Plant                  : {{plant}}
  SAP Material Number    : {{sapMaterialNumber}}
  SAP Material Desc.     : {{sapMaterialDescription}}
  Vendor                 : {{vendor}}
  Manufacturer Part No.  : {{manufacturerPartNumber}}
  Est. Cost Per Unit     : {{estCostPerUnit}} {{unitOfMeasure}}
  Est. Delivery Time     : {{estDeliveryTime}} days
  Vendor Quote           : [See attachments on the request]

This is an automated message. Please do not reply to this email.
```

---

## Summary Table

| # | Notification | Trigger function | Recipients |
|---|---|---|---|
| N-1 | Form submitted — requestor confirmation | `_requestorNotification` | Requestor |
| N-2 | Action required — Step 1 reviewers | `_handlePendingActionNotification(form, 0)` | Step 1 reviewers |
| N-3 | Action required — next step reviewers | `_handlePendingActionNotification(form, N)` | Step N+1 reviewers |
| N-4 | Request rejected | `_handleRejectionNotifications` | Requestor + all previous approvers + rejector |
| N-5 | Request fully approved | `_handleFinalApprovalNotification` | Requestor + all approvers |
| N-6 | SAP creation error | `_executeSAPMaterialCreate` / `_executeSAPSafetyStockUpdate` catch | Final approver |
| N-7 | Approval reminder (7-day) | `checkPendingApprovals` (cron) | Current pending step reviewers |
| N-8 | SAP error escalation (7-day) | `checkSapErrors` (cron) | Final approver |
| N-9 | BOM planner — new material | `_handleInfoRecordBOMNotifications` | BOM PlanningLead for plant |
| N-10 | InfoRecord planner — new material | `_handleInfoRecordBOMNotifications` | InfoRecord PlanningLead(s) for plant |
