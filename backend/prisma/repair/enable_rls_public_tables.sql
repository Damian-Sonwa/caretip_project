-- Enable RLS on all CareTip application tables (PostgREST anon/authenticated bypass prevention).
-- Run in Supabase SQL Editor when audit reports RLS disabled.
-- Prisma/pooler `postgres` role bypasses RLS by default — app continues to work.
-- No permissive policies for anon/authenticated: default deny via RLS with zero policies.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'User',
    'user_settings',
    'push_device_tokens',
    'notifications',
    'announcements',
    'support_tickets',
    'support_ticket_messages',
    'refresh_tokens',
    'password_reset_tokens',
    'email_verification_tokens',
    'employee_activation_tokens',
    'audit_logs',
    'stripe_webhook_events',
    'businesses',
    'employee_invites',
    'employee_invite_redemptions',
    'locations',
    'venue_tables',
    '_EmployeeTableAssignments',
    'employees',
    'employee_goals',
    'tips',
    'tip_feedback'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Verify (expect rls_enabled = true for all rows):
-- SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
-- FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1;
