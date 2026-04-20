import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { userRoleUa } from '../utils/labels'

export function AppShell() {
  const navigate = useNavigate()
  const { user, logout, meContext } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  /** Ініціали для аватарки */
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '?'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: { xs: 1, sm: 2 }, py: 0.5 }}>
            {/* Логотип */}
            <Box
              component={RouterLink}
              to="/login"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                color: 'inherit',
                mr: { xs: 0, sm: 1 },
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'scale(1.05)' },
                '&:active': { transform: 'scale(0.95)' },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}`,
                }}
              >
                <AutoStoriesRounded sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              {!isMobile && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      lineHeight: 1.2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    SkillForge
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', lineHeight: 1.1, fontSize: '0.7rem' }}
                  >
                    Підвищення кваліфікації
                  </Typography>
                </Box>
              )}
            </Box>

            {user?.role === 'CURATOR' ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                <Button
                  component={RouterLink}
                  to="/curator/dashboard"
                  color="inherit"
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  Кабінет
                </Button>
                {meContext?.superAdmin ? (
                  <Button
                    component={RouterLink}
                    to="/curator/organizations"
                    color="inherit"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  >
                    Організації
                  </Button>
                ) : null}
              </Box>
            ) : null}

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* User info */}
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
                <Chip
                  label={isMobile ? user.role.charAt(0) : userRoleUa[user.role]}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.light',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                />

                {!isMobile && (
                  <Tooltip title={`${user.firstName} ${user.lastName} · ${user.email}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: 'primary.light',
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 160 }}
                      >
                        {user.firstName} {user.lastName}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {isMobile ? (
                  <IconButton
                    size="small"
                    onClick={handleLogout}
                    sx={{ color: 'text.secondary' }}
                  >
                    <LogoutRounded fontSize="small" />
                  </IconButton>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LogoutRounded />}
                    onClick={handleLogout}
                    sx={{
                      borderColor: alpha('#fff', 0.1),
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: 'error.main',
                        color: 'error.light',
                        bgcolor: alpha(theme.palette.error.main, 0.06),
                      },
                    }}
                  >
                    Вийти
                  </Button>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Page content with fade-in */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Box component="main" sx={{ flex: 1, bgcolor: 'background.default' }}>
          <Outlet />
        </Box>
      </motion.div>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6 }}>
          © {new Date().getFullYear()} SkillForge · React · Spring Boot Microservices
        </Typography>
      </Box>
    </Box>
  )
}
