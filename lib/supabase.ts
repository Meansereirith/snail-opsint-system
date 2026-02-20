import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  role_id: string;
};

export type Role = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Permission = {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
};

export type RolePermission = {
  role_id: string;
  permission_id: string;
};

export type Order = {
  id: string;
  order_number: string;
  status: string;
  client_name: string;
  items_count: number;
  total_amount: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Inventory = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorder_level: number;
  unit_cost: number | null;
  created_at: string;
  updated_at: string;
};

export type StockMove = {
  id: string;
  inventory_id: string;
  move_type: string;
  quantity: number;
  order_id: string | null;
  notes: string | null;
  moved_by: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Payable = {
  id: string;
  type: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};
