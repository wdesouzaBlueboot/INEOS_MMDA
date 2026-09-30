# Maintain Hierarchy — User Documentation

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Who Uses It](#2-who-uses-it)
3. [Key Concepts](#3-key-concepts)
4. [Navigating the App](#4-navigating-the-app)
5. [Managing Approval Steps](#5-managing-approval-steps)
6. [How This Affects the Request Form](#6-how-this-affects-the-request-form)

---

## 1. What This App Does

**Maintain Hierarchy** lets managers define who must approve each type of material request, and in what order.

Before a requestor can submit a material request, someone must have configured an approval chain here for the relevant plant and request type. If no chain exists, the request form will not allow submission for that combination.

---

## 2. Who Uses It

| Role | What they can do |
|---|---|
| **Manager** | View, create, edit, and delete approval steps |
| **Reviewer** | View the full configuration (read-only) |
| **Requestor** | No access |

Reviewers can open this app to understand their position in the approval chain for a given plant and request type, but cannot make changes.

---

## 3. Key Concepts

### Plant + Form Type combination

Each approval chain is specific to a **plant** (an SAP facility code, e.g. `3030`) and a **form type** (the kind of material request). The five form types are:

| Form Type | Description |
|---|---|
| New Stock | Request to create a new stock material |
| Non-Stock | Request to create a non-stock material |
| Safety Stock | Request to change a safety stock level |
| Deletion | Request to delete a material |
| Non-Stock to New Stock | Request to convert an existing non-stock material into a stock material |

A plant can have different reviewers for different form types.

> **Non-Stock to New Stock is only configured for a subset of plants.** Because this request type is restricted to plants where the material already exists, its approval chains are defined only for those plants (currently 3016, 3030, and 3080). A plant with no Non-Stock to New Stock chain does not offer that request type — this is how plants 3040 and 3202 are intentionally excluded.

### Steps and reviewers

Each row in the table represents **one reviewer at one step** of the approval process for a given plant + form type.

- **Step 1** is the first person notified when a request is submitted.
- **Step 2** is notified only after step 1 has approved.
- And so on.

If two rows share the same step number for the same plant + form type, **either** of those reviewers can advance the request — they are parallel alternatives at that step. This is useful when a role is covered by more than one person.

### Example

| Plant | Form Type | Step | Reviewer |
|---|---|---|---|
| 3030 | New Stock | 1 | alice@company.com |
| 3030 | New Stock | 1 | carol@company.com |
| 3030 | New Stock | 2 | bob@company.com |

In this example, either Alice or Carol must approve first. Once one of them approves, Bob receives the request for final approval.

---

## 4. Navigating the App

When you open the app you land on the **List Report** — a table showing every configured approval step across all plants and form types. You can filter, sort, and search across any column.

Clicking a row opens the **Object Page**, which shows the full detail of that step and allows editing.

---

## 5. Managing Approval Steps

### Creating a new step

1. Click **Create** on the List Report.
2. Fill in the four required fields:
   - **Plant** — selected from a search dialog; shows plant code and name. Typing in the field filters the list.
   - **Form Type** — selected from a dropdown of the five types.
   - **Step** — a number indicating the position in the chain. Use 1 for the first approver, 2 for the second, etc.
   - **Reviewer** — the email address of the person who will approve at this step.
3. The **Plant Name** fills in automatically once you select a plant.
4. Click **Create**.

All four fields are mandatory. The form will not save if any are left blank.

### Editing a step

1. Click the row on the List Report.
2. Click **Edit** on the Object Page.
3. Modify any field and click **Save**.

You can change the step number, the reviewer email, the plant, or the form type. The change applies to all requests submitted after saving.

### Deleting a step

1. Select one or more rows on the List Report.
2. Click **Delete** and confirm the dialog.

If you delete all rows for a plant + form type, requestors will no longer be able to submit that type of request for that plant — they will not see it as an available option in the request form.

---

## 6. How This Affects the Request Form

### Available plants

The request form (`req_material_master_data`) only shows plants that have at least one configured approval step here. Adding a plant here makes it available to requestors; removing all its steps hides it from the form.

### Approval routing

When a requestor submits a form, the system reads the current configuration to determine who to notify. The flow is:

1. All step-1 reviewers for that plant + form type receive an approval notification.
2. Once any one of them approves, all step-2 reviewers are notified.
3. This continues until the final step, at which point the SAP material operation is triggered in S/4HANA.

