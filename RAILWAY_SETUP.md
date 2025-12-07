# Railway Deployment - Quick Setup Guide

## Step-by-Step Instructions

### 1. Sign Up for Railway
- Go to [railway.app](https://railway.app)
- Click "Start a New Project"
- Sign up with your GitHub account
- Authorize Railway to access your repositories

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository: `Balinda21/NFT-Marketplace`
- Railway will automatically detect your Dockerfile

### 3. Add Environment Variables
Go to your project → Settings → Variables and add:

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

### 4. Get Your Neon Database URL
If you don't have one yet:
1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up (free)
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.neon.tech/dbname`)
5. Paste it as `DATABASE_URL` in Railway

### 5. Generate JWT Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```
Copy the output and use it as your `JWT_SECRET`

### 6. Deploy
- Railway will automatically start building when you add the repo
- Watch the build logs in the Railway dashboard
- Once deployed, your API will be live at: `https://your-project.up.railway.app`

### 7. Test Your Deployment
- Visit: `https://your-project.up.railway.app/api-docs` (Swagger UI)
- Test the health endpoint
- Try registering a user

### 8. Custom Domain (Optional)
- Go to Settings → Networking
- Add your custom domain
- Railway provides free SSL certificates

## Important Notes

✅ Your Dockerfile is already configured for Railway
✅ Migrations run automatically on startup
✅ Port is configured to use Railway's assigned port
✅ All logs are available in Railway dashboard

## Troubleshooting

**Build fails?**
- Check build logs in Railway dashboard
- Ensure all environment variables are set
- Verify DATABASE_URL is correct

**Database connection fails?**
- Check DATABASE_URL format
- Ensure Neon database allows connections
- Check if database is paused (Neon free tier pauses after inactivity)

**API not responding?**
- Check deployment logs
- Verify PORT environment variable
- Check if service is running (not sleeping)

## Next Steps After Deployment

1. Test all API endpoints
2. Create admin user: `npm run db:create-admin` (run locally, then connect to production DB)
3. Update FRONTEND_URL to your actual frontend domain
4. Set up monitoring (Sentry recommended)

---

**Your API will be live at:** `https://your-project-name.up.railway.app`

