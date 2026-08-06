import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserButton } from '@clerk/clerk-react';
import NotificationBell from './NotificationBell';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/expenses', label: 'Expenses', icon: '💸' },
  { path: '/groups', label: 'Groups', icon: '🌍' },
  { path: '/budgets', label: 'Budgets', icon: '🎯' },
  { path: '/insights', label: 'AI Insights', icon: '🧠' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  let pageTitle = '';
  if (location.pathname === '/') pageTitle = 'Dashboard';
  else if (location.pathname.startsWith('/expenses')) pageTitle = 'Expenses';
  else if (location.pathname.startsWith('/budgets')) pageTitle = 'Budgets';
  else if (location.pathname.startsWith('/groups')) pageTitle = 'Group Expenses';
  else if (location.pathname.startsWith('/insights')) pageTitle = 'AI Insights';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: 'var(--color-base-950)' }}>
      {/* ===== Desktop Sidebar ===== */}
      <aside 
        className={`hidden md:flex flex-col justify-between w-64 p-5 fixed h-screen sidebar z-40 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="mb-8 px-2">
            <h1
              className="text-2xl font-bold gradient-text"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              💰 SmartSpend
            </h1>
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-base-500)' }}>
              Smart personal finance
            </p>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`
                }
              >
                <span className="text-xl w-7 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User card */}
        <div className="p-4 border-t border-base-800">
          <div className="flex items-center gap-3">
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: 'w-10 h-10',
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-base-100 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-base-500 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== Mobile Header ===== */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(5, 10, 24, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <h1 className="text-lg font-bold gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
          💰 SmartSpend
        </h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-xs font-medium border border-base-800"
            style={{ color: 'var(--color-base-300)', background: 'rgba(255,255,255,0.03)' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ===== Mobile Bottom Navigation ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bottom-nav flex justify-between px-1 pb-3 pt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="truncate w-full">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ===== Main Content ===== */}
      <main 
        onClick={() => {
          if (isSidebarOpen) setIsSidebarOpen(false);
        }}
        className={`flex-1 min-h-screen relative transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'layout-main-open' : 'layout-main-closed'
        }`}
      >
        {/* Desktop Header area */}
        <div className="hidden md:flex h-24 items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 rounded-xl bg-base-900 border border-white/10 text-white hover:bg-base-800 transition-all duration-300 shadow-sm text-2xl flex items-center justify-center w-12 h-12"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? '◀' : '☰'}
            </button>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-base-50)' }}>
              {pageTitle}
            </h1>
          </div>
          
          <NotificationBell />
        </div>
        
        {/* Content area */}
        <div 
          className="px-4 md:px-8 pb-8 pt-24 md:pt-0 flex-1" 
          style={{ width: '100%' }}
        >
          {/* Mobile Title */}
          <div className="md:hidden mb-5">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-base-50)' }}>
              {pageTitle}
            </h1>
          </div>

          <div className="animate-fade-in" style={{ width: '100%' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
