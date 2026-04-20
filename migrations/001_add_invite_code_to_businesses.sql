-- Migration: Add invite code columns to businesses table for staff signup
-- Run this against your PostgreSQL database

-- Add columns if businesses table exists
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(6) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_code_expires_at TIMESTAMP;

-- Create index for fast lookup by invite_code (used during employee signup)
CREATE INDEX IF NOT EXISTS idx_businesses_invite_code 
  ON businesses(invite_code) 
  WHERE invite_code IS NOT NULL;

-- Example: If businesses table doesn't exist yet, use this schema:
/*
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  invite_code VARCHAR(6) UNIQUE,
  invite_code_expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_businesses_invite_code 
  ON businesses(invite_code) 
  WHERE invite_code IS NOT NULL;
*/
