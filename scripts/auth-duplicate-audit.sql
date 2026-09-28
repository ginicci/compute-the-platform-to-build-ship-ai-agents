-- Read-only Better Auth duplicate audit. Run from a database-connected environment.
-- This does not change customer data. Review every result before preparing a merge.
WITH normalized AS (
  SELECT id, email, lower(btrim(email)) AS normalized_email, "createdAt"
  FROM "user"
)
SELECT normalized_email, count(*) AS accounts, array_agg(id ORDER BY "createdAt") AS user_ids
FROM normalized
GROUP BY normalized_email
HAVING count(*) > 1
ORDER BY accounts DESC, normalized_email;

-- Also inspect case/whitespace variants without modifying them.
SELECT id, email, lower(btrim(email)) AS normalized_email, "createdAt"
FROM "user"
WHERE email <> lower(btrim(email))
ORDER BY "createdAt";

-- This audit intentionally performs no updates or deletes.
