import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';

interface ProfileDropdownProps {
  onClose: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: 'absolute',
        top: '48px',
        right: '0',
        width: '280px',
        background: 'var(--cream)',
        borderRadius: '4px',
        boxShadow: '0 18px 40px rgba(0,0,0,.28)',
        padding: '18px',
        zIndex: 60,
        textAlign: 'left',
        border: '1px solid rgba(0,0,0,.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '14px',
          marginBottom: '10px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--navy)',
            color: 'var(--cream)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
          }}
        >
          FA
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--navy)', fontSize: '0.95rem' }}>
            Field Assessment Officer
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--green-ok)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Lead Structural Assessor
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => {
            navigate('/settings');
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            letterSpacing: '0.03em',
            color: 'var(--ink)',
            padding: '10px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '2px',
            textAlign: 'left',
          }}
        >
          <Settings size={15} color="var(--ink-soft)" />
          System Preferences
        </button>

        <button
          onClick={() => {
            navigate('/history');
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            letterSpacing: '0.03em',
            color: 'var(--ink)',
            padding: '10px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '2px',
            textAlign: 'left',
          }}
        >
          <ShieldCheck size={15} color="var(--ink-soft)" />
          Audit Trail & Versions
        </button>

        <div style={{ borderTop: '1px solid var(--line)', marginTop: '6px', paddingTop: '8px' }}>
          <button
            onClick={() => {
              alert('Logged out from local assessment session.');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              letterSpacing: '0.03em',
              color: 'var(--red)',
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '2px',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDropdown;
