# DREAM TOOL Deployment Guide

This guide provides step-by-step instructions for deploying the DREAM TOOL in different environments.

## 🚀 Quick Start (Docker - Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB free disk space

### 1. Clone and Setup
```bash
git clone <repository-url>
cd DREAM_TOOL

# Make setup script executable and run it
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Deploy with Docker
```bash
# Start all services
docker-compose up --build -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432 (postgres/password123)

## 🔧 Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional)
- npm or yarn

### 1. Environment Setup
```bash
# Copy environment templates
cp backend/env.template backend/.env
cp frontend/env.template frontend/.env

# Edit the files with your settings
nano backend/.env
nano frontend/.env
```

### 2. Database Setup
```bash
# Create database
createdb dream_tool

# Install backend dependencies and run migrations
cd backend
npm install
npm run migrate

# Optional: Seed with initial data
npm run init-db
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🏭 Production Deployment

### Environment Variables (Required)
Create these environment files with production values:

**backend/.env:**
```bash
# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=dream_tool_prod

# Security
JWT_SECRET=your-very-secure-jwt-secret-at-least-32-characters
JWT_EXPIRES_IN=24h

# External APIs
WEATHER_API_KEY=your-openweather-api-key
NREL_API_KEY=your-nrel-api-key
KOBOTOOLBOX_API_KEY=your-kobo-api-key
KOBOTOOLBOX_USERNAME=your-kobo-username
WHATSAPP_API_TOKEN=your-whatsapp-token

# Email
EMAIL_USER=your-smtp-user
EMAIL_PASSWORD=your-smtp-password

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
```

**frontend/.env:**
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_ENV=production
```

### Docker Production Setup
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up --build -d

# Or use provided production compose file
cp docker-compose.yml docker-compose.prod.yml
# Edit docker-compose.prod.yml for production settings
```

### Manual Production Deployment
```bash
# Backend
cd backend
npm ci --only=production
npm run build
npm start

# Frontend (build and serve with nginx)
cd frontend
npm ci
npm run build
# Copy dist/ folder to your web server
```

## 🔒 Security Checklist

### Before Production:
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewalls and security groups
- [ ] Set up proper backup procedures
- [ ] Enable database encryption
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Review and update CORS settings
- [ ] Scan for vulnerabilities

### API Keys Required:
- **OpenWeatherMap**: For weather data (optional)
- **NREL**: For solar radiation data (optional)
- **KoboToolbox**: For survey integration (optional)
- **WhatsApp Business**: For chatbot (optional)

## 📊 Health Checks

### Check Application Health
```bash
# Backend health
curl http://localhost:3001/health

# Database connection
docker-compose exec postgres pg_isready

# Redis connection
docker-compose exec redis redis-cli ping
```

### Monitoring Endpoints
- `GET /health` - Application health
- `GET /api/auth/status` - Authentication service
- `GET /api/survey/health` - Survey service health

## 🐛 Troubleshooting

### Common Issues:

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :3001
lsof -i :5173
lsof -i :5432
```

**Database connection issues:**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up postgres
```

**Build failures:**
```bash
# Clear Docker cache
docker system prune -f
docker-compose build --no-cache
```

**Permission issues:**
```bash
# Fix permissions
sudo chown -R $(id -u):$(id -g) .
```

## 🔄 Updates and Maintenance

### Update Application:
```bash
git pull origin main
docker-compose down
docker-compose up --build -d
```

### Database Backup:
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres dream_tool > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres dream_tool < backup.sql
```

### Log Management:
```bash
# View logs
docker-compose logs --tail=100 -f backend

# Rotate logs
docker-compose down
docker system prune -f
docker-compose up -d
```

## 🚨 Emergency Procedures

### Quick Recovery:
```bash
# Stop all services
docker-compose down

# Clean reset
docker-compose down -v
docker system prune -f
./scripts/setup.sh
docker-compose up --build -d
```

### Rollback:
```bash
git checkout <previous-commit>
docker-compose up --build -d
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment configuration
4. Check external service connectivity

Remember to never commit sensitive environment variables to version control! 