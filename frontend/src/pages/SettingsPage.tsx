import React, { useState } from 'react';
import { Save, Check, Key, Copy, CheckCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [defaultCurrency, setDefaultCurrency] = useState<'USD' | 'PKR'>('PKR');
  const [climateZone, setClimateZone] = useState('south_asia_monsoon');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('panah_live_9f83a0e417bc83');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 10);
    setApiKey(`panah_live_${randomHex}`);
    alert('New API Key generated successfully!');
  };

  return (
    <div className="page-wrap">
      <div className="page-head" style={{ position: 'relative' }}>
        <h1>System Preferences</h1>
        <p>ENGINEERING PARAMETERS, REGIONAL PRESETS & API ACCESS</p>

        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ position: 'absolute', top: '24px', right: '32px' }}
        >
          {saved ? <Check size={14} color="var(--lime)" /> : <Save size={14} />}
          {saved ? 'Preferences Saved' : 'Save Preferences'}
        </button>
      </div>

      <div style={{ padding: '0 32px 48px' }}>
        <form onSubmit={handleSave} className="card" style={{ padding: '36px', background: 'var(--cream-dim)' }}>
          {/* User Profile Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '32px',
              borderBottom: '1px solid var(--line)',
              paddingBottom: '24px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: '0 0 6px', color: 'var(--navy)' }}>
                Field Assessor Credentials
              </h2>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                Active profile attached to deterministic engineering approvals and immutable audit trails.
              </p>
            </div>

            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '6px',
                background: 'var(--navy)',
                color: 'var(--cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.5rem',
              }}
            >
              FA
            </div>
          </div>

          {/* Grid of Fields matching Designs/settings.html */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                defaultValue="Lead Field Engineer"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Primary Engineering Role
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                defaultValue="Lead Structural Assessment Specialist"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Engineering Unit Standard
              </label>
              <select
                className="input"
                style={{ width: '100%' }}
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value as any)}
              >
                <option value="metric">Metric SI (meters, kPa, kN, kg/m³)</option>
                <option value="imperial">Imperial (feet, psf, kips, pcf)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Default Financial Currency
              </label>
              <select
                className="input"
                style={{ width: '100%' }}
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as any)}
              >
                <option value="PKR">PKR (₨) — Pakistan Regional Tender</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Default Hazard & Climate Profile
              </label>
              <select
                className="input"
                style={{ width: '100%' }}
                value={climateZone}
                onChange={(e) => setClimateZone(e.target.value)}
              >
                <option value="south_asia_monsoon">South Asia Monsoon (Heavy Rain + High Flood)</option>
                <option value="arid_earthquake">Balochistan Arid / Seismic Zone 3-4</option>
                <option value="mountain_subzero">KP / Karakoram Alpine Sub-Zero</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Seismic Soil Site Class (ASCE 7)
              </label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                defaultValue="Class D (Stiff Soil / Alluvial Riverbed)"
              />
            </div>
          </div>

          {/* Platform API Key Management Section */}
          <div
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              borderRadius: '4px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Key size={18} color="var(--navy)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Automated Assessment API Key</h3>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
              Use this key to submit field drone captures or ingest sensor data via the <code>/api/v1/</code> endpoints.
            </p>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                readOnly
                className="input"
                style={{ flex: 1, fontFamily: 'var(--font-mono)', background: '#fff' }}
                value={apiKey}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopyKey}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <CheckCheck size={14} color="var(--green-ok)" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Key'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleGenerateKey}
              >
                Regenerate Key
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
