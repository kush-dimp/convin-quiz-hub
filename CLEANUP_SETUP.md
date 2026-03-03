# 7-Day Trash Auto-Delete Setup

## Overview
Quizzes moved to trash are automatically deleted after 7 days. The cleanup job removes quizzes where:
- `is_deleted = true`
- `deleted_at < 7 days ago`

---

## Option 1: Vercel (Recommended for Production)

### Setup:
1. Set `CLEANUP_SECRET` in Vercel dashboard:
   - Project Settings → Environment Variables
   - Key: `CLEANUP_SECRET`
   - Value: `your-secret-key` (use a strong random string)

2. Schedule external cron service to call endpoint daily:
   ```
   GET https://quiz-platform-mauve.vercel.app/api/cleanup?secret=your-secret-key
   ```

### Free Cron Services:
- **cron-job.org** - Free, simple web-based cron
  - Create new cron job
  - URL: `https://quiz-platform-mauve.vercel.app/api/cleanup?secret=your-secret-key`
  - Schedule: `0 0 * * *` (daily at midnight UTC)
  - Timeout: 60s

- **GitHub Actions** - Free if repo is public
  ```yaml
  name: Daily Trash Cleanup
  on:
    schedule:
      - cron: '0 0 * * *'
  jobs:
    cleanup:
      runs-on: ubuntu-latest
      steps:
        - name: Run cleanup
          run: |
            curl -f "https://quiz-platform-mauve.vercel.app/api/cleanup?secret=${{ secrets.CLEANUP_SECRET }}" || exit 1
  ```

- **AWS EventBridge + Lambda** - Paid but reliable
- **Zapier** - Paid, integrations available

---

## Option 2: Local Development (Node.js)

### Prerequisites:
```bash
npm install node-cron
```

### Run:
```bash
CLEANUP_SECRET=cleanup-secret node scripts/cleanup-cron.js
```

This will run the cleanup job every day at midnight UTC while the process is running.

---

## API Endpoint

### Endpoint:
```
GET /api/cleanup?secret=YOUR_CLEANUP_SECRET
```

### Response (Success):
```json
{
  "success": true,
  "deleted": 5,
  "message": "5 quizzes permanently deleted from trash"
}
```

### Response (No quizzes to delete):
```json
{
  "success": true,
  "deleted": 0,
  "message": "0 quizzes permanently deleted from trash"
}
```

### Response (Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

---

## What Gets Deleted:
1. Quiz record (`quizzes` table)
2. Associated questions (`questions` table)
3. Quiz statistics (`quiz_stats` table)
4. User attempts (`attempts` table)

---

## Testing

### Manual cleanup (development):
```bash
CLEANUP_SECRET=cleanup-secret curl "http://localhost:3000/api/cleanup?secret=cleanup-secret"
```

### Manual cleanup (production):
```bash
curl "https://quiz-platform-mauve.vercel.app/api/cleanup?secret=YOUR_SECRET"
```

---

## Monitoring

Check logs in Vercel dashboard:
- Project → Deployments → Function Logs
- Filter: `[Cleanup]`

---

## Notes
- Cleanup runs **daily at 00:00 UTC** (configurable)
- Only deletes quizzes in trash for 7+ days
- Safe: requires `CLEANUP_SECRET` authentication
- Reversible: Users can restore quizzes for 7 days before auto-delete
