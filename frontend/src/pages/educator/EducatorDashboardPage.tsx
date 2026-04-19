import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import GroupRounded from '@mui/icons-material/GroupRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CourseStatusChip } from '../../components/CourseStatusChip'
import { PageShell } from '../../components/PageShell'
import { fetchCourses, fetchStudentsByCourse } from '../../api/api'
import type { CourseSummary, StudentProgress } from '../../types/course'
import { enrollmentStatusUa } from '../../utils/labels'

interface CourseWithStudents {
  course: CourseSummary
  students: StudentProgress[]
  loading: boolean
  error: string | null
}

export function EducatorDashboardPage() {
  const theme = useTheme()
  const [courseEntries, setCourseEntries] = useState<CourseWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCourses()
      .then(async (allCourses) => {
        if (cancelled) return
        const published = allCourses.filter((c) => c.status === 'PUBLISHED')
        const entries: CourseWithStudents[] = published.map((c) => ({
          course: c, students: [], loading: true, error: null,
        }))
        setCourseEntries(entries)
        setLoading(false)

        const results = await Promise.allSettled(
          published.map((c) => fetchStudentsByCourse(c.id)),
        )
        if (cancelled) return

        setCourseEntries((prev) =>
          prev.map((entry, i) => {
            const result = results[i]
            return result.status === 'fulfilled'
              ? { ...entry, students: result.value, loading: false }
              : { ...entry, loading: false, error: result.reason instanceof Error ? result.reason.message : 'Помилка' }
          }),
        )
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Помилка завантаження')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const totalStudents = courseEntries.reduce((sum, e) => sum + e.students.length, 0)

  return (
    <PageShell
      title="Кабінет викладача"
      subtitle="Перегляд слухачів та їхнього прогресу по кожному опублікованому курсу."
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Stats bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Paper
              variant="outlined"
              sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <SchoolRounded sx={{ color: 'primary.light', fontSize: 22 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Курсів</Typography>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>{courseEntries.length}</Typography>
              </Box>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <GroupRounded sx={{ color: 'info.main', fontSize: 22 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Слухачів</Typography>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>{totalStudents}</Typography>
              </Box>
            </Paper>
          </Box>

          {courseEntries.length === 0 ? (
            <Alert severity="info" icon={<GroupRounded />}>
              Немає опублікованих програм.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {courseEntries.map(({ course, students, loading: sLoading, error: sError }, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                >
                  <Accordion defaultExpanded={idx === 0}>
                    <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, mr: 1 }}>
                        <Box
                          sx={{
                            width: 32, height: 32, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.light', flexShrink: 0,
                          }}
                        >
                          <SchoolRounded sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, flex: 1 }}>{course.title}</Typography>
                        <CourseStatusChip status={course.status} />
                        <Chip
                          icon={<GroupRounded sx={{ fontSize: '14px !important' }} />}
                          label={students.length}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {sLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : sError ? (
                        <Alert severity="error">{sError}</Alert>
                      ) : students.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          На цей курс ще ніхто не записався.
                        </Typography>
                      ) : (
                        <TableContainer
                          component={Paper}
                          variant="outlined"
                          sx={{ bgcolor: 'background.default' }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>User ID</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell sx={{ minWidth: 160 }}>Прогрес</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {students.map((s) => (
                                <TableRow key={s.enrollmentId} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>#{s.userId}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={enrollmentStatusUa[s.status]}
                                      size="small"
                                      color={s.status === 'COMPLETED' ? 'success' : 'info'}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={s.progressPercentage}
                                        color={s.status === 'COMPLETED' ? 'success' : 'primary'}
                                        sx={{
                                          flex: 1,
                                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        }}
                                      />
                                      <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right', fontWeight: 600 }}>
                                        {s.progressPercentage}%
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </motion.div>
              ))}
            </Box>
          )}
        </>
      )}
    </PageShell>
  )
}
