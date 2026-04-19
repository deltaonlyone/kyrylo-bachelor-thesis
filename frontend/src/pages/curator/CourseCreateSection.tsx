import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import PostAddRounded from '@mui/icons-material/PostAddRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { createCourse } from '../../api/api'
import type { CourseStatus, CreateCourseRequest } from '../../types/course'

type LessonDraft = { key: string; title: string; content: string }
type ModuleDraft = { key: string; name: string; sortOrder: number; lessons: LessonDraft[] }

function newKey() {
  return crypto.randomUUID()
}

function emptyLesson(): LessonDraft {
  return { key: newKey(), title: '', content: '' }
}

function emptyModule(order: number): ModuleDraft {
  return {
    key: newKey(),
    name: '',
    sortOrder: order,
    lessons: [emptyLesson()],
  }
}

type Props = {
  onCreated: () => void
}

export function CourseCreateSection({ onCreated }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<CourseStatus>('DRAFT')
  const [modules, setModules] = useState<ModuleDraft[]>(() => [emptyModule(1)])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function addModule() {
    const nextOrder =
      modules.length === 0
        ? 1
        : Math.max(...modules.map((m) => m.sortOrder), 0) + 1
    setModules((prev) => [...prev, emptyModule(nextOrder)])
  }

  function removeModule(key: string) {
    setModules((prev) => (prev.length <= 1 ? prev : prev.filter((m) => m.key !== key)))
  }

  function updateModule(key: string, patch: Partial<ModuleDraft>) {
    setModules((prev) =>
      prev.map((m) => (m.key === key ? { ...m, ...patch } : m)),
    )
  }

  function addLesson(moduleKey: string) {
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey
          ? { ...m, lessons: [...m.lessons, emptyLesson()] }
          : m,
      ),
    )
  }

  function removeLesson(moduleKey: string, lessonKey: string) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.key !== moduleKey) return m
        if (m.lessons.length <= 1) return m
        return {
          ...m,
          lessons: m.lessons.filter((l) => l.key !== lessonKey),
        }
      }),
    )
  }

  function updateLesson(
    moduleKey: string,
    lessonKey: string,
    patch: Partial<LessonDraft>,
  ) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.key !== moduleKey) return m
        return {
          ...m,
          lessons: m.lessons.map((l) =>
            l.key === lessonKey ? { ...l, ...patch } : l,
          ),
        }
      }),
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const t = title.trim()
    if (!t) {
      setError('Вкажіть назву програми.')
      return
    }

    const body: CreateCourseRequest = {
      title: t,
      description: description.trim() === '' ? null : description.trim(),
      status,
      modules: modules.map((m) => ({
        name: m.name.trim(),
        sortOrder: m.sortOrder,
        lessons: m.lessons.map((l) => ({
          title: l.title.trim(),
          content: l.content,
        })),
      })),
    }

    const emptyModuleName = body.modules.some((m) => !m.name)
    if (emptyModuleName) {
      setError('У кожного модуля має бути назва.')
      return
    }

    for (const m of body.modules) {
      for (const l of m.lessons) {
        if (!l.title.trim() || !l.content.trim()) {
          setError(
            'Якщо у модулі є урок, заповніть для нього заголовок і текст контенту.',
          )
          return
        }
      }
    }

    setSaving(true)
    try {
      await createCourse(body)
      setSuccess('Програму збережено. Дані надіслано на course-service через API Gateway.')
      setTitle('')
      setDescription('')
      setStatus('DRAFT')
      setModules([emptyModule(1)])
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити курс')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{ mb: 3 }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        aria-controls="create-course-panel"
        id="create-course-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PostAddRounded color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Нова навчальна програма (модулі та уроки)
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Запит відповідає <strong>POST /api/courses</strong>: вкладені модулі та
              уроки, як очікує Spring Boot.
            </Typography>

            <TextField
              label="Назва програми"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Напр.: Хмарна інфраструктура для ІТ-команд"
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Опис (необов’язково)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Цілі, аудиторія, тривалість…"
              fullWidth
              multiline
              minRows={3}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="pub-status-label">Статус публікації</InputLabel>
              <Select<CourseStatus>
                labelId="pub-status-label"
                value={status}
                label="Статус публікації"
                onChange={(e: SelectChangeEvent<CourseStatus>) =>
                  setStatus(e.target.value as CourseStatus)
                }
              >
                <MenuItem value="DRAFT">Чернетка</MenuItem>
                <MenuItem value="PUBLISHED">Опубліковано (видно слухачам)</MenuItem>
                <MenuItem value="ARCHIVED">Архів</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography variant="h6" component="h2">
                Модулі та уроки
              </Typography>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<AddRounded />}
                onClick={addModule}
              >
                Додати модуль
              </Button>
            </Box>

            {modules.map((mod, mi) => (
              <Paper
                key={mod.key}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Typography variant="overline" color="text.secondary">
                    Модуль {mi + 1}
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    color="inherit"
                    startIcon={<DeleteOutlineRounded />}
                    onClick={() => removeModule(mod.key)}
                    disabled={modules.length <= 1}
                  >
                    Прибрати
                  </Button>
                </Box>
                <TextField
                  label="Назва модуля"
                  value={mod.name}
                  onChange={(e) => updateModule(mod.key, { name: e.target.value })}
                  placeholder="Напр.: Вступ до DevOps"
                  fullWidth
                  margin="dense"
                />
                <TextField
                  label="Порядок (sortOrder)"
                  type="number"
                  value={mod.sortOrder}
                  onChange={(e) =>
                    updateModule(mod.key, {
                      sortOrder: Number.parseInt(e.target.value, 10) || 1,
                    })
                  }
                  fullWidth
                  margin="dense"
                  slotProps={{ htmlInput: { min: 1 } }}
                />

                {mod.lessons.map((les, li) => (
                  <Box
                    key={les.key}
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Урок {li + 1}
                      </Typography>
                      <Button
                        type="button"
                        size="small"
                        color="inherit"
                        startIcon={<DeleteOutlineRounded />}
                        onClick={() => removeLesson(mod.key, les.key)}
                        disabled={mod.lessons.length <= 1}
                      >
                        Прибрати
                      </Button>
                    </Box>
                    <TextField
                      label="Заголовок уроку"
                      value={les.title}
                      onChange={(e) =>
                        updateLesson(mod.key, les.key, { title: e.target.value })
                      }
                      placeholder="Тема заняття"
                      fullWidth
                      margin="dense"
                    />
                    <TextField
                      label="Контент (текст)"
                      value={les.content}
                      onChange={(e) =>
                        updateLesson(mod.key, les.key, { content: e.target.value })
                      }
                      placeholder="Матеріал для самостійного вивчення…"
                      fullWidth
                      multiline
                      minRows={4}
                      margin="dense"
                    />
                  </Box>
                ))}
                <Button
                  type="button"
                  size="small"
                  variant="text"
                  startIcon={<AddRounded />}
                  onClick={() => addLesson(mod.key)}
                  sx={{ mt: 1 }}
                >
                  Урок у цей модуль
                </Button>
              </Paper>
            ))}

            {error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            ) : null}
            {success ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={saving}
              startIcon={<SaveRounded />}
              sx={{ mt: 3 }}
              fullWidth
            >
              {saving ? 'Збереження…' : 'Створити програму в системі'}
            </Button>
          </Box>
        </Paper>
      </AccordionDetails>
    </Accordion>
  )
}
