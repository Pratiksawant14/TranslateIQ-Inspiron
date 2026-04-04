import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = ({ children }) => {
  return (
    <div className="flex bg-[#0A1628] text-slate-300 min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="flex-1 ml-[240px] mt-[56px] p-6 text-white overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
