import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
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

// Redirects to /login if not authenticated, checks role permissions
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles?.length > 0 && !roles.includes(role)) {
    return <Navigate to="/" replace />
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

      {/* Protected — all under the sidebar Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<QuizGrid />} />
        <Route path="templates" element={<TemplateLibrary />} />
        <Route path="question-bank" element={<QuestionBank />} />
        <Route path="quizzes/:id/editor" element={<QuizEditor />} />
        <Route path="quizzes/:id/settings" element={<QuizSettings />} />
        <Route path="results" element={<ResultsDashboard />} />
        <Route path="results/:id" element={<IndividualResult />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="question-analysis" element={<QuestionAnalysis />} />
        <Route path="grade-book" element={<ProtectedRoute roles={['super_admin', 'admin', 'reviewer']}><GradeBook /></ProtectedRoute>} />
        <Route path="user-progress" element={<UserProgressPage />} />
        <Route path="reports" element={<AutomatedReports />} />
        <Route path="cheat-detection" element={<ProtectedRoute roles={['super_admin', 'admin']}><CheatDetection /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['super_admin', 'admin']}><BulkUsers /></ProtectedRoute>} />
        <Route path="assignments" element={<AssignmentSystem />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="roles" element={<ProtectedRoute roles={['super_admin']}><RoleManagement /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute roles={['super_admin', 'admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute roles={['super_admin', 'admin']}><AuditLogs /></ProtectedRoute>} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="live" element={<ProtectedRoute roles={['super_admin', 'admin', 'instructor']}><LiveSessionHost /></ProtectedRoute>} />
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
