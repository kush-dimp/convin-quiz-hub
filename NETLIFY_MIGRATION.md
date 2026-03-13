# Netlify Migration Guide

## What Changed

✅ Migrated from **Vercel** to **Netlify** (unlimited serverless functions on free tier)

### File Changes
- Created `/netlify/functions/` — moved all API files from `/api/` to this directory
- Created `netlify.toml` — replaces `vercel.json` configuration
- `vercel.json` — can be deleted (no longer used)

## Deployment Steps

### 1. Create Netlify Account
- Go to https://app.netlify.com
- Sign up or login with GitHub

### 2. Connect Repository
- Click **"Add new site"** → **"Import an existing project"**
- Select your GitHub repository: `kush-dimp/convin-quiz-hub`
- Click **"Connect"**

### 3. Configure Build Settings
Netlify should auto-detect:
- **Build command:** `npm run build`
- **Functions directory:** `netlify/functions`
- **Publish directory:** `dist`

If not auto-detected, set them manually.

### 4. Set Environment Variables
Netlify will ask for environment variables. Add these:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon database pooled connection string |
| `JWT_SECRET` | Your JWT secret key |

**To find these values:**
```bash
# Check your .env.local file locally
cat .env.local
```

### 5. Deploy
- Click **"Deploy site"**
- Wait for build to complete (~2-3 minutes)
- Netlify will show your live URL (e.g., `https://your-site.netlify.app`)

## How It Works

**URL Rewrites:**
- `/api/quizzes` → `/.netlify/functions/quizzes`
- `/api/auth/:sub` → `/.netlify/functions/auth?sub=:sub`
- All routes maintained from Vercel

**No Code Changes:**
- All function code is identical
- All imports work the same
- No refactoring required

## Important Notes

⚠️ **Do NOT delete the `/api` directory yet** until you confirm everything works on Netlify.

✅ **After deployment:**
1. Test quiz creation, login, downloads
2. Check DevTools Console for errors
3. Verify all API calls work
4. Then you can safely delete `/api` folder

## Differences from Vercel

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Free tier functions | 12 limit | Unlimited ✅ |
| Setup complexity | Very easy | Easy ✅ |
| Free tier calls | Limited | 125k/month ✅ |
| Cold start | ~100ms | ~200ms |

## Reverting to Vercel

If you need to revert:
1. Delete `netlify.toml`
2. Push code (vercel.json still exists)
3. Redeploy on Vercel

## Troubleshooting

**404 errors on API calls:**
- Check netlify.toml redirects are correct
- Verify environment variables are set
- Check browser DevTools Network tab

**Functions not deploying:**
- Ensure `/netlify/functions/` directory exists
- Check Netlify build logs for errors
- Verify all files copied correctly

**Database connection errors:**
- Verify `DATABASE_URL` is set in Netlify environment
- Check Neon database is accessible from Netlify region
- Test connection string locally first

## Questions?

Contact Netlify support: https://app.netlify.com/support
Or check docs: https://docs.netlify.com/functions/overview/
