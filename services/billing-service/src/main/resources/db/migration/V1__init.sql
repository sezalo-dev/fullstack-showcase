-- Public repository placeholder migration.
-- Internal schema removed in the public showcase version.

CREATE TABLE IF NOT EXISTS public_repo_placeholder_billing (
  id BIGSERIAL PRIMARY KEY,
  note TEXT NOT NULL
);
