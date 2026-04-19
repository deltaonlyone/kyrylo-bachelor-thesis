import { Chip } from '@mui/material'
import type { CourseStatus } from '../types/course'
import { courseStatusUa } from '../utils/labels'

const statusToColor = {
  DRAFT: 'default' as const,
  PUBLISHED: 'success' as const,
  ARCHIVED: 'warning' as const,
}

export function CourseStatusChip({ status }: { status: CourseStatus }) {
  return (
    <Chip
      label={courseStatusUa[status]}
      size="small"
      color={statusToColor[status]}
      variant={status === 'DRAFT' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 600 }}
    />
  )
}
