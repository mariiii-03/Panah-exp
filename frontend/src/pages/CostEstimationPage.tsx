import React, { useState } from 'react';
import { Plus, Download, FileSpreadsheet, Trash2 } from 'lucide-react';

interface BOMItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  price: number;
  source: 'Local Bazaar' | 'Direct Depot' | 'Salvage';
}

export const CostEstimationPage: React.FC = () => {
  const [scaleUnits, setScaleUnits] = useState<number>(25);
  const [laborRateHourly, setLaborRateHourly] = useState<number>(400); // PKR per hour
  const [laborHours, setLaborHours] = useState<number>(76); // total hours for 1 shelter
  const [logisticsDistance, setLogisticsDistance] = useState<number>(50); // km
  const [logisticsVehicle, setLogisticsVehicle] = useState<'Pickup' | '3-Ton' | '10-Ton'>('Pickup');
  const [fuelRate, setFuelRate] = useState<number>(280); // PKR per liter
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);

  const handleDeleteItem = (id: string) => {
    setBomItems((prev) => prev.filter((item) => item.id !== id));
  };

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemPrice, setNewItemPrice] = useState(500);
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemSource, setNewItemSource] = useState<'Local Bazaar' | 'Direct Depot' | 'Salvage'>('Local Bazaar');
  const [showAddRow, setShowAddRow] = useState(false);

  // Calculations
  const materialsTotal = bomItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  // Custom labor estimates
  const laborTotal = laborHours * laborRateHourly;

  // Transport & Contingency
  let vehicleBaseFee = 1500;
  let vehicleKmPerLiter = 8;
  if (logisticsVehicle === '3-Ton') {
    vehicleBaseFee = 3000;
    vehicleKmPerLiter = 6;
  } else if (logisticsVehicle === '10-Ton') {
    vehicleBaseFee = 8000;
    vehicleKmPerLiter = 4;
  }
  const vehicleKmRate = fuelRate / vehicleKmPerLiter;
  const transportTotal = vehicleBaseFee + (logisticsDistance * vehicleKmRate);
  const contingencyRate = 0.10; // 10%
  const subtotal = materialsTotal + laborTotal + transportTotal;
  const contingencyAmount = subtotal * contingencyRate;
  const totalPerShelter = subtotal + contingencyAmount;

  // Scale economy discount: 1-10: 0%, 11-50: 4%, 51-200: 7%, 200+: 10%
  const discountFactor = scaleUnits > 200 ? 0.90 : scaleUnits > 50 ? 0.93 : scaleUnits > 10 ? 0.96 : 1.0;
  const totalProgramBudget = totalPerShelter * scaleUnits * discountFactor;

  const formatPrice = (pkr: number) => {
    return `₨ ${Math.round(pkr).toLocaleString()}`;
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setBomItems([
      ...bomItems,
      {
        id: Date.now().toString(),
        name: newItemName.trim(),
        category: 'Custom',
        qty: newItemQty,
        unit: newItemUnit,
        price: newItemPrice,
        source: newItemSource,
      },
    ]);
    setNewItemName('');
    setShowAddRow(false);
  };

  const handleExportCsv = () => {
    const headers = ['Item Name,Category,Quantity,Unit,Unit Price PKR,Total PKR,Source'];
    const rows = bomItems.map(
      (i) => `"${i.name}","${i.category}",${i.qty},"${i.unit}",${i.price},${(i.qty * i.price).toFixed(2)},"${i.source}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Panah_BOM_Estimation.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="page-wrap">
      {/* Head section with Total Box matching Designs/cost-estimation.html */}
      <div
        className="page-head"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1>Cost Estimation & Bill of Materials</h1>
          <p>LOCAL SOURCING MATRIX, LABOR ECONOMICS & VOLUME SCALE ANALYSIS</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              background: 'var(--cream)',
              borderRadius: '4px',
              padding: '12px 20px',
              textAlign: 'right',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
              UNIT COST / SHELTER
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--green-ok)' }}>
              {formatPrice(totalPerShelter)}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout matching Designs/cost-estimation.html */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: '24px',
          padding: '0 32px 48px',
          alignItems: 'start',
        }}
      >
        {/* Column 1: Bill of Materials Matrix */}
        <div className="card">
          <div className="card-head">
            <h2>Bill of Materials (BOM)</h2>
            <button
              onClick={handleExportCsv}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.7rem' }}
            >
              <FileSpreadsheet size={13} /> Export CSV
            </button>
          </div>

          <div style={{ padding: '0' }}>
            {bomItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--navy)', fontSize: '0.92rem', marginBottom: '4px' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: '#eceae0', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '2px', color: 'var(--ink-soft)' }}>
                      {item.qty} {item.unit}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        background: item.source === 'Local Bazaar' ? '#d9ecda' : 'var(--red-bg)',
                        color: item.source === 'Local Bazaar' ? 'var(--green-ok)' : 'var(--red)',
                      }}
                    >
                      {item.source}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy)', fontSize: '0.95rem' }}>
                      {formatPrice(item.qty * item.price)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)' }}>
                      {formatPrice(item.price)} / {item.unit}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink-soft)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--red)';
                      e.currentTarget.style.background = 'var(--red-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--ink-soft)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {bomItems.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                No materials in BOM. Click "Add Custom Line Item" below to add materials.
              </div>
            )}

            {showAddRow ? (
              <form onSubmit={handleAddItem} style={{ padding: '16px 20px', background: 'var(--cream-dim)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Item description"
                    className="input"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseInt(e.target.value, 10) || 1)}
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    className="input"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.05"
                    className="input"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                  />
                  <select
                    className="input"
                    value={newItemSource}
                    onChange={(e) => setNewItemSource(e.target.value as any)}
                  >
                    <option value="Local Bazaar">Local Bazaar</option>
                    <option value="Direct Depot">Direct Depot</option>
                    <option value="Salvage">Salvage</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.72rem' }} onClick={() => setShowAddRow(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.72rem' }}>
                    Add Line Item
                  </button>
                </div>
              </form>
            ) : (
              <div
                onClick={() => setShowAddRow(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--red)',
                  cursor: 'pointer',
                  borderTop: '1px dashed var(--line)',
                }}
              >
                <Plus size={14} /> Add Custom Line Item
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Expenditure Distribution & Regional Labor */}
        <div className="card">
          <div className="card-head">
            <h2>Expenditure Distribution</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
              COST RATIOS
            </span>
          </div>

          <div style={{ padding: '0' }}>
            {/* Metric Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--line)' }}>
              <div style={{ padding: '14px', borderRight: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '4px' }}>
                  Materials
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)', fontSize: '1.1rem' }}>
                  {formatPrice(materialsTotal)}
                </div>
              </div>

              <div style={{ padding: '14px', borderRight: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '4px' }}>
                  Labor
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)', fontSize: '1.1rem' }}>
                  {formatPrice(laborTotal)}
                </div>
              </div>

              <div style={{ padding: '14px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '4px' }}>
                  Logistics
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)', fontSize: '1.1rem' }}>
                  {formatPrice(transportTotal + contingencyAmount)}
                </div>
              </div>
            </div>

            {/* Expenditure Bar */}
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '10px' }}>
                Cost Proportions
              </div>

              <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                <span style={{ width: `${(materialsTotal / totalPerShelter) * 100}%`, background: 'var(--green-ok)' }} title="Materials" />
                <span style={{ width: `${(laborTotal / totalPerShelter) * 100}%`, background: 'var(--amber)' }} title="Labor" />
                <span style={{ width: `${((transportTotal + contingencyAmount) / totalPerShelter) * 100}%`, background: 'var(--red)' }} title="Logistics & Contingency" />
              </div>

              <div style={{ display: 'flex', gap: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--green-ok)', display: 'inline-block' }} />
                  Materials ({Math.round((materialsTotal / totalPerShelter) * 100)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }} />
                  Labor ({Math.round((laborTotal / totalPerShelter) * 100)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} />
                  Logistics & Contingency
                </div>
              </div>
            </div>

            {/* Custom Labor & Time */}
            <div style={{ padding: '18px 20px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                    Labor Rate (PKR/hr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="input"
                    style={{ width: '100%' }}
                    value={laborRateHourly}
                    onChange={(e) => setLaborRateHourly(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                    Est. Team-Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    style={{ width: '100%' }}
                    value={laborHours}
                    onChange={(e) => setLaborHours(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>
              <p style={{ margin: '12px 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                Standard construction team: 2 skilled carpenters + 4 community apprentices (default: 76 team-hours).
              </p>
            </div>

            {/* Logistics & Transport */}
            <div style={{ padding: '18px 20px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                    Distance to Site (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    style={{ width: '100%' }}
                    value={logisticsDistance}
                    onChange={(e) => setLogisticsDistance(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                    Fuel Rate (PKR/L)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    style={{ width: '100%' }}
                    value={fuelRate}
                    onChange={(e) => setFuelRate(parseFloat(e.target.value) || 280)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                    Transport Vehicle
                  </label>
                  <select
                    className="input"
                    style={{ width: '100%' }}
                    value={logisticsVehicle}
                    onChange={(e) => setLogisticsVehicle(e.target.value as any)}
                  >
                    <option value="Pickup">Pickup (1.5 Ton)</option>
                    <option value="3-Ton">Mazda (3 Ton)</option>
                    <option value="10-Ton">Truck (10 Ton)</option>
                  </select>
                </div>
              </div>
              <p style={{ margin: '12px 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                Cost formula: Base loading fee + (Distance * (Fuel Rate / Vehicle Fuel Efficiency)).
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Scale Estimator & Program Budget */}
        <div
          style={{
            background: 'var(--navy)',
            color: 'var(--cream)',
            borderRadius: 'var(--radius)',
            padding: '24px',
          }}
        >
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '20px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.15rem', margin: '0 0 4px' }}>
              Program Scale Estimator
            </h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--lime)' }}>
              MULTI-UNIT BULK PROCUREMENT
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: '8px' }}>
              <span>TARGET UNITS:</span>
              <strong style={{ color: 'var(--lime)', fontSize: '1.1rem' }}>{scaleUnits} Shelters</strong>
            </div>

            <input
              type="range"
              min="1"
              max="500"
              value={scaleUnits}
              onChange={(e) => setScaleUnits(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--lime)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
              <span>1 unit (pilot)</span>
              <span>100 units</span>
              <span>500 units (cluster)</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              TOTAL PROGRAM BUDGET
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--lime)', marginBottom: '4px' }}>
              {formatPrice(totalProgramBudget)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
              {scaleUnits > 10 ? `Includes ${(100 - discountFactor * 100).toFixed(0)}% bulk procurement efficiency` : 'Standard single-unit benchmark'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-lime"
              style={{ width: '100%', padding: '12px' }}
              onClick={handleExportCsv}
            >
              <Download size={14} /> Download Bulk Bill of Materials
            </button>
            <button
              className="btn btn-outline-white"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => alert(`Generated procurement purchase requisition for ${scaleUnits} units.`)}
            >
              Generate Logistics Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
