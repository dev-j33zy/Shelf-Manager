import { supabase } from './supabase';
import { Equipment, Comment, Quality } from './types';

export const api = {
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
  }
};
