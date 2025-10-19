# VPS Deployment Guide for Eburon AI Chatbot
## Port 3399 Configuration

---

## 📋 Application Overview

**Eburon AI** is an advanced AI chatbot interface powered by Ollama Cloud with the following capabilities:

### Main Purpose
- **Multi-Model AI Chat Interface**: Supports 4 AI models (Emilio-120b, Emilio-flash-20b, Aquilles-V3.1, Alex-Coder)
- **Specialized Coding Agent**: Alex-Coder with continuous execution loops, tool calling, and real-time debugging
- **Voice Integration**: Speech-to-text (Deepgram) and text-to-speech (Gemini) capabilities
- **Conversation Management**: Persistent storage in Neon PostgreSQL with full history
- **Authentication System**: User management with NextAuth.js
- **Real-time Collaboration**: Redis caching for session management and performance

### Key Features
- 🤖 4 AI models with specialized capabilities
- 🛠️ Coding agent with web search, error analysis, code execution, documentation reading
- 💾 PostgreSQL database for persistence
- 🔐 Secure authentication with JWT tokens
- 🎙️ Voice transcription and synthesis
- 📊 API monitoring and benchmarking
- 📚 Swagger API documentation

---

## 🚀 VPS Deployment on Port 3399

### Prerequisites
```bash
# System Requirements
- Ubuntu 20.04+ or Debian 11+
- Node.js 20.x
- npm/pnpm
- PostgreSQL (or use Neon cloud)
- Redis (optional, can use Upstash cloud)
- Minimum 2GB RAM (4GB recommended)
- 10GB storage space
```

### Step 1: Clone and Setup

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Clone repository
cd /opt
git clone https://github.com/panyeroa1/v0-modern-ai-chatbot-interface-tem-og.git eburon-ai
cd eburon-ai

# Install dependencies
npm install
# or
pnpm install
```

### Step 2: Environment Configuration

Create production `.env` file:

```bash
nano .env
```

**Production Environment Variables:**

```env
# ===== REQUIRED FOR PRODUCTION =====

# Database - Neon PostgreSQL (Cloud)
DATABASE_URL="postgresql://neondb_owner:npg_J2bDmUHL0diw@ep-restless-unit-adqn3lt0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_URL="postgresql://neondb_owner:npg_J2bDmUHL0diw@ep-restless-unit-adqn3lt0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_J2bDmUHL0diw@ep-restless-unit-adqn3lt0.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Neon Auth (Stack Auth Integration)
NEXT_PUBLIC_STACK_PROJECT_ID=9a1ab312-d075-4eb8-aa5a-56328f47f1f6
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_19gnpxxsdk40p9h7j5kvagcj9fydxqwmdnzpbjsv04mrr
STACK_SECRET_SERVER_KEY=ssk_67h6rf6p3f1ye9e56f0nyj9r1j8fp3dxyt3hfa6nkh95g

# Ollama Cloud API (AI Models)
EBURON_API_KEY=f82c0189b839488ab14a7044bbedf7ea.8CM-5UbVI-VJQ9GgxVl55foR
EMILIOAI_API_KEY=f82c0189b839488ab14a7044bbedf7ea.8CM-5UbVI-VJQ9GgxVl55foR
OLLAMA_API_KEY=f82c0189b839488ab14a7044bbedf7ea.8CM-5UbVI-VJQ9GgxVl55foR
OLLAMA_CLOUD_API=https://ollama.com

# Authentication
NEXTAUTH_SECRET=a8f5b9c3d7e2f4a1b8c5d9e3f7a2b6c4d8e1f5a9b3c7d2e6f1a5b9c3d7e2f4a1
NEXTAUTH_URL=http://your-vps-ip:3399

# Voice Services
EBURON_STT_KEY=7baf2d84974609a0f993411423689bb91d276316
DEEPGRAM_API_KEY=7baf2d84974609a0f993411423689bb91d276316
EBURON_TTS_KEY=AIzaSyAaNK_Amo-XPdGCguWw2J630igT4GKsRzo
GEMINI_API_KEY=AIzaSyAaNK_Amo-XPdGCguWw2J630igT4GKsRzo

# Redis Cache (Upstash Cloud)
UPSTASH_REDIS_URL=https://ruling-halibut-59561.upstash.io
UPSTASH_REDIS_TOKEN=70a8dc70-5756-4e4f-ac7f-95e0b0ec943a

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_C6dNPQS87cm0WO71_DYDORm3C1YxRBF0L9Cj9iDhXerW7lD

# Production Settings
NODE_ENV=production
PORT=3399
```

### Step 3: Configure Port 3399

**Option A: Direct Port Configuration (Recommended)**

Modify `package.json` to use port 3399:

```json
{
  "scripts": {
    "dev": "next dev -p 3399",
    "build": "next build",
    "start": "next start -p 3399"
  }
}
```

**Option B: Using Environment Variable**

Add to `.env`:
```env
PORT=3399
```

**Option C: Nginx Reverse Proxy**

```nginx
# /etc/nginx/sites-available/eburon-ai
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3399;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/eburon-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Build and Deploy

```bash
# Generate Prisma Client
npx prisma generate

# Build the application
npm run build
# or with pnpm
pnpm run build

# Start production server on port 3399
npm start
# or
pnpm start
```

### Step 5: Process Manager (PM2 - Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'eburon-ai',
    script: 'npm',
    args: 'start',
    cwd: '/opt/eburon-ai',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3399
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

Start with PM2:
```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the command it outputs

# Monitor application
pm2 monit

# View logs
pm2 logs eburon-ai

# Restart application
pm2 restart eburon-ai

# Stop application
pm2 stop eburon-ai
```

### Step 6: Docker Deployment (Alternative)

**Using Docker Compose on Port 3399:**

Modify `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eburon-ai
    ports:
      - "3399:3399"  # Changed from 3000:3000
    environment:
      - NODE_ENV=production
      - PORT=3399
      - DATABASE_URL=${DATABASE_URL}
      - POSTGRES_URL=${POSTGRES_URL}
      - UPSTASH_REDIS_URL=${UPSTASH_REDIS_URL}
      - UPSTASH_REDIS_TOKEN=${UPSTASH_REDIS_TOKEN}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=http://your-vps-ip:3399
      - OLLAMA_API_KEY=${OLLAMA_API_KEY}
    restart: unless-stopped
```

Update Dockerfile for port 3399:

```dockerfile
# ... existing Dockerfile content ...

EXPOSE 3399

ENV PORT 3399
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Deploy with Docker:
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Restart
docker-compose restart app

# Stop
docker-compose down
```

---

## 👥 Team Collaboration Workflow

### Git Workflow

```bash
# Team members clone the repository
git clone https://github.com/panyeroa1/v0-modern-ai-chatbot-interface-tem-og.git
cd v0-modern-ai-chatbot-interface-tem-og

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Development Environment Setup for Team

Each team member should:

```bash
# 1. Clone repository
git clone <repo-url>

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with development credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Run development server
npm run dev
# Runs on http://localhost:3000
```

### Branch Strategy

```
main (production)
  └── staging (pre-production testing)
       └── develop (integration branch)
            ├── feature/ai-models
            ├── feature/voice-integration
            ├── feature/authentication
            └── bugfix/error-handling
```

### Deployment Pipeline

```bash
# 1. Development → Staging
git checkout staging
git merge develop
git push origin staging

# 2. Test on staging environment
# Access: http://staging.yourdomain.com:3399

# 3. Staging → Production (after approval)
git checkout main
git merge staging
git push origin main

# 4. Deploy to production VPS
ssh user@vps-ip
cd /opt/eburon-ai
git pull origin main
npm run build
pm2 restart eburon-ai
```

### Continuous Integration/Deployment

**GitHub Actions Workflow (.github/workflows/deploy.yml):**

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USER }}
        key: ${{ secrets.VPS_SSH_KEY }}
        port: 22
        script: |
          cd /opt/eburon-ai
          git pull origin main
          npm install
          npm run build
          pm2 restart eburon-ai
```

### Environment Management

**Development Team:**
```env
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

**Staging Server:**
```env
NEXTAUTH_URL=http://staging.domain.com:3399
NODE_ENV=staging
```

**Production Server:**
```env
NEXTAUTH_URL=http://your-domain.com:3399
NODE_ENV=production
```

---

## 🔥 Firewall Configuration

```bash
# Allow port 3399
sudo ufw allow 3399/tcp

# Check firewall status
sudo ufw status

# If using cloud provider, configure security groups:
# AWS: EC2 → Security Groups → Inbound Rules → Add port 3399
# DigitalOcean: Networking → Firewalls → Add port 3399
# Google Cloud: VPC → Firewall Rules → Add port 3399
```

---

## 📊 Monitoring & Logs

### Application Logs
```bash
# PM2 logs
pm2 logs eburon-ai --lines 100

# System logs
sudo journalctl -u eburon-ai -f

# Docker logs
docker-compose logs -f app
```

### Health Check Endpoint
Access: `http://your-vps-ip:3399/api/health`

### API Documentation
Access: `http://your-vps-ip:3399/api/docs`

### Monitoring Dashboard
Access: `http://your-vps-ip:3399/api/monitoring`

---

## 🛠️ Troubleshooting

### Issue: Port 3399 already in use
```bash
# Find process using port 3399
sudo lsof -i :3399

# Kill process
sudo kill -9 <PID>
```

### Issue: Database connection failed
```bash
# Test database connection
psql $DATABASE_URL

# Check Prisma schema
npx prisma db pull
npx prisma generate
```

### Issue: High memory usage
```bash
# Monitor memory
free -h

# Check PM2 memory
pm2 list

# Restart with memory limit
pm2 start ecosystem.config.js --max-memory-restart 2G
```

### Issue: Build errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords and API keys
- [ ] Enable HTTPS with SSL certificate (Let's Encrypt)
- [ ] Configure firewall (ufw/iptables)
- [ ] Set up fail2ban for SSH protection
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Backup database regularly
- [ ] Monitor application logs
- [ ] Use environment variables for secrets (never commit to Git)

---

## 📞 Support & Resources

- **GitHub Repository**: https://github.com/panyeroa1/v0-modern-ai-chatbot-interface-tem-og
- **Documentation**: See `/docs` folder
- **API Docs**: http://your-vps-ip:3399/api/docs
- **Issues**: Report on GitHub Issues

---

## 📝 Quick Commands Reference

```bash
# Start application
pm2 start eburon-ai

# Stop application
pm2 stop eburon-ai

# Restart application
pm2 restart eburon-ai

# View logs
pm2 logs eburon-ai

# Monitor
pm2 monit

# Update code
cd /opt/eburon-ai
git pull
npm install
npm run build
pm2 restart eburon-ai

# Check status
pm2 status
curl http://localhost:3399/api/health
```

---

**Deployment Completed! Access your application at:**
- Local: `http://localhost:3399`
- VPS: `http://your-vps-ip:3399`
- Domain: `http://your-domain.com:3399`
