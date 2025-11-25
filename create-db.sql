-- Create database for 2Square Backend
-- Run this script using: psql -U postgres -f create-db.sql

-- Create the database
CREATE DATABASE 2square_db;

-- Connect to the new database
\c 2square_db

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: After running this script, run: npm run db:init
-- to create all the tables and schema

