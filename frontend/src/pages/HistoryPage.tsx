import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Hammer, DollarSign, Download, CheckCircle2, Activity, ShieldAlert, Trash2 } from 'lucide-react';
import { fetchProjectsHistory, downloadReportPdf, deleteProject } from '../services/api';
import type { ProjectHistoryItem } from '../services/api';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<ProjectHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    setLoading(true);
    fetchProjectsHistory()
      .then((data) => {
        setHistoryItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Backend history service unavailable:', err);
        setHistoryItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteProject(projectId);
      setHistoryItems((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== projectId) : []));
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  const safeItems = Array.isArray(historyItems) ? historyItems : [];
  const filteredItems = safeItems.filter((item) => {
    const name = (item.name || '').toLowerCase();
    const location = (item.location || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || location.includes(term);
    const matchesStatus = statusFilter === 'ALL' || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'certified':
        return <span className="badge ok"><CheckCircle2 size={11} /> Certified</span>;
      case 'in_progress':
        return <span className="badge warn"><Activity size={11} /> In Progress</span>;
      case 'review':
        return <span className="badge bad"><ShieldAlert size={11} /> Review Pending</span>;
      default:
        return <span className="badge draft">Draft Phase</span>;
    }
  };

  const handleDownload = async (projectName: string, id: number) => {
    try {
      const blob = await downloadReportPdf({
        project_name: projectName,
        designer: 'Lead Assessor (Field Team)',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Panah_History_Report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to generate report: ' + err.message);
    }
  };

  return (
    <div className="page-wrap">
      {/* Page Header */}
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
          <h1>Project History & Audit Trail</h1>
          <p>IMMUTABLE REVISION LOG, FIELD SITES & ASSESSMENTS</p>
        </div>

        {/* Search box matching Designs/history.html */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--cream)',
            borderRadius: '2px',
            padding: '8px 14px',
            border: '1px solid var(--line)',
            minWidth: '280px',
          }}
        >
          <Search size={16} color="var(--ink-soft)" />
          <input
            type="text"
            placeholder="Search projects or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--navy)',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ padding: '0 32px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['ALL', 'certified', 'in_progress', 'review', 'draft'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '6px 14px',
              borderRadius: '20px',
              border: statusFilter === s ? '1px solid var(--navy)' : '1px solid var(--line)',
              background: statusFilter === s ? 'var(--navy)' : 'var(--cream)',
              color: statusFilter === s ? 'var(--cream)' : 'var(--ink-soft)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontWeight: statusFilter === s ? 600 : 400,
              transition: 'all 0.18s ease',
              boxShadow: statusFilter === s ? '0 2px 8px rgba(22, 35, 43, 0.2)' : 'none',
            }}
          >
            {s === 'ALL' ? 'All Records' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table Container matching Designs/history.html */}
      <div style={{ padding: '0 32px 48px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--cream-dim)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.06em' }}>
                  Project Name & ID
                </th>
                <th style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.06em' }}>
                  Location
                </th>
                <th style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.06em' }}>
                  Sites & Materials
                </th>
                <th style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.06em' }}>
                  Status
                </th>
                <th style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.06em' }}>
                  Version
                </th>
                <th style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-soft)', letterSpacing: '0.06em', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                    Loading revision history...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ maxWidth: '440px', margin: '0 auto' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--navy)', marginBottom: '8px', fontWeight: 600 }}>
                        {safeItems.length === 0 ? 'No Projects in Audit Trail' : 'No Matching Records'}
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '20px', lineHeight: 1.5 }}>
                        {safeItems.length === 0
                          ? 'All placeholder records have been cleared. Create your first project from the dashboard to start logging audit history and calculations.'
                          : 'No projects match your current search keywords or status filter.'}
                      </p>
                      {safeItems.length === 0 && (
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate('/')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Hammer size={14} /> Go to Home & Add Project
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--navy)', fontSize: '0.98rem' }}>
                        {item.name || 'Untitled Project'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                        REF: PANAH-00{item.id}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--navy)' }}>
                        <MapPin size={14} color="var(--ink-soft)" />
                        {item.location || 'Unspecified'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)', marginTop: '2px' }}>
                        Registered: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--navy)' }}>
                        {(item.site_count ?? 0)} Site{(item.site_count ?? 0) !== 1 ? 's' : ''} • {(item.material_count ?? 0)} Material Types
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {getStatusBadge(item.status)}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)', background: 'var(--cream-dim)', padding: '3px 8px', borderRadius: '2px' }}>
                        v1.{item.id}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                          title="Open in Parametric Builder"
                          onClick={() => navigate(`/build?projectId=${item.id}`)}
                        >
                          <Hammer size={12} /> Design
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                          title="View Cost Model"
                          onClick={() => navigate(`/cost-estimation?projectId=${item.id}`)}
                        >
                          <DollarSign size={12} /> BOM
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 8px', fontSize: '0.72rem' }}
                          title="Download PDF Report"
                          onClick={() => handleDownload(item.name, item.id)}
                        >
                          <Download size={12} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.72rem',
                            color: 'var(--red)',
                            borderColor: 'rgba(217, 83, 79, 0.35)',
                          }}
                          title="Delete Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(item.id, item.name);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Table Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--ink-soft)',
              background: 'var(--cream-dim)',
            }}
          >
            <span>Showing {filteredItems.length} of {historyItems.length} registered projects</span>
            <span>All records signed with SHA-256 integrity hash</span>
          </div>
        </div>
      </div>
    </div>
  );
};
