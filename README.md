# 🐌 Snail Studio - Operations Intelligence & Realtime Dashboard

A production-ready Next.js + Supabase realtime operations management dashboard with dynamic role-based access control, glassmorphism UI, and comprehensive business ops features.

## 🚀 Features

### Core Operations
- **Orders Management** - Track order lifecycle from intake → processing → shipping
- **Inventory System** - Real-time stock tracking, BOM management, assembly/disassembly operations
- **Payables & Payroll** - Financial tracking, payment alerts, vendor management
- **Team Tasks** - Kanban-style task management with priority levels
- **Mission Control Dashboard** - $10k profit goal tracking, KPI metrics, weekly trends

### User Management & Security
- **Dynamic Roles** - CEO/Admin can create and edit roles (e.g., "Ops Assistant")
- **Permission System** - Granular permissions per role (orders_create, inventory_edit, payables_view, etc.)
- **Row-Level Security (RLS)** - Supabase RLS policies enforce access control at database level
- **Realtime Permissions** - Permission checks happen in real-time, no caching lag
- **Protected Endpoints** - CEO/Admin roles auto-grant all permissions

### UI/UX
- **Dark Glassmorphism Design** - Modern frosted glass aesthetic with neon accents
- **Realtime Updates** - Supabase Realtime subscriptions keep data live
- **Phone-Responsive** - Mobile-first design works on all devices
- **Smooth Animations** - Framer Motion animations for engaging UX
- **Accessibility** - WCAG-compliant color contrast and keyboard navigation

### Database
- **Schema Included** - Complete SQL schema with tables for all features
- **RLS Policies** - Row-level security for all tables
- **Default Data** - Pre-loaded roles (CEO, Admin, Ops Assistant, Accountant, Team Member)
- **Referential Integrity** - Foreign keys and cascade delete rules

## 📋 Tech Stack

- **Frontend**: Next.js 14 (App Router, Server Components)
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + Custom Glassmorphism
- **State**: Zustand (lightweight state management)
- **Realtime**: Supabase Realtime (PostgreSQL LISTEN/NOTIFY)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Utils**: date-fns
- **TypeScript**: Full type safety

## 🛠️ Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/Meansereirith/snail-opsint-system.git
cd snail-opsint-system
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to **SQL Editor** and run the contents of `schema.sql`:
   - This creates all tables (orders, inventory, payables, tasks, users, roles)
   - Enables RLS policies
   - Inserts default roles and permissions

3. Create test users in **Authentication** > **Users**:
   ```
   Email: ceo@snail.studio (Password: demo1234)
   Email: ops@snail.studio (Password: demo1234)
   ```

4. Insert users in the `public.users` table:
   ```sql
   INSERT INTO public.users (id, email, full_name, role_id)
   VALUES 
     ('user-id-from-auth', 'ceo@snail.studio', 'CEO User', role-id-from-roles),
     ('user-id-from-auth', 'ops@snail.studio', 'Ops Assistant', role-id-from-roles);
   ```

### 3. Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

(Already configured in `.env.local` for the provided Supabase instance)

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` → Redirects to `/login`

## 🔐 Role-Based Access Control

### Built-in Roles

| Role | Permissions | Use Case |
|------|-----------|----------|
| **CEO** | All (auto-grant) | Full system access |
| **Admin** | All (auto-grant) | Full system access |
| **Ops Assistant** | `orders_create`, `orders_edit`, `inventory_edit` | Order & inventory management |
| **Accountant** | `payables_view`, `payables_edit` | Financial oversight |
| **Team Member** | `tasks_create`, `tasks_edit`, `reports_view` | Basic task management |

### Creating Custom Roles

1. Go to **Settings** (admin only)
2. Click **New Role**
3. Enter name & description (e.g., "Marketing Manager")
4. Assign permissions to this role
5. Assign users to the role in **Team** page

### Permission System

Permissions are scoped by resource and action:
- `orders_create`, `orders_edit`, `orders_delete`
- `inventory_edit`, `inventory_view`
- `payables_edit`, `payables_view`
- `tasks_create`, `tasks_edit`
- `users_manage`, `reports_view`

RLS policies in the database enforce these at the query level — users cannot bypass permissions even with direct API calls.

## 📊 Database Schema

### Core Tables

- **users** - Auth user profiles with role assignments
- **roles** - Custom role definitions (CEO, Ops Assistant, etc.)
- **permissions** - Action permissions (orders_create, inventory_edit, etc.)
- **role_permissions** - Junction table mapping roles to permissions
- **orders** - Customer orders (intake → shipped)
- **inventory** - Product stock items
- **stock_moves** - Inventory movements (assemble, disassemble, intake, ship)
- **bom** - Bill of Materials (product recipes)
- **payables** - Financial obligations (payroll, vendor, expense)
- **tasks** - Team tasks (to-do, in-progress, review, done)

### RLS Policies

All tables have row-level security enabled. Examples:
- Users can only see their own profile (unless CEO/Admin)
- Orders visible to all authenticated users
- Inventory edits require `inventory_edit` permission
- Payables only visible to CEO/Admin
- Tasks visible to all, but only creator/assignee can edit

## 🚀 Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial ops dashboard"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project** → Select GitHub repo
3. Set environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Click **Deploy**

Vercel will auto-build Next.js and deploy to a live URL.

### 3. Post-Deployment

- Update your Supabase project's allowed origins to include your Vercel domain
- Test login with demo credentials
- Verify realtime updates are working

## 🔄 Realtime Features

The dashboard uses Supabase Realtime subscriptions:

```typescript
// Orders update in real-time
const subscription = supabase
  .channel('orders-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
    fetchOrders(); // Updates UI instantly
  })
  .subscribe();
```

When any user creates/updates an order, all other users see the change instantly (no page refresh needed).

## 📱 Mobile Responsive

- **Sidebar collapses** on mobile (hamburger menu)
- **Tables stack** into cards on small screens
- **Kanban board** becomes horizontal scroll on mobile
- **Forms** are full-width on small devices

## 🎨 Dark Glassmorphism Theme

Custom CSS classes for the design system:

- `.glass` - Frosted glass cards with blur
- `.glass-hover` - Interactive glass with hover effects
- `.glass-button` - Button styling with glass effect
- `.neon-blue-glow`, `.neon-purple-glow` - Glow effects
- `.gradient-text` - Multi-color gradient text
- `.status-badge` - Color-coded status indicators

## 🐛 Debugging

### Enable Debug Logs

```typescript
// In lib/supabase.ts
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

### Check RLS Policies

In Supabase dashboard → **SQL Editor**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

### Test Permissions

```typescript
const permissions = await getUserPermissions(userId);
console.log('User permissions:', permissions);
```

## 📝 File Structure

```
snail-opsint-system/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles & glassmorphism
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── dashboard/
│       ├── layout.tsx            # Dashboard layout (with sidebar/header)
│       ├── page.tsx              # Mission Control (home)
│       ├── orders/page.tsx
│       ├── inventory/page.tsx
│       ├── tasks/page.tsx
│       ├── payables/page.tsx
│       ├── team/page.tsx
│       └── settings/page.tsx     # Role management
├── components/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── MetricCard.tsx
│   ├── OrderForm.tsx
│   ├── InventoryForm.tsx
│   ├── TaskForm.tsx, TaskCard.tsx
│   ├── PayableForm.tsx
│   ├── RoleForm.tsx
│   └── RolePermissionManager.tsx
├── lib/
│   ├── supabase.ts               # Supabase client & types
│   ├── permissions.ts            # Permission checking logic
│   └── authStore.ts              # Zustand auth store
├── schema.sql                    # Database schema (run in Supabase)
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local                    # Supabase credentials
```

## 🔒 Security Notes

1. **RLS is mandatory** - Never expose service role key to frontend
2. **Anon key only** - Frontend uses limited anon key
3. **Permissions checked twice**:
   - Frontend (UI-level for UX)
   - Database (RLS policies for data security)
4. **Environment variables** - Never commit `.env.local`
5. **Auth state managed** - Session tokens auto-refresh

## 🆘 Troubleshooting

### "Permission denied" errors
→ Check RLS policies in Supabase → check user's role permissions

### Realtime not working
→ Enable Realtime in Supabase project settings → check subscription setup

### Login fails
→ Verify user exists in `public.users` table → check auth credentials

### Blank dashboard
→ Check browser console for errors → verify Supabase URL/key in `.env.local`

## 📞 Support

- Docs: [Next.js](https://nextjs.org) | [Supabase](https://supabase.com/docs)
- Issues: Open a GitHub issue with error logs
- Database Help: Use Supabase dashboard → SQL Editor for debugging

## 📄 License

MIT - Built for Snail Studio Operations Intelligence System

---

**Built with 🐌 by Snail Studio**  
Mission Control Active • All Systems Operational
