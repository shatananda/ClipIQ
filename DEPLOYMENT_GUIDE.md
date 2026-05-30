# AI-Forms Deployment Guide

Complete instructions for deploying the AI-Forms system to production.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Vercel account (for frontend)
- Cloud hosting account (AWS, Google Cloud, DigitalOcean, etc. for backend)
- Supabase project (already set up)
- Anthropic API key
- OpenAI API key (for Whisper & TTS, optional)

---

## Phase 1: Pre-Deployment Preparation

### 1. Environment Configuration

**Backend (.env)**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_secret_key
ANTHROPIC_API_KEY=sk-ant-your_key
PORT=3001
NODE_ENV=production
```

**Frontend (.env.production)**
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your_anon_key
```

### 2. Security Audit

- [ ] Review all API endpoints for auth requirements
- [ ] Ensure RLS policies are active in Supabase
- [ ] Test multi-tenant isolation
- [ ] Verify no secrets in code
- [ ] Enable HTTPS everywhere
- [ ] Set up rate limiting
- [ ] Configure CORS properly

### 3. Testing

```bash
# Backend
cd ai-forms-backend
npm test
npm run build

# Frontend
cd ai-forms-frontend
npm test
npm run build
```

---

## Phase 2: Backend Deployment

### Option A: Deploy to Vercel (Node.js + Serverless)

1. **Connect to GitHub**
   ```bash
   git push origin main
   ```

2. **Create `vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/src/index.ts"
       }
     ],
     "env": {
       "SUPABASE_URL": "@supabase_url",
       "SUPABASE_ANON_KEY": "@supabase_anon_key",
       "SUPABASE_SECRET_KEY": "@supabase_secret_key",
       "ANTHROPIC_API_KEY": "@anthropic_api_key"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm install -g vercel
   vercel
   ```

### Option B: Deploy to AWS EC2

1. **Launch EC2 instance**
   - Ubuntu 22.04 LTS
   - t3.micro (free tier eligible)
   - Security group: allow port 3001

2. **SSH into instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone and setup**
   ```bash
   git clone https://github.com/shatananda/ai-forms-backend.git
   cd ai-forms-backend
   npm install
   npm run build
   ```

5. **Create `.env` file**
   ```bash
   sudo nano .env
   # Add all environment variables
   ```

6. **Start with PM2 (process manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start dist/index.js --name "ai-forms-api"
   pm2 startup
   pm2 save
   ```

7. **Setup Nginx as reverse proxy**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/default
   ```
   
   Add:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

8. **Enable HTTPS with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option C: Deploy to DigitalOcean App Platform

1. Connect GitHub repository to DigitalOcean
2. Create app:
   - Type: Node.js
   - Build command: `npm install && npm run build`
   - Run command: `npm start`
   - Add environment variables
3. Deploy

---

## Phase 3: Frontend Deployment

### Deploy to Vercel (Recommended)

1. **Connect GitHub**
   ```bash
   git push origin main
   ```

2. **Vercel Dashboard**
   - Click "Import Project"
   - Select `ai-forms-frontend` repo
   - Add environment variables
   - Deploy

### Deploy to AWS S3 + CloudFront

1. **Build**
   ```bash
   npm run build
   ```

2. **Create S3 bucket**
   ```bash
   aws s3 mb s3://ai-forms-frontend --region us-east-1
   ```

3. **Upload build**
   ```bash
   aws s3 sync build/ s3://ai-forms-frontend --delete
   ```

4. **Create CloudFront distribution**
   - Point to S3 bucket
   - Set default root object to `index.html`
   - Set 404 error page to `index.html` (for SPA routing)

5. **Update DNS**
   - Point domain CNAME to CloudFront distribution

---

## Phase 4: Database & Supabase Configuration

### 1. Verify Database Setup

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

### 2. Create Admin User

```sql
INSERT INTO users (tenant_id, email, name, role)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'admin@yourdomain.com',
  'Admin User',
  'admin'
);
```

### 3. Backup Strategy

```bash
# Daily automated backups via Supabase dashboard
# Enable under Database → Backups
# Set to weekly, 30-day retention minimum
```

### 4. Monitor Performance

- Check query performance in Supabase
- Enable slow query logging
- Monitor connection pools
- Review RLS policy execution time

---

## Phase 5: Monitoring & Logging

### Backend Monitoring

```bash
# Install monitoring (PM2 Plus)
pm2 install pm2-auto-pull
pm2 web

# Logs
pm2 logs ai-forms-api
```

### Frontend Monitoring

Use Vercel Analytics:
- Automatic performance tracking
- Error tracking via Sentry

### Setup Sentry (Error Tracking)

**Frontend:**
```bash
npm install @sentry/react @sentry/tracing
```

```tsx
// src/index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

**Backend:**
```bash
npm install @sentry/node @sentry/tracing
```

```ts
// src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

---

## Phase 6: SSL/TLS Certificates

### Automatic (Let's Encrypt)

```bash
# Already handled by Certbot (Nginx) or Vercel
# Certificates auto-renew
```

### Check Certificate Status

```bash
# Nginx
sudo certbot certificates

# Vercel
# Auto-managed, check in dashboard
```

---

## Phase 7: Backup & Disaster Recovery

### Database Backups

```bash
# Manual backup (Supabase dashboard)
# Settings → Backups → Request backup

# Restore from backup
# Settings → Backups → Select backup → Restore
```

### Code Backups

```bash
# Push to GitHub (already done)
# GitHub → Settings → Code security → Enable dependabot
```

### CDN Caching (Frontend)

- Set cache headers in Vercel/CloudFront
- Cache immutable assets forever
- Cache HTML for 1 hour

---

## Phase 8: Post-Deployment Checklist

- [ ] Backend API responds to `/health`
- [ ] Frontend loads and connects to API
- [ ] Forms can be submitted end-to-end
- [ ] Validation rules work (test with invalid data)
- [ ] Chat messages save and display
- [ ] Admin portal loads applications
- [ ] Multi-tenant isolation verified
- [ ] SSL/TLS working (https)
- [ ] Performance acceptable (< 3s page load)
- [ ] Error tracking enabled
- [ ] Backups configured
- [ ] Domain pointing to live servers
- [ ] Email notifications working (optional)
- [ ] Rate limiting in place
- [ ] CORS configured correctly

---

## Phase 9: Monitoring & Maintenance

### Daily

- Check error logs
- Monitor API response times
- Verify backup completed

### Weekly

- Review security logs
- Check database size growth
- Test disaster recovery

### Monthly

- Review performance metrics
- Update dependencies
- Audit user access
- Test full application workflow

---

## Scaling Considerations

### When to Scale Backend

- API response time > 500ms
- CPU usage > 80% sustained
- Memory usage > 75%

**Scale Options:**
1. Upgrade server size (vertical scaling)
2. Add load balancer + multiple instances (horizontal scaling)
3. Upgrade database (more connections, better hardware)

### When to Scale Database

- Query response time > 200ms
- Connection pool exhausted
- Storage > 80% of allocated

**Scale Options:**
1. Upgrade Supabase compute
2. Add read replicas
3. Optimize queries (add indexes)

---

## Rollback Procedure

If deployment fails:

```bash
# Backend
pm2 delete ai-forms-api
git checkout previous-tag
npm install && npm run build
pm2 start dist/index.js --name "ai-forms-api"

# Frontend
# Vercel automatically keeps previous deployments
# Dashboard → Deployments → Select previous → Promote to Production

# Database
# Use Supabase backup restore feature
```

---

## Cost Estimation (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | $50-200 | Scales with storage/queries |
| Vercel (Frontend) | $0-20 | Free tier usually sufficient |
| Vercel (Backend) | $0-50 | Serverless, pay per invocation |
| Anthropic API | $10-100 | Depends on validation volume |
| OpenAI Whisper (optional) | $0-20 | Voice transcription |
| **Total** | **$60-390** | **Scales with usage** |

---

## Support & Troubleshooting

### Common Issues

**API not responding**
```bash
# Check if service is running
pm2 list

# Check logs
pm2 logs ai-forms-api

# Restart
pm2 restart ai-forms-api
```

**Database connection errors**
```bash
# Check Supabase status
# Verify credentials in .env
# Check network/firewall rules
```

**CORS errors**
```bash
# Verify CORS configuration in Express
# Check that API_URL matches frontend request origin
```

**High memory usage**
```bash
# Review logs for memory leaks
# Restart service
# Upgrade instance if persistent
```

---

## Contact & Resources

- **GitHub**: https://github.com/shatananda/ai-forms-*
- **Supabase Docs**: https://supabase.com/docs
- **Anthropic Docs**: https://docs.anthropic.com
- **Vercel Docs**: https://vercel.com/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/

---

## Sign-Off

Deployment completed and verified: _____________________
Date: _____________________
