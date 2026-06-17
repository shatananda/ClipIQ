# ClipIQ Deployment Guide

This guide covers deploying ClipIQ to production on Vercel, AWS, and other platforms.

## Deployment Options

### Option 1: Vercel (Recommended)
✅ **Easiest** - Designed for Next.js  
⚠️ **Limitations** - 10 min timeout, ephemeral /tmp storage

### Option 2: AWS EC2
✅ **Full control** - Persistent storage, no timeouts  
⚠️ **More setup** - Need to manage servers

### Option 3: AWS Lambda (Function)
✅ **Serverless** - Auto-scaling  
⚠️ **Complex** - Need job queue for long pipelines

### Option 4: Railway, Render, Fly.io
✅ **Good middle ground** - Easier than EC2  
⚠️ **Cost** - More expensive than Vercel

---

## 1. Vercel Deployment (Recommended for MVP)

### Prerequisites
- GitHub account with pushed code
- Vercel account (free tier available)
- API keys for Claude and AssemblyAI

### Step-by-Step

#### 1.1: Push Code to GitHub
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

Verify at: https://github.com/shatananda/ClipIQ

#### 1.2: Connect to Vercel
1. Go to https://vercel.com
2. Sign up / Sign in with GitHub
3. Click "New Project"
4. Select "ClipIQ" repository
5. Click "Import"

#### 1.3: Configure Environment Variables
1. In Vercel dashboard, go to Settings → Environment Variables
2. Add:
   ```
   ANTHROPIC_API_KEY = sk-...
   ASSEMBLYAI_API_KEY = ...
   ```
3. Select "Production" environment
4. Click "Save"

#### 1.4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Visit your URL (e.g., `https://clipiq.vercel.app`)

#### 1.5: Test
```bash
curl https://clipiq.vercel.app/api/keywords
# Should return keywords array
```

### Important Vercel Limitations

⚠️ **10-minute timeout**
- Full pipeline may exceed this on videos > 15 minutes
- FFmpeg extraction can be slow
- Solution: Use different platform for larger videos

⚠️ **Ephemeral /tmp storage**
- Videos deleted after function completes
- Users must download clips immediately
- Solution: Add S3 integration (see below)

### Vercel + S3 Integration (Optional)
For persistent storage and larger deployments:

1. Create AWS S3 bucket
2. Add AWS credentials to Vercel environment variables
   ```
   AWS_ACCESS_KEY_ID = ...
   AWS_SECRET_ACCESS_KEY = ...
   AWS_S3_BUCKET = clipiq-videos
   ```
3. Update storage.ts to use S3:
   ```typescript
   import AWS from 'aws-sdk'
   const s3 = new AWS.S3()
   // Use s3.putObject() instead of fs.writeFile()
   ```

---

## 2. AWS EC2 Deployment

### Prerequisites
- AWS account with EC2 access
- SSH key pair created
- Security groups configured

### Step-by-Step

#### 2.1: Launch EC2 Instance
1. AWS Console → EC2 → Instances → Launch
2. Select: Ubuntu 22.04 LTS (Free tier eligible)
3. Instance type: t2.medium (2 GB RAM recommended for FFmpeg)
4. Storage: 50 GB (for videos)
5. Security group: Allow SSH (22), HTTP (80), HTTPS (443)
6. Review and launch

#### 2.2: SSH into Instance
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 2.3: Install Dependencies
```bash
# Update
sudo apt update && sudo apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# FFmpeg
sudo apt install -y ffmpeg

# yt-dlp
sudo apt install -y python3 python3-pip
sudo pip3 install yt-dlp

# Git
sudo apt install -y git

# PM2 (process manager)
sudo npm install -g pm2
```

#### 2.4: Clone and Setup
```bash
cd /opt
git clone https://github.com/shatananda/ClipIQ.git
cd ClipIQ
npm install
```

#### 2.5: Create Environment File
```bash
sudo nano .env.local
```

Add:
```
ANTHROPIC_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...
STORAGE_PATH=/var/clipiq/storage
```

Create storage directory:
```bash
sudo mkdir -p /var/clipiq/storage
sudo chown ubuntu:ubuntu /var/clipiq/storage
```

#### 2.6: Build and Start
```bash
npm run build
sudo pm2 start "npm start" --name clipiq

# Auto-restart on reboot
sudo pm2 startup
sudo pm2 save
```

#### 2.7: Setup Domain (Optional)
```bash
# Point your domain DNS to the EC2 Elastic IP
# Then add to security group: Allow HTTPS (443)
```

#### 2.8: Setup HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

### Monitoring
```bash
# Check logs
pm2 logs clipiq

# Monitor resources
htop

# Check disk usage
df -h /var/clipiq/storage
```

### Cost Estimate (AWS EC2)
- t2.medium: ~$20/month
- Storage: ~$0.10/GB/month
- Bandwidth: ~$0.10/GB out (after free tier)
- **Total: $25-50/month**

---

## 3. Docker Deployment (Any Platform)

### Dockerfile
```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache ffmpeg python3 py3-pip
RUN pip3 install yt-dlp

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Create storage directory
RUN mkdir -p ./storage

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production

# Start
CMD ["npm", "start"]
```

### Build and Push
```bash
docker build -t clipiq .
docker tag clipiq yourusername/clipiq:latest
docker push yourusername/clipiq:latest
```

### Deploy on Docker Host
```bash
docker run -d \
  -p 80:3000 \
  -e ANTHROPIC_API_KEY=sk-... \
  -e ASSEMBLYAI_API_KEY=... \
  -v /var/clipiq/storage:/app/storage \
  --name clipiq \
  yourusername/clipiq:latest
```

---

## 4. Railway Deployment

### Step-by-Step
1. Go to https://railway.app
2. Create new project
3. Connect GitHub account
4. Select ClipIQ repository
5. Add environment variables
6. Deploy automatically on push

**Cost**: $5/month minimum, then pay-per-use  
**Timeout**: 24 hours (no limit)  
**Storage**: Persistent

---

## Production Checklist

### Before Deploying
- [ ] All tests passing: `npm test`
- [ ] No console errors: `npm run build`
- [ ] Environment variables set
- [ ] API keys working (test one call)
- [ ] Database migrations (if applicable)
- [ ] SSL/TLS certificate ready

### After Deploying
- [ ] Health check: `curl https://yourdomain.com`
- [ ] API test: `curl https://yourdomain.com/api/keywords`
- [ ] End-to-end: Run full pipeline on production
- [ ] Monitor logs for errors
- [ ] Check storage usage

### Ongoing Operations
- [ ] Monitor uptime (UptimeRobot, Datadog)
- [ ] Monitor costs (AWS billing, Vercel usage)
- [ ] Backup storage periodically (if using persistent storage)
- [ ] Update dependencies monthly
- [ ] Review logs weekly

---

## Performance Tuning

### FFmpeg Optimization
Current preset: `fast` (balance of speed and quality)

For faster encoding:
```bash
# In ffmpeg.ts
# Change: -preset fast
# To: -preset ultrafast
```

For better quality:
```bash
# Change: -preset fast -crf 23
# To: -preset slow -crf 18
```

### Node.js Optimization
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

### Database Query Optimization (Future)
When you add a database:
- Add indexes on frequently queried columns
- Use connection pooling
- Cache query results

---

## Scaling Strategy

### Stage 1: Current (MVP)
- Single server (Vercel or EC2)
- Local file storage
- Synchronous processing
- ~5-10 users/day

### Stage 2: Job Queue
- Add Bull/BullMQ for async jobs
- Multiple worker processes
- Redis for job storage
- ~50-100 users/day

### Stage 3: Microservices
- Separate services per function (Download, Transcribe, Analyze, Extract)
- Auto-scaling based on load
- Dedicated S3 for storage
- ~1000+ users/day

### Stage 4: Distributed
- CDN for video delivery
- Database (PostgreSQL) for metadata
- Cache layer (Redis)
- Multiple regions
- ~100k+ users/day

---

## Monitoring & Alerting

### Recommended Services
- **Uptime**: UptimeRobot (free)
- **Error Tracking**: Sentry (free tier)
- **Performance**: Vercel Analytics (built-in)
- **Logs**: Datadog, ELK stack
- **Metrics**: Prometheus + Grafana

### Key Metrics to Monitor
```
- API response times (target: < 30s)
- Error rate (target: < 1%)
- Storage usage growth
- API quota usage (Claude, AssemblyAI)
- Server CPU/memory (if self-hosted)
```

### Alerting Rules
```
- Response time > 60s → page on-call
- Error rate > 5% → alert
- Storage > 80% full → alert
- API quota > 80% → alert
- Server down → page immediately
```

---

## Backup Strategy

### For Vercel
- Code: Automatically backed up on GitHub
- Environment variables: Export from Vercel dashboard monthly
- User data: Stored in sessionStorage (ephemeral)

### For EC2
```bash
# Backup storage directory daily
0 2 * * * tar -czf /backup/clipiq-$(date +%Y%m%d).tar.gz /var/clipiq/storage
```

### For Production Database (Future)
```bash
# Daily automated backups
# 30-day retention
# Test restore monthly
```

---

## Disaster Recovery

### Data Loss Scenario
1. Videos lost: Re-download from YouTube
2. Clips lost: Re-extract from videos
3. Keywords lost: Restore from git version
4. User data: Lost (stateless app)

### Service Down Scenario
1. Check server status (CPU, memory, disk)
2. Check external APIs (Claude, AssemblyAI)
3. Review recent deployments
4. Rollback if needed: `git revert <commit>`
5. Re-deploy: `git push origin main`

---

## Cost Optimization

### Vercel
- Free tier: 100 executions/month
- Pro: $20/month
- **Recommendation**: Free tier for MVP, upgrade when needed

### AssemblyAI
- Free: 600 minutes/month
- Pay-as-you-go: $0.10/minute
- **Optimization**: Batch transcription, caching

### Claude API
- No monthly fee
- $0.003 per 1K input tokens
- $0.015 per 1K output tokens
- **Cost per analysis**: ~$0.01
- **Optimization**: Shorter prompts, reuse results

### AWS S3
- First 1GB: free
- Then: $0.023/GB/month
- **Optimization**: Delete old videos after extraction

---

## Troubleshooting Deployment

### Build Fails
```bash
# Clear cache and rebuild
npm ci
npm run build

# Check for environment variable errors
echo $ANTHROPIC_API_KEY
```

### Runtime Errors
```bash
# Check logs
# Vercel: https://vercel.com/dashboard/project-name/logs
# EC2: sudo pm2 logs clipiq

# Common issues:
# - Missing env vars → Add to dashboard
# - API key invalid → Test with curl
# - Storage permission → Check chmod
```

### Performance Issues
```bash
# Check response times
curl -w "@curl-format.txt" https://yourdomain.com/api/keywords

# Monitor resource usage
# Vercel: Built-in analytics
# EC2: htop or CloudWatch

# Identify bottleneck (usually FFmpeg or Claude)
```

---

## Next Steps After Deployment

1. **Monitor**: Set up error tracking and uptime monitoring
2. **Optimize**: Profile and optimize slowest operations
3. **Scale**: When approaching limits, implement job queue
4. **Monetize**: Add authentication and user accounts
5. **Promote**: Launch and market to users

Good luck! 🚀
