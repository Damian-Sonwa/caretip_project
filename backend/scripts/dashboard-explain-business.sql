\set ON_ERROR_STOP on
\timing on

-- Replace before running:
-- \set business_id '...'

\echo '=== businessRowSql (business.findUnique) ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, slug, verification_status, timezone
FROM businesses
WHERE id = :'business_id';

\echo '=== rosterPulseSql (employees + User join counts) ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  COUNT(*)::int AS roster_total,
  COUNT(*) FILTER (
    WHERE e.is_active = true
      AND e.activation_status::text = 'active'
      AND u.email_verified = true
  )::int AS tipping_ready,
  COUNT(*) FILTER (
    WHERE e.slug IS NULL OR btrim(e.slug) = ''
  )::int AS missing_qr
FROM employees e
LEFT JOIN "User" u ON u.id = e.user_id
WHERE e.business_id = :'business_id';

\echo '=== goalsSql (active goals + current_amount aggregate) ==='
EXPLAIN (ANALYZE, BUFFERS)
WITH goals AS (
  SELECT
    g.id,
    g.employee_id,
    g.goal_period,
    g.start_date,
    CASE g.goal_period
      WHEN 'daily' THEN date_trunc('day', NOW())::timestamptz
      WHEN 'weekly' THEN date_trunc('day', NOW())::timestamptz - ((EXTRACT(DOW FROM NOW())::int + 6) % 7) * INTERVAL '1 day'
      ELSE date_trunc('month', NOW())::timestamptz
    END AS period_start
  FROM employee_goals g
  INNER JOIN employees e ON e.id = g.employee_id
  WHERE e.business_id = :'business_id'
    AND g.status = 'active'
  ORDER BY g.updated_at DESC
  LIMIT 25
)
SELECT
  goals.id AS goal_id,
  COALESCE(SUM(t.amount), 0)::float AS current_amount
FROM goals
LEFT JOIN tips t
  ON t.business_id = :'business_id'
 AND t.employee_id = goals.employee_id
 AND t.status = 'success'
 AND t.created_at >= GREATEST(goals.start_date, goals.period_start)
 AND t.created_at <= NOW()
 AND t.created_at >= date_trunc('month', NOW())::timestamptz
GROUP BY goals.id;

\echo '=== sqlBundle (tips CTE scan + aggregates) ==='
-- Uses last 60m + today + last 30d as a stand-in for month timeframe bounds.
EXPLAIN (ANALYZE, BUFFERS)
WITH scoped AS (
  SELECT employee_id, amount, created_at
  FROM tips
  WHERE business_id = :'business_id'
    AND status = 'success'
    AND created_at >= (NOW() - INTERVAL '30 days')
    AND created_at <= NOW()
)
SELECT
  COALESCE(SUM(amount), 0)::float AS period_amount,
  COUNT(*)::int AS period_count,
  COALESCE(SUM(amount) FILTER (WHERE created_at >= (NOW() - INTERVAL '60 minutes')), 0)::float AS last60_amount,
  COUNT(*) FILTER (WHERE created_at >= (NOW() - INTERVAL '60 minutes'))::int AS last60_count,
  COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('day', NOW()) AND created_at <= NOW()), 0)::float AS today_amount,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()) AND created_at <= NOW())::int AS today_count,
  (
    SELECT COUNT(*)::int
    FROM scoped s
    WHERE s.created_at >= (NOW() - INTERVAL '30 days')
      AND s.created_at <= NOW()
  ) AS sanity_count
FROM scoped;

