const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const cds = require('@sap/cds');
const { POST, PATCH } = cds.test(__dirname + '/..');

const auth = { username: 'requestor', password: 'requestor' };

// ---- Unit tests: the 40-char word-safe cut and the SAP-only formatting ----
describe('_truncateDescription / _formatSapDescription', () => {
  let srv, cut, fmt;
  before(async () => {
    srv = await cds.connect.to('CatalogService');
    cut = (s) => srv._truncateDescription(s);
    fmt = (s) => srv._formatSapDescription(s);
  });

  it('leaves a description that fits untouched', () => {
    assert.strictEqual(cut('SS 1/16, C18, 1.8um'), 'SS 1/16, C18, 1.8um');
    assert.strictEqual(cut('agitator, big, one'), 'agitator, big, one');
    assert.strictEqual(cut('A, , B'), 'A, , B', 'empty characteristics keep their position');
  });

  it('cuts back to the last complete word', () => {
    assert.strictEqual(cut('Centrifugal Pump Stainless Steel, Vertical Mount'), 'Centrifugal Pump Stainless Steel');
    assert.strictEqual(cut('Stainless Steel Reversed Phase, High Pressure Modifier XL, 150x2.1mm'),
      'Stainless Steel Reversed Phase, High');
  });

  it('keeps a word that ends exactly at the limit', () => {
    // char 40 is the separator after 'XL' / 'X': the word is complete, so all 40 chars are used
    assert.strictEqual(cut('Stainless Steel Reversed Phase Column XL, Vertical'), 'Stainless Steel Reversed Phase Column XL');
    assert.strictEqual(cut('Reversed Phase Column, Stainless Steel X, HILIC'), 'Reversed Phase Column, Stainless Steel X');
  });

  it('drops the separator left dangling at the cut', () => {
    assert.strictEqual(cut('Reversed Phase, High Pressure Modifier, 150x2.1mm'), 'Reversed Phase, High Pressure Modifier');
  });

  it('cuts hard when the first word alone exceeds the limit', () => {
    assert.strictEqual(cut('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFG'), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCD');
  });

  it('handles empty input', () => {
    for (const v of [null, undefined, '', '   ']) assert.strictEqual(cut(v), '', `input ${JSON.stringify(v)}`);
  });

  it('never returns more than 40 chars, and re-cutting changes nothing', () => {
    for (let n = 0; n < 120; n++) {
      const s = Array.from({ length: n }, (_, i) => (i % 7 === 6 ? ' ' : i % 11 === 10 ? ',' : 'x')).join('');
      const t = cut(s);
      assert.ok(t.length <= 40, `length ${t.length} for input of ${n}`);
      assert.strictEqual(cut(t), t, `not idempotent at ${n}`);
      assert.strictEqual(fmt(fmt(s)), fmt(s), `SAP formatting not idempotent at ${n}`);
      if (n > 40) assert.ok(!/[\s,;]$/.test(t), `dangling separator at ${n}: ${JSON.stringify(t)}`);
    }
  });

  it('uppercases as part of the SAP formatting, not in the cut itself', () => {
    assert.strictEqual(fmt('agitator, big, one'), 'AGITATOR, BIG, ONE');
    assert.strictEqual(fmt('Reversed Phase, High Pressure Modifier, 150x2.1mm'), 'REVERSED PHASE, HIGH PRESSURE MODIFIER');
    assert.strictEqual(cut('agitator, big, one'), 'agitator, big, one', 'the cut alone must not change case');
    assert.strictEqual(fmt('*'), '*', 'the no-characteristics placeholder survives');
  });
});

// ---- Shared helper: create a NonStock draft, PATCH it, attach, then activate ----
const NONSTOCK_BASE = {
  isMdata48h: false, isResultOfMOC: false, equipmentNumber: 'EQ-001', chemicalApproval_code: 'Yes',
  isPartOfBOM: false, vendor_Supplier: 'VEND-001', vendorPartNumber: 'VPN-001', manufacturer: 'MANUF-001',
  manufacturerPartNumber: 'MPN-001', materialClass_ClassInternalID: 'CLASS-001',
  estCostPerUnit: 100, estDeliveryTime: 10, materialGroupNumber_ProductGroup: 'MG-001',
  unitOfMeasure_UnitOfMeasure: 'EA', minimumLotSize: 1,
};

// Validation only runs on draftActivate (the generic-handler SAVE event), not on the intermediate PATCH,
// so every case must go through the full create-attach-activate sequence.
async function attemptNonStock(overrides) {
  const ID = (await POST('/odata/v4/catalog/RequestForm', { formType_code: 'NonStock', plant_plant_Plant: '3080' }, { auth })).data.ID;
  try {
    await PATCH(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=false)`, { ...NONSTOCK_BASE, ...overrides }, { auth });
    await POST(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=false)/attachments`, { note: 'dummy' }, { auth });
    await POST(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth });
    return { row: await cds.db.run(SELECT.one.from('my.MaterialMasterData.RequestForm').where({ ID })) };
  } catch (err) {
    return { error: err };
  }
}

const chars = (...aValues) => JSON.stringify(aValues.map((v, i) => ({ name: `C${i}`, dataType: 'CHAR', selectedValue: v })));

describe('materialDescription derived on SAVE', () => {
  it('stores the description already cut to 40 chars and uppercased', async () => {
    const { row } = await attemptNonStock({ materialClassCharact: chars('Stainless Steel Reversed Phase', 'High Pressure Modifier XL', '150x2.1mm') });
    assert.strictEqual(row.materialDescription, 'STAINLESS STEEL REVERSED PHASE, HIGH');
  });

  it('uppercases a short description too, without cutting it', async () => {
    const { row } = await attemptNonStock({ materialClassCharact: chars('agitator', 'big', 'one') });
    assert.strictEqual(row.materialDescription, 'AGITATOR, BIG, ONE');
  });
});

describe('estDeliveryTime restricted to 3 digits (item 7)', () => {
  it('rejects a value above 999', async () => {
    const { error } = await attemptNonStock({ estDeliveryTime: 1000 });
    assert.ok(error, 'expected a validation error');
    assert.strictEqual(error.response?.status, 400);
  });

  it('accepts the 3-digit boundary of 999', async () => {
    const { row, error } = await attemptNonStock({ estDeliveryTime: 999 });
    assert.ifError(error);
    assert.strictEqual(row.estDeliveryTime, 999);
  });
});

describe('safetyStockReq restricted to numeric values (item 2)', () => {
  it('rejects a non-numeric value', async () => {
    const { error } = await attemptNonStock({ safetyStockReq: 'ABC' });
    assert.ok(error, 'expected a validation error');
    assert.strictEqual(error.response?.status, 400);
  });

  it('accepts a numeric value', async () => {
    const { error } = await attemptNonStock({ safetyStockReq: '25' });
    assert.ifError(error);
  });
});

describe('storageBin uppercased on save (item 3)', () => {
  let srv;
  before(async () => { srv = await cds.connect.to('CatalogService'); });

  it('uppercases a lowercase value on create', async () => {
    const row = await srv.tx({ user: new cds.User.Privileged() }, tx => tx.create('MaterialCreationValues').entries({
      requestPlant_plant_Plant: '3080', formType_code: 'Deletion', plant_Plant: '3080',
      purchasingGroup: '999', xPlantMatStatus: '99', mrpGroup: '9999', mrpType: '99', mrpController: '999',
      storageLocation: '0100', storageBin: 'a1b2', repairableStatus: 'Not Repairable', category: 'Test-StorageBin',
    }));
    assert.strictEqual(row.storageBin, 'A1B2');
  });
});
