import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

const TopBar = () => {
  const location = useLocation();

  // Very simple page title derived from path
  let pageTitle = "Dashboard";
  let breadcrumb = "Home";

  if (location.pathname.startsWith('/projects')) {
    pageTitle = "Projects";
    breadcrumb = "Projects";
    if (location.pathname.includes('/documents/') && location.pathname.includes('/validate')) {
      pageTitle = "Validation";
      breadcrumb = "Projects / Document / Validate";
    } else if (location.pathname.includes('/documents/') && location.pathname.includes('/review')) {
      pageTitle = "Review Editor";
      breadcrumb = "Projects / Document / Review";
    } else if (location.pathname !== '/projects') {
      pageTitle = "Project Detail";
      breadcrumb = "Projects / Detail";
    }
  } else if (location.pathname.startsWith('/glossary')) {
    pageTitle = "Glossary";
    breadcrumb = "Glossary";
  } else if (location.pathname.startsWith('/styles')) {
    pageTitle = "Style Profiles";
    breadcrumb = "Style Profiles";
  } else if (location.pathname.startsWith('/analytics')) {
    pageTitle = "Analytics";
    breadcrumb = "Analytics";
  } else if (location.pathname.startsWith('/settings')) {
    pageTitle = "Settings";
    breadcrumb = "Settings";
  }

  return (
    <header className="fixed top-0 left-[240px] right-0 h-[56px] bg-[#0A1628] border-b border-[#1E3A5F] z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex flex-col justify-center">
          <h2 className="font-display font-semibold text-white text-lg leading-tight">{pageTitle}</h2>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{breadcrumb}</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          <button className="text-slate-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#2563EB] rounded-full"></span>
          </button>
          
          <div className="h-6 w-px bg-[#1E3A5F]"></div>
          
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200">Workspace</span>
              <span className="text-[10px] text-slate-500">TranslateIQ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
