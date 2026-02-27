import { useState, useRef } from 'react'
import {
  Users, Search, Plus, Upload, Download, Edit2,
  Mail, UserCheck, UserX, X, Check, RefreshCw,
  AlertCircle, ChevronDown,
} from 'lucide-react'
import { useUsers } from '../hooks/useUsers'

const ROLES       = ['Super Admin', 'Admin', 'Instructor', 'Reviewer', 'Student', 'Guest']
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Legal', 'Product']
const STATUSES    = ['active', 'inactive', 'pending']

const statusColor = { active: 'bg-emerald-50 text-emerald-700', inactive: 'bg-slate-100 text-slate-500', pending: 'bg-amber-50 text-amber-700' }
const roleColor   = { 'Super Admin': 'bg-violet-50 text-violet-600', Admin: 'bg-rose-50 text-rose-600', Instructor: 'bg-[#FFF5F7] text-[#E63E6D]', Reviewer: 'bg-blue-50 text-blue-600', Student: 'bg-emerald-50 text-emerald-700', Guest: 'bg-slate-100 text-slate-500' }

function fmtSynced(date) {
  if (!date) return null
  const secs = Math.floor((Date.now() - date) / 1000)
  if (secs < 10)  return 'Just synced'
  if (secs < 60)  return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

/* ── Add / Bulk import modal ── */
function AddUserModal({ onClose, onSuccess, inviteUser }) {
  const [tab,        setTab]        = useState('single')
  const [form,       setForm]       = useState({ name: '', email: '', role: 'Student', department: '' })
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState('')
  const [success,    setSuccess]    = useState(null)   // { name, email }

  // Bulk state
  const [csvRows,    setCsvRows]    = useState([])
  const [csvError,   setCsvError]   = useState('')
  const [importing,  setImporting]  = useState(false)
  const [importDone, setImportDone] = useState(null)   // { success, failed }
  const fileRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.trim() || !form.name.trim()) { setFormError('Name and email are required'); return }
    setSaving(true); setFormError('')
    const { error } = await inviteUser(form)
    setSaving(false)
    if (error) { setFormError(error.message || 'Failed to create user — email may already exist'); return }
    setSuccess({ name: form.name, email: form.email })
    onSuccess()
  }

  function resetForm() {
    setForm({ name: '', email: '', role: 'Student', department: '' })
    setSuccess(null); setFormError('')
  }

  function parseCSV(file) {
    setCsvError(''); setCsvRows([])
    const reader = new FileReader()
    reader.onload = e => {
      const lines   = e.target.result.trim().split('\n').filter(l => l.trim())
      if (lines.length < 2) { setCsvError('CSV must have a header row and at least one data row'); return }
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
      const nameIdx  = headers.findIndex(h => h.includes('name'))
      const emailIdx = headers.findIndex(h => h.includes('email'))
      const roleIdx  = headers.findIndex(h => h.includes('role'))
      const deptIdx  = headers.findIndex(h => h.includes('dept') || h.includes('department'))
      if (emailIdx === -1) { setCsvError('CSV must have an "email" column'); return }
      const rows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        return {
          name:       nameIdx  >= 0 ? cols[nameIdx]  : (cols[emailIdx] || '').split('@')[0],
          email:      cols[emailIdx] || '',
          role:       roleIdx  >= 0 ? cols[roleIdx]  : 'Student',
          department: deptIdx  >= 0 ? cols[deptIdx]  : '',
        }
      }).filter(r => r.email)
      if (rows.length === 0) { setCsvError('No valid rows found — check that emails are present'); return }
      setCsvRows(rows)
    }
    reader.readAsText(file)
  }

  async function handleBulkImport() {
    setImporting(true)
    let successCount = 0, failedCount = 0
    for (const row of csvRows) {
      const { error } = await inviteUser(row)
      if (error) failedCount++; else successCount++
    }
    setImporting(false)
    setImportDone({ success: successCount, failed: failedCount })
    onSuccess()
  }

  function downloadTemplate() {
    const csv = 'name,email,role,department\nJohn Doe,john@example.com,Student,Engineering\nJane Smith,jane@example.com,Instructor,Marketing'
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'user-import-template.csv',
    })
    a.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading text-[15px] font-bold text-slate-900">Add Users</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create individual users or bulk import from CSV</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[
            { key: 'single', label: 'Single User' },
            { key: 'bulk',   label: 'Bulk CSV Import' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setCsvRows([]); setCsvError(''); setImportDone(null) }}
              className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
                tab === key
                  ? 'text-[#E63E6D] border-b-2 border-[#E63E6D]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Single user tab ── */}
        {tab === 'single' && (
          <div className="px-6 py-5">
            {success ? (
              <div className="py-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-heading text-base font-bold text-slate-900">User Created!</p>
                <p className="text-sm text-slate-500 mt-1.5">
                  <span className="font-semibold text-slate-700">{success.name}</span> ({success.email}) has been added successfully.
                </p>
                <div className="flex gap-3 justify-center mt-5">
                  <button onClick={resetForm} className="px-4 py-2 bg-[#FFF5F7] text-[#E63E6D] text-[13px] font-semibold rounded-xl hover:bg-[#FFE5EC] transition-colors">
                    Add Another
                  </button>
                  <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-[13px] font-medium rounded-xl hover:bg-slate-50 transition-colors">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] focus:border-[#FF6B9D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email <span className="text-red-400">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="john@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] focus:border-[#FF6B9D]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Role</label>
                    <select
                      value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
                    >
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Department</label>
                    <select
                      value={form.department}
                      onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
                    >
                      <option value="">Select department…</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={onClose} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-5 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6] disabled:opacity-50 transition-all"
                  >
                    {saving ? 'Creating…' : 'Create User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Bulk CSV tab ── */}
        {tab === 'bulk' && (
          <div className="px-6 py-5 space-y-4">
            {importDone ? (
              <div className="py-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-heading text-base font-bold text-slate-900">{importDone.success} Users Imported!</p>
                {importDone.failed > 0 && (
                  <p className="text-xs text-red-500 mt-1">{importDone.failed} failed (duplicate email or invalid data)</p>
                )}
                <button onClick={onClose} className="mt-5 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] text-white px-6 py-2 rounded-xl text-[13px] font-semibold shadow-sm">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Upload a CSV with columns: <span className="font-mono bg-slate-100 px-1 rounded">name, email, role, department</span></p>
                  <button onClick={downloadTemplate} className="text-xs text-[#E63E6D] font-semibold hover:underline flex items-center gap-1 flex-shrink-0">
                    <Download className="w-3 h-3" /> Download template
                  </button>
                </div>

                {/* Drop zone */}
                {csvRows.length === 0 && (
                  <label
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-[#FF6B9D] hover:bg-[#FFF5F7]/60 transition-all"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseCSV(f) }}
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">Drop your CSV here</p>
                      <p className="text-xs text-slate-400 mt-0.5">or click to browse files</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && parseCSV(e.target.files[0])} />
                  </label>
                )}

                {csvError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {csvError}
                  </div>
                )}

                {/* Preview table */}
                {csvRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700">
                        <span className="text-[#E63E6D]">{csvRows.length}</span> users ready to import
                      </p>
                      <button onClick={() => setCsvRows([])} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        Clear
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 shadow-sm">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            {['Name', 'Email', 'Role', 'Department'].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.map((r, i) => (
                            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/70">
                              <td className="px-3 py-2 font-medium text-slate-700">{r.name || '—'}</td>
                              <td className="px-3 py-2 text-slate-500">{r.email}</td>
                              <td className="px-3 py-2 text-slate-500">{r.role || 'Student'}</td>
                              <td className="px-3 py-2 text-slate-400">{r.department || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setCsvRows([])} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors">
                        Back
                      </button>
                      <button
                        onClick={handleBulkImport}
                        disabled={importing}
                        className="bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-5 py-2 rounded-xl text-[13px] font-semibold shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {importing ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                        ) : (
                          <><Upload className="w-3.5 h-3.5" /> Import {csvRows.length} Users</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Edit user modal ── */
function EditUserModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-heading text-[14px] font-bold text-slate-900">Edit User</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
            />
          </div>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-4">
          <button onClick={onClose} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm disabled:opacity-50 transition-all">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Sync button ── */
function SyncButton({ syncing, lastSynced, onSync }) {
  const [label, setLabel] = useState(null)
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      title="Sync data"
      className="flex items-center gap-1.5 border border-slate-200 text-slate-500 hover:border-[#FF6B9D] hover:text-[#E63E6D] bg-white px-3 py-2 rounded-xl text-[12px] font-medium transition-colors disabled:opacity-60"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
      <span>{syncing ? 'Syncing…' : lastSynced ? `Synced ${fmtSynced(lastSynced)}` : 'Sync'}</span>
    </button>
  )
}

/* ── Main component ── */
export default function BulkUsers() {
  const { users, loading, lastSynced, syncing, refetch, updateUser, deactivateUser, activateUser, inviteUser } = useUsers()
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('all')
  const [deptFilter,   setDeptFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected,     setSelected]     = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editUser,     setEditUser]     = useState(null)

  const filtered = users.filter(u =>
    (roleFilter   === 'all' || u.role       === roleFilter)   &&
    (deptFilter   === 'all' || u.department === deptFilter)   &&
    (statusFilter === 'all' || u.status     === statusFilter) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  function toggle(id) { setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id))

  async function bulkAction(action) {
    const ids = [...selected]
    if (action === 'activate')   await Promise.all(ids.map(id => activateUser(id)))
    if (action === 'deactivate') await Promise.all(ids.map(id => deactivateUser(id)))
    setSelected(new Set())
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Quizzes Taken', 'Certificates']
    const rows = filtered.map(u => [
      u.name, u.email, u.role, u.department, u.status,
      u.profile_stats?.quizzes_taken ?? 0,
      u.profile_stats?.certificates  ?? 0,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'users.csv',
    })
    a.click()
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Users</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage and invite team members</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">({users.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <SyncButton syncing={syncing} lastSynced={lastSynced} onSync={refetch} />
            <button onClick={exportCSV} title="Export CSV" className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6] transition-all"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="glass-card rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]" />
          </div>
          <select value={roleFilter}   onChange={e => setRoleFilter(e.target.value)}   className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
            <option value="all">All Roles</option>{ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={deptFilter}   onChange={e => setDeptFilter(e.target.value)}   className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
            <option value="all">All Depts</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
            <option value="all">All Status</option>{STATUSES.map(s => <option key={s} className="capitalize">{s}</option>)}
          </select>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <span className="text-xs text-slate-500">{selected.size} selected</span>
              <button onClick={() => bulkAction('activate')}   className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Activate</button>
              <button onClick={() => bulkAction('deactivate')} className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"><UserX className="w-3.5 h-3.5" /> Deactivate</button>
              <button
                onClick={() => {
                  const emails = users.filter(u => selected.has(u.id)).map(u => u.email).filter(Boolean).join(',')
                  if (emails) window.open(`mailto:${emails}`)
                }}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" /> Email All
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="w-4 h-4 bg-slate-100 rounded" />
                  <div className="w-7 h-7 bg-slate-100 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-32" />
                    <div className="h-2.5 bg-slate-100 rounded w-48" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-16 hidden md:block" />
                  <div className="h-4 bg-slate-100 rounded w-14 hidden md:block" />
                  <div className="h-4 bg-slate-100 rounded w-12" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-10 px-4 py-3.5">
                    <input type="checkbox" checked={allSelected} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(u => u.id)) : new Set())} className="rounded accent-[#E63E6D]" />
                  </th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Quizzes</th>
                  <th className="text-center px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Certs</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="w-20 px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${selected.has(u.id) ? 'bg-[#FFF5F7]/40' : ''}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} className="rounded accent-[#E63E6D]" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                          {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800">{u.name}</p>
                          <p className="text-[12px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role || ''}
                        onChange={e => updateUser(u.id, { role: e.target.value })}
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] ${roleColor[u.role] || 'bg-slate-100 text-slate-500'}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 hidden md:table-cell">{u.department || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${statusColor[u.status] || 'bg-slate-100 text-slate-500'}`}>{u.status}</span></td>
                    <td className="px-3 py-3 text-center text-[12px] font-medium text-slate-700 hidden lg:table-cell">{u.profile_stats?.quizzes_taken ?? 0}</td>
                    <td className="px-3 py-3 text-center text-[12px] font-medium text-slate-700 hidden lg:table-cell">{u.profile_stats?.certificates ?? 0}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 hidden md:table-cell">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.status === 'active' ? (
                          <button onClick={() => deactivateUser(u.id)} title="Deactivate" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => activateUser(u.id)} title="Activate" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditUser(u)}
                          title="Edit name"
                          className="p-1.5 text-slate-400 hover:text-[#E63E6D] hover:bg-[#FFF5F7] rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-14 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No users match your filters</p>
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {}}
          inviteUser={inviteUser}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={name => updateUser(editUser.id, { name })}
        />
      )}
    </div>
  )
}
