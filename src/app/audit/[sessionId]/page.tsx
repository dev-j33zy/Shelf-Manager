"use client";

import React, { useEffect, useState, use, useCallback } from 'react';
import { api } from '@/lib/api';
import { AuditSession, AuditRecord, Equipment, Quality } from '@/lib/types';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { AuditStatusModal } from '@/components/AuditStatusModal';
import { useAuth } from '@/components/AuthProvider';
import { ArrowLeft, Loader2, Camera, CheckCircle, Clock, ClipboardCheck, QrCode } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const qualityOrder: Quality[] = ['Broken', 'Poor', 'Fair', 'Good', 'New'];

function QualityBadge({ quality }: { quality: Quality }) {
  const cls =
    quality === 'New' || quality === 'Good'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : quality === 'Fair' || quality === 'Poor'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {quality}
    </span>
  );
}

export default function AuditSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { user } = useAuth();

  const [session, setSession] = useState<AuditSession | null>(null);
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Status modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [scannedEquipment, setScannedEquipment] = useState<Equipment | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Complete modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Cancel modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sessionData, recordsData] = await Promise.all([
        api.getAuditSessionById(sessionId),
        api.getAuditRecords(sessionId),
      ]);
      setSession(sessionData);
      setRecords(recordsData);
      setError(null);
    } catch (err) {
      console.error('Failed to load audit session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScan = async (controlNumber: string) => {
    setIsScannerOpen(false);

    try {
      const equipment = await api.getEquipmentByControlNumber(controlNumber);

      if (!equipment) {
        alert(`No equipment found with control number: ${controlNumber}`);
        return;
      }

      // Check if this item was already scanned in this session
      const existingRecord = await api.getAuditRecordsByEquipment(sessionId, equipment.id);
      setIsDuplicate(!!existingRecord);

      setScannedEquipment(equipment);
      setIsStatusModalOpen(true);
    } catch (err) {
      console.error('Failed to look up equipment:', err);
      alert('Failed to look up equipment. Please try again.');
    }
  };

  const handleSaveAuditRecord = async (quantity: number, quality: Quality, notes: string) => {
    if (!scannedEquipment || !session) return;

    setSavingStatus(true);
    try {
      const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Anonymous';

      await api.createAuditRecord(
        sessionId,
        scannedEquipment.id,
        scannedEquipment.control_number,
        quantity,
        quality,
        notes
      );

      // Reload records
      const recordsData = await api.getAuditRecords(sessionId);
      setRecords(recordsData);
      setScannedEquipment(null);
    } catch (err) {
      console.error('Failed to save audit record:', err);
      alert('Failed to save audit record.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCompleteAudit = async () => {
    setCompleting(true);
    try {
      await api.completeAuditSession(sessionId);
      setIsCompleteModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to complete audit:', err);
      alert('Failed to complete audit.');
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelAudit = async () => {
    setCancelling(true);
    try {
      await api.deleteAuditSession(sessionId);
      window.location.href = '/audit';
    } catch (err) {
      console.error('Failed to cancel audit:', err);
      alert('Failed to cancel audit.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          {error ? 'Error Loading Audit' : 'Audit Not Found'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'This audit session does not exist.'}</p>
        <Link href="/audit">
          <Button variant="secondary">Back to Audits</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-7xl mx-auto">
      <Link href="/audit" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Audits
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{session.title}</h1>
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
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Items Scanned</p>
            </div>
            {!session.is_completed && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Scan QR
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Complete
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                >
                  Cancel Session
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scanned Items */}
      {records.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <QrCode className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Items Scanned Yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Start scanning equipment QR codes to record their condition.
          </p>
          {!session.is_completed && (
            <Button onClick={() => setIsScannerOpen(true)} className="mx-auto">
              <Camera className="w-4 h-4 mr-2" /> Scan First QR Code
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">
              Scanned Items ({records.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Control No.</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Quantity</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Quality</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Notes</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-xs text-gray-900 dark:text-gray-300">
                      {record.control_number}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-gray-900 dark:text-white">
                      {record.quantity}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <QualityBadge quality={record.quality} />
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(record.scanned_at), 'MMM d, h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      <QRCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />

      {/* Audit Status Modal */}
      {scannedEquipment && (
        <AuditStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setScannedEquipment(null);
          }}
          equipment={scannedEquipment}
          auditedBy={user?.user_metadata?.username || user?.email?.split('@')[0] || 'Anonymous'}
          onSave={handleSaveAuditRecord}
          isDuplicate={isDuplicate}
        />
      )}

      {/* Cancel Audit Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Audit Session">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to cancel this audit session?
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              This will permanently delete the session and all {records.length} scanned record{records.length !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>Keep Session</Button>
            <Button onClick={handleCancelAudit} disabled={cancelling} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white">
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {cancelling ? 'Cancelling...' : 'Cancel Session'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete Audit Modal */}
      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Complete Audit">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to complete this audit session?
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{records.length}</span> items scanned
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Once completed, you will not be able to add more scans to this session.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCompleteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteAudit} disabled={completing} className="flex items-center gap-2">
              {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Complete Audit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
