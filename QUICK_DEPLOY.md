# 🚀 Quick Deployment Guide

## Option 1: Render.com (Easiest - Free Tier)

### 1. Push to GitHub
```bash
git add .
git commit -m "Setup deployment"
git push origin main
```

### 2. Deploy on Render
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Use these settings:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/index.js`
   - **Plan**: Free

### 3. Add Environment Variables
In Render dashboard → Environment tab:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-strong-secret-here
DATABASE_URL=your-neon-database-url
SHADOW_DATABASE_URL=your-neon-database-url
FRONTEND_URL=https://your-frontend.com
JWT_EXPIRES_IN=7d
TRON_RPC_URL=https://api.trongrid.io
```

### 4. Deploy!
Click "Create Web Service" - Render will auto-deploy on every git push!

---

## Option 2: Railway (Also Free)

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Add same environment variables as above
5. Set **Start Command**: `npx prisma migrate deploy && node dist/index.js`

---

## ✅ After Deployment

1. **Run Migrations** (if not auto-run):
   - Render: Go to Shell tab → `npx prisma migrate deploy`
   - Railway: Use CLI or dashboard

2. **Test Your API**:
   - API: `https://your-service.onrender.com`
   - Docs: `https://your-service.onrender.com/api-docs`

3. **Update Frontend**:
   - Change `API_BASE_URL` to your deployed backend URL

---

## 🔄 Auto-Deployment

Both Render and Railway automatically deploy when you push to your main branch!

No additional setup needed - just push and it deploys! 🎉


