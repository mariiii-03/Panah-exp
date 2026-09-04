import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Shield, Award } from 'lucide-react';
import { fetchStandardsRules, fetchStandardsCategories } from '../services/api';
import type { StandardRule } from '../services/api';

export const GuidelinePage: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [rules, setRules] = useState<StandardRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandardsCategories()
      .then((res) => {
        const catList = res.categories.map((c) => c.category);
        setCategories(catList);
        if (catList.length > 0) {
          setSelectedCategory(catList[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchStandardsRules()
      .then((res) => setRules(res.rules || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredRules = rules.filter((r) => {
    const matchesCat = !selectedCategory || r.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rule_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-head">
        <h1>Humanitarian Guidelines & Engineering Standards</h1>
        <p>SPHERE PROJECT HANDBOOK (2018), ASCE 7-22 & DETERMINISTIC CODE CATALOG</p>
      </div>

      {/* 2-Column Layout matching Designs/guideline.html */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '24px',
          padding: '0 32px 48px',
        }}
      >
        {/* Left Sidebar */}
        <div>
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)', marginBottom: '10px' }}>
              SPHERE STANDARDS REVISION 24.1
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line)', borderRadius: '2px', padding: '6px 10px', marginBottom: '16px' }}>
              <Search size={14} color="var(--ink-soft)" />
              <input
                type="text"
                placeholder="Filter rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
              />
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
              STANDARD CATEGORIES
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedCategory === cat ? 'var(--navy)' : 'transparent',
                    color: selectedCategory === cat ? '#fff' : 'var(--ink-soft)',
                    fontWeight: selectedCategory === cat ? 600 : 400,
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                  <ChevronRight size={12} style={{ opacity: selectedCategory === cat ? 1 : 0.4 }} />
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--line)', marginTop: '20px', paddingTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>
                <Shield size={14} color="var(--green-ok)" /> Deterministic Prescreening
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                Rules evaluate strictly on verified sensor or form telemetry — missing data yields <code>NOT_EVALUATED</code> rather than false compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Right Main Document */}
        <div className="card" style={{ padding: '36px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-ok)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '8px' }}>
            <Award size={16} /> INTERNATIONAL HUMANITARIAN CHARTER
          </div>

          <h2 style={{ fontSize: '1.75rem', margin: '0 0 12px', color: 'var(--navy)' }}>
            Category: {selectedCategory} Standards
          </h2>

          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 26px', maxWidth: '75ch', fontSize: '0.95rem' }}>
            The Sphere Project sets the minimum standards in disaster response to ensure people affected by disaster have a right to life with dignity.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {loading ? (
              <div style={{ fontFamily: 'var(--font-mono)', padding: '20px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                Loading standards rules catalog...
              </div>
            ) : filteredRules.map((rule) => (
              <div
                key={rule.rule_id}
                style={{
                  background: '#f4f8f0',
                  borderRadius: '6px',
                  padding: '16px 20px',
                  border: '1px solid rgba(63, 122, 77, 0.18)',
                  borderLeft: rule.severity === 'critical' ? '4px solid var(--red)' : '4px solid var(--green-ok)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        background: '#fff',
                        borderRadius: '2px',
                        padding: '2px 6px',
                        color: 'var(--navy)',
                        fontWeight: 600,
                      }}
                    >
                      {rule.rule_id}
                    </span>
                    <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', fontSize: '0.95rem' }}>
                      {rule.title}
                    </strong>
                  </div>

                  <span className={`badge ${rule.severity === 'critical' ? 'bad' : 'ok'}`}>
                    {rule.severity}
                  </span>
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  {rule.description}
                </p>

                <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--navy)', flexWrap: 'wrap' }}>
                  <span>
                    <strong>Requirement:</strong> {rule.requirement}
                  </span>
                  <span>
                    <strong>Verification:</strong> {rule.verification_source}
                  </span>
                  {rule.check_type && (
                    <span>
                      <strong>Check:</strong> {rule.check_type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Construction Blueprint Diagram Callout matching Designs/guideline.html */}
          <div
            style={{
              border: '2px solid var(--navy)',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'var(--navy)',
                color: 'var(--cream)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                padding: '8px 14px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>FIGURE 2.4 — PARAMETRIC TRUSS ANCHORAGE BENCHMARK</span>
              <span>SCALE 1:25 METRIC</span>
            </div>

            <div
              style={{
                height: '240px',
                background: `repeating-linear-gradient(0deg, #eceae0, #eceae0 22px, #e2e0d4 22px, #e2e0d4 23px),
                             repeating-linear-gradient(90deg, #eceae0, #eceae0 22px, #e2e0d4 22px, #e2e0d4 23px)`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* SVG schematic truss */}
              <svg width="420" height="180" viewBox="0 0 420 180" style={{ maxWidth: '100%' }}>
                {/* Columns */}
                <line x1="60" y1="140" x2="60" y2="70" stroke="var(--navy)" strokeWidth="4" />
                <line x1="360" y1="140" x2="360" y2="70" stroke="var(--navy)" strokeWidth="4" />
                {/* Plinth */}
                <rect x="40" y="140" width="340" height="24" fill="#a9b79c" stroke="var(--navy)" strokeWidth="2" />
                {/* Bottom Chord */}
                <line x1="60" y1="70" x2="360" y2="70" stroke="var(--navy)" strokeWidth="4" />
                {/* Rafters */}
                <line x1="60" y1="70" x2="210" y2="20" stroke="var(--navy)" strokeWidth="4" />
                <line x1="360" y1="70" x2="210" y2="20" stroke="var(--navy)" strokeWidth="4" />
                {/* King Post */}
                <line x1="210" y1="70" x2="210" y2="20" stroke="var(--red)" strokeWidth="3" strokeDasharray="4 2" />
                {/* Diagonal Braces */}
                <line x1="135" y1="70" x2="210" y2="20" stroke="#3f7a4d" strokeWidth="2" />
                <line x1="285" y1="70" x2="210" y2="20" stroke="#3f7a4d" strokeWidth="2" />
                {/* Labels */}
                <text x="215" y="45" fontFamily="var(--font-mono)" fontSize="10" fill="var(--red)">King Post</text>
                <text x="210" y="85" fontFamily="var(--font-mono)" fontSize="10" fill="var(--navy)" textAnchor="middle">Tie Beam (Span: 5.0m)</text>
              </svg>

              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'var(--navy)',
                  color: 'var(--cream)',
                  padding: '10px 14px',
                  borderRadius: '2px',
                  maxWidth: '260px',
                  fontSize: '0.72rem',
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ display: 'block', fontFamily: 'var(--font-display)', marginBottom: '3px', color: 'var(--lime)' }}>
                  Eaves Overhang Note
                </strong>
                A 300mm minimum eaves projection protects mud brick walls from erosion during heavy monsoon rains.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
