const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const cds = require('@sap/cds');
const { GET, POST, PATCH } = cds.test(__dirname + '/..');

const auth = { username: 'requestor', password: 'requestor' };

// ---- Unit tests: the pure cleanup helper, one case per request type (all branches) ----
describe('_cleanupRequestFormFields (per request type)', () => {
  let srv;
  before(async () => { srv = await cds.connect.to('CatalogService'); });

  // A form object with every type-specific field populated, so we can see exactly what survives.
  const full = (type) => ({
    formType_code: type,
    isMdata48h: true, isResultOfMOC: true, mocNumber: 'M', equipmentNumber: 'E', chemicalApproval_code: 'Y',
    isPartOfBOM: true, vendor_Supplier: 'V', vendorPartNumber: 'VP', manufacturer: 'MF', manufacturerPartNumber: 'MP',
    materialClass_ClassInternalID: 'CL', materialClassCharact: '[]', materialGroupNumber_ProductGroup: 'MG',
    estCostPerUnit: 1, unitOfMeasure_UnitOfMeasure: 'EA', estDeliveryTime: 2, minimumLotSize: 1, attachments: [{}],
    functionalLocation: 'FL', justification: 'J', estUsagePerYear: 3, isRepairable: true, estRepairTime: 'RT',
    maxQtyPerUse: 4, specialStorageReq: 'SS', isPreventativeMaintReq: 'PM', willReqSupplyStock: true,
    safetyStockReq: 'SR', sapMaterialNumber_Product: 'P', materialDescription: 'D',
  });
  const clean = (type) => { const d = full(type); srv._cleanupRequestFormFields(d); return d; };
  const assertNull = (d, fields) => fields.forEach(f => assert.strictEqual(d[f], null, `${f} should be null`));
  const assertKept = (d, obj) => Object.entries(obj).forEach(([f, v]) => assert.deepStrictEqual(d[f], v, `${f} should be kept`));

  it('NewStock: keeps everything except sapMaterialNumber; materialDescription is kept (derived from characteristics)', () => {
    const d = clean('NewStock');
    assertNull(d, ['sapMaterialNumber_Product']);
    assertKept(d, { isMdata48h: true, mocNumber: 'M', vendor_Supplier: 'V', functionalLocation: 'FL', isRepairable: true, safetyStockReq: 'SR', attachments: [{}], materialDescription: 'D' });
  });

  it('NonStock: nulls NewStock-only + safetyStock + sapMaterialNumber; keeps NonStock fields', () => {
    const d = clean('NonStock');
    assertNull(d, ['functionalLocation', 'justification', 'estUsagePerYear', 'estRepairTime', 'maxQtyPerUse',
      'specialStorageReq', 'isPreventativeMaintReq', 'isRepairable', 'willReqSupplyStock',
      'safetyStockReq', 'sapMaterialNumber_Product']);
    assertKept(d, { isMdata48h: true, isResultOfMOC: true, mocNumber: 'M', vendor_Supplier: 'V', equipmentNumber: 'E', estCostPerUnit: 1, materialDescription: 'D' });
  });

  it('Deletion: nulls New/NonStock + NewStock-only + safetyStock; keeps sapMaterialNumber/materialDescription', () => {
    const d = clean('Deletion');
    assertNull(d, ['isMdata48h', 'isResultOfMOC', 'mocNumber', 'equipmentNumber', 'chemicalApproval_code',
      'isPartOfBOM', 'vendor_Supplier', 'manufacturer', 'materialClass_ClassInternalID', 'estCostPerUnit',
      'functionalLocation', 'justification', 'isRepairable', 'willReqSupplyStock', 'safetyStockReq']);
    assert.deepStrictEqual(d.attachments, []);
    assertKept(d, { sapMaterialNumber_Product: 'P', materialDescription: 'D' });
  });

  it('SafetyStock: like Deletion but keeps safetyStockReq', () => {
    const d = clean('SafetyStock');
    assertNull(d, ['isMdata48h', 'mocNumber', 'vendor_Supplier', 'functionalLocation', 'justification', 'isRepairable']);
    assertKept(d, { safetyStockReq: 'SR', sapMaterialNumber_Product: 'P', materialDescription: 'D' });
  });

  it('NonToStock: keeps material # + optional description, safety stock + spare details; nulls material-definition fields', () => {
    const d = clean('NonToStock');
    assertNull(d, ['isResultOfMOC', 'mocNumber', 'equipmentNumber', 'chemicalApproval_code', 'isPartOfBOM',
      'vendor_Supplier', 'vendorPartNumber', 'manufacturer', 'manufacturerPartNumber', 'materialClass_ClassInternalID',
      'materialClassCharact', 'materialGroupNumber_ProductGroup', 'estCostPerUnit', 'unitOfMeasure_UnitOfMeasure',
      'estDeliveryTime', 'minimumLotSize', 'functionalLocation', 'estUsagePerYear']);
    assert.deepStrictEqual(d.attachments, []);
    assertKept(d, {
      sapMaterialNumber_Product: 'P', materialDescription: 'D', safetyStockReq: 'SR', isMdata48h: true,
      justification: 'J', isRepairable: true, estRepairTime: 'RT', maxQtyPerUse: 4, specialStorageReq: 'SS',
      isPreventativeMaintReq: 'PM', willReqSupplyStock: true,
    });
  });

  it('booleans become null (not false)', () => {
    const d = clean('Deletion');
    for (const f of ['isMdata48h', 'isResultOfMOC', 'isPartOfBOM', 'isRepairable', 'willReqSupplyStock'])
      assert.strictEqual(d[f], null, `${f} must be null, not false`);
  });
});

// ---- Integration tests: the handler wiring on real draft activations ----
const NONSTOCK_BASE = {
  isMdata48h: false, isResultOfMOC: false, equipmentNumber: 'EQ-001', chemicalApproval_code: 'Yes',
  isPartOfBOM: false, vendor_Supplier: 'VEND-001', vendorPartNumber: 'VPN-001', manufacturer: 'MANUF-001',
  manufacturerPartNumber: 'MPN-001', materialClass_ClassInternalID: 'CLASS-001',
  materialClassCharact: JSON.stringify([{ name: 'C', selectedValue: 'V' }]),
  estCostPerUnit: 100, estDeliveryTime: 10, materialGroupNumber_ProductGroup: 'MG-001',
  unitOfMeasure_UnitOfMeasure: 'EA', minimumLotSize: 1,
};
const activate = (ID) =>
  POST(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth });
const readActive = (ID) => cds.db.run(SELECT.one.from('my.MaterialMasterData.RequestForm').where({ ID }));

async function createNonStock(inject = {}) {
  const ID = (await POST('/odata/v4/catalog/RequestForm', { formType_code: 'NonStock', plant_plant_Plant: '3080' }, { auth })).data.ID;
  await PATCH(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=false)`, { ...NONSTOCK_BASE, ...inject }, { auth });
  await POST(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=false)/attachments`, { note: 'dummy' }, { auth });
  await activate(ID);
  return ID;
}

describe('before(SAVE, RequestForm) wiring', () => {
  // before('NEW') seeds these numeric fields to 0 so their static Measures.Unit/ISOCurrency renders from
  // the start (UI5 >= ~1.149 only shows the unit once the field has a value). Guards against the seed
  // being dropped, which would silently make the "Days"/"USD" units vanish on empty forms again.
  it('NEW: seeds estDeliveryTime and estCostPerUnit to 0', async () => {
    const created = await POST('/odata/v4/catalog/RequestForm', { formType_code: 'NewStock', plant_plant_Plant: '3080' }, { auth });
    const draft = (await GET(`/odata/v4/catalog/RequestForm(ID=${created.data.ID},IsActiveEntity=false)`, { auth })).data;
    assert.strictEqual(draft.estDeliveryTime, 0, `estDeliveryTime=${draft.estDeliveryTime}`);
    assert.strictEqual(Number(draft.estCostPerUnit), 0, `estCostPerUnit=${draft.estCostPerUnit}`);
  });

  it('CREATE: cleanup applies at create-activation, and formNumber/status still set', async () => {
    const ID = await createNonStock({ functionalLocation: 'FL-X', justification: 'J-X', isRepairable: true, safetyStockReq: '99' });
    const r = await readActive(ID);
    assert.strictEqual(r.functionalLocation, null);
    assert.strictEqual(r.justification, null);
    assert.strictEqual(r.isRepairable, null);
    assert.strictEqual(r.safetyStockReq, null);
    assert.strictEqual(r.vendorPartNumber, 'VPN-001', 'NonStock field kept');
    assert.match(r.formNumber, /^NN-\d{4,}$/);
    assert.strictEqual(r.generalStatus, 'Submitted');
  });

  it('EDIT: cleanup runs on update-activation AND formType_code resolves from the persisted row', async () => {
    const ID = await createNonStock();
    // partial edit WITHOUT formType_code -> handler must merge it; if it didn't, these would survive
    await POST(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=true)/CatalogService.draftEdit`, { PreserveChanges: true }, { auth });
    await PATCH(`/odata/v4/catalog/RequestForm(ID=${ID},IsActiveEntity=false)`, { justification: 'EDIT-X', isRepairable: true }, { auth });
    await activate(ID);
    const r = await readActive(ID);
    assert.strictEqual(r.justification, null, 'cleaned on edit (type resolved)');
    assert.strictEqual(r.isRepairable, null, 'cleaned on edit (type resolved)');
    assert.strictEqual(r.vendorPartNumber, 'VPN-001', 'own field preserved');
  });

  it('NonToStock: validation requires its own fields (material #, safety stock, spare details) but not description or material-definition fields', async () => {
    const ID = (await POST('/odata/v4/catalog/RequestForm', { formType_code: 'NonToStock', plant_plant_Plant: '3080' }, { auth })).data.ID;
    let err;
    try { await activate(ID); } catch (e) { err = e; }               // activation must fail on the missing fields
    assert.ok(err && err.response, 'activation should fail validation');
    assert.strictEqual(err.response.status, 400);
    const e = err.response.data.error;
    const targets = [e.target, ...(e.details || []).map(d => d.target)].filter(Boolean);
    // required for NonToStock (non-boolean fields, reliably null on an empty form):
    for (const f of ['sapMaterialNumber_Product', 'safetyStockReq', 'justification', 'maxQtyPerUse', 'specialStorageReq', 'isPreventativeMaintReq'])
      assert.ok(targets.includes(f), `${f} must be required; targets=${JSON.stringify(targets)}`);
    // description + material-definition / NewStock-only fields are NOT required for NonToStock:
    for (const f of ['materialDescription', 'vendor_Supplier', 'materialClass_ClassInternalID', 'estCostPerUnit', 'functionalLocation', 'estUsagePerYear'])
      assert.ok(!targets.includes(f), `${f} must NOT be required for NonToStock; targets=${JSON.stringify(targets)}`);
  });
});
