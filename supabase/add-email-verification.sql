-- Add email verification fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamptz;

-- Mark demo admin as verified (already active user)
UPDATE profiles SET email_verified = true WHERE id = '00000000-0000-0000-0000-000000000001';

-- Create index for token lookup during verification
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);
