# JWT + RBAC Auth Implementation — Setup Guide

## ✅ Completed Implementation

The quiz-platform now uses JWT-based authentication with role-based access control (RBAC). All hardcoded auth has been removed.

### New Features
- **JWT Authentication**: httpOnly cookies, 7-day expiration
- **Password Hashing**: bcryptjs with 12 rounds
- **Role-Based Access Control**: Sidebar and route protection based on user roles
- **Complete Auth Flow**: Login, signup, logout, session verification

---

## 🔑 Environment Variables

### Required in Vercel + `.env.local`
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
DATABASE_URL=postgresql://...  (already set)
```

⚠️ **IMPORTANT**: Change `JWT_SECRET` to a random 32+ character string before production deployment.

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `api/_jwt.js` | JWT signing/verification utilities |
| `api/_middleware.js` | Cookie extraction & token verification |
| `supabase/add-password-hash.sql` | DB migration (add `password_hash` column) |
| `scripts/generate-hash.js` | Hash generator for passwords |
| `AUTH_SETUP.md` | This file |

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `package.json` | Added `jsonwebtoken` ^8.5.1, `bcryptjs` ^2.4.3 |
| `vercel.json` | Added `/api/auth/:sub+` rewrite |
| `api/auth.js` | Complete rewrite: login/logout/register/me endpoints |
| `src/contexts/AuthContext.jsx` | Full rewrite: JWT cookie-based auth, `credentials: 'include'` |
| `src/App.jsx` | Updated `ProtectedRoute` with role-based protection |
| `src/components/Layout.jsx` | Added role-filtered sidebar navigation |

---

## 🔐 API Endpoints

All routes go through `/api/auth/:sub`:

### `GET /api/auth/me`
Verify JWT from cookie → return user
```json
// Success (200)
{ "user": { "id": "...", "name": "...", "email": "...", "role": "..." } }

// Unauthorized (401)
{ "error": "Unauthorized" }
```

### `POST /api/auth/login`
Verify password with bcrypt → sign JWT → set httpOnly cookie
```json
// Request
{ "email": "admin@demo.local", "password": "admin123" }

// Success (200) — also sets auth_token cookie
{ "user": { "id": "...", "name": "...", "email": "...", "role": "..." } }

// Invalid (401)
{ "error": "Invalid credentials" }
```

### `POST /api/auth/register`
Hash password → create profile → sign JWT
```json
// Request
{ "email": "student@example.com", "password": "password123", "name": "John Doe" }

// Success (201) — also sets auth_token cookie
{ "user": { "id": "...", "name": "...", "email": "...", "role": "student" } }
```

### `POST /api/auth/logout`
Clear cookie
```json
// Success (200)
{ "message": "Logged out" }
```

---

## 🗄️ Database Migration Steps

1. **Copy SQL** from `supabase/add-password-hash.sql`
2. **Open Neon SQL Editor** → https://console.neon.tech/
3. **Run the migration**:
   - Adds `password_hash` column to `profiles` table
   - Sets bcrypt hash for demo admin (id: `00000000-0000-0000-0000-000000000001`, email: `admin@demo.local`, password: `admin123`)
   - Creates index on `email` for fast lookups

4. **For other existing users** (if any): Generate bcrypt hashes and update manually:
   ```bash
   node scripts/generate-hash.js  # or update and run for each user
   ```

---

## 👥 Role-Based Sidebar & Routes

### Sidebar Navigation Items (Filtered by Role)

**All roles** can see:
- My Quizzes, Assignments, Notifications, Certificates

**`super_admin`, `admin`, `instructor` & `reviewer`** can see:
- Results, Analytics, User Progress

**`super_admin`, `admin`, `instructor` only**:
- Templates, Question Bank, Question Analysis, Live Session

**`super_admin`, `admin`, `reviewer` only**:
- Grade Book, Reports

**`super_admin`, `admin` only**:
- All Users, Cheat Detection, Audit Logs, Admin Dashboard

**`super_admin` only**:
- Roles & Permissions

Groups with zero items are hidden completely.

### Route Protection

Routes requiring specific roles will redirect to `/` if user lacks permission:
- `/users`, `/admin`, `/audit-logs`, `/cheat-detection` → `super_admin`, `admin`
- `/grade-book` → `super_admin`, `admin`, `reviewer`
- `/roles` → `super_admin`
- `/live` → `super_admin`, `admin`, `instructor`

---

## 🧪 Local Testing (npm run dev + Vercel dev)

### Verify JWT Implementation
1. **Start dev**: `npm run dev` (Vite) + `vercel dev` (serverless)
2. **Visit**: `http://localhost:3000`
   - Redirects to `/login` (no auth cookie)
3. **Login**: Email `admin@demo.local`, password `admin123`
   - ✅ JWT cookie set (`auth_token`)
   - ✅ Sidebar shows all admin items
   - ✅ Redirected to `/`
4. **Logout**: Click logout button
   - ✅ Cookie cleared
   - ✅ Redirected to `/login`
5. **Signup**: Create new account
   - ✅ Password hashed with bcryptjs
   - ✅ User created with `role: 'student'`
   - ✅ Auto-logged in
6. **Verify sidebar filtering**:
   - Student role should NOT see: Templates, Question Bank, Admin Dashboard, Users, Cheat Detection, Audit Logs, Roles & Permissions
   - Admin role should see everything
7. **Route protection**:
   - Visit `/users` as student → redirects to `/`
   - Visit `/users` as admin → loads page

### Verify Cookie Properties
Open DevTools → Application → Cookies:
- `auth_token` exists
- ✅ `HttpOnly` (not accessible from JS)
- ✅ `Secure` (HTTPS only in production)
- ✅ `SameSite=Lax` (CSRF protection)
- ✅ `Path=/` (all routes)
- ✅ `Max-Age=604800` (7 days)

---

## 🚀 Deployment Steps

### 1. Set JWT_SECRET in Vercel
```bash
vercel env add JWT_SECRET
# Enter: your-random-32+-char-secret
```

### 2. Run Database Migration
- Open Neon SQL editor
- Paste & run `supabase/add-password-hash.sql`

### 3. Deploy
```bash
git add .
git commit -m "feat: implement JWT + RBAC authentication"
git push  # triggers Vercel auto-deploy
```

### 4. Verify Live
- Visit `https://quiz-platform-mauve.vercel.app`
- Test login with demo admin credentials
- Check sidebar & route filtering

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcryptjs (12 rounds)
- [x] JWT signed with secret (env var)
- [x] Cookies httpOnly (not JS-accessible)
- [x] Cookies Secure (HTTPS-only in production)
- [x] Cookies SameSite=Lax (CSRF protection)
- [x] Routes protected by role
- [x] No hardcoded passwords
- [x] JWT expires in 7 days
- [ ] Change JWT_SECRET before production
- [ ] Set other users' password hashes before they log in

---

## ⚠️ Known Limitations

- **No email verification**: Signup creates account immediately
- **No password reset**: Admin must manually reset via SQL if user forgets
- **No OAuth/SSO**: Only username/password auth

---

## 🐛 Troubleshooting

### "JWT_SECRET is required" error
- Add `JWT_SECRET` to `.env.local`
- Restart `npm run dev`

### Login fails with "Invalid credentials"
- Check demo admin user exists in `profiles` table
- Verify `password_hash` was set correctly in migration
- Run `node scripts/generate-hash.js` to double-check hash

### Unauthorized 401 on protected routes
- Check `auth_token` cookie exists in DevTools
- Verify cookie is sent with `credentials: 'include'`
- Check JWT_SECRET matches between client & server

### Sidebar items missing
- Verify user's role is set correctly in `profiles`
- Check role exists in `user_role` enum
- See "Role-Based Sidebar & Routes" section above

---

## 📚 Files for Reference

- **Schema**: `supabase/neon-schema.sql` (profiles table)
- **Demo hash generator**: `scripts/generate-hash.js`
- **Migration SQL**: `supabase/add-password-hash.sql`
