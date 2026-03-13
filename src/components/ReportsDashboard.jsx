import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FileText, Filter, ChevronDown, Eye, EyeOff } from 'lucide-react'

const COLORS = ['#FF6B9D', '#E63E6D', '#C41E5C', '#48BB78']

// Summary stat card
function StatCard({ label, value, trend }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {trend && <p className="text-xs text-emerald-600 mt-1">{trend}</p>}
    </div>
  )
}

// Column visibility toggle
function ColumnToggle({ columns, onToggle }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Eye className="w-4 h-4" />
        Columns
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-3 space-y-2">
          {Object.entries(columns).map(([key, visible]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visible}
                onChange={() => onToggle(key)}
                className="rounded w-4 h-4"
              />
              <span className="text-sm text-slate-700 capitalize">{key.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// Filter panel
function FilterPanel({ filters, onFilterChange, quizzes, users }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-600" />
        <h3 className="font-semibold text-slate-900">Filters</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Quiz</label>
          <select
            value={filters.quizId}
            onChange={(e) => onFilterChange('quizId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
          >
            <option value="">All Quizzes</option>
            {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
          >
            <option value="">All</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Min Score %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.minScore}
            onChange={(e) => onFilterChange('minScore', e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Max Score %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.maxScore}
            onChange={(e) => onFilterChange('maxScore', e.target.value)}
            placeholder="100"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
          />
        </div>
      </div>
    </div>
  )
}

export default function ReportsDashboard() {
  const { role, user: authUser } = useAuth()
  const isAdmin = ['super_admin', 'admin'].includes(role)

  const [results, setResults] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    quizId: '',
    status: '',
    minScore: '',
    maxScore: '',
  })

  const [columns, setColumns] = useState({
    quiz_name: true,
    user_name: isAdmin,
    attempts: true,
    score: true,
    status: true,
    completion_date: true,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, quizRes, usersRes] = await Promise.all([
          fetch('/api/results', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/quizzes', { credentials: 'include' }).then(r => r.json()),
          isAdmin ? fetch('/api/users', { credentials: 'include' }).then(r => r.json()) : Promise.resolve([]),
        ])

        setResults(Array.isArray(resRes) ? resRes : [])
        setQuizzes(Array.isArray(quizRes) ? quizRes : [])
        setUsers(Array.isArray(usersRes) ? usersRes : [])
      } catch (err) {
        console.error('Error fetching report data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAdmin])

  // Filter and process results
  const filteredResults = useMemo(() => {
    let filtered = results

    // Role-based filtering
    if (!isAdmin) {
      filtered = filtered.filter(r => r.user_id === authUser?.id)
    }

    // Apply filters
    if (filters.quizId) {
      filtered = filtered.filter(r => r.quiz_id === filters.quizId)
    }

    if (filters.status === 'passed') {
      filtered = filtered.filter(r => r.passed)
    } else if (filters.status === 'failed') {
      filtered = filtered.filter(r => !r.passed)
    }

    const minScore = parseInt(filters.minScore) || 0
    const maxScore = parseInt(filters.maxScore) || 100
    filtered = filtered.filter(r => (r.score ?? 0) >= minScore && (r.score ?? 0) <= maxScore)

    return filtered
  }, [results, filters, isAdmin, authUser?.id])

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredResults.length === 0) {
      return { total: 0, passed: 0, avgScore: 0, passRate: 0 }
    }

    const passed = filteredResults.filter(r => r.passed).length
    const avgScore = Math.round(filteredResults.reduce((s, r) => s + (r.score ?? 0), 0) / filteredResults.length)
    const passRate = Math.round((passed / filteredResults.length) * 100)

    return {
      total: filteredResults.length,
      passed,
      avgScore,
      passRate,
    }
  }, [filteredResults])

  // Chart data
  const quizPerformance = useMemo(() => {
    const grouped = {}
    filteredResults.forEach(r => {
      if (!grouped[r.quiz_title]) grouped[r.quiz_title] = { score: 0, count: 0 }
      grouped[r.quiz_title].score += r.score ?? 0
      grouped[r.quiz_title].count += 1
    })

    return Object.entries(grouped).map(([name, data]) => ({
      name: name.slice(0, 20),
      'Avg Score': Math.round(data.score / data.count),
    })).slice(0, 8)
  }, [filteredResults])

  const passFailData = useMemo(() => [
    { name: 'Passed', value: stats.passed, color: '#48BB78' },
    { name: 'Failed', value: stats.total - stats.passed, color: '#F56565' },
  ], [stats])

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const displayedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#E63E6D]" />
            <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Attempts" value={stats.total} />
          <StatCard label="Passed" value={stats.passed} />
          <StatCard label="Average Score" value={`${stats.avgScore}%`} />
          <StatCard label="Pass Rate" value={`${stats.passRate}%`} />
        </div>

        {/* Charts */}
        {filteredResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz Performance Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Average Score per Quiz</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Score" fill="#FF6B9D" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pass/Fail Pie Chart */}
            {stats.total > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Pass/Fail Ratio</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={passFailData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {passFailData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <FilterPanel filters={filters} onFilterChange={(key, val) => {
          setFilters(f => ({ ...f, [key]: val }))
          setCurrentPage(1)
        }} quizzes={quizzes} users={users} />

        {/* Results Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Results ({filteredResults.length})</h2>
            <ColumnToggle columns={columns} onToggle={(key) => setColumns(c => ({ ...c, [key]: !c[key] }))} />
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No report data available yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {columns.quiz_name && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Quiz</th>}
                      {columns.user_name && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>}
                      {columns.attempts && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Attempts</th>}
                      {columns.score && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Score</th>}
                      {columns.status && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>}
                      {columns.completion_date && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedResults.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        {columns.quiz_name && <td className="px-4 py-3 text-sm text-slate-900">{r.quiz_title}</td>}
                        {columns.user_name && <td className="px-4 py-3 text-sm text-slate-600">{r.user_name}</td>}
                        {columns.attempts && <td className="px-4 py-3 text-sm text-slate-600">1</td>}
                        {columns.score && <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.score ?? 'N/A'}%</td>}
                        {columns.status && (
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {r.passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                        )}
                        {columns.completion_date && <td className="px-4 py-3 text-sm text-slate-600">{new Date(r.date).toLocaleDateString()}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100">
                  <p className="text-xs text-slate-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-[#FF6B9D] text-white'
                            : 'border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
