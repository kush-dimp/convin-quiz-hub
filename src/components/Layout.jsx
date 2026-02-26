import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutGrid, Layers, Database, BarChart2, TrendingUp,
  BookOpen, Award, FileText, Shield, Users, Calendar,
  Bell, Key, LogOut, Activity, LayoutDashboard, ClipboardList,
  Zap, GraduationCap, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  {
    group: 'Content',
    items: [
      { to: '/',              icon: LayoutGrid,    label: 'My Quizzes',     exact: true },
      { to: '/templates',     icon: Layers,        label: 'Templates'                  },
      { to: '/question-bank', icon: Database,      label: 'Question Bank'              },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { to: '/results',           icon: BarChart2,     label: 'Results'           },
      { to: '/analytics',         icon: TrendingUp,    label: 'Analytics'         },
      { to: '/question-analysis', icon: FileText,      label: 'Question Analysis' },
      { to: '/grade-book',        icon: BookOpen,      label: 'Grade Book'        },
      { to: '/user-progress',     icon: Award,         label: 'User Progress'     },
      { to: '/reports',           icon: ClipboardList, label: 'Reports'           },
      { to: '/certificates',      icon: GraduationCap, label: 'Certificates'      },
    ],
  },
  {
    group: 'Security',
    items: [
      { to: '/cheat-detection', icon: Shield,   label: 'Cheat Detection' },
      { to: '/audit-logs',      icon: Activity, label: 'Audit Logs'      },
    ],
  },
  {
    group: 'Users',
    items: [
      { to: '/users',         icon: Users,    label: 'All Users'           },
      { to: '/assignments',   icon: Calendar, label: 'Assignments'         },
      { to: '/notifications', icon: Bell,     label: 'Notifications'       },
      { to: '/roles',         icon: Key,      label: 'Roles & Permissions' },
    ],
  },
  {
    group: 'Admin',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
    ],
  },
]

function NavItem({ item, collapsed }) {
  const location = useLocation()
  const isActive = item.exact
    ? location.pathname === '/'
    : location.pathname === item.to ||
      location.pathname.startsWith(item.to + '/') ||
      (item.to === '/' && location.pathname.startsWith('/quizzes'))

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
        <>
          <span className="flex-1 truncate leading-none">{item.label}</span>
          {item.badge > 0 && (
            <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 leading-none flex-shrink-0 ${
              isActive ? 'bg-[#FF6B9D]/40 text-white' : 'bg-red-500 text-white'
            }`}>
              {item.badge}
            </span>
          )}
        </>
      )}
      {isActive && !collapsed && (
        <span className="absolute right-0 top-1 bottom-1 w-0.5 bg-[#FF6B9D] rounded-l-full" />
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { profile, signOut } = useAuth()

  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sidebar_collapsed') || 'false') }
    catch { return false }
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const roleLabel = profile?.role
    ? profile.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Loading…'

  return (
    <div className="relative z-10 flex h-screen overflow-hidden bg-transparent">

      {/* ── Sidebar ── */}
      <aside className={`
        relative flex-shrink-0 flex flex-col bg-slate-900 overflow-hidden
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}
      `}>
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#C41E5C]/30 to-transparent pointer-events-none" />

        {/* Logo + toggle */}
        <div className="relative flex items-center h-[56px] border-b border-white/6 flex-shrink-0 px-4">
          <div className={`w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#C41E5C]/40 ${collapsed ? 'mx-auto' : ''}`}>
            <Zap className="w-[14px] h-[14px] text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <>
              <div className="leading-none ml-3 flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white tracking-tight">QuizPlatform</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Workspace</p>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                className="p-1 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide px-3">
          {NAV.map(({ group, items }) => (
            <section key={group}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
                  {group}
                </p>
              )}
              {collapsed && <div className="mb-2 mx-3 h-px bg-white/6" />}
              <ul className="space-y-0.5">
                {items.map(item => (
                  <li key={item.to} className="relative">
                    <NavItem item={item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        {/* Expand button (collapsed state only) */}
        {collapsed && (
          <div className="relative flex-shrink-0 border-t border-white/6 px-3 py-3">
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/6 transition-all"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User pill */}
        <div className="relative flex-shrink-0 border-t border-white/6 p-3">
          <div className={`flex items-center rounded-xl ${collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-2'}`}>
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center text-[11px] font-bold text-white shadow">
                {initials}
              </div>
              <span className="absolute -bottom-px -right-px w-[9px] h-[9px] bg-[#48BB78] border-[1.5px] border-slate-900 rounded-full" />
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-slate-200 truncate leading-none">
                    {profile?.name ?? 'Loading…'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{roleLabel}</p>
                </div>
                <button
                  onClick={signOut}
                  title="Sign out"
                  className="p-1 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
