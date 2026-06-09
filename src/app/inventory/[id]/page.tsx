"use client";

import React, { useEffect, useState, use, useCallback } from 'react';
import { api } from '@/lib/api';
import { Equipment, Comment, Quality, StatusLog } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ArrowLeft, Loader2, Edit, MessageSquare, Package, Save, ClipboardList, TrendingUp, TrendingDown, Minus, Printer, QrCode } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { QRCode } from '@/components/QRCode';
import { QRCodePrintDialog } from '@/components/QRCodePrintDialog';
import Link from 'next/link';
import { format } from 'date-fns';

const qualityOrder: Quality[] = ['Broken', 'Poor', 'Fair', 'Good', 'New'];

function qualityDelta(prev: Quality, curr: Quality): 'up' | 'down' | 'same' {
  const pi = qualityOrder.indexOf(prev);
  const ci = qualityOrder.indexOf(curr);
  if (ci > pi) return 'up';
  if (ci < pi) return 'down';
  return 'same';
}

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

interface ChartData extends Omit<StatusLog, 'quality'> {
  quality: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    payload: ChartData;
    value: number;
    name: string;
  }[];
  label?: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length && label !== undefined) {
    const qualityValue = payload[0].payload.quality;
    const date = new Date(label);
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="font-bold mb-1 text-gray-900 dark:text-white">{format(date, 'MMM d, yyyy h:mm a')}</p>
        <p className="text-blue-600 dark:text-blue-400">Quantity: {payload[0].value}</p>
        <p className="text-green-600 dark:text-green-400">Quality: {qualityOrder[qualityValue]}</p>
        {payload[0].payload.notes && <p className="text-gray-600 dark:text-gray-400 italic">Notes: &ldquo;{payload[0].payload.notes}&rdquo;</p>}
      </div>
    );
  }
  return null;
};

const QualityTickFormatter = (tick: number) => qualityOrder[tick];


export default function EquipmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Equipment>>({});

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status log state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({
    quantity: 0,
    quality: 'Good' as Quality,
    notes: '',
    recorded_by: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [eqData, commentsData, logsData] = await Promise.all([
        api.getEquipmentById(id),
        api.getComments(id),
        api.getStatusLogs(id),
      ]);
      setEquipment(eqData);
      setComments(commentsData);
      setStatusLogs(logsData);
      setEditForm({
        name: eqData.name,
        quantity: eqData.quantity,
        quality: eqData.quality,
        department: eqData.department,
        location: eqData.location,
      });
      setStatusForm(prev => ({
        ...prev,
        quantity: eqData.quantity,
        quality: eqData.quality,
      }));
    } catch (error) {
      console.error('Failed to load equipment data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await api.updateEquipment(id, editForm);
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to update equipment:', error);
      alert('Failed to update equipment.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await api.addComment(id, newComment, commentAuthor || 'Anonymous');
      setNewComment('');
      loadData();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStatus(true);
    try {
      await api.addStatusLog(
        id,
        statusForm.quantity,
        statusForm.quality,
        statusForm.notes,
        statusForm.recorded_by || 'Anonymous'
      );
      setIsStatusModalOpen(false);
      setStatusForm(prev => ({ ...prev, notes: '', recorded_by: '' }));
      loadData();
    } catch (error) {
      console.error('Failed to record status:', error);
      alert('Failed to record status. Make sure the status_logs table exists in your database.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Equipment Not Found</h1>
        <Link href="/inventory">
          <Button variant="secondary">Back to Inventory</Button>
        </Link>
      </div>
    );
  }

  // Print state
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-7xl mx-auto">
      <Link href="/inventory" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Inventory
      </Link>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Left column: Equipment details + Status History */}
        <div className="flex-1 space-y-6">

          {/* Equipment Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <span className="font-mono text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {equipment.control_number}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{equipment.name}</h1>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusForm({ quantity: equipment.quantity, quality: equipment.quality, notes: '', recorded_by: '' });
                    setIsStatusModalOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" /> <span className="hidden sm:inline">Record Status</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrintDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print QR</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Quantity</h3>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{equipment.quantity}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Quality</h3>
                <div className="mt-1"><QualityBadge quality={equipment.quality} /></div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Department</h3>
                <p className="text-gray-900 dark:text-white">{equipment.department}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                <p className="text-gray-900 dark:text-white">{equipment.location}</p>
              </div>
              <div className="col-span-2 text-xs text-gray-400 dark:text-gray-500 mt-2">
                Last updated: {format(new Date(equipment.updated_at), 'PPpp')}
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
              <QrCode className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">QR Code</h2>
            </div>
            <div className="p-4 md:p-6 flex flex-col items-center">
              <QRCode
                controlNumber={equipment.control_number}
                size={180}
                showLogo
                showText
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPrintDialogOpen(true)}
                className="mt-4 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print QR Code
              </Button>
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
              <ClipboardList className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Status History</h2>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{statusLogs.length} record{statusLogs.length !== 1 ? 's' : ''}</span>
            </div>

            {statusLogs.length > 1 && (
              <div className="w-full h-64 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={statusLogs.map(log => ({
                      ...log,
                      quality: qualityOrder.indexOf(log.quality),
                      recorded_at: new Date(log.recorded_at).getTime(),
                    })).sort((a, b) => a.recorded_at - b.recorded_at)}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="recorded_at"
                      tickFormatter={(unixTime) => format(new Date(unixTime), 'MMM d')}
                      minTickGap={30}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" label={{ value: 'Quantity', angle: -90, position: 'insideLeft', fill: '#6B7280' }} stroke="#2563EB" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Quality', angle: 90, position: 'insideRight', fill: '#6B7280' }} stroke="#10B981" tickFormatter={QualityTickFormatter} domain={[0, qualityOrder.length - 1]} tickCount={qualityOrder.length} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="quantity" stroke="#2563EB" activeDot={{ r: 8 }} name="Quantity" />
                    <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#10B981" activeDot={{ r: 8 }} name="Quality" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {statusLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                No status records yet. Use &ldquo;Record Status&rdquo; to start tracking.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {statusLogs.map((log, index) => {
                  const prev = statusLogs[index + 1];
                  const qDelta = prev ? qualityDelta(prev.quality, log.quality) : 'same';
                  const qtyDiff = prev ? log.quantity - prev.quantity : 0;

                  return (
                    <div key={log.id} className="p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        {/* Timeline dot */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 dark:ring-offset-gray-800 mt-1 ${
                            index === 0 ? 'bg-blue-500 ring-blue-300' : 'bg-gray-300 dark:bg-gray-600 ring-gray-200 dark:ring-gray-700'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.recorded_by}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {format(new Date(log.recorded_at), 'PPp')}
                            </span>
                            {index === 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                Latest
                              </span>
                            )}
                          </div>

                          {/* Metrics row */}
                          <div className="flex flex-wrap items-center gap-4 mb-2">
                            {/* Quantity */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Qty:</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{log.quantity}</span>
                              {prev && qtyDiff !== 0 && (
                                <span className={`flex items-center gap-0.5 text-xs font-medium ${
                                  qtyDiff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                                }`}>
                                  {qtyDiff > 0
                                    ? <TrendingUp className="w-3 h-3" />
                                    : <TrendingDown className="w-3 h-3" />}
                                  {qtyDiff > 0 ? '+' : ''}{qtyDiff}
                                </span>
                              )}
                              {prev && qtyDiff === 0 && (
                                <Minus className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>

                            {/* Quality */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Quality:</span>
                              <QualityBadge quality={log.quality} />
                              {prev && qDelta !== 'same' && (
                                <span className={`text-xs font-medium ${
                                  qDelta === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                                }`}>
                                  {qDelta === 'up'
                                    ? <TrendingUp className="w-3 h-3 inline" />
                                    : <TrendingDown className="w-3 h-3 inline" />}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Notes */}
                          {log.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 rounded-md px-2 py-1.5 mt-1">
                              &ldquo;{log.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Comments */}
        <div className="w-full md:w-96 flex flex-col h-[400px] md:h-[calc(100dvh-8rem)]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Notes & Comments</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm border border-transparent dark:border-gray-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-200">{comment.author}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
                  No comments yet.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <Input
                  placeholder="Your name (optional)"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  className="h-8 text-sm"
                />
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add a note about condition, maintenance, etc."
                  rows={3}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  required
                />
                <Button type="submit" disabled={submittingComment || !newComment.trim()} className="w-full">
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Equipment Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Equipment">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Name"
            required
            value={editForm.name || ''}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min={0}
              required
              value={editForm.quantity || 0}
              onChange={e => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={editForm.quality}
                onChange={e => setEditForm({ ...editForm, quality: e.target.value as Quality })}
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Broken">Broken</option>
              </select>
            </div>
          </div>
          <Input
            label="Department"
            required
            value={editForm.department || ''}
            onChange={e => setEditForm({ ...editForm, department: e.target.value })}
          />
          <Input
            label="Location"
            required
            value={editForm.location || ''}
            onChange={e => setEditForm({ ...editForm, location: e.target.value })}
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submittingEdit} className="flex items-center gap-2">
              {submittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Status Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Record Current Status">
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Snapshot the current condition of this item. This creates a historical record you can compare over time.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min={0}
              required
              value={statusForm.quantity}
              onChange={e => setStatusForm({ ...statusForm, quantity: parseInt(e.target.value) || 0 })}
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusForm.quality}
                onChange={e => setStatusForm({ ...statusForm, quality: e.target.value as Quality })}
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Broken">Broken</option>
              </select>
            </div>
          </div>
          <Input
            label="Recorded by"
            placeholder="Your name (optional)"
            value={statusForm.recorded_by}
            onChange={e => setStatusForm({ ...statusForm, recorded_by: e.target.value })}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="e.g. After annual inspection, post-maintenance check..."
              rows={3}
              value={statusForm.notes}
              onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submittingStatus} className="flex items-center gap-2">
              {submittingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print QR Code Dialog */}
      <QRCodePrintDialog
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        items={equipment ? [{ controlNumber: equipment.control_number, name: equipment.name }] : []}
      />
    </div>
  );
}
