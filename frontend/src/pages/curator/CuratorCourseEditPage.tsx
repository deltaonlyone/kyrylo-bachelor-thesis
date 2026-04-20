import { Alert, Box, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { enrichCourseWithEditorQuizzes, fetchCourseById, updateCourse } from '../../api/api'
import { PageShell } from '../../components/PageShell'
import type { Course, CreateCourseRequest } from '../../types/course'
import { CourseEditorForm } from './CourseEditorForm'

export function CuratorCourseEditPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(courseId)
    if (!Number.isFinite(id) || id <= 0) {
      setError('Некоректний ідентифікатор курсу')
      setLoading(false)
      return
    }
    let cancelled = false
    fetchCourseById(id)
      .then(async (c) => {
        const enriched = await enrichCourseWithEditorQuizzes(c)
        if (!cancelled) setCourse(enriched)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Помилка завантаження')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  async function onSubmit(payload: CreateCourseRequest) {
    if (!course) return
    await updateCourse(course.id, payload)
    navigate(`/curator/courses/${course.id}`, { replace: true })
  }

  return (
    <PageShell title="Редагування курсу">
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {course ? <CourseEditorForm initialCourse={course} submitLabel="Зберегти зміни" onSubmitCourse={onSubmit} /> : null}
    </PageShell>
  )
}
