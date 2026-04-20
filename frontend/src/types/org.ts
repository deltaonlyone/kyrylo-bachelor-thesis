/** Відповідає бекенду user-service (MeContextResponse / OrganizationContextEntry). */

import type { CuratorGlobalRole, UserRole } from './user'

export type OrgMemberKind = 'CURATOR' | 'EDUCATOR' | 'LEARNER'

export type CuratorOrgRole = 'STANDARD' | 'ORG_ADMIN'

export interface OrganizationContextEntry {
  organizationId: number
  organizationName: string
  memberKind: OrgMemberKind | null
  curatorOrgRole: CuratorOrgRole | null
}

export interface MeContext {
  userId: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  curatorGlobalRole: CuratorGlobalRole
  superAdmin: boolean
  organizations: OrganizationContextEntry[]
}

export interface OrganizationSummary {
  id: number
  name: string
  createdAt: string
}

export interface OrganizationMemberRow {
  userId: number
  email: string
  firstName: string
  lastName: string
  globalRole: UserRole
  memberKind: OrgMemberKind
  curatorOrgRole: CuratorOrgRole | null
}
