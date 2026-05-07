import { Box } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { CuratorDashboardPage } from './pages/curator/CuratorDashboardPage'
import { CuratorCourseDetailPage } from './pages/curator/CuratorCourseDetailPage'
import { CuratorCourseEditPage } from './pages/curator/CuratorCourseEditPage'
import { SuperAdminOrganizationsPage } from './pages/curator/SuperAdminOrganizationsPage'
import { OrganizationDetailPage } from './pages/curator/OrganizationDetailPage'
import { EducatorDashboardPage } from './pages/educator/EducatorDashboardPage'
import { EducatorCourseDetailPage } from './pages/educator/EducatorCourseDetailPage'
import { LearnerDashboardPage } from './pages/learner/LearnerDashboardPage'
import { LearnerCoursePage } from './pages/learner/LearnerCoursePage'
import './App.css'

export default function App() {
  return (
    <Box
      className="thesis-app"
      sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <Routes>
        {/* Публічні маршрути */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Захищені маршрути: Curator */}
        <Route element={<ProtectedRoute allowedRoles={['CURATOR']} />}>
          <Route element={<AppShell />}>
            <Route path="/curator/dashboard" element={<CuratorDashboardPage />} />
            <Route
              path="/curator/courses/:courseId"
              element={<CuratorCourseDetailPage />}
            />
            <Route
              path="/curator/courses/:courseId/edit"
              element={<CuratorCourseEditPage />}
            />
            <Route
              path="/curator/organizations"
              element={<SuperAdminOrganizationsPage />}
            />
            <Route
              path="/curator/organizations/:orgId"
              element={<OrganizationDetailPage />}
            />
          </Route>
        </Route>

        {/* Захищені маршрути: Educator */}
        <Route element={<ProtectedRoute allowedRoles={['EDUCATOR']} />}>
          <Route element={<AppShell />}>
            <Route path="/educator/dashboard" element={<EducatorDashboardPage />} />
            <Route path="/educator/courses/:courseId" element={<EducatorCourseDetailPage />} />
          </Route>
        </Route>

        {/* Захищені маршрути: Learner */}
        <Route element={<ProtectedRoute allowedRoles={['LEARNER']} />}>
          <Route element={<AppShell />}>
            <Route path="/learner/dashboard" element={<LearnerDashboardPage />} />
            <Route
              path="/learner/courses/:courseId"
              element={<LearnerCoursePage />}
            />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Box>
  )
}
