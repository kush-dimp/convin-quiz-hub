export const ROLES = ['Super Admin', 'Admin', 'Instructor', 'Reviewer', 'Student', 'Guest']
export const DEPARTMENTS = ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations', 'Design', 'Legal']
export const STATUSES = ['active', 'inactive', 'pending']

export const mockUsers = [
  { id: 1,  name: 'Alice Johnson',   email: 'alice@corp.com',   role: 'Super Admin', department: 'Engineering', status: 'active',   avatar: null, createdAt: '2023-01-15', lastLogin: '2026-02-24', quizzesTaken: 42, certificates: 8,  badges: ['🏆','⭐','🎯'], score: 94 },
  { id: 2,  name: 'Bob Martinez',    email: 'bob@corp.com',     role: 'Admin',       department: 'HR',          status: 'active',   avatar: null, createdAt: '2023-02-10', lastLogin: '2026-02-23', quizzesTaken: 31, certificates: 5,  badges: ['⭐','🎯'],     score: 88 },
  { id: 3,  name: 'Carol Williams',  email: 'carol@corp.com',   role: 'Instructor',  department: 'Marketing',   status: 'active',   avatar: null, createdAt: '2023-03-05', lastLogin: '2026-02-22', quizzesTaken: 18, certificates: 3,  badges: ['🎯'],          score: 79 },
  { id: 4,  name: 'David Lee',       email: 'david@corp.com',   role: 'Student',     department: 'Sales',       status: 'active',   avatar: null, createdAt: '2023-04-20', lastLogin: '2026-02-21', quizzesTaken: 55, certificates: 10, badges: ['🏆','⭐','🎯','🔥'], score: 97 },
  { id: 5,  name: 'Eva Brown',       email: 'eva@corp.com',     role: 'Student',     department: 'Finance',     status: 'active',   avatar: null, createdAt: '2023-05-12', lastLogin: '2026-02-20', quizzesTaken: 27, certificates: 4,  badges: ['⭐'],          score: 83 },
  { id: 6,  name: 'Frank Garcia',    email: 'frank@corp.com',   role: 'Reviewer',    department: 'Operations',  status: 'inactive', avatar: null, createdAt: '2023-06-08', lastLogin: '2026-01-15', quizzesTaken: 12, certificates: 2,  badges: [],              score: 71 },
  { id: 7,  name: 'Grace Kim',       email: 'grace@corp.com',   role: 'Instructor',  department: 'Design',      status: 'active',   avatar: null, createdAt: '2023-07-14', lastLogin: '2026-02-25', quizzesTaken: 9,  certificates: 1,  badges: ['🎯'],          score: 76 },
  { id: 8,  name: 'Henry Chen',      email: 'henry@corp.com',   role: 'Student',     department: 'Engineering', status: 'active',   avatar: null, createdAt: '2023-08-01', lastLogin: '2026-02-24', quizzesTaken: 38, certificates: 7,  badges: ['⭐','🎯'],     score: 91 },
  { id: 9,  name: 'Iris Patel',      email: 'iris@corp.com',    role: 'Student',     department: 'Marketing',   status: 'pending',  avatar: null, createdAt: '2026-02-20', lastLogin: null,         quizzesTaken: 0,  certificates: 0,  badges: [],              score: null },
  { id: 10, name: 'James Thompson',  email: 'james@corp.com',   role: 'Admin',       department: 'Legal',       status: 'active',   avatar: null, createdAt: '2023-09-17', lastLogin: '2026-02-23', quizzesTaken: 22, certificates: 3,  badges: ['⭐'],          score: 85 },
  { id: 11, name: 'Karen White',     email: 'karen@corp.com',   role: 'Student',     department: 'HR',          status: 'active',   avatar: null, createdAt: '2023-10-05', lastLogin: '2026-02-19', quizzesTaken: 44, certificates: 6,  badges: ['🏆','🎯'],     score: 90 },
  { id: 12, name: 'Leo Rodriguez',   email: 'leo@corp.com',     role: 'Student',     department: 'Sales',       status: 'inactive', avatar: null, createdAt: '2023-11-22', lastLogin: '2025-12-10', quizzesTaken: 8,  certificates: 1,  badges: [],              score: 65 },
  { id: 13, name: 'Maya Singh',      email: 'maya@corp.com',    role: 'Instructor',  department: 'Finance',     status: 'active',   avatar: null, createdAt: '2023-12-01', lastLogin: '2026-02-25', quizzesTaken: 15, certificates: 2,  badges: ['⭐'],          score: 82 },
  { id: 14, name: 'Nathan Davis',    email: 'nathan@corp.com',  role: 'Student',     department: 'Engineering', status: 'active',   avatar: null, createdAt: '2024-01-10', lastLogin: '2026-02-22', quizzesTaken: 33, certificates: 5,  badges: ['🎯','🔥'],    score: 88 },
  { id: 15, name: 'Olivia Wilson',   email: 'olivia@corp.com',  role: 'Student',     department: 'Design',      status: 'active',   avatar: null, createdAt: '2024-02-14', lastLogin: '2026-02-21', quizzesTaken: 19, certificates: 3,  badges: ['⭐'],          score: 80 },
  { id: 16, name: 'Paul Anderson',   email: 'paul@corp.com',    role: 'Guest',       department: 'Operations',  status: 'pending',  avatar: null, createdAt: '2026-02-22', lastLogin: null,         quizzesTaken: 0,  certificates: 0,  badges: [],              score: null },
  { id: 17, name: 'Quinn Taylor',    email: 'quinn@corp.com',   role: 'Student',     department: 'Marketing',   status: 'active',   avatar: null, createdAt: '2024-03-20', lastLogin: '2026-02-20', quizzesTaken: 26, certificates: 4,  badges: ['🎯'],          score: 86 },
  { id: 18, name: 'Rachel Moore',    email: 'rachel@corp.com',  role: 'Reviewer',    department: 'HR',          status: 'active',   avatar: null, createdAt: '2024-04-05', lastLogin: '2026-02-24', quizzesTaken: 11, certificates: 1,  badges: [],              score: 74 },
  { id: 19, name: 'Sam Jackson',     email: 'sam@corp.com',     role: 'Student',     department: 'Sales',       status: 'active',   avatar: null, createdAt: '2024-05-18', lastLogin: '2026-02-23', quizzesTaken: 37, certificates: 6,  badges: ['🏆','⭐','🎯'], score: 93 },
  { id: 20, name: 'Tina Harris',     email: 'tina@corp.com',    role: 'Student',     department: 'Finance',     status: 'active',   avatar: null, createdAt: '2024-06-01', lastLogin: '2026-02-18', quizzesTaken: 14, certificates: 2,  badges: ['⭐'],          score: 78 },
]

export const mockGroups = [
  { id: 1, name: 'Engineering Team',   memberCount: 4, quizzesAssigned: 8  },
  { id: 2, name: 'Sales Team',         memberCount: 3, quizzesAssigned: 5  },
  { id: 3, name: 'HR Department',      memberCount: 3, quizzesAssigned: 12 },
  { id: 4, name: 'New Hires (Feb 26)', memberCount: 3, quizzesAssigned: 3  },
  { id: 5, name: 'All Employees',      memberCount: 20, quizzesAssigned: 2 },
]
