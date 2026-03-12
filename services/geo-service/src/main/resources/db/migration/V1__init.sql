-- Public repository placeholder migration.
-- Internal schema and location seed data removed in the public showcase version.

CREATE TABLE IF NOT EXISTS public_repo_placeholder_geo (
  id BIGSERIAL PRIMARY KEY,
  note TEXT NOT NULL
);
