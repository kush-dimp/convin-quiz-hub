# Database Setup for Authentication

## Required: Run These Migrations

The quiz platform now requires password-based authentication for all users. You must run these SQL commands in Neon to add the required columns.

### Step 1: Add Password Hash Column
Run this in your **Neon SQL Editor** (https://console.neon.tech/):

```sql
-- Add password_hash column for bcrypt hashes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Create index for faster email lookups during login
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

### Step 2: Add Email Verification Columns
```sql
-- Add email verification fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamptz;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);
```

### Step 3: Set Password for Demo Admin
```sql
-- Set bcrypt hash for demo admin (password: "admin123")
-- Hash generated with bcryptjs at 12 rounds
UPDATE profiles
SET password_hash = '$2a$12$BpUt/BN.GQPm8S/nu/VI0ubc1ov452/5mwVLmOlwat.hsU8Exg5Ze',
    email_verified = true
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## ✅ Verification

After running the migrations:

1. **Check columns exist:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles'
   ORDER BY ordinal_position;
   ```
   Should see: `password_hash`, `email_verified`, `verification_token`, `verification_token_expires_at`

2. **Check demo admin can login:**
   - Visit app login page
   - Email: `admin@demo.local`
   - Password: `admin123`

---

## 🚀 User Creation Workflow

### Creating Users via Dashboard
1. Click **Add User** button
2. Fill in:
   - **Full Name** (required)
   - **Email** (required, must be unique)
   - **Password** (required - this is what they'll use to login)
   - **Role** (select from dropdown)
   - **Department** (optional)
3. Click **Create User**

✅ User can immediately login with email + password

### Bulk Import from CSV
1. Prepare CSV with columns: `name`, `email`, `role`, `department`
2. Note: CSV import does NOT include password yet. Users created via CSV must have password set via Edit modal
3. After import, click **Edit** on each user to set password

### Editing User & Changing Password
1. Click **Edit** button on user row
2. To change password:
   - Enter **New Password**
   - Confirm in **Confirm Password**
   - Click **Save**
3. User can login with new password immediately

---

## 🔐 How Login Works

1. **User enters email + password** on login page
2. **Backend validates:**
   - Finds user by email
   - Uses bcryptjs to compare password against hashed `password_hash`
3. **If valid:**
   - Signs JWT token
   - Sets httpOnly cookie (not accessible from JavaScript)
   - User is logged in
4. **If invalid:**
   - Returns "Invalid credentials" error
   - User must retry

---

## ⚠️ Important Notes

- **Passwords are NEVER stored in plain text** — only bcrypt hashes (12 rounds)
- **Passwords are hashed when:**
  - User is created via Add User form
  - Admin changes password via Edit modal
  - User signs up (if signup is enabled)
- **CSV bulk import does not include passwords** — use Edit modal after import
- **Email verification is optional** — users can login even if email not verified (but can be required via settings later)

---

## 🐛 Troubleshooting

### "Invalid credentials" on login
- Check that `password_hash` column exists (see Verification above)
- Verify password was set when user was created
- For existing users without `password_hash`, admin must set password via Edit modal

### User created but can't login
- Did you set a password when creating the user? (required field)
- Check that the password was hashed correctly by looking at API response

### Forgot password recovery
Currently not implemented. Admin must:
1. Go to Users page
2. Click Edit on user
3. Set a new password
4. Share new password with user

---

## 📝 Schema Changes Summary

| Column | Type | Purpose |
|--------|------|---------|
| `password_hash` | text | bcrypt hash of user's password (12 rounds) |
| `email_verified` | boolean | Whether user verified their email |
| `verification_token` | text | Token for email verification links |
| `verification_token_expires_at` | timestamptz | When verification token expires |

All columns are safe to add (use `IF NOT EXISTS`).
