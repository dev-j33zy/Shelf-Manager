"use client";

import React from 'react';
import { AuditSession, AuditRecord, Quality } from '@/lib/types';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, ClipboardCheck, Users } from 'lucide-react';

interface AuditSummaryProps {
  session: AuditSession;
  records: AuditRecord[];
}

const qualityColors: Record<Quality, string> = {
  New: '#22c55e',
  Good: '#16a34a',
  Fair: '#f59e0b',
  Poor: '#f97316',
  Broken: '#ef4444',
};

const qualityOrder: Quality[] = ['Broken', 'Poor', 'Fair', 'Good', 'New'];

export function AuditSummary({ session, records }: AuditSummaryProps) {
  const qualityCounts = qualityOrder.map(q => ({
    name: q,
    value: records.filter(r => r.quality === q).length,
    color: qualityColors[q],
  }));

  const totalUnits = records.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="font-semibold text-green-800 dark:text-green-300">Audit Completed</h2>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Completed {session.completed_at ? format(new Date(session.completed_at), 'MMMM d, yyyy h:mm a') : ''}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-700">
          <div className="px-4 md:px-6 py-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Items Scanned</p>
          </div>
          <div className="px-4 md:px-6 py-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUnits}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Units</p>
          </div>
          <div className="px-4 md:px-6 py-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {qualityCounts.find(q => q.name === 'Broken')?.value || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Broken Items</p>
          </div>
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{session.audited_by}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auditor</p>
          </div>
        </div>
      </div>

      {/* Quality Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" /> Quality Distribution
        </h3>

        {records.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No items scanned.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Pie chart */}
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityCounts.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {qualityCounts.filter(d => d.value > 0).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2">
              {qualityCounts.filter(d => d.value > 0).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.value}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {records.length > 0 ? Math.round((entry.value / records.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Scanned Items Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Control No.</th>
                <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Quantity</th>
                <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Quality</th>
                <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-xs text-gray-900 dark:text-gray-300">
                    {record.control_number}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-gray-900 dark:text-white">
                    {record.quantity}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      record.quality === 'New' || record.quality === 'Good'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : record.quality === 'Fair' || record.quality === 'Poor'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {record.quality}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                    {record.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
