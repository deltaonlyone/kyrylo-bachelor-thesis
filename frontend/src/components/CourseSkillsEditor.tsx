import AddRounded from '@mui/icons-material/AddRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { fetchCourseSkills, fetchSkills, updateCourseSkills } from '../api/api'
import type { CourseSkill, CourseSkillRequest, Skill, SkillLevel } from '../types/course'
import { skillLevelUa } from '../utils/labels'
import { SkillChip } from './SkillChip'

const LEVELS: SkillLevel[] = ['TRAINEE', 'JUNIOR', 'MIDDLE', 'SENIOR']

interface CourseSkillsEditorProps {
  courseId: number
}

/**
 * Curator component for managing course → skill bindings.
 * Shows current skills, allows adding new ones from the catalog with a level, and saving.
 */
export function CourseSkillsEditor({ courseId }: CourseSkillsEditorProps) {
  const [catalog, setCatalog] = useState<Skill[]>([])
  const [assigned, setAssigned] = useState<CourseSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // New skill form
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('JUNIOR')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([fetchSkills(), fetchCourseSkills(courseId)])
      .then(([skills, courseSkills]) => {
        setCatalog(skills)
        setAssigned(courseSkills)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Помилка завантаження'),
      )
      .finally(() => setLoading(false))
  }, [courseId])

  useEffect(() => {
    load()
  }, [load])

  // Skills not yet assigned to this course
  const available = catalog.filter(
    (s) => !assigned.some((a) => a.skillId === s.id),
  )

  function handleAdd() {
    if (!selectedSkill) return
    const newItem: CourseSkill = {
      skillId: selectedSkill.id,
      skillName: selectedSkill.name,
      category: selectedSkill.category,
      skillLevel: selectedLevel,
    }
    setAssigned((prev) => [...prev, newItem])
    setSelectedSkill(null)
    setSelectedLevel('JUNIOR')
    setSuccess(false)
  }

  function handleRemove(skillId: number) {
    setAssigned((prev) => prev.filter((a) => a.skillId !== skillId))
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: CourseSkillRequest[] = assigned.map((a) => ({
        skillId: a.skillId,
        skillLevel: a.skillLevel,
      }))
      const saved = await updateCourseSkills(courseId, payload)
      setAssigned(saved)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
        Навички курсу
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Вкажіть, які компетенції отримає працівник після завершення цього курсу.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Навички збережено!
        </Alert>
      )}

      {/* Current skills */}
      {assigned.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
          {assigned.map((a) => (
            <SkillChip
              key={a.skillId}
              skillName={a.skillName}
              skillLevel={a.skillLevel}
              onDelete={() => handleRemove(a.skillId)}
            />
          ))}
        </Box>
      )}

      {/* Add skill form */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Autocomplete
          value={selectedSkill}
          onChange={(_e, val) => setSelectedSkill(val)}
          options={available}
          getOptionLabel={(o) => o.name}
          groupBy={(o) => o.category}
          size="small"
          sx={{ minWidth: 220, flex: 1 }}
          renderInput={(params) => (
            <TextField {...params} label="Навичка" placeholder="Оберіть навичку…" />
          )}
          noOptionsText="Немає доступних навичок"
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Рівень</InputLabel>
          <Select<SkillLevel>
            value={selectedLevel}
            label="Рівень"
            onChange={(e: SelectChangeEvent<SkillLevel>) =>
              setSelectedLevel(e.target.value as SkillLevel)
            }
          >
            {LEVELS.map((lv) => (
              <MenuItem key={lv} value={lv}>
                {skillLevelUa[lv]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<AddRounded />}
          disabled={!selectedSkill}
          onClick={handleAdd}
          size="small"
          sx={{ height: 40, flexShrink: 0 }}
        >
          Додати
        </Button>
      </Box>

      {/* Save button */}
      <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Збереження…' : 'Зберегти навички'}
        </Button>
      </Box>
    </Paper>
  )
}
