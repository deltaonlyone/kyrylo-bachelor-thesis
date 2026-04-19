import { Box, Container, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  title?: string
  subtitle?: ReactNode
  children: ReactNode
  /** Якщо true — лише контейнер без блоку заголовка (наприклад, детальна сторінка). */
  omitHeader?: boolean
}

const MotionBox = motion.create(Box)

/** Обгортка сторінки: контейнер, анімований заголовок і підзаголовок. */
export function PageShell({ title, subtitle, children, omitHeader }: Props) {
  return (
    <Container
      maxWidth="lg"
      component="main"
      sx={{ py: { xs: 2.5, sm: 3.5 }, px: { xs: 2, sm: 3 } }}
    >
      {!omitHeader && title ? (
        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          sx={{ mb: 4 }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: (t) =>
                `linear-gradient(135deg, ${t.palette.text.primary} 0%, ${alpha(t.palette.text.primary, 0.7)} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: '42rem', lineHeight: 1.65 }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </MotionBox>
      ) : null}

      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {children}
      </MotionBox>
    </Container>
  )
}
