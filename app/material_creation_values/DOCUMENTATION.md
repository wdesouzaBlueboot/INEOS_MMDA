# Material Creation Values — User Documentation

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Who Uses It](#2-who-uses-it)
3. [Key Concepts](#3-key-concepts)
4. [Navigating the App](#4-navigating-the-app)
5. [Managing Configuration Entries](#5-managing-configuration-entries)
6. [How This Affects Material Creation](#6-how-this-affects-material-creation)

---

## 1. What This App Does

**Material Creation Values** defines the default SAP field values used when a new material is automatically created in S/4HANA after a request has been fully approved.

When the last approval step is completed for a New Stock, Non-Stock, or Non-Stock to New Stock request, the system looks up this table to determine which SAP defaults to apply (material type, MRP settings, valuation class, storage data, etc.). New Stock and Non-Stock requests use these values to create the material via the S/4HANA API; a Non-Stock to New Stock request applies a reduced subset of them to convert (update) an existing material. This app is where those defaults are configured.

---

## 2. Who Uses It

| Role | What they can do |
|---|---|
| **Manager** | View, create, edit, and delete configuration entries |
| **Reviewer** | No access |
| **Requestor** | No access |

This is a manager-only configuration app. Changes here affect the SAP data of every material created after saving.

---

## 3. Key Concepts

### Row selection at approval time

Each entry represents a specific combination of conditions. When a request is fully approved, the system filters this table by the request's **plant** and **form type**, then further narrows down by matching the **repairable status** and **cost threshold** provided in the form.

The first row that satisfies all conditions is used to create the material. If no row matches, the approval completes but SAP material creation fails with an error.

### Matching fields

Three fields are used to select the correct row:

| Field | Description |
|---|---|
| **Request Plant** | The plant the requestor selected on the form |
| **Form Type** | New Stock, Non-Stock, or Non-Stock to New Stock |
| **Repairable Status** | (New Stock and Non-Stock to New Stock) Whether the material is repairable or not |

### Cost threshold (New Stock only)

For New Stock entries, two additional fields define a cost range condition that is evaluated against the **Estimated Cost Per Unit** entered on the form:

- **Cost Operator** — `<` (less than) or `>` (greater than or equal to)
- **Cost Threshold** — the value to compare against

Each plant typically has four New Stock rows: two for repairable status × two for cost bands (below and above a threshold). This allows different SAP defaults to apply to, for example, a low-cost standard spare versus a high-value capital spare.

Non-Stock entries have no cost condition and use a single row per plant. Non-Stock to New Stock entries also have no cost condition, but they do use repairable status, so each plant has two rows (repairable and not repairable).

### Request Plant vs. SAP creation plant

The **Request Plant** field (used for row matching) and the **Plant** field (the SAP plant code sent to S/4HANA during material creation) are distinct. In some cases they differ — for example, a request submitted against one plant may result in a material being created under a different SAP plant code. This is an intentional cross-plant configuration set up by the system administrator.

### Price Control

The **Price Control** field determines the valuation method in SAP:

| Value | Method | Additional field required |
|---|---|---|
| `V` | Moving Average Price — the SAP moving average is used | None |
| `S` | Standard Price — a fixed price is set at creation | **Standard Price** (mandatory) |

The Standard Price field is only shown and required when Price Control is set to `S`.

### Category

The **Category** field is a free-text label (e.g. "Stock", "Repairable", "Capital Spare") used to make rows easier to identify in the list. It is not sent to SAP.

---

## 4. Navigating the App

When you open the app you land on the **List Report** — a table showing all configured entries across all plants and form types. You can filter, sort, and search across all columns.

The key columns for identifying a row are: Request Plant, Form Type, Repairable Status, Cost Operator, and Cost Threshold. All other columns are the SAP default values that will be used during material creation.

Clicking a row opens the **Object Page**, which shows all fields and allows editing.

---

## 5. Managing Configuration Entries

### Creating a new entry

1. Click **Create** on the List Report.
2. Fill in the **matching fields** first — these define when this row applies:
   - **Request Plant** — the plant this entry covers.
   - **Form Type** — New Stock, Non-Stock, or Non-Stock to New Stock.
   - **Repairable Status** — (New Stock and Non-Stock to New Stock) Repairable or Not Repairable.
   - **Cost Operator** and **Cost Threshold** — (New Stock only) define the cost band condition.
3. Fill in the **SAP default values** — all fields listed in the table below are mandatory unless noted:

4. Click **Create**.

### Editing a single entry

1. Click the row on the List Report.
2. Click **Edit** on the Object Page.
3. Modify the required fields and click **Save**.

Changes take effect for any request whose final approval step is completed after saving.

### Mass editing multiple entries

When the same SAP default value needs to be updated across many rows at once (e.g. changing the MRP Controller for all plants), use the **Mass Edit** feature instead of opening each row individually:

1. Select the rows you want to update by checking their checkboxes on the List Report. To select all rows, use the checkbox in the table header.
2. Click **Edit** in the toolbar.
3. A dialog opens showing all editable fields. Fill in only the fields you want to change — fields left blank are not modified on the selected rows.
4. Click **Apply** to save the changes.

All fields are available for mass editing, including the matching fields (Request Plant, Form Type, Repairable Status, Cost Operator, Cost Threshold) and all SAP default values. Take care when mass-editing matching fields, as changing them may cause rows to no longer match their intended request combinations.

### Deleting an entry

1. Select one or more rows on the List Report.
2. Click **Delete** and confirm the dialog.

If a row is deleted and no other row matches an approved request's plant, form type, and cost conditions, the approval will complete but the SAP material creation will fail with an error. Ensure adequate coverage before deleting.

---

## 6. How This Affects Material Creation

### When material creation is triggered

SAP material creation is triggered for **New Stock** and **Non-Stock** requests, and only after the request has passed **all approval steps** in the hierarchy. **Non-Stock to New Stock** requests also use this table on final approval, but to *convert* (update) an existing material rather than create a new one.

Safety Stock and Deletion requests do not use this table — they trigger a different SAP operation (safety stock update) or no SAP action respectively.

### Row selection logic

The system applies the following logic to select the configuration row:

1. Filter by `requestPlant` matching the form's plant and `formType` matching the form's type.
2. For **Non-Stock**: the single matching row is used directly (no cost or repairable condition).
3. For **Non-Stock to New Stock**: the row is matched by plant + form type + repairable status (no cost condition); its values are applied as a targeted update to the existing material rather than a full creation.
4. For **New Stock**: among the filtered rows, find the one where:
   - `repairableStatus` matches the form's repairable status, and
   - the cost condition (`costOperator` applied to `costThreshold`) is satisfied by the form's estimated cost per unit.

If no row is found, material creation fails and the request status is set to `SAP_ERROR`. The last approver can then correct the configuration and retry.

