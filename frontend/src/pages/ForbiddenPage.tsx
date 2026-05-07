import BlockRounded from '@mui/icons-material/BlockRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import { Box, Button, Container, Paper, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const MotionPaper = motion.create(Paper)
const MotionBox = motion.create(Box)

export function ForbiddenPage() {
  const navigate = useNavigate()
  const theme = useTheme()

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 3, sm: 5 },
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 80% 55% at 50% -20%, ${alpha(theme.palette.error.main, 0.15)}, transparent 60%)`,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionPaper
          elevation={0}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: 1,
            borderColor: (t) => t.palette.divider,
            bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.75 : 0.85),
            backdropFilter: 'blur(24px)',
            boxShadow: theme.palette.mode === 'dark'
              ? `0 8px 40px ${alpha('#000', 0.5)}`
              : `0 8px 40px ${alpha('#6366f1', 0.08)}`,
            textAlign: 'center',
          }}
        >
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.error.main, 0.12),
              color: 'error.light',
              mx: 'auto',
              mb: 3,
            }}
          >
            <BlockRounded sx={{ fontSize: 40 }} />
          </MotionBox>

          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
            403
          </Typography>
          <Typography variant="h5" gutterBottom>
            Доступ заборонено
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 380, mx: 'auto' }}>
            У вас немає прав доступу до цієї сторінки. Зверніться до адміністратора.
          </Typography>

          <Button
            variant="contained"
            startIcon={<HomeRounded />}
            onClick={() => navigate('/login', { replace: true })}
            size="large"
          >
            Повернутися на головну
          </Button>
        </MotionPaper>
      </Container>
    </Box>
  )
}
