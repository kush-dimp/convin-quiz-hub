# Secure Learner Data Isolation

## Overview

All APIs now validate user ownership before returning data. Users can only see their own attempts, results, certificates, and analytics. Admins can view all data.

## Security Model

### User Data Isolation

| Data Type | User Access | Admin Access | Notes |
|-----------|-------------|--------------|-------|
| Own attempts | ✅ Yes | ✅ All | Ownership validated in API |
| Own results | ✅ Yes | ✅ All | Filters by session.user.id |
| Own certificates | ✅ Yes | ✅ All | Filters by session.user.id |
| Own analytics | ✅ Yes | ✅ All | New learner-stats endpoint |
| URL params | ❌ Ignored | - | Always use session.user.id |

### Admin-Only Analytics

| Endpoint | Auth | Admin Only |
|----------|------|-----------|
| /api/analytics/admin-stats | ✅ | ✅ |
| /api/analytics/score-distribution | ✅ | ✅ |
| /api/analytics/performance | ✅ | ✅ |
| /api/analytics/question-performance | ✅ | ✅ |
| /api/analytics/signups | ✅ | ✅ |
| /api/analytics/popular-quizzes | ✅ | ✅ |

### Learner Analytics (NEW)

| Endpoint | Auth | Returns |
|----------|------|---------|
| /api/analytics/learner-stats | ✅ | User's quiz stats (total, passed, avg score, etc.) |
| /api/analytics/learner-performance | ✅ | User's performance over time (days) |

## Files Modified

### API Files

1. **`api/results.js`** - Secure attempt access
   - GET /api/results/:id: Validate user owns attempt, admins can see all
   - GET /api/results: Always filter by session.user.id (except admins)
   - GET /api/results/stats: User-scoped stats
   - DELETE /api/results/:id: Admin only

2. **`api/certificates.js`** - Secure certificate access
   - GET /api/certificates/:id: Validate user owns certificate, admins can see all
   - GET /api/certificates: Always filter by session.user.id, ignore userId param
   - DELETE /api/certificates/:id: Admin only

3. **`api/analytics/[slug].js`** - Secure analytics
   - Admin endpoints: Require authentication + admin role
   - New learner endpoints: User-scoped analytics
   - Query params ignored where applicable

## Implementation Details

### Data Ownership Validation

Every endpoint that returns user data validates:

```javascript
const auth = authenticateRequest(req, res)
if (auth) return auth

// User can only see their own data (unless admin)
if (recordUserId !== req.user.id && !isAdmin) {
  return res.status(403).json({ error: 'Unauthorized' })
}
```

### URL Parameter Protection

API ignores user-provided userId in query params:

```javascript
// Before: blindly trusts userId from URL
const userId = url.searchParams.get('userId')  // ❌ UNSAFE

// After: always use authenticated user's ID
const userId = req.user.id  // ✅ SAFE
```

### Admin Override

Admins bypass user isolation:

```javascript
const isAdmin = ['super_admin', 'admin'].includes(req.user.role)
if (!isAdmin) {
  // Add filter for user's data only
  conditions.push(`a.user_id = ${req.user.id}`)
}
```

## Security Rules Enforced

1. ✅ **Never trust frontend** - All checks in backend API
2. ✅ **Ignore URL params** - Always use session.user.id
3. ✅ **Validate ownership** - Check attempt.user_id === session.user.id
4. ✅ **Admin override** - Only super_admin/admin can bypass filters
5. ✅ **Return 403** - For unauthorized access attempts
6. ✅ **Auth required** - All user-data endpoints require authentication

## Learner Portal Updates

Students access their data via:
- `/learn` - Assigned quizzes (from /api/assignments?userId=)
- `/learn/results` - Personal results (from /api/results, auto-filtered)
- `/learn/certificates` - Personal certificates (from /api/certificates, auto-filtered)
- `/learn/analytics` - Personal stats (from /api/analytics/learner-*)

## Testing Checklist

- [ ] Student A cannot see Student B's attempts (403 Forbidden)
- [ ] Student A cannot access /api/results?userId=B (ignored, returns own data)
- [ ] Admin can see all attempts via /api/results
- [ ] GET /api/results/:id validates ownership (403 if not owner)
- [ ] Student cannot see other certificates (403 Forbidden)
- [ ] Learner analytics show only user's data
- [ ] Admin analytics show all data
- [ ] URL parameters (userId, etc.) are ignored for non-admin
- [ ] /api/analytics/admin-stats blocked for non-admin (403)
- [ ] Deleted attempts cannot be accessed by anyone

## Error Responses

### Unauthorized Access
```json
{
  "error": "Unauthorized"
}
```
Status: 403

### Insufficient Permissions
```json
{
  "error": "Insufficient permissions"
}
```
Status: 403

### Not Found
```json
{
  "error": "Not found"
}
```
Status: 404

## Database Queries

All queries now include user filter:

```sql
-- Before (UNSAFE)
SELECT * FROM quiz_attempts WHERE status = 'submitted'

-- After (SAFE)
SELECT * FROM quiz_attempts 
WHERE status = 'submitted' AND user_id = $1
```

## Deployment Notes

- No database schema changes required
- No migrations needed
- Backward compatible with existing data
- Fresh deployment recommended for security

