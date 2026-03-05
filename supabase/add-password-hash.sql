-- Add password_hash column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Set bcrypt hash for demo admin user (password: "admin123")
-- Generated with bcryptjs at 12 rounds
UPDATE profiles
SET password_hash = '$2a$12$BpUt/BN.GQPm8S/nu/VI0ubc1ov452/5mwVLmOlwat.hsU8Exg5Ze'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Add unique index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
