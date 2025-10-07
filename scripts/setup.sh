#!/bin/bash

echo "🚀 Setting up DREAM TOOL for development..."

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 18+"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Please install npm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Please install Docker"; exit 1; }

# Create environment files from templates
echo "📝 Creating environment files..."

if [ ! -f backend/.env ]; then
    cp backend/env.template backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "⚠️  backend/.env already exists, skipping..."
fi

if [ ! -f frontend/.env ]; then
    cp frontend/env.template frontend/.env
    echo "✅ Created frontend/.env from template"
else
    echo "⚠️  frontend/.env already exists, skipping..."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Check if PostgreSQL is running (for local development)
echo "🐘 Checking PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo "✅ PostgreSQL is running"
    else
        echo "⚠️  PostgreSQL is not running. You can either:"
        echo "   1. Start PostgreSQL locally"
        echo "   2. Use Docker: docker-compose up postgres"
    fi
else
    echo "⚠️  PostgreSQL not found locally. Using Docker is recommended."
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "For Docker deployment:"
echo "  docker-compose up --build"
echo ""
echo "For local development:"
echo "  1. Start PostgreSQL (if not using Docker)"
echo "  2. Backend: cd backend && npm run dev"
echo "  3. Frontend: cd frontend && npm run dev"
echo ""
echo "The application will be available at:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:3001"
echo ""
echo "⚠️  Remember to:"
echo "  - Update environment variables with real API keys"
echo "  - Change default passwords in production"
echo "  - Set up proper SSL certificates for production" 