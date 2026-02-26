import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Trash2, Check, Clock, AlertTriangle, Users, User, RefreshCw, Lock, ChevronDown, X } from 'lucide-react'
import { useAssignments } from '../hooks/useAssignments'

const statusColor = {
  completed:   'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-blue-100 text-blue-700',
  overdue:     'bg-red-100 text-red-700',
  pending:     'bg-slate-100 text-slate-500',
}

const today = new Date()
function isOverdue(dueDate, status) {
  return status !== 'completed' && new Date(dueDate) < today
}

function daysLeft(dueDate) {
  const diff = Math.ceil((new Date(dueDate) - today) / 86400000)
  return diff
}

export default function AssignmentSystem() {
  const { assignments: rawAssignments, loading, createAssignment, deleteAssignment } = useAssignments()
  const [showModal, setShowModal]     = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType]   = useState('all')
  const [quizzes, setQuizzes]         = useState([])
  const [dbUsers, setDbUsers]         = useState([])
  const [form, setForm] = useState({
    quizId: '',
    assignTo: 'all',
    selectedUsers: [],
    selectedGroups: [],
    dueDate: '',
    required: true,
    recurring: false,
    recurringInterval: 'weekly',
    prerequisiteId: '',
  })

  // Load quizzes and users for the modal selectors
  useEffect(() => {
    fetch('/api/quizzes')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data.slice(0, 50) : []
        setQuizzes(list)
        if (list.length > 0) setForm(p => ({ ...p, quizId: list[0].id }))
      })
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setDbUsers(Array.isArray(data) ? data : []))
  }, [])

  // Normalise status for display
  const assignments = rawAssignments.map(a => ({
    ...a,
    status: isOverdue(a.dueDate || a.due_date, a.status) ? 'overdue'
          : a.status === 'active' ? 'pending'
          : a.status,
  }))

  async function handleCreateAssignment() {
    const quiz = quizzes.find(q => q.id === form.quizId || String(q.id) === String(form.quizId))
    const payload = {
      quiz_id:    form.quizId,
      quizTitle:  quiz?.title || 'Untitled Quiz',
      assign_type: form.assignTo,
      due_date:   form.dueDate || '2026-03-31',
      required:   form.required,
      recurring:  form.recurring,
      recurring_interval: form.recurring ? form.recurringInterval : null,
      prerequisite_id: form.prerequisiteId ? form.prerequisiteId : null,
    }
    await createAssignment(payload)
    setShowModal(false)
    setForm(p => ({ ...p, assignTo: 'all', selectedUsers: [], selectedGroups: [], dueDate: '', required: true, recurring: false, recurringInterval: 'weekly', prerequisiteId: '' }))
  }

  const filtered = assignments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (filterType === 'required' && !a.required) return false
    if (filterType === 'optional' && a.required) return false
    if (filterType === 'recurring' && !a.recurring) return false
    return true
  })

  const stats = {
    total:     assignments.length,
    completed: assignments.filter(a => a.status === 'completed').length,
    overdue:   assignments.filter(a => a.status === 'overdue').length,
    pending:   assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length,
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Assignments</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Track and manage quiz assignments</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6]">
            <Plus className="w-4 h-4" /> New Assignment
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total',     value: stats.total,     color: 'slate'   },
            { label: 'Completed', value: stats.completed, color: 'emerald' },
            { label: 'Overdue',   value: stats.overdue,   color: 'red'     },
            { label: 'Pending',   value: stats.pending,   color: 'amber'   },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {['all','pending','in_progress','completed','overdue'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filterStatus === s ? 'bg-[#E63E6D] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#FFB3C6]'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {['all','required','optional','recurring'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filterType === t ? 'bg-[#E63E6D] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#FFB3C6]'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Assignment List */}
        <div className="space-y-3">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-48" />
                      <div className="h-3 bg-slate-100 rounded w-64" />
                      <div className="h-2 bg-slate-100 rounded w-full mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 glass-card rounded-2xl">
              <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No assignments match your filters</p>
            </div>
          )}
          {!loading && filtered.map(a => {
            const overdue = a.status === 'overdue'
            const dueDateStr = a.dueDate || a.due_date
            const days = daysLeft(dueDateStr)
            const pct = a.totalCount > 0 ? Math.round((a.completedCount / a.totalCount) * 100) : 0
            const prereq = a.prerequisiteId ? assignments.find(x => x.id === a.prerequisiteId) : null

            return (
              <div key={a.id} className={`glass-card rounded-2xl p-4 ${overdue ? 'border-l-4 border-l-red-400' : ''}`}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-heading text-sm font-bold text-slate-900">{a.quizTitle}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[a.status] || statusColor.pending}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                      {a.required && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700">Required</span>}
                      {a.recurring && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600 flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" /> {a.recurringInterval || a.recurring_interval}
                        </span>
                      )}
                      {prereq && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Requires: {prereq.quizTitle?.slice(0, 20)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        {(a.assignedTo === 'all' || a.type === 'all') ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {a.assignedTo || 'All Users'}
                      </span>
                      {dueDateStr && (
                        <span className="flex items-center gap-1">
                          {overdue
                            ? <AlertTriangle className="w-3 h-3 text-red-500" />
                            : <Clock className="w-3 h-3" />}
                          <span className={overdue ? 'text-red-600 font-medium' : days <= 3 ? 'text-amber-600 font-medium' : ''}>
                            {overdue ? `Overdue by ${Math.abs(days)}d` : days === 0 ? 'Due today' : `${days}d left`}
                            {' '}({new Date(dueDateStr).toLocaleDateString()})
                          </span>
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {a.totalCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : overdue ? 'bg-red-400' : 'bg-[#FF6B9D]'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">{a.completedCount}/{a.totalCount} completed ({pct}%)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => deleteAssignment(a.id)} className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-1.5 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* New Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <Plus className="w-5 h-5 text-[#E63E6D]" />
              <h2 className="font-heading text-sm font-bold text-slate-900 flex-1">New Assignment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Quiz */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Quiz</label>
                <select value={form.quizId} onChange={e => setForm(p => ({ ...p, quizId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
                  {quizzes.length === 0 && <option value="">No quizzes available</option>}
                  {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>
              {/* Assign To */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Assign To</label>
                <div className="flex gap-2">
                  {['all','users'].map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, assignTo: t }))}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border capitalize transition-colors ${form.assignTo === t ? 'border-[#FF6B9D] bg-[#FFF5F7] text-[#C41E5C]' : 'border-slate-200 text-slate-600 hover:border-[#FFB3C6]'}`}>
                      {t === 'all' ? 'All Users' : 'Specific Users'}
                    </button>
                  ))}
                </div>
                {form.assignTo === 'users' && (
                  <div className="mt-2 max-h-28 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {dbUsers.map(u => (
                      <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={form.selectedUsers.includes(u.id)}
                          onChange={() => setForm(p => ({ ...p, selectedUsers: p.selectedUsers.includes(u.id) ? p.selectedUsers.filter(x => x !== u.id) : [...p.selectedUsers, u.id] }))}
                          className="accent-[#E63E6D]" />
                        <span className="text-xs text-slate-700">{u.name}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{u.role}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {/* Due Date + Required */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Type</label>
                  <div className="flex gap-2">
                    <button onClick={() => setForm(p => ({ ...p, required: true }))}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${form.required ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600'}`}>
                      Required
                    </button>
                    <button onClick={() => setForm(p => ({ ...p, required: false }))}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${!form.required ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-600'}`}>
                      Optional
                    </button>
                  </div>
                </div>
              </div>
              {/* Recurring */}
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Recurring Assignment</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automatically reassign after each completion</p>
                </div>
                <button onClick={() => setForm(p => ({ ...p, recurring: !p.recurring }))}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.recurring ? 'bg-[#E63E6D]' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.recurring ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              {form.recurring && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Recurring Interval</label>
                  <select value={form.recurringInterval} onChange={e => setForm(p => ({ ...p, recurringInterval: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
                    {['daily','weekly','monthly','quarterly','annually'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              )}
              {/* Prerequisite */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Prerequisite (optional)</label>
                <select value={form.prerequisiteId} onChange={e => setForm(p => ({ ...p, prerequisiteId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
                  <option value="">None</option>
                  {rawAssignments.map(a => <option key={a.id} value={a.id}>{a.quizTitle}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium">Cancel</button>
              <button onClick={handleCreateAssignment} className="bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6]">
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
