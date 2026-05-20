"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Equipment } from '@/lib/types';
import { Package, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getEquipment();
        setEquipment(data);
      } catch (err) {
        console.error('Failed to fetch equipment:', err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred while fetching equipment.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-center p-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg max-w-lg border border-red-100">
          <h2 className="font-bold text-lg mb-2">Database Error</h2>
          <p className="mb-4 text-sm">{error}</p>
          <p className="text-sm font-medium">Please ensure you have executed the SCHEMA.sql file in your Supabase SQL Editor.</p>
        </div>
      </div>
    );
  }

  const total = equipment.length;
  const good = equipment.filter(e => e.quality === 'New' || e.quality === 'Good').length;
  const needsAttention = equipment.filter(e => e.quality === 'Fair' || e.quality === 'Poor').length;
  const broken = equipment.filter(e => e.quality === 'Broken').length;

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="flex items-center gap-3 text-gray-500 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">Total Items</h2>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="flex items-center gap-3 text-gray-500 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">Good Condition</h2>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{good}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="flex items-center gap-3 text-gray-500 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">Needs Attention</h2>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{needsAttention}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="flex items-center gap-3 text-gray-500 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">Broken</h2>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{broken}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Recently Added Equipment</h2>
          <Link href="/inventory" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {equipment.slice(0, 5).map(item => (
            <div key={item.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">{item.control_number}</span>
                  <span>{item.department}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${item.quality === 'New' || item.quality === 'Good' ? 'bg-green-100 text-green-700' : 
                    item.quality === 'Fair' || item.quality === 'Poor' ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'}
                `}>
                  {item.quality}
                </span>
              </div>
            </div>
          ))}
          {equipment.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No equipment found. Add some in the inventory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
