import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isGlossary = location.pathname === '/glossary';

  return (
    <div
      className="min-h-screen relative"
      style={{ minHeight: '100vh' }}
    >
      {/* Background Video Layer - Only on Dashboard */}
      {isDashboard && (
        <div className="fixed inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{
              filter: 'brightness(1.05) saturate(0.85)',
            }}
          >
            <source src="/bg-video.mp4" type="video/mp4" />
          </video>
          {/* Semi-transparent overlay so content is readable */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.65) 0%, rgba(241, 245, 249, 0.70) 50%, rgba(248, 250, 252, 0.65) 100%)',
            }}
          />
        </div>
      )}

      {/* Background Video Layer - Only on Glossary */}
      {isGlossary && (
        <div className="fixed inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{
              filter: 'brightness(0.95) saturate(0.9)',
            }}
          >
            <source src="/golsarry_video.mp4" type="video/mp4" />
          </video>
          {/* Semi-transparent overlay so content is readable */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.75) 0%, rgba(241, 245, 249, 0.80) 50%, rgba(248, 250, 252, 0.75) 100%)',
            }}
          />
        </div>
      )}

      {/* App Content on top of video */}
      <div className="relative z-10">
        <Sidebar />
        <TopBar />
        <main
          className="pt-[56px] p-6 overflow-x-hidden relative"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <div className="workspace-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
