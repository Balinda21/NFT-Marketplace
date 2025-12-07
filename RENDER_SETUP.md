# Render Deployment - Quick Setup Guide

## Step-by-Step Instructions

### 1. Sign Up for Render
- Go to [render.com](https://render.com)
- Click "Get Started for Free"
- Sign up with your GitHub account
- Authorize Render to access your repositories

### 2. Create New Web Service
- Click "New +" button (top right)
- Select "Web Service"
- Connect your GitHub repository: `Balinda21/NFT-Marketplace`
- Click "Connect"

### 3. Configure Service Settings
Fill in the following:

**Basic Settings:**
- **Name**: `nft-backend` (or your choice)
- **Environment**: `Docker`
- **Region**: Choose closest to your users (Oregon, Frankfurt, etc.)
- **Branch**: `main`
- **Root Directory**: Leave empty (root is fine)
- **Build Command**: (Leave empty - Docker handles this)
- **Start Command**: (Leave empty - Docker handles this)

**Plan:**
- **Free**: Service sleeps after 15 min inactivity (slow first request)
- **Starter ($7/month)**: Always-on service (recommended for production)

### 4. Add Environment Variables
Scroll down to "Environment Variables" and add:

**Required:**
```
NODE_ENV=production
PORT=9090
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
DATABASE_URL=your-neon-postgresql-connection-string
FRONTEND_URL=http://localhost:5173
```

**Optional (if using Google OAuth):**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Optional (for error tracking):**
```
SENTRY_DSN=your-sentry-dsn
```

### 5. Get Your Neon Database URL
If you don't have one yet:
1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up (free)
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.neon.tech/dbname`)
5. Paste it as `DATABASE_URL` in Render

### 6. Generate JWT Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```
Copy the output and use it as your `JWT_SECRET`

### 7. Deploy
- Click "Create Web Service" at the bottom
- Render will start building your Docker image
- Watch the build logs (takes 3-5 minutes)
- Once deployed, your API will be live at: `https://your-service-name.onrender.com`

### 8. Test Your Deployment
- Visit: `https://your-service-name.onrender.com/api-docs` (Swagger UI)
- Test the health endpoint
- Try registering a user

### 9. Custom Domain (Optional)
- Go to Settings → Custom Domains
- Add your domain
- Render provides free SSL certificates

## Important Notes

✅ Your Dockerfile is already configured for Render
✅ Migrations run automatically on startup
✅ Port is configured correctly
✅ All logs are available in Render dashboard

## Free Tier Limitations

⚠️ **Free Tier:**
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- Limited to 750 hours/month
- Good for development/testing

💡 **Recommendation:**
- Use Free tier for development
- Upgrade to Starter ($7/month) for production (always-on)

## Troubleshooting

**Build fails?**
- Check build logs in Render dashboard
- Ensure all environment variables are set
- Verify DATABASE_URL is correct
- Check Dockerfile syntax

**Database connection fails?**
- Check DATABASE_URL format
- Ensure Neon database allows connections
- Check if database is paused (Neon free tier pauses after inactivity)

**API not responding?**
- Check deployment logs
- Verify PORT environment variable (should be 9090)
- Check if service is sleeping (free tier)
- Wait for cold start on first request

**Service sleeping (free tier)?**
- First request after sleep takes 30-60 seconds
- Subsequent requests are fast
- Upgrade to Starter plan for always-on service

## Next Steps After Deployment

1. Test all API endpoints
2. Create admin user (connect to production DB and run: `npm run db:create-admin`)
3. Update FRONTEND_URL to your actual frontend domain
4. Set up monitoring (Sentry recommended)
5. Consider upgrading to Starter plan for production

## Render vs Free Tier

**Free Tier:**
- ✅ Great for development/testing
- ✅ No credit card required
- ❌ Services sleep after inactivity
- ❌ Slow first request (cold start)

**Starter Plan ($7/month):**
- ✅ Always-on service
- ✅ Fast response times
- ✅ Production-ready
- ✅ No cold starts

---

**Your API will be live at:** `https://your-service-name.onrender.com`

**Swagger Docs:** `https://your-service-name.onrender.com/api-docs`
