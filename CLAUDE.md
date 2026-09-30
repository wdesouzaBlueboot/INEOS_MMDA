# Project guidance

CAP (Node.js) + Fiori Elements OData V4, deployed to SAP BTP Cloud Foundry with an HDI container on HANA.

```bash
npm test                        # full suite
npm run watch-<app>             # local dev, sqlite in-memory
npm run build && npm run deploy  # mbt build + cf deploy
```

## Seed data: `db/data` vs `test/data`

**`db/data` is only for fixed code lists the application never writes to.** Anything a user can edit through an app belongs in `test/data`.

| Folder | Reaches production? |
|---|---|
| `db/data/*.csv` | Yes — packaged as `.hdbtabledata`, owned by HDI |
| `test/data/*.csv` | No — loaded in the dev and test profiles only |

Putting app-editable data in `db/data` means the deployment pipeline and the users are both writing the same table, and the pipeline wins.

## How HDI table data behaves

Two facts, measured against a live container rather than taken from documentation:

1. **An `.hdbtabledata` artifact reimports only when its CSV changes** — and reimporting *replaces the table's contents*, silently discarding whatever users entered through the app.
2. **Removing the artifact does not delete rows.** Undeploying is safe; existing data stays.

So the dangerous operation is **editing a CSV under `db/data`**, not deploying. A CSV that nobody has touched in years keeps the table safe by accident, and the damage lands on whoever edits it first — long after the decision that caused it.

Before any deploy that changes a `db/data` CSV, dump the affected tables first. A service key on the HDI container is the only way in, and it bypasses the app's role checks entirely — create it for the task and delete it right after.

## Seed data is never validated

`cds deploy` loads CSVs with a raw INSERT straight to the database, bypassing the service layer. **`@assert.range`, `@assert.format` and every other CAP assertion are skipped.** A CSV row with a value no annotation would ever accept deploys cleanly and reports success.

The database is not a backstop either: a `UUID` key compiles to `NVARCHAR(36)`, so any 36-character string fits.

A malformed key therefore passes every check until OData parses it as `Edm.Guid` in a URL — which happens in the user's browser, and only when opening the record, not when listing it. Once deployed, such a row **cannot be repaired or deleted through the app**: every write also carries the key in the URL. It takes a redeploy or direct database access.

`test/seed-data.test.js` is the only layer that catches this. Keep it green.

Never hand-write a UUID by tweaking characters of an existing one — hex stops at `f`, and `g` produces a value that looks fine in a CSV, loads without complaint, and breaks only in the UI. Generate them with `crypto.randomUUID()`.
