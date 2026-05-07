import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { fetchMySkills } from '../api/api'
import type { SkillCategory, UserSkill } from '../types/course'
import { skillCategoryUa, skillLevelUa } from '../utils/labels'

const MotionCard = motion.create(Card)

/** Skill level numeric weight for progress bar (1–4). */
const levelWeight: Record<string, number> = {
  TRAINEE: 1,
  JUNIOR: 2,
  MIDDLE: 3,
  SENIOR: 4,
}

/** Category order for stable grouping. */
const categoryOrder: SkillCategory[] = [
  'BACKEND',
  'FRONTEND',
  'DEVOPS',
  'CLOUD',
  'DATA',
  'SOFT_SKILLS',
]

/** Color for each skill level (used on progress bar). */
const levelBarColor: Record<string, string> = {
  TRAINEE: '#90a4ae',
  JUNIOR: '#42a5f5',
  MIDDLE: '#ab47bc',
  SENIOR: '#ffa726',
}

/**
 * "Мої компетенції" card for the Learner dashboard.
 * Fetches the user's acquired skills and groups them by category.
 */
export function SkillMatrixCard() {
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchMySkills()
      .then(setSkills)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Помилка завантаження навичок'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (skills.length === 0) {
    return null // don't render if no skills yet
  }

  // Group by category
  const grouped = new Map<SkillCategory, UserSkill[]>()
  for (const s of skills) {
    if (!grouped.has(s.category)) grouped.set(s.category, [])
    grouped.get(s.category)!.push(s)
  }

  // Sort categories by predefined order
  const orderedCategories = categoryOrder.filter((c) => grouped.has(c))

  return (
    <MotionCard
      variant="outlined"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      sx={{ mb: 3, overflow: 'visible' }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <AutoAwesomeRounded sx={{ color: 'warning.main' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
            Мої компетенції
          </Typography>
          <Typography
            variant="caption"
            sx={{
              ml: 'auto',
              color: 'text.secondary',
              fontWeight: 600,
            }}
          >
            {skills.length} {skills.length === 1 ? 'навичка' : skills.length < 5 ? 'навички' : 'навичок'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orderedCategories.map((cat) => (
            <Box key={cat}>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: 1.5,
                  color: 'text.secondary',
                  mb: 0.75,
                  display: 'block',
                }}
              >
                {skillCategoryUa[cat]}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {grouped.get(cat)!.map((skill) => {
                  const weight = levelWeight[skill.skillLevel] ?? 1
                  const progress = (weight / 4) * 100
                  const barColor = levelBarColor[skill.skillLevel] ?? '#90a4ae'

                  return (
                    <Box key={skill.skillId}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.25,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {skill.skillName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: barColor,
                          }}
                        >
                          {skillLevelUa[skill.skillLevel]}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: (t) => alpha(t.palette.divider, 0.15),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: barColor,
                          },
                        }}
                      />
                    </Box>
                  )
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </MotionCard>
  )
}
