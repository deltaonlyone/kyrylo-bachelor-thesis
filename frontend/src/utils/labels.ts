import type { CourseStatus, EnrollmentStatus } from '../types/course'
import type { UserRole } from '../types/user'

export const courseStatusUa: Record<CourseStatus, string> = {
  DRAFT: 'Чернетка',
  PUBLISHED: 'Опубліковано',
  ARCHIVED: 'Архів',
}

export const userRoleUa: Record<UserRole, string> = {
  CURATOR: 'Куратор навчання',
  EDUCATOR: 'Викладач / ментор',
  LEARNER: 'Слухач (ІТ-працівник)',
}

export const enrollmentStatusUa: Record<EnrollmentStatus, string> = {
  ENROLLED: 'Навчається',
  COMPLETED: 'Завершено',
}
