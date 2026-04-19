import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { CourseStatusChip } from '../../components/CourseStatusChip'
import { PageShell } from '../../components/PageShell'
import { enrollInCourse, fetchCourses, fetchMyEnrollments } from '../../api/api'
import { useAuth } from '../../auth/AuthContext'
import type { CourseSummary, Enrollment } from '../../types/course'
import { enrollmentStatusUa } from '../../utils/labels'

const MotionCard = motion.create(Card)

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
}

export function LearnerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrollingId, setEnrollingId] = useState<number | null>(null)

  const load = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    Promise.all([fetchCourses(), fetchMyEnrollments(user.userId)])
      .then(([allCourses, myEnrollments]) => {
        setCourses(allCourses.filter((c) => c.status === 'PUBLISHED'))
        setEnrollments(myEnrollments)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Помилка завантаження'),
      )
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { load() }, [load])

  function findEnrollment(courseId: number): Enrollment | undefined {
    return enrollments.find((e) => e.courseId === courseId)
  }

  async function handleEnroll(courseId: number) {
    if (!user) return
    setEnrollingId(courseId)
    try {
      const enrollment = await enrollInCourse(courseId, user.userId)
      setEnrollments((prev) => [...prev, enrollment])
      navigate(`/learner/courses/${courseId}`)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (err instanceof Error ? err.message : 'Не вдалося записатися')
      setError(msg)
    } finally {
      setEnrollingId(null)
    }
  }

  return (
    <PageShell
      title="Навчальні програми"
      subtitle="Оберіть курс для підвищення кваліфікації. Натисніть «Розпочати», щоб записатися."
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        courses.length === 0 ? (
          <Alert severity="info" icon={<SchoolRounded />} sx={{ mt: 2 }}>
            Зараз немає опублікованих програм. Після публікації куратором вони
            з'являться тут автоматично.
          </Alert>
        ) : (
          <Grid container spacing={2.5}>
            {courses.map((c, i) => {
              const enrollment = findEnrollment(c.id)
              const isEnrolled = !!enrollment
              const isCompleted = enrollment?.status === 'COMPLETED'
              const progress = enrollment?.progressPercentage ?? 0

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
                  <MotionCard
                    variant="outlined"
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': isEnrolled
                        ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: (t) =>
                              isCompleted
                                ? t.palette.success.main
                                : `linear-gradient(90deg, ${t.palette.primary.dark}, ${t.palette.primary.main})`,
                          }
                        : undefined,
                    }}
                  >
                    <CardContent sx={{ flex: 1, p: { xs: 2, sm: 2.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                          Програма №{c.id}
                        </Typography>
                        <CourseStatusChip status={c.status} />
                      </Box>

                      <Typography variant="h6" component="h2" sx={{ mb: 1, fontWeight: 600, lineHeight: 1.3 }}>
                        {c.title}
                      </Typography>

                      {isEnrolled && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Chip
                              icon={isCompleted ? <CheckCircleRounded /> : undefined}
                              label={enrollmentStatusUa[enrollment.status]}
                              size="small"
                              color={isCompleted ? 'success' : 'info'}
                              variant="outlined"
                            />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.light' }}>
                              {progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            color={isCompleted ? 'success' : 'primary'}
                            sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }}
                          />
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5, pt: 0 }}>
                      {isEnrolled ? (
                        <Button
                          component={RouterLink}
                          to={`/learner/courses/${c.id}`}
                          variant="contained"
                          fullWidth
                          endIcon={<MenuBookRounded />}
                        >
                          Продовжити
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          disabled={enrollingId === c.id}
                          startIcon={
                            enrollingId === c.id ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <PlayArrowRounded />
                            )
                          }
                          onClick={() => handleEnroll(c.id)}
                        >
                          {enrollingId === c.id ? 'Запис…' : 'Розпочати'}
                        </Button>
                      )}
                    </CardActions>
                  </MotionCard>
                </Grid>
              )
            })}
          </Grid>
        )
      )}
    </PageShell>
  )
}
