import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import GroupRounded from '@mui/icons-material/GroupRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CourseStatusChip } from '../../components/CourseStatusChip'
import { PageShell } from '../../components/PageShell'
import {
  enrollLearnerOnCourse,
  fetchCourses,
  fetchPendingQuizAttempts,
  fetchStudentsByCourse,
  fetchUsersByRole,
  reviewQuizAttempt,
} from '../../api/api'
import { useAuth } from '../../auth/AuthContext'
import type { CourseSummary, PendingQuizAttempt, StudentProgress } from '../../types/course'
import type { User } from '../../types/user'
import { enrollmentStatusUa } from '../../utils/labels'

interface CourseWithStudents {
  course: CourseSummary
  students: StudentProgress[]
  loading: boolean
  error: string | null
}

export function EducatorDashboardPage() {
  const { user } = useAuth()
  const theme = useTheme()
  const [courseEntries, setCourseEntries] = useState<CourseWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAttempts, setPendingAttempts] = useState<PendingQuizAttempt[]>([])
  const [reviewPoints, setReviewPoints] = useState<Record<number, number>>({})
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollCourseId, setEnrollCourseId] = useState<number | null>(null)
  const [learners, setLearners] = useState<User[]>([])
  const [pickLearnerId, setPickLearnerId] = useState<number | ''>('')
  const [enrollBusy, setEnrollBusy] = useState(false)

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

    fetchPendingQuizAttempts()
      .then((items) => {
        if (!cancelled) setPendingAttempts(items)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [])

  const totalStudents = courseEntries.reduce((sum, e) => sum + e.students.length, 0)

  async function openEnrollDialog(courseId: number) {
    setEnrollCourseId(courseId)
    setPickLearnerId('')
    setEnrollOpen(true)
    try {
      const list = await fetchUsersByRole('LEARNER')
      // Виключаємо слухачів, які вже записані на цей курс
      const entry = courseEntries.find((e) => e.course.id === courseId)
      const enrolledIds = new Set(entry?.students.map((s) => s.userId) ?? [])
      setLearners(list.filter((u) => !enrolledIds.has(u.id)))
    } catch {
      setLearners([])
    }
  }

  async function confirmEnroll() {
    if (enrollCourseId == null || pickLearnerId === '') return
    setEnrollBusy(true)
    try {
      await enrollLearnerOnCourse(enrollCourseId, Number(pickLearnerId))
      setEnrollOpen(false)
      const updated = await fetchStudentsByCourse(enrollCourseId)
      setCourseEntries((prev) =>
        prev.map((entry) =>
          entry.course.id === enrollCourseId
            ? { ...entry, students: updated, loading: false, error: null }
            : entry,
        ),
      )
    } finally {
      setEnrollBusy(false)
    }
  }

  async function handleReview(attempt: PendingQuizAttempt) {
    if (!user) return
    const reviews = attempt.openItems.map((item) => ({
      itemId: item.itemId,
      manualPoints: reviewPoints[item.itemId] ?? 0,
    }))
    await reviewQuizAttempt(attempt.attemptId, { reviews })
    setPendingAttempts((prev) => prev.filter((x) => x.attemptId !== attempt.attemptId))
  }

  return (
    <PageShell
      title="Кабінет викладача"
      subtitle="Курси вашої організації: перегляд слухачів, прогрес і запис нових слухачів на курс."
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
              {pendingAttempts.length > 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Відкриті відповіді на перевірку</Typography>
                  {pendingAttempts.map((attempt) => (
                    <Paper key={attempt.attemptId} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                      <Typography variant="subtitle2">Спроба #{attempt.attemptId} · {attempt.quizTitle} · user #{attempt.userId}</Typography>
                      {attempt.openItems.map((item) => (
                        <Box key={item.itemId} sx={{ mt: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.questionText}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.textAnswer}</Typography>
                          <TextField
                            size="small"
                            type="number"
                            label="Бали (0/1)"
                            sx={{ mt: 1, width: 120 }}
                            value={reviewPoints[item.itemId] ?? 0}
                            onChange={(e) => setReviewPoints((p) => ({ ...p, [item.itemId]: Number(e.target.value) || 0 }))}
                          />
                        </Box>
                      ))}
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label="Очікує перевірки" color="warning" size="small" />
                        <Button variant="contained" size="small" onClick={() => void handleReview(attempt)}>
                          Зберегти перевірку
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Paper>
              ) : null}
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
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => void openEnrollDialog(course.id)}
                        >
                          Записати слухача
                        </Button>
                      </Box>
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

      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Записати слухача на курс</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="learner-pick">Слухач</InputLabel>
            <Select
              labelId="learner-pick"
              label="Слухач"
              value={pickLearnerId}
              onChange={(e) => setPickLearnerId(Number(e.target.value))}
            >
              {learners.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollOpen(false)}>Скасувати</Button>
          <Button
            variant="contained"
            disabled={pickLearnerId === '' || enrollBusy}
            onClick={() => void confirmEnroll()}
          >
            Записати
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}
