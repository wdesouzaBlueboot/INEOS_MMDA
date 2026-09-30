# Claude AI Assistant Instructions for INEOS_MMDA

Welcome! When operating within the `INEOS_MMDA` repository, adhere to the following architectural guidelines, technical constraints, and best practices.

## 1. Project Context & Architecture
- **Framework:** SAP CAP Model (Node.js) + SAP Fiori Elements / UI5.
- **OData:** Serving primarily OData V4 to the UI, but proxying internal requests to OData V2 APIs (configured in `package.json` under `cds.requires`).
- **Directories:**
  - `app/`: Fiori applications. Each folder has its own `webapp` directory and `ui5.yaml`.
  - `db/`: Contains `schema.cds` with namespace `my.MaterialMasterData`.
  - `srv/`: Contains `cat-service.cds` and `cat-service.js` (custom logic, OData action/function handlers).

## 2. Coding Guidelines
### CAP Backend (`@sap/cds`)
- **Drafts:** Core entities like `RequestForm` are `@odata.draft.enabled`. Keep this in mind when writing custom logic in `cat-service.js`. You must account for draft lifecycle events (`READ`, `CREATE`, `UPDATE`, `DELETE` on `<Entity>.drafts`).
- **Querying:** Always use the standard CDS Query Language (CQN) via `SELECT`, `INSERT`, `UPDATE`, `DELETE` globals.
- **External Services:** When mocking or writing handlers for external calls (like S/4HANA destinations), ensure you interact with the service using `cds.connect.to('<service_name>')`.

### SAP Fiori / UI5 (`app/`)
- Ensure UI annotations are placed logically (preferably in `annotations.cds` within the respective `app/<app_name>` directory).
- Fiori Elements should be preferred over freestyle coding. If extending, use standard Fiori Extensions (controller extensions, fragment additions).
- Validate bindings and UI texts using the `i18n.properties` file in each app.

## 3. Model Context Protocol (MCP) Integration
This repository leverages MCP servers to assist AI agents. If your platform supports MCP (e.g., Cursor, Claude Desktop), ensure the following servers are invoked for context regarding CAP models and Fiori metadata:
- **`@cap-js/mcp-server`**: For CAP CDS insights.
- **`@sap-ux/fiori-mcp-server`**: For Fiori Elements scaffolding and rules.

You can configure your local environment (e.g., `.claude_desktop_config.json` or `.cursor/mcp.json`) to register them using:
```json
{
  "mcpServers": {
    "cap": {
      "command": "npx",
      "args": ["-y", "@cap-js/mcp-server"]
    },
    "fiori": {
      "command": "npx",
      "args": ["-y", "@sap-ux/fiori-mcp-server"]
    }
  }
}
```

## 4. Workflows & Commands
- **Local Dev:** `cds watch`
- **Testing specific UI:** `npm run watch-req_material_master_data`
- **Building:** `npm run build`
