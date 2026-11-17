CREATE TABLE IF NOT EXISTS creator_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  portfolio_url TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS creator_applications_created_at ON creator_applications(created_at DESC);
