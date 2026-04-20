import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type {
  Course,
  CourseStatus,
  CreateCourseRequest,
  CreateQuestionRequest,
  QuestionType,
} from '../../types/course'
import { uploadMedia } from '../../api/api'
import { RichTextEditor } from '../../components/RichTextEditor'

type Props = {
  initialCourse?: Course
  /** Для нового курсу; для редагування береться з initialCourse */
  organizationId?: number
  submitLabel: string
  onSubmitCourse: (payload: CreateCourseRequest) => Promise<void>
}

function id() {
  return crypto.randomUUID()
}

type DraftOption = { key: string; id?: number; text: string; correct: boolean }
type DraftQuestion = {
  key: string
  id?: number
  text: string
  sortOrder: number
  type: QuestionType
  options: DraftOption[]
}
type DraftLesson = {
  key: string
  id?: number
  title: string
  content: string
  quizEnabled: boolean
  quizId?: number
  quizTitle: string
  passingScore: number
  questions: DraftQuestion[]
}
type DraftModule = {
  key: string
  id?: number
  name: string
  sortOrder: number
  lessons: DraftLesson[]
}

function emptyQuestion(order: number): DraftQuestion {
  return {
    key: id(),
    text: 'Нове питання',
    sortOrder: order,
    type: 'SINGLE',
    options: [
      { key: id(), text: 'Варіант 1', correct: true },
      { key: id(), text: 'Варіант 2', correct: false },
    ],
  }
}

function emptyLesson(): DraftLesson {
  return {
    key: id(),
    title: '',
    content: '<p></p>',
    quizEnabled: false,
    quizTitle: '',
    passingScore: 60,
    questions: [emptyQuestion(1)],
  }
}

function emptyModule(order: number): DraftModule {
  return { key: id(), name: '', sortOrder: order, lessons: [emptyLesson()] }
}

function toDraft(course?: Course): {
  title: string
  description: string
  status: CourseStatus
  modules: DraftModule[]
} {
  if (!course) return { title: '', description: '', status: 'DRAFT', modules: [emptyModule(1)] }
  return {
    title: course.title,
    description: course.description ?? '',
    status: course.status,
    modules: course.modules.map((m) => ({
      key: id(),
      id: m.id,
      name: m.name,
      sortOrder: m.sortOrder,
      lessons: m.lessons.map((l) => ({
        key: id(),
        id: l.id,
        title: l.title,
        content: l.content,
        quizEnabled: !!l.quiz,
        quizId: l.quiz?.id,
        quizTitle: l.quiz?.title ?? 'Тест',
        passingScore: l.quiz?.passingScore ?? 60,
        questions: (l.quiz?.questions ?? [emptyQuestion(1)]).map((q) => ({
          key: id(),
          id: q.id,
          text: q.text,
          sortOrder: q.sortOrder,
          type: q.type,
          options: (q.options.length ? q.options : [{ id: undefined, text: '', key: id(), correct: false }]).map((o) => ({
            key: id(),
            id: o.id,
            text: o.text,
            correct: Boolean(o.correct),
          })),
        })),
      })),
    })),
  }
}

export function CourseEditorForm({
  initialCourse,
  organizationId: organizationIdProp,
  submitLabel,
  onSubmitCourse,
}: Props) {
  const initial = useMemo(() => toDraft(initialCourse), [initialCourse])
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [status, setStatus] = useState<CourseStatus>(initial.status)
  const [modules, setModules] = useState<DraftModule[]>(initial.modules)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const pickImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    return new Promise<string | null>((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return resolve(null)
        const uploaded = await uploadMedia(file)
        resolve(uploaded.url)
      }
      input.click()
    })
  }

  async function submit() {
    setError(null)
    setSuccess(null)
    const organizationId = initialCourse?.organizationId ?? organizationIdProp
    if (organizationId === undefined || organizationId === null) {
      setError('Не обрано організацію для курсу')
      return
    }

    const payload: CreateCourseRequest = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      status,
      organizationId,
      modules: modules.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        sortOrder: m.sortOrder,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title.trim(),
          content: l.content,
          quiz: l.quizEnabled
            ? {
                id: l.quizId,
                title: l.quizTitle.trim(),
                passingScore: l.passingScore,
                questions: l.questions.map((q): CreateQuestionRequest => ({
                  id: q.id,
                  text: q.text.trim(),
                  sortOrder: q.sortOrder,
                  type: q.type,
                  options: q.type === 'OPEN_TEXT'
                    ? []
                    : q.options.map((o) => ({ id: o.id, text: o.text.trim(), correct: o.correct })),
                })),
              }
            : null,
        })),
      })),
    }
    if (!payload.title) {
      setError('Вкажіть назву програми')
      return
    }
    setSaving(true)
    try {
      await onSubmitCourse(payload)
      setSuccess('Курс збережено')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти курс')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <TextField fullWidth label="Назва програми" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextField sx={{ mt: 2 }} fullWidth multiline minRows={2} label="Опис" value={description} onChange={(e) => setDescription(e.target.value)} />
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="status">Статус</InputLabel>
        <Select labelId="status" label="Статус" value={status} onChange={(e) => setStatus(e.target.value as CourseStatus)}>
          <MenuItem value="DRAFT">Чернетка</MenuItem>
          <MenuItem value="PUBLISHED">Опубліковано</MenuItem>
          <MenuItem value="ARCHIVED">Архів</MenuItem>
        </Select>
      </FormControl>

      {modules.map((m, mi) => (
        <Paper key={m.key} variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth label={`Модуль ${mi + 1}`} value={m.name} onChange={(e) => setModules((p) => p.map((x) => x.key === m.key ? { ...x, name: e.target.value } : x))} />
            <Button color="error" onClick={() => setModules((p) => p.length > 1 ? p.filter((x) => x.key !== m.key) : p)}><DeleteOutlineRounded /></Button>
          </Box>
          {m.lessons.map((l, li) => (
            <Paper key={l.key} variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField fullWidth label={`Урок ${li + 1}`} value={l.title} onChange={(e) => setModules((p) => p.map((x) => x.key === m.key ? { ...x, lessons: x.lessons.map((y) => y.key === l.key ? { ...y, title: e.target.value } : y) } : x))} />
                <Button color="error" onClick={() => setModules((p) => p.map((x) => x.key === m.key && x.lessons.length > 1 ? { ...x, lessons: x.lessons.filter((y) => y.key !== l.key) } : x))}><DeleteOutlineRounded /></Button>
              </Box>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Контент уроку</Typography>
              <RichTextEditor
                value={l.content}
                onUploadImage={pickImage}
                onChange={(value) => setModules((p) => p.map((x) => x.key === m.key ? { ...x, lessons: x.lessons.map((y) => y.key === l.key ? { ...y, content: value } : y) } : x))}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button size="small" variant={l.quizEnabled ? 'contained' : 'outlined'} onClick={() => setModules((p) => p.map((x) => x.key === m.key ? { ...x, lessons: x.lessons.map((y) => y.key === l.key ? { ...y, quizEnabled: !y.quizEnabled } : y) } : x))}>
                  {l.quizEnabled ? 'Прибрати тест' : 'Додати тест'}
                </Button>
              </Box>
              {l.quizEnabled ? (
                <Box sx={{ mt: 2, display: 'grid', gap: 1.5 }}>
                  <TextField
                    label="Назва тесту"
                    value={l.quizTitle}
                    onChange={(e) => setModules((p) => p.map((x) => x.key === m.key ? { ...x, lessons: x.lessons.map((y) => y.key === l.key ? { ...y, quizTitle: e.target.value } : y) } : x))}
                  />
                  <TextField
                    label="Прохідний бал (%)"
                    type="number"
                    value={l.passingScore}
                    onChange={(e) => setModules((p) => p.map((x) => x.key === m.key ? { ...x, lessons: x.lessons.map((y) => y.key === l.key ? { ...y, passingScore: Number(e.target.value) || 0 } : y) } : x))}
                  />
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Питання</Typography>
                  {l.questions.map((q, qi) => (
                    <Paper key={q.key} variant="outlined" sx={{ p: 1.5, mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Питання {qi + 1}</Typography>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => setModules((p) => p.map((x) => {
                            if (x.key !== m.key) return x
                            return {
                              ...x,
                              lessons: x.lessons.map((y) => {
                                if (y.key !== l.key) return y
                                if (y.questions.length <= 1) return y
                                return { ...y, questions: y.questions.filter((qn) => qn.key !== q.key) }
                              }),
                            }
                          }))}
                          disabled={l.questions.length <= 1}
                        >
                          Видалити
                        </Button>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        label="Текст питання"
                        value={q.text}
                        onChange={(e) => setModules((p) => p.map((x) => x.key === m.key ? {
                          ...x,
                          lessons: x.lessons.map((y) => y.key === l.key ? {
                            ...y,
                            questions: y.questions.map((qn) => qn.key === q.key ? { ...qn, text: e.target.value } : qn),
                          } : y),
                        } : x))}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Порядок"
                          value={q.sortOrder}
                          onChange={(e) => setModules((p) => p.map((x) => x.key === m.key ? {
                            ...x,
                            lessons: x.lessons.map((y) => y.key === l.key ? {
                              ...y,
                              questions: y.questions.map((qn) => qn.key === q.key ? { ...qn, sortOrder: Number(e.target.value) || 0 } : qn),
                            } : y),
                          } : x))}
                          sx={{ width: 120 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel id={`qt-${q.key}`}>Тип</InputLabel>
                          <Select
                            labelId={`qt-${q.key}`}
                            label="Тип"
                            value={q.type}
                            onChange={(e) => {
                              const nextType = e.target.value as QuestionType
                              setModules((p) => p.map((x) => x.key === m.key ? {
                                ...x,
                                lessons: x.lessons.map((y) => y.key === l.key ? {
                                  ...y,
                                  questions: y.questions.map((qn) => {
                                    if (qn.key !== q.key) return qn
                                    if (nextType === 'OPEN_TEXT') {
                                      return { ...qn, type: nextType, options: [] }
                                    }
                                    if (qn.options.length === 0) {
                                      const opts = nextType === 'TRUE_FALSE'
                                        ? [
                                            { key: id(), text: 'Так', correct: true },
                                            { key: id(), text: 'Ні', correct: false },
                                          ]
                                        : [
                                            { key: id(), text: 'Варіант 1', correct: true },
                                            { key: id(), text: 'Варіант 2', correct: false },
                                          ]
                                      return { ...qn, type: nextType, options: opts }
                                    }
                                    return { ...qn, type: nextType }
                                  }),
                                } : y),
                              } : x))
                            }}
                          >
                            <MenuItem value="SINGLE">Один варіант</MenuItem>
                            <MenuItem value="MULTI">Кілька варіантів</MenuItem>
                            <MenuItem value="TRUE_FALSE">Так / Ні</MenuItem>
                            <MenuItem value="OPEN_TEXT">Відкрита відповідь</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      {q.type !== 'OPEN_TEXT' ? (
                        <Box sx={{ mt: 1 }}>
                          {q.options.map((o) => (
                            <Box key={o.key} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                              <TextField
                                size="small"
                                fullWidth
                                label="Варіант"
                                value={o.text}
                                onChange={(e) => setModules((p) => p.map((x) => x.key === m.key ? {
                                  ...x,
                                  lessons: x.lessons.map((y) => y.key === l.key ? {
                                    ...y,
                                    questions: y.questions.map((qn) => qn.key === q.key ? {
                                      ...qn,
                                      options: qn.options.map((opt) => opt.key === o.key ? { ...opt, text: e.target.value } : opt),
                                    } : qn),
                                  } : y),
                                } : x))}
                              />
                              <FormControlLabel
                                control={(
                                  <Checkbox
                                    checked={o.correct}
                                    onChange={(_, checked) => setModules((p) => p.map((x) => x.key === m.key ? {
                                      ...x,
                                      lessons: x.lessons.map((y) => y.key === l.key ? {
                                        ...y,
                                        questions: y.questions.map((qn) => {
                                          if (qn.key !== q.key) return qn
                                          if (qn.type === 'SINGLE' || qn.type === 'TRUE_FALSE') {
                                            return {
                                              ...qn,
                                              options: qn.options.map((opt) => ({
                                                ...opt,
                                                correct: opt.key === o.key ? checked : false,
                                              })),
                                            }
                                          }
                                          return {
                                            ...qn,
                                            options: qn.options.map((opt) =>
                                              opt.key === o.key ? { ...opt, correct: checked } : opt,
                                            ),
                                          }
                                        }),
                                      } : y),
                                    } : x))}
                                  />
                                )}
                                label="Правильно"
                              />
                              <Button
                                size="small"
                                color="inherit"
                                disabled={q.options.length <= 2}
                                onClick={() => setModules((p) => p.map((x) => {
                                  if (x.key !== m.key) return x
                                  return {
                                    ...x,
                                    lessons: x.lessons.map((y) => {
                                      if (y.key !== l.key) return y
                                      return {
                                        ...y,
                                        questions: y.questions.map((qn) => {
                                          if (qn.key !== q.key) return qn
                                          if (qn.options.length <= 2) return qn
                                          return { ...qn, options: qn.options.filter((opt) => opt.key !== o.key) }
                                        }),
                                      }
                                    }),
                                  }
                                }))}
                              >
                                ×
                              </Button>
                            </Box>
                          ))}
                          <Button
                            size="small"
                            onClick={() => setModules((p) => p.map((x) => x.key === m.key ? {
                              ...x,
                              lessons: x.lessons.map((y) => y.key === l.key ? {
                                ...y,
                                questions: y.questions.map((qn) => qn.key === q.key ? {
                                  ...qn,
                                  options: [...qn.options, { key: id(), text: 'Новий варіант', correct: false }],
                                } : qn),
                              } : y),
                            } : x))}
                          >
                            Варіант
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Відкрите питання без варіантів</Typography>
                      )}
                    </Paper>
                  ))}
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => setModules((p) => p.map((x) => x.key === m.key ? {
                      ...x,
                      lessons: x.lessons.map((y) => y.key === l.key ? {
                        ...y,
                        questions: [...y.questions, emptyQuestion(y.questions.length + 1)],
                      } : y),
                    } : x))}
                  >
                    Додати питання
                  </Button>
                </Box>
              ) : null}
            </Paper>
          ))}
          <Button size="small" sx={{ mt: 1 }} startIcon={<AddRounded />} onClick={() => setModules((p) => p.map((x) => x.key === m.key ? { ...x, lessons: [...x.lessons, emptyLesson()] } : x))}>Урок</Button>
        </Paper>
      ))}
      <Button sx={{ mt: 2 }} startIcon={<AddRounded />} onClick={() => setModules((p) => [...p, emptyModule(p.length + 1)])}>Модуль</Button>

      {error ? <Alert sx={{ mt: 2 }} severity="error">{error}</Alert> : null}
      {success ? <Alert sx={{ mt: 2 }} severity="success">{success}</Alert> : null}

      <Button sx={{ mt: 2 }} variant="contained" startIcon={<SaveRounded />} disabled={saving} onClick={() => void submit()}>
        {submitLabel}
      </Button>
    </Paper>
  )
}
