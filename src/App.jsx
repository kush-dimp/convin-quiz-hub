import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import StudentLayout from './components/StudentLayout'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import LearnerPortal from './pages/LearnerPortal'
import QuizGrid from './components/QuizGrid'
import TemplateLibrary from './components/TemplateLibrary'
import QuizEditor from './components/QuizEditor'
import QuizSettings from './components/QuizSettings'
import ResultsDashboard from './components/ResultsDashboard'
import IndividualResult from './components/IndividualResult'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import QuestionAnalysis from './components/QuestionAnalysis'
import QuestionBank from './components/QuestionBank'
import GradeBook from './components/GradeBook'
import UserProgressPage from './components/UserProgressPage'
import AutomatedReports from './components/AutomatedReports'
import CheatDetection from './components/CheatDetection'
import RoleManagement from './components/RoleManagement'
import BulkUsers from './components/BulkUsers'
import AssignmentSystem from './components/AssignmentSystem'
import NotificationCenter from './components/NotificationCenter'
import AuditLogs from './components/AuditLogs'
import AdminDashboard from './components/AdminDashboard'
import QuizTaker from './components/QuizTaker'
import CertificatesPage from './components/CertificatesPage'
import LiveSessionHost from './components/LiveSessionHost'
import LiveSessionJoin from './components/LiveSessionJoin'

// Redirects to /login if not authenticated, checks role permissions & dashboard access
function ProtectedRoute({ children, roles, requireDashboard = false }) {
  const { isAuthenticated, role, dashboard_access, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Students cannot access admin dashboard
  if (role === 'student' && requireDashboard) return <Navigate to="/learn" replace />

  if (requireDashboard && !dashboard_access) return <Navigate to="/learn" replace />

  if (roles?.length > 0 && !roles.includes(role)) {
    return <Navigate to="/learn" replace />
  }

  return children
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />

      {/* Protected — all under the sidebar Layout (requires dashboard access) */}
      <Route
        path="/"
        element={
          <ProtectedRoute requireDashboard>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<QuizGrid />} />
        <Route path="templates" element={<ProtectedRoute roles={['super_admin', 'admin']}><TemplateLibrary /></ProtectedRoute>} />
        <Route path="question-bank" element={<ProtectedRoute roles={['super_admin', 'admin']}><QuestionBank /></ProtectedRoute>} />
        <Route path="quizzes/:id/editor" element={<ProtectedRoute roles={['super_admin', 'admin']}><QuizEditor /></ProtectedRoute>} />
        <Route path="quizzes/:id/settings" element={<ProtectedRoute roles={['super_admin', 'admin']}><QuizSettings /></ProtectedRoute>} />
        <Route path="results" element={<ProtectedRoute roles={['super_admin', 'admin']}><ResultsDashboard /></ProtectedRoute>} />
        <Route path="results/:id" element={<ProtectedRoute roles={['super_admin', 'admin']}><IndividualResult /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={['super_admin', 'admin']}><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="question-analysis" element={<ProtectedRoute roles={['super_admin', 'admin']}><QuestionAnalysis /></ProtectedRoute>} />
        <Route path="grade-book" element={<ProtectedRoute roles={['super_admin', 'admin']}><GradeBook /></ProtectedRoute>} />
        <Route path="user-progress" element={<ProtectedRoute roles={['super_admin', 'admin']}><UserProgressPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['super_admin', 'admin']}><AutomatedReports /></ProtectedRoute>} />
        <Route path="cheat-detection" element={<ProtectedRoute roles={['super_admin', 'admin']}><CheatDetection /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['super_admin', 'admin']}><BulkUsers /></ProtectedRoute>} />
        <Route path="assignments" element={<ProtectedRoute roles={['super_admin', 'admin']}><AssignmentSystem /></ProtectedRoute>} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="roles" element={<ProtectedRoute roles={['super_admin']}><RoleManagement /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute roles={['super_admin', 'admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute roles={['super_admin', 'admin']}><AuditLogs /></ProtectedRoute>} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="live" element={<ProtectedRoute roles={['super_admin', 'admin']}><LiveSessionHost /></ProtectedRoute>} />
      </Route>

      {/* Full-screen quiz taking — outside Layout, still protected */}
      <Route
        path="/quiz/:id/take"
        element={
          <ProtectedRoute>
            <QuizTaker />
          </ProtectedRoute>
        }
      />

      {/* Student Learning Area */}
      <Route
        path="/learn"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LearnerPortal />} />
        <Route path="results" element={<ResultsDashboard />} />
        <Route path="certificates" element={<CertificatesPage />} />
      </Route>

      {/* Public live session join — no auth required */}
      <Route path="/join" element={<LiveSessionJoin />} />
      <Route path="/join/:code" element={<LiveSessionJoin />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
