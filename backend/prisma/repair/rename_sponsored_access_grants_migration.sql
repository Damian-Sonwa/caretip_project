-- Run once in Supabase SQL Editor if `_prisma_migrations` still records
-- `20260626120000_sponsored_access_grants` after the folder was renamed to
-- `20260624110000_sponsored_access_grants` (fixes CI ordering without re-applying DDL).
--
-- Then from backend/:
--   npx prisma migrate resolve --rolled-back 20260626120100_sponsored_access_capability_profile --schema=prisma/schema.prisma
--   npx prisma migrate deploy --schema=prisma/schema.prisma

UPDATE "_prisma_migrations"
SET migration_name = '20260624110000_sponsored_access_grants'
WHERE migration_name = '20260626120000_sponsored_access_grants';

DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260626120100_sponsored_access_capability_profile';
