import { mockQuizzes } from './mockQuizzes'

const USERS_SAMPLE = [
  'Alice Johnson','Bob Martinez','Carol Williams','David Lee','Eva Brown',
  'Frank Garcia','Grace Kim','Henry Chen','Iris Patel','James Thompson',
]

function daysFromNow(n) {
  const d = new Date('2026-02-25')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export const mockAssignments = [
  { id: 1,  quizId: 1,  quizTitle: 'JavaScript Fundamentals',     assignedTo: 'Engineering Team', type: 'group',  dueDate: daysFromNow(7),  required: true,  status: 'active',   completedCount: 2, totalCount: 4 },
  { id: 2,  quizId: 2,  quizTitle: 'React Basics',                 assignedTo: 'Engineering Team', type: 'group',  dueDate: daysFromNow(14), required: true,  status: 'active',   completedCount: 1, totalCount: 4 },
  { id: 3,  quizId: 3,  quizTitle: 'TypeScript Advanced',         assignedTo: 'Alice Johnson',    type: 'user',   dueDate: daysFromNow(3),  required: false, status: 'active',   completedCount: 0, totalCount: 1 },
  { id: 4,  quizId: 5,  quizTitle: 'Node.js Backend',             assignedTo: 'All Employees',    type: 'all',    dueDate: daysFromNow(-2), required: true,  status: 'overdue',  completedCount: 12, totalCount: 20 },
  { id: 5,  quizId: 6,  quizTitle: 'SQL & Databases',             assignedTo: 'HR Department',    type: 'group',  dueDate: daysFromNow(21), required: false, status: 'active',   completedCount: 0, totalCount: 3 },
  { id: 6,  quizId: 7,  quizTitle: 'Python for Data Science',     assignedTo: 'Bob Martinez',     type: 'user',   dueDate: daysFromNow(5),  required: true,  status: 'active',   completedCount: 0, totalCount: 1 },
  { id: 7,  quizId: 9,  quizTitle: 'Machine Learning Basics',     assignedTo: 'Engineering Team', type: 'group',  dueDate: daysFromNow(-10),required: true,  status: 'overdue',  completedCount: 1, totalCount: 4 },
  { id: 8,  quizId: 10, quizTitle: 'Agile & Scrum Methodology',   assignedTo: 'All Employees',    type: 'all',    dueDate: daysFromNow(30), required: false, status: 'active',   completedCount: 5, totalCount: 20 },
  { id: 9,  quizId: 11, quizTitle: 'Git Version Control',         assignedTo: 'New Hires (Feb 26)',type: 'group', dueDate: daysFromNow(2),  required: true,  status: 'active',   completedCount: 0, totalCount: 3 },
  { id: 10, quizId: 12, quizTitle: 'Docker & Containers',         assignedTo: 'Carol Williams',   type: 'user',   dueDate: daysFromNow(10), required: false, status: 'completed',completedCount: 1, totalCount: 1 },
]

export const mockNotifications = [
  { id: 1,  type: 'assignment', icon: '📋', title: 'New quiz assigned',          body: '"JavaScript Fundamentals" has been assigned to you. Due in 7 days.', time: '2 hours ago',   read: false },
  { id: 2,  type: 'reminder',   icon: '⏰', title: 'Quiz due tomorrow',           body: '"TypeScript Advanced" is due tomorrow at 11:59 PM.', time: '5 hours ago',   read: false },
  { id: 3,  type: 'result',     icon: '🎉', title: 'Quiz passed!',                body: 'You passed "React Basics" with a score of 88%. Certificate issued.', time: '1 day ago',     read: false },
  { id: 4,  type: 'certificate',icon: '🏆', title: 'Certificate issued',          body: 'Your certificate for "Node.js Backend" is ready to download.', time: '2 days ago',    read: true  },
  { id: 5,  type: 'overdue',    icon: '🔴', title: 'Quiz overdue',                body: '"Machine Learning Basics" was due 10 days ago. Please complete it ASAP.', time: '3 days ago', read: true  },
  { id: 6,  type: 'system',     icon: '📢', title: 'New quiz available',          body: 'A new quiz "Docker & Containers" is available for your team.', time: '4 days ago',    read: true  },
  { id: 7,  type: 'feedback',   icon: '💬', title: 'Feedback received',           body: 'Your instructor left feedback on your "SQL & Databases" submission.', time: '5 days ago',  read: true  },
  { id: 8,  type: 'reminder',   icon: '⏰', title: 'Reminder: 3 days until due',  body: '"TypeScript Advanced" is due in 3 days.', time: '6 days ago',    read: true  },
  { id: 9,  type: 'result',     icon: '📊', title: 'Score released',              body: 'Your score for "Python for Data Science" has been released.', time: '1 week ago',    read: true  },
  { id: 10, type: 'system',     icon: '📢', title: 'System announcement',         body: 'Scheduled maintenance on March 1, 2026 from 2-4 AM UTC.', time: '1 week ago',    read: true  },
]

export const mockAuditLogs = [
  { id: 1,  user: 'Alice Johnson',  action: 'quiz.published',       resource: '"JavaScript Fundamentals"', severity: 'info',     ip: '192.168.1.10', time: '2026-02-25 14:32:11' },
  { id: 2,  user: 'Bob Martinez',   action: 'user.role_changed',    resource: 'Carol Williams → Instructor', severity: 'warning',  ip: '192.168.1.15', time: '2026-02-25 13:15:44' },
  { id: 3,  user: 'System',         action: 'auth.login_failed',    resource: 'unknown@corp.com',          severity: 'error',    ip: '203.0.113.42', time: '2026-02-25 12:58:02' },
  { id: 4,  user: 'Alice Johnson',  action: 'quiz.deleted',         resource: '"Old Quiz Draft"',           severity: 'warning',  ip: '192.168.1.10', time: '2026-02-25 11:44:30' },
  { id: 5,  user: 'David Lee',      action: 'quiz.submitted',       resource: '"React Basics" attempt #2',  severity: 'info',     ip: '192.168.1.22', time: '2026-02-25 10:30:15' },
  { id: 6,  user: 'Grace Kim',      action: 'auth.login',           resource: 'grace@corp.com',            severity: 'info',     ip: '192.168.1.31', time: '2026-02-25 09:12:07' },
  { id: 7,  user: 'Bob Martinez',   action: 'settings.changed',     resource: 'Global security settings',  severity: 'warning',  ip: '192.168.1.15', time: '2026-02-24 17:55:29' },
  { id: 8,  user: 'System',         action: 'auth.login_failed',    resource: 'grace@corp.com',            severity: 'warning',  ip: '10.0.0.5',     time: '2026-02-24 16:43:18' },
  { id: 9,  user: 'Alice Johnson',  action: 'user.created',         resource: 'Iris Patel (iris@corp.com)',severity: 'info',     ip: '192.168.1.10', time: '2026-02-24 15:20:00' },
  { id: 10, user: 'Carol Williams', action: 'quiz.exported',        resource: '"TypeScript Advanced" CSV',  severity: 'info',     ip: '192.168.1.18', time: '2026-02-24 14:08:44' },
  { id: 11, user: 'System',         action: 'security.rate_limit',  resource: 'API /api/results',           severity: 'critical', ip: '198.51.100.1', time: '2026-02-24 13:00:00' },
  { id: 12, user: 'Henry Chen',     action: 'auth.password_change', resource: 'henry@corp.com',            severity: 'info',     ip: '192.168.1.28', time: '2026-02-24 11:30:22' },
  { id: 13, user: 'Alice Johnson',  action: 'cert.issued',          resource: '"AWS Cloud" → David Lee',    severity: 'info',     ip: '192.168.1.10', time: '2026-02-24 10:15:09' },
  { id: 14, user: 'Bob Martinez',   action: 'user.deactivated',     resource: 'Frank Garcia',               severity: 'warning',  ip: '192.168.1.15', time: '2026-02-23 16:40:55' },
  { id: 15, user: 'System',         action: 'backup.completed',     resource: 'Full DB backup 2026-02-23', severity: 'info',     ip: 'internal',     time: '2026-02-23 02:00:01' },
]
