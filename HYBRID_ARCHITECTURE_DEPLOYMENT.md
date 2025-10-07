# DREAM Tool Hybrid Architecture - Deployment Guide

## 🎯 Overview

This guide covers the complete deployment of the DREAM Tool hybrid architecture, combining TypeScript/Node.js backend with Python microservices for advanced scientific computing and analytics.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Nginx Gateway  │    │   TypeScript    │
│   (React)       │◄──►│   (Port 80)     │◄──►│   Backend       │
│   Port 5173     │    │                 │    │   Port 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Python Services│
                       │   Port 8000     │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Port 5432     │
                       └─────────────────┘
```

## 🚀 Quick Start Deployment

### Prerequisites
- Docker and Docker Compose installed
- Git repository cloned
- Environment variables configured

### 1. Environment Setup

Create environment files:

```bash
# Main environment
cp .env.example .env

# Python services environment
cp python-services/.env.example python-services/.env
```

Update environment variables:

```bash
# .env
DATABASE_URL=postgresql://postgres:password123@postgres:5432/dream_tool
JWT_SECRET=your-super-secret-jwt-key-here
REDIS_URL=redis://redis:6379/0

# python-services/.env
DATABASE_URL=postgresql://postgres:password123@postgres:5432/dream_tool
JWT_SECRET=your-super-secret-jwt-key-here
BACKEND_URL=http://backend:3001
PYTHON_SERVICE_PORT=8000
```

### 2. Build and Deploy

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

### 3. Verify Deployment

```bash
# Check nginx gateway
curl http://localhost/health

# Check TypeScript backend
curl http://localhost/api/health

# Check Python services
curl http://localhost/api/python/energy/health
curl http://localhost/api/python/mcda/health

# Access frontend
open http://localhost
```

## 📋 Service Configuration

### TypeScript Backend (Port 3001)
- **Purpose**: Core web API, authentication, CRUD operations
- **Routes**: `/api/*` (except `/api/python/*`)
- **Features**: User management, surveys, facilities, basic energy analysis
- **Database**: PostgreSQL (shared with Python services)

### Python Services (Port 8000)
- **Purpose**: Advanced scientific computing and analytics
- **Routes**: `/api/python/*`
- **Features**: 
  - Advanced energy analysis with NumPy/SciPy
  - Enhanced MCDA with uncertainty analysis
  - Machine learning recommendations
  - Statistical analysis and optimization

### Nginx Gateway (Port 80)
- **Purpose**: API gateway, load balancing, caching
- **Configuration**: Routes requests based on path
- **Features**:
  - Rate limiting
  - Response caching
  - SSL termination (production)
  - Health checks

### Frontend (Port 5173)
- **Purpose**: React user interface
- **Features**: 
  - Hybrid service integration
  - Enhanced energy analysis components
  - Advanced MCDA interfaces
  - Real-time analytics dashboards

## 🔧 Production Deployment

### 1. SSL Configuration

Update `nginx/nginx.conf` for HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # ... rest of configuration
}
```

### 2. Environment Variables

Production environment variables:

```bash
# .env (production)
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db-host:5432/dream_tool
JWT_SECRET=super-secure-production-key
REDIS_URL=redis://redis-host:6379/0

# python-services/.env (production)
DATABASE_URL=postgresql://user:password@db-host:5432/dream_tool
JWT_SECRET=super-secure-production-key
BACKEND_URL=https://your-domain.com/api
LOG_LEVEL=INFO
MAX_WORKERS=4
```

### 3. Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_cache:/var/cache/nginx
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    deploy:
      replicas: 2

  python-services:
    build:
      context: ./python-services
      dockerfile: Dockerfile
    environment:
      - LOG_LEVEL=INFO
      - MAX_WORKERS=4
    restart: unless-stopped
    deploy:
      replicas: 2

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=dream_tool
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
  nginx_cache:
```

### 4. Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying DREAM Tool Hybrid Architecture..."

# Pull latest code
git pull origin main

# Build services
echo "📦 Building services..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Start new services
echo "▶️ Starting new services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🏥 Performing health checks..."
curl -f http://localhost/health || exit 1
curl -f http://localhost/api/health || exit 1
curl -f http://localhost/api/python/energy/health || exit 1
curl -f http://localhost/api/python/mcda/health || exit 1

echo "✅ Deployment completed successfully!"
```

## 📊 Monitoring and Logging

### 1. Health Check Endpoints

```bash
# System health
GET /health

# TypeScript backend health
GET /api/health

# Python energy service health
GET /api/python/energy/health

# Python MCDA service health
GET /api/python/mcda/health
```

### 2. Logging Configuration

```yaml
# docker-compose.yml logging
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  python-services:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. Monitoring Stack (Optional)

```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

## 🧪 Testing

### 1. Unit Tests

```bash
# TypeScript backend tests
cd backend
npm test

# Python services tests
cd python-services
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

### 2. Integration Tests

```bash
# API integration tests
cd tests/integration
python test_api_integration.py

# End-to-end tests
cd tests/e2e
npm run test:e2e
```

### 3. Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run tests/load/api-load-test.yml
```

## 🔒 Security Considerations

### 1. Authentication
- JWT tokens shared between TypeScript and Python services
- Token validation in both services
- Secure token storage in frontend

### 2. API Security
- Rate limiting in nginx
- Input validation in both services
- CORS configuration
- SQL injection prevention

### 3. Network Security
- Internal service communication
- SSL/TLS encryption
- Firewall configuration
- Container isolation

## 📈 Performance Optimization

### 1. Caching Strategy
- Nginx response caching
- Redis for session storage
- Database query optimization
- Frontend asset caching

### 2. Load Balancing
- Multiple backend replicas
- Multiple Python service replicas
- Database connection pooling
- Horizontal scaling

### 3. Resource Management
- Container resource limits
- Database connection limits
- Python worker processes
- Memory optimization

## 🚨 Troubleshooting

### Common Issues

#### 1. Service Communication Errors
```bash
# Check service connectivity
docker-compose exec backend ping python-services
docker-compose exec python-services ping backend

# Check logs
docker-compose logs backend
docker-compose logs python-services
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check connection from services
docker-compose exec backend npm run db:test
docker-compose exec python-services python -c "from core.database import test_connection; test_connection()"
```

#### 3. Authentication Problems
```bash
# Verify JWT secret consistency
grep JWT_SECRET .env
grep JWT_SECRET python-services/.env

# Test token validation
curl -H "Authorization: Bearer <token>" http://localhost/api/protected
curl -H "Authorization: Bearer <token>" http://localhost/api/python/energy/health
```

#### 4. Performance Issues
```bash
# Monitor resource usage
docker stats

# Check service response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/api/health
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/api/python/energy/health
```

## 📚 API Documentation

### TypeScript Backend APIs
- Swagger UI: `http://localhost/api/docs` (if configured)
- Postman collection: `docs/api/typescript-backend.postman.json`

### Python Services APIs
- FastAPI docs: `http://localhost/docs`
- OpenAPI spec: `http://localhost/openapi.json`

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres dream_tool > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres dream_tool < backup.sql
```

### Configuration Backup
```bash
# Backup configuration
tar -czf config-backup.tar.gz .env python-services/.env nginx/nginx.conf
```

## 📞 Support

For issues and questions:
1. Check logs: `docker-compose logs [service-name]`
2. Review health endpoints
3. Consult troubleshooting section
4. Check GitHub issues
5. Contact development team

---

## 🎉 Conclusion

The DREAM Tool hybrid architecture provides:
- ✅ Best-of-both-worlds: TypeScript for web APIs, Python for scientific computing
- ✅ Scalable microservices architecture
- ✅ Advanced analytics capabilities
- ✅ Production-ready deployment
- ✅ Comprehensive monitoring and testing

The system is now ready for production deployment with enhanced energy analysis and MCDA capabilities powered by Python's scientific computing ecosystem!
