const USERS = ['Alice Johnson', 'Bob Martinez', 'Carol Williams', 'David Lee']

function ver(n, daysAgo, user, summary, changes) {
  const d = new Date('2026-02-25')
  d.setDate(d.getDate() - daysAgo)
  return { version: n, timestamp: d.toISOString(), user, summary, changes, isAutoSave: summary.startsWith('Auto') }
}

export const mockVersions = [
  ver(20, 0,   USERS[0], 'Published quiz to all employees',          { added: [], removed: [], modified: ['status: draft → published'] }),
  ver(19, 0,   USERS[0], 'Updated passing score to 80%',            { added: [], removed: [], modified: ['passingScore: 70 → 80'] }),
  ver(18, 0,   USERS[0], 'Auto-save',                               { added: [], removed: [], modified: ['question 12 text updated'] }),
  ver(17, 1,   USERS[2], 'Added 3 new questions to Section 2',      { added: ['Q13: Which protocol…', 'Q14: Define subnet…', 'Q15: What is NAT…'], removed: [], modified: [] }),
  ver(16, 1,   USERS[2], 'Auto-save',                               { added: [], removed: [], modified: ['question 10 options shuffled'] }),
  ver(15, 2,   USERS[0], 'Changed time limit from 30 to 45 minutes',{ added: [], removed: [], modified: ['timeLimit: 30 → 45'] }),
  ver(14, 2,   USERS[1], 'Removed duplicate question',              { added: [], removed: ['Q9: What is OSI model? (duplicate)'], modified: [] }),
  ver(13, 3,   USERS[0], 'Added image to question 7',               { added: ['image: network-diagram.png → Q7'], removed: [], modified: [] }),
  ver(12, 3,   USERS[2], 'Auto-save',                               { added: [], removed: [], modified: ['quiz title updated'] }),
  ver(11, 4,   USERS[0], 'Bulk updated all question points to 10',  { added: [], removed: [], modified: ['Q1-Q10 points: various → 10'] }),
  ver(10, 5,   USERS[1], 'Added feedback explanations for Q1-Q5',   { added: ['feedback: Q1', 'feedback: Q2', 'feedback: Q3', 'feedback: Q4', 'feedback: Q5'], removed: [], modified: [] }),
  ver(9,  6,   USERS[0], 'Reordered questions by difficulty',       { added: [], removed: [], modified: ['question order changed'] }),
  ver(8,  7,   USERS[2], 'Auto-save',                               { added: [], removed: [], modified: ['question 3 answer updated'] }),
  ver(7,  8,   USERS[0], 'Updated quiz description and tags',       { added: ['tags: networking, TCP/IP'], removed: [], modified: ['description updated'] }),
  ver(6,  10,  USERS[1], 'Added Section 2: Advanced Topics',        { added: ['Section 2 header', 'Q8: Describe VLAN', 'Q9: What is OSPF?', 'Q10: Explain BGP'], removed: [], modified: [] }),
  ver(5,  12,  USERS[0], 'Auto-save',                               { added: [], removed: [], modified: ['timer settings changed'] }),
  ver(4,  15,  USERS[2], 'Rewrote Q3 for clarity',                  { added: [], removed: [], modified: ['Q3 text: old → new', 'Q3 answer: C → B'] }),
  ver(3,  18,  USERS[0], 'Initial questions added (Q1-Q7)',         { added: ['Q1','Q2','Q3','Q4','Q5','Q6','Q7'], removed: [], modified: [] }),
  ver(2,  20,  USERS[1], 'Quiz settings configured',               { added: [], removed: [], modified: ['timeLimit set', 'attempts set', 'passingScore set'] }),
  ver(1,  22,  USERS[0], 'Quiz created',                            { added: ['quiz shell created'], removed: [], modified: [] }),
]
