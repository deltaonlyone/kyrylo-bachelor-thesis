import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import QuizRounded from '@mui/icons-material/QuizRounded'
import SendRounded from '@mui/icons-material/SendRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuizByLesson, submitQuiz } from '../api/api'
import { useAuth } from '../auth/AuthContext'
import type { Quiz, QuizResult } from '../types/course'

const MotionBox = motion.create(Box)
const MotionPaper = motion.create(Paper)

interface QuizPlayerProps {
  lessonId: number
  lessonTitle: string
}

export function QuizPlayer({ lessonId, lessonTitle }: QuizPlayerProps) {
  const { user } = useAuth()
  const theme = useTheme()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadQuiz = useCallback(() => {
    setLoading(true)
    setError(null)
    setResult(null)
    setAnswers({})
    setCurrentStep(0)
    fetchQuizByLesson(lessonId)
      .then((data) => setQuiz(data))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status !== 404) {
          setError(err instanceof Error ? err.message : 'Помилка завантаження тесту')
        } else {
          setQuiz(null)
        }
      })
      .finally(() => setLoading(false))
  }, [lessonId])

  useEffect(() => { loadQuiz() }, [loadQuiz])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
  if (!quiz || quiz.questions.length === 0) return null

  const questions = [...quiz.questions].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
  const total = questions.length
  const q = questions[currentStep]
  const allAnswered = questions.every((qn) => answers[qn.id] !== undefined)
  const progress = (Object.keys(answers).length / total) * 100

  function pick(qId: number, optId: number) { setAnswers((p) => ({ ...p, [qId]: optId })) }
  function next() { if (currentStep < total - 1) setCurrentStep((p) => p + 1) }
  function prev() { if (currentStep > 0) setCurrentStep((p) => p - 1) }

  async function handleSubmit() {
    if (!user || !quiz) return
    setSubmitting(true)
    try {
      const payload = {
        quizId: quiz.id,
        answers: Object.entries(answers).map(([qId, optId]) => ({
          questionId: Number(qId),
          selectedOptionId: optId,
        })),
      }
      setResult(await submitQuiz(payload, user.userId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка відправки')
    } finally {
      setSubmitting(false)
    }
  }

  function retry() { setResult(null); setAnswers({}); setCurrentStep(0) }

  /* ── Result screen ── */
  if (result) {
    const ok = result.passed
    const accentColor = ok ? theme.palette.success.main : theme.palette.warning.main

    return (
      <MotionPaper
        variant="outlined"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        sx={{
          mt: 3,
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          borderColor: alpha(accentColor, 0.35),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${alpha(accentColor, 0.08)}, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <MotionBox
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
            bgcolor: alpha(accentColor, 0.12),
            color: accentColor,
          }}
        >
          {ok ? <CheckCircleRounded sx={{ fontSize: 44 }} /> : <ReplayRounded sx={{ fontSize: 44 }} />}
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {ok ? 'Вітаємо! Тест пройдено!' : 'Спробуйте ще раз'}
          </Typography>

          <Typography
            variant="h2"
            sx={{ fontWeight: 800, color: accentColor, mb: 1, fontSize: { xs: '2.5rem', sm: '3.5rem' } }}
          >
            {result.scorePercentage}%
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Правильних: {result.correctCount} з {result.totalCount}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
            Прохідний бал: {result.passingScore}%
          </Typography>

          {ok ? (
            <Alert severity="success" sx={{ maxWidth: 380, mx: 'auto' }}>
              Ви успішно склали тест до уроку «{lessonTitle}».
            </Alert>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ maxWidth: 380, mx: 'auto', mb: 2 }}>
                Не вистачило балів. Перегляньте матеріал і спробуйте знову.
              </Alert>
              <Button
                variant="contained"
                color="warning"
                size="large"
                startIcon={<ReplayRounded />}
                onClick={retry}
              >
                Спробувати ще раз
              </Button>
            </Box>
          )}
        </MotionBox>
      </MotionPaper>
    )
  }

  /* ── Quiz screen ── */
  return (
    <Paper
      variant="outlined"
      sx={{ mt: 3, overflow: 'hidden', bgcolor: 'background.default' }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <QuizRounded color="primary" sx={{ fontSize: 20 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{quiz.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            Питання {currentStep + 1}/{total} · Прохідний бал: {quiz.passingScore}%
          </Typography>
        </Box>
      </Box>

      <LinearProgress variant="determinate" value={progress} sx={{ height: 3 }} />

      {/* Question */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <AnimatePresence mode="wait">
          <MotionBox
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5, lineHeight: 1.4 }}>
              {q.text}
            </Typography>

            <RadioGroup
              value={answers[q.id] ?? ''}
              onChange={(_, val) => pick(q.id, Number(val))}
            >
              {q.options.map((opt, idx) => (
                <Card
                  key={opt.id}
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    borderColor: answers[q.id] === opt.id ? 'primary.main' : alpha('#fff', 0.06),
                    bgcolor: answers[q.id] === opt.id ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    },
                  }}
                  onClick={() => pick(q.id, opt.id)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <FormControlLabel
                      value={opt.id}
                      control={<Radio size="small" />}
                      label={
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 700, color: 'primary.light', mr: 1 }}>
                            {String.fromCharCode(65 + idx)}.
                          </Box>
                          {opt.text}
                        </Typography>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </MotionBox>
        </AnimatePresence>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Button variant="outlined" disabled={currentStep === 0} onClick={prev} size="small">
          Назад
        </Button>
        <Typography variant="caption" color="text.secondary">
          {Object.keys(answers).length}/{total}
        </Typography>
        {currentStep < total - 1 ? (
          <Button variant="contained" onClick={next} disabled={answers[q.id] === undefined} size="small">
            Далі
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendRounded />}
            disabled={!allAnswered || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Перевірка…' : 'Завершити'}
          </Button>
        )}
      </Box>
    </Paper>
  )
}
