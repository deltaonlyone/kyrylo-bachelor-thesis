import { Chip, type ChipProps } from '@mui/material'
import type { SkillLevel } from '../types/course'
import { skillLevelUa } from '../utils/labels'

const levelColor: Record<SkillLevel, ChipProps['color']> = {
  TRAINEE: 'default',
  JUNIOR: 'info',
  MIDDLE: 'secondary',
  SENIOR: 'warning',
}

interface SkillChipProps {
  skillName: string
  skillLevel: SkillLevel
  size?: 'small' | 'medium'
  onDelete?: () => void
}

/**
 * Compact chip showing a skill name + level.
 * Color is based on the level: Trainee = grey, Junior = blue, Middle = purple, Senior = gold.
 */
export function SkillChip({ skillName, skillLevel, size = 'small', onDelete }: SkillChipProps) {
  return (
    <Chip
      label={`${skillName} · ${skillLevelUa[skillLevel]}`}
      size={size}
      color={levelColor[skillLevel]}
      variant="outlined"
      onDelete={onDelete}
      sx={{
        fontWeight: 600,
        borderWidth: 1.5,
        '& .MuiChip-label': { px: 1.5 },
      }}
    />
  )
}
