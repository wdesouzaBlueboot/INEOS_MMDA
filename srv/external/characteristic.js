const cds = require('@sap/cds');

// Test/development mock only. In production the service runs as odata-v2 (remote)
// and this file is ignored. SQLite cannot expand to_CharacteristicDesc because the
// generated external CDS has no ON condition on the composition, so we intercept
// the query, strip the expand, and join descriptions manually.
module.exports = class CharacteristicService extends cds.ApplicationService {
    async init() {
        this.on('READ', 'A_ClfnCharacteristicForKeyDate', async (req, next) => {
            const columns = req.query.SELECT?.columns;
            if (!columns) return next();

            const descIdx = columns.findIndex(c => c.ref?.[0] === 'to_CharacteristicDesc');
            if (descIdx < 0) return next();

            columns.splice(descIdx, 1);

            const results = await next();
            const items = Array.isArray(results) ? results : (results ? [results] : []);

            if (items.length > 0) {
                const { A_ClfnCharcDescForKeyDate } = this.entities;
                const ids = items.map(r => r.CharcInternalID);
                const descs = await SELECT.from(A_ClfnCharcDescForKeyDate)
                    .where({ CharcInternalID: { in: ids } });

                const descsByID = {};
                for (const d of descs) {
                    (descsByID[d.CharcInternalID] ??= []).push(d);
                }
                for (const item of items) {
                    item.to_CharacteristicDesc = descsByID[item.CharcInternalID] ?? [];
                }
            }

            return results;
        });

        return super.init();
    }
};
