const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const cds = require('@sap/cds');
cds.test(__dirname + '/..');

// The material service (A_Product family) is @cds.persistence.skip in the test profile, so the actual
// SAP writes can't be exercised here (same limitation as the NewStock/SafetyStock handlers). We can still
// verify _handleNonToStockConversion is routed, resolves its config, and fails gracefully on the SAP call.
describe('NonToStock SAP conversion (_handleNonToStockConversion)', () => {
  let srv;
  before(async () => { srv = await cds.connect.to('CatalogService'); });

  it('resolves the NonToStock config and handles the (unavailable) SAP update gracefully', async () => {
    const form = await SELECT.one.from('my.MaterialMasterData.RequestForm').where({ formType_code: 'NonToStock' });
    assert.ok(form, 'seeded NonToStock form should exist');

    const formData = {
      ID: form.ID, formType_code: 'NonToStock', plant_plant_Plant: form.plant_plant_Plant,
      isRepairable: form.isRepairable, safetyStockReq: form.safetyStockReq,
      sapMaterialNumber_Product: form.sapMaterialNumber_Product, materialDescription: form.materialDescription,
    };

    const ok = await srv._handleNonToStockConversion(formData, { info() {}, warn() {} });
    assert.strictEqual(ok, false, 'SAP update cannot run in tests -> handler returns false');

    const after = await SELECT.one.from('my.MaterialMasterData.RequestForm').where({ ID: form.ID });
    assert.strictEqual(after.generalStatus, 'SAP_ERROR', 'failure is recorded as SAP_ERROR');
    // Crucially: it did NOT bail out on "no config" — the config lookup found the row and the SAP call was attempted.
    assert.ok(!/No Non-Stock to Stock defaults/.test(after.sapError || ''),
      `config should have resolved; got sapError="${after.sapError}"`);
  });

  it('returns SAP_ERROR when no config row matches the plant/repairable', async () => {
    const formData = {
      ID: '00000000-0000-0000-0000-000000000000', formType_code: 'NonToStock',
      plant_plant_Plant: '9999',           // no NonToStock config for this plant
      isRepairable: false, safetyStockReq: '5', sapMaterialNumber_Product: 'X',
    };
    const ok = await srv._handleNonToStockConversion(formData, { info() {}, warn() {} });
    assert.strictEqual(ok, false, 'unmatched config -> false (no SAP call attempted)');
  });
});
