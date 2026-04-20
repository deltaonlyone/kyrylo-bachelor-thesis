import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import EditRounded from '@mui/icons-material/EditRounded'
import PersonAddRounded from '@mui/icons-material/PersonAddRounded'
import PostAddRounded from '@mui/icons-material/PostAddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom'
import {
  addEducatorToOrganization,
  addLearnerToOrganization,
  createCourse,
  fetchCourses,
  fetchOrganizationMembers,
  fetchUsersByRole,
  inviteCuratorToOrganization,
  renameOrganization,
  updateCuratorOrgRole,
} from '../../api/api'
import { CourseEditorForm } from './CourseEditorForm'
import { useAuth } from '../../auth/AuthContext'
import { PageShell } from '../../components/PageShell'
import type { CuratorOrgRole, OrganizationMemberRow } from '../../types/org'
import type { CourseSummary, CreateCourseRequest } from '../../types/course'
import type { User, UserRole } from '../../types/user'

export function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { meContext } = useAuth()
  const id = Number(orgId)
  
  const [members, setMembers] = useState<OrganizationMemberRow[]>([])
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  const [orgNameLocal, setOrgNameLocal] = useState<string>('')

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const [inviteCuratorOpen, setInviteCuratorOpen] = useState(false)
  const [inviteCuratorPayload, setInviteCuratorPayload] = useState({ email: '', password: '', firstName: '', lastName: '' })

  const [addMemberOpen, setAddMemberOpen] = useState<{ role: UserRole } | null>(null)
  const [addMemberCandidates, setAddMemberCandidates] = useState<User[]>([])
  const [addMemberSelected, setAddMemberSelected] = useState<number | ''>('')

  const [createCourseOpen, setCreateCourseOpen] = useState(false)

  useEffect(() => {
    if (meContext) {
      const found = meContext.organizations.find((o) => o.organizationId === id)
      if (found) setOrgNameLocal(found.organizationName)
    }
  }, [meContext, id])

  const load = useCallback(() => {
    if (!Number.isFinite(id) || id <= 0) return
    setError(null)
    Promise.all([fetchOrganizationMembers(id), fetchCourses()])
      .then(([m, allCourses]) => {
        setMembers(m)
        setCourses(allCourses.filter((c) => c.organizationId === id))
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Помилка'))
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (!meContext) {
    return (
      <PageShell title="Організація">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </PageShell>
    )
  }

  if (!meContext.superAdmin) {
    return <Navigate to="/forbidden" replace />
  }

  async function handleRename() {
    try {
      await renameOrganization(id, renameValue)
      setOrgNameLocal(renameValue)
      setRenameOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка перейменування')
    }
  }

  async function handleInviteCurator() {
    try {
      await inviteCuratorToOrganization(id, inviteCuratorPayload)
      setInviteCuratorOpen(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка запрошення куратора')
    }
  }

  async function openAddMember(role: UserRole) {
    setAddMemberOpen({ role })
    setAddMemberCandidates([])
    setAddMemberSelected('')
    try {
      const users = await fetchUsersByRole(role)
      setAddMemberCandidates(users)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження користувачів')
    }
  }

  async function handleAddMember() {
    if (!addMemberSelected || !addMemberOpen) return
    try {
      if (addMemberOpen.role === 'EDUCATOR') {
        await addEducatorToOrganization(id, Number(addMemberSelected))
      } else if (addMemberOpen.role === 'LEARNER') {
        await addLearnerToOrganization(id, Number(addMemberSelected))
      }
      setAddMemberOpen(null)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка додавання учасника')
    }
  }

  async function handleRoleChange(userId: number, newRole: CuratorOrgRole) {
    try {
      await updateCuratorOrgRole(id, userId, newRole)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка оновлення ролі')
    }
  }

  async function handleCreateCourse(body: CreateCourseRequest) {
    try {
      await createCourse(body)
      setCreateCourseOpen(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка створення курсу')
    }
  }

  return (
    <PageShell
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {orgNameLocal ? `Організація: ${orgNameLocal}` : `Організація #${id}`}
          <IconButton size="small" onClick={() => { setRenameValue(orgNameLocal); setRenameOpen(true) }}>
            <EditRounded fontSize="small" />
          </IconButton>
        </Box>
      }
      subtitle="Управління учасниками та перегляд курсів."
    >
      <Typography variant="body2" sx={{ mb: 2 }}>
        <RouterLink to="/curator/organizations">← До списку організацій</RouterLink>
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, mt: 2 }}>
        <Typography variant="h6">Учасники</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<PersonAddRounded />} onClick={() => setInviteCuratorOpen(true)}>
            Запросити куратора
          </Button>
          <Button size="small" variant="outlined" startIcon={<PersonAddRounded />} onClick={() => void openAddMember('EDUCATOR')}>
            Додати викладача
          </Button>
          <Button size="small" variant="outlined" startIcon={<PersonAddRounded />} onClick={() => void openAddMember('LEARNER')}>
            Додати студента
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Користувач</TableCell>
              <TableCell>Глобальна роль</TableCell>
              <TableCell>У організації</TableCell>
              <TableCell>Підроль куратора</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((m) => (
              <TableRow key={`${m.userId}-${m.memberKind}`}>
                <TableCell>
                  {m.firstName} {m.lastName}
                  <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: 12 }}>
                    {m.email} · #{m.userId}
                  </Box>
                </TableCell>
                <TableCell>{m.globalRole}</TableCell>
                <TableCell>{m.memberKind}</TableCell>
                <TableCell>
                  {m.memberKind === 'CURATOR' ? (
                    <Select
                      size="small"
                      value={m.curatorOrgRole ?? 'STANDARD'}
                      onChange={(e) => void handleRoleChange(m.userId, e.target.value as CuratorOrgRole)}
                      sx={{ fontSize: 14, minWidth: 120 }}
                    >
                      <MenuItem value="STANDARD">STANDARD</MenuItem>
                      <MenuItem value="ORG_ADMIN">ORG_ADMIN</MenuItem>
                    </Select>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
        <Typography variant="h6">Курси організації</Typography>
        <Button size="small" variant="outlined" startIcon={<PostAddRounded />} onClick={() => setCreateCourseOpen(true)}>
          Створити програму
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>
                  <RouterLink to={`/curator/courses/${c.id}`}>{c.title}</RouterLink>
                </TableCell>
                <TableCell>{c.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Перейменування */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Змінити назву організації</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Назва"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Скасувати</Button>
          <Button onClick={() => void handleRename()} variant="contained">Зберегти</Button>
        </DialogActions>
      </Dialog>

      {/* Запрошення куратора */}
      <Dialog open={inviteCuratorOpen} onClose={() => setInviteCuratorOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Запросити куратора</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Email" type="email" fullWidth size="small" value={inviteCuratorPayload.email} onChange={(e) => setInviteCuratorPayload(p => ({ ...p, email: e.target.value }))} />
            <TextField label="Пароль" type="password" fullWidth size="small" value={inviteCuratorPayload.password} onChange={(e) => setInviteCuratorPayload(p => ({ ...p, password: e.target.value }))} />
            <TextField label="Ім'я" fullWidth size="small" value={inviteCuratorPayload.firstName} onChange={(e) => setInviteCuratorPayload(p => ({ ...p, firstName: e.target.value }))} />
            <TextField label="Прізвище" fullWidth size="small" value={inviteCuratorPayload.lastName} onChange={(e) => setInviteCuratorPayload(p => ({ ...p, lastName: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteCuratorOpen(false)}>Скасувати</Button>
          <Button onClick={() => void handleInviteCurator()} variant="contained">Запросити</Button>
        </DialogActions>
      </Dialog>

      {/* Додавання учасника */}
      <Dialog open={addMemberOpen !== null} onClose={() => setAddMemberOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Додати {addMemberOpen?.role === 'EDUCATOR' ? 'викладача' : 'студента'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Оберіть користувача</InputLabel>
            <Select
              value={addMemberSelected}
              label="Оберіть користувача"
              onChange={(e) => setAddMemberSelected(e.target.value as number)}
            >
              {addMemberCandidates.map(u => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </MenuItem>
              ))}
              {addMemberCandidates.length === 0 && (
                <MenuItem disabled value="">Немає доступних користувачів</MenuItem>
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberOpen(null)}>Скасувати</Button>
          <Button onClick={() => void handleAddMember()} variant="contained" disabled={!addMemberSelected}>Додати</Button>
        </DialogActions>
      </Dialog>

      {/* Створення курсу */}
      <Dialog open={createCourseOpen} onClose={() => setCreateCourseOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Створити нову програму
          <IconButton onClick={() => setCreateCourseOpen(false)} size="small">
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <CourseEditorForm
            organizationId={id}
            submitLabel="Створити програму"
            onSubmitCourse={handleCreateCourse}
          />
        </DialogContent>
      </Dialog>

    </PageShell>
  )
}
