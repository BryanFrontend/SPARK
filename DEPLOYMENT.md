# 🚀 Deployment Guide

## Production Deployment (VPS)

### Recommended: DigitalOcean Droplet or Hetzner VPS

Minimum specs:
- 2 vCPU
- 4GB RAM
- Ubuntu 22.04+

### 1. Setup server

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone repo
git clone https://github.com/openclaw/spark-agent.git
cd spark-agent

# Install deps
npm install

# Configure environment
cp .env.example .env
nano .env  # Fill in your keys

# Build
npm run build
```

### 2. Start with PM2

```bash
# Start agent
pm2 start dist/index.js --name spark-agent

# Auto-restart on crash
pm2 startup
pm2 save

# Monitor logs
pm2 logs spark-agent
pm2 monit
```

### 3. Set up log rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

## Docker Deployment

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY .env .env
CMD ["node", "dist/index.js"]
```

```bash
docker build -t spark-agent .
docker run -d --name spark --env-file .env spark-agent
```

## Security Checklist

- [ ] Private key stored in environment variable (not in code)
- [ ] .env file has 600 permissions (`chmod 600 .env`)
- [ ] Firewall configured (only allow SSH, no inbound to agent ports)
- [ ] SSH key authentication (disable password login)
- [ ] Regular backups of `/logs/` directory
- [ ] Monitoring/alerting configured (Datadog, Grafana, etc.)

## Monitoring

### Health endpoint (optional — add express server)

```typescript
// Check agent is alive
curl http://localhost:3000/health
```

### Key metrics to monitor

- Agent loop completing successfully (check log timestamps)
- RPC connection health
- Twitter API rate limits
- Portfolio value (alert if drops >10% in 1h)
