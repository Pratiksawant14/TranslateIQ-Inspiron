import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User, Search } from 'lucide-react';

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
    <header className="glassmorphic-header fixed top-0 left-0 right-0 h-[56px] z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Side — Page Title + Breadcrumb */}
        <div className="flex flex-col justify-center">
          <h2
            className="font-display font-semibold text-lg leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {pageTitle}
          </h2>
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {breadcrumb}
          </span>
        </div>

        {/* Center — Search (inspired by the reference mockup) */}
        <div className="hidden md:flex items-center">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-base)',
              minWidth: '220px',
            }}
          >
            <Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Search</span>
          </div>
        </div>

        {/* Right Side — Notifications + User Avatar */}
        <div className="flex items-center space-x-4">
          <button
            className="relative group transition-all duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Bell className="w-5 h-5 group-hover:text-indigo-600 transition-colors" />
            {/* Notification dot */}
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          </button>
          
          <div className="h-6 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
          
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div
              className="w-8 h-8 rounded-full border flex items-center justify-center group-hover:border-indigo-400 transition-all"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                borderColor: 'var(--color-border)',
              }}
            >
              <User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-medium group-hover:text-indigo-600 transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Workspace
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                TranslateIQ
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
