import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutGrid, Award, FileText, LogOut, PanelLeftClose, PanelLeftOpen, Zap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LogoutConfirmModal from './LogoutConfirmModal'
import NotificationBell from './NotificationBell'

const NAV = [
  {
    group: 'Learning',
    items: [
      { to: '/learn', icon: LayoutGrid, label: 'My Quizzes', exact: true },
      { to: '/learn/results', icon: FileText, label: 'Results' },
      { to: '/learn/certificates', icon: Award, label: 'Certificates' },
    ],
  },
]

function NavItem({ item, collapsed }) {
  const location = useLocation()
  const isActive = item.exact
    ? location.pathname === '/learn'
    : location.pathname === item.to ||
      location.pathname.startsWith(item.to + '/')

  return (
    <NavLink
      to={item.to}
      end={!!item.exact}
      title={collapsed ? item.label : undefined}
      className={`
        relative flex items-center rounded-lg text-[13px] font-medium
        transition-all duration-150 group select-none
        ${collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-[7px]'}
        ${isActive
          ? 'bg-[#FF6B9D]/20 text-white'
          : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
        }
      `}
    >
      <item.icon className={`w-[15px] h-[15px] flex-shrink-0 transition-colors ${
        isActive ? 'text-[#FF6B9D]' : 'text-slate-500 group-hover:text-slate-300'
      }`} />
      {!collapsed && (
        <span className="flex-1 truncate leading-none">{item.label}</span>
      )}
      {isActive && !collapsed && (
        <span className="absolute right-0 top-1 bottom-1 w-0.5 bg-[#FF6B9D] rounded-l-full" />
      )}
    </NavLink>
  )
}

export default function StudentLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('student_sidebar_collapsed') || 'false') }
    catch { return false }
  })

  useEffect(() => {
    localStorage.setItem('student_sidebar_collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <div className="relative z-10 flex h-screen overflow-hidden bg-transparent">
      {/* ── Sidebar ── */}
      <aside className={`
        relative flex-shrink-0 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 border-r border-white/5 overflow-hidden
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}>
        {/* Logo + toggle */}
        <div className="relative flex items-center h-16 border-b border-white/5 flex-shrink-0 px-4">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#C41E5C]/40 ${collapsed ? 'mx-auto' : ''}`}>
            <Zap className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          {!collapsed && (
            <>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Convin Assess</p>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all flex-shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto py-3 space-y-2 scrollbar-hide px-2">
          {NAV.map(({ group, items }) => (
            <section key={group}>
              {!collapsed ? (
                <>
                  <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
                  <ul className="space-y-1">
                    {items.map(item => (
                      <li key={item.to}>
                        <NavItem item={item} collapsed={false} />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <div className="h-px bg-white/5 my-2" />
                  <ul className="space-y-1">
                    {items.map(item => (
                      <li key={item.to}>
                        <NavItem item={item} collapsed={true} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}
        </nav>

        {/* Expand button (collapsed state only) */}
        {collapsed && (
          <div className="flex-shrink-0 border-t border-white/5 px-2 py-3">
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User pill */}
        <div className="flex-shrink-0 border-t border-white/5 p-3">
          <div className={`flex items-center rounded-xl transition-colors hover:bg-white/5 ${collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2'}`}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center text-xs font-bold text-white shadow">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#48BB78] border border-slate-900 rounded-full" />
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-100 truncate">
                    {profile?.name ?? 'Loading…'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">Student</p>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  title="Sign out"
                  className="p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded transition-colors flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Top Navbar with Notification Bell */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200/50 px-6 h-14 flex items-center justify-end">
          <NotificationBell />
        </div>

        <div key={location.pathname} className="page-enter flex-1">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false)
          await signOut()
        }}
      />
    </div>
  )
}
