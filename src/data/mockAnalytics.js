// Score distribution histogram buckets (0-10, 10-20, ... 90-100)
export const scoreDistribution = [
  { range: '0–10',  count: 3  },
  { range: '10–20', count: 5  },
  { range: '20–30', count: 8  },
  { range: '30–40', count: 14 },
  { range: '40–50', count: 21 },
  { range: '50–60', count: 38 },
  { range: '60–70', count: 52 },
  { range: '70–80', count: 61 },
  { range: '80–90', count: 48 },
  { range: '90–100',count: 27 },
]

// Performance over time (last 30 days)
export const performanceOverTime = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-02-25')
  d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    avgScore: Math.round(65 + Math.sin(i * 0.3) * 12 + i * 0.4),
    attempts: Math.round(8 + Math.random() * 15),
  }
})

// Per-question performance
export const questionPerformance = [
  { id: 1, text: 'What is the OSI model?',                  correct: 89, total: 277, avgTime: 28, discriminationIndex: 0.42, difficulty: 'Easy'   },
  { id: 2, text: 'Explain TCP vs UDP',                      correct: 201, total: 277, avgTime: 45, discriminationIndex: 0.38, difficulty: 'Medium' },
  { id: 3, text: 'What is a subnet mask?',                  correct: 143, total: 277, avgTime: 52, discriminationIndex: 0.51, difficulty: 'Medium' },
  { id: 4, text: 'Define DHCP',                             correct: 251, total: 277, avgTime: 22, discriminationIndex: 0.21, difficulty: 'Easy'   },
  { id: 5, text: 'How does DNS resolution work?',           correct: 112, total: 277, avgTime: 67, discriminationIndex: 0.58, difficulty: 'Hard'   },
  { id: 6, text: 'What is a VLAN?',                         correct: 178, total: 277, avgTime: 38, discriminationIndex: 0.44, difficulty: 'Medium' },
  { id: 7, text: 'Describe the three-way handshake',        correct: 95,  total: 277, avgTime: 74, discriminationIndex: 0.62, difficulty: 'Hard'   },
  { id: 8, text: 'What is NAT?',                            correct: 188, total: 277, avgTime: 31, discriminationIndex: 0.35, difficulty: 'Medium' },
  { id: 9, text: 'Explain BGP routing',                     correct: 47,  total: 277, avgTime: 89, discriminationIndex: 0.71, difficulty: 'Expert' },
  { id: 10, text: 'What is OSPF?',                         correct: 63,  total: 277, avgTime: 81, discriminationIndex: 0.68, difficulty: 'Expert' },
  { id: 11, text: 'Define network latency',                correct: 231, total: 277, avgTime: 18, discriminationIndex: 0.19, difficulty: 'Easy'   },
  { id: 12, text: 'What is a firewall?',                   correct: 265, total: 277, avgTime: 14, discriminationIndex: 0.11, difficulty: 'Easy'   },
]

// Time spent per question (seconds)
export const timePerQuestion = questionPerformance.map(q => ({
  name: `Q${q.id}`,
  avgTime: q.avgTime,
  maxTime: q.avgTime + Math.round(Math.random() * 60),
}))

// Attempt results list (for Results Dashboard)
export const mockResults = Array.from({ length: 50 }, (_, i) => {
  const names = ['Alice J.','Bob M.','Carol W.','David L.','Eva B.','Frank G.','Grace K.','Henry C.','Iris P.','James T.']
  const score = Math.round(40 + Math.random() * 60)
  const passed = score >= 70
  const mins = Math.round(18 + Math.random() * 30)
  const d = new Date('2026-02-25')
  d.setDate(d.getDate() - Math.floor(Math.random() * 30))
  return {
    id: i + 1,
    userName: names[i % names.length],
    email: `user${i + 1}@corp.com`,
    score,
    points: Math.round(score * 0.65),
    totalPoints: 65,
    passed,
    timeTaken: `${mins}m ${Math.round(Math.random() * 59)}s`,
    timeMins: mins,
    date: d.toISOString(),
    attempt: Math.ceil(Math.random() * 3),
    flagged: Math.random() < 0.08,
  }
})

// Heatmap data (day × hour)
export const heatmapData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day, hour,
    value: Math.max(0, Math.round(
      (hour >= 9 && hour <= 17 ? 15 : 3) + Math.random() * 10 - (day >= 5 ? 8 : 0)
    )),
  }))
).flat()

// Admin overview stats (for AdminDashboard)
export const adminStats = {
  totalUsers:      20,
  userGrowth:      '+12%',
  activeQuizzes:   15,
  quizGrowth:      '+3',
  quizzesToday:    47,
  quizTodayDelta:  '+8',
  avgScore:        74,
  avgScoreDelta:   '+2.1%',
  serverStatus:    'healthy',
  dbSizeGB:        2.4,
  storageUsedPct:  38,
  apiResponseMs:   142,
  errorRatePct:    0.3,
}

export const signupOverTime = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  signups: Math.round(5 + Math.random() * 15),
}))

export const popularQuizzes = [
  { name: 'Workplace Safety', attempts: 312 },
  { name: 'Cybersecurity 101', attempts: 287 },
  { name: 'AWS Cloud Prep',   attempts: 241 },
  { name: 'JS Fundamentals',  attempts: 198 },
  { name: 'Data Privacy',     attempts: 176 },
]
