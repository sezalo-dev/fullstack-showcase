-- Public repository placeholder migration.
-- Internal media schema removed in the public showcase version.

CREATE TABLE IF NOT EXISTS public_repo_placeholder_media (
  id BIGSERIAL PRIMARY KEY,
  note TEXT NOT NULL
);
