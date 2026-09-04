import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Hammer, Calculator, History, BookOpen, Settings, User } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';

export const Navbar: React.FC = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topnav">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span className="brand-dot" />
        <span>PANAH</span>
        <span className="brand-urdu">پناگاہ</span>
      </div>

      <nav>
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Home size={15} />
          HOME
        </NavLink>
        <NavLink to="/build" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Hammer size={15} />
          BUILD
        </NavLink>
        <NavLink to="/cost-estimation" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Calculator size={15} />
          COST ESTIMATION
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>
          <History size={15} />
          HISTORY
        </NavLink>
        <NavLink to="/guideline" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BookOpen size={15} />
          STANDARDS
        </NavLink>
      </nav>

      <div className="right" style={{ position: 'relative' }} ref={profileRef}>
        <button
          className="iconbtn"
          title="System Preferences"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          <Settings size={17} />
        </button>

        <button
          className="iconbtn solid"
          title="Field Engineer Account"
          onClick={() => setProfileOpen(!profileOpen)}
          aria-label="User Account"
        >
          <User size={18} />
        </button>

        {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
      </div>
    </header>
  );
};
