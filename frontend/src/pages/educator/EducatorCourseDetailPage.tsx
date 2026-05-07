import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import QuizRounded from '@mui/icons-material/QuizRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { SkillChip } from '../../components/SkillChip'
import { fetchCourseById, fetchCourseSkills } from '../../api/api'
import type { Course, CourseSkill } from '../../types/course'

export function EducatorCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const theme = useTheme()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseSkills, setCourseSkills] = useState<CourseSkill[]>([])

  useEffect(() => {
    const id = Number(courseId)
    if (!Number.isFinite(id) || id <= 0) {
      setError('Некоректний ідентифікатор курсу')
      setLoading(false)
      return
    }
    let cancelled = false
    fetchCourseById(id)
      .then((c) => { if (!cancelled) setCourse(c) })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Помилка завантаження')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    fetchCourseSkills(id)
      .then((data) => { if (!cancelled) setCourseSkills(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [courseId])

  const totalLessons = course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0
  const totalQuizzes = course?.modules.reduce(
    (s, m) => s + m.lessons.filter((l) => l.hasQuiz || l.quiz).length, 0,
  ) ?? 0

  return (
    <PageShell
      title={course?.title ?? 'Завантаження…'}
      subtitle={course ? `${course.modules.length} модулів · ${totalLessons} уроків · ${totalQuizzes} тестів` : undefined}
    >
      <Button
        component={RouterLink}
        to="/educator/dashboard"
        startIcon={<ArrowBackRounded />}
        size="small"
        sx={{ mb: 2 }}
      >
        Назад до кабінету
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {course && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {course.description && (
            <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">{course.description}</Typography>
            </Paper>
          )}

          {courseSkills.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                Компетенції курсу
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {courseSkills.map((s) => (
                  <SkillChip key={s.skillId} skillName={s.skillName} skillLevel={s.skillLevel} />
                ))}
              </Box>
            </Paper>
          )}

          {course.modules
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((mod, mi) => (
              <Accordion key={mod.id} defaultExpanded={mi === 0}>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    <Box
                      sx={{
                        width: 28, height: 28, borderRadius: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main', fontSize: '0.8rem', fontWeight: 700,
                      }}
                    >
                      {mi + 1}
                    </Box>
                    <Typography sx={{ fontWeight: 600, flex: 1 }}>{mod.name}</Typography>
                    <Chip label={`${mod.lessons.length} уроків`} size="small" variant="outlined" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {mod.lessons.map((lesson, li) => (
                      <Paper
                        key={lesson.id}
                        variant="outlined"
                        sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MenuBookRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" sx={{ flex: 1 }}>
                            Урок {li + 1}: {lesson.title}
                          </Typography>
                          {(lesson.hasQuiz || lesson.quiz) && (
                            <Chip
                              icon={<QuizRounded />}
                              label={lesson.quiz?.title ?? 'Тест'}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        {lesson.content && (
                          <Box
                            sx={{
                              mt: 0.5,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.background.paper, 0.5),
                              border: 1,
                              borderColor: 'divider',
                              '& img': { maxWidth: '100%', borderRadius: 1 },
                              '& p': { margin: 0 },
                              fontSize: '0.875rem',
                              lineHeight: 1.6,
                              color: 'text.secondary',
                            }}
                            dangerouslySetInnerHTML={{ __html: lesson.content }}
                          />
                        )}
                        {lesson.quiz && (
                          <Box sx={{ mt: 1, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Тест: {lesson.quiz.title} · Прохідний бал: {lesson.quiz.passingScore}% · {lesson.quiz.questions.length} питань
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
        </Box>
      )}
    </PageShell>
  )
}
