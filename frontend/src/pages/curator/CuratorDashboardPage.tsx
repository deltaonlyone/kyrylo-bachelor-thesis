import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import {
  Alert,
  Box,
  CircularProgress,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { CourseStatusChip } from '../../components/CourseStatusChip'
import { PageShell } from '../../components/PageShell'
import { fetchCourses } from '../../api/api'
import type { CourseSummary } from '../../types/course'
import { CourseCreateSection } from './CourseCreateSection'

export function CuratorDashboardPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCourses = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchCourses()
      .then(setCourses)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Помилка завантаження')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void loadCourses()
  }, [loadCourses])

  return (
    <PageShell
      title="Кабінет куратора"
      subtitle={
        <>
          Керування навчальними програмами підвищення кваліфікації для ІТ-спеціалістів:
          створення курсів, модулів і уроків. Дані надходять з{' '}
          <Box component="code" sx={{ px: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            course-service
          </Box>{' '}
          через API Gateway (
          <Box component="code" sx={{ px: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            GET / POST /api/courses
          </Box>
          ).
        </>
      }
    >
      <CourseCreateSection onCreated={() => void loadCourses()} />

      <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 1 }}>
        Каталог програм
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Відкрийте програму, щоб переглянути структуру та керувати статусом публікації.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!loading && !error ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="medium" aria-label="Каталог навчальних програм">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Назва програми</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дія</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      Поки немає програм. Створіть першу у формі вище.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {c.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <CourseStatusChip status={c.status} />
                    </TableCell>
                    <TableCell align="right">
                      <MuiLink
                        component={RouterLink}
                        to={`/curator/courses/${c.id}`}
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        Відкрити
                        <ArrowForwardRounded sx={{ fontSize: 18 }} />
                      </MuiLink>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </PageShell>
  )
}
