import React, { useState } from 'react';
import { Plus, Download, FileSpreadsheet } from 'lucide-react';

interface BOMItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  priceUsd: number;
  source: 'Local Bazaar' | 'Direct Depot' | 'Salvage';
}

export const CostEstimationPage: React.FC = () => {
  const [currency, setCurrency] = useState<'USD' | 'PKR'>('PKR');
  const [exchangeRate] = useState<number>(278); // USD to PKR rate
  const [scaleUnits, setScaleUnits] = useState<number>(25);
  const [selectedRegion, setSelectedRegion] = useState<string>('south_asia');

  const [bomItems, setBomItems] = useState<BOMItem[]>([
    { id: '1', name: 'Treated Bamboo Poles (Ø 90mm, 4.5m)', category: 'Framing', qty: 140, unit: 'poles', priceUsd: 1.10, source: 'Local Bazaar' },
    { id: '2', name: 'Corrugated Galvanized Iron (28G)', category: 'Roofing', qty: 36, unit: 'sheets', priceUsd: 3.40, source: 'Direct Depot' },
    { id: '3', name: 'Stabilized Plinth Mud Bricks', category: 'Foundation', qty: 450, unit: 'blocks', priceUsd: 0.12, source: 'Local Bazaar' },
    { id: '4', name: 'Galvanized Hurricane Ties & Fasteners', category: 'Hardware', qty: 80, unit: 'pcs', priceUsd: 0.35, source: 'Direct Depot' },
    { id: '5', name: 'PVC Rain Gutter & Drainage Tube', category: 'Plumbing', qty: 2, unit: 'lengths', priceUsd: 4.50, source: 'Local Bazaar' },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemPrice, setNewItemPrice] = useState(1.5);
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemSource, setNewItemSource] = useState<'Local Bazaar' | 'Direct Depot' | 'Salvage'>('Local Bazaar');
  const [showAddRow, setShowAddRow] = useState(false);

  // Calculations
  const materialsTotalUsd = bomItems.reduce((acc, item) => acc + item.qty * item.priceUsd, 0);

  // Regional labor estimates
  const laborHours = 76; // total hours for 1 shelter
  const laborRateHourly = selectedRegion === 'south_asia' ? 1.50 : selectedRegion === 'central_asia' ? 1.80 : 1.20;
  const laborTotalUsd = laborHours * laborRateHourly;

  // Transport & Contingency
  const transportTotalUsd = 35.0;
  const contingencyRate = 0.10; // 10%
  const subtotal = materialsTotalUsd + laborTotalUsd + transportTotalUsd;
  const contingencyUsd = subtotal * contingencyRate;
  const totalPerShelterUsd = subtotal + contingencyUsd;

  // Scale economy discount: 1-10: 0%, 11-50: 4%, 51-200: 7%, 200+: 10%
  const discountFactor = scaleUnits > 200 ? 0.90 : scaleUnits > 50 ? 0.93 : scaleUnits > 10 ? 0.96 : 1.0;
  const totalProgramBudgetUsd = totalPerShelterUsd * scaleUnits * discountFactor;

  const formatPrice = (usd: number) => {
    if (currency === 'PKR') {
      return `₨ ${Math.round(usd * exchangeRate).toLocaleString()}`;
    }
    return `$${usd.toFixed(2)}`;
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
        priceUsd: newItemPrice,
        source: newItemSource,
      },
    ]);
    setNewItemName('');
    setShowAddRow(false);
  };

  const handleExportCsv = () => {
    const headers = ['Item Name,Category,Quantity,Unit,Unit Price USD,Total USD,Source'];
    const rows = bomItems.map(
      (i) => `"${i.name}","${i.category}",${i.qty},"${i.unit}",${i.priceUsd},${(i.qty * i.priceUsd).toFixed(2)},"${i.source}"`
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
          <div style={{ display: 'flex', background: 'rgba(22, 35, 43, 0.08)', border: '1px solid var(--line)', borderRadius: '6px', padding: '3px' }}>
            <button
              onClick={() => setCurrency('USD')}
              style={{
                background: currency === 'USD' ? 'var(--navy)' : 'transparent',
                color: currency === 'USD' ? '#fff' : 'var(--navy)',
                border: 'none',
                padding: '6px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.18s ease',
              }}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('PKR')}
              style={{
                background: currency === 'PKR' ? 'var(--navy)' : 'transparent',
                color: currency === 'PKR' ? '#fff' : 'var(--navy)',
                border: 'none',
                padding: '6px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.18s ease',
              }}
            >
              PKR (₨)
            </button>
          </div>

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
              {formatPrice(totalPerShelterUsd)}
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

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy)', fontSize: '0.95rem' }}>
                    {formatPrice(item.qty * item.priceUsd)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)' }}>
                    {formatPrice(item.priceUsd)} / {item.unit}
                  </div>
                </div>
              </div>
            ))}

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
                  {formatPrice(materialsTotalUsd)}
                </div>
              </div>

              <div style={{ padding: '14px', borderRight: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '4px' }}>
                  Labor
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)', fontSize: '1.1rem' }}>
                  {formatPrice(laborTotalUsd)}
                </div>
              </div>

              <div style={{ padding: '14px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '4px' }}>
                  Logistics
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)', fontSize: '1.1rem' }}>
                  {formatPrice(transportTotalUsd + contingencyUsd)}
                </div>
              </div>
            </div>

            {/* Expenditure Bar */}
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '10px' }}>
                Cost Proportions
              </div>

              <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                <span style={{ width: `${(materialsTotalUsd / totalPerShelterUsd) * 100}%`, background: 'var(--green-ok)' }} title="Materials" />
                <span style={{ width: `${(laborTotalUsd / totalPerShelterUsd) * 100}%`, background: 'var(--amber)' }} title="Labor" />
                <span style={{ width: `${((transportTotalUsd + contingencyUsd) / totalPerShelterUsd) * 100}%`, background: 'var(--red)' }} title="Logistics & Contingency" />
              </div>

              <div style={{ display: 'flex', gap: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--green-ok)', display: 'inline-block' }} />
                  Materials ({Math.round((materialsTotalUsd / totalPerShelterUsd) * 100)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }} />
                  Labor ({Math.round((laborTotalUsd / totalPerShelterUsd) * 100)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} />
                  Logistics & Contingency
                </div>
              </div>
            </div>

            {/* Regional Labor Benchmark */}
            <div style={{ padding: '18px 20px', borderTop: '1px solid var(--line)' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Regional Labor Benchmark
              </label>
              <select
                className="input"
                style={{ width: '100%' }}
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="south_asia">South Asia (Pakistan/India/Bangladesh - $1.50/hr)</option>
                <option value="central_asia">Central Asia (Tajikistan/Kyrgyzstan - $1.80/hr)</option>
                <option value="east_africa">East Africa (Horn of Africa Relief - $1.20/hr)</option>
              </select>
              <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                Standard construction team: 2 skilled carpenters + 4 community apprentices (estimated 76 team-hours).
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
              {formatPrice(totalProgramBudgetUsd)}
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
