# DREAM TOOL - Solar PV System Management Platform

A comprehensive web application for techno-economic assessment and asset management of solar PV systems for healthcare and productive use facilities.

## ✨ Features

- 🔧 **Techno-Economic Analysis** - Solar PV system sizing, battery optimization, ROI calculations
- 📊 **Asset Management** - Equipment tracking, maintenance scheduling, performance monitoring  
- 🌤️ **Weather Integration** - Multi-provider weather data with fallback support
- 📱 **Survey Management** - KoboToolbox/ODK integration for field data collection
- 💬 **WhatsApp Integration** - Chatbot for communication and maintenance alerts
- 🔐 **Security** - JWT authentication, role-based access control, 2FA support
- 📈 **Analytics & Reporting** - Performance dashboards, energy analytics
- 🗺️ **Portfolio Management** - Multi-site analysis and management

## 🚀 Quick Start (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum

### 1. Clone and Setup
```bash
git clone <repository-url>
cd DREAM_TOOL

# Make setup script executable
chmod +x scripts/setup.sh

# Run setup (creates environment files and installs dependencies)
./scripts/setup.sh
```

### 2. Deploy with Docker
```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build

# Or run in background
docker-compose up --build -d

# Check status
docker-compose ps
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api  
- **Health Check**: http://localhost:3001/health

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Environment Configuration
```bash
# Copy templates and edit with your settings
cp backend/env.template backend/.env
cp frontend/env.template frontend/.env

# Edit the environment files
nano backend/.env  # Update database credentials, API keys
nano frontend/.env # Update API URL
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 3. Database Setup
```bash
# Create database
createdb dream_tool

# Run migrations
cd backend
npm run migrate

# Optional: Initialize with sample data
npm run init-db
```

### 4. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend  
npm run dev
```

## 📦 Technology Stack

### Backend
- **Runtime**: Node.js 18+, TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Caching**: Redis
- **Authentication**: JWT, Speakeasy (2FA)
- **Security**: Helmet, CORS, Rate limiting

### Frontend  
- **Framework**: React 18, TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **Charts**: Recharts, ApexCharts
- **Maps**: Leaflet

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (production)
- **Process Management**: PM2 (recommended)

## 🔑 Required API Keys (Optional)

The application works without these APIs but functionality will be limited:

- **OpenWeatherMap**: Weather data integration
- **NREL**: Solar radiation data  
- **KoboToolbox**: Survey data collection
- **WhatsApp Business**: Chatbot functionality

Add these to your `backend/.env` file when available.

## 🔧 Available Scripts

### Backend
```bash
npm run dev          # Development server with hot reload
npm run build        # Build TypeScript to JavaScript  
npm run start        # Production server
npm run migrate      # Run database migrations
npm run init-db      # Initialize database with sample data
npm run test         # Run tests
```

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
```

### Docker
```bash
docker-compose up --build    # Build and start all services
docker-compose down          # Stop all services
docker-compose logs backend  # View backend logs
docker-compose ps            # Check service status
```

## 🏗️ Project Structure

```
DREAM_TOOL/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, security, etc.
│   │   ├── services/        # Business logic
│   │   └── config/          # Configuration
│   ├── migrations/          # Database migrations
│   └── package.json
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API clients
│   │   ├── contexts/        # React contexts
│   │   └── types/           # TypeScript types
│   └── package.json
├── scripts/                 # Deployment scripts
├── docker-compose.yml       # Docker configuration
└── DEPLOYMENT.md           # Detailed deployment guide
```

## 🐛 Troubleshooting

### Common Issues

**Port Conflicts:**
```bash
# Check what's using ports
lsof -i :3001 :5173 :5432

# Kill processes if needed
kill $(lsof -t -i:3001)
```

**Database Connection:**
```bash
# Check PostgreSQL status
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up postgres -d
```

**Permission Errors:**
```bash
# Fix file permissions
sudo chown -R $(id -u):$(id -g) .
chmod +x scripts/setup.sh
```

**Build Failures:**
```bash
# Clear caches
docker system prune -f
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🔒 Security Notes

### Development vs Production

⚠️ **The current configuration is for DEVELOPMENT only**

**Before deploying to production:**
- Change all default passwords
- Use strong JWT secrets (32+ characters)  
- Enable HTTPS/SSL certificates
- Configure proper firewalls
- Set up database backups
- Enable monitoring and logging
- Review CORS and security headers

See `DEPLOYMENT.md` for complete production setup guide.

## 📊 Health Monitoring

### Health Check Endpoints
- `GET /health` - Application health
- `GET /api/auth/status` - Authentication service
- `GET /api/facilities` - Database connectivity

### Docker Health Checks
```bash
# Check all services
docker-compose ps

# Individual service health
docker-compose exec backend curl http://localhost:3001/health
docker-compose exec postgres pg_isready
docker-compose exec redis redis-cli ping
```

## 🚀 Deployment

For production deployment, see the comprehensive `DEPLOYMENT.md` guide which covers:
- Production environment setup
- Security hardening  
- SSL/HTTPS configuration
- Database backup strategies
- Monitoring and logging
- Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review `DEPLOYMENT.md` for deployment issues
3. Check application logs: `docker-compose logs`
4. Verify environment configuration

---

**Ready to get started?** Run `./scripts/setup.sh` and then `docker-compose up --build`! 🎉
