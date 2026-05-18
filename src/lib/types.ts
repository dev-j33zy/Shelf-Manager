export type Quality = 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';

export interface Equipment {
  id: string;
  control_number: string;
  name: string;
  quantity: number;
  quality: Quality;
  department: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  equipment_id: string;
  text: string;
  author: string;
  created_at: string;
}
