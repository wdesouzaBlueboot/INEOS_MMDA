# Material Master Data — Test Cases

Test cases executed for the Material Master Data (MMDA) application, across two layers:

- **Automated** — CAP backend service/integration tests (`npm run test` → `cds test --profile test -w 1`; **340 tests / 5 suites**). In the `test` profile the external SAP services are mocked (`@cds.persistence.skip`) and the DB is in-memory SQLite.
- **In-application** — the same business rules driven through the running Fiori Elements UI, plus the frontend-only behaviour and end-to-end verification directly in S/4HANA.

All listed cases **passed**.

---

## 1. Automated — RBAC & Approval Workflow (`roles.test.js`)

| No. | Name | Description | Expected Result | Result |
|---|---|---|---|---|
| 1 | Authorization matrix | Exercise READ / CREATE / UPDATE / EDIT / DELETE on RequestForm as Requestor, Reviewer, Manager, Unauthorized | Each role/operation returns the expected 200 or 403 | Pass |
| 2 | Base 4-step approval (plant 3080, NewStock) | Submit and approve through all 4 steps | Form reaches status Approved after the final step | Pass |
| 3 | Single-approver flow (plant 3333, NonStock) | Approve the single configured step | Form reaches Approved; the same reviewer cannot approve again | Pass |
| 4 | 5-approver flow (plant 3030, NonStock) | Approve through all 5 steps | Form Approved after step 5 | Pass |
| 5 | SafetyStock approval (plant 4444, 3 steps) | Submit and approve through 3 steps | Form Approved | Pass |
| 6 | Deletion approval (plant 5555, 2 steps) | Submit and approve through 2 steps | Form Approved | Pass |
| 7 | Rejection at each step | Reject the form at steps 1 through 4 | Form set to Rejected and returned to the requestor | Pass |
| 8 | Reject with comments | Reject supplying a comment | Comment is persisted and shown on the form | Pass |
| 9 | Resubmission of rejected form | Requestor edits and resubmits a rejected form | Approval history cleared; chain restarts at step 1 | Pass |
| 10 | Turn enforcement | Attempt approve/reject out of turn or after completion | Rejected with 403 | Pass |
| 11 | Unassigned reviewer | A reviewer not on the chain attempts to act | Rejected with 403 | Pass |
| 12 | Reviewer editing rules | Reviewer edits at step 1 / SAP-error retry vs other states | Allowed at step 1 and SAP-error retry; 403 elsewhere and after rejection | Pass |
| 13 | Hierarchy not configured — reviewer | Reviewer acts on a form whose plant/type has no chain | 403 | Pass |
| 14 | Hierarchy not configured — submission | Requestor submits a plant/type combination with no chain | Blocked with 400 | Pass |
| 15 | Dual-role user | Requestor+Reviewer edits/resubmits own rejected form; reviewer capability preserved | Behaves as specified for both roles | Pass |
| 16 | SAP_ERROR retry flow | Re-trigger after a SAP error | Handled per the retry flow | Pass |
| 17 | Material Creation Values selection | Row matched by plant + form type + repairable status + cost band | Correct configuration row is selected | Pass |

## 2. Automated — Validation & Cleanup (`requestform-cleanup.test.js`)

| No. | Name | Description | Expected Result | Result |
|---|---|---|---|---|
| 18 | Per-type field cleanup | Run cleanup for each form type (NewStock / NonStock / Deletion / SafetyStock / NonToStock) | Correct fields kept vs nulled | Pass |
| 19 | Draft-lifecycle wiring | Cleanup on create- and edit-activation; formType resolves from persisted row; NonToStock mandatory-field validation | All behave as specified | Pass |

## 3. Automated — NonToStock SAP Conversion (`nontostock-sap.test.js`)

| No. | Name | Description | Expected Result | Result |
|---|---|---|---|---|
| 20 | NonToStock config resolution | Resolve the config row by request plant + NonToStock + repairable status | Correct row resolved; mocked-unavailable SAP update handled gracefully | Pass |
| 21 | NonToStock missing config | No config row matches the plant/repairable | Returns SAP_ERROR | Pass |

## 4. Automated — Material Description & Field Restrictions (`field-restrictions.test.js`)

| No. | Name | Description | Expected Result | Result |
|---|---|---|---|---|
| 22 | 40-char word-safe cut | Cut descriptions that fit, that break mid-word, that end a word exactly at the limit, that leave a dangling separator, and single words longer than the limit; plus empty input and a length sweep | Never longer than 40 chars, always ends on a complete word (hard cut only when the first word alone exceeds the limit), no dangling separator, idempotent | Pass |
| 23 | Derivation formatting | Activate a NonStock draft whose characteristics derive a description over 40 chars, and one that fits | Persisted description already uppercased and cut to 40 on a complete word; a short one is uppercased without being cut | Pass |
| 24 | Estimated Delivery Time capped at 3 digits | Activate a NonStock draft with a value above 999, then with the boundary 999 | Above 999 rejected with a validation error; 999 accepted and persisted | Pass |
| 25 | Safety Stock Requested numeric-only | Activate a NonStock draft with a non-numeric value, then with a numeric one | Non-numeric rejected with a validation error; numeric value accepted | Pass |
| 26 | Storage Bin uppercased | Create a Material Creation Values row with a lowercase storage bin | Persisted value is uppercased | Pass |

## 5. In-Application — Workflow & SAP Verification

| No. | Name | Description | Expected Result | Result |
|---|---|---|---|---|
| 27 | RBAC visibility in UI | Log in as Requestor / Reviewer / Manager | Create/submit/approve/reject visibility and permissions match the authorization matrix | Pass |
| 28 | End-to-end approval (UI) | Submit each form type and walk it through its full approval chain | Form reaches Approved | Pass |
| 29 | SAP persistence verification | After a request is created/modified in SAP, inspect the material in S/4HANA | Material created/updated with the configured values and the derived description, uppercase and no longer than 40 characters | Pass |
| 30 | Rejection & resubmission (UI) | Reject with a comment, then edit and resubmit | Chain restarts and the comment is shown | Pass |

## 6. In-Application — Request Form Frontend

| No. | Name | Description | Expected Result | Result |
|---|---|---|---|---|
| 31 | Draft lifecycle | Create/edit a draft, save, reload; approve step 1 | Values persist across save/reload; form becomes read-only for the requestor once step 1 is approved | Pass |
| 32 | Conditional sections & fields per type | Change the form type | Only the relevant section/field group shows; type-specific fields appear/hide (e.g. repairable-only) | Pass |
| 33 | Plant value help by form type | Open the plant value help | Only plants configured for the selected form type are offered (3040/3202 excluded for NonToStock) | Pass |
| 34 | Plant fragment for existing-material types | On NonToStock/Deletion/SafetyStock, pick a material then open plants | Only plants where the selected material already exists are offered | Pass |
| 35 | Material required before plant | On NonToStock / Deletion / SafetyStock, attempt to select a plant before a material has been chosen | Not allowed — the app requires the material to be selected first and prompts accordingly; the plant cannot be chosen beforehand | Pass |
| 36 | Characteristics table | Select a material class (NewStock/NonStock) | Characteristics load; CHAR/numeric/currency inputs behave correctly; values persist on save; empty ones stay editable but are excluded from the SAP payload | Pass |
| 37 | Material description display | Open an activated NewStock/NonStock form | Description derived from the first characteristics is shown read-only in General Information, already uppercased and capped at 40 characters | Pass |
| 38 | Value-help search by id and description | Search within value helps | Results filter correctly by both ID and description | Pass |
| 39 | Approval Status Details table | View the table, then approve/reject | Renders the configured hierarchy (all candidates per pending step); after an action the step collapses to only the reviewer who acted with their decision/timestamp; steps after a rejection show inactive | Pass |
| 40 | Required-field enforcement | Submit with a required field left empty | Submission blocked and the missing field is flagged | Pass |
| 41 | Requestor name captured | Submit a request | Requestor name and email stored automatically from the logged-in user | Pass |
| 42 | List sort order | Open the List Report | Forms sorted by last-modified descending (most recent first) | Pass |
| 43 | Form number generation | Submit a request | Human-readable form number generated with per-type prefix (NW/NN/SS/DL/NS) plus zero-padded sequence, e.g. NW-0012 | Pass |
| 44 | Action Required Only filter | Toggle the filter as a Reviewer; check as a requestor-only user | Reviewer default Yes shows only forms at their step; No shows all forms assigned to them; filter not available to requestor-only users | Pass |
| 45 | Characteristic input type | Vary the SAP flag and Characteristic Configuration setting | Dropdown when SAP Additional-Value-Not-Allowed or Use Value List = true; free-text otherwise. When Additional-Value-Not-Allowed is true, only values from the value help are accepted — free text is rejected | Pass |
| 46 | Reviewer-editable procurement fields | Compare reviewer vs requestor | Material Group Number, Unit of Measure, Minimum Lot Size editable by the reviewer (step 1), read-only for the requestor | Pass |
| 47 | Attachments upload & requirement | Upload files; try to submit without one | Files upload and store; New Stock / Non-Stock cannot be submitted without an attachment | Pass |
| 48 | SAP_ERROR retry (UI) | After a failed SAP creation | Last approver can correct the config and re-approve; error message shown; no other user can act until resolved | Pass |
| 49 | Planning-lead notifications | Complete final approval of a NewStock/NonStock | BOM / InfoRecord planners are notified (BOM when "included in a BOM" = Yes) | Pass |
| 50 | Notifications & deep link | Trigger submit / pending / approve / reject / final / SAP-error events | Notifications sent and the review deep link opens the correct form | Pass |
| 51 | Material lookup auto-fill | Select a material on Deletion / SafetyStock / NonToStock | Read-only material description auto-populates | Pass |
| 52 | Status transitions | Drive a form through the workflow | Submitted → Partially Approved → Approved / Rejected / SAP_ERROR render correctly | Pass |
| 53 | Plant text | View a plant field | Plant name displayed alongside the plant code | Pass |

## 7. In-Application — Manager Configuration Apps

| No. | Name | Description | Expected Result | Result |
|---|---|---|---|---|
| 54 | Config apps access control | Attempt access/edit as non-manager roles | Only the Manager role can edit; non-managers are blocked (Reviewers have read-only where applicable) | Pass |
| 55 | Maintain Hierarchy — CRUD & effect | Create/edit/delete approval steps (plant + type + step + reviewer) | Parallel reviewers per step work; removing all rows for a plant/type removes it as a submittable option; submitted forms route through the configured chain | Pass |
| 56 | Material Creation Values — CRUD & effect | Create/edit/delete rows; attempt a duplicate matching key; mass-edit | Duplicate key rejected; mass-edit works; correct row drives material creation; missing row surfaces as SAP_ERROR | Pass |
| 57 | Maintain Planning Lead — CRUD & effect | Create/edit/delete planner contacts; use wildcards | Wildcard rules honored (BOM always * for form type; Non-Stock InfoRecord * for plant); planners notified on approval | Pass |
| 58 | Characteristic Configuration — CRUD & effect | Create/edit/delete the Use Value List flag; attempt a duplicate | Duplicate characteristic rejected; flag controls dropdown vs free-text in the request form | Pass |
