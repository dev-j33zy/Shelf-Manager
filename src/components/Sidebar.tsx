import React from 'react';
import Link from 'next/link';
import { Package, LayoutDashboard, Settings, List } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Inventory', icon: List, href: '/inventory' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen p-4 flex flex-col transition-colors">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">ShelfManager</span>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
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
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
