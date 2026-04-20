import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import NavigateBeforeRounded from '@mui/icons-material/NavigateBeforeRounded'
import NavigateNextRounded from '@mui/icons-material/NavigateNextRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import QuizRounded from '@mui/icons-material/QuizRounded'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Collapse,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import DOMPurify from 'dompurify'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { CourseStatusChip } from '../../components/CourseStatusChip'
import { PageShell } from '../../components/PageShell'
import { QuizPlayer } from '../../components/QuizPlayer'
import { fetchCourseById } from '../../api/api'
import type { Course } from '../../types/course'

const MotionPaper = motion.create(Paper)

export function LearnerCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const theme = useTheme()
  const id = Number(courseId)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openQuizzes, setOpenQuizzes] = useState<Record<number, boolean>>({})
  const [lessonIndex, setLessonIndex] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Некоректний ідентифікатор програми.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchCourseById(id)
      .then((data) => { if (!cancelled) setCourse(data) })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не вдалося завантажити')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  function toggleQuiz(lessonId: number) {
    setOpenQuizzes((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }))
  }

  const lessons = course
    ? [...course.modules]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .flatMap((m) => m.lessons.map((l) => ({ ...l, moduleName: m.name })))
    : []
  const current = lessons[lessonIndex]
  const progress = lessons.length ? ((lessonIndex + 1) / lessons.length) * 100 : 0

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
                background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
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
              <CourseStatusChip status={course.status} />
            </Box>
          </MotionPaper>

          {course.status !== 'PUBLISHED' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Програма не опублікована. Для навчання доступні лише опубліковані програми.
            </Alert>
          )}

          {current ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Сторінкове проходження курсу</Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="overline" color="text.secondary">
                  {current.moduleName} · Урок {lessonIndex + 1} з {lessons.length}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 2 }}>{current.title}</Typography>
                <Box
                  sx={{ lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.content) }}
                />
                {current.hasQuiz ? (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant={openQuizzes[current.id] ? 'contained' : 'outlined'}
                      size="small"
                      startIcon={<QuizRounded />}
                      onClick={() => toggleQuiz(current.id)}
                    >
                      {openQuizzes[current.id] ? 'Згорнути тест' : 'Пройти тест'}
                    </Button>
                    <Collapse in={openQuizzes[current.id]} timeout={300} unmountOnExit>
                      <QuizPlayer lessonId={current.id} lessonTitle={current.title} />
                    </Collapse>
                  </Box>
                ) : null}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button startIcon={<NavigateBeforeRounded />} disabled={lessonIndex === 0} onClick={() => setLessonIndex((v) => Math.max(v - 1, 0))}>
                    Назад
                  </Button>
                  <Button endIcon={<NavigateNextRounded />} disabled={lessonIndex >= lessons.length - 1} onClick={() => setLessonIndex((v) => Math.min(v + 1, lessons.length - 1))}>
                    Далі
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          ) : null}
        </>
      )}
    </PageShell>
  )
}
