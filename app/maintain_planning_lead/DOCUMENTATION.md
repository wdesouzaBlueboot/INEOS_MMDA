# Maintain Planning Lead — User Documentation

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Who Uses It](#2-who-uses-it)
3. [Key Concepts](#3-key-concepts)
4. [Navigating the App](#4-navigating-the-app)
5. [Managing Planning Leads](#5-managing-planning-leads)
6. [How This Affects the Approval Workflow](#6-how-this-affects-the-approval-workflow)

---

## 1. What This App Does

**Maintain Planning Lead** lets managers designate who should be notified after a material request is fully approved, depending on the type of planning action required.

Once a request completes its full approval chain, the system looks up the relevant planning leads for that plant and request type and sends them a notification with the material details. This app is where those contacts are defined.

---

## 2. Who Uses It

| Role | What they can do |
|---|---|
| **Manager** | View, create, edit, and delete planning lead entries |
| **Reviewer** | No access |
| **Requestor** | No access |

This is a manager-only configuration app. Planning leads themselves are not aware of this configuration — they simply receive email notifications when relevant requests are approved.

---

## 3. Key Concepts

### Planning lead types

Each planning lead entry is assigned a **type** that defines what kind of planning action they are responsible for:

| Type | Responsibility |
|---|---|
| **BOM** | Bill of Materials planning — notified when a new material needs to be added to a BOM |
| **InfoRecord** | Procurement planning — notified when a new material requires vendor or supply chain setup |

A person can appear multiple times in this list, once for each type or scope they cover.

### Scope: Type, Plant, and Form Type

Each entry is defined by three dimensions: **type** (BOM or InfoRecord), **plant**, and **form type** (the Request Type field in the UI). The wildcard value (`*`) can appear in the plant and form type fields, but its meaning differs depending on the type:

**Request Type — BOM entries always use `*`**

BOM leads do not differentiate by form type. A BOM notification is triggered whenever a material is flagged for BOM inclusion (i.e. Question 10 answered Yes), regardless of whether the form is New Stock, Non-Stock, etc. For this reason, all BOM entries use `*` in the Request Type field. This is not a catch-all fallback — it is the standard and only way BOM leads are configured.

**Plant — InfoRecord Non-Stock entries use `*`**

For InfoRecord entries, the plant value can be either a specific plant code or `*`. Non-Stock Info Record leads use `*` because the same contacts handle Non-Stock procurement for all plants, so there is no need to repeat the entry per plant. New Stock Info Record leads, on the other hand, are assigned per plant since each site has its own contacts.

### Example

| Type | Request Type | Plant | Name | Email |
|---|---|---|---|---|
| BOM | * | 3016 | Alice Smith | alice@company.com |
| BOM | * | 3030 | Bob Jones | bob@company.com |
| InfoRecord | NonStock | * | Carol Global | carol@company.com |
| InfoRecord | NewStock | 3016 | Dave Buyer | dave@company.com |
| InfoRecord | NewStock | 3030 | Eve Buyer | eve@company.com |

In this example:
- Alice and Bob each receive BOM notifications for their respective plants, for any form type.
- Carol receives Non-Stock InfoRecord notifications for any plant — a single entry covers the whole organisation.
- Dave and Eve each receive New Stock InfoRecord notifications only for their specific plant.

---

## 4. Navigating the App

When you open the app you land on the **List Report** — a table showing all configured planning leads. The columns are:

| Column | What it shows |
|---|---|
| Type | BOM or InfoRecord |
| Request Type | The form type (New Stock, Non-Stock, etc.) this entry covers, or `*` for BOM entries |
| Plant | The plant this entry covers, or `*` for all |
| Email | The contact email address |
| Name | The contact's full name |

You can filter, sort, and search across all columns. The list is sorted by Type by default.

Clicking a row opens the **Object Page**, which shows the full detail of that entry and allows editing.

---

## 5. Managing Planning Leads

### Creating a new entry

1. Click **Create** on the List Report.
2. Fill in the required fields:
   - **Type** — select BOM or InfoRecord from the dropdown.
   - **Request Type** — for BOM entries, always set this to `*` (BOM does not filter by form type). For InfoRecord entries, select the specific form type: `NewStock` or `NonStock`.
   - **Plant** — select a specific plant for BOM entries and for InfoRecord New Stock entries. For InfoRecord Non-Stock entries, set this to `*` to cover all plants.
   - **Email** — the email address of the planning lead.
   - **Name** — the full name of the planning lead.
3. Click **Create**.

All five fields are mandatory.

### Editing an entry

1. Click the row on the List Report.
2. Click **Edit** on the Object Page.
3. Modify any field and click **Save**.

Changes take effect immediately for any request that completes its final approval step after saving.

### Deleting an entry

1. Select one or more rows on the List Report.
2. Click **Delete** and confirm the dialog.

After deletion, if no other planning lead matches a given plant + request type combination, no notification will be sent for that combination when a request is approved.

---

## 6. How This Affects the Approval Workflow

### When notifications are triggered

Planning lead notifications are sent only after a material request has passed **all approval steps** in the hierarchy. At that point, the system looks up this table to determine who to notify.

The lookup uses the request's plant and form type to find matching entries:

1. For **BOM** leads — the system finds all entries of type BOM whose plant matches the request's plant. Request Type is always `*` for BOM entries and is not used as a filter.
2. For **InfoRecord** leads — the system finds entries whose request type matches the form type of the request (NewStock or NonStock) and whose plant matches the request's plant. Entries with plant `*` match any plant.

Each matched planner receives an email with the relevant material details from the approved request: material number, description, request type, vendor, manufacturer part number, plant, estimated cost per unit, unit of measure, estimated delivery time, and vendor quote attachment.

### Relationship to the approval hierarchy

The plant dropdown in this app only shows plants that have at least one row configured in **Maintain Hierarchy**. If a plant has no approval chain, it cannot appear here — which also means no requests can be submitted for it, so no planning lead notifications would ever be triggered for it anyway.
