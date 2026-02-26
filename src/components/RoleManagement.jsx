import { useState } from 'react'
import { Key, Plus, Edit2, Trash2, Check, X, Shield } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'

// Maps display names → DB enum values
const ROLE_DB_MAP = {
  'Super Admin': 'super_admin',
  'Admin':       'admin',
  'Instructor':  'instructor',
  'Reviewer':    'reviewer',
  'Student':     'student',
  'Guest':       'guest',
}

const PERMISSIONS = [
  { id: 'quiz_create',    label: 'Create quizzes'       },
  { id: 'quiz_edit',      label: 'Edit quizzes'         },
  { id: 'quiz_delete',    label: 'Delete quizzes'       },
  { id: 'quiz_publish',   label: 'Publish quizzes'      },
  { id: 'results_view',   label: 'View all results'     },
  { id: 'results_export', label: 'Export results'       },
  { id: 'users_manage',   label: 'Manage users'         },
  { id: 'users_invite',   label: 'Invite users'         },
  { id: 'cert_issue',     label: 'Issue certificates'   },
  { id: 'reports_view',   label: 'View reports'         },
  { id: 'settings_edit',  label: 'Edit system settings' },
  { id: 'api_access',     label: 'API access'           },
]

const defaultRoles = [
  { id: 1, name: 'Super Admin', color: 'bg-purple-100 text-purple-700', locked: true,
    permissions: new Set(PERMISSIONS.map(p => p.id)) },
  { id: 2, name: 'Admin', color: 'bg-red-100 text-red-700', locked: true,
    permissions: new Set(['quiz_create','quiz_edit','quiz_delete','quiz_publish','results_view','results_export','users_manage','users_invite','cert_issue','reports_view']) },
  { id: 3, name: 'Instructor', color: 'bg-[#FFE5EC] text-[#C41E5C]', locked: true,
    permissions: new Set(['quiz_create','quiz_edit','quiz_publish','results_view','results_export','reports_view']) },
  { id: 4, name: 'Reviewer', color: 'bg-blue-100 text-blue-700', locked: true,
    permissions: new Set(['results_view','reports_view']) },
  { id: 5, name: 'Student', color: 'bg-green-100 text-green-700', locked: true,
    permissions: new Set([]) },
  { id: 6, name: 'Guest', color: 'bg-gray-100 text-gray-600', locked: true,
    permissions: new Set([]) },
]

export default function RoleManagement() {
  const { users, loading, updateUser } = useUsers()
  const [roles, setRoles]         = useState(defaultRoles)
  const [selected, setSelected]   = useState(roles[0])
  const [newRoleName, setNewRoleName] = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState(null)

  function togglePerm(roleId, permId) {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r
      const perms = new Set(r.permissions)
      perms.has(permId) ? perms.delete(permId) : perms.add(permId)
      return { ...r, permissions: perms }
    }))
    setSelected(prev => {
      if (prev?.id !== roleId) return prev
      const perms = new Set(prev.permissions)
      perms.has(permId) ? perms.delete(permId) : perms.add(permId)
      return { ...prev, permissions: perms }
    })
  }

  function addRole() {
    if (!newRoleName.trim()) return
    const newRole = { id: Date.now(), name: newRoleName, color: 'bg-teal-100 text-teal-700', locked: false, permissions: new Set() }
    setRoles(p => [...p, newRole]); setNewRoleName(''); setShowNew(false); setSelected(newRole)
  }

  function deleteRole(id) {
    setRoles(p => p.filter(r => r.id !== id))
    if (selected?.id === id) setSelected(roles[0])
  }

  async function saveChanges() {
    setSaving(true); setSaveError(null)
    try {
      // Build rows for all system roles
      const rolePermissions = []
      for (const role of roles) {
        const dbRole = ROLE_DB_MAP[role.name]
        if (!dbRole) continue
        for (const permId of role.permissions) rolePermissions.push({ role: dbRole, permission: permId })
      }
      const res = await fetch('/api/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: PERMISSIONS.map(p => ({ id: p.id, label: p.label })),
          rolePermissions,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err.message)
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Roles & Permissions</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Control access and permissions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors"><Plus className="w-4 h-4" /> Custom Role</button>
            <button onClick={saveChanges} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6] transition-all disabled:opacity-60">
              {saving ? 'Saving…' : saved ? <><Check className="w-4 h-4" /> Saved!</> : saveError ? '⚠ Error' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-5">
          {/* Role list */}
          <aside className="w-52 flex-shrink-0">
            <div className="glass-card rounded-2xl p-3 space-y-1">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelected(role)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${selected?.id === role.id ? 'border-[#FFB3C6] bg-[#FFF5F7] text-[#C41E5C]' : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${role.color.replace('text-','').replace('bg-','bg-').split(' ')[0]}`} />
                  <span className="flex-1 text-left">{role.name}</span>
                  {!role.locked && (
                    <button onClick={e => { e.stopPropagation(); deleteRole(role.id) }} className="text-slate-300 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {role.locked && <Shield className="w-3 h-3 text-slate-300 flex-shrink-0" />}
                </button>
              ))}
              {showNew && (
                <div className="p-2 bg-slate-50 border border-[#FFB3C6] rounded-xl space-y-2">
                  <input autoFocus value={newRoleName} onChange={e => setNewRoleName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRole()} placeholder="Role name…" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]" />
                  <div className="flex gap-1">
                    <button onClick={addRole} className="flex-1 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] rounded-lg transition-all">Create</button>
                    <button onClick={() => setShowNew(false)} className="flex-1 py-1 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Permission matrix */}
          <div className="flex-1">
            {selected ? (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.color}`}>{selected.name}</span>
                  <span className="text-xs text-slate-500">{selected.permissions.size} of {PERMISSIONS.length} permissions granted</span>
                  {selected.locked && <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto"><Shield className="w-3 h-3" /> System role (changes will be saved)</span>}
                </div>
                <div className="divide-y divide-slate-100">
                  {PERMISSIONS.map(perm => {
                    const hasIt = selected.permissions.has(perm.id)
                    return (
                      <div key={perm.id} className={`flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors ${hasIt ? '' : 'opacity-60'}`}>
                        <div
                          onClick={() => togglePerm(selected.id, perm.id)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${hasIt ? 'bg-[#E63E6D] border-[#E63E6D]' : 'border-slate-300 hover:border-[#FF6B9D]'}`}
                        >
                          {hasIt && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-[13px] text-slate-700 font-medium">{perm.label}</span>
                        <span className="text-[12px] text-slate-400 font-mono ml-auto">{perm.id}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Select a role to edit its permissions</div>
            )}
          </div>
        </div>

        {/* Users with roles — live from DB */}
        {!loading && users.length > 0 && (
          <div className="mt-6 glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Users & Assigned Roles</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50/70 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                    {u.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <select
                    value={u.role || ''}
                    onChange={e => updateUser(u.id, { role: e.target.value })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
                  >
                    {Object.entries(ROLE_DB_MAP).map(([label, val]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permission matrix overview */}
        <div className="mt-6 glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Permission Matrix Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-44">Permission</th>
                  {roles.map(r => <th key={r.id} className="px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center"><span className={`px-2 py-0.5 rounded-full ${r.color}`}>{r.name}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-slate-800">{p.label}</td>
                    {roles.map(r => (
                      <td key={r.id} className="px-3 py-2.5 text-center">
                        {r.permissions.has(p.id)
                          ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" strokeWidth={3} />
                          : <X    className="w-3 h-3 text-slate-200 mx-auto" />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
