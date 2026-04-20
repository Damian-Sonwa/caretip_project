# Database Migrations

Run migrations against your PostgreSQL database in order.

## 001_add_invite_code_to_businesses.sql

Adds `invite_code` and `invite_code_expires_at` to the `businesses` table for the Generate Invite Code feature.

**Columns:**
- `invite_code` VARCHAR(6) UNIQUE – 6-digit code for staff signup
- `invite_code_expires_at` TIMESTAMP – when the code expires

**Run with psql:**
```bash
psql -U your_user -d your_database -f migrations/001_add_invite_code_to_businesses.sql
```
