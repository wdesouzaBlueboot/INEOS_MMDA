# INEOS Material Master Data Application (INEOS_MMDA)

## Architecture Overview

This project is built using the **SAP Cloud Application Programming (CAP) Model** with Node.js. It serves as a central hub for managing material master data requests, approvals, and configurations.

### **Backend Framework**
- **Framework:** SAP CAP (`@sap/cds`) running on Node.js.
- **Database:** 
  - **Local Development:** SQLite (`@cap-js/sqlite`)
  - **Production:** SAP HANA (`@cap-js/hana`)
- **Security & Authentication:** Approuter and XSUAA configured via `xs-security.json` and `mta.yaml`.

### **Frontend Applications (SAP Fiori / UI5)**
The project contains several SAP Fiori Elements / SAPUI5 applications located in the `app/` folder:
- `req_material_master_data`: Core application for submitting and managing material master data requests.
- `maintain_hierarchy`: Application to manage the review hierarchies and approvers.
- `maintain_planning_lead`: Application for managing planning leads per plant.
- `characteristic_configuration`: Application to configure material characteristics.
- `material_creation_values`: Application to configure the standard values for material creation.

### **External Integrations**
The CAP backend consumes several SAP S/4HANA OData V2 APIs via destinations (configured as `HFO100`):
- `Plant` (`API_PLANT_SRV`)
- `Class` (`API_CLFN_CLASS_SRV`)
- `Characteristic` (`API_CLFN_CHARACTERISTIC_SRV`)
- `Vendor` (`API_BUSINESS_PARTNER`)
- `Material` (`API_PRODUCT_SRV`)
- `Material2` (`MD_C_PRODUCT_MAINTAIN_SRV`)

### **External Services Configuration**
This project connects to several external SAP S/4HANA OData services. To enable these connections during local development a private configuration file is used.

1- Locate the template: Find the .cdsrc-example.json file in the root directory.
2- Create your private config: Duplicate that file and rename it to .cdsrc-private.json.

### Private npm registry and CDS tooling

Some project dependencies are hosted on a private SAP npm registry. To enable installing those packages locally:

- Copy the example npm configuration into a working `.npmrc` file in the project root:

```bash
cp .npmrc.example .npmrc
```

- Open `.npmrc` and replace the placeholder auth token with your own token (the example contains a placeholder `_auth` value). The entry looks like:

```text
//<registry>/:_auth=<your-auth-token>
```

- Install the SAP CDS development kit globally (required for some CAP dev tools):

```bash
npm install -g @sap/cds-dk
```

Keep `.npmrc` private — do not commit your personal token to source control.

---

## Data Schemas

The primary domain models and external projections are defined in `db/schema.cds` and served via `srv/cat-service.cds`.

### **Core Entities**
- **`RequestForm`**: The central entity representing a material request. It stores requester info, plant selection, material specifications (New Stock, Non-Stock, etc.), attachments, and workflow history. It supports draft state (`@odata.draft.enabled`).
- **`FormApprovalSteps`**: A child entity (associated with `RequestForm`) that tracks the step-by-step approval progress, reviewers, and workflow statuses.
- **`ReviewHierarchy`**: Configuration entity defining the required reviewers per plant, request type, and workflow step.
- **`ConfiguredPlants`**: A view derived from `ReviewHierarchy` to list available plants for selection.
- **`PlanningLead`**: Configuration mapping plants to their respective planning leads (emails and names).
- **`CharacteristicConfig`**: Configurations dictating how specific material characteristics should behave (e.g., whether to use a value list).
- **`FormType`**: Master data entity defining available request form types.
- **`MaterialCreationValues`**: Configuration entity defining the standard values for the material creation.

### **External Projections**
The service layer (`CatalogService`) projects external API data into the CAP model for seamless consumption by the UI, including `Plant`, `Vendor`, `MaterialGroup`, `Material`, `Material2`, `MaterialClass`, `ClassCharacteristic`, and `UnitOfMeasure`.

---

## Development & Next Steps

- **Run Locally:** Use `npm run start` or `cds watch` to start the CAP server with an in-memory SQLite database.
- **Test UIs:** Use the respective watch scripts (e.g., `npm run watch-req_material_master_data`) to launch individual Fiori apps with live reload.
- **Deploy:** Build using `npm run build` (mbt build) and deploy using `npm run deploy` (cf deploy).

## Role Testing Scenarios

Testing for application roles has been configured locally using mocked authentication (in `package.json`), mock CSV data (`test/data`), and automated Node.js tests.

### Covered Scenarios
- **Requestor (`REQUESTOR`):** Has read and create access. Should receive HTTP 200 when querying `RequestForm`.
- **Reviewer (`REVIEWER`):** Has access to view and approve/reject forms. Should receive HTTP 200 when querying `RequestForm`.
- **Manager (`MANAGER`):** Administrator role. Used to maintain hierarchical configurations.
- **Unauthorized (`unauthorized`):** A mock user with no roles. Ensures that missing roles result in an HTTP 403 Forbidden.

### Running the Tests
- **Automated JS Tests:** Execute `npm run test` from the terminal. This runs `test/roles.test.js` with a test profile `--profile test`.
- **Manual HTTP Tests:** Use the `test/http/roles.http` file with the REST Client extension for VS Code to manually send authorized requests to a running `cds watch` session.
