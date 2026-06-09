import { supabase } from './supabase';
import { Equipment, Comment, StatusLog, AuditSession, AuditRecord } from './types';

export const api = {
  async getEquipmentCount() {
    const { count, error } = await supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count ?? 0;
  },
  // Equipment
  async getEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Equipment[];
  },

  async getEquipmentById(id: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Equipment;
  },

  async getEquipmentByControlNumber(controlNumber: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('control_number', controlNumber)
      .maybeSingle();
    
    if (error) throw error;
    return data as Equipment | null;
  },

  async createEquipment(equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('equipment')
      .insert([equipment])
      .select()
      .single();
    
    if (error) throw error;
    return data as Equipment;
  },

  async updateEquipment(id: string, updates: Partial<Equipment>) {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Equipment;
  },

  async deleteEquipment(id: string) {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Comments
  async getComments(equipmentId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Comment[];
  },

  async addComment(equipmentId: string, text: string, author: string = 'Anonymous') {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ equipment_id: equipmentId, text, author }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Comment;
  },

  // Status Logs
  async getStatusLogs(equipmentId: string) {
    const { data, error } = await supabase
      .from('status_logs')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data as StatusLog[];
  },

  async addStatusLog(
    equipmentId: string,
    quantity: number,
    quality: StatusLog['quality'],
    notes: string = '',
    recordedBy: string = 'Anonymous'
  ) {
    const { data, error } = await supabase
      .from('status_logs')
      .insert([{ equipment_id: equipmentId, quantity, quality, notes, recorded_by: recordedBy }])
      .select()
      .single();

    if (error) throw error;

    await api.updateEquipment(equipmentId, { quantity, quality, updated_at: new Date().toISOString() });

    return data as StatusLog;
  },

  // Audit Sessions
  async getAuditSessions() {
    const { data, error } = await supabase
      .from('audit_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data as AuditSession[];
  },

  async getAuditSessionById(id: string) {
    const { data, error } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AuditSession;
  },

  async createAuditSession(title: string, auditedBy: string = 'Anonymous') {
    const { data, error } = await supabase
      .from('audit_sessions')
      .insert([{ title, audited_by: auditedBy }])
      .select()
      .single();

    if (error) throw error;
    return data as AuditSession;
  },

  async completeAuditSession(id: string) {
    const { data, error } = await supabase
      .from('audit_sessions')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AuditSession;
  },

  async deleteAuditSession(id: string) {
    const { error } = await supabase
      .from('audit_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Audit Records
  async getAuditRecords(sessionId: string) {
    const { data, error } = await supabase
      .from('audit_records')
      .select('*')
      .eq('audit_session_id', sessionId)
      .order('scanned_at', { ascending: true });

    if (error) throw error;
    return data as AuditRecord[];
  },

  async getAuditRecordsByEquipment(sessionId: string, equipmentId: string) {
    const { data, error } = await supabase
      .from('audit_records')
      .select('*')
      .eq('audit_session_id', sessionId)
      .eq('equipment_id', equipmentId)
      .maybeSingle();

    if (error) throw error;
    return data as AuditRecord | null;
  },

  async createAuditRecord(
    sessionId: string,
    equipmentId: string,
    controlNumber: string,
    quantity: number,
    quality: AuditRecord['quality'],
    notes: string = ''
  ) {
    const { data, error } = await supabase
      .from('audit_records')
      .insert([{
        audit_session_id: sessionId,
        equipment_id: equipmentId,
        control_number: controlNumber,
        quantity,
        quality,
        notes,
      }])
      .select()
      .single();

    if (error) throw error;

    // Also update the equipment's current quantity/quality and create a status log entry
    await api.addStatusLog(equipmentId, quantity, quality, `Audit: ${notes || 'Audit record'}`, 'Audit System');
    await api.updateEquipment(equipmentId, { quantity, quality, updated_at: new Date().toISOString() });

    return data as AuditRecord;
  },

  async updateAuditRecord(
    recordId: string,
    equipmentId: string,
    quantity: number,
    quality: AuditRecord['quality'],
    notes: string = ''
  ) {
    const { data, error } = await supabase
      .from('audit_records')
      .update({ quantity, quality, notes })
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;

    // Also update the equipment's current quantity/quality and create a status log entry
    await api.addStatusLog(equipmentId, quantity, quality, `Audit update: ${notes || 'Audit record'}`, 'Audit System');
    await api.updateEquipment(equipmentId, { quantity, quality, updated_at: new Date().toISOString() });

    return data as AuditRecord;
  },

  // App Settings (global)
  async getChurchName(): Promise<string> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('church_name')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.church_name || 'Property of UCCP Sukat Evangelical Church';
  },

  async setChurchName(churchName: string): Promise<void> {
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('app_settings')
        .update({ church_name: churchName, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('app_settings')
        .insert([{ church_name: churchName }]);
      if (error) throw error;
    }
  },

  // Logo / Storage
  async uploadLogo(file: File) {
    const { data, error } = await supabase.storage
      .from('logos')
      .upload('church-logo.png', file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) throw error;
    return data;
  },

  async getLogoUrl() {
    const { data } = supabase.storage
      .from('logos')
      .getPublicUrl('church-logo.png');

    return data.publicUrl;
  },
};
