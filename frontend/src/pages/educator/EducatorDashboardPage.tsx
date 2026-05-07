import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import GroupRounded from '@mui/icons-material/GroupRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
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
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { CourseStatusChip } from '../../components/CourseStatusChip'
import { PageShell } from '../../components/PageShell'
import {
  enrollLearnerOnCourse,
  fetchCourses,
  fetchPendingQuizAttempts,
  fetchStudentsByCourse,
  fetchUsersByRole,
  reviewQuizAttempt,
  unenrollLearner,
  fetchPendingTaskSubmissions,
  reviewTaskSubmission,
} from '../../api/api'
import { useAuth } from '../../auth/AuthContext'
import type { CourseSummary, PendingQuizAttempt, PendingTaskSubmission, StudentProgress, TaskSubmissionStatus } from '../../types/course'
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
  const [pendingTasks, setPendingTasks] = useState<PendingTaskSubmission[]>([])
  const [taskReviews, setTaskReviews] = useState<Record<number, { status: TaskSubmissionStatus, comment: string }>>({})
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollCourseId, setEnrollCourseId] = useState<number | null>(null)
  const [learners, setLearners] = useState<User[]>([])
  const [pickLearnerId, setPickLearnerId] = useState<number | ''>('')
  const [enrollBusy, setEnrollBusy] = useState(false)

  /* Unenroll confirmation dialog */
  const [unenrollOpen, setUnenrollOpen] = useState(false)
  const [unenrollTarget, setUnenrollTarget] = useState<{ courseId: number; userId: number; name: string } | null>(null)
  const [unenrollBusy, setUnenrollBusy] = useState(false)

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

    fetchPendingTaskSubmissions()
      .then((items) => {
        if (!cancelled) setPendingTasks(items)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [])

  const totalStudents = courseEntries.reduce((sum, e) => sum + e.students.length, 0)
  const totalCompleted = courseEntries.reduce(
    (sum, e) => sum + e.students.filter((s) => s.status === 'COMPLETED').length, 0,
  )

  async function openEnrollDialog(courseId: number) {
    setEnrollCourseId(courseId)
    setPickLearnerId('')
    setEnrollOpen(true)
    try {
      const list = await fetchUsersByRole('LEARNER')
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

  function openUnenrollDialog(courseId: number, student: StudentProgress) {
    const name = student.firstName
      ? `${student.firstName} ${student.lastName ?? ''}`.trim()
      : `User #${student.userId}`
    setUnenrollTarget({ courseId, userId: student.userId, name })
    setUnenrollOpen(true)
  }

  async function confirmUnenroll() {
    if (!unenrollTarget) return
    setUnenrollBusy(true)
    try {
      await unenrollLearner(unenrollTarget.courseId, unenrollTarget.userId)
      setUnenrollOpen(false)
      setUnenrollTarget(null)
      const updated = await fetchStudentsByCourse(unenrollTarget.courseId)
      setCourseEntries((prev) =>
        prev.map((entry) =>
          entry.course.id === unenrollTarget.courseId
            ? { ...entry, students: updated, loading: false, error: null }
            : entry,
        ),
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не вдалося відрахувати')
    } finally {
      setUnenrollBusy(false)
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

  async function handleTaskReview(submissionId: number) {
    if (!user) return
    const review = taskReviews[submissionId]
    if (!review) return
    await reviewTaskSubmission(submissionId, { status: review.status, reviewerComment: review.comment })
    setPendingTasks((prev) => prev.filter((x) => x.submissionId !== submissionId))
  }

  /** Per-course analytics helper */
  function courseStats(students: StudentProgress[]) {
    if (students.length === 0) return { avg: 0, completed: 0, inProgress: 0 }
    const completed = students.filter((s) => s.status === 'COMPLETED').length
    const avg = Math.round(students.reduce((s, st) => s + st.progressPercentage, 0) / students.length)
    return { avg, completed, inProgress: students.length - completed }
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
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Stats bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Paper
              variant="outlined"
              sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <SchoolRounded sx={{ color: 'primary.main', fontSize: 22 }} />
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
            <Paper
              variant="outlined"
              sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <CheckCircleRounded sx={{ color: 'success.main', fontSize: 22 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Завершили</Typography>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>{totalCompleted}</Typography>
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
              {pendingTasks.length > 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Практичні завдання (Code Review)</Typography>
                  {pendingTasks.map((task) => (
                    <Paper key={task.submissionId} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                      <Typography variant="subtitle2">Завдання "{task.taskTitle}" · user #{task.userId}</Typography>
                      <Box sx={{ mt: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Посилання: <a href={task.repositoryUrl} target="_blank" rel="noreferrer">{task.repositoryUrl}</a>
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 160, mr: 1, mb: 1 }}>
                          <InputLabel>Рішення</InputLabel>
                          <Select
                            label="Рішення"
                            value={taskReviews[task.submissionId]?.status || 'APPROVED'}
                            onChange={(e) => setTaskReviews(p => ({ ...p, [task.submissionId]: { ...p[task.submissionId], status: e.target.value as TaskSubmissionStatus } }))}
                          >
                            <MenuItem value="APPROVED">Затвердити</MenuItem>
                            <MenuItem value="NEEDS_WORK">Повернути на доопрацювання</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          size="small"
                          fullWidth
                          label="Коментар"
                          value={taskReviews[task.submissionId]?.comment || ''}
                          onChange={(e) => setTaskReviews(p => ({ ...p, [task.submissionId]: { ...p[task.submissionId], comment: e.target.value } }))}
                        />
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label="Очікує перевірки" color="warning" size="small" />
                        <Button variant="contained" size="small" onClick={() => void handleTaskReview(task.submissionId)}>
                          Зберегти перевірку
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Paper>
              ) : null}
              {courseEntries.map(({ course, students, loading: sLoading, error: sError }, idx) => {
                const stats = courseStats(students)
                return (
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
                              color: 'primary.main', flexShrink: 0,
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
                        {/* Per-course analytics */}
                        {!sLoading && students.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            <Chip
                              icon={<TrendingUpRounded />}
                              label={`Сер. прогрес: ${stats.avg}%`}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                            <Chip
                              icon={<CheckCircleRounded />}
                              label={`Завершили: ${stats.completed}`}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                            <Chip
                              label={`В процесі: ${stats.inProgress}`}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        )}

                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            component={RouterLink}
                            to={`/educator/courses/${course.id}`}
                            size="small"
                            variant="outlined"
                            startIcon={<MenuBookRounded />}
                          >
                            Деталі курсу
                          </Button>
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
                                  <TableCell>Слухач</TableCell>
                                  <TableCell>Email</TableCell>
                                  <TableCell>Статус</TableCell>
                                  <TableCell sx={{ minWidth: 160 }}>Прогрес</TableCell>
                                  <TableCell sx={{ width: 56 }} />
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {students.map((s) => (
                                  <TableRow key={s.enrollmentId} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                      {s.firstName
                                        ? `${s.lastName ?? ''} ${s.firstName}`.trim()
                                        : `#${s.userId}`}
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                                        {s.email || '—'}
                                      </Typography>
                                    </TableCell>
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
                                    <TableCell>
                                      <Tooltip title="Відрахувати">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => openUnenrollDialog(course.id, s)}
                                        >
                                          <DeleteOutlineRounded fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
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
                )
              })}
            </Box>
          )}
        </>
      )}

      {/* Enroll dialog */}
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

      {/* Unenroll confirmation dialog */}
      <Dialog open={unenrollOpen} onClose={() => setUnenrollOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Відрахувати слухача?</DialogTitle>
        <DialogContent>
          <Typography>
            Ви дійсно хочете відрахувати <strong>{unenrollTarget?.name}</strong> з курсу?
            Весь прогрес буде втрачено.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnenrollOpen(false)}>Скасувати</Button>
          <Button
            variant="contained"
            color="error"
            disabled={unenrollBusy}
            onClick={() => void confirmUnenroll()}
          >
            {unenrollBusy ? 'Видалення…' : 'Відрахувати'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}
