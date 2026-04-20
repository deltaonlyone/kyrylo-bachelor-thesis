import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Typography,
} from '@mui/material'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { deleteCourse, enrichCourseWithEditorQuizzes, fetchCourseById, updateCourse } from '../../api/api'
import type { Course, CourseStatus } from '../../types/course'
import { courseToCreatePayload } from '../../utils/coursePayload'
import { courseStatusUa } from '../../utils/labels'

export function CuratorCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const id = Number(courseId)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)

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
      .then((data) => {
        if (!cancelled) setCourse(data)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Не вдалося завантажити')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function onStatusChange(next: CourseStatus) {
    if (!course) return
    setStatusBusy(true)
    setError(null)
    try {
      const withQuizzes = await enrichCourseWithEditorQuizzes({ ...course, status: next })
      const payload = courseToCreatePayload(withQuizzes)
      const updated = await updateCourse(course.id, payload)
      setCourse(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не вдалося оновити статус')
    } finally {
      setStatusBusy(false)
    }
  }

  async function onDelete() {
    if (!course) return
    if (
      !window.confirm(
        `Видалити програму «${course.title}»? Цю дію не можна скасувати.`,
      )
    ) {
      return
    }
    setError(null)
    try {
      await deleteCourse(course.id)
      navigate('/curator/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити')
    }
  }

  return (
    <PageShell omitHeader>
      <Breadcrumbs
        separator={<ChevronRightRounded fontSize="small" />}
        sx={{ mb: 2 }}
      >
        <MuiLink component={RouterLink} to="/curator/dashboard" color="inherit">
          Каталог програм
        </MuiLink>
        <Typography color="text.primary">
          {course?.title ?? 'Програма'}
        </Typography>
      </Breadcrumbs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!loading && course ? (
        <>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'flex-start' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {course.title}
                </Typography>
                {course.description ? (
                  <Typography variant="body1" color="text.secondary">
                    {course.description}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Опис не додано.
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'center' },
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="status-edit-label">Статус</InputLabel>
                  <Select<CourseStatus>
                    labelId="status-edit-label"
                    value={course.status}
                    label="Статус"
                    disabled={statusBusy}
                    onChange={(e: SelectChangeEvent<CourseStatus>) =>
                      onStatusChange(e.target.value as CourseStatus)
                    }
                  >
                    {(Object.keys(courseStatusUa) as CourseStatus[]).map((s) => (
                      <MenuItem key={s} value={s}>
                        {courseStatusUa[s]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  type="button"
                  variant="contained"
                  component={RouterLink}
                  to={`/curator/courses/${course.id}/edit`}
                >
                  Редагувати
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineRounded />}
                  onClick={onDelete}
                >
                  Видалити
                </Button>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Зміна статусу:{' '}
              <Box component="code" sx={{ px: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                PUT /api/courses/{'{id}'}
              </Box>{' '}
              з повною структурою (вимога бекенду).
            </Typography>
          </Paper>

          <Typography variant="h6" component="h2" gutterBottom>
            Структура програми
          </Typography>

          {[...course.modules]
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
            .map((m) => (
              <Accordion key={m.id} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography sx={{ fontWeight: 600 }}>
                    Модуль {m.sortOrder}: {m.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                    {m.lessons.map((l) => (
                      <Box
                        component="li"
                        key={l.id}
                        sx={{ mb: 2, '&:last-child': { mb: 0 } }}
                      >
                        <Typography
                          variant="subtitle1"
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          {l.title}
                        </Typography>
                        <Box
                          sx={{ color: 'text.secondary', lineHeight: 1.6 }}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(l.content) }}
                        />
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
        </>
      ) : null}
    </PageShell>
  )
}
