import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import PostAddRounded from '@mui/icons-material/PostAddRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { createCourse } from '../../api/api'
import type { CreateCourseRequest } from '../../types/course'
import { CourseEditorForm } from './CourseEditorForm'

type Props = {
  onCreated: () => void
}

export function CourseCreateSection({ onCreated }: Props) {
  const { meContext } = useAuth()
  const [expanded, setExpanded] = useState(true)
  const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('')

  const curatorOrAllOrgs = useMemo(() => {
    if (!meContext) return []
    if (meContext.superAdmin) {
      return meContext.organizations.map((o) => ({
        id: o.organizationId,
        name: o.organizationName,
      }))
    }
    return meContext.organizations
      .filter((o) => o.memberKind === 'CURATOR')
      .map((o) => ({
        id: o.organizationId,
        name: o.organizationName,
      }))
  }, [meContext])

  useEffect(() => {
    if (curatorOrAllOrgs.length === 1) {
      setSelectedOrgId(curatorOrAllOrgs[0].id)
    }
  }, [curatorOrAllOrgs])

  async function onSubmit(body: CreateCourseRequest) {
    await createCourse(body)
    onCreated()
  }

  const canCreate =
    curatorOrAllOrgs.length > 0 && selectedOrgId !== ''

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{ mb: 3 }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        aria-controls="create-course-panel"
        id="create-course-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PostAddRounded color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Нова навчальна програма (модулі та уроки)
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {!meContext ? (
          <Alert severity="info">Завантаження контексту організацій…</Alert>
        ) : null}
        {meContext && curatorOrAllOrgs.length === 0 ? (
          <Alert severity="warning">
            Немає організації для створення курсу. Супер-адмін має створити організацію у вкладці
            «Організації»; куратор має бути доданий до організації.
          </Alert>
        ) : null}
        {curatorOrAllOrgs.length > 1 ? (
          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <InputLabel id="org-pick">Організація</InputLabel>
            <Select
              labelId="org-pick"
              label="Організація"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(Number(e.target.value))}
            >
              {curatorOrAllOrgs.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
        {canCreate ? (
          <CourseEditorForm
            organizationId={typeof selectedOrgId === 'number' ? selectedOrgId : undefined}
            submitLabel="Створити програму"
            onSubmitCourse={onSubmit}
          />
        ) : null}
      </AccordionDetails>
    </Accordion>
  )
}
