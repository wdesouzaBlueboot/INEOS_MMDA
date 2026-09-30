# GitHub Copilot Instructions for INEOS_MMDA

This project utilizes the SAP Cloud Application Programming (CAP) Model with Node.js and SAP Fiori Elements.

## Architectural Rules for Copilot
1. **SAP CAP Guidelines:**
   - Always use CQN (`SELECT.from()`, `UPDATE.entity()`, etc.) instead of raw SQL when writing database queries in `srv/cat-service.js`.
   - Remember that `RequestForm`, `ReviewHierarchy`, `PlanningLead`, and `CharacteristicConfig` are `@odata.draft.enabled`. Event handlers in the `.js` file must consider draft behavior.
   - External services (`plant`, `class`, `characteristic`, etc.) use OData V2 and are consumed via `cds.connect.to()`.

2. **Fiori & UI5 Rules:**
   - UI changes should primarily be made via CDS Annotations (`@UI.LineItem`, `@UI.FieldGroup`, etc.).
   - If JavaScript controller extensions are needed, adhere to modern UI5 conventions (AMD syntax, strictly typed if applicable, avoiding `sap.ui.getCore()`).
   - Use absolute paths relative to the app structure for fragments and views.

3. **Data Schemas Checklist:**
   - Always map forms to their `FormType` and respect the `FormApprovalSteps` association.
   - When suggesting new fields, ensure they match the established casing (camelCase for properties, PascalCase for Entities).
