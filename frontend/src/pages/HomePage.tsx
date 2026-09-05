import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowRight, Wind, Activity, DollarSign, Hammer, CheckCircle2, ShieldAlert, ChevronDown, Trash2 } from 'lucide-react';
import { fetchProjects, createProject, deleteProject, fetchDashboardStats } from '../services/api';
import type { Project, DashboardStats } from '../services/api';
import heroBackground from '../assets/hero-background.png';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, sData] = await Promise.all([
        fetchProjects().catch(() => []),
        fetchDashboardStats().catch(() => null),
      ]);
      setProjects(pData || []);
      setStats(sData || null);
      setError(null);
    } catch (err: any) {
      console.warn('Backend unavailable:', err);
      setProjects([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      // Refresh stats
      fetchDashboardStats().then(setStats).catch(() => {});
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newLocation.trim()) return;

    try {
      setSubmitting(true);
      const created = await createProject({
        name: newProjectName.trim(),
        location: newLocation.trim(),
      });
      setModalOpen(false);
      setNewProjectName('');
      setNewLocation('');
      await loadData();
      navigate(`/build?projectId=${created.id}`);
    } catch {
      // Fallback local create if backend is offline
      const newId = projects.length + 1;
      const localProj: Project = {
        id: newId,
        name: newProjectName.trim(),
        location: newLocation.trim(),
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects([localProj, ...projects]);
      setModalOpen(false);
      setNewProjectName('');
      setNewLocation('');
      navigate(`/build?projectId=${newId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  return (
    <div className="page-wrap">
      {/* Modernized Architectural Hero Section */}
      <section
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 62px)',
          background: '#a8b89a',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          padding: '60px 24px 84px',
          boxSizing: 'border-box',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Hero Background Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          {/* Live System Status Chip */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(22, 35, 43, 0.72)',
              border: '1px solid rgba(183, 239, 154, 0.4)',
              borderRadius: '20px',
              padding: '6px 14px',
              marginBottom: '20px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--lime)',
                boxShadow: '0 0 8px var(--lime)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                color: 'var(--lime)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Field CAD Engine • Sphere 2018 & ASCE 7-22
            </span>
          </div>

          {/* Dual Script Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                letterSpacing: '0.05em',
                fontSize: 'clamp(2.6rem, 5vw, 3.8rem)',
                color: '#ffffff',
                margin: 0,
                textShadow: '0 3px 20px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.95)',
              }}
            >
              PANAH
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(1.4rem, 3vw, 2.0rem)',
                color: 'var(--lime)',
                background: 'rgba(22, 35, 43, 0.75)',
                border: '1px solid rgba(183, 239, 154, 0.4)',
                padding: '2px 14px',
                borderRadius: '6px',
                lineHeight: 1.3,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              پناگاہ
            </span>
          </div>

          <p
            style={{
              color: '#ffffff',
              fontSize: 'clamp(0.98rem, 1.8vw, 1.15rem)',
              lineHeight: 1.65,
              maxWidth: '680px',
              margin: '0 auto 26px',
              fontWeight: 500,
              textShadow: '0 2px 14px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.95)',
            }}
          >
            Rapid parametric structural assessment platform for humanitarian shelters. Real-time deterministic wind load calculations, seismic base shear checks, and automated Sphere Standard compliance.
          </p>

          {/* Engineering Capability Tags */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '32px',
            }}
          >
            <span
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                padding: '5px 11px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#eceae0',
              }}
            >
              ✓ Deterministic Sphere Standard
            </span>
            <span
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                padding: '5px 11px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#eceae0',
              }}
            >
              ✓ Interactive Three.js 3D Wireframe
            </span>
            <span
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                padding: '5px 11px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#eceae0',
              }}
            >
              ✓ Dynamic Bill of Materials & Costing
            </span>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-lime"
              onClick={() => setModalOpen(true)}
              style={{
                padding: '14px 26px',
                fontSize: '0.88rem',
                boxShadow: '0 4px 18px rgba(183, 239, 154, 0.25)',
              }}
            >
              <Plus size={16} /> New Assessment Project
            </button>
            <Link
              to="/build"
              className="btn"
              style={{
                padding: '14px 24px',
                fontSize: '0.88rem',
                background: 'rgba(22, 35, 43, 0.85)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              <Hammer size={16} /> Open Parametric 3D CAD
            </Link>
            <Link
              to="/guideline"
              className="btn"
              style={{
                padding: '14px 22px',
                fontSize: '0.88rem',
                background: 'rgba(22, 35, 43, 0.85)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              Standards Catalog <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Scroll indicator prompt */}
        <div
          onClick={() => {
            const el = document.getElementById('recent-projects-anchor');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollTo({ top: window.innerHeight - 62, behavior: 'smooth' });
            }
          }}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            zIndex: 3,
            opacity: 0.85,
            transition: 'opacity 0.2s ease',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            Scroll Down
          </span>
          <ChevronDown size={20} color="#fff" />
        </div>
      </section>

      {/* Stats Telemetry Strip */}
      <div
        id="recent-projects-anchor"
        style={{
          background: '#121c22',
          color: 'var(--cream)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--sage)', letterSpacing: '0.07em', marginBottom: '3px' }}>
            Total Projects
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            {stats ? stats.total_projects : '3'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--sage)', letterSpacing: '0.07em', marginBottom: '3px' }}>
            Field Sites
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)' }}>
            {stats ? stats.total_sites : '6'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--sage)', letterSpacing: '0.07em', marginBottom: '3px' }}>
            Material Profiles
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            {stats ? stats.total_materials : '12'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--sage)', letterSpacing: '0.07em', marginBottom: '3px' }}>
            Deterministic Rules
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)' }}>
            8 Sphere Standards
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--sage)', letterSpacing: '0.07em', marginBottom: '3px' }}>
            Telemetry System
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--lime)', display: 'flex', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'center', marginTop: '2px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', boxShadow: '0 0 6px var(--lime)', display: 'inline-block' }} /> 100% OPERATIONAL
          </div>
        </div>
      </div>

      {/* Projects Grid Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 24px 60px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '36px 0 18px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--navy)' }}>
              Active Shelter Projects
            </h3>
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
              Parametric candidates, wind load benchmarks, and compliance evidence
            </p>
          </div>
          <Link
            to="/history"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--red)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            VIEW ALL REVISIONS <ArrowRight size={14} />
          </Link>
        </div>

        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '14px 18px', borderRadius: '3px', marginBottom: '20px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>
            Loading field assessment data...
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: '64px 24px',
              textAlign: 'center',
              background: 'var(--cream)',
              borderRadius: 'var(--radius)',
              border: '2px dashed var(--line)',
              boxShadow: 'var(--shadow-sm)',
              maxWidth: '560px',
              margin: '20px auto 40px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '1.5px solid var(--red)',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Plus size={28} />
            </div>
            <h4 style={{ color: 'var(--navy)', marginBottom: '8px', fontSize: '1.25rem' }}>
              No Active Shelter Projects
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              All placeholder projects have been removed. Click below to initialize a new humanitarian shelter assessment project.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
              style={{ padding: '12px 28px', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> Add New Project
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px',
            }}
          >
            {projects.map((proj, idx) => (
              <div
                key={proj.id}
                className="card card-interactive"
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    height: '140px',
                    background: idx % 2 === 0
                      ? 'linear-gradient(135deg, #2b4141, #1c2c35)'
                      : 'linear-gradient(135deg, #4b564e, #293836)',
                    position: 'relative',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {getStatusBadge(proj.status)}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                      v1.{proj.id}
                    </span>
                  </div>

                  <div style={{ color: '#fff' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', opacity: 0.8, textTransform: 'uppercase' }}>
                      {proj.location}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>{proj.name}</h4>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)', marginBottom: '16px' }}>
                      REF: PANAH-00{proj.id} • Registered {new Date(proj.created_at).toLocaleDateString()}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '18px' }}>
                      <div style={{ background: 'rgba(0,0,0,.03)', padding: '8px 10px', borderRadius: '2px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                          <Wind size={10} style={{ display: 'inline', marginRight: '3px' }} /> Wind
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                          1.25 kPa
                        </div>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,.03)', padding: '8px 10px', borderRadius: '2px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                          <Activity size={10} style={{ display: 'inline', marginRight: '3px' }} /> Seismic
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                          Zone 3
                        </div>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,.03)', padding: '8px 10px', borderRadius: '2px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                          <DollarSign size={10} style={{ display: 'inline', marginRight: '3px' }} /> Cost
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--green-ok)' }}>
                          $420/u
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }}
                      onClick={() => navigate(`/build?projectId=${proj.id}`)}
                    >
                      <Hammer size={13} /> Open Design
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }}
                      onClick={() => navigate(`/cost-estimation?projectId=${proj.id}`)}
                    >
                      <DollarSign size={13} /> Cost Model
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.75rem',
                        color: 'var(--red)',
                        borderColor: 'rgba(217, 83, 79, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(proj.id, proj.name);
                      }}
                      title="Delete Project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Create Project Card */}
            <div
              onClick={() => setModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                textAlign: 'center',
                minHeight: '280px',
                border: '2px dashed var(--line)',
                background: 'rgba(255,255,255,.4)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                padding: '24px',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--red)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--red)',
                  color: 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Plus size={22} />
              </div>
              <h4 style={{ color: 'var(--navy)', marginBottom: '6px', fontSize: '1.05rem' }}>
                New Field Assessment
              </h4>
              <p style={{ fontSize: '0.8rem', maxWidth: '220px', margin: 0, color: 'var(--ink-soft)' }}>
                Initialize site dimensions, environmental hazards, and rapid structural constraints.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Project */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h3>Create Shelter Assessment Project</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="card-body">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '6px' }}>
                  Project Name / Campaign
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Swat Flood Response Phase 2"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '6px' }}>
                  Geographic Location (District / Region)
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Dadu District, Sindh, Pakistan"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
