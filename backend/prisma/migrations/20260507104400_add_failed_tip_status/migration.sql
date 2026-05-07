-- Add 'failed' to TipStatus enum (safe, additive).
-- This enables accurate platform analytics & tip filtering in production.

ALTER TYPE "public"."TipStatus" ADD VALUE IF NOT EXISTS 'failed';

