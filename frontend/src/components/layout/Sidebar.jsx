import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  BookOpen, 
  Palette, 
  BarChart3, 
  Settings,
  ChevronLeft
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderOpen },
    { name: 'Glossary', path: '/glossary', icon: BookOpen },
    { name: 'Style Profiles', path: '/styles', icon: Palette },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Detect cursor position for left edge trigger
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientX < 40) {
        setIsOpen(true);
      }
    };

    const handleMouseLeave = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.relatedTarget) && e.clientX > 40) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <>
      {/* Trigger Zone Indicator */}
      <div 
        className="fixed left-0 top-0 w-1 h-screen pointer-events-none z-40 transition-all duration-300"
        style={{
          backgroundColor: 'var(--color-primary)',
          opacity: isOpen ? 0 : 0.15,
        }}
      />

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen w-[260px] flex flex-col z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-[260px]'
        }`}
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border)',
          boxShadow: isOpen ? 'var(--shadow-xl)' : 'none',
        }}
      >
        {/* Top Section — Logo */}
        <div
          className="p-6"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
            Translate<span style={{ color: 'var(--color-primary)' }}>IQ</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Translation Studio
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-4 p-2 rounded-lg transition-all hover:bg-indigo-50"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Close sidebar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 border ${
                  !isActive ? 'hover:bg-slate-50 border-transparent' : ''
                }`}
                style={isActive ? {
                  backgroundColor: 'var(--color-primary-light)',
                  borderColor: '#C7D2FE',
                  color: 'var(--color-primary)',
                } : {
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  color: 'var(--color-text-primary)',
                }}
              >
                <Icon
                  className="w-5 h-5 mr-3"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                />
                <span
                  className="text-sm"
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    fontWeight: isActive ? '600' : '500',
                  }}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: 'var(--color-bg-base)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Powered by
            </p>
            <p className="text-xs font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
              Claude AI
            </p>
          </div>
        </div>

        {/* Hint Text */}
        <div
          className="px-4 py-3 text-center text-xs"
          style={{
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          Move cursor right to close
        </div>
      </aside>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.15)' }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
