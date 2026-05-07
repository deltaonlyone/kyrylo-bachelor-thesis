import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import NavigateBeforeRounded from '@mui/icons-material/NavigateBeforeRounded'
import NavigateNextRounded from '@mui/icons-material/NavigateNextRounded'
import PendingRounded from '@mui/icons-material/PendingRounded'
import QuizRounded from '@mui/icons-material/QuizRounded'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import DOMPurify from 'dompurify'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { CourseStatusChip } from '../../components/CourseStatusChip'
import { PageShell } from '../../components/PageShell'
import { QuizPlayer } from '../../components/QuizPlayer'
import { PracticalTaskPlayer } from '../../components/PracticalTaskPlayer'
import { SkillChip } from '../../components/SkillChip'
import { fetchCourseById, fetchCourseProgress, fetchCourseSkills } from '../../api/api'
import type { Course, CourseProgress, CourseSkill, LessonProgress } from '../../types/course'

const MotionPaper = motion.create(Paper)

export function LearnerCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const theme = useTheme()
  const navigate = useNavigate()
  const id = Number(courseId)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openQuizzes, setOpenQuizzes] = useState<Record<number, boolean>>({})
  const [openTasks, setOpenTasks] = useState<Record<number, boolean>>({})
  const [lessonIndex, setLessonIndex] = useState(0)
  const [courseSkills, setCourseSkills] = useState<CourseSkill[]>([])
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [initialIndexSet, setInitialIndexSet] = useState(false)

  const loadProgress = useCallback(() => {
    if (!Number.isFinite(id) || id <= 0) return
    fetchCourseProgress(id)
      .then((data) => setProgress(data))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Некоректний ідентифікатор програми.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchCourseById(id), fetchCourseProgress(id), fetchCourseSkills(id)])
      .then(([courseData, progressData, skillsData]) => {
        if (cancelled) return
        setCourse(courseData)
        setProgress(progressData)
        setCourseSkills(skillsData)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не вдалося завантажити')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  // Flat list of lessons sorted by module order
  const lessons = useMemo(() => {
    if (!course) return []
    return [...course.modules]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .flatMap((m) => m.lessons.map((l) => ({ ...l, moduleName: m.name })))
  }, [course])

  // Build a map of lesson progress by lessonId
  const lessonProgressMap = useMemo(() => {
    const map = new Map<number, LessonProgress>()
    if (progress) {
      for (const lp of progress.lessonProgresses) {
        map.set(lp.lessonId, lp)
      }
    }
    return map
  }, [progress])

  // Auto-scroll to first incomplete lesson on initial load
  useEffect(() => {
    if (initialIndexSet || lessons.length === 0 || !progress) return
    const firstIncomplete = lessons.findIndex((l) => {
      const lp = lessonProgressMap.get(l.id)
      return !lp || !lp.completed
    })
    setLessonIndex(firstIncomplete >= 0 ? firstIncomplete : lessons.length - 1)
    setInitialIndexSet(true)
  }, [lessons, progress, lessonProgressMap, initialIndexSet])

  function toggleQuiz(lessonId: number) {
    setOpenQuizzes((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }))
  }

  function toggleTask(lessonId: number) {
    setOpenTasks((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }))
  }

  const current = lessons[lessonIndex]
  const currentProgress = current ? lessonProgressMap.get(current.id) : undefined
  const isCurrentCompleted = currentProgress?.completed ?? (!current?.hasQuiz && !current?.hasPracticalTask)
  const isLastLesson = lessonIndex >= lessons.length - 1
  const allCompleted = progress ? progress.progressPercentage >= 100 : false
  const isCourseCompleted = progress?.enrollmentStatus === 'COMPLETED'

  /** Can the user go to the next lesson? */
  const canGoNext = isCurrentCompleted

  /** Lesson status icon */
  function lessonStatusIcon(lesson: typeof lessons[0]) {
    const lp = lessonProgressMap.get(lesson.id)
    if (!lp) return null

    if (!lp.hasQuiz && !lp.hasPracticalTask) {
      // No assessments – always completed
      return <CheckCircleRounded sx={{ fontSize: 18, color: 'success.main' }} />
    }

    if (lp.completed) {
      return <CheckCircleRounded sx={{ fontSize: 18, color: 'success.main' }} />
    }

    // Has pending task or quiz attempted but not passed
    const hasActivity =
      lp.quizPassed === false || lp.taskStatus === 'PENDING' || lp.taskStatus === 'NEEDS_WORK'
    if (hasActivity) {
      return <PendingRounded sx={{ fontSize: 18, color: 'warning.main' }} />
    }

    return <LockRounded sx={{ fontSize: 18, color: 'text.disabled' }} />
  }

  function handleFinishCourse() {
    navigate('/learner/dashboard')
  }

  return (
    <PageShell omitHeader>
      <Breadcrumbs separator={<ChevronRightRounded fontSize="small" />} sx={{ mb: 2.5 }}>
        <MuiLink component={RouterLink} to="/learner/dashboard" color="inherit" sx={{ fontSize: '0.875rem' }}>
          Мої програми
        </MuiLink>
        <Typography color="text.primary" sx={{ fontSize: '0.875rem' }}>
          {course?.title ?? 'Програма'}
        </Typography>
      </Breadcrumbs>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && course && (
        <>
          {/* Header card */}
          <MotionPaper
            variant="outlined"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: isCourseCompleted
                  ? theme.palette.success.main
                  : `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.light',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <MenuBookRounded />
                </Box>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
                    {course.title}
                  </Typography>
                  {course.description && (
                    <Typography variant="body2" color="text.secondary">
                      {course.description}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isCourseCompleted && (
                  <Chip
                    icon={<EmojiEventsRounded />}
                    label="Курс завершено"
                    color="success"
                    variant="filled"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                )}
                <CourseStatusChip status={course.status} />
              </Box>
            </Box>

            {/* Real progress bar */}
            {progress && (
              <Box sx={{ mt: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Прогрес курсу
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {progress.progressPercentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress.progressPercentage}
                  color={isCourseCompleted ? 'success' : 'primary'}
                  sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.08) }}
                />
              </Box>
            )}
          </MotionPaper>

          {courseSkills.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                Компетенції, що надає цей курс
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {courseSkills.map((s) => (
                  <SkillChip key={s.skillId} skillName={s.skillName} skillLevel={s.skillLevel} />
                ))}
              </Box>
            </Paper>
          )}

          {course.status !== 'PUBLISHED' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Програма не опублікована. Для навчання доступні лише опубліковані програми.
            </Alert>
          )}

          {/* Lesson navigation pills */}
          {lessons.length > 1 && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {lessons.map((l, idx) => {
                const lp = lessonProgressMap.get(l.id)
                const isCompleted = lp?.completed ?? (!l.hasQuiz && !l.hasPracticalTask)
                const isCurrent = idx === lessonIndex

                // Can access this lesson? All previous must be completed (sequential)
                const canAccess = lessons.slice(0, idx).every((prev) => {
                  const pp = lessonProgressMap.get(prev.id)
                  return pp?.completed ?? (!prev.hasQuiz && !prev.hasPracticalTask)
                })

                return (
                  <Tooltip key={l.id} title={l.title} arrow>
                    <span>
                      <Chip
                        icon={lessonStatusIcon(l) ?? undefined}
                        label={idx + 1}
                        size="small"
                        variant={isCurrent ? 'filled' : 'outlined'}
                        color={isCompleted ? 'success' : isCurrent ? 'primary' : 'default'}
                        disabled={!canAccess}
                        onClick={canAccess ? () => setLessonIndex(idx) : undefined}
                        sx={{
                          fontWeight: isCurrent ? 700 : 500,
                          cursor: canAccess ? 'pointer' : 'default',
                        }}
                      />
                    </span>
                  </Tooltip>
                )
              })}
            </Paper>
          )}

          {current ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={current.id}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="overline" color="text.secondary">
                  {current.moduleName} · Урок {lessonIndex + 1} з {lessons.length}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 2 }}>{current.title}</Typography>
                <Box
                  sx={{ lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.content) }}
                />

                {/* Quiz section */}
                {current.hasQuiz ? (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant={openQuizzes[current.id] ? 'contained' : 'outlined'}
                        size="small"
                        startIcon={<QuizRounded />}
                        onClick={() => toggleQuiz(current.id)}
                      >
                        {openQuizzes[current.id] ? 'Згорнути тест' : 'Пройти тест'}
                      </Button>
                      {currentProgress?.quizPassed === true && (
                        <Chip icon={<CheckCircleRounded />} label="Тест пройдено" color="success" size="small" variant="outlined" />
                      )}
                      {currentProgress?.quizPassed === false && (
                        <Chip label="Тест не пройдено" color="warning" size="small" variant="outlined" />
                      )}
                    </Box>
                    <Collapse in={openQuizzes[current.id]} timeout={300} unmountOnExit>
                      <QuizPlayer lessonId={current.id} lessonTitle={current.title} onQuizPassed={loadProgress} />
                    </Collapse>
                  </Box>
                ) : null}

                {/* Practical task section */}
                {current.hasPracticalTask && current.practicalTask ? (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant={openTasks[current.id] ? 'contained' : 'outlined'}
                        color="secondary"
                        size="small"
                        startIcon={<QuizRounded />}
                        onClick={() => toggleTask(current.id)}
                      >
                        {openTasks[current.id] ? 'Згорнути завдання' : 'Відкрити завдання'}
                      </Button>
                      {currentProgress?.taskStatus === 'APPROVED' && (
                        <Chip icon={<CheckCircleRounded />} label="Завдання прийнято" color="success" size="small" variant="outlined" />
                      )}
                      {currentProgress?.taskStatus === 'PENDING' && (
                        <Chip icon={<PendingRounded />} label="На перевірці" color="info" size="small" variant="outlined" />
                      )}
                      {currentProgress?.taskStatus === 'NEEDS_WORK' && (
                        <Chip label="Потребує доопрацювання" color="warning" size="small" variant="outlined" />
                      )}
                    </Box>
                    <Collapse in={openTasks[current.id]} timeout={300} unmountOnExit>
                      <PracticalTaskPlayer task={current.practicalTask} onTaskSubmitted={loadProgress} />
                    </Collapse>
                  </Box>
                ) : null}

                {/* Mandatory assessment notice */}
                {!isCurrentCompleted && (current.hasQuiz || current.hasPracticalTask) && (
                  <Alert severity="info" sx={{ mt: 2 }} icon={<LockRounded />}>
                    {current.hasQuiz && currentProgress?.quizPassed !== true && (
                      <Typography variant="body2">
                        Для переходу до наступного уроку необхідно успішно пройти тест.
                      </Typography>
                    )}
                    {current.hasPracticalTask && (currentProgress?.taskStatus === null || currentProgress?.taskStatus === undefined || currentProgress?.taskStatus === 'NEEDS_WORK') && (
                      <Typography variant="body2">
                        Для переходу до наступного уроку необхідно відправити практичне завдання.
                      </Typography>
                    )}
                  </Alert>
                )}

                {/* Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, gap: 1 }}>
                  <Button
                    startIcon={<NavigateBeforeRounded />}
                    disabled={lessonIndex === 0}
                    onClick={() => setLessonIndex((v) => Math.max(v - 1, 0))}
                  >
                    Назад
                  </Button>

                  {isLastLesson ? (
                    <Tooltip
                      title={
                        !allCompleted && !isCourseCompleted
                          ? 'Завершіть усі тести та завдання для закінчення курсу'
                          : ''
                      }
                    >
                      <span>
                        <Button
                          variant="contained"
                          color="success"
                          endIcon={<EmojiEventsRounded />}
                          disabled={!allCompleted && !isCourseCompleted}
                          onClick={handleFinishCourse}
                          sx={{ fontWeight: 700 }}
                        >
                          {isCourseCompleted ? 'Повернутися до програм' : 'Завершити курс'}
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title={!canGoNext ? 'Пройдіть тест та завдання цього уроку' : ''}>
                      <span>
                        <Button
                          endIcon={<NavigateNextRounded />}
                          disabled={!canGoNext}
                          onClick={() => setLessonIndex((v) => Math.min(v + 1, lessons.length - 1))}
                        >
                          Далі
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            </motion.div>
          ) : null}
        </>
      )}
    </PageShell>
  )
}
