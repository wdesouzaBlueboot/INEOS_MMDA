# Characteristic Configuration — User Documentation

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Who Uses It](#2-who-uses-it)
3. [Key Concepts](#3-key-concepts)
4. [Navigating the App](#4-navigating-the-app)
5. [Managing Configurations](#5-managing-configurations)
6. [How This Affects the Request Form](#6-how-this-affects-the-request-form)

---

## 1. What This App Does

**Characteristic Configuration** lets managers control how each SAP characteristic is presented when a requestor fills in a material request form.

For every characteristic that appears in the request form, this app determines whether the input field should be a **dropdown** or a **free-text field**.

Characteristics not configured here will default to free-text input.

---

## 2. Who Uses It

| Role | What they can do |
|---|---|
| **Manager** | View, create, edit, and delete characteristic configurations |
| **Reviewer** | No access |
| **Requestor** | No access |

This is a manager-only configuration app. Its effects are felt by requestors through the material request form, but they have no visibility into this configuration directly.

---

## 3. Key Concepts

### Characteristics

A **characteristic** is a property defined in SAP's Classification System that describes a material — for example, Color, Weight, or Material Grade. When a requestor selects a material class in the request form, the system retrieves all characteristics associated with that class and presents them as input fields.

Each characteristic has an internal ID and a human-readable name, both sourced from S/4HANA.

### The Use Value List flag

Each configuration row stores a single decision for one characteristic: whether it should use a value list or not.

| Setting | What the requestor sees |
|---|---|
| **Use Value List: True** | A value help showing the predefined values defined in SAP for that characteristic |
| **Use Value List: False** | A free-text field where any value can be typed |

### SAP override: characteristics with no free-text input allowed

Some characteristics are defined in SAP with **Additional Value Not Allowed**, meaning they only accept values from their predefined list. For these characteristics, the form always renders a dropdown regardless of what is configured here — the `Use Value List` flag is ignored.

This means configuring `Use Value List: False` for such a characteristic has no effect. The SAP definition takes precedence to preserve data integrity.

### One configuration per characteristic

Each characteristic can only have one configuration row. If you try to create a second row for the same characteristic, the system will reject it.

### Example

A manager configures two characteristics:

| Characteristic | Description | Use Value List |
|---|---|---|
| `0000000050` | Color | True |
| `0000000087` | Custom Notes | False |

When a requestor opens a request form for a class that includes both characteristics, they will see a **value help** for Color and a **free-text field** for Custom Notes.

---

## 4. Navigating the App

When you open the app you land on the **List Report** — a table showing every configured characteristic. The columns are:

| Column | What it shows |
|---|---|
| Characteristic ID | The internal SAP identifier for the characteristic |
| Characteristic Description | The human-readable name retrieved from S/4HANA |
| Use Value List | Whether this characteristic uses a dropdown (true) or free text (false) |

You can filter, sort, and search across all columns.

To update **Use Value List** for several characteristics at once, select multiple rows using the checkboxes, then click **Edit**. A dialog appears where you set the value once and it is applied to all selected rows on save. This is useful when you need to switch a group of characteristics between dropdown and free-text in bulk.

Clicking a row opens the **Object Page**, which shows the full detail of that configuration and allows editing.

---

## 5. Managing Configurations

### Creating a new configuration

1. Click **Create** on the List Report.
2. Fill in the required fields:
   - **Characteristic ID** — selected from a search dialog populated from S/4HANA. You can type to filter by ID or name.
   - **Use Value List** — toggle on if this characteristic should use a dropdown; leave off for free text.
3. The **Characteristic Description** fills in automatically once you select a characteristic.
4. Click **Create**.

The Characteristic ID is mandatory. The form will not save if it is left blank. Use Value List defaults to false (unchecked) if not explicitly toggled on.

### Editing a configuration

1. Click the row on the List Report.
2. Click **Edit** on the Object Page.
3. Change the **Use Value List** toggle and click **Save**.

Changes take effect immediately for any request form opened after saving.

### Deleting a configuration

1. Select one or more rows on the List Report.
2. Click **Delete** and confirm the dialog.

After deletion, the characteristic will revert to free-text input in the request form (the default behavior when no configuration exists).

---

## 6. How This Affects the Request Form

### When configuration is applied

When a requestor selects a **material class** in the request form, the system fetches all characteristics associated with that class from S/4HANA and looks up each one in this configuration table.

- If the characteristic is defined in SAP as **Additional Value Not Allowed** (only predefined values accepted), the form always renders a dropdown — this takes precedence over any local configuration.
- Otherwise, if a configuration row exists with **Use Value List: True**, the form renders a dropdown populated with the values defined in SAP.
- If the configuration is **False**, or if no configuration row exists for that characteristic, the form renders a free-text input.

> **Note:** This precedence — SAP's *Additional Value Not Allowed* overriding local configuration, and the fallback to free-text when no configuration exists — is the intended behaviour explicitly requested by the business, not an implementation default.
