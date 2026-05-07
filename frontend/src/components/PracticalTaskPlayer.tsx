import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material'
import CodeRounded from '@mui/icons-material/CodeRounded'
import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'
import { fetchMyTaskSubmission, submitPracticalTask } from '../api/api'
import type { PracticalTask, TaskSubmission } from '../types/course'

type Props = {
  task: PracticalTask
  onTaskSubmitted?: () => void
}

export function PracticalTaskPlayer({ task, onTaskSubmitted }: Props) {
  const [submission, setSubmission] = useState<TaskSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMyTaskSubmission(task.id)
      .then((res) => {
        if (!cancelled) setSubmission(res)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [task.id])

  async function handleSubmit() {
    if (!url.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      const result = await submitPracticalTask(task.id, { repositoryUrl: url.trim() })
      setSubmission(result)
      if (onTaskSubmitted) onTaskSubmitted()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ mt: 2, p: 3, borderLeft: '4px solid', borderLeftColor: 'secondary.main', bgcolor: 'background.paper' }}>
      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CodeRounded color="secondary" />
        {task.title}
      </Typography>
      <Box sx={{ mb: 2, typography: 'body2', color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(task.description) }} />

      {loading ? (
        <CircularProgress size={24} />
      ) : submission ? (
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Статус: {submission.status}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>Посилання: <a href={submission.repositoryUrl} target="_blank" rel="noreferrer">{submission.repositoryUrl}</a></Typography>
          {submission.reviewerComment && (
            <Alert severity={submission.status === 'APPROVED' ? 'success' : 'warning'} sx={{ mt: 1 }}>
              <Typography variant="body2"><strong>Коментар ментора:</strong> {submission.reviewerComment}</Typography>
            </Alert>
          )}
          {submission.status === 'NEEDS_WORK' && (
             <Box sx={{ mt: 2 }}>
               <Typography variant="body2" sx={{ mb: 1 }}>Ви можете надіслати нове посилання:</Typography>
               <Box sx={{ display: 'flex', gap: 1 }}>
                 <TextField size="small" fullWidth placeholder="https://github.com/..." value={url} onChange={e => setUrl(e.target.value)} />
                 <Button variant="contained" disabled={!url.trim() || submitting} onClick={() => void handleSubmit()}>Надіслати</Button>
               </Box>
             </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" sx={{ mb: 1 }}>Вставте посилання на ваш код (Pull Request, GitHub, GitLab):</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" placeholder="https://github.com/..." value={url} onChange={e => setUrl(e.target.value)} />
            <Button variant="contained" disabled={!url.trim() || submitting} onClick={() => void handleSubmit()}>Надіслати</Button>
          </Box>
        </Box>
      )}
    </Paper>
  )
}
