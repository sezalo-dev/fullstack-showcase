#!/usr/bin/env bash
set -euo pipefail

# Executed by postgres entrypoint during first init (before migrate.sh).
# Ensure supabase_admin exists with the same password as POSTGRES_PASSWORD.
ESCAPED_POSTGRES_PASSWORD="$(printf "%s" "${POSTGRES_PASSWORD}" | sed "s/'/''/g")"

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<SQL
DO \$do\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    EXECUTE 'CREATE ROLE supabase_admin WITH LOGIN SUPERUSER PASSWORD ''${ESCAPED_POSTGRES_PASSWORD}''';
  ELSE
    EXECUTE 'ALTER ROLE supabase_admin WITH LOGIN SUPERUSER PASSWORD ''${ESCAPED_POSTGRES_PASSWORD}''';
  END IF;
END
\$do\$;

CREATE EXTENSION IF NOT EXISTS postgis;
SQL
