# Role Consolidation: Removed Instructor, Reviewer, Guest

## Summary

Consolidated the system from 6 roles to 3 roles:
- ✅ super_admin
- ✅ admin
- ✅ student

Removed:
- ❌ instructor
- ❌ reviewer
- ❌ guest

## Changes Made

### 1. Role Management (RoleManagement.jsx)
- Removed instructor, reviewer, guest from ROLE_DB_MAP
- Removed instructor, reviewer, guest from defaultRoles
- Only 3 roles now appear in the UI

### 2. Route Guards (App.jsx)
- Removed guest role check in ProtectedRoute
- Updated all route role arrays:
  - Removed 'instructor' from all routes
  - Removed 'reviewer' from results, analytics, reports routes
  - Simplified to only ['super_admin', 'admin'] for admin routes

### 3. Navigation (Layout.jsx)
- Updated NAV array role restrictions:
  - My Quizzes: ['super_admin', 'admin', 'student']
  - Templates: ['super_admin', 'admin']
  - Question Bank: ['super_admin', 'admin']
  - Results: ['super_admin', 'admin']
  - Analytics: ['super_admin', 'admin']
  - Certificates: ['super_admin', 'admin', 'student']
  - Assignments: ['super_admin', 'admin', 'student']
  - Notifications: ['super_admin', 'admin', 'student']

### 4. Login Redirect (Login.jsx)
- Removed instructor → '/'
- Removed reviewer → '/results'
- Simplified to: admin → '/admin', student → '/learn'

### 5. API Protection
- certificates.js: Only ['super_admin', 'admin'] can create/delete templates
- quizzes.js: Only ['super_admin', 'admin'] can create/edit/delete quizzes

## Role Permissions

### Super Admin
✅ Full system access
✅ All permissions: quiz_create, quiz_edit, quiz_delete, quiz_publish, results_view, results_export, users_manage, users_invite, cert_issue, reports_view, settings_edit, api_access

### Admin
✅ Manage quizzes, users, certificates, analytics
✅ Permissions: quiz_create, quiz_edit, quiz_delete, quiz_publish, results_view, results_export, users_manage, users_invite, cert_issue, reports_view

### Student
✅ View assigned quizzes, attempt quizzes, view results, download certificates
❌ No admin permissions
❌ Dashboard access: false

## Database Impact

### Enum Change
Before: `user_role = ENUM('super_admin', 'admin', 'instructor', 'reviewer', 'student', 'guest')`
After: `user_role = ENUM('super_admin', 'admin', 'student')`

### Migration
Users with removed roles will need to be converted:
- instructor → student
- reviewer → student (or admin if they need to review)
- guest → student

## Frontend Routes

### Admin Routes (super_admin/admin only)
- /dashboard
- /admin
- /users
- /templates
- /question-bank
- /quizzes/:id/editor
- /quizzes/:id/settings
- /results
- /analytics
- /question-analysis
- /grade-book
- /user-progress
- /reports
- /cheat-detection
- /audit-logs
- /assignments
- /live

### Student Routes (super_admin/admin/student)
- /learn
- /learn/results
- /learn/certificates
- /quiz/:id/take
- /notifications
- /assignments
- /certificates (view only)

### Public Routes
- /login
- /verify-email
- /join/:code

## API Changes

### Protected Endpoints
- POST /api/quizzes: admin only
- PATCH /api/quizzes/:id: admin only
- DELETE /api/quizzes/:id: admin only
- POST /api/certificates/templates: admin only
- DELETE /api/certificates/templates/:id: admin only
- POST /api/analytics/*: admin only

## Files Modified

1. ✅ src/components/RoleManagement.jsx - Removed 3 unused roles from UI
2. ✅ src/App.jsx - Updated route guards
3. ✅ src/components/Layout.jsx - Updated sidebar navigation
4. ✅ src/pages/Login.jsx - Simplified role-based redirects
5. ✅ api/quizzes.js - Updated role checks
6. ✅ api/certificates.js - Updated role checks
7. ✅ api/analytics/[slug].js - Already correct (admin only)

## Testing Checklist

- [ ] Super Admin can access all routes
- [ ] Admin can access all admin routes except those marked super_admin only
- [ ] Student can only access /learn, /quiz/:id/take, /certificates
- [ ] Student redirected to /learn on login
- [ ] Admin redirected to /admin on login
- [ ] Removed roles no longer appear in RoleManagement UI
- [ ] No errors when filtering navigation by role
- [ ] APIs return 403 for students attempting create/edit/delete
- [ ] Database enum has only 3 roles

## Migration Script (SQL)
```sql
ALTER TYPE user_role ENUM ADD VALUE 'student';
-- For existing users:
UPDATE profiles SET role = 'student' WHERE role IN ('instructor', 'reviewer', 'guest');
-- Then drop old enum values (varies by database)
```

## Deployment Notes

- No frontend breaking changes
- APIs properly validate role
- Students with removed roles will be migrated to 'student'
- RoleManagement UI simplified
- All role checks consolidated to 3 roles

