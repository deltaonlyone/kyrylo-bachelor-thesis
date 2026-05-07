/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { buildTheme } from './appTheme'

type ThemeMode = 'light' | 'dark'

interface ThemeModeContextValue {
  mode: ThemeMode
  toggleTheme: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'dark',
  toggleTheme: () => {},
})

export function useThemeMode() {
  return useContext(ThemeModeContext)
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('thesis-theme-mode')
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  return 'dark'
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getStoredMode)

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('thesis-theme-mode', next) } catch { /* ignore */ }
      return next
    })
  }, [])

  const theme = useMemo(() => buildTheme(mode), [mode])

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
