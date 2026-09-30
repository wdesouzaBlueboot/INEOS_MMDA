# Material Master Data Request — User Documentation

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Who Uses It](#2-who-uses-it)
3. [Key Concepts](#3-key-concepts)
4. [Navigating the App](#4-navigating-the-app)
5. [Submitting a Request](#5-submitting-a-request)
6. [Reviewing and Approving Requests](#6-reviewing-and-approving-requests)
7. [Status Reference](#7-status-reference)

---

## 1. What This App Does

**Material Master Data Request** is the main form application used to request changes to material master data in SAP. Requestors fill in a form describing the material, submit it for approval, and the system routes it through a sequential approval chain. Once all approvers sign off, the material operation is automatically executed in S/4HANA.

---

## 2. Who Uses It

| Role | What they can do |
|---|---|
| **Requestor** | Create, edit, and submit requests; view their own submissions; resubmit after rejection |
| **Reviewer** | View assigned requests; approve or reject at their designated step; edit certain procurement fields |
| **Manager** | View all requests (read-only); no approval or submission capability |

Requestors only see their own requests. Reviewers see requests where they are a designated approver for the relevant plant and form type. Managers have full visibility across all requests.

---

## 3. Key Concepts

### Form types

Each request belongs to one of five form types, which determines which fields are shown and which SAP operation is triggered on final approval:

| Form Type | Purpose | SAP outcome |
|---|---|---|
| **New Stock** | Add a new stock material to inventory | Material created in S/4HANA |
| **Non-Stock** | Add a new non-stock material | Material created in S/4HANA |
| **Safety Stock Level Change** | Adjust the safety stock quantity for an existing material | Safety stock updated in S/4HANA |
| **Deletion** | Remove a material from SAP | No automated SAP action (handled manually) |
| **Non-Stock to New Stock** | Convert an existing non-stock material into a stock material | Existing material updated to stock in S/4HANA |

### Non-Stock to New Stock — plant restrictions

A **Non-Stock to New Stock** request may only be raised for a plant where the non-stock material **already exists**. Restricting the request to valid plant/material combinations keeps requestors from submitting for plant/material pairs that cannot be processed.

As a direct consequence, the combinations **plant 3040 + Non-Stock to New Stock** and **plant 3202 + Non-Stock to New Stock** cannot be created as request forms. This is a deliberate business decision — materials for those plants are always created in plant **3016**, so requests for them should be submitted under plant 3016 instead.

This exclusion is enforced through the approval hierarchy: the 3040 and 3202 combinations for this form type are intentionally **left undefined in Maintain Hierarchy**. Because a request form can only be created for a plant/form-type combination that exists in the hierarchy, no form can be raised for those two combinations.

### Approval chain

Each request passes through a sequential chain of approval steps defined in **Maintain Hierarchy** for the selected plant and form type. The number of steps and the reviewers vary by plant.

- At each step, one or more reviewers are assigned. Any one of them can advance the request.
- If a request is rejected at any step, it is returned to the requestor for correction and resubmission.

### Draft and submission

Requests support a draft mode. A form can be saved as a draft and returned to later before submission. The form is only visible to reviewers after it has been submitted (draft activated).

### Characteristic value help

When you select a **Material Class** (New Stock and Non-Stock), the Characteristics section fills with the characteristics defined for that class in SAP. Each characteristic field appears as one of two input types:

- **Dropdown (value help)** — you pick from a predefined list of values. This happens when the characteristic is either defined in SAP as *Additional Value Not Allowed* (only predefined values are accepted), or configured with **Use Value List** turned on.
- **Free-text field** — you type any value. This is the default when the characteristic has no such configuration.

The SAP definition always wins: a characteristic marked *Additional Value Not Allowed* in SAP renders as a dropdown regardless of local configuration. Which characteristics use a value list is maintained by managers in the **Characteristic Configuration** app — see its documentation for the full precedence rules.

### Reviewer-editable fields

Three procurement fields can only be edited by a reviewer, not by the requestor:

| Field |
|---|
| **Material Group Number** |
| **Unit of Measure** |
| **Minimum Lot Size** |

---

## 4. Navigating the App

### List Report

When you open the app you land on the **List Report**. For the **Reviewer** by default it shows only the requests that currently require your action (**Action Required Only** filter is on). To see all requests, clear that filter.

The list columns are:

| Column | Description |
|---|---|
| Form Number | System-generated identifier (e.g. `NW-0012`) |
| Requestor Name | Who submitted the request |
| Request Type | New Stock, Non-Stock, Safety Stock Level Change, or Deletion |
| Plant | The plant associated with the request |
| Status | Current state in the approval workflow |
| Vendor | Vendor associated with the material |
| Material Class | SAP classification |

Clicking a row opens the **Object Page** with the full form detail.

### Object Page

The Object Page is organised into sections. Which sections are visible depends on the form type and status:

- **General Information** — form metadata (number, status, requestor, rejection comments if rejected)
- **Approval Status** — a table showing the full approval history and pending steps (not shown for drafts)
- **Request Details** — the main form fields (varies by form type; see [Submitting a Request](#5-submitting-a-request))
- **Characteristics** — the list of characteristic fields tied to the selected material class; each must be filled (New Stock and Non-Stock only)
- **Attachments** — vendor quotes or spec sheets (New Stock and Non-Stock only)

---

## 5. Submitting a Request

### Creating a new request

1. Click **Create** on the List Report.
2. Select the **Form Type**. This determines which fields are shown.
3. Fill in all required fields (described per form type below).
4. Add attachments if required (New Stock and Non-Stock).
5. Click **Create** to submit. The form is immediately routed to the first reviewer.

> The form number is generated automatically on submission. The requestor name and email are populated from your logged-in user.

---

### New Stock

Used to request the creation of a new stock material. This is the most complete form.

**Master Data**

| Field | Required | Notes |
|---|---|---|
| Plant | Yes | Determines the approval chain |
| Is Master Data Request (48h) | Yes | |
| Is This Request the Result of MOC | Yes | |
| MOC Number | If MOC = Yes | |
| Functional Location | Yes | |
| Equipment Serial Number | Yes | |
| If Item Is a Chemical | Yes | "Yes" or "Not Applicable" |
| Will It Be Included in a BOM | Yes | If Yes, a BOM planning lead is notified after approval |
| Summarize Justification | Yes | |

**Vendor & Manufacturer**

| Field | Required |
|---|---|
| Vendor | Yes |
| Vendor Part Number | Yes |
| Manufacturer | Yes |
| Manufacturer Part Number | Yes |

**Material Classification**

| Field | Required | Notes |
|---|---|---|
| Material Class | Yes | Selecting a class loads its characteristics in the Characteristics section |
| Material Group Number | Yes | Editable by reviewer only |

**Characteristics**

Once a Material Class is selected, the **Characteristics** section is populated with the fields defined for that class. All characteristic values are mandatory — the form cannot be submitted until every one is filled.

**Cost & Logistics**

| Field | Required | Notes |
|---|---|---|
| Estimated Cost Per Unit (USD) | Yes | |
| Unit of Measure | Yes | Editable by reviewer only |
| Estimated Delivery Time (Days) | Yes | |
| Estimated Usage Per Year | Yes | |
| Minimum Lot Size | Yes | Editable by reviewer only |

**Serviceability**

| Field | Required | Notes |
|---|---|---|
| Is Item Repairable | Yes | |
| Repair Time Estimate | If Repairable = Yes | |
| Max Quantity Per Single Use | Yes | |
| Safety Stock Requested | Yes | |
| Are There Special Storage Requirements | Yes | |
| Is Preventative Maintenance Required | Yes | |
| Will Requestor Supply Initial Stock | Yes | |

**Attachments** — at least one attachment is required (e.g. vendor quote).

---

### Non-Stock

Similar to New Stock but for non-stock materials. The following fields from New Stock are **not** included:

- Functional Location
- Estimated Usage Per Year
- Is Item Repairable / Repair Time Estimate
- Max Quantity Per Single Use
- Special Storage Requirements
- Is Preventative Maintenance Required
- Will Requestor Supply Initial Stock

All other New Stock fields apply. At least one attachment is required.

---

### Safety Stock Level Change

Minimal form for adjusting the safety stock quantity of an existing material.

| Field | Required |
|---|---|
| Plant | Yes |
| Material Number | Yes — selected from SAP lookup |
| Material Description | Read-only, auto-populated |
| Safety Stock Requested | Yes |

---

### Deletion

Minimal form to flag a material for deletion.

| Field | Required |
|---|---|
| Plant | Yes |
| Material Number | Yes — selected from SAP lookup |
| Material Description | Read-only, auto-populated |

---

### After submission

Once submitted, the form status moves to **Submitted** and the first reviewers in the approval chain are notified. The requestor can still edit and resubmit the form as long as no reviewer has acted on it yet (step 1 has not been approved or rejected).

Once a reviewer approves step 1, the form becomes **read-only** for the requestor until the process concludes.

If the request is **rejected** at any step, the requestor can edit and resubmit. On resubmission the approval history is cleared and the chain restarts from step 1.

---

## 6. Reviewing and Approving Requests

### Finding requests that need action

The list defaults to **Action Required Only = Yes**, showing only requests where it is currently your turn to act. You can turn this off to browse all requests in the chain.

### Approving

1. Open the request from the list.
2. Review all form fields and attachments.
3. If needed, update the reviewer-editable fields (Material Group Number, Unit of Measure, Minimum Lot Size).
4. Click **Approve**.

If you are not the last approver, the request advances to the next step and the next reviewer is notified. If you are the last approver, the SAP operation is triggered automatically.

### Rejecting

1. Open the request.
2. Click **Reject**.
3. Optionally enter rejection comments to explain what needs to be corrected.
4. Click **Confirm**.

The request is returned to the requestor with status **Rejected** and the comments are displayed on the form.

### Editing before approving

Reviewers at step 1 or the final step (when retrying after an SAP error) can edit the form before approving. This is limited to the three reviewer-editable procurement fields. Click **Edit** on the Object Page, make changes, then **Save** before approving.

### SAP processing errors

If the final approval triggers a material creation in SAP and that creation fails, the request status changes to **SAP_ERROR** and the error message is displayed on the form. The last approver can edit the configuration (if needed) and re-approve to retry. No other user can act on the form until the error is resolved.

---

## 7. Status Reference

| Status | Meaning | Who can act |
|---|---|---|
| **Draft** | Created but not yet submitted | Requestor (edit, submit) |
| **Submitted** | Submitted, awaiting step 1 reviewer | Step 1 reviewer (approve/reject) |
| **Partially Approved** | At least one step approved, more steps remain | Next step reviewer (approve/reject) |
| **Approved** | All steps approved, SAP operation completed | Nobody — form is read-only |
| **Rejected** | Rejected by a reviewer | Requestor (edit and resubmit) |
| **SAP_ERROR** | Final approval succeeded but S/4HANA returned an error | Last approver (retry) |
