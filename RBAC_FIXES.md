# RBAC & Quiz Access System Fixes

## Summary of Changes

### 1. Session & Auth (API)

**File:** `api/auth.js`
- ✅ Fetch permissions from `role_permissions` table for each role
- ✅ Include permissions array in JWT token
- ✅ Return permissions in login response
- ✅ Fetch fresh permissions in `/api/auth/me` (may be updated since JWT issued)

**File:** `src/contexts/AuthContext.jsx`
- ✅ Store `permissions` array in user object
- ✅ Expose `permissions` in AuthContext for components

### 2. Login Redirect by Role

**File:** `src/pages/Login.jsx`
- ✅ super_admin/admin → `/admin`
- ✅ instructor/reviewer → `/`
- ✅ student → `/learn` (NEW)
- ✅ guest → `/login` (blocked)

### 3. Route Guards

**File:** `src/App.jsx`
- ✅ Students redirected away from admin dashboard (`requireDashboard` routes)
- ✅ Students redirected to `/learn` on unauthorized access
- ✅ Added role check in ProtectedRoute

### 4. Student Learning Area (NEW)

**File:** `src/components/StudentLayout.jsx`
- ✅ Simplified sidebar for students (Learning section only)
- ✅ Navigation: My Quizzes, Results, Certificates
- ✅ Separate collapse state from admin layout

**File:** `src/pages/LearnerPortal.jsx`
- ✅ Displays assigned quizzes to student
- ✅ Fetches from `/api/assignments` by user_id
- ✅ Shows quiz cards for attempting

**File:** `src/App.jsx` (Routes)
- ✅ `/learn` routes under StudentLayout (protected for students only)
- ✅ Sub-routes: `/learn`, `/learn/results`, `/learn/certificates`

### 5. API Permission Protection

**File:** `api/_middleware.js`
- ✅ Added `requirePermission()` middleware function
- ✅ Checks `user.permissions` array against required permissions

**File:** `api/quizzes.js`
- ✅ POST (create quiz): requires `quiz_create` permission
- ✅ PATCH (edit quiz): requires `quiz_edit` or `quiz_create` permission
- ✅ Only super_admin, admin, instructor can create/edit
- ✅ Sets `instructor_id` to authenticated user (not DEMO_USER_ID)

**File:** `api/users.js`
- ✅ POST (create user): requires `users_manage` permission
- ✅ PUT (update user): self-update allowed, admin update requires `users_manage`
- ✅ Only super_admin/admin can change role/status

**File:** `api/results.js`
- ✅ POST (create attempt): students can only attempt assigned quizzes
- ✅ Check assignments (all/user/group) for quiz access
- ✅ Non-students (admin, instructor) can attempt any quiz

### 6. Security Model

#### Admin Routes (requireDashboard = true)
Students automatically redirected to `/learn`:
- /dashboard → AdminDashboard
- /users → BulkUsers
- /quiz-builder → QuizEditor
- /analytics → AnalyticsDashboard
- /certificates/manage → CertificateBuilder

#### Student Routes
- /learn → LearnerPortal (assigned quizzes)
- /learn/results → ResultsDashboard (student's results)
- /learn/certificates → CertificatesPage

#### Shared Routes
- /quiz/:id/take → QuizTaker (protected for all, checked in results API)
- /notifications → NotificationCenter

## Database

Uses existing tables:
- `role_permissions` - role → permission mapping
- `role_settings` - role → dashboard_access flag
- `assignments` - quiz → user/group assignment
- `quiz_attempts` - attempt history

## Permission Model

Permissions checked before admin operations:
- `quiz_create` - create quizzes
- `quiz_edit` - edit quizzes
- `users_manage` - create/edit users

Roles vs Dashboard Access:
- super_admin, admin, instructor, reviewer → can access dashboard
- student, guest → access denied, redirected to /learn

## Testing Checklist

- [ ] Student login redirects to /learn
- [ ] Student cannot access /admin, /users, /results (admin view)
- [ ] Student sees only assigned quizzes in /learn
- [ ] Student cannot create/edit quizzes (403 error)
- [ ] Student cannot create/edit users (403 error)
- [ ] Student cannot attempt non-assigned quizzes (403 error)
- [ ] Admin/instructor can create/edit quizzes with permission
- [ ] Admin can create/edit users with permission
- [ ] Permissions are fetched fresh on login (/api/auth/me)
- [ ] Permission toggle in RoleManagement prevents API access (not just UI)

## Files Modified

1. ✅ api/auth.js - Add permissions to JWT
2. ✅ api/_middleware.js - Add requirePermission middleware
3. ✅ api/quizzes.js - Add quiz create/edit permission checks
4. ✅ api/users.js - Add user management permission checks
5. ✅ api/results.js - Add quiz assignment check for student attempts
6. ✅ src/contexts/AuthContext.jsx - Store permissions
7. ✅ src/App.jsx - Add /learn routes, fix ProtectedRoute
8. ✅ src/pages/Login.jsx - Redirect students to /learn
9. ✅ src/components/StudentLayout.jsx - NEW (student sidebar)
10. ✅ src/pages/LearnerPortal.jsx - NEW (student quiz list)

