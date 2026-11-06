import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  practices: any[];
  activePractice: any | null;
  onPracticeChange: (practice: any | null) => void;
  onLogout: () => void;
}

export function Layout({ children, user, practices, activePractice, onPracticeChange, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/dashboard');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-clinic-50">
      <Sidebar
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={onPracticeChange}
        onLogout={onLogout}
        activePath={currentPath}
      />
      <Header
        user={user}
        practice={activePractice}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`transition-all duration-300 md:pl-64 pt-14 pb-12 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
