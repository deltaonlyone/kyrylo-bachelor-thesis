import { useState } from 'react'
import type { FormEvent } from 'react'
import LoginRounded from '@mui/icons-material/LoginRounded'
import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useThemeMode } from '../theme/ThemeContext'
import type { UserRole } from '../types/user'

const ROLE_PATH: Record<UserRole, string> = {
  CURATOR: '/curator/dashboard',
  EDUCATOR: '/educator/dashboard',
  LEARNER: '/learner/dashboard',
}

const MotionPaper = motion.create(Paper)
const MotionBox = motion.create(Box)

export function LoginPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { login, isAuthenticated, user } = useAuth()
  const { mode, toggleTheme } = useThemeMode()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Якщо вже залогінений — перенаправити */
  if (isAuthenticated && user) {
    navigate(ROLE_PATH[user.role], { replace: true })
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
      /* AuthContext вже оновив стан; тепер дістаємо роль */
      const saved = localStorage.getItem('thesis-auth-user')
      if (saved) {
        const u = JSON.parse(saved) as { role: UserRole }
        navigate(ROLE_PATH[u.role], { replace: true })
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? err.message
        setError(msg || 'Невірний email або пароль')
      } else {
        setError('Невідома помилка')
      }
    } finally {
      setLoading(false)
    }
  }

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
      {/* Theme toggle */}
      <Tooltip title={mode === 'dark' ? 'Світла тема' : 'Темна тема'}>
        <IconButton
          size="small"
          onClick={toggleTheme}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            color: 'text.secondary',
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            backdropFilter: 'blur(8px)',
            transition: 'all .2s',
            '&:hover': {
              color: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          {mode === 'dark' ? (
            <LightModeRounded fontSize="small" />
          ) : (
            <DarkModeRounded fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      {/* ── Ambient glow ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 55% at 50% -20%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.15)}, transparent 60%),
            radial-gradient(ellipse 50% 40% at 95% 95%, ${alpha(theme.palette.primary.dark, theme.palette.mode === 'dark' ? 0.15 : 0.08)}, transparent 50%),
            radial-gradient(ellipse 40% 35% at 5% 85%, ${alpha('#6366f1', theme.palette.mode === 'dark' ? 0.1 : 0.06)}, transparent 45%)
          `,
        }}
      />

      {/* ── Animated grid pattern ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: theme.palette.mode === 'dark' ? 0.025 : 0.06,
          backgroundImage: (t) => `
            linear-gradient(${alpha(t.palette.text.primary, 0.5)} 1px, transparent 1px),
            linear-gradient(90deg, ${alpha(t.palette.text.primary, 0.5)} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionPaper
          elevation={0}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: 1,
            borderColor: (t) => t.palette.divider,
            bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.75 : 0.85),
            backdropFilter: 'blur(24px) saturate(1.5)',
            boxShadow: theme.palette.mode === 'dark'
              ? `0 0 0 1px ${alpha('#fff', 0.03)}, 0 8px 40px ${alpha('#000', 0.5)}, 0 2px 8px ${alpha('#000', 0.3)}`
              : `0 0 0 1px ${alpha('#000', 0.03)}, 0 8px 40px ${alpha('#6366f1', 0.08)}, 0 2px 8px ${alpha('#000', 0.06)}`,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Logo */}
            <MotionBox
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                <AutoStoriesRounded sx={{ fontSize: 26, color: '#fff' }} />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SkillForge
              </Typography>
            </MotionBox>

            {/* Heading */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                Підвищення кваліфікації ІТ-спеціалістів
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                Єдина система для кураторів, викладачів і слухачів. Увійдіть,
                щоб отримати доступ до навчальних програм.
              </Typography>
            </MotionBox>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.35 }}
            >
              <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Корпоративний email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  fullWidth
                  required
                />
                <TextField
                  label="Пароль"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  fullWidth
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !email.trim() || !password}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <LoginRounded />
                    )
                  }
                  sx={{ mt: 0.5 }}
                >
                  {loading ? 'Вхід…' : 'Увійти в систему'}
                </Button>
              </Box>
            </motion.div>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1.6, opacity: 0.65 }}
            >
              Після входу відкриється кабінет відповідно до вашої ролі в організації.
            </Typography>
          </Box>
        </MotionPaper>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3, opacity: 0.5 }}
        >
          © {new Date().getFullYear()} SkillForge · React · Spring Boot Microservices
        </Typography>
      </Container>
    </Box>
  )
}
