-- Add soft delete columns to quizzes table if they don't exist
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_quizzes_is_deleted ON quizzes(is_deleted, deleted_at);
