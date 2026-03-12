-- Public repository placeholder migration.
-- Internal messaging schema removed in the public showcase version.

CREATE TABLE IF NOT EXISTS public_repo_placeholder_messaging (
  id BIGSERIAL PRIMARY KEY,
  note TEXT NOT NULL
);
