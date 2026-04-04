import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  BookOpen, 
  Palette, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderOpen },
    { name: 'Glossary', path: '/glossary', icon: BookOpen },
    { name: 'Style Profiles', path: '/styles', icon: Palette },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#0F1B2D] border-r border-[#1E3A5F] flex flex-col">
      {/* Top Section */}
      <div className="p-6">
        <h1 className="font-display font-bold text-2xl text-[#2563EB]">
          Translate<span className="text-white">IQ</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Translation Studio</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded transition-all duration-200 group
                ${isActive 
                  ? 'bg-[#2563EB]/10 border-l-4 border-l-[#2563EB] text-[#2563EB]' 
                  : 'text-slate-300 hover:bg-[#1E3A5F]/50 hover:text-white border-l-4 border-l-transparent'
                }
              `}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-300'}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-6 border-t border-[#1E3A5F]/50">
        <div className="flex items-center text-slate-500 text-xs">
          <span>Powered by Claude</span>
          <div className="ml-2 w-4 h-4 rounded-sm border border-slate-600 bg-slate-800 flex items-center justify-center">
            {/* Anthropic Logo Placeholder */}
            <span className="text-[8px] font-bold">A</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
