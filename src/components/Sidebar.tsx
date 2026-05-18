import React from 'react';
import Link from 'next/link';
import { Package, LayoutDashboard, Settings, List, X } from 'lucide-react';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Inventory', icon: List, href: '/inventory' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen p-4 flex flex-col transition-colors">
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">ShelfManager</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
