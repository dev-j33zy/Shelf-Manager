"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from './AuthProvider';
import { Loader2, Menu } from 'lucide-react';
import { useState } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';
  const { loading, session } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session && !isAuthPage) {
    return null;
  }

  if (isAuthPage) {
    return <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <div className="md:hidden p-4 absolute top-0 left-0 z-50">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 focus:outline-none"
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 w-64 shadow-xl md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto w-full md:w-[calc(100%-16rem)] h-screen">
        <div className="p-4 md:p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
