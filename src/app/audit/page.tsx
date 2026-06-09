"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { AuditSession } from '@/lib/types';
import { Button } from '@/components/Button';
import { useAuth } from '@/components/AuthProvider';
import { ClipboardCheck, Plus, Loader2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AuditPage() {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAuditSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch audit sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStartAudit = async () => {
    setCreating(true);
    try {
      const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Anonymous';
      const session = await api.createAuditSession(
        `Audit - ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
        displayName
      );
      window.location.href = `/audit/${session.id}`;
    } catch (err) {
      console.error('Failed to create audit session:', err);
      alert('Failed to start audit. Make sure the audit_sessions table exists.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Audit</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Scan QR codes to record equipment condition during inventory or audit days.
          </p>
        </div>
        <Button
          onClick={handleStartAudit}
          disabled={creating}
          className="flex items-center gap-2"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Start New Audit
        </Button>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50">
          <p className="font-semibold mb-2">Error loading audit sessions</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">Did you run the updated SCHEMA.sql with audit tables?</p>
        </div>
      ) : loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Audit Sessions Yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Start a new audit to begin scanning equipment QR codes and recording their condition.
          </p>
          <Button onClick={handleStartAudit} disabled={creating} className="mx-auto">
            Start Your First Audit
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/audit/${session.id}`}
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {session.title}
                    </h3>
                    {session.is_completed ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>Audited by: {session.audited_by}</span>
                    <span>Started: {format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}</span>
                    {session.completed_at && (
                      <span>Completed: {format(new Date(session.completed_at), 'MMM d, yyyy h:mm a')}</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
