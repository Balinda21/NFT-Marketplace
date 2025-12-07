# Deployment Guide - NFT Marketplace Backend

This guide covers deploying the NFT Marketplace Backend to various hosting platforms.

## Prerequisites

- GitHub repository with your code
- Database connection string (Neon, Supabase, or any PostgreSQL)
- All environment variables ready

## Option 1: Railway (Recommended) 🚀

### Why Railway?
- ✅ **FREE tier with $5 monthly credit** (enough for most backends!)
- ✅ Excellent Docker support
- ✅ WebSocket support (perfect for Socket.io)
- ✅ GitHub integration with auto-deploy
- ✅ Easy environment variable management
- ✅ Supports both development and production

### 💰 Pricing:
- **Free**: $5 credit/month (usually enough for a small/medium backend)
- **Paid**: Only charged if you exceed $5 (typically $5-10/month for production)
- **You start FREE** and only pay if you need more resources

### Deployment Steps

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**
   In Railway dashboard, add these environment variables:
   ```
   NODE_ENV=production
   PORT=9090
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   DATABASE_URL=your-postgresql-connection-string
   FRONTEND_URL=https://your-frontend-domain.com
   GOOGLE_CLIENT_ID=your-google-client-id (optional)
   GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
   ```

4. **Configure Build Settings**
   - Railway will auto-detect Dockerfile
   - No additional configuration needed

5. **Deploy**
   - Railway will automatically build and deploy
   - Your API will be live at `https://your-project.up.railway.app`

6. **Custom Domain (Optional)**
   - Go to Settings → Networking
   - Add your custom domain

### Railway-specific Configuration

The Dockerfile is already optimized for Railway. No changes needed!

---

## Option 2: Render

### Why Render?
- ✅ Free tier available (with limitations)
- ✅ Good Docker support
- ✅ WebSocket support
- ✅ Simple deployment process

### 💰 Pricing:
- **Free**: Available but services sleep after 15 min inactivity (slow wake-up)
- **Starter**: $7/month for always-on service (recommended for production)

### Deployment Steps

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Settings**
   - **Name**: `nft-backend` (or your choice)
   - **Environment**: `Docker`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your main branch)

4. **Add Environment Variables**
   Add all required environment variables (same as Railway above)

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your API will be live at `https://your-service.onrender.com`

### Render-specific Notes
- Free tier services sleep after 15 minutes of inactivity
- Use "Starter" plan ($7/month) for always-on service
- WebSockets are supported on all plans

---

## Option 3: DigitalOcean App Platform

### Why DigitalOcean?
- ✅ Production-ready infrastructure
- ✅ Predictable pricing
- ✅ Great documentation
- ✅ Good for scaling

### Deployment Steps

1. **Sign up for DigitalOcean**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Create account (get $200 credit with referral)

2. **Create New App**
   - Go to Apps → "Create App"
   - Connect GitHub repository

3. **Configure App**
   - **Source**: Select your repository
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Environment**: Dockerfile detected automatically

4. **Add Environment Variables**
   Add all required environment variables

5. **Configure Database**
   - Option 1: Use external database (Neon/Supabase)
   - Option 2: Create managed PostgreSQL database

6. **Deploy**
   - Review and click "Create Resources"
   - Your API will be live at `https://your-app.ondigitalocean.app`

### Pricing
- Starter: $5/month (512MB RAM)
- Basic: $12/month (1GB RAM) - Recommended

---

## Option 4: Fly.io (Best FREE Option) 🎉

### Why Fly.io?
- ✅ **Generous FREE tier** (3 VMs, 3GB storage, 160GB bandwidth/month)
- ✅ Global distribution
- ✅ Excellent Docker support
- ✅ Great for WebSockets

### 💰 Pricing:
- **Free**: 3 shared-cpu VMs (256MB RAM each), 3GB storage, 160GB transfer/month
- **Paid**: Only if you need more (typically $1.94/month per 1GB RAM VM)
- **Best option if you want truly free hosting!**

### Deployment Steps

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Initialize App**
   ```bash
   fly launch
   ```
   - Follow prompts
   - It will detect your Dockerfile

4. **Set Environment Variables**
   ```bash
   fly secrets set JWT_SECRET=your-secret
   fly secrets set DATABASE_URL=your-db-url
   # ... add all other env vars
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Check Status**
   ```bash
   fly status
   fly open
   ```

---

## Environment Variables Checklist

Before deploying, ensure you have all these configured:

### Required
- [ ] `NODE_ENV=production`
- [ ] `PORT=9090` (or let platform assign)
- [ ] `JWT_SECRET` (strong random string, 32+ chars)
- [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] `FRONTEND_URL` (your frontend domain)

### Optional
- [ ] `GOOGLE_CLIENT_ID` (for Google OAuth)
- [ ] `GOOGLE_CLIENT_SECRET` (for Google OAuth)
- [ ] `SENTRY_DSN` (for error tracking)
- [ ] Email/SMS configs (if needed)

---

## Post-Deployment Checklist

After deploying:

1. **Test API Endpoints**
   ```bash
   curl https://your-api-url/api/health
   ```

2. **Check Swagger Documentation**
   - Visit `https://your-api-url/api-docs`
   - Verify all endpoints are documented

3. **Test Authentication**
   - Register a new user
   - Login with credentials
   - Test protected endpoints

4. **Verify Database Connection**
   - Check logs for database connection
   - Run migrations if needed

5. **Test WebSocket Connection**
   - Test chat functionality if implemented

6. **Set up Monitoring**
   - Configure error tracking (Sentry)
   - Set up uptime monitoring
   - Configure log aggregation

---

## Database Migrations

Your Dockerfile includes automatic migrations on startup:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

This ensures migrations run automatically when the container starts.

### Manual Migration (if needed)

If you need to run migrations manually:
```bash
npx prisma migrate deploy
```

---

## Troubleshooting

### Issue: Port already in use
**Solution**: Let the platform assign the port automatically. Update your code to use `process.env.PORT` (already configured).

### Issue: Database connection fails
**Solution**: 
- Check DATABASE_URL is correct
- Ensure database allows connections from your hosting IP
- For Neon/Supabase, check connection pooling settings

### Issue: WebSockets not working
**Solution**: 
- Ensure platform supports WebSockets (Railway, Render, Fly.io all do)
- Check CORS settings allow your frontend domain
- Verify Socket.io configuration

### Issue: Environment variables not loading
**Solution**:
- Restart the service after adding env vars
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces in values

---

## 💰 Cost Comparison Summary

### FREE Options:
1. **Fly.io** - Truly free, generous resources (BEST for free)
2. **Railway** - $5 credit/month (usually enough, but may pay later)
3. **Render** - Free but sleeps (not ideal for production)

### Paid Options:
- **Railway**: ~$5-10/month (only if you exceed free credit)
- **Render Starter**: $7/month (always-on)
- **DigitalOcean**: $5/month (always paid)

### Database (All have FREE tiers):
- **Neon**: Free tier (0.5GB storage, unlimited compute)
- **Supabase**: Free tier (500MB database)
- **Both are perfect for getting started!**

## 🎯 Recommended Setup (FREE)

For **completely FREE** deployment:
- **Platform**: Fly.io (generous free tier)
- **Database**: Neon (free tier)
- **Monitoring**: Sentry (free tier)
- **CDN**: Cloudflare (free tier for frontend)

**Total Cost: $0/month** ✅

For **easiest deployment** (may pay $5-10/month later):
- **Platform**: Railway ($5 credit/month, usually enough)
- **Database**: Neon (free tier)
- **Monitoring**: Sentry (free tier)
- **CDN**: Cloudflare (free tier for frontend)

**Total Cost: $0-10/month** (likely FREE if traffic is low)

---

## Security Checklist

Before going live:

- [ ] Use strong `JWT_SECRET` (32+ random characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable CORS only for your frontend domain
- [ ] Set up rate limiting (already configured)
- [ ] Enable HTTPS (automatic on all platforms)
- [ ] Use environment variables for all secrets
- [ ] Never commit `.env` file
- [ ] Review and update dependencies regularly
- [ ] Set up database backups
- [ ] Configure proper logging

---

## Support

For issues specific to:
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Render**: [render.com/docs](https://render.com/docs)
- **DigitalOcean**: [docs.digitalocean.com](https://docs.digitalocean.com)
- **Fly.io**: [fly.io/docs](https://fly.io/docs)

---

## Quick Start Commands

### Railway (after setup)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Render
- Just push to GitHub, auto-deploys!

### Fly.io
```bash
fly deploy
```

---

**Ready to deploy?** Choose Railway for the easiest experience! 🚀
