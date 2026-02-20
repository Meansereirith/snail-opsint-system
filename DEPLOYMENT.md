# 🚀 Deployment Guide - Snail Studio Ops Dashboard

Complete step-by-step guide to deploy the Snail Studio Operations Dashboard to production using Vercel.

## Prerequisites

- GitHub account with repo access
- Vercel account (free tier works)
- Supabase project with schema already set up
- Environment variables ready

## Phase 1: Push to GitHub

### 1.1 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `snail-opsint-system`
3. Make it **Public** (for Vercel free tier)
4. Click **Create repository**

### 1.2 Push Code

```bash
# In your local snail-opsint-system directory
git remote set-url origin https://github.com/YOUR_USERNAME/snail-opsint-system.git
git branch -M main
git push -u origin main
```

**Note:** This requires you to have git credentials configured. On macOS/Linux:

```bash
git config --global user.email "you@snail.studio"
git config --global user.name "Your Name"
```

After running `git push`, you'll be prompted for authentication. Use:
- **Username:** Your GitHub username
- **Password:** A [personal access token](https://github.com/settings/tokens) (not your password)

### 1.3 Verify Push

Go to `https://github.com/YOUR_USERNAME/snail-opsint-system` and verify all files are there.

---

## Phase 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Click **Continue with GitHub**
4. Authorize Vercel to access your GitHub account
5. Select the `snail-opsint-system` repository
6. Click **Import**

### 2.2 Configure Environment Variables

On the Vercel import page, you'll see **Environment Variables** section:

Add these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kdzrtnkswicsxestfylq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkenJ0bmtzd2ljc3hlc3RmeWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODcwMTcsImV4cCI6MjA4NzE2MzAxN30.cVGWFVh790UQD2hlElx7Vk5fHoVqrCaAIPvxKnW-ywc` |

**⚠️ IMPORTANT:** Protect your Supabase anon key — it's needed but only allows specified operations via RLS policies.

### 2.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (~3-5 minutes)
3. You'll see a success message with your deployment URL

Example URL: `https://snail-opsint-system.vercel.app`

---

## Phase 3: Post-Deployment Setup

### 3.1 Update Supabase Auth Redirect URLs

The auth system needs to know your deployed URL:

1. Go to Supabase dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://snail-opsint-system.vercel.app/login
   https://snail-opsint-system.vercel.app/dashboard
   ```
3. Click **Save**

### 3.2 Create Test Users in Supabase

Go to **Authentication** → **Users** in Supabase:

1. Click **Create user**
2. Email: `ceo@snail.studio`
3. Password: `demo1234` (or your choice)
4. Click **Create user**

Repeat for `ops@snail.studio`

### 3.3 Link Users in Database

Go to **SQL Editor** in Supabase and run:

```sql
-- Get the role IDs first
SELECT id, name FROM public.roles;

-- Then insert users (replace UUIDs with actual user IDs from auth)
INSERT INTO public.users (id, email, full_name, role_id) VALUES
  ('USER_ID_FROM_AUTH_CEO', 'ceo@snail.studio', 'CEO User', 'ROLE_ID_OF_CEO'),
  ('USER_ID_FROM_AUTH_OPS', 'ops@snail.studio', 'Ops Assistant', 'ROLE_ID_OF_OPS_ASSISTANT');
```

To find the user IDs:
1. Go to **Authentication** → **Users**
2. Click on a user to see their UUID

### 3.4 Test Login

1. Go to `https://snail-opsint-system.vercel.app/login`
2. Log in with `ceo@snail.studio / demo1234`
3. You should see the Mission Control dashboard
4. Click **Settings** to manage roles and permissions

---

## Phase 4: Continuous Deployment

Vercel auto-deploys on every push to main branch:

```bash
# Make changes locally
git add .
git commit -m "New feature: add X"
git push origin main
```

Vercel will automatically:
1. Build the new code
2. Run tests (if configured)
3. Deploy to production
4. Notify you of success/failure

Check deployment status at `vercel.com/dashboard`

---

## Troubleshooting

### Login Returns 403 Error

**Cause:** Supabase auth redirect URLs not configured

**Fix:**
1. Go to Supabase → **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Redirect URLs**
3. Wait 1 minute, then try logging in again

### Blank Dashboard After Login

**Cause:** Supabase URL/key incorrect or RLS policies blocking access

**Fix:**
1. Check `.env.local` has correct values
2. In Vercel **Settings** → **Environment Variables**, verify values match
3. Run this in Supabase SQL Editor:
   ```sql
   SELECT * FROM auth.users LIMIT 1;
   SELECT * FROM public.users LIMIT 1;
   ```
4. If tables are empty, users table needs data (see Phase 3.3)

### "Module not found" Build Errors

**Cause:** Missing dependencies or version mismatch

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

Then commit and push again.

### Realtime Updates Not Working

**Cause:** Supabase Realtime not enabled

**Fix:**
1. Go to Supabase dashboard → **Realtime**
2. Check if toggled ON for the project
3. Verify table is in broadcast list
4. Restart the app (Cmd+Shift+R on browser)

---

## Environment Variables Reference

These must be set in Vercel for production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Never commit `.env.local` to GitHub** — Vercel reads from project settings, not the repo.

---

## Monitoring Deployment

### Check Build Status
- Vercel dashboard → Project → **Deployments**
- Each row is a build; green checkmark = success

### View Logs
- Click a deployment
- Click **Logs** tab to see build output

### Monitor App Health
- Vercel dashboard → **Monitoring** tab
- Tracks response times, error rates, etc.

---

## Scaling & Performance

### For Higher Traffic

**Vercel automatically scales** — your Next.js functions will handle more requests.

Estimated limits:
- **Free tier**: ~100 concurrent users
- **Pro tier** ($20/month): ~1000 concurrent users
- **Enterprise**: Unlimited

### Database Optimization

If Supabase gets slow:

1. Go to Supabase → **Database** → **Query Performance**
2. Add indexes to frequently-queried columns:
   ```sql
   CREATE INDEX idx_orders_status ON public.orders(status);
   CREATE INDEX idx_inventory_sku ON public.inventory(sku);
   ```

3. Monitor query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'shipped';
   ```

---

## Security Checklist

- [ ] Test login works with demo credentials
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Check Supabase auth redirect URLs are set
- [ ] Confirm environment variables don't contain secrets in repo
- [ ] Enable HTTPS (Vercel does this by default)
- [ ] Test role permissions work (try logging in as different users)
- [ ] Review Supabase SQL policies for data leaks

---

## Rollback to Previous Version

If a deployment breaks:

1. Go to Vercel dashboard → **Deployments**
2. Find the last working deployment
3. Click the three-dot menu
4. Select **Promote to Production**

This instantly rolls back to the previous version while you fix issues.

---

## Custom Domain Setup

To use `ops.snail.studio` instead of `*.vercel.app`:

1. Vercel dashboard → **Project Settings** → **Domains**
2. Add your domain (e.g., `ops.snail.studio`)
3. Follow Vercel's DNS instructions (add CNAME record)
4. Wait for DNS to propagate (~5 min)
5. Update Supabase auth redirect URLs to new domain

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Email:** ops-support@snail.studio

---

## Summary

1. ✅ Push repo to GitHub
2. ✅ Connect GitHub to Vercel
3. ✅ Set environment variables
4. ✅ Deploy (Vercel auto-builds)
5. ✅ Configure Supabase auth URLs
6. ✅ Create test users in Supabase
7. ✅ Link users in database
8. ✅ Test login and dashboard
9. ✅ Monitor and celebrate! 🎉

Your dashboard is now live and will auto-update with every push to main branch.
