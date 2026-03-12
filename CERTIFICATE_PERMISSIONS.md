# Certificate Permissions by Role

## Summary

Certificate access is now restricted by role. Students can only view and download their own certificates. Admin/Instructors have full certificate management access.

## Role-Based Permissions

### Super Admin / Admin / Instructor
✅ View all certificates
✅ Design certificate (Create template)
✅ Upload custom templates
✅ Configure certificate settings per quiz
✅ Revoke certificates
✅ Download certificates
✅ Upload/Delete certificate templates

### Reviewer
✅ View certificates (via /certificates route)
✅ Download certificates
❌ Create/Edit/Delete (API protected)
❌ No admin buttons (hidden in UI)

### Student
✅ View own certificates (via /learn/certificates)
✅ Download own certificates
❌ Design/Create (hidden in UI + API protected)
❌ Upload templates (hidden in UI + API protected)
❌ Configure (hidden in UI)
❌ Revoke (hidden in UI + API protected)

### Guest
❌ No certificate access (route protected)

## Files Modified

### Frontend
1. **`src/components/CertificatesPage.jsx`**
   - Get user role from `useAuth()`
   - Hide "Design Certificate" button for students
   - Hide "Upload Custom Templates" section for students
   - Hide "Configure Templates" section for students
   - Hide "Revoke" button for students
   - Keep "View" button for all authenticated users

### Backend
2. **`api/certificates.js`**
   - POST /api/certificates/templates: Admin only (403 for students)
   - DELETE /api/certificates/templates/:id: Admin only (403 for students)
   - DELETE /api/certificates/:id: Admin only (403 for students)
   - GET /api/certificates: Filters by user (already implemented)

## UI Changes

### Buttons Hidden for Students
- ❌ "Design Certificate" button (header)
- ❌ "Upload Certificate Templates" section (body)
- ❌ "Configure Certificate Templates" section (body)
- ❌ "Revoke" button (table actions)
- ✅ "View" button (visible)

### API Calls Blocked for Students
- POST /api/certificates/templates (403)
- DELETE /api/certificates/templates/:id (403)
- DELETE /api/certificates/:id (403)

## Data Access

### For Students
- Only their own certificates visible (GET /api/certificates auto-filtered by user_id)
- Read-only access
- Cannot see other users' certificates

### For Admin/Instructors
- All certificates visible
- Can create, edit, delete, and revoke
- Can manage templates

## Security Implementation

| Layer | Protection |
|-------|------------|
| Frontend | UI buttons hidden for students |
| Backend | API validates role and returns 403 for students |
| Database | GET requests already filtered by user_id |

## Testing Checklist

- [ ] Student cannot see "Design Certificate" button
- [ ] Student cannot see "Upload Templates" section
- [ ] Student cannot see "Configure Templates" section
- [ ] Student cannot see "Revoke" button in table
- [ ] Student can see "View" button
- [ ] Student can view only own certificates
- [ ] Student cannot POST to /api/certificates/templates (403)
- [ ] Student cannot DELETE templates (403)
- [ ] Student cannot DELETE certificates (403)
- [ ] Admin can see all certificate management buttons
- [ ] Admin can create/edit/delete/revoke certificates
- [ ] Reviewer can view but not edit/delete
- [ ] Guest cannot access /certificates route (403)

## Route Access

| Route | Super Admin | Admin | Instructor | Reviewer | Student | Guest |
|-------|-------------|-------|-----------|----------|---------|-------|
| /certificates | ✅ Full | ✅ Full | ✅ Full | ✅ View | ✅ View | ❌ |
| /learn/certificates | - | - | - | - | ✅ View | - |
| /api/certificates | ✅ All | ✅ All | ✅ All | ✅ Own | ✅ Own | ❌ |
| /api/certs/templates (POST) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| /api/certs/templates/:id (DELETE) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| /api/certificates/:id (DELETE) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## Deployment Notes

- No database schema changes required
- Students may need to re-login for changes to take effect
- Verify role permissions in database (`role_permissions` table)
- Test with different user roles after deployment

