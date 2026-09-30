const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const cds = require('@sap/cds');

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const DIRS = [
    path.join(__dirname, '..', 'db', 'data'),
    path.join(__dirname, 'data'),
];

// CSVs are loaded by `cds deploy` with a raw INSERT, so @assert.* never sees them.
describe('seed data', () => {
    let model;
    before(async () => { model = cds.linked(await cds.load('*', { root: path.join(__dirname, '..') })); });

    const uuidColumns = (entityName) => {
        const entity = model.definitions[entityName];
        if (!entity) return [];
        const cols = [];
        for (const [name, el] of Object.entries(entity.elements || {})) {
            if (el.type === 'cds.UUID') cols.push(name);
            if (el.isAssociation && el.keys) for (const k of el.keys) {
                if (el._target?.elements?.[k.ref[0]]?.type === 'cds.UUID') cols.push(`${name}_${k.ref[0]}`);
            }
        }
        return cols;
    };

    const files = DIRS.filter(d => fs.existsSync(d)).flatMap(dir =>
        fs.readdirSync(dir).filter(f => f.endsWith('.csv')).map(f => path.join(dir, f))
    );

    it('finds CSV files to check', () => assert.ok(files.length > 0, 'no seed CSVs found'));

    for (const file of files) {
        const label = path.join(path.basename(path.dirname(path.dirname(file))), 'data', path.basename(file));
        const base = path.basename(file, '.csv');
        const entityName = base.replace(/-(?=[^-]*$)/, '.'); // my.NS-Entity.csv -> my.NS.Entity

        it(`${label}: every UUID column holds a parseable GUID`, () => {
            const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim());
            const header = lines[0].split(',').map(h => h.trim());
            const targets = uuidColumns(entityName).filter(c => header.includes(c));
            if (!targets.length) return;

            for (const col of targets) {
                const idx = header.indexOf(col);
                lines.slice(1).forEach((line, i) => {
                    const value = (line.split(',')[idx] || '').trim();
                    if (!value) return; // blank means null, which is fine for optional keys
                    assert.match(value, UUID, `${label} row ${i + 2}, column "${col}": "${value}" is not a valid UUID`);
                });
            }
        });
    }
});
