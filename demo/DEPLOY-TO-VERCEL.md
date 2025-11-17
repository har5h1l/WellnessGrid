# Deploy WellnessGrid Demo to Vercel

## Quick Deployment Steps

### 1. Sign up/Login to Vercel

Go to [vercel.com](https://vercel.com) and sign up or login with GitHub.

### 2. Install Vercel CLI (Optional - for command line deployment)

```bash
npm i -g vercel
```

### 3. Deploy via Vercel Dashboard (Recommended - Easiest)

**Option A: GitHub Integration (Best)**

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Click "Import Project"
4. Select your repository
5. **Important Settings:**
   - **Root Directory**: `demo/frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
6. Click "Deploy"
7. Wait 2-3 minutes ⏱️
8. Done! 🎉

**Option B: CLI Deployment**

1. Open terminal and navigate to demo frontend:
   ```bash
   cd "/Users/harshilshah/Desktop/WellnessGrid App/demo/frontend"
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - What's your project's name? `wellnessgrid-demo`
   - In which directory is your code located? `./`
   - Want to override the settings? **N**

5. For production deployment:
   ```bash
   vercel --prod
   ```

## What Gets Deployed

- ✅ Next.js frontend with all pages
- ✅ Built-in API routes (no separate backend!)
- ✅ Mock data served from API routes
- ✅ All UI components and styles
- ✅ Zero configuration needed

## After Deployment

Your demo will be live at:
- `https://your-project-name.vercel.app`
- Or a custom domain if you set one up

### Test Your Deployment

Visit these URLs to verify everything works:

1. Home: `https://your-project-name.vercel.app/`
2. Dashboard: `https://your-project-name.vercel.app/dashboard`
3. Chat: `https://your-project-name.vercel.app/chat`
4. Analytics: `https://your-project-name.vercel.app/analytics`
5. Records: `https://your-project-name.vercel.app/records`
6. API Health: `https://your-project-name.vercel.app/api/health`

## Troubleshooting

### Build Fails

If the build fails, check:
- Make sure `demo/frontend` is set as the root directory
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Pages Don't Load

If pages show 404:
- Clear build cache in Vercel dashboard
- Redeploy
- Make sure Next.js App Router structure is correct

### API Routes 404

If `/api/*` routes return 404:
- Verify `app/api/*/route.ts` files exist
- Check file naming is correct
- Redeploy with clean build

## Environment Variables

**Good news:** None needed! 🎉

The demo is completely self-contained with no external dependencies.

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Updating Your Demo

To update after making changes:

**Via GitHub:**
- Just push to your repo
- Vercel auto-deploys on every push

**Via CLI:**
```bash
cd demo/frontend
vercel --prod
```

## Cost

**Free!** The Vercel Hobby plan includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth
- ✅ Serverless functions
- ✅ Custom domains
- ✅ Automatic HTTPS

Perfect for demos and personal projects!

## Next Steps After Deployment

1. ✅ Share the URL with judges/reviewers
2. ✅ Test all features on mobile and desktop
3. ✅ Add the live URL to your GitHub README
4. ✅ Celebrate! 🎉

---

**Deployment time:** 2-3 minutes  
**Maintenance:** Zero  
**Complexity:** Minimal

You're all set! 🚀

