import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import QuizRounded from '@mui/icons-material/QuizRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Link as MuiLink,
  Paper,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
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

          <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 1 }}>
            Зміст програми
          </Typography>

          {[...course.modules]
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
            .map((m, mi) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mi * 0.06, duration: 0.3 }}
              >
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${m.sortOrder}`}
                        size="small"
                        sx={{
                          width: 28,
                          height: 28,
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          color: 'primary.light',
                        }}
                      />
                      <Typography sx={{ fontWeight: 600 }}>{m.name}</Typography>
                      <Chip
                        label={`${m.lessons.length} урок${m.lessons.length === 1 ? '' : m.lessons.length <= 4 ? 'и' : 'ів'}`}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1, fontSize: '0.7rem', height: 22 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {m.lessons.map((l, li) => (
                        <Paper
                          key={l.id}
                          variant="outlined"
                          sx={{
                            p: { xs: 2, sm: 2.5 },
                            bgcolor: 'background.default',
                            borderColor: alpha('#fff', 0.05),
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                            <Chip
                              label={`${li + 1}`}
                              size="small"
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                bgcolor: alpha('#fff', 0.05),
                                color: 'text.secondary',
                                flexShrink: 0,
                                mt: 0.25,
                              }}
                            />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                              {l.title}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, pl: 4.5 }}
                          >
                            {l.content}
                          </Typography>

                          {l.hasQuiz && (
                            <Box sx={{ mt: 2, pl: 4.5 }}>
                              <Button
                                variant={openQuizzes[l.id] ? 'contained' : 'outlined'}
                                size="small"
                                startIcon={<QuizRounded />}
                                onClick={() => toggleQuiz(l.id)}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                              >
                                {openQuizzes[l.id] ? 'Згорнути тест' : 'Пройти тест'}
                              </Button>
                              <Collapse in={openQuizzes[l.id]} timeout={400} unmountOnExit>
                                <QuizPlayer lessonId={l.id} lessonTitle={l.title} />
                              </Collapse>
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            ))}
        </>
      )}
    </PageShell>
  )
}
