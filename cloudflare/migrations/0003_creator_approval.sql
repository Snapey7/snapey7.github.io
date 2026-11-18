CREATE TABLE IF NOT EXISTS creator_memberships (
  application_id TEXT PRIMARY KEY REFERENCES creator_applications(id),
  status TEXT NOT NULL CHECK (status IN ('approved', 'paid')),
  approved_at TEXT NOT NULL,
  paid_at TEXT,
  stripe_session_id TEXT UNIQUE
);
