-- Initialize DREAM TOOL database
\echo 'Creating database structure for DREAM TOOL...'

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE dream_tool'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dream_tool')\gexec

-- Connect to the database
\c dream_tool;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial data (optional) - disabled for basic setup

-- Create enum types
CREATE TYPE facility_type AS ENUM ('healthcare', 'education', 'community');
CREATE TYPE facility_status AS ENUM ('survey', 'design', 'installed');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

\echo 'Database initialized successfully!'

-- Note: Tables will be created by Sequelize migrations 