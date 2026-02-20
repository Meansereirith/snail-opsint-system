-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table - Dynamic role management
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'intake',
  client_name TEXT NOT NULL,
  items_count INT DEFAULT 0,
  total_amount DECIMAL(12, 2),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  unit_cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements ledger
CREATE TABLE IF NOT EXISTS public.stock_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  move_type TEXT NOT NULL, -- 'assemble', 'disassemble', 'intake', 'ship'
  quantity INT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  notes TEXT,
  moved_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BOM (Bill of Materials)
CREATE TABLE IF NOT EXISTS public.bom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_sku TEXT NOT NULL,
  component_sku TEXT NOT NULL,
  quantity_needed INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_sku, component_sku)
);

-- Payables & Payroll
CREATE TABLE IF NOT EXISTS public.payables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'payroll', 'vendor', 'expense'
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Tasks (Kanban)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Users table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "CEO/Admin can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Roles table RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read roles" ON public.roles
  FOR SELECT USING (true);

CREATE POLICY "Only CEO/Admin can create roles" ON public.roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

CREATE POLICY "Only CEO/Admin can update roles" ON public.roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Permissions table RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read permissions" ON public.permissions
  FOR SELECT USING (true);

-- Role-Permission RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read role permissions" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Only CEO/Admin can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users with order_create permission can create" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.permissions p ON p.id = rp.permission_id
      JOIN public.users u ON u.role_id = rp.role_id
      WHERE u.id = auth.uid()
      AND p.resource = 'orders'
      AND p.action = 'create'
    ) OR
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

CREATE POLICY "Users with order_edit permission can update" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.permissions p ON p.id = rp.permission_id
      JOIN public.users u ON u.role_id = rp.role_id
      WHERE u.id = auth.uid()
      AND p.resource = 'orders'
      AND p.action = 'edit'
    ) OR
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Inventory RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory" ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users with inventory_edit permission can modify" ON public.inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.permissions p ON p.id = rp.permission_id
      JOIN public.users u ON u.role_id = rp.role_id
      WHERE u.id = auth.uid()
      AND p.resource = 'inventory'
      AND p.action = 'edit'
    ) OR
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Stock moves RLS
ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stock moves" ON public.stock_moves
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users with inventory_edit can create stock moves" ON public.stock_moves
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.permissions p ON p.id = rp.permission_id
      JOIN public.users u ON u.role_id = rp.role_id
      WHERE u.id = auth.uid()
      AND p.resource = 'inventory'
      AND p.action = 'edit'
    ) OR
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Payables RLS
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO/Admin can read payables" ON public.payables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

CREATE POLICY "CEO/Admin can manage payables" ON public.payables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Tasks RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tasks" ON public.tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create and update tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = (SELECT role_id FROM public.users WHERE id = auth.uid())
      AND r.name IN ('CEO', 'Admin')
    )
  );

-- Insert default roles
INSERT INTO public.roles (name, description, created_by)
VALUES 
  ('CEO', 'Chief Executive Officer - Full access', '00000000-0000-0000-0000-000000000000'),
  ('Admin', 'Administrator - Full access', '00000000-0000-0000-0000-000000000000'),
  ('Ops Assistant', 'Operations Assistant - Inventory & order management', '00000000-0000-0000-0000-000000000000'),
  ('Accountant', 'Accountant - Payables & financial reporting', '00000000-0000-0000-0000-000000000000'),
  ('Team Member', 'Team Member - Task management & basic access', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (name, description, resource, action)
VALUES
  ('orders_create', 'Create orders', 'orders', 'create'),
  ('orders_edit', 'Edit orders', 'orders', 'edit'),
  ('orders_delete', 'Delete orders', 'orders', 'delete'),
  ('inventory_view', 'View inventory', 'inventory', 'view'),
  ('inventory_edit', 'Edit inventory & stock moves', 'inventory', 'edit'),
  ('payables_view', 'View payables', 'payables', 'view'),
  ('payables_edit', 'Edit payables', 'payables', 'edit'),
  ('tasks_create', 'Create tasks', 'tasks', 'create'),
  ('tasks_edit', 'Edit tasks', 'tasks', 'edit'),
  ('users_manage', 'Manage users & roles', 'users', 'manage'),
  ('reports_view', 'View reports', 'reports', 'view')
ON CONFLICT (name) DO NOTHING;
