CREATE TABLE IF NOT EXISTS creator_memberships (
  application_id TEXT PRIMARY KEY REFERENCES creator_applications(id),
  status TEXT NOT NULL CHECK (status IN ('approved', 'paid')),
  approved_at TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  stripe_session_id TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS creator_checkout_attempts (
  application_id TEXT PRIMARY KEY REFERENCES creator_memberships(application_id),
  attempt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  stripe_session_id TEXT
);
