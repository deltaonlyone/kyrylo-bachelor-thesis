import { alpha, createTheme } from '@mui/material/styles'

/* ─── Палітра ──────────────────────────────────────────── */

const PRIMARY   = '#a78bfa'   // violet-400
const P_LIGHT   = '#c4b5fd'   // violet-300
const P_DARK    = '#7c3aed'   // violet-600

/* ─── Dark palette ─── */
const DARK_BG_BASE   = '#09090b'   // zinc-950
const DARK_BG_PAPER  = '#111113'
const DARK_BG_CARD   = '#18181b'   // zinc-900
const DARK_TEXT_PRI  = '#fafafa'
const DARK_TEXT_SEC  = 'rgba(250,250,250,0.62)'
const DARK_BORDER   = 'rgba(255,255,255,0.07)'

/* ─── Light palette ─── */
const LIGHT_BG_BASE   = '#f5f3ff'   // violet-50
const LIGHT_BG_PAPER  = '#ffffff'
const LIGHT_BG_CARD   = '#faf5ff'   // purple-50
const LIGHT_TEXT_PRI  = '#1c1917'   // stone-900
const LIGHT_TEXT_SEC  = 'rgba(28,25,23,0.62)'
const LIGHT_BORDER   = 'rgba(0,0,0,0.08)'

type ThemeMode = 'light' | 'dark'

export function buildTheme(mode: ThemeMode) {
  const isDark = mode === 'dark'

  const BG_BASE  = isDark ? DARK_BG_BASE  : LIGHT_BG_BASE
  const BG_PAPER = isDark ? DARK_BG_PAPER : LIGHT_BG_PAPER
  const BG_CARD  = isDark ? DARK_BG_CARD  : LIGHT_BG_CARD
  const TEXT_PRI = isDark ? DARK_TEXT_PRI  : LIGHT_TEXT_PRI
  const TEXT_SEC = isDark ? DARK_TEXT_SEC  : LIGHT_TEXT_SEC
  const BORDER   = isDark ? DARK_BORDER   : LIGHT_BORDER

  /* Колір для outlined елементів */
  const OUTLINE_ALPHA = isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12)
  const OUTLINE_HOVER = isDark ? alpha('#fff', 0.1)  : alpha('#000', 0.06)
  const SCROLL_THUMB  = isDark ? alpha(PRIMARY, 0.25) : alpha(PRIMARY, 0.35)
  const SCROLL_COLOR  = isDark ? alpha(PRIMARY, 0.3)  : alpha(PRIMARY, 0.4)

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary:    { main: PRIMARY, light: P_LIGHT, dark: P_DARK, contrastText: isDark ? '#0c0e14' : '#ffffff' },
      secondary:  { main: '#94a3b8' },
      background: { default: BG_BASE, paper: BG_PAPER },
      divider: BORDER,
      text:    { primary: TEXT_PRI, secondary: TEXT_SEC },
      success: { main: '#4ade80', contrastText: '#052e16' },
      warning: { main: '#fbbf24', contrastText: '#1c1410' },
      error:   { main: '#f87171' },
      info:    { main: '#60a5fa' },
    },

    shape: { borderRadius: 14 },

    typography: {
      fontFamily: '"Inter", "DM Sans", "Roboto", system-ui, sans-serif',
      h3: { fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, fontSize: '2rem' },
      h4: { fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2,  fontSize: '1.55rem' },
      h5: { fontWeight: 600, letterSpacing: '-0.02em', fontSize: '1.15rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      subtitle1: { lineHeight: 1.55, fontWeight: 500 },
      body1:  { lineHeight: 1.6 },
      body2:  { lineHeight: 1.6, fontSize: '0.875rem' },
      button: { fontWeight: 600, letterSpacing: '0.01em', fontSize: '0.875rem' },
      caption: { lineHeight: 1.5, fontSize: '0.8rem' },
    },

    components: {
      /* ── Глобальні стилі ── */
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': { boxSizing: 'border-box' },
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: `${SCROLL_COLOR} transparent`,
          },
          '::-webkit-scrollbar':       { width: 6 },
          '::-webkit-scrollbar-track': { background: 'transparent' },
          '::-webkit-scrollbar-thumb': {
            background: SCROLL_THUMB,
            borderRadius: 10,
          },
        },
      },

      /* ── Paper ── */
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 14,
          },
          outlined: {
            borderColor: BORDER,
            backgroundColor: BG_CARD,
          },
        },
      },

      /* ── Button ── */
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          },
          contained: {
            backgroundImage: `linear-gradient(135deg, ${P_DARK} 0%, ${PRIMARY} 100%)`,
            color: '#fff',
            '&:hover': {
              backgroundImage: `linear-gradient(135deg, ${alpha(P_DARK, 0.9)} 0%, ${alpha(PRIMARY, 0.9)} 100%)`,
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 16px ${alpha(PRIMARY, 0.35)}`,
            },
          },
          outlined: {
            borderColor: OUTLINE_ALPHA,
            '&:hover': {
              borderColor: PRIMARY,
              backgroundColor: alpha(PRIMARY, 0.06),
            },
          },
          sizeLarge: { padding: '12px 28px', fontSize: '0.95rem' },
          sizeSmall: { padding: '6px 14px', borderRadius: 8 },
        },
      },

      /* ── Input ── */
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: PRIMARY,
              boxShadow: `0 0 0 3px ${alpha(PRIMARY, 0.12)}`,
            },
          },
          notchedOutline: {
            borderColor: OUTLINE_HOVER,
            transition: 'border-color .2s, box-shadow .2s',
          },
        },
      },

      /* ── AppBar ── */
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: alpha(BG_BASE, isDark ? 0.7 : 0.85),
            backdropFilter: 'blur(16px) saturate(1.6)',
            borderBottom: `1px solid ${BORDER}`,
            color: TEXT_PRI,
          },
        },
      },

      /* ── Table ── */
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: BORDER },
          head: {
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            backgroundColor: isDark ? alpha('#fff', 0.025) : alpha('#000', 0.025),
            color: TEXT_SEC,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color .15s',
            '&.MuiTableRow-hover:hover': {
              backgroundColor: alpha(PRIMARY, 0.04),
            },
          },
        },
      },

      /* ── Accordion ── */
      MuiAccordion: {
        defaultProps: { elevation: 0, disableGutters: true },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: BG_CARD,
            '&:before': { display: 'none' },
            border: `1px solid ${BORDER}`,
            borderRadius: '14px !important',
            overflow: 'hidden',
            marginBottom: 10,
            transition: 'border-color .2s',
            '&:hover': { borderColor: alpha(PRIMARY, 0.25) },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 52,
            '&.Mui-expanded': { minHeight: 52 },
          },
          content: {
            margin: '12px 0',
            '&.Mui-expanded': { margin: '12px 0' },
          },
        },
      },

      /* ── Card ── */
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: BG_CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            transition: 'border-color .2s, box-shadow .25s, transform .2s',
            '&:hover': {
              borderColor: alpha(PRIMARY, 0.3),
              boxShadow: `0 0 0 1px ${alpha(PRIMARY, 0.15)}, 0 8px 24px ${alpha(isDark ? '#000' : '#6366f1', isDark ? 0.3 : 0.08)}`,
            },
          },
        },
      },

      /* ── Chip ── */
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
          sizeSmall: { height: 24, fontSize: '0.75rem' },
        },
      },

      /* ── Link ── */
      MuiLink: {
        defaultProps: { underline: 'hover' },
      },

      /* ── Alert ── */
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: '1px solid',
          },
          colorError: { borderColor: alpha('#f87171', 0.25), backgroundColor: alpha('#f87171', 0.06) },
          colorSuccess: { borderColor: alpha('#4ade80', 0.25), backgroundColor: alpha('#4ade80', 0.06) },
          colorWarning: { borderColor: alpha('#fbbf24', 0.25), backgroundColor: alpha('#fbbf24', 0.06) },
          colorInfo: { borderColor: alpha('#60a5fa', 0.25), backgroundColor: alpha('#60a5fa', 0.06) },
        },
      },

      /* ── LinearProgress ── */
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 10, height: 6 },
          bar:  { borderRadius: 10 },
        },
      },

      /* ── Breadcrumbs ── */
      MuiBreadcrumbs: {
        styleOverrides: {
          root: { fontSize: '0.875rem' },
        },
      },

      /* ── Dialog ── */
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: BG_PAPER,
          },
        },
      },
    },
  })
}

/** @deprecated Використовуйте buildTheme('dark') або buildTheme('light') */
export const appTheme = buildTheme('dark')
