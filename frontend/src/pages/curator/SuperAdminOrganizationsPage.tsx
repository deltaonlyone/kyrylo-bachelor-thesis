import AddRounded from '@mui/icons-material/AddRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { createOrganization, fetchOrganizations } from '../../api/api'
import { useAuth } from '../../auth/AuthContext'
import { PageShell } from '../../components/PageShell'
import type { OrganizationSummary } from '../../types/org'

export function SuperAdminOrganizationsPage() {
  const { meContext } = useAuth()
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    return fetchOrganizations()
      .then(setOrgs)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Помилка'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (!meContext) {
    return (
      <PageShell title="Організації">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </PageShell>
    )
  }

  if (!meContext.superAdmin) {
    return <Navigate to="/forbidden" replace />
  }

  async function onCreate() {
    if (!name.trim()) return
    setError(null)
    try {
      await createOrganization(name.trim())
      setName('')
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не вдалося створити')
    }
  }

  return (
    <PageShell
      title="Організації"
      subtitle="Створення та перегляд організацій (лише супер-адміністратор кураторів)."
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Нова організація
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Назва"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ minWidth: 260 }}
          />
          <Button startIcon={<AddRounded />} variant="contained" onClick={() => void onCreate()}>
            Створити
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell align="right">Дія</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3}>
                  Завантаження…
                </TableCell>
              </TableRow>
            ) : null}
            {!loading &&
              orgs.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.name}</TableCell>
                  <TableCell align="right">
                    <Button component={RouterLink} to={`/curator/organizations/${o.id}`} size="small">
                      Налаштування
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </PageShell>
  )
}
