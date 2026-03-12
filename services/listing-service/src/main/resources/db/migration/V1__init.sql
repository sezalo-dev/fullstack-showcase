-- Public repository placeholder migration.
-- Internal schema and domain taxonomy removed in the public showcase version.

CREATE TABLE IF NOT EXISTS public_repo_placeholder_listing (
  id BIGSERIAL PRIMARY KEY,
  note TEXT NOT NULL
);
