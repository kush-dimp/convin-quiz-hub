import { useState } from 'react'
import {
  Users, Search, Plus, Upload, Download, Trash2, Edit2,
  Mail, UserCheck, UserX, MoreHorizontal, Filter, Check,
} from 'lucide-react'
import { useUsers } from '../hooks/useUsers'

const ROLES       = ['Super Admin', 'Admin', 'Instructor', 'Reviewer', 'Student', 'Guest']
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Legal', 'Product']
const STATUSES    = ['active', 'inactive', 'pending']

const statusColor = { active: 'bg-emerald-50 text-emerald-700', inactive: 'bg-slate-100 text-slate-500', pending: 'bg-amber-50 text-amber-700' }
const roleColor   = { 'Super Admin': 'bg-violet-50 text-violet-600', Admin: 'bg-rose-50 text-rose-600', Instructor: 'bg-[#FFF5F7] text-[#E63E6D]', Reviewer: 'bg-blue-50 text-blue-600', Student: 'bg-emerald-50 text-emerald-700', Guest: 'bg-slate-100 text-slate-500' }

export default function BulkUsers() {
  const { users, loading, updateUser, deactivateUser, activateUser, inviteUser } = useUsers()
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected]     = useState(new Set())
  const [importing, setImporting]   = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (deptFilter === 'all' || u.department === deptFilter) &&
    (statusFilter === 'all' || u.status === statusFilter) &&
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

  function simulateImport() {
    setImporting(true)
    setTimeout(() => { setImporting(false); setImportSuccess(true); setTimeout(() => setImportSuccess(false), 3000) }, 1200)
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Quizzes Taken', 'Certificates']
    const rows = filtered.map(u => [
      u.name, u.email, u.role, u.department, u.status,
      u.profile_stats?.quizzes_taken ?? 0,
      u.profile_stats?.certificates ?? 0,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'users.csv' })
    a.click()
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Users</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage and invite team members</p>
            </div>
            <span className="text-sm text-slate-400">({users.length})</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors"><Download className="w-4 h-4" /></button>
            <button onClick={simulateImport} disabled={importing} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50">
              <Upload className="w-4 h-4" /> {importing ? 'Importing…' : importSuccess ? '✓ Imported' : 'Import CSV'}
            </button>
            <button
              onClick={() => {
                const email = window.prompt('Email address:')
                if (!email) return
                const name = window.prompt('Full name:') || email.split('@')[0]
                const role = window.prompt('Role (Student/Instructor/Admin):', 'Student') || 'Student'
                const department = window.prompt('Department (optional):') || ''
                inviteUser({ email, name, role, department })
              }}
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
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
            <option value="all">All Roles</option>{ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
            <option value="all">All Depts</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
            <option value="all">All Status</option>{STATUSES.map(s => <option key={s} className="capitalize">{s}</option>)}
          </select>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <span className="text-xs text-slate-500">{selected.size} selected</span>
              <button onClick={() => bulkAction('activate')} className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Activate</button>
              <button onClick={() => bulkAction('deactivate')} className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"><UserX className="w-3.5 h-3.5" /> Deactivate</button>
              <button
                onClick={() => {
                  const emails = users.filter(u => selected.has(u.id)).map(u => u.email).filter(Boolean).join(',')
                  if (emails) window.open(`mailto:${emails}`)
                }}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email All</button>
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
                  <div className="h-4 bg-slate-100 rounded w-8 hidden lg:block" />
                  <div className="h-4 bg-slate-100 rounded w-8 hidden lg:block" />
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
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-500 flex-shrink-0">
                          {u.name?.split(' ').map(n => n[0]).join('') || '?'}
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
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.status === 'active' ? (
                          <button
                            onClick={() => deactivateUser(u.id)}
                            title="Deactivate"
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => activateUser(u.id)}
                            title="Activate"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const name = window.prompt('Full name:', u.name)
                            if (name !== null && name.trim()) updateUser(u.id, { name: name.trim() })
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#E63E6D] hover:bg-[#FFF5F7] rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400"><Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />No users match your filters</div>
          )}
        </div>
      </main>
    </div>
  )
}
