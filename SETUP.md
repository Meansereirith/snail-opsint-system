# 🛠️ Local Development Setup

Get the Snail Studio Ops Dashboard running on your machine for development.

## System Requirements

- **Node.js**: v18+ (check with `node --version`)
- **npm**: v9+ (comes with Node.js)
- **Git**: Latest version
- **Database**: Supabase project with schema initialized

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/snail-opsint-system.git
cd snail-opsint-system
```

Or if you have the code already:

```bash
cd snail-opsint-system
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`. Takes ~2-3 minutes.

**If you get errors:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Step 3: Setup Supabase

### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Name: `snail-studio-dev`
4. Create a strong password
5. Select region closest to you
6. Click **Create new project**

Wait 2-3 minutes for initialization.

### 3.2 Initialize Database Schema

Once your project is ready:

1. Go to **SQL Editor**
2. Click **New Query**
3. Open `schema.sql` from the repo
4. Copy the entire SQL script
5. Paste into the Supabase SQL editor
6. Click **Run**

This creates:
- Tables: orders, inventory, payables, tasks, users, roles, permissions
- RLS policies for security
- Default roles and permissions

### 3.3 Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (under "URLs")
   - **Anon public key** (under "Project API keys")

## Step 4: Configure Environment Variables

Create `.env.local` in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://kdzrtnkswicsxestfylq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Never commit `.env.local` to GitHub!** It's in `.gitignore` for a reason.

## Step 5: Create Test Users

In your Supabase dashboard:

1. Go to **Authentication** → **Users**
2. Click **Create user**
3. Add these test accounts:

| Email | Password | Role |
|-------|----------|------|
| `ceo@snail.studio` | `demo1234` | CEO |
| `ops@snail.studio` | `demo1234` | Ops Assistant |
| `accountant@snail.studio` | `demo1234` | Accountant |

## Step 6: Link Users in Database

Go back to Supabase, open **SQL Editor**, and run:

```sql
-- Get the CEO role ID
SELECT id FROM public.roles WHERE name = 'CEO';

-- Insert the CEO user (replace UUID with the ID from auth.users)
INSERT INTO public.users (id, email, full_name, role_id)
VALUES (
  'COPY_ID_FROM_AUTH',  -- from Authentication > Users
  'ceo@snail.studio',
  'CEO User',
  (SELECT id FROM public.roles WHERE name = 'CEO')  -- Gets CEO role ID
);

-- Repeat for ops@snail.studio and accountant@snail.studio
INSERT INTO public.users (id, email, full_name, role_id)
VALUES (
  'COPY_ID_FROM_AUTH',
  'ops@snail.studio',
  'Ops Assistant',
  (SELECT id FROM public.roles WHERE name = 'Ops Assistant')
);

INSERT INTO public.users (id, email, full_name, role_id)
VALUES (
  'COPY_ID_FROM_AUTH',
  'accountant@snail.studio',
  'Accountant',
  (SELECT id FROM public.roles WHERE name = 'Accountant')
);
```

**How to find user IDs:**
1. Go to **Authentication** → **Users**
2. Click on a user row
3. Copy the UUID shown

## Step 7: Start Development Server

```bash
npm run dev
```

Output:
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Login

1. You should be redirected to `/login`
2. Enter: `ceo@snail.studio` / `demo1234`
3. Click **Sign In**
4. You're now in the Mission Control dashboard! 🎉

---

## Common Tasks

### Add Sample Data

```sql
-- Add some orders
INSERT INTO public.orders (order_number, client_name, items_count, total_amount, status, created_by)
SELECT 
  'ORD-' || LPAD((100 + row_number() OVER ())::text, 4, '0'),
  'Client ' || row_number() OVER (),
  FLOOR(RANDOM() * 10) + 1,
  FLOOR(RANDOM() * 5000 + 1000),
  CASE WHEN row_number() OVER () % 3 = 0 THEN 'shipped' ELSE 'processing' END,
  (SELECT id FROM public.users LIMIT 1)
FROM generate_series(1, 5);

-- Add inventory items
INSERT INTO public.inventory (sku, name, quantity, reorder_level, unit_cost)
VALUES 
  ('SKU-001', 'Widget A', 50, 10, 25.00),
  ('SKU-002', 'Widget B', 5, 15, 50.00),
  ('SKU-003', 'Gadget X', 100, 20, 10.00);
```

### Rebuild Database from Scratch

If you mess up the schema:

```bash
# In Supabase SQL Editor:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then re-run schema.sql
```

### Check User Permissions

```typescript
// In your app, add this to a page:
import { getUserPermissions } from '@/lib/permissions';

const perms = await getUserPermissions(userId);
console.log('User permissions:', perms);
```

### Reset Admin Password

If you can't log in:

1. Go to Supabase **Authentication** → **Users**
2. Find your user
3. Click the three-dot menu
4. Click **Reset password**
5. Check your email for reset link

---

## Debugging

### Enable Verbose Logging

Edit `lib/authStore.ts`:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth event:', event);
  console.log('📋 Session:', session);
});
```

### Check Database Queries

In Supabase **SQL Editor**, run:

```sql
-- See recent queries
SELECT 
  query,
  calls,
  total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY total_time DESC
LIMIT 10;
```

### Test RLS Policies

```sql
-- This should work (user can see own data)
SELECT * FROM public.users WHERE id = auth.uid();

-- This might fail (access denied)
SELECT * FROM public.payables WHERE TRUE;  -- Only CEO can see payables
```

---

## Useful Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server locally
npm run build && npm start

# Run linter
npm run lint

# Format code
npx prettier --write .

# Check dependencies
npm list
npm audit
```

## File Structure

```
snail-opsint-system/
├── app/                      # Next.js app directory
│   ├── login/               # Login page
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── tasks/
│   │   ├── payables/
│   │   ├── team/
│   │   └── settings/
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── OrderForm.tsx
│   └── ...
├── lib/                     # Utility functions & stores
│   ├── supabase.ts         # Supabase client & types
│   ├── authStore.ts        # Zustand auth state
│   └── permissions.ts      # Permission checking
├── schema.sql              # Database schema
├── .env.local              # Environment variables (local)
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Setup Supabase project
3. ✅ Create test users
4. ✅ Run `npm run dev`
5. ✅ Login and explore
6. ✅ Make changes and see them live-reload
7. ✅ Read [DEPLOYMENT.md](./DEPLOYMENT.md) when ready to go live

---

## Getting Help

- **Node.js issues**: `node --version` should be v18+
- **npm issues**: Try `npm ci --prefer-offline`
- **Supabase issues**: Check [supabase.com/docs](https://supabase.com/docs)
- **Next.js issues**: Check [nextjs.org/docs](https://nextjs.org/docs)
- **Code issues**: Open an issue on GitHub

Happy developing! 🚀
