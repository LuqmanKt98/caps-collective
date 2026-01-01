# Vercel Deployment Guide - Caps Collective

## ✅ What Was Fixed

The invitation links were showing `http://localhost:3000` instead of your Vercel URL. This has been fixed by implementing **automatic Vercel URL detection**.

### Changes Made:
1. **Updated `src/app/api/invitations/route.ts`** - Both GET and POST endpoints now use production URL
2. **Updated `src/lib/firebaseInvitations.ts`** - Firebase email links now use production URL
3. **Production URL Detection Logic**:
   ```typescript
   const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
       ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
       : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
   ```

### Why This Matters:
- ❌ **Before**: Used `VERCEL_URL` which gives preview URLs like `https://caps-collective-4idcm5k6s-luqmankt98s-projects.vercel.app`
- ✅ **After**: Uses `VERCEL_PROJECT_PRODUCTION_URL` which gives clean production URL like `https://caps-collective.vercel.app`

## 🚀 How It Works

### In Development (Local)
- Uses `http://localhost:3000`
- No configuration needed

### In Production (Vercel)
- **Automatically** uses `https://caps-collective.vercel.app` (your clean production URL)
- Vercel provides `VERCEL_PROJECT_PRODUCTION_URL` environment variable automatically
- This is the **production domain**, not the ugly preview deployment URLs
- No manual configuration required!

## 📋 Vercel Environment Variables to Configure

Go to your Vercel project dashboard → **Settings** → **Environment Variables** and add:

### Required Variables:

```env
# Firebase Configuration (Production & Preview)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Production & Preview)  
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key_multiline

# SMTP Configuration for Emails (Production & Preview)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=CapsCollective.io@gmail.com
SMTP_PASSWORD=xpdl mxzn vllc bvyv
SMTP_SECURE=true
SMTP_FROM="Caps Collective" <CapsCollective.io@gmail.com>

# Optional: Resend API (if using Resend)
RESEND_API_KEY=re_BdpWnRmM_Eq2CE3yhccqDjWMMpE97J1m1
```

### ⚠️ Important Notes:

1. **VERCEL_URL is automatic** - Don't set it manually, Vercel provides it
2. **NEXT_PUBLIC_BASE_URL is optional** - Only set if you want to override the automatic detection
3. **Firebase Private Key** - When entering the private key in Vercel:
   - Keep the quotes and newlines `\n`
   - Example: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

## 🔐 Setting Environment Variables in Vercel

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project (caps-collective)
3. Click **Settings** → **Environment Variables**
4. Add each variable:
   - Variable name (e.g., `SMTP_HOST`)
   - Value (e.g., `smtp.gmail.com`)
   - Select environments: **Production**, **Preview**, and **Development**
5. Click **Save**

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add SMTP_HOST
vercel env add SMTP_USER
# ... repeat for all variables
```

## 🧪 Testing After Deployment

1. **Deploy to Vercel**:
   - Push your code to GitHub (already done ✅)
   - Vercel will automatically deploy

2. **Test Invitation Links**:
   - Go to your admin panel at `https://caps-collective.vercel.app/admin`
   - Create a new invitation link
   - **Expected Result**: Link should show `https://caps-collective.vercel.app/register?invitation=...`
   - **Not**: `https://caps-collective-4idcm5k6s-luqmankt98s-projects.vercel.app/register?invitation=...`

3. **Verify in Different Environments**:
   - Production: `https://caps-collective.vercel.app` ✅ Clean URL
   - Preview branches: Links will still use production URL, not preview URL ✅

## 🐛 Troubleshooting

### If links still show localhost:
1. Check Vercel deployment logs for errors
2. Verify all environment variables are set correctly
3. Redeploy the project after setting environment variables
4. Clear browser cache

### If environment variables aren't working:
1. Ensure variables are set for **Production** environment
2. Check for typos in variable names
3. Redeploy after adding new variables (Vercel requires redeploy)

### To force redeploy:
```bash
vercel --prod
```

## 📱 Next Steps

1. ✅ Code is pushed to GitHub
2. ⏳ Go to Vercel dashboard and set environment variables
3. ⏳ Wait for automatic deployment or trigger manual deployment
4. ✅ Test invitation links - they should now use Vercel URL!

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your Project**: https://vercel.com/[your-username]/caps-collective
- **Vercel Docs**: https://vercel.com/docs/environment-variables

---

**Status**: ✅ Code Changes Complete | ⏳ Vercel Configuration Needed
