# Quiz Card Actions by Role

## Summary

Quiz card actions are now restricted based on user role. Students only see "Attempt Quiz" button, while admins/instructors see all actions.

## Role-Based Actions

### Super Admin / Admin / Instructor
✅ Preview (hover overlay + three-dot menu)
✅ Edit (hover overlay + three-dot menu)
✅ Reports (hover overlay)
✅ Duplicate (three-dot menu)
✅ History (three-dot menu)
✅ Share (three-dot menu)
✅ Delete (three-dot menu)

### Reviewer
✅ Preview (hover overlay + three-dot menu)
✅ Reports (hover overlay)
❌ Edit, Duplicate, History, Share, Delete (hidden)

### Student
✅ Attempt Quiz (hover overlay only) - replaces "Preview"
❌ Edit, Duplicate, History, Share, Delete (hidden)
❌ Three-dot menu (completely hidden)

### Guest
❌ No actions (no hover overlay, no menu)

## Files Modified

### Frontend
1. **`src/components/QuizCard.jsx`**
   - Added `useAuth()` to get user role
   - Conditionally render hover overlay actions based on role
   - Hide three-dot menu for students and guests
   - Students see "Attempt Quiz" instead of "Preview"
   - Reviewers see only "Preview" and "Reports"

### Backend
2. **`api/quizzes.js`**
   - PATCH /api/quizzes/:id: Block students from editing (403)
   - DELETE /api/quizzes/:id: Block students from deleting (403)
   - POST /api/quizzes: Block students from creating (403)

## UI Changes

### Hover Overlay Button Logic
```
Student     → [Attempt Quiz button only]
Reviewer    → [Preview button] [Reports button]
Admin/Inst. → [Preview button] [Edit button] [Reports button]
Guest       → [No buttons]
```

### Three-Dot Menu
```
Student     → [Menu hidden completely]
Reviewer    → [Menu with Preview only]
Admin/Inst. → [All menu items: Preview, Edit, Duplicate, History, Share, Delete]
Guest       → [Menu hidden]
```

## API Protection

### Routes Protected
- `PATCH /api/quizzes/:id` - Students get 403
- `DELETE /api/quizzes/:id` - Students get 403
- `POST /api/quizzes` - Students get 403

### Error Response
```json
{
  "error": "Students cannot edit/delete quizzes"
}
```
Status: 403

## Testing Checklist

- [ ] Student sees only "Attempt Quiz" button on hover
- [ ] Student's three-dot menu is completely hidden
- [ ] Reviewer sees "Preview" and "Reports" only
- [ ] Reviewer's menu shows only "Preview"
- [ ] Admin/Instructor see all actions
- [ ] Admin/Instructor can access all menu items
- [ ] Student cannot PATCH quiz via API (403)
- [ ] Student cannot DELETE quiz via API (403)
- [ ] Student cannot POST quiz via API (403)
- [ ] Guest user sees no actions

## Deployment Notes

- No database changes required
- Frontend restriction + backend API validation
- Users may have cached permissions; recommend re-login
- No breaking changes to existing data

